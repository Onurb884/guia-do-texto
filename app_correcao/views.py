from google import genai
from google.genai import types # type: ignore
import json
import mercadopago # type: ignore
import uuid
import random

from django.core.mail import send_mail
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.utils.encoding import force_bytes
from django.conf import settings
from PIL import Image # type: ignore

# --- A CORREÇÃO FOI FEITA NESTA LINHA ABAIXO ---
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework import generics, permissions, status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.db import transaction 
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate

# --- NOVAS IMPORTAÇÕES PARA SEGURANÇA E GOOGLE ---
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token # type: ignore
from google.auth.transport import requests as google_requests # type: ignore
# -------------------------------------------------

from .models import (
    RespostaRapida, Redacao, Tema, Correcao, NotaCompetencia, Anotacao, 
    ConfiguracaoSistema, Carteira, CarteiraAluno, Transacao, Pacote, Cupom, 
    BannerVitrine, HistoricoCompra, TextoMotivador, MaterialApoio, PagamentoCorretor
)
from .serializers import (
    RespostaRapidaSerializer, RedacaoSerializer, RedacaoFilaSerializer, 
    TemaSerializer, ConfiguracaoSerializer, UserSerializer, CarteiraSerializer,
    PacoteSerializer, CupomSerializer, CarteiraAlunoSerializer, BannerVitrineSerializer,
    MaterialApoioSerializer
)
from .permissions import IsCorretor 

User = get_user_model()

# =======================================================================
# SISTEMA DE AUTENTICAÇÃO (LOGIN, CADASTRO E GOOGLE)
# =======================================================================

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)

class LoginView(APIView):
    permission_classes = [] 
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        
        if user:
            if not user.is_active:
                return Response({'erro': 'Conta suspensa. Contacte o suporte.'}, status=status.HTTP_403_FORBIDDEN)
            return Response({'token': get_tokens_for_user(user)})
            
        return Response({'erro': 'Credenciais inválidas'}, status=status.HTTP_401_UNAUTHORIZED)

class CadastrarUsuarioView(APIView):
    permission_classes = [] 
    
    def post(self, request):
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name', '')
        email = request.data.get('email')
        password = request.data.get('password')
        
        if User.objects.filter(email=email).exists() or User.objects.filter(username=email).exists():
            return Response({'erro': 'Este e-mail já está cadastrado.'}, status=status.HTTP_400_BAD_REQUEST)
            
        user = User.objects.create_user(
            username=email, 
            email=email, 
            password=password, 
            first_name=first_name,
            last_name=last_name
        )
        return Response({'mensagem': 'Conta criada com sucesso'}, status=status.HTTP_201_CREATED)

class GoogleLoginView(APIView):
    permission_classes = [] 
    
    def post(self, request):
        token_do_google = request.data.get('token')
        CLIENT_ID = "252614378664-uss5jg10rpk5u0vnkko9r8fl9vc69vdt.apps.googleusercontent.com"
        
        try:
            idinfo = id_token.verify_oauth2_token(token_do_google, google_requests.Request(), CLIENT_ID)
            email = idinfo['email']
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')
            user = User.objects.filter(email=email).first()
            
            if not user:
                user = User.objects.create_user(username=email, email=email, first_name=first_name, last_name=last_name)
                user.set_unusable_password()
                user.save()
                
            if not user.is_active:
                return Response({'erro': 'Conta suspensa.'}, status=status.HTTP_403_FORBIDDEN)
                
            return Response({'token': get_tokens_for_user(user)})
            
        except ValueError:
            return Response({'erro': 'Token do Google inválido'}, status=status.HTTP_400_BAD_REQUEST)

class CandidaturaCorretorView(APIView):
    permission_classes = [] 
    parser_classes = [MultiPartParser, FormParser, JSONParser] 
    
    def post(self, request):
        email = request.data.get('email')
        cpf = request.data.get('cpf')
        
        if User.objects.filter(email=email).exists() or User.objects.filter(username=email).exists():
            return Response({'erro': 'Este e-mail já está cadastrado.'}, status=status.HTTP_400_BAD_REQUEST)
        if cpf and User.objects.filter(cpf=cpf).exists():
            return Response({'erro': 'Este CPF já está cadastrado.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            agencia = request.data.get('agencia', '')
            conta = request.data.get('conta', '')
            agencia_conta_formatada = f"Ag: {agencia} Cc: {conta}" if (agencia or conta) else ""

            user = User.objects.create_user(
                username=email, email=email, password=request.data.get('password'), 
                first_name=request.data.get('first_name'),
                last_name=request.data.get('last_name', ''), 
                is_active=False, is_corretor=True, cpf=cpf, telefone=request.data.get('telefone'), minibio=request.data.get('minibio'),
                tipo_chave_pix=request.data.get('tipo_chave_pix'), chave_pix=request.data.get('chave_pix'), 
                banco=request.data.get('banco'), agencia_conta=agencia_conta_formatada,
            )
            formacoes = request.data.get('formacoes')
            experiencias = request.data.get('experiencias')
            if formacoes: user.formacoes = json.loads(formacoes) if isinstance(formacoes, str) else formacoes
            if experiencias: user.experiencias = json.loads(experiencias) if isinstance(experiencias, str) else experiencias
            if 'curriculo' in request.FILES: user.curriculo = request.FILES['curriculo']
                
            user.save()
            return Response({'mensagem': 'Candidatura enviada com sucesso!'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# =======================================================================
# MEU PERFIL (ATUALIZADO PARA FOTOS E CARGOS DA REDE SOCIAL)
# =======================================================================

class MeusDadosView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser] 
    
    def get(self, request):
        foto_url = request.user.foto_perfil.url if request.user.foto_perfil else None
        
        formacoes = request.user.formacoes
        if isinstance(formacoes, str):
            try: formacoes = json.loads(formacoes)
            except: formacoes = []
            
        experiencias = request.user.experiencias
        if isinstance(experiencias, str):
            try: experiencias = json.loads(experiencias)
            except: experiencias = []

        return Response({
            "id": request.user.id, "username": request.user.username, "email": request.user.email,
            "first_name": request.user.first_name, "last_name": request.user.last_name,
            "telefone": getattr(request.user, 'telefone', ''), "cpf": getattr(request.user, 'cpf', ''),
            "chave_pix": getattr(request.user, 'chave_pix', ''),
            "tipo_chave_pix": getattr(request.user, 'tipo_chave_pix', ''),
            "banco": getattr(request.user, 'banco', ''),
            "agencia_conta": getattr(request.user, 'agencia_conta', ''),
            "minibio": getattr(request.user, 'minibio', ''),
            "formacoes": formacoes or [],
            "experiencias": experiencias or [],
            "is_corretor": getattr(request.user, 'is_corretor', False), 
            "is_coordenador": getattr(request.user, 'is_coordenador', False), 
            "is_financeiro": getattr(request.user, 'is_financeiro', False), 
            "is_staff": request.user.is_staff, 
            "is_superuser": request.user.is_superuser,
            "foto_perfil": foto_url
        })

    def patch(self, request):
        user = request.user
        data = request.data
        if 'first_name' in data: user.first_name = data['first_name']
        if 'last_name' in data: user.last_name = data['last_name']
        if 'telefone' in data: user.telefone = data['telefone']
        if 'cpf' in data: user.cpf = data['cpf']
        if 'password' in data and data['password'].strip() != '': user.set_password(data['password'])
        
        if 'chave_pix' in data: user.chave_pix = data['chave_pix']
        if 'tipo_chave_pix' in data: user.tipo_chave_pix = data['tipo_chave_pix']
        if 'banco' in data: user.banco = data['banco']
        if 'minibio' in data: user.minibio = data['minibio']
        
        if 'formacoes' in data:
            try: user.formacoes = json.loads(data['formacoes'])
            except: user.formacoes = data['formacoes']
                
        if 'experiencias' in data:
            try: user.experiencias = json.loads(data['experiencias'])
            except: user.experiencias = data['experiencias']
        
        if 'foto_perfil' in request.FILES:
            user.foto_perfil = request.FILES['foto_perfil']
            
        agencia = data.get('agencia', '')
        conta = data.get('conta', '')
        if agencia or conta:
            user.agencia_conta = f"Ag: {agencia} Cc: {conta}"
        elif 'agencia' in data and 'conta' in data:
            user.agencia_conta = ""
            
        user.save()
        return Response({"mensagem": "Dados atualizados com sucesso!"}, status=status.HTTP_200_OK)

# =======================================================================
# GESTÃO DE USUÁRIOS (COM TRAVÃO DE SEGURANÇA PARA A COORDENAÇÃO)
# =======================================================================

class GestaoUsuariosViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser] 
    parser_classes = [MultiPartParser, FormParser, JSONParser] 

    def create(self, request, *args, **kwargs):
        user_logado = request.user
        nivel_acesso = request.data.get('nivel_acesso', 'ALUNO')
        
        if not user_logado.is_superuser:
            if nivel_acesso in ['MASTER', 'FINANCEIRO', 'COORDENADOR']:
                return Response({'erro': 'Apenas o Admin Master pode criar cargos administrativos.'}, status=status.HTTP_403_FORBIDDEN)
        
        email = request.data.get('email')
        if User.objects.filter(email=email).exists() or User.objects.filter(username=email).exists():
            return Response({'erro': 'Este e-mail já está cadastrado no sistema.'}, status=status.HTTP_400_BAD_REQUEST)
            
        novo_user = User.objects.create_user(
            username=email,
            email=email,
            password=request.data.get('password'),
            first_name=request.data.get('first_name', ''),
            last_name=request.data.get('last_name', '')
        )
        
        self._aplicar_permissoes(novo_user, nivel_acesso)
        return Response({"mensagem": "Usuário criado com sucesso!"}, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        user_logado = request.user
        nivel_acesso = request.data.get('nivel_acesso')
        
        if not user_logado.is_superuser:
            if instance.is_superuser or getattr(instance, 'is_financeiro', False) or getattr(instance, 'is_coordenador', False):
                return Response({'erro': 'Você não tem permissão para editar cargos administrativos da empresa.'}, status=status.HTTP_403_FORBIDDEN)
            if nivel_acesso in ['MASTER', 'FINANCEIRO', 'COORDENADOR']:
                return Response({'erro': 'Você não tem autorização para promover este utilizador a cargos administrativos.'}, status=status.HTTP_403_FORBIDDEN)

        instance.first_name = request.data.get('first_name', instance.first_name)
        instance.last_name = request.data.get('last_name', instance.last_name)
        instance.email = request.data.get('email', instance.email)
        instance.username = request.data.get('email', instance.username)
        
        nova_senha = request.data.get('password')
        if nova_senha and nova_senha.strip():
            instance.set_password(nova_senha)
            
        if nivel_acesso:
            self._aplicar_permissoes(instance, nivel_acesso)
        else:
            instance.save()
            
        return Response({"mensagem": "Usuário editado com sucesso!"})

    def _aplicar_permissoes(self, user, nivel):
        user.is_superuser = False
        user.is_staff = False
        user.is_coordenador = False
        user.is_financeiro = False
        user.is_corretor = False
        
        if nivel == 'MASTER':
            user.is_superuser = True
            user.is_staff = True
        elif nivel == 'FINANCEIRO':
            user.is_financeiro = True
            user.is_staff = True
        elif nivel == 'COORDENADOR':
            user.is_coordenador = True
            user.is_staff = True
        elif nivel == 'CORRETOR':
            user.is_corretor = True
        
        user.save()


# =======================================================================
# SISTEMA DE REDAÇÕES E IA
# =======================================================================

def limpar_redacoes_expiradas():
    config, _ = ConfiguracaoSistema.objects.get_or_create(id=1)
    agora = timezone.now()
    redacoes_em_correcao = Redacao.objects.filter(status__in=['EM_CORRECAO', 'REFAZER'], data_inicio_correcao__isnull=False)
    for redacao in redacoes_em_correcao:
        tipo = redacao.tema.tipo if redacao.tema else 'ENEM'
        minutos_limite = config.tempo_limite_simples_minutos if tipo == 'SIMPLES' else config.tempo_limite_enem_minutos
        tempo_esgotado = redacao.data_inicio_correcao + timedelta(minutes=minutos_limite)
        if agora > tempo_esgotado:
            if hasattr(redacao, 'correcao'):
                redacao.status = 'REFAZER' 
            else:
                redacao.status = 'AGUARDANDO'
                redacao.corretor_atual = None
            redacao.data_inicio_correcao = None
            redacao.save()

class TemaViewSet(viewsets.ModelViewSet):
    queryset = Tema.objects.all().order_by('-id')
    serializer_class = TemaSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser] 

    @action(detail=True, methods=['get'])
    def repertorios_ia(self, request, pk=None):
        tema = self.get_object()
        
        textos_de_apoio = ""
        motivadores_lista = tema.motivadores.all() if hasattr(tema.motivadores, 'all') else tema.motivadores
        
        if motivadores_lista:
            for idx, mot in enumerate(motivadores_lista):
                tipo = getattr(mot, 'tipo', None) or (mot.get('tipo') if isinstance(mot, dict) else None)
                conteudo = getattr(mot, 'conteudo', None) or (mot.get('conteudo') if isinstance(mot, dict) else None)
                if tipo == 'texto' and conteudo:
                    textos_de_apoio += f"\n--- Texto {idx + 1} ---\n{conteudo}\n"
        
        prompt = f"""
        Aja como um professor especialista em redação nota 1000.
        O aluno vai escrever uma redação com o tema: "{tema.titulo}".
        
        Abaixo estão as instruções da proposta e os textos motivadores. Use-os APENAS para entender o recorte temático exigido pela banca, garantindo que suas sugestões não fujam do foco principal:
        
        INSTRUÇÕES:
        {tema.descricao}
        
        TEXTOS MOTIVADORES:
        {textos_de_apoio}
        
        Forneça 3 sugestões criativas de repertório sociocultural (ex: um filme ou série, um fato histórico, e um conceito filosófico ou sociológico) que se encaixem perfeitamente neste recorte temático.
        Para cada sugestão, explique de forma prática e direta como o aluno pode ligar isso aos argumentos da redação.
        
        A sua resposta DEVE ser estritamente em HTML simples, sem blocos de markdown.
        Use a seguinte estrutura para cada um dos 3 itens:
        <h3>💡 [Nome do Repertório]</h3>
        <p><strong>Área:</strong> [História/Filosofia/Cinema]</p>
        <p><strong>Como aplicar:</strong> [Sua explicação aqui]</p>
        <hr/>
        """
        
        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            texto_html = response.text.replace("```html", "").replace("```", "").strip()
            return Response({"html": texto_html})
        except Exception as e:
            return Response({"erro": str(e)}, status=500)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsCorretor()]
        return [permissions.IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        data = request.data.dict() if hasattr(request.data, 'dict') else request.data.copy()
        self._processar_motivadores(data, request.FILES)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data.dict() if hasattr(request.data, 'dict') else request.data.copy()
        self._processar_motivadores(data, request.FILES)
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def _processar_motivadores(self, data, files):
        if 'motivadores_json' in data:
            try:
                motivadores_list = json.loads(data['motivadores_json'])
                for index, item in enumerate(motivadores_list):
                    file_key = f'arquivo_{index}'
                    if file_key in files:
                        item['arquivo'] = files[file_key]
                    if 'id' not in item:
                        item.pop('id', None)
                data['motivadores'] = motivadores_list
            except json.JSONDecodeError:
                pass 
    
class MinhasRedacoesView(generics.ListAPIView):
    serializer_class = RedacaoSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self): return Redacao.objects.filter(aluno=self.request.user).order_by('-data_envio')

class DetalheRedacaoView(generics.RetrieveAPIView):
    serializer_class = RedacaoSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Redacao.objects.all()

class EnviarRedacaoView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        try:
            tema_id = request.data.get('tema')
            arquivo = request.FILES.get('arquivo')
            texto = request.data.get('texto')
            is_urgente = str(request.data.get('is_urgente', 'false')).lower() == 'true'

            if not tema_id: return Response({"erro": "Tema obrigatório."}, status=400)
            if not arquivo and not texto: return Response({"erro": "Envie o arquivo ou digite."}, status=400)
            
            with transaction.atomic():
                carteira, _ = CarteiraAluno.objects.get_or_create(aluno=request.user)
                config = ConfiguracaoSistema.objects.first()
                custo_vip = config.custo_creditos_vip if config else 2
                
                if is_urgente:
                    if carteira.saldo_vip > 0: carteira.saldo_vip -= 1
                    elif carteira.saldo_simples >= custo_vip: carteira.saldo_simples -= custo_vip
                    else: return Response({"erro": f"Você precisa de 1 Crédito VIP ou {custo_vip} Créditos Normais."}, status=402)
                else:
                    if carteira.saldo_simples <= 0: return Response({"erro": "Você não possui créditos normais."}, status=402)
                    carteira.saldo_simples -= 1
                    
                carteira.save()
                tema = get_object_or_404(Tema, pk=tema_id)
                redacao = Redacao.objects.create(aluno=request.user, tema=tema, arquivo=arquivo, texto=texto, status='AGUARDANDO', vip_pago=is_urgente)
                
            return Response({"mensagem": "Sucesso!", "id": redacao.id}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"erro": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class FilaCorrecaoView(generics.ListAPIView):
    serializer_class = RedacaoFilaSerializer 
    permission_classes = [permissions.IsAuthenticated, IsCorretor]

    def get_queryset(self):
        limpar_redacoes_expiradas()
        qs_novas = Redacao.objects.filter(status__in=['AGUARDANDO', 'EM_CORRECAO'])
        qs_refazer = Redacao.objects.filter(status='REFAZER', corretor_atual=self.request.user)
        return (qs_novas | qs_refazer).distinct().order_by('data_envio')

class HistoricoCorretorView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCorretor]

    def get(self, request):
        correcoes = Correcao.objects.filter(
            corretor=request.user, 
            redacao__status__in=['CORRIGIDA', 'EM_QA']
        ).select_related('redacao', 'redacao__tema').order_by('-redacao__data_envio')
        
        dados = []
        for c in correcoes:
            r = c.redacao
            dados.append({
                "id": r.id,
                "tema_titulo": r.tema.titulo if r.tema else "Sem tema",
                "tema_tipo": r.tema.tipo if r.tema else "ENEM",
                "data_envio": r.data_envio,
                "nota_final": c.nota_final,
            })
        return Response(dados, status=200)

class IniciarCorrecaoView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCorretor]
    def post(self, request, pk):
        redacao = get_object_or_404(Redacao, pk=pk)
        if redacao.status in ['EM_CORRECAO', 'REFAZER'] and redacao.corretor_atual and redacao.corretor_atual != request.user:
            return Response({"erro": "Já está com outro corretor."}, status=status.HTTP_409_CONFLICT)
        
        redacao.corretor_atual = request.user
        if redacao.status != 'REFAZER':
            redacao.status = 'EM_CORRECAO'
            
        redacao.data_inicio_correcao = timezone.now()
        redacao.save()
        config, _ = ConfiguracaoSistema.objects.get_or_create(id=1)
        tipo = redacao.tema.tipo if redacao.tema else 'ENEM'
        minutos_limite = config.tempo_limite_simples_minutos if tipo == 'SIMPLES' else config.tempo_limite_enem_minutos
        return Response({"mensagem": "Iniciada.", "minutos_limite": minutos_limite}, status=status.HTTP_200_OK)

class LiberarCorrecaoView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCorretor]
    def post(self, request, pk):
        redacao = get_object_or_404(Redacao, pk=pk)
        if redacao.corretor_atual != request.user: return Response({"erro": "Não é sua."}, status=403)
        redacao.corretor_atual = None
        redacao.status = 'AGUARDANDO'
        redacao.data_inicio_correcao = None
        redacao.save()
        return Response({"mensagem": "Devolvida."}, status=200)

class EntregarCorrecaoView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCorretor]
    
    def post(self, request):
        try:
            data = request.data
            redacao = get_object_or_404(Redacao, pk=data.get('redacao_id'))
            if redacao.corretor_atual != request.user: return Response({"erro": "Negado."}, status=403)

            from django.db import transaction
            with transaction.atomic():
                is_refacao = hasattr(redacao, 'correcao')

                if is_refacao:
                    correcao = redacao.correcao
                    correcao.nota_final = data.get('nota_final')
                    import re
                    novo_coment = re.sub(r'\[ALERTA_COORDENACAO\][\s\S]*?\[/ALERTA_COORDENACAO\]\n?', '', correcao.comentario_geral)
                    correcao.comentario_geral = novo_coment
                    correcao.save()
                    NotaCompetencia.objects.filter(correcao=correcao).delete()
                    Anotacao.objects.filter(correcao=correcao).delete()
                else:
                    correcao = Correcao.objects.create(redacao=redacao, corretor=request.user, nota_final=data.get('nota_final'), comentario_geral='')
                    
                notas = data.get('notas', {})
                coments = data.get('comentarios', {})
                for i in range(1, 6):
                    str_i = str(i)
                    NotaCompetencia.objects.create(correcao=correcao, numero_competencia=i, nota=notas.get(str_i, 0), comentario=coments.get(str_i, ""))
                
                for an in data.get('anotacoes', []):
                    Anotacao.objects.create(correcao=correcao, competencia=an.get('competencia'), x=an.get('x'), y=an.get('y'), width=an.get('width'), height=an.get('height'), tipo_erro=an.get('tipo_erro', 'Erro'), texto=an.get('texto', ''))
                
                if not is_refacao and random.randint(1, 100) <= 5:
                    redacao.status = 'EM_QA' 
                else:
                    redacao.status = 'CORRIGIDA' 
                    
                redacao.data_inicio_correcao = None
                redacao.save()

                if not is_refacao:
                    config, _ = ConfiguracaoSistema.objects.get_or_create(id=1)
                    tipo_tema = redacao.tema.tipo if redacao.tema else 'ENEM'
                    valor_base = config.valor_pagamento_simples if tipo_tema == 'SIMPLES' else config.valor_pagamento_enem
                    carteira, _ = Carteira.objects.get_or_create(corretor=request.user)
                    if redacao.is_urgente or getattr(redacao, 'vip_pago', False):
                        carteira.qtd_vip_pendente += 1
                        carteira.saldo_atual += (valor_base + config.valor_bonus_vip)
                    else:
                        carteira.qtd_normal_pendente += 1
                        carteira.saldo_atual += valor_base
                    carteira.save()                
                
            return Response({"mensagem": "Salva!"}, status=200)
        except Exception as e:
            return Response({"erro": str(e)}, status=400)
        
class MinhaCarteiraView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCorretor]
    def get(self, request):
        carteira, _ = Carteira.objects.get_or_create(corretor=request.user)
        serializer = CarteiraSerializer(carteira)
        return Response(serializer.data)

class RespostaRapidaViewSet(viewsets.ModelViewSet):
    serializer_class = RespostaRapidaSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self): return RespostaRapida.objects.filter(corretor=self.request.user)
    def perform_create(self, serializer): serializer.save(corretor=self.request.user)

class GestaoRedacoesView(generics.ListAPIView):
    serializer_class = RedacaoSerializer 
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    queryset = Redacao.objects.all().order_by('-data_envio')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        
        corretores_ids = [d['corretor_atual'] for d in data if d.get('corretor_atual')]
        corretores_map = {u.id: f"{u.first_name} {u.last_name}".strip() or u.username for u in User.objects.filter(id__in=corretores_ids)}
        
        for item in data:
            if item.get('corretor_atual'):
                item['corretor_nome'] = corretores_map.get(item['corretor_atual'])
            else:
                item['corretor_nome'] = None
                
        return Response(data)

class ToggleUrgenciaView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    def post(self, request, pk):
        redacao = get_object_or_404(Redacao, pk=pk)
        if getattr(redacao, 'vip_pago', False):
            return Response({"erro": "Esta redação tem urgência paga pelo aluno e não pode ser rebaixada para normal."}, status=400)
        redacao.is_urgente = not redacao.is_urgente
        redacao.save()
        return Response({"mensagem": "Urgência alterada", "is_urgente": redacao.is_urgente}, status=200)

class ForcarLiberacaoView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    def post(self, request, pk):
        redacao = get_object_or_404(Redacao, pk=pk)
        
        if redacao.status == 'REFAZER' and redacao.corretor_atual:
            correcao = getattr(redacao, 'correcao', None)
            if correcao:
                corretor_anterior = redacao.corretor_atual
                config = ConfiguracaoSistema.objects.first()
                tipo_tema = redacao.tema.tipo if redacao.tema else 'ENEM'
                valor_base = config.valor_pagamento_simples if tipo_tema == 'SIMPLES' else config.valor_pagamento_enem
                
                carteira = Carteira.objects.filter(corretor=corretor_anterior).first()
                if carteira:
                    if redacao.is_urgente or getattr(redacao, 'vip_pago', False):
                        carteira.qtd_vip_pendente = max(0, carteira.qtd_vip_pendente - 1)
                        carteira.saldo_atual = max(0, float(carteira.saldo_atual) - float(valor_base + config.valor_bonus_vip))
                    else:
                        carteira.qtd_normal_pendente = max(0, carteira.qtd_normal_pendente - 1)
                        carteira.saldo_atual = max(0, float(carteira.saldo_atual) - float(valor_base))
                    carteira.save()
                
                correcao.delete()
            
            redacao.is_urgente = True 
        
        redacao.corretor_atual = None
        redacao.status = 'AGUARDANDO'
        redacao.data_inicio_correcao = None
        redacao.save()
        return Response({"mensagem": "Redação liberada para a fila!"}, status=200)

class ConfiguracaoView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        config, _ = ConfiguracaoSistema.objects.get_or_create(id=1)
        serializer = ConfiguracaoSerializer(config)
        return Response(serializer.data)
    def put(self, request):
        if not request.user.is_staff: return Response(status=403)
        config, _ = ConfiguracaoSistema.objects.get_or_create(id=1)
        serializer = ConfiguracaoSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

class PacoteViewSet(viewsets.ModelViewSet):
    serializer_class = PacoteSerializer
    def get_queryset(self):
        qs = Pacote.objects.all().order_by('-ativo', 'preco')
        if not self.request.user.is_staff:
            comprados = HistoricoCompra.objects.filter(aluno=self.request.user, pacote__isnull=False).values_list('pacote_id', flat=True)
            qs = qs.exclude(id__in=comprados, compra_unica=True)
        return qs
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']: return [permissions.IsAuthenticated(), IsAdminUser()]
        return [permissions.IsAuthenticated()]

class BannerVitrineViewSet(viewsets.ModelViewSet):
    serializer_class = BannerVitrineSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    def get_queryset(self):
        qs = BannerVitrine.objects.all().order_by('ordem', '-id')
        if not self.request.user.is_staff:
            qs = qs.filter(ativo=True)
            qs = qs.exclude(data_fim__lt=timezone.now())
            comprados = HistoricoCompra.objects.filter(aluno=self.request.user, pacote__isnull=False).values_list('pacote_id', flat=True)
            qs = qs.exclude(pacote_vinculado__in=comprados, pacote_vinculado__compra_unica=True)
        return qs
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']: return [permissions.IsAuthenticated(), IsAdminUser()]
        return [permissions.IsAuthenticated()]

class CupomViewSet(viewsets.ModelViewSet):
    queryset = Cupom.objects.all().order_by('-ativo', '-id')
    serializer_class = CupomSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

class ValidarCupomView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        codigo = request.data.get('codigo', '').strip().upper()
        if not codigo: return Response({"erro": "Código não informado."}, status=400)
        try:
            cupom = Cupom.objects.get(codigo=codigo)
            if not cupom.ativo: return Response({"erro": "Este cupom está inativo."}, status=400)
            if cupom.limite_usos > 0 and cupom.usos_atuais >= cupom.limite_usos: return Response({"erro": "Este cupom atingiu o limite de usos."}, status=400)
            if cupom.data_validade and cupom.data_validade < timezone.now(): return Response({"erro": "Este cupom já expirou."}, status=400)
            return Response({"mensagem": "Cupom aplicado com sucesso!", "desconto_percentual": cupom.desconto_percentual}, status=200)
        except Cupom.DoesNotExist:
            return Response({"erro": "Cupom inválido ou não existe."}, status=404)

class MinhaCarteiraAlunoView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        carteira, _ = CarteiraAluno.objects.get_or_create(aluno=request.user)
        serializer = CarteiraAlunoSerializer(carteira)
        return Response(serializer.data)

class ComprarPacoteView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        pacote_id = request.data.get('pacote_id')
        cupom_codigo = request.data.get('cupom_codigo', '').strip().upper()
        
        pacote = get_object_or_404(Pacote, pk=pacote_id)
        if not pacote.ativo: return Response({"erro": "Este pacote não está mais disponível."}, status=400)
        if pacote.compra_unica and HistoricoCompra.objects.filter(aluno=request.user, pacote=pacote).exists(): return Response({"erro": "Você já adquiriu este pacote promocional (Compra Única)."}, status=400)
        
        with transaction.atomic():
            preco_final = pacote.preco
            if cupom_codigo:
                try:
                    cupom = Cupom.objects.get(codigo=cupom_codigo, ativo=True)
                    if (cupom.limite_usos == 0 or cupom.usos_atuais < cupom.limite_usos) and (not cupom.data_validade or cupom.data_validade >= timezone.now()):
                        cupom.usos_atuais += 1
                        cupom.save()
                        preco_final = pacote.preco - (pacote.preco * (cupom.desconto_percentual / 100))
                except Cupom.DoesNotExist: pass 

            carteira, _ = CarteiraAluno.objects.get_or_create(aluno=request.user)
            carteira.saldo_simples += pacote.qtd_creditos_simples
            carteira.saldo_vip += pacote.qtd_creditos_vip
            carteira.save()
            HistoricoCompra.objects.create(aluno=request.user, pacote=pacote, valor_pago=preco_final, descricao=f"Pacote: {pacote.nome}")
            
        return Response({"mensagem": "Pagamento aprovado! Créditos liberados."}, status=200)

class ComprarAvulsoView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        qtd_simples = int(request.data.get('qtd_simples', 0))
        qtd_vip = int(request.data.get('qtd_vip', 0))
        cupom_codigo = request.data.get('cupom_codigo', '').strip().upper()

        if qtd_simples == 0 and qtd_vip == 0: return Response({"erro": "Selecione ao menos um crédito."}, status=400)

        config = ConfiguracaoSistema.objects.first()
        preco_un_normal = config.preco_avulso_normal if config else 9.90
        preco_un_vip = config.preco_avulso_vip if config else 14.90
        valor_total = (qtd_simples * preco_un_normal) + (qtd_vip * preco_un_vip)

        with transaction.atomic():
            if cupom_codigo:
                try:
                    cupom = Cupom.objects.get(codigo=cupom_codigo, ativo=True)
                    if (cupom.limite_usos == 0 or cupom.usos_atuais < cupom.limite_usos) and (not cupom.data_validade or cupom.data_validade >= timezone.now()):
                        cupom.usos_atuais += 1
                        cupom.save()
                        valor_total = valor_total - (valor_total * (cupom.desconto_percentual / 100))
                except Cupom.DoesNotExist: pass 

            carteira, _ = CarteiraAluno.objects.get_or_create(aluno=request.user)
            carteira.saldo_simples += qtd_simples
            carteira.saldo_vip += qtd_vip
            carteira.save()
            HistoricoCompra.objects.create(aluno=request.user, valor_pago=valor_total, descricao=f"Avulso: {qtd_simples} Normais, {qtd_vip} VIPs")
            
        return Response({"mensagem": "Créditos avulsos adicionados!"}, status=200)

class AdicionarCreditoManualView(APIView):
    permission_classes = [IsAdminUser] 
    
    def post(self, request, user_id):
        try:
            qtd_simples = int(request.data.get('qtd_simples', 0) or 0)
            qtd_vip = int(request.data.get('qtd_vip', 0) or 0)

            carteira = CarteiraAluno.objects.filter(aluno_id=user_id).first()
            
            if not carteira:
                user = User.objects.get(pk=user_id)
                carteira = CarteiraAluno.objects.create(aluno=user, saldo_simples=0, saldo_vip=0)

            carteira.saldo_simples += qtd_simples
            carteira.saldo_vip += qtd_vip
            carteira.save()

            return Response({
                'mensagem': 'Créditos atualizados com sucesso!',
                'novo_saldo_simples': carteira.saldo_simples,
                'novo_saldo_vip': carteira.saldo_vip
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'erro': f'Erro no servidor: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CorrecaoIAView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            redacao = Redacao.objects.get(pk=pk)
            texto_aluno = request.data.get('texto', '')
            tipo = request.data.get('tipo', 'ENEM')
            tema_titulo = request.data.get('tema', redacao.tema.titulo)

            if not texto_aluno and not redacao.arquivo:
                return Response({"erro": "A redação não possui texto nem foto para analisar."}, status=status.HTTP_400_BAD_REQUEST)

            imagem_para_ia = None
            if not texto_aluno and redacao.arquivo:
                try:
                    imagem_para_ia = Image.open(redacao.arquivo)
                except Exception as e:
                    return Response({"erro": f"Não foi possível processar a imagem da redação: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            contexto_aluno = f'Redação digitada: "{texto_aluno}"' if texto_aluno else 'Leia atentamente a redação manuscrita na imagem que enviei. Tente decifrar a caligrafia do aluno para poder avaliá-la.'

            if tipo == 'ENEM':
                prompt = f"""
                Você é um avaliador rigoroso do ENEM. Avalie a seguinte redação.
                Tema: "{tema_titulo}"
                {contexto_aluno}
                
                Gere APENAS um objeto JSON. NÃO escreva mais NADA além do JSON.
                Estrutura exata:
                {{
                    "notas": {{"1": 120, "2": 160, "3": 120, "4": 160, "5": 200}},
                    "comentarios": {{"1": "comentário curto", "2": "comentário", "3": "comentário", "4": "comentário", "5": "comentário"}}
                }}
                As notas permitidas são: 0, 40, 80, 120, 160, 200.
                """
            else:
                prompt = f"""
                Você é um avaliador de redação. 
                Tema: "{tema_titulo}". 
                {contexto_aluno}
                
                Gere APENAS um objeto JSON. NÃO escreva mais NADA além do JSON.
                Estrutura exata:
                {{
                    "notas": {{"1": 15, "2": 20, "3": 10, "4": 25}},
                    "comentarios": {{"1": "comentário curto", "2": "comentário", "3": "comentário", "4": "comentário"}}
                }}
                As notas permitidas são: 0, 5, 10, 15, 20 ou 25.
                """

            conteudo_envio = [prompt]
            if imagem_para_ia:
                conteudo_envio.append(imagem_para_ia)

            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=conteudo_envio
            )

            texto_sujo = response.text.strip()
            if "```json" in texto_sujo:
                texto_sujo = texto_sujo.split("```json")[1].split("```")[0].strip()
            elif "```" in texto_sujo:
                texto_sujo = texto_sujo.split("```")[1].split("```")[0].strip()
            
            dados_ia = json.loads(texto_sujo)
            
            return Response(dados_ia, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"erro": f"Erro interno: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ReportarProblemaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            redacao = Redacao.objects.get(pk=pk)
            motivo = request.data.get('motivo', 'Outros')
            obs = request.data.get('observacao', '')
            
            redacao.status = 'AUDITORIA'
            redacao.save()
            
            correcao, _ = Correcao.objects.get_or_create(redacao=redacao, corretor=request.user, defaults={'nota_final': 0})
            correcao.comentario_geral = f"[SINALIZADO: {motivo}]\nDetalhes do Professor: {obs}"
            correcao.save()

            return Response({"mensagem": "Redação enviada para a coordenação com sucesso."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"erro": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ResolverAuditoriaView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_staff: 
            return Response({"erro": "Acesso negado."}, status=status.HTTP_403_FORBIDDEN)

        try:
            redacao = Redacao.objects.get(pk=pk)
            acao = request.data.get('acao') 
            mensagem = request.data.get('mensagem', '')

            if acao == 'DEVOLVER_ALUNO':
                redacao.status = 'DEVOLVIDA'
                redacao.save()
                correcao = Correcao.objects.filter(redacao=redacao).first()
                if correcao:
                    correcao.comentario_geral = mensagem
                    correcao.save()
                
                carteira = CarteiraAluno.objects.get(aluno=redacao.aluno)
                if getattr(redacao, 'vip_pago', False): carteira.saldo_vip += 1
                else: carteira.saldo_simples += 1
                carteira.save()

            elif acao == 'VOLTAR_FILA':
                redacao.status = 'REFAZER' 
                redacao.save()
                correcao = Correcao.objects.filter(redacao=redacao).first()
                if not correcao:
                    correcao = Correcao.objects.create(redacao=redacao, corretor=redacao.corretor_atual, nota_final=0, comentario_geral='')
                
                correcao.comentario_geral = f"[ALERTA_COORDENACAO]\nFALSO POSITIVO: {mensagem}\n[/ALERTA_COORDENACAO]\n{correcao.comentario_geral}"
                correcao.save()

            elif acao == 'EXIGIR_REFACAO':
                redacao.status = 'REFAZER'
                redacao.save()
                correcao = Correcao.objects.filter(redacao=redacao).first()
                if correcao:
                    correcao.comentario_geral = f"[ALERTA_COORDENACAO]\nREFAÇÃO EXIGIDA (QA): {mensagem}\n[/ALERTA_COORDENACAO]\n{correcao.comentario_geral}"
                    correcao.save()
                
            return Response({"mensagem": "Auditoria resolvida com sucesso."}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"erro": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class MaterialApoioViewSet(viewsets.ModelViewSet):
    serializer_class = MaterialApoioSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff: return MaterialApoio.objects.all().order_by('-criado_em')
        elif getattr(user, 'is_corretor', False): return MaterialApoio.objects.filter(ativo=True, categoria__startswith='CORRETOR_').order_by('-criado_em')
        else: return MaterialApoio.objects.filter(ativo=True, categoria__startswith='ALUNO_').order_by('-criado_em')
        
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']: return [permissions.IsAuthenticated(), permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]
    
class SolicitarRecuperacaoSenhaView(APIView):
    permission_classes = [] 
    
    def post(self, request):
        email = request.data.get('email')
        user = User.objects.filter(email=email).first()
        
        if user:
            token_generator = PasswordResetTokenGenerator()
            token = token_generator.make_token(user)
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            
            link_frontend = f"http://localhost:5173/redefinir-senha/{uidb64}/{token}"
            assunto = "Recuperação de Senha - Guia do Texto"
            mensagem = f"""Olá {user.first_name},

            Recebemos um pedido para redefinir a senha da sua conta no Guia do Texto.

            Clique no link abaixo para criar uma nova senha:
            {link_frontend}

            Se não foi você que fez este pedido, pode ignorar este e-mail em segurança.

            Abraços,
            Equipe Guia do Texto
            """
            try:
                send_mail(assunto, mensagem, settings.DEFAULT_FROM_EMAIL, [user.email])
            except Exception as e:
                return Response({'erro': 'Erro no servidor de e-mail.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        return Response({'mensagem': 'Se o e-mail estiver registado, receberá um link em breve.'}, status=status.HTTP_200_OK)
    
class ConfirmarRedefinicaoSenhaView(APIView):
    permission_classes = [] 
    
    def post(self, request, uidb64, token):
        password = request.data.get('password')
        
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and PasswordResetTokenGenerator().check_token(user, token):
            user.set_password(password) 
            user.save()                 
            return Response({'mensagem': 'Senha redefinida com sucesso!'}, status=status.HTTP_200_OK)
        else:
            return Response({'erro': 'O link de recuperação é inválido ou já expirou.'}, status=status.HTTP_400_BAD_REQUEST)
        
class GerarPagamentoPixView(APIView):
    permission_classes = [IsAuthenticated] 

    def post(self, request):
        try:
            valor_total = float(request.data.get('valor_total', 0))
            descricao = request.data.get('descricao', 'Compra de Créditos - Guia do Texto')
            qtd_simples = int(request.data.get('qtd_simples', 0))
            qtd_vip = int(request.data.get('qtd_vip', 0))

            if valor_total <= 0:
                return Response({'erro': 'Valor inválido.'}, status=status.HTTP_400_BAD_REQUEST)

            sdk = mercadopago.SDK(settings.MERCADO_PAGO_ACCESS_TOKEN)

            email_comprador = request.user.email if request.user.email else "aluno@plataforma.com"
            nome_comprador = request.user.first_name if request.user.first_name else "Aluno"

            payment_data = {
                "transaction_amount": valor_total,
                "description": descricao,
                "payment_method_id": "pix",
                "payer": {
                    "email": email_comprador,
                    "first_name": nome_comprador,
                }
            }

            request_options = mercadopago.config.RequestOptions()
            request_options.custom_headers = {
                'x-idempotency-key': str(uuid.uuid4())
            }

            result = sdk.payment().create(payment_data, request_options)
            payment = result["response"]

            if "id" not in payment:
                mensagem_erro = "O Mercado Pago recusou a transação."
                if "cause" in payment and len(payment["cause"]) > 0:
                    mensagem_erro = f"Erro MP: {payment['cause'][0].get('description', '')}"

                return Response({'erro': mensagem_erro}, status=status.HTTP_400_BAD_REQUEST)

            Transacao.objects.create(
                aluno=request.user,
                pagamento_id=str(payment["id"]),
                valor=valor_total,
                descricao=descricao,
                status='PENDENTE',
                qtd_simples=qtd_simples,
                qtd_vip=qtd_vip
            )

            qr_code = payment["point_of_interaction"]["transaction_data"]["qr_code"]
            qr_code_base64 = payment["point_of_interaction"]["transaction_data"]["qr_code_base64"]

            return Response({
                'qr_code': qr_code,
                'qr_code_base64': qr_code_base64,
                'pagamento_id': payment["id"]
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'erro': f'Erro no servidor: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class VerificarStatusPixView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pagamento_id):
        try:
            sdk = mercadopago.SDK(settings.MERCADO_PAGO_ACCESS_TOKEN)
            payment_info = sdk.payment().get(pagamento_id)
            status_mp = payment_info["response"].get("status")

            transacao = Transacao.objects.filter(pagamento_id=pagamento_id, aluno=request.user).first()
            
            if not transacao:
                return Response({'erro': 'Transação não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

            if status_mp == 'approved' and transacao.status != 'APROVADO':
                transacao.status = 'APROVADO'
                transacao.save()

                from .models import CarteiraAluno 
                carteira, created = CarteiraAluno.objects.get_or_create(aluno=request.user)
                carteira.saldo_simples += transacao.qtd_simples
                carteira.saldo_vip += transacao.qtd_vip
                carteira.save()

            return Response({'status': status_mp}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class GerarLinkPagamentoCartaoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            valor_total = float(request.data.get('valor_total', 0))
            descricao = request.data.get('descricao', 'Compra de Créditos - Guia do Texto')
            qtd_simples = int(request.data.get('qtd_simples', 0))
            qtd_vip = int(request.data.get('qtd_vip', 0))
            max_parcelas = int(request.data.get('max_parcelas', 1)) 

            if valor_total <= 0:
                return Response({'erro': 'Valor inválido.'}, status=status.HTTP_400_BAD_REQUEST)

            transacao = Transacao.objects.create(
                aluno=request.user,
                valor=valor_total,
                descricao=descricao,
                status='PENDENTE',
                qtd_simples=qtd_simples,
                qtd_vip=qtd_vip
            )

            sdk = mercadopago.SDK(settings.MERCADO_PAGO_ACCESS_TOKEN)
            url_site = "http://localhost:5173" 
            email_comprador = request.user.email if request.user.email else "aluno@plataforma.com"

            preference_data = {
                "items": [
                    {
                        "title": descricao,
                        "quantity": 1,
                        "currency_id": "BRL",
                        "unit_price": valor_total
                    }
                ],
                "payer": {
                    "name": request.user.first_name or "Aluno",
                    "email": email_comprador,
                },
                "back_urls": {
                    "success": f"{url_site}/painel-aluno?aba=loja&pagamento_mp=sucesso&transacao_id={transacao.id}",
                    "failure": f"{url_site}/painel-aluno?aba=loja&pagamento_mp=falha",
                    "pending": f"{url_site}/painel-aluno?aba=loja&pagamento_mp=pendente"
                },
                "external_reference": str(transacao.id),
                "payment_methods": {
                    "installments": max_parcelas 
                }
            }

            preference_response = sdk.preference().create(preference_data)
            preference = preference_response["response"]

            if "init_point" not in preference:
                return Response({'erro': "O Mercado Pago recusou a geração do link."}, status=status.HTTP_400_BAD_REQUEST)

            return Response({
                'link_pagamento': preference["init_point"],
                'transacao_id': transacao.id 
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ProcessarRetornoMercadoPagoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        payment_id = request.data.get('payment_id')
        transacao_id = request.data.get('transacao_id')

        try:
            sdk = mercadopago.SDK(settings.MERCADO_PAGO_ACCESS_TOKEN)
            payment_info = sdk.payment().get(payment_id)
            status_mp = payment_info["response"].get("status")

            transacao = Transacao.objects.filter(id=transacao_id, aluno=request.user).first()
            
            if transacao and status_mp == 'approved' and transacao.status != 'APROVADO':
                transacao.status = 'APROVADO'
                transacao.pagamento_id = str(payment_id)
                transacao.save()

                from .models import CarteiraAluno
                carteira, _ = CarteiraAluno.objects.get_or_create(aluno=request.user)
                carteira.saldo_simples += transacao.qtd_simples
                carteira.saldo_vip += transacao.qtd_vip
                carteira.save()

                return Response({'mensagem': 'Aprovado com sucesso!'}, status=status.HTTP_200_OK)
            
            return Response({'mensagem': 'Já processado ou aguardando pagamento.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class GestaoFinanceiraView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        try:
            from .models import Transacao, HistoricoCompra, Carteira
            from django.contrib.auth import get_user_model
            from django.utils import timezone
            
            hoje = timezone.now()
            inicio_mes = hoje.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            faturamento_total = 0
            faturamento_mes = 0
            aguardando_pagamento = 0

            todas_transacoes = Transacao.objects.all()
            for t in todas_transacoes:
                if getattr(t, 'tipo', '') in ['CREDITO', 'DEBITO']:
                    continue
                    
                status_t = getattr(t, 'status', '').upper()
                valor_t = float(getattr(t, 'valor', 0) or 0)
                data_t = getattr(t, 'data_atualizacao', getattr(t, 'criado_em', getattr(t, 'data_criacao', getattr(t, 'data_envio', getattr(t, 'data', None)))))
                
                is_este_mes = True
                if data_t:
                    try:
                        if data_t < inicio_mes:
                            is_este_mes = False
                    except:
                        pass 
                        
                if status_t == 'APROVADO':
                    faturamento_total += valor_t
                    if is_este_mes:
                        faturamento_mes += valor_t
                elif status_t == 'PENDENTE':
                    if is_este_mes:
                        aguardando_pagamento += valor_t

            todos_historicos = HistoricoCompra.objects.all()
            for h in todos_historicos:
                valor_h = float(getattr(h, 'valor_pago', 0) or 0)
                data_h = getattr(h, 'data_compra', getattr(h, 'criado_em', getattr(h, 'data', None)))
                
                is_este_mes = True
                if data_h:
                    try:
                        if data_h < inicio_mes:
                            is_este_mes = False
                    except:
                        pass
                        
                faturamento_total += valor_h
                if is_este_mes:
                    faturamento_mes += valor_h

            User = get_user_model()
            corretores = User.objects.filter(is_corretor=True)
            
            lista_pagamentos = []
            total_a_pagar = 0

            for prof in corretores:
                carteira = Carteira.objects.filter(corretor=prof).first()
                saldo_devido = float(getattr(carteira, 'saldo_atual', 0) or 0)
                
                if saldo_devido > 0:
                    total_a_pagar += saldo_devido
                    nome_completo = f"{prof.first_name or ''} {prof.last_name or ''}".strip()
                    if not nome_completo: nome_completo = prof.username
                    
                    pendente = PagamentoCorretor.objects.filter(
                        corretor=prof,
                        status__in=['AGUARDANDO_RECIBO', 'EM_ANALISE', 'RECUSADO']
                    ).order_by('-data_solicitacao').first()
                    
                    lista_pagamentos.append({
                        'corretor_id': prof.id,
                        'nome': nome_completo,
                        'email': prof.email,
                        'telefone': getattr(prof, 'telefone', 'Não informado'),
                        'chave_pix': getattr(prof, 'chave_pix', ''),
                        'tipo_chave_pix': getattr(prof, 'tipo_chave_pix', ''),
                        'banco': getattr(prof, 'banco', ''),
                        'agencia_conta': getattr(prof, 'agencia_conta', ''),
                        'valor_a_receber': saldo_devido,
                        'saque_solicitado': getattr(carteira, 'saque_solicitado', False),
                        'qtd_normal': getattr(carteira, 'qtd_normal_pendente', 0),
                        'qtd_vip': getattr(carteira, 'qtd_vip_pendente', 0),
                        
                        'pagamento_id': pendente.id if pendente else None,
                        'status_pagamento': pendente.status if pendente else None,
                        'arquivo_recibo_url': pendente.arquivo_recibo.url if pendente and pendente.arquivo_recibo else None,
                        'motivo_recusa': pendente.motivo_recusa if pendente else None,
                    })

            pagamentos_historico = PagamentoCorretor.objects.all().order_by('-data_pagamento', '-data_solicitacao')
            lista_historico_pagamentos = []
            for p in pagamentos_historico:
                nome_completo = f"{p.corretor.first_name or ''} {p.corretor.last_name or ''}".strip()
                if not nome_completo: nome_completo = p.corretor.username
                lista_historico_pagamentos.append({
                    'id': p.id,
                    'corretor_nome': nome_completo,
                    'email': p.corretor.email,
                    'data_solicitacao': p.data_solicitacao, 
                    'data_pagamento': p.data_pagamento,
                    'valor': float(p.valor),
                    'qtd_normal': p.qtd_normal,
                    'qtd_vip': p.qtd_vip,
                    'status': p.status, 
                    'arquivo_recibo_url': p.arquivo_recibo.url if p.arquivo_recibo else None 
                })

            return Response({
                'faturamento_total': faturamento_total,
                'faturamento_mes': faturamento_mes,
                'lucro_bruto_estimado': faturamento_mes - total_a_pagar,
                'total_a_pagar_corretores': total_a_pagar,
                'aguardando_pagamento': aguardando_pagamento, 
                'folha_pagamento': lista_pagamentos,
                'historico_pagamentos': lista_historico_pagamentos 
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerificarPagamentoMPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, transacao_id):
        try:
            from .models import Transacao, CarteiraAluno
            transacao = Transacao.objects.get(id=transacao_id, aluno=request.user)
            
            if transacao.status == 'APROVADO':
                return Response({'mensagem': 'Já processado.', 'status': 'APROVADO'}, status=status.HTTP_200_OK)

            sdk = mercadopago.SDK(settings.MERCADO_PAGO_ACCESS_TOKEN)
            
            filters = {"external_reference": str(transacao.id)}
            search_result = sdk.payment().search(filters)
            
            pagamentos = search_result["response"].get("results", [])
            
            aprovado = False
            for pag in pagamentos:
                if pag.get("status") == "approved":
                    aprovado = True
                    break
            
            if aprovado:
                transacao.status = 'APROVADO'
                transacao.save()
                
                carteira, created = CarteiraAluno.objects.get_or_create(aluno=request.user)
                carteira.saldo_simples += transacao.qtd_simples
                carteira.saldo_vip += transacao.qtd_vip
                carteira.save()
                
                return Response({'mensagem': 'Pagamento aprovado e créditos adicionados!', 'status': 'APROVADO'}, status=status.HTTP_200_OK)
            else:
                return Response({'mensagem': 'Pagamento ainda consta como pendente.', 'status': 'PENDENTE'}, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({'erro': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AssistenteSuporteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        mensagem_usuario = request.data.get('mensagem', '')

        if not mensagem_usuario:
            return Response({'erro': 'A mensagem não pode estar vazia.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            from .models import Pacote, ConfiguracaoSistema
            
            pacotes_ativos = Pacote.objects.filter(ativo=True)
            lista_pacotes_ia = ""
            for p in pacotes_ativos:
                lista_pacotes_ia += f"- {p.nome}: R$ {p.preco} (Dá direito a {p.qtd_creditos_simples} correções normais e {p.qtd_creditos_vip} VIPs)\n"
            
            if not lista_pacotes_ia:
                lista_pacotes_ia = "Nenhum pacote promocional disponível no momento."

            config = ConfiguracaoSistema.objects.first()
            preco_normal = config.preco_avulso_normal if config else 9.90
            preco_vip = config.preco_avulso_vip if config else 14.90

            regra_sistema = f"""
            Você é a assistente virtual de suporte da plataforma 'Guia do Texto'.
            Sua missão é ajudar os alunos a navegar no sistema, tirar dúvidas sobre prazos e explicar nossos pacotes de correção.
            Seja extremamente educada, prestativa e use um tom amigável.
            
            REGRA ABSOLUTA 1: Você NUNCA deve corrigir redações ou dar dicas de gramática. Direcione para a compra de pacotes.
            
            REGRA ABSOLUTA 2 (COMO ENVIAR REDAÇÃO): Se um aluno perguntar como enviar um texto ou redação para correção, responda com este exato passo a passo de forma natural:
            1. No painel principal, clique na aba 'Treinar Redação'.
            2. Selecione o Tema sobre o qual deseja escrever, a plataforma utiliza dois tipos de correção, ENEM ou Simples.
            3. Você pode digitar o texto diretamente na plataforma selecionando "Editor Digital" OU anexar uma foto bem legível da sua redação manuscrita selecionando "Modo Manuscrito", sugerimos o "Modo Manuscrito" pois seria uma simulação mais próxima da realidade.
            4. É necessário ter 'Créditos' na carteira (Simples ou VIP). Se não tiver, basta acessar a 'Loja de Créditos' no sistema para adquirir créditos avulso ou um pacote.
            5. No "Editor Digital" você pode preencher a redação online e para enviar clique no botão "Enviar Redação".            
            6. No "Modo Manuscrito" clique em "Imprimir Folha Oficial" para preencher a folha manualmente e depois enviar para a plataforma, você pode imprimir também a proposta da redação para facilitar, após preencher a redação clique no botão "Anexar e Enviar" para anexar sua redação preenchida e clique em "Confirmar Envio".
            7. Você pode clicar no botão "Brainstorm com IA" para obter repertórios para te ajudar na redação, tanto no "Modo Manuscrito" quanto no "Editor Digital".
            8. Após enviar é só aguardar a correção detalhada dos nossos professores!
            
            Se o aluno perguntar sobre onde ver suas redações corrigidas, explique que é só clicar na aba Minhas Redações e que em Meu Painel ele conseguirá ver um Dashboard com seus pontos e temas corrigidos.

            Se o aluno perguntar sobre se ocorrer algum tipo problema com a sua redação, explique que ele deve ficar tranquilo porque a equipe do Guia do Texto analisará o problema e se for preciso ele terá o crédito de volta.
            
            Se o aluno perguntar sobre a diferença de urgência, explique que a redação VIP passa na frente da fila e é corrigida mais rápido.

            INFORMAÇÕES DE VENDAS ATUALIZADAS:
            O aluno pode comprar créditos avulsos ou pacotes completos.
            Preços dos Créditos Avulsos:
            - Correção Normal: R$ {preco_normal}
            - Correção VIP: R$ {preco_vip}
            
            Pacotes Promocionais Disponíveis Atualmente:
            {lista_pacotes_ia}
            """

            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=mensagem_usuario,
                config=types.GenerateContentConfig(
                    system_instruction=regra_sistema,
                    temperature=0.3,
                )
            )
            
            return Response({'resposta': response.text}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'erro': f'Ocorreu um erro na assistente: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# =======================================================================
# NOVO FLUXO FINANCEIRO E DE RPA
# =======================================================================

class SolicitarSaqueView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        
        tem_pendencia = Redacao.objects.filter(status='REFAZER', corretor_atual=request.user).exists()
        if tem_pendencia:
            return Response({"erro": "Você possui redações pendentes em REFAÇÃO. Corrija-as antes de solicitar o saque."}, status=400)

        carteira, _ = Carteira.objects.get_or_create(corretor=request.user)
        
        if carteira.saldo_atual <= 0:
            return Response({"erro": "Você não possui saldo para saque."}, status=400)

        pendente = PagamentoCorretor.objects.filter(
            corretor=request.user,
            status__in=['AGUARDANDO_RECIBO', 'EM_ANALISE']
        ).exists()
        
        if pendente:
            return Response({"erro": "Você já possui uma solicitação de saque em andamento."}, status=400)

        pagamento = PagamentoCorretor.objects.create(
            corretor=request.user,
            valor=carteira.saldo_atual,
            qtd_normal=carteira.qtd_normal_pendente,
            qtd_vip=carteira.qtd_vip_pendente,
            status='AGUARDANDO_RECIBO'
        )
        
        carteira.saque_solicitado = True
        carteira.save()

        config = ConfiguracaoSistema.objects.first()
        return Response({
            "mensagem": "Saque solicitado! Por favor, gere e anexe o recibo assinado.",
            "pagamento_id": pagamento.id,
            "empresa_cnpj": config.cnpj_plataforma if config else "00.000.000/0001-00",
            "empresa_razao_social": config.razao_social_plataforma if config else "Guia do Texto Plataforma Educacional"
        }, status=201)

class EnviarReciboCorretorView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        pagamento = get_object_or_404(PagamentoCorretor, pk=pk, corretor=request.user)
        arquivo = request.FILES.get('arquivo_recibo')

        if not arquivo:
            return Response({"erro": "Por favor, selecione o arquivo do recibo assinado."}, status=400)

        pagamento.arquivo_recibo = arquivo
        pagamento.status = 'EM_ANALISE'
        pagamento.motivo_recusa = None
        pagamento.save()

        return Response({"mensagem": "Recibo enviado para análise financeira com sucesso!"}, status=200)

class BaixarPagamentoView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        pagamento = get_object_or_404(PagamentoCorretor, pk=pk)
        
        pagamento.status = 'PAGO'
        pagamento.data_pagamento = timezone.now()
        pagamento.save()

        carteira = Carteira.objects.filter(corretor=pagamento.corretor).first()
        if carteira:
            carteira.saldo_atual = max(0, float(carteira.saldo_atual) - float(pagamento.valor))
            carteira.qtd_normal_pendente = max(0, carteira.qtd_normal_pendente - pagamento.qtd_normal)
            carteira.qtd_vip_pendente = max(0, carteira.qtd_vip_pendente - pagamento.qtd_vip)
            carteira.saque_solicitado = False
            carteira.save()

        return Response({"mensagem": f"Pagamento #{pagamento.id} marcado como PAGO com sucesso!"}, status=200)

class RecusarReciboView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        pagamento = get_object_or_404(PagamentoCorretor, pk=pk)
        motivo = request.data.get('motivo_recusa', 'Recibo ilegível ou sem assinatura.')

        pagamento.status = 'RECUSADO'
        pagamento.motivo_recusa = motivo
        pagamento.save()

        return Response({"mensagem": "Recibo recusado. O corretor foi notificado para reenvio."}, status=200)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enviar_avaliacao_corretor(request, pk):
    try:
        redacao = Redacao.objects.get(pk=pk, aluno=request.user)
        if hasattr(redacao, 'correcao') and redacao.correcao:
            redacao.correcao.avaliacao_aluno = request.data.get('nota', 0)
            redacao.correcao.comentario_avaliacao = request.data.get('comentario', '')
            redacao.correcao.save()
            return Response({'sucesso': True})
        return Response({'erro': 'Correção não encontrada.'}, status=400)
    except Exception as e:
        return Response({'erro': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def solicitar_recurso_redacao(request, pk):
    try:
        redacao = Redacao.objects.get(pk=pk, aluno=request.user)
        motivo = request.data.get('motivo', '')
        
        redacao.status = 'AUDITORIA' 
        
        if hasattr(redacao, 'correcao') and redacao.correcao:
            aviso_recurso = f"\n\n--- RECURSO SOLICITADO PELO ALUNO ---\nMotivo: {motivo}"
            if redacao.correcao.comentario_geral:
                redacao.correcao.comentario_geral += aviso_recurso
            else:
                redacao.correcao.comentario_geral = aviso_recurso
            redacao.correcao.save()
            
        redacao.save()
        return Response({'sucesso': True})
    except Exception as e:
        return Response({'erro': str(e)}, status=500)