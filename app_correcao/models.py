from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings 
from django.utils import timezone

class ConfiguracaoSistema(models.Model):
    razao_social_plataforma = models.CharField(max_length=255, default="Guia do Texto Plataforma Educacional")
    cnpj_plataforma = models.CharField(max_length=20, default="00.000.000/0001-00")
    tempo_limite_enem_minutos = models.IntegerField(default=40)
    tempo_limite_simples_minutos = models.IntegerField(default=25)
    valor_pagamento_enem = models.DecimalField(max_digits=10, decimal_places=2, default=4.00)
    valor_pagamento_simples = models.DecimalField(max_digits=10, decimal_places=2, default=3.00)
    valor_bonus_vip = models.DecimalField(max_digits=10, decimal_places=2, default=1.50)
    tempo_carrossel_segundos = models.IntegerField(default=6, help_text="Tempo em segundos que cada banner fica na tela")

    custo_creditos_vip = models.IntegerField(default=2)
    preco_avulso_normal = models.DecimalField(max_digits=10, decimal_places=2, default=9.90)
    preco_avulso_vip = models.DecimalField(max_digits=10, decimal_places=2, default=14.90)
    texto_promocional = models.CharField(max_length=255, blank=True, null=True, help_text="Aparecerá na caixa de promoções do aluno")

    class Meta:
        verbose_name = 'Configuração do Sistema'

class CustomUser(AbstractUser):
    is_corretor = models.BooleanField(default=False)
    is_coordenador = models.BooleanField(default=False, help_text="Acesso à Torre de Controle e Gestão de Corretores")
    is_financeiro = models.BooleanField(default=False, help_text="Acesso ao Painel Financeiro e E-commerce")
    foto_perfil = models.ImageField(upload_to='avatares/', blank=True, null=True)
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
    TIPO_CHOICES = [
        ('ENEM', 'Dissertação ENEM'), 
        ('PADRAO_100', 'Padrão 100 pts'), 
        ('PADRAO_10', 'Padrão 10 pts'),
        ('SIMPLES', 'Simples (Legado)') 
    ]
    titulo = models.CharField(max_length=200)
    descricao = models.TextField()
    tipo = models.CharField(max_length=15, choices=TIPO_CHOICES, default='ENEM')
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
    nota_final = models.FloatField(default=0) 
    comentario_geral = models.TextField(blank=True, null=True)
    data_correcao = models.DateTimeField(auto_now_add=True)
    avaliacao_aluno = models.IntegerField(default=0)
    comentario_avaliacao = models.TextField(blank=True, null=True)

class NotaCompetencia(models.Model):
    correcao = models.ForeignKey(Correcao, on_delete=models.CASCADE, related_name='notas_competencias')
    numero_competencia = models.IntegerField()
    nota = models.FloatField(default=0)
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
    MODELO_CHOICES = [('ENEM', 'ENEM'), ('PADRAO_100', 'Padrão 100 pts'), ('PADRAO_10', 'Padrão 10 pts'), ('SIMPLES', 'Simples')]
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
    saque_solicitado = models.BooleanField(default=False)
    qtd_normal_pendente = models.IntegerField(default=0)
    qtd_vip_pendente = models.IntegerField(default=0)
    def __str__(self): return f"Carteira - R$ {self.saldo_atual}"

class PagamentoCorretor(models.Model):
    STATUS_CHOICES = [('AGUARDANDO_RECIBO', 'Aguardando Recibo Assinado'), ('EM_ANALISE', 'Em Análise pelo Financeiro'), ('PAGO', 'Pagamento Efetuado'), ('RECUSADO', 'Recibo Recusado')]
    corretor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='pagamentos_recebidos')
    data_solicitacao = models.DateTimeField(auto_now_add=True)
    data_prevista_pagamento = models.DateField(null=True, blank=True)
    data_pagamento = models.DateTimeField(null=True, blank=True)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    qtd_normal = models.IntegerField(default=0)
    qtd_vip = models.IntegerField(default=0)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='AGUARDANDO_RECIBO')
    arquivo_recibo = models.FileField(upload_to='recibos_assinados/', null=True, blank=True)
    motivo_recusa = models.TextField(null=True, blank=True)
    def __str__(self): return f"Pagamento #{self.id} - {self.corretor.username} - {self.status}"

class Pacote(models.Model):
    nome = models.CharField(max_length=100)
    descricao = models.TextField(blank=True, null=True)
    preco = models.DecimalField(max_digits=10, decimal_places=2)
    preco_original = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    qtd_creditos_simples = models.IntegerField(default=0)
    qtd_creditos_vip = models.IntegerField(default=0)
    ativo = models.BooleanField(default=True)
    permite_parcelamento = models.BooleanField(default=False)
    max_parcelas = models.IntegerField(default=1)
    visivel_loja = models.BooleanField(default=True)
    compra_unica = models.BooleanField(default=False)
    selo_destaque = models.CharField(max_length=50, blank=True, null=True)
    destaque_vitrine = models.BooleanField(default=False)
    texto_vitrine = models.CharField(max_length=100, blank=True, null=True)
    data_fim_promocao = models.DateTimeField(blank=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)

class HistoricoCompra(models.Model):
    aluno = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    pacote = models.ForeignKey(Pacote, on_delete=models.SET_NULL, null=True, blank=True)
    data_compra = models.DateTimeField(auto_now_add=True)
    valor_pago = models.DecimalField(max_digits=10, decimal_places=2)
    descricao = models.CharField(max_length=200, blank=True, null=True) 

class BannerVitrine(models.Model):
    TIPO_CHOICES = (('AVISO', 'Aviso'), ('OFERTA', 'Oferta Relâmpago'), ('EVENTO', 'Evento / Aulão'))
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default='OFERTA')
    titulo = models.CharField(max_length=100)
    descricao = models.CharField(max_length=200, blank=True, null=True)
    cor_fundo = models.CharField(max_length=50, default="linear(to-br, orange.400, red.400)")
    imagem_fundo = models.TextField(blank=True, null=True)
    pacote_vinculado = models.ForeignKey(Pacote, on_delete=models.CASCADE, blank=True, null=True)
    data_fim = models.DateTimeField(blank=True, null=True)
    ativo = models.BooleanField(default=True)
    ordem = models.IntegerField(default=0)
    
    # NOVOS CAMPOS PARA MARKETING PREMIUM
    link_destino = models.CharField(max_length=255, blank=True, null=True)
    texto_botao = models.CharField(max_length=50, blank=True, null=True)
    cor_pelicula = models.CharField(max_length=100, default='black')
    opacidade_pelicula = models.IntegerField(default=60)

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
    CATEGORIAS_CHOICES = [('ALUNO_MANUAL', 'Manuais e Cartilhas'), ('ALUNO_REPERTORIO', 'Repertório Sociocultural'), ('ALUNO_GRAMATICA', 'Gramática e Estrutura'), ('ALUNO_EXEMPLOS', 'Redações Nota 1000'), ('CORRETOR_CARTILHA', 'Cartilha Oficial'), ('CORRETOR_REGUA', 'Régua de Penalizações'), ('CORRETOR_DESVIOS', 'Guia de Desvios'), ('CORRETOR_REPERTORIO', 'Guia de Repertórios Aceitos'), ('CORRETOR_COMUNICADO', 'Comunicados Rápidos')]
    titulo = models.CharField(max_length=200)
    descricao = models.TextField(blank=True, null=True) 
    conteudo = models.TextField(blank=True, null=True)  
    dados_extras = models.JSONField(blank=True, null=True, default=dict) 
    categoria = models.CharField(max_length=30, choices=CATEGORIAS_CHOICES)
    arquivo = models.FileField(upload_to='materiais_apoio/', null=True, blank=True)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.titulo
    
class Transacao(models.Model):
    STATUS_CHOICES = (('PENDENTE', 'Pendente'), ('APROVADO', 'Aprovado'), ('RECUSADO', 'Recusado / Expirado'))
    aluno = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transacoes')
    pagamento_id = models.CharField(max_length=100, unique=True, null=True, blank=True) 
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    descricao = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDENTE')
    qtd_simples = models.IntegerField(default=0)
    qtd_vip = models.IntegerField(default=0)
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

class GabaritoPin(models.Model):
    competencia = models.IntegerField(help_text="0 para OUTROS, 1 a 5 para as competências")
    titulo = models.CharField(max_length=50)
    texto = models.TextField()

    def __str__(self):
        return f"C{self.competencia} - {self.titulo}"