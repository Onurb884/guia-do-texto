import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

import {
  Container, Heading, Text, SimpleGrid, Card, CardBody, VStack,
  HStack, Badge, Button, Icon, Divider, Box, useToast,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, Select, Input, InputGroup, InputLeftElement, 
  Popover, PopoverTrigger, PopoverContent, PopoverArrow, PopoverHeader, PopoverBody,
  Flex, Image, Textarea, Table, Thead, Tbody, Tr, Th, Td, Spinner,
  FormControl, Alert, AlertIcon, ModalFooter, IconButton, Portal, Grid, GridItem,
  Stat, StatLabel, StatNumber, useDisclosure
} from '@chakra-ui/react';

import { 
  ViewIcon, EditIcon, AttachmentIcon, SearchIcon, CloseIcon, 
  CheckCircleIcon, DownloadIcon, ArrowBackIcon, AddIcon, CopyIcon,
  ArrowUpIcon, ArrowForwardIcon, InfoIcon, StarIcon, CheckIcon, MinusIcon, TimeIcon,
  ChevronLeftIcon, ChevronRightIcon, WarningTwoIcon
} from '@chakra-ui/icons';

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';

import BotaoSuporte from './BotaoSuporte';

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

const GlobalStyles = () => (
    <style>{`
      .texto-limpo { word-break: normal !important; overflow-wrap: break-word !important; white-space: normal !important; hyphens: none !important; font-family: 'Inter', -apple-system, sans-serif !important; }
      .texto-limpo p, .texto-limpo span, .texto-limpo div { word-break: normal !important; }
      .texto-limpo ul { padding-left: 24px !important; margin-bottom: 12px !important; list-style-type: disc; }
      .texto-limpo ol { padding-left: 24px !important; margin-bottom: 12px !important; list-style-type: decimal; }
      .texto-limpo li { margin-bottom: 4px; }
      
      .banner-oferta {
          animation: pulsarOferta 2s ease-in-out infinite;
          border-radius: 12px;
      }
      
      @keyframes pulsarOferta { 
        0% { transform: scale(1); box-shadow: 0px 0px 0px 0px rgba(214, 158, 46, 0.0); } 
        50% { transform: scale(1.02); box-shadow: 0px 0px 20px 5px rgba(214, 158, 46, 0.8); } 
        100% { transform: scale(1); box-shadow: 0px 0px 0px 0px rgba(214, 158, 46, 0.0); } 
      }

      @keyframes fadeSlideIn {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
      }
      
      .repertorio-ia h3 { font-size: 1.1rem; font-weight: 900; color: #44337A; margin-top: 15px; margin-bottom: 8px; }
      .repertorio-ia p { font-size: 0.95rem; color: #2D3748; margin-bottom: 10px; line-height: 1.6; }
      .repertorio-ia strong { color: #553C9A; }
      .repertorio-ia hr { margin: 20px 0; border-color: #D6BCFA; }
    `}</style>
);

const formatarTexto = (texto) => {
    if (!texto) return '';
    if (texto.includes('<p>') || texto.includes('<span')) return texto; 
    return texto.replace(/\n/g, '<br />').replace(/\*(.*?)\*/g, '<strong>$1</strong>').replace(/_(.*?)_/g, '<em>$1</em>').replace(/~(.*?)~/g, '<u>$1</u>');
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

const VisualizadorTema = ({ tema, onGerarRepertorio, isGerandoRepertorio }) => {
    if (!tema) return null; 

    return (
        <Box w="full" mx="auto" pb={10}>
            <VStack align="start" spacing={3} mb={8} borderBottom="2px solid" borderColor="gray.200" pb={6}>
                <Badge colorScheme={tema.tipo === 'ENEM' ? 'green' : 'blue'} variant="subtle" px={3} py={1} borderRadius="md" fontWeight="bold" letterSpacing="wide">DISSERTAÇÃO {tema.tipo}</Badge>
                <Heading size="lg" color="gray.800" lineHeight="1.3">{tema.titulo}</Heading>
            </VStack>

            <Card mb={10} borderLeft="4px solid" borderColor="teal.500" shadow="sm" bg="teal.50" borderRadius="lg">
                <CardBody py={5} px={6}>
                    <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={3}>
                        <Heading size="xs" color="teal.800" textTransform="uppercase" letterSpacing="widest" opacity={0.9}>Proposta de Redação</Heading>
                        <Button size="sm" colorScheme="purple" bgGradient="linear(to-r, purple.500, blue.500)" _hover={{ bgGradient: "linear(to-r, purple.600, blue.600)" }} variant="solid" onClick={() => onGerarRepertorio(tema.id)} isLoading={isGerandoRepertorio} shadow="md">
                            <Text fontSize="lg" mr={2}>💡</Text> Brainstorm com IA
                        </Button>
                    </Flex>
                    <Box className="texto-limpo" dangerouslySetInnerHTML={{ __html: formatarTexto(tema.descricao) }} sx={{ fontSize: '16px', color: 'teal.900', lineHeight: '1.6', textAlign: 'justify' }} />
                </CardBody>
            </Card>

            <Box><Heading size="sm" color="gray.600" mb={5} textTransform="uppercase" letterSpacing="widest">Textos Motivadores</Heading>
                <VStack align="stretch" spacing={6}>
                    {tema.motivadores?.map((m, i) => (
                        <Card key={i} shadow="sm" border="1px solid" borderColor="gray.200" borderLeft="4px solid" borderLeftColor="yellow.400" overflow="hidden" borderRadius="xl" bg="white"><CardBody py={5} px={6} className="texto-limpo"><Flex align="center" mb={4}><Icon as={AttachmentIcon} color="yellow.600" mr={2} boxSize={4} /><Heading size="xs" color="yellow.800" textTransform="uppercase" letterSpacing="widest" opacity={0.9}>Texto {ROMAN_NUMERALS[i] || i + 1}</Heading></Flex>{m.tipo === 'texto' ? (<Box dangerouslySetInnerHTML={{__html: formatarTexto(m.conteudo)}} sx={{ fontSize: '16px', lineHeight: '1.6', color: 'gray.700', textAlign: 'justify', 'p': { marginBottom: '1.2rem' }, 'img': { maxWidth: '100%', height: 'auto', borderRadius: 'md', my: 3 } }} />) : (<Flex justify="center"><Image src={m.arquivo} borderRadius="md" maxH="450px" objectFit="contain" /></Flex>)}</CardBody></Card>
                    ))}
                </VStack>
            </Box>
        </Box>
    );
};

const INFO_COMPETENCIAS_ENEM = { 1: { nome: "Gramática", cor: "red.500", bg: "red.50" }, 2: { nome: "Tema/Estrutura", cor: "blue.500", bg: "blue.50" }, 3: { nome: "Argumentação", cor: "orange.500", bg: "orange.50" }, 4: { nome: "Coesão", cor: "green.500", bg: "green.50" }, 5: { nome: "Proposta", cor: "purple.500", bg: "purple.50" } };
const INFO_COMPETENCIAS_SIMPLES = { 1: { nome: "Gramática", cor: "red.500", bg: "red.50" }, 2: { nome: "Estrutura e atendimento ao tema", cor: "blue.500", bg: "blue.50" }, 3: { nome: "Argumentação", cor: "yellow.500", bg: "yellow.50" }, 4: { nome: "Coesão e coerência", cor: "green.500", bg: "green.50" } };

const CATEGORIAS_MATERIAL = {
    'ALUNO_MANUAL': { nome: 'Manuais e Cartilhas', cor: 'blue', icon: InfoIcon },
    'ALUNO_REPERTORIO': { nome: 'Guias de Eixos Temáticos', cor: 'purple', icon: StarIcon },
    'ALUNO_GRAMATICA': { nome: 'Gramática e Estrutura', cor: 'green', icon: EditIcon },
    'ALUNO_EXEMPLOS': { nome: 'Redações Nota 1000', cor: 'yellow', icon: CheckCircleIcon },
    'OUTROS': { nome: 'Outros', cor: 'gray', icon: AttachmentIcon }
};

const DICAS_INTELIGENTES = {
    'C1 (Gramática)': 'Atenção à norma culta! Revise as regras de pontuação (especialmente vírgulas), crase e concordância.',
    'C2 (Tema)': 'Cuidado com o tangenciamento! Certifique-se de abordar todas as palavras-chave do tema na introdução.',
    'C3 (Argumentos)': 'Fortaleça sua argumentação! Evite apenas expor fatos; você precisa explicá-los.',
    'C4 (Coesão)': 'Melhore a ligação do seu texto! Use conectivos variados não apenas no início dos parágrafos, mas também dentro deles.',
    'C5 (Proposta)': 'Sua proposta de intervenção precisa estar mais completa. Detalhe: Quem fará? O que será feito? Como? Para quê?',
    'C2 (Estrutura)': 'Foque em estruturar bem o seu texto com introdução, desenvolvimento e conclusão bem divididos.',
    'C3 (Argumentação)': 'Seus argumentos precisam ser mais sólidos. Tente desenvolver melhor suas ideias com exemplos reais.',
    'C4 (Coesão/Coerência)': 'Fique atento à ligação entre suas frases para que o texto tenha uma leitura fluida.'
};

const PainelAluno = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  const [redacoes, setRedacoes] = useState([]);
  const [temas, setTemas] = useState([]);
  const [usuario, setUsuario] = useState({ first_name: '', username: 'Aluno' });

  const [passo, setPasso] = useState('dashboard'); 
  const [temaSelecionado, setTemaSelecionado] = useState(null);
  const [arquivo, setArquivo] = useState(null);
  const [textoOnline, setTextoOnline] = useState('');
  const [enviando, setEnviando] = useState(false);
  
  const [buscaHistorico, setBuscaHistorico] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('TODOS');
  const [tipoFiltro, setTipoFiltro] = useState('TODOS');
  const [dataInicioFiltro, setDataInicioFiltro] = useState('');
  const [dataFimFiltro, setDataFimFiltro] = useState('');
  const [filtroGraficoTipo, setFiltroGraficoTipo] = useState('ENEM');

  const [buscaTema, setBuscaTema] = useState('');
  const [filtroTemaTipo, setFiltroTemaTipo] = useState('TODOS');
  const [redacaoSelecionada, setRedacaoSelecionada] = useState(null);
  const [hoveredPinViewId, setHoveredPinViewId] = useState(null); 
  const [isModoFoco, setIsModoFoco] = useState(false);
  const [linhasDigitadas, setLinhasDigitadas] = useState(0);
  
  const [materiais, setMateriais] = useState([]);
  const [buscaMaterial, setBuscaMaterial] = useState('');
  const [filtroMaterialCat, setFiltroMaterialCat] = useState('TODOS');

  const hiddenTextRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);

  const [configsGlobais, setConfigsGlobais] = useState({ custo_creditos_vip: 2, preco_avulso_normal: 9.90, preco_avulso_vip: 14.90, tempo_carrossel_segundos: 6 });
  const [carteira, setCarteira] = useState({ saldo_simples: 0, saldo_vip: 0 });
  const [pacotes, setPacotes] = useState([]);
  const [banners, setBanners] = useState([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [tempoVitrine, setTempoVitrine] = useState('');
  
  const [qtdAvulsoNormal, setQtdAvulsoNormal] = useState(0);
  const [qtdAvulsoVip, setQtdAvulsoVip] = useState(0);
  const [pacotePage, setPacotePage] = useState(0);

  const [modalCheckoutOpen, setModalCheckoutOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState(null); 
  const [cupomDigitado, setCupomDigitado] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState(null);
  
  const [processandoCompra, setProcessandoCompra] = useState(false);
  const [processandoCartao, setProcessandoCartao] = useState(false);
  const [dadosPix, setDadosPix] = useState(null); 
  const [transacaoCartaoId, setTransacaoCartaoId] = useState(null); 
  const [aguardandoCartao, setAguardandoCartao] = useState(false);  
  
  const [modalEnvioOpen, setModalEnvioOpen] = useState(false);
  const [usarVIP, setUsarVIP] = useState(false);

  const modalDevolvida = useDisclosure();
  const [redacaoDevolvidaInfo, setRedacaoDevolvidaInfo] = useState(null);

  const modalLeitor = useDisclosure();
  const [materialSelecionado, setMaterialSelecionado] = useState(null);

  const [repertorioIA, setRepertorioIA] = useState(null);
  const [isGerandoRepertorio, setIsGerandoRepertorio] = useState(false);
  const modalRepertorioIA = useDisclosure();

  useEffect(() => {
      const params = new URLSearchParams(location.search);
      const aba = params.get('aba');
      if (aba) { setPasso(aba); } else { setPasso('dashboard'); }
  }, [location.search]);

  useEffect(() => { carregarDadosIniciais(); }, []);

  useEffect(() => {
      const params = new URLSearchParams(location.search);
      const checkoutId = params.get('checkout');
      
      if (checkoutId && pacotes.length > 0 && passo === 'loja') {
          const pacoteAlvo = pacotes.find(p => p.id === parseInt(checkoutId));
          
          if (pacoteAlvo && !modalCheckoutOpen && !processandoCompra) {
              iniciarCheckout('pacote', pacoteAlvo);
              navigate('/painel-aluno?aba=loja', { replace: true });
          }
      }
  }, [pacotes, location.search, passo]);

  useEffect(() => {
      let intervalo;
      if (dadosPix && dadosPix.pagamento_id) {
          intervalo = setInterval(async () => {
              try {
                  const token = localStorage.getItem('token');
                  const res = await axios.get(`http://127.0.0.1:8000/api/pagamento/status/${dadosPix.pagamento_id}/`, {
                      headers: { Authorization: `Bearer ${token}` }
                  });
                  
                  if (res.data.status === 'approved') {
                      clearInterval(intervalo); 
                      setModalCheckoutOpen(false); 
                      setDadosPix(null); 
                      setQtdAvulsoNormal(0);
                      setQtdAvulsoVip(0);
                      setCheckoutItem(null);
                      
                      carregarDadosIniciais(); 
                      window.dispatchEvent(new Event('atualizarCarteira')); 
                      
                      toast({ 
                          title: "Pagamento Confirmado! 🎉", 
                          description: "Os seus créditos já estão na carteira. Bom treino!", 
                          status: "success", 
                          duration: 8000,
                          isClosable: true
                      });
                  }
              } catch (e) { console.error("Erro ao verificar o status do PIX:", e); }
          }, 5000);
      }
      return () => clearInterval(intervalo);
  }, [dadosPix]);

  useEffect(() => {
      const params = new URLSearchParams(location.search);
      const pagamentoStatus = params.get('pagamento_mp');
      const paymentId = params.get('payment_id');
      const transacaoId = params.get('transacao_id');

      if (pagamentoStatus === 'sucesso' && paymentId && transacaoId) {
          const confirmarRetorno = async () => {
              try {
                  const token = localStorage.getItem('token');
                  await axios.post('http://127.0.0.1:8000/api/pagamento/confirmar-retorno/', {
                      payment_id: paymentId,
                      transacao_id: transacaoId
                  }, { headers: { Authorization: `Bearer ${token}` } });
                  
                  carregarDadosIniciais(); 
                  window.dispatchEvent(new Event('atualizarCarteira')); 
                  
                  setQtdAvulsoNormal(0);
                  setQtdAvulsoVip(0);
                  setCheckoutItem(null);
                  
                  toast({ title: "Pagamento Aprovado!", description: "Créditos creditados na sua conta.", status: "success", duration: 8000, isClosable: true });
                  navigate('/painel-aluno?aba=loja', { replace: true });
              } catch (e) { console.error(e); }
          };
          confirmarRetorno();
      } else if (pagamentoStatus === 'falha') {
          toast({ title: "Pagamento Recusado", description: "Houve um problema com o seu cartão. Tente usar o PIX ou verifique o limite.", status: "error", duration: 8000 });
          navigate('/painel-aluno?aba=loja', { replace: true });
      }
  }, [location.search]);

  useEffect(() => {
      if (banners.length === 0) return;
      const tempoMs = (configsGlobais.tempo_carrossel_segundos || 6) * 1000;
      const carouselInterval = banners.length > 1 ? setInterval(() => { setBannerIndex(prev => (prev + 1) % banners.length); }, tempoMs) : null;

      const timerInterval = setInterval(() => {
          const safeIndex = bannerIndex >= banners.length ? 0 : bannerIndex;
          const bannerAtual = banners[safeIndex];

          if (bannerAtual && bannerAtual.data_fim) {
              const now = new Date().getTime();
              const end = new Date(bannerAtual.data_fim).getTime();
              const distance = end - now;

              if (distance < 0) { 
                  setTempoVitrine('Expirou'); 
                  setTimeout(() => { setBanners(prev => { const atualizados = prev.filter(b => b.id !== bannerAtual.id); if (bannerIndex >= atualizados.length) setBannerIndex(0); return atualizados; }); }, 2000);
              } else {
                  const d = Math.floor(distance / (1000 * 60 * 60 * 24));
                  const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                  const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                  const s = Math.floor((distance % (1000 * 60)) / 1000);
                  
                  let timerStr = '';
                  if (d > 0) timerStr += `${d}d `;
                  timerStr += `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
                  setTempoVitrine(timerStr);
              }
          } else { setTempoVitrine(''); }
      }, 1000);
      return () => { if(carouselInterval) clearInterval(carouselInterval); clearInterval(timerInterval); };
  }, [banners, bannerIndex, configsGlobais.tempo_carrossel_segundos]);

  useEffect(() => {
      if (hiddenTextRef.current) {
          const height = hiddenTextRef.current.clientHeight;
          const linhasReais = Math.round(height / 40);
          setLinhasDigitadas(textoOnline.trim() === '' ? 0 : Math.max(1, linhasReais));
      }
  }, [textoOnline]);

  const carregarDadosIniciais = async () => {
    const token = localStorage.getItem('token');
    try {
        const [resRed, resUser, resTemas, resPacotes, resConfig, resBanners, resMateriais] = await Promise.all([
            axios.get('http://127.0.0.1:8000/api/minhas-redacoes/', { headers: { Authorization: `Bearer ${token}` } }),
            axios.get('http://127.0.0.1:8000/api/me/', { headers: { Authorization: `Bearer ${token}` } }),
            axios.get('http://127.0.0.1:8000/api/temas/', { headers: { Authorization: `Bearer ${token}` } }),
            axios.get('http://127.0.0.1:8000/api/gestao/pacotes/', { headers: { Authorization: `Bearer ${token}` } }),
            axios.get('http://127.0.0.1:8000/api/gestao/configuracoes/', { headers: { Authorization: `Bearer ${token}` } }),
            axios.get('http://127.0.0.1:8000/api/gestao/banners/', { headers: { Authorization: `Bearer ${token}` } }),
            axios.get('http://127.0.0.1:8000/api/materiais/', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        setRedacoes(resRed.data); setUsuario(resUser.data); setTemas(resTemas.data.filter(t => t.ativo));
        setPacotes(resPacotes.data.filter(p => p.ativo)); setConfigsGlobais(resConfig.data); 
        const agora = new Date().getTime(); setBanners(resBanners.data.filter(b => !b.data_fim || new Date(b.data_fim).getTime() > agora));
        setMateriais(resMateriais.data);

        if (!resUser.data.is_staff && !resUser.data.is_corretor) {
            try {
                const resCart = await axios.get('http://127.0.0.1:8000/api/aluno/carteira/', { headers: { Authorization: `Bearer ${token}` } });
                setCarteira(resCart.data);
            } catch (e) { console.log("Usuário não possui carteira de aluno."); }
        }
    } catch (e) { console.error("Erro ao carregar dados do painel:", e); }
  };

  const selecionarTema = (tema) => { setTemaSelecionado(tema); setPasso('escolha_modo'); };
  const escolherModo = (modo) => { if (modo === 'manuscrito') setPasso('upload_manuscrito'); else setPasso('escrever_online'); };

  const voltar = () => {
      if (passo === 'escrever_online') { setTextoOnline(''); setIsModoFoco(false); setPasso('escolha_modo'); } 
      else if (passo === 'upload_manuscrito') { setArquivo(null); setPasso('escolha_modo'); }
      else if (passo === 'escolha_modo') setPasso('selecao_tema');
      else if (passo === 'feedback') { 
          setRedacaoSelecionada(null); 
          setPasso('historico');
          navigate('/painel-aluno?aba=historico'); 
      }
  };

  const cancelarNovaRedacao = () => { 
      setTextoOnline(''); setArquivo(null); setTemaSelecionado(null); setIsModoFoco(false); setPasso('selecao_tema'); navigate('/painel-aluno?aba=selecao_tema'); 
  };

  const gerarRepertorioIA = async (temaId) => {
      setIsGerandoRepertorio(true);
      try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`http://127.0.0.1:8000/api/temas/${temaId}/repertorios_ia/`, { headers: { Authorization: `Bearer ${token}` } });
          setRepertorioIA(res.data.html); modalRepertorioIA.onOpen();
      } catch (error) { toast({ title: 'Sistema Ocupado', description: 'Tente novamente em alguns segundos.', status: 'warning' }); }
      setIsGerandoRepertorio(false);
  };

  const imprimirDocumentoOculto = (html) => {
      setIsPreparingPrint(true);
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed'; iframe.style.right = '0'; iframe.style.bottom = '0';
      iframe.style.width = '0px'; iframe.style.height = '0px'; iframe.style.border = 'none';
      document.body.appendChild(iframe);
      iframe.contentWindow.document.open(); iframe.contentWindow.document.write(html); iframe.contentWindow.document.close();
      setTimeout(() => { setIsPreparingPrint(false); iframe.contentWindow.focus(); iframe.contentWindow.print(); setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 1000); }, 1000); 
  };

  const handlePrintFolha = () => {
      const baseUrl = window.location.origin;
      const linhas = Array.from({ length: 30 }, (_, i) => i + 1);
      const dataAtual = new Date().toLocaleDateString('pt-BR');
      let trs = linhas.map(num => `<tr style="height: 7.1mm;"><td style="width: 35px; border-right: 2px solid black; border-bottom: ${num === 30 ? 'none' : '1px solid #ccc'}; text-align: center; vertical-align: middle; font-size: 12px; font-weight: bold; color: #333; background-color: rgba(0,0,0,0.03); -webkit-print-color-adjust: exact; print-color-adjust: exact;">${num}</td><td style="border-bottom: ${num === 30 ? 'none' : '1px solid #ccc'};"></td></tr>`).join('');
      const html = `<!DOCTYPE html><html><head><title>Folha de Redação</title><style>@page { size: A4 portrait; margin: 8mm 15mm; } body { margin: 0; padding: 0; font-family: Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; color: black; display: flex; flex-direction: column; height: 100vh; } * { box-sizing: border-box; } .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; letter-spacing: 5px; font-weight: 900; color: rgba(0,0,0,0.06); z-index: -1; pointer-events: none; white-space: nowrap; }</style></head><body><div class="watermark">GUIA DO TEXTO</div><div style="flex: 1; display: flex; flex-direction: column;"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;"><div><img src="${baseUrl}/logo-print.png" style="max-height: 30px; object-fit: contain;" alt="Logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" /><div style="display: none; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; margin: 0; line-height: 1;"><span style="color: #319795;">Guia do</span> <span style="color: #D69E2E;">Texto</span></div></div><div style="font-weight: 800; font-size: 12px; border: 2px solid #319795; border-radius: 6px; padding: 6px 12px; margin: 0; background-color: transparent; color: #319795; text-transform: uppercase;">DISSERTAÇÃO ${temaSelecionado?.tipo || 'ENEM'}</div></div><div style="border: 2px solid black; border-radius: 8px; padding: 12px 15px; margin-bottom: 10px; background-color: transparent;"><div style="display: flex; gap: 20px; margin-bottom: 12px;"><div style="flex: 1;"><div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #333; margin-bottom: 4px;">Nome do Aluno</div><div style="border-bottom: 1px solid black; height: 22px;"></div></div><div style="width: 140px;"><div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #333; margin-bottom: 4px;">Data</div><div style="border-bottom: 1px solid black; height: 22px;"></div></div></div><div><div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #333; margin-bottom: 6px;">Tema da Redação</div><div style="font-size: 15px; font-weight: bold; color: black; min-height: 24px; line-height: 1.4;">${temaSelecionado?.titulo || ''}</div></div></div><div style="border: 2px solid black; border-radius: 8px; flex: 1; overflow: hidden; background-color: transparent;"><table style="width: 100%; height: 100%; border-collapse: collapse;"><tbody>${trs}</tbody></table></div><div style="display: flex; justify-content: space-between; margin-top: 6px; font-size: 10px; color: #666; font-weight: bold;"><div>Documento Oficial de Treinamento</div><div>Gerado em: ${dataAtual}</div></div></div></body></html>`;
      imprimirDocumentoOculto(html);
  };

  const handlePrintProposta = () => {
      const baseUrl = window.location.origin;
      const dataAtual = new Date().toLocaleDateString('pt-BR');
      let motivadoresHtml = '';
      if (temaSelecionado?.motivadores) {
          temaSelecionado.motivadores.forEach((mot, idx) => {
              const numRomano = ROMAN_NUMERALS[idx] || idx + 1;
              const conteudoHtml = mot.tipo === 'texto' ? `<div class="texto-limpo">${formatarTexto(mot.conteudo)}</div>` : `<div style="display: flex; justify-content: center;"><img src="${mot.arquivo}" style="max-width: 100%; max-height: 400px; filter: grayscale(100%); mix-blend-mode: multiply;" /></div>`;
              motivadoresHtml += `<div style="margin-bottom: 30px; page-break-inside: avoid; break-inside: avoid;"><div style="font-weight: bold; font-size: 13px; color: black; border-left: 6px solid #D69E2E; padding-left: 10px; margin-bottom: 10px; background-color: rgba(0,0,0,0.03); padding-top: 4px; padding-bottom: 4px; padding-right: 16px; display: inline-block; border-radius: 4px;">TEXTO ${numRomano}</div><div style="padding: 15px; border: 1px solid #ccc; font-size: 14px; text-align: justify; border-radius: 8px; line-height: 1.6; background-color: transparent;">${conteudoHtml}</div></div>`;
          });
      }
      const html = `<!DOCTYPE html><html><head><title>Proposta de Redação</title><style>@page { size: A4 portrait; margin: 15mm; } body { margin: 0; padding: 0; font-family: Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; color: black; } * { box-sizing: border-box; } .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; letter-spacing: 5px; font-weight: 900; color: rgba(0,0,0,0.06); z-index: -1; pointer-events: none; white-space: nowrap; } .texto-limpo { word-break: normal !important; overflow-wrap: break-word !important; background-color: transparent !important; } .texto-limpo * { background-color: transparent !important; background: transparent !important; } .texto-limpo p { margin-top: 0; margin-bottom: 12px; } .texto-limpo ul { padding-left: 24px; margin-bottom: 12px; list-style-type: disc; } .texto-limpo ol { padding-left: 24px; margin-bottom: 12px; list-style-type: decimal; } .footer { position: fixed; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; font-size: 10px; color: #666; font-weight: bold; padding-top: 5px; background-color: transparent; } .content { padding-bottom: 25px; } </style></head><body><div class="watermark">GUIA DO TEXTO</div><div class="footer"><div>Documento Oficial de Treinamento</div><div>Gerado em: ${dataAtual}</div></div><div class="content"><div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; border-bottom: 2px solid black; padding-bottom: 12px;"><div><img src="${baseUrl}/logo-print.png" style="max-height: 30px; object-fit: contain;" alt="Logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" /><div style="display: none; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; margin: 0; line-height: 1;"><span style="color: #319795;">Guia do</span> <span style="color: #D69E2E;">Texto</span></div></div><div style="font-weight: 800; font-size: 12px; border: 2px solid #319795; border-radius: 6px; padding: 6px 12px; margin: 0; background-color: transparent; color: #319795; text-transform: uppercase;">PROPOSTA ${temaSelecionado?.tipo || 'ENEM'}</div></div><div style="margin-bottom: 24px;"><div style="font-weight: bold; font-size: 12px; text-transform: uppercase; color: #555; margin-bottom: 4px;">TEMA:</div><div style="font-size: 18px; font-weight: bold; line-height: 1.3; margin: 0;">${temaSelecionado?.titulo || ''}</div></div><div style="margin-bottom: 32px;"><div style="font-weight: bold; font-size: 12px; text-transform: uppercase; color: #555; margin-bottom: 8px;">INSTRUÇÕES:</div><div style="padding: 15px; border: 2px solid black; background-color: transparent; font-size: 14px; text-align: justify; border-radius: 8px; line-height: 1.6;" class="texto-limpo">${formatarTexto(temaSelecionado?.descricao || '')}</div></div><div style="font-size: 16px; font-weight: 900; margin-bottom: 20px; border-bottom: 2px solid black; padding-bottom: 4px; text-transform: uppercase;">TEXTOS MOTIVADORES</div>${motivadoresHtml}</div></body></html>`;
      imprimirDocumentoOculto(html);
  };

  const abrirModalEnvio = () => {
      if (passo === 'upload_manuscrito' && !arquivo) return toast({ title: "Anexe o arquivo da redação!", status: "warning" });
      if (passo === 'escrever_online' && textoOnline.length < 50) return toast({ title: "Texto muito curto!", status: "warning" });
      setModalEnvioOpen(true);
  };

  const confirmarEnvioReal = async () => {
      if (usarVIP && carteira.saldo_vip <= 0 && carteira.saldo_simples < configsGlobais.custo_creditos_vip) { 
          setModalEnvioOpen(false); return toast({ title: 'Créditos Insuficientes', description: `Você precisa de 1 VIP ou ${configsGlobais.custo_creditos_vip} Normais.`, status: 'error' }); 
      }
      if (!usarVIP && carteira.saldo_simples <= 0) { 
          setModalEnvioOpen(false); return toast({ title: 'Sem Saldo', description: 'Você não tem créditos normais. Compre na loja.', status: 'error' }); 
      }

      setEnviando(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('tema', temaSelecionado.id);
      formData.append('is_urgente', usarVIP); 
      
      if (passo === 'upload_manuscrito') formData.append('arquivo', arquivo);
      else formData.append('texto', textoOnline);

      try {
          await axios.post('http://127.0.0.1:8000/api/enviar/', formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
          toast({ title: "Redação enviada com sucesso!", description: "Os créditos foram descontados.", status: "success" });
          setModalEnvioOpen(false); setArquivo(null); setTextoOnline(''); setUsarVIP(false); navigate('/painel-aluno?aba=historico'); carregarDadosIniciais();
      } catch (e) { toast({ title: "Erro ao enviar", status: "error" }); } 
      finally { setEnviando(false); }
  };

  const iniciarCheckout = (tipo, pacote = null) => {
      let precoBruto = 0;
      if (tipo === 'pacote') precoBruto = parseFloat(pacote.preco);
      else precoBruto = (qtdAvulsoNormal * parseFloat(configsGlobais.preco_avulso_normal)) + (qtdAvulsoVip * parseFloat(configsGlobais.preco_avulso_vip));
      
      setCheckoutItem({ tipo, pacote, precoOriginal: precoBruto }); setCupomDigitado(''); setCupomAplicado(null); setDadosPix(null); setModalCheckoutOpen(true);
  };

  const handleBannerClick = () => {
      const bannerAtual = banners[bannerIndex % banners.length];
      if (bannerAtual && bannerAtual.tipo === 'OFERTA' && bannerAtual.pacote_info) iniciarCheckout('pacote', bannerAtual.pacote_info);
  };

  const validarCupom = async () => {
      if(!cupomDigitado.trim()) return;
      try {
          const token = localStorage.getItem('token');
          const res = await axios.post('http://127.0.0.1:8000/api/loja/validar-cupom/', { codigo: cupomDigitado }, { headers: { Authorization: `Bearer ${token}` } });
          setCupomAplicado({ codigo: cupomDigitado.toUpperCase(), desconto: res.data.desconto_percentual });
          toast({ title: "Cupom Validado!", description: `Desconto de ${parseFloat(res.data.desconto_percentual)}% aplicado.`, status: "success" });
      } catch (e) { setCupomAplicado(null); toast({ title: "Ops!", description: e.response?.data?.erro || "Cupom inválido", status: "error" }); }
  };

  const removerCupom = () => { setCupomAplicado(null); setCupomDigitado(''); };

  const processarPagamentoFinal = async () => {
      setProcessandoCompra(true);
      try {
          const token = localStorage.getItem('token');
          
          let valorFinal = checkoutItem.precoOriginal;
          if (cupomAplicado) {
              valorFinal = valorFinal - (valorFinal * parseFloat(cupomAplicado.desconto) / 100);
          }

          let descricao = checkoutItem.tipo === 'pacote' ? checkoutItem.pacote.nome : `Créditos Avulsos: ${qtdAvulsoNormal}x Normais, ${qtdAvulsoVip}x VIPs`;
          let q_simples = checkoutItem.tipo === 'pacote' ? checkoutItem.pacote.qtd_creditos_simples : qtdAvulsoNormal;
          let q_vip = checkoutItem.tipo === 'pacote' ? checkoutItem.pacote.qtd_creditos_vip : qtdAvulsoVip;

          const res = await axios.post('http://127.0.0.1:8000/api/pagamento/pix/', { 
              valor_total: valorFinal,
              descricao: descricao,
              qtd_simples: q_simples,
              qtd_vip: q_vip
          }, { headers: { Authorization: `Bearer ${token}` } });
          
          setDadosPix(res.data); 
          toast({ title: "Código PIX Gerado!", description: "Escaneie o QR Code na tela para concluir a compra.", status: "success" });
          
      } catch (e) { 
          toast({ title: "Erro na compra", description: e.response?.data?.erro || "Verifique a configuração do Mercado Pago no Backend", status: "error" }); 
      }
      setProcessandoCompra(false);
  };

  const processarPagamentoCartao = async () => {
      setProcessandoCartao(true);
      try {
          const token = localStorage.getItem('token');
          let valorFinal = checkoutItem.precoOriginal;
          if (cupomAplicado) valorFinal = valorFinal - (valorFinal * parseFloat(cupomAplicado.desconto) / 100);

          let descricao = checkoutItem.tipo === 'pacote' ? checkoutItem.pacote.nome : `Créditos Avulsos: ${qtdAvulsoNormal}x Normais, ${qtdAvulsoVip}x VIPs`;
          let q_simples = checkoutItem.tipo === 'pacote' ? checkoutItem.pacote.qtd_creditos_simples : qtdAvulsoNormal;
          let q_vip = checkoutItem.tipo === 'pacote' ? checkoutItem.pacote.qtd_creditos_vip : qtdAvulsoVip;
          
          let parcelas = 1;
          if (checkoutItem.tipo === 'pacote' && checkoutItem.pacote.permite_parcelamento) {
              parcelas = checkoutItem.pacote.max_parcelas || 1;
          }

          const res = await axios.post('http://127.0.0.1:8000/api/pagamento/cartao/', { 
              valor_total: valorFinal, descricao: descricao, qtd_simples: q_simples, qtd_vip: q_vip, max_parcelas: parcelas
          }, { headers: { Authorization: `Bearer ${token}` } });
          
          window.open(res.data.link_pagamento, '_blank');
          setTransacaoCartaoId(res.data.transacao_id);
          setAguardandoCartao(true);
          
      } catch (e) { 
          toast({ title: "Erro na geração do link", description: "Tente novamente.", status: "error" }); 
      }
      setProcessandoCartao(false);
  };

  const verificarPagamentoCartao = async () => {
      if(!transacaoCartaoId) return;
      setProcessandoCartao(true);
      try {
          const token = localStorage.getItem('token');
          const res = await axios.post(`http://127.0.0.1:8000/api/loja/verificar-pagamento/${transacaoCartaoId}/`, {}, { headers: { Authorization: `Bearer ${token}` } });
          
          if (res.data.status === 'APROVADO') {
              toast({ title: "Pagamento Aprovado! 🎉", description: "Os créditos já estão na sua carteira.", status: "success", duration: 5000 });
              setModalCheckoutOpen(false); setAguardandoCartao(false); setTransacaoCartaoId(null);
              setQtdAvulsoNormal(0); setQtdAvulsoVip(0); setCheckoutItem(null);
              carregarDadosIniciais(); window.dispatchEvent(new Event('atualizarCarteira')); 
          } else {
              toast({ title: "Ainda Pendente", description: "O Mercado Pago ainda está a processar. Se já pagou, aguarde uns segundos e verifique novamente.", status: "warning", duration: 5000 });
          }
      } catch (e) { toast({ title: "Erro na verificação", status: "error" }); }
      setProcessandoCartao(false);
  };

  const copiarPix = () => {
      navigator.clipboard.writeText(dadosPix.qr_code);
      toast({ title: 'Código PIX Copiado!', status: 'info', duration: 2500, position: 'top' });
  };

  const abrirFeedback = async (id) => {
    try {
        const response = await axios.get(`http://127.0.0.1:8000/api/redacao/${id}/`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        let dados = response.data;
        if (dados.texto && dados.texto.trim() !== '') { dados.conteudoTexto = dados.texto; } 
        else if (dados.arquivo && dados.arquivo.endsWith('.txt')) { const textRes = await axios.get(dados.arquivo); dados.conteudoTexto = textRes.data; }
        setRedacaoSelecionada(dados); setPasso('feedback'); 
    } catch (e) {}
  };

  const abrirMotivo = async (id) => {
      try {
          const response = await axios.get(`http://127.0.0.1:8000/api/redacao/${id}/`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
          setRedacaoDevolvidaInfo(response.data);
          modalDevolvida.onOpen();
      } catch (e) {
          toast({ title: 'Erro ao carregar detalhes', status: 'error' });
      }
  };

  const abrirMaterial = (m) => {
      const temTexto = m.conteudo && m.conteudo.length > 5;
      const temExtra = m.dados_extras && Object.keys(m.dados_extras).length > 0;
      
      if (temTexto || temExtra) {
          setMaterialSelecionado(m);
          modalLeitor.onOpen();
      } else if (m.arquivo) {
          window.open(m.arquivo, '_blank');
      } else {
          toast({ title: "Este material não possui conteúdo legível.", status: "info" });
      }
  };

  const historicoFiltrado = redacoes.filter(r => {
      const matchBusca = r.tema_titulo.toLowerCase().includes(buscaHistorico.toLowerCase()) || String(r.id).includes(buscaHistorico.toLowerCase());
      const matchStatus = statusFiltro === 'TODOS' ? true : r.status === statusFiltro;
      const tipoRedacao = r.tema_tipo || r.tipo || 'ENEM';
      const matchTipo = tipoFiltro === 'TODOS' ? true : tipoRedacao.toUpperCase() === tipoFiltro;
      let matchData = true;
      if (dataInicioFiltro || dataFimFiltro) {
          const dataRed = new Date(r.data_envio); dataRed.setHours(0, 0, 0, 0); 
          if (dataInicioFiltro && dataRed < new Date(dataInicioFiltro + 'T00:00:00')) matchData = false;
          if (dataFimFiltro && dataRed > new Date(dataFimFiltro + 'T23:59:59')) matchData = false;
      }
      return matchBusca && matchStatus && matchTipo && matchData;
  });

  const temasFiltrados = temas.filter(t => { return t.titulo.toLowerCase().includes(buscaTema.toLowerCase()) && (filtroTemaTipo === 'TODOS' ? true : t.tipo === filtroTemaTipo) && t.ativo !== false; });

  const redacoesCorrigidas = redacoes.filter(r => r.status === 'CORRIGIDA' && r.nota_final != null);
  const redacoesEnemGlobais = redacoesCorrigidas.filter(r => (r.tema_tipo || r.tipo || 'ENEM').toUpperCase() === 'ENEM');
  const mediaGeralEnem = redacoesEnemGlobais.length > 0 ? Math.round(redacoesEnemGlobais.reduce((acc, r) => acc + Number(r.nota_final), 0) / redacoesEnemGlobais.length) : 0;
  const maiorNotaAlcancada = redacoesCorrigidas.length > 0 ? Math.max(...redacoesCorrigidas.map(r => Number(r.nota_final))) : 0;
  const totalCorrigidas = redacoesCorrigidas.length;

  const redacoesGrafico = redacoesCorrigidas.filter(r => (r.tema_tipo || r.tipo || 'ENEM').toUpperCase() === filtroGraficoTipo);

  const historicoNotas = redacoesGrafico
      .slice()
      .sort((a, b) => new Date(a.data_envio) - new Date(b.data_envio))
      .map((r, index) => ({ name: `R${index + 1}`, tema: r.tema_titulo, nota: Number(r.nota_final || 0) }));

  let radarData = filtroGraficoTipo === 'ENEM' ? [
      { name: 'C1 (Gramática)', media: 0, fullMark: 200 }, { name: 'C2 (Tema)', media: 0, fullMark: 200 }, { name: 'C3 (Argumentos)', media: 0, fullMark: 200 }, { name: 'C4 (Coesão)', media: 0, fullMark: 200 }, { name: 'C5 (Proposta)', media: 0, fullMark: 200 },
  ] : [
      { name: 'C1 (Gramática)', media: 0, fullMark: 25 }, { name: 'C2 (Estrutura)', media: 0, fullMark: 25 }, { name: 'C3 (Argumentação)', media: 0, fullMark: 25 }, { name: 'C4 (Coesão/Coerência)', media: 0, fullMark: 25 },
  ];

  let piorCompetencia = null;

  if (redacoesGrafico.length > 0) {
      let numComps = filtroGraficoTipo === 'ENEM' ? 5 : 4;
      let totals = Array(numComps).fill(0);
      let counts = Array(numComps).fill(0);

      redacoesGrafico.forEach(r => {
          if (r.correcao && r.correcao.competencias) {
              r.correcao.competencias.forEach(c => {
                  if(c.comp >= 1 && c.comp <= numComps) { totals[c.comp - 1] += Number(c.nota); counts[c.comp - 1] += 1; }
              });
          }
      });
      radarData = radarData.map((item, idx) => ({ ...item, media: counts[idx] > 0 ? Math.round(totals[idx] / counts[idx]) : 0 }));
      let minRatio = Infinity;
      radarData.forEach(comp => {
          if (comp.media > 0) { 
              const ratio = comp.media / comp.fullMark;
              if (ratio < minRatio) { minRatio = ratio; piorCompetencia = comp; }
          }
      });
  }

  const handlePrintLista = () => {
      const baseUrl = window.location.origin;
      const dataAtual = new Date().toLocaleDateString('pt-BR');
      const trs = historicoFiltrado.map(red => `<tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #555; font-weight: bold;">#${red.id}</td><td style="padding: 10px; border-bottom: 1px solid #eee; color: #333; font-weight: bold;">${red.tema_titulo}</td><td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">${red.tema_tipo || red.tipo || 'ENEM'}</td><td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">${new Date(red.data_envio).toLocaleDateString()}</td><td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">${red.status.replace('_', ' ')}</td><td style="padding: 10px; border-bottom: 1px solid #eee; color: ${red.nota_final ? '#2F855A' : '#999'}; font-weight: 900;">${red.nota_final || '-'}</td></tr>`).join('');
      const html = `<!DOCTYPE html><html><head><title>Relatório de Redações</title><style>@page { size: A4 portrait; margin: 15mm; } body { margin: 0; padding: 0; font-family: Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; color: black; } * { box-sizing: border-box; } .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; letter-spacing: 5px; font-weight: 900; color: rgba(0,0,0,0.04); z-index: -1; pointer-events: none; white-space: nowrap; } .footer { position: fixed; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; font-size: 10px; color: #666; font-weight: bold; padding-top: 10px; border-top: 1px solid #eee; background-color: white; z-index: 100; } .content { padding-bottom: 40px; }</style></head><body><div class="watermark">GUIA DO TEXTO</div><div class="footer"><div>Documento Oficial de Acompanhamento</div><div>Impresso em: ${dataAtual}</div></div><div class="content"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid black; padding-bottom: 15px;"><div><img src="${baseUrl}/logo-print.png" style="max-height: 30px; object-fit: contain;" alt="Logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" /><div style="display: none; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; margin: 0; line-height: 1;"><span style="color: #319795;">Guia do</span> <span style="color: #D69E2E;">Texto</span></div></div><div style="font-weight: 900; font-size: 16px; color: #333; text-transform: uppercase; letter-spacing: 1px;">Relatório de Redações</div></div><div style="margin-bottom: 20px;"><div style="font-size: 14px; color: #555;">Aluno: <strong>${usuario.first_name || usuario.username || 'Aluno'}</strong></div></div><table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;"><thead><tr style="background-color: #f7fafc;"><th style="padding: 12px 10px; border-bottom: 2px solid #cbd5e0; color: #4a5568;">Cód.</th><th style="padding: 12px 10px; border-bottom: 2px solid #cbd5e0; color: #4a5568;">Tema da Redação</th><th style="padding: 12px 10px; border-bottom: 2px solid #cbd5e0; color: #4a5568;">Tipo</th><th style="padding: 12px 10px; border-bottom: 2px solid #cbd5e0; color: #4a5568;">Data</th><th style="padding: 12px 10px; border-bottom: 2px solid #cbd5e0; color: #4a5568;">Status</th><th style="padding: 12px 10px; border-bottom: 2px solid #cbd5e0; color: #4a5568;">Nota</th></tr></thead><tbody>${trs}</tbody></table></div></body></html>`;
      imprimirDocumentoOculto(html);
  }

  const renderConteudo = () => {
      
      if (passo === 'dashboard') {
          const bannerAtual = banners.length > 0 ? banners[bannerIndex % banners.length] : null;
          return (
            <Container maxW="full" p={{ base: 4, md: 8 }}>
                
                <Flex direction={{ base: "column", xl: "row" }} justify="space-between" align={{ base: "start", xl: "center" }} mb={8} gap={6}>
                    <Box>
                        <Heading size="lg" color="teal.700" mb={1}>Olá, {usuario.first_name || 'Aluno'}! 👋</Heading>
                        <Text color="gray.500" fontSize="md">Bem-vindo(a) de volta. Acompanhe o seu desempenho.</Text>
                    </Box>
                    
                    {bannerAtual && (
                        <Box 
                            key={bannerAtual.id}
                            className={bannerAtual.tipo === 'OFERTA' ? 'banner-oferta' : ''}
                            animation="fadeSlideIn 0.5s ease-out"
                            flex="1"
                            w="full" 
                            maxW={{ base: "100%", xl: "700px" }}
                            flexShrink={0}
                        >
                            <Card 
                                as={bannerAtual.tipo === 'OFERTA' ? 'button' : 'div'} 
                                onClick={bannerAtual.tipo === 'OFERTA' ? handleBannerClick : undefined} 
                                w="full"
                                h={{ base: "auto", md: "90px" }} 
                                bgGradient={!bannerAtual.imagem_fundo ? bannerAtual.cor_fundo : 'none'} 
                                bg={bannerAtual.imagem_fundo ? 'gray.900' : undefined} 
                                shadow="sm" border="none" px={5} py={2} borderRadius="xl" overflow="hidden" position="relative" 
                                display="flex" flexDirection={{ base: "column", md: "row" }} justify="space-between" align={{ base: "start", md: "center" }} gap={4} 
                                transition="all 0.2s"
                                _hover={bannerAtual.tipo === 'OFERTA' ? { transform: 'translateY(-2px)', shadow: 'lg', filter: 'brightness(1.05)' } : {}}
                            >
                                {bannerAtual.imagem_fundo && (<><Image src={bannerAtual.imagem_fundo} position="absolute" top={0} left={0} w="100%" h="100%" objectFit="cover" zIndex={0} pointerEvents="none" /><Box position="absolute" top={0} left={0} w="100%" h="100%" bgGradient="linear(to-r, rgba(0,0,0,0.9), rgba(0,0,0,0.4))" zIndex={1} pointerEvents="none" /></>)}
                                
                                <VStack align="start" spacing={0} justify="center" h="full" w="full" position="relative" zIndex={2}>
                                    <Badge colorScheme={bannerAtual.tipo === 'EVENTO' ? 'green' : 'whiteAlpha'} fontSize="2xs" mb={1}>{bannerAtual.tipo === 'OFERTA' ? 'OFERTA LIMITADA' : (bannerAtual.tipo === 'EVENTO' ? 'AULÃO AO VIVO' : 'AVISO')}</Badge>
                                    <Heading size="sm" color="white" lineHeight="1.2" noOfLines={1} mb={0.5} textShadow={bannerAtual.imagem_fundo ? "0px 1px 3px rgba(0,0,0,0.8)" : "none"}>{bannerAtual.titulo}</Heading>
                                    {bannerAtual.descricao && <Text fontSize="sm" color="whiteAlpha.900" noOfLines={1} textShadow={bannerAtual.imagem_fundo ? "0px 1px 2px rgba(0,0,0,0.8)" : "none"}>{bannerAtual.descricao}</Text>}
                                </VStack>
                                
                                {bannerAtual.tipo === 'OFERTA' && (
                                    <HStack position="relative" zIndex={2} spacing={3} bg="blackAlpha.500" px={8} py={4} borderRadius="lg" justify="center" backdropFilter="blur(4px)" border="1px solid rgba(255,255,255,0.2)">
                                        <TimeIcon color="white" boxSize={6} />
                                        <Text fontSize="lg" fontWeight="bold" color="white" lineHeight="1" letterSpacing="widest" whiteSpace="nowrap">{tempoVitrine || 'Calculando...'}</Text>
                                    </HStack>
                                )}

                                {/* --- ESTRUTURA DO EVENTO: REDUZIDA E EQUILIBRADA --- */}
                                {bannerAtual.tipo === 'EVENTO' && bannerAtual.data_fim && (
                                    <HStack position="relative" zIndex={2} spacing={3} bg="whiteAlpha.900" px={5} py={2} borderRadius="xl" justify="center" color="gray.800" shadow="md">
                                        <VStack spacing={0}>
                                            <Text fontSize="xs" fontWeight="900" textTransform="uppercase" color="red.500" lineHeight="1">{new Date(bannerAtual.data_fim).toLocaleString('pt-BR', { month: 'short' })}</Text>
                                            <Text fontSize="2xl" fontWeight="900" lineHeight="1" my={0}>{new Date(bannerAtual.data_fim).getDate()}</Text>
                                        </VStack>
                                        <Divider orientation="vertical" h="30px" borderColor="gray.300" />
                                        <Text fontSize="2xl" fontWeight="900" lineHeight="1" whiteSpace="nowrap">{new Date(bannerAtual.data_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
                                    </HStack>
                                )}
                            </Card>
                        </Box>
                    )}
                </Flex>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
                    <Card p={5} shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.100" borderTop="4px solid" borderTopColor="teal.400">
                        <Stat><StatLabel color="gray.500" fontSize="xs" textTransform="uppercase" fontWeight="bold">Média Geral (ENEM)</StatLabel><StatNumber fontSize="3xl" color="teal.600" fontWeight="900">{mediaGeralEnem}</StatNumber></Stat>
                    </Card>
                    <Card p={5} shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.100" borderTop="4px solid" borderTopColor="yellow.400">
                        <Stat><StatLabel color="gray.500" fontSize="xs" textTransform="uppercase" fontWeight="bold">Maior Nota Alcançada</StatLabel><StatNumber fontSize="3xl" color="yellow.600" fontWeight="900">{maiorNotaAlcancada}</StatNumber></Stat>
                    </Card>
                    <Card p={5} shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.100" borderTop="4px solid" borderTopColor="blue.400">
                        <Stat><StatLabel color="gray.500" fontSize="xs" textTransform="uppercase" fontWeight="bold">Redações Corrigidas</StatLabel><StatNumber fontSize="3xl" color="blue.600" fontWeight="900">{totalCorrigidas}</StatNumber></Stat>
                    </Card>
                </SimpleGrid>

                <Grid templateColumns={{ base: "repeat(1, 1fr)", xl: "repeat(3, 1fr)" }} gap={6} mb={8}>
                    <GridItem colSpan={{ base: 1, xl: 2 }}>
                        <Card p={5} shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.200" bg="white" h="100%">
                            <Flex justify="space-between" align="flex-start" mb={2}>
                                <Box><Heading size="sm" color="gray.700" textTransform="uppercase" letterSpacing="wide">Evolução das Notas</Heading><Text fontSize="xs" color="gray.400" mt={1}>* R1, R2... indicam a ordem cronológica de envio das suas redações.</Text></Box>
                                <Box bg="gray.50" p={1} borderRadius="md" border="1px solid" borderColor="gray.200">
                                    <Select size="sm" variant="unstyled" px={2} fontWeight="bold" color="teal.700" value={filtroGraficoTipo} onChange={(e) => setFiltroGraficoTipo(e.target.value)}><option value="ENEM">Modelo ENEM (0-1000)</option><option value="SIMPLES">Modelo Simples (0-100)</option></Select>
                                </Box>
                            </Flex>
                            
                            {historicoNotas.length > 0 ? (
                                <Box h="250px" w="100%" mt={4}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={historicoNotas} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                                            <defs><linearGradient id="colorNota" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#319795" stopOpacity={0.4}/><stop offset="95%" stopColor="#319795" stopOpacity={0}/></linearGradient></defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDF2F7"/>
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#718096'}} dy={10} />
                                            <YAxis domain={[0, filtroGraficoTipo === 'ENEM' ? 1000 : 100]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#718096'}} />
                                            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} labelStyle={{ fontWeight: 'bold', color: '#2D3748', marginBottom: '4px' }} formatter={(value) => [`${value} pts`, 'Nota Final']} labelFormatter={(label) => { const reda = historicoNotas.find(r => r.name === label); return reda ? reda.tema : label; }} />
                                            <Area type="monotone" dataKey="nota" stroke="#319795" strokeWidth={4} fillOpacity={1} fill="url(#colorNota)" activeDot={{r: 7, strokeWidth: 0, fill: '#319795'}} animationDuration={1500} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Box>
                            ) : (<Flex h="250px" align="center" justify="center" bg="gray.50" borderRadius="lg" border="1px dashed" borderColor="gray.300"><Text color="gray.400" fontSize="sm">Conclua sua primeira redação {filtroGraficoTipo} para ver o gráfico.</Text></Flex>)}
                        </Card>
                    </GridItem>

                    <GridItem colSpan={1}>
                        <Card p={5} shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.200" bg="white" h="100%">
                            <Heading size="sm" mb={2} color="gray.700" textTransform="uppercase" letterSpacing="wide">Média por Competência</Heading>
                            {redacoesGrafico.length > 0 ? (
                                <Box h="265px" w="100%">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                                            <PolarGrid stroke="#E2E8F0" />
                                            <PolarAngleAxis dataKey="name" tick={{fontSize: 10, fill: '#4A5568', fontWeight: 'bold'}} />
                                            <PolarRadiusAxis angle={30} domain={[0, filtroGraficoTipo === 'ENEM' ? 200 : 25]} tick={false} axisLine={false} />
                                            <Radar name="Média" dataKey="media" stroke="#805AD5" strokeWidth={2} fill="#B794F4" fillOpacity={0.6} animationDuration={1500} />
                                            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value) => [`${value} pts`, 'Sua Média']} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </Box>
                            ) : (<Flex h="250px" align="center" justify="center" bg="gray.50" borderRadius="lg" border="1px dashed" borderColor="gray.300"><Text color="gray.400" fontSize="sm">Nenhum dado para analisar.</Text></Flex>)}
                        </Card>
                    </GridItem>
                    
                    {piorCompetencia && (
                        <GridItem colSpan={{ base: 1, xl: 3 }}>
                            <Card bg="blue.50" shadow="sm" borderRadius="xl" border="1px solid" borderColor="blue.100">
                                <CardBody display="flex" flexDirection={{ base: "column", md: "row" }} alignItems="center" gap={6}>
                                    <Flex bg="blue.500" w="60px" h="60px" borderRadius="full" align="center" justify="center" flexShrink={0}><Icon as={InfoIcon} color="white" boxSize={6} /></Flex>
                                    <Box flex="1">
                                        <Heading size="sm" color="blue.800" mb={1} textTransform="uppercase">Dica Estratégica: Onde Focar</Heading>
                                        <Text color="blue.900" fontSize="md">Notamos que sua média na <strong>{piorCompetencia.name}</strong> está em {piorCompetencia.media} pontos. <br /><em>💡 {DICAS_INTELIGENTES[piorCompetencia.name] || 'Procure rever os conceitos desta competência nas suas próximas produções.'}</em></Text>
                                    </Box>
                                </CardBody>
                            </Card>
                        </GridItem>
                    )}
                </Grid>
            </Container>
          );
      }

      if (passo === 'historico') {
          return (
            <Container maxW="full" p={{ base: 4, md: 8 }}>
                <Heading size="lg" color="teal.700" mb={2}>Minhas Redações</Heading>
                <Text mb={6} color="gray.500">Histórico completo de envios e correções.</Text>

                <Flex gap={4} bg="white" p={5} borderRadius="xl" boxShadow="sm" align="center" border="1px solid" borderColor="gray.100" mb={6} wrap="wrap">
                    <InputGroup flex={1} minW="250px"><InputLeftElement pointerEvents='none'><SearchIcon color='gray.400'/></InputLeftElement><Input placeholder="Buscar Tema ou Cód..." value={buscaHistorico} onChange={e => setBuscaHistorico(e.target.value)} /></InputGroup>
                    <Select w="150px" value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)}><option value="TODOS">Tipo: Todos</option><option value="ENEM">ENEM</option><option value="SIMPLES">Simples</option></Select>
                    <Select w="150px" value={statusFiltro} onChange={e => setStatusFiltro(e.target.value)}>
                        <option value="TODOS">Status: Todos</option>
                        <option value="AGUARDANDO">Aguardando</option>
                        <option value="EM_CORRECAO">Em Correção</option>
                        <option value="CORRIGIDA">Corrigidas</option>
                        <option value="DEVOLVIDA">Devolvidas</option> 
                    </Select>
                    <Divider orientation="vertical" h="30px" display={{base: 'none', md: 'block'}} />
                    <HStack spacing={2}><Text fontSize="sm" color="gray.500" fontWeight="medium">De:</Text><Input type="date" size="md" value={dataInicioFiltro} onChange={e => setDataInicioFiltro(e.target.value)} w="140px" /><Text fontSize="sm" color="gray.500" fontWeight="medium">Até:</Text><Input type="date" size="md" value={dataFimFiltro} onChange={e => setDataFimFiltro(e.target.value)} w="140px" /></HStack>
                    <Button leftIcon={<DownloadIcon />} variant="ghost" colorScheme="blue" onClick={handlePrintLista}>Imprimir</Button>
                </Flex>

                <Card bg="white" shadow="sm" borderRadius="lg" overflow="hidden">
                    <Box overflowX="auto">
                        <Table variant="simple" style={{ tableLayout: 'fixed', width: '100%' }}>
                            <Thead bg="gray.50"><Tr><Th w="6%" px={4}>Cód.</Th><Th w="42%" px={4}>Tema da Redação</Th><Th w="10%" px={3} textAlign="center">Tipo</Th><Th w="12%" px={3} textAlign="center">Data Envio</Th><Th w="15%" px={3} textAlign="center">Status</Th><Th w="6%" px={3} textAlign="center">Nota</Th><Th w="9%" px={4} textAlign="center">Ação</Th></Tr></Thead>
                            <Tbody>
                                {historicoFiltrado.map(red => {
                                    const tipoRedacao = red.tema_tipo || red.tipo || 'ENEM';
                                    return (
                                        <Tr key={red.id} _hover={{ bg: 'gray.50' }}>
                                            <Td fontWeight="bold" color="gray.500" px={4}>#{red.id}</Td>
                                            <Td fontWeight="medium" isTruncated px={4} title={red.tema_titulo}>{red.tema_titulo} {red.vip_pago && <Badge ml={2} colorScheme="purple" fontSize="2xs"><StarIcon mr={1}/>VIP</Badge>}</Td>
                                            <Td px={3} textAlign="center"><Badge bg={tipoRedacao === 'ENEM' ? 'green.50' : 'blue.50'} color={tipoRedacao === 'ENEM' ? 'green.700' : 'blue.700'} px={2} py={1} borderRadius="md" fontWeight="bold" letterSpacing="wide" fontSize="xs">{tipoRedacao}</Badge></Td>
                                            <Td fontSize="sm" px={3} color="gray.600" textAlign="center">{new Date(red.data_envio).toLocaleDateString()}</Td>
                                            
                                            <Td px={3} textAlign="center">
                                                <Badge colorScheme={red.status === 'CORRIGIDA' ? 'green' : red.status === 'DEVOLVIDA' ? 'red' : red.status === 'EM_CORRECAO' ? 'blue' : 'yellow'} borderRadius="md" px={2}>
                                                    {red.status.replace('_', ' ')}
                                                </Badge>
                                            </Td>
                                            
                                            <Td fontWeight="bold" px={3} textAlign="center" color={red.nota_final >= 900 ? 'green.500' : 'gray.700'}>{red.nota_final || '-'}</Td>
                                            <Td px={4} textAlign="center">
                                                {red.status === 'CORRIGIDA' && (<Button size="sm" colorScheme="teal" variant="ghost" onClick={() => abrirFeedback(red.id)} leftIcon={<ViewIcon />}>Ver</Button>)}
                                                {red.status === 'DEVOLVIDA' && (<Button size="sm" colorScheme="red" variant="outline" onClick={() => abrirMotivo(red.id)} leftIcon={<WarningTwoIcon />}>Motivo</Button>)}
                                                {['AGUARDANDO', 'EM_CORRECAO', 'AUDITORIA'].includes(red.status) && (<Text fontSize="xs" color="gray.400">Aguarde</Text>)}
                                            </Td>
                                        </Tr>
                                    );
                                })}
                                {historicoFiltrado.length === 0 && <Tr><Td colSpan={7} textAlign="center" py={6} color="gray.500">Nenhuma redação encontrada.</Td></Tr>}
                            </Tbody>
                        </Table>
                    </Box>
                </Card>
            </Container>
          );
      }

      if (passo === 'selecao_tema') { 
          return (
            <Container maxW="full" py={8} px={{ base: 4, md: 8 }}>
                <Heading mb={2} color="teal.700">Treinar Redação</Heading>
                <Text mb={6} color="gray.500">Selecione a proposta desejada para iniciar o seu treino.</Text>
                
                <Flex gap={4} bg="white" p={5} borderRadius="xl" boxShadow="sm" align="center" border="1px solid" borderColor="gray.100" mb={8} wrap="wrap">
                    <InputGroup flex={1} minW="250px"><InputLeftElement pointerEvents='none'><SearchIcon color='gray.400'/></InputLeftElement><Input placeholder="Pesquisar por título do tema..." value={buscaTema} onChange={e => setBuscaTema(e.target.value)} /></InputGroup>
                    <Select w="200px" value={filtroTemaTipo} onChange={e => setFiltroTemaTipo(e.target.value)}><option value="TODOS">Todos os Tipos</option><option value="ENEM">Modelo ENEM</option><option value="SIMPLES">Modelo Simples</option></Select>
                </Flex>
                
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
                    {temasFiltrados.map(tema => (
                        <Card key={tema.id} cursor="pointer" onClick={() => selecionarTema(tema)} borderRadius="2xl" overflow="hidden" border="1px solid" borderColor="gray.100" bg="white" _hover={{ shadow: 'xl', transform: 'translateY(-4px)', borderColor: tema.tipo === 'ENEM' ? 'green.300' : 'blue.300' }} transition="all 0.3s cubic-bezier(.25,.8,.25,1)" role="group">
                            <Box h="6px" w="full" bgGradient={tema.tipo === 'ENEM' ? "linear(to-r, green.400, teal.400)" : "linear(to-r, blue.400, cyan.400)"} />
                            <CardBody p={6} display="flex" flexDirection="column">
                                <Flex justify="space-between" align="start" mb={4}>
                                    <Badge bg={tema.tipo === 'ENEM' ? 'green.50' : 'blue.50'} color={tema.tipo === 'ENEM' ? 'green.700' : 'blue.700'} px={3} py={1} borderRadius="full" fontSize="xs" fontWeight="bold" letterSpacing="wide">{tema.tipo}</Badge>
                                    <Icon as={ArrowForwardIcon} color="gray.300" boxSize={5} _groupHover={{ color: tema.tipo === 'ENEM' ? 'green.500' : 'blue.500', transform: 'translateX(4px)' }} transition="all 0.2s" />
                                </Flex>
                                <Text fontSize="18px" lineHeight="26px" color="gray.800" fontWeight="bold" pb={2}>{tema.titulo}</Text>
                            </CardBody>
                        </Card>
                    ))}
                </SimpleGrid>
            </Container>
          ); 
      }

      if (passo === 'escolha_modo') { 
          return (
            <Container maxW="container.lg" py={10}>
                <Flex justify="space-between" align="center" mb={6}><Button leftIcon={<ArrowBackIcon />} variant="ghost" onClick={voltar}>Trocar de Tema</Button><Button leftIcon={<CloseIcon />} variant="ghost" colorScheme="red" onClick={cancelarNovaRedacao}>Cancelar Redação</Button></Flex>
                <Box bg="white" p={{ base: 6, md: 10 }} borderRadius="2xl" boxShadow="sm" border="1px solid" borderColor="gray.100" textAlign="center">
                    <VStack mb={10}><Heading mb={2} color="teal.700">Como você prefere escrever?</Heading><Text color="gray.500" fontSize="lg">Tema selecionado: <b>{temaSelecionado?.titulo}</b></Text></VStack>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                        <Card cursor="pointer" onClick={() => escolherModo('manuscrito')} border="2px solid" borderColor="teal.500" bg="teal.50" _hover={{ transform: 'scale(1.02)', shadow: 'lg' }} transition="all 0.2s"><CardBody py={12}><Icon as={EditIcon} boxSize={14} color="teal.600" mb={4}/><Heading size="md" mb={3}>Modo Manuscrito</Heading><Badge colorScheme="teal" mb={4} px={3} py={1} borderRadius="full">MÉTODO RECOMENDADO</Badge><Text fontSize="md" color="gray.600">Simule a prova oficial. Imprima a folha de redação, escreva à mão e envie uma foto para correção.</Text></CardBody></Card>
                        <Card cursor="pointer" onClick={() => escolherModo('online')} border="1px solid" borderColor="gray.200" _hover={{ transform: 'scale(1.02)', shadow: 'lg', borderColor: 'blue.400' }} transition="all 0.2s"><CardBody py={12}><Icon as={CopyIcon} boxSize={14} color="blue.400" mb={4}/><Heading size="md" mb={4} mt={3}>Editor Digital</Heading><Text fontSize="md" color="gray.600" px={4}>Pratique sua redação digitando diretamente na nossa plataforma interativa simulando as linhas da folha.</Text></CardBody></Card>
                    </SimpleGrid>
                </Box>
            </Container>
          ); 
      }

      if (passo === 'upload_manuscrito') { 
          return (
            <Container maxW="full" py={8} px={{ base: 4, md: 8 }} h="full">
                <GlobalStyles />
                <Flex h="full" gap={8} direction={{ base: 'column', lg: 'row' }}>
                    <Box flex="1" overflowY="auto" pr={2}><Flex justify="space-between" align="center" mb={6}><Button leftIcon={<ArrowBackIcon />} variant="ghost" onClick={voltar}>Voltar</Button><Button leftIcon={<CloseIcon />} variant="ghost" colorScheme="red" size="sm" onClick={cancelarNovaRedacao}>Cancelar Redação</Button></Flex><VisualizadorTema tema={temaSelecionado} onGerarRepertorio={gerarRepertorioIA} isGerandoRepertorio={isGerandoRepertorio} /></Box>
                    <Box w={{ base: '100%', lg: '420px' }} bg="white" p={6} borderRadius="xl" shadow="xl" border="1px solid" borderColor="gray.200" h="fit-content" maxH="calc(100vh - 40px)" overflowY="auto" position="sticky" top="20px" display="flex" flexDirection="column" gap={6}><Box><Flex align="center" gap={3} mb={5}><Icon as={InfoIcon} color="teal.500" boxSize={5} /><Heading size="md" color="gray.700">Ações da Redação</Heading></Flex><VStack align="start" spacing={3} mb={6}><HStack align="start"><Badge colorScheme="teal" borderRadius="full" px={2} py={0.5}>1</Badge><Text fontSize="sm" color="gray.600"><strong>Imprima</strong> os materiais nos botões abaixo.</Text></HStack><HStack align="start"><Badge colorScheme="teal" borderRadius="full" px={2} py={0.5}>2</Badge><Text fontSize="sm" color="gray.600"><strong>Escreva</strong> à mão cronometrando o tempo.</Text></HStack><HStack align="start"><Badge colorScheme="teal" borderRadius="full" px={2} py={0.5}>3</Badge><Text fontSize="sm" color="gray.600"><strong>Digitalize</strong> a folha (foto nítida ou scanner).</Text></HStack><HStack align="start"><Badge colorScheme="teal" borderRadius="full" px={2} py={0.5}>4</Badge><Text fontSize="sm" color="gray.600"><strong>Anexe</strong> o arquivo abaixo e confirme.</Text></HStack></VStack><VStack spacing={3} w="full"><Button w="full" size="md" colorScheme="teal" leftIcon={<DownloadIcon />} onClick={handlePrintFolha} shadow="md">Imprimir Folha Oficial</Button><Button w="full" size="sm" colorScheme="yellow" color="yellow.900" bg="yellow.400" _hover={{ bg: "yellow.500" }} leftIcon={<DownloadIcon />} onClick={handlePrintProposta} shadow="sm">Imprimir Proposta</Button></VStack></Box><Divider borderColor="gray.300" /><Box><Heading size="sm" mb={4} color="gray.700" textAlign="center">Anexar e Enviar</Heading><Box w="full" h="180px" border="2px dashed" borderColor={arquivo ? "green.400" : "gray.300"} borderRadius="lg" display="flex" flexDirection="column" alignItems="center" justifyContent="center" bg={arquivo ? "green.50" : "gray.50"} cursor="pointer" onClick={() => fileInputRef.current.click()} transition="all 0.2s" _hover={{ bg: arquivo ? 'green.100' : 'gray.100', borderColor: arquivo ? 'green.500' : 'teal.400' }} p={4}><Icon as={arquivo ? CheckCircleIcon : AttachmentIcon} boxSize={8} color={arquivo ? "green.500" : "gray.400"} mb={2} /><Text fontSize="sm" color={arquivo ? "green.800" : "gray.600"} fontWeight="bold" textAlign="center">{arquivo ? arquivo.name : "Clique para anexar Foto ou PDF"}</Text>{!arquivo && <Text fontSize="xs" color="gray.400" mt={1} textAlign="center">Tamanho máximo: 5MB</Text>}</Box><Input type="file" display="none" ref={fileInputRef} onChange={e => setArquivo(e.target.files[0])} accept="image/*,.pdf" /><Button colorScheme="teal" size="lg" w="full" mt={4} onClick={abrirModalEnvio} isDisabled={!arquivo} leftIcon={<ArrowUpIcon />} shadow="md">Confirmar Envio</Button></Box></Box>
                </Flex>
            </Container>
          ); 
      }

      if (passo === 'escrever_online') { 
          return (
            <Container maxW="full" p={0} h="full" display="flex" flexDirection="column">
                <GlobalStyles />
                <Flex h="full" w="full" overflow="hidden">
                    {!isModoFoco && (<Box w={{ base: '100%', lg: '45%' }} overflowY="auto" p={6} borderRight="1px solid #e2e8f0" bg="white"><Flex justify="space-between" align="center" mb={6}><Button leftIcon={<ArrowBackIcon />} variant="ghost" onClick={voltar}>Voltar aos Temas</Button><Button leftIcon={<CloseIcon />} variant="ghost" colorScheme="red" size="sm" onClick={cancelarNovaRedacao}>Cancelar Redação</Button></Flex><VisualizadorTema tema={temaSelecionado} onGerarRepertorio={gerarRepertorioIA} isGerandoRepertorio={isGerandoRepertorio} /></Box>)}
                    <Box flex="1" bg="gray.100" display="flex" flexDirection="column" h="full">
                        <Flex bg="white" borderBottom="1px solid #ccc" p={4} justify="space-between" align="center" shadow="sm" zIndex={10}>
                            <HStack spacing={4}>{isModoFoco && (<Button size="sm" variant="ghost" onClick={voltar} leftIcon={<ArrowBackIcon />}>Sair</Button>)}<Button size="sm" colorScheme="blue" variant={isModoFoco ? "solid" : "outline"} onClick={() => setIsModoFoco(!isModoFoco)}>{isModoFoco ? "Ver Textos Motivadores" : "Modo Foco"}</Button><Divider orientation="vertical" h="24px" display={{ base: 'none', md: 'block' }} /><Heading size="sm" color="gray.700" display={{ base: 'none', md: 'block' }}>Simulador</Heading><Badge colorScheme={linhasDigitadas > 30 ? "red" : "blue"}>{linhasDigitadas}/30 Linhas</Badge><Badge>{textoOnline.length} caracteres</Badge></HStack>
                            <Button colorScheme="teal" size="sm" onClick={abrirModalEnvio} leftIcon={<ArrowUpIcon />}>Enviar Redação</Button>
                        </Flex>
                        <Box flex="1" overflowY="auto" p={8} display="flex" justifyContent="center">
                            <Box w="700px" minH="1216px" bg="white" boxShadow="lg" position="relative" border="1px solid #ccc" borderRadius="sm" flexShrink={0} bgImage="linear-gradient(transparent 39px, #ccc 40px)" bgSize="100% 40px">
                                <Box ref={hiddenTextRef} position="absolute" visibility="hidden" w="640px" fontSize="16px" lineHeight="40px" fontFamily="Arial, sans-serif" whiteSpace="pre-wrap" overflowWrap="break-word" pointerEvents="none" minH="40px" left="30px" top="8px">{textoOnline + (textoOnline.endsWith('\n') ? ' ' : '')}</Box>
                                <Textarea value={textoOnline} onChange={(e) => setTextoOnline(e.target.value)} placeholder="Comece sua redação aqui..." w="100%" h="100%" p="8px 30px" fontSize="16px" lineHeight="40px" fontFamily="Arial, sans-serif" bg="transparent" border="none" resize="none" focusBorderColor="transparent" zIndex={1} position="relative" overflow="hidden" sx={{ '&::-webkit-scrollbar': { display: 'none' } }} />
                            </Box>
                        </Box>
                    </Box>
                </Flex>
            </Container>
          ); 
      }
      
      if (passo === 'feedback' && redacaoSelecionada) { 
          const isSimples = redacaoSelecionada.tema_tipo?.toUpperCase() === 'SIMPLES' || redacaoSelecionada.tipo?.toUpperCase() === 'SIMPLES'; 
          return (
              <Container maxW="full" p={0} h="full" display="flex" flexDirection="column">
                  <GlobalStyles />
                  <Flex justify="space-between" align="center" bg="white" p={4} borderBottom="1px solid" borderColor="gray.200" shadow="sm" zIndex={10}><HStack spacing={4}><Button leftIcon={<ArrowBackIcon />} onClick={voltar} variant="ghost" colorScheme="gray">Voltar</Button><Divider orientation="vertical" h="24px" display={{ base: 'none', md: 'block' }} /><HStack alignItems="center"><Heading size="md" color="gray.800">Feedback da Correção</Heading><Badge bg={isSimples ? 'blue.50' : 'green.50'} color={isSimples ? 'blue.700' : 'green.700'} px={3} py={1} borderRadius="md" fontSize="md">{redacaoSelecionada.tema_tipo || redacaoSelecionada.tipo || 'ENEM'}</Badge></HStack></HStack><HStack bg="green.50" px={4} py={1} borderRadius="full" border="1px solid" borderColor="green.200"><Text fontSize="xs" fontWeight="bold" color="green.600" textTransform="uppercase">Nota Total</Text><Text fontSize="xl" fontWeight="800" color="green.700">{redacaoSelecionada.correcao?.nota_final || 0}</Text></HStack></Flex>
                  <Flex h="full" w="full" overflow="hidden">
                      <Box flex={1} overflow="auto" p={8} display="flex" justifyContent="center" bg="gray.200">
                          <Box position="relative" display="inline-block" height="fit-content" boxShadow="dark-lg" bg="white" border="1px solid" borderColor="gray.200" borderRadius="sm" w={redacaoSelecionada.conteudoTexto ? "700px" : "full"} maxW={redacaoSelecionada.conteudoTexto ? "700px" : "900px"} flexShrink={redacaoSelecionada.conteudoTexto ? 0 : 1}>
                              {redacaoSelecionada.conteudoTexto ? (<Box p="8px 30px" whiteSpace="pre-wrap" fontFamily="Arial, sans-serif" fontSize="16px" lineHeight="40px" bgImage="linear-gradient(transparent 39px, #ccc 40px)" bgSize="100% 40px" minHeight="1216px" color="gray.800">{redacaoSelecionada.conteudoTexto}</Box>) : (<Image src={redacaoSelecionada.arquivo} alt="Redação" display="block" w="100%" h="auto" />)}
                              {redacaoSelecionada.correcao?.anotacoes?.map((pin) => { 
                                  if(!pin.x) return null; const info = isSimples ? INFO_COMPETENCIAS_SIMPLES[pin.competencia] : INFO_COMPETENCIAS_ENEM[pin.competencia]; if(!info) return null; const isHovered = hoveredPinViewId === pin.id; 
                                  return (
                                      <Box key={pin.id}>
                                          <Box position="absolute" left={`${pin.x}%`} top={`${pin.y}%`} w={`${pin.width}%`} h={`${pin.height}%`} bg={info.cor} opacity={isHovered ? 0.4 : 0} pointerEvents="none" transition="opacity 0.2s" zIndex={4} />
                                          <Popover trigger="hover" placement="top" openDelay={0} isLazy>
                                              <PopoverTrigger>
                                                  <Box position="absolute" left={`calc(${pin.x}% + ${pin.width}% - 6px)`} top={`calc(${pin.y}% - 28px)`} cursor="pointer" zIndex={10} display="flex" alignItems="center" justifyContent="center" onMouseEnter={() => setHoveredPinViewId(pin.id)} onMouseLeave={() => setHoveredPinViewId(null)}>
                                                      <CustomPinSVG cor={info.cor} numero={pin.competencia} />
                                                  </Box>
                                              </PopoverTrigger>
                                              <Portal>
                                                  <PopoverContent zIndex={9999} w="300px" boxShadow="2xl" borderRadius="2xl" overflow="hidden" border="1px solid" borderColor="gray.100" onMouseEnter={() => setHoveredPinViewId(pin.id)} onMouseLeave={() => setHoveredPinViewId(null)}>
                                                      <PopoverArrow bg={info.bg} />
                                                      <PopoverHeader bg={info.bg} fontWeight="bold" color={info.cor} borderBottom="none" fontSize="sm">{pin.tipo_erro || info.nome}</PopoverHeader>
                                                      <PopoverBody fontSize="sm" bg="white">{pin.tipo_erro && pin.tipo_erro !== 'Geral' && <Badge colorScheme="red" mb={2}>{pin.tipo_erro}</Badge>}<Text color="gray.700">{pin.texto}</Text></PopoverBody>
                                                  </PopoverContent>
                                              </Portal>
                                          </Popover>
                                      </Box>
                                  ); 
                              })}
                          </Box>
                      </Box>
                      <Box w="400px" bg="white" borderLeft="1px solid #ddd" overflowY="auto" p={6}>
                          <VStack align="stretch" spacing={6}>
                              <Box bg="gray.50" p={4} borderRadius="md" border="1px solid" borderColor="gray.200"><Heading size="xs" color="gray.500" mb={1}>TEMA DA REDAÇÃO</Heading><Text fontWeight="bold" fontSize="sm">{redacaoSelecionada.tema_titulo}</Text></Box>
                              {redacaoSelecionada.correcao?.comentario_geral && (<Box><Heading size="xs" mb={2} color="blue.600">PARECER GERAL</Heading><Box bg="blue.50" p={4} borderRadius="md" borderLeft="4px solid" borderColor="blue.400"><Text fontSize="sm" color="blue.900" lineHeight="tall" whiteSpace="pre-wrap">{redacaoSelecionada.correcao.comentario_geral}</Text></Box></Box>)}
                              <Divider borderColor="gray.300" /><Heading size="sm" color="gray.700" textTransform="uppercase">Desempenho</Heading>
                              <VStack spacing={4} align="stretch" width="100%">
                                  {redacaoSelecionada.correcao?.competencias?.map((comp) => { 
                                      const info = isSimples ? INFO_COMPETENCIAS_SIMPLES[comp.comp] : INFO_COMPETENCIAS_ENEM[comp.comp]; if(!info) return null; 
                                      return (<Box key={comp.comp} p={4} border="1px solid" borderColor="gray.200" borderRadius="lg" boxShadow="sm" bg="white" width="100%"><Flex justify="space-between" mb={2} align="center"><Badge bg={info.bg} color={info.cor}>Competência {comp.comp}</Badge><Text fontWeight="bold" fontSize="md" color="gray.700">{comp.nota} pts</Text></Flex><Text fontSize="sm" fontWeight="bold" color="gray.800" mb={3}>{info.nome}</Text><Divider mb={3} borderColor="gray.200" />{comp.comentario ? (<Text fontSize="sm" color="gray.600" bg="gray.50" p={3} borderRadius="md" fontStyle="italic">"{comp.comentario}"</Text>) : (<Text fontSize="xs" color="gray.400">Sem apontamentos adicionais.</Text>)}</Box>); 
                                  })}
                              </VStack>
                          </VStack>
                      </Box>
                  </Flex>
              </Container>
          ); 
      }

      if (passo === 'loja') {
          const valorNormal = parseFloat(configsGlobais.preco_avulso_normal || 9.90);
          const valorVip = parseFloat(configsGlobais.preco_avulso_vip || 14.90);
          const pacotesLoja = pacotes.filter(p => p.visivel_loja); 
          
          const pacotesPorPagina = 3;
          const totalPaginas = Math.ceil(pacotesLoja.length / pacotesPorPagina);
          const pacotesAtuais = pacotesLoja.slice(pacotePage * pacotesPorPagina, (pacotePage + 1) * pacotesPorPagina);

          return (
              <Container maxW="container.xl" p={{ base: 4, md: 8 }}>
                  <Heading mb={2} color="teal.700">Loja de Créditos</Heading>
                  <Text mb={8} color="gray.500">Adquira pacotes ou compre créditos avulsos para ter as suas redações corrigidas detalhadamente.</Text>
                  
                  <Flex gap={5} direction={{ base: 'column', lg: 'row' }} align="start" minH={{ lg: "480px" }}>
                      
                      <Box w={{ base: '100%', lg: '280px' }} flexShrink={0}>
                          <Card h="max-content" bg="white" shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.200" display="flex" flexDirection="column">
                              <Box bg="gray.50" p={4} borderBottom="1px solid" borderColor="gray.100"><Heading size="sm" color="teal.700" textAlign="center">Créditos Avulsos</Heading></Box>
                              
                              <VStack p={5} align="stretch" spacing={5}>
                                  <Alert status="info" borderRadius="md" bg="blue.50" color="blue.800" border="1px solid" borderColor="blue.100" p={3}>
                                      <AlertIcon color="blue.500" boxSize={4} />
                                      <Box>
                                          <Text fontSize="sm" fontWeight="bold" mb={1}>O que é o VIP?</Text>
                                          <Text fontSize="xs" lineHeight="short">A Correção VIP fura a fila. Pague usando 1 Token VIP ou {configsGlobais.custo_creditos_vip} Créditos normais.</Text>
                                      </Box>
                                  </Alert>

                                  <SimpleGrid columns={2} spacing={3}>
                                      <Box>
                                          <Text color="gray.600" fontWeight="bold" fontSize="sm" mb={1} textAlign="center">Normal</Text>
                                          <Flex align="center" justify="space-between" bg="gray.50" borderRadius="lg" p={1} border="1px solid" borderColor="gray.200">
                                              <IconButton aria-label="Remover" icon={<MinusIcon />} size="xs" variant="ghost" color="gray.600" onClick={() => setQtdAvulsoNormal(Math.max(0, qtdAvulsoNormal - 1))} />
                                              <Text fontSize="lg" fontWeight="bold" color="gray.800">{qtdAvulsoNormal}</Text>
                                              <IconButton aria-label="Adicionar" icon={<AddIcon />} size="xs" variant="ghost" color="gray.600" onClick={() => setQtdAvulsoNormal(qtdAvulsoNormal + 1)} />
                                          </Flex>
                                          <Text textAlign="center" color="gray.500" fontSize="xs" mt={2}>R$ {valorNormal.toFixed(2).replace('.',',')}/un</Text>
                                      </Box>
                                      <Box>
                                          <Text color="purple.600" fontWeight="bold" fontSize="sm" mb={1} textAlign="center"><StarIcon mr={1} mb={0.5}/> VIP</Text>
                                          <Flex align="center" justify="space-between" bg="purple.50" borderRadius="lg" p={1} border="1px solid" borderColor="purple.200">
                                              <IconButton aria-label="Remover VIP" icon={<MinusIcon />} size="xs" variant="ghost" colorScheme="purple" onClick={() => setQtdAvulsoVip(Math.max(0, qtdAvulsoVip - 1))} />
                                              <Text fontSize="lg" fontWeight="bold" color="purple.800">{qtdAvulsoVip}</Text>
                                              <IconButton aria-label="Adicionar VIP" icon={<AddIcon />} size="xs" variant="ghost" colorScheme="purple" onClick={() => setQtdAvulsoVip(qtdAvulsoVip + 1)} />
                                          </Flex>
                                          <Text textAlign="center" color="gray.500" fontSize="xs" mt={2}>R$ {valorVip.toFixed(2).replace('.',',')}/un</Text>
                                      </Box>
                                  </SimpleGrid>
                                  
                                  <Box mt="2">
                                      <Divider borderColor="gray.200" mb={4} />
                                      <Box textAlign="center">
                                          <Text color="gray.400" textTransform="uppercase" fontSize="xs" fontWeight="bold">Total a Pagar</Text>
                                          <Text fontSize="3xl" fontWeight="900" color="teal.600"><Text as="span" fontSize="lg" color="gray.400">R$ </Text>{((qtdAvulsoNormal * valorNormal) + (qtdAvulsoVip * valorVip)).toFixed(2).replace('.',',')}</Text>
                                          <Button size="md" colorScheme="teal" w="full" mt={3} leftIcon={<CheckIcon />} isDisabled={qtdAvulsoNormal === 0 && qtdAvulsoVip === 0} onClick={() => iniciarCheckout('avulso')}>Comprar Avulsos</Button>
                                      </Box>
                                  </Box>
                              </VStack>
                          </Card>
                      </Box>

                      <Card flex="1" bg="white" shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.200" display="flex" flexDirection="column">
                          <Box bg="gray.50" p={4} borderBottom="1px solid" borderColor="gray.100" display="flex" justify="space-between" alignItems="center">
                              <Heading size="sm" color="gray.700">Pacotes Promocionais</Heading>
                              <HStack>
                                  <IconButton size="sm" aria-label="Anterior" icon={<ChevronLeftIcon />} onClick={() => setPacotePage(p => Math.max(p - 1, 0))} isDisabled={pacotePage === 0} />
                                  <IconButton size="sm" aria-label="Próximo" icon={<ChevronRightIcon />} onClick={() => setPacotePage(p => Math.min(p + 1, totalPaginas - 1))} isDisabled={pacotePage >= totalPaginas - 1 || totalPaginas === 0} />
                              </HStack>
                          </Box>
                          <Box p={6} flex="1" display="flex" alignItems="center">
                              
                              <SimpleGrid columns={{ base: 1, xl: 3 }} spacing={6} w="full" h="full">
                                  {pacotesAtuais.map((p, index) => {
                                      const precoNum = parseFloat(p.preco);
                                      const isDestaque = p.selo_destaque || index === 1;

                                      return (
                                      <Card key={p.id} bg="white" shadow={isDestaque ? "xl" : "sm"} borderRadius="2xl" border="1px solid" borderColor={isDestaque ? "yellow.400" : "gray.200"} position="relative" overflow="hidden" transform={isDestaque ? { xl: "scale(1.03)" } : "none"} zIndex={isDestaque ? 2 : 1} display="flex" flexDirection="column">
                                          {isDestaque && (<Box position="absolute" top="0" w="full" bg="yellow.400" color="yellow.900" py={1} textAlign="center" fontSize="xs" fontWeight="900" textTransform="uppercase">🔥 {p.selo_destaque ? p.selo_destaque.toUpperCase() : "MAIS POPULAR"}</Box>)}

                                          <Box bg={isDestaque ? "yellow.50" : "gray.50"} p={6} pt={isDestaque ? 10 : 6} textAlign="center" borderBottom="1px solid" borderColor="gray.100">
                                              <Heading size="md" color={isDestaque ? "yellow.800" : "gray.700"} mb={2}>{p.nome}</Heading>
                                              <Text fontSize="xs" color="gray.500" mb={4} minH="30px">{p.descricao}</Text>
                                              <Flex justify="center" align="flex-end" gap={1}>
                                                  <Text fontSize="md" color="gray.500" fontWeight="bold" pb={1}>R$</Text>
                                                  <Text fontSize="4xl" fontWeight="900" color="gray.800" lineHeight="0.9">{precoNum.toFixed(2).replace('.', ',')}</Text>
                                              </Flex>
                                              {p.preco_original && <Text fontSize="xs" color="gray.400" textDecoration="line-through" mt={1}>De R$ {parseFloat(p.preco_original).toFixed(2).replace('.', ',')}</Text>}
                                          </Box>

                                          <CardBody p={5} display="flex" flexDirection="column" flex="1">
                                              <VStack spacing={3} align="stretch" flex="1" mb={6}>
                                                  <HStack><CheckCircleIcon color="green.500" boxSize={3}/><Text fontSize="sm" fontWeight="bold" color="gray.700">{p.qtd_creditos_simples} Correções detalhadas</Text></HStack>
                                                  <HStack><CheckCircleIcon color={p.qtd_creditos_vip > 0 ? "purple.500" : "gray.300"} boxSize={3}/><Text fontSize="sm" color={p.qtd_creditos_vip > 0 ? "gray.700" : "gray.400"} fontWeight={p.qtd_creditos_vip > 0 ? "bold" : "normal"}>{p.qtd_creditos_vip} Fila VIP (Prioridade)</Text></HStack>
                                                  <HStack><CheckCircleIcon color="green.500" boxSize={3}/><Text fontSize="sm" color="gray.600">Acesso a Temas Oficiais</Text></HStack>
                                                  <HStack><CheckCircleIcon color="green.500" boxSize={3}/><Text fontSize="sm" color="gray.600">Material de Apoio Grátis</Text></HStack>
                                              </VStack>

                                              <Box mt="auto">
                                                  {p.permite_parcelamento && p.max_parcelas > 1 ? (<Text fontSize="xs" color="green.500" fontWeight="bold" mb={2} textAlign="center">Em até {p.max_parcelas}x de R$ {(precoNum / p.max_parcelas).toFixed(2).replace('.', ',')} no cartão</Text>) : (<Text fontSize="xs" color="gray.400" mb={2} textAlign="center">Pagamento à vista</Text>)}

                                                  <Button w="full" size="md" colorScheme={isDestaque ? "yellow" : "teal"} bg={isDestaque ? "yellow.400" : undefined} color={isDestaque ? "yellow.900" : undefined} _hover={isDestaque ? { bg: 'yellow.500' } : undefined} onClick={() => iniciarCheckout('pacote', p)}>
                                                      Comprar Pacote
                                                  </Button>
                                              </Box>
                                          </CardBody>
                                      </Card>
                                      )})}
                                  {pacotesAtuais.length === 0 && <Text color="gray.500" textAlign="center" gridColumn="1 / -1" mt={10}>Nenhum pacote promocional disponível no momento.</Text>}
                              </SimpleGrid>
                          </Box>
                      </Card>
                  </Flex>
              </Container>
          );
      }

      if (passo === 'material_apoio') {
          const matFiltrados = materiais.filter(m => {
              const matchBusca = m.titulo.toLowerCase().includes(buscaMaterial.toLowerCase());
              const matchCat = filtroMaterialCat === 'TODOS' ? true : m.categoria === filtroMaterialCat;
              return matchBusca && matchCat;
          });

          return (
              <Container maxW="container.xl" py={8} px={{ base: 4, md: 8 }}>
                  <Heading mb={2} color="teal.700">Material de Apoio</Heading>
                  <Text mb={8} color="gray.500">Explore nossa biblioteca de cartilhas, manuais, repertórios e exemplos de redação Nota 1000.</Text>

                  <Flex gap={4} bg="white" p={5} borderRadius="xl" boxShadow="sm" align="center" border="1px solid" borderColor="gray.100" mb={8} wrap="wrap">
                      <InputGroup flex={1} minW="250px">
                          <InputLeftElement pointerEvents='none'><SearchIcon color='gray.400'/></InputLeftElement>
                          <Input placeholder="Buscar material por título..." value={buscaMaterial} onChange={e => setBuscaMaterial(e.target.value)} />
                      </InputGroup>
                      <Select w={{ base: "full", md: "280px" }} value={filtroMaterialCat} onChange={e => setFiltroMaterialCat(e.target.value)}>
                          <option value="TODOS">Todas as Categorias</option>
                          {Object.entries(CATEGORIAS_MATERIAL).filter(([k]) => k !== 'OUTROS').map(([k, v]) => (
                              <option key={k} value={k}>{v.nome}</option>
                          ))}
                      </Select>
                  </Flex>

                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
                      {matFiltrados.map(m => {
                          const cat = CATEGORIAS_MATERIAL[m.categoria] || CATEGORIAS_MATERIAL['OUTROS'];
                          const temConteudo = (m.conteudo && m.conteudo.length > 5) || (m.dados_extras && Object.keys(m.dados_extras).length > 0);
                          
                          return (
                              <Card key={m.id} bg="white" shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.200" display="flex" flexDirection="column" _hover={{ transform: 'translateY(-4px)', shadow: 'md', borderColor: `${cat.cor}.300` }} transition="all 0.2s">
                                  <Box h="4px" w="full" bg={`${cat.cor}.400`} borderTopRadius="xl" />
                                  <CardBody p={5} display="flex" flexDirection="column" flex="1">
                                      <Flex justify="space-between" align="start" mb={4}>
                                          <Badge colorScheme={cat.cor} borderRadius="md" px={2} py={0.5} fontSize="2xs" fontWeight="bold">{cat.nome}</Badge>
                                          <Icon as={cat.icon} color={`${cat.cor}.400`} boxSize={5} />
                                      </Flex>
                                      <Heading size="sm" color="gray.800" mb={2} lineHeight="short">{m.titulo}</Heading>
                                      <Text fontSize="xs" color="gray.500" mb={4} noOfLines={3} flex="1">{m.descricao || "Nenhuma descrição detalhada disponível para este material."}</Text>
                                      
                                      <Button w="full" size="sm" colorScheme={cat.cor} variant="outline" leftIcon={temConteudo ? <ViewIcon /> : <DownloadIcon />} mt="auto" _hover={{ bg: `${cat.cor}.50` }} onClick={(e) => { e.preventDefault(); abrirMaterial(m); }}>
                                          {temConteudo ? 'Ler Material' : 'Baixar PDF'}
                                      </Button>
                                  </CardBody>
                              </Card>
                          )
                      })}
                      {matFiltrados.length === 0 && (
                          <GridItem colSpan={{ base: 1, md: 2, lg: 3, xl: 4 }}>
                              <Flex direction="column" align="center" justify="center" h="200px" bg="white" borderRadius="xl" border="1px dashed" borderColor="gray.300">
                                  <Icon as={InfoIcon} boxSize={8} color="gray.300" mb={3} />
                                  <Text color="gray.500" fontWeight="bold">Nenhum material de apoio encontrado.</Text>
                                  <Text color="gray.400" fontSize="sm">Tente ajustar a sua pesquisa ou os filtros acima.</Text>
                              </Flex>
                          </GridItem>
                      )}
                  </SimpleGrid>
              </Container>
          );
      }

      return null;
  };

  return (
      <Box w="full" h="100%">
          {renderConteudo()}
          
          <Modal isOpen={isPreparingPrint} isCentered closeOnOverlayClick={false}>
            <ModalOverlay backdropFilter="blur(5px)" bg="blackAlpha.600" />
            <ModalContent bg="transparent" boxShadow="none" textAlign="center" color="white">
                <VStack spacing={6}>
                    <Spinner thickness='5px' speed='0.65s' emptyColor='gray.200' color='teal.400' size='xl' />
                    <Box><Heading size="md" mb={2}>Gerando Documento Oficial</Heading><Text color="gray.200">Preparando layout, marca d'água e fontes para impressão...</Text></Box>
                </VStack>
            </ModalContent>
          </Modal>

          <Modal 
             isOpen={modalCheckoutOpen} 
             onClose={() => { setModalCheckoutOpen(false); setAguardandoCartao(false); }} 
             isCentered 
             size="lg" 
             closeOnOverlayClick={!dadosPix && !aguardandoCartao}
          >
            <ModalOverlay backdropFilter="blur(3px)" />
            <ModalContent borderRadius="2xl" overflow="hidden">
                <Box bg="gray.800" p={4} textAlign="center"><Heading size="md" color="white">{dadosPix ? "Realize o Pagamento" : "Finalizar Compra"}</Heading></Box>
                {!dadosPix && !aguardandoCartao && <ModalCloseButton color="white" />}
                
                <ModalBody pb={6} pt={6}>
                    {!dadosPix && !aguardandoCartao ? (
                        <VStack spacing={4} align="stretch">
                            <Box bg="gray.50" p={4} borderRadius="lg" border="1px dashed" borderColor="gray.300">
                                <Text fontSize="sm" color="gray.500" fontWeight="bold" textTransform="uppercase" mb={1}>Resumo do Pedido</Text>
                                {checkoutItem?.tipo === 'pacote' ? (<Text fontSize="lg" fontWeight="bold" color="gray.800">{checkoutItem.pacote.nome}</Text>) : (<Text fontSize="lg" fontWeight="bold" color="gray.800">{qtdAvulsoNormal}x Normais, {qtdAvulsoVip}x VIPs</Text>)}
                            </Box>
                            
                            {(!checkoutItem?.pacote || !checkoutItem.pacote.preco_original) && (
                                <Box>
                                    <Text fontSize="sm" fontWeight="bold" color="gray.700" mb={2}>Tem um cupom de desconto?</Text>
                                    <HStack>
                                        <Input placeholder="Digite o código" textTransform="uppercase" value={cupomDigitado} onChange={(e) => setCupomDigitado(e.target.value)} isDisabled={cupomAplicado !== null} />
                                        {cupomAplicado ? (<Button onClick={removerCupom} colorScheme="red" variant="ghost">Remover</Button>) : (<Button onClick={validarCupom} colorScheme="teal">Aplicar</Button>)}
                                    </HStack>
                                    {cupomAplicado && <Text fontSize="sm" color="green.500" mt={2} fontWeight="bold">Cupom aplicado: -{parseFloat(cupomAplicado.desconto)}% OFF!</Text>}
                                </Box>
                            )}
                            <Divider />
                            <Flex justify="space-between" align="center">
                                <Text fontSize="lg" fontWeight="bold" color="gray.600">Total a Pagar:</Text>
                                <Box textAlign="right">
                                    {cupomAplicado && (<Text fontSize="sm" color="gray.400" textDecoration="line-through">De R$ {checkoutItem?.precoOriginal.toFixed(2).replace('.',',')}</Text>)}
                                    {checkoutItem?.pacote?.preco_original && !cupomAplicado && (<Text fontSize="sm" color="gray.400" textDecoration="line-through">De R$ {parseFloat(checkoutItem.pacote.preco_original).toFixed(2).replace('.',',')}</Text>)}
                                    
                                    <Text fontSize="3xl" fontWeight="900" color="green.500">R$ {cupomAplicado ? (checkoutItem?.precoOriginal - (checkoutItem?.precoOriginal * parseFloat(cupomAplicado.desconto) / 100)).toFixed(2).replace('.',',') : checkoutItem?.precoOriginal.toFixed(2).replace('.',',')}</Text>
                                </Box>
                            </Flex>
                        </VStack>
                    ) : aguardandoCartao ? (
                        <VStack spacing={6} align="center" textAlign="center" py={4}>
                            <Icon as={TimeIcon} boxSize={12} color="blue.500" />
                            <Heading size="md" color="gray.700">Aguardando o seu pagamento</Heading>
                            <Text color="gray.600">Uma aba segura do Mercado Pago foi aberta. <br/>Após concluir a compra lá, clique no botão abaixo.</Text>
                        </VStack>
                    ) : (
                        <VStack spacing={5} align="center" textAlign="center">
                            <Text fontWeight="bold" color="teal.600" fontSize="lg">Escaneie o QR Code abaixo</Text>
                            <Box border="4px solid" borderColor="teal.400" borderRadius="xl" p={2} bg="white" shadow="md">
                                <Image src={`data:image/jpeg;base64,${dadosPix.qr_code_base64}`} alt="QR Code PIX" boxSize="200px" />
                            </Box>
                            <Box w="full">
                                <Text fontSize="sm" color="gray.500" mb={2}>Ou copie o código PIX Copia e Cola:</Text>
                                <InputGroup size="md">
                                    <Input value={dadosPix.qr_code} isReadOnly pr="5.5rem" bg="gray.100" fontSize="xs" />
                                    <Button h="1.75rem" size="sm" position="absolute" right="0.2rem" top="0.25rem" zIndex={2} colorScheme="teal" onClick={copiarPix}>Copiar</Button>
                                </InputGroup>
                            </Box>
                            <Alert status="warning" borderRadius="md" mt={2} bg="yellow.50" color="yellow.800" border="1px solid" borderColor="yellow.200">
                                <AlertIcon color="yellow.600" />
                                <Text fontSize="xs" textAlign="left">Assim que pagar, os créditos cairão automaticamente!</Text>
                            </Alert>
                        </VStack>
                    )}
                </ModalBody>
                
                <ModalFooter bg="gray.50" display="flex" flexDirection="column" gap={3}>
                    {!dadosPix && !aguardandoCartao ? (
                        <>
                            <Button colorScheme="blue" w="full" size="lg" shadow="md" isLoading={processandoCartao} onClick={processarPagamentoCartao}>
                                💳 Pagar com Cartão (Nova Aba)
                            </Button>
                            
                            <Button colorScheme="green" w="full" size="lg" shadow="md" isLoading={processandoCompra} onClick={processarPagamentoFinal}>
                                💠 Pagar via PIX
                            </Button>

                            <Button variant="ghost" w="full" onClick={() => setModalCheckoutOpen(false)}>Cancelar Compra</Button>
                        </>
                    ) : aguardandoCartao ? (
                        <>
                            <Button colorScheme="blue" size="lg" w="full" onClick={verificarPagamentoCartao} isLoading={processandoCartao}>
                                Já paguei! Verificar Créditos
                            </Button>
                            <Button variant="outline" colorScheme="red" w="full" onClick={() => { setModalCheckoutOpen(false); setAguardandoCartao(false); }}>
                                Cancelar / Tentar Novamente
                            </Button>
                        </>
                    ) : (
                        <Button colorScheme="teal" size="lg" w="full" onClick={() => { setModalCheckoutOpen(false); toast({ title: "Aguardando", description: "Notificaremos quando aprovar.", status: "info" }); }}>
                            Fechar e Aguardar Pagamento
                        </Button>
                    )}
                </ModalFooter>
            </ModalContent>
          </Modal>

          <Modal isOpen={modalEnvioOpen} onClose={() => setModalEnvioOpen(false)} isCentered size="md">
            <ModalOverlay backdropFilter="blur(3px)" />
            <ModalContent borderRadius="xl">
                <ModalHeader>Confirmar Envio</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <Text mb={4} color="gray.600">Escolha o tipo de correção que deseja utilizar para esta redação:</Text>
                    <VStack align="stretch" spacing={3}>
                        <Button variant={!usarVIP ? "solid" : "outline"} colorScheme="blue" h="auto" py={3} justifyContent="flex-start" onClick={() => setUsarVIP(false)} isDisabled={carteira.saldo_simples <= 0} border="2px solid" borderColor={!usarVIP ? "blue.500" : "transparent"}>
                            <Box textAlign="left"><Text fontWeight="bold">Correção Padrão</Text><Text fontSize="xs" fontWeight="normal">Custa 1 Crédito Normal (Você tem {carteira.saldo_simples})</Text></Box>
                        </Button>
                        <Button variant={usarVIP ? "solid" : "outline"} colorScheme="purple" h="auto" py={3} justifyContent="flex-start" onClick={() => setUsarVIP(true)} isDisabled={carteira.saldo_vip <= 0 && carteira.saldo_simples < configsGlobais.custo_creditos_vip} border="2px solid" borderColor={usarVIP ? "purple.500" : "transparent"}>
                            <Box textAlign="left"><Text fontWeight="bold"><StarIcon mr={2} mb={1}/>Correção VIP (Prioridade)</Text><Text fontSize="xs" fontWeight="normal">Custa 1 Crédito VIP ou {configsGlobais.custo_creditos_vip} Normais</Text></Box>
                        </Button>
                    </VStack>
                </ModalBody>
                <ModalFooter bg="gray.50" borderTopRadius="none" borderRadius="xl">
                    <Button variant="ghost" mr={3} onClick={() => setModalEnvioOpen(false)}>Cancelar</Button>
                    <Button colorScheme="teal" onClick={confirmarEnvioReal} isLoading={enviando} isDisabled={!usarVIP && carteira.saldo_simples <= 0}>Enviar Redação</Button>
                </ModalFooter>
            </ModalContent>
          </Modal>

          <Modal isOpen={modalDevolvida.isOpen} onClose={modalDevolvida.onClose} isCentered size="md">
            <ModalOverlay backdropFilter="blur(3px)" />
            <ModalContent borderRadius="xl">
                <ModalHeader color="red.600" display="flex" alignItems="center" gap={2}>
                    <WarningTwoIcon /> Redação Anulada
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <VStack align="stretch" spacing={4}>
                        <Alert status="error" borderRadius="md" variant="subtle" flexDirection="column" alignItems="start" p={4}>
                            <Text fontWeight="bold" fontSize="sm" color="red.800" mb={2}>Motivo da Anulação (Coordenação):</Text>
                            <Text fontSize="sm" color="red.700" bg="white" p={3} borderRadius="md" w="full" border="1px solid" borderColor="red.100">
                                {redacaoDevolvidaInfo?.correcao?.comentario_geral || "Motivo não especificado pela coordenação."}
                            </Text>
                        </Alert>
                        <Alert status="success" borderRadius="md">
                            <AlertIcon />
                            <Box>
                                <Text fontSize="sm" fontWeight="bold">Crédito Estornado!</Text>
                                <Text fontSize="xs">Não se preocupe, o seu crédito foi devolvido para a sua carteira. Você pode tentar enviar a redação novamente a qualquer momento.</Text>
                            </Box>
                        </Alert>
                    </VStack>
                </ModalBody>
                <ModalFooter bg="gray.50" borderTopRadius="none" borderRadius="xl">
                    <Button colorScheme="red" w="full" onClick={modalDevolvida.onClose}>Entendi</Button>
                </ModalFooter>
            </ModalContent>
          </Modal>

          <Modal isOpen={modalRepertorioIA.isOpen} onClose={modalRepertorioIA.onClose} size="xl" scrollBehavior="inside" isCentered>
              <ModalOverlay backdropFilter="blur(5px)" bg="blackAlpha.700" />
              <ModalContent borderRadius="xl">
                  <ModalHeader bgGradient="linear(to-r, purple.600, blue.600)" color="white" borderTopRadius="xl" display="flex" alignItems="center" gap={3}>
                      <Text fontSize="2xl">💡</Text> Ideias de Repertório 
                  </ModalHeader>
                  <ModalCloseButton color="white" mt={1} />
                  <ModalBody py={6} bg="purple.50">
                      <Box 
                          className="texto-limpo repertorio-ia" 
                          dangerouslySetInnerHTML={{ __html: repertorioIA }} 
                      />
                  </ModalBody>
                  <ModalFooter bg="white" borderTop="1px solid" borderColor="gray.200" borderBottomRadius="xl">
                      <Button colorScheme="purple" onClick={modalRepertorioIA.onClose} w="full" shadow="md">Fantástico, entendi!</Button>
                  </ModalFooter>
              </ModalContent>
          </Modal>

          <Modal isOpen={modalLeitor.isOpen} onClose={modalLeitor.onClose} size="3xl" scrollBehavior="inside" isCentered>
              <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.700" />
              <ModalContent borderRadius="xl" overflow="hidden">
                  <ModalHeader borderBottom="1px solid" borderColor="gray.100" bg="gray.50">
                      <HStack mb={2}>
                          <Badge colorScheme={CATEGORIAS_MATERIAL[materialSelecionado?.categoria]?.cor || 'teal'}>
                              {CATEGORIAS_MATERIAL[materialSelecionado?.categoria]?.nome || 'Leitura Nátiva'}
                          </Badge>
                      </HStack>
                      <Heading size="md" color="gray.800" lineHeight="short">{materialSelecionado?.titulo}</Heading>
                  </ModalHeader>
                  <ModalCloseButton mt={2} />
                  <ModalBody py={6} bg="white">
                      <VStack align="stretch" spacing={6}>
                          {materialSelecionado?.descricao && (
                              <Text fontSize="md" color="gray.600" fontStyle="italic" borderLeft="3px solid" borderColor="gray.300" pl={3}>
                                  {materialSelecionado.descricao}
                              </Text>
                          )}

                          {materialSelecionado?.dados_extras && Object.keys(materialSelecionado.dados_extras).length > 0 && (
                              <Box>
                                  {materialSelecionado.categoria === 'ALUNO_REPERTORIO' && materialSelecionado.dados_extras.topicos && (
                                      <VStack align="stretch" spacing={4}>
                                          <Heading size="sm" color="purple.800" display="flex" alignItems="center" gap={2}><StarIcon /> Desenvolvimento do Repertório</Heading>
                                          {materialSelecionado.dados_extras.topicos.map((t, idx) => (
                                              <Box key={idx} bg="purple.50" p={5} borderRadius="xl" border="1px solid" borderColor="purple.100">
                                                  <Badge colorScheme="purple" mb={2} variant="solid">Parte {idx + 1}</Badge>
                                                  <Heading size="sm" color="purple.900" mb={3}>{t.titulo}</Heading>
                                                  <Text fontSize="md" color="gray.800" whiteSpace="pre-wrap" lineHeight="tall">{t.texto}</Text>
                                              </Box>
                                          ))}
                                      </VStack>
                                  )}

                                  {materialSelecionado.categoria === 'ALUNO_GRAMATICA' && materialSelecionado.dados_extras.ex_errado && (
                                      <Box bg="green.50" p={5} borderRadius="xl" border="1px solid" borderColor="green.100">
                                          <Heading size="sm" color="green.800" mb={4} display="flex" alignItems="center" gap={2}><EditIcon /> Exemplo Prático</Heading>
                                          <SimpleGrid columns={2} spacing={4}>
                                              <Box bg="white" p={4} borderRadius="md" border="1px solid" borderColor="red.200" borderLeft="4px solid" borderLeftColor="red.500"><Text fontSize="2xs" fontWeight="900" color="red.500" textTransform="uppercase" mb={2}>Como muitos erram</Text><Text fontWeight="bold" color="gray.700">"{materialSelecionado.dados_extras.ex_errado}"</Text></Box>
                                              <Box bg="white" p={4} borderRadius="md" border="1px solid" borderColor="green.200" borderLeft="4px solid" borderLeftColor="green.500"><Text fontSize="2xs" fontWeight="900" color="green.500" textTransform="uppercase" mb={2}>Como você deve escrever</Text><Text fontWeight="bold" color="gray.700">"{materialSelecionado.dados_extras.ex_correto}"</Text></Box>
                                          </SimpleGrid>
                                      </Box>
                                  )}
                              </Box>
                          )}

                          {materialSelecionado?.conteudo && (
                              <Box bg="gray.50" p={5} borderRadius="xl" border="1px solid" borderColor="gray.200">
                                  <Heading size="xs" color="gray.500" textTransform="uppercase" mb={3}>
                                      {materialSelecionado.categoria === 'ALUNO_REPERTORIO' ? 'Orientações Gerais' : 'Conteúdo'}
                                  </Heading>
                                  <Text whiteSpace="pre-wrap" fontSize="15px" lineHeight="1.8" color="gray.700">
                                      {materialSelecionado.conteudo}
                                  </Text>
                              </Box>
                          )}
                      </VStack>
                  </ModalBody>
                  <ModalFooter bg="gray.100" borderTop="1px solid" borderColor="gray.200" justifyContent="space-between">
                      {materialSelecionado?.arquivo ? (
                          <Button as="a" href={materialSelecionado.arquivo} target="_blank" colorScheme="blue" variant="outline" leftIcon={<DownloadIcon />}>
                              Baixar PDF Anexo
                          </Button>
                      ) : <Box />}
                      <Button colorScheme="gray" bg="white" border="1px solid" borderColor="gray.300" onClick={modalLeitor.onClose}>Fechar</Button>
                  </ModalFooter>
              </ModalContent>
          </Modal>

          <BotaoSuporte />
      </Box>
  );
}

export default PainelAluno;