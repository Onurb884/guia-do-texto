import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import JoditEditor from 'jodit-react'; 

import {
  Container, Heading, Text, VStack, HStack, Button, Icon, Box, 
  useToast, Card, CardBody, Divider, Flex, Badge, Input, Select, 
  Textarea, IconButton, Image, FormControl, FormLabel,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  InputGroup, InputLeftElement, Collapse, Table, Thead, Tbody, Tr, Th, Td, useDisclosure, Switch, Tooltip,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay // <-- NOVOS IMPORTS DO ALERTA
} from '@chakra-ui/react';
import { 
  AddIcon, DeleteIcon, EditIcon, CheckCircleIcon, SmallCloseIcon, 
  AttachmentIcon, SearchIcon, ChevronDownIcon, ChevronUpIcon, CloseIcon, InfoIcon, WarningTwoIcon
} from '@chakra-ui/icons';

const COMPETENCIAS_ENEM = ["1. Escrita Formal", "2. Tema/Estrutura", "3. Argumentação", "4. Coesão", "5. Proposta"];
const COMPETENCIAS_SIMPLES = ["1. Clareza (25)", "2. Estrutura (25)", "3. Gramática (25)", "4. Pertinência (25)"];

const GlobalEditorStyles = () => (
    <style>{`
      .jodit-wysiwyg {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif !important;
          font-size: 16px !important;
          color: #2d3748 !important;
      }
      .jodit-wysiwyg ul { list-style-type: disc; padding-left: 24px !important; margin-bottom: 10px !important; }
      .jodit-wysiwyg ol { list-style-type: decimal; padding-left: 24px !important; margin-bottom: 10px !important; }
    `}</style>
);

function GerenciarTemas() {
  const [temas, setTemas] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');

  const [temaAtual, setTemaAtual] = useState({
    id: null, titulo: '', descricao: '', tipo: 'ENEM', ativo: true, motivadores: []
  });

  // ESTADOS DO NOVO ALERTA DE EXCLUSÃO
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [temaParaExcluir, setTemaParaExcluir] = useState(null);
  const cancelRef = useRef(); // Referência obrigatória para o botão "Cancelar" do Alerta

  const toast = useToast();
  const fileInputRef = useRef(null); 

  const configJodit = useMemo(() => ({
      language: 'pt_br', 
      readonly: false,
      placeholder: 'Digite o texto motivador ou cole uma imagem aqui...',
      toolbarAdaptive: false,
      statusbar: false, 
      askBeforePasteHTML: false, 
      askBeforePasteFromWord: false,
      defaultActionOnPaste: 'insert_as_html', 
      disablePlugins: ['add-new-line', 'about'], 
      uploader: { insertImageAsBase64URI: true },
      buttons: ['bold', 'italic', 'underline', 'strikethrough', '|', 'ul', 'ol', '|', 'align', 'font', 'fontsize', 'paragraph', '|', 'image', 'table', 'link', '|', 'undo', 'redo', 'eraser']
  }), []);

  useEffect(() => { carregarTemas(); }, []);

  const carregarTemas = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://127.0.0.1:8000/api/temas/', { headers: { Authorization: `Bearer ${token}` } });
      setTemas(res.data);
    } catch (e) {
      toast({ title: 'Erro ao carregar temas', status: 'error' });
    }
    setLoading(false);
  };

  const addMotivadorTexto = () => { setTemaAtual(prev => ({ ...prev, motivadores: [...prev.motivadores, { tipo: 'texto', conteudo: '', arquivo: null, isExpanded: true }] })); };
  const addMotivadorImagem = (e) => { const file = e.target.files[0]; if (!file) return; setTemaAtual(prev => ({ ...prev, motivadores: [...prev.motivadores, { tipo: 'imagem', conteudo: '', file: file, preview: URL.createObjectURL(file), isExpanded: true }] })); e.target.value = ''; };
  const removeMotivador = (index) => { setTemaAtual(prev => { const novos = [...prev.motivadores]; novos.splice(index, 1); return { ...prev, motivadores: novos }; }); };
  const clearFileMotivador = (index) => { setTemaAtual(prev => { const novos = [...prev.motivadores]; novos[index] = { ...novos[index], file: null, preview: null }; return { ...prev, motivadores: novos }; }); };
  const updateMotivadorTexto = (index, html) => { setTemaAtual(prev => { const novos = [...prev.motivadores]; novos[index] = { ...novos[index], conteudo: html }; return { ...prev, motivadores: novos }; }); };
  const toggleExpand = (index) => { setTemaAtual(prev => { const novos = [...prev.motivadores]; novos[index] = { ...novos[index], isExpanded: !novos[index].isExpanded }; return { ...prev, motivadores: novos }; }); };

  const abrirModalNovo = () => {
      setTemaAtual({ id: null, titulo: '', descricao: '', tipo: 'ENEM', ativo: true, motivadores: [] });
      onOpen();
  };

  const abrirModalEditar = (tema) => {
      const listaMotivadores = tema.motivadores ? tema.motivadores.map((m, i) => ({
          id: m.id || i, tipo: m.tipo, conteudo: m.tipo === 'texto' ? m.conteudo : '', 
          file: null, preview: m.tipo === 'imagem' ? m.arquivo : null, isExpanded: false 
      })) : [];
      setTemaAtual({ id: tema.id, titulo: tema.titulo, descricao: tema.descricao, tipo: tema.tipo || 'ENEM', ativo: tema.ativo !== false, motivadores: listaMotivadores });
      onOpen();
  };

  const toggleStatusRapido = async (tema) => {
      const novoStatus = !tema.ativo;
      const token = localStorage.getItem('token');
      try {
          await axios.patch(`http://127.0.0.1:8000/api/temas/${tema.id}/`, { ativo: novoStatus }, { headers: { Authorization: `Bearer ${token}` } });
          toast({ title: novoStatus ? "Tema Ativado" : "Tema Inativado", status: novoStatus ? "success" : "warning", duration: 2000 });
          carregarTemas();
      } catch (e) {
          toast({ title: "Erro ao mudar status", status: "error" });
      }
  };

  const handleSalvar = async () => {
      if (!temaAtual.titulo.trim() || !temaAtual.descricao.trim()) return toast({ title: "Atenção", description: "O título e a proposta são obrigatórios.", status: "warning" });
      setLoading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('titulo', temaAtual.titulo);
      formData.append('descricao', temaAtual.descricao);
      formData.append('tipo', temaAtual.tipo);
      formData.append('ativo', temaAtual.ativo ? 'true' : 'false'); 
      const listaParaJson = temaAtual.motivadores.map(m => ({ tipo: m.tipo, conteudo: m.tipo === 'texto' ? m.conteudo : '', url_existente: (m.preview && !m.file) ? m.preview : null }));
      formData.append('motivadores_json', JSON.stringify(listaParaJson));
      temaAtual.motivadores.forEach((item, index) => { if (item.tipo === 'imagem' && item.file) formData.append(`arquivo_${index}`, item.file); });

      try {
          const baseURL = 'http://127.0.0.1:8000/api/temas/';
          if (temaAtual.id) await axios.patch(`${baseURL}${temaAtual.id}/`, formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
          else await axios.post(baseURL, formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
          toast({ title: "Sucesso!", status: "success" });
          onClose();
          carregarTemas();
      } catch (e) { toast({ title: "Erro ao salvar", status: "error" }); } finally { setLoading(false); }
  };

  // --- NOVA LÓGICA DE EXCLUSÃO ---
  const abrirAlertaExclusao = (tema) => {
      setTemaParaExcluir(tema);
      setIsAlertOpen(true);
  };

  const confirmarExclusao = async () => {
      if (!temaParaExcluir) return;
      
      const token = localStorage.getItem('token');
      try {
          await axios.delete(`http://127.0.0.1:8000/api/temas/${temaParaExcluir.id}/`, { headers: { Authorization: `Bearer ${token}` }});
          toast({ title: "Proposta excluída", status: "success" });
          carregarTemas();
      } catch (e) { 
          // O Django retornou um erro, quase certamente porque o tema tem redações (ProtectedError)
          toast({ 
              title: "Não é possível excluir o tema", 
              description: "Este tema já foi utilizado por alunos. O correto é alterar o Status para 'INATIVO' para não comprometer o histórico de redações.",
              status: "warning", 
              duration: 7000, // Deixa na tela um pouco mais de tempo para o professor ler
              isClosable: true
          }); 
      } finally {
          setIsAlertOpen(false);
          setTemaParaExcluir(null);
      }
  };

  const temasFiltrados = temas.filter(t => {
      const matchTexto = t.titulo.toLowerCase().includes(busca.toLowerCase());
      const matchTipo = filtroTipo === 'TODOS' ? true : t.tipo === filtroTipo;
      const matchStatus = filtroStatus === 'TODOS' ? true : (filtroStatus === 'ATIVOS' ? t.ativo !== false : t.ativo === false);
      return matchTexto && matchTipo && matchStatus;
  });

  return (
    <Container maxW="full" py={8} px={{ base: 4, md: 8 }}>
      <GlobalEditorStyles />
      <VStack spacing={8} align="stretch">
        
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <Box>
                <Heading size="lg" color="teal.700">Banco de Propostas</Heading>
                <Text color="gray.500" fontSize="md">Gerencie os temas de redação disponíveis para os alunos.</Text>
            </Box>
            <Button leftIcon={<AddIcon />} colorScheme="teal" size="lg" shadow="md" onClick={abrirModalNovo}>
                Criar Nova Proposta
            </Button>
        </Flex>

        <Flex gap={4} bg="white" p={5} borderRadius="xl" boxShadow="sm" align="center" border="1px solid" borderColor="gray.100" wrap="wrap">
            <InputGroup flex={1} minW="250px">
                <InputLeftElement pointerEvents='none'><SearchIcon color='gray.400' /></InputLeftElement>
                <Input placeholder="Pesquisar por título..." value={busca} onChange={e => setBusca(e.target.value)} />
            </InputGroup>
            
            <Divider orientation="vertical" h="30px" display={{ base: 'none', md: 'block' }} />
            
            <Select w="150px" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                <option value="TODOS">Tipo: Todos</option>
                <option value="ENEM">ENEM</option>
                <option value="SIMPLES">Simples</option>
            </Select>

            <Select w="150px" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                <option value="TODOS">Status: Todos</option>
                <option value="ATIVOS">Ativos</option>
                <option value="INATIVOS">Inativos</option>
            </Select>
        </Flex>

        <Box bg="white" shadow="sm" borderRadius="lg" overflowX="auto" border="1px solid" borderColor="gray.200">
            <Table variant="simple" size="md" style={{ tableLayout: 'fixed', width: '100%' }}>
                <Thead bg="gray.50">
                    <Tr>
                        <Th w="6%" px={4}>Cód.</Th>
                        <Th w="64%" px={4}>Título do Tema</Th>
                        <Th w="10%" px={3} textAlign="center">Tipo</Th>
                        <Th w="10%" px={3} textAlign="center">Status</Th>
                        <Th w="10%" px={4} textAlign="center">Ações</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {temasFiltrados.map(tema => (
                    <Tr key={tema.id} _hover={{ bg: 'gray.50' }}>
                        <Td fontWeight="bold" color="gray.500" px={4}>#{tema.id}</Td>
                        
                        <Td fontWeight="medium" isTruncated px={4} title={tema.titulo}>
                            <Text noOfLines={2}>{tema.titulo}</Text>
                        </Td>
                        
                        <Td px={3} textAlign="center">
                            <Badge 
                                bg={tema.tipo === 'ENEM' ? 'green.50' : 'blue.50'} 
                                color={tema.tipo === 'ENEM' ? 'green.700' : 'blue.700'} 
                                px={2} py={1} borderRadius="md" fontWeight="bold" letterSpacing="wide" fontSize="xs"
                            >
                                {tema.tipo || 'ENEM'}
                            </Badge>
                        </Td>
                        
                        <Td px={3} textAlign="center">
                            <Button 
                                size="xs" 
                                colorScheme={tema.ativo !== false ? 'green' : 'red'} 
                                variant={tema.ativo !== false ? 'solid' : 'outline'}
                                onClick={() => toggleStatusRapido(tema)}
                                borderRadius="md"
                                fontWeight="bold"
                                letterSpacing="wide"
                                w="80px"
                            >
                                {tema.ativo !== false ? 'ATIVO' : 'INATIVO'}
                            </Button>
                        </Td>
                        
                        <Td px={4} textAlign="center">
                            <HStack spacing={2} justify="center">
                                <Tooltip label="Editar Tema" hasArrow placement="top">
                                    <IconButton size="sm" icon={<EditIcon />} colorScheme="blue" variant="ghost" onClick={() => abrirModalEditar(tema)} aria-label="Editar" />
                                </Tooltip>
                                <Tooltip label="Excluir Tema" hasArrow placement="top">
                                    {/* MUDANÇA: Agora chama a função que abre o modal estilizado */}
                                    <IconButton size="sm" icon={<DeleteIcon />} colorScheme="red" variant="ghost" onClick={() => abrirAlertaExclusao(tema)} aria-label="Excluir" />
                                </Tooltip>
                            </HStack>
                        </Td>
                    </Tr>
                    ))}
                    {temasFiltrados.length === 0 && (
                        <Tr>
                            <Td colSpan={5} textAlign="center" py={6} color="gray.500">
                                Nenhum tema encontrado.
                            </Td>
                        </Tr>
                    )}
                </Tbody>
            </Table>
        </Box>
      </VStack>

      {/* --- O ALERTA DE EXCLUSÃO ESTILIZADO FICA AQUI --- */}
      <AlertDialog
        isOpen={isAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsAlertOpen(false)}
        isCentered
      >
        <AlertDialogOverlay backdropFilter="blur(3px)" />
        <AlertDialogContent borderRadius="xl" shadow="2xl">
          <AlertDialogHeader fontSize="lg" fontWeight="bold" bg="red.50" color="red.700" borderTopRadius="xl">
            <HStack><WarningTwoIcon /> <Text>Confirmar Exclusão</Text></HStack>
          </AlertDialogHeader>

          <AlertDialogBody py={6}>
            Tem certeza que deseja excluir o tema <strong>{temaParaExcluir?.titulo}</strong>?<br/><br/>
            Se este tema já tiver redações enviadas pelos alunos, o sistema não permitirá a exclusão. Neste caso, o recomendado é apenas marcá-lo como <strong>INATIVO</strong>.
          </AlertDialogBody>

          <AlertDialogFooter borderTop="1px solid" borderColor="gray.100">
            <Button ref={cancelRef} onClick={() => setIsAlertOpen(false)}>
              Cancelar
            </Button>
            <Button colorScheme="red" onClick={confirmarExclusao} ml={3} shadow="md">
              Sim, Excluir Tema
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside" closeOnOverlayClick={false}>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent borderRadius="xl" maxW="900px" boxShadow="2xl">
            <ModalHeader bg="gray.50" borderBottom="1px solid" borderColor="gray.200" py={5}>
                <Heading size="md" color="gray.700">{temaAtual.id ? 'Editar Proposta de Redação' : 'Nova Proposta de Redação'}</Heading>
            </ModalHeader>
            <ModalCloseButton />
            
            <ModalBody py={8} px={8}>
                <VStack spacing={8} align="stretch">
                    
                    <Flex gap={6} direction={{ base: 'column', md: 'row' }}>
                        <FormControl isRequired flex={2}>
                            <FormLabel fontWeight="bold" color="gray.700">Título da Proposta</FormLabel>
                            <Input placeholder="Ex: Os desafios da inteligência artificial no Brasil" value={temaAtual.titulo} onChange={e => setTemaAtual({...temaAtual, titulo: e.target.value})} focusBorderColor="teal.500" size="lg" />
                        </FormControl>

                        <FormControl isRequired flex={1}>
                            <FormLabel fontWeight="bold" color="gray.700">Modelo de Correção</FormLabel>
                            <Select value={temaAtual.tipo} onChange={e => setTemaAtual({...temaAtual, tipo: e.target.value})} size="lg" bg={temaAtual.tipo === 'ENEM' ? 'green.50' : 'blue.50'} focusBorderColor="teal.500">
                                <option value="ENEM">ENEM (1000 pts)</option>
                                <option value="SIMPLES">Simples (100 pts)</option>
                            </Select>
                        </FormControl>

                        <FormControl w="100px" display="flex" flexDirection="column" alignItems="center">
                            <FormLabel fontWeight="bold" color="gray.700">Ativo</FormLabel>
                            <Switch colorScheme="teal" size="lg" isChecked={temaAtual.ativo} onChange={e => setTemaAtual({...temaAtual, ativo: e.target.checked})} />
                        </FormControl>
                    </Flex>

                    <Box p={4} bg="blue.50" borderRadius="md" border="1px dashed" borderColor="blue.200">
                        <HStack mb={1} color="blue.700"><Icon as={InfoIcon} /><Text fontSize="sm" fontWeight="bold">Dicas de Formatação Rápidas:</Text></HStack>
                        <Text fontSize="xs" color="blue.800" lineHeight="1.6">
                            Você pode usar atalhos para formatar as palavras na proposta de redação e nos textos motivadores!<br/>
                            • Digite <b>*palavra*</b> para deixá-la em <strong>negrito</strong>.<br/>
                            • Digite <b>_palavra_</b> para deixá-la em <em>itálico</em>.<br/>
                            • Digite <b>~palavra~</b> para deixá-la <u>sublinhada</u>.
                        </Text>
                    </Box>

                    <FormControl isRequired>
                        <FormLabel fontWeight="bold" color="gray.700">Comando da Proposta (Instruções)</FormLabel>
                        <Textarea placeholder="Ex: A partir da leitura dos textos motivadores..." rows={5} value={temaAtual.descricao} onChange={e => setTemaAtual({...temaAtual, descricao: e.target.value})} focusBorderColor="teal.500" />
                    </FormControl>

                    <Divider borderColor="gray.300" />

                    <Box bg="gray.50" p={5} borderRadius="lg" border="1px dashed" borderColor="gray.300">
                        <Flex justify="space-between" align="center" mb={4}>
                            <Box><Heading size="sm" color="gray.700">Textos Motivadores</Heading></Box>
                        </Flex>

                        <VStack spacing={4} align="stretch" mb={6}>
                            {temaAtual.motivadores.map((item, index) => (
                                <Box key={index} border="1px solid" borderColor="gray.200" borderRadius="md" overflow="hidden" bg="white" shadow="sm">
                                    <Flex bg="gray.100" p={3} justify="space-between" align="center" cursor="pointer" onClick={() => toggleExpand(index)}>
                                        <HStack spacing={3}>
                                            <Icon as={item.isExpanded ? ChevronUpIcon : ChevronDownIcon} color="gray.500" />
                                            <Badge colorScheme={item.tipo === 'texto' ? 'orange' : 'purple'} variant="solid">Motivador {index + 1} ({item.tipo})</Badge>
                                        </HStack>
                                        <IconButton icon={<SmallCloseIcon />} size="xs" colorScheme="red" variant="ghost" onClick={(e) => { e.stopPropagation(); removeMotivador(index); }} />
                                    </Flex>
                                    
                                    <Collapse in={item.isExpanded} animateOpacity>
                                        <Box p={4}>
                                            {item.tipo === 'texto' ? (
                                                <Box>
                                                    <JoditEditor
                                                        value={item.conteudo}
                                                        config={configJodit}
                                                        onBlur={newContent => updateMotivadorTexto(index, newContent)}
                                                    />
                                                </Box>
                                            ) : (
                                                <VStack>
                                                    <Box w="full" textAlign="center" p={4} border="2px dashed" borderColor="teal.100" borderRadius="md" bg="teal.50" position="relative">
                                                        {item.preview ? (<Image src={item.preview} maxH="300px" objectFit="contain" mx="auto" borderRadius="md" shadow="sm" />) : (<Text fontSize="sm" color="gray.500">Nenhuma imagem selecionada</Text>)}
                                                        {item.preview && (<IconButton icon={<CloseIcon />} size="sm" colorScheme="red" position="absolute" top={2} right={2} onClick={() => clearFileMotivador(index)} shadow="md" />)}
                                                    </Box>
                                                </VStack>
                                            )}
                                        </Box>
                                    </Collapse>
                                </Box>
                            ))}
                        </VStack>

                        <HStack spacing={4}>
                            <Button leftIcon={<EditIcon />} onClick={addMotivadorTexto} colorScheme="orange" variant="outline" w="full" borderStyle="dashed">Adicionar Texto Rico</Button>
                            <Button leftIcon={<AttachmentIcon />} onClick={() => fileInputRef.current.click()} colorScheme="purple" variant="outline" w="full" borderStyle="dashed">Upload de Imagem</Button>
                            <Input type="file" display="none" ref={fileInputRef} accept="image/*" onChange={addMotivadorImagem} />
                        </HStack>
                    </Box>

                </VStack>
            </ModalBody>

            <ModalFooter bg="gray.50" borderTop="1px solid" borderColor="gray.200" py={4}>
                <Button variant="ghost" mr={3} size="lg" onClick={onClose}>Cancelar</Button>
                <Button colorScheme="teal" size="lg" onClick={handleSalvar} isLoading={loading} leftIcon={<CheckCircleIcon />} shadow="md">
                    {temaAtual.id ? 'Salvar Alterações' : 'Publicar Proposta'}
                </Button>
            </ModalFooter>
        </ModalContent>
      </Modal>

    </Container>
  );
}

export default GerenciarTemas;