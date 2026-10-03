import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, Container, Flex, HStack, Button, Divider, Heading, Text, Badge, Image, 
  Popover, PopoverTrigger, Portal, PopoverContent, PopoverArrow, PopoverCloseButton, 
  PopoverHeader, PopoverBody, VStack, Modal, ModalOverlay, ModalContent, 
  ModalHeader, ModalCloseButton, ModalBody, ModalFooter, useDisclosure, useToast, Spinner,
  SimpleGrid, Table, Thead, Tbody, Tr, Th, Td, Alert, AlertIcon, Card, CardBody, Select, Textarea, InputGroup, InputLeftElement, Input
} from '@chakra-ui/react';
import { ArrowBackIcon, Icon, CheckCircleIcon, WarningTwoIcon, EditIcon, ChatIcon, AttachmentIcon, DownloadIcon, InfoIcon, ViewIcon, ViewOffIcon, SearchIcon } from '@chakra-ui/icons';

import AbaCorretorFila from './abas/AbaCorretorFila';
import AbaCorretorHistorico from './abas/AbaCorretorHistorico';
import AbaCorretorCarteira from './abas/AbaCorretorCarteira';
import AbaCorretorRespostas from './abas/AbaCorretorRespostas';
import AbaCorretorManuais from './abas/AbaCorretorManuais';

const CustomPinSVG = ({ cor, numero }) => (
  <Box position="relative" w="22px" h="22px" color={cor} filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.3))" transition="all 0.2s" _hover={{ transform: 'scale(1.25)' }}>
    <Icon viewBox="0 0 24 24" w="100%" h="100%"><path fill="currentColor" d="M4 2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2z"/></Icon>
    <Text position="absolute" top="5px" left="0" w="100%" textAlign="center" color="white" fontSize="10px" fontWeight="900" fontFamily="system-ui">{numero === 0 ? '★' : numero}</Text>
  </Box>
);

const INFO_COMPETENCIAS_ENEM = [
    { id: 1, nome: "1. Gramática", cor: "red.500", bg: "red.50" }, 
    { id: 2, nome: "2. Tema/Estrutura/Repertório", cor: "blue.500", bg: "blue.50" }, 
    { id: 3, nome: "3. Argumentação", cor: "yellow.500", bg: "yellow.50" }, 
    { id: 4, nome: "4. Coesão", cor: "green.500", bg: "green.50" }, 
    { id: 5, nome: "5. Proposta de Intervenção", cor: "purple.500", bg: "purple.50" },
    { id: 0, nome: "Outros (Observações Gerais)", cor: "black", bg: "gray.200" }
];
const INFO_COMPETENCIAS_PADRAO = [
    { id: 1, nome: "1. Domínio da Norma Culta", cor: "red.500", bg: "red.50" }, 
    { id: 2, nome: "2. Adequação ao Tema e Estrutura Textual", cor: "blue.500", bg: "blue.50" }, 
    { id: 3, nome: "3. Coerência e Argumentação", cor: "yellow.500", bg: "yellow.50" }, 
    { id: 4, nome: "4. Coesão Textual", cor: "green.500", bg: "green.50" },
    { id: 0, nome: "Outros (Observações Gerais)", cor: "black", bg: "gray.200" }
];

const INFOS_MANUAL = { 'CORRETOR_CARTILHA': { nome: 'Cartilha Oficial', cor: 'blue', icone: InfoIcon }, 'CORRETOR_REGUA': { nome: 'Régua de Penalizações', cor: 'red', icone: WarningTwoIcon }, 'CORRETOR_DESVIOS': { nome: 'Guia de Desvios', cor: 'orange', icone: EditIcon }, 'CORRETOR_REPERTORIO': { nome: 'Repertórios Aceitos', cor: 'green', icone: CheckCircleIcon }, 'CORRETOR_COMUNICADO': { nome: 'Comunicado', cor: 'purple', icone: ChatIcon }, 'OUTROS': { nome: 'Geral', cor: 'gray', icone: AttachmentIcon } };

const processarCarteira = (dadosOriginais) => {
  if (!dadosOriginais) return dadosOriginais;
  let transacoesOriginais = JSON.parse(JSON.stringify(dadosOriginais.transacoes || []));
  let txsOrdenadas = transacoesOriginais.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  
  let transacoesUnicas = []; let redacoesVistas = new Set();
  txsOrdenadas.forEach(tx => { 
      let match = (tx.descricao || "").match(/#(\d+)/); 
      let rId = match ? match[1] : `tx_${tx.id}`; 
      if (!redacoesVistas.has(rId)) { redacoesVistas.add(rId); transacoesUnicas.push(tx); } 
  });
  
  let recibos = JSON.parse(JSON.stringify(dadosOriginais.historico_pagamentos || []));
  if (dadosOriginais.solicitacao_ativa) recibos.push({ ...dadosOriginais.solicitacao_ativa, is_ativa: true });
  recibos.sort((a, b) => new Date(a.data_pagamento || a.data_solicitacao).getTime() - new Date(b.data_pagamento || b.data_solicitacao).getTime());
  
  let usedTxIds = new Set();
  recibos.forEach(recibo => {
      let normaisFaltantes = parseInt(recibo.qtd_normal, 10) || 0; 
      let vipsFaltantes = parseInt(recibo.qtd_vip, 10) || 0;
      
      transacoesUnicas.forEach(tx => {
          if (usedTxIds.has(tx.id)) return;
          const desc = (tx.descricao || "").toUpperCase();
          const isVip = desc.includes('BÔNUS') || desc.includes('VIP') || desc.includes('URGENTE');
          
          if (isVip && vipsFaltantes > 0) { 
              tx.pagamento_id = recibo.id; tx.foi_pago = !recibo.is_ativa; usedTxIds.add(tx.id); vipsFaltantes--; 
          } else if (!isVip && normaisFaltantes > 0) { 
              tx.pagamento_id = recibo.id; tx.foi_pago = !recibo.is_ativa; usedTxIds.add(tx.id); normaisFaltantes--; 
          }
      });
  });

  let saldoCalculado = 0; let normaisPendentes = 0; let vipsPendentes = 0;
  transacoesUnicas.forEach(tx => {
      if (!usedTxIds.has(tx.id)) {
          tx.pagamento_id = null; tx.foi_pago = false; saldoCalculado += parseFloat(tx.valor || 0);
          const desc = (tx.descricao || "").toUpperCase();
          if (desc.includes('BÔNUS') || desc.includes('VIP') || desc.includes('URGENTE')) vipsPendentes++; else normaisPendentes++;
      }
  });

  transacoesUnicas.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  return { ...dadosOriginais, transacoes: transacoesUnicas, saldo_atual: saldoCalculado, qtd_normal_pendente: normaisPendentes, qtd_vip_pendente: vipsPendentes };
};

const formatarTexto = (texto) => {
    if (!texto) return '';
    if (texto.includes('<p>') || texto.includes('<span')) return texto; 
    return texto.replace(/\n/g, '<br />').replace(/\*(.*?)\*/g, '<strong>$1</strong>').replace(/_(.*?)_/g, '<em>$1</em>').replace(/~(.*?)~/g, '<u>$1</u>');
};
const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

const renderComentarioGeralHist = (textoOriginal) => {
    if (!textoOriginal) return null;
    
    let limpo = textoOriginal.replace(/\[\/?ALERTA_COORDENACAO\]/g, '').replace(/\[SINALIZADO:[\s\S]*?(?=\[|$)/gi, '').replace(/\bNone\b/g, '').trim();
    if (!limpo) return null;

    const parts = limpo.split(/(?=\[.*?\])/);
    
    const blocos = parts.map((part, idx) => {
        if (!part.trim()) return null;
        let title = "Comentário Geral";
        let content = part.trim();
        let color = "blue";
        
        const titleMatch = part.match(/^\[(.*?)\]/);
        if (titleMatch) {
            title = titleMatch[1];
            content = part.replace(titleMatch[0], '').trim();
            const tUpper = title.toUpperCase();
            
            // BLOQUEIO SUPREMO: Não mostrar ao professor as mensagens que a coordenação enviou apenas para o aluno!
            if (tUpper.includes("AVISO DA COORDENAÇÃO") || tUpper.includes("REDAÇÃO CANCELADA") || tUpper.includes("RESPOSTA AO RECURSO")) {
                return null; 
            }

            if (tUpper.includes("FALHA GRAVE REPORTADA") || tUpper.includes("SINALIZADO")) { title = "Sinalização Enviada"; color = "orange"; }
            else if (tUpper.includes("TRIAGEM TÉCNICA")) { title = "Problema Técnico"; color = "pink"; }
            else if (tUpper.includes("ALERTA DA COORDENAÇÃO") || tUpper.includes("REFAZER")) { title = "Aviso da Coordenação"; color = "purple"; }
            else if (tUpper.includes("RECURSO SOLICITADO")) { title = "Recurso do Aluno"; color = "cyan"; }
            else if (tUpper.includes("NOTA REVISADA PELA COORDENAÇÃO")) { title = "Nota Revisada Diretamente"; color = "red"; }
            else if (tUpper.includes("RECURSO ACEITE") || tUpper.includes("RECURSO NEGADO") || tUpper.includes("EXIGIR_REFACAO")) { title = "Veredito da Coordenação"; color = "green"; }
        } else if (content.includes("Detalhes do Professor:")) {
            title = "Detalhes do Professor";
            content = content.replace("Detalhes do Professor:", "").trim();
            color = "gray";
        }
        
        if (!content) return null;

        return (
            <Box key={idx} bg={`${color}.50`} p={4} borderRadius="md" border="1px solid" borderColor={`${color}.200`} borderLeft="4px solid" borderLeftColor={`${color}.500`}>
                <Text fontSize="xs" fontWeight="bold" color={`${color}.800`} textTransform="uppercase" mb={1}>{title}</Text>
                <Text fontSize="sm" color={`${color}.900`} whiteSpace="pre-wrap" lineHeight="tall">{content}</Text>
            </Box>
        );
    }).filter(Boolean);

    if (blocos.length === 0) return null;
    return <VStack align="stretch" spacing={3}>{blocos}</VStack>;
};

function valorPorExtenso(valorOriginal) {
  if (!valorOriginal || parseFloat(valorOriginal) === 0) return 'zero reais';
  const valor = parseFloat(valorOriginal);
  const extenso = { unidades: ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"], dez_a_dezenove: ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"], dezenas: ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"], centenas: ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"] };
  function converteGrupo(n) { 
    if (n === 0) return ""; if (n === 100) return "cem"; 
    let c = Math.floor(n / 100); let d = Math.floor((n % 100) / 10); let u = n % 10; 
    let res = extenso.centenas[c]; let resto = n % 100; 
    if (res && resto > 0) res += " e "; 
    if (resto >= 10 && resto <= 19) { res += extenso.dez_a_dezenove[resto - 10]; } else { if (d >= 2) { res += extenso.dezenas[d]; if (u > 0) res += " e "; } if (u > 0 && resto >= 20 || u > 0 && d === 0) { res += extenso.unidades[u]; } } 
    return res; 
  }
  let reais = Math.floor(valor); let centavos = Math.round((valor - reais) * 100); let texto = [];
  if (reais > 0) { let milhares = Math.floor(reais / 1000); let restoReais = reais % 1000; if (milhares > 0) { texto.push(milhares === 1 ? "mil" : converteGrupo(milhares) + " mil"); if (restoReais > 0 && restoReais <= 100) texto.push("e"); } if (restoReais > 0) texto.push(converteGrupo(restoReais)); texto.push(reais === 1 ? "real" : "reais"); }
  if (centavos > 0) { if (reais > 0) texto.push("e"); texto.push(converteGrupo(centavos)); texto.push(centavos === 1 ? "centavo" : "centavos"); } 
  return texto.join(" ").replace(/\s+/g, ' ').trim();
}

const PainelCorretor = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const toast = useToast();

    const [aba, setAba] = useState('fila');
    const [usuario, setUsuario] = useState({ first_name: 'Corretor', last_name: '', cpf: '', id: null });
    const [fila, setFila] = useState([]);
    const [historico, setHistorico] = useState([]); 
    const [carteira, setCarteira] = useState({ saldo_atual: 0, transacoes: [], historico_pagamentos: [], solicitacao_ativa: null });
    const [materiais, setMateriais] = useState([]);
    const [configPlataforma, setConfigPlataforma] = useState(null); 
    const [todasRespostas, setTodasRespostas] = useState([]);
    const [gabaritoPins, setGabaritoPins] = useState([]);

    const [redacaoVisualizar, setRedacaoVisualizar] = useState(null);
    const [hoveredPinViewId, setHoveredPinViewId] = useState(null);
    const [pinFocadoId, setPinFocadoId] = useState(null); 
    const [isPreparingPrint, setIsPreparingPrint] = useState(false);
    const [mostrarPins, setMostrarPins] = useState(true); 
    const [temaCompletoVisualizar, setTemaCompletoVisualizar] = useState(null);

    const modalLeitor = disclosureLeitor();
    const modalProposta = useDisclosure();
    const [materialSelecionado, setMaterialSelecionado] = useState(null);
    const [filtroCompetenciaView, setFiltroCompetenciaView] = useState(null);
    function disclosureLeitor() { const { isOpen, onOpen, onClose } = useDisclosure(); return { isOpen, onOpen, onClose }; }

    const carregarGabaritoPins = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/gestao/gabarito-pins/', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            setGabaritoPins(res.data);
        } catch (e) {
            console.log("Nenhum gabarito de pins encontrado.");
        }
    };

    useEffect(() => { 
        const params = new URLSearchParams(location.search); 
        const urlAba = params.get('aba'); 
        if (urlAba) setAba(urlAba); else setAba('fila'); 
    }, [location.search]);

    useEffect(() => { 
        const verificarPermissao = async () => {
            const token = localStorage.getItem('token'); 
            if (!token) { navigate('/'); return; }
            try { 
                const r = await axios.get('http://127.0.0.1:8000/api/me/', { headers: { Authorization: `Bearer ${token}` } });
                if (!r.data.is_corretor && !r.data.is_staff) { toast({ title: 'Acesso Negado', status: 'error' }); navigate('/painel-aluno'); } 
                else { 
                    setUsuario(r.data); carregarFila(); carregarHistorico(); carregarRespostasRapidas(); carregarCarteira(); carregarMateriais(); carregarConfiguracoes(); carregarGabaritoPins();
                }
            } catch (e) { navigate('/'); }
        };
        verificarPermissao(); 
    }, [navigate]);

    useEffect(() => {
        let interval;
        if (aba === 'fila' && !localStorage.getItem('redacao_em_andamento')) { 
            interval = setInterval(() => { carregarFila(); }, 10000); 
        } else if (aba === 'carteira') { 
            interval = setInterval(() => { carregarCarteira(); }, 10000); 
        }
        return () => clearInterval(interval);
    }, [aba]);

    const carregarFila = async () => { try { const r = await axios.get('http://127.0.0.1:8000/api/fila/', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); setFila(r.data); } catch (e) {} };
    const carregarHistorico = async () => { try { const r = await axios.get('http://127.0.0.1:8000/api/corretor/historico/', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); setHistorico(r.data); } catch (e) {} };
    const carregarCarteira = async () => { try { const r = await axios.get('http://127.0.0.1:8000/api/corretor/carteira/', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); setCarteira(processarCarteira(r.data)); } catch (e) {} };
    const carregarRespostasRapidas = async () => { try { const r = await axios.get('http://127.0.0.1:8000/api/respostas-rapidas/', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); setTodasRespostas(r.data); } catch (e) {} };
    const carregarMateriais = async () => { try { const r = await axios.get('http://127.0.0.1:8000/api/materiais/', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); setMateriais(r.data.filter(m => m.categoria.startsWith('CORRETOR_'))); } catch (e) {} };
    const carregarConfiguracoes = async () => { try { const res = await axios.get('http://127.0.0.1:8000/api/gestao/configuracoes/', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); setConfigPlataforma(res.data); } catch (e) {} };

    const solicitarSaque = async () => {
        try { 
            const payload = { valor_exato: carteira.saldo_atual, qtd_normal: carteira.qtd_normal_pendente, qtd_vip: carteira.qtd_vip_pendente };
            await axios.post('http://127.0.0.1:8000/api/corretor/solicitar-saque/', payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
            toast({ title: 'Saque solicitado!', status: 'success' }); 
            carregarCarteira(); 
        } catch (e) { 
            toast({ title: 'Erro', description: e.response?.data?.erro || "Erro ao solicitar", status: 'error' }); 
        }
    };

    const abrirFeedbackHistorico = async (id) => { 
        try { 
            const response = await axios.get(`http://127.0.0.1:8000/api/redacao/${id}/`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
            let dados = response.data; 
            if (dados.texto && dados.texto.trim() !== '') { dados.conteudoTexto = dados.texto; } else if (dados.arquivo && dados.arquivo.endsWith('.txt')) { const textRes = await axios.get(dados.arquivo); dados.conteudoTexto = textRes.data; } 
            
            try {
                const temaId = dados.tema || dados.tema_id || (dados.tema_obj && dados.tema_obj.id);
                if (temaId) {
                    const temaRes = await axios.get(`http://127.0.0.1:8000/api/temas/${temaId}/`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
                    setTemaCompletoVisualizar(temaRes.data);
                }
            } catch (e) { console.log('Erro ao baixar tema', e); }

            setFiltroCompetenciaView(null);
            setRedacaoVisualizar(dados); 
        } catch (e) { toast({ title: "Erro ao abrir histórico", status: "error"}); } 
    };

    const abrirMaterialVisualizador = (m) => {
        setMaterialSelecionado(m);
        modalLeitor.onOpen();
    };

    const imprimirDocumentoOculto = (html) => {
        setIsPreparingPrint(true); 
        const iframe = document.createElement('iframe'); iframe.style.position = 'fixed'; iframe.style.right = '0'; iframe.style.bottom = '0'; iframe.style.width = '0px'; iframe.style.height = '0px'; iframe.style.border = 'none'; 
        document.body.appendChild(iframe);
        iframe.contentWindow.document.open(); iframe.contentWindow.document.write(html); iframe.contentWindow.document.close();
        setTimeout(() => { setIsPreparingPrint(false); iframe.contentWindow.focus(); iframe.contentWindow.print(); setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 1000); }, 1000); 
    };

    const handlePrintRecibo = (recibo) => {
        const baseUrl = window.location.origin; 
        const dataAtual = new Date(recibo.data || recibo.data_solicitacao || new Date()).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }); 
        const valorExtenso = valorPorExtenso(recibo.valor); const valorFormatado = parseFloat(recibo.valor).toFixed(2).replace('.', ','); const totalRedacoes = (recibo.qtd_normal || 0) + (recibo.qtd_vip || 0);
        const razaoSocial = configPlataforma?.razao_social_plataforma || 'Guia do Texto Plataforma Educacional'; const cnpjEmpresa = configPlataforma?.cnpj_plataforma || '00.000.000/0001-00';
        
        let dadosBancariosHtml = '';
        if (usuario.chave_pix) dadosBancariosHtml += `<li><strong>Chave Pix:</strong> ${usuario.chave_pix} ${usuario.tipo_chave_pix ? `(${usuario.tipo_chave_pix})` : ''}</li>`;
        if (usuario.banco || usuario.agencia_conta) { const agencia = usuario.agencia_conta?.split('Cc:')[0]?.replace('Ag:', '').trim() || ''; const conta = usuario.agencia_conta?.split('Cc:')[1]?.trim() || ''; if (usuario.banco) dadosBancariosHtml += `<li><strong>Banco:</strong> ${usuario.banco}</li>`; if (agencia) dadosBancariosHtml += `<li><strong>Agência:</strong> ${agencia}</li>`; if (conta) dadosBancariosHtml += `<li><strong>Conta Corrente nº:</strong> ${conta}</li>`; }
        if (!dadosBancariosHtml) dadosBancariosHtml = `<li><em>Nenhum dado para recebimento foi fornecido no cadastro do prestador.</em></li>`;
        
        const html = `<!DOCTYPE html><html><head><title>Recibo de Pagamento</title><style>@page { size: A4 portrait; margin: 12mm 15mm; } body { margin: 0; padding: 0; font-family: 'Times New Roman', serif; color: black; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid black; padding-bottom: 12px; margin-bottom: 30px; } .logo-container img { max-height: 35px; object-fit: contain; } .title-container { text-align: right; } .title { font-size: 22px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; } .subtitle { font-size: 14px; color: #555; } .content p { font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 20px; } .details { padding-left: 10px; margin-bottom: 20px; font-size: 15px; line-height: 1.8; background-color: #fcfcfc; border: 1px solid #eee; padding: 15px; border-radius: 5px; } .signature-section { margin-top: 50px; text-align: center; width: 60%; margin-left: auto; margin-right: auto; } .signature-line { border-top: 1px solid black; margin-bottom: 8px; } .nota { margin-top: 40px; border: 1px dashed gray; padding: 15px; background-color: #f9f9f9; } .nota h4 { margin-top: 0; font-size: 13px; margin-bottom: 8px; } .nota p { font-size: 13px; margin-bottom: 10px; line-height: 1.5; text-align: justify; } .nota ul { list-style-type: none; padding-left: 10px; margin: 0; } .nota li { font-size: 13px; margin-bottom: 5px; } .nota li::before { content: "•"; margin-right: 8px; font-weight: bold; }</style></head><body><div class="header"><div class="logo-container"><img src="${baseUrl}/logo-print.png" alt="Logo" onerror="this.style.display='none';" /></div><div class="title-container"><div class="title">Recibo de Pagamento</div><div class="subtitle">${razaoSocial}</div></div></div><div class="content"><p>Declaro, para os devidos fins, que RECEBI da empresa <strong>${razaoSocial}</strong>, inscrita no CNPJ sob o nº <strong>${cnpjEmpresa}</strong>, a quantia de <strong>R$ ${valorFormatado} (${valorExtenso})</strong>, referente aos serviços de correção de redações na plataforma.</p><p style="font-weight: bold; margin-bottom: 10px;">Detalhe dos Serviços Prestados:</p><div class="details"><div style="margin-bottom: 8px;"><strong>Serviço realizado:</strong> Correção e análise pedagógica de <strong>${totalRedacoes}</strong> redação(ões) submetida(s) na plataforma.</div><div style="margin-bottom: 4px;"><strong>Sendo:</strong></div><div style="padding-left: 15px;">- <strong>${recibo.qtd_normal}</strong> Correções Normais</div><div style="padding-left: 15px;">- <strong>${recibo.qtd_vip}</strong> Correções VIPs (Urgência)</div></div><p>Declaro, ainda, que os serviços prestados foram realizados de forma eventual e autônoma, sem habitualidade, pessoalidade ou subordinação, não caracterizando, portanto, vínculo empregatício de qualquer natureza.</p><p>Com este pagamento, dou plena, geral e irrevogável quitação, nada mais tendo a exigir, a qualquer título, com relação ao serviço mencionado. E, por ser verdade, firmo o presente.</p><div style="text-align: right; margin-top: 30px; margin-bottom: 40px; font-size: 15px;">Rio de Janeiro/RJ, ${dataAtual}.</div><div class="signature-section"><div class="signature-line"></div><div style="font-weight: bold; font-size: 15px;">${usuario.first_name} ${usuario.last_name}</div><div style="font-size: 13px; color: #333;">CPF: ${usuario.cpf || 'Não informado'}</div></div></div><div class="nota"><h4>NOTA DE RESPONSABILIDADE:</h4><p>Este recibo somente terá validade mediante a apresentação do comprovante de transferência bancária efetuada pela Guia do Texto. O repasse financeiro foi realizado estritamente para os dados bancários e/ou chave PIX validados pelo próprio prestador em seu cadastro na plataforma, isentando a contratante de responsabilidade por dados incorretos, conforme listado abaixo:</p><ul>${dadosBancariosHtml}</ul></div></body></html>`;
        imprimirDocumentoOculto(html);
    };

    const getPinTitle = (pin) => {
        if (pin.competencia === 0) return "OUTROS (Geral)";
        return `Competência ${pin.competencia}`;
    };

    const getImagemUrl = (caminho) => {
        if (!caminho) return '';
        if (typeof caminho !== 'string') return '';
        return caminho.startsWith('http') ? caminho : `http://127.0.0.1:8000${caminho}`;
    };

    // TELA DE LEITURA DO HISTÓRICO PARA O CORRETOR
    if (redacaoVisualizar) {
        const tipoAtual = redacaoVisualizar.tema_tipo?.toUpperCase() || redacaoVisualizar.tipo?.toUpperCase() || 'ENEM';
        const isPadrao = tipoAtual === 'PADRAO_10' || tipoAtual === 'PADRAO_100' || tipoAtual === 'SIMPLES';
        const isPadrao10 = tipoAtual === 'PADRAO_10';
        const numComps = isPadrao ? [1,2,3,4] : [1,2,3,4,5];
        const compsAtuais = isPadrao ? INFO_COMPETENCIAS_PADRAO : INFO_COMPETENCIAS_ENEM;
        
        const anotacoes = redacaoVisualizar.correcao?.anotacoes || [];
        const contagem = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 0: 0, total: anotacoes.length };
        anotacoes.forEach(pin => { if (pin.competencia !== undefined) contagem[pin.competencia]++; });

        const conteudoComentarios = renderComentarioGeralHist(redacaoVisualizar.correcao?.comentario_geral);
        const descricaoProposta = temaCompletoVisualizar?.descricao || redacaoVisualizar.tema_descricao || '';
        const motivadoresAtuais = temaCompletoVisualizar?.motivadores || redacaoVisualizar.motivadores || redacaoVisualizar.tema_motivadores || [];

        return (
          <Flex h="100vh" overflow="hidden" w="full" bg="gray.100" direction={{ base: 'column', lg: 'row' }}>
              
              {/* ========================================== */}
              {/* COLUNA ESQUERDA: VISUALIZADOR DA REDAÇÃO */}
              {/* ========================================== */}
              <Box flex="1" display="flex" flexDirection="column" bg="gray.200" overflow="hidden">
                  
                  {/* CABEÇALHOS FIXOS NO TOPO DA COLUNA ESQUERDA */}
                  <Flex direction="column" bg="white" shadow="sm" zIndex={10}>
                      
                      {/* LINHA 1: TÍTULO E BOTÃO PROPOSTA */}
                      <Flex justify="space-between" align="center" p={4} borderBottom="1px solid" borderColor="gray.100" wrap="wrap" gap={3}>
                          <HStack spacing={4}>
                              <Button leftIcon={<ArrowBackIcon />} onClick={() => setRedacaoVisualizar(null)} variant="ghost" colorScheme="gray">Voltar</Button>
                              <Divider orientation="vertical" h="24px" display={{ base: 'none', md: 'block' }} />
                              <VStack align="start" spacing={0}>
                                  <Heading size="md" color="gray.800">Feedback Histórico</Heading>
                                  <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">ALUNO: {redacaoVisualizar.aluno_nome}</Text>
                              </VStack>
                          </HStack>
                          <HStack spacing={4}>
                              <Button size="sm" colorScheme="blue" variant="outline" leftIcon={<InfoIcon />} onClick={modalProposta.onOpen} shadow="sm">Ver Proposta</Button>
                          </HStack>
                      </Flex>

                      {/* LINHA 2: BARRA TÁTICA DE PINS COM Z-INDEX BAIXO PARA NÃO ESMAGAR POPOVERS */}
                      <Flex position="sticky" top={{ base: "0", md: "16px" }} zIndex={10} justify="space-between" align="center" w="full" bg="rgba(255, 255, 255, 0.85)" backdropFilter="blur(16px)" p={3} px={5} mb={4} borderRadius="xl" boxShadow="md" border="1px solid" borderColor="gray.200" flexShrink={0}>
                          <HStack spacing={3} overflowX="auto" pb={{base: 2, md: 0}} css={{ '&::-webkit-scrollbar': { display: 'none' } }}>
                              <Text fontSize="xs" fontWeight="bold" color="gray.600" textTransform="uppercase" whiteSpace="nowrap">Filtrar Marcações:</Text>
                              <HStack spacing={2}>
                                  <Button size="xs" variant={filtroCompetenciaView === null ? 'solid' : 'outline'} colorScheme="gray" onClick={() => setFiltroCompetenciaView(null)}>
                                      Todas ({contagem.total})
                                  </Button>
                                  {[...numComps, 0].map(c => {
                                      const info = compsAtuais.find(x => x.id === c);
                                      const scheme = info.cor === 'black' ? 'gray' : info.cor.split('.')[0];
                                      return (
                                          <Button key={c} size="xs" variant={filtroCompetenciaView === c ? 'solid' : 'outline'} colorScheme={scheme} onClick={() => setFiltroCompetenciaView(c === filtroCompetenciaView ? null : c)}>
                                              {c === 0 ? `OUTROS (${contagem[c]})` : `C${c} (${contagem[c]})`}
                                          </Button>
                                      );
                                  })}
                              </HStack>
                          </HStack>
                          <HStack spacing={3} ml={4} flexShrink={0}>
                              <Button size="xs" onClick={() => setMostrarPins(!mostrarPins)} leftIcon={<Icon as={mostrarPins ? ViewOffIcon : ViewIcon} />} colorScheme="gray" variant="ghost">
                                  {mostrarPins ? "Ocultar Tudo" : "Mostrar Tudo"}
                              </Button>
                          </HStack>
                      </Flex>
                  </Flex>

                  {/* ÁREA DA IMAGEM E PINS (SCROLL INDEPENDENTE) */}
                  <Box flex={1} overflowY="auto" p={{ base: 4, lg: 8 }} display="flex" justifyContent="center">
                      <Box position="relative" display="inline-block" height="fit-content" boxShadow="dark-lg" bg="white" w={redacaoVisualizar.arquivo ? "full" : "700px"} maxW={redacaoVisualizar.arquivo ? "900px" : "700px"} flexShrink={redacaoVisualizar.arquivo ? 1 : 0} onClick={() => setPinFocadoId(null)}>
                          
                          {redacaoVisualizar.arquivo ? ( 
                              <Image src={getImagemUrl(redacaoVisualizar.arquivo)} alt="Redação" display="block" w="100%" h="auto" /> 
                          ) : redacaoVisualizar.conteudoTexto ? (
                              <Box p="0" position="relative" minHeight="1216px" bgImage="linear-gradient(transparent 39px, #ccc 40px)" bgSize="100% 40px">
                                  <Box position="absolute" left={0} top={0} bottom={0} w="40px" borderRight="1px solid #ccc" bg="gray.50" pt="8px" pointerEvents="none" zIndex={2}>
                                      {Array.from({length: 30}).map((_, i) => (
                                          <Text key={i} h="40px" lineHeight="40px" textAlign="center" fontSize="12px" color="gray.400" fontWeight="bold" m={0} p={0}>{i + 1}</Text>
                                      ))}
                                  </Box>
                                  <Box pl="55px" pr="20px" pt="8px" pb="8px" whiteSpace="pre-wrap" fontFamily="Arial, sans-serif" fontSize="16px" lineHeight="40px" color="gray.800">
                                      {redacaoVisualizar.conteudoTexto}
                                  </Box>
                              </Box>
                           ) : null}
                          
                          {mostrarPins && anotacoes.filter(p => filtroCompetenciaView === null || p.competencia === filtroCompetenciaView).map((pin) => { 
                              const info = compsAtuais.find(c => c.id === pin.competencia); if(!info) return null; 
                              
                              const isHovered = hoveredPinViewId === pin.id; 
                              const isFocused = pinFocadoId === pin.id;
                              const isOtherFocused = pinFocadoId !== null && pinFocadoId !== pin.id;

                              if (isOtherFocused) return null;

                              return (
                                  <Box key={pin.id}>
                                      {/* CAIXA DE COR DO PIN NO DOCUMENTO */}
                                      <Box position="absolute" left={`${pin.x}%`} top={`${pin.y}%`} w={`${pin.width}%`} h={`${pin.height}%`} bg={info.cor} opacity={isHovered || isFocused ? 0.4 : 0} pointerEvents="none" transition="opacity 0.2s" zIndex={2} />
                                      {!isFocused && (
                                          <Popover trigger="hover" placement="top" openDelay={0} isLazy>
                                              <PopoverTrigger>
                                                  {/* TRIGGER: Z-Index baixo para não esmagar a barra sticky ao fazer scroll */}
                                                  <Box position="absolute" left={`calc(${pin.x}% + ${pin.width}% - 6px)`} top={`calc(${pin.y}% - 22px)`} cursor="pointer" zIndex={isHovered || isFocused ? 5 : 2} display="flex" alignItems="center" justifyContent="center" onClick={(e) => { e.stopPropagation(); setPinFocadoId(pin.id); }} onMouseEnter={() => setHoveredPinViewId(pin.id)} onMouseLeave={() => setHoveredPinViewId(null)}>
                                                      <CustomPinSVG cor={info.cor} numero={pin.competencia} />
                                                  </Box>
                                              </PopoverTrigger>
                                              <Portal>
                                                  {/* POPOVER (BALÃO): Z-Index extremo via rootProps */}
                                                  <PopoverContent rootProps={{ style: { zIndex: 99999 } }} zIndex={99999} w="300px" boxShadow="2xl" borderRadius="2xl" overflow="hidden" border="1px solid" borderColor="gray.100" onMouseEnter={() => setHoveredPinViewId(pin.id)} onMouseLeave={() => setHoveredPinViewId(null)}>
                                                      <PopoverArrow bg={info.bg} /> 
                                                      <PopoverHeader bg={info.bg} fontWeight="bold" color={info.cor} borderBottom="none" fontSize="sm">{getPinTitle(pin)}</PopoverHeader>
                                                      <PopoverBody fontSize="sm" bg="white"><Text color="gray.700">{pin.texto}</Text></PopoverBody>
                                                  </PopoverContent>
                                              </Portal>
                                          </Popover>
                                      )}
                                  </Box>
                              ); 
                          })}
                      </Box>
                  </Box>
              </Box>

              {/* ========================================== */}
              {/* COLUNA DIREITA: SIDEBAR DO CORRETOR */}
              {/* ========================================== */}
              <Box w={{ base: '100%', lg: '400px' }} bg="white" borderLeft="1px solid" borderColor="gray.300" display="flex" flexDirection="column" shadow="2xl" zIndex={20}>
                  
                  {/* CABEÇALHO DA SIDEBAR: TIPO E NOTA TOTAL ALINHADOS À DIREITA */}
                  <Flex h="80px" px={6} justify="flex-end" align="center" borderBottom="1px solid" borderColor="gray.200" bg="gray.50" gap={4} flexShrink={0}>
                      <Badge bg={isPadrao10 ? 'purple.50' : (isPadrao ? 'blue.50' : 'green.50')} color={isPadrao10 ? 'purple.700' : (isPadrao ? 'blue.700' : 'green.700')} px={4} py={1.5} borderRadius="md" fontSize="sm">
                          {tipoAtual.replace('_', ' ')}
                      </Badge>
                      <HStack bg="green.50" px={4} py={1.5} borderRadius="full" border="1px solid" borderColor="green.200" shadow="sm">
                          <Text fontSize="xs" fontWeight="bold" color="green.600">NOTA TOTAL</Text>
                          <Text fontSize="xl" fontWeight="900" color="green.700">{redacaoVisualizar.correcao?.nota_final || 0}</Text>
                      </HStack>
                  </Flex>

                  {/* CORPO DA SIDEBAR (SCROLL INDEPENDENTE) */}
                  <Box flex="1" overflowY="auto" p={6}>
                      <VStack align="stretch" spacing={6}>
                          <Box bg="gray.50" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
                              <Heading size="xs" color="gray.500" mb={1}>TEMA DA REDAÇÃO</Heading>
                              <Text fontWeight="bold">{redacaoVisualizar.tema_titulo}</Text>
                          </Box>
                          
                          {conteudoComentarios && (
                              <Box>
                                  <Heading size="xs" mb={3} color="gray.600" textTransform="uppercase">Comentários e Avisos</Heading>
                                  {conteudoComentarios}
                              </Box>
                          )}
                          
                          <Divider borderColor="gray.300" />
                          <Heading size="sm" color="gray.700" textTransform="uppercase">Desempenho</Heading>
                          <VStack spacing={4} align="stretch" width="100%">
                              {redacaoVisualizar.correcao?.competencias?.map((comp) => { 
                                  const info = isPadrao ? INFO_COMPETENCIAS_PADRAO.find(c => c.id === comp.comp) : INFO_COMPETENCIAS_ENEM.find(c => c.id === comp.comp); if(!info) return null; 
                                  return (
                                      <Box key={comp.comp} p={4} border="1px solid" borderColor="gray.200" borderRadius="lg" bg="white">
                                          <Flex justify="space-between" mb={2} align="center">
                                              <Badge bg={info.bg} color={info.cor} textTransform="uppercase" fontSize="xs">COMPETÊNCIA {comp.comp}</Badge>
                                              <Text fontWeight="bold">{comp.nota} pts</Text>
                                          </Flex>
                                          <Text fontSize="sm" fontWeight="bold" mb={3}>{info.nome}</Text>
                                          <Divider mb={3}/>
                                          {comp.comentario ? <Text fontSize="sm" color="gray.600" bg="gray.50" p={3} borderRadius="md" fontStyle="italic" whiteSpace="pre-wrap">{comp.comentario}</Text> : <Text fontSize="xs" color="gray.400">Sem apontamentos adicionais.</Text>}
                                      </Box>
                                  ); 
                              })}
                          </VStack>

                      </VStack>
                  </Box>
              </Box>

              <Modal isOpen={modalProposta.isOpen} onClose={modalProposta.onClose} size="3xl" scrollBehavior="inside">
                  <ModalOverlay backdropFilter="blur(3px)" />
                  <ModalContent borderRadius="xl" maxH="80vh">
                      <ModalHeader bg="blue.600" color="white" borderTopRadius="xl">Comando da Proposta & Textos Motivadores</ModalHeader>
                      <ModalCloseButton color="white" mt={1} />
                      <ModalBody py={6}>
                          <Heading size="sm" color="gray.700" textTransform="uppercase" borderLeft="4px solid" borderColor="blue.500" pl={3} mb={3}>Comando da Proposta</Heading>
                          <Box className="texto-limpo" dangerouslySetInnerHTML={{ __html: formatarTexto(descricaoProposta) }} mb={8} bg="gray.50" p={5} borderRadius="lg" border="1px solid" borderColor="gray.100" />
                          
                          <Heading size="sm" color="gray.700" mb={4} textTransform="uppercase" borderLeft="4px solid" borderColor="blue.500" pl={3}>Textos Motivadores</Heading>
                          <VStack align="stretch" spacing={6}>
                              {motivadoresAtuais && motivadoresAtuais.length > 0 ? (
                                  motivadoresAtuais.map((m, i) => (
                                      <Card key={i} borderLeft="4px solid" borderLeftColor="yellow.400" bg="yellow.50" shadow="none">
                                          <CardBody>
                                              <Heading size="xs" color="yellow.800" mb={4} textTransform="uppercase">Texto Motivador {ROMAN_NUMERALS[i] || i + 1}</Heading>
                                              {m.tipo === 'texto' ? <Box dangerouslySetInnerHTML={{__html: formatarTexto(m.conteudo)}} /> : <Image src={getImagemUrl(m.arquivo)} maxH="400px" borderRadius="md" />}
                                          </CardBody>
                                      </Card>
                                  ))
                              ) : (
                                  <Text color="gray.500" fontStyle="italic">Sem textos motivadores anexados a este tema.</Text>
                              )}
                          </VStack>
                      </ModalBody>
                      <ModalFooter bg="gray.50" borderBottomRadius="xl"><Button onClick={modalProposta.onClose}>Fechar</Button></ModalFooter>
                  </ModalContent>
              </Modal>

          </Flex>
        );
    }

    return (
        <Box w="full" h="100%">
            {aba === 'fila' && <AbaCorretorFila fila={fila} carregarFila={carregarFila} usuario={usuario} carregarHistorico={carregarHistorico} carregarCarteira={carregarCarteira} configPlataforma={configPlataforma} todasRespostas={todasRespostas} />}
            {aba === 'historico' && <AbaCorretorHistorico historico={historico} abrirFeedbackHistorico={abrirFeedbackHistorico} />}
            {aba === 'carteira' && <AbaCorretorCarteira carteira={carteira} solicitarSaque={solicitarSaque} carregarCarteira={carregarCarteira} handlePrintRecibo={handlePrintRecibo} />}
            {aba === 'respostas' && <AbaCorretorRespostas todasRespostas={todasRespostas} setTodasRespostas={setTodasRespostas} />}
            {aba === 'manuais' && <AbaCorretorManuais materiais={materiais} abrirMaterialVisualizador={abrirMaterialVisualizador} />}

            <Modal isOpen={isPreparingPrint} isCentered closeOnOverlayClick={false}>
                <ModalOverlay backdropFilter="blur(5px)" bg="blackAlpha.600" />
                <ModalContent bg="transparent" boxShadow="none" textAlign="center" color="white">
                    <VStack spacing={6}>
                        <Spinner thickness='5px' speed='0.65s' emptyColor='gray.200' color='teal.400' size='xl' />
                        <Box><Heading size="md" mb={2}>Gerando Recibo Oficial</Heading><Text color="gray.200">Preparando documento para impressão...</Text></Box>
                    </VStack>
                </ModalContent>
            </Modal>

            <Modal isOpen={modalLeitor.isOpen} onClose={modalLeitor.onClose} size="3xl" scrollBehavior="inside" isCentered>
                <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.700" />
                <ModalContent borderRadius="xl" overflow="hidden">
                    <ModalHeader borderBottom="1px solid" borderColor="gray.100" bg="gray.50">
                        <HStack mb={2}><Badge colorScheme={materialSelecionado?.categoria?.startsWith('CORRETOR_') ? 'purple' : 'teal'}>{INFOS_MANUAL[materialSelecionado?.categoria]?.nome || 'Leitura Nátiva'}</Badge></HStack>
                        <Heading size="md" color="gray.800" lineHeight="short">{materialSelecionado?.titulo}</Heading>
                    </ModalHeader>
                    <ModalCloseButton mt={2} />
                    <ModalBody py={6} bg="white">
                        <VStack align="stretch" spacing={6}>
                            {materialSelecionado?.descricao && (<Text fontSize="md" color="gray.600" fontStyle="italic" borderLeft="3px solid" borderColor="gray.300" pl={3}>{materialSelecionado.descricao}</Text>)}
                            {materialSelecionado?.dados_extras && Object.keys(materialSelecionado.dados_extras).length > 0 && (
                                <Box>
                                    {materialSelecionado.categoria === 'CORRETOR_REGUA' && materialSelecionado.dados_extras.regras && (
                                        <Box bg="red.50" p={4} borderRadius="xl" border="1px solid" borderColor="red.100"><Heading size="sm" color="red.800" mb={4} display="flex" alignItems="center" gap={2}><WarningTwoIcon /> Tabela de Penalizações</Heading><Box overflowX="auto" borderRadius="md" border="1px solid" borderColor="red.200"><Table size="sm" variant="simple" bg="white"><Thead bg="red.100"><Tr><Th w="15%">Comp.</Th><Th>Gatilho (Ação do Aluno)</Th><Th w="25%">Penalidade</Th></Tr></Thead><Tbody>{materialSelecionado.dados_extras.regras.map((r, i) => (<Tr key={i}><Td fontWeight="900" color="red.600">{r.comp}</Td><Td color="gray.700">{r.gatilho}</Td><Td fontWeight="bold" color="red.600">{r.desconto}</Td></Tr>))}</Tbody></Table></Box></Box>
                                    )}
                                    {(materialSelecionado.categoria === 'CORRETOR_REPERTORIO' || materialSelecionado.categoria === 'ALUNO_REPERTORIO') && (
                                        <Box bg="purple.50" p={5} borderRadius="xl" border="1px solid" borderColor="purple.100"><Heading size="sm" color="purple.800" mb={4} display="flex" alignItems="center" gap={2}><CheckCircleIcon /> Estrutura do Repertório</Heading><SimpleGrid columns={2} spacing={4} mb={4}><Box bg="white" p={3} borderRadius="md" border="1px solid" borderColor="purple.200"><Text fontSize="2xs" fontWeight="900" color="purple.500" textTransform="uppercase">Eixo Temático</Text><Text fontWeight="bold" color="purple.900">{materialSelecionado.dados_extras.eixo || '-'}</Text></Box><Box bg="white" p={3} borderRadius="md" border="1px solid" borderColor="purple.200"><Text fontSize="2xs" fontWeight="900" color="purple.500" textTransform="uppercase">Tipo de Repertório</Text><Text fontWeight="bold" color="purple.900">{materialSelecionado.dados_extras.tipo || '-'}</Text></Box></SimpleGrid><Box bg="white" p={4} borderRadius="md" border="1px solid" borderColor="purple.200"><Text fontSize="2xs" fontWeight="900" color="purple.500" textTransform="uppercase" mb={2}>Aplicação na Redação</Text><Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap" lineHeight="tall">{materialSelecionado.dados_extras.aplicacao || '-'}</Text></Box></Box>
                                    )}
                                    {materialSelecionado.categoria === 'CORRETOR_DESVIOS' && (
                                        <Box bg="orange.50" p={5} borderRadius="xl" border="1px solid" borderColor="orange.100"><Heading size="sm" color="orange.800" mb={4} display="flex" alignItems="center" gap={2}><EditIcon /> Dicionário de Desvios</Heading><SimpleGrid columns={2} spacing={4}><Box bg="white" p={4} borderRadius="md" border="1px solid" borderColor="red.200" borderLeft="4px solid" borderLeftColor="red.500"><Text fontSize="2xs" fontWeight="900" color="red.500" textTransform="uppercase" mb={2}>Como o aluno erra</Text><Text fontWeight="bold" color="gray.700">"{materialSelecionado.dados_extras.ex_errado}"</Text></Box><Box bg="white" p={4} borderRadius="md" border="1px solid" borderColor="green.200" borderLeft="4px solid" borderLeftColor="green.500"><Text fontSize="2xs" fontWeight="900" color="green.500" textTransform="uppercase" mb={2}>Como deveria ser</Text><Text fontWeight="bold" color="gray.700">"{materialSelecionado.dados_extras.ex_correto}"</Text></Box></SimpleGrid></Box>
                                    )}
                                </Box>
                            )}
                            {materialSelecionado?.conteudo && (<Box bg="gray.50" p={5} borderRadius="xl" border="1px solid" borderColor="gray.200"><Text whiteSpace="pre-wrap" fontSize="15px" lineHeight="1.8" color="gray.700">{materialSelecionado.conteudo}</Text></Box>)}
                        </VStack>
                    </ModalBody>
                    <ModalFooter bg="gray.100" borderTop="1px solid" borderColor="gray.200" justifyContent="space-between">
                        {materialSelecionado?.arquivo ? (<Button as="a" href={materialSelecionado.arquivo} target="_blank" colorScheme="blue" variant="outline" leftIcon={<DownloadIcon />}>Baixar PDF Anexo</Button>) : <Box />}
                        <Button colorScheme="gray" bg="white" border="1px solid" borderColor="gray.300" onClick={modalLeitor.onClose}>Fechar</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default PainelCorretor;