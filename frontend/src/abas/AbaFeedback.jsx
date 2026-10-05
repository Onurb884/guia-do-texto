import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Flex, HStack, Button, Divider, Badge, Tooltip, Box, Image, Popover, PopoverTrigger, Portal, PopoverContent, PopoverArrow, PopoverHeader, PopoverBody, VStack, Heading, Text, Textarea, useToast, Icon, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Alert, AlertIcon, FormControl, FormLabel, ModalFooter, useDisclosure, Card, CardBody } from '@chakra-ui/react';
import { ArrowBackIcon, WarningTwoIcon, StarIcon, CheckCircleIcon, ViewIcon, ViewOffIcon, InfoIcon } from '@chakra-ui/icons';

const CustomPinSVG = ({ cor, numero }) => (
    <Box position="relative" w="22px" h="22px" color={cor} filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.3))" transition="all 0.2s" _hover={{ transform: 'scale(1.25)' }}>
        <Icon viewBox="0 0 24 24" w="100%" h="100%"><path fill="currentColor" d="M4 2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2z"/></Icon>
        <Text position="absolute" top="5px" left="0" w="100%" textAlign="center" color="white" fontSize="10px" fontWeight="900" fontFamily="system-ui">{numero}</Text>
    </Box>
);

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const formatarTexto = (texto) => {
    if (!texto) return '';
    if (texto.includes('<p>') || texto.includes('<span')) return texto; 
    return texto.replace(/\n/g, '<br />').replace(/\*(.*?)\*/g, '<strong>$1</strong>').replace(/_(.*?)_/g, '<em>$1</em>').replace(/~(.*?)~/g, '<u>$1</u>');
};

const INFO_COMPETENCIAS_ENEM = { 1: { nome: "Domínio da Escrita Formal", cor: "red.500", bg: "red.50" }, 2: { nome: "Tema/Estrutura/Repertório", cor: "blue.500", bg: "blue.50" }, 3: { nome: "Argumentação", cor: "yellow.500", bg: "yellow.50" }, 4: { nome: "Coesão", cor: "green.500", bg: "green.50" }, 5: { nome: "Proposta de Intervenção", cor: "purple.500", bg: "purple.50" } };
const INFO_COMPETENCIAS_PADRAO = { 1: { nome: "Domínio da Norma Culta", cor: "red.500", bg: "red.50" }, 2: { nome: "Adequação ao Tema e Estrutura Textual", cor: "blue.500", bg: "blue.50" }, 3: { nome: "Coerência e Argumentação", cor: "yellow.500", bg: "yellow.50" }, 4: { nome: "Coesão Textual", cor: "green.500", bg: "green.50" } };

const renderComentarioParaAluno = (texto) => {
    if (!texto) return null;
    let limpo = texto.replace(/\[ALERTA_COORDENACAO\][\s\S]*?\[\/ALERTA_COORDENACAO\]\n?/g, '').replace(/\[SINALIZADO:[\s\S]*?(?=\[|$)/gi, '').replace(/\bNone\b/g, '').trim();
    if (!limpo) return null; 
    
    const parts = limpo.split(/(?=\[.*?\])/);
    const blocos = parts.map((part, idx) => {
        if (!part.trim()) return null;
        let title = "Parecer do Professor"; let content = part.trim(); let color = "blue";
        
        const titleMatch = part.match(/^\[(.*?)\]/);
        if (titleMatch) {
            const tagOriginal = titleMatch[1];
            content = part.replace(titleMatch[0], '').trim();
            const tUpper = tagOriginal.toUpperCase();
            
            // TRAVA DE INVISIBILIDADE: O aluno não vê os carimbos internos de QA da coordenação.
            if (tUpper.includes("FALSO POSITIVO QA")) {
                return null;
            }

            if (tUpper.includes("FALHA GRAVE CONFIRMADA") || tUpper.includes("REDAÇÃO DEVOLVIDA")) {
                title = "Motivo do Cancelamento"; color = "red";
            } else if (tUpper.includes("RECURSO SOLICITADO")) {
                title = "Seu Pedido de Revisão"; color = "cyan";
            } else if (tUpper.includes("RESPOSTA AO RECURSO")) {
                title = "Parecer da Coordenação"; color = "purple";
            } else if (tUpper.includes("NOTA REVISADA PELA COORDENAÇÃO")) {
                title = "Nota Revisada (Qualidade)"; color = "green";
            } else {
                title = "Aviso Especial"; color = "orange";
            }
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

const AbaFeedback = ({ redacao, voltar, carregarDadosIniciais }) => {
    const toast = useToast();
    const modalRecurso = useDisclosure();
    const modalProposta = useDisclosure();
    
    const [hoveredPinViewId, setHoveredPinViewId] = useState(null);
    const [pinFocadoId, setPinFocadoId] = useState(null); 
    const [motivoRecurso, setMotivoRecurso] = useState('');
    const [loadingRecurso, setLoadingRecurso] = useState(false);
    
    const [notaCorretor, setNotaCorretor] = useState(0);
    const [comentarioAvaliacao, setComentarioAvaliacao] = useState('');
    const [loadingAvaliacao, setLoadingAvaliacao] = useState(false);
    const [avaliacaoEnviada, setAvaliacaoEnviada] = useState(false);

    const [mostrarPins, setMostrarPins] = useState(true);
    const [filtroCompetenciaView, setFiltroCompetenciaView] = useState(null);
    const [temaCompleto, setTemaCompleto] = useState(redacao.tema_completo || null);

    useEffect(() => {
        if (redacao?.correcao) {
            const notaBanco = redacao.correcao.avaliacao_aluno || 0;
            setNotaCorretor(notaBanco);
            setComentarioAvaliacao(redacao.correcao.comentario_avaliacao || '');
            setAvaliacaoEnviada(notaBanco > 0);
        }
    }, [redacao]);

    useEffect(() => {
        const fetchTema = async () => {
            if (!temaCompleto) {
                try {
                    const temaId = redacao.tema || redacao.tema_id || (redacao.tema_obj && redacao.tema_obj.id);
                    if (temaId) {
                        const res = await axios.get(`http://127.0.0.1:8000/api/temas/${temaId}/`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
                        setTemaCompleto(res.data);
                    }
                } catch (e) {
                    console.error('Erro ao carregar detalhes do tema:', e);
                }
            }
        };
        fetchTema();
    }, [redacao, temaCompleto]);

    const isPadrao = redacao?.tema_tipo?.includes('PADRAO') || redacao?.tema_tipo === 'SIMPLES' || redacao?.tipo?.includes('PADRAO') || redacao?.tipo === 'SIMPLES';
    const isPadrao10 = redacao?.tema_tipo === 'PADRAO_10' || redacao?.tipo === 'PADRAO_10';
    const numComps = isPadrao ? [1,2,3,4] : [1,2,3,4,5];

    // LÓGICA DE SEGURANÇA E BLOQUEIO DO RECURSO
    const isCancelada = redacao?.status === 'DEVOLVIDA' || redacao?.status === 'ANULADA';
    const dataConclusao = new Date(redacao?.data_atualizacao || redacao?.data_envio || new Date());
    const diasPassados = (new Date() - dataConclusao) / (1000 * 60 * 60 * 24);
    const prazoExpirado = diasPassados > 7;
    const vereditoFinal = redacao?.correcao?.comentario_geral?.includes('[FALHA GRAVE CONFIRMADA]');
    
    // BLOQUEIO SUPREMO: Impede que clique "Contestar" se já tiver pedido alguma vez.
    const jaPediuRecurso = redacao?.status === 'EM_RECURSO' || redacao?.status === 'RECURSO' || redacao?.status === 'REFAZER' || redacao?.correcao?.comentario_geral?.includes('[RECURSO SOLICITADO]') || redacao?.correcao?.comentario_geral?.includes('[RESPOSTA AO RECURSO]');
    
    const podeContestar = !isCancelada && !prazoExpirado && !vereditoFinal && !jaPediuRecurso;

    let tooltipContestarTexto = "Pedir revisão à coordenação.";
    if (vereditoFinal) tooltipContestarTexto = "A decisão da coordenação é irreversível.";
    else if (prazoExpirado) tooltipContestarTexto = "O prazo de 7 dias expirou.";
    else if (jaPediuRecurso) tooltipContestarTexto = "O recurso já foi solicitado ou julgado.";

    const descricaoProposta = temaCompleto?.descricao || redacao.tema_descricao || '';
    const motivadoresAtuais = temaCompleto?.motivadores || redacao.motivadores || redacao.tema_motivadores || [];

    const enviarAvaliacao = async () => {
        if (notaCorretor === 0) return toast({ title: "Selecione uma nota!", status: "warning" });
        setLoadingAvaliacao(true);
        try {
            await axios.post(`http://127.0.0.1:8000/api/redacao/${redacao.id}/avaliar/`, { nota: notaCorretor, comentario: comentarioAvaliacao }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            toast({ title: "Obrigado pelo feedback!", status: "success" });
            setAvaliacaoEnviada(true);
            carregarDadosIniciais();
        } catch (error) { toast({ title: "Erro ao enviar", status: "error" }); }
        setLoadingAvaliacao(false);
    };

    const solicitarRecurso = async () => {
        if (motivoRecurso.trim().length < 20) return toast({ title: "Justificação muito curta!", status: "warning" });
        setLoadingRecurso(true);
        try {
            await axios.post(`http://127.0.0.1:8000/api/redacao/${redacao.id}/recurso/`, { motivo: motivoRecurso }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            toast({ title: "Recurso Enviado!", status: "success" });
            modalRecurso.onClose(); carregarDadosIniciais(); voltar();
        } catch (error) { toast({ title: "Erro ao solicitar recurso.", status: "error" }); }
        setLoadingRecurso(false);
    };

    const getImagemUrl = (caminho) => {
        if (!caminho) return '';
        if (typeof caminho !== 'string') return '';
        return caminho.startsWith('http') ? caminho : `http://127.0.0.1:8000${caminho}`;
    };

    const getPinTitle = (pin, config) => {
        if (pin.competencia === 1 && pin.tipo_erro && pin.tipo_erro !== 'Geral') { return `Competência 1 - ${pin.tipo_erro}`; }
        return `Competência ${pin.competencia}`;
    };

    const conteudoComentarios = renderComentarioParaAluno(redacao?.correcao?.comentario_geral);
    const anotacoes = redacao?.correcao?.anotacoes || [];
    const contagem = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, total: anotacoes.length };
    anotacoes.forEach(pin => { if (pin.competencia) contagem[pin.competencia]++; });

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
                            <Button leftIcon={<ArrowBackIcon />} onClick={voltar} variant="ghost" colorScheme="gray">Voltar</Button>
                            <Divider orientation="vertical" h="24px" display={{ base: 'none', md: 'block' }} />
                            <Heading size="md" color="gray.800">Feedback da Correção</Heading>
                        </HStack>
                        <HStack spacing={4}>
                            <Badge bg={isPadrao10 ? 'purple.50' : (isPadrao ? 'blue.50' : 'green.50')} color={isPadrao10 ? 'purple.700' : (isPadrao ? 'blue.700' : 'green.700')} px={4} py={1.5} borderRadius="md" fontSize="sm">
                                {(redacao.tema_tipo || redacao.tipo || 'ENEM').replace('_', ' ')}
                            </Badge>
                            <Button size="sm" colorScheme="blue" variant="outline" leftIcon={<InfoIcon />} onClick={modalProposta.onOpen} shadow="sm">Ver Proposta</Button>
                        </HStack>
                    </Flex>

                    {/* LINHA 2: BARRA TÁTICA DE PINS */}
                    <Flex justify="space-between" align="center" px={4} py={2} bg="gray.50" borderBottom="1px solid" borderColor="gray.300">
                        <HStack spacing={3} overflowX="auto" pb={{base: 2, md: 0}} css={{ '&::-webkit-scrollbar': { display: 'none' } }}>
                            <Text fontSize="xs" fontWeight="bold" color="gray.600" textTransform="uppercase" whiteSpace="nowrap">Filtrar Marcações:</Text>
                            <HStack spacing={2}>
                                <Button size="xs" variant={filtroCompetenciaView === null ? 'solid' : 'outline'} colorScheme="gray" onClick={() => setFiltroCompetenciaView(null)}>
                                    Todas ({contagem.total})
                                </Button>
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
                        <HStack spacing={3} ml={4} flexShrink={0}>
                            <Button size="xs" onClick={() => setMostrarPins(!mostrarPins)} leftIcon={<Icon as={mostrarPins ? ViewOffIcon : ViewIcon} />} colorScheme="gray" variant="ghost">
                                {mostrarPins ? "Ocultar Tudo" : "Mostrar Tudo"}
                            </Button>
                        </HStack>
                    </Flex>
                </Flex>

                {/* ÁREA DA IMAGEM E PINS (SCROLL INDEPENDENTE) */}
                <Box flex={1} overflowY="auto" p={{ base: 4, lg: 8 }} display="flex" justifyContent="center">
                    <Box position="relative" display="inline-block" height="fit-content" boxShadow="dark-lg" bg="white" w={redacao.arquivo ? "full" : "700px"} maxW={redacao.arquivo ? "900px" : "700px"} onClick={() => setPinFocadoId(null)}>
                        
                        {redacao.arquivo ? (
                            <Image src={getImagemUrl(redacao.arquivo)} w="100%" h="auto" objectFit="contain" />
                        ) : redacao.conteudoTexto ? (
                            <Box p="0" position="relative" minHeight="1216px" bgImage="linear-gradient(transparent 39px, #ccc 40px)" bgSize="100% 40px">
                                <Box position="absolute" left={0} top={0} bottom={0} w="40px" borderRight="1px solid #ccc" bg="gray.50" pt="8px" pointerEvents="none" zIndex={2}>
                                    {Array.from({length: 30}).map((_, i) => (
                                        <Text key={i} h="40px" lineHeight="40px" textAlign="center" fontSize="12px" color="gray.400" fontWeight="bold" m={0} p={0}>{i + 1}</Text>
                                    ))}
                                </Box>
                                <Box pl="55px" pr="20px" pt="8px" pb="8px" whiteSpace="pre-wrap" fontFamily="Arial, sans-serif" fontSize="16px" lineHeight="40px" color="gray.800">
                                    {redacao.conteudoTexto}
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
                                                <Box position="absolute" left={`calc(${pin.x}% + ${pin.width}% - 6px)`} top={`calc(${pin.y}% - 22px)`} cursor="pointer" zIndex={isHovered || isFocused ? 9999 : 10}
                                                     onClick={(e) => { e.stopPropagation(); setPinFocadoId(pin.id); }} 
                                                     onMouseEnter={() => setHoveredPinViewId(pin.id)} onMouseLeave={() => setHoveredPinViewId(null)}>
                                                    <CustomPinSVG cor={info.cor} numero={pin.competencia} />
                                                </Box>
                                            </PopoverTrigger>
                                            <Portal>
                                                <PopoverContent w="300px" shadow="2xl" zIndex={9999} onMouseEnter={() => setHoveredPinViewId(pin.id)} onMouseLeave={() => setHoveredPinViewId(null)}>
                                                    <PopoverArrow bg={info.bg} />
                                                    <PopoverHeader bg={info.bg} fontWeight="bold" color={info.cor} borderBottom="none" fontSize="sm">{getPinTitle(pin, info)}</PopoverHeader>
                                                    <PopoverBody fontSize="sm" bg="white">
                                                        {pin.tipo_erro && pin.tipo_erro !== 'Geral' && <Badge colorScheme="red" mb={2}>{pin.tipo_erro}</Badge>}
                                                        <Text color="gray.700">{pin.texto}</Text>
                                                    </PopoverBody>
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
            {/* COLUNA DIREITA: SIDEBAR DO ALUNO */}
            {/* ========================================== */}
            <Box w={{ base: '100%', lg: '400px' }} bg="white" borderLeft="1px solid" borderColor="gray.300" display="flex" flexDirection="column" shadow="2xl" zIndex={20}>
                
                {/* CABEÇALHO DA SIDEBAR: BOTÃO CONTESTAR E NOTA TOTAL */}
                <Flex h="80px" px={6} justify="flex-end" align="center" borderBottom="1px solid" borderColor="gray.200" bg="gray.50" gap={4} flexShrink={0}>
                    {!isCancelada && (
                        <Tooltip label={tooltipContestarTexto} hasArrow>
                            <Box display="inline-block">
                                <Button size="sm" colorScheme="orange" onClick={modalRecurso.onOpen} isDisabled={!podeContestar} leftIcon={<WarningTwoIcon />} shadow="sm">
                                    {jaPediuRecurso ? 'Recurso Solicitado' : 'Contestar'}
                                </Button>
                            </Box>
                        </Tooltip>
                    )}
                    <HStack bg={isCancelada ? "red.50" : "green.50"} px={4} py={1.5} borderRadius="full" border="1px solid" borderColor={isCancelada ? "red.200" : "green.200"} shadow="sm">
                        <Text fontSize="xs" fontWeight="bold" color={isCancelada ? "red.600" : "green.600"}>{isCancelada ? "STATUS" : "NOTA TOTAL"}</Text>
                        <Text fontSize="xl" fontWeight="900" color={isCancelada ? "red.700" : "green.700"}>{isCancelada ? "ANULADA" : (redacao.correcao?.nota_final || 0)}</Text>
                    </HStack>
                </Flex>

                {/* CORPO DA SIDEBAR (SCROLL INDEPENDENTE) */}
                <Box flex="1" overflowY="auto" p={6}>
                    <VStack align="stretch" spacing={6}>
                        <Box bg="gray.50" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
                            <Heading size="xs" color="gray.500" mb={1}>TEMA DA REDAÇÃO</Heading>
                            <Text fontWeight="bold">{redacao.tema_titulo}</Text>
                        </Box>
                        
                        {conteudoComentarios && (
                            <Box>
                                <Heading size="xs" mb={3} color="gray.600" textTransform="uppercase">Comentários e Avisos</Heading>
                                {conteudoComentarios}
                            </Box>
                        )}
                        
                        {isCancelada ? (
                            <Alert status="success" variant="left-accent" borderRadius="md" mt={4} bg="green.50" border="1px solid" borderColor="green.200">
                                <AlertIcon color="green.500" />
                                <Box>
                                    <Text fontWeight="bold" fontSize="sm" color="green.800">Créditos Devolvidos!</Text>
                                    <Text fontSize="sm" color="green.700" mt={1}>Como a sua redação foi anulada devido ao problema relatado acima, o seu crédito retornou integralmente para a carteira. Verifique os apontamentos e envie uma nova redação quando quiser!</Text>
                                </Box>
                            </Alert>
                        ) : (
                            <>
                                <Divider borderColor="gray.300" />
                                <Heading size="sm" color="gray.700" textTransform="uppercase">Desempenho</Heading>
                                <VStack spacing={4} align="stretch" width="100%">
                                    {redacao.correcao?.competencias?.map((comp) => { 
                                        const info = isPadrao ? INFO_COMPETENCIAS_PADRAO[comp.comp] : INFO_COMPETENCIAS_ENEM[comp.comp]; if(!info) return null; 
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
                                
                                <Divider borderColor="gray.300" />
                                <Box p={5} bg={avaliacaoEnviada ? "green.50" : "gray.50"} borderRadius="xl" border="1px solid" borderColor={avaliacaoEnviada ? "green.200" : "gray.200"}>
                                    <Heading size="xs" color={avaliacaoEnviada ? "green.700" : "gray.700"} mb={2} textAlign="center">{avaliacaoEnviada ? "Avaliação enviada. Obrigado!" : "Como avalia o seu corretor?"}</Heading>
                                    <Flex justify="center" mb={4}>
                                        {[1, 2, 3, 4, 5].map((estrela) => (
                                            <Icon key={estrela} as={StarIcon} boxSize={6} cursor={avaliacaoEnviada ? "default" : "pointer"} color={estrela <= notaCorretor ? "yellow.400" : "gray.300"} onClick={() => !avaliacaoEnviada && setNotaCorretor(estrela)} _hover={!avaliacaoEnviada ? { color: 'yellow.300', transform: 'scale(1.1)' } : {}} transition="all 0.2s" />
                                        ))}
                                    </Flex>
                                    {!avaliacaoEnviada ? (
                                        <VStack align="stretch" spacing={3}>
                                            <Textarea size="sm" bg="white" placeholder="Deixe um elogio ou melhoria..." value={comentarioAvaliacao} onChange={e => setComentarioAvaliacao(e.target.value)} />
                                            <Button size="sm" colorScheme="yellow" onClick={enviarAvaliacao} isLoading={loadingAvaliacao}>Enviar Avaliação</Button>
                                        </VStack>
                                    ) : ( 
                                        comentarioAvaliacao && <Text fontSize="sm" color="green.700" fontStyle="italic" textAlign="center">"{comentarioAvaliacao}"</Text> 
                                    )}
                                </Box>
                            </>
                        )}
                    </VStack>
                </Box>
            </Box>

            {/* MODALS */}
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

            <Modal isOpen={modalRecurso.isOpen} onClose={modalRecurso.onClose} isCentered size="md">
                <ModalOverlay backdropFilter="blur(3px)" />
                <ModalContent borderRadius="xl">
                    <ModalHeader color="orange.600"><WarningTwoIcon /> Contestar Correção</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody pb={6}>
                        <Alert status="info" borderRadius="md" mb={4}><AlertIcon /><Box><Text fontWeight="bold" fontSize="sm">Atenção</Text><Text fontSize="xs">A sua redação será enviada para a coordenação pedagógica.</Text></Box></Alert>
                        <FormControl isRequired>
                            <FormLabel fontWeight="bold" fontSize="sm">Por que discorda da nota?</FormLabel>
                            <Textarea bg="gray.50" rows={4} value={motivoRecurso} onChange={e => setMotivoRecurso(e.target.value)} placeholder="Ex: Acredito que minha argumentação no 2º parágrafo atende à competência 3..." />
                        </FormControl>
                    </ModalBody>
                    <ModalFooter bg="gray.50"><Button variant="ghost" mr={3} onClick={modalRecurso.onClose}>Cancelar</Button><Button colorScheme="orange" onClick={solicitarRecurso} isLoading={loadingRecurso}>Enviar</Button></ModalFooter>
                </ModalContent>
            </Modal>
        </Flex>
    );
};

export default AbaFeedback;