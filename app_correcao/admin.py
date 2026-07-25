from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth import get_user_model

# 1. Importa as suas tabelas locais (SEM O USER AQUI)
from .models import (
    RespostaRapida, Redacao, Tema, Correcao, NotaCompetencia, Anotacao,
    ConfiguracaoSistema, Carteira, CarteiraAluno, Transacao, Pacote, Cupom,
    BannerVitrine, HistoricoCompra, TextoMotivador, MaterialApoio
)

# 2. Importa o User da forma correta (do coração do Django)
User = get_user_model()

# 3. Registo do Utilizador
try:
    admin.site.register(User, UserAdmin)
except admin.sites.AlreadyRegistered:
    pass

# 4. Registo de todas as tabelas da plataforma
admin.site.register(RespostaRapida)
admin.site.register(Redacao)
admin.site.register(Tema)
admin.site.register(Correcao)
admin.site.register(NotaCompetencia)
admin.site.register(Anotacao)
admin.site.register(ConfiguracaoSistema)
admin.site.register(Carteira)
admin.site.register(CarteiraAluno)
admin.site.register(Transacao)
admin.site.register(Pacote)
admin.site.register(Cupom)
admin.site.register(BannerVitrine)
admin.site.register(HistoricoCompra)
admin.site.register(TextoMotivador)
admin.site.register(MaterialApoio)