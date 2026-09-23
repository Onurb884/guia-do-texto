import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Box, Button, Flex, Card, CardBody, Badge, Select, Textarea, useToast, 
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, 
  ModalCloseButton, useDisclosure, Accordion, AccordionItem, AccordionButton, 
  AccordionPanel, IconButton, Tooltip, Icon, Popover, PopoverTrigger, 
  PopoverContent, PopoverArrow, PopoverCloseButton, PopoverHeader, PopoverBody, 
  Input, Divider, Spinner, SimpleGrid, Stat, StatLabel, StatNumber, InputGroup, 
  InputLeftElement, Switch, FormControl, FormLabel, Alert, AlertIcon, Table, 
  Thead, Tbody, Tr, Th, Td, Image, Portal, VStack, HStack, Heading, Text, Container 
} from '@chakra-ui/react';
import { 
  ViewIcon, ViewOffIcon, DeleteIcon, EditIcon, CopyIcon, AttachmentIcon, 
  DownloadIcon, CheckCircleIcon, WarningTwoIcon, ArrowBackIcon, StarIcon, 
  WarningIcon, CloseIcon, InfoIcon, ArrowUpIcon, SearchIcon, TimeIcon 
} from '@chakra-ui/icons';

const UserIcon = (props) => (<Icon viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></Icon>);
const CustomPinSVG = ({ cor, numero }) => (<Box position="relative" w="30px" h="30px" color={cor} filter="drop-shadow(0px 3px 3px rgba(0,0,0,0.2))" transition="transform 0.2s" _hover={{ transform: 'scale(1.15)' }}><Icon viewBox="0 0 24 24" w="100%" h="100%"><path fill="currentColor" d="M4 2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2z"/></Icon><Text position="absolute" top="4.5px" left="2px" w="100%" textAlign="center" color="white" fontSize="12px" fontWeight="900" fontFamily="system-ui">{numero}</Text></Box>);

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const formatarTexto = (texto) => { if (!texto) return ''; if (texto.includes('<p>') || texto.includes('<span')) return texto; return texto.replace(/\n/g, '<br />').replace(/\*(.*?)\*/g, '<strong>$1</strong>').replace(/_(.*?)_/g, '<em>$1</em>').replace(/~(.*?)~/g, '<u>$1</u>'); };

const ERROS_GRAMATICA = [{ label: 'Ortografia', value: 'ORTOGRAFIA' }, { label: 'Acentuação', value: 'ACENTUACAO' }, { label: 'Pontuação', value: 'PONTUACAO' }, { label: 'Concordância', value: 'CONCORDANCIA' }, { label: 'Regência', value: 'REGENCIA' }, { label: 'Crase', value: 'CRASE' }, { label: 'Colocação Pronominal', value: 'COLOCACAO_PRONOMINAL' }, { label: 'Translineação', value: 'TRANSLINEACAO' }, { label: 'Impropriedade Vocabular', value: 'IMPROPRIEDADE_VOCABULAR' }, { label: 'Outros', value: 'OUTROS' }];
const COMPETENCIAS_ENEM = [{ id: 1, nome: '1. Gramática', cor: 'red.500', erros: ERROS_GRAMATICA }, { id: 2, nome: '2. Tema/Estrutura/Repertório', cor: 'blue.500' }, { id: 3, nome: '3. Argumentação', cor: 'yellow.400' }, { id: 4, nome: '4. Coesão', cor: 'green.500' }, { id: 5, nome: '5. Proposta', cor: 'purple.500' }];
const COMPETENCIAS_SIMPLES = [{ id: 1, nome: '1. Gramática', cor: 'red.500', erros: ERROS_GRAMATICA }, { id: 2, nome: '2. Estrutura/Tema/Repertório', cor: 'blue.500' }, { id: 3, nome: '3. Argumentação', cor: 'yellow.400' }, { id: 4, nome: '4. Coesão e coerência', cor: 'green.500' }];
const NOTAS_ENEM = [0, 40, 80, 120, 160, 200]; const NOTAS_SIMPLES = [0, 5, 10, 15, 20, 25];

const AbaCorretorFila = ({ fila, carregarFila, usuario, carregarHistorico, carregarCarteira, configPlataforma, todasRespostas }) => {
    const toast = useToast();
    const [redacaoAtual, setRedacaoAtual] = useState(null);
    const [conteudoTexto, setConteudoTexto] = useState(null);
    const [notas, setNotas] = useState({});
    const [comentarios, setComentarios] = useState({});
    const [pins, setPins] = useState([]);
    const [mensagemRefacao, setMensagemRefacao] = useState(""); 
    
    const [filtroTexto, setFiltroTexto] = useState(""); 
    const [filtroTipo, setFiltroTipo] = useState("TODOS");
    const [somenteUrgentes, setSomenteUrgentes] = useState(false);
    const [paginaAtualFila, setPaginaAtualFila] = useState(1);
    const [itensPorPaginaFila, setItensPorPaginaFila] = useState(10);
    
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [hoveredPinId, setHoveredPinId] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState(null);
    const [currentBox, setCurrentBox] = useState(null);
    const [editingPinId, setEditingPinId] = useState(null); 
    const [tempoRestanteStr, setTempoRestanteStr] = useState('');
    const [loadingIA, setLoadingIA] = useState(false);
    
    const [mostrarPins, setMostrarPins] = useState(true); // ESTADO DO INTERRUPTOR DE PINS

    const [pinCompetencia, setPinCompetencia] = useState(1);
    const [pinTipoErro, setPinTipoErro] = useState('');
    const [pinTexto, setPinTexto] = useState('');

    const [quickReplyContext, setQuickReplyContext] = useState('GERAL');
    const [quickReplyComp, setQuickReplyComp] = useState(1);

    const [isFalhaGrave, setIsFalhaGrave] = useState(false);
    const [motivoProblema, setMotivoProblema] = useState('');
    const [obsProblema, setObsProblema] = useState('');
    const [enviandoProblema, setEnviandoProblema] = useState(false);

    const { isOpen, onOpen, onClose } = useDisclosure(); 
    const modalConfirmacao = useDisclosure();
    const modalProblema = useDisclosure();
    const modalRespostas = useDisclosure();
    const modalProposta = useDisclosure(); 
    
    const [confirmacaoConfig, setConfirmacaoConfig] = useState({ titulo: '', mensagem: '', acao: null, botaoCor: 'blue', textoBotao: 'Confirmar' });

    const imageContainerRef = useRef(null);

    const isSimplesMode = redacaoAtual?.tema_tipo?.toUpperCase() === 'SIMPLES' || redacaoAtual?.tipo?.toUpperCase() === 'SIMPLES';
    const compsAtuais = isSimplesMode ? COMPETENCIAS_SIMPLES : COMPETENCIAS_ENEM;
    const notasPossiveisAtuais = isSimplesMode ? NOTAS_SIMPLES : NOTAS_ENEM;

    const motivadoresAtuais = redacaoAtual?.tema_completo?.motivadores || redacaoAtual?.motivadores || redacaoAtual?.tema_motivadores || [];
    const descricaoProposta = redacaoAtual?.tema_completo?.descricao || redacaoAtual?.tema_descricao || '';

    const getImagemUrl = (caminho) => {
        if (!caminho) return '';
        if (typeof caminho !== 'string') return '';
        return caminho.startsWith('http') ? caminho : `http://127.0.0.1:8000${caminho}`;
    };

    useEffect(() => {
        if (!redacaoAtual) return;
        const endTime = localStorage.getItem('correcao_endtime');
        if (!endTime) return;
        const updateTimer = () => {
            const now = Date.now(); const diff = parseInt(endTime) - now;
            if (diff <= 0) {
                setTempoRestanteStr('00:00'); toast({ title: 'Tempo Esgotado!', status: 'error', duration: 7000 });
                localStorage.removeItem('redacao_em_andamento'); localStorage.removeItem('correcao_endtime'); setRedacaoAtual(null); carregarFila(); return true; 
            } else {
                const m = Math.floor(diff / 60000).toString().padStart(2, '0'); const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
                setTempoRestanteStr(`${m}:${s}`); return false;
            }
        };
        if (updateTimer()) return;
        const interval = setInterval(() => { if (updateTimer()) clearInterval(interval); }, 1000);
        return () => clearInterval(interval);
    }, [redacaoAtual]);

    const abrirConfirmacao = (t, m, a, c = 'blue', tb = 'Sim') => { setConfirmacaoConfig({ titulo: t, mensagem: m, acao: a, botaoCor: c, textoBotao: tb }); modalConfirmacao.onOpen(); };

    const pegarRedacao = async (id) => { 
        const token = localStorage.getItem('token'); 
        const idClicado = id.toString();
        const redacaoPresa = fila.find(r => (r.status === 'EM_CORRECAO' || r.status === 'REFAZER') && r.corretor_atual === usuario.id);

        if (redacaoPresa && redacaoPresa.id.toString() !== idClicado) {
            abrirConfirmacao(
                "Atenção: Redação Aberta!", 
                `O servidor indica que você já iniciou a correção da redação #${redacaoPresa.id}. Conclua ou devolva a redação #${redacaoPresa.id} antes de puxar uma nova da fila.`, 
                () => { localStorage.setItem('redacao_em_andamento', redacaoPresa.id); carregarDadosRedacao(redacaoPresa.id, token); }, 
                "orange", "Retornar à Redação"
            );
            return; 
        }

        localStorage.removeItem('redacao_em_andamento'); 
        localStorage.removeItem('correcao_endtime');

        try { 
            const r = await axios.post(`http://127.0.0.1:8000/api/corrigir/${id}/iniciar/`, {}, { headers: { Authorization: `Bearer ${token}` } }); 
            localStorage.setItem('correcao_endtime', Date.now() + ((r.data.minutos_limite || 40) * 60 * 1000)); 
            localStorage.setItem('redacao_em_andamento', idClicado); 
            carregarDadosRedacao(idClicado, token); 
        } catch (error) { toast({ title: 'Atenção', description: error.response?.data?.erro || "Erro ao abrir.", status: 'warning' }); carregarFila(); } 
    };

    const carregarDadosRedacao = async (id, token) => { 
        try { 
            const response = await axios.get(`http://127.0.0.1:8000/api/redacao/${id}/`, { headers: { Authorization: `Bearer ${token}` } }); 
            const redData = response.data; 
            if (redData.status !== 'EM_CORRECAO' && redData.status !== 'REFAZER') { toast({ title: "Indisponível", status: "warning" }); localStorage.removeItem('redacao_em_andamento'); localStorage.removeItem('correcao_endtime'); setRedacaoAtual(null); carregarFila(); return; } 
            
            try {
                const temaId = redData.tema || redData.tema_id || (redData.tema_obj && redData.tema_obj.id);
                if (temaId) {
                    const temaRes = await axios.get(`http://127.0.0.1:8000/api/temas/${temaId}/`, { headers: { Authorization: `Bearer ${token}` } });
                    redData.tema_completo = temaRes.data;
                }
            } catch (e) { console.log('Aviso: Não foi possível carregar os textos motivadores diretamente do tema.'); }

            setRedacaoAtual(redData); 
            if (redData.texto && redData.texto.trim() !== '') { setConteudoTexto(redData.texto); } else if (redData.arquivo && redData.arquivo.endsWith('.txt')) { const textResponse = await axios.get(redData.arquivo); setConteudoTexto(textResponse.data); } else { setConteudoTexto(null); } 
            
            const isSimples = redData.tema_tipo?.toUpperCase() === 'SIMPLES' || redData.tipo?.toUpperCase() === 'SIMPLES'; 
            let newNotas = isSimples ? { 1: 0, 2: 0, 3: 0, 4: 0 } : { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            let newComents = isSimples ? { 1: '', 2: '', 3: '', 4: '' } : { 1: '', 2: '', 3: '', 4: '', 5: '' };
            let newPins = []; let alertaCoord = "";

            if (redData.correcao && redData.correcao.competencias) {
                redData.correcao.competencias.forEach(c => { newNotas[c.comp] = c.nota; newComents[c.comp] = c.comentario || ''; });
                newPins = (redData.correcao.anotacoes || []).map(a => ({ id: a.id || Date.now() + Math.random(), x: a.x, y: a.y, width: a.width, height: a.height, competencia: a.competencia, tipo_erro: a.tipo_erro, texto: a.texto }));
                const match = redData.correcao.comentario_geral?.match(/\[ALERTA_COORDENACAO\]([\s\S]*?)\[\/ALERTA_COORDENACAO\]/);
                if (match) alertaCoord = match[1].trim();
            }
            setNotas(newNotas); setComentarios(newComents); setPins(newPins); setMensagemRefacao(alertaCoord); localStorage.setItem('redacao_em_andamento', id); 
        } catch (e) { toast({ title: 'Erro ao baixar redação', status: 'error' }); } 
    };

    const finalizarCorrecaoReal = async () => { 
        const payload = { redacao_id: redacaoAtual.id, nota_final: Object.values(notas).reduce((a,b)=>a+b,0), notas: notas, comentarios: comentarios, anotacoes: pins.map(p => ({ competencia: p.competencia, x: p.x, y: p.y, width: p.width, height: p.height, tipo_erro: p.tipo_erro || 'Geral', texto: p.texto || "" })) }; 
        try { 
            await axios.post('http://127.0.0.1:8000/api/corrigir/', payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
            toast({ title: 'Sucesso! 🚀', description: 'Correção finalizada.', status: 'success' }); 
            localStorage.removeItem('redacao_em_andamento'); localStorage.removeItem('correcao_endtime'); setRedacaoAtual(null); carregarFila(); carregarHistorico(); carregarCarteira(); 
        } catch (e) { toast({ title: 'Erro', description: e.response?.data?.erro, status: 'error' }); } 
    };

    const handleFinalizarClick = () => {
        const competenciasFaltandoPins = compsAtuais.filter(comp => !pins.some(p => p.competencia === comp.id));
        if (competenciasFaltandoPins.length > 0) {
            const nomesFaltando = competenciasFaltandoPins.map(c => c.nome.split('.')[0]).join(', '); 
            return toast({ title: 'Marcações Incompletas', description: `Faça pelo menos uma marcação (pin) nas competências: ${nomesFaltando}.`, status: 'warning', duration: 6000, isClosable: true });
        }
        for (let i = 0; i < compsAtuais.length; i++) {
            const comp = compsAtuais[i];
            const coment = comentarios[comp.id] || '';
            if (coment.trim().length < 5) {
                return toast({ title: `Comentário Ausente`, description: `Justifique a nota da ${comp.nome}.`, status: 'warning', duration: 6000, isClosable: true });
            }
        }
        abrirConfirmacao("Finalizar Correção", `As justificativas e marcações foram validadas. Confirma o envio final?`, finalizarCorrecaoReal, "green", "Enviar");
    };

    const liberarRedacaoReal = async () => { 
        try { 
            await axios.post(`http://127.0.0.1:8000/api/corrigir/${redacaoAtual.id}/liberar/`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
            toast({ title: 'Redação devolvida.', status: 'info' }); 
            localStorage.removeItem('redacao_em_andamento'); localStorage.removeItem('correcao_endtime'); setRedacaoAtual(null); carregarFila(); 
        } catch (error) {} 
    };
    const sairDaCorrecao = () => { localStorage.removeItem('redacao_em_andamento'); localStorage.removeItem('correcao_endtime'); setRedacaoAtual(null); carregarFila(); };

    const gerarCorrecaoIA = async (tentativa = 1) => { 
        setLoadingIA(true); 
        try { 
          const res = await axios.post(`http://127.0.0.1:8000/api/corrigir/${redacaoAtual.id}/ia/`, { texto: conteudoTexto || '', tema: redacaoAtual.tema_titulo, tipo: redacaoAtual.tema_tipo || redacaoAtual.tipo || 'ENEM' }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
          const dados = res.data;
          let novasNotas = { ...notas }; let novosComentarios = { ...comentarios };
          if (dados.competencias && Array.isArray(dados.competencias)) { dados.competencias.forEach(c => { novasNotas[c.comp] = c.nota; novosComentarios[c.comp] = c.comentario || ''; }); } else if (dados.notas && dados.comentarios) { novasNotas = dados.notas; novosComentarios = dados.comentarios; }
          setNotas(novasNotas); setComentarios(novosComentarios); toast({ title: 'Mágica feita! ✨', status: 'success' }); setLoadingIA(false);
        } catch(e) { 
          if (e.response && e.response.status === 503 && tentativa <= 3) { toast({ title: `IA Ocupada (Tentativa ${tentativa}/3)`, description: "Tentando novamente...", status: 'info', duration: 2500 }); setTimeout(() => gerarCorrecaoIA(tentativa + 1), 3000);
          } else { toast({ title: 'Erro na IA', description: e.response?.data?.erro || "Muitos professores usando simultaneamente.", status: 'error' }); setLoadingIA(false); }
        } 
    };

    const abrirModalProblema = (ehFalhaGrave) => { setIsFalhaGrave(ehFalhaGrave); setMotivoProblema(''); setObsProblema(''); modalProblema.onOpen(); };

    const reportarProblemaReal = async () => { 
        if (!motivoProblema) return toast({ title: 'Selecione um motivo!', status: 'warning' }); 
        setEnviandoProblema(true); 
        try { 
            await axios.post(`http://127.0.0.1:8000/api/corrigir/${redacaoAtual.id}/problema/`, { tipo_problema: isFalhaGrave ? 'FALHA_GRAVE' : 'TRIAGEM', motivo: motivoProblema, observacao: obsProblema }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
            if (isFalhaGrave) { toast({ title: 'Falha Grave Sinalizada!', description: 'Enviada para auditoria pedagógica.', status: 'success' }); } else { toast({ title: 'Problema Sinalizado!', description: 'Enviada para triagem técnica.', status: 'info' }); }
            localStorage.removeItem('redacao_em_andamento'); localStorage.removeItem('correcao_endtime'); setRedacaoAtual(null); modalProblema.onClose(); carregarFila(); carregarCarteira(); carregarHistorico();
        } catch (e) { toast({ title: 'Erro ao sinalizar', status: 'error'}); } 
        setEnviandoProblema(false); 
    };

    const getCoords = (e) => { if (!imageContainerRef.current) return { x: 0, y: 0 }; const r = imageContainerRef.current.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }; };
    const handleMouseDown = (e) => { if (e.target.closest('.chakra-popover__popper') || e.target.closest('.pin-trigger')) return; e.preventDefault(); const c = getCoords(e); setStartPoint(c); setIsDrawing(true); setCurrentBox({ x: c.x, y: c.y, width: 0, height: 0 }); };
    const handleMouseMove = (e) => { if (!isDrawing || !startPoint) return; const c = getCoords(e); setCurrentBox({ x: Math.min(startPoint.x, c.x), y: Math.min(startPoint.y, c.y), width: Math.abs(c.x - startPoint.x), height: Math.abs(c.y - startPoint.y) }); };
    const handleMouseUp = () => { if (!isDrawing) return; setIsDrawing(false); if (currentBox.width < 1 || currentBox.height < 1) { setCurrentBox({ ...currentBox, width: 4, height: 2 }); } setEditingPinId(null); setPinCompetencia(1); setPinTipoErro(''); setPinTexto(''); onOpen(); };
    const handleEditPin = (pin) => { setEditingPinId(pin.id); setPinCompetencia(pin.competencia); setPinTipoErro(pin.tipo_erro || ''); setPinTexto(pin.texto || ''); setCurrentBox(null); onOpen(); };
    const salvarPin = () => { if (pinCompetencia === 1 && !pinTipoErro) return toast({ title: 'Selecione o erro', status: 'warning' }); const novoPin = editingPinId ? { ...pins.find(p => p.id === editingPinId), competencia: parseInt(pinCompetencia), tipo_erro: pinTipoErro, texto: pinTexto } : { id: Date.now(), ...currentBox, competencia: parseInt(pinCompetencia), tipo_erro: pinTipoErro, texto: pinTexto }; setPins(editingPinId ? pins.map(p => p.id === editingPinId ? novoPin : p) : [...pins, novoPin]); setEditingPinId(null); setCurrentBox(null); onClose(); };
    const removerPin = (id) => { setPins(pins.filter(p => p.id !== id)); setHoveredPinId(null); };

    const getPinTitle = (pin) => {
        if (pin.competencia === 1 && pin.tipo_erro && pin.tipo_erro !== 'Geral') { return `Competência 1 - ${pin.tipo_erro}`; }
        return `Competência ${pin.competencia}`;
    };

    if (redacaoAtual) {
        const isAcabando = tempoRestanteStr && parseInt(tempoRestanteStr.split(':')[0]) < 5;
        return (
          <Flex h="100vh" overflow="hidden" w="full" bg="white">
              <Box flex="1" bg="gray.100" overflow="auto" p={4} display="flex" flexDirection="column" alignItems="center" minH="100%">
                  <Flex justify="space-between" align="center" mb={4} w="full" maxW="1000px">{redacaoAtual.status === 'REFAZER' ? (<Button leftIcon={<ArrowBackIcon />} onClick={sairDaCorrecao} colorScheme="teal" variant="ghost" size="sm">Voltar para a Fila</Button>) : ( <Box /> )}</Flex>
                  {mensagemRefacao && (<Alert status="error" variant="left-accent" mb={4} borderRadius="md" w="full" maxW="1000px" shadow="sm" flexShrink={0} alignItems="flex-start"><AlertIcon mt={1} /><Box w="full"><Text fontWeight="bold" color="red.800">Atenção: Ajuste solicitado!</Text><Text fontSize="sm" color="red.700" mt={1} whiteSpace="pre-wrap">"{mensagemRefacao}"</Text></Box></Alert>)}
                  
                  <Box w="full" maxW="1000px" bg="white" p={5} mb={4} borderRadius="xl" boxShadow="sm" borderLeft="4px solid" borderColor={isSimplesMode ? "blue.500" : "green.500"} flexShrink={0}>
                      <Flex justify="space-between" align="flex-end" wrap="wrap" gap={4}>
                          <VStack align="start" spacing={3} w="full">
                              <HStack spacing={2} align="center"><UserIcon color="teal.500" boxSize={5} /><Text fontSize="lg" fontWeight="900" color="gray.700" textTransform="uppercase">{redacaoAtual.aluno_nome}</Text></HStack>
                              <Box><Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase" mb={0.5}>Tema da Redação</Text><Text fontSize="18px" fontWeight="bold" color="gray.800" lineHeight="short">{redacaoAtual.tema_titulo}</Text></Box>
                              
                              <Flex justify="space-between" align="center" w="full" wrap="nowrap" gap={3}>
                                  <HStack spacing={4}>
                                      {tempoRestanteStr && (<Badge colorScheme={isAcabando ? "red" : "orange"} px={3} py={1.5} borderRadius="md" fontSize="md" display="flex" alignItems="center" gap={2} animation={isAcabando ? "pulse 1.5s infinite" : "none"}><TimeIcon /> {tempoRestanteStr}</Badge>)}
                                      <Badge bg={isSimplesMode ? 'blue.50' : 'green.50'} color={isSimplesMode ? 'blue.700' : 'green.700'} px={4} py={1.5} borderRadius="md" fontSize="md" fontWeight="bold" letterSpacing="wider">{redacaoAtual.tema_tipo || redacaoAtual.tipo || 'ENEM'}</Badge>
                                  </HStack>
                                  <HStack spacing={3}>
                                      {/* BOTÃO OCULTAR PINS - AGORA AQUI */}
                                      <Button size="sm" onClick={() => setMostrarPins(!mostrarPins)} leftIcon={<Icon as={mostrarPins ? ViewOffIcon : ViewIcon} />} colorScheme="gray" variant="outline" bg="white" shadow="sm">
                                          {mostrarPins ? "Ocultar Marcações" : "Mostrar Marcações"}
                                      </Button>
                                      <Button size="sm" colorScheme="blue" variant="outline" leftIcon={<InfoIcon />} onClick={modalProposta.onOpen} shadow="sm">Ver Proposta</Button>
                                  </HStack>
                              </Flex>
                          </VStack>
                      </Flex>
                  </Box>

                  <Box position="relative" display="inline-block" height="fit-content" ref={imageContainerRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} cursor="crosshair" boxShadow="2xl" userSelect="none" border="1px solid #ddd" bg="white" w={conteudoTexto ? "700px" : "full"} maxW={conteudoTexto ? "700px" : "900px"} flexShrink={conteudoTexto ? 0 : 1}>
                      {conteudoTexto ? ( 
                          <Box p="0" position="relative" minHeight="1216px" bgImage="linear-gradient(transparent 39px, #ccc 40px)" bgSize="100% 40px">
                              <Box position="absolute" left={0} top={0} bottom={0} w="40px" borderRight="1px solid #ccc" bg="gray.50" pt="8px" pointerEvents="none" zIndex={2}>
                                  {Array.from({length: 30}).map((_, i) => (
                                      <Text key={i} h="40px" lineHeight="40px" textAlign="center" fontSize="12px" color="gray.400" fontWeight="bold" m={0} p={0}>{i + 1}</Text>
                                  ))}
                              </Box>
                              <Box pl="55px" pr="20px" pt="8px" pb="8px" whiteSpace="pre-wrap" fontFamily="Arial, sans-serif" fontSize="16px" lineHeight="40px" color="gray.800">
                                  {conteudoTexto}
                              </Box>
                          </Box>
                      ) : ( <Image src={getImagemUrl(redacaoAtual.arquivo)} alt="Redação" display="block" w="100%" h="auto" /> )}
                      
                      {currentBox && (<Box position="absolute" left={`${currentBox.x}%`} top={`${currentBox.y}%`} w={`${currentBox.width}%`} h={`${currentBox.height}%`} border="2px dashed teal" bg="rgba(0, 128, 128, 0.2)" zIndex={5} />)}
                      
                      {mostrarPins && pins.map((pin) => { 
                          const config = compsAtuais.find(c => c.id === pin.competencia); 
                          const isHovered = hoveredPinId === pin.id; 
                          return (
                          <Box key={pin.id}>
                              <Box position="absolute" left={`${pin.x}%`} top={`${pin.y}%`} w={`${pin.width}%`} h={`${pin.height}%`} bg={config.cor} opacity={isHovered ? 0.4 : 0} transition="opacity 0.2s" pointerEvents="none" zIndex={4} />
                              <Popover placement="top" isLazy>
                                  <PopoverTrigger><Box className="pin-trigger" position="absolute" left={`calc(${pin.x}% + ${pin.width}% - 6px)`} top={`calc(${pin.y}% - 28px)`} cursor="pointer" zIndex={10} display="flex" alignItems="center" justifyContent="center" onMouseEnter={() => setHoveredPinId(pin.id)} onMouseLeave={() => setHoveredPinId(null)}><CustomPinSVG cor={config.cor} numero={pin.competencia} /></Box></PopoverTrigger>
                                  <Portal>
                                      <PopoverContent zIndex={9999} width="280px" boxShadow="xl" onMouseEnter={() => setHoveredPinId(pin.id)} onMouseLeave={() => setHoveredPinId(null)}>
                                          <PopoverArrow /> <PopoverCloseButton /> 
                                          <PopoverHeader fontWeight="bold" fontSize="sm">{getPinTitle(pin)}</PopoverHeader>
                                          <PopoverBody><Text fontSize="sm" mb={3} noOfLines={3}>{pin.texto || "Sem observações."}</Text><HStack spacing={2}><Button size="xs" colorScheme="blue" variant="outline" leftIcon={<EditIcon />} width="50%" onClick={() => handleEditPin(pin)}>Editar</Button><Button size="xs" colorScheme="red" variant="outline" leftIcon={<DeleteIcon />} width="50%" onClick={() => removerPin(pin.id)}>Excluir</Button></HStack></PopoverBody>
                                      </PopoverContent>
                                  </Portal>
                              </Popover>
                          </Box>); 
                      })}
                  </Box>
                  <Box h="100px" />
              </Box>

              <Box w={sidebarOpen ? "360px" : "0px"} transition="width 0.3s" bg="gray.50" borderLeft="1px solid #ccc" display="flex" flexDirection="column" position="relative">
                  <Box as="button" onClick={() => setSidebarOpen(!sidebarOpen)} position="absolute" left="-40px" top="20px" bg="teal.600" w="40px" h="50px" borderLeftRadius="xl" boxShadow="-4px 0 10px rgba(0,0,0,0.1)" display="flex" alignItems="center" justifyContent="center" zIndex="20" _hover={{ bg: 'teal.700', transform: 'scale(1.05)' }} transition="all 0.2s"><Icon as={sidebarOpen ? ViewOffIcon : ViewIcon} color="white" w={5} h={5} /></Box>
                  <Box display={sidebarOpen ? "flex" : "none"} flexDirection="column" h="100%">
                      <Box p={4} mx={3} mt={4} bg="white" borderRadius="lg" boxShadow="sm" border="1px solid" borderColor="gray.100">
                          <Flex justify="space-between" align="center" mb={4}><Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase">Nota Parcial</Text><Badge fontSize="2xl" colorScheme={Object.values(notas).reduce((a,b)=>a+b,0) >= (isSimplesMode ? 90 : 900) ? "green" : "teal"} variant="solid" borderRadius="md" px={3}>{Object.values(notas).reduce((a,b)=>a+b,0)}</Badge></Flex>
                          
                          <HStack spacing={2} w="full">
                              <Tooltip label="Falha Grave" hasArrow placement="top">
                                  <IconButton icon={<CloseIcon />} colorScheme="red" variant="solid" onClick={() => abrirModalProblema(true)} size="sm" aria-label="Falha Grave" />
                              </Tooltip>
                              <Tooltip label="Sinalizar Problema de TI" hasArrow placement="top">
                                  <IconButton icon={<WarningTwoIcon />} colorScheme="orange" variant="outline" onClick={() => abrirModalProblema(false)} size="sm" aria-label="Problema" />
                              </Tooltip>
                              <Tooltip label="✨ Auto-Preencher com IA" hasArrow placement="top">
                                  <IconButton icon={<Text fontSize="md">✨</Text>} bgGradient="linear(to-r, purple.500, blue.500)" color="white" _hover={{ bgGradient: "linear(to-r, purple.600, blue.600)", transform: 'translateY(-1px)' }} onClick={() => gerarCorrecaoIA(1)} isLoading={loadingIA} size="sm" aria-label="IA" />
                              </Tooltip>
                              {redacaoAtual.status !== 'REFAZER' && (<Button flex={1} onClick={() => abrirConfirmacao("Devolver Redação?", "Perderá todo o progresso.", liberarRedacaoReal, "red", "Devolver")} colorScheme="red" variant="outline" size="sm" fontSize="xs" px={1}>Liberar</Button>)}
                              
                              <Button flex={1} colorScheme="green" onClick={handleFinalizarClick} size="sm" fontSize="xs" shadow="md" px={1}>FINALIZAR</Button>
                          </HStack>
                      </Box>
                      <Box flex="1" overflowY="auto" p={3} display="flex" flexDirection="column" pb={20}>
                          <Accordion allowToggle>
                              {compsAtuais.map((comp) => (
                                  <AccordionItem key={comp.id} border="none" mb={3}>
                                      <h2>
                                          <AccordionButton bg="white" boxShadow="sm" borderRadius="lg" _expanded={{ bg: comp.cor, color: "white" }} py={4} onClick={(e) => { const target = e.currentTarget; setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300); }}>
                                              <Box w="4px" h="40px" bg={comp.cor} borderRadius="full" mr={3} display="block" _expanded={{ bg: "white" }} />
                                              <Box flex='1' textAlign='left'><Text fontSize="sm" fontWeight="bold">{comp.nome}</Text></Box>
                                              <Badge bg={notas[comp.id] > 0 ? "white" : "gray.100"} color={notas[comp.id] > 0 ? "black" : "gray.500"} borderRadius="md" px={2} py={0.5}>{notas[comp.id] || 0}</Badge>
                                          </AccordionButton>
                                      </h2>
                                      <AccordionPanel pb={4} bg="white" mt={-1} borderRadius="0 0 lg lg" border="1px solid" borderColor="gray.100" borderTop="none" display="flex" flexDirection="column">
                                          <VStack align="stretch" spacing={4} pt={2} flex="1">
                                              <Box><Text fontSize="xs" fontWeight="bold" color="gray.400" mb={2} letterSpacing="wider">NOTA</Text><Flex wrap="wrap" gap={1.5}>{notasPossiveisAtuais.map(val => (<Button key={val} size="xs" h="28px" colorScheme={notas[comp.id] === val ? 'teal' : 'gray'} variant={notas[comp.id] === val ? 'solid' : 'ghost'} onClick={() => setNotas({...notas, [comp.id]: val})} borderRadius="md">{val}</Button>))}</Flex></Box>
                                              <Box flex="1" display="flex" flexDirection="column">
                                                  <Flex justify="space-between" align="center" mb={1}><Text fontSize="xs" fontWeight="bold" color="gray.400" letterSpacing="wider">COMENTÁRIO OBRIGATÓRIO</Text><Button size="xs" leftIcon={<Text fontSize="xs">⚡</Text>} onClick={() => { setQuickReplyComp(comp.id); setQuickReplyContext('GERAL'); modalRespostas.onOpen(); }} colorScheme="yellow" variant="ghost">Rápidas</Button></Flex>
                                                  <Textarea size="sm" bg="gray.50" border="1px solid" borderColor="gray.200" _focus={{ bg: "white", boxShadow: "outline" }} value={comentarios[comp.id]} onChange={(e) => setComentarios({...comentarios, [comp.id]: e.target.value})} placeholder="Justifique a nota desta competência..." borderRadius="md" minH="calc(100vh - 450px)" resize="none" />
                                              </Box>
                                          </VStack>
                                      </AccordionPanel>
                                  </AccordionItem>
                              ))}
                          </Accordion>
                      </Box>
                  </Box>
              </Box>

              <Modal isOpen={isOpen} onClose={() => { setCurrentBox(null); setEditingPinId(null); onClose(); }} size="sm" isCentered>
                <ModalOverlay /><ModalContent borderRadius="xl"><ModalHeader fontSize="md">{editingPinId ? 'Editar Apontamento' : 'Novo Apontamento'}</ModalHeader><ModalCloseButton /><ModalBody><VStack spacing={3}><Box w="full"><Text fontSize="xs" fontWeight="bold" color="gray.500">COMPETÊNCIA</Text><Select size="sm" value={pinCompetencia} onChange={(e) => setPinCompetencia(parseInt(e.target.value))}>{compsAtuais.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</Select></Box>{pinCompetencia === 1 && (<Box w="full"><Text fontSize="xs" fontWeight="bold" color="gray.500">TIPO DE ERRO</Text><Select size="sm" placeholder="Selecione..." value={pinTipoErro} onChange={(e) => setPinTipoErro(e.target.value)}>{ERROS_GRAMATICA.map(erro => <option key={erro.value} value={erro.value}>{erro.label}</option>)}</Select></Box>)}<Box w="full"><Flex justify="space-between" align="center" mb={1}><Text fontSize="xs" fontWeight="bold" color="gray.500">OBSERVAÇÃO</Text><Button size="xs" leftIcon={<Text fontSize="xs">⚡</Text>} onClick={() => { setQuickReplyComp(pinCompetencia); setQuickReplyContext('PIN'); modalRespostas.onOpen(); }} colorScheme="yellow" variant="ghost" h="20px">Rápidas</Button></Flex><Textarea size="sm" value={pinTexto} onChange={(e) => setPinTexto(e.target.value)} /></Box></VStack></ModalBody><ModalFooter><Button size="sm" variant="ghost" mr={3} onClick={() => { setCurrentBox(null); setEditingPinId(null); onClose(); }}>Cancelar</Button><Button size="sm" colorScheme="blue" onClick={salvarPin}>Salvar</Button></ModalFooter></ModalContent>
              </Modal>

              <Modal isOpen={modalRespostas.isOpen} onClose={modalRespostas.onClose} isCentered size="lg">
                <ModalOverlay /><ModalContent borderRadius="xl"><ModalHeader fontSize="md" borderBottom="1px solid #eee">⚡ Usar Resposta Rápida</ModalHeader><ModalCloseButton /><ModalBody py={6}><Flex wrap="wrap" gap={3} mb={6}>{todasRespostas.filter(r => r.competencia === quickReplyComp && r.contexto === quickReplyContext && r.modelo === (isSimplesMode ? 'SIMPLES' : 'ENEM') && (r.modelo !== 'ENEM' || r.competencia !== 1 || r.contexto !== 'PIN' || r.tipo_erro === pinTipoErro)).map((resp) => (<Tooltip key={resp.id} label={resp.texto} hasArrow><Badge p={2} px={3} borderRadius="full" cursor="pointer" colorScheme="blue" variant="subtle" _hover={{ bg: 'blue.100', transform: 'scale(1.05)' }} onClick={() => { if (quickReplyContext === 'GERAL') setComentarios(prev => ({ ...prev, [quickReplyComp]: prev[quickReplyComp] ? prev[quickReplyComp] + '\n' + resp.texto : resp.texto })); else setPinTexto(prev => prev ? prev + '\n' + resp.texto : resp.texto); modalRespostas.onClose(); }}>{resp.titulo}</Badge></Tooltip>))}</Flex></ModalBody></ModalContent>
              </Modal>

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

              <Modal isOpen={modalProblema.isOpen} onClose={modalProblema.onClose} isCentered size="md">
                <ModalOverlay backdropFilter="blur(4px)" />
                <ModalContent borderRadius="xl">
                  <ModalHeader color={isFalhaGrave ? "red.600" : "orange.600"}><WarningTwoIcon mr={2} /> {isFalhaGrave ? "Reportar Falha Grave" : "Sinalizar Problema de TI"}</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                      <VStack spacing={4} align="stretch">
                          <Alert status={isFalhaGrave ? "error" : "warning"} borderRadius="md">
                              <AlertIcon />
                              <Box>
                                  <Text fontWeight="bold">Atenção!</Text>
                                  <Text fontSize="sm">{isFalhaGrave ? "A redação será enviada para auditoria pedagógica. Se o gestor confirmar, a redação será zerada." : "A redação será enviada para a triagem técnica (Ex: imagem ruim) e pode ser cancelada."}</Text>
                              </Box>
                          </Alert>
                          <FormControl isRequired>
                              <FormLabel fontWeight="bold" fontSize="sm">Qual o motivo exato?</FormLabel>
                              <Select bg="gray.50" value={motivoProblema} onChange={e => setMotivoProblema(e.target.value)} placeholder="Selecione na lista...">
                                  {isFalhaGrave ? (
                                      <>
                                          <option value="Prova Assinada Dentro da Folha de Redação">Prova Assinada na Folha</option>
                                          <option value="Desenho">Desenho</option>
                                          <option value="Fuga Total ao Tema">Fuga Total ao Tema</option>
                                          <option value="Linhas Insuficientes">Linhas Insuficientes</option>
                                          <option value="Cópia Total dos Textos Motivadores">Cópia Total (Textos Motivadores)</option>
                                          <option value="Não Atendimento ao Tipo Textual">Não Atende ao Tipo Textual</option>
                                          <option value="Trecho Desconectado Deliberadamente">Trecho Desconectado</option>
                                          <option value="Impropério">Impropério / Ofensa</option>
                                          <option value="Identificação do Participante">Identificação do Aluno no Texto</option>
                                          <option value="Reflexão Sobre a Prova/Desempenho">Reflexão sobre a Prova</option>
                                          <option value="Recado Para o Corretor ou Banca">Recado para o Corretor/Banca</option>
                                          <option value="Oração ou Mensagem Religiosa">Oração/Mensagem Religiosa</option>
                                          <option value="Mensagem Política">Mensagem Política</option>
                                      </>
                                  ) : (
                                      <>
                                          <option value="Redação em Branco">Redação em Branco</option>
                                          <option value="Texto Totalmente Ilegível">Texto Totalmente Ilegível</option>
                                          <option value="Parte da Redação Cortada">Parte da Redação Cortada (Foto)</option>
                                          <option value="Arquivo Corrompido">Arquivo Corrompido</option>
                                          <option value="Redação Identica a Outra">Redação Idêntica a Outra</option>
                                          <option value="Imagem com Qualidade Ruim">Imagem com Qualidade Ruim</option>
                                          <option value="Outros Motivos Técnicos">Outros Motivos Técnicos</option>
                                      </>
                                  )}
                              </Select>
                          </FormControl>
                          <FormControl>
                              <FormLabel fontWeight="bold" fontSize="sm">Detalhes / Justificativa</FormLabel>
                              <Textarea bg="gray.50" value={obsProblema} onChange={e => setObsProblema(e.target.value)} rows={3} placeholder={isFalhaGrave ? "Copie o link caso seja plágio, ou explique o problema pedagógico..." : "Descreva qual foi o problema técnico..."} />
                          </FormControl>
                      </VStack>
                  </ModalBody>
                  <ModalFooter bg="gray.50">
                      <Button variant="ghost" mr={3} onClick={modalProblema.onClose}>Cancelar</Button>
                      <Button colorScheme={isFalhaGrave ? "red" : "orange"} onClick={reportarProblemaReal} isLoading={enviandoProblema}>{isFalhaGrave ? "Confirmar Falha Grave" : "Confirmar Problema"}</Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>

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
                    <Button colorScheme={confirmacaoConfig.botaoCor} onClick={() => { if(confirmacaoConfig.acao) confirmacaoConfig.acao(); modalConfirmacao.onClose(); }}>{confirmacaoConfig.textoBotao}</Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>

          </Flex>
        );
    }

    const listaPendencias = fila.filter(r => r.status === 'REFAZER');
    let listaGeral = fila.filter(r => r.status !== 'REFAZER' && r.status !== 'CORRIGIDA' && r.status !== 'EM_QA').filter(r => {
        const match = r.tema_titulo.toLowerCase().includes(filtroTexto.toLowerCase()) || (r.id && r.id.toString().includes(filtroTexto.toLowerCase()));
        const matchTipo = filtroTipo === 'TODOS' ? true : (r.tema_tipo || r.tipo || 'ENEM').toUpperCase() === filtroTipo;
        if (somenteUrgentes && !r.is_urgente && !r.vip_pago) return false;
        return match && matchTipo;
    }).sort((a, b) => new Date(a.data_envio) - new Date(b.data_envio));
    
    const qtdUrgentes = listaGeral.filter(r => r.is_urgente || r.vip_pago).length;
    const filaPaginada = listaGeral.slice((paginaAtualFila - 1) * itensPorPaginaFila, paginaAtualFila * itensPorPaginaFila);

    return (
        <Container maxW="container.xl" py={8}>
            <Flex justify="space-between" align="center" mb={6} bg="white" p={6} borderRadius="xl" boxShadow="sm" border="1px solid" borderColor="gray.100">
                <VStack align="start" spacing={0}><Heading size="lg" color="teal.600">Mesa de Trabalho</Heading><Text color="gray.500" fontSize="sm">Puxe uma redação da fila e comece a faturar.</Text></VStack>
                <HStack spacing={8}><Stat textAlign="center"><StatLabel color="gray.500">Pendentes</StatLabel><StatNumber fontSize="3xl" color="gray.700">{listaGeral.length}</StatNumber></Stat><Divider orientation="vertical" height="40px" /><Stat textAlign="center"><StatLabel color="purple.600" fontWeight="bold">Urgentes/VIPs</StatLabel><StatNumber fontSize="3xl" color="purple.600">{qtdUrgentes}</StatNumber></Stat></HStack>
            </Flex>

            {listaPendencias.length > 0 && (
                <Box mb={8}>
                    <Flex align="center" mb={3} gap={2}><WarningTwoIcon color="red.500" boxSize={5} animation="pulse 1.5s infinite" /><Heading size="md" color="red.600">Minhas Pendências (Urgente)</Heading></Flex>
                    <Card bg="red.50" shadow="md" borderRadius="lg" overflow="hidden" border="1px solid" borderColor="red.200">
                        <Box overflowX="auto">
                            <Table variant="simple" style={{ tableLayout: 'fixed', width: '100%' }}>
                                <Thead bg="red.100"><Tr><Th w="8%" px={4} color="red.800">Cód.</Th><Th w="48%" px={4} color="red.800">Tema da Redação</Th><Th w="10%" px={3} textAlign="center" color="red.800">Tipo</Th><Th w="10%" px={3} textAlign="center" color="red.800">Status</Th><Th w="12%" px={3} textAlign="center" color="red.800">Prazo</Th><Th w="12%" px={4} textAlign="center" color="red.800">Ação</Th></Tr></Thead>
                                <Tbody>
                                    {listaPendencias.map(r => (
                                        <Tr key={r.id} _hover={{ bg: 'red.100' }}>
                                            <Td fontWeight="bold" color="red.700" px={4}>#{r.id}</Td><Td fontWeight="medium" isTruncated px={4}>{r.tema_titulo}</Td><Td px={3} textAlign="center"><Badge bg="red.200" color="red.800">{r.tema_tipo || 'ENEM'}</Badge></Td>
                                            <Td px={3} textAlign="center"><Badge colorScheme="red">REFAÇÃO</Badge></Td><Td px={3} textAlign="center"><Badge colorScheme="red" variant="solid">AGORA</Badge></Td>
                                            <Td px={4} textAlign="center"><Button size="sm" colorScheme="red" leftIcon={<EditIcon />} onClick={() => pegarRedacao(r.id)} shadow="md" animation="pulse 1.5s infinite">Ajustar Nota</Button></Td>
                                        </Tr>
                                    ))}
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
                    <Flex direction="column" align="center" justify="center" h="300px" bg="white" borderRadius="xl"><CheckCircleIcon w={12} h={12} color="green.300" mb={4} /><Heading size="md" color="gray.500" mb={1}>Tudo limpo!</Heading><Text color="gray.400">Nenhuma redação na fila.</Text></Flex>
                ) : (
                    <Box overflowX="auto">
                        <Table variant="simple" style={{ tableLayout: 'fixed', width: '100%' }}>
                            <Thead bg="gray.50"><Tr><Th w="8%" px={4}>Cód.</Th><Th w="32%" px={4}>Tema</Th><Th w="15%" px={3} textAlign="center">Status</Th><Th w="15%" px={3} textAlign="center">Envio</Th><Th w="15%" px={3} textAlign="center">Ações</Th></Tr></Thead>
                            <Tbody>
                              {filaPaginada.map(r => (
                                <Tr key={r.id} _hover={{ bg: 'gray.50' }} bg={r.vip_pago || r.is_urgente ? 'purple.50' : 'transparent'}>
                                  <Td fontWeight="bold" color="gray.700" px={4}>#{r.id}</Td>
                                  <Td px={4} isTruncated title={r.tema_titulo}><Text fontWeight="bold" fontSize="sm" color="gray.800" isTruncated>{r.tema_titulo}</Text><Text fontSize="xs" color="gray.500">Aluno: <strong>{r.aluno_nome || "Desconhecido"}</strong></Text></Td>
                                  <Td px={3} textAlign="center"><Badge colorScheme={r.status === 'EM_CORRECAO' ? 'blue' : 'yellow'} borderRadius="md">{r.status.replace('_', ' ')}</Badge></Td>
                                  <Td px={3} textAlign="center">
                                    <Text fontSize="xs" color="gray.600">{new Date(r.data_envio).toLocaleDateString()}</Text>
                                    {r.vip_pago && <Badge colorScheme="purple" variant="solid" mt={1} fontSize="2xs"><StarIcon mr={1} mb={0.5}/> VIP PAGO</Badge>}
                                    {!r.vip_pago && r.is_urgente && <Badge colorScheme="red" variant="solid" mt={1} fontSize="2xs"><WarningIcon mr={1} mb={0.5}/> URGENTE</Badge>}
                                  </Td>
                                  <Td px={3} textAlign="center"><Button size="sm" colorScheme={r.is_urgente || r.vip_pago ? 'purple' : 'teal'} leftIcon={<EditIcon />} onClick={() => pegarRedacao(r.id)} shadow="sm">Corrigir</Button></Td>
                                </Tr>
                              ))}
                            </Tbody>
                        </Table>
                    </Box>
                )}
                {listaGeral.length > 0 && (
                    <Flex justify="space-between" align="center" p={4} bg="gray.50" borderTop="1px solid" borderColor="gray.200" wrap="wrap" gap={4}>
                        <HStack><Text fontSize="sm" color="gray.600">Mostrar</Text><Select size="sm" w="80px" bg="white" value={itensPorPaginaFila} onChange={(e) => { setItensPorPaginaFila(Number(e.target.value)); setPaginaAtualFila(1); }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></Select></HStack>
                        <HStack><Button size="sm" onClick={() => setPaginaAtualFila(p => Math.max(1, p - 1))} isDisabled={paginaAtualFila === 1} bg="white">Anterior</Button><Button size="sm" onClick={() => setPaginaAtualFila(p => Math.min(Math.ceil(listaGeral.length / itensPorPaginaFila), p + 1))} isDisabled={paginaAtualFila === Math.ceil(listaGeral.length / itensPorPaginaFila)} bg="white">Próxima</Button></HStack>
                    </Flex>
                )}
            </Card>

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
                  <Button colorScheme={confirmacaoConfig.botaoCor} onClick={() => { if(confirmacaoConfig.acao) confirmacaoConfig.acao(); modalConfirmacao.onClose(); }}>{confirmacaoConfig.textoBotao}</Button>
                </ModalFooter>
              </ModalContent>
            </Modal>

        </Container>
    );
};

export default AbaCorretorFila;