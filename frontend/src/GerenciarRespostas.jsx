import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Container, Heading, Text, VStack, HStack, Button, Icon, Box, 
  useToast, Flex, Badge, Input, Select, Textarea, IconButton, 
  FormControl, FormLabel, Modal, ModalOverlay, ModalContent, 
  ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  InputGroup, InputLeftElement, Table, Thead, Tbody, Tr, Th, Td, 
  useDisclosure, Tooltip, AlertDialog, AlertDialogBody, 
  AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay,
  Divider
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon, CheckCircleIcon, SearchIcon, WarningTwoIcon } from '@chakra-ui/icons';

const ERROS_GRAMATICA = [
    { label: 'Ortografia', value: 'ORTOGRAFIA' }, { label: 'Acentuação', value: 'ACENTUACAO' }, 
    { label: 'Pontuação', value: 'PONTUACAO' }, { label: 'Concordância', value: 'CONCORDANCIA' }, 
    { label: 'Regência', value: 'REGENCIA' }, { label: 'Crase', value: 'CRASE' }, { label: 'Outros', value: 'OUTROS' }
];

const COMPETENCIAS_ENEM = [
    { id: 1, nome: 'Competência 1 (Gramática)' },
    { id: 2, nome: 'Competência 2 (Tema/Estrutura)' },
    { id: 3, nome: 'Competência 3 (Argumentação)' },
    { id: 4, nome: 'Competência 4 (Coesão)' },
    { id: 5, nome: 'Competência 5 (Proposta)' }
];

const COMPETENCIAS_SIMPLES = [
    { id: 1, nome: 'Competência 1 (Gramática)' },
    { id: 2, nome: 'Competência 2 (Estrutura/Tema)' },
    { id: 3, nome: 'Competência 3 (Argumentação)' },
    { id: 4, nome: 'Competência 4 (Coesão e Coerência)' }
];

function GerenciarRespostas() {
  const [respostas, setRespostas] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [busca, setBusca] = useState('');
  const [filtroModelo, setFiltroModelo] = useState('TODOS');
  const [filtroCompetencia, setFiltroCompetencia] = useState('TODOS');
  const [filtroContexto, setFiltroContexto] = useState('TODOS');

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [respostaAtual, setRespostaAtual] = useState({
      id: null, modelo: 'ENEM', competencia: 1, contexto: 'GERAL', tipo_erro: '', titulo: '', texto: ''
  });

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [respostaParaExcluir, setRespostaParaExcluir] = useState(null);
  const cancelRef = useRef();
  const toast = useToast();

  useEffect(() => { carregarRespostas(); }, []);

  const carregarRespostas = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://127.0.0.1:8000/api/respostas-rapidas/', { headers: { Authorization: `Bearer ${token}` } });
      setRespostas(res.data);
    } catch (e) {
      toast({ title: 'Erro ao carregar respostas', status: 'error' });
    }
    setLoading(false);
  };

  const abrirModalNovo = () => {
      setRespostaAtual({ id: null, modelo: 'ENEM', competencia: 1, contexto: 'GERAL', tipo_erro: '', titulo: '', texto: '' });
      onOpen();
  };

  const abrirModalEditar = (resp) => {
      setRespostaAtual({ 
          id: resp.id, modelo: resp.modelo || 'ENEM', competencia: resp.competencia, contexto: resp.contexto, 
          tipo_erro: resp.tipo_erro || '', titulo: resp.titulo, texto: resp.texto 
      });
      onOpen();
  };

  const handleSalvar = async () => {
      if (!respostaAtual.titulo.trim() || !respostaAtual.texto.trim()) {
          return toast({ title: "Atenção", description: "O título e o texto são obrigatórios.", status: "warning" });
      }
      if (respostaAtual.contexto === 'PIN' && respostaAtual.competencia === 1 && !respostaAtual.tipo_erro) {
          return toast({ title: "Atenção", description: "Selecione o tipo de erro gramatical.", status: "warning" });
      }
      
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const payload = {
          modelo: respostaAtual.modelo,
          competencia: respostaAtual.competencia,
          contexto: respostaAtual.contexto,
          titulo: respostaAtual.titulo,
          texto: respostaAtual.texto,
          tipo_erro: (respostaAtual.contexto === 'PIN' && respostaAtual.competencia === 1) ? respostaAtual.tipo_erro : ""
      };

      try {
          const baseURL = 'http://127.0.0.1:8000/api/respostas-rapidas/';
          if (respostaAtual.id) await axios.put(`${baseURL}${respostaAtual.id}/`, payload, { headers: { Authorization: `Bearer ${token}` } });
          else await axios.post(baseURL, payload, { headers: { Authorization: `Bearer ${token}` } });
          toast({ title: "Sucesso!", status: "success" });
          onClose();
          carregarRespostas();
      } catch (e) {
          toast({ title: "Erro ao salvar", status: "error" });
      } finally {
          setLoading(false);
      }
  };

  const confirmarExclusao = async () => {
      if (!respostaParaExcluir) return;
      const token = localStorage.getItem('token');
      try {
          await axios.delete(`http://127.0.0.1:8000/api/respostas-rapidas/${respostaParaExcluir.id}/`, { headers: { Authorization: `Bearer ${token}` }});
          toast({ title: "Resposta excluída", status: "success" });
          carregarRespostas();
      } catch (e) { toast({ title: "Erro ao excluir", status: "error" }); 
      } finally { setIsAlertOpen(false); setRespostaParaExcluir(null); }
  };

  const respostasFiltradas = respostas.filter(r => {
      const matchTexto = r.titulo.toLowerCase().includes(busca.toLowerCase()) || r.texto.toLowerCase().includes(busca.toLowerCase());
      const matchModelo = filtroModelo === 'TODOS' ? true : r.modelo === filtroModelo;
      const matchComp = filtroCompetencia === 'TODOS' ? true : r.competencia.toString() === filtroCompetencia;
      const matchContexto = filtroContexto === 'TODOS' ? true : r.contexto === filtroContexto;
      return matchTexto && matchModelo && matchComp && matchContexto;
  });

  return (
    <Container maxW="full" py={8} px={{ base: 4, md: 8 }} bg="gray.50" minH="100vh">
      <VStack spacing={8} align="stretch">
        
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <Box>
                <Heading size="lg" color="teal.700">Respostas Rápidas</Heading>
                <Text color="gray.500" fontSize="md">Crie atalhos de feedback para agilizar suas correções.</Text>
            </Box>
            <Button leftIcon={<AddIcon />} colorScheme="teal" size="lg" shadow="md" onClick={abrirModalNovo}>Nova Resposta</Button>
        </Flex>

        <Flex gap={4} bg="white" p={5} borderRadius="xl" boxShadow="sm" align="center" border="1px solid" borderColor="gray.100" wrap="wrap">
            <InputGroup flex={1} minW="250px">
                <InputLeftElement pointerEvents='none'><SearchIcon color='gray.400' /></InputLeftElement>
                <Input placeholder="Pesquisar por título..." value={busca} onChange={e => setBusca(e.target.value)} />
            </InputGroup>
            
            <Divider orientation="vertical" h="30px" display={{ base: 'none', md: 'block' }} />
            
            <Select w="180px" value={filtroModelo} onChange={e => setFiltroModelo(e.target.value)}>
                <option value="TODOS">Modelo: Todos</option>
                <option value="ENEM">ENEM</option>
                <option value="SIMPLES">Simples</option>
            </Select>

            <Select w="250px" value={filtroContexto} onChange={e => setFiltroContexto(e.target.value)}>
                <option value="TODOS">Contexto: Todos</option>
                <option value="GERAL">Apenas Comentário Geral</option>
                <option value="PIN">Apenas Observação de Pin</option>
            </Select>

            {/* O Filtro mantém a palavra "Competência" por extenso */}
            <Select w="250px" value={filtroCompetencia} onChange={e => setFiltroCompetencia(e.target.value)}>
                <option value="TODOS">Competência: Todas</option>
                <option value="1">Competência 1</option>
                <option value="2">Competência 2</option>
                <option value="3">Competência 3</option>
                <option value="4">Competência 4</option>
                <option value="5">Competência 5</option>
            </Select>
        </Flex>

        <Box bg="white" shadow="sm" borderRadius="lg" overflowX="auto" border="1px solid" borderColor="gray.200">
            <Table variant="simple" style={{ tableLayout: 'fixed', width: '100%' }}>
                <Thead bg="gray.50">
                    <Tr>
                        <Th w="25%" px={4}>Título</Th>
                        <Th w="25%" px={4}>Texto da Resposta</Th>
                        <Th w="15%" px={3} textAlign="center">Modelo</Th>
                        <Th w="15%" px={3} textAlign="center">Contexto</Th>
                        <Th w="20%" px={3} textAlign="center">Competência</Th>
                        <Th w="10%" px={4} textAlign="center">Ações</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {respostasFiltradas.map(resp => (
                    <Tr key={resp.id} _hover={{ bg: 'gray.50' }}>
                        <Td fontWeight="bold" color="gray.700" px={4} isTruncated title={resp.titulo}>{resp.titulo}</Td>
                        <Td fontSize="sm" color="gray.600" px={4} isTruncated title={resp.texto}>{resp.texto}</Td>
                        
                        <Td px={3} textAlign="center">
                            <Badge bg={resp.modelo === 'ENEM' ? 'green.50' : 'blue.50'} color={resp.modelo === 'ENEM' ? 'green.700' : 'blue.700'}>
                                {resp.modelo || 'ENEM'}
                            </Badge>
                        </Td>

                        <Td px={3} textAlign="center">
                            <Badge colorScheme={resp.contexto === 'GERAL' ? 'blue' : 'purple'} borderRadius="md" px={2} py={1} fontSize="xs">
                                {resp.contexto === 'GERAL' ? 'COM. GERAL' : 'PIN NA REDAÇÃO'}
                            </Badge>
                        </Td>

                        <Td px={3} textAlign="center">
                            <VStack spacing={1}>
                                {/* Aqui a tabela exibe apenas "Comp. X" de forma limpa e direta */}
                                <Badge colorScheme="gray" borderRadius="md" px={2} py={1} fontSize="xs">
                                    Comp. {resp.competencia}
                                </Badge>
                                {resp.tipo_erro && resp.tipo_erro !== '' && (
                                    <Badge colorScheme="red" variant="outline" fontSize="2xs">{ERROS_GRAMATICA.find(e => e.value === resp.tipo_erro)?.label || resp.tipo_erro}</Badge>
                                )}
                            </VStack>
                        </Td>
                        
                        <Td px={4} textAlign="center">
                            <HStack spacing={2} justify="center">
                                <Tooltip label="Editar" hasArrow><IconButton size="sm" icon={<EditIcon />} colorScheme="blue" variant="ghost" onClick={() => abrirModalEditar(resp)} /></Tooltip>
                                <Tooltip label="Excluir" hasArrow><IconButton size="sm" icon={<DeleteIcon />} colorScheme="red" variant="ghost" onClick={() => { setRespostaParaExcluir(resp); setIsAlertOpen(true); }} /></Tooltip>
                            </HStack>
                        </Td>
                    </Tr>
                    ))}
                    {respostasFiltradas.length === 0 && <Tr><Td colSpan={6} textAlign="center" py={6} color="gray.500">Nenhuma resposta rápida encontrada.</Td></Tr>}
                </Tbody>
            </Table>
        </Box>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered closeOnOverlayClick={false}>
        <ModalOverlay backdropFilter="blur(3px)" />
        <ModalContent borderRadius="xl">
            <ModalHeader bg="gray.50" borderBottom="1px solid" borderColor="gray.200">
                <Heading size="md" color="gray.700">{respostaAtual.id ? 'Editar Resposta' : 'Nova Resposta Rápida'}</Heading>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody py={6}>
                <VStack spacing={5}>
                    <Flex gap={4} w="full">
                        <FormControl isRequired flex={1}>
                            <FormLabel fontSize="sm" fontWeight="bold" color="gray.600">Modelo de Correção</FormLabel>
                            <Select value={respostaAtual.modelo} onChange={e => setRespostaAtual({...respostaAtual, modelo: e.target.value, competencia: 1})}>
                                <option value="ENEM">ENEM</option>
                                <option value="SIMPLES">Simples</option>
                            </Select>
                        </FormControl>

                        <FormControl isRequired flex={1}>
                            <FormLabel fontSize="sm" fontWeight="bold" color="gray.600">Contexto de Uso</FormLabel>
                            <Select value={respostaAtual.contexto} onChange={e => setRespostaAtual({...respostaAtual, contexto: e.target.value})}>
                                <option value="GERAL">Para Comentário Geral</option>
                                <option value="PIN">Para Pin na Redação</option>
                            </Select>
                        </FormControl>
                    </Flex>

                    <FormControl isRequired w="full">
                        <FormLabel fontSize="sm" fontWeight="bold" color="gray.600">Selecione a Competência</FormLabel>
                        <Select value={respostaAtual.competencia} onChange={e => setRespostaAtual({...respostaAtual, competencia: parseInt(e.target.value)})}>
                            {(respostaAtual.modelo === 'SIMPLES' ? COMPETENCIAS_SIMPLES : COMPETENCIAS_ENEM).map(c => (
                                <option key={c.id} value={c.id}>{c.nome}</option>
                            ))}
                        </Select>
                    </FormControl>

                    {respostaAtual.contexto === 'PIN' && respostaAtual.competencia === 1 && (
                        <FormControl isRequired>
                            <FormLabel fontSize="sm" fontWeight="bold" color="red.500">Classificação do Erro (Gramática)</FormLabel>
                            <Select placeholder="Selecione o tipo de erro..." value={respostaAtual.tipo_erro} onChange={e => setRespostaAtual({...respostaAtual, tipo_erro: e.target.value})} focusBorderColor="red.400">
                                {ERROS_GRAMATICA.map(erro => <option key={erro.value} value={erro.value}>{erro.label}</option>)}
                            </Select>
                        </FormControl>
                    )}

                    <FormControl isRequired>
                        <FormLabel fontSize="sm" fontWeight="bold" color="gray.600">Título Curto (Para você achar rápido)</FormLabel>
                        <Input placeholder="Ex: Uso excessivo de gerúndio" value={respostaAtual.titulo} onChange={e => setRespostaAtual({...respostaAtual, titulo: e.target.value})} />
                    </FormControl>

                    <FormControl isRequired>
                        <FormLabel fontSize="sm" fontWeight="bold" color="gray.600">Texto Completo da Resposta</FormLabel>
                        <Textarea rows={5} placeholder="Digite a explicação completa que o aluno vai ler..." value={respostaAtual.texto} onChange={e => setRespostaAtual({...respostaAtual, texto: e.target.value})} />
                    </FormControl>
                </VStack>
            </ModalBody>
            <ModalFooter bg="gray.50" borderTop="1px solid" borderColor="gray.100">
                <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
                <Button colorScheme="teal" onClick={handleSalvar} isLoading={loading} leftIcon={<CheckCircleIcon />}>Salvar Resposta</Button>
            </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog isOpen={isAlertOpen} leastDestructiveRef={cancelRef} onClose={() => setIsAlertOpen(false)} isCentered>
        <AlertDialogOverlay backdropFilter="blur(2px)" />
        <AlertDialogContent borderRadius="xl">
          <AlertDialogHeader fontSize="lg" fontWeight="bold" bg="red.50" color="red.700" borderTopRadius="xl">
            <HStack><WarningTwoIcon /> <Text>Confirmar Exclusão</Text></HStack>
          </AlertDialogHeader>
          <AlertDialogBody py={6}>
            Tem certeza que deseja excluir o atalho <strong>{respostaParaExcluir?.titulo}</strong>? Esta ação não pode ser desfeita.
          </AlertDialogBody>
          <AlertDialogFooter borderTop="1px solid" borderColor="gray.100">
            <Button ref={cancelRef} onClick={() => setIsAlertOpen(false)}>Cancelar</Button>
            <Button colorScheme="red" onClick={confirmarExclusao} ml={3}>Sim, Excluir</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Container>
  );
}

export default GerenciarRespostas;