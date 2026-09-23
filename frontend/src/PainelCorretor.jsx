import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, Container, Flex, HStack, Button, Divider, Heading, Text, Badge, Image, 
  Popover, PopoverTrigger, Portal, PopoverContent, PopoverArrow, PopoverCloseButton, 
  PopoverHeader, PopoverBody, VStack, Modal, ModalOverlay, ModalContent, 
  ModalHeader, ModalCloseButton, ModalBody, ModalFooter, useDisclosure, useToast, Spinner,
  SimpleGrid, Table, Thead, Tbody, Tr, Th, Td, Alert, AlertIcon
} from '@chakra-ui/react';
import { ArrowBackIcon, Icon, CheckCircleIcon, WarningTwoIcon, EditIcon, ChatIcon, AttachmentIcon, DownloadIcon, InfoIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons';

import AbaCorretorFila from './abas/AbaCorretorFila';
import AbaCorretorHistorico from './abas/AbaCorretorHistorico';
import AbaCorretorCarteira from './abas/AbaCorretorCarteira';
import AbaCorretorRespostas from './abas/AbaCorretorRespostas';
import AbaCorretorManuais from './abas/AbaCorretorManuais';

const CustomPinSVG = ({ cor, numero }) => (
  <Box position="relative" w="30px" h="30px" color={cor} filter="drop-shadow(0px 3px 3px rgba(0,0,0,0.2))" transition="transform 0.2s" _hover={{ transform: 'scale(1.15)' }}>
    <Icon viewBox="0 0 24 24" w="100%" h="100%"><path fill="currentColor" d="M4 2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2z"/></Icon>
    <Text position="absolute" top="4.5px" left="2px" w="100%" textAlign="center" color="white" fontSize="12px" fontWeight="900" fontFamily="system-ui">{numero}</Text>
  </Box>
);

const INFO_COMPETENCIAS_ENEM = { 1: { nome: "Gramática", cor: "red.500", bg: "red.50" }, 2: { nome: "Tema/Estrutura/Repertório", cor: "blue.500", bg: "blue.50" }, 3: { nome: "Argumentação", cor: "orange.500", bg: "orange.50" }, 4: { nome: "Coesão", cor: "green.500", bg: "green.50" }, 5: { nome: "Proposta", cor: "purple.500", bg: "purple.50" } };
const INFO_COMPETENCIAS_SIMPLES = { 1: { nome: "Gramática", cor: "red.500", bg: "red.50" }, 2: { nome: "Estrutura/Tema/Repertório", cor: "blue.500", bg: "blue.50" }, 3: { nome: "Argumentação", cor: "yellow.500", bg: "yellow.50" }, 4: { nome: "Coesão e coerência", cor: "green.500", bg: "green.50" } };

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

const renderComentarioGeralHist = (texto) => {
    if (!texto) return null;
    
    const parts = texto.split(/(?=\[.*?\])/);
    
    return (
        <VStack align="stretch" spacing={3}>
            {parts.map((part, idx) => {
                if (!part.trim()) return null;
                let title = "Comentário Geral";
                let content = part.trim();
                let color = "blue";
                
                const titleMatch = part.match(/^\[(.*?)\]/);
                if (titleMatch) {
                    title = titleMatch[1];
                    content = part.replace(titleMatch[0], '').trim();
                    
                    const tUpper = title.toUpperCase();
                    if (tUpper.includes("FALHA GRAVE REPORTADA") || tUpper.includes("SINALIZADO")) color = "orange";
                    else if (tUpper.includes("TRIAGEM TÉCNICA")) color = "pink";
                    else if (tUpper.includes("FALHA GRAVE CONFIRMADA") || tUpper.includes("REDAÇÃO DEVOLVIDA")) color = "red";
                    else if (tUpper.includes("ALERTA DA COORDENAÇÃO") || tUpper.includes("REFAZER")) color = "purple";
                    else if (tUpper.includes("RECURSO SOLICITADO")) color = "cyan";
                    else if (tUpper.includes("RESPOSTA AO RECURSO")) color = "green";
                } else if (content.includes("Detalhes do Professor:")) {
                    title = "Detalhes do Professor";
                    content = content.replace("Detalhes do Professor:", "").trim();
                    color = "gray";
                }
                
                return (
                    <Box key={idx} bg={`${color}.50`} p={4} borderRadius="md" border="1px solid" borderColor={`${color}.200`} borderLeft="4px solid" borderLeftColor={`${color}.500`}>
                        <Text fontSize="xs" fontWeight="bold" color={`${color}.800`} textTransform="uppercase" mb={1}>{title}</Text>
                        {content && <Text fontSize="sm" color={`${color}.900`} whiteSpace="pre-wrap" lineHeight="tall">{content}</Text>}
                    </Box>
                );
            })}
        </VStack>
    );
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

    const [redacaoVisualizar, setRedacaoVisualizar] = useState(null);
    const [hoveredPinViewId, setHoveredPinViewId] = useState(null);
    const [pinFocadoId, setPinFocadoId] = useState(null); 
    const [isPreparingPrint, setIsPreparingPrint] = useState(false);
    const [mostrarPins, setMostrarPins] = useState(true); 

    const modalLeitor = disclosureLeitor();
    const [materialSelecionado, setMaterialSelecionado] = useState(null);
    function disclosureLeitor() { const { isOpen, onOpen, onClose } = useDisclosure(); return { isOpen, onOpen, onClose }; }

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
                    setUsuario(r.data); carregarFila(); carregarHistorico(); carregarRespostasRapidas(); carregarCarteira(); carregarMateriais(); carregarConfiguracoes(); 
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
        if (pin.competencia === 1 && pin.tipo_erro && pin.tipo_erro !== 'Geral') { return `Competência 1 - ${pin.tipo_erro}`; }
        return `Competência ${pin.competencia}`;
    };

    const getImagemUrl = (caminho) => {
        if (!caminho) return '';
        if (typeof caminho !== 'string') return '';
        return caminho.startsWith('http') ? caminho : `http://127.0.0.1:8000${caminho}`;
    };

    if (redacaoVisualizar) {
        const isSimples = redacaoVisualizar.tema_tipo?.toUpperCase() === 'SIMPLES' || redacaoVisualizar.tipo?.toUpperCase() === 'SIMPLES';
        return (
          <Container maxW="full" p={0} h="100vh" display="flex" flexDirection="column">
              <Flex justify="space-between" align="center" bg="white" p={4} borderBottom="1px solid" borderColor="gray.200" shadow="sm" zIndex={10}>
                <HStack spacing={4}>
                  <Button leftIcon={<ArrowBackIcon />} onClick={() => setRedacaoVisualizar(null)} variant="ghost" colorScheme="gray">Voltar</Button>
                  <Divider orientation="vertical" h="24px" display={{ base: 'none', md: 'block' }} />
                  <VStack align="start" spacing={0}><HStack alignItems="center"><Heading size="md" color="gray.800">Feedback Histórico</Heading><Badge bg={isSimples ? 'blue.50' : 'green.50'} color={isSimples ? 'blue.700' : 'green.700'} px={3} py={1} borderRadius="md" fontSize="md">{redacaoVisualizar.tema_tipo || redacaoVisualizar.tipo || 'ENEM'}</Badge></HStack><Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">ALUNO: {redacaoVisualizar.aluno_nome}</Text></VStack>
                </HStack>
                <HStack spacing={4}>
                  <Button size="sm" onClick={() => setMostrarPins(!mostrarPins)} leftIcon={<Icon as={mostrarPins ? ViewOffIcon : ViewIcon} />} colorScheme="gray" variant="outline" shadow="sm">
                      {mostrarPins ? "Ocultar Marcações" : "Mostrar Marcações"}
                  </Button>
                  <Divider orientation="vertical" h="24px" display={{ base: 'none', md: 'block' }} />
                  <HStack bg="green.50" px={4} py={1} borderRadius="full" border="1px solid" borderColor="green.200"><Text fontSize="xs" fontWeight="bold" color="green.600" textTransform="uppercase">Nota Total</Text><Text fontSize="xl" fontWeight="800" color="green.700">{redacaoVisualizar.correcao?.nota_final || 0}</Text></HStack>
                </HStack>
              </Flex>
              <Flex h="full" w="full" overflow="hidden">
                  <Box flex={1} overflow="auto" p={8} display="flex" justifyContent="center" bg="gray.200">
                      <Box position="relative" display="inline-block" height="fit-content" boxShadow="dark-lg" bg="white" border="1px solid" borderColor="gray.200" borderRadius="sm" w={redacaoVisualizar.conteudoTexto ? "700px" : "full"} maxW={redacaoVisualizar.conteudoTexto ? "700px" : "900px"} flexShrink={redacaoVisualizar.conteudoTexto ? 0 : 1} onClick={() => setPinFocadoId(null)}>
                          {redacaoVisualizar.conteudoTexto ? ( 
                              <Box p="0" position="relative" minHeight="1216px" bgImage="linear-gradient(transparent 39px, #ccc 40px)" bgSize="100% 40px">
                                  <Box position="absolute" left={0} top={0} bottom={0} w="40px" borderRight="1px solid #ccc" bg="gray.50" pt="8px" pointerEvents="none" zIndex={2}>
                                      {/* CORREÇÃO DAS 30 LINHAS NO CORRETOR */}
                                      {Array.from({length: 30}).map((_, i) => (
                                          <Text key={i} h="40px" lineHeight="40px" textAlign="center" fontSize="12px" color="gray.400" fontWeight="bold" m={0} p={0}>{i + 1}</Text>
                                      ))}
                                  </Box>
                                  <Box pl="55px" pr="20px" pt="8px" pb="8px" whiteSpace="pre-wrap" fontFamily="Arial, sans-serif" fontSize="16px" lineHeight="40px" color="gray.800">
                                      {redacaoVisualizar.conteudoTexto}
                                  </Box>
                              </Box>
                           ) : ( <Image src={getImagemUrl(redacaoVisualizar.arquivo)} alt="Redação" display="block" w="100%" h="auto" /> )}
                          
                          {mostrarPins && redacaoVisualizar.correcao?.anotacoes?.map((pin) => { 
                              if(!pin.x) return null; const info = isSimples ? INFO_COMPETENCIAS_SIMPLES[pin.competencia] : INFO_COMPETENCIAS_ENEM[pin.competencia]; if(!info) return null; 
                              
                              const isHovered = hoveredPinViewId === pin.id; 
                              const isFocused = pinFocadoId === pin.id;
                              const isOtherFocused = pinFocadoId !== null && pinFocadoId !== pin.id;

                              if (isOtherFocused) return null;

                              return (
                                  <Box key={pin.id}>
                                      <Box position="absolute" left={`${pin.x}%`} top={`${pin.y}%`} w={`${pin.width}%`} h={`${pin.height}%`} bg={info.cor} opacity={isHovered || isFocused ? 0.4 : 0} pointerEvents="none" transition="opacity 0.2s" zIndex={4} />
                                      {!isFocused && (
                                          <Popover trigger="hover" placement="top" openDelay={0} isLazy>
                                              <PopoverTrigger><Box position="absolute" left={`calc(${pin.x}% + ${pin.width}% - 6px)`} top={`calc(${pin.y}% - 28px)`} cursor="pointer" zIndex={10} display="flex" alignItems="center" justifyContent="center" onClick={(e) => { e.stopPropagation(); setPinFocadoId(pin.id); }} onMouseEnter={() => setHoveredPinViewId(pin.id)} onMouseLeave={() => setHoveredPinViewId(null)}><CustomPinSVG cor={info.cor} numero={pin.competencia} /></Box></PopoverTrigger>
                                              <Portal><PopoverContent zIndex={9999} w="300px" boxShadow="2xl" borderRadius="2xl" overflow="hidden" border="1px solid" borderColor="gray.100" onMouseEnter={() => setHoveredPinViewId(pin.id)} onMouseLeave={() => setHoveredPinViewId(null)}><PopoverArrow bg={info.bg} /> 
                                                  <PopoverHeader bg={info.bg} fontWeight="bold" color={info.cor} borderBottom="none" fontSize="sm">{getPinTitle(pin)}</PopoverHeader>
                                                  <PopoverBody fontSize="sm" bg="white"><Text color="gray.700">{pin.texto}</Text></PopoverBody></PopoverContent></Portal>
                                          </Popover>
                                      )}
                                  </Box>
                              ); 
                          })}
                      </Box>
                  </Box>
                  <Box w="400px" bg="white" borderLeft="1px solid #ddd" overflowY="auto" p={6}>
                      <VStack align="stretch" spacing={6}>
                          <Box bg="gray.50" p={4} borderRadius="md" border="1px solid" borderColor="gray.200"><Heading size="xs" color="gray.500" mb={1}>TEMA DA REDAÇÃO</Heading><Text fontWeight="bold" fontSize="sm">{redacaoVisualizar.tema_titulo}</Text></Box>
                          
                          {redacaoVisualizar.correcao?.comentario_geral && (
                            <Box><Heading size="xs" mb={3} color="gray.600" textTransform="uppercase">Comentários e Avisos</Heading>{renderComentarioGeralHist(redacaoVisualizar.correcao.comentario_geral)}</Box>
                          )}

                          <Divider borderColor="gray.300" /><Heading size="sm" color="gray.700" textTransform="uppercase">Desempenho</Heading>
                          <VStack spacing={4} align="stretch" width="100%">
                              {redacaoVisualizar.correcao?.competencias?.map((comp) => { 
                                  const info = isSimples ? INFO_COMPETENCIAS_SIMPLES[comp.comp] : INFO_COMPETENCIAS_ENEM[comp.comp]; if(!info) return null; 
                                  return (
                                    <Box key={comp.comp} p={4} border="1px solid" borderColor="gray.200" borderRadius="lg" boxShadow="sm" bg="white" width="100%">
                                      <Flex justify="space-between" mb={2} align="center"><Badge bg={info.bg} color={info.cor} px={2} py={1} borderRadius="md" textTransform="uppercase" fontSize="xs" fontWeight="bold">COMPETÊNCIA {comp.comp}</Badge><Text fontWeight="bold" fontSize="md" color="gray.700">{comp.nota} pts</Text></Flex>
                                      <Text fontSize="md" fontWeight="bold" color="gray.800" mb={3}>{info.nome}</Text>
                                      <Divider mb={3} borderColor="gray.200" />
                                      {comp.comentario ? (<Text fontSize="sm" color="gray.600" bg="gray.50" p={4} borderRadius="md" fontStyle="italic" whiteSpace="pre-wrap" lineHeight="tall">{comp.comentario}</Text>) : (<Text fontSize="xs" color="gray.400">Sem apontamentos adicionais.</Text>)}
                                    </Box>
                                  ); 
                              })}
                          </VStack>
                      </VStack>
                  </Box>
              </Flex>
          </Container>
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