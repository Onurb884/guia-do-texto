import random
import json
from PIL import Image
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, generics, viewsets
from google import genai
from .models import Redacao, Correcao, NotaCompetencia, Anotacao, Carteira, ConfiguracaoSistema, PagamentoCorretor, RespostaRapida
from .serializers import RedacaoFilaSerializer, CarteiraSerializer, RespostaRapidaSerializer
from .permissions import IsCorretor
from rest_framework.parsers import MultiPartParser, FormParser

def limpar_redacoes_expiradas():
    config, _ = ConfiguracaoSistema.objects.get_or_create(id=1)
    agora = timezone.now()
    for redacao in Redacao.objects.filter(status__in=['EM_CORRECAO', 'REFAZER'], data_inicio_correcao__isnull=False):
        minutos_limite = config.tempo_limite_simples_minutos if (redacao.tema.tipo if redacao.tema else 'ENEM') == 'SIMPLES' else config.tempo_limite_enem_minutos
        if agora > redacao.data_inicio_correcao + timedelta(minutes=minutos_limite):
            if hasattr(redacao, 'correcao'): 
                redacao.status = 'REFAZER' 
            else: 
                redacao.status = 'AGUARDANDO'
                redacao.corretor_atual = None
            redacao.data_inicio_correcao = None
            redacao.save()

class FilaCorrecaoView(generics.ListAPIView):
    serializer_class = RedacaoFilaSerializer 
    permission_classes = [permissions.IsAuthenticated, IsCorretor]
    def get_queryset(self):
        limpar_redacoes_expiradas()
        # Se a redação estiver com status TRIAGEM ou EM_AUDITORIA, ela NÃO aparece aqui, mesmo que o corretor seja o dono. Mágica perfeita!
        return (Redacao.objects.filter(status__in=['AGUARDANDO', 'EM_CORRECAO']) | Redacao.objects.filter(status='REFAZER', corretor_atual=self.request.user)).distinct().order_by('data_envio')

class HistoricoCorretorView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCorretor]
    def get(self, request):
        correcoes = Correcao.objects.filter(corretor=request.user, redacao__status__in=['CORRIGIDA', 'EM_QA', 'FINALIZADA']).select_related('redacao', 'redacao__tema').order_by('-data_correcao')
        dados = []
        for c in correcoes:
            dados.append({ "id": c.redacao.id, "tema_titulo": c.redacao.tema.titulo if c.redacao.tema else "Sem tema", "tema_tipo": c.redacao.tema.tipo if c.redacao.tema else "ENEM", "data_envio": c.redacao.data_envio, "data_correcao": c.data_correcao, "nota_final": c.nota_final, "avaliacao_aluno": getattr(c, 'avaliacao_aluno', 0) })
        return Response(dados, status=200)

class IniciarCorrecaoView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCorretor]
    def post(self, request, pk):
        redacao = get_object_or_404(Redacao, pk=pk)
        if redacao.status in ['EM_CORRECAO', 'REFAZER'] and redacao.corretor_atual and redacao.corretor_atual != request.user: 
            return Response({"erro": "Já com outro corretor."}, status=409)
        redacao.corretor_atual = request.user
        if redacao.status != 'REFAZER': 
            redacao.status = 'EM_CORRECAO'
        redacao.data_inicio_correcao = timezone.now()
        redacao.save()
        config, _ = ConfiguracaoSistema.objects.get_or_create(id=1)
        minutos = config.tempo_limite_simples_minutos if (redacao.tema.tipo if redacao.tema else 'ENEM') == 'SIMPLES' else config.tempo_limite_enem_minutos
        return Response({"mensagem": "Iniciada.", "minutos_limite": minutos}, status=200)

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
            
            with transaction.atomic():
                is_refacao = hasattr(redacao, 'correcao')
                if is_refacao:
                    correcao = redacao.correcao
                    correcao.nota_final = data.get('nota_final')
                    import re
                    correcao.comentario_geral = re.sub(r'\[ALERTA_COORDENACAO\][\s\S]*?\[/ALERTA_COORDENACAO\]\n?', '', correcao.comentario_geral)
                    correcao.save()
                    NotaCompetencia.objects.filter(correcao=correcao).delete()
                    Anotacao.objects.filter(correcao=correcao).delete()
                else: 
                    correcao = Correcao.objects.create(redacao=redacao, corretor=request.user, nota_final=data.get('nota_final'), comentario_geral='')
                    
                notas = data.get('notas', {})
                coments = data.get('comentarios', {})
                for i in range(1, 6): 
                    NotaCompetencia.objects.create(correcao=correcao, numero_competencia=i, nota=notas.get(str(i), 0), comentario=coments.get(str(i), ""))
                for an in data.get('anotacoes', []): 
                    Anotacao.objects.create(correcao=correcao, competencia=an.get('competencia'), x=an.get('x'), y=an.get('y'), width=an.get('width'), height=an.get('height'), tipo_erro=an.get('tipo_erro', 'Erro'), texto=an.get('texto', ''))
                
                redacao.status = 'EM_QA' if not is_refacao and random.randint(1, 100) <= 5 else 'CORRIGIDA'
                redacao.data_inicio_correcao = None
                redacao.save()

                if not is_refacao:
                    config, _ = ConfiguracaoSistema.objects.get_or_create(id=1)
                    valor_base = config.valor_pagamento_simples if (redacao.tema.tipo if redacao.tema else 'ENEM') == 'SIMPLES' else config.valor_pagamento_enem
                    carteira, _ = Carteira.objects.get_or_create(corretor=request.user)
                    if redacao.is_urgente or getattr(redacao, 'vip_pago', False): 
                        carteira.qtd_vip_pendente += 1
                        carteira.saldo_atual += (valor_base + config.valor_bonus_vip)
                    else: 
                        carteira.qtd_normal_pendente += 1
                        carteira.saldo_atual += valor_base
                    carteira.save()                
            return Response({"mensagem": "Salva!"}, status=200)
        except Exception as e: return Response({"erro": str(e)}, status=400)

class ReportarProblemaView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCorretor]

    def post(self, request, pk):
        try:
            redacao = Redacao.objects.get(pk=pk)
            tipo_problema = request.data.get('tipo_problema', 'TRIAGEM') 
            motivo = request.data.get('motivo', 'Outros')
            obs = request.data.get('observacao', '')

            # APENAS PAUSAMOS O CRONÔMETRO, MAS MANTEMOS O CORRETOR ATUAL!
            redacao.data_inicio_correcao = None

            correcao, _ = Correcao.objects.get_or_create(redacao=redacao, corretor=request.user, defaults={'nota_final': 0})

            if tipo_problema == 'FALHA_GRAVE':
                redacao.status = 'EM_AUDITORIA'
                correcao.comentario_geral = f"[FALHA GRAVE REPORTADA: {motivo}]\nObservação do Corretor: {obs}"
            else:
                redacao.status = 'TRIAGEM'
                correcao.comentario_geral = f"[TRIAGEM TÉCNICA: {motivo}]\nObservação do Corretor: {obs}"

            correcao.save()
            redacao.save()

            return Response({"mensagem": "Enviada para a coordenação com sucesso!"}, status=200)

        except Exception as e:
            return Response({"erro": str(e)}, status=400)

class CorrecaoIAView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, pk):
        try:
            redacao = Redacao.objects.get(pk=pk)
            texto_aluno = request.data.get('texto', '')
            tipo = request.data.get('tipo', 'ENEM')
            tema_titulo = request.data.get('tema', redacao.tema.titulo)
            if not texto_aluno and not redacao.arquivo: return Response({"erro": "Sem texto/foto."}, status=400)
            
            imagem_para_ia = None
            if not texto_aluno and redacao.arquivo:
                try: imagem_para_ia = Image.open(redacao.arquivo)
                except Exception: return Response({"erro": "Erro na imagem."}, status=400)

            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            contexto_aluno = f'Redação digitada: "{texto_aluno}"' if texto_aluno else 'Leia a redação manuscrita na imagem.'
            prompt = f"""Você é avaliador do ENEM. Tema: "{tema_titulo}" {contexto_aluno}\nGere APENAS JSON. Exemplo: {{"notas": {{"1": 120, "2": 160, "3": 120, "4": 160, "5": 200}}, "comentarios": {{"1": "...", "2": "...", "3": "...", "4": "...", "5": "..."}}}}\nNotas: 0, 40, 80, 120, 160, 200.""" if tipo == 'ENEM' else f"""Você é avaliador. Tema: "{tema_titulo}". {contexto_aluno}\nGere APENAS JSON. Exemplo: {{"notas": {{"1": 15, "2": 20, "3": 10, "4": 25}}, "comentarios": {{"1": "...", "2": "...", "3": "...", "4": "..."}}}}\nNotas: 0, 5, 10, 15, 20 ou 25."""
            conteudo_envio = [prompt]
            if imagem_para_ia: conteudo_envio.append(imagem_para_ia)

            response = client.models.generate_content(model='gemini-2.5-flash', contents=conteudo_envio)
            texto_sujo = response.text.strip()
            if "```json" in texto_sujo: texto_sujo = texto_sujo.split("```json")[1].split("```")[0].strip()
            elif "```" in texto_sujo: texto_sujo = texto_sujo.split("```")[1].split("```")[0].strip()
            return Response(json.loads(texto_sujo), status=200)
        except Exception as e: 
            error_msg = str(e)
            if "503" in error_msg or "UNAVAILABLE" in error_msg or "high demand" in error_msg: return Response({"erro": "IA ocupada. Tente novamente."}, status=503)
            return Response({"erro": f"Erro interno: {error_msg}"}, status=500)

class RespostaRapidaViewSet(viewsets.ModelViewSet):
    serializer_class = RespostaRapidaSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self): return RespostaRapida.objects.filter(corretor=self.request.user)
    def perform_create(self, serializer): serializer.save(corretor=self.request.user)

class MinhaCarteiraView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCorretor]
    def get(self, request): 
        carteira, _ = Carteira.objects.get_or_create(corretor=request.user)
        return Response(CarteiraSerializer(carteira).data)

class SolicitarSaqueView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        if Redacao.objects.filter(status='REFAZER', corretor_atual=request.user).exists(): 
            return Response({"erro": "Possui redações pendentes em REFAÇÃO."}, status=400)
        
        carteira, _ = Carteira.objects.get_or_create(corretor=request.user)
        valor_exato = request.data.get('valor_exato', carteira.saldo_atual)
        qtd_normal = request.data.get('qtd_normal', carteira.qtd_normal_pendente)
        qtd_vip = request.data.get('qtd_vip', carteira.qtd_vip_pendente)
        
        if float(valor_exato) <= 0: 
            return Response({"erro": "Sem saldo."}, status=400)
            
        if PagamentoCorretor.objects.filter(corretor=request.user, status__in=['AGUARDANDO_RECIBO', 'EM_ANALISE']).exists(): 
            return Response({"erro": "Saque em andamento."}, status=400)
        
        pagamento = PagamentoCorretor.objects.create(
            corretor=request.user, valor=valor_exato, qtd_normal=qtd_normal, qtd_vip=qtd_vip, status='AGUARDANDO_RECIBO'
        )
        
        carteira.saque_solicitado = True
        carteira.saldo_atual = max(0, float(carteira.saldo_atual) - float(valor_exato))
        carteira.qtd_normal_pendente = max(0, int(carteira.qtd_normal_pendente) - int(qtd_normal))
        carteira.qtd_vip_pendente = max(0, int(carteira.qtd_vip_pendente) - int(qtd_vip))
        carteira.save()
        
        config = ConfiguracaoSistema.objects.first()
        return Response({ "mensagem": "Saque solicitado!", "pagamento_id": pagamento.id, "empresa_cnpj": config.cnpj_plataforma if config else "00.000.000/0001-00", "empresa_razao_social": config.razao_social_plataforma if config else "Plataforma" }, status=201)

class CancelarSaqueView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCorretor]
    def post(self, request, pk):
        pagamento = get_object_or_404(PagamentoCorretor, pk=pk, corretor=request.user)
        if pagamento.status in ['AGUARDANDO_RECIBO', 'EM_ANALISE', 'RECUSADO']:
            carteira = Carteira.objects.filter(corretor=request.user).first()
            if carteira: 
                carteira.saque_solicitado = False
                carteira.saldo_atual += pagamento.valor
                carteira.qtd_normal_pendente += pagamento.qtd_normal
                carteira.qtd_vip_pendente += pagamento.qtd_vip
                carteira.save()
            pagamento.delete()
            return Response({"mensagem": "Saque cancelado."}, status=200)
        return Response({"erro": "Não é possível cancelar."}, status=400)

class EnviarReciboCorretorView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    def post(self, request, pk):
        pagamento = get_object_or_404(PagamentoCorretor, pk=pk, corretor=request.user)
        if not request.FILES.get('arquivo_recibo'): 
            return Response({"erro": "Selecione o arquivo."}, status=400)
        pagamento.arquivo_recibo = request.FILES.get('arquivo_recibo')
        pagamento.status = 'EM_ANALISE'
        pagamento.motivo_recusa = None
        pagamento.save()
        return Response({"mensagem": "Enviado!"}, status=200)