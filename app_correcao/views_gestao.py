from rest_framework import viewsets, permissions, generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import action
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAdminUser, IsAuthenticated
import json
from google import genai

from .models import (
    ConfiguracaoSistema, Tema, TextoMotivador, Pacote, Cupom, 
    BannerVitrine, HistoricoCompra, MaterialApoio, Redacao, PagamentoCorretor, 
    Carteira, CarteiraAluno, Correcao
)
from .serializers import (
    ConfiguracaoSerializer, UserSerializer, TemaSerializer, PacoteSerializer, 
    CupomSerializer, BannerVitrineSerializer, MaterialApoioSerializer, RedacaoSerializer
)
from .permissions import IsCorretor
from django.conf import settings

User = get_user_model()

class GestaoUsuariosViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser] 
    parser_classes = [MultiPartParser, FormParser, JSONParser] 

class TemaViewSet(viewsets.ModelViewSet):
    queryset = Tema.objects.all().order_by('-id')
    serializer_class = TemaSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser] 

    @action(detail=True, methods=['get'])
    def repertorios_ia(self, request, pk=None):
        tema = self.get_object(); textos_de_apoio = ""
        motivadores_lista = tema.motivadores.all() if hasattr(tema.motivadores, 'all') else tema.motivadores
        if motivadores_lista:
            for idx, mot in enumerate(motivadores_lista):
                tipo = getattr(mot, 'tipo', None) or (mot.get('tipo') if isinstance(mot, dict) else None)
                conteudo = getattr(mot, 'conteudo', None) or (mot.get('conteudo') if isinstance(mot, dict) else None)
                if tipo == 'texto' and conteudo: textos_de_apoio += f"\n--- Texto {idx + 1} ---\n{conteudo}\n"
        prompt = f"""Aja como um professor especialista em redação nota 1000. O aluno vai escrever uma redação com o tema: "{tema.titulo}". Instruções: {tema.descricao} Textos Motivadores: {textos_de_apoio}. Forneça 3 sugestões criativas de repertório sociocultural. Retorne APENAS HTML simples: <h3>💡 [Nome]</h3><p><strong>Área:</strong> [Área]</p><p><strong>Como aplicar:</strong> [Explicação]</p><hr/>"""
        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            response = client.models.generate_content(model='gemini-2.5-flash', contents=prompt)
            return Response({"html": response.text.replace("```html", "").replace("```", "").strip()})
        except Exception as e: return Response({"erro": str(e)}, status=500)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']: return [permissions.IsAuthenticated(), IsCorretor()]
        return [permissions.IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        data = request.data.dict() if hasattr(request.data, 'dict') else request.data.copy()
        self._processar_motivadores(data, request.FILES)
        serializer = self.get_serializer(data=data); serializer.is_valid(raise_exception=True); self.perform_create(serializer)
        return Response(serializer.data, status=201)

    def update(self, request, *args, **kwargs):
        data = request.data.dict() if hasattr(request.data, 'dict') else request.data.copy()
        self._processar_motivadores(data, request.FILES)
        serializer = self.get_serializer(self.get_object(), data=data, partial=kwargs.pop('partial', False))
        serializer.is_valid(raise_exception=True); self.perform_update(serializer)
        return Response(serializer.data)

    def _processar_motivadores(self, data, files):
        if 'motivadores_json' in data:
            try:
                motivadores_list = json.loads(data['motivadores_json'])
                for index, item in enumerate(motivadores_list):
                    if f'arquivo_{index}' in files: item['arquivo'] = files[f'arquivo_{index}']
                    item.pop('id', None)
                data['motivadores'] = motivadores_list
            except json.JSONDecodeError: pass 

class PacoteViewSet(viewsets.ModelViewSet):
    serializer_class = PacoteSerializer
    def get_queryset(self):
        qs = Pacote.objects.all().order_by('-ativo', 'preco')
        if not self.request.user.is_staff: qs = qs.exclude(id__in=HistoricoCompra.objects.filter(aluno=self.request.user, pacote__isnull=False).values_list('pacote_id', flat=True), compra_unica=True)
        return qs
    def get_permissions(self): return [permissions.IsAuthenticated(), IsAdminUser()] if self.action in ['create', 'update', 'partial_update', 'destroy'] else [permissions.IsAuthenticated()]

class BannerVitrineViewSet(viewsets.ModelViewSet):
    serializer_class = BannerVitrineSerializer; parser_classes = [MultiPartParser, FormParser, JSONParser]
    def get_queryset(self):
        qs = BannerVitrine.objects.all().order_by('ordem', '-id')
        if not self.request.user.is_staff: qs = qs.filter(ativo=True).exclude(data_fim__lt=timezone.now()).exclude(pacote_vinculado__in=HistoricoCompra.objects.filter(aluno=self.request.user, pacote__isnull=False).values_list('pacote_id', flat=True), pacote_vinculado__compra_unica=True)
        return qs
    def get_permissions(self): return [permissions.IsAuthenticated(), IsAdminUser()] if self.action in ['create', 'update', 'partial_update', 'destroy'] else [permissions.IsAuthenticated()]

class CupomViewSet(viewsets.ModelViewSet):
    queryset = Cupom.objects.all().order_by('-ativo', '-id'); serializer_class = CupomSerializer; permission_classes = [permissions.IsAuthenticated, IsAdminUser]

class MaterialApoioViewSet(viewsets.ModelViewSet):
    serializer_class = MaterialApoioSerializer; parser_classes = [MultiPartParser, FormParser, JSONParser]
    def get_queryset(self):
        if self.request.user.is_staff: return MaterialApoio.objects.all().order_by('-criado_em')
        elif getattr(self.request.user, 'is_corretor', False): return MaterialApoio.objects.filter(ativo=True, categoria__startswith='CORRETOR_').order_by('-criado_em')
        return MaterialApoio.objects.filter(ativo=True, categoria__startswith='ALUNO_').order_by('-criado_em')
    def get_permissions(self): return [permissions.IsAuthenticated(), permissions.IsAdminUser()] if self.action in ['create', 'update', 'partial_update', 'destroy'] else [permissions.IsAuthenticated()]

class ConfiguracaoView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request): config, _ = ConfiguracaoSistema.objects.get_or_create(id=1); return Response(ConfiguracaoSerializer(config).data)
    def put(self, request):
        if not request.user.is_staff: return Response(status=403)
        config, _ = ConfiguracaoSistema.objects.get_or_create(id=1)
        serializer = ConfiguracaoSerializer(config, data=request.data, partial=True)
        if serializer.is_valid(): serializer.save(); return Response(serializer.data)
        return Response(serializer.errors, status=400)

class GestaoRedacoesView(generics.ListAPIView):
    serializer_class = RedacaoSerializer; permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    queryset = Redacao.objects.all().order_by('-data_envio')
    
    def list(self, request, *args, **kwargs):
        data = self.get_serializer(self.get_queryset(), many=True).data
        
        # INTELIGÊNCIA CORRIGIDA: Usa int() para garantir o cruzamento exato no dicionário
        corretores_ids = set()
        for d in data:
            if d.get('corretor_atual'): corretores_ids.add(int(d['corretor_atual']))
            if d.get('correcao'):
                corretor_val = d['correcao'].get('corretor') or d['correcao'].get('corretor_id')
                if corretor_val:
                    cid = corretor_val.get('id') if isinstance(corretor_val, dict) else corretor_val
                    if cid: corretores_ids.add(int(cid))
                    
        corretores_ids = {cid for cid in corretores_ids if cid}
        corretores_map = {u.id: f"{u.first_name} {u.last_name}".strip() or u.username for u in User.objects.filter(id__in=list(corretores_ids))}
        
        for item in data: 
            if item.get('corretor_atual'):
                item['corretor_nome'] = corretores_map.get(int(item['corretor_atual']))
            elif item.get('correcao'):
                c_val = item['correcao'].get('corretor') or item['correcao'].get('corretor_id')
                cid = c_val.get('id') if isinstance(c_val, dict) else c_val
                if cid: item['corretor_nome'] = corretores_map.get(int(cid))
            else:
                item['corretor_nome'] = None
                
        return Response(data)

class ToggleUrgenciaView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    def post(self, request, pk):
        redacao = get_object_or_404(Redacao, pk=pk)
        if getattr(redacao, 'vip_pago', False): return Response({"erro": "Urgência paga não pode ser rebaixada."}, status=400)
        redacao.is_urgente = not redacao.is_urgente; redacao.save(); return Response({"is_urgente": redacao.is_urgente}, status=200)

class ForcarLiberacaoView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    def post(self, request, pk):
        redacao = get_object_or_404(Redacao, pk=pk)
        if redacao.status == 'REFAZER' and redacao.corretor_atual:
            if getattr(redacao, 'correcao', None):
                config = ConfiguracaoSistema.objects.first(); valor_base = config.valor_pagamento_simples if (redacao.tema.tipo if redacao.tema else 'ENEM') == 'SIMPLES' else config.valor_pagamento_enem
                carteira = Carteira.objects.filter(corretor=redacao.corretor_atual).first()
                if carteira:
                    if redacao.is_urgente or getattr(redacao, 'vip_pago', False): carteira.qtd_vip_pendente = max(0, carteira.qtd_vip_pendente - 1); carteira.saldo_atual = max(0, float(carteira.saldo_atual) - float(valor_base + config.valor_bonus_vip))
                    else: carteira.qtd_normal_pendente = max(0, carteira.qtd_normal_pendente - 1); carteira.saldo_atual = max(0, float(carteira.saldo_atual) - float(valor_base))
                    carteira.save()
                redacao.correcao.delete()
            redacao.is_urgente = True 
        redacao.corretor_atual = None; redacao.status = 'AGUARDANDO'; redacao.data_inicio_correcao = None; redacao.save()
        return Response({"mensagem": "Liberada!"}, status=200)

class ResolverAuditoriaView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        try:
            redacao = Redacao.objects.get(pk=pk)
            acao = request.data.get('acao')
            mensagem = request.data.get('mensagem', '')
            correcao = getattr(redacao, 'correcao', None)

            if acao == 'CONFIRMAR_FALHA_GRAVE':
                redacao.status = 'CORRIGIDA'
                if correcao:
                    correcao.nota_final = 0
                    correcao.comentario_geral = f"[FALHA GRAVE CONFIRMADA]\n{mensagem}\n\n{correcao.comentario_geral}"
                    correcao.save()
                    from .models import NotaCompetencia
                    NotaCompetencia.objects.filter(correcao=correcao).delete()
                    num_comps = 5 if (redacao.tema.tipo if redacao.tema else 'ENEM') == 'ENEM' else 4
                    for i in range(1, num_comps + 1):
                        NotaCompetencia.objects.create(correcao=correcao, numero_competencia=i, nota=0, comentario="Nota anulada devido à falha grave.")

                    from .models import ConfiguracaoSistema, Carteira
                    config, _ = ConfiguracaoSistema.objects.get_or_create(id=1)
                    valor_base = config.valor_pagamento_simples if (redacao.tema.tipo if redacao.tema else 'ENEM') == 'SIMPLES' else config.valor_pagamento_enem
                    carteira, _ = Carteira.objects.get_or_create(corretor=correcao.corretor)
                    if redacao.is_urgente or getattr(redacao, 'vip_pago', False):
                        carteira.qtd_vip_pendente += 1
                        carteira.saldo_atual += (valor_base + config.valor_bonus_vip)
                    else:
                        carteira.qtd_normal_pendente += 1
                        carteira.saldo_atual += valor_base
                    carteira.save()

            elif acao == 'DEVOLVER_CORRETOR':
                redacao.status = 'REFAZER'
                redacao.corretor_atual = correcao.corretor if correcao else None
                if correcao:
                    correcao.comentario_geral = f"[ALERTA DA COORDENAÇÃO]\n{mensagem}\n\n{correcao.comentario_geral}"
                    correcao.save()

            elif acao == 'ANULAR_E_DEVOLVER_CREDITO':
                redacao.status = 'DEVOLVIDA'
                if correcao:
                    correcao.comentario_geral = f"[REDAÇÃO DEVOLVIDA]\n{mensagem}"
                    correcao.save()
                
                from .models import CarteiraAluno
                carteira_aluno, _ = CarteiraAluno.objects.get_or_create(aluno=redacao.aluno)
                if getattr(redacao, 'vip_pago', False):
                    carteira_aluno.saldo_vip += 1
                else:
                    carteira_aluno.saldo_simples += 1
                carteira_aluno.save()

            elif acao == 'RECURSO_NEGADO':
                redacao.status = 'CORRIGIDA'
                if correcao:
                    correcao.comentario_geral = f"[RESPOSTA AO RECURSO]\n{mensagem}\n\n{correcao.comentario_geral}"
                    correcao.save()

            elif acao == 'RECURSO_ACEITO':
                redacao.status = 'REFAZER'
                redacao.is_urgente = True
                redacao.corretor_atual = correcao.corretor if correcao else None
                if correcao:
                    correcao.comentario_geral = f"[RECURSO ACEITE - REFAZER CORREÇÃO]\n{mensagem}\n\n{correcao.comentario_geral}"
                    correcao.save()
                    
            elif acao == 'EXIGIR_REFACAO':
                redacao.status = 'REFAZER'
                redacao.corretor_atual = correcao.corretor if correcao else None
                if correcao:
                    correcao.comentario_geral = f"[ALERTA DA COORDENAÇÃO (QA)]\n{mensagem}\n\n{correcao.comentario_geral}"
                    correcao.save()
                    
            elif acao == 'FALSO_POSITIVO_QA':
                redacao.status = 'CORRIGIDA'
                
            elif acao == 'AJUSTAR_NOTA_PAGA':
                redacao.status = 'CORRIGIDA'
                if correcao:
                    novas_notas = request.data.get('novas_notas', {})
                    nota_total = 0
                    from .models import NotaCompetencia
                    for comp_num, val in novas_notas.items():
                        nota_val = int(val)
                        nota_total += nota_val
                        nc = NotaCompetencia.objects.filter(correcao=correcao, numero_competencia=comp_num).first()
                        if nc:
                            nc.nota = nota_val; nc.save()
                    correcao.nota_final = nota_total
                    correcao.comentario_geral = f"[NOTA REVISADA PELA COORDENAÇÃO]\n{mensagem}\n\n{correcao.comentario_geral}"
                    correcao.save()

            redacao.save()
            return Response({"mensagem": "Resolvido com sucesso."}, status=200)

        except Exception as e:
            return Response({"erro": str(e)}, status=400)

class AdicionarCreditoManualView(APIView):
    permission_classes = [IsAdminUser] 
    def post(self, request, user_id):
        try:
            carteira, _ = CarteiraAluno.objects.get_or_create(aluno=User.objects.get(pk=user_id))
            carteira.saldo_simples += int(request.data.get('qtd_simples', 0) or 0); carteira.saldo_vip += int(request.data.get('qtd_vip', 0) or 0); carteira.save()
            return Response({'mensagem': 'Sucesso!', 'novo_saldo_simples': carteira.saldo_simples, 'novo_saldo_vip': carteira.saldo_vip}, status=200)
        except Exception as e: return Response({'erro': str(e)}, status=500)

class GestaoFinanceiraView(APIView):
    permission_classes = [IsAdminUser]
    def get(self, request):
        try:
            from .models import Transacao
            inicio_mes = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            faturamento_total = 0; faturamento_mes = 0; aguardando_pagamento = 0
            for t in Transacao.objects.all():
                if getattr(t, 'tipo', '') in ['CREDITO', 'DEBITO']: continue
                data_t = getattr(t, 'data_atualizacao', getattr(t, 'criado_em', getattr(t, 'data_criacao', getattr(t, 'data_envio', getattr(t, 'data', None)))))
                is_este_mes = True if data_t and data_t >= inicio_mes else False
                if getattr(t, 'status', '').upper() == 'APROVADO':
                    faturamento_total += float(t.valor)
                    if is_este_mes: faturamento_mes += float(t.valor)
                elif getattr(t, 'status', '').upper() == 'PENDENTE' and is_este_mes: aguardando_pagamento += float(t.valor)
            for h in HistoricoCompra.objects.all():
                data_h = getattr(h, 'data_compra', getattr(h, 'criado_em', getattr(h, 'data', None)))
                faturamento_total += float(h.valor_pago)
                if data_h and data_h >= inicio_mes: faturamento_mes += float(h.valor_pago)
            
            lista_pagamentos = []; total_a_pagar = 0
            for prof in User.objects.filter(is_corretor=True):
                carteira = Carteira.objects.filter(corretor=prof).first()
                if carteira and float(carteira.saldo_atual) > 0:
                    total_a_pagar += float(carteira.saldo_atual)
                    pendente = PagamentoCorretor.objects.filter(corretor=prof, status__in=['AGUARDANDO_RECIBO', 'EM_ANALISE', 'RECUSADO']).order_by('-data_solicitacao').first()
                    lista_pagamentos.append({ 'corretor_id': prof.id, 'nome': f"{prof.first_name} {prof.last_name}".strip() or prof.username, 'email': prof.email, 'telefone': getattr(prof, 'telefone', ''), 'chave_pix': getattr(prof, 'chave_pix', ''), 'tipo_chave_pix': getattr(prof, 'tipo_chave_pix', ''), 'banco': getattr(prof, 'banco', ''), 'agencia_conta': getattr(prof, 'agencia_conta', ''), 'valor_a_receber': float(carteira.saldo_atual), 'saque_solicitado': carteira.saque_solicitado, 'qtd_normal': carteira.qtd_normal_pendente, 'qtd_vip': carteira.qtd_vip_pendente, 'pagamento_id': pendente.id if pendente else None, 'status_pagamento': pendente.status if pendente else None, 'arquivo_recibo_url': pendente.arquivo_recibo.url if pendente and pendente.arquivo_recibo else None, 'motivo_recusa': pendente.motivo_recusa if pendente else None })
            
            lista_historico_pagamentos = []
            for p in PagamentoCorretor.objects.all().order_by('-data_pagamento', '-data_solicitacao'):
                lista_historico_pagamentos.append({ 'id': p.id, 'corretor_nome': f"{p.corretor.first_name} {p.corretor.last_name}".strip() or p.corretor.username, 'email': p.corretor.email, 'data_solicitacao': p.data_solicitacao, 'data_pagamento': p.data_pagamento, 'valor': float(p.valor), 'qtd_normal': p.qtd_normal, 'qtd_vip': p.qtd_vip, 'status': p.status, 'arquivo_recibo_url': p.arquivo_recibo.url if p.arquivo_recibo else None })
            return Response({ 'faturamento_total': faturamento_total, 'faturamento_mes': faturamento_mes, 'lucro_bruto_estimado': faturamento_mes - total_a_pagar, 'total_a_pagar_corretores': total_a_pagar, 'aguardando_pagamento': aguardando_pagamento, 'folha_pagamento': lista_pagamentos, 'historico_pagamentos': lista_historico_pagamentos }, status=200)
        except Exception as e: return Response({'erro': str(e)}, status=500)

class BaixarPagamentoView(APIView):
    permission_classes = [permissions.IsAdminUser]
    def post(self, request, pk):
        pagamento = get_object_or_404(PagamentoCorretor, pk=pk)
        if pagamento.status == 'PAGO': return Response({"erro": "Este recibo já foi pago!"}, status=400)
        pagamento.status = 'PAGO'; pagamento.data_pagamento = timezone.now(); pagamento.save()
        carteira = Carteira.objects.filter(corretor=pagamento.corretor).first()
        if carteira: carteira.saque_solicitado = False; carteira.save()
        return Response({"mensagem": "Pago com sucesso!"}, status=200)

class RecusarReciboView(APIView):
    permission_classes = [permissions.IsAdminUser]
    def post(self, request, pk):
        pagamento = get_object_or_404(PagamentoCorretor, pk=pk)
        if pagamento.status in ['RECUSADO', 'PAGO']: return Response({"erro": "Este recibo já foi processado."}, status=400)
        pagamento.status = 'RECUSADO'; pagamento.motivo_recusa = request.data.get('motivo_recusa', 'Motivo não especificado. Entre em contato com a equipe.'); pagamento.save()
        return Response({"mensagem": "Recibo recusado com sucesso."}, status=200)