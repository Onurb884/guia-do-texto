import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { Flex, Box, Heading, Text, Card, CardBody, VStack, SimpleGrid, Badge, Divider, Button, Popover, PopoverTrigger, PopoverContent, PopoverArrow, PopoverHeader, PopoverBody, useToast, Image, HStack, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, InputGroup, Input, useDisclosure, Icon, IconButton } from '@chakra-ui/react';
import { BellIcon, CheckCircleIcon, WarningTwoIcon, TimeIcon, ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon } from '@chakra-ui/icons';

import AbaDashboard from './abas/AbaDashboard';
import AbaHistorico from './abas/AbaHistorico';
import AbaMaterial from './abas/AbaMaterial';
import AbaLoja from './abas/AbaLoja';
import AbaTreino from './abas/AbaTreino';
import AbaFeedback from './abas/AbaFeedback';
import BotaoSuporte from './BotaoSuporte';

const GlobalStyles = () => (
    <style>{`
      .banner-oferta { position: relative; overflow: hidden; }
      .banner-oferta::after {
          content: ''; position: absolute; top: 0; left: -150%; width: 50%; height: 100%;
          background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%);
          transform: skewX(-25deg); animation: shineBanner 4s infinite; z-index: 10; pointer-events: none;
      }
      @keyframes shineBanner { 0% { left: -150%; } 20% { left: 200%; } 100% { left: 200%; } }
    `}</style>
);

const SininhoNotificacoes = ({ notificacoesRecentes, lidasIds, marcarLida, abrirFeedback }) => {
    const qtdNaoLidas = notificacoesRecentes.filter(n => !lidasIds.includes(n.id)).length;
    return (
        <Popover placement="bottom-end" isLazy>
            <PopoverTrigger>
                <Button variant="ghost" position="relative" p={0} borderRadius="full" bg="white" shadow="sm" border="1px solid" borderColor="gray.200" w="45px" h="45px">
                    <BellIcon boxSize={6} color="gray.600" />
                    {qtdNaoLidas > 0 && <Box position="absolute" top="1" right="1" bg="red.500" w="12px" h="12px" borderRadius="full" border="2px solid white" />}
                </Button>
            </PopoverTrigger>
            <PopoverContent w="350px" shadow="xl" borderRadius="xl">
                <PopoverArrow />
                <PopoverHeader fontWeight="bold" bg="gray.50" display="flex" justifyContent="space-between" alignItems="center"><Text>Notificações</Text></PopoverHeader>
                <PopoverBody p={0} maxH="300px" overflowY="auto">
                    {notificacoesRecentes.length > 0 ? (
                        <VStack align="stretch" spacing={0} divider={<Divider m={0} />}>
                            {notificacoesRecentes.map(n => {
                                const isLida = lidasIds.includes(n.id);
                                return (
                                    <Box key={n.id} p={4} bg={isLida ? 'white' : 'blue.50'} cursor="pointer" onClick={() => { marcarLida(n.id); abrirFeedback(n.id); }}>
                                        <HStack mb={1}>
                                            {n.status === 'CORRIGIDA' ? <CheckCircleIcon color="green.500" boxSize={3} /> : <WarningTwoIcon color="red.500" boxSize={3} />}
                                            <Text fontSize="xs" fontWeight="bold" color={n.status === 'CORRIGIDA' ? 'green.600' : 'red.600'}>{n.status === 'CORRIGIDA' ? 'Redação Corrigida!' : 'Redação Atualizada'}</Text>
                                        </HStack>
                                        <Text fontSize="sm" color={isLida ? 'gray.600' : 'gray.800'} fontWeight={isLida ? 'medium' : 'bold'} noOfLines={1}>{n.tema_titulo}</Text>
                                    </Box>
                                );
                            })}
                        </VStack>
                    ) : (<Box p={6} textAlign="center"><Text color="gray.500" fontSize="sm">Nenhuma notificação.</Text></Box>)}
                </PopoverBody>
            </PopoverContent>
        </Popover>
    );
};

const PainelAluno = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
  
    const [passo, setPasso] = useState('dashboard');
    const [redacoes, setRedacoes] = useState([]);
    const [temas, setTemas] = useState([]);
    const [materiais, setMateriais] = useState([]);
    const [pacotes, setPacotes] = useState([]);
    const [banners, setBanners] = useState([]);
    const [usuario, setUsuario] = useState({});
    const [configsGlobais, setConfigsGlobais] = useState({});
    const [carteira, setCarteira] = useState({ saldo_simples: 0, saldo_vip: 0 });
    const [redacaoSelecionada, setRedacaoSelecionada] = useState(null);

    const [bannerIndex, setBannerIndex] = useState(0);
    const [isHoveredBanner, setIsHoveredBanner] = useState(false);
    const [tempoVitrine, setTempoVitrine] = useState('');
    const [treinoAtivo, setTreinoAtivo] = useState(false);

    const { isOpen: isOfertaOpen, onOpen: openOferta, onClose: closeOferta } = useDisclosure();
    const [ofertaSelecionada, setOfertaSelecionada] = useState(null);
    const [dadosPixOferta, setDadosPixOferta] = useState(null);
    const [transacaoCartaoOferta, setTransacaoCartaoOferta] = useState(null);
    const [aguardandoCartaoOferta, setAguardandoCartaoOferta] = useState(false);
    
    const [processandoPixOferta, setProcessandoPixOferta] = useState(false);
    const [processandoCartaoOferta, setProcessandoCartaoOferta] = useState(false);

    const [lidasIds, setLidasIds] = useState(() => { try { return JSON.parse(localStorage.getItem('notificacoesLidas')) || []; } catch(e){ return []; } });

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const aba = params.get('aba');
        if (aba) setPasso(aba); else setPasso('dashboard');
    }, [location.search]);

    useEffect(() => {
        if (passo !== 'historico' && passo !== 'feedback') {
            sessionStorage.removeItem('filtroBuscaHist'); sessionStorage.removeItem('filtroStatusHist'); sessionStorage.removeItem('filtroTipoHist'); sessionStorage.removeItem('filtroDataIniHist'); sessionStorage.removeItem('filtroDataFimHist'); sessionStorage.removeItem('filtroPaginaHist');
        }
    }, [passo]);

    useEffect(() => { carregarDadosIniciais(); }, []);
    useEffect(() => {
        let interval;
        if (passo === 'dashboard' || passo === 'historico') interval = setInterval(() => { carregarDadosIniciais(); }, 15000);
        return () => clearInterval(interval);
    }, [passo]);

    const carregarDadosIniciais = async () => {
        const token = localStorage.getItem('token');
        if(!token) return;
        try {
            const [rRed, rUser, rTem, rPac, rConf, rBan, rMat] = await Promise.all([
                axios.get('http://127.0.0.1:8000/api/minhas-redacoes/', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://127.0.0.1:8000/api/me/', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://127.0.0.1:8000/api/temas/', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://127.0.0.1:8000/api/gestao/pacotes/', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://127.0.0.1:8000/api/gestao/configuracoes/', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://127.0.0.1:8000/api/gestao/banners/', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://127.0.0.1:8000/api/materiais/', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setRedacoes(rRed.data); setUsuario(rUser.data); setTemas(rTem.data.filter(t=>t.ativo));
            setPacotes(rPac.data.filter(p=>p.ativo)); setConfigsGlobais(rConf.data); setMateriais(rMat.data);
            const agora = new Date().getTime(); setBanners(rBan.data.filter(b => !b.data_fim || new Date(b.data_fim).getTime() > agora));
            
            if (!rUser.data.is_staff && !rUser.data.is_corretor) {
                const cart = await axios.get('http://127.0.0.1:8000/api/aluno/carteira/', { headers: { Authorization: `Bearer ${token}` } });
                setCarteira(cart.data);
            }
        } catch (e) {}
    };

    useEffect(() => {
        if (banners.length <= 1) return;
        const tempoMs = (configsGlobais.tempo_carrossel_segundos || 6) * 1000;
        let carouselInterval;
        if (!isHoveredBanner) {
            carouselInterval = setInterval(() => { setBannerIndex(prev => prev + 1); }, tempoMs);
        }
        return () => { if(carouselInterval) clearInterval(carouselInterval); };
    }, [banners, isHoveredBanner, configsGlobais]);

    useEffect(() => {
        if (banners.length === 0) return;
        const timerInterval = setInterval(() => {
            const bannerAtual = banners[bannerIndex % banners.length];
            if (bannerAtual && bannerAtual.data_fim && bannerAtual.tipo === 'OFERTA') {
                const distance = new Date(bannerAtual.data_fim).getTime() - new Date().getTime();
                if (distance < 0) { setTempoVitrine('Expirou'); } else {
                    const d = Math.floor(distance / (1000 * 60 * 60 * 24)); const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)); const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)); const s = Math.floor((distance % (1000 * 60)) / 1000);
                    setTempoVitrine(`${d > 0 ? d+'d ' : ''}${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`);
                }
            } else setTempoVitrine('');
        }, 1000);
        return () => clearInterval(timerInterval);
    }, [banners, bannerIndex]);

    const handleBannerClick = (banner) => {
        if (banner.tipo === 'OFERTA' && banner.pacote_info?.id) {
            const pacotePromo = pacotes.find(p => p.id === banner.pacote_info.id);
            if (pacotePromo) {
                setOfertaSelecionada(pacotePromo);
                setDadosPixOferta(null); setAguardandoCartaoOferta(false); setTransacaoCartaoOferta(null);
                openOferta();
            } else { toast({ title: 'Pacote indisponível no momento.', status: 'error' }); }
        } else if ((banner.tipo === 'EVENTO' || banner.tipo === 'AVISO') && banner.link_destino) {
            window.open(banner.link_destino, '_blank');
        }
    };

    const comprarOfertaPix = async () => {
        setProcessandoPixOferta(true);
        try {
            const res = await axios.post('http://127.0.0.1:8000/api/pagamento/pix/', { valor_total: ofertaSelecionada.preco, descricao: ofertaSelecionada.nome, qtd_simples: ofertaSelecionada.qtd_creditos_simples, qtd_vip: ofertaSelecionada.qtd_creditos_vip }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            setDadosPixOferta(res.data); toast({ title: "Código PIX Gerado!", status: "success" });
        } catch (e) { toast({ title: "Erro na geração do PIX.", status: "error" }); }
        setProcessandoPixOferta(false);
    };

    const comprarOfertaCartao = async () => {
        setProcessandoCartaoOferta(true);
        try {
            const res = await axios.post('http://127.0.0.1:8000/api/pagamento/cartao/', { valor_total: ofertaSelecionada.preco, descricao: ofertaSelecionada.nome, qtd_simples: ofertaSelecionada.qtd_creditos_simples, qtd_vip: ofertaSelecionada.qtd_creditos_vip, max_parcelas: ofertaSelecionada.permite_parcelamento ? ofertaSelecionada.max_parcelas : 1 }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            window.open(res.data.link_pagamento, '_blank'); setTransacaoCartaoOferta(res.data.transacao_id); setAguardandoCartaoOferta(true);
        } catch (e) { toast({ title: "Erro na geração do link.", status: "error" }); }
        setProcessandoCartaoOferta(false);
    };

    const verificarCartaoOferta = async () => {
        if(!transacaoCartaoOferta) return;
        setProcessandoCartaoOferta(true);
        try {
            const res = await axios.post(`http://127.0.0.1:8000/api/loja/verificar-pagamento/${transacaoCartaoOferta}/`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            if (res.data.status === 'APROVADO') {
                toast({ title: "Pagamento Aprovado! 🎉", status: "success", duration: 5000 });
                closeOferta(); setAguardandoCartaoOferta(false); setTransacaoCartaoOferta(null); setOfertaSelecionada(null); carregarDadosIniciais(); window.dispatchEvent(new Event('atualizarCarteira')); 
            } else { toast({ title: "Ainda Pendente", status: "warning", duration: 5000 }); }
        } catch (e) { toast({ title: "Erro na verificação", status: "error" }); }
        setProcessandoCartaoOferta(false);
    };

    useEffect(() => {
        let intOferta;
        if (dadosPixOferta && dadosPixOferta.pagamento_id) {
            intOferta = setInterval(async () => {
                try {
                    const res = await axios.get(`http://127.0.0.1:8000/api/pagamento/status/${dadosPixOferta.pagamento_id}/`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
                    if (res.data.status === 'approved') {
                        clearInterval(intOferta); closeOferta(); setDadosPixOferta(null); setOfertaSelecionada(null); carregarDadosIniciais(); window.dispatchEvent(new Event('atualizarCarteira')); 
                        toast({ title: "Pagamento Confirmado! 🎉", description: "O pacote da oferta já está na sua carteira.", status: "success", duration: 8000, isClosable: true });
                    }
                } catch (e) {}
            }, 5000);
        }
        return () => clearInterval(intOferta);
    }, [dadosPixOferta]);

    const abrirFeedback = async (id) => {
        try {
            const res = await axios.get(`http://127.0.0.1:8000/api/redacao/${id}/`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            let dados = res.data;
            if (dados.texto && dados.texto.trim() !== '') dados.conteudoTexto = dados.texto;
            else if (dados.arquivo && dados.arquivo.endsWith('.txt')) { const txtRes = await axios.get(dados.arquivo); dados.conteudoTexto = txtRes.data; }
            setRedacaoSelecionada(dados); navigate('?aba=feedback'); setPasso('feedback');
        } catch (e) { toast({ title: "Erro ao abrir correção", status: "error" }); }
    };

    const parseDate = (r) => new Date(r.data_atualizacao ? r.data_atualizacao : r.data_envio).getTime();
    const notificacoesRecentes = [...redacoes].filter(r => r.status === 'CORRIGIDA' || r.status === 'DEVOLVIDA' || r.status === 'ANULADA').sort((a, b) => parseDate(b) - parseDate(a)).slice(0, 8);
    const marcarLida = (id) => { if(!lidasIds.includes(id)){ const n = [...lidasIds, id]; setLidasIds(n); localStorage.setItem('notificacoesLidas', JSON.stringify(n)); }};

    let titulo = "Painel do Aluno", subtitulo = "";
    if (passo === 'dashboard') { titulo = `Olá, ${usuario.first_name || 'Aluno'}! 👋`; subtitulo = "Acompanhe o seu desempenho."; }
    else if (passo === 'historico') { titulo = "Minhas Redações"; subtitulo = "Histórico completo de envios e correções."; }
    else if (passo === 'selecao_tema') { titulo = "Treinar Redação"; subtitulo = "Selecione a proposta para iniciar o treino."; }
    else if (passo === 'loja') { titulo = "Loja de Créditos"; subtitulo = "Adquira pacotes ou compre créditos avulsos."; }
    else if (passo === 'material_apoio') { titulo = "Material de Apoio"; subtitulo = "Explore nossa biblioteca."; }
    
    const abasTreino = ['selecao_tema', 'escolha_modo', 'upload_manuscrito', 'escrever_online'];
    const mostrarCabecalho = ['dashboard', 'historico', 'loja', 'material_apoio'].includes(passo) || (abasTreino.includes(passo) && !treinoAtivo);
    const esconderMargens = passo === 'feedback' || (abasTreino.includes(passo) && treinoAtivo);

    return (
        <Box w="full" h="100%">
            <GlobalStyles />
            {mostrarCabecalho && (
                <Flex px={{ base: 4, md: 8 }} pt={8} mb={8} direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "start", md: "center" }} gap={4}>
                    <Box flex="1" minW="200px"><Heading size="lg" color="teal.700" mb={1}>{titulo}</Heading><Text color="gray.500" fontSize="md">{subtitulo}</Text></Box>
                    
                    {banners.length > 0 && (
                        <Flex align="center" gap={3} direction={{ base: "column", md: "row" }} w={{ base: "100%", md: "auto" }}>
                            
                            {banners.length > 1 && (
                                <Flex direction={{ base: "row", md: "column" }} gap={2}>
                                    <IconButton aria-label="Anterior" icon={<ChevronLeftIcon boxSize={6} />} size="sm" isRound bg="white" color="gray.600" shadow="sm" border="1px solid" borderColor="gray.200" _hover={{ bg: "gray.50" }} onClick={() => setBannerIndex(prev => prev === 0 ? banners.length - 1 : prev - 1)} />
                                    <IconButton aria-label="Próximo" icon={<ChevronRightIcon boxSize={6} />} size="sm" isRound bg="white" color="gray.600" shadow="sm" border="1px solid" borderColor="gray.200" _hover={{ bg: "gray.50" }} onClick={() => setBannerIndex(prev => prev + 1)} />
                                </Flex>
                            )}

                            <Box bg="white" maxW={{ base: "100%", lg: "400px", xl: "745px" }} w="full" flexShrink={0} position="relative" overflow="hidden" borderRadius="xl" onMouseEnter={() => setIsHoveredBanner(true)} onMouseLeave={() => setIsHoveredBanner(false)} boxShadow="md">
                                <Flex w={`${banners.length * 100}%`} h="full" alignItems="stretch" transform={`translateX(-${(bannerIndex % banners.length) * (100 / banners.length)}%)`} transition="transform 0.5s ease-in-out">
                                    {banners.map((banner, idx) => {
                                        let badgeInfo = { cor: 'blue', texto: '📢 AVISO GERAL' };
                                        if (banner.tipo === 'OFERTA') badgeInfo = { cor: 'red', texto: '⚡ OFERTA LIMITADA' };
                                        if (banner.tipo === 'EVENTO') badgeInfo = { cor: 'green', texto: '📅 AULÃO/EVENTO' };
                                        
                                        const cClick = banner.tipo === 'OFERTA' || banner.link_destino ? "pointer" : "default";
                                        const rawCor = banner.cor_pelicula || 'black';
                                        const isLinear = rawCor.includes('linear');
                                        const safeCor = (rawCor === 'rgba(0,0,0,' || rawCor === 'rgba(255,255,255,') ? (rawCor.includes('255') ? 'white' : 'black') : rawCor;

                                        return (
                                        <Box w={`${100 / banners.length}%`} h="full" display="flex" key={idx}>
                                            <Card flex="1" h="full" onClick={() => handleBannerClick(banner)} cursor={cClick} w="full" minH={{ base: "auto", md: "113px" }} bgGradient={!banner.imagem_fundo ? banner.cor_fundo : 'none'} bg={banner.imagem_fundo ? 'gray.900' : undefined} shadow="none" border="none" px={{ base: 4, md: 6 }} py={4} borderRadius="xl" overflow="hidden" position="relative" display="flex" flexDirection={{ base: "column", md: "row" }} justify="space-between" align={{ base: "start", md: "center" }} gap={4} className={banner.tipo === 'OFERTA' ? 'banner-oferta' : ''}>
                                                
                                                {banner.imagem_fundo && (
                                                    <>
                                                        <Image src={banner.imagem_fundo} position="absolute" top={0} left={0} w="100%" h="100%" objectFit="cover" zIndex={0} pointerEvents="none" />
                                                        <Box 
                                                            position="absolute" top={0} left={0} w="100%" h="100%" 
                                                            bgGradient={isLinear ? safeCor : 'none'}
                                                            bg={!isLinear ? safeCor : undefined}
                                                            opacity={(banner.opacidade_pelicula ?? 60) / 100}
                                                            zIndex={1} pointerEvents="none" 
                                                        />
                                                    </>
                                                )}
                                                
                                                <VStack align="start" spacing={1.5} justify="center" h="full" w="full" position="relative" zIndex={2}>
                                                    <Badge colorScheme={badgeInfo.cor} fontSize="xs" px={2} py={0.5} borderRadius="md" mb={0}>{badgeInfo.texto}</Badge>
                                                    <Heading size="md" color={safeCor === 'white' ? 'gray.900' : 'white'} lineHeight="1.3" textShadow={safeCor === 'white' ? 'none' : "1px 1px 3px rgba(0,0,0,0.9)"}>{banner.titulo}</Heading>
                                                    {banner.descricao && <Text fontSize="sm" color={safeCor === 'white' ? 'gray.800' : 'whiteAlpha.900'} textShadow={safeCor === 'white' ? 'none' : "1px 1px 2px rgba(0,0,0,0.9)"}>{banner.descricao}</Text>}
                                                </VStack>
                                                
                                                {/* NOVA DISPOSIÇÃO HORIZONTAL: O botão fica ao lado da data/cronômetro */}
                                                <Flex direction={{ base: "column", md: "row" }} align={{ base: "stretch", md: "center" }} justify={{ base: "center", md: "flex-end" }} gap={3} flexShrink={0} position="relative" zIndex={2} mb={banners.length > 1 ? 3 : 0} w={{ base: "full", md: "auto" }}>
                                                    
                                                    {banner.tipo === 'OFERTA' && (
                                                        <HStack spacing={3} bg="blackAlpha.500" px={5} py={2.5} borderRadius="lg" justify="center" backdropFilter="blur(4px)" border="1px solid rgba(255,255,255,0.2)" w="full">
                                                            <TimeIcon color="white" boxSize={5} />
                                                            <Text fontSize="lg" fontWeight="bold" color="white" lineHeight="1" letterSpacing="widest">{tempoVitrine || '...'}</Text>
                                                        </HStack>
                                                    )}

                                                    {banner.tipo === 'EVENTO' && banner.data_fim && (
                                                        <HStack spacing={3} bg="whiteAlpha.900" px={4} py={2} borderRadius="lg" justify="center" color="gray.800" shadow="md" w="full">
                                                            <VStack spacing={0}>
                                                                <Text fontSize="2xs" fontWeight="900" textTransform="uppercase" color="red.500" lineHeight="1">{new Date(banner.data_fim).toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}</Text>
                                                                <Text fontSize="xl" fontWeight="900" lineHeight="1" my={0}>{new Date(banner.data_fim).getDate()}</Text>
                                                            </VStack>
                                                            <Divider orientation="vertical" h="30px" borderColor="gray.300" />
                                                            <Text fontSize="xl" fontWeight="900" lineHeight="1">{new Date(banner.data_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
                                                        </HStack>
                                                    )}

                                                    {(banner.tipo === 'EVENTO' || banner.tipo === 'AVISO') && banner.link_destino && banner.texto_botao && (
                                                        <Button size="md" rightIcon={<ExternalLinkIcon />} colorScheme={safeCor === 'white' ? 'blue' : 'whiteAlpha'} bg={safeCor === 'white' ? 'blue.500' : 'whiteAlpha.300'} backdropFilter="blur(5px)" _hover={{ bg: safeCor === 'white' ? 'blue.600' : "whiteAlpha.400" }} w="full">
                                                            {banner.texto_botao}
                                                        </Button>
                                                    )}
                                                </Flex>

                                            </Card>
                                        </Box>
                                    )})}
                                </Flex>

                                {banners.length > 1 && (
                                    <Flex position="absolute" bottom={1.5} left="50%" transform="translateX(-50%)" zIndex={10} gap={2}>
                                        {banners.map((_, idx) => {
                                            const isCurrent = idx === (bannerIndex % banners.length);
                                            return (<Box key={idx} w={isCurrent ? "16px" : "6px"} h="6px" borderRadius="full" bg={isCurrent ? "white" : "whiteAlpha.500"} transition="all 0.3s" cursor="pointer" onClick={() => setBannerIndex(idx)} />);
                                        })}
                                    </Flex>
                                )}
                            </Box>
                        </Flex>
                    )}
                    <SininhoNotificacoes notificacoesRecentes={notificacoesRecentes} lidasIds={lidasIds} marcarLida={marcarLida} abrirFeedback={abrirFeedback} />
                </Flex>
            )}

            <Box px={esconderMargens ? 0 : { base: 4, md: 8 }} pb={8} h={esconderMargens ? '100vh' : 'auto'}>
                {passo === 'dashboard' && <AbaDashboard redacoes={redacoes} />}
                {passo === 'historico' && <AbaHistorico redacoes={redacoes} usuario={usuario} abrirFeedback={abrirFeedback} abrirMotivo={abrirFeedback} />}
                {passo === 'loja' && <AbaLoja pacotes={pacotes} configsGlobais={configsGlobais} carteira={carteira} carregarDadosIniciais={carregarDadosIniciais} />}
                {passo === 'material_apoio' && <AbaMaterial materiais={materiais} recarregar={carregarDadosIniciais} />}
                {abasTreino.includes(passo) && <AbaTreino temas={temas} carteira={carteira} configsGlobais={configsGlobais} carregarDadosIniciais={carregarDadosIniciais} setTreinoAtivo={setTreinoAtivo} mudarAba={setPasso} />}
                
                {passo === 'feedback' && redacaoSelecionada && (
                    <AbaFeedback redacao={redacaoSelecionada} voltar={() => { setRedacaoSelecionada(null); navigate('?aba=historico'); }} carregarDadosIniciais={carregarDadosIniciais} />
                )}
            </Box>

            <Modal isOpen={isOfertaOpen} onClose={() => { closeOferta(); setAguardandoCartaoOferta(false); }} isCentered size="xl" closeOnOverlayClick={!dadosPixOferta && !aguardandoCartaoOferta}>
                <ModalOverlay backdropFilter="blur(5px)" />
                <ModalContent borderRadius="2xl" overflow="hidden">
                    <Box bg="gray.900" p={4} textAlign="center"><Heading size="md" color="white">{dadosPixOferta ? "Realize o Pagamento" : "Desbloquear Oferta Exclusiva"}</Heading></Box>
                    {!dadosPixOferta && !aguardandoCartaoOferta && <ModalCloseButton color="white" />}
                    
                    <ModalBody p={{ base: 4, md: 8 }} bg="gray.50">
                        {ofertaSelecionada && !dadosPixOferta && !aguardandoCartaoOferta && (
                            <Flex direction={{ base: 'column', md: 'row' }} gap={8} align="center" justify="center">
                                <Box w={{ base: "100%", md: "280px" }} flexShrink={0}>
                                    <Card bg="white" shadow="xl" borderRadius="2xl" border="1px solid" borderColor="yellow.400" overflow="hidden">
                                        <Box position="absolute" top="0" w="full" bg="yellow.400" color="yellow.900" py={1.5} textAlign="center" fontSize="xs" fontWeight="900" textTransform="uppercase">🔥 Oferta Exclusiva</Box>
                                        <Box bg="yellow.50" p={6} pt={10} textAlign="center" borderBottom="1px solid" borderColor="gray.100">
                                            <Heading size="md" color="yellow.800" mb={2}>{ofertaSelecionada.nome}</Heading>
                                            <Text fontSize="sm" color="gray.500" mb={4} minH="40px">{ofertaSelecionada.descricao}</Text>
                                            <Flex justify="center" align="flex-end" gap={1} mb={1}>
                                                <Text fontSize="sm" color="gray.500" fontWeight="bold" pb={1}>R$</Text>
                                                <Text fontSize="4xl" fontWeight="900" color="gray.800" lineHeight="0.9">{parseFloat(ofertaSelecionada.preco).toFixed(2).replace('.', ',')}</Text>
                                            </Flex>
                                            
                                            {ofertaSelecionada.preco_original && parseFloat(ofertaSelecionada.preco_original) > parseFloat(ofertaSelecionada.preco) && (
                                                <Text fontSize="xs" color="gray.400" textDecoration="line-through">De R$ {parseFloat(ofertaSelecionada.preco_original).toFixed(2).replace('.', ',')}</Text>
                                            )}
                                            {ofertaSelecionada.permite_parcelamento ? (
                                                <Text fontSize="xs" fontWeight="bold" color="teal.600" mt={1}>em até {ofertaSelecionada.max_parcelas}x no cartão</Text>
                                            ) : (
                                                <Text fontSize="xs" color="gray.400" mt={1}>Pagamento à vista</Text>
                                            )}
                                        </Box>
                                        <CardBody p={5} display="flex" flexDirection="column" alignItems="center">
                                            <VStack spacing={3} align="center" flex="1" w="full">
                                                <HStack justify="center" w="full"><CheckCircleIcon color="green.500" boxSize={4}/><Text fontSize="sm" fontWeight="bold" color="gray.700">{ofertaSelecionada.qtd_creditos_simples} Correções detalhadas</Text></HStack>
                                                {ofertaSelecionada.qtd_creditos_vip > 0 && <HStack justify="center" w="full"><CheckCircleIcon color="purple.500" boxSize={4}/><Text fontSize="sm" fontWeight="bold" color="purple.700">{ofertaSelecionada.qtd_creditos_vip} Fila VIP (Prioridade)</Text></HStack>}
                                                <HStack justify="center" w="full"><CheckCircleIcon color="green.500" boxSize={4}/><Text fontSize="sm" color="gray.600">Acesso a Temas Oficiais</Text></HStack>
                                                <HStack justify="center" w="full"><CheckCircleIcon color="green.500" boxSize={4}/><Text fontSize="sm" color="gray.600">Material de Apoio Grátis</Text></HStack>
                                            </VStack>
                                        </CardBody>
                                    </Card>
                                </Box>
                                
                                <Box flex="1" w="full" maxW="280px" display="flex" flexDirection="column" justify="center">
                                    <Heading size="sm" color="gray.700" mb={2} textAlign="center">Desbloquear Pacote</Heading>
                                    <Text color="gray.500" textAlign="center" mb={6} fontSize="sm">Escolha a sua forma de pagamento abaixo para ativar os seus créditos imediatamente.</Text>
                                    <VStack spacing={4}>
                                        <Button colorScheme="blue" w="full" size="lg" shadow="md" isLoading={processandoCartaoOferta} isDisabled={processandoPixOferta} onClick={comprarOfertaCartao}>💳 Pagar com Cartão</Button>
                                        <Button colorScheme="green" w="full" size="lg" shadow="md" isLoading={processandoPixOferta} isDisabled={processandoCartaoOferta} onClick={comprarOfertaPix}>💠 Pagar via PIX</Button>
                                    </VStack>
                                </Box>
                            </Flex>
                        )}

                        {aguardandoCartaoOferta && (
                            <VStack spacing={6} align="center" textAlign="center" py={4}><Icon as={TimeIcon} boxSize={12} color="blue.500" /><Heading size="md" color="gray.700">Aguardando o pagamento</Heading><Text color="gray.600">Após concluir a compra na nova aba segura do Mercado Pago, clique no botão abaixo.</Text></VStack>
                        )}
                        
                        {dadosPixOferta && (
                            <VStack spacing={5} align="center" textAlign="center">
                                <Text fontWeight="bold" color="teal.600" fontSize="lg">Escaneie o QR Code abaixo</Text>
                                <Box border="4px solid" borderColor="teal.400" borderRadius="xl" p={2} bg="white" shadow="md"><Image src={`data:image/jpeg;base64,${dadosPixOferta.qr_code_base64}`} boxSize="200px" /></Box>
                                <Box w="full"><InputGroup size="md"><Input value={dadosPixOferta.qr_code} isReadOnly pr="5.5rem" bg="gray.100" fontSize="xs" /><Button h="1.75rem" size="sm" position="absolute" right="0.2rem" top="0.25rem" zIndex={2} colorScheme="teal" onClick={() => {navigator.clipboard.writeText(dadosPixOferta.qr_code); toast({ title: 'Copiado!', status: 'info', duration: 2000});}}>Copiar</Button></InputGroup></Box>
                            </VStack>
                        )}
                    </ModalBody>
                    
                    <ModalFooter bg="gray.100" display="flex" flexDirection="column" gap={3}>
                        {aguardandoCartaoOferta ? (
                            <><Button colorScheme="blue" size="md" w="full" onClick={verificarCartaoOferta} isLoading={processandoCartaoOferta}>Já paguei! Verificar Créditos</Button><Button variant="outline" colorScheme="red" size="sm" w="full" onClick={() => { closeOferta(); setAguardandoCartaoOferta(false); }}>Cancelar</Button></>
                        ) : dadosPixOferta ? (
                            <HStack w="full" spacing={3}>
                                <Button variant="outline" colorScheme="red" size="lg" w="full" onClick={() => { setDadosPixOferta(null); }}>Cancelar</Button>
                                <Button colorScheme="teal" size="lg" w="full" onClick={() => { closeOferta(); toast({ title: "Aguardando pagamento.", status: "info" }); }}>Fechar e Aguardar</Button>
                            </HStack>
                        ) : null}
                    </ModalFooter>
                </ModalContent>
            </Modal>
            
            <BotaoSuporte />
        </Box>
    );
};

export default PainelAluno;