import json
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_str, force_bytes
from django.contrib.auth import get_user_model, authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token # type: ignore
from google.auth.transport import requests as google_requests # type: ignore

User = get_user_model()

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)

class LoginView(APIView):
    permission_classes = [] 
    def post(self, request):
        user = authenticate(username=request.data.get('username'), password=request.data.get('password'))
        if user:
            if not user.is_active: return Response({'erro': 'Conta suspensa.'}, status=403)
            return Response({'token': get_tokens_for_user(user)})
        return Response({'erro': 'Credenciais inválidas'}, status=401)

class CadastrarUsuarioView(APIView):
    permission_classes = [] 
    def post(self, request):
        email = request.data.get('email')
        if User.objects.filter(email=email).exists() or User.objects.filter(username=email).exists():
            return Response({'erro': 'Este e-mail já está cadastrado.'}, status=400)
        User.objects.create_user(username=email, email=email, password=request.data.get('password'), first_name=request.data.get('first_name'), last_name=request.data.get('last_name', ''))
        return Response({'mensagem': 'Conta criada com sucesso'}, status=201)

class GoogleLoginView(APIView):
    permission_classes = [] 
    def post(self, request):
        try:
            idinfo = id_token.verify_oauth2_token(request.data.get('token'), google_requests.Request(), "252614378664-uss5jg10rpk5u0vnkko9r8fl9vc69vdt.apps.googleusercontent.com")
            email = idinfo['email']
            user = User.objects.filter(email=email).first()
            if not user:
                user = User.objects.create_user(username=email, email=email, first_name=idinfo.get('given_name', ''), last_name=idinfo.get('family_name', ''))
                user.set_unusable_password(); user.save()
            if not user.is_active: return Response({'erro': 'Conta suspensa.'}, status=403)
            return Response({'token': get_tokens_for_user(user)})
        except ValueError: return Response({'erro': 'Token do Google inválido'}, status=400)

class CandidaturaCorretorView(APIView):
    permission_classes = [] 
    parser_classes = [MultiPartParser, FormParser, JSONParser] 
    def post(self, request):
        email = request.data.get('email'); cpf = request.data.get('cpf')
        if User.objects.filter(email=email).exists(): return Response({'erro': 'E-mail cadastrado.'}, status=400)
        if cpf and User.objects.filter(cpf=cpf).exists(): return Response({'erro': 'CPF cadastrado.'}, status=400)
        try:
            agencia = request.data.get('agencia', ''); conta = request.data.get('conta', '')
            user = User.objects.create_user(
                username=email, email=email, password=request.data.get('password'), first_name=request.data.get('first_name'), last_name=request.data.get('last_name', ''), 
                is_active=False, is_corretor=True, cpf=cpf, telefone=request.data.get('telefone'), minibio=request.data.get('minibio'),
                tipo_chave_pix=request.data.get('tipo_chave_pix'), chave_pix=request.data.get('chave_pix'), banco=request.data.get('banco'), 
                agencia_conta=f"Ag: {agencia} Cc: {conta}" if (agencia or conta) else "",
            )
            if request.data.get('formacoes'): user.formacoes = json.loads(request.data.get('formacoes')) if isinstance(request.data.get('formacoes'), str) else request.data.get('formacoes')
            if request.data.get('experiencias'): user.experiencias = json.loads(request.data.get('experiencias')) if isinstance(request.data.get('experiencias'), str) else request.data.get('experiencias')
            if 'curriculo' in request.FILES: user.curriculo = request.FILES['curriculo']
            user.save()
            return Response({'mensagem': 'Candidatura enviada!'}, status=201)
        except Exception as e: return Response({'erro': str(e)}, status=400)

class MeusDadosView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser] 
    def get(self, request):
        f = request.user.formacoes; e = request.user.experiencias
        if isinstance(f, str):
            try: f = json.loads(f)
            except: f = []
        if isinstance(e, str):
            try: e = json.loads(e)
            except: e = []
        return Response({
            "id": request.user.id, "username": request.user.username, "email": request.user.email, "first_name": request.user.first_name, "last_name": request.user.last_name,
            "telefone": getattr(request.user, 'telefone', ''), "cpf": getattr(request.user, 'cpf', ''), "chave_pix": getattr(request.user, 'chave_pix', ''),
            "tipo_chave_pix": getattr(request.user, 'tipo_chave_pix', ''), "banco": getattr(request.user, 'banco', ''), "agencia_conta": getattr(request.user, 'agencia_conta', ''),
            "minibio": getattr(request.user, 'minibio', ''), "formacoes": f or [], "experiencias": e or [],
            "is_corretor": getattr(request.user, 'is_corretor', False), "is_coordenador": getattr(request.user, 'is_coordenador', False), 
            "is_financeiro": getattr(request.user, 'is_financeiro', False), "is_staff": request.user.is_staff, "is_superuser": request.user.is_superuser,
            "foto_perfil": request.user.foto_perfil.url if request.user.foto_perfil else None
        })
    def patch(self, request):
        user = request.user; data = request.data
        for k in ['first_name', 'last_name', 'telefone', 'cpf', 'chave_pix', 'tipo_chave_pix', 'banco', 'minibio']:
            if k in data: setattr(user, k, data[k])
        if 'password' in data and data['password'].strip(): user.set_password(data['password'])
        if 'formacoes' in data:
            try: user.formacoes = json.loads(data['formacoes'])
            except: user.formacoes = data['formacoes']
        if 'experiencias' in data:
            try: user.experiencias = json.loads(data['experiencias'])
            except: user.experiencias = data['experiencias']
        if 'foto_perfil' in request.FILES: user.foto_perfil = request.FILES['foto_perfil']
        if data.get('agencia') or data.get('conta'): user.agencia_conta = f"Ag: {data.get('agencia', '')} Cc: {data.get('conta', '')}"
        elif 'agencia' in data and 'conta' in data: user.agencia_conta = ""
        user.save()
        return Response({"mensagem": "Atualizado!"}, status=200)

class SolicitarRecuperacaoSenhaView(APIView):
    permission_classes = [] 
    def post(self, request):
        user = User.objects.filter(email=request.data.get('email')).first()
        if user:
            try: send_mail("Recuperação de Senha", f"Clique no link: http://localhost:5173/redefinir-senha/{urlsafe_base64_encode(force_bytes(user.pk))}/{PasswordResetTokenGenerator().make_token(user)}", settings.DEFAULT_FROM_EMAIL, [user.email])
            except Exception: return Response({'erro': 'Erro no servidor de e-mail.'}, status=500)
        return Response({'mensagem': 'Se o e-mail estiver registado, receberá um link.'}, status=200)
    
class ConfirmarRedefinicaoSenhaView(APIView):
    permission_classes = [] 
    def post(self, request, uidb64, token):
        try: user = User.objects.get(pk=force_str(urlsafe_base64_decode(uidb64)))
        except: user = None
        if user and PasswordResetTokenGenerator().check_token(user, token): user.set_password(request.data.get('password')); user.save(); return Response({'mensagem': 'Sucesso!'}, status=200)
        return Response({'erro': 'Link inválido.'}, status=400)