import React, { useState, useRef } from 'react';
import { 
  Container, Flex, Card, CardBody, SimpleGrid, Box, Heading, Text, 
  Badge, Button, VStack, HStack, Icon, Select, Input, Divider, Table, 
  Thead, Tbody, Tr, Th, Td, Alert, AlertIcon, Tabs, TabList, TabPanels, 
  Tab, TabPanel, Stepper, Step, StepIndicator, StepStatus, StepIcon, 
  StepNumber, StepTitle, StepDescription, StepSeparator, Modal, 
  ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, 
  ModalFooter, useToast, Stat, StatLabel, StatNumber 
} from '@chakra-ui/react';
import { TimeIcon, DownloadIcon, CheckCircleIcon, AttachmentIcon, ViewIcon, CloseIcon, CalendarIcon } from '@chakra-ui/icons';
import { MdAttachMoney, MdAccountBalanceWallet } from 'react-icons/md';
import axios from 'axios';

const AbaCorretorCarteira = ({ carteira, solicitarSaque, carregarCarteira, handlePrintRecibo }) => {
    const toast = useToast();
    const fileInputInlineRef = useRef(null);
    const [arquivoInline, setArquivoInline] = useState(null);
    const [enviandoRecibo, setEnviandoRecibo] = useState(false);
    
    // Paginação Extrato
    const [filtroDataExtrato, setFiltroDataExtrato] = useState('MES_ATUAL');
    const [dtInicioExtrato, setDtInicioExtrato] = useState('');
    const [dtFimExtrato, setDtFimExtrato] = useState('');
    const [paginaAtualExtrato, setPaginaAtualExtrato] = useState(1);
    const [itensPorPaginaExtrato, setItensPorPaginaExtrato] = useState(10);

    // Paginação Recibos
    const [filtroDataRecibos, setFiltroDataRecibos] = useState('TUDO');
    const [dtInicioRecibos, setDtInicioRecibos] = useState('');
    const [dtFimRecibos, setDtFimRecibos] = useState('');
    const [paginaAtualRecibos, setPaginaAtualRecibos] = useState(1);
    const [itensPorPaginaRecibos, setItensPorPaginaRecibos] = useState(10);

    const [modalReciboOpen, setModalReciboOpen] = useState(false);
    const [reciboVisualizar, setReciboVisualizar] = useState(null);

    const aplicarFiltroData = (itemData, filtro, inicio, fim) => {
        if (!itemData) return false; const dataItem = new Date(itemData); const hoje = new Date();
        if (filtro === 'MES_ATUAL') { return dataItem.getMonth() === hoje.getMonth() && dataItem.getFullYear() === hoje.getFullYear(); }
        if (filtro === 'MES_ANTERIOR') { const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1); return dataItem.getMonth() === mesAnterior.getMonth() && dataItem.getFullYear() === mesAnterior.getFullYear(); }
        if (filtro === 'PERIODO') { if (!inicio && !fim) return true; const dInicio = inicio ? new Date(inicio) : new Date('2000-01-01'); const dFim = fim ? new Date(fim) : new Date('2100-01-01'); dFim.setHours(23, 59, 59, 999); return dataItem >= dInicio && dataItem <= dFim; }
        return true; 
    };

    const enviarReciboInline = async () => {
        if (!arquivoInline) return toast({ title: 'Atenção', description: 'Selecione o arquivo PDF ou foto.', status: 'warning' });
        setEnviandoRecibo(true);
        try {
            const formData = new FormData(); formData.append('arquivo_recibo', arquivoInline);
            await axios.post(`http://127.0.0.1:8000/api/corretor/pagamento/${carteira.pagamento_pendente?.id || carteira.solicitacao_ativa?.id}/enviar-recibo/`, formData, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'multipart/form-data' } });
            toast({ title: 'Enviado com sucesso!', description: 'A equipa financeira vai analisar.', status: 'success' }); setArquivoInline(null); carregarCarteira();
        } catch (e) { toast({ title: 'Erro no envio', status: 'error' }); }
        setEnviandoRecibo(false);
    };

    const cancelarSaque = async () => {
        try {
            await axios.post(`http://127.0.0.1:8000/api/corretor/cancelar-saque/${carteira.pagamento_pendente?.id || carteira.solicitacao_ativa?.id}/`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            toast({ title: 'Saque cancelado.', status: 'info' }); carregarCarteira();
        } catch (error) { toast({ title: 'Erro', description: error.response?.data?.erro, status: 'error' }); }
    };

    const imprimirAnexoRedacoes = (recibo) => {
        const baseUrl = window.location.origin;
        const redacoesDoRecibo = carteira.transacoes?.filter(t => t.pagamento_id === recibo.id) || [];
        const trs = redacoesDoRecibo.map(t => `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(t.data).toLocaleString('pt-BR')}</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${t.descricao}</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">R$ ${parseFloat(t.valor).toFixed(2).replace('.', ',')}</td></tr>`).join('');
        
        const html = `<!DOCTYPE html><html><head><title>Anexo do Recibo</title><style>@page { size: A4 portrait; margin: 12mm 15mm; } body { font-family: 'Arial', sans-serif; color: #333; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2C7A7B; padding-bottom: 10px; margin-bottom: 20px; } .title-container { text-align: right; } .title { font-size: 20px; font-weight: bold; color: #2C7A7B; margin-bottom: 4px; text-transform: uppercase; } .subtitle { font-size: 14px; color: #555; } table { width: 100%; border-collapse: collapse; font-size: 14px; } th { background-color: #f7fafc; padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e0; }</style></head><body><div class="header"><div><img src="${baseUrl}/logo-print.png" alt="Logo" style="max-height: 35px; object-fit: contain;" onerror="this.style.display='none';" /></div><div class="title-container"><div class="title">Anexo de Pagamento #${recibo.id}</div><div class="subtitle">Data: ${new Date(recibo.data_pagamento || recibo.data_solicitacao).toLocaleDateString('pt-BR')}</div></div></div><table><thead><tr><th>Data da Correção</th><th>Descrição</th><th style="text-align: right;">Valor Recebido</th></tr></thead><tbody>${trs}</tbody></table><div style="text-align: right; margin-top: 20px; font-size: 16px;"><strong>Valor Total deste Anexo: R$ ${parseFloat(recibo.valor).toFixed(2).replace('.', ',')}</strong></div></body></html>`;
        
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed'; iframe.style.right = '0'; iframe.style.bottom = '0'; iframe.style.width = '0px'; iframe.style.height = '0px'; iframe.style.border = 'none';
        document.body.appendChild(iframe);
        iframe.contentWindow.document.open(); iframe.contentWindow.document.write(html); iframe.contentWindow.document.close();
        setTimeout(() => { iframe.contentWindow.focus(); iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 1000); }, 500);
    };

    const recibosFiltrados = carteira.historico_pagamentos?.filter(p => aplicarFiltroData(p.data_pagamento || p.data_solicitacao, filtroDataRecibos, dtInicioRecibos, dtFimRecibos)) || [];
    const extratoFiltrado = carteira.transacoes?.filter(t => !t.foi_pago && aplicarFiltroData(t.data, filtroDataExtrato, dtInicioExtrato, dtFimExtrato)) || [];

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
    const pendenteInfo = carteira.pagamento_pendente || carteira.solicitacao_ativa;
    
    if (pendenteInfo) { 
        if (pendenteInfo.status === 'AGUARDANDO_RECIBO' || pendenteInfo.status === 'RECUSADO') activeStep = 1; 
        else if (pendenteInfo.status === 'EM_ANALISE') activeStep = 2; 
        else if (pendenteInfo.status === 'AGENDADO') activeStep = 3; 
    }

    return (
        <Container maxW="container.xl" py={8}>
            <Heading size="lg" color="teal.600" mb={6}>Minha Carteira</Heading>
            
            {pendenteInfo ? (
                <Card bg="white" shadow="md" borderRadius="xl" border="1px solid" borderColor="gray.200" mb={8} overflow="hidden">
                    <Box bg="gray.50" p={6} borderBottom="1px solid" borderColor="gray.200">
                        <Flex justify="space-between" align="center" mb={4}>
                            <Heading size="sm" color="gray.600">Status do Saque</Heading>
                            {pendenteInfo.status !== 'AGENDADO' && (
                                <Button size="xs" colorScheme="red" variant="ghost" onClick={cancelarSaque} leftIcon={<CloseIcon />}>Cancelar Saque</Button>
                            )}
                        </Flex>
                        <Stepper size="lg" colorScheme="teal" index={activeStep}>{steps.map((step, index) => (<Step key={index}><StepIndicator><StepStatus complete={<StepIcon />} incomplete={<StepNumber />} active={<StepNumber />} /></StepIndicator><Box flexShrink='0' display={{ base: 'none', md: 'block' }}><StepTitle>{step.title}</StepTitle><StepDescription>{step.description}</StepDescription></Box><StepSeparator /></Step>))}</Stepper>
                    </Box>
                    <CardBody p={8}>
                        {pendenteInfo.status === 'AGUARDANDO_RECIBO' && (
                            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} alignItems="center">
                                <Box><Heading size="md" color="teal.700" mb={3}>Estamos quase lá!</Heading><Text color="gray.600" mb={4} lineHeight="tall">Para liberar o seu pagamento de <strong>R$ {parseFloat(pendenteInfo.valor).toFixed(2).replace('.', ',')}</strong>, precisamos do seu <strong>Recibo (RPA)</strong> assinado.</Text><Button size="lg" colorScheme="teal" leftIcon={<DownloadIcon />} onClick={() => handlePrintRecibo(pendenteInfo)} shadow="md">1. Imprimir Recibo Oficial</Button></Box>
                                <Box w="full" h="200px" border="2px dashed" borderColor={arquivoInline ? "green.400" : "teal.300"} borderRadius="xl" display="flex" flexDirection="column" alignItems="center" justifyContent="center" bg={arquivoInline ? "green.50" : "teal.50"} cursor="pointer" onClick={() => fileInputInlineRef.current.click()} transition="all 0.2s" _hover={{ bg: arquivoInline ? 'green.100' : 'teal.100' }} p={4}><Icon as={arquivoInline ? CheckCircleIcon : AttachmentIcon} boxSize={10} color={arquivoInline ? "green.500" : "teal.500"} mb={3} /><Text fontSize="md" color={arquivoInline ? "green.800" : "teal.800"} fontWeight="bold" textAlign="center">{arquivoInline ? arquivoInline.name : "2. Anexe aqui o recibo assinado"}</Text>{!arquivoInline && <Text fontSize="sm" color="teal.600" mt={1}>Clique para selecionar (PDF ou Foto)</Text>}{arquivoInline && (<Button mt={4} size="sm" colorScheme="green" onClick={(e) => { e.stopPropagation(); enviarReciboInline(); }} isLoading={enviandoRecibo} shadow="md">Confirmar e Enviar</Button>)}</Box><Input type="file" display="none" ref={fileInputInlineRef} onChange={e => setArquivoInline(e.target.files[0])} accept="image/*,.pdf" />
                            </SimpleGrid>
                        )}
                        {pendenteInfo.status === 'RECUSADO' && (
                            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} alignItems="center">
                                <Box><Alert status="error" borderRadius="md" mb={4} flexDirection="column" alignItems="start" p={5}><HStack mb={2}><AlertIcon /><Heading size="sm">Ops! Problema no recibo.</Heading></HStack><Text fontSize="sm">A equipa financeira encontrou o seguinte problema:</Text><Text fontWeight="bold" mt={2} bg="white" p={3} borderRadius="md" w="full">"{pendenteInfo.motivo_recusa}"</Text></Alert><Button size="md" colorScheme="gray" leftIcon={<DownloadIcon />} onClick={() => handlePrintRecibo(pendenteInfo)}>Imprimir Novamente</Button></Box>
                                <Box w="full" h="200px" border="2px dashed" borderColor={arquivoInline ? "green.400" : "red.300"} borderRadius="xl" display="flex" flexDirection="column" alignItems="center" justifyContent="center" bg={arquivoInline ? "green.50" : "red.50"} cursor="pointer" onClick={() => fileInputInlineRef.current.click()} transition="all 0.2s" _hover={{ bg: arquivoInline ? 'green.100' : 'red.100' }} p={4}><Icon as={arquivoInline ? CheckCircleIcon : AttachmentIcon} boxSize={10} color={arquivoInline ? "green.500" : "red.500"} mb={3} /><Text fontSize="md" color={arquivoInline ? "green.800" : "red.800"} fontWeight="bold" textAlign="center">{arquivoInline ? arquivoInline.name : "Anexe o novo recibo corrigido"}</Text>{arquivoInline && (<Button mt={4} size="sm" colorScheme="green" onClick={(e) => { e.stopPropagation(); enviarReciboInline(); }} isLoading={enviandoRecibo} shadow="md">Confirmar e Reenviar</Button>)}</Box><Input type="file" display="none" ref={fileInputInlineRef} onChange={e => setArquivoInline(e.target.files[0])} accept="image/*,.pdf" />
                            </SimpleGrid>
                        )}
                        {pendenteInfo.status === 'EM_ANALISE' && (
                            <Flex direction="column" align="center" justify="center" py={4}><TimeIcon boxSize={12} color="blue.400" mb={4} animation="pulse 2s infinite" /><Heading size="md" color="blue.700" mb={2}>Documentação em Análise</Heading><Text color="gray.500" textAlign="center" maxW="lg">Recebemos o seu documento perfeitamente. A nossa equipa financeira está a validá-lo e o seu PIX/Transferência será processado em breve.</Text></Flex>
                        )}
                        {pendenteInfo.status === 'AGENDADO' && (
                            <Flex direction="column" align="center" justify="center" py={4} bg="green.50" borderRadius="xl" border="1px solid" borderColor="green.200">
                                <Icon as={CalendarIcon} boxSize={10} color="green.500" mb={3} />
                                <Heading size="md" color="green.700" mb={2}>Pagamento Agendado!</Heading>
                                <Text color="gray.600" textAlign="center" maxW="lg" mb={3}>
                                    O seu recibo foi validado pela nossa equipa financeira e o pagamento de <strong>R$ {parseFloat(pendenteInfo.valor).toFixed(2).replace('.', ',')}</strong> já foi agendado junto ao banco.
                                </Text>
                                <HStack bg="white" p={3} borderRadius="lg" border="1px solid" borderColor="green.300" shadow="sm">
                                    <Text fontWeight="bold" color="green.800">Previsão de Crédito na Conta:</Text>
                                    <Badge colorScheme="green" px={3} py={1} fontSize="md" borderRadius="md">
                                        {pendenteInfo.data_prevista_pagamento ? pendenteInfo.data_prevista_pagamento.split('-').reverse().join('/') : 'Processando...'}
                                    </Badge>
                                </HStack>
                            </Flex>
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
                                        {extratoPaginado.map(t => (
                                            <Tr key={t.id} _hover={{ bg: 'gray.50' }}>
                                                <Td fontSize="sm" color="gray.600">{new Date(t.data).toLocaleString('pt-BR')}</Td>
                                                <Td fontWeight="medium" color="gray.800">{t.descricao}</Td>
                                                <Td textAlign="center"><Badge colorScheme='yellow' variant='solid'>A RECEBER</Badge></Td>
                                                <Td textAlign="center"><Badge colorScheme={t.tipo === 'CREDITO' ? 'green' : 'red'} variant="outline" px={2} borderRadius="md">{t.tipo}</Badge></Td>
                                                <Td textAlign="right" fontWeight="bold" color={t.tipo === 'CREDITO' ? 'green.500' : 'red.500'}>{t.tipo === 'CREDITO' ? '+' : '-'} {parseFloat(t.valor).toFixed(2).replace('.', ',')}</Td>
                                            </Tr>
                                        ))}
                                        {extratoPaginado.length === 0 && (<Tr><Td colSpan={5} textAlign="center" py={10} color="gray.500">Nenhum lançamento pendente encontrado.</Td></Tr>)}
                                    </Tbody>
                                </Table>
                            </Box>
                            {extratoFiltrado.length > 0 && (
                                <Flex justify="space-between" align="center" p={4} bg="gray.50" borderTop="1px solid" borderColor="gray.200" wrap="wrap" gap={4}>
                                    <HStack><Text fontSize="sm" color="gray.600">Mostrar</Text><Select size="sm" w="80px" bg="white" value={itensPorPaginaExtrato} onChange={(e) => { setItensPorPaginaExtrato(Number(e.target.value)); setPaginaAtualExtrato(1); }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></Select></HStack>
                                    <Text fontSize="sm" color="gray.600" fontWeight="bold">Total de registros encontrados: {extratoFiltrado.length}</Text>
                                    <HStack><Button size="sm" onClick={() => setPaginaAtualExtrato(p => Math.max(1, p - 1))} isDisabled={paginaAtualExtrato === 1} bg="white">Anterior</Button><Button size="sm" onClick={() => setPaginaAtualExtrato(p => Math.min(totalPaginasE, p + 1))} isDisabled={paginaAtualExtrato === totalPaginasE} bg="white">Próxima</Button></HStack>
                                </Flex>
                            )}
                        </Box>
                    </TabPanel>
                    
                    <TabPanel p={0}>
                        {applyFiltroRow(filtroDataRecibos, setFiltroDataRecibos, dtInicioRecibos, setDtInicioRecibos, dtFimRecibos, setDtFimRecibos)}
                        <Box bg="white" shadow="sm" borderRadius="lg" overflow="hidden" border="1px solid" borderColor="gray.100" mb={8}>
                            <Box overflowX="auto">
                                <Table variant="simple">
                                    <Thead bg="gray.50"><Tr><Th w="20%">Data do Pagamento</Th><Th w="40%" textAlign="center">Redações Pagas</Th><Th w="20%" isNumeric>Valor Recebido</Th><Th w="20%" textAlign="center">Recibo Oficial</Th></Tr></Thead>
                                    <Tbody>
                                        {recibosPaginados.map(p => (
                                            <Tr key={p.id} _hover={{ bg: 'gray.50' }}>
                                                <Td>
                                                  <Text fontSize="sm" fontWeight="bold" color="gray.700">Solicitado: {p.data_solicitacao ? new Date(p.data_solicitacao).toLocaleDateString('pt-BR') : '--'}</Text>
                                                  <Text fontSize="xs" color={p.status === 'PAGO' ? "green.600" : "orange.500"} fontWeight="bold">{p.status === 'PAGO' ? 'Pago: ' : 'Previsão: '} {p.status === 'PAGO' && p.data_pagamento ? new Date(p.data_pagamento).toLocaleDateString('pt-BR') : 'Aguardando'}</Text>
                                                </Td>
                                                <Td textAlign="center">
                                                  <Badge colorScheme="blue" mr={1}>{p.qtd_normal} Normais</Badge>
                                                  <Badge colorScheme="purple">{p.qtd_vip} VIPs</Badge>
                                                </Td>
                                                <Td isNumeric fontWeight="bold" color="green.500">R$ {parseFloat(p.valor).toFixed(2).replace('.', ',')}</Td>
                                                <Td textAlign="center">
                                                  <HStack spacing={2} justify="center">
                                                    <Button size="sm" colorScheme="blue" variant="solid" leftIcon={<ViewIcon />} onClick={() => { setReciboVisualizar(p); setModalReciboOpen(true); }}>Ver Redações</Button>
                                                    <Button size="sm" colorScheme="teal" variant="outline" leftIcon={<DownloadIcon />} onClick={() => { if(p.arquivo_recibo_url) window.open(`http://127.0.0.1:8000${p.arquivo_recibo_url}`, '_blank'); else handlePrintRecibo(p); }}>Baixar</Button>
                                                  </HStack>
                                                </Td>
                                            </Tr>
                                        ))}
                                        {recibosPaginados.length === 0 && (<Tr><Td colSpan={4} textAlign="center" py={10} color="gray.500">Nenhum pagamento finalizado neste período.</Td></Tr>)}
                                    </Tbody>
                                </Table>
                            </Box>
                            {recibosSomentePagos.length > 0 && (
                                <Flex justify="space-between" align="center" p={4} bg="gray.50" borderTop="1px solid" borderColor="gray.200" wrap="wrap" gap={4}>
                                    <HStack><Text fontSize="sm" color="gray.600">Mostrar</Text><Select size="sm" w="80px" bg="white" value={itensPorPaginaRecibos} onChange={(e) => { setItensPorPaginaRecibos(Number(e.target.value)); setPaginaAtualRecibos(1); }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></Select></HStack>
                                    <Text fontSize="sm" color="gray.600" fontWeight="bold">Total de registros: {recibosSomentePagos.length}</Text>
                                    <HStack><Button size="sm" onClick={() => setPaginaAtualRecibos(p => Math.max(1, p - 1))} isDisabled={paginaAtualRecibos === 1} bg="white">Anterior</Button><Button size="sm" onClick={() => setPaginaAtualRecibos(p => Math.min(totalPaginasR, p + 1))} isDisabled={paginaAtualRecibos === totalPaginasR} bg="white">Próxima</Button></HStack>
                                </Flex>
                            )}
                        </Box>
                    </TabPanel>
                </TabPanels>
            </Tabs>

            <Modal isOpen={modalReciboOpen} onClose={() => setModalReciboOpen(false)} isCentered size="2xl" scrollBehavior="inside">
                <ModalOverlay backdropFilter="blur(3px)" />
                <ModalContent borderRadius="xl">
                    <ModalHeader bg="teal.600" color="white" borderTopRadius="xl">Redações Pagas neste Recibo</ModalHeader>
                    <ModalCloseButton color="white" mt={1} />
                    <ModalBody py={6}>
                        {reciboVisualizar && (
                            <>
                                <Flex justify="space-between" mb={4} p={3} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200" wrap="wrap" gap={3}>
                                    <Text fontWeight="bold" color="gray.600">Data do Pagamento: {new Date(reciboVisualizar.data_pagamento || reciboVisualizar.data_solicitacao).toLocaleDateString('pt-BR')}</Text>
                                    <Text fontWeight="bold" color="green.600">Valor Total: R$ {parseFloat(reciboVisualizar.valor).toFixed(2).replace('.', ',')}</Text>
                                </Flex>
                                <Table variant="simple" size="sm" mb={4}>
                                    <Thead bg="gray.100"><Tr><Th>Data da Correção</Th><Th>Descrição</Th><Th isNumeric>Valor</Th></Tr></Thead>
                                    <Tbody>
                                        {carteira.transacoes?.filter(t => t.pagamento_id === reciboVisualizar.id).map(t => (
                                            <Tr key={t.id}><Td>{new Date(t.data).toLocaleString('pt-BR')}</Td><Td fontWeight="medium">{t.descricao}</Td><Td isNumeric fontWeight="bold" color="green.500">R$ {parseFloat(t.valor).toFixed(2).replace('.', ',')}</Td></Tr>
                                        ))}
                                        {carteira.transacoes?.filter(t => t.pagamento_id === reciboVisualizar.id).length === 0 && (<Tr><Td colSpan={3} textAlign="center" py={6} color="gray.500">As redações deste recibo são antigas e foram arquivadas.</Td></Tr>)}
                                    </Tbody>
                                </Table>
                                <Button w="full" colorScheme="blue" leftIcon={<DownloadIcon />} onClick={() => imprimirAnexoRedacoes(reciboVisualizar)}>Imprimir Anexo Detalhado</Button>
                            </>
                        )}
                    </ModalBody>
                    <ModalFooter bg="gray.50" borderBottomRadius="xl"><Button colorScheme="gray" onClick={() => setModalReciboOpen(false)}>Fechar</Button></ModalFooter>
                </ModalContent>
            </Modal>
        </Container>
    );
};

function applyFiltroRow(filtro, setFiltro, dtInicio, setDtInicio, dtFim, setDtFim) {
    return (
        <Flex gap={3} wrap="wrap" mb={4} p={4} bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" align="center" shadow="sm">
            <Icon as={TimeIcon} color="gray.500" />
            <Select w="200px" size="sm" bg="gray.50" value={filtro} onChange={e => setFiltro(e.target.value)}>
                <option value="TUDO">Todo o Histórico</option><option value="MES_ATUAL">Mês Atual</option><option value="MES_ANTERIOR">Mês Anterior</option><option value="PERIODO">Período Específico</option>
            </Select>
            {filtro === 'PERIODO' && (<HStack><Input type="date" bg="gray.50" size="sm" value={dtInicio} onChange={e => setDtInicio(e.target.value)} /><Text fontSize="sm" color="gray.500">até</Text><Input type="date" bg="gray.50" size="sm" value={dtFim} onChange={e => setDtFim(e.target.value)} /></HStack>)}
        </Flex>
    );
}

export default AbaCorretorCarteira;