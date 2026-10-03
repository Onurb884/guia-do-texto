import React, { useState } from 'react';
import { Container, Flex, Heading, Text, Button, InputGroup, InputLeftElement, Input, Select, SimpleGrid, Card, CardBody, Badge, HStack, IconButton, Box, GridItem, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, VStack, FormControl, FormLabel, Textarea, useToast, useDisclosure } from '@chakra-ui/react';
import { SearchIcon, AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import axios from 'axios';

const ERROS_GRAMATICA = [{ label: 'Ortografia', value: 'ORTOGRAFIA' }, { label: 'Acentuação', value: 'ACENTUACAO' }, { label: 'Pontuação', value: 'PONTUACAO' }, { label: 'Concordância', value: 'CONCORDANCIA' }, { label: 'Regência', value: 'REGENCIA' }, { label: 'Crase', value: 'CRASE' }, { label: 'Colocação Pronominal', value: 'COLOCACAO_PRONOMINAL' }, { label: 'Translineação', value: 'TRANSLINEACAO' }, { label: 'Impropriedade Vocabular', value: 'IMPROPRIEDADE_VOCABULAR' }, { label: 'Outros', value: 'OUTROS' }];
const COMPETENCIAS_ENEM = [{ id: 1, nome: '1. Gramática' }, { id: 2, nome: '2. Tema/Estrutura' }, { id: 3, nome: '3. Argumentação' }, { id: 4, nome: '4. Coesão' }, { id: 5, nome: '5. Proposta' }];
const COMPETENCIAS_PADRAO = [{ id: 1, nome: '1. Domínio da Norma Culta' }, { id: 2, nome: '2. Adequação ao Tema e Estrutura' }, { id: 3, nome: '3. Coerência e Argumentação' }, { id: 4, nome: '4. Coesão Textual' }];

const AbaCorretorRespostas = ({ todasRespostas, setTodasRespostas }) => {
    const toast = useToast();
    const [buscaResposta, setBuscaResposta] = useState("");
    const [filtroRespModelo, setFiltroRespModelo] = useState("TODOS");
    const [filtroRespContexto, setFiltroRespContexto] = useState("TODOS");
    
    const [editandoRespostaId, setEditandoRespostaId] = useState(null);
    const [novoTituloResp, setNovoTituloResp] = useState("");
    const [novoTextoResp, setNovoTextoResp] = useState("");
    const [novoModeloResp, setNovoModeloResp] = useState("ENEM");
    const [novaCompResp, setNovaCompResp] = useState(1);
    const [novoContextoResp, setNovoContextoResp] = useState("GERAL");
    const [novoTipoErroResp, setNovoTipoErroResp] = useState("");
    const [isCreatingResposta, setIsCreatingResposta] = useState(false);
    
    const modalCriarResposta = useDisclosure(); 

    const abrirNovaResposta = () => {
        setEditandoRespostaId(null); setNovoTituloResp(""); setNovoTextoResp(""); setNovoModeloResp("ENEM"); setNovaCompResp(1); setNovoContextoResp("GERAL"); setNovoTipoErroResp(""); modalCriarResposta.onOpen();
    };

    const abrirEdicaoResposta = (r) => {
        setEditandoRespostaId(r.id); setNovoTituloResp(r.titulo); setNovoTextoResp(r.texto); setNovoModeloResp(r.modelo); setNovaCompResp(r.competencia); setNovoContextoResp(r.contexto); setNovoTipoErroResp(r.tipo_erro || ""); modalCriarResposta.onOpen();
    };

    const criarRespostaRapida = async () => { 
        if (!novoTituloResp.trim() || !novoTextoResp.trim()) return toast({ title: 'Preencha título e texto', status: 'warning' }); 
        if (novoModeloResp === 'ENEM' && novaCompResp === 1 && novoContextoResp === 'PIN' && !novoTipoErroResp) return toast({ title: 'Selecione o tipo de erro', status: 'warning' });
        
        setIsCreatingResposta(true); 
        try { 
            const payload = { modelo: novoModeloResp, competencia: novaCompResp, contexto: novoContextoResp, titulo: novoTituloResp, texto: novoTextoResp, tipo_erro: novoTipoErroResp }; 
            if (editandoRespostaId) {
                const r = await axios.put(`http://127.0.0.1:8000/api/respostas-rapidas/${editandoRespostaId}/`, payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
                setTodasRespostas(todasRespostas.map(resp => resp.id === editandoRespostaId ? r.data : resp)); toast({ title: 'Editado com sucesso!', status: 'success' }); 
            } else {
                const r = await axios.post('http://127.0.0.1:8000/api/respostas-rapidas/', payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
                setTodasRespostas([...todasRespostas, r.data]); toast({ title: 'Salvo com sucesso!', status: 'success' }); 
            }
            modalCriarResposta.onClose(); 
        } catch (e) { toast({ title: 'Erro ao salvar', status: 'error' }); } 
        finally { setIsCreatingResposta(false); } 
    };

    const excluirRespostaRapida = async (id, e) => { 
        if(e) e.stopPropagation(); 
        try { await axios.delete(`http://127.0.0.1:8000/api/respostas-rapidas/${id}/`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); setTodasRespostas(todasRespostas.filter(r => r.id !== id)); } catch (e) { } 
    };

    const respostasFiltradas = todasRespostas.filter(r => { 
        const matchBusca = r.titulo.toLowerCase().includes(buscaResposta.toLowerCase()) || r.texto.toLowerCase().includes(buscaResposta.toLowerCase()); 
        const matchModelo = filtroRespModelo === 'TODOS' ? true : r.modelo === filtroRespModelo; 
        const matchContexto = filtroRespContexto === 'TODOS' ? true : r.contexto === filtroRespContexto; 
        return matchBusca && matchModelo && matchContexto; 
    });

    const isPadrao = novoModeloResp === 'PADRAO_100' || novoModeloResp === 'PADRAO_10' || novoModeloResp === 'SIMPLES';

    return (
        <Container maxW="container.xl" py={8}>
            <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
                <Box><Heading size="lg" color="teal.700">Respostas Rápidas</Heading><Text color="gray.500">Gerencie seus atalhos de texto para usar durante as correções.</Text></Box>
                <Button colorScheme="teal" leftIcon={<AddIcon />} shadow="sm" onClick={abrirNovaResposta}>Nova Resposta</Button>
            </Flex>

            <Flex mb={6} gap={4} bg="white" p={5} borderRadius="xl" boxShadow="sm" align="center" border="1px solid" borderColor="gray.100" wrap="wrap">
                <InputGroup size="md" flex={1} minW="250px"><InputLeftElement pointerEvents='none'><SearchIcon color='gray.400' /></InputLeftElement><Input placeholder="Buscar por título ou texto..." value={buscaResposta} onChange={(e) => setBuscaResposta(e.target.value)} /></InputGroup>
                <Select w="180px" value={filtroRespModelo} onChange={e => setFiltroRespModelo(e.target.value)}>
                    <option value="TODOS">Modelo: Todos</option>
                    <option value="ENEM">ENEM</option>
                    <option value="PADRAO_100">Padrão 100 pts</option>
                    <option value="PADRAO_10">Padrão 10 pts</option>
                </Select>
                <Select w="180px" value={filtroRespContexto} onChange={e => setFiltroRespContexto(e.target.value)}><option value="TODOS">Contexto: Todos</option><option value="GERAL">Comentário Final</option><option value="PIN">Apontamento (Pin)</option></Select>
            </Flex>
            
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {respostasFiltradas.map(r => (
                    <Card key={r.id} shadow="sm" border="1px solid" borderColor="gray.200" position="relative" overflow="hidden" _hover={{ shadow: 'md', transform: 'translateY(-2px)' }} transition="all 0.2s">
                        <Box h="4px" w="full" bg={r.modelo === 'ENEM' ? "teal.400" : (r.modelo === 'PADRAO_10' ? 'purple.400' : 'blue.400')} />
                        <CardBody>
                            <Flex justify="space-between" align="start" mb={2}>
                                <Badge colorScheme={r.contexto === 'GERAL' ? 'purple' : 'orange'} fontSize="2xs">{r.contexto === 'GERAL' ? 'COMENTÁRIO' : 'PIN'}</Badge>
                                <HStack spacing={1}>
                                    <IconButton icon={<EditIcon />} size="xs" colorScheme="blue" variant="ghost" onClick={() => abrirEdicaoResposta(r)} aria-label="Editar" />
                                    <IconButton icon={<DeleteIcon />} size="xs" colorScheme="red" variant="ghost" onClick={() => excluirRespostaRapida(r.id)} aria-label="Excluir" />
                                </HStack>
                            </Flex>
                            <Heading size="xs" mb={1} color="gray.800">{r.titulo}</Heading>
                            <Text fontSize="xs" color="gray.500" mb={3} fontWeight="bold">Comp {r.competencia} - {r.modelo}{r.modelo === 'ENEM' && r.competencia === 1 && r.contexto === 'PIN' && r.tipo_erro && (<Badge ml={2} colorScheme="red" variant="subtle" fontSize="2xs">{r.tipo_erro.replace('_', ' ')}</Badge>)}</Text>
                            <Text fontSize="sm" color="gray.600" noOfLines={4} bg="gray.50" p={3} borderRadius="md" border="1px solid" borderColor="gray.100" fontStyle="italic">"{r.texto}"</Text>
                        </CardBody>
                    </Card>
                ))}
                {respostasFiltradas.length === 0 && (
                    <GridItem colSpan={{ base: 1, md: 2, lg: 3 }}>
                        <Flex direction="column" align="center" justify="center" h="200px" bg="white" borderRadius="xl" border="1px dashed" borderColor="gray.300"><Text color="gray.500" fontWeight="bold">Nenhuma resposta encontrada.</Text></Flex>
                    </GridItem>
                )}
            </SimpleGrid>

            <Modal isOpen={modalCriarResposta.isOpen} onClose={modalCriarResposta.onClose} isCentered size="lg">
                <ModalOverlay backdropFilter="blur(3px)" />
                <ModalContent borderRadius="xl">
                    <ModalHeader borderBottom="1px solid" borderColor="gray.100">{editandoRespostaId ? 'Editar Resposta' : 'Criar Resposta'}</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody py={6}>
                        <VStack spacing={4} align="stretch">
                            <SimpleGrid columns={2} spacing={4}>
                                <FormControl><FormLabel fontSize="xs" fontWeight="bold">Modelo</FormLabel><Select size="sm" value={novoModeloResp} onChange={e => setNovoModeloResp(e.target.value)}><option value="ENEM">ENEM</option><option value="PADRAO_100">Padrão 100</option><option value="PADRAO_10">Padrão 10</option></Select></FormControl>
                                <FormControl><FormLabel fontSize="xs" fontWeight="bold">Competência</FormLabel><Select size="sm" value={novaCompResp} onChange={e => setNovaCompResp(parseInt(e.target.value))}>{(isPadrao ? COMPETENCIAS_PADRAO : COMPETENCIAS_ENEM).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</Select></FormControl>
                            </SimpleGrid>
                            <FormControl><FormLabel fontSize="xs" fontWeight="bold">Contexto de Uso</FormLabel><Select size="sm" value={novoContextoResp} onChange={e => setNovoContextoResp(e.target.value)}><option value="GERAL">Comentário Final (Competência)</option><option value="PIN">Apontamento (Pin na Imagem)</option></Select></FormControl>
                            {novoModeloResp === 'ENEM' && novaCompResp === 1 && novoContextoResp === 'PIN' && (<FormControl isRequired><FormLabel fontSize="xs" fontWeight="bold" color="red.600">Erro Gramatical</FormLabel><Select size="sm" placeholder="Selecione o erro específico..." value={novoTipoErroResp} onChange={e => setNovoTipoErroResp(e.target.value)} bg="red.50" borderColor="red.200">{ERROS_GRAMATICA.map(erro => <option key={erro.value} value={erro.value}>{erro.label}</option>)}</Select></FormControl>)}
                            <FormControl isRequired><FormLabel fontSize="xs" fontWeight="bold">Título (Atalho)</FormLabel><Input size="sm" placeholder="Ex: Fuga Parcial ao Tema" value={novoTituloResp} onChange={e => setNovoTituloResp(e.target.value)} /></FormControl>
                            <FormControl isRequired><FormLabel fontSize="xs" fontWeight="bold">Texto Completo</FormLabel><Textarea size="sm" rows={4} placeholder="Escreva o texto detalhado..." value={novoTextoResp} onChange={e => setNovoTextoResp(e.target.value)} /></FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter bg="gray.50" borderTopRadius="none" borderBottomRadius="xl"><Button variant="ghost" mr={3} onClick={modalCriarResposta.onClose}>Cancelar</Button><Button colorScheme="teal" onClick={criarRespostaRapida} isLoading={isCreatingResposta} leftIcon={<AddIcon />}>{editandoRespostaId ? 'Salvar Edição' : 'Salvar Resposta'}</Button></ModalFooter>
                </ModalContent>
            </Modal>
        </Container>
    );
};

export default AbaCorretorRespostas;