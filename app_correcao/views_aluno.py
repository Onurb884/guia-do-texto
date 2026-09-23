import json
import uuid
import mercadopago # type: ignore
from google import genai
from google.genai import types # type: ignore
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, generics
from rest_framework.decorators import api_view, permission_classes
from .models import Redacao, Tema, CarteiraAluno, Transacao, Pacote, Cupom, HistoricoCompra, ConfiguracaoSistema
from .serializers import RedacaoSerializer, CarteiraAlunoSerializer

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
            tema_id = request.data.get('tema'); arquivo = request.FILES.get('arquivo'); texto = request.data.get('texto')
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
                    else: return Response({"erro": "Créditos insuficientes."}, status=402)
                else:
                    if carteira.saldo_simples <= 0: return Response({"erro": "Sem créditos normais."}, status=402)
                    carteira.saldo_simples -= 1
                carteira.save()
                redacao = Redacao.objects.create(aluno=request.user, tema=get_object_or_404(Tema, pk=tema_id), arquivo=arquivo, texto=texto, status='AGUARDANDO', vip_pago=is_urgente)
            return Response({"mensagem": "Sucesso!", "id": redacao.id}, status=201)
        except Exception as e: return Response({"erro": str(e)}, status=400)

class MinhaCarteiraAlunoView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request): carteira, _ = CarteiraAluno.objects.get_or_create(aluno=request.user); return Response(CarteiraAlunoSerializer(carteira).data)

class ComprarPacoteView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        pacote = get_object_or_404(Pacote, pk=request.data.get('pacote_id'))
        if not pacote.ativo: return Response({"erro": "Indisponível."}, status=400)
        if pacote.compra_unica and HistoricoCompra.objects.filter(aluno=request.user, pacote=pacote).exists(): return Response({"erro": "Já adquirido."}, status=400)
        with transaction.atomic():
            preco_final = pacote.preco
            cupom_codigo = request.data.get('cupom_codigo', '').strip().upper()
            if cupom_codigo:
                try:
                    cupom = Cupom.objects.get(codigo=cupom_codigo, ativo=True)
                    if (cupom.limite_usos == 0 or cupom.usos_atuais < cupom.limite_usos) and (not cupom.data_validade or cupom.data_validade >= timezone.now()):
                        cupom.usos_atuais += 1; cupom.save(); preco_final = pacote.preco - (pacote.preco * (cupom.desconto_percentual / 100))
                except Cupom.DoesNotExist: pass 
            carteira, _ = CarteiraAluno.objects.get_or_create(aluno=request.user)
            carteira.saldo_simples += pacote.qtd_creditos_simples; carteira.saldo_vip += pacote.qtd_creditos_vip; carteira.save()
            HistoricoCompra.objects.create(aluno=request.user, pacote=pacote, valor_pago=preco_final, descricao=f"Pacote: {pacote.nome}")
        return Response({"mensagem": "Aprovado!"}, status=200)

class ComprarAvulsoView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        qtd_simples = int(request.data.get('qtd_simples', 0)); qtd_vip = int(request.data.get('qtd_vip', 0))
        if qtd_simples == 0 and qtd_vip == 0: return Response({"erro": "Selecione créditos."}, status=400)
        config = ConfiguracaoSistema.objects.first()
        valor_total = (qtd_simples * (config.preco_avulso_normal if config else 9.90)) + (qtd_vip * (config.preco_avulso_vip if config else 14.90))
        with transaction.atomic():
            cupom_codigo = request.data.get('cupom_codigo', '').strip().upper()
            if cupom_codigo:
                try:
                    cupom = Cupom.objects.get(codigo=cupom_codigo, ativo=True)
                    if (cupom.limite_usos == 0 or cupom.usos_atuais < cupom.limite_usos) and (not cupom.data_validade or cupom.data_validade >= timezone.now()):
                        cupom.usos_atuais += 1; cupom.save(); valor_total = valor_total - (valor_total * (cupom.desconto_percentual / 100))
                except Cupom.DoesNotExist: pass 
            carteira, _ = CarteiraAluno.objects.get_or_create(aluno=request.user)
            carteira.saldo_simples += qtd_simples; carteira.saldo_vip += qtd_vip; carteira.save()
            HistoricoCompra.objects.create(aluno=request.user, valor_pago=valor_total, descricao=f"Avulso: {qtd_simples}N, {qtd_vip}V")
        return Response({"mensagem": "Adicionados!"}, status=200)

class ValidarCupomView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        codigo = request.data.get('codigo', '').strip().upper()
        try:
            cupom = Cupom.objects.get(codigo=codigo)
            if not cupom.ativo: return Response({"erro": "Inativo."}, status=400)
            if cupom.limite_usos > 0 and cupom.usos_atuais >= cupom.limite_usos: return Response({"erro": "Esgotado."}, status=400)
            if cupom.data_validade and cupom.data_validade < timezone.now(): return Response({"erro": "Expirado."}, status=400)
            return Response({"mensagem": "Sucesso!", "desconto_percentual": cupom.desconto_percentual}, status=200)
        except Cupom.DoesNotExist: return Response({"erro": "Inválido."}, status=404)

class GerarPagamentoPixView(APIView):
    permission_classes = [permissions.IsAuthenticated] 
    def post(self, request):
        try:
            valor_total = float(request.data.get('valor_total', 0)); descricao = request.data.get('descricao', 'Créditos')
            if valor_total <= 0: return Response({'erro': 'Valor inválido.'}, status=400)
            sdk = mercadopago.SDK(settings.MERCADO_PAGO_ACCESS_TOKEN)
            result = sdk.payment().create({ "transaction_amount": valor_total, "description": descricao, "payment_method_id": "pix", "payer": { "email": request.user.email or "aluno@plataforma.com", "first_name": request.user.first_name or "Aluno" } }, mercadopago.config.RequestOptions(custom_headers={'x-idempotency-key': str(uuid.uuid4())}))
            payment = result["response"]
            if "id" not in payment: return Response({'erro': "Mercado Pago recusou a transação."}, status=400)
            Transacao.objects.create(aluno=request.user, pagamento_id=str(payment["id"]), valor=valor_total, descricao=descricao, status='PENDENTE', qtd_simples=int(request.data.get('qtd_simples', 0)), qtd_vip=int(request.data.get('qtd_vip', 0)))
            return Response({ 'qr_code': payment["point_of_interaction"]["transaction_data"]["qr_code"], 'qr_code_base64': payment["point_of_interaction"]["transaction_data"]["qr_code_base64"], 'pagamento_id': payment["id"] }, status=200)
        except Exception as e: return Response({'erro': str(e)}, status=500)
        
class VerificarStatusPixView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request, pagamento_id):
        try:
            transacao = Transacao.objects.filter(pagamento_id=pagamento_id, aluno=request.user).first()
            if not transacao: return Response({'erro': 'Transação não encontrada.'}, status=404)
            
            # CORREÇÃO CRÍTICA AQUI: O sistema agora lê o status verdadeiro do MP!
            sdk = mercadopago.SDK(settings.MERCADO_PAGO_ACCESS_TOKEN)
            info_pagamento = sdk.payment().get(pagamento_id)
            mp_status = info_pagamento["response"].get("status")
            
            if mp_status == 'approved' and transacao.status != 'APROVADO':
                transacao.status = 'APROVADO'; transacao.save()
                carteira, _ = CarteiraAluno.objects.get_or_create(aluno=request.user)
                carteira.saldo_simples += transacao.qtd_simples; carteira.saldo_vip += transacao.qtd_vip; carteira.save()
                
            return Response({'status': mp_status}, status=200)
        except Exception as e: return Response({'erro': str(e)}, status=500)
        
class GerarLinkPagamentoCartaoView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        try:
            valor_total = float(request.data.get('valor_total', 0)); descricao = request.data.get('descricao', 'Créditos')
            if valor_total <= 0: return Response({'erro': 'Valor inválido.'}, status=400)
            transacao = Transacao.objects.create(aluno=request.user, valor=valor_total, descricao=descricao, status='PENDENTE', qtd_simples=int(request.data.get('qtd_simples', 0)), qtd_vip=int(request.data.get('qtd_vip', 0)))
            url_site = "http://localhost:5173" 
            pref = mercadopago.SDK(settings.MERCADO_PAGO_ACCESS_TOKEN).preference().create({ "items": [{ "title": descricao, "quantity": 1, "currency_id": "BRL", "unit_price": valor_total }], "payer": { "name": request.user.first_name or "Aluno", "email": request.user.email or "aluno@plataforma.com", }, "back_urls": { "success": f"{url_site}/painel-aluno?aba=loja&pagamento_mp=sucesso&transacao_id={transacao.id}", "failure": f"{url_site}/painel-aluno?aba=loja&pagamento_mp=falha", "pending": f"{url_site}/painel-aluno?aba=loja&pagamento_mp=pendente" }, "external_reference": str(transacao.id), "payment_methods": { "installments": int(request.data.get('max_parcelas', 1)) } })["response"]
            if "init_point" not in pref: return Response({'erro': "O Mercado Pago recusou."}, status=400)
            return Response({ 'link_pagamento': pref["init_point"], 'transacao_id': transacao.id }, status=200)
        except Exception as e: return Response({'erro': str(e)}, status=500)

class ProcessarRetornoMercadoPagoView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        try:
            transacao = Transacao.objects.filter(id=request.data.get('transacao_id'), aluno=request.user).first()
            if transacao and mercadopago.SDK(settings.MERCADO_PAGO_ACCESS_TOKEN).payment().get(request.data.get('payment_id'))["response"].get("status") == 'approved' and transacao.status != 'APROVADO':
                transacao.status = 'APROVADO'; transacao.pagamento_id = str(request.data.get('payment_id')); transacao.save()
                carteira, _ = CarteiraAluno.objects.get_or_create(aluno=request.user)
                carteira.saldo_simples += transacao.qtd_simples; carteira.saldo_vip += transacao.qtd_vip; carteira.save()
                return Response({'mensagem': 'Aprovado!'}, status=200)
            return Response({'mensagem': 'Aguardando.'}, status=200)
        except Exception as e: return Response({'erro': str(e)}, status=500)

class VerificarPagamentoMPView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request, transacao_id):
        try:
            transacao = Transacao.objects.get(id=transacao_id, aluno=request.user)
            if transacao.status == 'APROVADO': return Response({'mensagem': 'Já processado.', 'status': 'APROVADO'}, status=200)
            for pag in mercadopago.SDK(settings.MERCADO_PAGO_ACCESS_TOKEN).payment().search({"external_reference": str(transacao.id)})["response"].get("results", []):
                if pag.get("status") == "approved":
                    transacao.status = 'APROVADO'; transacao.save()
                    carteira, _ = CarteiraAluno.objects.get_or_create(aluno=request.user)
                    carteira.saldo_simples += transacao.qtd_simples; carteira.saldo_vip += transacao.qtd_vip; carteira.save()
                    return Response({'mensagem': 'Aprovado!', 'status': 'APROVADO'}, status=200)
            return Response({'mensagem': 'Pendente.', 'status': 'PENDENTE'}, status=200)
        except Exception as e: return Response({'erro': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def enviar_avaliacao_corretor(request, pk):
    try:
        redacao = Redacao.objects.get(pk=pk, aluno=request.user)
        if hasattr(redacao, 'correcao') and redacao.correcao:
            nota = int(request.data.get('nota', 0)); comentario = request.data.get('comentario', '')
            redacao.correcao.avaliacao_aluno = nota; redacao.correcao.comentario_avaliacao = comentario; redacao.correcao.save()
            if nota > 0 and nota <= 2:
                redacao.status = 'EM_QA'
                alerta = f"\n\n[SINALIZADO: Avaliação Baixa do Aluno ({nota} Estrelas)]\nComentário: {comentario}"
                if alerta not in redacao.correcao.comentario_geral:
                    redacao.correcao.comentario_geral += alerta; redacao.correcao.save()
                redacao.save()
            return Response({'sucesso': True})
        return Response({'erro': 'Correção não encontrada.'}, status=400)
    except Exception as e: return Response({'erro': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def solicitar_recurso_redacao(request, pk):
    try:
        redacao = Redacao.objects.get(pk=pk, aluno=request.user)
        redacao.status = 'EM_RECURSO' 
        if hasattr(redacao, 'correcao') and redacao.correcao:
            aviso_recurso = f"\n\n--- RECURSO SOLICITADO PELO ALUNO ---\nMotivo: {request.data.get('motivo', '')}"
            if redacao.correcao.comentario_geral: redacao.correcao.comentario_geral += aviso_recurso
            else: redacao.correcao.comentario_geral = aviso_recurso
            redacao.correcao.save()
        redacao.save()
        return Response({'sucesso': True})
    except Exception as e: return Response({'erro': str(e)}, status=500)

class AssistenteSuporteView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        if not request.data.get('mensagem'): return Response({'erro': 'A mensagem não pode estar vazia.'}, status=400)
        try:
            return Response({'resposta': genai.Client(api_key=settings.GEMINI_API_KEY).models.generate_content(model='gemini-2.5-flash', contents=request.data.get('mensagem'), config=types.GenerateContentConfig(system_instruction="Você é a assistente virtual de suporte da plataforma 'Guia do Texto'. Responda de forma amigável.", temperature=0.3)).text}, status=200)
        except Exception as e: return Response({'erro': str(e)}, status=500)