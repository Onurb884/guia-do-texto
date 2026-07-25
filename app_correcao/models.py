from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings 
from django.utils import timezone

class ConfiguracaoSistema(models.Model):
    tempo_limite_enem_minutos = models.IntegerField(default=40)
    tempo_limite_simples_minutos = models.IntegerField(default=25)
    valor_pagamento_enem = models.DecimalField(max_digits=10, decimal_places=2, default=4.00)
    valor_pagamento_simples = models.DecimalField(max_digits=10, decimal_places=2, default=3.00)
    valor_bonus_vip = models.DecimalField(max_digits=10, decimal_places=2, default=1.50)
    tempo_carrossel_segundos = models.IntegerField(default=6, help_text="Tempo em segundos que cada banner fica na tela")

    # Moeda Unificada e Valores Avulsos
    custo_creditos_vip = models.IntegerField(default=2)
    preco_avulso_normal = models.DecimalField(max_digits=10, decimal_places=2, default=9.90)
    preco_avulso_vip = models.DecimalField(max_digits=10, decimal_places=2, default=14.90)
    
    # NOVO: Texto Promocional Global
    texto_promocional = models.CharField(max_length=255, blank=True, null=True, help_text="Aparecerá na caixa de promoções do aluno")

    class Meta:
        verbose_name = 'Configuração do Sistema'

class CustomUser(AbstractUser):
    is_corretor = models.BooleanField(default=False)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    cpf = models.CharField(max_length=14, blank=True, null=True)
    chave_pix = models.CharField(max_length=100, blank=True, null=True)
    tipo_chave_pix = models.CharField(max_length=20, blank=True, null=True)
    banco = models.CharField(max_length=50, blank=True, null=True) 
    agencia_conta = models.CharField(max_length=50, blank=True, null=True) 
    minibio = models.TextField(blank=True, null=True)
    curriculo = models.FileField(upload_to='curriculos/', blank=True, null=True)

    formacoes = models.JSONField(default=list, blank=True, null=True)
    experiencias = models.JSONField(default=list, blank=True, null=True)

class Tema(models.Model):
    TIPO_CHOICES = [('ENEM', 'Dissertação ENEM'), ('SIMPLES', 'Dissertação Simples')]
    titulo = models.CharField(max_length=200)
    descricao = models.TextField()
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default='ENEM')
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.titulo

class TextoMotivador(models.Model):
    tema = models.ForeignKey(Tema, related_name='motivadores', on_delete=models.CASCADE)
    tipo = models.CharField(max_length=10)
    conteudo = models.TextField(blank=True, null=True) 
    arquivo = models.ImageField(upload_to='motivadores/', blank=True, null=True)
    ordem = models.IntegerField(default=0)
    def __str__(self): return f"Motivador {self.ordem} - {self.tema.titulo}"

class Redacao(models.Model):
    STATUS_CHOICES = [('AGUARDANDO', 'Aguardando Correção'), ('EM_CORRECAO', 'Em Correção'), ('CORRIGIDA', 'Corrigida')]
    is_urgente = models.BooleanField(default=False, help_text="Marcado como urgente pelo gestor")
    vip_pago = models.BooleanField(default=False, help_text="Verdadeiro se o aluno comprou o pacote de correção rápida")
    data_inicio_correcao = models.DateTimeField(null=True, blank=True, help_text="Momento exato que o corretor pegou a redação")
    aluno = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='redacoes')
    tema = models.ForeignKey(Tema, on_delete=models.PROTECT)
    arquivo = models.FileField(upload_to='redacoes/', blank=True, null=True)
    texto = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AGUARDANDO')
    data_envio = models.DateTimeField(auto_now_add=True)
    corretor_atual = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='correcoes_em_andamento')

class Correcao(models.Model):
    redacao = models.OneToOneField(Redacao, on_delete=models.CASCADE, related_name='correcao')
    corretor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    nota_final = models.IntegerField()
    comentario_geral = models.TextField(blank=True, null=True)
    data_correcao = models.DateTimeField(auto_now_add=True)

class NotaCompetencia(models.Model):
    correcao = models.ForeignKey(Correcao, on_delete=models.CASCADE, related_name='notas_competencias')
    numero_competencia = models.IntegerField()
    nota = models.IntegerField()
    comentario = models.TextField(blank=True, null=True)

class Anotacao(models.Model):
    correcao = models.ForeignKey(Correcao, on_delete=models.CASCADE, related_name='anotacoes')
    competencia = models.IntegerField()
    x = models.FloatField()
    y = models.FloatField()
    width = models.FloatField()
    height = models.FloatField()
    tipo_erro = models.CharField(max_length=100, blank=True, null=True)
    texto = models.TextField()

class RespostaRapida(models.Model):
    CONTEXTO_CHOICES = [('GERAL', 'Comentário Geral'), ('PIN', 'Observação do Pin')]
    MODELO_CHOICES = [('ENEM', 'ENEM'), ('SIMPLES', 'Simples')]
    corretor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='respostas_rapidas')
    modelo = models.CharField(max_length=20, choices=MODELO_CHOICES, default='ENEM')
    competencia = models.IntegerField()
    contexto = models.CharField(max_length=10, choices=CONTEXTO_CHOICES)
    tipo_erro = models.CharField(max_length=50, blank=True, null=True) 
    titulo = models.CharField(max_length=100)
    texto = models.TextField()
    criado_em = models.DateTimeField(auto_now_add=True)

class Carteira(models.Model):
    corretor = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='carteira')
    saldo_atual = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    def __str__(self): return f"Carteira - R$ {self.saldo_atual}"

# =========================================================
# TABELAS: PACOTES, CUPONS, HISTÓRICO E VITRINE
# =========================================================

class Pacote(models.Model):
    nome = models.CharField(max_length=100)
    descricao = models.TextField(blank=True, null=True)
    preco = models.DecimalField(max_digits=10, decimal_places=2, help_text="Preço real de venda")
    preco_original = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Aparecerá riscado. Ex: De R$ 150 por R$ 99")
    
    qtd_creditos_simples = models.IntegerField(default=0)
    qtd_creditos_vip = models.IntegerField(default=0)
    
    ativo = models.BooleanField(default=True)
    permite_parcelamento = models.BooleanField(default=False)
    max_parcelas = models.IntegerField(default=1)
    
    visivel_loja = models.BooleanField(default=True, help_text="Aparece na vitrine comum da loja?")
    compra_unica = models.BooleanField(default=False, help_text="O aluno só pode comprar este pacote 1 vez na vida?")
    
    selo_destaque = models.CharField(max_length=50, blank=True, null=True, help_text="Ex: MAIS VENDIDO, RECOMENDADO")

    # Oferta Relâmpago dentro do Pacote
    destaque_vitrine = models.BooleanField(default=False, help_text="É uma oferta relâmpago no painel do aluno?")
    texto_vitrine = models.CharField(max_length=100, blank=True, null=True, help_text="Ex: ⚡ Reta Final 50% OFF")
    data_fim_promocao = models.DateTimeField(blank=True, null=True, help_text="Para o cronômetro do pacote")

    criado_em = models.DateTimeField(auto_now_add=True)

class HistoricoCompra(models.Model):
    aluno = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    pacote = models.ForeignKey(Pacote, on_delete=models.SET_NULL, null=True, blank=True)
    data_compra = models.DateTimeField(auto_now_add=True)
    valor_pago = models.DecimalField(max_digits=10, decimal_places=2)
    descricao = models.CharField(max_length=200, blank=True, null=True) # Para compras avulsas

class BannerVitrine(models.Model):
    TIPO_CHOICES = (
        ('AVISO', 'Aviso (Apenas texto, sem botão de compra)'),
        ('OFERTA', 'Oferta Relâmpago (Vinculado a um pacote)'),
        ('EVENTO', 'Evento / Aulão ao Vivo (Calendário)')
    )
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default='OFERTA')
    titulo = models.CharField(max_length=100, help_text="Ex: ⚡ Oferta Relâmpago!")
    descricao = models.CharField(max_length=200, help_text="Ex: Pacote VIP com 50% OFF", blank=True, null=True)
    cor_fundo = models.CharField(max_length=50, default="linear(to-br, orange.400, red.400)", help_text="Código de cor do React")
    
    # MUDANÇA AQUI: TextField para suportar Base64 sem precisar do Pillow
    imagem_fundo = models.TextField(blank=True, null=True, help_text="Imagem convertida em Base64")
    
    pacote_vinculado = models.ForeignKey(Pacote, on_delete=models.CASCADE, blank=True, null=True)
    data_fim = models.DateTimeField(blank=True, null=True, help_text="Quando o cronômetro deve zerar e o banner sumir")
    
    ativo = models.BooleanField(default=True)
    ordem = models.IntegerField(default=0, help_text="Ordem de exibição no carrossel")

class Cupom(models.Model):
    codigo = models.CharField(max_length=50, unique=True)
    desconto_percentual = models.DecimalField(max_digits=5, decimal_places=2)
    limite_usos = models.IntegerField(default=100)
    usos_atuais = models.IntegerField(default=0)
    ativo = models.BooleanField(default=True)
    data_validade = models.DateTimeField(blank=True, null=True)

class CarteiraAluno(models.Model):
    aluno = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='carteira_aluno')
    saldo_simples = models.IntegerField(default=0)
    saldo_vip = models.IntegerField(default=0)

class MaterialApoio(models.Model):
    CATEGORIAS_CHOICES = [
        ('ALUNO_MANUAL', 'Manuais e Cartilhas'),
        ('ALUNO_REPERTORIO', 'Repertório Sociocultural'),
        ('ALUNO_GRAMATICA', 'Gramática e Estrutura'),
        ('ALUNO_EXEMPLOS', 'Redações Nota 1000'),
        ('CORRETOR_CARTILHA', 'Cartilha Oficial (MEC/Banca)'),
        ('CORRETOR_REGUA', 'Régua de Penalizações'),
        ('CORRETOR_DESVIOS', 'Guia de Desvios (Gramática)'),
        ('CORRETOR_REPERTORIO', 'Guia de Repertórios Aceitos'),
        ('CORRETOR_COMUNICADO', 'Comunicados de Alinhamento'),
    ]
    
    titulo = models.CharField(max_length=200)
    descricao = models.TextField(blank=True, null=True) # Resumo curto
    conteudo = models.TextField(blank=True, null=True)  # Texto livre (ex: Comunicados)
    
    # A MÁGICA ACONTECE AQUI: Este campo vai guardar os formulários dinâmicos!
    dados_extras = models.JSONField(blank=True, null=True, default=dict) 
    
    categoria = models.CharField(max_length=30, choices=CATEGORIAS_CHOICES)
    arquivo = models.FileField(upload_to='materiais_apoio/', null=True, blank=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.titulo
    
class Transacao(models.Model):
    STATUS_CHOICES = (
        ('PENDENTE', 'Pendente'),
        ('APROVADO', 'Aprovado'),
        ('RECUSADO', 'Recusado / Expirado'),
    )
    
    # Quem está a comprar
    aluno = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transacoes')
    
    # Dados do Pagamento
    pagamento_id = models.CharField(max_length=100, unique=True, null=True, blank=True) # ID gerado pelo Mercado Pago
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    descricao = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDENTE')
    
    # O que entregar quando for aprovado (o "carrinho de compras")
    qtd_simples = models.IntegerField(default=0)
    qtd_vip = models.IntegerField(default=0)
    
    # Datas de controle
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Transação #{self.id} - {self.aluno.username} - R$ {self.valor} ({self.status})"