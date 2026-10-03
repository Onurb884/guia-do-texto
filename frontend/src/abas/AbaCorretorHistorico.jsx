import React, { useState } from 'react';
import { Container, Flex, InputGroup, InputLeftElement, Input, Select, Divider, HStack, Text, Button, Box, Table, Thead, Tbody, Tr, Th, Td, Badge, Tooltip, IconButton, Heading } from '@chakra-ui/react';
import { SearchIcon, ViewIcon } from '@chakra-ui/icons';

const AbaCorretorHistorico = ({ historico, abrirFeedbackHistorico }) => {
    const [filtroHistTexto, setFiltroHistTexto] = useState("");
    const [filtroHistData, setFiltroHistData] = useState(""); 
    const [filtroHistTipo, setFiltroHistTipo] = useState("TODOS");
    const [paginaAtualHist, setPaginaAtualHist] = useState(1);
    const [itensPorPaginaHist, setItensPorPaginaHist] = useState(10);

    let historicoFiltrado = historico.filter(h => {
        const match = h.tema_titulo.toLowerCase().includes(filtroHistTexto.toLowerCase()) || (h.id && h.id.toString().includes(filtroHistTexto.toLowerCase()));
        const matchTipo = filtroHistTipo === 'TODOS' ? true : (h.tema_tipo || h.tipo || 'ENEM').toUpperCase() === filtroHistTipo;
        let matchData = true;
        if (filtroHistData) { 
            const d = new Date(h.data_correcao || h.data_envio);
            const dataLocalFormatada = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            matchData = dataLocalFormatada === filtroHistData; 
        }
        return match && matchData && matchTipo;
    });

    const idxUltimo = paginaAtualHist * itensPorPaginaHist;
    const idxPrimeiro = idxUltimo - itensPorPaginaHist;
    const histPaginado = historicoFiltrado.slice(idxPrimeiro, idxUltimo);
    const totalPaginas = Math.ceil(historicoFiltrado.length / itensPorPaginaHist);

    return (
        <Container maxW="container.xl" py={8}>
            <Heading size="lg" color="teal.600" mb={6}>Meu Histórico</Heading>
            <Flex gap={4} bg="white" p={5} borderRadius="xl" boxShadow="sm" align="center" border="1px solid" borderColor="gray.100" mb={6} wrap="wrap">
                <InputGroup flex={1} minW="250px"><InputLeftElement pointerEvents='none'><SearchIcon color='gray.400'/></InputLeftElement><Input placeholder="Buscar Tema ou Cód..." value={filtroHistTexto} onChange={e => setFiltroHistTexto(e.target.value)} /></InputGroup>
                <Select w="180px" value={filtroHistTipo} onChange={e => setFiltroHistTipo(e.target.value)}>
                    <option value="TODOS">Tipo: Todos</option>
                    <option value="ENEM">ENEM</option>
                    <option value="PADRAO_100">PADRÃO 100</option>
                    <option value="PADRAO_10">PADRÃO 10</option>
                </Select>
                <Divider orientation="vertical" h="30px" display={{base: 'none', md: 'block'}} />
                <HStack spacing={2}><Text fontSize="sm" color="gray.500" fontWeight="medium">Data:</Text><Input type="date" size="md" value={filtroHistData} onChange={e => setFiltroHistData(e.target.value)} w="170px" /></HStack>
            </Flex>

            <Box bg="white" shadow="sm" borderRadius="lg" overflow="hidden" border="1px solid" borderColor="gray.200">
                <Box overflowX="auto">
                    <Table variant="simple" style={{ tableLayout: 'fixed', width: '100%' }}>
                        <Thead bg="gray.50"><Tr><Th w="8%" px={4}>Cód.</Th><Th w="45%" px={4}>Tema da Redação</Th><Th w="12%" px={3} textAlign="center">Tipo</Th><Th w="15%" px={3} textAlign="center">Data Correção</Th><Th w="10%" px={3} textAlign="center">Avaliação</Th><Th w="10%" px={3} textAlign="center">Nota</Th><Th w="10%" px={4} textAlign="center">Ação</Th></Tr></Thead>
                        <Tbody>
                            {histPaginado.map(h => {
                                const tipoRedacao = h.tema_tipo || h.tipo || 'ENEM';
                                const estrelas = h.avaliacao_aluno || 0;
                                const isPadrao10 = tipoRedacao === 'PADRAO_10';
                                const isPadrao = tipoRedacao.includes('PADRAO') || tipoRedacao === 'SIMPLES';
                                const meta = isPadrao10 ? 9 : (isPadrao ? 90 : 900);
                                return (
                                    <Tr key={h.id} _hover={{ bg: 'gray.50' }}>
                                        <Td fontWeight="bold" color="gray.500" px={4}>#{h.id}</Td>
                                        <Td fontWeight="medium" isTruncated px={4} title={h.tema_titulo}>{h.tema_titulo}</Td>
                                        <Td px={3} textAlign="center">
                                            <Badge bg={tipoRedacao === 'ENEM' ? 'green.50' : (isPadrao10 ? 'purple.50' : 'blue.50')} color={tipoRedacao === 'ENEM' ? 'green.700' : (isPadrao10 ? 'purple.700' : 'blue.700')} px={2} py={1} borderRadius="md" fontWeight="bold">
                                                {tipoRedacao.replace('_', ' ')}
                                            </Badge>
                                        </Td>
                                        <Td fontSize="sm" px={3} color="gray.600" textAlign="center">{new Date(h.data_correcao || h.data_envio).toLocaleDateString()}</Td>
                                        <Td px={3} textAlign="center">
                                            {estrelas > 0 ? (
                                                <Badge colorScheme={estrelas >= 4 ? "green" : estrelas === 3 ? "yellow" : "red"} px={2} py={0.5} borderRadius="md">
                                                    {estrelas} ★
                                                </Badge>
                                            ) : ( <Text fontSize="xs" color="gray.400">-</Text> )}
                                        </Td>
                                        <Td fontWeight="bold" px={3} textAlign="center" color={parseFloat(h.nota_final) >= meta ? 'green.500' : 'gray.700'}>{h.nota_final}</Td>
                                        <Td px={4} textAlign="center"><Tooltip label="Ver Feedback"><IconButton size="sm" colorScheme="blue" variant="ghost" onClick={() => abrirFeedbackHistorico(h.id)} icon={<ViewIcon />} /></Tooltip></Td>
                                    </Tr>
                                );
                            })}
                            {histPaginado.length === 0 && <Tr><Td colSpan={7} textAlign="center" py={10} color="gray.500">Nenhuma redação encontrada.</Td></Tr>}
                        </Tbody>
                    </Table>
                </Box>
                {historicoFiltrado.length > 0 && (
                    <Flex justify="space-between" align="center" p={4} bg="gray.50" borderTop="1px solid" borderColor="gray.200" wrap="wrap" gap={4}>
                        <HStack><Text fontSize="sm" color="gray.600">Mostrar</Text><Select size="sm" w="80px" bg="white" value={itensPorPaginaHist} onChange={(e) => { setItensPorPaginaHist(Number(e.target.value)); setPaginaAtualHist(1); }}><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></Select></HStack>
                        <Text fontSize="sm" color="gray.600" fontWeight="bold">Total de registros: {historicoFiltrado.length}</Text>
                        <HStack><Button size="sm" onClick={() => setPaginaAtualHist(p => Math.max(1, p - 1))} isDisabled={paginaAtualHist === 1} bg="white" shadow="sm">Anterior</Button><Button size="sm" onClick={() => setPaginaAtualHist(p => Math.min(totalPaginas, p + 1))} isDisabled={paginaAtualHist === totalPaginas} bg="white" shadow="sm">Próxima</Button></HStack>
                    </Flex>
                )}
            </Box>
        </Container>
    );
};

export default AbaCorretorHistorico;