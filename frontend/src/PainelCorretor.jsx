import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, Button, Container, Heading, Text, VStack, HStack,
  Flex, Card, CardBody, Badge, Select, Textarea, useToast, 
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, 
  ModalFooter, ModalCloseButton, useDisclosure,
  Accordion, AccordionItem, AccordionButton, AccordionPanel, 
  IconButton, Tooltip, Icon, Popover, PopoverTrigger, PopoverContent, 
  PopoverArrow, PopoverCloseButton, PopoverHeader, PopoverBody,
  Input, Divider, Spinner, SimpleGrid, Stat, StatLabel, StatNumber, 
  InputGroup, InputLeftElement, Switch, FormControl, FormLabel, 
  Alert, AlertIcon, Table, Thead, Tbody, Tr, Th, Td, Image, Portal, GridItem,
  Tabs, TabList, TabPanels, Tab, TabPanel,
  Stepper, Step, StepIndicator, StepStatus, StepIcon, StepNumber, 
  StepTitle, StepDescription, StepSeparator
} from '@chakra-ui/react';
import { 
  ViewIcon, ViewOffIcon, DeleteIcon, AddIcon, EditIcon, 
  TimeIcon, SearchIcon, CheckCircleIcon, WarningTwoIcon, 
  InfoIcon, ArrowBackIcon, StarIcon, WarningIcon, DownloadIcon, AttachmentIcon, ChatIcon
} from '@chakra-ui/icons';
import { MdAttachMoney, MdAccountBalanceWallet } from 'react-icons/md';

// ==============================================================================
// COMPONENTES VISUAIS E ÍCONES AUXILIARES
// ==============================================================================
const UserIcon = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </Icon>
);

const CustomPinSVG = ({ cor, numero }) => (
  <Box position="relative" w="30px" h="30px" color={cor} filter="drop-shadow(0px 3px 3px rgba(0,0,0,0.2))" transition="transform 0.2s" _hover={{ transform: 'scale(1.15)' }}>
    <Icon viewBox="0 0 24 24" w="100%" h="100%">
      <path fill="currentColor" d="M4 2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2z"/>
    </Icon>
    <Text position="absolute" top="4.5px" left="2px" w="100%" textAlign="center" color="white" fontSize="12px" fontWeight="900" fontFamily="system-ui">
      {numero}
    </Text>
  </Box>
);

// ==============================================================================
// CONSTANTES GLOBAIS
// ==============================================================================
const ERROS_GRAMATICA = [
  { label: 'Ortografia', value: 'ORTOGRAFIA' }, { label: 'Acentuação', value: 'ACENTUACAO' }, 
  { label: 'Pontuação', value: 'PONTUACAO' }, { label: 'Concordância', value: 'CONCORDANCIA' }, 
  { label: 'Regência', value: 'REGENCIA' }, { label: 'Crase', value: 'CRASE' }, 
  { label: 'Colocação Pronominal', value: 'COLOCACAO_PRONOMINAL' }, { label: 'Translineação', value: 'TRANSLINEACAO' }, 
  { label: 'Impropriedade Vocabular', value: 'IMPROPRIEDADE_VOCABULAR' }, { label: 'Outros', value: 'OUTROS' }
];

const COMPETENCIAS_ENEM = [
  { id: 1, nome: '1. Gramática', cor: 'red.500', erros: ERROS_GRAMATICA }, 
  { id: 2, nome: '2. Tema/Estrutura', cor: 'blue.500' }, 
  { id: 3, nome: '3. Argumentação', cor: 'yellow.400' }, 
  { id: 4, nome: '4. Coesão', cor: 'green.500' }, 
  { id: 5, nome: '5. Proposta', cor: 'purple.500' }
];
const NOTAS_ENEM = [0, 40, 80, 120, 160, 200];

const COMPETENCIAS_SIMPLES = [
  { id: 1, nome: '1. Gramática', cor: 'red.500', erros: ERROS_GRAMATICA }, 
  { id: 2, nome: '2. Estrutura e atendimento ao tema', cor: 'blue.500' }, 
  { id: 3, nome: '3. Argumentação', cor: 'yellow.400' }, 
  { id: 4, nome: '4. Coesão e coerência', cor: 'green.500' }
];
const NOTAS_SIMPLES = [0, 5, 10, 15, 20, 25];

const INFO_COMPETENCIAS_ENEM = { 
  1: { nome: "Gramática", cor: "red.500", bg: "red.50" }, 2: { nome: "Tema/Estrutura", cor: "blue.500", bg: "blue.50" }, 
  3: { nome: "Argumentação", cor: "orange.500", bg: "orange.50" }, 4: { nome: "Coesão", cor: "green.500", bg: "green.50" }, 
  5: { nome: "Proposta", cor: "purple.500", bg: "purple.50" } 
};
const INFO_COMPETENCIAS_SIMPLES = { 
  1: { nome: "Gramática", cor: "red.500", bg: "red.50" }, 2: { nome: "Estrutura e atendimento ao tema", cor: "blue.500", bg: "blue.50" }, 
  3: { nome: "Argumentação", cor: "yellow.500", bg: "yellow.50" }, 4: { nome: "Coesão e coerência", cor: "green.500", bg: "green.50" } 
};

const INFOS_MANUAL = { 
  'CORRETOR_CARTILHA': { nome: 'Cartilha Oficial', cor: 'blue', icone: InfoIcon }, 
  'CORRETOR_REGUA': { nome: 'Régua de Penalizações', cor: 'red', icone: WarningTwoIcon }, 
  'CORRETOR_DESVIOS': { nome: 'Guia de Desvios', cor: 'orange', icone: EditIcon }, 
  'CORRETOR_REPERTORIO': { nome: 'Repertórios Aceitos', cor: 'green', icone: CheckCircleIcon }, 
  'CORRETOR_COMUNICADO': { nome: 'Comunicado', cor: 'purple', icone: ChatIcon }, 
  'OUTROS': { nome: 'Geral', cor: 'gray', icone: AttachmentIcon } 
};

// ==============================================================================
// LÓGICA DE AUTO-CURA FINANCEIRA (Resolve duplicatas e saldo do Backend)
// ==============================================================================
const processarCarteira = (dadosOriginais) => {
  if (!dadosOriginais) return dadosOriginais;

  // 1. Remove duplicatas (Refação/QA) mantendo a transação mais antiga (que gerou o pagamento original)
  let txsOrdenadas = [...(dadosOriginais.transacoes || [])].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  let transacoesUnicas = [];
  let redacoesVistas = new Set();

  txsOrdenadas.forEach(tx => {
      let match = (tx.descricao || "").match(/#(\d+)/);
      let rId = match ? match[1] : `tx_${tx.id}`;
      if (!redacoesVistas.has(rId)) {
          redacoesVistas.add(rId);
          transacoesUnicas.push(tx);
      }
  });

  // 2. Prepara os recibos do mais antigo para o mais novo
  let recibos = JSON.parse(JSON.stringify(dadosOriginais.historico_pagamentos || []));
  recibos.sort((a, b) => new Date(a.data_pagamento || a.data_solicitacao).getTime() - new Date(b.data_pagamento || b.data_solicitacao).getTime());

  if (dadosOriginais.solicitacao_ativa) {
      recibos.push({
         ...dadosOriginais.solicitacao_ativa,
         is_ativa: true
      });
  }

  let usedTxIds = new Set();

  // 3. Distribui as transações nos recibos baseando-se na quantidade exata solicitada (FIFO)
  recibos.forEach(recibo => {
      let normaisFaltantes = recibo.qtd_normal || 0;
      let vipsFaltantes = recibo.qtd_vip || 0;

      transacoesUnicas.forEach(tx => {
          if (usedTxIds.has(tx.id)) return;
          
          const isVip = tx.descricao.includes('Bônus') || tx.descricao.includes('VIP');

          if (isVip && vipsFaltantes > 0) {
              tx.pagamento_id = recibo.id;
              tx.foi_pago = !recibo.is_ativa;
              usedTxIds.add(tx.id);
              vipsFaltantes--;
          } else if (!isVip && normaisFaltantes > 0) {
              tx.pagamento_id = recibo.id;
              tx.foi_pago = !recibo.is_ativa;
              usedTxIds.add(tx.id);
              normaisFaltantes--;
          }
      });
  });

  // 4. Calcula o saldo real das transações que não entraram em nenhum recibo
  let saldoCalculado = 0;
  let normaisPendentes = 0;
  let vipsPendentes = 0;

  transacoesUnicas.forEach(tx => {
      if (!usedTxIds.has(tx.id)) {
          tx.pagamento_id = null;
          tx.foi_pago = false;
          saldoCalculado += parseFloat(tx.valor || 0);
          if (tx.descricao.includes('Bônus') || tx.descricao.includes('VIP')) {
              vipsPendentes++;
          } else {
              normaisPendentes++;
          }
      }
  });

  // Ordena as transações de volta (Mais recentes primeiro) para a interface
  transacoesUnicas.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  return {
      ...dadosOriginais,
      transacoes: transacoesUnicas,
      saldo_atual: saldoCalculado,
      qtd_normal_pendente: normaisPendentes,
      qtd_vip_pendente: vipsPendentes
  };
};

// ==============================================================================
// FUNÇÃO INTELIGENTE: TRATA AS TAGS INVISÍVEIS DO BACKEND (PARECER GERAL)
// ==============================================================================
const renderComentarioGeralHist = (texto) => {
    if (!texto) return null;
    let limpo = texto;
    let alertasCoord = [];
    let sinalizacoes = [];

    try {
        const regexCoord = /\[ALERTA_COORDENACAO\]([\s\S]*?)\[\/ALERTA_COORDENACAO\]/gi;
        const matchesCoord = [...texto.matchAll(regexCoord)];
        matchesCoord.forEach(m => alertasCoord.push(m[1].trim()));
        limpo = limpo.replace(/\[ALERTA_COORDENACAO\]([\s\S]*?)\[\/ALERTA_COORDENACAO\]/gi, '');

        const regexSinalizado = /\[SINALIZADO:\s*(.*?)\]/gi;
        const matchesSin = [...texto.matchAll(regexSinalizado)];
        matchesSin.forEach(m => sinalizacoes.push(m[1].trim()));
        limpo = limpo.replace(/\[SINALIZADO:\s*(.*?)\]/gi, '');
    } catch(e) { console.error("Regex safe catch"); }

    limpo = limpo.trim();

    return (
        <VStack align="stretch" spacing={3}>
            {sinalizacoes.map((s, idx) => (
                <Alert key={`sin-${idx}`} status="warning" borderRadius="md" variant="left-accent" p={3} bg="orange.50" border="1px solid" borderColor="orange.200">
                    <AlertIcon color="orange.500" />
                    <Box>
                        <Text fontSize="xs" fontWeight="bold" color="orange.800" textTransform="uppercase">Sinalizado p/ Auditoria</Text>
                        <Text fontSize="sm" color="orange.900" fontWeight="bold">{s.replace('_', ' ')}</Text>
                    </Box>
                </Alert>
            ))}
            
            {alertasCoord.map((a, idx) => (
                <Alert key={`coord-${idx}`} status="error" borderRadius="md" variant="left-accent" p={3} bg="red.50" border="1px solid" borderColor="red.200">
                    <AlertIcon color="red.500" />
                    <Box>
                        <Text fontSize="xs" fontWeight="bold" color="red.800" textTransform="uppercase">Alerta da Coordenação</Text>
                        <Text fontSize="sm" color="red.900" whiteSpace="pre-wrap">{a}</Text>
                    </Box>
                </Alert>
            ))}

            {limpo && (
                <Box bg="blue.50" p={4} borderRadius="md" borderLeft="4px solid" borderColor="blue.400">
                    {limpo.includes("Detalhes do Professor:") ? (
                        <>
                            <Text fontSize="xs" color="blue.800" fontWeight="bold" mb={1} textTransform="uppercase">Detalhes do Professor</Text>
                            <Text fontSize="sm" color="blue.900" lineHeight="tall" whiteSpace="pre-wrap">{limpo.replace("Detalhes do Professor:", "").trim()}</Text>
                        </>
                    ) : (
                        <Text fontSize="sm" color="blue.900" lineHeight="tall" whiteSpace="pre-wrap">{limpo}</Text>
                    )}
                </Box>
            )}
        </VStack>
    );
};

// ==============================================================================
// FUNÇÃO AUXILIAR: VALOR POR EXTENSO (Usado no Recibo RPA)
// ==============================================================================
function valorPorExtenso(valorOriginal) {
  if (!valorOriginal || parseFloat(valorOriginal) === 0) return 'zero reais';
  const valor = parseFloat(valorOriginal);
  const extenso = { 
    unidades: ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"], 
    dez_a_dezenove: ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"], 
    dezenas: ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"], 
    centenas: ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"] 
  };

  function converteGrupo(n) { 
    if (n === 0) return ""; 
    if (n === 100) return "cem"; 
    let c = Math.floor(n / 100); let d = Math.floor((n % 100) / 10); let u = n % 10; 
    let res = extenso.centenas[c]; let resto = n % 100; 
    if (res && resto > 0) res += " e "; 
    if (resto >= 10 && resto <= 19) { res += extenso.dez_a_dezenove[resto - 10]; } 
    else { 
      if (d >= 2) { res += extenso.dezenas[d]; if (u > 0) res += " e "; } 
      if (u > 0 && resto >= 20 || u > 0 && d === 0) { res += extenso.unidades[u]; } 
    } 
    return res; 
  }

  let reais = Math.floor(valor); 
  let centavos = Math.round((valor - reais) * 100); 
  let texto = [];

  if (reais > 0) { 
    let milhares = Math.floor(reais / 1000); let restoReais = reais % 1000; 
    if (milhares > 0) { texto.push(milhares === 1 ? "mil" : converteGrupo(milhares) + " mil"); if (restoReais > 0 && restoReais <= 100) texto.push("e"); } 
    if (restoReais > 0) texto.push(converteGrupo(restoReais)); 
    texto.push(reais === 1 ? "real" : "reais"); 
  }

  if (centavos > 0) { 
    if (reais > 0) texto.push("e"); 
    texto.push(converteGrupo(centavos)); 
    texto.push(centavos === 1 ? "centavo" : "centavos"); 
  } 
  
  return texto.join(" ").replace(/\s+/g, ' ').trim();
}

function PainelCorretor() { 
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  
  // --- ESTADOS PRINCIPAIS DO USUÁRIO E DADOS ---
  const [usuario, setUsuario] = useState({ first_name: 'Corretor', last_name: '', cpf: '', id: null });
  const [fila, setFila] = useState([]);
  const [historico, setHistorico] = useState([]); 
  const [carteira, setCarteira] = useState({ saldo_atual: 0, transacoes: [], historico_pagamentos: [], solicitacao_ativa: null });
  const [materiais, setMateriais] = useState([]);
  const [configPlataforma, setConfigPlataforma] = useState(null); 

  // --- CONTROLE DE TELAS (ABAS) E IMPRESSÃO ---
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);
  const [aba, setAba] = useState('fila');

  // --- ESTADOS DA REDAÇÃO ATUAL (MODO DE CORREÇÃO OU VISUALIZAÇÃO) ---
  const [redacaoAtual, setRedacaoAtual] = useState(null);
  const [conteudoTexto, setConteudoTexto] = useState(null);
  const [redacaoVisualizar, setRedacaoVisualizar] = useState(null);
  const [hoveredPinViewId, setHoveredPinViewId] = useState(null);

  // --- ESTADOS DE FILTRO E PAGINAÇÃO ---
  const [filtroTexto, setFiltroTexto] = useState(""); 
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const [somenteUrgentes, setSomenteUrgentes] = useState(false);
  const [paginaAtualFila, setPaginaAtualFila] = useState(1);
  const [itensPorPaginaFila, setItensPorPaginaFila] = useState(10);

  const [filtroHistTexto, setFiltroHistTexto] = useState("");
  const [filtroHistData, setFiltroHistData] = useState(""); 
  const [filtroHistTipo, setFiltroHistTipo] = useState("TODOS");
  const [paginaAtualHist, setPaginaAtualHist] = useState(1);
  const [itensPorPaginaHist, setItensPorPaginaHist] = useState(10);

  const [filtroDataRecibos, setFiltroDataRecibos] = useState('TUDO');
  const [dtInicioRecibos, setDtInicioRecibos] = useState('');
  const [dtFimRecibos, setDtFimRecibos] = useState('');
  const [paginaAtualRecibos, setPaginaAtualRecibos] = useState(1);
  const [itensPorPaginaRecibos, setItensPorPaginaRecibos] = useState(10);

  const [filtroDataExtrato, setFiltroDataExtrato] = useState('MES_ATUAL');
  const [dtInicioExtrato, setDtInicioExtrato] = useState('');
  const [dtFimExtrato, setDtFimExtrato] = useState('');
  const [filtroStatusExtrato, setFiltroStatusExtrato] = useState('TODOS');
  const [paginaAtualExtrato, setPaginaAtualExtrato] = useState(1);
  const [itensPorPaginaExtrato, setItensPorPaginaExtrato] = useState(10);

  const [buscaResposta, setBuscaResposta] = useState("");
  const [filtroRespModelo, setFiltroRespModelo] = useState("TODOS");
  const [filtroRespContexto, setFiltroRespContexto] = useState("TODOS");
  const [buscaManual, setBuscaManual] = useState("");
  const [filtroManualCat, setFiltroManualCat] = useState("TODOS"); 

  // --- ESTADOS DA CORREÇÃO EM TEMPO REAL ---
  const [notas, setNotas] = useState({});
  const [comentarios, setComentarios] = useState({});
  const [pins, setPins] = useState([]);
  const [mensagemRefacao, setMensagemRefacao] = useState(""); 
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hoveredPinId, setHoveredPinId] = useState(null);
  
  const [todasRespostas, setTodasRespostas] = useState([]);
  const [isLoadingRespostas, setIsLoadingRespostas] = useState(false);
  const [isCreatingResposta, setIsCreatingResposta] = useState(false);

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentBox, setCurrentBox] = useState(null);
  const [editingPinId, setEditingPinId] = useState(null); 
  const [tempoRestanteStr, setTempoRestanteStr] = useState('');
  const [loadingIA, setLoadingIA] = useState(false);

  // --- MODAIS ---
  const { isOpen, onOpen, onClose } = useDisclosure(); 
  const modalRespostas = useDisclosure(); 
  const modalCriarResposta = useDisclosure(); 
  const modalConfirmacao = useDisclosure();
  const modalLeitor = useDisclosure(); 
  const modalProblema = useDisclosure();
  
  // --- ESTADOS DE UPLOAD DO RECIBO E PROBLEMAS ---
  const fileInputInlineRef = useRef(null);
  const [arquivoInline, setArquivoInline] = useState(null);
  const [enviandoRecibo, setEnviandoRecibo] = useState(false);

  const [modalReciboOpen, setModalReciboOpen] = useState(false);
  const [reciboVisualizar, setReciboVisualizar] = useState(null);

  const [materialSelecionado, setMaterialSelecionado] = useState(null); 
  const [confirmacaoConfig, setConfirmacaoConfig] = useState({ titulo: '', mensagem: '', acao: null, botaoCor: 'blue', textoBotao: 'Confirmar' });
  const [motivoProblema, setMotivoProblema] = useState('');
  const [obsProblema, setObsProblema] = useState('');
  const [enviandoProblema, setEnviandoProblema] = useState(false);

  // --- ESTADOS DO PIN ATUAL E RESPOSTAS RÁPIDAS ---
  const [pinCompetencia, setPinCompetencia] = useState(1);
  const [pinTipoErro, setPinTipoErro] = useState('');
  const [pinTexto, setPinTexto] = useState('');
  
  const [editandoRespostaId, setEditandoRespostaId] = useState(null);
  const [quickReplyContext, setQuickReplyContext] = useState('GERAL');
  const [quickReplyComp, setQuickReplyComp] = useState(1);
  const [novoTituloResp, setNovoTituloResp] = useState("");
  const [novoTextoResp, setNovoTextoResp] = useState("");
  const [novoModeloResp, setNovoModeloResp] = useState("ENEM");
  const [novaCompResp, setNovaCompResp] = useState(1);
  const [novoContextoResp, setNovoContextoResp] = useState("GERAL");
  const [novoTipoErroResp, setNovoTipoErroResp] = useState("");

  const imageContainerRef = useRef(null);

  // --- VARIÁVEIS COMPUTADAS ---
  const isSimplesMode = redacaoAtual?.tema_tipo?.toUpperCase() === 'SIMPLES' || redacaoAtual?.tipo?.toUpperCase() === 'SIMPLES';
  const compsAtuais = isSimplesMode ? COMPETENCIAS_SIMPLES : COMPETENCIAS_ENEM;
  const notasPossiveisAtuais = isSimplesMode ? NOTAS_SIMPLES : NOTAS_ENEM;

  // ==============================================================================
  // EFEITOS DE INICIALIZAÇÃO E CONTROLE
  // ==============================================================================

  useEffect(() => { 
    const params = new URLSearchParams(location.search); 
    const urlAba = params.get('aba'); 
    if (urlAba) setAba(urlAba); else setAba('fila'); 
  }, [location.search]);

  useEffect(() => { verificarPermissao(); }, []);

  useEffect(() => { setPaginaAtualFila(1); }, [filtroTexto, filtroTipo, somenteUrgentes]);
  useEffect(() => { setPaginaAtualHist(1); }, [filtroHistTexto, filtroHistData, filtroHistTipo]);
  useEffect(() => { setPaginaAtualRecibos(1); }, [filtroDataRecibos, dtInicioRecibos, dtFimRecibos]);
  useEffect(() => { setPaginaAtualExtrato(1); }, [filtroDataExtrato, dtInicioExtrato, dtFimExtrato, filtroStatusExtrato]);

  useEffect(() => {
    let interval;
    if (aba === 'fila' && !redacaoAtual) { 
      interval = setInterval(() => { carregarFila(true); }, 10000); 
    } else if (aba === 'carteira') { 
      interval = setInterval(() => { carregarCarteira(); }, 10000); 
    }
    return () => clearInterval(interval);
  }, [aba, redacaoAtual]);

  useEffect(() => {
    if (!redacaoAtual) return;
    const endTime = localStorage.getItem('correcao_endtime');
    if (!endTime) return;

    const updateTimer = () => {
        const now = Date.now(); const diff = parseInt(endTime) - now;
        if (diff <= 0) {
            setTempoRestanteStr('00:00'); 
            toast({ title: 'Tempo Esgotado!', description: 'A redação expirou.', status: 'error', duration: 7000, isClosable: true });
            localStorage.removeItem('redacao_em_andamento'); 
            localStorage.removeItem('correcao_endtime'); 
            setRedacaoAtual(null); 
            carregarFila(); 
            return true; 
        } else {
            const m = Math.floor(diff / 60000).toString().padStart(2, '0'); 
            const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
            setTempoRestanteStr(`${m}:${s}`); 
            return false;
        }
    };

    if (updateTimer()) return;
    const interval = setInterval(() => { 
      if (updateTimer()) clearInterval(interval); 
    }, 1000);
    return () => clearInterval(interval);
  }, [redacaoAtual]);

  // ==============================================================================
  // FUNÇÕES DE COMUNICAÇÃO COM A API (BACKEND)
  // ==============================================================================

  const verificarPermissao = async () => {
    const token = localStorage.getItem('token'); 
    if (!token) { navigate('/'); return; }
    try { 
      const r = await axios.get('http://127.0.0.1:8000/api/me/', { headers: { Authorization: `Bearer ${token}` } });
      if (!r.data.is_corretor && !r.data.is_staff) { 
        toast({ title: 'Acesso Negado', status: 'error' }); navigate('/painel-aluno'); 
      } else { 
        setUsuario(r.data); 
        carregarFila(); carregarHistorico(); carregarRespostasRapidas(); carregarCarteira(); carregarMateriais(); carregarConfiguracoes(); 
      }
    } catch (e) { navigate('/'); }
  };

  const carregarFila = async (silencioso = false) => { 
    try { 
      const r = await axios.get('http://127.0.0.1:8000/api/fila/', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
      setFila(r.data); 
    } catch (e) {} 
  };
  
  const carregarHistorico = async () => { 
    try { 
      const r = await axios.get('http://127.0.0.1:8000/api/corretor/historico/', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
      setHistorico(r.data); 
    } catch (e) {} 
  };
  
  const carregarCarteira = async () => { 
    try { 
      const r = await axios.get('http://127.0.0.1:8000/api/corretor/carteira/', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
      // AUTO-CURA FINANCEIRA
      const carteiraOrganizada = processarCarteira(r.data);
      setCarteira(carteiraOrganizada); 
    } catch (e) {} 
  };
  
  const carregarRespostasRapidas = async () => { 
    setIsLoadingRespostas(true); 
    try { 
      const r = await axios.get('http://127.0.0.1:8000/api/respostas-rapidas/', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
      setTodasRespostas(r.data); 
    } catch (e) {} 
    setIsLoadingRespostas(false); 
  };
  
  const carregarMateriais = async () => { 
    try { 
      const r = await axios.get('http://127.0.0.1:8000/api/materiais/', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
      setMateriais(r.data.filter(m => m.categoria.startsWith('CORRETOR_'))); 
    } catch (e) {} 
  };

  const carregarConfiguracoes = async () => {
    try {
        const res = await axios.get('http://127.0.0.1:8000/api/gestao/configuracoes/', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        setConfigPlataforma(res.data);
    } catch (e) {}
  };

  // ==============================================================================
  // AÇÕES FINANCEIRAS (SOLICITAÇÃO DE SAQUE E RECIBOS)
  // ==============================================================================

  const solicitarSaque = async () => {
    try { 
      const token = localStorage.getItem('token'); 
      await axios.post('http://127.0.0.1:8000/api/corretor/solicitar-saque/', {}, { headers: { Authorization: `Bearer ${token}` } }); 
      toast({ title: 'Saque solicitado!', status: 'success' }); carregarCarteira(); 
    } catch (e) { toast({ title: 'Erro', description: e.response?.data?.erro || "Erro ao solicitar", status: 'error' }); }
  };

  const enviarReciboInline = async () => {
    if (!arquivoInline) return toast({ title: 'Atenção', description: 'Selecione o arquivo PDF ou foto.', status: 'warning' });
    setEnviandoRecibo(true);
    try {
        const token = localStorage.getItem('token'); 
        const formData = new FormData(); formData.append('arquivo_recibo', arquivoInline);
        await axios.post(`http://127.0.0.1:8000/api/corretor/pagamento/${carteira.solicitacao_ativa.id}/enviar-recibo/`, formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
        toast({ title: 'Enviado com sucesso!', description: 'A equipa financeira vai analisar.', status: 'success' }); setArquivoInline(null); carregarCarteira();
    } catch (e) { toast({ title: 'Erro no envio', status: 'error' }); }
    setEnviandoRecibo(false);
  };

  const imprimirDocumentoOculto = (html) => {
    setIsPreparingPrint(true); 
    const iframe = document.createElement('iframe'); 
    iframe.style.position = 'fixed'; iframe.style.right = '0'; iframe.style.bottom = '0'; iframe.style.width = '0px'; iframe.style.height = '0px'; iframe.style.border = 'none'; 
    document.body.appendChild(iframe);
    iframe.contentWindow.document.open(); iframe.contentWindow.document.write(html); iframe.contentWindow.document.close();
    setTimeout(() => { setIsPreparingPrint(false); iframe.contentWindow.focus(); iframe.contentWindow.print(); setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 1000); }, 1000); 
  };

  const handlePrintRecibo = (recibo) => {
    const baseUrl = window.location.origin; 
    const dataAtual = new Date(recibo.data || recibo.data_solicitacao || new Date()).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }); 
    const valorExtenso = valorPorExtenso(recibo.valor); 
    const valorFormatado = parseFloat(recibo.valor).toFixed(2).replace('.', ','); 
    const totalRedacoes = (recibo.qtd_normal || 0) + (recibo.qtd_vip || 0);

    const razaoSocial = configPlataforma?.razao_social_plataforma || 'Guia do Texto Plataforma Educacional';
    const cnpjEmpresa = configPlataforma?.cnpj_plataforma || '00.000.000/0001-00';
    let dadosBancariosHtml = '';
    if (usuario.chave_pix) dadosBancariosHtml += `<li><strong>Chave Pix:</strong> ${usuario.chave_pix} ${usuario.tipo_chave_pix ? `(${usuario.tipo_chave_pix})` : ''}</li>`;
    if (usuario.banco || usuario.agencia_conta) { 
      const agencia = usuario.agencia_conta?.split('Cc:')[0]?.replace('Ag:', '').trim() || ''; const conta = usuario.agencia_conta?.split('Cc:')[1]?.trim() || ''; 
      if (usuario.banco) dadosBancariosHtml += `<li><strong>Banco:</strong> ${usuario.banco}</li>`; 
      if (agencia) dadosBancariosHtml += `<li><strong>Agência:</strong> ${agencia}</li>`; 
      if (conta) dadosBancariosHtml += `<li><strong>Conta Corrente nº:</strong> ${conta}</li>`; 
    }
    if (!dadosBancariosHtml) dadosBancariosHtml = `<li><em>Nenhum dado para recebimento foi fornecido no cadastro do prestador.</em></li>`;
    
    const html = `<!DOCTYPE html><html><head><title>Recibo de Pagamento</title><style>@page { size: A4 portrait; margin: 12mm 15mm; } body { margin: 0; padding: 0; font-family: 'Times New Roman', serif; color: black; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid black; padding-bottom: 12px; margin-bottom: 30px; } .logo-container img { max-height: 35px; object-fit: contain; } .title-container { text-align: right; } .title { font-size: 22px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; } .subtitle { font-size: 14px; color: #555; } .content p { font-size: 15px; line-height: 1.8; text-align: justify; margin-bottom: 20px; } .details { padding-left: 10px; margin-bottom: 20px; font-size: 15px; line-height: 1.8; background-color: #fcfcfc; border: 1px solid #eee; padding: 15px; border-radius: 5px; } .signature-section { margin-top: 50px; text-align: center; width: 60%; margin-left: auto; margin-right: auto; } .signature-line { border-top: 1px solid black; margin-bottom: 8px; } .nota { margin-top: 40px; border: 1px dashed gray; padding: 15px; background-color: #f9f9f9; } .nota h4 { margin-top: 0; font-size: 13px; margin-bottom: 8px; } .nota p { font-size: 13px; margin-bottom: 10px; line-height: 1.5; text-align: justify; } .nota ul { list-style-type: none; padding-left: 10px; margin: 0; } .nota li { font-size: 13px; margin-bottom: 5px; } .nota li::before { content: "•"; margin-right: 8px; font-weight: bold; }</style></head><body><div class="header"><div class="logo-container"><img src="${baseUrl}/logo-print.png" alt="Logo" onerror="this.style.display='none';" /></div><div class="title-container"><div class="title">Recibo de Pagamento</div><div class="subtitle">${razaoSocial}</div></div></div><div class="content"><p>Declaro, para os devidos fins, que RECEBI da empresa <strong>${razaoSocial}</strong>, inscrita no CNPJ sob o nº <strong>${cnpjEmpresa}</strong>, a quantia de <strong>R$ ${valorFormatado} (${valorExtenso})</strong>, referente aos serviços de correção de redações na plataforma.</p><p style="font-weight: bold; margin-bottom: 10px;">Detalhe dos Serviços Prestados:</p><div class="details"><div style="margin-bottom: 8px;"><strong>Serviço realizado:</strong> Correção e análise pedagógica de <strong>${totalRedacoes}</strong> redação(ões) submetida(s) na plataforma.</div><div style="margin-bottom: 4px;"><strong>Sendo:</strong></div><div style="padding-left: 15px;">- <strong>${recibo.qtd_normal}</strong> Correções Normais</div><div style="padding-left: 15px;">- <strong>${recibo.qtd_vip}</strong> Correções VIPs (Urgência)</div></div><p>Declaro, ainda, que os serviços prestados foram realizados de forma eventual e autônoma, sem habitualidade, pessoalidade ou subordinação, não caracterizando, portanto, vínculo empregatício de qualquer natureza.</p><p>Com este pagamento, dou plena, geral e irrevogável quitação, nada mais tendo a exigir, a qualquer título, com relação ao serviço mencionado. E, por ser verdade, firmo o presente.</p><div style="text-align: right; margin-top: 30px; margin-bottom: 40px; font-size: 15px;">Rio de Janeiro/RJ, ${dataAtual}.</div><div class="signature-section"><div class="signature-line"></div><div style="font-weight: bold; font-size: 15px;">${usuario.first_name} ${usuario.last_name}</div><div style="font-size: 13px; color: #333;">CPF: ${usuario.cpf || 'Não informado'}</div></div></div><div class="nota"><h4>NOTA DE RESPONSABILIDADE:</h4><p>Este recibo somente terá validade mediante a apresentação do comprovante de transferência bancária efetuada pela Guia do Texto. O repasse financeiro foi realizado estritamente para os dados bancários e/ou chave PIX validados pelo próprio prestador em seu cadastro na plataforma, isentando a contratante de responsabilidade por dados incorretos, conforme listado abaixo:</p><ul>${dadosBancariosHtml}</ul></div></body></html>`;
    imprimirDocumentoOculto(html);
  };

  // ==============================================================================
  // AÇÕES DE CORREÇÃO
  // ==============================================================================

  const pegarRedacao = async (id) => { 
    const token = localStorage.getItem('token'); 
    const idSalvo = localStorage.getItem('redacao_em_andamento'); 
    
    if (idSalvo && idSalvo !== id.toString()) { 
        try { 
            const checkRes = await axios.get(`http://127.0.0.1:8000/api/redacao/${idSalvo}/`, { headers: { Authorization: `Bearer ${token}` } }); 
            if ((checkRes.data.status === 'EM_CORRECAO' || checkRes.data.status === 'REFAZER') && checkRes.data.corretor_atual === usuario.id) { 
                abrirConfirmacao("Redação em Aberto", `Você já possui a redação #${idSalvo} aberta. Deseja retomar?`, () => carregarDadosRedacao(idSalvo, token), "teal", "Retomar"); 
                return; 
            } else { localStorage.removeItem('redacao_em_andamento'); localStorage.removeItem('correcao_endtime'); } 
        } catch (e) { localStorage.removeItem('redacao_em_andamento'); localStorage.removeItem('correcao_endtime'); } 
    } 
    
    try { 
        const r = await axios.post(`http://127.0.0.1:8000/api/corrigir/${id}/iniciar/`, {}, { headers: { Authorization: `Bearer ${token}` } }); 
        const minutos = r.data.minutos_limite || 40; 
        localStorage.setItem('correcao_endtime', Date.now() + (minutos * 60 * 1000)); 
        localStorage.setItem('redacao_em_andamento', id); 
        carregarDadosRedacao(id, token); 
    } catch (error) { toast({ title: 'Atenção', description: error.response?.data?.erro || "Erro ao iniciar", status: 'warning' }); carregarFila(); } 
  };

  const carregarDadosRedacao = async (id, token) => { 
    try { 
        const response = await axios.get(`http://127.0.0.1:8000/api/redacao/${id}/`, { headers: { Authorization: `Bearer ${token}` } }); 
        const redData = response.data; 
        
        if (redData.status !== 'EM_CORRECAO' && redData.status !== 'REFAZER') { 
            toast({ title: "Indisponível", description: "Esta redação não está mais com você.", status: "warning" }); 
            localStorage.removeItem('redacao_em_andamento'); localStorage.removeItem('correcao_endtime'); 
            setRedacaoAtual(null); carregarFila(); return; 
        } 
        
        setRedacaoAtual(redData); 
        if (redData.texto && redData.texto.trim() !== '') { setConteudoTexto(redData.texto); } else if (redData.arquivo && redData.arquivo.endsWith('.txt')) { const textResponse = await axios.get(redData.arquivo); setConteudoTexto(textResponse.data); } else { setConteudoTexto(null); } 
        
        const isSimples = redData.tema_tipo?.toUpperCase() === 'SIMPLES' || redData.tipo?.toUpperCase() === 'SIMPLES'; 
        let newNotas = isSimples ? { 1: 0, 2: 0, 3: 0, 4: 0 } : { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let newComents = isSimples ? { 1: '', 2: '', 3: '', 4: '' } : { 1: '', 2: '', 3: '', 4: '', 5: '' };
        let newPins = [];
        let alertaCoord = "";

        if (redData.correcao && redData.correcao.competencias) {
            redData.correcao.competencias.forEach(c => { newNotas[c.comp] = c.nota; newComents[c.comp] = c.comentario || ''; });
            newPins = (redData.correcao.anotacoes || []).map(a => ({ id: a.id || Date.now() + Math.random(), x: a.x, y: a.y, width: a.width, height: a.height, competencia: a.competencia, tipo_erro: a.tipo_erro, texto: a.texto }));
            const regexAlerta = /\[ALERTA_COORDENACAO\]([\s\S]*?)\[\/ALERTA_COORDENACAO\]/;
            const match = redData.correcao.comentario_geral?.match(regexAlerta);
            if (match) alertaCoord = match[1].trim();
        }

        setNotas(newNotas); setComentarios(newComents); setPins(newPins); setMensagemRefacao(alertaCoord); localStorage.setItem('redacao_em_andamento', id); 
    } catch (e) { toast({ title: 'Erro ao baixar redação', status: 'error' }); } 
  };

  const finalizarCorrecaoReal = async () => { 
    const payload = { 
      redacao_id: redacaoAtual.id, nota_final: Object.values(notas).reduce((a,b)=>a+b,0), notas: notas, comentarios: comentarios, 
      anotacoes: pins.map(p => ({ competencia: p.competencia, x: p.x, y: p.y, width: p.width, height: p.height, tipo_erro: p.tipo_erro || 'Geral', texto: p.texto || "" })) 
    }; 
    try { 
        await axios.post('http://127.0.0.1:8000/api/corrigir/', payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
        toast({ title: 'Sucesso! 🚀', description: 'Correção finalizada.', status: 'success' }); 
        localStorage.removeItem('redacao_em_andamento'); localStorage.removeItem('correcao_endtime'); 
        setRedacaoAtual(null); carregarFila(); carregarHistorico(); carregarCarteira(); 
    } catch (e) { toast({ title: 'Erro', description: e.response?.data?.erro || "Erro no servidor", status: 'error' }); } 
  };

  const liberarRedacaoReal = async () => { 
    try { 
      await axios.post(`http://127.0.0.1:8000/api/corrigir/${redacaoAtual.id}/liberar/`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
      toast({ title: 'Redação devolvida.', status: 'info' }); 
      localStorage.removeItem('redacao_em_andamento'); localStorage.removeItem('correcao_endtime'); setRedacaoAtual(null); carregarFila(); 
    } catch (error) {} 
  };

  const sairDaCorrecao = () => { localStorage.removeItem('redacao_em_andamento'); localStorage.removeItem('correcao_endtime'); setRedacaoAtual(null); carregarFila(); };
  
  const reportarProblemaReal = async () => { 
    if (!motivoProblema) return toast({ title: 'Selecione um motivo!', status: 'warning' }); 
    setEnviandoProblema(true); 
    try { 
      await axios.post(`http://127.0.0.1:8000/api/corrigir/${redacaoAtual.id}/problema/`, { motivo: motivoProblema, observacao: obsProblema }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
      toast({ title: 'Sinalizada com sucesso', description: 'Enviada para a auditoria.', status: 'info' }); 
      localStorage.removeItem('redacao_em_andamento'); localStorage.removeItem('correcao_endtime'); setRedacaoAtual(null); modalProblema.onClose(); carregarFila(); 
    } catch (e) { } 
    setEnviandoProblema(false); 
  };

  const gerarCorrecaoIA = async () => { 
    setLoadingIA(true); 
    try { 
      const res = await axios.post(`http://127.0.0.1:8000/api/corrigir/${redacaoAtual.id}/ia/`, { texto: conteudoTexto || '', tema: redacaoAtual.tema_titulo, tipo: redacaoAtual.tema_tipo || redacaoAtual.tipo || 'ENEM' }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
      setNotas(res.data.notas); setComentarios(res.data.comentarios); toast({ title: 'Mágica feita! ✨', status: 'success' }); 
    } catch(e) { toast({ title: 'Erro na IA', description: e.response?.data?.erro || "Erro", status: 'error' }); } 
    setLoadingIA(false); 
  };

  // ==============================================================================
  // AÇÕES DIVERSAS (LEITOR, HISTÓRICO, PINS, RESPOSTAS RÁPIDAS)
  // ==============================================================================

  const abrirFeedbackHistorico = async (id) => { 
    try { 
      const response = await axios.get(`http://127.0.0.1:8000/api/redacao/${id}/`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
      let dados = response.data; 
      if (dados.texto && dados.texto.trim() !== '') { dados.conteudoTexto = dados.texto; } else if (dados.arquivo && dados.arquivo.endsWith('.txt')) { const textRes = await axios.get(dados.arquivo); dados.conteudoTexto = textRes.data; } 
      setRedacaoVisualizar(dados); 
    } catch (e) {} 
  };

  const abrirNovaResposta = () => {
    setEditandoRespostaId(null); setNovoTituloResp(""); setNovoTextoResp(""); setNovoModeloResp("ENEM"); setNovaCompResp(1); setNovoContextoResp("GERAL"); setNovoTipoErroResp(""); modalCriarResposta.onOpen();
  };

  const abrirEdicaoResposta = (r) => {
    setEditandoRespostaId(r.id); setNovoTituloResp(r.titulo); setNovoTextoResp(r.texto); setNovoModeloResp(r.modelo); setNovaCompResp(r.competencia); setNovoContextoResp(r.contexto); setNovoTipoErroResp(r.tipo_erro || ""); modalCriarResposta.onOpen();
  };

  const criarRespostaRapida = async (origin = 'MODAL_CRIACAO') => { 
    const t = novoTituloResp; const x = novoTextoResp; 
    const c = origin === 'MODAL_DURANTE_CORRECAO' ? quickReplyContext : novoContextoResp; 
    const comp = origin === 'MODAL_DURANTE_CORRECAO' ? quickReplyComp : novaCompResp; 
    const m = origin === 'MODAL_DURANTE_CORRECAO' ? (isSimplesMode ? 'SIMPLES' : 'ENEM') : novoModeloResp; 
    const te = (m === 'ENEM' && comp === 1 && c === 'PIN') ? (origin === 'MODAL_DURANTE_CORRECAO' ? pinTipoErro : novoTipoErroResp) : "";
    
    if (!t.trim() || !x.trim()) return toast({ title: 'Preencha tudo', status: 'warning' }); 
    if (m === 'ENEM' && comp === 1 && c === 'PIN' && !te) return toast({ title: 'Selecione o tipo de erro gramatical', status: 'warning' });
    
    setIsCreatingResposta(true); 
    try { 
      const payload = { modelo: m, competencia: comp, contexto: c, titulo: t, texto: x, tipo_erro: te }; 
      if (editandoRespostaId) {
          const r = await axios.put(`http://127.0.0.1:8000/api/respostas-rapidas/${editandoRespostaId}/`, payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
          setTodasRespostas(todasRespostas.map(resp => resp.id === editandoRespostaId ? r.data : resp)); toast({ title: 'Editado com sucesso!', status: 'success' }); 
      } else {
          const r = await axios.post('http://127.0.0.1:8000/api/respostas-rapidas/', payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
          setTodasRespostas([...todasRespostas, r.data]); toast({ title: 'Salvo com sucesso!', status: 'success' }); 
      }
      setNovoTituloResp(''); setNovoTextoResp(''); setNovoTipoErroResp(''); setEditandoRespostaId(null);
      if (origin === 'MODAL_CRIACAO') modalCriarResposta.onClose(); 
    } catch (e) {} finally { setIsCreatingResposta(false); } 
  };

  const excluirRespostaRapida = async (id, e) => { 
    if(e) e.stopPropagation(); 
    try { await axios.delete(`http://127.0.0.1:8000/api/respostas-rapidas/${id}/`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); setTodasRespostas(todasRespostas.filter(r => r.id !== id)); } catch (e) { } 
  };
  
  const abrirMaterial = (m) => { 
    const temTexto = m.conteudo && m.conteudo.length > 5; const temExtra = m.dados_extras && Object.keys(m.dados_extras).length > 0; 
    if (temTexto || temExtra) { setMaterialSelecionado(m); modalLeitor.onOpen(); } else if (m.arquivo) { window.open(m.arquivo, '_blank'); } else { toast({ title: "Este material não possui conteúdo legível.", status: "info" }); } 
  };

  const getSLA = (dataEnvio) => { 
    const diff = Math.abs(new Date() - new Date(dataEnvio)) / 36e5; 
    if (diff < 24) return { cor: 'green', texto: 'Novo', badge: 'green' }; 
    if (diff < 72) return { cor: 'orange', texto: 'Atenção', badge: 'orange' }; 
    return { cor: 'red', texto: 'Atrasado', badge: 'red' }; 
  };

  const abrirConfirmacao = (t, m, a, c = 'blue', tb = 'Sim') => { setConfirmacaoConfig({ titulo: t, mensagem: m, acao: a, botaoCor: c, textoBotao: tb }); modalConfirmacao.onOpen(); };

  const getCoords = (e) => { 
    if (!imageContainerRef.current) return { x: 0, y: 0 }; 
    const r = imageContainerRef.current.getBoundingClientRect(); 
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }; 
  };

  const handleMouseDown = (e) => { 
    if (e.target.closest('.chakra-popover__popper') || e.target.closest('.pin-trigger')) return; 
    e.preventDefault(); const c = getCoords(e); setStartPoint(c); setIsDrawing(true); setCurrentBox({ x: c.x, y: c.y, width: 0, height: 0 }); 
  };

  const handleMouseMove = (e) => { 
    if (!isDrawing || !startPoint) return; const c = getCoords(e); setCurrentBox({ x: Math.min(startPoint.x, c.x), y: Math.min(startPoint.y, c.y), width: Math.abs(c.x - startPoint.x), height: Math.abs(c.y - startPoint.y) }); 
  };

  const handleMouseUp = () => { 
    if (!isDrawing) return; setIsDrawing(false); 
    if (currentBox.width < 1 || currentBox.height < 1) { setCurrentBox({ ...currentBox, width: 4, height: 2 }); }
    setEditingPinId(null); setPinCompetencia(1); setPinTipoErro(''); setPinTexto(''); onOpen(); 
  };

  const handleEditPin = (pin) => { setEditingPinId(pin.id); setPinCompetencia(pin.competencia); setPinTipoErro(pin.tipo_erro || ''); setPinTexto(pin.texto || ''); setCurrentBox(null); onOpen(); };
  
  const salvarPin = () => { 
    if (pinCompetencia === 1 && !pinTipoErro) return toast({ title: 'Selecione o erro', status: 'warning' }); 
    const novoPin = editingPinId ? { ...pins.find(p => p.id === editingPinId), competencia: parseInt(pinCompetencia), tipo_erro: pinTipoErro, texto: pinTexto } : { id: Date.now(), ...currentBox, competencia: parseInt(pinCompetencia), tipo_erro: pinTipoErro, texto: pinTexto }; 
    setPins(editingPinId ? pins.map(p => p.id === editingPinId ? novoPin : p) : [...pins, novoPin]); setEditingPinId(null); setCurrentBox(null); onClose(); 
  };
  
  const removerPin = (id) => { setPins(pins.filter(p => p.id !== id)); setHoveredPinId(null); };

  const renderFiltroData = (filtro, setFiltro, dtInicio, setDtInicio, dtFim, setDtFim) => (
      <Flex gap={3} wrap="wrap" align="center">
          <Icon as={TimeIcon} color="gray.500" />
          <Select w="200px" size="sm" bg="white" value={filtro} onChange={e => setFiltro(e.target.value)}>
            <option value="TUDO">Todo o Histórico</option><option value="MES_ATUAL">Mês Atual</option><option value="MES_ANTERIOR">Mês Anterior</option><option value="PERIODO">Período Específico</option>
          </Select>
          {filtro === 'PERIODO' && (<HStack><Input type="date" bg="white" size="sm" value={dtInicio} onChange={e => setDtInicio(e.target.value)} /><Text fontSize="sm" color="gray.500">até</Text><Input type="date" bg="white" size="sm" value={dtFim} onChange={e => setDtFim(e.target.value)} /></HStack>)}
      </Flex>
  );

  const aplicarFiltroData = (itemData, filtro, inicio, fim) => {
    if (!itemData) return false; const dataItem = new Date(itemData); const hoje = new Date();
    if (filtro === 'MES_ATUAL') { return dataItem.getMonth() === hoje.getMonth() && dataItem.getFullYear() === hoje.getFullYear(); }
    if (filtro === 'MES_ANTERIOR') { const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1); return dataItem.getMonth() === mesAnterior.getMonth() && dataItem.getFullYear() === mesAnterior.getFullYear(); }
    if (filtro === 'PERIODO') { if (!inicio && !fim) return true; const dInicio = inicio ? new Date(inicio) : new Date('2000-01-01'); const dFim = fim ? new Date(fim) : new Date('2100-01-01'); dFim.setHours(23, 59, 59, 999); return dataItem >= dInicio && dataItem <= dFim; }
    return true; 
  };


  const renderConteudo = () => {
      
      // ------------------------------------------------------------------
      // MODO 1: CORRIGINDO UMA REDAÇÃO AGORA
      // ------------------------------------------------------------------
      if (redacaoAtual) {
          const isAcabando = tempoRestanteStr && parseInt(tempoRestanteStr.split(':')[0]) < 5;
          return (
            <Flex h="100vh" overflow="hidden" w="full">
                {/* LADO ESQUERDO */}
                <Box flex="1" bg="gray.100" overflow="auto" p={4} display="flex" flexDirection="column" alignItems="center" minH="100%">
                    <Flex justify="space-between" align="center" mb={4} w="full" maxW="1000px">
                        {redacaoAtual.status === 'REFAZER' ? (
                            <Button leftIcon={<ArrowBackIcon />} onClick={sairDaCorrecao} colorScheme="teal" variant="ghost" size="sm">Voltar para a Fila (Pausar Correção)</Button>
                        ) : ( <Box /> )}
                    </Flex>
                    {mensagemRefacao && (
                        <Alert status="error" variant="left-accent" mb={4} borderRadius="md" w="full" maxW="1000px" shadow="sm" flexShrink={0} minH="min-content" alignItems="flex-start"><AlertIcon mt={1} /><Box w="full"><Text fontWeight="bold" color="red.800">Atenção: A coordenação solicitou um ajuste de qualidade nesta correção!</Text><Text fontSize="sm" color="red.700" mt={1} whiteSpace="pre-wrap">"{mensagemRefacao}"</Text></Box></Alert>
                    )}
                    <Box w="full" maxW="1000px" bg="white" p={4} mb={4} borderRadius="xl" boxShadow="sm" borderLeft="4px solid" borderColor={isSimplesMode ? "blue.500" : "green.500"} flexShrink={0}>
                        <Flex justify="space-between" align="flex-start" wrap="wrap" gap={3}>
                            <VStack align="start" spacing={2}><HStack spacing={2} align="center"><UserIcon color="teal.500" boxSize={5} /><Text fontSize="lg" fontWeight="900" color="gray.700" textTransform="uppercase">{redacaoAtual.aluno_nome}</Text></HStack><Box><Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" mb={0.5}>Tema da Redação</Text><Text fontSize="18px" fontWeight="bold" color="gray.800" lineHeight="short">{redacaoAtual.tema_titulo}</Text></Box></VStack>
                            <HStack spacing={4}>
                                {tempoRestanteStr && (<Badge colorScheme={isAcabando ? "red" : "orange"} px={3} py={1.5} borderRadius="md" fontSize="md" display="flex" alignItems="center" gap={2} animation={isAcabando ? "pulse 1.5s infinite" : "none"}><TimeIcon /> {tempoRestanteStr}</Badge>)}
                                <Badge bg={isSimplesMode ? 'blue.50' : 'green.50'} color={isSimplesMode ? 'blue.700' : 'green.700'} px={4} py={1.5} borderRadius="md" fontSize="md" fontWeight="bold" letterSpacing="wider">{redacaoAtual.tema_tipo || redacaoAtual.tipo || 'ENEM'}</Badge>
                            </HStack>
                        </Flex>
                        <style>{`@keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } 100% { opacity: 1; transform: scale(1); } }`}</style>
                    </Box>
                    <Box position="relative" display="inline-block" height="fit-content" ref={imageContainerRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} cursor="crosshair" boxShadow="2xl" userSelect="none" border="1px solid #ddd" bg="white" w={conteudoTexto ? "700px" : "full"} maxW={conteudoTexto ? "700px" : "900px"} flexShrink={conteudoTexto ? 0 : 1}>
                        {conteudoTexto ? ( <Box p="8px 30px" whiteSpace="pre-wrap" fontFamily="Arial, sans-serif" fontSize="16px" lineHeight="40px" color="gray.800" minHeight="1216px" bgImage="linear-gradient(transparent 39px, #ccc 40px)" bgSize="100% 40px">{conteudoTexto}</Box> ) : ( <Image src={redacaoAtual.arquivo} alt="Redação" display="block" w="100%" h="auto" pointerEvents="none" /> )}
                        {currentBox && (<Box position="absolute" left={`${currentBox.x}%`} top={`${currentBox.y}%`} w={`${currentBox.width}%`} h={`${currentBox.height}%`} border="2px dashed teal" bg="rgba(0, 128, 128, 0.2)" zIndex={5} />)}
                        {pins.map((pin) => {
                            const config = (isSimplesMode ? COMPETENCIAS_SIMPLES : COMPETENCIAS_ENEM).find(c => c.id === pin.competencia); const isHovered = hoveredPinId === pin.id;
                            return (
                                <Box key={pin.id}>
                                    <Box position="absolute" left={`${pin.x}%`} top={`${pin.y}%`} w={`${pin.width}%`} h={`${pin.height}%`} bg={config.cor} opacity={isHovered ? 0.4 : 0} transition="opacity 0.2s" pointerEvents="none" zIndex={4} />
                                    <Popover placement="top" isLazy>
                                        <PopoverTrigger><Box className="pin-trigger" position="absolute" left={`calc(${pin.x}% + ${pin.width}% - 6px)`} top={`calc(${pin.y}% - 28px)`} cursor="pointer" zIndex={10} display="flex" alignItems="center" justifyContent="center" onMouseEnter={() => setHoveredPinId(pin.id)} onMouseLeave={() => setHoveredPinId(null)}><CustomPinSVG cor={config.cor} numero={pin.competencia} /></Box></PopoverTrigger>
                                        <Portal>
                                            <PopoverContent zIndex={9999} width="280px" boxShadow="xl" onMouseEnter={() => setHoveredPinId(pin.id)} onMouseLeave={() => setHoveredPinId(null)}>
                                                <PopoverArrow /> <PopoverCloseButton /> <PopoverHeader fontWeight="bold" fontSize="sm">{pin.tipo_erro || config.nome}</PopoverHeader>
                                                <PopoverBody><Text fontSize="sm" mb={3} noOfLines={3}>{pin.texto || "Sem observações."}</Text><HStack spacing={2}><Button size="xs" colorScheme="blue" variant="outline" leftIcon={<EditIcon />} width="50%" onClick={() => handleEditPin(pin)}>Editar</Button><Button size="xs" colorScheme="red" variant="outline" leftIcon={<DeleteIcon />} width="50%" onClick={() => removerPin(pin.id)}>Excluir</Button></HStack></PopoverBody>
                                            </PopoverContent>
                                        </Portal>
                                    </Popover>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
                {/* LADO DIREITO */}
                <Box w={sidebarOpen ? "360px" : "0px"} transition="width 0.3s" bg="gray.50" borderLeft="1px solid #ccc" display="flex" flexDirection="column" position="relative">
                    <Box as="button" onClick={() => setSidebarOpen(!sidebarOpen)} position="absolute" left="-40px" top="80px" bg="teal.600" w="40px" h="50px" borderLeftRadius="xl" boxShadow="-4px 0 10px rgba(0,0,0,0.1)" display="flex" alignItems="center" justifyContent="center" zIndex="20" _hover={{ bg: 'teal.700', transform: 'scale(1.05)' }} transition="all 0.2s"><Icon as={sidebarOpen ? ViewOffIcon : ViewIcon} color="white" w={5} h={5} /></Box>
                    <Box display={sidebarOpen ? "flex" : "none"} flexDirection="column" h="100%">
                        <Box p={4} mx={3} mt={6} bg="white" borderRadius="lg" boxShadow="sm" border="1px solid" borderColor="gray.100">
                            <Flex justify="space-between" align="center" mb={4}><Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase">Nota Parcial</Text><Badge fontSize="2xl" colorScheme={Object.values(notas).reduce((a,b)=>a+b,0) >= (isSimplesMode ? 90 : 900) ? "green" : "teal"} variant="solid" borderRadius="md" px={3}>{Object.values(notas).reduce((a,b)=>a+b,0)}</Badge></Flex>
                            <HStack spacing={2} mb={3} w="full">
                                <Tooltip label="Sinalizar Problema" hasArrow placement="top"><IconButton icon={<WarningTwoIcon />} colorScheme="orange" variant="outline" onClick={modalProblema.onOpen} size="sm" aria-label="Reportar" /></Tooltip>
                                <Tooltip label="✨ Auto-Preencher com IA" hasArrow placement="top"><IconButton icon={<Text fontSize="md">✨</Text>} bgGradient="linear(to-r, purple.500, blue.500)" color="white" _hover={{ bgGradient: "linear(to-r, purple.600, blue.600)", transform: 'translateY(-1px)' }} onClick={gerarCorrecaoIA} isLoading={loadingIA} size="sm" aria-label="IA" /></Tooltip>
                                {redacaoAtual.status !== 'REFAZER' && (<Button flex={1} onClick={() => abrirConfirmacao("Devolver Redação?", "Perderá todo o progresso.", liberarRedacaoReal, "red", "Devolver")} colorScheme="red" variant="outline" size="sm" fontSize="xs">Liberar</Button>)}
                                <Button flex={1} colorScheme="green" onClick={() => abrirConfirmacao("Finalizar", `Confirma envio da nota?`, finalizarCorrecaoReal, "green", "Enviar")} size="sm" fontSize="xs" shadow="md">FINALIZAR</Button>
                            </HStack>
                        </Box>
                        <Box flex="1" overflowY="auto" p={3} display="flex" flexDirection="column">
                            <Accordion allowToggle>
                                {compsAtuais.map((comp) => (
                                    <AccordionItem key={comp.id} border="none" mb={3}>
                                        <h2><AccordionButton bg="white" boxShadow="sm" borderRadius="lg" _expanded={{ bg: comp.cor, color: "white" }} py={4} onClick={(e) => { const target = e.currentTarget; setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300); }}><Box w="4px" h="40px" bg={comp.cor} borderRadius="full" mr={3} display="block" _expanded={{ bg: "white" }} /><Box flex='1' textAlign='left'><Text fontSize="sm" fontWeight="bold">{comp.nome}</Text></Box><Badge bg={notas[comp.id] > 0 ? "white" : "gray.100"} color={notas[comp.id] > 0 ? "black" : "gray.500"} borderRadius="md" px={2} py={0.5}>{notas[comp.id] || 0}</Badge></AccordionButton></h2>
                                        <AccordionPanel pb={4} bg="white" mt={-1} borderRadius="0 0 lg lg" border="1px solid" borderColor="gray.100" borderTop="none" display="flex" flexDirection="column">
                                            <VStack align="stretch" spacing={4} pt={2} flex="1">
                                                <Box><Text fontSize="xs" fontWeight="bold" color="gray.400" mb={2} letterSpacing="wider">NOTA</Text><Flex wrap="wrap" gap={1.5}>{notasPossiveisAtuais.map(val => (<Button key={val} size="xs" h="28px" colorScheme={notas[comp.id] === val ? 'teal' : 'gray'} variant={notas[comp.id] === val ? 'solid' : 'ghost'} onClick={() => setNotas({...notas, [comp.id]: val})} borderRadius="md">{val}</Button>))}</Flex></Box>
                                                <Box flex="1" display="flex" flexDirection="column">
                                                    <Flex justify="space-between" align="center" mb={1}><Text fontSize="xs" fontWeight="bold" color="gray.400" letterSpacing="wider">COMENTÁRIO</Text><Button size="xs" leftIcon={<Text fontSize="xs">⚡</Text>} onClick={() => { setQuickReplyComp(comp.id); setQuickReplyContext('GERAL'); modalRespostas.onOpen(); }} colorScheme="yellow" variant="ghost">Rápidas</Button></Flex>
                                                    <Textarea size="sm" bg="gray.50" border="none" _focus={{ bg: "white", boxShadow: "outline" }} value={comentarios[comp.id]} onChange={(e) => setComentarios({...comentarios, [comp.id]: e.target.value})} placeholder="Escreva sua avaliação..." borderRadius="md" minH="calc(100vh - 450px)" resize="none" />
                                                </Box>
                                            </VStack>
                                        </AccordionPanel>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </Box>
                    </Box>
                </Box>
            </Flex>
          );
      }

      // ------------------------------------------------------------------
      // MODO 2: VISUALIZANDO FEEDBACK HISTÓRICO
      // ------------------------------------------------------------------
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
                  <HStack bg="green.50" px={4} py={1} borderRadius="full" border="1px solid" borderColor="green.200"><Text fontSize="xs" fontWeight="bold" color="green.600" textTransform="uppercase">Nota Total</Text><Text fontSize="xl" fontWeight="800" color="green.700">{redacaoVisualizar.correcao?.nota_final || 0}</Text></HStack>
                </Flex>
                <Flex h="full" w="full" overflow="hidden">
                    <Box flex={1} overflow="auto" p={8} display="flex" justifyContent="center" bg="gray.200">
                        <Box position="relative" display="inline-block" height="fit-content" boxShadow="dark-lg" bg="white" border="1px solid" borderColor="gray.200" borderRadius="sm" w={redacaoVisualizar.conteudoTexto ? "700px" : "full"} maxW={redacaoVisualizar.conteudoTexto ? "700px" : "900px"} flexShrink={redacaoVisualizar.conteudoTexto ? 0 : 1}>
                            {redacaoVisualizar.conteudoTexto ? ( <Box p="8px 30px" whiteSpace="pre-wrap" fontFamily="Arial, sans-serif" fontSize="16px" lineHeight="40px" bgImage="linear-gradient(transparent 39px, #ccc 40px)" bgSize="100% 40px" minHeight="1216px" color="gray.800">{redacaoVisualizar.conteudoTexto}</Box> ) : ( <Image src={redacaoVisualizar.arquivo} alt="Redação" display="block" w="100%" h="auto" /> )}
                            {redacaoVisualizar.correcao?.anotacoes?.map((pin) => { 
                                if(!pin.x) return null; const info = isSimples ? INFO_COMPETENCIAS_SIMPLES[pin.competencia] : INFO_COMPETENCIAS_ENEM[pin.competencia]; if(!info) return null; const isHovered = hoveredPinViewId === pin.id; 
                                return (
                                    <Box key={pin.id}>
                                        <Box position="absolute" left={`${pin.x}%`} top={`${pin.y}%`} w={`${pin.width}%`} h={`${pin.height}%`} bg={info.cor} opacity={isHovered ? 0.4 : 0} pointerEvents="none" transition="opacity 0.2s" zIndex={4} />
                                        <Popover trigger="hover" placement="top" openDelay={0} isLazy><PopoverTrigger><Box position="absolute" left={`calc(${pin.x}% + ${pin.width}% - 6px)`} top={`calc(${pin.y}% - 28px)`} cursor="pointer" zIndex={10} display="flex" alignItems="center" justifyContent="center" onMouseEnter={() => setHoveredPinViewId(pin.id)} onMouseLeave={() => setHoveredPinViewId(null)}><CustomPinSVG cor={info.cor} numero={pin.competencia} /></Box></PopoverTrigger><Portal><PopoverContent zIndex={9999} w="300px" boxShadow="2xl" borderRadius="2xl" overflow="hidden" border="1px solid" borderColor="gray.100" onMouseEnter={() => setHoveredPinViewId(pin.id)} onMouseLeave={() => setHoveredPinViewId(null)}><PopoverArrow bg={info.bg} /> <PopoverHeader bg={info.bg} fontWeight="bold" color={info.cor} borderBottom="none" fontSize="sm">{pin.tipo_erro || info.nome}</PopoverHeader><PopoverBody fontSize="sm" bg="white">{pin.tipo_erro && pin.tipo_erro !== 'Geral' && <Badge colorScheme="red" mb={2}>{pin.tipo_erro}</Badge>}<Text color="gray.700">{pin.texto}</Text></PopoverBody></PopoverContent></Portal></Popover>
                                    </Box>
                                ); 
                            })}
                        </Box>
                    </Box>
                    <Box w="400px" bg="white" borderLeft="1px solid #ddd" overflowY="auto" p={6}>
                        <VStack align="stretch" spacing={6}>
                            <Box bg="gray.50" p={4} borderRadius="md" border="1px solid" borderColor="gray.200"><Heading size="xs" color="gray.500" mb={1}>TEMA DA REDAÇÃO</Heading><Text fontWeight="bold" fontSize="sm">{redacaoVisualizar.tema_titulo}</Text></Box>
                            {redacaoVisualizar.correcao?.comentario_geral && (
                              <Box><Heading size="xs" mb={3} color="blue.600" textTransform="uppercase">PARECER GERAL / AVISOS</Heading>{renderComentarioGeralHist(redacaoVisualizar.correcao.comentario_geral)}</Box>
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
                                        {comp.comentario ? (<Text fontSize="sm" color="gray.600" bg="gray.50" p={4} borderRadius="md" fontStyle="italic" whiteSpace="pre-wrap" lineHeight="tall">"{comp.comentario}"</Text>) : (<Text fontSize="xs" color="gray.400">Sem apontamentos adicionais.</Text>)}
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

      // ------------------------------------------------------------------
      // MODO 3: ABA FILA GERAL / PENDÊNCIAS
      // ------------------------------------------------------------------
      if (aba === 'fila') {
          const listaPendencias = fila.filter(r => r.status === 'REFAZER');
          let listaGeral = fila.filter(r => r.status !== 'REFAZER' && r.status !== 'CORRIGIDA' && r.status !== 'EM_QA');

          listaGeral = listaGeral.filter(r => {
              const match = r.tema_titulo.toLowerCase().includes(filtroTexto.toLowerCase()) || (r.id && r.id.toString().includes(filtroTexto.toLowerCase()));
              const matchTipo = filtroTipo === 'TODOS' ? true : (r.tema_tipo || r.tipo || 'ENEM').toUpperCase() === filtroTipo;
              if (somenteUrgentes && !r.is_urgente && !r.vip_pago) return false;
              return match && matchTipo;
          });
          
          listaGeral.sort((a, b) => new Date(a.data_envio) - new Date(b.data_envio));
          const qtdUrgentes = listaGeral.filter(r => r.is_urgente || r.vip_pago).length;
          const idxUltimo = paginaAtualFila * itensPorPaginaFila;
          const idxPrimeiro = idxUltimo - itensPorPaginaFila;
          const filaPaginada = listaGeral.slice(idxPrimeiro, idxUltimo);
          const totalPaginas = Math.ceil(listaGeral.length / itensPorPaginaFila);

          return (
              <Container maxW="container.xl" py={8}>
                  <Flex justify="space-between" align="center" mb={6} bg="white" p={6} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.100">
                      <VStack align="start" spacing={0}><Heading size="lg" color="teal.600">Mesa de Trabalho</Heading><Text color="gray.500" fontSize="sm">Puxe uma redação da fila e comece a faturar.</Text></VStack>
                      <HStack spacing={8}>
                          <Stat textAlign="center"><StatLabel color="gray.500">Pendentes</StatLabel><StatNumber fontSize="3xl" color="gray.700">{listaGeral.length}</StatNumber></Stat>
                          <Divider orientation="vertical" height="40px" />
                          <Stat textAlign="center"><StatLabel color="purple.600" fontWeight="bold">Urgentes/VIPs</StatLabel><StatNumber fontSize="3xl" color="purple.600">{qtdUrgentes}</StatNumber></Stat>
                      </HStack>
                  </Flex>

                  {listaPendencias.length > 0 && (
                      <Box mb={8}>
                          <Flex align="center" mb={3} gap={2}><WarningTwoIcon color="red.500" boxSize={5} animation="pulse 1.5s infinite" /><Heading size="md" color="red.600">Minhas Pendências (Urgente)</Heading></Flex>
                          <Card bg="red.50" shadow="md" borderRadius="lg" overflow="hidden" border="1px solid" borderColor="red.200">
                              <Box overflowX="auto">
                                  <Table variant="simple" style={{ tableLayout: 'fixed', width: '100%' }}>
                                      <Thead bg="red.100"><Tr><Th w="8%" px={4} color="red.800">Cód.</Th><Th w="48%" px={4} color="red.800">Tema da Redação</Th><Th w="10%" px={3} textAlign="center" color="red.800">Tipo</Th><Th w="10%" px={3} textAlign="center" color="red.800">Status</Th><Th w="12%" px={3} textAlign="center" color="red.800">Prazo</Th><Th w="12%" px={4} textAlign="center" color="red.800">Ação</Th></Tr></Thead>
                                      <Tbody>
                                          {listaPendencias.map(r => {
                                              const tipoRedacao = r.tema_tipo || r.tipo || 'ENEM';
                                              return (
                                                  <Tr key={r.id} _hover={{ bg: 'red.100' }}>
                                                      <Td fontWeight="bold" color="red.700" px={4}>#{r.id}</Td><Td fontWeight="medium" isTruncated px={4} title={r.tema_titulo}>{r.tema_titulo}</Td><Td px={3} textAlign="center"><Badge bg={tipoRedacao === 'ENEM' ? 'red.200' : 'red.200'} color="red.800" px={2} py={1} borderRadius="md" fontWeight="bold">{tipoRedacao}</Badge></Td>
                                                      <Td px={3} textAlign="center"><Badge colorScheme="red" px={2} py={1} borderRadius="md">REFAÇÃO</Badge></Td><Td px={3} textAlign="center"><Badge colorScheme="red" variant="solid" borderRadius="md" px={2}>AGORA</Badge></Td>
                                                      <Td px={4} textAlign="center"><Button size="sm" colorScheme="red" leftIcon={<EditIcon />} onClick={() => pegarRedacao(r.id)} shadow="md" animation="pulse 1.5s infinite">Ajustar Nota</Button></Td>
                                                  </Tr>
                                              );
                                          })}
                                      </Tbody>
                                  </Table>
                              </Box>
                          </Card>
                      </Box>
                  )}

                  <Heading size="md" color="gray.700" mb={4}>Fila Geral</Heading>
                  <Flex mb={6} gap={4} bg="white" p={5} borderRadius="xl" boxShadow="sm" align="center" border="1px solid" borderColor="gray.100" wrap="wrap">
                      <InputGroup size="md" flex={1} minW="250px"><InputLeftElement pointerEvents='none'><SearchIcon color='gray.400' /></InputLeftElement><Input placeholder="Buscar Tema ou Código..." value={filtroTexto} onChange={(e) => setFiltroTexto(e.target.value)} /></InputGroup>
                      <Select w="150px" size="md" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}><option value="TODOS">Tipo: Todos</option><option value="ENEM">ENEM</option><option value="SIMPLES">Simples</option></Select>
                      <Divider orientation="vertical" h="30px" display={{ base: 'none', md: 'block' }} />
                      <FormControl display='flex' alignItems='center' w="auto"><Switch colorScheme="purple" isChecked={somenteUrgentes} onChange={(e) => setSomenteUrgentes(e.target.checked)} mr={2} /><FormLabel mb='0' fontSize="sm" fontWeight="bold" color="purple.600">Apenas VIPs</FormLabel></FormControl>
                  </Flex>

                  <Card bg="white" shadow="sm" borderRadius="lg" overflow="hidden">
                      {listaGeral.length === 0 ? (
                          <Flex direction="column" align="center" justify="center" h="300px" bg="white" borderRadius="xl"><CheckCircleIcon w={12} h={12} color="green.300" mb={4} /><Heading size="md" color="gray.500" mb={1}>Tudo limpo!</Heading><Text color="gray.400">Nenhuma redação na fila com esses filtros.</Text></Flex>
                      ) : (
                          <Box overflowX="auto">
                              <Table variant="simple" style={{ tableLayout: 'fixed', width: '100%' }}>
                                  <Thead bg="gray.50"><Tr><Th w="8%" px={4}>Cód.</Th><Th w="32%" px={4}>Tema</Th><Th w="15%" px={3} textAlign="center">Status</Th><Th w="15%" px={3} textAlign="center">SLA / Envio</Th><Th w="15%" px={3} textAlign="center">Ações</Th></Tr></Thead>
                                  <Tbody>
                                    {filaPaginada.map(r => {
                                        const sla = getSLA(r.data_envio); const tipoRedacao = r.tema_tipo || r.tipo || 'ENEM';
                                        return (
                                          <Tr key={r.id} _hover={{ bg: 'gray.50' }} bg={r.vip_pago || r.is_urgente ? 'purple.50' : 'transparent'}>
                                            <Td fontWeight="bold" color="gray.700" px={4}>#{r.id}</Td>
                                            <Td px={4} isTruncated title={r.tema_titulo}><Text fontWeight="bold" fontSize="sm" color="gray.800" isTruncated>{r.tema_titulo}</Text><Text fontSize="xs" color="gray.500">Aluno: <strong>{r.aluno_nome || "Desconhecido"}</strong></Text></Td>
                                            <Td px={3} textAlign="center">
                                              {r.status === 'REFAZER' ? (<Badge colorScheme="red" borderRadius="md" px={2} py={1} fontSize="xs">EM REFAÇÃO</Badge>) : (<Badge colorScheme={r.status === 'CORRIGIDA' ? 'green' : r.status === 'EM_CORRECAO' ? 'blue' : 'yellow'} borderRadius="md" px={2} py={1} fontSize="xs">{r.status.replace('_', ' ')}</Badge>)}
                                            </Td>
                                            <Td px={3} textAlign="center">
                                              <Text fontSize="xs" color="gray.600">{new Date(r.data_envio).toLocaleDateString()}</Text>
                                              {r.vip_pago && <Badge colorScheme="purple" variant="solid" mt={1} fontSize="2xs"><StarIcon mr={1} mb={0.5}/> VIP PAGO</Badge>}
                                              {!r.vip_pago && r.is_urgente && <Badge colorScheme="red" variant="solid" mt={1} fontSize="2xs"><WarningIcon mr={1} mb={0.5}/> URGENTE</Badge>}
                                            </Td>
                                            <Td px={3} textAlign="center"><Button size="sm" colorScheme={sla.badge === 'red' || r.is_urgente || r.vip_pago ? 'red' : 'teal'} leftIcon={<EditIcon />} onClick={() => pegarRedacao(r.id)} shadow="sm">Corrigir</Button></Td>
                                          </Tr>
                                        )
                                    })}
                                  </Tbody>
                              </Table>
                          </Box>
                      )}
                      {listaGeral.length > 0 && (
                          <Flex justify="space-between" align="center" p={4} bg="gray.50" borderTop="1px solid" borderColor="gray.200" wrap="wrap" gap={4}>
                              <HStack><Text fontSize="sm" color="gray.600">Mostrar</Text><Select size="sm" w="80px" bg="white" value={itensPorPaginaFila} onChange={(e) => { setItensPorPaginaFila(Number(e.target.value)); setPaginaAtualFila(1); }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></Select></HStack>
                              <Text fontSize="sm" color="gray.600" fontWeight="bold">Total de registros encontrados: {listaGeral.length}</Text>
                              <HStack><Button size="sm" onClick={() => setPaginaAtualFila(p => Math.max(1, p - 1))} isDisabled={paginaAtualFila === 1} bg="white" shadow="sm">Anterior</Button><Button size="sm" onClick={() => setPaginaAtualFila(p => Math.min(totalPaginas, p + 1))} isDisabled={paginaAtualFila === totalPaginas} bg="white" shadow="sm">Próxima</Button></HStack>
                          </Flex>
                      )}
                  </Card>
              </Container>
          );
      }

      // ------------------------------------------------------------------
      // MODO 4: ABA HISTÓRICO
      // ------------------------------------------------------------------
      if (aba === 'historico') {
          let historicoFiltrado = historico.filter(h => {
              const match = h.tema_titulo.toLowerCase().includes(filtroHistTexto.toLowerCase()) || (h.id && h.id.toString().includes(filtroHistTexto.toLowerCase()));
              const matchTipo = filtroHistTipo === 'TODOS' ? true : (h.tema_tipo || h.tipo || 'ENEM').toUpperCase() === filtroHistTipo;
              let matchData = true;
              if (filtroHistData) { 
                  const d = new Date(h.data_envio);
                  const dataLocalFormatada = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  matchData = dataLocalFormatada === filtroHistData; 
              }
              return match && matchData && matchTipo;
          });

          const idxUltimo = paginaAtualHist * itensPorPaginaHist;
          const idxPrimeiro = idxUltimo - itensPorPaginaHist;
          const histPaginado = historicoFiltrado.slice(idxPrimeiro, idxUltimo);
          const totalPaginas = Math.ceil(historicoFiltrado.length / itensPorPaginaHist);

          return (
              <Container maxW="container.xl" py={8}>
                  <Heading size="lg" color="teal.600" mb={6}>Meu Histórico</Heading>
                  <Flex gap={4} bg="white" p={5} borderRadius="xl" boxShadow="sm" align="center" border="1px solid" borderColor="gray.100" mb={6} wrap="wrap">
                      <InputGroup flex={1} minW="250px"><InputLeftElement pointerEvents='none'><SearchIcon color='gray.400'/></InputLeftElement><Input placeholder="Buscar Tema ou Cód..." value={filtroHistTexto} onChange={e => setFiltroHistTexto(e.target.value)} /></InputGroup>
                      <Select w="150px" value={filtroHistTipo} onChange={e => setFiltroHistTipo(e.target.value)}><option value="TODOS">Tipo: Todos</option><option value="ENEM">ENEM</option><option value="SIMPLES">Simples</option></Select>
                      <Divider orientation="vertical" h="30px" display={{base: 'none', md: 'block'}} />
                      <HStack spacing={2}><Text fontSize="sm" color="gray.500" fontWeight="medium">Data:</Text><Input type="date" size="md" value={filtroHistData} onChange={e => setFiltroHistData(e.target.value)} w="170px" /></HStack>
                  </Flex>

                  <Box bg="white" shadow="sm" borderRadius="lg" overflow="hidden" border="1px solid" borderColor="gray.200">
                      <Box overflowX="auto">
                          <Table variant="simple" style={{ tableLayout: 'fixed', width: '100%' }}>
                              <Thead bg="gray.50"><Tr><Th w="8%" px={4}>Cód.</Th><Th w="45%" px={4}>Tema da Redação</Th><Th w="12%" px={3} textAlign="center">Tipo</Th><Th w="15%" px={3} textAlign="center">Data Correção</Th><Th w="10%" px={3} textAlign="center">Nota</Th><Th w="10%" px={4} textAlign="center">Ação</Th></Tr></Thead>
                              <Tbody>
                                  {histPaginado.map(h => {
                                      const tipoRedacao = h.tema_tipo || h.tipo || 'ENEM';
                                      return (
                                          <Tr key={h.id} _hover={{ bg: 'gray.50' }}>
                                              <Td fontWeight="bold" color="gray.500" px={4}>#{h.id}</Td><Td fontWeight="medium" isTruncated px={4} title={h.tema_titulo}>{h.tema_titulo}</Td><Td px={3} textAlign="center"><Badge bg={tipoRedacao === 'ENEM' ? 'green.50' : 'blue.50'} color={tipoRedacao === 'ENEM' ? 'green.700' : 'blue.700'} px={2} py={1} borderRadius="md" fontWeight="bold">{tipoRedacao}</Badge></Td>
                                              <Td fontSize="sm" px={3} color="gray.600" textAlign="center">{new Date(h.data_envio).toLocaleDateString()}</Td><Td fontWeight="bold" px={3} textAlign="center" color={h.nota_final >= (tipoRedacao === 'SIMPLES' ? 90 : 900) ? 'green.500' : 'gray.700'}>{h.nota_final}</Td>
                                              <Td px={4} textAlign="center"><Tooltip label="Ver Feedback"><IconButton size="sm" colorScheme="blue" variant="ghost" onClick={() => abrirFeedbackHistorico(h.id)} icon={<ViewIcon />} /></Tooltip></Td>
                                          </Tr>
                                      );
                                  })}
                                  {histPaginado.length === 0 && <Tr><Td colSpan={6} textAlign="center" py={10} color="gray.500">Nenhuma redação encontrada.</Td></Tr>}
                              </Tbody>
                          </Table>
                      </Box>
                      {historicoFiltrado.length > 0 && (
                          <Flex justify="space-between" align="center" p={4} bg="gray.50" borderTop="1px solid" borderColor="gray.200" wrap="wrap" gap={4}>
                              <HStack><Text fontSize="sm" color="gray.600">Mostrar</Text><Select size="sm" w="80px" bg="white" value={itensPorPaginaHist} onChange={(e) => { setItensPorPaginaHist(Number(e.target.value)); setPaginaAtualHist(1); }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></Select></HStack>
                              <Text fontSize="sm" color="gray.600" fontWeight="bold">Total de registros encontrados: {historicoFiltrado.length}</Text>
                              <HStack><Button size="sm" onClick={() => setPaginaAtualHist(p => Math.max(1, p - 1))} isDisabled={paginaAtualHist === 1} bg="white" shadow="sm">Anterior</Button><Button size="sm" onClick={() => setPaginaAtualHist(p => Math.min(totalPaginas, p + 1))} isDisabled={paginaAtualHist === totalPaginas} bg="white" shadow="sm">Próxima</Button></HStack>
                          </Flex>
                      )}
                  </Box>
              </Container>
          );
      }

      // ------------------------------------------------------------------
      // MODO 5: ABA CARTEIRA FINANCEIRA E RPA
      // ------------------------------------------------------------------
      if (aba === 'carteira') {
          const recibosFiltrados = carteira.historico_pagamentos?.filter(p => aplicarFiltroData(p.data_pagamento || p.data_solicitacao, filtroDataRecibos, dtInicioRecibos, dtFimRecibos)) || [];
          const extratoFiltrado = carteira.transacoes?.filter(t => {
              const matchData = aplicarFiltroData(t.data, filtroDataExtrato, dtInicioExtrato, dtFimExtrato);
              const matchStatus = filtroStatusExtrato === 'TODOS' ? true : (filtroStatusExtrato === 'PAGO' ? t.foi_pago : !t.foi_pago);
              return matchData && matchStatus;
          }) || [];

          const idxUltimoE = paginaAtualExtrato * itensPorPaginaExtrato; const idxPrimeiroE = idxUltimoE - itensPorPaginaExtrato;
          const extratoPaginado = extratoFiltrado.slice(idxPrimeiroE, idxUltimoE); const totalPaginasE = Math.ceil(extratoFiltrado.length / itensPorPaginaExtrato);
          
          const recibosSomentePagos = recibosFiltrados.filter(p => p.status === 'PAGO');
          const idxUltimoR = paginaAtualRecibos * itensPorPaginaRecibos; const idxPrimeiroR = idxUltimoR - itensPorPaginaRecibos;
          const recibosPaginados = recibosSomentePagos.slice(idxPrimeiroR, idxUltimoR); const totalPaginasR = Math.ceil(recibosSomentePagos.length / itensPorPaginaRecibos);

          const steps = [
            { title: 'Solicitado', description: 'Garantia de Saldo' }, { title: 'Envio do Recibo', description: 'Assinatura (RPA)' }, 
            { title: 'Em Análise', description: 'Equipe Financeira' }, { title: 'Pagamento Realizado', description: 'PIX/Transferência' }
          ];
          
          let activeStep = 0;
          if (carteira.solicitacao_ativa) { 
            if (carteira.solicitacao_ativa.status === 'AGUARDANDO_RECIBO' || carteira.solicitacao_ativa.status === 'RECUSADO') activeStep = 1; 
            else if (carteira.solicitacao_ativa.status === 'EM_ANALISE') activeStep = 2; 
          }

          return (
              <Container maxW="container.xl" py={8}>
                  <Heading size="lg" color="teal.600" mb={6}>Minha Carteira</Heading>
                  
                  {carteira.solicitacao_ativa ? (
                      <Card bg="white" shadow="md" borderRadius="xl" border="1px solid" borderColor="gray.200" mb={8} overflow="hidden">
                          <Box bg="gray.50" p={6} borderBottom="1px solid" borderColor="gray.200">
                              <Stepper size="lg" colorScheme="teal" index={activeStep}>{steps.map((step, index) => (<Step key={index}><StepIndicator><StepStatus complete={<StepIcon />} incomplete={<StepNumber />} active={<StepNumber />} /></StepIndicator><Box flexShrink='0' display={{ base: 'none', md: 'block' }}><StepTitle>{step.title}</StepTitle><StepDescription>{step.description}</StepDescription></Box><StepSeparator /></Step>))}</Stepper>
                          </Box>
                          <CardBody p={8}>
                              {carteira.solicitacao_ativa.status === 'AGUARDANDO_RECIBO' && (
                                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} alignItems="center">
                                      <Box><Heading size="md" color="teal.700" mb={3}>Estamos quase lá!</Heading><Text color="gray.600" mb={4} lineHeight="tall">Para cumprirmos as exigências legais e liberarmos o seu pagamento de <strong>R$ {parseFloat(carteira.solicitacao_ativa.valor).toFixed(2).replace('.', ',')}</strong>, precisamos do seu <strong>Recibo de Pagamento a Autônomo (RPA)</strong> assinado.</Text><Button size="lg" colorScheme="teal" leftIcon={<DownloadIcon />} onClick={() => handlePrintRecibo(carteira.solicitacao_ativa)} shadow="md">1. Imprimir Recibo Oficial</Button></Box>
                                      <Box w="full" h="200px" border="2px dashed" borderColor={arquivoInline ? "green.400" : "teal.300"} borderRadius="xl" display="flex" flexDirection="column" alignItems="center" justifyContent="center" bg={arquivoInline ? "green.50" : "teal.50"} cursor="pointer" onClick={() => fileInputInlineRef.current.click()} transition="all 0.2s" _hover={{ bg: arquivoInline ? 'green.100' : 'teal.100' }} p={4}><Icon as={arquivoInline ? CheckCircleIcon : AttachmentIcon} boxSize={10} color={arquivoInline ? "green.500" : "teal.500"} mb={3} /><Text fontSize="md" color={arquivoInline ? "green.800" : "teal.800"} fontWeight="bold" textAlign="center">{arquivoInline ? arquivoInline.name : "2. Anexe aqui o recibo assinado"}</Text>{!arquivoInline && <Text fontSize="sm" color="teal.600" mt={1}>Clique para selecionar (PDF ou Foto)</Text>}{arquivoInline && (<Button mt={4} size="sm" colorScheme="green" onClick={(e) => { e.stopPropagation(); enviarReciboInline(); }} isLoading={enviandoRecibo} shadow="md">Confirmar e Enviar</Button>)}</Box><Input type="file" display="none" ref={fileInputInlineRef} onChange={e => setArquivoInline(e.target.files[0])} accept="image/*,.pdf" />
                                  </SimpleGrid>
                              )}
                              {carteira.solicitacao_ativa.status === 'RECUSADO' && (
                                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} alignItems="center">
                                      <Box><Alert status="error" borderRadius="md" mb={4} flexDirection="column" alignItems="start" p={5}><HStack mb={2}><AlertIcon /><Heading size="sm">Ops! Problema no recibo.</Heading></HStack><Text fontSize="sm">A equipa financeira encontrou o seguinte problema:</Text><Text fontWeight="bold" mt={2} bg="white" p={3} borderRadius="md" w="full">"{carteira.solicitacao_ativa.motivo_recusa}"</Text></Alert><Button size="md" colorScheme="gray" leftIcon={<DownloadIcon />} onClick={() => handlePrintRecibo(carteira.solicitacao_ativa)}>Imprimir Novamente</Button></Box>
                                      <Box w="full" h="200px" border="2px dashed" borderColor={arquivoInline ? "green.400" : "red.300"} borderRadius="xl" display="flex" flexDirection="column" alignItems="center" justifyContent="center" bg={arquivoInline ? "green.50" : "red.50"} cursor="pointer" onClick={() => fileInputInlineRef.current.click()} transition="all 0.2s" _hover={{ bg: arquivoInline ? 'green.100' : 'red.100' }} p={4}><Icon as={arquivoInline ? CheckCircleIcon : AttachmentIcon} boxSize={10} color={arquivoInline ? "green.500" : "red.500"} mb={3} /><Text fontSize="md" color={arquivoInline ? "green.800" : "red.800"} fontWeight="bold" textAlign="center">{arquivoInline ? arquivoInline.name : "Anexe o novo recibo corrigido"}</Text>{arquivoInline && (<Button mt={4} size="sm" colorScheme="green" onClick={(e) => { e.stopPropagation(); enviarReciboInline(); }} isLoading={enviandoRecibo} shadow="md">Confirmar e Reenviar</Button>)}</Box><Input type="file" display="none" ref={fileInputInlineRef} onChange={e => setArquivoInline(e.target.files[0])} accept="image/*,.pdf" />
                                  </SimpleGrid>
                              )}
                              {carteira.solicitacao_ativa.status === 'EM_ANALISE' && (
                                  <Flex direction="column" align="center" justify="center" py={4}><TimeIcon boxSize={12} color="blue.400" mb={4} animation="pulse 2s infinite" /><Heading size="md" color="blue.700" mb={2}>Documentação em Análise</Heading><Text color="gray.500" textAlign="center" maxW="lg">Recebemos o seu documento perfeitamente. A nossa equipa financeira está a validá-lo e o seu PIX/Transferência será processado em breve.</Text></Flex>
                              )}
                          </CardBody>
                      </Card>
                  ) : (
                      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} mb={8}>
                          <Card bg="white" shadow="sm" border="1px solid" borderColor="gray.100" borderTop="4px solid" borderTopColor="green.400"><CardBody display="flex" flexDirection="column" justifyContent="center"><Stat><StatLabel color="gray.500" fontSize="md" fontWeight="bold">Saldo Disponível (A Receber)</StatLabel><StatNumber fontSize="3xl" color="green.500" mt={2}>R$ {parseFloat(carteira.saldo_atual || 0).toFixed(2).replace('.', ',')}</StatNumber></Stat></CardBody></Card>
                          <Card bg="white" shadow="sm" border="1px solid" borderColor="gray.100" borderTop="4px solid" borderTopColor="blue.400"><CardBody display="flex" flexDirection="column" justifyContent="center" alignItems="center"><Text color="gray.500" fontSize="md" fontWeight="bold" mb={3}>Redações Corrigidas</Text><HStack justify="center" spacing={4} w="full"><Badge colorScheme="blue" px={3} py={1} borderRadius="md" fontSize="sm">{carteira.qtd_normal_pendente || 0} Normais</Badge><Badge colorScheme="purple" px={3} py={1} borderRadius="md" fontSize="sm">{carteira.qtd_vip_pendente || 0} VIPs</Badge><Badge colorScheme="green" px={3} py={1} borderRadius="md" fontSize="sm">Total: {(carteira.qtd_normal_pendente || 0) + (carteira.qtd_vip_pendente || 0)}</Badge></HStack></CardBody></Card>
                          <Card bg="white" shadow="sm" border="1px solid" borderColor="gray.100" borderTop="4px solid" borderTopColor="teal.400"><CardBody display="flex" flexDirection="column" justifyContent="center"><Button w="full" h="full" minH="70px" size="lg" colorScheme="teal" onClick={solicitarSaque} isDisabled={carteira.saldo_atual <= 0} leftIcon={<MdAttachMoney size="24px" />} whiteSpace="normal" fontSize="xl" shadow="md" _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}>Solicitar Saque</Button></CardBody></Card>
                      </SimpleGrid>
                  )}

                  <Tabs colorScheme="teal" isLazy>
                      <TabList mb={4}>
                        <Tab fontWeight="bold" fontSize="md"><Icon as={TimeIcon} mr={2} /> Lançamentos Pendentes</Tab>
                        <Tab fontWeight="bold" fontSize="md"><Icon as={MdAccountBalanceWallet} mr={2} /> Meus Recibos (Histórico)</Tab>
                      </TabList>
                      <TabPanels>
                          <TabPanel p={0}>
                              <Flex gap={3} wrap="wrap" mb={4} p={4} bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" align="center" shadow="sm" justify="space-between">
                                  <HStack flexWrap="wrap" gap={3}>
                                      <Icon as={TimeIcon} color="gray.500" />
                                      <Select w="200px" size="sm" bg="gray.50" value={filtroDataExtrato} onChange={e => setFiltroDataExtrato(e.target.value)}>
                                        <option value="TUDO">Todo o Histórico</option><option value="MES_ATUAL">Mês Atual</option><option value="MES_ANTERIOR">Mês Anterior</option><option value="PERIODO">Período Específico</option>
                                      </Select>
                                      {filtroDataExtrato === 'PERIODO' && (<HStack><Input type="date" bg="gray.50" size="sm" value={dtInicioExtrato} onChange={e => setDtInicioExtrato(e.target.value)} /><Text fontSize="sm" color="gray.500">até</Text><Input type="date" bg="gray.50" size="sm" value={dtFimExtrato} onChange={e => setDtFimExtrato(e.target.value)} /></HStack>)}
                                  </HStack>
                              </Flex>

                              <Box bg="white" shadow="sm" borderRadius="lg" overflow="hidden" border="1px solid" borderColor="gray.100">
                                  <Box overflowX="auto">
                                      <Table variant="simple" size="sm">
                                          <Thead bg="gray.50"><Tr><Th w="20%">Data / Hora</Th><Th w="40%">Descrição da Operação</Th><Th w="15%" textAlign="center">Status</Th><Th w="10%" textAlign="center">Tipo</Th><Th w="15%" textAlign="right">Valor (R$)</Th></Tr></Thead>
                                          <Tbody>
                                              {carteira.transacoes?.filter(t => !t.foi_pago).slice(paginaAtualExtrato * itensPorPaginaExtrato - itensPorPaginaExtrato, paginaAtualExtrato * itensPorPaginaExtrato).map(t => (
                                                  <Tr key={t.id} _hover={{ bg: 'gray.50' }}>
                                                      <Td fontSize="sm" color="gray.600">{new Date(t.data).toLocaleString('pt-BR')}</Td>
                                                      <Td fontWeight="medium" color="gray.800">{t.descricao}</Td>
                                                      <Td textAlign="center"><Badge colorScheme='yellow' variant='solid'>A RECEBER</Badge></Td>
                                                      <Td textAlign="center"><Badge colorScheme={t.tipo === 'CREDITO' ? 'green' : 'red'} variant="outline" px={2} borderRadius="md">{t.tipo}</Badge></Td>
                                                      <Td textAlign="right" fontWeight="bold" color={t.tipo === 'CREDITO' ? 'green.500' : 'red.500'}>{t.tipo === 'CREDITO' ? '+' : '-'} {parseFloat(t.valor).toFixed(2).replace('.', ',')}</Td>
                                                  </Tr>
                                              ))}
                                              {carteira.transacoes?.filter(t => !t.foi_pago).length === 0 && (<Tr><Td colSpan={5} textAlign="center" py={10} color="gray.500">Nenhum lançamento pendente encontrado.</Td></Tr>)}
                                          </Tbody>
                                      </Table>
                                  </Box>
                                  {carteira.transacoes?.filter(t => !t.foi_pago).length > 0 && (
                                      <Flex justify="space-between" align="center" p={4} bg="gray.50" borderTop="1px solid" borderColor="gray.200" wrap="wrap" gap={4}>
                                          <HStack><Text fontSize="sm" color="gray.600">Mostrar</Text><Select size="sm" w="80px" bg="white" value={itensPorPaginaExtrato} onChange={(e) => { setItensPorPaginaExtrato(Number(e.target.value)); setPaginaAtualExtrato(1); }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></Select></HStack>
                                          <Text fontSize="sm" color="gray.600" fontWeight="bold">Total de registros encontrados: {carteira.transacoes.filter(t => !t.foi_pago).length}</Text>
                                          <HStack><Button size="sm" onClick={() => setPaginaAtualExtrato(p => Math.max(1, p - 1))} isDisabled={paginaAtualExtrato === 1} bg="white">Anterior</Button><Button size="sm" onClick={() => setPaginaAtualExtrato(p => Math.min(Math.ceil(carteira.transacoes.filter(t => !t.foi_pago).length / itensPorPaginaExtrato), p + 1))} isDisabled={paginaAtualExtrato === Math.ceil(carteira.transacoes.filter(t => !t.foi_pago).length / itensPorPaginaExtrato)} bg="white">Próxima</Button></HStack>
                                      </Flex>
                                  )}
                              </Box>
                          </TabPanel>
                          
                          <TabPanel p={0}>
                              {renderFiltroData(filtroDataRecibos, setFiltroDataRecibos, dtInicioRecibos, setDtInicioRecibos, dtFimRecibos, setDtFimRecibos)}
                              <Box bg="white" shadow="sm" borderRadius="lg" overflow="hidden" border="1px solid" borderColor="gray.100" mb={8}>
                                  <Box overflowX="auto">
                                      <Table variant="simple">
                                          <Thead bg="gray.50"><Tr><Th w="20%">Data do Pagamento</Th><Th w="40%" textAlign="center">Redações Pagas</Th><Th w="20%" isNumeric>Valor Recebido</Th><Th w="20%" textAlign="center">Recibo Oficial</Th></Tr></Thead>
                                          <Tbody>
    {recibosPaginados.map(p => (
        <Tr key={p.id} _hover={{ bg: 'gray.50' }}>
            <Td>
              <Text fontSize="sm" fontWeight="bold" color="gray.700">
                Solicitado: {p.data_solicitacao ? new Date(p.data_solicitacao).toLocaleDateString('pt-BR') : '--'}
              </Text>
              <Text fontSize="xs" color={p.status === 'PAGO' ? "green.600" : "orange.500"} fontWeight="bold">
                {p.status === 'PAGO' ? 'Pago: ' : 'Previsão: '} 
                {p.status === 'PAGO' && p.data_pagamento ? new Date(p.data_pagamento).toLocaleDateString('pt-BR') : 'Aguardando'}
              </Text>
            </Td>
            <Td textAlign="center">
              <Badge colorScheme="blue" mr={1}>{p.qtd_normal} Normais</Badge>
              <Badge colorScheme="purple">{p.qtd_vip} VIPs</Badge>
            </Td>
            <Td isNumeric fontWeight="bold" color="green.500">
              R$ {parseFloat(p.valor).toFixed(2).replace('.', ',')}
            </Td>
            <Td textAlign="center">
              <HStack spacing={2} justify="center">
                <Button size="sm" colorScheme="blue" variant="solid" leftIcon={<ViewIcon />} onClick={() => { setReciboVisualizar(p); setModalReciboOpen(true); }}>
                  Ver Redações
                </Button>
                <Button size="sm" colorScheme="teal" variant="outline" leftIcon={<DownloadIcon />} onClick={() => { if(p.arquivo_recibo_url) window.open(`http://127.0.0.1:8000${p.arquivo_recibo_url}`, '_blank'); else handlePrintRecibo(p); }}>
                  Baixar
                </Button>
              </HStack>
            </Td>
        </Tr>
    ))}
    {recibosPaginados.length === 0 && (
      <Tr><Td colSpan={4} textAlign="center" py={10} color="gray.500">Nenhum pagamento finalizado neste período.</Td></Tr>
    )}
</Tbody>
                                      </Table>
                                  </Box>
                                  {recibosSomentePagos.length > 0 && (
                                      <Flex justify="space-between" align="center" p={4} bg="gray.50" borderTop="1px solid" borderColor="gray.200" wrap="wrap" gap={4}>
                                          <HStack><Text fontSize="sm" color="gray.600">Mostrar</Text><Select size="sm" w="80px" bg="white" value={itensPorPaginaRecibos} onChange={(e) => { setItensPorPaginaRecibos(Number(e.target.value)); setPaginaAtualRecibos(1); }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></Select></HStack>
                                          <Text fontSize="sm" color="gray.600" fontWeight="bold">Total de registros encontrados: {recibosSomentePagos.length}</Text>
                                          <HStack><Button size="sm" onClick={() => setPaginaAtualRecibos(p => Math.max(1, p - 1))} isDisabled={paginaAtualRecibos === 1} bg="white">Anterior</Button><Button size="sm" onClick={() => setPaginaAtualRecibos(p => Math.min(totalPaginasR, p + 1))} isDisabled={paginaAtualRecibos === totalPaginasR} bg="white">Próxima</Button></HStack>
                                      </Flex>
                                  )}
                              </Box>
                          </TabPanel>
                      </TabPanels>
                  </Tabs>
              </Container>
          );
      }

      // ------------------------------------------------------------------
      // MODO 6: ABA RESPOSTAS RÁPIDAS
      // ------------------------------------------------------------------
      if (aba === 'respostas') {
          const respostasFiltradas = todasRespostas.filter(r => { 
            const matchBusca = r.titulo.toLowerCase().includes(buscaResposta.toLowerCase()) || r.texto.toLowerCase().includes(buscaResposta.toLowerCase()); 
            const matchModelo = filtroRespModelo === 'TODOS' ? true : r.modelo === filtroRespModelo; 
            const matchContexto = filtroRespContexto === 'TODOS' ? true : r.contexto === filtroRespContexto; 
            return matchBusca && matchModelo && matchContexto; 
          });
          
          return (
              <Container maxW="container.xl" py={8}>
                  <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
                    <Box><Heading size="lg" color="teal.700">Respostas Rápidas</Heading><Text color="gray.500">Gerencie seus atalhos de texto para usar durante as correções.</Text></Box>
                    <Button colorScheme="teal" leftIcon={<AddIcon />} shadow="sm" onClick={abrirNovaResposta}>Nova Resposta</Button>
                  </Flex>

                  <Flex mb={6} gap={4} bg="white" p={5} borderRadius="xl" boxShadow="sm" align="center" border="1px solid" borderColor="gray.100" wrap="wrap">
                    <InputGroup size="md" flex={1} minW="250px"><InputLeftElement pointerEvents='none'><SearchIcon color='gray.400' /></InputLeftElement><Input placeholder="Buscar por título ou texto..." value={buscaResposta} onChange={(e) => setBuscaResposta(e.target.value)} /></InputGroup>
                    <Select w="180px" value={filtroRespModelo} onChange={e => setFiltroRespModelo(e.target.value)}><option value="TODOS">Modelo: Todos</option><option value="ENEM">ENEM</option><option value="SIMPLES">Simples</option></Select>
                    <Select w="180px" value={filtroRespContexto} onChange={e => setFiltroRespContexto(e.target.value)}><option value="TODOS">Contexto: Todos</option><option value="GERAL">Comentário Final</option><option value="PIN">Apontamento (Pin)</option></Select>
                  </Flex>
                  
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {respostasFiltradas.map(r => (
                      <Card key={r.id} shadow="sm" border="1px solid" borderColor="gray.200" position="relative" overflow="hidden" _hover={{ shadow: 'md', transform: 'translateY(-2px)' }} transition="all 0.2s">
                        <Box h="4px" w="full" bg={r.modelo === 'ENEM' ? "teal.400" : "blue.400"} />
                        <CardBody>
                          <Flex justify="space-between" align="start" mb={2}>
                            <Badge colorScheme={r.contexto === 'GERAL' ? 'purple' : 'orange'} fontSize="2xs">{r.contexto === 'GERAL' ? 'COMENTÁRIO' : 'PIN'}</Badge>
                            <HStack spacing={1}>
                                <IconButton icon={<EditIcon />} size="xs" colorScheme="blue" variant="ghost" onClick={() => abrirEdicaoResposta(r)} aria-label="Editar" />
                                <IconButton icon={<DeleteIcon />} size="xs" colorScheme="red" variant="ghost" onClick={() => excluirRespostaRapida(r.id)} aria-label="Excluir" />
                            </HStack>
                          </Flex>
                          <Heading size="xs" mb={1} color="gray.800">{r.titulo}</Heading>
                          <Text fontSize="xs" color="gray.500" mb={3} fontWeight="bold">
                              Comp {r.competencia} - {r.modelo}
                              {r.modelo === 'ENEM' && r.competencia === 1 && r.contexto === 'PIN' && r.tipo_erro && (
                                  <Badge ml={2} colorScheme="red" variant="subtle" fontSize="2xs">{r.tipo_erro.replace('_', ' ')}</Badge>
                              )}
                          </Text>
                          <Text fontSize="sm" color="gray.600" noOfLines={4} bg="gray.50" p={3} borderRadius="md" border="1px solid" borderColor="gray.100" fontStyle="italic">"{r.texto}"</Text>
                        </CardBody>
                      </Card>
                    ))}
                    {respostasFiltradas.length === 0 && (
                        <GridItem colSpan={{ base: 1, md: 2, lg: 3 }}>
                          <Flex direction="column" align="center" justify="center" h="200px" bg="white" borderRadius="xl" border="1px dashed" borderColor="gray.300">
                            <Text color="gray.500" fontWeight="bold">Nenhuma resposta encontrada.</Text>
                          </Flex>
                        </GridItem>
                    )}
                  </SimpleGrid>
              </Container>
          );
      }

      // ------------------------------------------------------------------
      // MODO 7: ABA MANUAIS E COMUNICADOS
      // ------------------------------------------------------------------
      if (aba === 'manuais') {
          const comunicados = materiais.filter(m => m.categoria === 'CORRETOR_COMUNICADO'); 
          const documentacao = materiais.filter(m => m.categoria !== 'CORRETOR_COMUNICADO'); 
          const manuaisFiltrados = documentacao.filter(m => { 
            const matchBusca = m.titulo.toLowerCase().includes(buscaManual.toLowerCase()); 
            const matchCat = filtroManualCat === 'TODOS' ? true : m.categoria === filtroManualCat; 
            return matchBusca && matchCat; 
          });

          return (
              <Container maxW="container.xl" py={8}>
                  <Heading mb={2} color="teal.700">Manual do Corretor</Heading>
                  <Text mb={8} color="gray.500">Acesse cartilhas, regras e comunicados de alinhamento fornecidos pela coordenação.</Text>
                  
                  {/* COMUNICADOS EM DESTAQUE */}
                  {comunicados.length > 0 && (
                    <Box mb={10}>
                      <Flex align="center" gap={2} mb={4}><Icon as={ChatIcon} color="purple.500" boxSize={5} /><Heading size="md" color="purple.700">Quadro de Avisos</Heading></Flex>
                      <VStack align="stretch" spacing={3}>
                        {comunicados.map(c => { 
                          const temConteudo = (c.conteudo && c.conteudo.length > 5) || (c.dados_extras && Object.keys(c.dados_extras).length > 0); 
                          return (
                            <Alert key={c.id} status="info" variant="left-accent" bg="purple.50" borderLeftColor="purple.500" borderRadius="md" py={4} display="flex" justifyContent="space-between" alignItems="center" shadow="sm">
                              <Box flex="1">
                                <HStack mb={1}><Badge colorScheme="purple">COMUNICADO RÁPIDO</Badge><Text fontSize="xs" color="purple.600" fontWeight="bold">{new Date(c.criado_em).toLocaleDateString('pt-BR')}</Text></HStack>
                                <Text fontWeight="bold" color="purple.900" fontSize="md">{c.titulo}</Text>
                                {c.descricao && <Text fontSize="sm" color="purple.800" mt={1}>{c.descricao}</Text>}
                              </Box>
                              {temConteudo ? (
                                <Button size="sm" colorScheme="purple" leftIcon={<ViewIcon />} flexShrink={0} ml={4} onClick={() => abrirMaterial(c)}>Ler Comunicado</Button>
                              ) : c.arquivo ? (
                                <Button as="a" href={c.arquivo} target="_blank" size="sm" colorScheme="purple" leftIcon={<DownloadIcon />} flexShrink={0} ml={4}>Ver Anexo</Button>
                              ) : null}
                            </Alert>
                          ); 
                        })}
                      </VStack>
                    </Box>
                  )}
                  
                  <Heading size="md" color="gray.700" mb={4}>Biblioteca Técnica</Heading>
                  <Flex mb={6} gap={4} bg="white" p={5} borderRadius="xl" boxShadow="sm" align="center" border="1px solid" borderColor="gray.100" wrap="wrap">
                    <InputGroup size="md" flex={1} minW="250px"><InputLeftElement pointerEvents='none'><SearchIcon color='gray.400' /></InputLeftElement><Input placeholder="Buscar por título do documento..." value={buscaManual} onChange={(e) => setBuscaManual(e.target.value)} /></InputGroup>
                    <Divider orientation="vertical" h="30px" display={{ base: 'none', md: 'block' }} />
                    <Select w={{ base: "full", md: "250px" }} value={filtroManualCat} onChange={(e) => setFiltroManualCat(e.target.value)}>
                      <option value="TODOS">Todas as Categorias</option>
                      {Object.entries(INFOS_MANUAL).filter(([k]) => k !== 'OUTROS').map(([k, v]) => (<option key={k} value={k}>{v.nome}</option>))}
                    </Select>
                  </Flex>

                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
                    {manuaisFiltrados.map(m => { 
                      const config = INFOS_MANUAL[m.categoria] || INFOS_MANUAL['OUTROS']; 
                      const temConteudo = (m.conteudo && m.conteudo.length > 5) || (m.dados_extras && Object.keys(m.dados_extras).length > 0); 
                      return (
                        <Card key={m.id} bg="white" shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.200" display="flex" flexDirection="column" _hover={{ transform: 'translateY(-4px)', shadow: 'md', borderColor: `${config.cor}.300` }} transition="all 0.2s">
                          <Box h="4px" w="full" bg={`${config.cor}.400`} borderTopRadius="xl" />
                          <CardBody p={5} display="flex" flexDirection="column" flex="1">
                            <Flex justify="space-between" align="start" mb={4}><Badge colorScheme={config.cor} borderRadius="md" px={2} py={0.5} fontSize="2xs" fontWeight="bold">{config.nome}</Badge><Icon as={config.icone} color={`${config.cor}.400`} boxSize={5} /></Flex>
                            <Heading size="sm" color="gray.800" mb={2} lineHeight="short">{m.titulo}</Heading>
                            <Text fontSize="xs" color="gray.500" mb={4} noOfLines={3} flex="1">{m.descricao || "Documentação técnica oficial."}</Text>
                            <Button w="full" size="sm" colorScheme={config.cor} variant="outline" leftIcon={temConteudo ? <ViewIcon /> : <DownloadIcon />} mt="auto" _hover={{ bg: `${config.cor}.50` }} onClick={(e) => { if(temConteudo) { e.preventDefault(); abrirMaterial(m); } else if(m.arquivo) { window.open(m.arquivo, '_blank'); }}}>
                              {temConteudo ? 'Ler Documento' : 'Baixar PDF'}
                            </Button>
                          </CardBody>
                        </Card>
                      ) 
                    })}
                    {manuaisFiltrados.length === 0 && (
                      <GridItem colSpan={{ base: 1, md: 2, lg: 3, xl: 4 }}>
                        <Flex direction="column" align="center" justify="center" h="200px" bg="white" borderRadius="xl" border="1px dashed" borderColor="gray.300">
                          <Icon as={InfoIcon} boxSize={8} color="gray.300" mb={3} />
                          <Text color="gray.500" fontWeight="bold">Nenhum documento encontrado.</Text>
                        </Flex>
                      </GridItem>
                    )}
                  </SimpleGrid>
              </Container>
          );
      }
      return null;
  };

  // ==============================================================================
  // RETORNO PRINCIPAL DO COMPONENTE E SEUS MODAIS
  // ==============================================================================
  return (
    <Box w="full" h="100%">
        {/* RENDERIZAÇÃO DA PÁGINA */}
        {renderConteudo()}

        {/* MODAL: IMPRESSÃO DO RECIBO */}
        <Modal isOpen={isPreparingPrint} isCentered closeOnOverlayClick={false}>
          <ModalOverlay backdropFilter="blur(5px)" bg="blackAlpha.600" />
          <ModalContent bg="transparent" boxShadow="none" textAlign="center" color="white">
            <VStack spacing={6}>
              <Spinner thickness='5px' speed='0.65s' emptyColor='gray.200' color='teal.400' size='xl' />
              <Box>
                <Heading size="md" mb={2}>Gerando Recibo Oficial</Heading>
                <Text color="gray.200">Preparando documento para impressão...</Text>
              </Box>
            </VStack>
          </ModalContent>
        </Modal>

        {/* MODAL: LEITOR DE MANUAIS / COMUNICADOS */}
        <Modal isOpen={modalLeitor.isOpen} onClose={modalLeitor.onClose} size="3xl" scrollBehavior="inside" isCentered>
          <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.700" />
          <ModalContent borderRadius="xl" overflow="hidden">
            <ModalHeader borderBottom="1px solid" borderColor="gray.100" bg="gray.50">
              <HStack mb={2}>
                <Badge colorScheme={materialSelecionado?.categoria?.startsWith('CORRETOR_') ? 'purple' : 'teal'}>
                  {INFOS_MANUAL[materialSelecionado?.categoria]?.nome || 'Leitura Nátiva'}
                </Badge>
              </HStack>
              <Heading size="md" color="gray.800" lineHeight="short">{materialSelecionado?.titulo}</Heading>
            </ModalHeader>
            <ModalCloseButton mt={2} />
            <ModalBody py={6} bg="white">
              <VStack align="stretch" spacing={6}>
                {materialSelecionado?.descricao && (
                  <Text fontSize="md" color="gray.600" fontStyle="italic" borderLeft="3px solid" borderColor="gray.300" pl={3}>{materialSelecionado.descricao}</Text>
                )}
                
                {/* RENDERIZAÇÃO CONDICIONAL BASEADA NO TIPO DE MATERIAL */}
                {materialSelecionado?.dados_extras && Object.keys(materialSelecionado.dados_extras).length > 0 && (
                  <Box>
                    {materialSelecionado.categoria === 'CORRETOR_REGUA' && materialSelecionado.dados_extras.regras && (
                      <Box bg="red.50" p={4} borderRadius="xl" border="1px solid" borderColor="red.100">
                        <Heading size="sm" color="red.800" mb={4} display="flex" alignItems="center" gap={2}><WarningTwoIcon /> Tabela de Penalizações</Heading>
                        <Box overflowX="auto" borderRadius="md" border="1px solid" borderColor="red.200">
                          <Table size="sm" variant="simple" bg="white">
                            <Thead bg="red.100"><Tr><Th w="15%">Comp.</Th><Th>Gatilho (Ação do Aluno)</Th><Th w="25%">Penalidade</Th></Tr></Thead>
                            <Tbody>
                              {materialSelecionado.dados_extras.regras.map((r, i) => (
                                <Tr key={i}><Td fontWeight="900" color="red.600">{r.comp}</Td><Td color="gray.700">{r.gatilho}</Td><Td fontWeight="bold" color="red.600">{r.desconto}</Td></Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </Box>
                      </Box>
                    )}
                    
                    {(materialSelecionado.categoria === 'CORRETOR_REPERTORIO' || materialSelecionado.categoria === 'ALUNO_REPERTORIO') && (
                      <Box bg="purple.50" p={5} borderRadius="xl" border="1px solid" borderColor="purple.100">
                        <Heading size="sm" color="purple.800" mb={4} display="flex" alignItems="center" gap={2}><CheckCircleIcon /> Estrutura do Repertório</Heading>
                        <SimpleGrid columns={2} spacing={4} mb={4}>
                          <Box bg="white" p={3} borderRadius="md" border="1px solid" borderColor="purple.200"><Text fontSize="2xs" fontWeight="900" color="purple.500" textTransform="uppercase">Eixo Temático</Text><Text fontWeight="bold" color="purple.900">{materialSelecionado.dados_extras.eixo || '-'}</Text></Box>
                          <Box bg="white" p={3} borderRadius="md" border="1px solid" borderColor="purple.200"><Text fontSize="2xs" fontWeight="900" color="purple.500" textTransform="uppercase">Tipo de Repertório</Text><Text fontWeight="bold" color="purple.900">{materialSelecionado.dados_extras.tipo || '-'}</Text></Box>
                        </SimpleGrid>
                        <Box bg="white" p={4} borderRadius="md" border="1px solid" borderColor="purple.200"><Text fontSize="2xs" fontWeight="900" color="purple.500" textTransform="uppercase" mb={2}>Aplicação na Redação</Text><Text fontSize="sm" color="gray.700" whiteSpace="pre-wrap" lineHeight="tall">{materialSelecionado.dados_extras.aplicacao || '-'}</Text></Box>
                      </Box>
                    )}
                    
                    {materialSelecionado.categoria === 'CORRETOR_DESVIOS' && (
                      <Box bg="orange.50" p={5} borderRadius="xl" border="1px solid" borderColor="orange.100">
                        <Heading size="sm" color="orange.800" mb={4} display="flex" alignItems="center" gap={2}><EditIcon /> Dicionário de Desvios</Heading>
                        <SimpleGrid columns={2} spacing={4}>
                          <Box bg="white" p={4} borderRadius="md" border="1px solid" borderColor="red.200" borderLeft="4px solid" borderLeftColor="red.500"><Text fontSize="2xs" fontWeight="900" color="red.500" textTransform="uppercase" mb={2}>Como o aluno erra</Text><Text fontWeight="bold" color="gray.700">"{materialSelecionado.dados_extras.ex_errado}"</Text></Box>
                          <Box bg="white" p={4} borderRadius="md" border="1px solid" borderColor="green.200" borderLeft="4px solid" borderLeftColor="green.500"><Text fontSize="2xs" fontWeight="900" color="green.500" textTransform="uppercase" mb={2}>Como deveria ser</Text><Text fontWeight="bold" color="gray.700">"{materialSelecionado.dados_extras.ex_correto}"</Text></Box>
                        </SimpleGrid>
                      </Box>
                    )}
                  </Box>
                )}
                
                {materialSelecionado?.conteudo && (
                  <Box bg="gray.50" p={5} borderRadius="xl" border="1px solid" borderColor="gray.200">
                    <Text whiteSpace="pre-wrap" fontSize="15px" lineHeight="1.8" color="gray.700">{materialSelecionado.conteudo}</Text>
                  </Box>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter bg="gray.100" borderTop="1px solid" borderColor="gray.200" justifyContent="space-between">
              {materialSelecionado?.arquivo ? (
                <Button as="a" href={materialSelecionado.arquivo} target="_blank" colorScheme="blue" variant="outline" leftIcon={<DownloadIcon />}>Baixar PDF Anexo</Button>
              ) : <Box />}
              <Button colorScheme="gray" bg="white" border="1px solid" borderColor="gray.300" onClick={modalLeitor.onClose}>Fechar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* MODAL: CRIAR OU EDITAR RESPOSTA RÁPIDA */}
        <Modal isOpen={modalCriarResposta.isOpen} onClose={modalCriarResposta.onClose} isCentered size="lg">
          <ModalOverlay backdropFilter="blur(3px)" />
          <ModalContent borderRadius="xl">
            <ModalHeader borderBottom="1px solid" borderColor="gray.100">
              {editandoRespostaId ? 'Editar Resposta Rápida' : 'Criar Resposta Rápida'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody py={6}>
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={2} spacing={4}>
                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold">Modelo de Redação</FormLabel>
                    <Select size="sm" value={novoModeloResp} onChange={e => setNovoModeloResp(e.target.value)}>
                      <option value="ENEM">ENEM</option>
                      <option value="SIMPLES">Simples</option>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="xs" fontWeight="bold">Competência</FormLabel>
                    <Select size="sm" value={novaCompResp} onChange={e => setNovaCompResp(parseInt(e.target.value))}>
                      {(novoModeloResp === 'ENEM' ? COMPETENCIAS_ENEM : COMPETENCIAS_SIMPLES).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </Select>
                  </FormControl>
                </SimpleGrid>
                <FormControl>
                  <FormLabel fontSize="xs" fontWeight="bold">Onde este texto será usado?</FormLabel>
                  <Select size="sm" value={novoContextoResp} onChange={e => setNovoContextoResp(e.target.value)}>
                    <option value="GERAL">No Comentário Final da Competência</option>
                    <option value="PIN">Em um Apontamento Específico (Pin na Imagem)</option>
                  </Select>
                </FormControl>
                
                {novoModeloResp === 'ENEM' && novaCompResp === 1 && novoContextoResp === 'PIN' && (
                    <FormControl isRequired>
                      <FormLabel fontSize="xs" fontWeight="bold" color="red.600">Qual o tipo de erro gramatical?</FormLabel>
                      <Select size="sm" placeholder="Selecione o erro específico..." value={novoTipoErroResp} onChange={e => setNovoTipoErroResp(e.target.value)} bg="red.50" borderColor="red.200">
                        {ERROS_GRAMATICA.map(erro => <option key={erro.value} value={erro.value}>{erro.label}</option>)}
                      </Select>
                    </FormControl>
                )}

                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">Título (Atalho)</FormLabel>
                  <Input size="sm" placeholder="Ex: Fuga Parcial ao Tema" value={novoTituloResp} onChange={e => setNovoTituloResp(e.target.value)} />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold">Texto Completo</FormLabel>
                  <Textarea size="sm" rows={4} placeholder="Escreva o texto detalhado que será colado na correção..." value={novoTextoResp} onChange={e => setNovoTextoResp(e.target.value)} />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter bg="gray.50" borderTopRadius="none" borderBottomRadius="xl">
              <Button variant="ghost" mr={3} onClick={modalCriarResposta.onClose}>Cancelar</Button>
              <Button colorScheme="teal" onClick={() => criarRespostaRapida('MODAL_CRIACAO')} isLoading={isCreatingResposta} leftIcon={<AddIcon />}>
                  {editandoRespostaId ? 'Salvar Edição' : 'Salvar Resposta'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* MODAL: SINALIZAR UM PROBLEMA PARA A COORDENAÇÃO */}
        <Modal isOpen={modalProblema.isOpen} onClose={modalProblema.onClose} isCentered size="md">
          <ModalOverlay backdropFilter="blur(4px)" />
          <ModalContent borderRadius="xl">
            <ModalHeader color="orange.600" display="flex" alignItems="center" gap={2}><WarningTwoIcon /> Sinalizar Problema</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Alert status="warning" borderRadius="md" fontSize="sm" alignItems="flex-start">
                  <AlertIcon mt={1} />
                  <Box>
                    <Text fontWeight="bold">Atenção!</Text>
                    <Text>Ao sinalizar, esta redação sairá da sua mesa e será enviada para a auditoria da coordenação. Se o problema for confirmado, a redação será anulada.</Text>
                  </Box>
                </Alert>
                <FormControl isRequired>
                  <FormLabel fontWeight="bold" fontSize="sm">Motivo da Recusa</FormLabel>
                  <Select bg="gray.50" value={motivoProblema} onChange={e => setMotivoProblema(e.target.value)} placeholder="Selecione o motivo exato...">
                    <option value="TEXTO_ILEGIVEL">Texto Ilegível</option>
                    <option value="FUGA_TEMA">Fuga Total ao Tema</option>
                    <option value="FUGA_GENERO">Fuga Total ao Gênero</option>
                    <option value="PLAGIO">Suspeita de Plágio</option>
                    <option value="COPIA">Cópia (Textos Motivadores)</option>
                    <option value="DESENHO">Desenho</option>
                    <option value="IMPROPERIO">Impropério</option>
                    <option value="OUTROS">Outros motivos</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontWeight="bold" fontSize="sm">Detalhes / Observação</FormLabel>
                  <Textarea bg="gray.50" value={obsProblema} onChange={e => setObsProblema(e.target.value)} rows={3} placeholder="Descreva o que encontrou para ajudar a coordenação na análise..." />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter bg="gray.50" borderTopRadius="none" borderBottomRadius="xl">
              <Button variant="ghost" mr={3} onClick={modalProblema.onClose}>Cancelar</Button>
              <Button colorScheme="orange" onClick={reportarProblemaReal} isLoading={enviandoProblema}>Enviar para Auditoria</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* MODAL: SALVAR OU EDITAR PIN (ALFINETE) */}
        <Modal isOpen={isOpen} onClose={() => { setCurrentBox(null); setEditingPinId(null); onClose(); }} size="sm" isCentered>
          <ModalOverlay />
          <ModalContent borderRadius="xl">
            <ModalHeader fontSize="md">{editingPinId ? 'Editar Apontamento' : 'Novo Apontamento'}</ModalHeader> 
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={3}>
                <Box w="full">
                  <Text fontSize="xs" fontWeight="bold" color="gray.500">COMPETÊNCIA</Text>
                  <Select size="sm" value={pinCompetencia} onChange={(e) => setPinCompetencia(parseInt(e.target.value))}>
                    {compsAtuais.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </Select>
                </Box>
                {pinCompetencia === 1 && (
                  <Box w="full">
                    <Text fontSize="xs" fontWeight="bold" color="gray.500">TIPO DE ERRO</Text>
                    <Select size="sm" placeholder="Selecione..." value={pinTipoErro} onChange={(e) => setPinTipoErro(e.target.value)}>
                      {ERROS_GRAMATICA.map(erro => <option key={erro.value} value={erro.value}>{erro.label}</option>)}
                    </Select>
                  </Box>
                )}
                <Box w="full">
                  <Flex justify="space-between" align="center" mb={1}>
                    <Text fontSize="xs" fontWeight="bold" color="gray.500">OBSERVAÇÃO</Text>
                    <Button size="xs" leftIcon={<Text fontSize="xs">⚡</Text>} onClick={() => { setQuickReplyComp(pinCompetencia); setQuickReplyContext('PIN'); modalRespostas.onOpen(); }} colorScheme="yellow" variant="ghost" h="20px">
                      Rápidas
                    </Button>
                  </Flex>
                  <Textarea size="sm" value={pinTexto} onChange={(e) => setPinTexto(e.target.value)} />
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button size="sm" variant="ghost" mr={3} onClick={() => { setCurrentBox(null); setEditingPinId(null); onClose(); }}>Cancelar</Button>
              <Button size="sm" colorScheme="blue" onClick={salvarPin}>Salvar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* MODAL: SELECIONAR RESPOSTA RÁPIDA DURANTE CORREÇÃO */}
        <Modal isOpen={modalRespostas.isOpen} onClose={modalRespostas.onClose} isCentered size="lg">
          <ModalOverlay />
          <ModalContent borderRadius="xl">
            <ModalHeader fontSize="md" borderBottom="1px solid #eee">
              ⚡ Usar Resposta: <Text as="span" color="teal.600">{compsAtuais.find(c => c.id === quickReplyComp)?.nome}</Text>
            </ModalHeader> 
            <ModalCloseButton />
            <ModalBody py={6}>
              {isLoadingRespostas ? <Spinner size="sm" /> : (
                <Flex wrap="wrap" gap={3} mb={6}>
                  {todasRespostas.filter(r => {
                      const matchBasico = r.competencia === quickReplyComp && r.contexto === quickReplyContext && r.modelo === (isSimplesMode ? 'SIMPLES' : 'ENEM');
                      if (!matchBasico) return false;
                      if (r.modelo === 'ENEM' && r.competencia === 1 && r.contexto === 'PIN') {
                          return r.tipo_erro === pinTipoErro;
                      }
                      return true;
                  }).length === 0 && <Text fontSize="xs" color="gray.400">Nenhuma resposta salva para esta competência e erro.</Text>}
                  
                  {todasRespostas.filter(r => {
                      const matchBasico = r.competencia === quickReplyComp && r.contexto === quickReplyContext && r.modelo === (isSimplesMode ? 'SIMPLES' : 'ENEM');
                      if (!matchBasico) return false;
                      if (r.modelo === 'ENEM' && r.competencia === 1 && r.contexto === 'PIN') {
                          return r.tipo_erro === pinTipoErro;
                      }
                      return true;
                  }).map((resp) => (
                    <Tooltip key={resp.id} label={resp.texto} hasArrow>
                      <Badge p={2} px={3} borderRadius="full" cursor="pointer" colorScheme="blue" variant="subtle" _hover={{ bg: 'blue.100', transform: 'scale(1.05)' }} onClick={() => { 
                          if (quickReplyContext === 'GERAL') {
                            setComentarios(prev => ({ ...prev, [quickReplyComp]: prev[quickReplyComp] ? prev[quickReplyComp] + '\n' + resp.texto : resp.texto })); 
                          } else {
                            setPinTexto(prev => prev ? prev + '\n' + resp.texto : resp.texto); 
                          }
                          modalRespostas.onClose(); 
                      }}>
                        {resp.titulo}
                      </Badge>
                    </Tooltip>
                  ))}
                </Flex>
              )}
              <Divider mb={4} /> 
              <Text fontSize="sm" fontWeight="bold" mb={3}>Criar Nova Aqui</Text>
              <VStack spacing={3}>
                <Input placeholder="Título curto" size="sm" value={novoTituloResp} onChange={(e) => setNovoTituloResp(e.target.value)} />
                <Textarea placeholder="Texto completo..." size="sm" rows={3} value={novoTextoResp} onChange={(e) => setNovoTextoResp(e.target.value)} />
                <Button leftIcon={<AddIcon />} size="sm" colorScheme="green" width="full" onClick={() => criarRespostaRapida('MODAL_DURANTE_CORRECAO')} isLoading={isCreatingResposta}>Salvar Atalho</Button>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* MODAL: MENSAGENS GENÉRICAS E CONFIRMAÇÕES */}
        <Modal isOpen={modalConfirmacao.isOpen} onClose={modalConfirmacao.onClose} isCentered size="sm">
          <ModalOverlay backdropFilter="blur(2px)" />
          <ModalContent borderRadius="xl">
            <ModalHeader>{confirmacaoConfig.titulo}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="center" py={2}>
                <WarningTwoIcon w={10} h={10} color={`${confirmacaoConfig.botaoCor}.400`} />
                <Text textAlign="center" color="gray.600">{confirmacaoConfig.mensagem}</Text>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={modalConfirmacao.onClose}>Cancelar</Button>
              <Button colorScheme={confirmacaoConfig.botaoCor} onClick={() => { if(confirmacaoConfig.acao) confirmacaoConfig.acao(); modalConfirmacao.onClose(); }}>
                {confirmacaoConfig.textoBotao}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* MODAL DE REDAÇÕES DO RECIBO */}
        <Modal isOpen={modalReciboOpen} onClose={() => setModalReciboOpen(false)} isCentered size="2xl" scrollBehavior="inside">
          <ModalOverlay backdropFilter="blur(3px)" />
          <ModalContent borderRadius="xl">
            <ModalHeader bg="teal.600" color="white" borderTopRadius="xl">
              Redações Pagas neste Recibo
            </ModalHeader>
            <ModalCloseButton color="white" mt={1} />
            <ModalBody py={6}>
              {reciboVisualizar && (
                <>
                  <Flex justify="space-between" mb={4} p={3} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200" wrap="wrap" gap={3}>
                    <Text fontWeight="bold" color="gray.600">Data do Pagamento: {new Date(reciboVisualizar.data_pagamento || reciboVisualizar.data_solicitacao).toLocaleDateString('pt-BR')}</Text>
                    <Text fontWeight="bold" color="green.600">Valor Total: R$ {parseFloat(reciboVisualizar.valor).toFixed(2).replace('.', ',')}</Text>
                  </Flex>
                  <Table variant="simple" size="sm">
                    <Thead bg="gray.100">
                      <Tr>
                        <Th>Data da Correção</Th>
                        <Th>Descrição</Th>
                        <Th isNumeric>Valor</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {carteira.transacoes?.filter(t => t.pagamento_id === reciboVisualizar.id).map(t => (
                        <Tr key={t.id}>
                          <Td>{new Date(t.data).toLocaleString('pt-BR')}</Td>
                          <Td fontWeight="medium">{t.descricao}</Td>
                          <Td isNumeric fontWeight="bold" color="green.500">R$ {parseFloat(t.valor).toFixed(2).replace('.', ',')}</Td>
                        </Tr>
                      ))}
                      {carteira.transacoes?.filter(t => t.pagamento_id === reciboVisualizar.id).length === 0 && (
                        <Tr><Td colSpan={3} textAlign="center" py={6} color="gray.500">As redações deste recibo são muito antigas e já foram arquivadas do extrato detalhado.</Td></Tr>
                      )}
                    </Tbody>
                  </Table>
                </>
              )}
            </ModalBody>
            <ModalFooter bg="gray.50" borderBottomRadius="xl">
              <Button colorScheme="teal" onClick={() => setModalReciboOpen(false)}>Fechar</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

    </Box>
  );
}

export default PainelCorretor;