from django.urls import path, include
from rest_framework.routers import DefaultRouter

# IMPORTAÇÕES DO NOVO SISTEMA DIVIDIDO EM 4 ARQUIVOS
from .views_auth import (
    LoginView, CadastrarUsuarioView, GoogleLoginView, CandidaturaCorretorView, 
    MeusDadosView, SolicitarRecuperacaoSenhaView, ConfirmarRedefinicaoSenhaView
)
from .views_aluno import (
    MinhasRedacoesView, DetalheRedacaoView, EnviarRedacaoView, MinhaCarteiraAlunoView, 
    ComprarPacoteView, ComprarAvulsoView, ValidarCupomView, GerarPagamentoPixView, 
    VerificarStatusPixView, GerarLinkPagamentoCartaoView, ProcessarRetornoMercadoPagoView, 
    VerificarPagamentoMPView, enviar_avaliacao_corretor, solicitar_recurso_redacao, 
    AssistenteSuporteView
)
from .views_corretor import (
    FilaCorrecaoView, HistoricoCorretorView, IniciarCorrecaoView, LiberarCorrecaoView, 
    EntregarCorrecaoView, MinhaCarteiraView, SolicitarSaqueView, CancelarSaqueView, 
    EnviarReciboCorretorView, CorrecaoIAView, ReportarProblemaView, RespostaRapidaViewSet
)
from .views_gestao import (
    GestaoUsuariosViewSet, TemaViewSet, PacoteViewSet, BannerVitrineViewSet, 
    CupomViewSet, MaterialApoioViewSet, ConfiguracaoView, GestaoRedacoesView, 
    ToggleUrgenciaView, ForcarLiberacaoView, ResolverAuditoriaView, 
    AdicionarCreditoManualView, GestaoFinanceiraView, BaixarPagamentoView, RecusarReciboView
)

router = DefaultRouter()
router.register(r'temas', TemaViewSet, basename='tema')
router.register(r'respostas-rapidas', RespostaRapidaViewSet, basename='resposta-rapida')
router.register(r'gestao/usuarios', GestaoUsuariosViewSet, basename='gestao-usuarios') 
router.register(r'gestao/pacotes', PacoteViewSet, basename='gestao-pacotes')
router.register(r'gestao/banners', BannerVitrineViewSet, basename='gestao-banners')
router.register(r'gestao/cupons', CupomViewSet, basename='gestao-cupons')
router.register(r'materiais', MaterialApoioViewSet, basename='materiais')

urlpatterns = [
    # AUTH & USER PROFILE
    path('login/', LoginView.as_view(), name='login_padrao'),
    path('cadastrar/', CadastrarUsuarioView.as_view(), name='cadastro_aluno'),
    path('auth/google/', GoogleLoginView.as_view(), name='login_google'),
    path('candidatura-corretor/', CandidaturaCorretorView.as_view(), name='candidatura_corretor'),
    path('me/', MeusDadosView.as_view(), name='meus_dados'),
    path('recuperar-senha/', SolicitarRecuperacaoSenhaView.as_view(), name='recuperar_senha'),
    path('redefinir-senha/<str:uidb64>/<str:token>/', ConfirmarRedefinicaoSenhaView.as_view(), name='confirmar_redefinicao'),
    
    # ROTAS GENÉRICAS (Routers do DRF)
    path('', include(router.urls)),
    
    # ------------------ ROTAS DO ALUNO ------------------
    path('minhas-redacoes/', MinhasRedacoesView.as_view(), name='minhas_redacoes'),
    path('redacao/<int:pk>/', DetalheRedacaoView.as_view(), name='detalhe_redacao'),
    path('enviar/', EnviarRedacaoView.as_view(), name='enviar_redacao'),
    path('aluno/carteira/', MinhaCarteiraAlunoView.as_view(), name='carteira_aluno'),
    path('loja/comprar/', ComprarPacoteView.as_view(), name='comprar_pacote'),
    path('loja/comprar-avulso/', ComprarAvulsoView.as_view(), name='comprar_avulso'),
    path('loja/validar-cupom/', ValidarCupomView.as_view(), name='validar_cupom'),
    path('pagamento/pix/', GerarPagamentoPixView.as_view(), name='gerar_pix'),
    path('pagamento/status/<str:pagamento_id>/', VerificarStatusPixView.as_view(), name='status_pix'),
    path('pagamento/cartao/', GerarLinkPagamentoCartaoView.as_view(), name='gerar_cartao'),
    path('pagamento/confirmar-retorno/', ProcessarRetornoMercadoPagoView.as_view(), name='confirmar_retorno'),
    path('loja/verificar-pagamento/<int:transacao_id>/', VerificarPagamentoMPView.as_view(), name='verificar_pagamento'),
    path('redacao/<int:pk>/avaliar/', enviar_avaliacao_corretor, name='enviar_avaliacao'),
    path('redacao/<int:pk>/recurso/', solicitar_recurso_redacao, name='solicitar_recurso'),
    path('chat-assistente/', AssistenteSuporteView.as_view(), name='chat_assistente'),
    
    # ------------------ ROTAS DO CORRETOR ------------------
    path('fila/', FilaCorrecaoView.as_view(), name='fila_correcao'),
    path('corretor/historico/', HistoricoCorretorView.as_view(), name='historico_corretor'),
    path('corrigir/<int:pk>/iniciar/', IniciarCorrecaoView.as_view(), name='iniciar_correcao'),
    path('corrigir/<int:pk>/liberar/', LiberarCorrecaoView.as_view(), name='liberar_correcao'),
    path('corrigir/', EntregarCorrecaoView.as_view(), name='entregar_correcao'),
    path('corretor/carteira/', MinhaCarteiraView.as_view(), name='minha_carteira'),
    path('corretor/solicitar-saque/', SolicitarSaqueView.as_view(), name='corretor-solicitar-saque'),
    path('corretor/cancelar-saque/<int:pk>/', CancelarSaqueView.as_view(), name='corretor-cancelar-saque'),
    path('corretor/pagamento/<int:pk>/enviar-recibo/', EnviarReciboCorretorView.as_view(), name='corretor-enviar-recibo'),
    path('corrigir/<int:pk>/ia/', CorrecaoIAView.as_view(), name='corrigir_ia'),
    path('corrigir/<int:pk>/problema/', ReportarProblemaView.as_view(), name='reportar_problema'),
    
    # ------------------ ROTAS DA GESTÃO ------------------
    path('gestao/configuracoes/', ConfiguracaoView.as_view(), name='gestao_config'),
    path('gestao/redacoes/', GestaoRedacoesView.as_view(), name='gestao_redacoes'),
    path('gestao/redacoes/<int:pk>/urgencia/', ToggleUrgenciaView.as_view(), name='toggle_urgencia'),
    path('gestao/redacoes/<int:pk>/liberar/', ForcarLiberacaoView.as_view(), name='forcar_liberacao'),
    path('auditoria/<int:pk>/resolver/', ResolverAuditoriaView.as_view(), name='resolver_auditoria'),
    path('gestao/usuarios/<int:user_id>/creditos/', AdicionarCreditoManualView.as_view(), name='adicionar_creditos'),
    path('gestao/financeiro/dashboard/', GestaoFinanceiraView.as_view(), name='gestao_financeira_dashboard'),
    path('gestao/financeiro/baixar-pagamento/<int:pk>/', BaixarPagamentoView.as_view(), name='financeiro-baixar-pagamento'),
    path('gestao/financeiro/recusar-recibo/<int:pk>/', RecusarReciboView.as_view(), name='financeiro-recusar-recibo'),
]