import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, Flex, Heading, Button, Table, Thead, Tbody, Tr, Th, Td, Card, 
  useToast, IconButton, Modal, ModalOverlay, ModalContent, ModalHeader, 
  ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input, 
  Textarea, Select, useDisclosure, Text, Badge, Tooltip, VStack, InputGroup, InputLeftElement 
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon, WarningTwoIcon, SearchIcon } from '@chakra-ui/icons';

const AbaGestaoGabaritoPins = () => {
    const [gabaritos, setGabaritos] = useState([]);
    const [loading, setLoading] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const modalExcluir = useDisclosure();
    const toast = useToast();

    // Formulário
    const [idEdit, setIdEdit] = useState(null);
    const [idExcluir, setIdExcluir] = useState(null);
    const [competencia, setCompetencia] = useState(1);
    const [titulo, setTitulo] = useState('');
    const [texto, setTexto] = useState('');

    // Filtros de Pesquisa
    const [filtroBusca, setFiltroBusca] = useState('');
    const [filtroComp, setFiltroComp] = useState('TODOS');

    const token = localStorage.getItem('token');

    const carregarGabaritos = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/gestao/gabarito-pins/', { headers: { Authorization: `Bearer ${token}` } });
            // Impede que eventuais erros de gravação passem o "Outros" para a lista
            setGabaritos(res.data.filter(g => g.competencia !== 0));
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    useEffect(() => {
        carregarGabaritos();
    }, []);

    const abrirModal = (gab = null) => {
        if (gab) {
            setIdEdit(gab.id);
            setCompetencia(gab.competencia);
            setTitulo(gab.titulo);
            setTexto(gab.texto);
        } else {
            setIdEdit(null);
            setCompetencia(1);
            setTitulo('');
            setTexto('');
        }
        onOpen();
    };

    const salvarGabarito = async () => {
        if (!titulo || !texto) {
            return toast({ title: 'Preencha todos os campos.', status: 'warning' });
        }
        try {
            const payload = { competencia: parseInt(competencia), titulo, texto };
            if (idEdit) {
                await axios.put(`http://127.0.0.1:8000/api/gestao/gabarito-pins/${idEdit}/`, payload, { headers: { Authorization: `Bearer ${token}` } });
                toast({ title: 'Gabarito atualizado.', status: 'success' });
            } else {
                await axios.post('http://127.0.0.1:8000/api/gestao/gabarito-pins/', payload, { headers: { Authorization: `Bearer ${token}` } });
                toast({ title: 'Gabarito criado.', status: 'success' });
            }
            onClose();
            carregarGabaritos();
        } catch (e) {
            toast({ title: 'Erro ao salvar.', status: 'error' });
        }
    };

    const confirmarExclusao = async () => {
        try {
            await axios.delete(`http://127.0.0.1:8000/api/gestao/gabarito-pins/${idExcluir}/`, { headers: { Authorization: `Bearer ${token}` } });
            toast({ title: 'Gabarito excluído.', status: 'success' });
            carregarGabaritos();
        } catch (e) {
            toast({ title: 'Erro ao excluir.', status: 'error' });
        }
        modalExcluir.onClose();
        setIdExcluir(null);
    };

    const getCompNome = (c) => {
        if (c === 1) return { nome: 'COMP 1', cor: 'red' };
        if (c === 2) return { nome: 'COMP 2', cor: 'blue' };
        if (c === 3) return { nome: 'COMP 3', cor: 'yellow' };
        if (c === 4) return { nome: 'COMP 4', cor: 'green' };
        if (c === 5) return { nome: 'COMP 5', cor: 'purple' };
        return { nome: `COMP ${c}`, cor: 'gray' };
    };

    const gabaritosFiltrados = gabaritos.filter(g => {
        const search = filtroBusca.toLowerCase();
        const matchTexto = g.titulo.toLowerCase().includes(search) || g.texto.toLowerCase().includes(search);
        const matchComp = filtroComp === 'TODOS' ? true : g.competencia === parseInt(filtroComp);
        return matchTexto && matchComp;
    });

    return (
        <Box w="full">
            <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
                <Box>
                    <Heading size="lg" color="teal.700">Gabarito de Pins</Heading>
                    <Text color="gray.500" fontSize="md">Crie os botões de correção rápida que os professores usam nas imagens.</Text>
                </Box>
                <Button colorScheme="teal" leftIcon={<AddIcon />} onClick={() => abrirModal()} shadow="sm">Novo Pin Dinâmico</Button>
            </Flex>

            {/* BARRA DE FILTROS */}
            <Flex mb={6} gap={4} bg="white" p={5} borderRadius="xl" boxShadow="sm" align="center" border="1px solid" borderColor="gray.100" wrap="wrap">
                <InputGroup size="md" flex={1} minW="250px">
                    <InputLeftElement pointerEvents='none'><SearchIcon color='gray.400' /></InputLeftElement>
                    <Input placeholder="Buscar por título ou texto da observação..." value={filtroBusca} onChange={(e) => setFiltroBusca(e.target.value)} />
                </InputGroup>
                
                <Select w="200px" size="md" value={filtroComp} onChange={(e) => setFiltroComp(e.target.value)}>
                    <option value="TODOS">Todas as Competências</option>
                    <option value="1">COMP 1 (Gramática)</option>
                    <option value="2">COMP 2 (Tema/Estrutura)</option>
                    <option value="3">COMP 3 (Argumentação)</option>
                    <option value="4">COMP 4 (Coesão)</option>
                    <option value="5">COMP 5 (Proposta - ENEM)</option>
                </Select>
            </Flex>

            <Card bg="white" shadow="sm" borderRadius="lg" overflow="hidden" border="1px solid" borderColor="gray.200">
                <Box overflowX="auto">
                    <Table variant="simple" style={{ tableLayout: 'fixed', width: '100%' }}>
                        <Thead bg="gray.50">
                            <Tr>
                                <Th w="15%" px={4}>Competência</Th>
                                <Th w="25%" px={4}>Botão (Título)</Th>
                                <Th w="45%" px={4}>Texto que será injetado</Th>
                                <Th w="15%" px={4} textAlign="right">Ações</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {gabaritosFiltrados.map(gab => {
                                const config = getCompNome(gab.competencia);
                                return (
                                    <Tr key={gab.id} _hover={{ bg: 'gray.50' }}>
                                        <Td px={4}>
                                            <Badge bg={`${config.cor}.100`} color={`${config.cor}.800`} px={2} py={0.5} borderRadius="md">
                                                {config.nome}
                                            </Badge>
                                        </Td>
                                        <Td px={4}>
                                            <Text fontWeight="bold" fontSize="sm" color="gray.800" isTruncated>{gab.titulo}</Text>
                                        </Td>
                                        <Td px={4}>
                                            <Tooltip label={gab.texto} hasArrow bg="gray.700" color="white" placement="top">
                                                <Text fontSize="sm" color="gray.600" isTruncated fontStyle="italic">"{gab.texto}"</Text>
                                            </Tooltip>
                                        </Td>
                                        <Td px={4} textAlign="right">
                                            <IconButton size="sm" colorScheme="blue" variant="ghost" icon={<EditIcon />} onClick={() => abrirModal(gab)} mr={2} />
                                            <IconButton size="sm" colorScheme="red" variant="ghost" icon={<DeleteIcon />} onClick={() => { setIdExcluir(gab.id); modalExcluir.onOpen(); }} />
                                        </Td>
                                    </Tr>
                                );
                            })}
                            {gabaritosFiltrados.length === 0 && !loading && (
                                <Tr>
                                    <Td colSpan={4} textAlign="center" py={10} color="gray.500">Nenhum gabarito de pin atende à pesquisa atual.</Td>
                                </Tr>
                            )}
                        </Tbody>
                    </Table>
                </Box>
            </Card>

            <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
                <ModalOverlay backdropFilter="blur(3px)" />
                <ModalContent borderRadius="xl" overflow="hidden">
                    <ModalHeader borderBottom="1px solid" borderColor="gray.100">{idEdit ? 'Editar Gabarito' : 'Novo Pin Rápido'}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody py={6}>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel fontSize="sm" fontWeight="bold">Competência</FormLabel>
                                <Select bg="gray.50" value={competencia} onChange={e => setCompetencia(parseInt(e.target.value))}>
                                    <option value={1}>COMP 1 (Gramática/Norma Culta)</option>
                                    <option value={2}>COMP 2 (Tema/Estrutura)</option>
                                    <option value={3}>COMP 3 (Argumentação)</option>
                                    <option value={4}>COMP 4 (Coesão)</option>
                                    <option value={5}>COMP 5 (Proposta - Apenas ENEM)</option>
                                </Select>
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel fontSize="sm" fontWeight="bold">Texto do Botão (Visível p/ Corretor)</FormLabel>
                                <Input bg="gray.50" placeholder="Ex: Uso indevido de vírgula" value={titulo} onChange={e => setTitulo(e.target.value)} maxLength={50} />
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel fontSize="sm" fontWeight="bold">Observação Completa (Injetada no Balão)</FormLabel>
                                <Textarea bg="gray.50" rows={4} placeholder="Ex: A vírgula foi utilizada incorretamente, separando o sujeito do predicado..." value={texto} onChange={e => setTexto(e.target.value)} />
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter bg="gray.50" borderTop="1px solid" borderColor="gray.100">
                        <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
                        <Button colorScheme="teal" onClick={salvarGabarito}>Salvar Pin</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO (PLATAFORMA PREMIUM) */}
            <Modal isOpen={modalExcluir.isOpen} onClose={modalExcluir.onClose} isCentered size="sm">
                <ModalOverlay backdropFilter="blur(2px)" />
                <ModalContent borderRadius="xl" overflow="hidden">
                    <ModalHeader color="red.600"><WarningTwoIcon mr={2} /> Excluir Gabarito</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Text color="gray.600">Tem a certeza que deseja excluir este pin de gabarito dinâmico? Esta ação não pode ser desfeita.</Text>
                    </ModalBody>
                    <ModalFooter bg="gray.50" borderTop="1px solid" borderColor="gray.100">
                        <Button variant="ghost" mr={3} onClick={modalExcluir.onClose}>Cancelar</Button>
                        <Button colorScheme="red" onClick={confirmarExclusao}>Sim, Excluir</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default AbaGestaoGabaritoPins;