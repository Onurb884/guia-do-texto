import React, { useState } from 'react';
import { SimpleGrid, Card, Flex, Box, Heading, Text, Select, GridItem, CardBody, Badge, Icon, Button, IconButton, InputGroup, InputLeftElement, Input, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, VStack, HStack, useDisclosure } from '@chakra-ui/react';
import { InfoIcon, StarIcon, EditIcon, CheckCircleIcon, AttachmentIcon, SearchIcon, ViewIcon, DownloadIcon, RepeatIcon } from '@chakra-ui/icons';

const CATEGORIAS_MATERIAL = {
    'ALUNO_MANUAL': { nome: 'Manuais e Cartilhas', cor: 'blue', icon: InfoIcon },
    'ALUNO_REPERTORIO': { nome: 'Guias de Eixos Temáticos', cor: 'purple', icon: StarIcon },
    'ALUNO_GRAMATICA': { nome: 'Gramática e Estrutura', cor: 'green', icon: EditIcon },
    'ALUNO_EXEMPLOS': { nome: 'Redações Nota 1000', cor: 'yellow', icon: CheckCircleIcon },
    'OUTROS': { nome: 'Outros', cor: 'gray', icon: AttachmentIcon }
};

const AbaMaterial = ({ materiais, recarregar }) => {
    const [buscaMaterial, setBuscaMaterial] = useState('');
    const [filtroMaterialCat, setFiltroMaterialCat] = useState('TODOS');
    const [materialSelecionado, setMaterialSelecionado] = useState(null);
    const modalLeitor = useDisclosure();

    const matFiltrados = materiais.filter(m => {
        const matchBusca = (m.titulo || '').toLowerCase().includes(buscaMaterial.toLowerCase());
        const matchCat = filtroMaterialCat === 'TODOS' ? true : m.categoria === filtroMaterialCat;
        return matchBusca && matchCat;
    });

    const abrirMaterial = (m) => {
        const temTexto = m.conteudo && m.conteudo.length > 5;
        const temExtra = m.dados_extras && Object.keys(m.dados_extras).length > 0;
        if (temTexto || temExtra) { setMaterialSelecionado(m); modalLeitor.onOpen(); } 
        else if (m.arquivo) { window.open(m.arquivo, '_blank'); } 
    };

    return (
        <Box>
            <Flex gap={4} bg="white" p={5} borderRadius="xl" boxShadow="sm" align="center" border="1px solid" borderColor="gray.100" mb={8} wrap="wrap">
                {/* BOTÃO DE REFRESH ADICIONADO AQUI */}
                <IconButton icon={<RepeatIcon />} onClick={recarregar} variant="ghost" colorScheme="teal" aria-label="Atualizar materiais" />
                
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
                                <Text fontSize="xs" color="gray.500" mb={4} noOfLines={3} flex="1">{m.descricao || "Nenhuma descrição disponível."}</Text>
                                
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
                        </Flex>
                    </GridItem>
                )}
            </SimpleGrid>

            <Modal isOpen={modalLeitor.isOpen} onClose={modalLeitor.onClose} size="3xl" scrollBehavior="inside" isCentered>
                <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.700" />
                <ModalContent borderRadius="xl" overflow="hidden">
                    <ModalHeader borderBottom="1px solid" borderColor="gray.100" bg="gray.50"><HStack mb={2}><Badge colorScheme={CATEGORIAS_MATERIAL[materialSelecionado?.categoria]?.cor || 'teal'}>{CATEGORIAS_MATERIAL[materialSelecionado?.categoria]?.nome || 'Leitura Nátiva'}</Badge></HStack><Heading size="md" color="gray.800" lineHeight="short">{materialSelecionado?.titulo}</Heading></ModalHeader>
                    <ModalCloseButton mt={2} />
                    <ModalBody py={6} bg="white">
                        <VStack align="stretch" spacing={6}>
                            {materialSelecionado?.descricao && (<Text fontSize="md" color="gray.600" fontStyle="italic" borderLeft="3px solid" borderColor="gray.300" pl={3}>{materialSelecionado.descricao}</Text>)}
                            {materialSelecionado?.dados_extras && Object.keys(materialSelecionado.dados_extras).length > 0 && (
                                <Box>
                                    {materialSelecionado.categoria === 'ALUNO_REPERTORIO' && materialSelecionado.dados_extras.topicos && (
                                        <VStack align="stretch" spacing={4}><Heading size="sm" color="purple.800" display="flex" alignItems="center" gap={2}><StarIcon /> Desenvolvimento do Repertório</Heading>
                                            {materialSelecionado.dados_extras.topicos.map((t, idx) => (<Box key={idx} bg="purple.50" p={5} borderRadius="xl" border="1px solid" borderColor="purple.100"><Badge colorScheme="purple" mb={2} variant="solid">Parte {idx + 1}</Badge><Heading size="sm" color="purple.900" mb={3}>{t.titulo}</Heading><Text fontSize="md" color="gray.800" whiteSpace="pre-wrap" lineHeight="tall">{t.texto}</Text></Box>))}
                                        </VStack>
                                    )}
                                    {materialSelecionado.categoria === 'ALUNO_GRAMATICA' && materialSelecionado.dados_extras.ex_errado && (
                                        <Box bg="green.50" p={5} borderRadius="xl" border="1px solid" borderColor="green.100"><Heading size="sm" color="green.800" mb={4} display="flex" alignItems="center" gap={2}><EditIcon /> Exemplo Prático</Heading>
                                            <SimpleGrid columns={2} spacing={4}><Box bg="white" p={4} borderRadius="md" border="1px solid" borderColor="red.200" borderLeft="4px solid" borderLeftColor="red.500"><Text fontSize="2xs" fontWeight="900" color="red.500" textTransform="uppercase" mb={2}>Como muitos erram</Text><Text fontWeight="bold" color="gray.700">"{materialSelecionado.dados_extras.ex_errado}"</Text></Box><Box bg="white" p={4} borderRadius="md" border="1px solid" borderColor="green.200" borderLeft="4px solid" borderLeftColor="green.500"><Text fontSize="2xs" fontWeight="900" color="green.500" textTransform="uppercase" mb={2}>Como você deve escrever</Text><Text fontWeight="bold" color="gray.700">"{materialSelecionado.dados_extras.ex_correto}"</Text></Box></SimpleGrid>
                                        </Box>
                                    )}
                                </Box>
                            )}
                            {materialSelecionado?.conteudo && (<Box bg="gray.50" p={5} borderRadius="xl" border="1px solid" borderColor="gray.200"><Heading size="xs" color="gray.500" textTransform="uppercase" mb={3}>{materialSelecionado.categoria === 'ALUNO_REPERTORIO' ? 'Orientações Gerais' : 'Conteúdo'}</Heading><Text whiteSpace="pre-wrap" fontSize="15px" lineHeight="1.8" color="gray.700">{materialSelecionado.conteudo}</Text></Box>)}
                        </VStack>
                    </ModalBody>
                    <ModalFooter bg="gray.100" borderTop="1px solid" borderColor="gray.200" justifyContent="space-between">{materialSelecionado?.arquivo ? (<Button as="a" href={materialSelecionado.arquivo} target="_blank" colorScheme="blue" variant="outline" leftIcon={<DownloadIcon />}>Baixar PDF Anexo</Button>) : <Box />}<Button colorScheme="gray" bg="white" border="1px solid" borderColor="gray.300" onClick={modalLeitor.onClose}>Fechar</Button></ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default AbaMaterial;