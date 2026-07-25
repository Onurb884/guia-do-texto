import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Container, Heading, Text, VStack, HStack, Button, Box, Icon,
  useToast, Flex, Badge, Card, CardBody, useDisclosure, Modal, ModalOverlay, 
  ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, 
  FormControl, FormLabel, Input, Select, IconButton, Switch, Textarea, 
  Table, Thead, Tbody, Tr, Th, Td, InputGroup, InputLeftElement, Tooltip,
  Tabs, TabList, TabPanels, Tab, TabPanel, Divider, SimpleGrid, GridItem
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, SearchIcon, AttachmentIcon, InfoIcon, WarningTwoIcon, CheckCircleIcon, ChatIcon, DownloadIcon } from '@chakra-ui/icons';

// 1. CATEGORIAS ATUALIZADAS (Alinhadas com o novo Backend)
const CAT_ALUNO = {
    'ALUNO_MANUAL': { nome: 'Manuais e Cartilhas', cor: 'blue', icon: InfoIcon },
    'ALUNO_REPERTORIO': { nome: 'Guias de Eixos Temáticos', cor: 'purple', icon: SearchIcon }, // NOME ATUALIZADO
    'ALUNO_GRAMATICA': { nome: 'Gramática e Estrutura', cor: 'green', icon: EditIcon },
    'ALUNO_EXEMPLOS': { nome: 'Redações Nota 1000', cor: 'yellow', icon: CheckCircleIcon }
};

const CAT_CORRETOR = {
    'CORRETOR_CARTILHA': { nome: 'Cartilha Oficial (MEC)', cor: 'blue', icone: InfoIcon },
    'CORRETOR_REGUA': { nome: 'Régua de Penalizações', cor: 'red', icone: WarningTwoIcon },
    'CORRETOR_COMUNICADO': { nome: 'Comunicados Rápidos', cor: 'purple', icone: ChatIcon }
};

const TODAS_CAT = { ...CAT_ALUNO, ...CAT_CORRETOR };

function GestaoMateriais() {
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [buscaAluno, setBuscaAluno] = useState('');
  const [catAluno, setCatAluno] = useState('TODOS');
  
  const [buscaCorretor, setBuscaCorretor] = useState('');
  const [catCorretor, setCatCorretor] = useState('TODOS');

  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [publicoAtivo, setPublicoAtivo] = useState('ALUNO'); 
  const [form, setForm] = useState({ id: null, titulo: '', descricao: '', conteudo: '', categoria: '', ativo: true });
  const [dadosExtras, setDadosExtras] = useState({});
  const [arquivo, setArquivo] = useState(null);
  
  const toast = useToast();
  const fileInputRef = useRef(null);

  useEffect(() => { carregarMateriais(); }, []);

  const carregarMateriais = async () => {
      try {
          const res = await axios.get('http://127.0.0.1:8000/api/materiais/', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
          setMateriais(res.data);
      } catch (e) { toast({ title: 'Erro ao carregar', status: 'error' }); }
  };

  const abrirModal = (tipoPublico, m = null) => {
      setArquivo(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setPublicoAtivo(tipoPublico);

      if (m) {
          setForm({ id: m.id, titulo: m.titulo, descricao: m.descricao || '', conteudo: m.conteudo || '', categoria: m.categoria, ativo: m.ativo });
          setDadosExtras(m.dados_extras || {}); 
      } else {
          setForm({ id: null, titulo: '', descricao: '', conteudo: '', categoria: tipoPublico === 'ALUNO' ? 'ALUNO_MANUAL' : 'CORRETOR_CARTILHA', ativo: true });
          setDadosExtras({});
      }
      onOpen();
  };

  // 2. RENDERIZADOR DINÂMICO LIMPO (Apenas o necessário)
  const renderCamposDinamicos = () => {
      const cat = form.categoria;

      if (cat === 'ALUNO_REPERTORIO') {
          const topicos = dadosExtras.topicos || [];
          return (
              <VStack spacing={3} align="stretch" bg="purple.50" p={4} borderRadius="md" border="1px solid" borderColor="purple.200">
                  <Flex justify="space-between" align="center">
                      <Box>
                          <Text fontWeight="bold" fontSize="sm" color="purple.800">Tópicos do Eixo Temático</Text>
                          <Text fontSize="xs" color="purple.600">Crie blocos de leitura organizados para o aluno.</Text>
                      </Box>
                      <Button size="xs" colorScheme="purple" leftIcon={<AddIcon />} onClick={() => setDadosExtras({...dadosExtras, topicos: [...topicos, { titulo: '', texto: '' }]})}>Adicionar Tópico</Button>
                  </Flex>
                  {topicos.map((topico, idx) => (
                      <Box key={idx} bg="white" p={3} borderRadius="md" border="1px solid" borderColor="gray.200">
                          <Flex justify="space-between" align="center" mb={2}>
                              <Badge colorScheme="purple">Tópico {idx + 1}</Badge>
                              <IconButton size="xs" colorScheme="red" variant="ghost" icon={<DeleteIcon />} onClick={() => { const newT = [...topicos]; newT.splice(idx, 1); setDadosExtras({...dadosExtras, topicos: newT}); }} />
                          </Flex>
                          <FormControl mb={2}>
                              <FormLabel fontSize="xs" fontWeight="bold">Título do Tópico</FormLabel>
                              <Input size="sm" value={topico.titulo} onChange={e => { const newT = [...topicos]; newT[idx].titulo = e.target.value; setDadosExtras({...dadosExtras, topicos: newT})}} placeholder="Ex: Contexto Histórico, Teses Principais, etc..." />
                          </FormControl>
                          <FormControl>
                              <FormLabel fontSize="xs" fontWeight="bold">Conteúdo do Tópico</FormLabel>
                              <Textarea size="sm" rows={4} value={topico.texto} onChange={e => { const newT = [...topicos]; newT[idx].texto = e.target.value; setDadosExtras({...dadosExtras, topicos: newT})}} placeholder="Escreva o texto detalhado deste bloco..." />
                          </FormControl>
                      </Box>
                  ))}
                  {topicos.length === 0 && <Text fontSize="xs" color="purple.500" textAlign="center" py={2}>Nenhum tópico adicionado. Clique no botão acima para começar.</Text>}
              </VStack>
          );
      }

      if (cat === 'CORRETOR_REGUA') {
          const regras = dadosExtras.regras || [];
          return (
              <VStack spacing={3} align="stretch" bg="red.50" p={4} borderRadius="md" border="1px solid" borderColor="red.200">
                  <Flex justify="space-between" align="center">
                      <Box>
                          <Text fontWeight="bold" fontSize="sm" color="red.800">Tabela de Penalizações</Text>
                          <Text fontSize="xs" color="red.600">Regras absolutas de desconto de nota.</Text>
                      </Box>
                      <Button size="xs" colorScheme="red" leftIcon={<AddIcon />} onClick={() => setDadosExtras({...dadosExtras, regras: [...regras, { comp: 'C1', gatilho: '', desconto: '' }]})}>Adicionar Regra</Button>
                  </Flex>
                  {regras.map((regra, idx) => (
                      <Flex key={idx} gap={2} align="flex-end" bg="white" p={2} borderRadius="md" border="1px solid" borderColor="gray.200">
                          <FormControl w="80px">
                              <FormLabel fontSize="2xs">Comp.</FormLabel>
                              <Select size="sm" value={regra.comp} onChange={e => { const newR = [...regras]; newR[idx].comp = e.target.value; setDadosExtras({...dadosExtras, regras: newR})}}>
                                  <option value="C1">C1</option><option value="C2">C2</option><option value="C3">C3</option><option value="C4">C4</option><option value="C5">C5</option><option value="GERAL">Geral</option>
                              </Select>
                          </FormControl>
                          <FormControl flex={1}>
                              <FormLabel fontSize="2xs">Gatilho (Ação do Aluno)</FormLabel>
                              <Input size="sm" value={regra.gatilho} onChange={e => { const newR = [...regras]; newR[idx].gatilho = e.target.value; setDadosExtras({...dadosExtras, regras: newR})}} placeholder="Ex: Escreveu menos de 7 linhas" />
                          </FormControl>
                          <FormControl w="100px">
                              <FormLabel fontSize="2xs">Desconto</FormLabel>
                              <Input size="sm" value={regra.desconto} onChange={e => { const newR = [...regras]; newR[idx].desconto = e.target.value; setDadosExtras({...dadosExtras, regras: newR})}} placeholder="Nota ZERO" />
                          </FormControl>
                          <IconButton size="sm" colorScheme="red" variant="ghost" icon={<DeleteIcon />} onClick={() => { const newR = [...regras]; newR.splice(idx, 1); setDadosExtras({...dadosExtras, regras: newR}); }} />
                      </Flex>
                  ))}
                  {regras.length === 0 && <Text fontSize="xs" color="red.500" textAlign="center" py={2}>Nenhuma regra adicionada.</Text>}
              </VStack>
          );
      }

      if (cat === 'ALUNO_GRAMATICA') {
          return (
              <SimpleGrid columns={2} spacing={4} bg="green.50" p={4} borderRadius="md" border="1px solid" borderColor="green.200">
                  <Box gridColumn="span 2">
                      <Text fontWeight="bold" fontSize="sm" color="green.800">Exemplo Prático (Opcional)</Text>
                      <Text fontSize="xs" color="green.600">Mostre o contraste visual entre o erro e o acerto.</Text>
                  </Box>
                  <FormControl>
                      <FormLabel fontSize="xs" color="red.600">Como o aluno erra (Incorreto)</FormLabel>
                      <Input bg="white" size="sm" value={dadosExtras.ex_errado || ''} onChange={e => setDadosExtras({...dadosExtras, ex_errado: e.target.value})} placeholder="Ex: Assistir o filme" />
                  </FormControl>
                  <FormControl>
                      <FormLabel fontSize="xs" color="green.600">Como deveria ser (Correto)</FormLabel>
                      <Input bg="white" size="sm" value={dadosExtras.ex_correto || ''} onChange={e => setDadosExtras({...dadosExtras, ex_correto: e.target.value})} placeholder="Ex: Assistir ao filme" />
                  </FormControl>
              </SimpleGrid>
          )
      }
      return null;
  };

  const salvarMaterial = async () => {
      if (!form.titulo.trim()) return toast({ title: 'O título é obrigatório.', status: 'warning' });
      
      const precisaPDF = form.categoria === 'ALUNO_EXEMPLOS';
      if (precisaPDF && !arquivo && !form.id) return toast({ title: 'Esta categoria exige um anexo em PDF.', status: 'warning' });

      setLoading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('titulo', form.titulo);
      formData.append('descricao', form.descricao);
      formData.append('conteudo', form.conteudo);
      formData.append('categoria', form.categoria);
      formData.append('ativo', form.ativo ? 'true' : 'false');
      formData.append('dados_extras', JSON.stringify(dadosExtras));

      if (arquivo) formData.append('arquivo', arquivo);

      try {
          if (form.id) {
              await axios.patch(`http://127.0.0.1:8000/api/materiais/${form.id}/`, formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
              toast({ title: 'Material atualizado!', status: 'success' });
          } else {
              await axios.post('http://127.0.0.1:8000/api/materiais/', formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
              toast({ title: 'Material publicado!', status: 'success' });
          }
          onClose(); carregarMateriais();
      } catch (e) { toast({ title: 'Erro ao salvar', status: 'error' }); }
      setLoading(false);
  };

  const excluirMaterial = async (id) => {
      if (!window.confirm("Deseja excluir este material permanentemente?")) return;
      try {
          await axios.delete(`http://127.0.0.1:8000/api/materiais/${id}/`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
          toast({ title: 'Excluído com sucesso', status: 'info' }); carregarMateriais();
      } catch (e) {}
  };

  const toggleAtivo = async (m) => {
      try {
          await axios.patch(`http://127.0.0.1:8000/api/materiais/${m.id}/`, { ativo: !m.ativo }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
          carregarMateriais();
      } catch (e) {}
  };

  const matsAluno = materiais.filter(m => m.categoria.startsWith('ALUNO_') && m.titulo.toLowerCase().includes(buscaAluno.toLowerCase()) && (catAluno === 'TODOS' || m.categoria === catAluno));
  const matsCorretor = materiais.filter(m => m.categoria.startsWith('CORRETOR_') && m.titulo.toLowerCase().includes(buscaCorretor.toLowerCase()) && (catCorretor === 'TODOS' || m.categoria === catCorretor));

  const TabelaMateriais = ({ lista, publico }) => (
      <Card bg="white" shadow="sm" borderRadius="lg" overflowX="auto" border="1px solid" borderColor="gray.200">
          <Table variant="simple" style={{ tableLayout: 'fixed', width: '100%' }}>
              <Thead bg="gray.50"><Tr><Th w="35%" px={6}>Título do Material</Th><Th w="20%" px={4} textAlign="center">Categoria</Th><Th w="15%" px={4} textAlign="center">Formato</Th><Th w="15%" px={4} textAlign="center">Visibilidade</Th><Th w="15%" px={6} textAlign="center">Ações</Th></Tr></Thead>
              <Tbody>
                  {lista.map(m => {
                      const catInfo = TODAS_CAT[m.categoria];
                      const temTexto = m.conteudo && m.conteudo.length > 5;
                      const temExtra = Object.keys(m.dados_extras || {}).length > 0;
                      const temPDF = m.arquivo;
                      
                      return (
                          <Tr key={m.id} _hover={{ bg: 'gray.50' }} opacity={m.ativo ? 1 : 0.6}>
                              <Td px={6}><Text fontWeight="bold" color="gray.800" fontSize="sm" isTruncated>{m.titulo}</Text><Text fontSize="xs" color="gray.500" isTruncated>{m.descricao || 'Sem descrição'}</Text></Td>
                              <Td px={4} textAlign="center"><Badge colorScheme={catInfo?.cor || 'gray'} px={2} py={1} borderRadius="md" fontSize="2xs">{catInfo?.nome}</Badge></Td>
                              
                              <Td px={4} textAlign="center">
                                  <HStack justify="center" spacing={1}>
                                      {temTexto && <Badge colorScheme="blue" variant="outline" title="Texto na Plataforma"><Icon as={EditIcon} mr={1}/>Texto</Badge>}
                                      {temExtra && <Badge colorScheme="purple" variant="outline" title="Dados Estruturados"><Icon as={SearchIcon} mr={1}/>Estrutura</Badge>}
                                      {temPDF && <Badge colorScheme="red" variant="outline" title="PDF Anexado"><Icon as={AttachmentIcon} mr={1}/>PDF</Badge>}
                                  </HStack>
                              </Td>

                              <Td px={4} textAlign="center"><Switch colorScheme="teal" isChecked={m.ativo} onChange={() => toggleAtivo(m)} /></Td>
                              <Td px={6} textAlign="center"><HStack justify="center" spacing={2}><IconButton size="sm" icon={<EditIcon />} colorScheme="blue" variant="ghost" onClick={() => abrirModal(publico, m)} aria-label="Editar" /><IconButton size="sm" icon={<DeleteIcon />} colorScheme="red" variant="ghost" onClick={() => excluirMaterial(m.id)} aria-label="Excluir" /></HStack></Td>
                          </Tr>
                      );
                  })}
                  {lista.length === 0 && <Tr><Td colSpan={5} textAlign="center" py={10} color="gray.500">Nenhum material encontrado nesta categoria.</Td></Tr>}
              </Tbody>
          </Table>
      </Card>
  );

  const escondeTextoPrincipal = form.categoria === 'ALUNO_EXEMPLOS' || form.categoria === 'CORRETOR_REGUA';
  
  return (
      <Container maxW="container.xl" py={8} bg="gray.50" minH="100vh">
          <Box mb={6}>
              <Heading size="lg" color="teal.700">Biblioteca e Manuais</Heading>
              <Text color="gray.500">Crie conteúdos estruturados ou anexe PDFs para alunos e professores.</Text>
          </Box>

          <Tabs variant="unstyled" isLazy>
              <TabList borderBottom="2px solid" borderColor="gray.200" mb={6}>
                  <Tab _selected={{ color: 'teal.700', bg: 'teal.50', borderBottom: '3px solid', borderColor: 'teal.500', fontWeight: 'bold' }} px={6} py={3} borderTopRadius="md">🎓 Área do Aluno</Tab>
                  <Tab _selected={{ color: 'purple.700', bg: 'purple.50', borderBottom: '3px solid', borderColor: 'purple.500', fontWeight: 'bold' }} px={6} py={3} borderTopRadius="md">👨‍🏫 Área do Corretor</Tab>
              </TabList>
              
              <TabPanels>
                  {/* PAINEL DOS ALUNOS */}
                  <TabPanel p={0}>
                      <Flex gap={4} bg="white" p={5} borderRadius="xl" boxShadow="sm" align="center" border="1px solid" borderColor="gray.100" mb={6} wrap="wrap">
                          <InputGroup flex={1} minW="250px"><InputLeftElement pointerEvents='none'><SearchIcon color='gray.400'/></InputLeftElement><Input placeholder="Buscar material do aluno..." value={buscaAluno} onChange={e => setBuscaAluno(e.target.value)} /></InputGroup>
                          <Select w="250px" value={catAluno} onChange={e => setCatAluno(e.target.value)}><option value="TODOS">Todas as Categorias</option>{Object.entries(CAT_ALUNO).map(([k, v]) => <option key={k} value={k}>{v.nome}</option>)}</Select>
                          <Divider orientation="vertical" h="30px" display={{ base: 'none', md: 'block' }} />
                          <Button leftIcon={<AddIcon />} colorScheme="teal" onClick={() => abrirModal('ALUNO')}>Criar Material</Button>
                      </Flex>
                      <TabelaMateriais lista={matsAluno} publico="ALUNO" />
                  </TabPanel>

                  {/* PAINEL DOS CORRETORES */}
                  <TabPanel p={0}>
                      <Flex gap={4} bg="white" p={5} borderRadius="xl" boxShadow="sm" align="center" border="1px solid" borderColor="gray.100" mb={6} wrap="wrap">
                          <InputGroup flex={1} minW="250px"><InputLeftElement pointerEvents='none'><SearchIcon color='gray.400'/></InputLeftElement><Input placeholder="Buscar manual do corretor..." value={buscaCorretor} onChange={e => setBuscaCorretor(e.target.value)} /></InputGroup>
                          <Select w="250px" value={catCorretor} onChange={e => setCatCorretor(e.target.value)}><option value="TODOS">Todas as Categorias</option>{Object.entries(CAT_CORRETOR).map(([k, v]) => <option key={k} value={k}>{v.nome}</option>)}</Select>
                          <Divider orientation="vertical" h="30px" display={{ base: 'none', md: 'block' }} />
                          <Button leftIcon={<AddIcon />} colorScheme="purple" onClick={() => abrirModal('CORRETOR')}>Criar Manual</Button>
                      </Flex>
                      <TabelaMateriais lista={matsCorretor} publico="CORRETOR" />
                  </TabPanel>
              </TabPanels>
          </Tabs>

          <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl" scrollBehavior="inside">
              <ModalOverlay backdropFilter="blur(3px)" />
              <ModalContent borderRadius="xl">
                  <ModalHeader bg={publicoAtivo === 'ALUNO' ? 'teal.500' : 'purple.500'} color="white" borderTopRadius="xl">
                      {form.id ? 'Editar Conteúdo' : `Novo Conteúdo para ${publicoAtivo === 'ALUNO' ? 'Alunos' : 'Corretores'}`}
                  </ModalHeader>
                  <ModalCloseButton color="white" />
                  <ModalBody pb={6} pt={6}>
                      <VStack spacing={5} align="stretch">
                          <FormControl isRequired>
                              <FormLabel fontSize="sm" fontWeight="bold">Categoria Organizacional</FormLabel>
                              <Select value={form.categoria} onChange={e => { setForm({...form, categoria: e.target.value}); setDadosExtras({}); }} bg="gray.50">
                                  {Object.entries(publicoAtivo === 'ALUNO' ? CAT_ALUNO : CAT_CORRETOR).map(([key, info]) => (
                                      <option key={key} value={key}>{info.nome}</option>
                                  ))}
                              </Select>
                          </FormControl>

                          <FormControl isRequired>
                              <FormLabel fontSize="sm" fontWeight="bold">Título / Assunto</FormLabel>
                              <Input placeholder="Ex: Guia do Eixo de Saúde / Cartilha do MEC..." value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} />
                          </FormControl>

                          <FormControl>
                              <FormLabel fontSize="sm" fontWeight="bold">Descrição Curta (Resumo no Card)</FormLabel>
                              <Textarea rows={2} placeholder="Descreva brevemente o assunto..." value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
                          </FormControl>

                          {/* INJEÇÃO DO BLOCO DINÂMICO (JSON) */}
                          {renderCamposDinamicos()}

                          {/* TEXTO CORRIDO OPCIONAL */}
                          {!escondeTextoPrincipal && (
                              <FormControl>
                                  <Flex justify="space-between" align="center" mb={1}>
                                      <FormLabel fontSize="sm" fontWeight="bold" m={0}>
                                          {form.categoria === 'ALUNO_REPERTORIO' ? 'Orientações Gerais (Opcional)' : 'Texto Completo da Aula / Comunicado'}
                                      </FormLabel>
                                  </Flex>
                                  <Textarea rows={5} bg="gray.50" placeholder={form.categoria === 'ALUNO_REPERTORIO' ? "Oriente o aluno sobre os tópicos criados ou direcione a atenção dele para o anexo..." : "Escreva o conteúdo completo aqui..."} value={form.conteudo} onChange={e => setForm({...form, conteudo: e.target.value})} />
                              </FormControl>
                          )}

                          <FormControl p={4} bg="gray.50" borderRadius="md" border="1px dashed" borderColor="gray.300">
                              <FormLabel fontSize="sm" color="gray.700" fontWeight="bold">Anexar Arquivo PDF (Opcional)</FormLabel>
                              <Flex align="center" gap={3}>
                                  <Button size="sm" colorScheme="gray" leftIcon={<AttachmentIcon />} onClick={() => fileInputRef.current.click()}>Escolher PDF</Button>
                                  <Text fontSize="xs" color="gray.600" isTruncated maxW="200px">{arquivo ? arquivo.name : "Nenhum selecionado"}</Text>
                              </Flex>
                              <Input type="file" display="none" ref={fileInputRef} accept=".pdf" onChange={e => setArquivo(e.target.files[0])} />
                          </FormControl>

                          <FormControl display="flex" alignItems="center" pt={2} pb={2}>
                              <Switch colorScheme={publicoAtivo === 'ALUNO' ? 'teal' : 'purple'} isChecked={form.ativo} onChange={e => setForm({...form, ativo: e.target.checked})} id="ativo" />
                              <FormLabel htmlFor="ativo" mb="0" ml={2} fontSize="sm" fontWeight="bold">Material ativo e liberado para acesso</FormLabel>
                          </FormControl>
                      </VStack>
                  </ModalBody>
                  <ModalFooter bg="gray.50" borderTopRadius="none" borderRadius="xl">
                      <Button variant="ghost" mr={3} onClick={onClose}>Cancelar</Button>
                      <Button colorScheme={publicoAtivo === 'ALUNO' ? 'teal' : 'purple'} onClick={salvarMaterial} isLoading={loading}>Salvar Publicação</Button>
                  </ModalFooter>
              </ModalContent>
          </Modal>
      </Container>
  );
}

export default GestaoMateriais;