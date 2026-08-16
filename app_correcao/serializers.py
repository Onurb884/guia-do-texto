from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Redacao, Tema, Correcao, NotaCompetencia, Anotacao, TextoMotivador
from .models import RespostaRapida, ConfiguracaoSistema, Carteira, Transacao, Pacote, Cupom, CarteiraAluno
from .models import BannerVitrine, HistoricoCompra
from .models import MaterialApoio, PagamentoCorretor

User = get_user_model()

class MaterialApoioSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialApoio
        fields = '__all__'

class ConfiguracaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfiguracaoSistema
        fields = '__all__'

class TransacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transacao
        fields = '__all__'

# --- NOVO: SERIALIZADOR DE PAGAMENTOS COM RECIBO ---
class PagamentoCorretorSerializer(serializers.ModelSerializer):
    arquivo_recibo_url = serializers.SerializerMethodField()

    class Meta:
        model = PagamentoCorretor
        fields = [
            'id', 'valor', 'qtd_normal', 'qtd_vip', 'status', 
            'arquivo_recibo', 'arquivo_recibo_url', 'motivo_recusa', 
            'data_solicitacao', 'data_pagamento'
        ]

    def get_arquivo_recibo_url(self, obj):
        if obj.arquivo_recibo:
            return obj.arquivo_recibo.url
        return None

# --- ATUALIZADO: CARTEIRA COM SOLICITAÇÃO ATIVA ---
class CarteiraSerializer(serializers.ModelSerializer):
    transacoes = serializers.SerializerMethodField()
    historico_pagamentos = serializers.SerializerMethodField()
    solicitacao_ativa = serializers.SerializerMethodField()
    
    class Meta:
        model = Carteira
        fields = ['saldo_atual', 'saque_solicitado', 'qtd_normal_pendente', 'qtd_vip_pendente', 'transacoes', 'historico_pagamentos', 'solicitacao_ativa']
    
    def get_solicitacao_ativa(self, obj):
        pendente = PagamentoCorretor.objects.filter(
            corretor=obj.corretor,
            status__in=['AGUARDANDO_RECIBO', 'EM_ANALISE', 'RECUSADO']
        ).order_by('-data_solicitacao').first()
        if pendente:
            return PagamentoCorretorSerializer(pendente).data
        return None

    def get_transacoes(self, obj):
        from .models import Correcao, ConfiguracaoSistema, PagamentoCorretor
        
        ultimo_pagamento = PagamentoCorretor.objects.filter(corretor=obj.corretor, status='PAGO').order_by('-data_pagamento').first()
        data_ultimo_pagamento = ultimo_pagamento.data_pagamento if ultimo_pagamento else None

        correcoes = Correcao.objects.filter(
            corretor=obj.corretor,
            redacao__status='CORRIGIDA'
        ).order_by('-data_correcao')[:50]
        
        config = ConfiguracaoSistema.objects.first()
        val_simples = config.valor_pagamento_simples if config else 3.00
        val_enem = config.valor_pagamento_enem if config else 4.00
        val_vip = config.valor_bonus_vip if config else 1.50
        
        historico = []
        for c in correcoes:
            tipo = c.redacao.tema.tipo if c.redacao.tema else 'ENEM'
            base = val_simples if tipo == 'SIMPLES' else val_enem
            bonus = val_vip if (c.redacao.is_urgente or getattr(c.redacao, 'vip_pago', False)) else 0
            
            descricao = f"Correção {tipo} (#{c.redacao.id})"
            if bonus > 0:
                descricao += " + Bônus Especial"
            
            foi_pago = False
            if data_ultimo_pagamento and c.data_correcao <= data_ultimo_pagamento:
                foi_pago = True
                
            historico.append({
                'id': c.id,
                'data': c.data_correcao,
                'descricao': descricao,
                'tipo': 'CREDITO',
                'valor': base + bonus,
                'foi_pago': foi_pago
            })
        return historico

    def get_historico_pagamentos(self, obj):
        pgtos = PagamentoCorretor.objects.filter(corretor=obj.corretor).order_by('-data_solicitacao')
        return PagamentoCorretorSerializer(pgtos, many=True).data
    
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'is_corretor', 'is_staff', 'is_superuser', 'is_active',
            'telefone', 'cpf', 'chave_pix', 'tipo_chave_pix', 'banco', 'agencia_conta', 
            'minibio', 'curriculo', 'formacoes', 'experiencias', 'date_joined', 'password'
        ]
    def create(self, validated_data):
        password = validated_data.pop('password', 'Mudar@123') 
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
    def update(self, instance, validated_data):
        if 'password' in validated_data:
            password = validated_data.pop('password')
            instance.set_password(password)
        return super().update(instance, validated_data)

class TextoMotivadorSerializer(serializers.ModelSerializer):
    arquivo = serializers.FileField(required=False, allow_null=True)
    conteudo = serializers.CharField(required=False, allow_blank=True)
    class Meta:
        model = TextoMotivador
        fields = ['id', 'tipo', 'conteudo', 'arquivo', 'ordem']

class TemaSerializer(serializers.ModelSerializer):
    motivadores = TextoMotivadorSerializer(many=True, required=False)
    class Meta:
        model = Tema
        fields = ['id', 'titulo', 'descricao', 'tipo', 'ativo', 'motivadores', 'criado_em']

    def create(self, validated_data):
        motivadores_data = validated_data.pop('motivadores', [])
        tema = Tema.objects.create(**validated_data)
        for index, mot_data in enumerate(motivadores_data):
            TextoMotivador.objects.create(tema=tema, ordem=index, **mot_data)
        return tema

    def update(self, instance, validated_data):
        motivadores_data = validated_data.pop('motivadores', [])
        instance.titulo = validated_data.get('titulo', instance.titulo)
        instance.descricao = validated_data.get('descricao', instance.descricao)
        instance.tipo = validated_data.get('tipo', instance.tipo)
        instance.ativo = validated_data.get('ativo', instance.ativo)
        instance.save()
        if motivadores_data is not None:
            instance.motivadores.all().delete()
            for index, mot_data in enumerate(motivadores_data):
                TextoMotivador.objects.create(tema=instance, ordem=index, **mot_data)
        return instance

class NotaCompetenciaSerializer(serializers.ModelSerializer):
    comp = serializers.IntegerField(source='numero_competencia')
    class Meta:
        model = NotaCompetencia
        fields = ['comp', 'nota', 'comentario']

class AnotacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Anotacao
        fields = ['id', 'competencia', 'x', 'y', 'width', 'height', 'tipo_erro', 'texto']

class CorrecaoSerializer(serializers.ModelSerializer):
    competencias = NotaCompetenciaSerializer(source='notas_competencias', many=True, read_only=True)
    anotacoes = AnotacaoSerializer(many=True, read_only=True)
    comentario_geral = serializers.SerializerMethodField()
    class Meta:
        model = Correcao
        fields = ['nota_final', 'competencias', 'comentario_geral', 'anotacoes']
    def get_comentario_geral(self, obj):
        return obj.comentario_geral

class RedacaoSerializer(serializers.ModelSerializer):
    tema_titulo = serializers.CharField(source='tema.titulo', read_only=True)
    tema_tipo = serializers.CharField(source='tema.tipo', read_only=True)
    tema_descricao = serializers.CharField(source='tema.descricao', read_only=True)
    aluno_nome = serializers.SerializerMethodField()
    correcao = serializers.SerializerMethodField()
    nota_final = serializers.SerializerMethodField()
    class Meta:
        model = Redacao
        fields = '__all__'
        read_only_fields = ['aluno', 'status', 'corretor_atual', 'data_envio', 'nota_final', 'correcao']
    def get_aluno_nome(self, obj):
        nome_completo = f"{obj.aluno.first_name} {obj.aluno.last_name}".strip()
        return nome_completo if nome_completo else obj.aluno.username
    def get_correcao(self, obj):
        try:
            if hasattr(obj, 'correcao'): return CorrecaoSerializer(obj.correcao).data
        except: return None
    def get_nota_final(self, obj):
        try:
            if hasattr(obj, 'correcao'): return obj.correcao.nota_final
        except: return None

class RedacaoFilaSerializer(serializers.ModelSerializer):
    tema_titulo = serializers.CharField(source='tema.titulo', read_only=True)
    tema_tipo = serializers.CharField(source='tema.tipo', read_only=True)
    aluno_nome = serializers.SerializerMethodField()
    class Meta:
        model = Redacao
        fields = ['id', 'tema_titulo', 'tema_tipo', 'aluno_nome', 'texto', 'data_envio', 'status', 'is_urgente', 'vip_pago']
    def get_aluno_nome(self, obj):
        nome_completo = f"{obj.aluno.first_name} {obj.aluno.last_name}".strip()
        return nome_completo if nome_completo else obj.aluno.username

class RespostaRapidaSerializer(serializers.ModelSerializer):
    class Meta:
        model = RespostaRapida
        fields = ['id', 'modelo', 'competencia', 'contexto', 'tipo_erro', 'titulo', 'texto', 'criado_em']
        read_only_fields = ['id', 'criado_em']

class PacoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pacote
        fields = '__all__'

class CupomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cupom
        fields = '__all__'

class CarteiraAlunoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CarteiraAluno
        fields = ['saldo_simples', 'saldo_vip']

class BannerVitrineSerializer(serializers.ModelSerializer):
    pacote_info = PacoteSerializer(source='pacote_vinculado', read_only=True)

    class Meta:
        model = BannerVitrine
        fields = '__all__'