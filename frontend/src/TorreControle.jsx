import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Heading, Text, VStack, HStack, Button, Icon, Box, 
  useToast, Flex, Badge, Input, Select, InputGroup, InputLeftElement, 
  Table, Thead, Tbody, Tr, Th, Td, Card, CardBody, SimpleGrid, Stat, StatLabel, 
  StatNumber, Tooltip, useDisclosure, Modal, ModalOverlay, ModalContent, 
  ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel, 
  Divider, Tabs, TabList, TabPanels, Tab, TabPanel, IconButton,
  Alert, AlertIcon, Textarea, Image, Popover, PopoverTrigger, PopoverContent, 
  PopoverArrow, PopoverCloseButton, PopoverHeader, PopoverBody, Portal
} from '@chakra-ui/react';
import { 
  SearchIcon, WarningIcon, UnlockIcon, WarningTwoIcon, 
  StarIcon, ViewIcon, ArrowBackIcon, CheckCircleIcon, EditIcon, RepeatIcon, ViewOffIcon, InfoIcon, ChatIcon, CloseIcon
} from '@chakra-ui/icons';

const CustomPinSVG = ({ cor, numero }) => (
  <Box position="relative" w="22px" h="22px" color={cor} filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.3))" transition="all 0.2s" _hover={{ transform: 'scale(1.25)' }}>
    <Icon viewBox="0 0 24 24" w="100%" h="100%"><path fill="currentColor" d="M4 2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2z"/></Icon>
    <Text position="absolute" top="5px" left="0" w="100%" textAlign="center" color="white" fontSize="10px" fontWeight="900" fontFamily="system-ui">{numero}</Text>
  </Box>
);

const INFO_COMPETENCIAS_ENEM = { 1: { nome: "Gramática", cor: "red.500", bg: "red.50" }, 2: { nome: "Tema/Estrutura/Repertório", cor: "blue.500", bg: "blue.50" }, 3: { nome: "Argumentação", cor: "yellow.500", bg: "yellow.50" }, 4: { nome: "Coesão", cor: "green.500", bg: "green.50" }, 5: { nome: "Proposta", cor: "purple.500", bg: "purple.50" } };
const INFO_COMPETENCIAS_PADRAO = { 1: { nome: "Domínio da Norma Culta", cor: "red.500", bg: "red.50" }, 2: { nome: "Adequação ao Tema e Estrutura Textual", cor: "blue.500", bg: "blue.50" }, 3: { nome: "Coerência e Argumentação", cor: "yellow.500", bg: "yellow.50" }, 4: { nome: "Coesão Textual", cor: "green.500", bg: "green.50" } };
const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

const formatarTexto = (texto) => {
    if (!texto) return '';
    if (texto.includes('<p>') || texto.includes('<span')) return texto; 
    return texto.replace(/\n/g, '<br />').replace(/\*(.*?)\*/g, '<strong>$1</strong>').replace(/_(.*?)_/g, '<em>$1</em>').replace(/~(.*?)~/g, '<u>$1</u>');
};

const getImagemUrl = (caminho) => {
    if (!caminho) return '';
    if (typeof caminho !== 'string') return '';
    return caminho.startsWith('http') ? caminho : `http://127.0.0.1:8000${caminho}`;
};

const getPinTitle = (pin) => {
    if (pin.competencia === 1 && pin.tipo_erro && pin.tipo_erro !== 'Geral') { return `Competência 1 - ${pin.tipo_erro}`; }
    return `Competência ${pin.competencia}`;
};

const getCorretorNome = (r) => {
    if (r.corretor_nome) return r.corretor_nome;
    if (r.correcao?.corretor_nome) return r.correcao.corretor_nome;
    if (r.correcao?.corretor?.first_name) return `${r.correcao.corretor.first_name} ${r.correcao.corretor.last_name || ''}`.trim();
    if (r.correcao?.corretor_id || r.correcao?.corretor) return `ID: ${r.correcao.corretor_id || r.correcao.corretor}`;
    if (r.corretor_atual) return `ID: ${r.corretor_atual}`;
    return 'N/A';
};

const getSLA = (r) => { 
    if (!r || !r.data_envio || r.status !== 'AGUARDANDO') return { cor: 'gray', texto: '--', badge: 'gray' };
    const data = new Date(r.data_envio); const agora = new Date(); const diffHoras = (agora - data) / (1000 * 60 * 60);
    const isVip = r.is_urgente || r.vip_pago; const limiteAtraso = isVip ? 24 : 72; const limiteAtencao = isVip ? 12 : 48;
    if (diffHoras <= limiteAtencao) return { cor: 'green', texto: 'No Prazo', badge: 'green' }; 
    if (diffHoras <= limiteAtraso) return { cor: 'orange', texto: 'Atenção', badge: 'orange' }; 
    return { cor: 'red', texto: 'Atrasado', badge: 'red' }; 
};

const getStatusBadge = (status, r) => {
    const reda = typeof status === 'object' ? status : r;
    const statusVal = typeof status === 'object' ? status.status : status;
    
    if (reda) {
        const isPaga = reda.foi_pago === true || String(reda.foi_pago).toLowerCase() === 'true';
        if ((statusVal === 'CORRIGIDA' || statusVal === 'FINALIZADA') && isPaga) return <Badge colorScheme="green" borderRadius="md" px={2} py={1} fontSize="xs">FINALIZADA (PAGA)</Badge>;
    }

    switch(statusVal) {
        case 'CORRIGIDA': return <Badge colorScheme="green" borderRadius="md" px={2} py={1} fontSize="xs">CORRIGIDA</Badge>;
        case 'DEVOLVIDA': return <Badge colorScheme="orange" borderRadius="md" px={2} py={1} fontSize="xs">DEVOLVIDA (ALUNO)</Badge>;
        case 'ANULADA': return <Badge colorScheme="red" borderRadius="md" px={2} py={1} fontSize="xs">ANULADA (ALUNO)</Badge>;
        case 'REFAZER': return <Badge colorScheme="yellow" borderRadius="md" px={2} py={1} fontSize="xs">REFAZER (CORRETOR)</Badge>;
        case 'EM_CORRECAO': return <Badge colorScheme="blue" borderRadius="md" px={2} py={1} fontSize="xs">EM CORREÇÃO</Badge>;
        case 'EM_RECURSO': 
        case 'RECURSO': return <Badge colorScheme="cyan" borderRadius="md" px={2} py={1} fontSize="xs">EM REVISÃO</Badge>;
        case 'TRIAGEM': return <Badge colorScheme="pink" borderRadius="md" px={2} py={1} fontSize="xs">TRIAGEM TÉCNICA</Badge>;
        case 'AUDITORIA':
        case 'EM_AUDITORIA': return <Badge colorScheme="purple" borderRadius="md" px={2} py={1} fontSize="xs">EM AUDITORIA</Badge>;
        case 'EM_QA': return <Badge colorScheme="teal" borderRadius="md" px={2} py={1} fontSize="xs">INSPEÇÃO QA</Badge>;
        case 'FINALIZADA': return <Badge colorScheme="green" borderRadius="md" px={2} py={1} fontSize="xs">FINALIZADA (PAGA)</Badge>;
        default: return <Badge colorScheme="gray" borderRadius="md" px={2} py={1} fontSize="xs">{statusVal ? statusVal.replace('_', ' ') : 'AGUARDANDO'}</Badge>;
    }
};

function TorreControle() {
  const toast = useToast();

  const [redacoes, setRedacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [filtroSLA, setFiltroSLA] = useState('TODOS');
  const [filtroAuditoria, setFiltroAuditoria] = useState('TODOS');
  const [filtroQA, setFiltroQA] = useState('TODOS'); 
  const [filtroCorretorQA, setFiltroCorretorQA] = useState('TODOS'); 

  const [periodoFiltro, setPeriodoFiltro] = useState('MES_ATUAL');
  const [dataInicioFila, setDataInicioFila] = useState('');
  const [dataFimFila, setDataFimFila] = useState('');
  
  const [tabIndex, setTabIndex] = useState(0);

  const [paginaAtualFila, setPaginaAtualFila] = useState(1); const [itensPorPaginaFila, setItensPorPaginaFila] = useState(10);
  const [paginaAtualAuditoria, setPaginaAtualAuditoria] = useState(1); const [itensPorPaginaAuditoria, setItensPorPaginaAuditoria] = useState(10);
  const [paginaAtualTriagem, setPaginaAtualTriagem] = useState(1); const [itensPorPaginaTriagem, setItensPorPaginaTriagem] = useState(10);
  const [paginaAtualQA, setPaginaAtualQA] = useState(1); const [itensPorPaginaQA, setItensPorPaginaQA] = useState(10);

  const modalAlerta = useDisclosure();
  const modalProposta = useDisclosure();
  const [idParaLiberar, setIdParaLiberar] = useState(null);

  const [redacaoAuditando, setRedacaoAuditoria] = useState(null);
  const [mensagemAcao1, setMensagemAcao1] = useState(''); 
  const [mensagemAcao2, setMensagemAcao2] = useState(''); 
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [hoveredPinViewId, setHoveredPinViewId] = useState(null);
  const [pinFocadoId, setPinFocadoId] = useState(null);
  const [mostrarPins, setMostrarPins] = useState(true);
  const [filtroCompetenciaView, setFiltroCompetenciaView] = useState(null);
  
  const [notasEditadas, setNotasEditadas] = useState({});

  useEffect(() => {
      if (redacaoAuditando && redacaoAuditando.correcao) {
          let initNotas = {};
          (redacaoAuditando.correcao.competencias || []).forEach(c => { initNotas[c.comp] = parseFloat(c.nota); });
          setNotasEditadas(initNotas);
      }
  }, [redacaoAuditando]);

  const carregarDados = async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try { const res = await axios.get('http://127.0.0.1:8000/api/gestao/redacoes/', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); setRedacoes(res.data); } catch (e) { if(!silencioso) toast({ title: "Erro ao carregar fila", status: "error" }); }
    if (!silencioso) setLoading(false);
  };

  useEffect(() => { carregarDados(); const interval = setInterval(() => { carregarDados(true); }, 10000); return () => clearInterval(interval); }, []);
  useEffect(() => { setPaginaAtualFila(1); }, [busca, filtroStatus, filtroSLA, periodoFiltro, dataInicioFila, dataFimFila]);
  useEffect(() => { setPaginaAtualAuditoria(1); }, [filtroAuditoria]);
  useEffect(() => { setPaginaAtualQA(1); }, [filtroQA, filtroCorretorQA]);

  const abrirJulgamento = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://127.0.0.1:8000/api/redacao/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
      let redData = res.data;
      
      try {
          const temaId = redData.tema || redData.tema_id || (redData.tema_obj && redData.tema_obj.id);
          if (temaId) {
              const temaRes = await axios.get(`http://127.0.0.1:8000/api/temas/${temaId}/`, { headers: { Authorization: `Bearer ${token}` } });
              redData.tema_completo = temaRes.data;
          }
      } catch (e) { console.log('Erro ao baixar tema', e); }

      setFiltroCompetenciaView(null);
      setRedacaoAuditoria(redData); 
      setMensagemAcao1(''); 
      setMensagemAcao2('');
    } catch (e) { toast({ title: 'Erro ao carregar os dados detalhados.', status: 'error' }); }
  };

  const resolverAuditoria = async (acao, msgPayload) => {
    if (!msgPayload.trim() && acao !== 'CONFIRMAR_FALHA_GRAVE' && acao !== 'FALSO_POSITIVO_QA') { return toast({ title: 'Atenção', description: 'Você deve preencher a mensagem explicativa antes de aplicar esta ação.', status: 'warning' }); }
    setLoadingAudit(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://127.0.0.1:8000/api/auditoria/${redacaoAuditando.id}/resolver/`, { acao: acao, mensagem: msgPayload }, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: 'Ação aplicada com sucesso!', status: 'success' }); setRedacaoAuditoria(null); carregarDados(); 
    } catch (e) { toast({ title: 'Erro ao aplicar o veredito.', status: 'error' }); }
    setLoadingAudit(false);
  };

  const resolverAuditoriaEditandoNota = async (msgPayload, novasNotas) => {
    if (!msgPayload.trim()) return toast({title: 'Atenção', description: 'Preencha a justificativa da edição.', status: 'warning'});
    setLoadingAudit(true);
    try {
        const token = localStorage.getItem('token');
        await axios.post(`http://127.0.0.1:8000/api/auditoria/${redacaoAuditando.id}/resolver/`, { 
            acao: 'AJUSTAR_NOTA_PAGA', 
            mensagem: msgPayload,
            novas_notas: novasNotas
        }, { headers: { Authorization: `Bearer ${token}` } });
        toast({ title: 'Nota ajustada e processo concluído!', status: 'success' }); 
        setRedacaoAuditoria(null); 
        carregarDados(); 
    } catch (e) { toast({ title: 'Erro ao aplicar o veredito.', status: 'error' }); }
    setLoadingAudit(false);
  };

  const confirmarLiberacao = (id) => { setIdParaLiberar(id); modalAlerta.onOpen(); };
  const forcarLiberacaoReal = async () => { try { await axios.post(`http://127.0.0.1:8000/api/gestao/redacoes/${idParaLiberar}/liberar/`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); carregarDados(true); toast({ title: "Redação devolvida para a fila com sucesso!", status: "success" }); } catch (e) {} modalAlerta.onClose(); };
  const toggleUrgencia = async (r) => { if(r.vip_pago) return; try { await axios.post(`http://127.0.0.1:8000/api/gestao/redacoes/${r.id}/urgencia/`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); carregarDados(true); toast({ title: "Prioridade alterada!", status: "success" }); } catch (e) {} };
  
  const statusConcluidos = ['CORRIGIDA', 'FINALIZADA', 'DEVOLVIDA', 'ANULADA'];
  const qtdAguardando = redacoes.filter(r => r.status === 'AGUARDANDO').length;
  const qtdEmCorrecao = redacoes.filter(r => r.status === 'EM_CORRECAO').length;
  const qtdCorrigidas = redacoes.filter(r => r.status === 'CORRIGIDA').length;
  const qtdVips = redacoes.filter(r => (r.is_urgente || r.vip_pago) && !statusConcluidos.includes(r.status)).length;
  const qtdAtrasados = redacoes.filter(r => getSLA(r).badge === 'red' && !statusConcluidos.includes(r.status)).length;
  const qtdProblemas = redacoes.filter(r => r.status === 'EM_AUDITORIA' || r.status === 'EM_RECURSO' || r.status === 'RECURSO' || r.status === 'TRIAGEM').length;

  const listaFilaNormal = redacoes.filter(r => {
    return r.status !== 'EM_AUDITORIA' && r.status !== 'EM_RECURSO' && r.status !== 'RECURSO' && r.status !== 'TRIAGEM' && r.status !== 'EM_QA';
  });
  
  const listaAuditoria = redacoes.filter(r => {
      const isAuditoria = r.status === 'EM_AUDITORIA' || r.status === 'EM_RECURSO' || r.status === 'RECURSO';
      const matchFiltro = filtroAuditoria === 'TODOS' ? true : filtroAuditoria === 'EM_RECURSO' ? (r.status === 'EM_RECURSO' || r.status === 'RECURSO') : r.status === filtroAuditoria;
      return isAuditoria && matchFiltro;
  });

  const listaTriagem = redacoes.filter(r => r.status === 'TRIAGEM');
  
  const listaQA = redacoes.filter(r => {
      if (r.status !== 'EM_QA') return false;
      const isPaga = r.foi_pago === true || String(r.foi_pago).toLowerCase() === 'true';
      const isMaAvaliacao = r.correcao?.avaliacao_aluno > 0;
      const isAmostragem = !isMaAvaliacao;
      
      const corretorNomeStr = getCorretorNome(r);
      const matchCorretor = filtroCorretorQA === 'TODOS' ? true : (corretorNomeStr === filtroCorretorQA);

      if(filtroQA === 'PAGAS' && !isPaga) return false;
      if(filtroQA === 'MA_AVALIACAO' && !isMaAvaliacao) return false;
      if(filtroQA === 'AMOSTRAGEM' && !isAmostragem) return false;
      
      return matchCorretor;
  });
  
  const corretoresQAUnicos = Array.from(new Set(redacoes.filter(r => r.status === 'EM_QA').map(r => getCorretorNome(r)).filter(n => n !== 'N/A')));

  const redacoesFiltradas = listaFilaNormal.filter(r => {
    const termoBusca = busca.toLowerCase();
    const matchTexto = (r.tema_titulo || '').toLowerCase().includes(termoBusca) || (r.aluno_nome || '').toLowerCase().includes(termoBusca) || (getCorretorNome(r) || '').toLowerCase().includes(termoBusca) || r.id.toString() === busca;
    
    let matchStatus = true;
    const isPaga = r.foi_pago === true || String(r.foi_pago).toLowerCase() === 'true';

    if (filtroStatus === 'TODOS') {
        matchStatus = true;
    } else if (filtroStatus === 'PRESAS') {
        matchStatus = (r.status === 'EM_CORRECAO' || r.status === 'REFAZER') && r.corretor_atual !== null;
    } else if (filtroStatus === 'FINALIZADA') {
        matchStatus = (r.status === 'CORRIGIDA' || r.status === 'FINALIZADA') && isPaga;
    } else if (filtroStatus === 'CORRIGIDA') {
        matchStatus = r.status === 'CORRIGIDA' && !isPaga;
    } else {
        matchStatus = r.status === filtroStatus;
    }

    let matchData = true;
    const dataEnvio = new Date(r.data_envio);
    const hoje = new Date(); hoje.setHours(0,0,0,0);

    if (periodoFiltro === 'HOJE') {
        matchData = dataEnvio >= hoje;
    } else if (periodoFiltro === 'ONTEM') {
        const ontem = new Date(hoje); ontem.setDate(ontem.getDate() - 1);
        const hojeFim = new Date(hoje);
        matchData = dataEnvio >= ontem && dataEnvio < hojeFim;
    } else if (periodoFiltro === 'MES_ATUAL') {
        matchData = dataEnvio.getMonth() === hoje.getMonth() && dataEnvio.getFullYear() === hoje.getFullYear();
    } else if (periodoFiltro === 'MES_ANTERIOR') {
        const mesAnterior = new Date(hoje); mesAnterior.setMonth(mesAnterior.getMonth() - 1);
        matchData = dataEnvio.getMonth() === mesAnterior.getMonth() && dataEnvio.getFullYear() === mesAnterior.getFullYear();
    } else if (periodoFiltro === 'PERSONALIZADO' && (dataInicioFila || dataFimFila)) {
        const dInicio = dataInicioFila ? new Date(dataInicioFila + 'T00:00:00') : new Date('2000-01-01'); 
        const dFim = dataFimFila ? new Date(dataFimFila + 'T23:59:59') : new Date('2100-01-01'); 
        matchData = dataEnvio >= dInicio && dataEnvio <= dFim;
    }

    let matchSLA = true;
    if (filtroSLA === 'VIP') matchSLA = r.vip_pago; if (filtroSLA === 'URGENTE') matchSLA = r.is_urgente; if (filtroSLA === 'ATRASADO') matchSLA = getSLA(r).badge === 'red';
    
    return matchTexto && matchStatus && matchData && matchSLA;
  });

  const idxUltimoFila = paginaAtualFila * itensPorPaginaFila; const idxPrimeiroFila = idxUltimoFila - itensPorPaginaFila; const filaPaginada = redacoesFiltradas.slice(idxPrimeiroFila, idxUltimoFila);
  const idxUltimoAuditoria = paginaAtualAuditoria * itensPorPaginaAuditoria; const idxPrimeiroAuditoria = idxUltimoAuditoria - itensPorPaginaAuditoria; const auditoriaPaginada = listaAuditoria.slice(idxPrimeiroAuditoria, idxUltimoAuditoria);
  const idxUltimoTriagem = paginaAtualTriagem * itensPorPaginaTriagem; const idxPrimeiroTriagem = idxUltimoTriagem - itensPorPaginaTriagem; const triagemPaginada = listaTriagem.slice(idxPrimeiroTriagem, idxUltimoTriagem);
  const idxUltimoQA = paginaAtualQA * itensPorPaginaQA; const idxPrimeiroQA = idxUltimoQA - itensPorPaginaQA; const qaPaginada = listaQA.slice(idxPrimeiroQA, idxUltimoQA);

  // INTERPRETADOR VISUAL (PARSER PREMIUM) DAS MENSAGENS E ALERTAS
  const renderAlertasTorre = (textoOriginal) => {
      if (!textoOriginal) return <Text fontSize="sm" color="gray.500">Sem observações ou alertas registrados.</Text>;
      
      let limpo = textoOriginal.replace(/\bNone\b/gi, '').replace(/\[\/?ALERTA_COORDENACAO\]/gi, '').trim();
      if (limpo.startsWith('"') && limpo.endsWith('"')) { limpo = limpo.substring(1, limpo.length - 1).trim(); }
      if (!limpo) return null;

      const parts = limpo.split(/(?=\[.*?\]|---.*?---)/).filter(p => p.trim());
      let finalParts = parts.length > 0 ? parts : [limpo];

      const blocos = finalParts.map((part, idx) => {
          let conteudo = part.trim();
          const tUpper = conteudo.toUpperCase();
          
          let autor = "SISTEMA";
          let autorCor = "gray";
          let tipoAlerta = "Aviso do Sistema";
          let colorScheme = "gray";
          let iconeAlerta = InfoIcon;
          let motivo = null;
          let labelConteudo = "Observação:";

          if (tUpper.includes("FALHA GRAVE REPORTADA") || tUpper.includes("SINALIZADO")) {
              autor = "CORRETOR"; autorCor = "orange";
              tipoAlerta = "FALHA GRAVE";
              colorScheme = "red";
              iconeAlerta = WarningTwoIcon;
              labelConteudo = "OBSERVAÇÃO DO CORRETOR";
              const motivoMatch = conteudo.match(/\[.*?(?:REPORTADA|SINALIZADO)\s*:\s*(.*?)\]/i) || conteudo.match(/\[(.*?FALHA.*?)\]/i);
              if (motivoMatch && motivoMatch[1]) motivo = motivoMatch[1].replace(/falha grave reportada/i, '').replace(/^:/, '').trim();
              conteudo = conteudo.replace(/\[.*?\]/g, '').replace(/Observação do Corretor:/gi, '').trim();
              
          } else if (tUpper.includes("RECURSO SOLICITADO")) {
              autor = "ALUNO"; autorCor = "blue";
              tipoAlerta = "RECURSO DO ALUNO";
              colorScheme = "blue";
              iconeAlerta = ChatIcon;
              labelConteudo = "MOTIVO DA SOLICITAÇÃO";
              conteudo = conteudo.replace(/---.*?---/g, '').replace(/\[.*?\]/g, '').replace(/Motivo:/gi, '').trim();
              
          } else if (tUpper.includes("TRIAGEM TÉCNICA")) {
              autor = "CORRETOR"; autorCor = "orange";
              tipoAlerta = "TRIAGEM TÉCNICA (TI)";
              colorScheme = "orange";
              iconeAlerta = WarningIcon;
              labelConteudo = "OBSERVAÇÃO DO CORRETOR";
              conteudo = conteudo.replace(/\[.*?\]/g, '').trim();
              
          } else if (tUpper.includes("FALHA GRAVE CONFIRMADA") || tUpper.includes("REDAÇÃO DEVOLVIDA") || tUpper.includes("ANULAR_E_DEVOLVER")) {
              autor = "COORDENAÇÃO"; autorCor = "purple";
              tipoAlerta = "VEREDITO: ANULADA";
              colorScheme = "red";
              iconeAlerta = CloseIcon;
              labelConteudo = "PARECER DA COORDENAÇÃO";
              conteudo = conteudo.replace(/\[.*?\]/g, '').trim();
              
          } else if (tUpper.includes("RECURSO ACEITE") || tUpper.includes("RECURSO NEGADO") || tUpper.includes("RESPOSTA AO RECURSO")) {
              autor = "COORDENAÇÃO"; autorCor = "purple";
              tipoAlerta = "VEREDITO DE RECURSO";
              colorScheme = "green";
              iconeAlerta = CheckCircleIcon;
              labelConteudo = "PARECER DA COORDENAÇÃO";
              conteudo = conteudo.replace(/\[.*?\]/g, '').trim();
              
          } else if (tUpper.includes("EXIGIR_REFACAO")) {
              autor = "COORDENAÇÃO"; autorCor = "purple";
              tipoAlerta = "EXIGÊNCIA DE REFAÇÃO";
              colorScheme = "purple";
              iconeAlerta = RepeatIcon;
              labelConteudo = "PARECER DA COORDENAÇÃO";
              conteudo = conteudo.replace(/\[.*?\]/g, '').trim();
          } else {
              const tagMatch = conteudo.match(/^\[(.*?)\]/) || conteudo.match(/^---\s*(.*?)\s*---/);
              if (tagMatch) {
                  tipoAlerta = tagMatch[1].trim().toUpperCase();
                  conteudo = conteudo.replace(tagMatch[0], '').trim();
              }
          }

          conteudo = conteudo.replace(/(^"|"$)/g, '').trim();
          if (!conteudo) return null;

          return (
              <Box key={idx} bg="white" p={4} borderRadius="xl" border="1px solid" borderColor={`${colorScheme}.200`} shadow="sm" position="relative" overflow="hidden">
                  <Box position="absolute" left={0} top={0} bottom={0} w="4px" bg={`${colorScheme}.500`} />
                  
                  <Flex justify="space-between" align="start" mb={3} pl={2} wrap="wrap" gap={2}>
                      <VStack align="start" spacing={1}>
                          <Badge colorScheme={autorCor} fontSize="0.65rem" px={2} borderRadius="sm">{autor}</Badge>
                          <HStack spacing={2}>
                              <Icon as={iconeAlerta} color={`${colorScheme}.600`} boxSize={4} />
                              <Text fontSize="sm" fontWeight="900" color={`${colorScheme}.700`}>{tipoAlerta}</Text>
                          </HStack>
                      </VStack>
                      {motivo && (
                          <Badge colorScheme={colorScheme} fontSize="xs" px={2} py={1} borderRadius="md" variant="subtle" border="1px solid" borderColor={`${colorScheme}.200`}>
                              {motivo}
                          </Badge>
                      )}
                  </Flex>
                  
                  <Box bg={`${colorScheme}.50`} p={3} borderRadius="md" ml={2} border="1px dashed" borderColor={`${colorScheme}.200`}>
                      <Text fontSize="2xs" fontWeight="bold" color={`${colorScheme}.600`} mb={1}>{labelConteudo}</Text>
                      <Text fontSize="sm" color="gray.800" whiteSpace="pre-wrap" fontStyle="italic">"{conteudo}"</Text>
                  </Box>
              </Box>
          );
      }).filter(Boolean);

      if (blocos.length === 0) return null;
      return <VStack align="stretch" spacing={4}>{blocos}</VStack>;
  };

  if (redacaoAuditando) {
    const tipoAtual = redacaoAuditando.tema_tipo?.toUpperCase() || redacaoAuditando.tipo?.toUpperCase() || 'ENEM';
    const isPadrao = tipoAtual === 'PADRAO_10' || tipoAtual === 'PADRAO_100' || tipoAtual === 'SIMPLES';
    const isPadrao10 = tipoAtual === 'PADRAO_10';
    
    const numComps = isPadrao ? [1,2,3,4] : [1,2,3,4,5];
    const temCorrecaoFeita = redacaoAuditando.correcao && redacaoAuditando.correcao.competencias && redacaoAuditando.correcao.competencias.length > 0;
    
    const isQA = redacaoAuditando.status === 'EM_QA' || redacaoAuditando.status === 'CORRIGIDA'; 
    const isFalhaGrave = redacaoAuditando.status === 'EM_AUDITORIA';
    const isRecurso = redacaoAuditando.status === 'EM_RECURSO' || redacaoAuditando.status === 'RECURSO';
    const isTriagem = redacaoAuditando.status === 'TRIAGEM';
    
    const isPaga = redacaoAuditando.foi_pago === true || String(redacaoAuditando.foi_pago).toLowerCase() === 'true';
    const avaliacaoEstrelas = redacaoAuditando.correcao?.avaliacao_aluno || 0;
    const avaliacaoTexto = redacaoAuditando.correcao?.comentario_avaliacao || '';
    
    const notasPossiveisEdit = isPadrao10 ? [0, 0.5, 1, 1.5, 2, 2.5] : (isPadrao ? [0,5,10,15,20,25] : [0,40,80,120,160,200]);
    const compsDisponiveisEdit = isPadrao ? [1,2,3,4] : [1,2,3,4,5];
    const notaFinalCalculadaEdit = Object.values(notasEditadas).reduce((acc, curr) => acc + parseFloat(curr || 0), 0);

    const motivadoresTema = redacaoAuditando.tema_completo?.motivadores || [];
    const descricaoProposta = redacaoAuditando.tema_completo?.descricao || '';

    const anotacoes = redacaoAuditando.correcao?.anotacoes || [];
    const contagem = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, total: anotacoes.length };
    anotacoes.forEach(pin => { if (pin.competencia) contagem[pin.competencia]++; });

    return (
      <Flex h="100vh" overflow="hidden" w="full" bg="gray.100" direction={{ base: 'column', lg: 'row' }}>
        
        {/* ============================================== */}
        {/* COLUNA ESQUERDA (VISUALIZADOR DA AUDITORIA)    */}
        {/* ============================================== */}
        <Box flex="1" display="flex" flexDirection="column" bg="gray.200" overflow="hidden">
          
          <Flex direction="column" bg="white" shadow="sm" zIndex={10}>
              <Flex justify="space-between" align="center" p={4} borderBottom="1px solid" borderColor="gray.100" wrap="wrap" gap={3}>
                  <HStack spacing={4}>
                      <Button leftIcon={<ArrowBackIcon />} onClick={() => setRedacaoAuditoria(null)} variant="ghost" colorScheme="gray">Voltar</Button>
                      <Divider orientation="vertical" h="24px" display={{ base: 'none', md: 'block' }} />
                      <VStack align="start" spacing={0}>
                          <HStack alignItems="center"><Heading size="md" color="gray.800">Visualização de Auditoria</Heading></HStack>
                          <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">ALUNO: {redacaoAuditando.aluno_nome}</Text>
                      </VStack>
                  </HStack>
                  <HStack spacing={4}>
                      <Button size="sm" colorScheme="blue" variant="outline" leftIcon={<InfoIcon />} onClick={modalProposta.onOpen} shadow="sm">Ver Proposta</Button>
                  </HStack>
              </Flex>

              <Flex justify="space-between" align="center" px={4} py={2} bg="gray.50" borderBottom="1px solid" borderColor="gray.300">
                  <HStack spacing={3} overflowX="auto" pb={{base: 2, md: 0}} css={{ '&::-webkit-scrollbar': { display: 'none' } }}>
                      <Text fontSize="xs" fontWeight="bold" color="gray.600" textTransform="uppercase" whiteSpace="nowrap">Filtrar Marcações:</Text>
                      <HStack spacing={2}>
                          <Button size="xs" variant={filtroCompetenciaView === null ? 'solid' : 'outline'} colorScheme="gray" onClick={() => setFiltroCompetenciaView(null)}>Todas ({contagem.total})</Button>
                          {numComps.map(c => {
                              const info = isPadrao ? INFO_COMPETENCIAS_PADRAO[c] : INFO_COMPETENCIAS_ENEM[c];
                              const scheme = info.cor.split('.')[0];
                              return (
                                  <Button key={c} size="xs" variant={filtroCompetenciaView === c ? 'solid' : 'outline'} colorScheme={scheme} onClick={() => setFiltroCompetenciaView(c === filtroCompetenciaView ? null : c)}>
                                      C{c} ({contagem[c]})
                                  </Button>
                              );
                          })}
                      </HStack>
                  </HStack>
                  <Button size="xs" onClick={() => setMostrarPins(!mostrarPins)} leftIcon={<Icon as={mostrarPins ? ViewOffIcon : ViewIcon} />} colorScheme="gray" variant="ghost">
                      {mostrarPins ? "Ocultar Tudo" : "Mostrar Tudo"}
                  </Button>
              </Flex>
          </Flex>

          <Box flex="1" overflowY="auto" p={8} display="flex" justifyContent="center">
            <Box position="relative" display="inline-block" height="fit-content" boxShadow="dark-lg" bg="white" border="1px solid" borderColor="gray.300" borderRadius="sm" w={redacaoAuditando.arquivo ? "full" : "700px"} maxW={redacaoAuditando.arquivo ? "900px" : "700px"} flexShrink={redacaoAuditando.arquivo ? 1 : 0} onClick={() => setPinFocadoId(null)}>
              {redacaoAuditando.arquivo ? ( 
                  <Image src={getImagemUrl(redacaoAuditando.arquivo)} alt="Redação do Aluno" display="block" w="100%" h="auto" objectFit="contain" /> 
              ) : redacaoAuditando.texto ? (
                  <Box p="0" position="relative" minHeight="1216px" bgImage="linear-gradient(transparent 39px, #ccc 40px)" bgSize="100% 40px">
                      <Box position="absolute" left={0} top={0} bottom={0} w="40px" borderRight="1px solid #ccc" bg="gray.50" pt="8px" pointerEvents="none" zIndex={2}>
                          {Array.from({length: 30}).map((_, i) => (
                              <Text key={i} h="40px" lineHeight="40px" textAlign="center" fontSize="12px" color="gray.400" fontWeight="bold" m={0} p={0}>{i + 1}</Text>
                          ))}
                      </Box>
                      <Box pl="55px" pr="20px" pt="8px" pb="8px" whiteSpace="pre-wrap" fontFamily="Arial, sans-serif" fontSize="16px" lineHeight="40px" color="gray.800">
                          {redacaoAuditando.texto}
                      </Box>
                  </Box>
              ) : null}
              
              {mostrarPins && anotacoes.filter(p => filtroCompetenciaView === null || p.competencia === filtroCompetenciaView).map((pin) => { 
                if(!pin.x) return null; const info = isPadrao ? INFO_COMPETENCIAS_PADRAO[pin.competencia] : INFO_COMPETENCIAS_ENEM[pin.competencia]; if(!info) return null; 
                
                const isHovered = hoveredPinViewId === pin.id; 
                const isFocused = pinFocadoId === pin.id;
                const isOtherFocused = pinFocadoId !== null && pinFocadoId !== pin.id;

                if (isOtherFocused) return null;

                return (
                  <Box key={pin.id}>
                    <Box position="absolute" left={`${pin.x}%`} top={`${pin.y}%`} w={`${pin.width}%`} h={`${pin.height}%`} bg={info.cor} opacity={isHovered || isFocused ? 0.4 : 0} pointerEvents="none" transition="opacity 0.2s" zIndex={4} />
                    {!isFocused && (
                        <Popover trigger="hover" placement="top" openDelay={0} isLazy>
                            <PopoverTrigger>
                                <Box position="absolute" left={`calc(${pin.x}% + ${pin.width}% - 6px)`} top={`calc(${pin.y}% - 22px)`} cursor="pointer" zIndex={isHovered || isFocused ? 9999 : 10} display="flex" alignItems="center" justifyContent="center" onClick={(e) => { e.stopPropagation(); setPinFocadoId(pin.id); }} onMouseEnter={() => setHoveredPinViewId(pin.id)} onMouseLeave={() => setHoveredPinViewId(null)}>
                                    <CustomPinSVG cor={info.cor} numero={pin.competencia} />
                                </Box>
                            </PopoverTrigger>
                            <Portal>
                                <PopoverContent zIndex={9999} w="300px" boxShadow="2xl" borderRadius="2xl" overflow="hidden" border="1px solid" borderColor="gray.100" onMouseEnter={() => setHoveredPinViewId(pin.id)} onMouseLeave={() => setHoveredPinViewId(null)}>
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

        {/* ============================================== */}
        {/* COLUNA DIREITA (SIDEBAR DA GESTÃO)             */}
        {/* ============================================== */}
        <Box w={{ base: '100%', lg: '450px' }} bg="white" borderLeft="1px solid" borderColor="gray.300" display="flex" flexDirection="column" shadow="2xl" zIndex={20}>
          
          <Flex h="90px" px={6} justify="space-between" align="center" borderBottom="1px solid" borderColor="gray.200" bg={isQA ? "purple.50" : isFalhaGrave ? "red.50" : isRecurso ? "blue.50" : "orange.50"} flexShrink={0}>
              <VStack align="start" spacing={0} justify="center">
                  <Heading size="md" color={isQA ? "purple.700" : isFalhaGrave ? "red.700" : isRecurso ? "blue.700" : "orange.700"} mb={0}>
                      {isQA ? 'Qualidade (QA)' : isFalhaGrave ? 'Julgar Falha Grave' : isRecurso ? 'Julgar Recurso' : 'Triagem Técnica'}
                  </Heading>
                  <Text fontSize="xs" color={isQA ? "purple.600" : isFalhaGrave ? "red.600" : isRecurso ? "blue.600" : "orange.600"}>
                      Ação Requerida do Gestor
                  </Text>
              </VStack>

              <HStack spacing={3}>
                  <Badge bg={isPadrao10 ? 'purple.100' : (isPadrao ? 'blue.100' : 'green.100')} color={isPadrao10 ? 'purple.800' : (isPadrao ? 'blue.800' : 'green.800')} px={3} py={1.5} borderRadius="md" fontSize="xs">
                      {tipoAtual.replace('_', ' ')}
                  </Badge>
                  <HStack bg={isFalhaGrave ? "red.100" : "green.100"} px={3} py={1} borderRadius="full" border="1px solid" borderColor={isFalhaGrave ? "red.300" : "green.300"} shadow="sm">
                      <Text fontSize="2xs" fontWeight="bold" color={isFalhaGrave ? "red.700" : "green.700"}>NOTA</Text>
                      <Text fontSize="lg" fontWeight="900" color={isFalhaGrave ? "red.800" : "green.800"}>{isFalhaGrave ? '0' : (redacaoAuditando.correcao?.nota_final || 0)}</Text>
                  </HStack>
              </HStack>
          </Flex>

          <Box flex="1" overflowY="auto" p={6}>
            <VStack align="stretch" spacing={6}>
              <Box bg="gray.50" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
                <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">Tema Associado</Text>
                <Text fontSize="sm" color="gray.700" fontWeight="bold">{redacaoAuditando.tema_titulo}</Text>
              </Box>

              {isQA && avaliacaoEstrelas > 0 && (
                <Box p={4} bg="yellow.50" borderRadius="md" border="1px solid" borderColor="yellow.300">
                    <Text fontSize="xs" fontWeight="900" color="yellow.700" textTransform="uppercase" mb={1}>Avaliação do Aluno</Text>
                    <HStack mb={2}>
                        {[1,2,3,4,5].map(estrela => (
                            <Icon key={estrela} as={StarIcon} color={estrela <= avaliacaoEstrelas ? "yellow.400" : "gray.300"} />
                        ))}
                    </HStack>
                    {avaliacaoTexto && <Text fontSize="sm" color="gray.700" fontStyle="italic">"{avaliacaoTexto}"</Text>}
                </Box>
              )}

              {/* CAIXA DE AVISOS E ALERTAS PREMIUM */}
              {redacaoAuditando.correcao?.comentario_geral && (
                  <Box>
                      <Heading size="xs" color="gray.500" mb={3} textTransform="uppercase">Linha do Tempo (Eventos)</Heading>
                      {renderAlertasTorre(redacaoAuditando.correcao?.comentario_geral)}
                  </Box>
              )}

              {temCorrecaoFeita && !isFalhaGrave && (
                <Box>
                  <Heading size="sm" color="gray.700" textTransform="uppercase" mb={3}>Desempenho Atual</Heading>
                  <VStack spacing={3} align="stretch" width="100%" mb={4}>
                    {redacaoAuditando.correcao.competencias.map((comp) => { 
                      const info = isPadrao ? INFO_COMPETENCIAS_PADRAO[comp.comp] : INFO_COMPETENCIAS_ENEM[comp.comp]; if(!info) return null; 
                      return (
                        <Box key={comp.comp} p={3} border="1px solid" borderColor="gray.200" borderRadius="md" bg="white">
                          <Flex justify="space-between" mb={1} align="center">
                              <Badge bg={info.bg} color={info.cor} fontSize="xs" textTransform="uppercase" fontWeight="bold">COMPETÊNCIA {comp.comp}</Badge>
                              <Text fontWeight="bold" fontSize="sm" color="gray.700">{comp.nota} pts</Text>
                          </Flex>
                          <Text fontSize="xs" fontWeight="bold" color="gray.800" mb={2}>{info.nome}</Text>
                          {comp.comentario && <Text fontSize="xs" color="gray.600" bg="gray.50" p={2} borderRadius="sm" fontStyle="italic" whiteSpace="pre-wrap">"{comp.comentario}"</Text>}
                        </Box>
                      ); 
                    })}
                  </VStack>
                </Box>
              )}

              <Divider borderColor="gray.300" />

              {/* PAINÉIS DE AÇÃO INTELIGENTES */}
              {isFalhaGrave && (
                <VStack align="stretch" spacing={4}>
                  <Box p={4} border="1px solid" borderColor="red.200" borderRadius="xl" bg="red.50">
                    <HStack mb={2}><CheckCircleIcon color="red.600" /><Text fontSize="sm" fontWeight="bold" color="red.700">1. Confirmar Falha Grave (Zerar)</Text></HStack>
                    <Text fontSize="xs" color="red.600" mb={3}>A redação será zerada (Nota 0), o aluno perde o crédito e o corretor é pago pelo serviço de triagem.</Text>
                    <Textarea size="sm" value={mensagemAcao1} onChange={(e) => setMensagemAcao1(e.target.value)} rows={3} bg="white" placeholder="Justificativa pedagógica opcional..." mb={3} />
                    <Button w="full" colorScheme="red" onClick={() => resolverAuditoria('CONFIRMAR_FALHA_GRAVE', mensagemAcao1)} isLoading={loadingAudit}>Confirmar e Zerar Redação</Button>
                  </Box>
                  <Box p={4} border="1px solid" borderColor="gray.300" borderRadius="xl" bg="gray.50">
                    <HStack mb={2}><WarningIcon color="gray.600" /><Text fontSize="sm" fontWeight="bold" color="gray.700">2. Falso Positivo (Discordar)</Text></HStack>
                    <Text fontSize="xs" color="gray.600" mb={3}>O corretor se enganou. Devolve a redação para o corretor fazer a correção normal.</Text>
                    <Textarea size="sm" value={mensagemAcao2} onChange={(e) => setMensagemAcao2(e.target.value)} rows={3} bg="white" placeholder="Explique ao corretor porque a redação é válida..." mb={3} />
                    <Button w="full" colorScheme="gray" border="1px solid" borderColor="gray.400" onClick={() => resolverAuditoria('DEVOLVER_CORRETOR', mensagemAcao2)} isLoading={loadingAudit}>Devolver ao Corretor</Button>
                  </Box>
                </VStack>
              )}

              {isTriagem && (
                <VStack align="stretch" spacing={4}>
                  <Box p={4} border="1px solid" borderColor="orange.200" borderRadius="xl" bg="orange.50">
                    <HStack mb={2}><WarningTwoIcon color="orange.600" /><Text fontSize="sm" fontWeight="bold" color="orange.700">1. Problema Confirmado (Anular)</Text></HStack>
                    <Text fontSize="xs" color="orange.600" mb={3}>A redação é cancelada, e o aluno recebe o crédito de volta no sistema para enviar outra foto.</Text>
                    <Textarea size="sm" value={mensagemAcao1} onChange={(e) => setMensagemAcao1(e.target.value)} rows={3} bg="white" placeholder="Recado para o aluno. Ex: Texto ilegível, envie nova foto." mb={3} />
                    <Button w="full" colorScheme="orange" onClick={() => resolverAuditoria('ANULAR_E_DEVOLVER_CREDITO', mensagemAcao1)} isLoading={loadingAudit}>Anular e Estornar Crédito</Button>
                  </Box>
                  <Box p={4} border="1px solid" borderColor="gray.300" borderRadius="xl" bg="gray.50">
                    <HStack mb={2}><CheckCircleIcon color="gray.600" /><Text fontSize="sm" fontWeight="bold" color="gray.700">2. Falso Positivo (Dá para ler)</Text></HStack>
                    <Text fontSize="xs" color="gray.600" mb={3}>A redação está nítida ou válida. Devolva ao corretor orientando-o a corrigir.</Text>
                    <Textarea size="sm" value={mensagemAcao2} onChange={(e) => setMensagemAcao2(e.target.value)} rows={3} bg="white" placeholder="Ex: Professor, a imagem tem sombra mas dá para ler." mb={3} />
                    <Button w="full" colorScheme="gray" border="1px solid" borderColor="gray.400" onClick={() => resolverAuditoria('DEVOLVER_CORRETOR', mensagemAcao2)} isLoading={loadingAudit}>Devolver ao Corretor</Button>
                  </Box>
                </VStack>
              )}

              {isRecurso && (
                <VStack align="stretch" spacing={4}>
                  <Box p={4} border="1px solid" borderColor="blue.200" borderRadius="xl" bg="blue.50">
                    <HStack mb={2}><CheckCircleIcon color="blue.600" /><Text fontSize="sm" fontWeight="bold" color="blue.700">1. Negar Recurso (Manter Nota)</Text></HStack>
                    <Text fontSize="xs" color="blue.600" mb={3}>A nota original será mantida e a mensagem abaixo será enviada ao ALUNO justificando a decisão.</Text>
                    <Textarea size="sm" value={mensagemAcao1} onChange={(e) => setMensagemAcao1(e.target.value)} rows={3} bg="white" placeholder="Justificativa pedagógica que será enviada ao ALUNO..." mb={3} />
                    <Button w="full" colorScheme="blue" onClick={() => resolverAuditoria('RECURSO_NEGADO', mensagemAcao1)} isLoading={loadingAudit}>Manter Nota do Corretor</Button>
                  </Box>
                  <Box p={4} border="1px solid" borderColor="purple.200" borderRadius="xl" bg="purple.50">
                    <HStack mb={2}><EditIcon color="purple.600" /><Text fontSize="sm" fontWeight="bold" color="purple.700">2. Aceitar Recurso (Corretor Errou)</Text></HStack>
                    <Text fontSize="xs" color="purple.600" mb={3}>Devolve a redação ao CORRETOR para que ele ajuste as notas obrigatoriamente lendo a instrução abaixo.</Text>
                    <Textarea size="sm" value={mensagemAcao2} onChange={(e) => setMensagemAcao2(e.target.value)} rows={3} bg="white" placeholder="Instrução que será enviada ao CORRETOR para ele ajustar..." mb={3} />
                    <Button w="full" colorScheme="purple" onClick={() => resolverAuditoria('RECURSO_ACEITE', mensagemAcao2)} isLoading={loadingAudit}>Exigir Refação do Corretor</Button>
                  </Box>
                </VStack>
              )}

              {isQA && !isPaga && (
                <VStack align="stretch" spacing={4}>
                    <Box p={4} border="1px solid" borderColor="purple.200" borderRadius="xl" bg="purple.50">
                      <HStack mb={2}><Icon as={EditIcon} color="purple.600" /><Text fontSize="sm" fontWeight="bold" color="purple.700">O Corretor Errou (Exigir Refação)</Text></HStack>
                      <Text fontSize="xs" color="purple.600" mb={3}>O corretor receberá um alerta para consertar as notas antes de ganhar por esta redação.</Text>
                      <Textarea size="sm" value={mensagemAcao1} onChange={(e) => setMensagemAcao1(e.target.value)} rows={4} bg="white" placeholder="Ex: Professor, você tirou 40pts na C1 mas o aluno não cometeu erro na linha 15..." mb={3} />
                      <Button w="full" colorScheme="purple" onClick={() => resolverAuditoria('EXIGIR_REFACAO', mensagemAcao1)} isLoading={loadingAudit}>Devolver para Refação</Button>
                    </Box>

                    {avaliacaoEstrelas > 0 && (
                        <Box p={4} border="1px solid" borderColor="gray.300" borderRadius="xl" bg="gray.50">
                          <HStack mb={2}><CheckCircleIcon color="gray.600" /><Text fontSize="sm" fontWeight="bold" color="gray.700">Falso Positivo (Avaliação Injusta)</Text></HStack>
                          <Text fontSize="xs" color="gray.600" mb={3}>O corretor corrigiu corretamente. Ignore a má avaliação do aluno e encerre o QA.</Text>
                          <Button w="full" colorScheme="gray" border="1px solid" borderColor="gray.400" onClick={() => resolverAuditoria('FALSO_POSITIVO_QA', 'Avaliação do aluno foi considerada injusta. Nenhuma punição aplicada ao corretor.')} isLoading={loadingAudit}>Ignorar Má Avaliação</Button>
                        </Box>
                    )}
                </VStack>
              )}
              
              {isQA && isPaga && (
                <VStack align="stretch" spacing={4}>
                  <Alert status="warning" borderRadius="md"><AlertIcon/><Box><Text fontWeight="bold" fontSize="sm">Redação Já Paga</Text><Text fontSize="xs">O corretor já recebeu por esta redação. A nota não pode voltar para ele e deve ser editada diretamente aqui.</Text></Box></Alert>
                  <Box p={4} border="1px solid" borderColor="green.200" borderRadius="xl" bg="green.50">
                      <HStack mb={2}><Icon as={EditIcon} color="green.600" /><Text fontSize="sm" fontWeight="bold" color="green.700">Ajustar Nota Diretamente</Text></HStack>
                      <Text fontSize="xs" color="green.700" mb={4}>Altere os valores abaixo. O corretor será notificado da penalidade, e a nota do aluno será atualizada.</Text>
                      
                      <SimpleGrid columns={2} spacing={3} mb={4}>
                          {compsDisponiveisEdit.map(cNum => (
                              <Box key={cNum} bg="white" p={2} borderRadius="md" border="1px solid" borderColor="green.200" shadow="sm">
                                  <Text fontSize="2xs" fontWeight="bold" color="green.700" mb={1}>COMPETÊNCIA {cNum}</Text>
                                  <Select size="sm" bg="gray.50" value={notasEditadas[cNum] || 0} onChange={(e) => setNotasEditadas({...notasEditadas, [cNum]: e.target.value})}>
                                      {notasPossiveisEdit.map(n => <option key={n} value={n}>{n} pts</option>)}
                                  </Select>
                              </Box>
                          ))}
                      </SimpleGrid>

                      <Flex justify="space-between" align="center" mb={4} p={3} bg="white" borderRadius="md" border="1px solid" borderColor="green.300" shadow="sm">
                          <Text fontSize="sm" fontWeight="bold" color="green.800">Nova Nota Final:</Text>
                          <Badge colorScheme="green" fontSize="lg" px={3} py={1} borderRadius="md">{notaFinalCalculadaEdit} pts</Badge>
                      </Flex>

                      <Textarea size="sm" value={mensagemAcao1} onChange={(e) => setMensagemAcao1(e.target.value)} rows={3} bg="white" placeholder="Justifique a alteração da nota e a punição..." mb={3} />
                      <Button w="full" colorScheme="green" onClick={() => resolverAuditoriaEditandoNota(mensagemAcao1, notasEditadas)} isLoading={loadingAudit}>Confirmar Edição de Nota</Button>
                  </Box>
                  
                  {avaliacaoEstrelas > 0 && (
                      <Box p={4} border="1px solid" borderColor="gray.300" borderRadius="xl" bg="gray.50">
                        <HStack mb={2}><CheckCircleIcon color="gray.600" /><Text fontSize="sm" fontWeight="bold" color="gray.700">Falso Positivo (Avaliação Injusta)</Text></HStack>
                        <Text fontSize="xs" color="gray.600" mb={3}>O corretor corrigiu corretamente. Ignore a má avaliação do aluno e encerre o QA.</Text>
                        <Button w="full" colorScheme="gray" border="1px solid" borderColor="gray.400" onClick={() => resolverAuditoria('FALSO_POSITIVO_QA', 'Avaliação do aluno foi considerada injusta. Nenhuma punição aplicada ao corretor.')} isLoading={loadingAudit}>Ignorar Má Avaliação</Button>
                      </Box>
                  )}
                </VStack>
              )}

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
                        {motivadoresTema && motivadoresTema.length > 0 ? (
                          motivadoresTema.map((m, i) => (
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
    <Container maxW="full" py={8} px={{ base: 4, md: 8 }} bg="gray.50" minH="100vh">
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Box mb={2}>
            <Heading size="lg" color="teal.700">Torre de Controle</Heading>
            <Text color="gray.500" fontSize="md">Monitoramento operacional e pedagógico da fila de correções.</Text>
          </Box>
        </Flex>

        <Tabs isLazy index={tabIndex} onChange={(i) => setTabIndex(i)}>
          <TabList mb={6} borderBottom="2px solid" borderColor="gray.200" gap={2}>
            <Tab _selected={{ color: 'teal.700', bg: 'teal.50', borderBottom: '3px solid', borderColor: 'teal.500', fontWeight: 'bold' }}>🚦 Gestão da Fila</Tab>
            <Tab _selected={{ color: 'red.700', bg: 'red.50', borderBottom: '3px solid', borderColor: 'red.500', fontWeight: 'bold' }}>⚖ Auditoria & Recursos {listaAuditoria.length > 0 && <Badge ml={2} colorScheme="red" borderRadius="full">{listaAuditoria.length}</Badge>}</Tab>
            <Tab _selected={{ color: 'orange.700', bg: 'orange.50', borderBottom: '3px solid', borderColor: 'orange.500', fontWeight: 'bold' }}>🛠️ Triagem de T.I. {listaTriagem.length > 0 && <Badge ml={2} colorScheme="orange" borderRadius="full">{listaTriagem.length}</Badge>}</Tab>
            <Tab _selected={{ color: 'purple.700', bg: 'purple.50', borderBottom: '3px solid', borderColor: 'purple.500', fontWeight: 'bold' }}>💎 Qualidade (QA) {listaQA.length > 0 && <Badge ml={2} colorScheme="purple" borderRadius="full">{listaQA.length}</Badge>}</Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={0}>
              <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={4} mb={6}>
                <Card bg="white" shadow="sm" border="1px solid" borderColor="gray.100" borderTop="4px solid" borderTopColor="yellow.400">
                  <Box p={4} textAlign="left"><Stat><StatLabel fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">Aguardando</StatLabel><StatNumber fontSize="1.875rem" color="yellow.600">{qtdAguardando}</StatNumber></Stat></Box>
                </Card>
                <Card bg="white" shadow="sm" border="1px solid" borderColor="gray.100" borderTop="4px solid" borderTopColor="blue.400">
                  <Box p={4} textAlign="left"><Stat><StatLabel fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">Em Correção</StatLabel><StatNumber fontSize="1.875rem" color="blue.600">{qtdEmCorrecao}</StatNumber></Stat></Box>
                </Card>
                <Card bg="white" shadow="sm" border="1px solid" borderColor="gray.100" borderTop="4px solid" borderTopColor="green.400">
                  <Box p={4} textAlign="left"><Stat><StatLabel fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">Corrigidas</StatLabel><StatNumber fontSize="1.875rem" color="green.600">{qtdCorrigidas}</StatNumber></Stat></Box>
                </Card>
                <Card bg="white" shadow="sm" border="1px solid" borderColor="gray.100" borderTop="4px solid" borderTopColor="red.500">
                  <Box p={4} textAlign="left"><Stat><StatLabel fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">Auditoria / Triagem</StatLabel><StatNumber fontSize="1.875rem" color="red.600">{qtdProblemas}</StatNumber></Stat></Box>
                </Card>
                <Card bg="white" shadow="sm" border="1px solid" borderColor="gray.100" borderTop="4px solid" borderTopColor="purple.500" bgGradient="linear(to-br, white, purple.50)">
                  <Box p={4} textAlign="left"><Stat><StatLabel fontSize="xs" color="purple.600" fontWeight="bold" textTransform="uppercase">VIP / Urgente</StatLabel><StatNumber fontSize="1.875rem" color="purple.700">{qtdVips}</StatNumber></Stat></Box>
                </Card>
                <Card bg="white" shadow="sm" border="1px solid" borderColor="gray.100" borderTop="4px solid" borderTopColor="orange.500" bgGradient="linear(to-br, white, orange.50)">
                  <Box p={4} textAlign="left"><Stat><StatLabel fontSize="xs" color="orange.600" fontWeight="bold" textTransform="uppercase">Atrasados</StatLabel><StatNumber fontSize="1.875rem" color="orange.700">{qtdAtrasados}</StatNumber></Stat></Box>
                </Card>
              </SimpleGrid>
              
              <Flex gap={3} bg="white" p={4} borderRadius="xl" boxShadow="sm" align="center" border="1px solid" borderColor="gray.100" wrap="wrap" mb={6}>
                <InputGroup flex={1} minW="220px" size="sm">
                  <InputLeftElement pointerEvents='none'><SearchIcon color='gray.400' /></InputLeftElement>
                  <Input placeholder="Buscar Cód, Tema, Aluno ou Corretor..." value={busca} onChange={e => setBusca(e.target.value)} />
                </InputGroup>
                
                <Select w="180px" size="sm" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                  <option value="TODOS">Status: Todos</option>
                  <option value="AGUARDANDO">Aguardando</option>
                  <option value="PRESAS">⚠️ Presas c/ Corretor</option>
                  <option value="EM_CORRECAO">Em Correção</option>
                  <option value="CORRIGIDA">Corrigidas</option>
                  <option value="FINALIZADA">Finalizadas / Pagas</option>
                  <option value="REFAZER">Em Refação</option>
                  <option value="DEVOLVIDA">Devolvidas/Anuladas</option>
                </Select>
                
                <Divider orientation="vertical" h="20px" display={{ base: 'none', md: 'block' }} />
                
                <HStack spacing={2}>
                    <Select w="140px" size="sm" value={periodoFiltro} onChange={e => setPeriodoFiltro(e.target.value)}>
                        <option value="MES_ATUAL">Mês Atual</option>
                        <option value="MES_ANTERIOR">Mês Anterior</option>
                        <option value="HOJE">Hoje</option>
                        <option value="ONTEM">Ontem</option>
                        <option value="TUDO">Todo o Período</option>
                        <option value="PERSONALIZADO">Personalizado...</option>
                    </Select>
                    {periodoFiltro === 'PERSONALIZADO' && (
                        <>
                            <Input type="date" size="sm" w="120px" value={dataInicioFila} onChange={e => setDataInicioFila(e.target.value)} />
                            <Text fontSize="xs" color="gray.500" fontWeight="medium">até</Text>
                            <Input type="date" size="sm" w="120px" value={dataFimFila} onChange={e => setDataFimFila(e.target.value)} />
                        </>
                    )}
                </HStack>

                <Divider orientation="vertical" h="20px" display={{ base: 'none', md: 'block' }} />
                
                <Select w="140px" size="sm" value={filtroSLA} onChange={e => setFiltroSLA(e.target.value)}>
                  <option value="TODOS">SLA: Todos</option>
                  <option value="ATRASADO">🔴 Atrasados</option>
                  <option value="VIP">🟣 VIP Pago</option>
                  <option value="URGENTE">🟠 Urgente</option>
                </Select>

                <IconButton aria-label="Atualizar" icon={<RepeatIcon />} colorScheme="teal" size="sm" onClick={() => carregarDados(false)} isLoading={loading} />
              </Flex>
              
              <Box bg="white" shadow="sm" borderRadius="lg" overflow="hidden" border="1px solid" borderColor="gray.200">
                <Table variant="simple" style={{ tableLayout: 'fixed', width: '100%' }}>
                  <Thead bg="gray.50"><Tr><Th w="10%" px={4}>Cód.</Th><Th w="40%" px={4}>Tema</Th><Th w="15%" px={3} textAlign="center">Status</Th><Th w="20%" px={3} textAlign="center">Datas / SLA</Th><Th w="15%" px={3} textAlign="center">Ações</Th></Tr></Thead>
                  <Tbody>
                    {filaPaginada.map(r => {
                      const sla = getSLA(r); 
                      const corretorNomeStr = getCorretorNome(r);
                      const isPaga = r.foi_pago === true || String(r.foi_pago).toLowerCase() === 'true';

                      const isVereditoFinal = r.correcao?.comentario_geral?.match(/FALHA GRAVE CONFIRMADA|REDAÇÃO DEVOLVIDA|ANULAR_E_DEVOLVER/i);
                      const isQAValid = ((r.status === 'CORRIGIDA' && !isPaga) || r.status === 'EM_QA') && !isVereditoFinal;

                      return (
                      <Tr key={r.id} _hover={{ bg: 'gray.50' }} bg={r.status === 'REFAZER' ? 'yellow.50' : ((r.is_urgente || r.vip_pago) ? 'purple.50' : 'transparent')}>
                        <Td fontWeight="bold" color="gray.700" px={4}>#{r.id}</Td>
                        <Td px={4} title={r.tema_titulo}>
                            <Text fontWeight="bold" fontSize="sm" color="gray.800" whiteSpace="normal" wordBreak="break-word">{r.tema_titulo}</Text>
                            <Text fontSize="xs" color="gray.500" mt={1}>Aluno: <strong>{r.aluno_nome || "Desconhecido"}</strong></Text>
                        </Td>
                        <Td px={3} textAlign="center">
                          {getStatusBadge(r)}
                          {corretorNomeStr !== 'N/A' && (r.status === 'EM_CORRECAO' || r.status === 'REFAZER' || r.status === 'CORRIGIDA' || r.status === 'FINALIZADA') && (<Text fontSize="2xs" color="blue.600" mt={1} fontWeight="bold">Prof: {corretorNomeStr}</Text>)}
                        </Td>
                        <Td px={3} textAlign="center">
                          <VStack spacing={1}>
                            <Badge colorScheme={sla.badge} borderRadius="md" px={2} fontSize="2xs">{sla.texto}</Badge>
                            <Text fontSize="xs" color="gray.600">Envio: {r.data_envio ? new Date(r.data_envio).toLocaleDateString('pt-BR') : '--'}</Text>
                            {['CORRIGIDA', 'EM_QA', 'FINALIZADA'].includes(r.status) && r.data_atualizacao && (
                                <Text fontSize="xs" color="green.600" fontWeight="bold">Correção: {new Date(r.data_atualizacao).toLocaleDateString('pt-BR')}</Text>
                            )}
                            {r.vip_pago && <Badge colorScheme="purple" variant="solid" mt={1} fontSize="2xs"><StarIcon mr={1} mb={0.5}/> VIP PAGO</Badge>}
                            {!r.vip_pago && r.is_urgente && <Badge colorScheme="red" variant="solid" mt={1} fontSize="2xs"><WarningIcon mr={1}/> URGENTE</Badge>}
                          </VStack>
                        </Td>
                        <Td px={3} textAlign="center">
                          <HStack spacing={2} justify="center">
                            
                            {(['DEVOLVIDA', 'ANULADA', 'FINALIZADA'].includes(r.status) || (r.status === 'CORRIGIDA' && isPaga) || isVereditoFinal) && (
                                <Tooltip label="Ver Detalhes" hasArrow>
                                    <IconButton size="sm" colorScheme="blue" variant="outline" icon={<ViewIcon />} onClick={() => abrirJulgamento(r.id)} shadow="sm" />
                                </Tooltip>
                            )}

                            {isQAValid && (
                                <Button size="sm" colorScheme="purple" onClick={() => abrirJulgamento(r.id)} shadow="sm">QA</Button>
                            )}

                            {['AGUARDANDO', 'EM_CORRECAO', 'REFAZER'].includes(r.status) && (
                                <>
                                  <Tooltip label={r.vip_pago ? "Urgência comprada (Inalterável)" : (r.is_urgente ? "Remover Urgência" : "Marcar Urgente")} hasArrow><Button size="sm" colorScheme={r.vip_pago || r.is_urgente ? "purple" : "gray"} variant={r.vip_pago || r.is_urgente ? "solid" : "outline"} onClick={() => toggleUrgencia(r)} isDisabled={r.vip_pago}><Icon as={r.vip_pago ? StarIcon : WarningIcon} /></Button></Tooltip>
                                  <Tooltip label={(r.status === 'EM_CORRECAO' || r.status === 'REFAZER') ? "Arrancar do Corretor" : "Nenhum corretor pegou ainda"} hasArrow><Button size="sm" colorScheme="orange" variant="outline" isDisabled={r.status !== 'EM_CORRECAO' && r.status !== 'REFAZER'} onClick={() => confirmarLiberacao(r.id)}><Icon as={UnlockIcon} /></Button></Tooltip>
                                </>
                            )}

                          </HStack>
                        </Td>
                      </Tr>
                    )})}
                    {filaPaginada.length === 0 && <Tr><Td colSpan={5} textAlign="center" py={10} color="gray.500">Nenhum resultado encontrado.</Td></Tr>}
                  </Tbody>
                </Table>
                {redacoesFiltradas.length > 0 && (
                  <Flex justify="space-between" align="center" p={4} bg="gray.50" borderTop="1px solid" borderColor="gray.200" wrap="wrap" gap={4}>
                    <HStack><Text fontSize="sm" color="gray.600">Mostrar</Text><Select size="sm" w="80px" bg="white" value={itensPorPaginaFila} onChange={(e) => { setItensPorPaginaFila(Number(e.target.value)); setPaginaAtualFila(1); }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></Select><Text fontSize="sm" color="gray.600">por página</Text></HStack>
                    <Text fontSize="sm" color="gray.600" fontWeight="bold">Total de registros encontrados: {redacoesFiltradas.length}</Text>
                    <HStack><Button size="sm" onClick={() => setPaginaAtualFila(p => Math.max(1, p - 1))} isDisabled={paginaAtualFila === 1} bg="white" shadow="sm">Anterior</Button><Text fontSize="sm" fontWeight="bold" px={2}>{paginaAtualFila} / {Math.ceil(redacoesFiltradas.length / itensPorPaginaFila)}</Text><Button size="sm" onClick={() => setPaginaAtualFila(p => Math.min(Math.ceil(redacoesFiltradas.length / itensPorPaginaFila), p + 1))} isDisabled={paginaAtualFila === Math.ceil(redacoesFiltradas.length / itensPorPaginaFila)} bg="white" shadow="sm">Próxima</Button></HStack>
                  </Flex>
                )}
              </Box>
            </TabPanel>

            <TabPanel p={0}>
              <Card bg="red.50" shadow="sm" borderRadius="lg" overflow="hidden" border="1px solid" borderColor="red.200">
                <Flex p={4} bg="white" borderBottom="1px solid" borderColor="red.200" justify="space-between" align="center">
                  <HStack>
                    <Text fontSize="sm" fontWeight="bold" color="red.700">Filtrar Pedidos:</Text>
                    <Select size="sm" w="200px" bg="gray.50" value={filtroAuditoria} onChange={e => setFiltroAuditoria(e.target.value)}>
                        <option value="TODOS">Todos as Análises</option>
                        <option value="EM_AUDITORIA">Somente Falhas Graves</option>
                        <option value="EM_RECURSO">Somente Recursos (Alunos)</option>
                    </Select>
                  </HStack>
                </Flex>
                <Table variant="simple" style={{ tableLayout: 'fixed', width: '100%' }}>
                <Thead bg="red.100"><Tr><Th w="40%" px={6} color="red.800">Código / Tema</Th><Th w="20%" px={4} textAlign="center" color="red.800">Origem</Th><Th w="25%" px={4} textAlign="center" color="red.800">Aluno</Th><Th w="15%" px={6} textAlign="right" color="red.800">Ação</Th></Tr></Thead>
                <Tbody>
                    {auditoriaPaginada.map(r => (
                    <Tr key={r.id} _hover={{ bg: 'red.100' }}>
                        <Td px={6}>
                            <Text fontWeight="bold" fontSize="sm" color="gray.800" whiteSpace="normal" wordBreak="break-word">#{r.id} - {r.tema_titulo}</Text>
                            <Text fontSize="xs" color="gray.500">Enviada em {new Date(r.data_envio).toLocaleDateString('pt-BR')}</Text>
                        </Td>
                        <Td px={4} textAlign="center">
                            {r.status === 'EM_RECURSO' || r.status === 'RECURSO' ? (
                                <Badge colorScheme="blue" variant="solid" borderRadius="md" px={2} py={1}><ViewIcon mr={1}/> RECURSO</Badge>
                            ) : (
                                <Badge colorScheme="red" variant="solid" borderRadius="md" px={2} py={1}><WarningTwoIcon mr={1}/> FALHA GRAVE</Badge>
                            )}
                        </Td>
                        <Td px={4} textAlign="center"><Text fontWeight="medium" fontSize="sm">{r.aluno_nome}</Text></Td>
                        <Td px={6} textAlign="right"><Button size="sm" colorScheme="red" leftIcon={<ViewIcon />} onClick={() => abrirJulgamento(r.id)} shadow="sm" w="full">Julgar Erro</Button></Td>
                    </Tr>
                    ))}
                    {auditoriaPaginada.length === 0 && <Tr><Td colSpan={4} textAlign="center" py={10} color="gray.500">Nenhuma redação na fila de auditoria pedagógica!</Td></Tr>}
                </Tbody>
                </Table>
                {listaAuditoria.length > 0 && (
                  <Flex justify="space-between" align="center" p={4} bg="red.100" borderTop="1px solid" borderColor="red.200" wrap="wrap" gap={4}>
                    <HStack><Text fontSize="sm" color="red.800">Mostrar</Text><Select size="sm" w="80px" bg="white" value={itensPorPaginaAuditoria} onChange={(e) => { setItensPorPaginaAuditoria(Number(e.target.value)); setPaginaAtualAuditoria(1); }}><option value={10}>10</option><option value={25}>25</option></Select></HStack>
                    <Text fontSize="sm" color="red.800" fontWeight="bold">Total de registros encontrados: {listaAuditoria.length}</Text>
                    <HStack><Button size="sm" onClick={() => setPaginaAtualAuditoria(p => Math.max(1, p - 1))} isDisabled={paginaAtualAuditoria === 1} bg="white" shadow="sm">Anterior</Button><Text fontSize="sm" fontWeight="bold" px={2} color="red.800">{paginaAtualAuditoria} / {Math.ceil(listaAuditoria.length / itensPorPaginaAuditoria)}</Text><Button size="sm" onClick={() => setPaginaAtualAuditoria(p => Math.min(Math.ceil(listaAuditoria.length / itensPorPaginaAuditoria), p + 1))} isDisabled={paginaAtualAuditoria === Math.ceil(listaAuditoria.length / itensPorPaginaAuditoria)} bg="white" shadow="sm">Próxima</Button></HStack>
                  </Flex>
                )}
              </Card>
            </TabPanel>

            <TabPanel p={0}>
              <Card bg="orange.50" shadow="sm" borderRadius="lg" overflow="hidden" border="1px solid" borderColor="orange.200">
                <Table variant="simple" style={{ tableLayout: 'fixed', width: '100%' }}>
                  <Thead bg="orange.100"><Tr><Th w="40%" px={6} color="orange.800">Código / Tema</Th><Th w="25%" px={4} textAlign="center" color="orange.800">Corretor Reportou</Th><Th w="20%" px={4} textAlign="center" color="orange.800">Aluno</Th><Th w="15%" px={6} textAlign="right" color="orange.800">Ação</Th></Tr></Thead>
                  <Tbody>
                    {triagemPaginada.map(r => (
                      <Tr key={r.id} _hover={{ bg: 'orange.100' }}>
                        <Td px={6}>
                            <Text fontWeight="bold" fontSize="sm" color="gray.800" whiteSpace="normal" wordBreak="break-word">#{r.id} - {r.tema_titulo}</Text>
                            <Text fontSize="xs" color="gray.500">Enviada em {new Date(r.data_envio).toLocaleDateString('pt-BR')}</Text>
                        </Td>
                        <Td px={4} textAlign="center"><Text fontWeight="bold" color="orange.700" fontSize="sm">{getCorretorNome(r)}</Text></Td>
                        <Td px={4} textAlign="center"><Text fontWeight="medium" fontSize="sm">{r.aluno_nome}</Text></Td>
                        <Td px={6} textAlign="right">
                            <Tooltip label="Analisar Triagem" hasArrow>
                                <IconButton size="sm" colorScheme="orange" icon={<ViewIcon />} onClick={() => abrirJulgamento(r.id)} shadow="sm" />
                            </Tooltip>
                        </Td>
                      </Tr>
                    ))}
                    {triagemPaginada.length === 0 && <Tr><Td colSpan={4} textAlign="center" py={10} color="gray.500">Nenhum problema técnico reportado!</Td></Tr>}
                  </Tbody>
                </Table>
                {listaTriagem.length > 0 && (
                  <Flex justify="space-between" align="center" p={4} bg="orange.100" borderTop="1px solid" borderColor="orange.200" wrap="wrap" gap={4}>
                    <HStack><Text fontSize="sm" color="orange.800">Mostrar</Text><Select size="sm" w="80px" bg="white" value={itensPorPaginaTriagem} onChange={(e) => { setItensPorPaginaTriagem(Number(e.target.value)); setPaginaAtualTriagem(1); }}><option value={10}>10</option><option value={25}>25</option></Select></HStack>
                    <Text fontSize="sm" color="orange.800" fontWeight="bold">Total de registros: {listaTriagem.length}</Text>
                    <HStack><Button size="sm" onClick={() => setPaginaAtualTriagem(p => Math.max(1, p - 1))} isDisabled={paginaAtualTriagem === 1} bg="white" shadow="sm">Anterior</Button><Text fontSize="sm" fontWeight="bold" px={2} color="orange.800">{paginaAtualTriagem} / {Math.ceil(listaTriagem.length / itensPorPaginaTriagem)}</Text><Button size="sm" onClick={() => setPaginaAtualTriagem(p => Math.min(Math.ceil(listaTriagem.length / itensPorPaginaTriagem), p + 1))} isDisabled={paginaAtualTriagem === Math.ceil(listaTriagem.length / itensPorPaginaTriagem)} bg="white" shadow="sm">Próxima</Button></HStack>
                  </Flex>
                )}
              </Card>
            </TabPanel>

            <TabPanel p={0}>
              <Card bg="purple.50" shadow="sm" borderRadius="lg" overflow="hidden" border="1px solid" borderColor="purple.200">
                <Flex p={4} bg="white" borderBottom="1px solid" borderColor="purple.200" justify="space-between" align="center" wrap="wrap" gap={3}>
                  <HStack spacing={4}>
                    <HStack>
                        <Text fontSize="sm" fontWeight="bold" color="purple.700">Origem:</Text>
                        <Select size="sm" w="200px" bg="gray.50" value={filtroQA} onChange={e => setFiltroQA(e.target.value)}>
                            <option value="TODOS">Todas as Auditorias</option>
                            <option value="MA_AVALIACAO">⭐ Somente Má Avaliação</option>
                            <option value="AMOSTRAGEM">🎲 Somente Amostragem (5%)</option>
                            <option value="PAGAS">💰 Somente Já Pagas</option>
                        </Select>
                    </HStack>
                    <Divider orientation="vertical" h="20px" borderColor="purple.300" />
                    <HStack>
                        <Text fontSize="sm" fontWeight="bold" color="purple.700">Corretor:</Text>
                        <Select size="sm" w="200px" bg="gray.50" value={filtroCorretorQA} onChange={e => setFiltroCorretorQA(e.target.value)}>
                            <option value="TODOS">Todos os Corretores</option>
                            {corretoresQAUnicos.map(c => <option key={c} value={c}>{c}</option>)}
                        </Select>
                    </HStack>
                  </HStack>
                </Flex>
                <Table variant="simple" style={{ tableLayout: 'fixed', width: '100%' }}>
                  <Thead bg="purple.100"><Tr><Th w="30%" px={6} color="purple.800">Código / Tema</Th><Th w="20%" px={4} textAlign="center" color="purple.800">Aluno</Th><Th w="20%" px={4} textAlign="center" color="purple.800">Corretor Avaliado</Th><Th w="15%" px={4} textAlign="center" color="purple.800">Origem / Status</Th><Th w="15%" px={6} textAlign="right" color="purple.800">Ação</Th></Tr></Thead>
                  <Tbody>
                    {qaPaginada.map(r => {
                      const isPaga = r.foi_pago === true || String(r.foi_pago).toLowerCase() === 'true';
                      const isMaAvaliacao = r.correcao?.avaliacao_aluno > 0;
                      return (
                      <Tr key={r.id} _hover={{ bg: 'purple.100' }}>
                        <Td px={6}>
                            <Text fontWeight="bold" fontSize="sm" color="gray.800" whiteSpace="normal" wordBreak="break-word">#{r.id} - {r.tema_titulo}</Text>
                            <Text fontSize="xs" color="gray.500">Corrigida em {new Date(r.data_envio).toLocaleDateString('pt-BR')}</Text>
                        </Td>
                        <Td px={4} textAlign="center"><Text fontWeight="medium" fontSize="sm">{r.aluno_nome}</Text></Td>
                        <Td px={4} textAlign="center"><Badge colorScheme="purple" variant="outline" borderRadius="md" px={2}>Prof: {getCorretorNome(r)}</Badge></Td>
                        <Td px={4} textAlign="center">
                            <VStack spacing={1}>
                                {isMaAvaliacao ? <Badge colorScheme="red" fontSize="2xs"><StarIcon mr={1}/> MÁ AVALIAÇÃO</Badge> : <Badge colorScheme="blue" fontSize="2xs"><Icon as={SearchIcon} mr={1}/> AMOSTRAGEM</Badge>}
                                {isPaga && <Badge colorScheme="green" fontSize="2xs"><CheckCircleIcon mr={1}/> PAGA</Badge>}
                            </VStack>
                        </Td>
                        <Td px={6} textAlign="right">
                          <Button w="full" size="sm" colorScheme="purple" leftIcon={<SearchIcon />} onClick={() => abrirJulgamento(r.id)} shadow="sm">Inspecionar</Button>
                        </Td>
                      </Tr>
                    )})}
                    {qaPaginada.length === 0 && <Tr><Td colSpan={5} textAlign="center" py={10} color="gray.500">A amostragem automática de qualidade está vazia.</Td></Tr>}
                  </Tbody>
                </Table>
                {listaQA.length > 0 && (
                  <Flex justify="space-between" align="center" p={4} bg="purple.100" borderTop="1px solid" borderColor="purple.200" wrap="wrap" gap={4}>
                    <HStack><Text fontSize="sm" color="purple.800">Mostrar</Text><Select size="sm" w="80px" bg="white" value={itensPorPaginaQA} onChange={(e) => { setItensPorPaginaQA(Number(e.target.value)); setPaginaAtualQA(1); }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></Select></HStack>
                    <Text fontSize="sm" color="purple.800" fontWeight="bold">Total de registros encontrados: {listaQA.length}</Text>
                    <HStack><Button size="sm" onClick={() => setPaginaAtualQA(p => Math.max(1, p - 1))} isDisabled={paginaAtualQA === 1} bg="white" shadow="sm">Anterior</Button><Text fontSize="sm" fontWeight="bold" px={2} color="purple.800">{paginaAtualQA} / {Math.ceil(listaQA.length / itensPorPaginaQA)}</Text><Button size="sm" onClick={() => setPaginaAtualQA(p => Math.min(Math.ceil(listaQA.length / itensPorPaginaQA), p + 1))} isDisabled={paginaAtualQA === Math.ceil(listaQA.length / itensPorPaginaQA)} bg="white" shadow="sm">Próxima</Button></HStack>
                  </Flex>
                )}
              </Card>
            </TabPanel>

          </TabPanels>
        </Tabs>
      </VStack>

      <Modal isOpen={modalAlerta.isOpen} onClose={modalAlerta.onClose} isCentered size="sm">
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent borderRadius="xl">
          <ModalHeader>Arrancar Redação?</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="center" py={2}>
              <WarningTwoIcon w={10} h={10} color="orange.400" />
              <Text textAlign="center" color="gray.600">O corretor perderá acesso a esta redação imediatamente.</Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={modalAlerta.onClose}>Cancelar</Button>
            <Button colorScheme="orange" onClick={forcarLiberacaoReal}>Sim, Arrancar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Container>
  );
}

export default TorreControle;