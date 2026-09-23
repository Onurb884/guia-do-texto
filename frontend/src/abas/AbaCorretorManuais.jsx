import React, { useState } from 'react';
import { Container, Heading, Text, Box, Flex, VStack, Alert, HStack, Badge, Button, InputGroup, InputLeftElement, Input, Divider, Select, SimpleGrid, Card, CardBody, Icon, GridItem, useToast } from '@chakra-ui/react';
import { ChatIcon, ViewIcon, DownloadIcon, SearchIcon, InfoIcon, WarningTwoIcon, EditIcon, CheckCircleIcon, AttachmentIcon } from '@chakra-ui/icons';

const INFOS_MANUAL = { 'CORRETOR_CARTILHA': { nome: 'Cartilha Oficial', cor: 'blue', icone: InfoIcon }, 'CORRETOR_REGUA': { nome: 'Régua de Penalizações', cor: 'red', icone: WarningTwoIcon }, 'CORRETOR_DESVIOS': { nome: 'Guia de Desvios', cor: 'orange', icone: EditIcon }, 'CORRETOR_REPERTORIO': { nome: 'Repertórios Aceitos', cor: 'green', icone: CheckCircleIcon }, 'CORRETOR_COMUNICADO': { nome: 'Comunicado', cor: 'purple', icone: ChatIcon }, 'OUTROS': { nome: 'Geral', cor: 'gray', icone: AttachmentIcon } };

const AbaCorretorManuais = ({ materiais, abrirMaterialVisualizador }) => {
    const [buscaManual, setBuscaManual] = useState("");
    const [filtroManualCat, setFiltroManualCat] = useState("TODOS"); 
    const toast = useToast();

    const comunicados = materiais.filter(m => m.categoria === 'CORRETOR_COMUNICADO'); 
    const documentacao = materiais.filter(m => m.categoria !== 'CORRETOR_COMUNICADO'); 
    const manuaisFiltrados = documentacao.filter(m => { 
        const matchBusca = m.titulo.toLowerCase().includes(buscaManual.toLowerCase()); 
        const matchCat = filtroManualCat === 'TODOS' ? true : m.categoria === filtroManualCat; 
        return matchBusca && matchCat; 
    });

    const abrirMaterial = (m) => { 
        const temConteudo = (m.conteudo && m.conteudo.length > 5) || (m.dados_extras && Object.keys(m.dados_extras).length > 0); 
        if (temConteudo) { abrirMaterialVisualizador(m); } 
        else if (m.arquivo) { window.open(m.arquivo, '_blank'); } 
        else { toast({ title: "Este material não possui conteúdo legível.", status: "info" }); } 
    };

    return (
        <Container maxW="container.xl" py={8}>
            <Heading mb={2} color="teal.700">Manual do Corretor</Heading>
            <Text mb={8} color="gray.500">Acesse cartilhas, regras e comunicados de alinhamento fornecidos pela coordenação.</Text>
            
            {comunicados.length > 0 && (
                <Box mb={10}>
                    <Flex align="center" gap={2} mb={4}><Icon as={ChatIcon} color="purple.500" boxSize={5} /><Heading size="md" color="purple.700">Quadro de Avisos</Heading></Flex>
                    <VStack align="stretch" spacing={3}>
                        {comunicados.map(c => { 
                            const temConteudo = (c.conteudo && c.conteudo.length > 5) || (c.dados_extras && Object.keys(c.dados_extras).length > 0); 
                            return (
                                <Alert key={c.id} status="info" variant="left-accent" bg="purple.50" borderLeftColor="purple.500" borderRadius="md" py={4} display="flex" justifyContent="space-between" alignItems="center" shadow="sm">
                                    <Box flex="1">
                                        <HStack mb={1}><Badge colorScheme="purple">COMUNICADO RÁPIDO</Badge><Text fontSize="xs" color="purple.600" fontWeight="bold">{new Date(c.criado_em).toLocaleDateString('pt-BR')}</Text></HStack>
                                        <Text fontWeight="bold" color="purple.900" fontSize="md">{c.titulo}</Text>
                                        {c.descricao && <Text fontSize="sm" color="purple.800" mt={1}>{c.descricao}</Text>}
                                    </Box>
                                    {temConteudo ? (
                                        <Button size="sm" colorScheme="purple" leftIcon={<ViewIcon />} flexShrink={0} ml={4} onClick={() => abrirMaterial(c)}>Ler</Button>
                                    ) : c.arquivo ? (
                                        <Button as="a" href={c.arquivo} target="_blank" size="sm" colorScheme="purple" leftIcon={<DownloadIcon />} flexShrink={0} ml={4}>Anexo</Button>
                                    ) : null}
                                </Alert>
                            ); 
                        })}
                    </VStack>
                </Box>
            )}
            
            <Heading size="md" color="gray.700" mb={4}>Biblioteca Técnica</Heading>
            <Flex mb={6} gap={4} bg="white" p={5} borderRadius="xl" boxShadow="sm" align="center" border="1px solid" borderColor="gray.100" wrap="wrap">
                <InputGroup size="md" flex={1} minW="250px"><InputLeftElement pointerEvents='none'><SearchIcon color='gray.400' /></InputLeftElement><Input placeholder="Buscar por título do documento..." value={buscaManual} onChange={(e) => setBuscaManual(e.target.value)} /></InputGroup>
                <Divider orientation="vertical" h="30px" display={{ base: 'none', md: 'block' }} />
                <Select w={{ base: "full", md: "250px" }} value={filtroManualCat} onChange={(e) => setFiltroManualCat(e.target.value)}>
                    <option value="TODOS">Todas as Categorias</option>
                    {Object.entries(INFOS_MANUAL).filter(([k]) => k !== 'OUTROS').map(([k, v]) => (<option key={k} value={k}>{v.nome}</option>))}
                </Select>
            </Flex>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
                {manuaisFiltrados.map(m => { 
                    const config = INFOS_MANUAL[m.categoria] || INFOS_MANUAL['OUTROS']; 
                    const temConteudo = (m.conteudo && m.conteudo.length > 5) || (m.dados_extras && Object.keys(m.dados_extras).length > 0); 
                    return (
                        <Card key={m.id} bg="white" shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.200" display="flex" flexDirection="column" _hover={{ transform: 'translateY(-4px)', shadow: 'md', borderColor: `${config.cor}.300` }} transition="all 0.2s">
                            <Box h="4px" w="full" bg={`${config.cor}.400`} borderTopRadius="xl" />
                            <CardBody p={5} display="flex" flexDirection="column" flex="1">
                                <Flex justify="space-between" align="start" mb={4}><Badge colorScheme={config.cor} borderRadius="md" px={2} py={0.5} fontSize="2xs" fontWeight="bold">{config.nome}</Badge><Icon as={config.icone} color={`${config.cor}.400`} boxSize={5} /></Flex>
                                <Heading size="sm" color="gray.800" mb={2} lineHeight="short">{m.titulo}</Heading>
                                <Text fontSize="xs" color="gray.500" mb={4} noOfLines={3} flex="1">{m.descricao || "Documentação técnica oficial."}</Text>
                                <Button w="full" size="sm" colorScheme={config.cor} variant="outline" leftIcon={temConteudo ? <ViewIcon /> : <DownloadIcon />} mt="auto" _hover={{ bg: `${config.cor}.50` }} onClick={(e) => { e.preventDefault(); abrirMaterial(m); }}>
                                    {temConteudo ? 'Ler Documento' : 'Baixar PDF'}
                                </Button>
                            </CardBody>
                        </Card>
                    ) 
                })}
                {manuaisFiltrados.length === 0 && (
                    <GridItem colSpan={{ base: 1, md: 2, lg: 3, xl: 4 }}>
                        <Flex direction="column" align="center" justify="center" h="200px" bg="white" borderRadius="xl" border="1px dashed" borderColor="gray.300"><Icon as={InfoIcon} boxSize={8} color="gray.300" mb={3} /><Text color="gray.500" fontWeight="bold">Nenhum documento encontrado.</Text></Flex>
                    </GridItem>
                )}
            </SimpleGrid>
        </Container>
    );
};

export default AbaCorretorManuais;