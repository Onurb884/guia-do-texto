import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { SimpleGrid, Card, CardBody, VStack, HStack, Badge, Button, Icon, Divider, Box, Text, Flex, Heading, Input, InputGroup, InputLeftElement, Select, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Textarea, Spinner, Image, useDisclosure, IconButton } from '@chakra-ui/react';
import { SearchIcon, ArrowForwardIcon, ArrowBackIcon, CloseIcon, EditIcon, CopyIcon, AttachmentIcon, DownloadIcon, CheckCircleIcon, ArrowUpIcon, StarIcon, InfoIcon } from '@chakra-ui/icons';

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const formatarTexto = (texto) => {
    if (!texto) return '';
    if (texto.includes('<p>') || texto.includes('<span')) return texto; 
    return texto.replace(/\n/g, '<br />').replace(/\*(.*?)\*/g, '<strong>$1</strong>').replace(/_(.*?)_/g, '<em>$1</em>').replace(/~(.*?)~/g, '<u>$1</u>');
};

const AbaTreino = ({ temas, carteira, configsGlobais, carregarDadosIniciais, setTreinoAtivo }) => {
    const toast = useToast();
    const [passo, setPasso] = useState('selecao'); 
    const [temaSelecionado, setTemaSelecionado] = useState(null);
    const [buscaTema, setBuscaTema] = useState('');
    const [filtroTemaTipo, setFiltroTemaTipo] = useState('TODOS');
    const [paginaAtualTemas, setPaginaAtualTemas] = useState(1);
    const itensPorPaginaTemas = 9;

    const [arquivo, setArquivo] = useState(null);
    const [textoOnline, setTextoOnline] = useState('');
    const [linhasDigitadas, setLinhasDigitadas] = useState(0);
    const [isModoFoco, setIsModoFoco] = useState(false);
    
    const [modalEnvioOpen, setModalEnvioOpen] = useState(false);
    const [usarVIP, setUsarVIP] = useState(false);
    const [enviando, setEnviando] = useState(false);
    
    const { isOpen: modalBrainstormOpen, onOpen: openBrainstorm, onClose: closeBrainstorm } = useDisclosure();
    const [brainstormHtml, setBrainstormHtml] = useState('');
    const [gerandoBrainstorm, setGerandoBrainstorm] = useState(false);
    
    const folhaDigitalRef = useRef(null);
    const mirrorRef = useRef(null); // O nosso espelho invisível para medição perfeita
    const [isCapturing, setIsCapturing] = useState(false); 
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (setTreinoAtivo) {
            setTreinoAtivo(passo !== 'selecao');
        }
        return () => {
            if (setTreinoAtivo) setTreinoAtivo(false);
        };
    }, [passo, setTreinoAtivo]);

    const temasFiltrados = temas.filter(t => (t.titulo || '').toLowerCase().includes(buscaTema.toLowerCase()) && (filtroTemaTipo === 'TODOS' ? true : t.tipo === filtroTemaTipo) && t.ativo !== false);
    const temasPaginados = temasFiltrados.slice((paginaAtualTemas - 1) * itensPorPaginaTemas, paginaAtualTemas * itensPorPaginaTemas);

    // LOGICA DE CONTAGEM DE LINHAS PERFEITA BASEADA NO ESPELHO RENDERIZADO
    useEffect(() => {
        if (!textoOnline) {
            setLinhasDigitadas(0);
        } else if (mirrorRef.current) {
            const height = mirrorRef.current.offsetHeight;
            const lines = Math.round(height / 40);
            setLinhasDigitadas(Math.min(30, lines));
        }
    }, [textoOnline]);

    const cancelarTreino = () => {
        setPasso('selecao');
        setTextoOnline('');
        setArquivo(null);
        setLinhasDigitadas(0);
        setTemaSelecionado(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const pedirBrainstorm = async () => {
        openBrainstorm();
        setGerandoBrainstorm(true);
        try {
            const res = await axios.get(`http://127.0.0.1:8000/api/temas/${temaSelecionado.id}/repertorios_ia/`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            setBrainstormHtml(res.data.html);
        } catch (e) {
            toast({ title: 'Erro ao gerar ideias', status: 'error' });
            closeBrainstorm();
        }
        setGerandoBrainstorm(false);
    };

    const imprimirFolha = () => {
        const baseUrl = window.location.origin;
        const tipoDissertacao = temaSelecionado?.tipo === 'SIMPLES' || temaSelecionado?.tipo === 'PADRAO_100' || temaSelecionado?.tipo === 'PADRAO_10' ? 'BANCAS' : 'ENEM';
        const isEnem = tipoDissertacao === 'ENEM';
        
        const badgeBg = isEnem ? '#C6F6D5' : '#BEE3F8'; 
        const badgeColor = isEnem ? '#1C4532' : '#1A365D'; 
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        
        const html = `<!DOCTYPE html><html><head><title>Folha Oficial - Guia do Texto</title><style>@page { size: A4 portrait; margin: 0; } * { box-sizing: border-box; } body { font-family: 'Arial', sans-serif; color: #000; margin: 0; padding: 10mm 10mm; width: 210mm; height: 296mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; overflow: hidden; display: flex; flex-direction: column; position: relative; } .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 110px; font-weight: 900; letter-spacing: 5px; color: rgba(44, 122, 123, 0.05); z-index: -1; pointer-events: none; white-space: nowrap; text-transform: uppercase; } .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; } .logo { max-height: 30px; object-fit: contain; } .doc-title { font-size: 12px; font-weight: 900; color: ${badgeColor}; background-color: ${badgeBg}; padding: 6px 14px; border-radius: 8px; text-transform: uppercase; } .info-box { border: 2px solid #2C7A7B; padding: 10px 15px; border-radius: 6px; margin-bottom: 10px; background-color: #F7FAFC; z-index: 2;} .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; margin-top: 8px; font-size: 12px; } .info-label { font-weight: bold; color: #2C7A7B; font-size: 11px; } .linha-preencher { display: inline-block; border-bottom: 1px solid #2C7A7B; width: 380px; margin-left: 5px; } .linha-data { display: inline-block; border-bottom: 1px solid #2C7A7B; width: 120px; margin-left: 5px; } .tema-title { font-size: 12px; font-weight: bold; color: #1A202C; margin-top: 4px; text-transform: uppercase; min-height: 32px; display: flex; align-items: flex-start; } .sheet-wrapper { border: 2px solid #2C7A7B; border-radius: 6px; overflow: hidden; flex: 1; display: flex; flex-direction: column; background-color: transparent; z-index: 2;} table { width: 100%; border-collapse: collapse; height: 100%; background-color: transparent; } tr { height: calc(100% / 30); } td.number { width: 35px; text-align: center; font-weight: bold; font-size: 12px; color: #2C7A7B; border-right: 2px solid #2C7A7B; border-bottom: 1px solid #2C7A7B; } td.line { border-bottom: 1px solid #2C7A7B; } tr:last-child td { border-bottom: none; } .footer { display: flex; justify-content: space-between; margin-top: 8px; font-size: 10px; font-weight: bold; color: #718096; z-index: 2; }</style></head><body><div class="watermark">GUIA DO TEXTO</div><div class="header-top"><img src="${baseUrl}/logo-print.png" class="logo" alt="Guia do Texto" onerror="this.style.display='none';"/><div class="doc-title">DISSERTAÇÃO ${tipoDissertacao}</div></div><div class="info-box"><div class="info-row"><div><span class="info-label">NOME DO ALUNO:</span> <span class="linha-preencher"></span></div><div><span class="info-label">DATA:</span> <span class="linha-data"></span></div></div><div><span class="info-label">TEMA DA REDAÇÃO</span></div><div class="tema-title">${temaSelecionado?.titulo}</div></div><div class="sheet-wrapper"><table><tbody>${Array.from({length: 30}, (_, i) => `<tr><td class="number">${i+1}</td><td class="line"></td></tr>`).join('')}</tbody></table></div><div class="footer"><div>Guia do Texto Folha de Treinamento Oficial</div><div>Gerado em: ${dataAtual}</div></div></body></html>`;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed'; iframe.style.right = '0'; iframe.style.bottom = '0'; iframe.style.width = '0px'; iframe.style.height = '0px'; iframe.style.border = 'none';
        document.body.appendChild(iframe);
        iframe.contentWindow.document.open(); iframe.contentWindow.document.write(html); iframe.contentWindow.document.close();
        setTimeout(() => { iframe.contentWindow.focus(); iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 1000); }, 500);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type === 'application/pdf') {
                toast({ title: 'Formato Inválido', description: 'Por favor, envie apenas imagens (Foto). O sistema não aceita PDF para permitir marcações visuais na correção.', status: 'warning', duration: 6000, isClosable: true });
                e.target.value = null;
                return;
            }
            setArquivo(file);
        }
    };

    const confirmarEnvio = async () => {
        if (usarVIP && carteira.saldo_vip <= 0 && carteira.saldo_simples < configsGlobais.custo_creditos_vip) return toast({ title: 'Créditos Insuficientes', status: 'error' });
        if (!usarVIP && carteira.saldo_simples <= 0) return toast({ title: 'Sem Saldo', status: 'error' });

        setEnviando(true);
        const formData = new FormData();
        formData.append('tema', temaSelecionado.id);
        formData.append('is_urgente', usarVIP);
        
        const enviarParaAPI = async (data) => {
            try {
                await axios.post('http://127.0.0.1:8000/api/enviar/', data, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' }});
                toast({ title: "Redação enviada com sucesso!", status: "success" });
                setModalEnvioOpen(false); 
                carregarDadosIniciais(); 
                cancelarTreino(); 
            } catch (e) { 
                toast({ title: "Erro ao enviar", status: "error" }); 
            } finally { 
                setEnviando(false); setIsCapturing(false); 
            }
        };

        if (passo === 'manuscrito') {
            formData.append('arquivo', arquivo);
            enviarParaAPI(formData);
        } else {
            setIsCapturing(true); 
            setTimeout(async () => {
                try {
                    const canvas = await html2canvas(folhaDigitalRef.current, {
                        scale: 2, 
                        backgroundColor: '#ffffff',
                        useCORS: true
                    });
                    
                    canvas.toBlob(async (blob) => {
                        const imgFile = new File([blob], `redacao_digital_${Date.now()}.png`, { type: 'image/png' });
                        formData.append('arquivo', imgFile); 
                        formData.append('texto', textoOnline); 
                        enviarParaAPI(formData);
                    }, 'image/png');
                } catch (e) {
                    toast({ title: "Erro ao processar imagem digital", status: "error" });
                    setEnviando(false); setIsCapturing(false);
                }
            }, 200); 
        }
    };

    if (passo === 'selecao') {
        return (
            <Box>
                <Flex gap={4} bg="white" p={5} borderRadius="xl" boxShadow="sm" align="center" border="1px solid" borderColor="gray.100" mb={8} wrap="wrap">
                    <InputGroup flex={1} minW="250px"><InputLeftElement><SearchIcon color='gray.400'/></InputLeftElement><Input placeholder="Pesquisar tema..." value={buscaTema} onChange={e => setBuscaTema(e.target.value)} /></InputGroup>
                    <Select w="200px" value={filtroTemaTipo} onChange={e => setFiltroTemaTipo(e.target.value)}>
                        <option value="TODOS">Todos os Tipos</option>
                        <option value="ENEM">ENEM</option>
                        <option value="PADRAO_100">Padrão 100</option>
                        <option value="PADRAO_10">Padrão 10</option>
                    </Select>
                </Flex>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} mb={8}>
                    {temasPaginados.map(tema => (
                        <Card key={tema.id} cursor="pointer" onClick={() => {setTemaSelecionado(tema); setPasso('modo');}} borderRadius="2xl" border="1px solid" borderColor="gray.100" bg="white" _hover={{ shadow: 'xl', transform: 'translateY(-4px)' }} transition="all 0.3s">
                            <Box h="6px" w="full" bgGradient={tema.tipo === 'PADRAO_10' ? "linear(to-r, purple.400, pink.400)" : (tema.tipo === 'ENEM' ? "linear(to-r, green.400, teal.400)" : "linear(to-r, blue.400, cyan.400)")} />
                            <CardBody p={6} display="flex" flexDirection="column">
                                <Flex justify="space-between" align="start" mb={4}><Badge bg={tema.tipo === 'ENEM' ? 'green.50' : 'blue.50'} color={tema.tipo === 'ENEM' ? 'green.700' : 'blue.700'} px={3} py={1} borderRadius="full">{tema.tipo.replace('_', ' ')}</Badge><Icon as={ArrowForwardIcon} color="gray.300" boxSize={5} /></Flex>
                                <Text fontSize="18px" color="gray.800" fontWeight="bold">{tema.titulo}</Text>
                            </CardBody>
                        </Card>
                    ))}
                </SimpleGrid>
                {temasFiltrados.length > 0 && (
                    <Flex justify="center" align="center" gap={4}>
                        <Button size="md" onClick={() => setPaginaAtualTemas(p => Math.max(1, p - 1))} isDisabled={paginaAtualTemas === 1} bg="white">Anterior</Button>
                        <Text fontSize="sm" fontWeight="bold">Página {paginaAtualTemas} de {Math.ceil(temasFiltrados.length / itensPorPaginaTemas)}</Text>
                        <Button size="md" onClick={() => setPaginaAtualTemas(p => Math.min(Math.ceil(temasFiltrados.length / itensPorPaginaTemas), p + 1))} isDisabled={paginaAtualTemas === Math.ceil(temasFiltrados.length / itensPorPaginaTemas)} bg="white">Próxima</Button>
                    </Flex>
                )}
            </Box>
        );
    }

    if (passo === 'modo') {
        return (
            <Flex h="calc(100vh - 64px)" align="center" justify="center" w="full" px={4}>
                <Box bg="white" p={10} borderRadius="2xl" boxShadow="sm" border="1px solid" borderColor="gray.100" textAlign="center" w="full">
                    <Flex justify="flex-start" mb={6}><Button leftIcon={<ArrowBackIcon />} variant="ghost" onClick={cancelarTreino}>Trocar Tema</Button></Flex>
                    <Heading mb={2} color="teal.700">Como você prefere escrever?</Heading>
                    <Text color="gray.500" fontSize="lg" mb={10}>Tema: <b>{temaSelecionado?.titulo}</b></Text>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                        <Card cursor="pointer" onClick={() => setPasso('manuscrito')} border="2px solid" borderColor="teal.500" bg="teal.50" _hover={{ shadow: 'lg' }}><CardBody py={12}><Icon as={EditIcon} boxSize={14} color="teal.600" mb={4}/><Heading size="md" mb={3}>Modo Manuscrito</Heading><Badge colorScheme="teal" mb={4} px={3} py={1} borderRadius="full">RECOMENDADO</Badge><Text>Simule a prova oficial. Imprima a folha, escreva e envie a foto.</Text></CardBody></Card>
                        <Card cursor="pointer" onClick={() => setPasso('online')} border="1px solid" borderColor="gray.200" _hover={{ shadow: 'lg', borderColor: 'blue.400' }}><CardBody py={12}><Icon as={CopyIcon} boxSize={14} color="blue.400" mb={4}/><Heading size="md" mb={4}>Editor Digital</Heading><Text>Pratique digitando diretamente na plataforma.</Text></CardBody></Card>
                    </SimpleGrid>
                </Box>
            </Flex>
        );
    }

    return (
        <Flex h="calc(100vh - 32px)" pt={2} gap={{ base: 4, lg: 0 }} direction={{ base: 'column', lg: 'row' }} justify={isModoFoco ? "center" : "flex-start"}>
            
            {/* LADO ESQUERDO: TEMA E TEXTOS MOTIVADORES */}
            {!isModoFoco && (
                <Box flex="1" overflowY="auto" bg="white" p={6} borderTopLeftRadius="xl" borderBottomLeftRadius="xl" borderTopRightRadius={{ base: 'xl', lg: 'none' }} borderBottomRightRadius={{ base: 'xl', lg: 'none' }} borderRight={{ lg: "1px solid #E2E8F0" }} sx={{ '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
                    <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
                        <Button leftIcon={<ArrowBackIcon />} variant="ghost" colorScheme="gray" onClick={() => setPasso('modo')}>Voltar</Button>
                        <Button leftIcon={<CloseIcon boxSize={3} />} variant="ghost" colorScheme="red" onClick={cancelarTreino}>Cancelar</Button>
                    </Flex>
                    <Box bg="teal.50" p={5} borderRadius="lg" mb={6} borderLeft="4px solid" borderColor="teal.500">
                        <Badge colorScheme={temaSelecionado.tipo === 'ENEM' ? 'green' : 'blue'} mb={2} px={2} py={0.5} borderRadius="full">{temaSelecionado.tipo.replace('_', ' ')}</Badge>
                        <Heading size="md" color="teal.800" lineHeight="short">{temaSelecionado.titulo}</Heading>
                    </Box>
                    <Flex justify="space-between" align="center" mb={3} mt={6}><Heading size="sm" color="gray.700" textTransform="uppercase" borderLeft="4px solid" borderColor="teal.500" pl={3}>Comando da Proposta</Heading><Button size="sm" leftIcon={<Text fontSize="md">💡</Text>} colorScheme="blue" onClick={pedirBrainstorm} shadow="sm">Brainstorm</Button></Flex>
                    <Box className="texto-limpo" dangerouslySetInnerHTML={{ __html: formatarTexto(temaSelecionado.descricao) }} mb={8} bg="gray.50" p={5} borderRadius="lg" border="1px solid" borderColor="gray.100" />
                    <Heading size="sm" color="gray.700" mb={4} textTransform="uppercase" borderLeft="4px solid" borderColor="teal.500" pl={3}>Textos Motivadores</Heading>
                    <VStack align="stretch" spacing={6}>
                        {temaSelecionado.motivadores?.map((m, i) => (
                            <Card key={i} borderLeft="4px solid" borderLeftColor="yellow.400" bg="yellow.50" shadow="none">
                                <CardBody><Heading size="xs" color="yellow.800" mb={4} textTransform="uppercase">Texto Motivador {ROMAN_NUMERALS[i] || i + 1}</Heading>{m.tipo === 'texto' ? <Box dangerouslySetInnerHTML={{__html: formatarTexto(m.conteudo)}} /> : <Image src={m.arquivo} maxH="400px" borderRadius="md" />}</CardBody>
                            </Card>
                        ))}
                    </VStack>
                    <Box h="100px" w="full" flexShrink={0} />
                </Box>
            )}

            {/* LADO DIREITO: EDITOR DIGITAL OU UPLOAD MANUSCRITO */}
            {passo === 'manuscrito' ? (
                <Box w={{ base: '100%', lg: '320px', xl: '350px' }} bg="white" p={6} borderTopRightRadius="xl" borderBottomRightRadius="xl" borderTopLeftRadius={{ base: "xl", lg: "none" }} borderBottomLeftRadius={{ base: "xl", lg: "none" }} shadow="md" h="fit-content" position="sticky" top="0" flexShrink={0}>
                    <Heading size="md" color="gray.700" mb={5}><InfoIcon color="teal.500" mr={2}/>Ações da Redação</Heading>
                    <Text fontSize="sm" color="gray.600" mb={6} lineHeight="tall">
                        <b>1.</b> Imprima a folha oficial abaixo.<br/>
                        <b>2.</b> Escreva a sua redação à mão com caneta preta.<br/>
                        <b>3.</b> Tire uma foto nítida e bem iluminada do papel.<br/>
                        <b>4.</b> Anexe a imagem abaixo e envie.
                    </Text>
                    <Button w="full" colorScheme="teal" variant="outline" leftIcon={<DownloadIcon />} onClick={imprimirFolha} mb={6}>1. Imprimir Folha Oficial</Button>
                    <Divider mb={6} />
                    <Heading size="sm" mb={4} textAlign="center">2. Anexar e Enviar</Heading>
                    
                    <Box w="full" h="150px" border="2px dashed" borderColor={arquivo ? "green.400" : "gray.300"} borderRadius="lg" display="flex" flexDirection="column" alignItems="center" justifyContent="center" bg={arquivo ? "green.50" : "gray.50"} cursor="pointer" onClick={() => !arquivo && fileInputRef.current.click()} p={4} position="relative" transition="all 0.2s">
                        {arquivo && (
                            <IconButton 
                                icon={<CloseIcon />} size="xs" colorScheme="red" position="absolute" top={2} right={2} borderRadius="full"
                                onClick={(e) => { e.stopPropagation(); setArquivo(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} 
                                aria-label="Remover Arquivo"
                            />
                        )}
                        <Icon as={arquivo ? CheckCircleIcon : AttachmentIcon} boxSize={8} color={arquivo ? "green.500" : "gray.400"} mb={2} />
                        
                        <Text fontSize="sm" color={arquivo ? "green.800" : "gray.600"} fontWeight="bold" textAlign="center" w="full" px={2} noOfLines={2} wordBreak="break-all">
                            {arquivo ? arquivo.name : "Clique para anexar Foto (JPG/PNG)"}
                        </Text>
                        
                    </Box>
                    <Input type="file" display="none" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg" />
                    
                    <Button colorScheme="teal" size="lg" w="full" mt={4} onClick={() => setModalEnvioOpen(true)} isDisabled={!arquivo} leftIcon={<ArrowUpIcon />}>Confirmar Envio</Button>
                </Box>
            ) : (
                <Box w={{ base: '100%', lg: '780px', xl: '780px' }} flexShrink={0} bg="gray.100" display="flex" flexDirection="column" borderTopRightRadius="xl" borderBottomRightRadius="xl" borderTopLeftRadius={isModoFoco ? "xl" : { base: "xl", lg: "none" }} borderBottomLeftRadius={isModoFoco ? "xl" : { base: "xl", lg: "none" }} overflow="hidden">
                    <Flex bg="white" borderBottom="1px solid #ccc" p={4} justify="space-between" align="center">
                        <HStack spacing={4}><Button size="sm" onClick={() => setIsModoFoco(!isModoFoco)}>{isModoFoco ? "Ver Textos" : "Modo Foco"}</Button><Badge>{linhasDigitadas}/30 Linhas</Badge></HStack>
                        <Button colorScheme="teal" size="sm" onClick={() => { if(textoOnline.length < 50) return toast({title: "Texto muito curto!"}); setModalEnvioOpen(true);}}>Enviar Redação</Button>
                    </Flex>
                    
                    <Box flex="1" overflowX="auto" overflowY="auto" p={{ base: 4, md: 8 }} display="flex" justifyContent={{ base: "flex-start", md: "center" }}>
                        
                        <Box 
                            ref={folhaDigitalRef} 
                            w="700px" minW="700px" h="1200px" minH="1200px" flexShrink={0} 
                            bg="white" boxShadow="lg" position="relative" border="1px solid #ccc" 
                            overflow="hidden"
                        >
                            {/* ESPELHO INVISÍVEL PARA MEDIÇÃO PRECISA DE LINHAS */}
                            <Box 
                                ref={mirrorRef}
                                position="absolute" top={0} left={0} right={0}
                                pl="55px" pr="20px" pt="0px" pb="0px"
                                whiteSpace="pre-wrap" wordBreak="break-word"
                                fontFamily="Arial, sans-serif" fontSize="16px" lineHeight="40px"
                                visibility="hidden" pointerEvents="none" h="auto" minH="40px" zIndex={-1}
                            >
                                {textoOnline.endsWith('\n') ? textoOnline + ' ' : textoOnline}
                            </Box>

                            <Box position="absolute" top={0} left={0} right={0} h="1200px" pointerEvents="none" zIndex={1}>
                                {Array.from({length: 30}).map((_, i) => (
                                    <Box key={i} h="40px" w="full" borderBottom="1px solid #cbd5e0" />
                                ))}
                            </Box>

                            <Box position="absolute" left={0} top={0} h="1200px" w="40px" borderRight="1px solid #ccc" bg="gray.50" pointerEvents="none" zIndex={2}>
                                {Array.from({length: 30}).map((_, i) => (
                                    <Text key={i} h="40px" lineHeight="40px" textAlign="center" fontSize="12px" color="gray.400" fontWeight="bold" m={0} p={0}>{i + 1}</Text>
                                ))}
                            </Box>

                            {!isCapturing && (
                                <Textarea 
                                    value={textoOnline} 
                                    onChange={(e) => setTextoOnline(e.target.value)} 
                                    position="absolute" top={0} left={0} right={0}
                                    w="full" h="1200px"
                                    pl="55px" pr="20px" pt="0px" pb="0px" 
                                    fontSize="16px" lineHeight="40px" fontFamily="Arial, sans-serif"
                                    bg="transparent" border="none" resize="none" 
                                    focusBorderColor="transparent" zIndex={3} 
                                    color="gray.800"
                                    outline="none"
                                    _focus={{ outline: 'none' }}
                                    spellCheck={false}
                                    autoComplete="off"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                />
                            )}

                            {isCapturing && (
                                <Box position="absolute" top={0} left={0} right={0} h="1200px" pl="55px" pr="20px" pt="0px" pb="0px" whiteSpace="pre-wrap" fontFamily="Arial, sans-serif" fontSize="16px" lineHeight="40px" color="gray.800" zIndex={3}>
                                    {textoOnline + (textoOnline.endsWith('\n') ? ' ' : '')}
                                </Box>
                            )}
                        </Box>

                    </Box>
                </Box>
            )}

            <Modal isOpen={modalEnvioOpen} onClose={() => setModalEnvioOpen(false)} isCentered size="md">
                <ModalOverlay backdropFilter="blur(3px)" />
                <ModalContent borderRadius="xl">
                    <ModalHeader>Confirmar Envio</ModalHeader><ModalCloseButton />
                    <ModalBody pb={6}>
                        {isCapturing && (
                            <Flex direction="column" align="center" justify="center" py={6}>
                                <Spinner size="xl" color="teal.500" mb={4} thickness="4px" />
                                <Heading size="sm" color="gray.700">Digitalizando Redação...</Heading>
                                <Text fontSize="sm" color="gray.500" textAlign="center" mt={2}>Estamos a gerar uma imagem imutável da sua folha para enviar ao corretor.</Text>
                            </Flex>
                        )}
                        {!isCapturing && (
                            <>
                                <Text mb={4} color="gray.600">Escolha o tipo de correção que deseja utilizar:</Text>
                                <VStack align="stretch" spacing={3}>
                                    <Button variant={!usarVIP ? "solid" : "outline"} colorScheme="blue" h="auto" py={3} justifyContent="flex-start" onClick={() => setUsarVIP(false)} isDisabled={carteira.saldo_simples <= 0}>
                                        <Box textAlign="left"><Text fontWeight="bold">Correção Padrão</Text><Text fontSize="xs">Custa 1 Crédito Normal (Tem {carteira.saldo_simples})</Text></Box>
                                    </Button>
                                    <Button variant={usarVIP ? "solid" : "outline"} colorScheme="purple" h="auto" py={3} justifyContent="flex-start" onClick={() => setUsarVIP(true)} isDisabled={carteira.saldo_vip <= 0 && carteira.saldo_simples < configsGlobais?.custo_creditos_vip}>
                                        <Box textAlign="left"><Text fontWeight="bold"><StarIcon mr={2}/>Correção VIP</Text><Text fontSize="xs">Custa 1 VIP ou {configsGlobais?.custo_creditos_vip || 2} Normais</Text></Box>
                                    </Button>
                                </VStack>
                            </>
                        )}
                    </ModalBody>
                    {!isCapturing && (
                        <ModalFooter bg="gray.50">
                            <Button variant="ghost" mr={3} onClick={() => setModalEnvioOpen(false)}>Cancelar</Button>
                            <Button colorScheme="teal" onClick={confirmarEnvio} isLoading={enviando}>Enviar</Button>
                        </ModalFooter>
                    )}
                </ModalContent>
            </Modal>

            <Modal isOpen={modalBrainstormOpen} onClose={closeBrainstorm} size="xl" isCentered scrollBehavior="inside">
                <ModalOverlay backdropFilter="blur(3px)" />
                <ModalContent borderRadius="xl" maxH="80vh">
                    <ModalHeader bg="teal.600" color="white" borderTopRadius="xl">💡 Ideias de Repertório</ModalHeader>
                    <ModalCloseButton color="white" mt={1} />
                    <ModalBody py={6}>
                        {gerandoBrainstorm ? (
                            <VStack py={10}><Spinner color="teal.500" size="xl" thickness="4px" /><Text color="gray.500" fontWeight="bold">A inteligência artificial está a analisar o tema...</Text></VStack>
                        ) : (
                            <Box dangerouslySetInnerHTML={{ __html: brainstormHtml }} sx={{ 'h3': { color: 'teal.700', fontSize: 'lg', fontWeight: 'bold', mb: 2, mt: 4 }, 'p': { mb: 3, color: 'gray.700' }, 'hr': { my: 4 } }} />
                        )}
                    </ModalBody>
                    <ModalFooter bg="gray.50" borderBottomRadius="xl"><Button onClick={closeBrainstorm}>Fechar</Button></ModalFooter>
                </ModalContent>
            </Modal>
        </Flex>
    );
};

export default AbaTreino;