import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { SimpleGrid, Card, CardBody, VStack, HStack, Badge, Button, Icon, Divider, Box, Text, Flex, Heading, Alert, AlertIcon, IconButton, Input, InputGroup, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Image } from '@chakra-ui/react';
import { StarIcon, CheckCircleIcon, MinusIcon, AddIcon, CheckIcon, TimeIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

const AbaLoja = ({ pacotes, configsGlobais, carteira, carregarDadosIniciais }) => {
    const toast = useToast();
    const location = useLocation();
    const navigate = useNavigate();

    const [qtdAvulsoNormal, setQtdAvulsoNormal] = useState(0);
    const [qtdAvulsoVip, setQtdAvulsoVip] = useState(0);
    const [pacotePage, setPacotePage] = useState(0);
    
    const [modalCheckoutOpen, setModalCheckoutOpen] = useState(false);
    const [checkoutItem, setCheckoutItem] = useState(null); 
    const [cupomDigitado, setCupomDigitado] = useState('');
    const [cupomAplicado, setCupomAplicado] = useState(null);
    
    const [processandoPix, setProcessandoPix] = useState(false);
    const [processandoCartao, setProcessandoCartao] = useState(false);
    
    const [dadosPix, setDadosPix] = useState(null); 
    const [transacaoCartaoId, setTransacaoCartaoId] = useState(null); 
    const [aguardandoCartao, setAguardandoCartao] = useState(false);

    const valorNormal = parseFloat(configsGlobais?.preco_avulso_normal || 9.90);
    const valorVip = parseFloat(configsGlobais?.preco_avulso_vip || 14.90);
    const pacotesLoja = pacotes.filter(p => p.visivel_loja); 
    const pacotesPorPagina = 3;
    const totalPaginas = Math.ceil(pacotesLoja.length / pacotesPorPagina);
    const pacotesAtuais = pacotesLoja.slice(pacotePage * pacotesPorPagina, (pacotePage + 1) * pacotesPorPagina);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const checkoutId = params.get('checkout');
        if (checkoutId && pacotes.length > 0) {
            const pacoteAlvo = pacotes.find(p => p.id === parseInt(checkoutId));
            if (pacoteAlvo) {
                iniciarCheckout('pacote', pacoteAlvo);
                navigate('/painel-aluno?aba=loja', { replace: true });
            }
        }
    }, [location.search, pacotes, navigate]);

    useEffect(() => {
        let intervalo;
        if (dadosPix && dadosPix.pagamento_id) {
            intervalo = setInterval(async () => {
                try {
                    const res = await axios.get(`http://127.0.0.1:8000/api/pagamento/status/${dadosPix.pagamento_id}/`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
                    if (res.data.status === 'approved') {
                        clearInterval(intervalo); setModalCheckoutOpen(false); setDadosPix(null); setQtdAvulsoNormal(0); setQtdAvulsoVip(0); setCheckoutItem(null);
                        carregarDadosIniciais(); window.dispatchEvent(new Event('atualizarCarteira')); 
                        toast({ title: "Pagamento Confirmado! 🎉", description: "Os seus créditos já estão na carteira. Bom treino!", status: "success", duration: 8000, isClosable: true });
                    }
                } catch (e) {}
            }, 5000);
        }
        return () => clearInterval(intervalo);
    }, [dadosPix]);

    const iniciarCheckout = (tipo, pacote = null) => {
        let precoBruto = tipo === 'pacote' ? parseFloat(pacote.preco) : (qtdAvulsoNormal * valorNormal) + (qtdAvulsoVip * valorVip);
        setCheckoutItem({ tipo, pacote, precoOriginal: precoBruto }); setCupomDigitado(''); setCupomAplicado(null); setDadosPix(null); setModalCheckoutOpen(true);
    };

    const validarCupom = async () => {
        if(!cupomDigitado.trim()) return;
        try {
            const res = await axios.post('http://127.0.0.1:8000/api/loja/validar-cupom/', { codigo: cupomDigitado }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            setCupomAplicado({ codigo: cupomDigitado.toUpperCase(), desconto: res.data.desconto_percentual });
            toast({ title: "Cupom Validado!", description: `Desconto de ${parseFloat(res.data.desconto_percentual)}% aplicado.`, status: "success" });
        } catch (e) { setCupomAplicado(null); toast({ title: "Ops!", description: e.response?.data?.erro || "Cupom inválido", status: "error" }); }
    };

    const processarPagamentoFinal = async () => {
        setProcessandoPix(true);
        try {
            let valorFinal = checkoutItem.precoOriginal;
            if (cupomAplicado) valorFinal = valorFinal - (valorFinal * parseFloat(cupomAplicado.desconto) / 100);
            const res = await axios.post('http://127.0.0.1:8000/api/pagamento/pix/', { 
                valor_total: valorFinal, 
                descricao: checkoutItem.tipo === 'pacote' ? checkoutItem.pacote.nome : `Avulsos: ${qtdAvulsoNormal}N, ${qtdAvulsoVip}V`, 
                qtd_simples: checkoutItem.tipo === 'pacote' ? checkoutItem.pacote.qtd_creditos_simples : qtdAvulsoNormal, 
                qtd_vip: checkoutItem.tipo === 'pacote' ? checkoutItem.pacote.qtd_creditos_vip : qtdAvulsoVip 
            }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            setDadosPix(res.data); toast({ title: "Código PIX Gerado!", description: "Escaneie o QR Code para concluir.", status: "success" });
        } catch (e) { toast({ title: "Erro na compra", status: "error" }); }
        setProcessandoPix(false);
    };

    const processarPagamentoCartao = async () => {
        setProcessandoCartao(true);
        try {
            let valorFinal = checkoutItem.precoOriginal;
            if (cupomAplicado) valorFinal = valorFinal - (valorFinal * parseFloat(cupomAplicado.desconto) / 100);
            const res = await axios.post('http://127.0.0.1:8000/api/pagamento/cartao/', { 
                valor_total: valorFinal, 
                descricao: checkoutItem.tipo === 'pacote' ? checkoutItem.pacote.nome : `Avulsos: ${qtdAvulsoNormal}N, ${qtdAvulsoVip}V`, 
                qtd_simples: checkoutItem.tipo === 'pacote' ? checkoutItem.pacote.qtd_creditos_simples : qtdAvulsoNormal, 
                qtd_vip: checkoutItem.tipo === 'pacote' ? checkoutItem.pacote.qtd_creditos_vip : qtdAvulsoVip, 
                max_parcelas: (checkoutItem.tipo === 'pacote' && checkoutItem.pacote.permite_parcelamento) ? checkoutItem.pacote.max_parcelas : 1 
            }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            window.open(res.data.link_pagamento, '_blank'); setTransacaoCartaoId(res.data.transacao_id); setAguardandoCartao(true);
        } catch (e) { toast({ title: "Erro na geração do link", status: "error" }); }
        setProcessandoCartao(false);
    };

    const verificarPagamentoCartao = async () => {
        if(!transacaoCartaoId) return;
        setProcessandoCartao(true);
        try {
            const res = await axios.post(`http://127.0.0.1:8000/api/loja/verificar-pagamento/${transacaoCartaoId}/`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            if (res.data.status === 'APROVADO') {
                toast({ title: "Pagamento Aprovado! 🎉", status: "success", duration: 5000 });
                setModalCheckoutOpen(false); setAguardandoCartao(false); setTransacaoCartaoId(null); setQtdAvulsoNormal(0); setQtdAvulsoVip(0); setCheckoutItem(null); carregarDadosIniciais(); window.dispatchEvent(new Event('atualizarCarteira')); 
            } else { toast({ title: "Ainda Pendente", status: "warning", duration: 5000 }); }
        } catch (e) { toast({ title: "Erro na verificação", status: "error" }); }
        setProcessandoCartao(false);
    };

    return (
        <Box>
            <Flex gap={5} direction={{ base: 'column', lg: 'row' }} align="start" minH={{ lg: "480px" }}>
                <Box w={{ base: '100%', lg: '320px' }} flexShrink={0}>
                    <Card h="max-content" bg="white" shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.200">
                        <Box bg="gray.50" p={4} borderBottom="1px solid" borderColor="gray.100"><Heading size="sm" color="teal.700" textAlign="center">Créditos Avulsos</Heading></Box>
                        <VStack p={5} align="stretch" spacing={5}>
                            <Alert status="info" borderRadius="md" bg="blue.50" color="blue.800" border="1px solid" borderColor="blue.100" p={4}>
                                <AlertIcon color="blue.500" boxSize={5} />
                                <Box>
                                    <Text fontSize="sm" fontWeight="900" mb={1} textTransform="uppercase" whiteSpace="nowrap">O que é a Correção VIP?</Text>
                                    <Text fontSize="xs" lineHeight="tall">
                                        Ao utilizar um crédito VIP no envio da sua redação, ela <b>fura a fila</b> e é entregue aos corretores com urgência máxima, garantindo o seu feedback muito mais rápido. Ideal para a véspera da prova!
                                    </Text>
                                </Box>
                            </Alert>
                            <SimpleGrid columns={2} spacing={3}>
                                <Box><Text color="gray.600" fontWeight="bold" fontSize="sm" mb={1} textAlign="center">Normal</Text><Flex align="center" justify="space-between" bg="gray.50" borderRadius="lg" p={1} border="1px solid" borderColor="gray.200"><IconButton aria-label="Remover" icon={<MinusIcon />} size="xs" variant="ghost" color="gray.600" onClick={() => setQtdAvulsoNormal(Math.max(0, qtdAvulsoNormal - 1))} /><Text fontSize="lg" fontWeight="bold" color="gray.800">{qtdAvulsoNormal}</Text><IconButton aria-label="Adicionar" icon={<AddIcon />} size="xs" variant="ghost" color="gray.600" onClick={() => setQtdAvulsoNormal(qtdAvulsoNormal + 1)} /></Flex><Text textAlign="center" color="gray.500" fontSize="xs" mt={2}>R$ {valorNormal.toFixed(2).replace('.',',')}/un</Text></Box>
                                <Box><Text color="purple.600" fontWeight="bold" fontSize="sm" mb={1} textAlign="center"><StarIcon mr={1} mb={0.5}/> VIP</Text><Flex align="center" justify="space-between" bg="purple.50" borderRadius="lg" p={1} border="1px solid" borderColor="purple.200"><IconButton aria-label="Remover VIP" icon={<MinusIcon />} size="xs" variant="ghost" colorScheme="purple" onClick={() => setQtdAvulsoVip(Math.max(0, qtdAvulsoVip - 1))} /><Text fontSize="lg" fontWeight="bold" color="purple.800">{qtdAvulsoVip}</Text><IconButton aria-label="Adicionar VIP" icon={<AddIcon />} size="xs" variant="ghost" colorScheme="purple" onClick={() => setQtdAvulsoVip(qtdAvulsoVip + 1)} /></Flex><Text textAlign="center" color="gray.500" fontSize="xs" mt={2}>R$ {valorVip.toFixed(2).replace('.',',')}/un</Text></Box>
                            </SimpleGrid>
                            <Box mt="2"><Divider borderColor="gray.200" mb={4} /><Box textAlign="center"><Text color="gray.400" textTransform="uppercase" fontSize="xs" fontWeight="bold">Total a Pagar</Text><Text fontSize="3xl" fontWeight="900" color="teal.600"><Text as="span" fontSize="lg" color="gray.400">R$ </Text>{((qtdAvulsoNormal * valorNormal) + (qtdAvulsoVip * valorVip)).toFixed(2).replace('.',',')}</Text><Button size="md" colorScheme="teal" w="full" mt={3} leftIcon={<CheckIcon />} isDisabled={qtdAvulsoNormal === 0 && qtdAvulsoVip === 0} onClick={() => iniciarCheckout('avulso')}>Comprar Avulsos</Button></Box></Box>
                        </VStack>
                    </Card>
                </Box>
                
                <Card flex="1" bg="white" shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.200">
                    <Box bg="gray.50" p={4} borderBottom="1px solid" borderColor="gray.100" display="flex" justify="space-between" alignItems="center">
                        <Heading size="sm" color="gray.700">Pacotes Promocionais</Heading>
                        <HStack><IconButton size="sm" aria-label="Anterior" icon={<ChevronLeftIcon />} onClick={() => setPacotePage(p => Math.max(p - 1, 0))} isDisabled={pacotePage === 0} /><IconButton size="sm" aria-label="Próximo" icon={<ChevronRightIcon />} onClick={() => setPacotePage(p => Math.min(p + 1, totalPaginas - 1))} isDisabled={pacotePage >= totalPaginas - 1 || totalPaginas === 0} /></HStack>
                    </Box>
                    <Box p={6} flex="1">
                        <SimpleGrid columns={{ base: 1, xl: 3 }} spacing={6} w="full" h="full">
                            {pacotesAtuais.map((p, index) => {
                                const precoNum = parseFloat(p.preco); const isDestaque = p.selo_destaque || index === 1;
                                return (
                                <Card key={p.id} bg="white" shadow={isDestaque ? "xl" : "sm"} borderRadius="2xl" border="1px solid" borderColor={isDestaque ? "yellow.400" : "gray.200"} position="relative" overflow="hidden" transform={isDestaque ? { xl: "scale(1.03)" } : "none"} zIndex={isDestaque ? 2 : 1}>
                                    {isDestaque && (<Box position="absolute" top="0" w="full" bg="yellow.400" color="yellow.900" py={1.5} textAlign="center" fontSize="xs" fontWeight="900" textTransform="uppercase">🔥 {p.selo_destaque || "MAIS POPULAR"}</Box>)}
                                    
                                    <Box bg={isDestaque ? "yellow.50" : "gray.50"} p={6} pt={isDestaque ? 10 : 6} textAlign="center" borderBottom="1px solid" borderColor="gray.100">
                                        <Heading size="md" color={isDestaque ? "yellow.800" : "gray.700"} mb={2}>{p.nome}</Heading>
                                        <Text fontSize="sm" color="gray.500" mb={4} minH="40px">{p.descricao}</Text>
                                        
                                        <Flex justify="center" align="flex-end" gap={1} mb={1}>
                                            <Text fontSize="lg" color="gray.600" fontWeight="bold" pb={1}>R$</Text>
                                            <Text fontSize="5xl" fontWeight="900" color="gray.800" lineHeight="0.9">{precoNum.toFixed(2).replace('.', ',')}</Text>
                                        </Flex>
                                        
                                        {p.preco_original && parseFloat(p.preco_original) > precoNum && (
                                            <Text fontSize="sm" color="gray.400" textDecoration="line-through">De R$ {parseFloat(p.preco_original).toFixed(2).replace('.', ',')}</Text>
                                        )}
                                        {p.permite_parcelamento ? (
                                            <Text fontSize="xs" fontWeight="bold" color="teal.600" mt={1}>em até {p.max_parcelas}x no cartão</Text>
                                        ) : (
                                            <Text fontSize="xs" color="gray.400" mt={1}>Pagamento à vista</Text>
                                        )}
                                    </Box>
                                    <CardBody p={6} display="flex" flexDirection="column" flex="1" alignItems="center">
                                        <VStack spacing={3} align="center" flex="1" mb={6} w="full">
                                            <HStack justify="center" w="full"><CheckCircleIcon color="green.500" boxSize={4}/><Text fontSize="sm" fontWeight="bold" color="gray.700">{p.qtd_creditos_simples} Correções detalhadas</Text></HStack>
                                            {p.qtd_creditos_vip > 0 && <HStack justify="center" w="full"><CheckCircleIcon color="purple.500" boxSize={4}/><Text fontSize="sm" fontWeight="bold" color="purple.700">{p.qtd_creditos_vip} Fila VIP (Prioridade)</Text></HStack>}
                                            <HStack justify="center" w="full"><CheckCircleIcon color="green.500" boxSize={4}/><Text fontSize="sm" color="gray.600">Acesso a Temas Oficiais</Text></HStack>
                                            <HStack justify="center" w="full"><CheckCircleIcon color="green.500" boxSize={4}/><Text fontSize="sm" color="gray.600">Material de Apoio Grátis</Text></HStack>
                                        </VStack>
                                        <Box w="full" textAlign="center">
                                            <Button w="full" size="lg" colorScheme={isDestaque ? "yellow" : "teal"} bg={isDestaque ? "yellow.400" : undefined} color={isDestaque ? "yellow.900" : undefined} onClick={() => iniciarCheckout('pacote', p)}>Comprar Agora</Button>
                                        </Box>
                                    </CardBody>
                                </Card>
                                )})}
                        </SimpleGrid>
                    </Box>
                </Card>
            </Flex>

            {/* Modal Checkout */}
            <Modal isOpen={modalCheckoutOpen} onClose={() => { setModalCheckoutOpen(false); setAguardandoCartao(false); }} isCentered size="lg" closeOnOverlayClick={!dadosPix && !aguardandoCartao}>
                <ModalOverlay backdropFilter="blur(3px)" />
                <ModalContent borderRadius="2xl" overflow="hidden">
                    <Box bg="gray.900" p={4} textAlign="center"><Heading size="md" color="white">{dadosPix ? "Realize o Pagamento" : "Finalizar Compra"}</Heading></Box>
                    {!dadosPix && !aguardandoCartao && <ModalCloseButton color="white" />}
                    <ModalBody pb={6} pt={6}>
                        {!dadosPix && !aguardandoCartao ? (
                            <VStack spacing={4} align="stretch">
                                <Box bg="gray.50" p={4} borderRadius="lg" border="1px dashed" borderColor="gray.300">
                                    <Text fontSize="sm" color="gray.500" fontWeight="bold" textTransform="uppercase" mb={1}>Resumo do Pedido</Text>
                                    {checkoutItem?.tipo === 'pacote' ? (<Text fontSize="lg" fontWeight="bold" color="gray.800">{checkoutItem.pacote.nome}</Text>) : (<Text fontSize="lg" fontWeight="bold" color="gray.800">{qtdAvulsoNormal}x Normais, {qtdAvulsoVip}x VIPs</Text>)}
                                    {checkoutItem?.tipo === 'pacote' && checkoutItem.pacote.permite_parcelamento && (
                                        <Badge mt={2} colorScheme="teal" variant="subtle">Aceita parcelamento em até {checkoutItem.pacote.max_parcelas}x no cartão</Badge>
                                    )}
                                </Box>
                                
                                {(!checkoutItem?.pacote || !checkoutItem.pacote.preco_original) && (
                                    <Box>
                                        <Text fontSize="sm" fontWeight="bold" color="gray.700" mb={2}>Tem um cupom de desconto?</Text>
                                        <HStack mb={1}>
                                            <Input placeholder="Código" textTransform="uppercase" value={cupomDigitado} onChange={(e) => setCupomDigitado(e.target.value)} isDisabled={cupomAplicado !== null} />
                                            {cupomAplicado ? (<Button onClick={() => {setCupomAplicado(null); setCupomDigitado('');}} colorScheme="red" variant="ghost">Remover</Button>) : (<Button onClick={validarCupom} colorScheme="teal">Aplicar</Button>)}
                                        </HStack>
                                        {cupomAplicado && (
                                            <Text fontSize="sm" color="green.600" fontWeight="bold" display="flex" alignItems="center">
                                                <CheckCircleIcon mr={1.5} /> Cupom aplicado com sucesso!
                                            </Text>
                                        )}
                                    </Box>
                                )}
                                <Divider />
                                
                                <Flex justify="space-between" align="center">
                                    <Text fontSize="lg" fontWeight="bold" color="gray.600">Total a Pagar:</Text>
                                    <Box textAlign="right">
                                        {cupomAplicado && (
                                            <Text fontSize="sm" color="gray.400" textDecoration="line-through">De R$ {checkoutItem?.precoOriginal.toFixed(2).replace('.',',')}</Text>
                                        )}
                                        <Text fontSize="3xl" fontWeight="900" color="green.500">
                                            R$ {cupomAplicado ? (checkoutItem?.precoOriginal - (checkoutItem?.precoOriginal * parseFloat(cupomAplicado.desconto) / 100)).toFixed(2).replace('.',',') : checkoutItem?.precoOriginal.toFixed(2).replace('.',',')}
                                        </Text>
                                    </Box>
                                </Flex>
                                {cupomAplicado && (
                                    <Text textAlign="right" fontSize="sm" color="green.600" fontWeight="bold" bg="green.50" p={2} borderRadius="md" mt={-2}>
                                        💰 Você economizou R$ {(checkoutItem?.precoOriginal * parseFloat(cupomAplicado.desconto) / 100).toFixed(2).replace('.',',')}!
                                    </Text>
                                )}

                            </VStack>
                        ) : aguardandoCartao ? (
                            <VStack spacing={6} align="center" textAlign="center" py={4}><Icon as={TimeIcon} boxSize={12} color="blue.500" /><Heading size="md" color="gray.700">Aguardando o pagamento</Heading><Text color="gray.600">Após concluir a compra na nova aba segura do Mercado Pago, clique no botão abaixo.</Text></VStack>
                        ) : (
                            <VStack spacing={5} align="center" textAlign="center">
                                <Text fontWeight="bold" color="teal.600" fontSize="lg">Escaneie o QR Code abaixo</Text>
                                <Box border="4px solid" borderColor="teal.400" borderRadius="xl" p={2} bg="white" shadow="md"><Image src={`data:image/jpeg;base64,${dadosPix.qr_code_base64}`} boxSize="200px" /></Box>
                                <Box w="full"><InputGroup size="md"><Input value={dadosPix.qr_code} isReadOnly pr="5.5rem" bg="gray.100" fontSize="xs" /><Button h="1.75rem" size="sm" position="absolute" right="0.2rem" top="0.25rem" zIndex={2} colorScheme="teal" onClick={() => {navigator.clipboard.writeText(dadosPix.qr_code); toast({ title: 'Copiado!', status: 'info', duration: 2000});}}>Copiar</Button></InputGroup></Box>
                            </VStack>
                        )}
                    </ModalBody>
                    <ModalFooter bg="gray.50" display="flex" flexDirection="column" gap={3}>
                        {!dadosPix && !aguardandoCartao ? (
                            <><Button colorScheme="blue" w="full" size="lg" shadow="md" isLoading={processandoCartao} isDisabled={processandoPix} onClick={processarPagamentoCartao}>💳 Pagar com Cartão (Nova Aba)</Button><Button colorScheme="green" w="full" size="lg" shadow="md" isLoading={processandoPix} isDisabled={processandoCartao} onClick={processarPagamentoFinal}>💠 Pagar via PIX</Button></>
                        ) : aguardandoCartao ? (
                            <><Button colorScheme="blue" size="lg" w="full" onClick={verificarPagamentoCartao} isLoading={processandoCartao}>Já paguei! Verificar Créditos</Button><Button variant="outline" colorScheme="red" w="full" onClick={() => { setModalCheckoutOpen(false); setAguardandoCartao(false); }}>Cancelar / Tentar Novamente</Button></>
                        ) : (
                            <HStack w="full" spacing={3}>
                                <Button variant="outline" colorScheme="red" size="lg" w="full" onClick={() => { setDadosPix(null); }}>Cancelar</Button>
                                <Button colorScheme="teal" size="lg" w="full" onClick={() => { setModalCheckoutOpen(false); toast({ title: "Aguardando pagamento.", status: "info" }); }}>Fechar e Aguardar</Button>
                            </HStack>
                        )}
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default AbaLoja;