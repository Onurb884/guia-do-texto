import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Heading, Text, VStack, HStack, Button, Icon, Box, 
  useToast, Flex, Badge, Input, Select, InputGroup, InputLeftElement, 
  Table, Thead, Tbody, Tr, Th, Td, Card, SimpleGrid, Stat, StatLabel, 
  StatNumber, Tooltip, useDisclosure, Modal, ModalOverlay, ModalContent, 
  ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel, 
  Divider, Tabs, TabList, TabPanels, Tab, TabPanel, IconButton,
  Alert, AlertIcon, Textarea, Image, Popover, PopoverTrigger, PopoverContent, 
  PopoverArrow, PopoverCloseButton, PopoverHeader, PopoverBody, Portal
} from '@chakra-ui/react';
import { 
  SearchIcon, WarningIcon, UnlockIcon, WarningTwoIcon, 
  StarIcon, ViewIcon, ArrowBackIcon, CheckCircleIcon, EditIcon, RepeatIcon
} from '@chakra-ui/icons';

const INFO_COMPETENCIAS_ENEM = { 
  1: { nome: "Gramática", cor: "red.500", bg: "red.50" }, 
  2: { nome: "Tema/Estrutura", cor: "blue.500", bg: "blue.50" }, 
  3: { nome: "Argumentação", cor: "orange.500", bg: "orange.50" }, 
  4: { nome: "Coesão", cor: "green.500", bg: "green.50" }, 
  5: { nome: "Proposta", cor: "purple.500", bg: "purple.50" } 
};

const INFO_COMPETENCIAS_SIMPLES = { 
  1: { nome: "Gramática", cor: "red.500", bg: "red.50" }, 
  2: { nome: "Estrutura e atendimento ao tema", cor: "blue.500", bg: "blue.50" }, 
  3: { nome: "Argumentação", cor: "yellow.500", bg: "yellow.50" }, 
  4: { nome: "Coesão e coerência", cor: "green.500", bg: "green.50" }, 
};

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

// MÁGICA DO SLA: Agora reconhece os VIPs e diminui a tolerância para 24h!
const getSLA = (r) => { 
    if (!r || !r.data_envio) return { cor: 'gray', texto: '--', badge: 'gray' };
    const data = new Date(r.data_envio);
    const agora = new Date();
    const diffHoras = (agora - data) / (1000 * 60 * 60);
    
    const isVip = r.is_urgente || r.vip_pago;
    
    // Regra Inteligente: VIPs estouram prazo em 24h. Normais em 72h.
    const limiteAtraso = isVip ? 24 : 72;
    const limiteAtencao = isVip ? 12 : 48;
    
    if (diffHoras <= limiteAtencao) return { cor: 'green', texto: 'No Prazo', badge: 'green' }; 
    if (diffHoras <= limiteAtraso) return { cor: 'orange', texto: 'Atenção', badge: 'orange' }; 
    return { cor: 'red', texto: 'Atrasado', badge: 'red' }; 
};

function TorreControle() {
  const toast = useToast();

  const [redacoes, setRedacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  
  const [filtroSLA, setFiltroSLA] = useState('TODOS');
  
  const [dataInicioFila, setDataInicioFila] = useState('');
  const [dataFimFila, setDataFimFila] = useState('');

  const [tabIndex, setTabIndex] = useState(0);

  const [paginaAtualFila, setPaginaAtualFila] = useState(1);
  const [itensPorPaginaFila, setItensPorPaginaFila] = useState(10);
  const [paginaAtualAuditoria, setPaginaAtualAuditoria] = useState(1);
  const [itensPorPaginaAuditoria, setItensPorPaginaAuditoria] = useState(10);
  const [paginaAtualQA, setPaginaAtualQA] = useState(1);
  const [itensPorPaginaQA, setItensPorPaginaQA] = useState(10);

  const modalAlerta = useDisclosure();
  const [idParaLiberar, setIdParaLiberar] = useState(null);

  const [redacaoAuditando, setRedacaoAuditoria] = useState(null);
  const [mensagemAluno, setMensagemAluno] = useState('');
  const [mensagemCorretor, setMensagemCorretor] = useState('');
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [hoveredPinViewId, setHoveredPinViewId] = useState(null);

  const carregarDados = async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try { 
      const res = await axios.get('http://127.0.0.1:8000/api/gestao/redacoes/', { 
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } 
      }); 
      setRedacoes(res.data); 
    } catch (e) {
      if(!silencioso) toast({ title: "Erro ao carregar fila", status: "error" });
    }
    if (!silencioso) setLoading(false);
  };

  useEffect(() => { 
    carregarDados(); 
    const interval = setInterval(() => { carregarDados(true); }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { 
    setPaginaAtualFila(1); 
  }, [busca, filtroStatus, filtroSLA, dataInicioFila, dataFimFila]);

  const abrirJulgamento = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://127.0.0.1:8000/api/redacao/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
      setRedacaoAuditoria(res.data); setMensagemAluno(''); setMensagemCorretor('');
    } catch (e) { toast({ title: 'Erro ao carregar os dados detalhados da redação.', status: 'error' }); }
  };

  const resolverAuditoria = async (acao) => {
    if (acao === 'DEVOLVER_ALUNO' && !mensagemAluno.trim()) return toast({ title: 'Atenção', description: 'Escreva um recado explicando o motivo para o aluno.', status: 'warning' });
    if ((acao === 'EXIGIR_REFACAO' || acao === 'VOLTAR_FILA') && !mensagemCorretor.trim()) return toast({ title: 'Atenção', description: 'Escreva a mensagem pedagógica para orientar o corretor.', status: 'warning' });

    setLoadingAudit(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://127.0.0.1:8000/api/auditoria/${redacaoAuditando.id}/resolver/`, { acao: acao, mensagem: acao === 'DEVOLVER_ALUNO' ? mensagemAluno : mensagemCorretor }, { headers: { Authorization: `Bearer ${token}` } });
      let msgSucesso = '';
      if(acao === 'VOLTAR_FILA') msgSucesso = 'Falso Positivo registrado. A redação voltou para o corretor.';
      if(acao === 'DEVOLVER_ALUNO') msgSucesso = 'Redação anulada e crédito devolvido ao aluno.';
      if(acao === 'EXIGIR_REFACAO') msgSucesso = 'Redação enviada de volta para o professor refazer as notas!';
      toast({ title: 'Resolvido!', description: msgSucesso, status: 'success' });
      setRedacaoAuditoria(null); carregarDados(); 
    } catch (e) { toast({ title: 'Erro ao aplicar o veredito.', status: 'error' }); }
    setLoadingAudit(false);
  };

  const confirmarLiberacao = (id) => { setIdParaLiberar(id); modalAlerta.onOpen(); };
  
  const forcarLiberacaoReal = async () => {
    try { 
      await axios.post(`http://127.0.0.1:8000/api/gestao/redacoes/${idParaLiberar}/liberar/`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
      carregarDados(true); toast({ title: "Redação devolvida para a fila com sucesso!", status: "success" }); 
    } catch (e) {}
    modalAlerta.onClose();
  };

  const toggleUrgencia = async (r) => {
    if(r.vip_pago) return; 
    try { 
      await axios.post(`http://127.0.0.1:8000/api/gestao/redacoes/${r.id}/urgencia/`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
      carregarDados(true); toast({ title: "Prioridade alterada!", status: "success" }); 
    } catch (e) {}
  };
  
  // ==============================================================================
  // CÁLCULOS DO DASHBOARD (OS 6 INDICADORES ALINHADOS À ESQUERDA)
  // ==============================================================================
  const statusConcluidos = ['CORRIGIDA', 'FINALIZADA', 'DEVOLVIDA', 'ANULADA'];

  const qtdAguardando = redacoes.filter(r => r.status === 'AGUARDANDO').length;
  const qtdEmCorrecao = redacoes.filter(r => r.status === 'EM_CORRECAO').length;
  const qtdCorrigidas = redacoes.filter(r => r.status === 'CORRIGIDA').length;
  const qtdDevolvidas = redacoes.filter(r => r.status === 'DEVOLVIDA' || r.status === 'ANULADA').length;
  
  // VIPs que ainda não foram terminados
  const qtdVips = redacoes.filter(r => (r.is_urgente || r.vip_pago) && !statusConcluidos.includes(r.status)).length;
  
  // Atrasados: Usa o nosso novo motor inteligente de SLA
  const qtdAtrasados = redacoes.filter(r => getSLA(r).badge === 'red' && !statusConcluidos.includes(r.status)).length;


  // ==============================================================================
  // FILTRAGEM E PAGINAÇÃO
  // ==============================================================================
  const listaFilaNormal = redacoes.filter(r => r.status !== 'AUDITORIA' && r.status !== 'EM_QA');
  const listaAuditoria = redacoes.filter(r => r.status === 'AUDITORIA');
  const listaQA = redacoes.filter(r => r.status === 'EM_QA');

  const redacoesFiltradas = listaFilaNormal.filter(r => {
    const termoBusca = busca.toLowerCase();
    const matchTexto = (r.tema_titulo || '').toLowerCase().includes(termoBusca) || 
                       (r.aluno_nome || '').toLowerCase().includes(termoBusca) || 
                       (r.corretor_nome || '').toLowerCase().includes(termoBusca) ||
                       r.id.toString() === busca;
                       
    const matchStatus = filtroStatus === 'TODOS' ? true : 
                        filtroStatus === 'DEVOLVIDA' ? (r.status === 'DEVOLVIDA' || r.status === 'ANULADA') :
                        r.status === filtroStatus;
    
    let matchData = true;
    if (dataInicioFila || dataFimFila) {
        const dataEnvio = new Date(r.data_envio);
        const dInicio = dataInicioFila ? new Date(dataInicioFila + 'T00:00:00') : new Date('2000-01-01');
        const dFim = dataFimFila ? new Date(dataFimFila + 'T23:59:59') : new Date('2100-01-01');
        matchData = dataEnvio >= dInicio && dataEnvio <= dFim;
    }

    let matchSLA = true;
    if (filtroSLA === 'VIP') matchSLA = r.vip_pago;
    if (filtroSLA === 'URGENTE') matchSLA = r.is_urgente;
    if (filtroSLA === 'ATRASADO') matchSLA = getSLA(r).badge === 'red';

    return matchTexto && matchStatus && matchData && matchSLA;
  });

  const idxUltimoFila = paginaAtualFila * itensPorPaginaFila; const idxPrimeiroFila = idxUltimoFila - itensPorPaginaFila;
  const filaPaginada = redacoesFiltradas.slice(idxPrimeiroFila, idxUltimoFila);

  const idxUltimoAuditoria = paginaAtualAuditoria * itensPorPaginaAuditoria; const idxPrimeiroAuditoria = idxUltimoAuditoria - itensPorPaginaAuditoria;
  const auditoriaPaginada = listaAuditoria.slice(idxPrimeiroAuditoria, idxUltimoAuditoria);

  const idxUltimoQA = paginaAtualQA * itensPorPaginaQA; const idxPrimeiroQA = idxUltimoQA - itensPorPaginaQA;
  const qaPaginada = listaQA.slice(idxPrimeiroQA, idxUltimoQA);

  // ==============================================================================
  // RENDERIZAÇÃO MODO 1: WORKSPACE DE JULGAMENTO (O RAIO-X)
  // ==============================================================================
  if (redacaoAuditando) {
    const isSimples = redacaoAuditando.tema_tipo?.toUpperCase() === 'SIMPLES' || redacaoAuditando.tipo?.toUpperCase() === 'SIMPLES';
    const temCorrecaoFeita = redacaoAuditando.correcao && redacaoAuditando.correcao.competencias && redacaoAuditando.correcao.competencias.length > 0;
    const isAnaliseQA = redacaoAuditando.status === 'EM_QA' || redacaoAuditando.status === 'CORRIGIDA'; 

    return (
      <Flex h="100vh" overflow="hidden" w="full" bg="gray.100">
        <Box flex="1" display="flex" flexDirection="column" bg="gray.200">
          <Flex w="full" h="90px" px={8} bg="white" shadow="sm" justify="space-between" align="center" borderBottom="1px solid" borderColor="gray.300" zIndex={10}>
            <Button leftIcon={<ArrowBackIcon />} onClick={() => setRedacaoAuditoria(null)} colorScheme="gray" variant="solid" shadow="sm">Voltar para a Torre</Button>
            <HStack spacing={4}>
              <Badge bg={isSimples ? 'blue.50' : 'green.50'} color={isSimples ? 'blue.700' : 'green.700'} px={4} py={2} borderRadius="md" fontSize="md">{redacaoAuditando.tema_tipo || redacaoAuditando.tipo || 'ENEM'}</Badge>
              <Badge colorScheme={isAnaliseQA ? "purple" : "orange"} fontSize="md" px={4} py={2} borderRadius="md" shadow="sm" display="flex" alignItems="center" gap={2}>
                {isAnaliseQA ? <><StarIcon /> Inspeção de Qualidade (QA)</> : <><WarningTwoIcon /> Julgamento de Triagem</>}
              </Badge>
            </HStack>
          </Flex>

          <Box flex="1" overflowY="auto" p={8} display="flex" justifyContent="center">
            <Box position="relative" display="inline-block" height="fit-content" boxShadow="dark-lg" bg="white" border="1px solid" borderColor="gray.300" borderRadius="sm" w={redacaoAuditando.texto ? "700px" : "full"} maxW={redacaoAuditando.texto ? "700px" : "900px"} flexShrink={redacaoAuditando.texto ? 0 : 1}>
              {redacaoAuditando.texto ? ( <Box p="8px 30px" whiteSpace="pre-wrap" fontFamily="Arial, sans-serif" fontSize="16px" lineHeight="40px" color="gray.800" minHeight="1216px" bgImage="linear-gradient(transparent 39px, #ccc 40px)" bgSize="100% 40px">{redacaoAuditando.texto}</Box> ) : ( <Image src={redacaoAuditando.arquivo} alt="Redação do Aluno" display="block" w="100%" h="auto" /> )}
              {redacaoAuditando.correcao?.anotacoes?.map((pin) => { 
                if(!pin.x) return null; const info = isSimples ? INFO_COMPETENCIAS_SIMPLES[pin.competencia] : INFO_COMPETENCIAS_ENEM[pin.competencia]; if(!info) return null; const isHovered = hoveredPinViewId === pin.id; 
                return (
                  <Box key={pin.id}>
                    <Box position="absolute" left={`${pin.x}%`} top={`${pin.y}%`} w={`${pin.width}%`} h={`${pin.height}%`} bg={info.cor} opacity={isHovered ? 0.4 : 0} pointerEvents="none" transition="opacity 0.2s" zIndex={4} />
                    <Popover trigger="hover" placement="top" openDelay={0} isLazy><PopoverTrigger><Box position="absolute" left={`calc(${pin.x}% + ${pin.width}% - 6px)`} top={`calc(${pin.y}% - 28px)`} cursor="pointer" zIndex={10} display="flex" alignItems="center" justifyContent="center" onMouseEnter={() => setHoveredPinViewId(pin.id)} onMouseLeave={() => setHoveredPinViewId(null)}><CustomPinSVG cor={info.cor} numero={pin.competencia} /></Box></PopoverTrigger><Portal><PopoverContent zIndex={9999} w="300px" boxShadow="2xl" borderRadius="2xl" overflow="hidden" border="1px solid" borderColor="gray.100" onMouseEnter={() => setHoveredPinViewId(pin.id)} onMouseLeave={() => setHoveredPinViewId(null)}><PopoverArrow bg={info.bg} /><PopoverHeader bg={info.bg} fontWeight="bold" color={info.cor} borderBottom="none" fontSize="sm">{pin.tipo_erro || info.nome}</PopoverHeader><PopoverBody fontSize="sm" bg="white">{pin.tipo_erro && pin.tipo_erro !== 'Geral' && <Badge colorScheme="red" mb={2}>{pin.tipo_erro}</Badge>}<Text color="gray.700">{pin.texto}</Text></PopoverBody></PopoverContent></Portal></Popover>
                  </Box>
                ); 
              })}
            </Box>
          </Box>
        </Box>

        <Box w="450px" bg="white" borderLeft="1px solid" borderColor="gray.300" display="flex" flexDirection="column" shadow="2xl" zIndex={10}>
          <Flex h="90px" px={6} direction="column" justify="center" borderBottom="1px solid" borderColor={isAnaliseQA ? "purple.200" : "orange.200"} bg={isAnaliseQA ? "purple.50" : "orange.50"}>
            <Heading size="md" color={isAnaliseQA ? "purple.700" : "orange.700"} mb={1}>{isAnaliseQA ? 'Controle de Qualidade' : 'Tribunal de Auditoria'}</Heading>
            <Text fontSize="sm" color={isAnaliseQA ? "purple.600" : "orange.600"}>{isAnaliseQA ? 'Inspecione as notas do corretor.' : 'Analise a triagem do corretor.'}</Text>
          </Flex>

          <Box flex="1" overflowY="auto" p={6}>
            <VStack align="stretch" spacing={6}>
              <Box bg="gray.50" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
                <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">Aluno</Text><Text fontWeight="bold" color="gray.800" mb={2}>{redacaoAuditando.aluno_nome}</Text>
                <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">Tema</Text><Text fontSize="sm" color="gray.700" fontWeight="bold">{redacaoAuditando.tema_titulo}</Text>
              </Box>

              {!isAnaliseQA && (
                <Alert status="error" variant="left-accent" borderRadius="md" flexDirection="column" alignItems="start" p={4} bg="red.50" border="1px solid" borderColor="red.100">
                  <HStack mb={2}><WarningIcon color="red.500" /><Text fontWeight="bold" fontSize="sm" color="red.800">Alerta Original (Motivo):</Text></HStack>
                  <Text fontSize="sm" color="red.700" w="full" fontStyle="italic" whiteSpace="pre-wrap">"{redacaoAuditando.correcao?.comentario_geral || 'Nenhum detalhe fornecido.'}"</Text>
                </Alert>
              )}

              {temCorrecaoFeita && (
                <Box>
                  <Flex justify="space-between" align="center" mb={3}><Heading size="sm" color="gray.700" textTransform="uppercase">Desempenho Atual</Heading><Badge colorScheme="green" fontSize="md" px={3} py={1} borderRadius="md">Total: {redacaoAuditando.correcao.nota_final} pts</Badge></Flex>
                  <VStack spacing={3} align="stretch" width="100%" mb={4}>
                    {redacaoAuditando.correcao.competencias.map((comp) => { 
                      const info = isSimples ? INFO_COMPETENCIAS_SIMPLES[comp.comp] : INFO_COMPETENCIAS_ENEM[comp.comp]; if(!info) return null; 
                      return (
                        <Box key={comp.comp} p={3} border="1px solid" borderColor="gray.200" borderRadius="md" bg="white">
                          <Flex justify="space-between" mb={1} align="center"><Badge bg={info.bg} color={info.cor} fontSize="2xs">Comp {comp.comp}</Badge><Text fontWeight="bold" fontSize="sm" color="gray.700">{comp.nota} pts</Text></Flex>
                          <Text fontSize="xs" fontWeight="bold" color="gray.800" mb={2}>{info.nome}</Text>
                          {comp.comentario && <Text fontSize="xs" color="gray.600" bg="gray.50" p={2} borderRadius="sm" fontStyle="italic" whiteSpace="pre-wrap">"{comp.comentario}"</Text>}
                        </Box>
                      ); 
                    })}
                  </VStack>
                </Box>
              )}

              <Divider borderColor="gray.300" />

              {isAnaliseQA ? (
                <Box p={4} border="1px solid" borderColor="purple.200" borderRadius="xl" bg="purple.50">
                  <HStack mb={2}><Icon as={EditIcon} color="purple.600" /><Text fontSize="sm" fontWeight="bold" color="purple.700">O Corretor Errou (Exigir Refação)</Text></HStack>
                  <Text fontSize="xs" color="purple.600" mb={3}>O corretor receberá um alerta para consertar as notas antes de ganhar por esta redação.</Text>
                  <Textarea size="sm" value={mensagemCorretor} onChange={(e) => setMensagemCorretor(e.target.value)} rows={4} bg="white" placeholder="Ex: Professor, você tirou 40pts na C1 mas o aluno não cometeu erro na linha 15..." mb={3} />
                  <Button w="full" colorScheme="purple" onClick={() => resolverAuditoria('EXIGIR_REFACAO')} isLoading={loadingAudit}>Devolver para Refação</Button>
                </Box>
              ) : (
                <VStack align="stretch" spacing={4}>
                  <Box p={4} border="1px solid" borderColor="gray.300" borderRadius="xl" bg="gray.100">
                    <HStack mb={2}><CheckCircleIcon color="gray.600" /><Text fontSize="sm" fontWeight="bold" color="gray.700">1. Falso Positivo (Mandá-lo Corrigir)</Text></HStack>
                    <Text fontSize="xs" color="gray.600" mb={3}>A redação está nítida. Devolva ao corretor orientando-o a corrigir o texto.</Text>
                    <Textarea size="sm" value={mensagemCorretor} onChange={(e) => setMensagemCorretor(e.target.value)} rows={3} bg="white" placeholder="Ex: Professor, a imagem tem sombra mas dá para ler. Prossiga com a correção." mb={3} />
                    <Button w="full" colorScheme="gray" bg="white" border="1px solid" borderColor="gray.300" onClick={() => resolverAuditoria('VOLTAR_FILA')} isLoading={loadingAudit}>Devolver ao Corretor</Button>
                  </Box>
                  <Box p={4} border="1px solid" borderColor="red.200" borderRadius="xl" bg="red.50">
                    <HStack mb={2}><WarningIcon color="red.600" /><Text fontSize="sm" fontWeight="bold" color="red.700">2. A redação é inválida (Anular)</Text></HStack>
                    <Text fontSize="xs" color="red.600" mb={3}>A redação é cancelada, e o aluno recebe o crédito de volta no sistema.</Text>
                    <Textarea size="sm" value={mensagemAluno} onChange={(e) => setMensagemAluno(e.target.value)} rows={3} bg="white" placeholder="Recado para o aluno. Ex: Texto ilegível, envie nova foto." mb={3} />
                    <Button w="full" colorScheme="red" onClick={() => resolverAuditoria('DEVOLVER_ALUNO')} isLoading={loadingAudit}>Anular e Estornar Crédito</Button>
                  </Box>
                </VStack>
              )}
            </VStack>
          </Box>
        </Box>
      </Flex>
    );
  }

  // ==============================================================================
  // RENDERIZAÇÃO MODO 2: DASHBOARD (TORRE DE CONTROLE)
  // ==============================================================================
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
            <Tab _selected={{ color: 'orange.700', bg: 'orange.50', borderBottom: '3px solid', borderColor: 'orange.500', fontWeight: 'bold' }}>🚩 Triagem/Problemas {listaAuditoria.length > 0 && <Badge ml={2} colorScheme="red" borderRadius="full">{listaAuditoria.length}</Badge>}</Tab>
            <Tab _selected={{ color: 'purple.700', bg: 'purple.50', borderBottom: '3px solid', borderColor: 'purple.500', fontWeight: 'bold' }}>💎 Controle de Qualidade (QA)</Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={0}>
              {/* NOVO: 6 CARDS ALINHADOS À ESQUERDA COM FONTE 1.875rem */}
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
                  <Box p={4} textAlign="left"><Stat><StatLabel fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">Devolvidas</StatLabel><StatNumber fontSize="1.875rem" color="red.600">{qtdDevolvidas}</StatNumber></Stat></Box>
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
                
                <Select w="140px" size="sm" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                  <option value="TODOS">Status: Todos</option>
                  <option value="AGUARDANDO">Aguardando</option>
                  <option value="EM_CORRECAO">Em Correção</option>
                  <option value="CORRIGIDA">Corrigidas</option>
                  <option value="REFAZER">Em Refação</option>
                  <option value="DEVOLVIDA">Devolvidas/Anuladas</option>
                </Select>
                
                <Divider orientation="vertical" h="20px" display={{ base: 'none', md: 'block' }} />
                
                <HStack spacing={2}>
                    <Text fontSize="xs" color="gray.500" fontWeight="medium">De:</Text>
                    <Input type="date" size="sm" w="120px" value={dataInicioFila} onChange={e => setDataInicioFila(e.target.value)} />
                    <Text fontSize="xs" color="gray.500" fontWeight="medium">Até:</Text>
                    <Input type="date" size="sm" w="120px" value={dataFimFila} onChange={e => setDataFimFila(e.target.value)} />
                </HStack>

                <Divider orientation="vertical" h="20px" display={{ base: 'none', md: 'block' }} />
                
                <Select w="140px" size="sm" value={filtroSLA} onChange={e => setFiltroSLA(e.target.value)}>
                  <option value="TODOS">SLA: Todos</option>
                  <option value="ATRASADO">🔴 Atrasados</option>
                  <option value="VIP">🟣 VIP Pago</option>
                  <option value="URGENTE">🟠 Urgente</option>
                </Select>

                {/* BOTÃO APENAS COM ÍCONE DE ATUALIZAR */}
                <IconButton aria-label="Atualizar" icon={<RepeatIcon />} colorScheme="teal" size="sm" onClick={() => carregarDados(false)} isLoading={loading} />
              </Flex>
              
              <Box bg="white" shadow="sm" borderRadius="lg" overflowX="auto" border="1px solid" borderColor="gray.200">
                <Table variant="simple" style={{ tableLayout: 'fixed', width: '100%' }}>
                  <Thead bg="gray.50"><Tr><Th w="8%" px={4}>Cód.</Th><Th w="32%" px={4}>Tema</Th><Th w="15%" px={3} textAlign="center">Status</Th><Th w="15%" px={3} textAlign="center">SLA / Envio</Th><Th w="15%" px={3} textAlign="center">Ações</Th></Tr></Thead>
                  <Tbody>
                    {filaPaginada.map(r => {
                      const isPaga = r.foi_pago === true || String(r.foi_pago).toLowerCase() === 'true';
                      const sla = getSLA(r); // <-- AGORA USA O GETSLA COM A REDAÇÃO INTEIRA
                      return (
                      <Tr key={r.id} _hover={{ bg: 'gray.50' }} bg={r.status === 'REFAZER' ? 'red.50' : ((r.is_urgente || r.vip_pago) ? 'purple.50' : 'transparent')}>
                        <Td fontWeight="bold" color="gray.700" px={4}>#{r.id}</Td>
                        <Td px={4} isTruncated title={r.tema_titulo}><Text fontWeight="bold" fontSize="sm" color="gray.800" isTruncated>{r.tema_titulo}</Text><Text fontSize="xs" color="gray.500">Aluno: <strong>{r.aluno_nome || "Desconhecido"}</strong></Text></Td>
                        <Td px={3} textAlign="center">
                          {r.status === 'REFAZER' ? (<Badge colorScheme="red" borderRadius="md" px={2} py={1} fontSize="xs">EM REFAÇÃO</Badge>) : (<Badge colorScheme={r.status === 'CORRIGIDA' ? 'green' : r.status === 'EM_CORRECAO' ? 'blue' : 'yellow'} borderRadius="md" px={2} py={1} fontSize="xs">{r.status.replace('_', ' ')}</Badge>)}
                          {r.corretor_atual && (r.status === 'EM_CORRECAO' || r.status === 'REFAZER' || r.status === 'CORRIGIDA') && (<Text fontSize="2xs" color="blue.600" mt={1} fontWeight="bold">Prof: {r.corretor_nome || `ID: ${r.corretor_atual}`}</Text>)}
                        </Td>
                        <Td px={3} textAlign="center">
                          <VStack spacing={1}>
                            <Badge colorScheme={sla.badge} borderRadius="md" px={2} fontSize="2xs">{sla.texto}</Badge>
                            <Text fontSize="xs" color="gray.600">{r.data_envio ? new Date(r.data_envio).toLocaleDateString('pt-BR') : '--'}</Text>
                            {r.vip_pago && <Badge colorScheme="purple" variant="solid" mt={1} fontSize="2xs"><StarIcon mr={1} mb={0.5}/> VIP PAGO</Badge>}
                            {!r.vip_pago && r.is_urgente && <Badge colorScheme="red" variant="solid" mt={1} fontSize="2xs"><WarningIcon mr={1}/> URGENTE</Badge>}
                          </VStack>
                        </Td>
                        <Td px={3} textAlign="center">
                          <HStack spacing={2} justify="center">
                            {r.status === 'CORRIGIDA' || r.status === 'EM_QA' ? (
                                isPaga ? (
                                    <Badge colorScheme="green" variant="solid" px={2} py={1.5} borderRadius="md" display="flex" alignItems="center"><CheckCircleIcon mr={1}/> PAGA (Encerrada)</Badge>
                                ) : (
                                    <Button size="sm" colorScheme="purple" leftIcon={<SearchIcon />} onClick={() => abrirJulgamento(r.id)} shadow="sm">{r.status === 'EM_QA' ? 'Inspecionar' : 'Auditar (QA)'}</Button>
                                )
                            ) : (
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

            {/* ABA 2: AUDITORIA (TRIAGEM DE PROBLEMAS DO CORRETOR) */}
            <TabPanel p={0}>
              <Card bg="orange.50" shadow="sm" borderRadius="lg" overflowX="auto" border="1px solid" borderColor="orange.200">
                <Table variant="simple">
                  <Thead bg="orange.100"><Tr><Th px={6} color="orange.800">Código / Tema</Th><Th px={4} textAlign="center" color="orange.800">Aluno</Th><Th px={4} textAlign="center" color="orange.800">Status</Th><Th px={6} textAlign="right" color="orange.800">Ação</Th></Tr></Thead>
                  <Tbody>
                    {auditoriaPaginada.map(r => (
                      <Tr key={r.id} _hover={{ bg: 'orange.100' }}>
                        <Td px={6}><Text fontWeight="bold" fontSize="sm" color="gray.800">#{r.id} - {r.tema_titulo}</Text><Text fontSize="xs" color="gray.500">Enviada em {new Date(r.data_envio).toLocaleDateString('pt-BR')}</Text></Td>
                        <Td px={4} textAlign="center"><Text fontWeight="medium" fontSize="sm">{r.aluno_nome}</Text></Td>
                        <Td px={4} textAlign="center"><Badge colorScheme="orange" variant="solid" borderRadius="md" px={2}><WarningTwoIcon mr={1}/> AGUARDANDO JULGAMENTO</Badge></Td>
                        <Td px={6} textAlign="right"><Button size="sm" colorScheme="orange" leftIcon={<ViewIcon />} onClick={() => abrirJulgamento(r.id)} shadow="sm">Julgar Erro</Button></Td>
                      </Tr>
                    ))}
                    {auditoriaPaginada.length === 0 && <Tr><Td colSpan={4} textAlign="center" py={10} color="gray.500">Nenhuma redação com problema reportado!</Td></Tr>}
                  </Tbody>
                </Table>
                {listaAuditoria.length > 0 && (
                  <Flex justify="space-between" align="center" p={4} bg="orange.100" borderTop="1px solid" borderColor="orange.200" wrap="wrap" gap={4}>
                    <HStack><Text fontSize="sm" color="orange.800">Mostrar</Text><Select size="sm" w="80px" bg="white" value={itensPorPaginaAuditoria} onChange={(e) => { setItensPorPaginaAuditoria(Number(e.target.value)); setPaginaAtualAuditoria(1); }}><option value={10}>10</option><option value={25}>25</option></Select></HStack>
                    <Text fontSize="sm" color="orange.800" fontWeight="bold">Total de registros encontrados: {listaAuditoria.length}</Text>
                    <HStack><Button size="sm" onClick={() => setPaginaAtualAuditoria(p => Math.max(1, p - 1))} isDisabled={paginaAtualAuditoria === 1} bg="white" shadow="sm">Anterior</Button><Text fontSize="sm" fontWeight="bold" px={2} color="orange.800">{paginaAtualAuditoria} / {Math.ceil(listaAuditoria.length / itensPorPaginaAuditoria)}</Text><Button size="sm" onClick={() => setPaginaAtualAuditoria(p => Math.min(Math.ceil(listaAuditoria.length / itensPorPaginaAuditoria), p + 1))} isDisabled={paginaAtualAuditoria === Math.ceil(listaAuditoria.length / itensPorPaginaAuditoria)} bg="white" shadow="sm">Próxima</Button></HStack>
                  </Flex>
                )}
              </Card>
            </TabPanel>

            {/* ABA 3: CONTROLE DE QUALIDADE (Amostragem QA 5% Automático) */}
            <TabPanel p={0}>
              <Card bg="purple.50" shadow="sm" borderRadius="lg" overflowX="auto" border="1px solid" borderColor="purple.200">
                <Table variant="simple">
                  <Thead bg="purple.100"><Tr><Th px={6} color="purple.800">Código / Tema</Th><Th px={4} textAlign="center" color="purple.800">Aluno</Th><Th px={4} textAlign="center" color="purple.800">Corretor</Th><Th px={6} textAlign="right" color="purple.800">Ação</Th></Tr></Thead>
                  <Tbody>
                    {qaPaginada.map(r => {
                      const isPaga = r.foi_pago === true || String(r.foi_pago).toLowerCase() === 'true';
                      return (
                      <Tr key={r.id} _hover={{ bg: 'purple.100' }}>
                        <Td px={6}><Text fontWeight="bold" fontSize="sm" color="gray.800">#{r.id} - {r.tema_titulo}</Text><Text fontSize="xs" color="gray.500">Corrigida em {new Date(r.data_envio).toLocaleDateString('pt-BR')}</Text></Td>
                        <Td px={4} textAlign="center"><Text fontWeight="medium" fontSize="sm">{r.aluno_nome}</Text></Td>
                        <Td px={4} textAlign="center"><Badge colorScheme="purple" variant="outline" borderRadius="md" px={2}>Prof: {r.corretor_nome || `ID: ${r.corretor_atual}`}</Badge></Td>
                        <Td px={6} textAlign="right">
                          {isPaga ? (
                             <Badge colorScheme="green" variant="solid" px={3} py={1.5} borderRadius="md"><CheckCircleIcon mr={1}/> PAGA (Encerrada)</Badge>
                          ) : (
                            <Button size="sm" colorScheme="purple" leftIcon={<SearchIcon />} onClick={() => abrirJulgamento(r.id)} shadow="sm">Inspecionar</Button>
                          )}
                        </Td>
                      </Tr>
                    )})}
                    {qaPaginada.length === 0 && <Tr><Td colSpan={4} textAlign="center" py={10} color="gray.500">A amostragem automática de qualidade está vazia.</Td></Tr>}
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