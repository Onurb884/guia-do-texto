import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Flex, HStack, Button, Divider, Badge, Tooltip, Box, Image, Popover, PopoverTrigger, Portal, PopoverContent, PopoverArrow, PopoverHeader, PopoverBody, VStack, Heading, Text, Textarea, useToast, Icon, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Alert, AlertIcon, FormControl, FormLabel, ModalFooter, useDisclosure } from '@chakra-ui/react';
import { ArrowBackIcon, WarningTwoIcon, StarIcon, CheckCircleIcon } from '@chakra-ui/icons';

const CustomPinSVG = ({ cor, numero }) => (
    <Box position="relative" w="30px" h="30px" color={cor} filter="drop-shadow(0px 3px 3px rgba(0,0,0,0.2))" transition="transform 0.2s" _hover={{ transform: 'scale(1.15)' }}>
        <Icon viewBox="0 0 24 24" w="100%" h="100%"><path fill="currentColor" d="M4 2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2z"/></Icon>
        <Text position="absolute" top="4.5px" left="2px" w="100%" textAlign="center" color="white" fontSize="12px" fontWeight="900" fontFamily="system-ui">{numero}</Text>
    </Box>
);

const INFO_COMPETENCIAS_ENEM = { 1: { nome: "Gramática", cor: "red.500", bg: "red.50" }, 2: { nome: "Tema/Estrutura/Repertório", cor: "blue.500", bg: "blue.50" }, 3: { nome: "Argumentação", cor: "orange.500", bg: "orange.50" }, 4: { nome: "Coesão", cor: "green.500", bg: "green.50" }, 5: { nome: "Proposta", cor: "purple.500", bg: "purple.50" } };
const INFO_COMPETENCIAS_SIMPLES = { 1: { nome: "Gramática", cor: "red.500", bg: "red.50" }, 2: { nome: "Estrutura/Tema/Repertório", cor: "blue.500", bg: "blue.50" }, 3: { nome: "Argumentação", cor: "yellow.500", bg: "yellow.50" }, 4: { nome: "Coesão e coerência", cor: "green.500", bg: "green.50" } };

const renderComentarioParaAluno = (texto) => {
    if (!texto) return null;
    
    let limpo = texto
        .replace(/\[ALERTA_COORDENACAO\][\s\S]*?\[\/ALERTA_COORDENACAO\]\n?/g, '')
        .replace(/\[SINALIZADO:[\s\S]*?(?=\[|$)/gi, '');
    
    limpo = limpo.trim();
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
            
            if (tUpper.includes("FALHA GRAVE CONFIRMADA") || tUpper.includes("REDAÇÃO DEVOLVIDA")) {
                title = "Motivo do Cancelamento"; color = "red";
            } else if (tUpper.includes("RECURSO SOLICITADO")) {
                title = "Seu Pedido de Revisão"; color = "cyan";
            } else if (tUpper.includes("RESPOSTA AO RECURSO")) {
                title = "Parecer da Coordenação"; color = "purple";
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

    return (
        <VStack align="stretch" spacing={3}>
            {blocos}
        </VStack>
    );
};

const AbaFeedback = ({ redacao, voltar, carregarDadosIniciais }) => {
    const toast = useToast();
    const modalRecurso = useDisclosure();
    const [hoveredPinViewId, setHoveredPinViewId] = useState(null);
    const [pinFocadoId, setPinFocadoId] = useState(null); 
    const [motivoRecurso, setMotivoRecurso] = useState('');
    const [loadingRecurso, setLoadingRecurso] = useState(false);
    
    const [notaCorretor, setNotaCorretor] = useState(0);
    const [comentarioAvaliacao, setComentarioAvaliacao] = useState('');
    const [loadingAvaliacao, setLoadingAvaliacao] = useState(false);
    const [avaliacaoEnviada, setAvaliacaoEnviada] = useState(false);

    useEffect(() => {
        if (redacao?.correcao) {
            const notaBanco = redacao.correcao.avaliacao_aluno || 0;
            setNotaCorretor(notaBanco);
            setComentarioAvaliacao(redacao.correcao.comentario_avaliacao || '');
            setAvaliacaoEnviada(notaBanco > 0);
        }
    }, [redacao]);

    const isSimples = redacao?.tema_tipo?.toUpperCase() === 'SIMPLES' || redacao?.tipo?.toUpperCase() === 'SIMPLES'; 
    const isCancelada = redacao?.status === 'DEVOLVIDA' || redacao?.status === 'ANULADA';

    const dataConclusao = new Date(redacao?.data_atualizacao || redacao?.data_envio || new Date());
    const diasPassados = (new Date() - dataConclusao) / (1000 * 60 * 60 * 24);
    const prazoExpirado = diasPassados > 7;
    const vereditoFinal = redacao?.correcao?.comentario_geral?.includes('[FALHA GRAVE CONFIRMADA]');
    const podeContestar = !isCancelada && !prazoExpirado && !vereditoFinal;

    const tooltipContestarTexto = vereditoFinal ? "A decisão da coordenação é irreversível." : prazoExpirado ? "O prazo de 7 dias expirou." : "Pedir revisão à coordenação.";

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

    return (
        <Flex direction="column" h="full">
            <Flex justify="space-between" align="center" bg="white" p={4} borderBottom="1px solid" borderColor="gray.200" shadow="sm" zIndex={10} wrap="wrap" gap={3}>
                <HStack spacing={4}>
                    <Button leftIcon={<ArrowBackIcon />} onClick={voltar} variant="ghost">Voltar</Button>
                    <Divider orientation="vertical" h="24px" display={{ base: 'none', md: 'block' }} />
                    <HStack>
                        <Heading size="md">Feedback da Correção</Heading>
                        <Badge bg={isSimples ? 'blue.50' : 'green.50'} color={isSimples ? 'blue.700' : 'green.700'} px={2} py={1} borderRadius="md" ml={2}>
                            {redacao.tema_tipo || redacao.tipo || 'ENEM'}
                        </Badge>
                    </HStack>
                </HStack>
                <HStack spacing={4}>
                    {!isCancelada && (
                        <Tooltip label={tooltipContestarTexto} hasArrow>
                            <Box display="inline-block">
                                <Button size="sm" colorScheme="orange" onClick={modalRecurso.onOpen} isDisabled={!podeContestar} leftIcon={<WarningTwoIcon />}>Contestar</Button>
                            </Box>
                        </Tooltip>
                    )}
                    <HStack bg={isCancelada ? "red.50" : "green.50"} px={4} py={1} borderRadius="full" border="1px solid" borderColor={isCancelada ? "red.200" : "green.200"}>
                        <Text fontSize="xs" fontWeight="bold" color={isCancelada ? "red.600" : "green.600"}>{isCancelada ? "STATUS" : "NOTA TOTAL"}</Text>
                        <Text fontSize="xl" fontWeight="900" color={isCancelada ? "red.700" : "green.700"}>{isCancelada ? "ANULADA" : (redacao.correcao?.nota_final || 0)}</Text>
                    </HStack>
                </HStack>
            </Flex>

            <Flex h="calc(100vh - 150px)" w="full" overflow="hidden" direction={{ base: 'column', lg: 'row' }}>
                <Box flex={1} overflow="auto" p={{ base: 4, lg: 8 }} display="flex" flexDirection="column" alignItems="center" bg="gray.200">
                    <Box position="relative" display="inline-block" height="fit-content" boxShadow="dark-lg" bg="white" w={redacao.conteudoTexto ? "700px" : "full"} maxW="900px" onClick={() => setPinFocadoId(null)}>
                        {redacao.conteudoTexto ? (
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
                        ) : (<Image src={getImagemUrl(redacao.arquivo)} w="100%" />)}
                        
                        {redacao.correcao?.anotacoes?.map((pin) => { 
                            if(!pin.x) return null; const info = isSimples ? INFO_COMPETENCIAS_SIMPLES[pin.competencia] : INFO_COMPETENCIAS_ENEM[pin.competencia]; if(!info) return null; 
                            
                            const isHovered = hoveredPinViewId === pin.id; 
                            const isFocused = pinFocadoId === pin.id;
                            const isOtherFocused = pinFocadoId !== null && pinFocadoId !== pin.id;

                            if (isOtherFocused) return null;

                            return (
                                <Box key={pin.id}>
                                    <Box position="absolute" left={`${pin.x}%`} top={`${pin.y}%`} w={`${pin.width}%`} h={`${pin.height}%`} bg={info.cor} opacity={isHovered || isFocused ? 0.4 : 0} pointerEvents="none" transition="opacity 0.2s" />
                                    {!isFocused && (
                                        <Popover trigger="hover" placement="top" openDelay={0} isLazy>
                                            <PopoverTrigger>
                                                <Box position="absolute" left={`calc(${pin.x}% + ${pin.width}% - 6px)`} top={`calc(${pin.y}% - 28px)`} cursor="pointer" 
                                                     onClick={(e) => { e.stopPropagation(); setPinFocadoId(pin.id); }} 
                                                     onMouseEnter={() => setHoveredPinViewId(pin.id)} onMouseLeave={() => setHoveredPinViewId(null)}>
                                                    <CustomPinSVG cor={info.cor} numero={pin.competencia} />
                                                </Box>
                                            </PopoverTrigger>
                                            <Portal>
                                                <PopoverContent w="300px" shadow="2xl">
                                                    <PopoverArrow bg={info.bg} />
                                                    <PopoverHeader bg={info.bg} fontWeight="bold" color={info.cor}>{getPinTitle(pin, info)}</PopoverHeader>
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
                
                <Box w={{ base: '100%', lg: '400px' }} bg="white" borderLeft="1px solid #ddd" overflowY="auto" p={6}>
                    <VStack align="stretch" spacing={6}>
                        <Box bg="gray.50" p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
                            <Heading size="xs" color="gray.500" mb={1}>TEMA</Heading>
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
                                        const info = isSimples ? INFO_COMPETENCIAS_SIMPLES[comp.comp] : INFO_COMPETENCIAS_ENEM[comp.comp]; if(!info) return null; 
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
            </Flex>

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