import React, { useState, useEffect } from 'react';
import { Flex, InputGroup, InputLeftElement, Input, Select, Divider, HStack, Text, Button, Card, Box, Table, Thead, Tbody, Tr, Th, Td, Badge, IconButton, Tooltip, Icon, VStack } from '@chakra-ui/react';
import { SearchIcon, ViewIcon, WarningTwoIcon, StarIcon } from '@chakra-ui/icons';
import { MdCleaningServices, MdPrint } from 'react-icons/md';

const AbaHistorico = ({ redacoes, usuario, abrirFeedback, abrirMotivo }) => {
    const [buscaHistorico, setBuscaHistorico] = useState(() => sessionStorage.getItem('filtroBuscaHist') || '');
    const [statusFiltro, setStatusFiltro] = useState(() => sessionStorage.getItem('filtroStatusHist') || 'TODOS');
    const [tipoFiltro, setTipoFiltro] = useState(() => sessionStorage.getItem('filtroTipoHist') || 'TODOS');
    const [dataInicioFiltro, setDataInicioFiltro] = useState(() => sessionStorage.getItem('filtroDataIniHist') || '');
    const [dataFimFiltro, setDataFimFiltro] = useState(() => sessionStorage.getItem('filtroDataFimHist') || '');
    const [paginaAtualHist, setPaginaAtualHist] = useState(() => Number(sessionStorage.getItem('filtroPaginaHist')) || 1);
    const [itensPorPaginaHist, setItensPorPaginaHist] = useState(10);

    useEffect(() => {
        sessionStorage.setItem('filtroBuscaHist', buscaHistorico);
        sessionStorage.setItem('filtroStatusHist', statusFiltro);
        sessionStorage.setItem('filtroTipoHist', tipoFiltro);
        sessionStorage.setItem('filtroDataIniHist', dataInicioFiltro);
        sessionStorage.setItem('filtroDataFimHist', dataFimFiltro);
        sessionStorage.setItem('filtroPaginaHist', paginaAtualHist);
    }, [buscaHistorico, statusFiltro, tipoFiltro, dataInicioFiltro, dataFimFiltro, paginaAtualHist]);

    const limparFiltros = () => {
        setBuscaHistorico(''); setStatusFiltro('TODOS'); setTipoFiltro('TODOS');
        setDataInicioFiltro(''); setDataFimFiltro(''); setPaginaAtualHist(1);
    };

    const historicoFiltrado = redacoes.filter(r => {
        const termoBusca = buscaHistorico.toLowerCase();
        const matchBusca = (r.tema_titulo || '').toLowerCase().includes(termoBusca) || String(r.id).includes(termoBusca);
        
        // CORREÇÃO: Filtra CORRIGIDA junto de FINALIZADA e EM_QA para garantir que a tabela do aluno está sintonizada.
        const matchStatus = statusFiltro === 'TODOS' ? true : (statusFiltro === 'CORRIGIDA' ? ['CORRIGIDA', 'EM_QA', 'FINALIZADA'].includes(r.status) : r.status === statusFiltro);
        
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

    const idxUltimoHist = paginaAtualHist * itensPorPaginaHist;
    const idxPrimeiroHist = idxUltimoHist - itensPorPaginaHist;
    const historicoPaginado = historicoFiltrado.slice(idxPrimeiroHist, idxUltimoHist);
    const totalPaginasHist = Math.ceil(historicoFiltrado.length / itensPorPaginaHist);

    const formatarStatusImpressao = (status) => {
        if (status === 'AUDITORIA' || status === 'EM_AUDITORIA') return 'EM ANÁLISE';
        if (status === 'EM_RECURSO') return 'EM REVISÃO';
        if (status === 'TRIAGEM') return 'TRIAGEM TÉCNICA';
        if (status === 'EM_QA' || status === 'FINALIZADA') return 'CORRIGIDA';
        return status ? status.replace('_', ' ') : '';
    };

    const handlePrintLista = () => {
        const baseUrl = window.location.origin;
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        const trs = historicoFiltrado.map(red => `<tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #555; font-weight: bold;">#${red.id}</td><td style="padding: 10px; border-bottom: 1px solid #eee; color: #333; font-weight: bold;">${red.tema_titulo}</td><td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">${red.tema_tipo || red.tipo || 'ENEM'}</td><td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">${new Date(red.data_envio).toLocaleDateString()}</td><td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">${formatarStatusImpressao(red.status)}</td><td style="padding: 10px; border-bottom: 1px solid #eee; color: ${red.nota_final !== null && red.nota_final !== undefined ? '#2F855A' : '#999'}; font-weight: 900;">${red.nota_final !== null && red.nota_final !== undefined ? red.nota_final : '-'}</td></tr>`).join('');
        const html = `<!DOCTYPE html><html><head><title>Relatório de Redações</title><style>@page { size: A4 portrait; margin: 15mm; } body { margin: 0; padding: 0; font-family: Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; color: black; } * { box-sizing: border-box; } .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; letter-spacing: 5px; font-weight: 900; color: rgba(0,0,0,0.04); z-index: -1; pointer-events: none; white-space: nowrap; } .footer { position: fixed; bottom: 0; left: 0; right: 0; display: flex; justify-content: space-between; font-size: 10px; color: #666; font-weight: bold; padding-top: 10px; border-top: 1px solid #eee; background-color: white; z-index: 100; } .content { padding-bottom: 40px; }</style></head><body><div class="watermark">GUIA DO TEXTO</div><div class="footer"><div>Documento Oficial de Acompanhamento</div><div>Impresso em: ${dataAtual}</div></div><div class="content"><div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid black; padding-bottom: 15px;"><div><img src="${baseUrl}/logo-print.png" style="max-height: 30px; object-fit: contain;" alt="Logo" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" /><div style="display: none; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; margin: 0; line-height: 1;"><span style="color: #319795;">Guia do</span> <span style="color: #D69E2E;">Texto</span></div></div><div style="font-weight: 900; font-size: 16px; color: #333; text-transform: uppercase; letter-spacing: 1px;">Relatório de Redações</div></div><div style="margin-bottom: 20px;"><div style="font-size: 14px; color: #555;">Aluno: <strong>${usuario?.first_name || usuario?.username || 'Aluno'}</strong></div></div><table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;"><thead><tr style="background-color: #f7fafc;"><th style="padding: 12px 10px; border-bottom: 2px solid #cbd5e0; color: #4a5568;">Cód.</th><th style="padding: 12px 10px; border-bottom: 2px solid #cbd5e0; color: #4a5568;">Tema da Redação</th><th style="padding: 12px 10px; border-bottom: 2px solid #cbd5e0; color: #4a5568;">Tipo</th><th style="padding: 12px 10px; border-bottom: 2px solid #cbd5e0; color: #4a5568;">Data</th><th style="padding: 12px 10px; border-bottom: 2px solid #cbd5e0; color: #4a5568;">Status</th><th style="padding: 12px 10px; border-bottom: 2px solid #cbd5e0; color: #4a5568;">Nota</th></tr></thead><tbody>${trs}</tbody></table></div></body></html>`;
        
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed'; iframe.style.right = '0'; iframe.style.bottom = '0'; iframe.style.width = '0px'; iframe.style.height = '0px'; iframe.style.border = 'none';
        document.body.appendChild(iframe);
        iframe.contentWindow.document.open(); iframe.contentWindow.document.write(html); iframe.contentWindow.document.close();
        setTimeout(() => { iframe.contentWindow.focus(); iframe.contentWindow.print(); setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 1000); }, 1000);
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'CORRIGIDA': 
            case 'FINALIZADA':
            case 'EM_QA': return <Badge colorScheme="green" borderRadius="md" px={2}>CORRIGIDA</Badge>;
            case 'DEVOLVIDA': return <Badge colorScheme="red" borderRadius="md" px={2}>DEVOLVIDA</Badge>;
            case 'ANULADA': return <Badge colorScheme="red" borderRadius="md" px={2}>ANULADA</Badge>;
            case 'REFAZER': return <Badge colorScheme="orange" borderRadius="md" px={2}>REFAZER</Badge>;
            case 'EM_CORRECAO': return <Badge colorScheme="blue" borderRadius="md" px={2}>EM CORREÇÃO</Badge>;
            case 'EM_RECURSO': return <Badge colorScheme="purple" borderRadius="md" px={2}>EM REVISÃO</Badge>;
            case 'TRIAGEM': return <Badge colorScheme="pink" borderRadius="md" px={2}>TRIAGEM</Badge>;
            case 'AUDITORIA': 
            case 'EM_AUDITORIA': return <Badge colorScheme="purple" borderRadius="md" px={2}>EM ANÁLISE</Badge>;
            default: return <Badge colorScheme="yellow" borderRadius="md" px={2}>{status ? status.replace('_', ' ') : 'AGUARDANDO'}</Badge>;
        }
    };

    return (
        <Box>
            <Flex gap={4} bg="white" p={5} borderRadius="xl" boxShadow="sm" align="center" border="1px solid" borderColor="gray.100" mb={6} wrap="wrap">
                <InputGroup flex={1} minW="250px">
                    <InputLeftElement pointerEvents='none'><SearchIcon color='gray.400'/></InputLeftElement>
                    <Input placeholder="Buscar Tema ou Cód..." value={buscaHistorico} onChange={e => {setBuscaHistorico(e.target.value); setPaginaAtualHist(1);}} />
                </InputGroup>
                
                <Select w="180px" value={tipoFiltro} onChange={e => {setTipoFiltro(e.target.value); setPaginaAtualHist(1);}}>
                    <option value="TODOS">Tipo: Todos</option>
                    <option value="ENEM">ENEM</option>
                    <option value="PADRAO_100">Padrão 100</option>
                    <option value="PADRAO_10">Padrão 10</option>
                </Select>
                
                <Select w="150px" value={statusFiltro} onChange={e => {setStatusFiltro(e.target.value); setPaginaAtualHist(1);}}>
                    <option value="TODOS">Status: Todos</option>
                    <option value="AGUARDANDO">Aguardando</option>
                    <option value="EM_CORRECAO">Em Correção</option>
                    <option value="CORRIGIDA">Corrigidas</option>
                    <option value="DEVOLVIDA">Devolvidas</option>
                    <option value="EM_RECURSO">Em Revisão</option>
                </Select>
                
                <Divider orientation="vertical" h="30px" display={{base: 'none', lg: 'block'}} />
                
                <HStack spacing={2}>
                    <Text fontSize="sm" color="gray.500" fontWeight="medium">De:</Text>
                    <Input type="date" size="md" value={dataInicioFiltro} onChange={e => {setDataInicioFiltro(e.target.value); setPaginaAtualHist(1);}} w="140px" />
                    <Text fontSize="sm" color="gray.500" fontWeight="medium">Até:</Text>
                    <Input type="date" size="md" value={dataFimFiltro} onChange={e => {setDataFimFiltro(e.target.value); setPaginaAtualHist(1);}} w="140px" />
                </HStack>

                <Divider orientation="vertical" h="30px" display={{base: 'none', lg: 'block'}} />

                <HStack spacing={3}>
                    <Tooltip label="Limpar Filtros" hasArrow>
                        <IconButton aria-label="Limpar Filtros" icon={<Icon as={MdCleaningServices} boxSize={5} />} bg="teal.50" border="1px solid" borderColor="teal.200" color="teal.600" _hover={{ bg: "teal.100" }} onClick={limparFiltros} />
                    </Tooltip>
                    <Tooltip label="Imprimir Relatório" hasArrow>
                        <IconButton aria-label="Imprimir" icon={<Icon as={MdPrint} boxSize={5} />} variant="solid" colorScheme="teal" onClick={handlePrintLista} />
                    </Tooltip>
                </HStack>
            </Flex>

            <Card bg="white" shadow="sm" borderRadius="lg" overflow="hidden">
                <Box overflowX="auto">
                    <Table variant="simple" style={{ tableLayout: 'fixed', width: '100%' }}>
                        <Thead bg="gray.50"><Tr><Th w="6%" px={4}>Cód.</Th><Th w="42%" px={4}>Tema da Redação</Th><Th w="10%" px={3} textAlign="center">Tipo</Th><Th w="12%" px={3} textAlign="center">Data Envio</Th><Th w="15%" px={3} textAlign="center">Status</Th><Th w="6%" px={3} textAlign="center">Nota</Th><Th w="9%" px={4} textAlign="center">Ação</Th></Tr></Thead>
                        <Tbody>
                            {historicoPaginado.map(red => {
                                const tipoRedacao = red.tema_tipo || red.tipo || 'ENEM';
                                const foiAvaliada = red.correcao?.avaliacao_aluno > 0 || red.status === 'EM_QA';

                                return (
                                    <Tr key={red.id} _hover={{ bg: 'gray.50' }}>
                                        <Td fontWeight="bold" color="gray.500" px={4}>#{red.id}</Td>
                                        <Td fontWeight="medium" isTruncated px={4} title={red.tema_titulo}>{red.tema_titulo} {red.vip_pago && <Badge ml={2} colorScheme="purple" fontSize="2xs"><StarIcon mr={1}/>VIP</Badge>}</Td>
                                        <Td px={3} textAlign="center">
                                            <Badge bg={tipoRedacao === 'ENEM' ? 'green.50' : (tipoRedacao === 'PADRAO_10' ? 'purple.50' : 'blue.50')} color={tipoRedacao === 'ENEM' ? 'green.700' : (tipoRedacao === 'PADRAO_10' ? 'purple.700' : 'blue.700')} px={2} py={1} borderRadius="md" fontWeight="bold" letterSpacing="wide" fontSize="xs">
                                                {tipoRedacao.replace('_', ' ')}
                                            </Badge>
                                        </Td>
                                        <Td fontSize="sm" px={3} color="gray.600" textAlign="center">{new Date(red.data_envio).toLocaleDateString()}</Td>
                                        <Td px={3} textAlign="center">
                                            <VStack spacing={1}>
                                                {getStatusBadge(red.status)}
                                                {foiAvaliada && <Text fontSize="2xs" color="gray.500" fontWeight="bold"><StarIcon color="yellow.400" mr={1} mb={0.5}/>Avaliado</Text>}
                                            </VStack>
                                        </Td>
                                        <Td fontWeight="bold" px={3} textAlign="center" color={red.nota_final !== null && red.nota_final !== undefined ? 'green.500' : 'gray.700'}>
                                            {red.nota_final !== null && red.nota_final !== undefined ? red.nota_final : '-'}
                                        </Td>
                                        <Td px={4} textAlign="center">
                                            {/* CORREÇÃO: Garante que o botão VER funciona também com FINALIZADA */}
                                            {['CORRIGIDA', 'EM_QA', 'FINALIZADA'].includes(red.status) && (<Button size="sm" colorScheme="teal" variant="ghost" onClick={() => abrirFeedback(red.id)} leftIcon={<ViewIcon />}>Ver</Button>)}
                                            {(red.status === 'DEVOLVIDA' || red.status === 'ANULADA') && (<Button size="sm" colorScheme="red" variant="outline" onClick={() => abrirMotivo(red.id)} leftIcon={<WarningTwoIcon />}>Motivo</Button>)}
                                            {['AGUARDANDO', 'EM_CORRECAO', 'AUDITORIA', 'EM_AUDITORIA', 'REFAZER', 'EM_RECURSO', 'TRIAGEM'].includes(red.status) && (<Text fontSize="xs" color="gray.400">Em Análise</Text>)}
                                        </Td>
                                    </Tr>
                                );
                            })}
                            {historicoPaginado.length === 0 && <Tr><Td colSpan={7} textAlign="center" py={6} color="gray.500">Nenhuma redação encontrada.</Td></Tr>}
                        </Tbody>
                    </Table>
                </Box>
                {historicoFiltrado.length > 0 && (
                    <Flex justify="space-between" align="center" p={4} bg="gray.50" borderTop="1px solid" borderColor="gray.200" wrap="wrap" gap={4}>
                        <HStack><Text fontSize="sm" color="gray.600">Mostrar</Text><Select size="sm" w="80px" bg="white" value={itensPorPaginaHist} onChange={(e) => { setItensPorPaginaHist(Number(e.target.value)); setPaginaAtualHist(1); }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option></Select><Text fontSize="sm" color="gray.600">por página</Text></HStack>
                        <Text fontSize="sm" color="gray.600" fontWeight="bold">Total de envios: {historicoFiltrado.length}</Text>
                        <HStack><Button size="sm" onClick={() => setPaginaAtualHist(p => Math.max(1, p - 1))} isDisabled={paginaAtualHist === 1} bg="white" shadow="sm">Anterior</Button><Text fontSize="sm" fontWeight="bold" px={2}>{paginaAtualHist} / {totalPaginasHist}</Text><Button size="sm" onClick={() => setPaginaAtualHist(p => Math.min(totalPaginasHist, p + 1))} isDisabled={paginaAtualHist === totalPaginasHist} bg="white" shadow="sm">Próxima</Button></HStack>
                    </Flex>
                )}
            </Card>
        </Box>
    );
};

export default AbaHistorico;