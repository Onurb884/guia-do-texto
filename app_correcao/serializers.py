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

# --- NOVO: SERIALIZADOR DE PAGAMENTOS COM REDAÇÕES INTELIGENTES ---
class PagamentoCorretorSerializer(serializers.ModelSerializer):
    arquivo_recibo_url = serializers.SerializerMethodField()
    redacoes = serializers.SerializerMethodField() # <-- A MÁGICA PARA O FINANCEIRO AQUI!

    class Meta:
        model = PagamentoCorretor
        fields = [
            'id', 'valor', 'qtd_normal', 'qtd_vip', 'status', 
            'arquivo_recibo', 'arquivo_recibo_url', 'motivo_recusa', 
            'data_solicitacao', 'data_pagamento', 'redacoes'
        ]

    def get_arquivo_recibo_url(self, obj):
        if obj.arquivo_recibo:
            return obj.arquivo_recibo.url
        return None
        
    def get_redacoes(self, obj):
        from .models import Correcao, ConfiguracaoSistema, PagamentoCorretor
        pagamentos = list(PagamentoCorretor.objects.filter(corretor=obj.corretor).order_by('data_solicitacao'))
        
        # Puxamos TODAS as correções do professor para garantir que as antigas aparecem no recibo
        correcoes = Correcao.objects.filter(
            corretor=obj.corretor,
            data_correcao__isnull=False
        ).select_related('redacao', 'redacao__tema').order_by('data_correcao')
        
        config = ConfiguracaoSistema.objects.first()
        val_simples = config.valor_pagamento_simples if config else 3.00
        val_enem = config.valor_pagamento_enem if config else 4.00
        val_vip = config.valor_bonus_vip if config else 1.50
        
        redacoes_vistas = set()
        correcoes_unicas = []
        
        for c in correcoes:
            if c.redacao.status == 'REFAZER': continue # Ignora se estiver a ser refeita
            if c.redacao.id not in redacoes_vistas:
                redacoes_vistas.add(c.redacao.id)
                tipo = c.redacao.tema.tipo if c.redacao.tema else 'ENEM'
                base = val_simples if tipo == 'SIMPLES' else val_enem
                is_vip = c.redacao.is_urgente or getattr(c.redacao, 'vip_pago', False)
                bonus = val_vip if is_vip else 0
                
                descricao = f"Correção {tipo} (#{c.redacao.id})"
                if bonus > 0: descricao += " + Bônus Especial"
                
                correcoes_unicas.append({
                    'id': c.id, 'data': c.data_correcao, 'descricao': descricao, 
                    'valor': base + bonus, 'is_vip': is_vip, 'pagamento_id': None
                })
        
        minhas_redacoes = []
        for p in pagamentos:
            normais = p.qtd_normal or 0
            vips = p.qtd_vip or 0
            for c in correcoes_unicas:
                if c['pagamento_id'] is not None: continue
                if c['is_vip'] and vips > 0:
                    c['pagamento_id'] = p.id
                    vips -= 1
                    if p.id == obj.id: minhas_redacoes.append(c)
                elif not c['is_vip'] and normais > 0:
                    c['pagamento_id'] = p.id
                    normais -= 1
                    if p.id == obj.id: minhas_redacoes.append(c)
                        
        minhas_redacoes.sort(key=lambda x: x['data'], reverse=True)
        return minhas_redacoes

# --- ATUALIZADO: CARTEIRA INTELIGENTE ---
class CarteiraSerializer(serializers.ModelSerializer):
    transacoes = serializers.SerializerMethodField()
    historico_pagamentos = serializers.SerializerMethodField()
    solicitacao_ativa = serializers.SerializerMethodField()
    
    # Sobrescrevemos as propriedades do banco de dados para calcularmos na hora!
    saldo_atual = serializers.SerializerMethodField()
    qtd_normal_pendente = serializers.SerializerMethodField()
    qtd_vip_pendente = serializers.SerializerMethodField()
    
    class Meta:
        model = Carteira
        fields = ['saldo_atual', 'saque_solicitado', 'qtd_normal_pendente', 'qtd_vip_pendente', 'transacoes', 'historico_pagamentos', 'solicitacao_ativa']
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._calculated_data = None
        
    def _process_data(self, obj):
        if self._calculated_data:
            return self._calculated_data
        
        from .models import Correcao, ConfiguracaoSistema, PagamentoCorretor
        pagamentos = list(PagamentoCorretor.objects.filter(corretor=obj.corretor).order_by('data_solicitacao'))
        
        # Ignora tudo que for REFAZER e AUDITORIA
        correcoes = Correcao.objects.filter(
            corretor=obj.corretor, 
            redacao__status__in=['CORRIGIDA', 'EM_QA'] 
        ).select_related('redacao', 'redacao__tema').order_by('data_correcao')
        
        config = ConfiguracaoSistema.objects.first()
        val_simples = config.valor_pagamento_simples if config else 3.00
        val_enem = config.valor_pagamento_enem if config else 4.00
        val_vip = config.valor_bonus_vip if config else 1.50
        
        redacoes_vistas = set()
        correcoes_unicas = []
        
        for c in correcoes:
            if c.redacao.id not in redacoes_vistas:
                redacoes_vistas.add(c.redacao.id)
                tipo = c.redacao.tema.tipo if c.redacao.tema else 'ENEM'
                base = val_simples if tipo == 'SIMPLES' else val_enem
                is_vip = c.redacao.is_urgente or getattr(c.redacao, 'vip_pago', False)
                bonus = val_vip if is_vip else 0
                descricao = f"Correção {tipo} (#{c.redacao.id})"
                if bonus > 0: descricao += " + Bônus Especial"
                
                correcoes_unicas.append({
                    'id': c.id, 'data': c.data_correcao, 'descricao': descricao, 'tipo': 'CREDITO',
                    'valor': base + bonus, 'is_vip': is_vip, 'pagamento_id': None, 'foi_pago': False
                })
                
        for p in pagamentos:
            normais = p.qtd_normal or 0
            vips = p.qtd_vip or 0
            for c in correcoes_unicas:
                if c['pagamento_id'] is not None: continue
                if c['is_vip'] and vips > 0:
                    c['pagamento_id'] = p.id
                    c['foi_pago'] = (p.status == 'PAGO')
                    vips -= 1
                elif not c['is_vip'] and normais > 0:
                    c['pagamento_id'] = p.id
                    c['foi_pago'] = (p.status == 'PAGO')
                    normais -= 1
        
        saldo = 0.0
        normais_pendentes = 0
        vips_pendentes = 0
        for c in correcoes_unicas:
            if c['pagamento_id'] is None:
                saldo += float(c['valor'])
                if c['is_vip']: vips_pendentes += 1
                else: normais_pendentes += 1
        
        correcoes_unicas.reverse() # Mais recentes no topo
        
        self._calculated_data = {
            'transacoes': correcoes_unicas,
            'saldo_atual': saldo,
            'qtd_normal_pendente': normais_pendentes,
            'qtd_vip_pendente': vips_pendentes
        }
        return self._calculated_data

    def get_saldo_atual(self, obj): return self._process_data(obj)['saldo_atual']
    def get_qtd_normal_pendente(self, obj): return self._process_data(obj)['qtd_normal_pendente']
    def get_qtd_vip_pendente(self, obj): return self._process_data(obj)['qtd_vip_pendente']
    def get_transacoes(self, obj): return self._process_data(obj)['transacoes']

    def get_solicitacao_ativa(self, obj):
        from .models import PagamentoCorretor
        pendente = PagamentoCorretor.objects.filter(
            corretor=obj.corretor,
            status__in=['AGUARDANDO_RECIBO', 'EM_ANALISE', 'RECUSADO']
        ).order_by('-data_solicitacao').first()
        if pendente:
            return PagamentoCorretorSerializer(pendente).data
        return None

    def get_historico_pagamentos(self, obj):
        from .models import PagamentoCorretor
        pgtos = PagamentoCorretor.objects.filter(corretor=obj.corretor).order_by('-data_solicitacao')
        return PagamentoCorretorSerializer(pgtos, many=True).data
    
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'is_corretor', 'is_staff', 'is_superuser', 'is_active',
            'telefone', 'cpf', 'chave_pix', 'tipo_chave_pix', 'banco', 'agencia_conta', 
            'minibio', 'curriculo', 'formacoes', 'experiencias', 'date_joined', 'password',
            'foto_perfil'
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
    corretor_nome = serializers.SerializerMethodField() 
    foi_pago = serializers.SerializerMethodField() 

    class Meta:
        model = Redacao
        fields = '__all__'
        read_only_fields = ['aluno', 'status', 'corretor_atual', 'data_envio', 'nota_final', 'correcao', 'avaliacao_aluno', 'comentario_avaliacao']

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

    def get_corretor_nome(self, obj):
        if obj.corretor_atual:
            return f"{obj.corretor_atual.first_name} {obj.corretor_atual.last_name}".strip() or obj.corretor_atual.username
        return None

    def get_foi_pago(self, obj):
        try:
            if obj.status in ['CORRIGIDA', 'EM_QA', 'FINALIZADA'] and hasattr(obj, 'correcao') and obj.correcao:
                from .models import PagamentoCorretor
                return PagamentoCorretor.objects.filter(
                    corretor=obj.corretor_atual,
                    status='PAGO',
                    data_solicitacao__gte=obj.correcao.data_correcao
                ).exists()
        except: pass
        return False

class RedacaoFilaSerializer(serializers.ModelSerializer):
    tema_titulo = serializers.CharField(source='tema.titulo', read_only=True)
    tema_tipo = serializers.CharField(source='tema.tipo', read_only=True)
    aluno_nome = serializers.SerializerMethodField()
    corretor_nome = serializers.SerializerMethodField()
    foi_pago = serializers.SerializerMethodField() # <-- ESTA É A TRAVA!

    class Meta:
        model = Redacao
        fields = ['id', 'tema_titulo', 'tema_tipo', 'aluno_nome', 'texto', 'data_envio', 'status', 'is_urgente', 'vip_pago', 'corretor_atual', 'corretor_nome', 'foi_pago']

    def get_aluno_nome(self, obj):
        nome_completo = f"{obj.aluno.first_name} {obj.aluno.last_name}".strip()
        return nome_completo if nome_completo else obj.aluno.username

    def get_corretor_nome(self, obj):
        if obj.corretor_atual:
            return f"{obj.corretor_atual.first_name} {obj.corretor_atual.last_name}".strip() or obj.corretor_atual.username
        return None

    def get_foi_pago(self, obj):
        try:
            if obj.status in ['CORRIGIDA', 'EM_QA', 'FINALIZADA'] and hasattr(obj, 'correcao') and obj.correcao:
                from .models import PagamentoCorretor
                return PagamentoCorretor.objects.filter(
                    corretor=obj.corretor_atual,
                    status='PAGO',
                    data_solicitacao__gte=obj.correcao.data_correcao
                ).exists()
        except: pass
        return False

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