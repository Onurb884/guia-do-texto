import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Heading, Text, VStack, HStack, Button, Box, 
  useToast, Flex, Badge, Input, Select, InputGroup, InputLeftElement, 
  Table, Thead, Tbody, Tr, Th, Td, Card, CardBody, SimpleGrid, Stat, StatLabel, 
  StatNumber, Avatar, Divider, useDisclosure,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, 
  FormControl, FormLabel, IconButton, Textarea, Spinner, Tooltip,
  Alert, AlertIcon // <--- O ERRO ESTAVA AQUI! Faltava importar isto!
} from '@chakra-ui/react';
import { 
    SearchIcon, CheckCircleIcon, NotAllowedIcon, DownloadIcon, 
    ArrowBackIcon, TimeIcon, AddIcon, EditIcon, StarIcon, LockIcon
} from '@chakra-ui/icons';

// FUNÇÃO SUPER SEGURA PARA A FOTO NÃO QUEBRAR O REACT
const getUrlFoto = (url) => {
    if (!url || typeof url !== 'string') return undefined;
    if (url.startsWith('http')) return url;
    return `http://127.0.0.1:8000${url}`;
};

function GestaoUsuarios() {

  // Novos estados para a Gestão de Créditos
  const [modalCreditosOpen, setModalCreditosOpen] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [qtdSimples, setQtdSimples] = useState(0);
  const [qtdVip, setQtdVip] = useState(0);
  const [motivoCredito, setMotivoCredito] = useState('');
  const [enviandoCredito, setEnviandoCredito] = useState(false);

  const abrirModalCreditos = (usuario) => {
      setAlunoSelecionado(usuario);
      setQtdSimples(0);
      setQtdVip(0);
      setMotivoCredito('');
      setModalCreditosOpen(true);
  };

  const handleAdicionarCreditos = async () => {
      if (qtdSimples === 0 && qtdVip === 0) return toast({ title: "Adicione pelo menos 1 crédito.", status: "warning" });
      
      setEnviandoCredito(true);
      try {
          const token = localStorage.getItem('token');
          await axios.post(`http://127.0.0.1:8000/api/gestao/usuarios/${alunoSelecionado.id}/creditos/`, {
              qtd_simples: qtdSimples,
              qtd_vip: qtdVip,
              motivo: motivoCredito
          }, { headers: { Authorization: `Bearer ${token}` } });
          
          toast({ title: "Créditos atualizados!", status: "success" });
          setModalCreditosOpen(false);
          carregarDados();
      } catch (error) {
          toast({ title: "Erro ao adicionar créditos", description: error.response?.data?.erro, status: "error" });
      }
      setEnviandoCredito(false);
  };
    
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroPapel, setFiltroPapel] = useState('TODOS');
  const [filtroStatus, setFiltroStatus] = useState('TODOS'); 
  
  const [viewMode, setViewMode] = useState('LIST');
  const [usuarioAtivo, setUsuarioAtivo] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  const { isOpen: isNewOpen, onOpen: onNewOpen, onClose: onNewClose } = useDisclosure();
  const [novoAdmin, setNovoAdmin] = useState({ first_name: '', last_name: '', email: '', password: '', perfil_acesso: 'ALUNO' });
  const [salvandoAdmin, setSalvandoAdmin] = useState(false);

  // CONTROLE DO MODAL DE EDIÇÃO
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const [dadosEdicao, setDadosEdicao] = useState({ 
      first_name: '', last_name: '', email: '', password: '',
      is_staff: false, is_superuser: false, is_financeiro: false, is_coordenador: false, is_corretor: false 
  });

  const toast = useToast();

  useEffect(() => { 
      carregarDados(); 
      verificarPermissoesLogadas();
  }, []);

  const verificarPermissoesLogadas = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/me/', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCurrentUser(res.data);
    } catch (e) {
      // Ignora silenciosamente, o login falhou ou token expirou
    }
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://127.0.0.1:8000/api/gestao/usuarios/', { headers: { Authorization: `Bearer ${token}` } });
      setUsuarios(res.data);
    } catch (e) { toast({ title: 'Erro ao carregar dados', status: 'error' }); }
    setLoading(false);
  };

  // ==============================================================================
  // HELPERS: IDENTIFICAÇÃO DE CARGOS E CORES
  // ==============================================================================
  const isMaster = currentUser ? currentUser.is_superuser : false;

  const getPapelUsuario = (u) => {
    if (!u) return 'ALUNO';
    if (u.is_superuser) return 'MASTER';
    if (u.is_financeiro) return 'FINANCEIRO';
    if (u.is_coordenador) return 'COORDENADOR';
    if (u.is_corretor) return 'CORRETOR';
    if (u.is_staff) return 'COORDENADOR'; 
    return 'ALUNO';
  };

  const renderBadgePapel = (papel) => {
    switch(papel) {
      case 'MASTER': return <Badge colorScheme="blackAlpha" bg="black" color="white" px={2} py={0.5} borderRadius="md">👑 Admin Master</Badge>;
      case 'FINANCEIRO': return <Badge colorScheme="green" px={2} py={0.5} borderRadius="md">💰 Financeiro</Badge>;
      case 'COORDENADOR': return <Badge colorScheme="purple" px={2} py={0.5} borderRadius="md">🛡️ Coordenador</Badge>;
      case 'CORRETOR': return <Badge colorScheme="teal" px={2} py={0.5} borderRadius="md">📝 Professor</Badge>;
      default: return <Badge colorScheme="gray" variant="outline" px={2} py={0.5} borderRadius="md">🎓 Aluno</Badge>;
    }
  };

  // ==============================================================================
  // AÇÕES: GERIR PERFIS, CRIAR E EDITAR
  // ==============================================================================

  const abrirPerfil = (u) => {
      let formacoesArray = [];
      let expArray = [];
      try { formacoesArray = typeof u.formacoes === 'string' ? JSON.parse(u.formacoes) : (u.formacoes || []); } catch (e) {}
      try { expArray = typeof u.experiencias === 'string' ? JSON.parse(u.experiencias) : (u.experiencias || []); } catch (e) {}

      setUsuarioAtivo({ ...u, formacoes: formacoesArray, experiencias: expArray });
      setViewMode('PROFILE');
  };

  const prepararEdicao = () => {
      setDadosEdicao({
          first_name: usuarioAtivo.first_name || '',
          last_name: usuarioAtivo.last_name || '',
          email: usuarioAtivo.email || '',
          password: '',
          is_staff: usuarioAtivo.is_staff || false,
          is_superuser: usuarioAtivo.is_superuser || false,
          is_financeiro: usuarioAtivo.is_financeiro || false,
          is_coordenador: usuarioAtivo.is_coordenador || false,
          is_corretor: usuarioAtivo.is_corretor || false
      });
      onEditOpen();
  };

  const salvarEdicao = async () => {
    try {
        const token = localStorage.getItem('token');
        
        // Criar um payload focado que o backend entende
        const payload = {
            first_name: dadosEdicao.first_name,
            last_name: dadosEdicao.last_name,
            email: dadosEdicao.email,
        };
        if (dadosEdicao.password && dadosEdicao.password.trim() !== '') {
            payload.password = dadosEdicao.password;
        }

        // Definir a tag nivel_acesso para o backend
        if (dadosEdicao.is_superuser) payload.nivel_acesso = 'MASTER';
        else if (dadosEdicao.is_financeiro) payload.nivel_acesso = 'FINANCEIRO';
        else if (dadosEdicao.is_coordenador || dadosEdicao.is_staff) payload.nivel_acesso = 'COORDENADOR';
        else if (dadosEdicao.is_corretor) payload.nivel_acesso = 'CORRETOR';
        else payload.nivel_acesso = 'ALUNO';

        const res = await axios.put(`http://127.0.0.1:8000/api/gestao/usuarios/${usuarioAtivo.id}/`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast({ title: 'Dados atualizados com sucesso!', status: 'success' });
        
        setUsuarioAtivo({ ...usuarioAtivo, ...res.data });
        carregarDados();
        onEditClose();
    } catch (e) {
        toast({ title: 'Erro ao atualizar dados', description: e.response?.data?.erro, status: 'error' });
    }
  };

  const toggleAtivo = async (id, is_active) => {
    try {
        const token = localStorage.getItem('token');
        await axios.patch(`http://127.0.0.1:8000/api/gestao/usuarios/${id}/`, { is_active: !is_active }, { headers: { Authorization: `Bearer ${token}` } });
        carregarDados(); 
        if (usuarioAtivo && usuarioAtivo.id === id) setUsuarioAtivo({...usuarioAtivo, is_active: !is_active});
        toast({ title: !is_active ? 'Conta Aprovada/Reativada!' : 'Acesso Suspenso!', status: 'success' });
    } catch (e) { toast({ title: 'Erro ao alterar status', status: 'error' }); }
  };

  const abrirNovaConta = () => {
    setNovoAdmin({ 
        first_name: '', last_name: '', email: '', password: '', 
        perfil_acesso: isMaster ? 'COORDENADOR' : 'CORRETOR' 
    });
    onNewOpen();
  };

  const criarMembroEquipe = async () => {
    if (!novoAdmin.first_name || !novoAdmin.email || !novoAdmin.password) return toast({ title: 'Preencha todos os campos obrigatórios', status: 'warning' });
    setSalvandoAdmin(true);
    
    // Convertendo para payload JSON para respeitar a nova API de cargos
    const payload = {
        first_name: novoAdmin.first_name,
        last_name: novoAdmin.last_name,
        email: novoAdmin.email,
        password: novoAdmin.password,
        nivel_acesso: novoAdmin.perfil_acesso
    };

    try {
        const token = localStorage.getItem('token');
        await axios.post('http://127.0.0.1:8000/api/gestao/usuarios/', payload, { headers: { Authorization: `Bearer ${token}` } });
        toast({ title: 'Usuário adicionado!', status: 'success' });
        carregarDados();
        onNewClose();
        setNovoAdmin({ first_name: '', last_name: '', email: '', password: '', perfil_acesso: 'ALUNO' });
    } catch (e) { toast({ title: 'Erro ao criar conta', description: e.response?.data?.erro, status: 'error' }); }
    setSalvandoAdmin(false);
  };

  const listaFiltrada = usuarios.filter(u => {
      const matchBusca = (u.first_name || '').toLowerCase().includes(busca.toLowerCase()) || (u.email || '').toLowerCase().includes(busca.toLowerCase());
      
      const papel = getPapelUsuario(u);
      let matchPapel = true;
      if (filtroPapel === 'CORRETOR') matchPapel = papel === 'CORRETOR';
      if (filtroPapel === 'ALUNO') matchPapel = papel === 'ALUNO';
      if (filtroPapel === 'ADMIN') matchPapel = ['MASTER', 'FINANCEIRO', 'COORDENADOR'].includes(papel);
      
      let matchStatus = true;
      if (filtroStatus === 'ATIVOS') matchStatus = u.is_active;
      if (filtroStatus === 'SUSPENSOS') matchStatus = !u.is_active;
      return matchBusca && matchPapel && matchStatus;
  });

  const qtdAlunos = usuarios.filter(u => getPapelUsuario(u) === 'ALUNO').length;
  const qtdCorretores = usuarios.filter(u => getPapelUsuario(u) === 'CORRETOR').length;
  const qtdPendentes = usuarios.filter(u => !u.is_active && u.is_corretor).length;

  if (loading && usuarios.length === 0) return <Flex w="full" h="100vh" align="center" justify="center"><Spinner size="xl" color="teal.500" /></Flex>;

  if (viewMode === 'PROFILE' && usuarioAtivo) {
      const papel = getPapelUsuario(usuarioAtivo);
      return (
          <Container maxW="full" py={8} px={{ base: 4, md: 8 }} bg="gray.50" minH="100vh">
              <Flex justify="space-between" align="center" mb={6}>
                  <Button leftIcon={<ArrowBackIcon />} variant="ghost" onClick={() => setViewMode('LIST')}>Voltar para Lista</Button>
                  <HStack spacing={4}>
                      <Tooltip label={(papel === 'MASTER' && !isMaster) ? "Acesso Restrito" : "Editar Dados"} hasArrow>
                          <Button leftIcon={<EditIcon />} colorScheme="blue" variant="outline" onClick={prepararEdicao} isDisabled={papel === 'MASTER' && !isMaster}>
                              Editar Dados
                          </Button>
                      </Tooltip>
                      {!usuarioAtivo.is_active ? (
                          <Button colorScheme="green" size="lg" leftIcon={<CheckCircleIcon />} onClick={() => toggleAtivo(usuarioAtivo.id, usuarioAtivo.is_active)} shadow="md">Aprovar Candidatura</Button>
                      ) : (
                          <Button colorScheme="red" variant="outline" size="md" leftIcon={<NotAllowedIcon />} onClick={() => toggleAtivo(usuarioAtivo.id, usuarioAtivo.is_active)}>Suspender Usuário</Button>
                      )}
                  </HStack>
              </Flex>

              <VStack spacing={6} align="stretch">
                  <Card bg="white" shadow="sm" borderRadius="xl" overflow="hidden" border="1px solid" borderColor="gray.200">
                      <Box bgGradient="linear(to-r, teal.600, blue.600)" h="120px" w="full"></Box>
                      <CardBody px={{ base: 4, md: 8 }} pb={8}>
                          <Flex direction={{ base: 'column', md: 'row' }} align={{ base: 'center', md: 'flex-start' }} gap={6}>
                              <Box mt="-60px">
                                  {/* FOTO SEGURA E CORRIGIDA AQUI */}
                                  <Avatar size="2xl" name={`${usuarioAtivo.first_name || ''} ${usuarioAtivo.last_name || ''}`.trim()} src={getUrlFoto(usuarioAtivo.foto_perfil)} border="4px solid white" shadow="md" bg="teal.500" color="white" />
                              </Box>
                              <Box flex="1" textAlign={{ base: 'center', md: 'left' }} pt={2}>
                                  <Heading size="lg" color="gray.800" lineHeight="1.2">{usuarioAtivo.first_name} {usuarioAtivo.last_name}</Heading>
                                  <Text fontSize="md" color="gray.500" fontWeight="medium" mt={1}>{usuarioAtivo.email}</Text>
                              </Box>
                              <Box textAlign={{ base: 'center', md: 'right' }} pt={2}>
                                  {usuarioAtivo.is_active ? (
                                      <Badge colorScheme="green" fontSize="sm" px={3} py={1} borderRadius="full"><CheckCircleIcon mr={1}/> CONTA ATIVA</Badge>
                                  ) : (
                                      <Badge colorScheme="orange" fontSize="sm" px={3} py={1} borderRadius="full"><TimeIcon mr={1}/> AGUARDANDO APROVAÇÃO</Badge>
                                  )}
                              </Box>
                          </Flex>
                          
                          <HStack spacing={6} justify={{ base: 'center', md: 'flex-start' }} mt={6} wrap="wrap">
                              {usuarioAtivo.telefone && <Text color="gray.600">📱 {usuarioAtivo.telefone}</Text>}
                              {usuarioAtivo.cpf && <Text color="gray.600">🪪 CPF: {usuarioAtivo.cpf}</Text>}
                              {usuarioAtivo.curriculo && (
                                  <Button as="a" href={getUrlFoto(usuarioAtivo.curriculo)} target="_blank" size="sm" colorScheme="blue" variant="outline" leftIcon={<DownloadIcon />}>
                                      Baixar PDF Original
                                  </Button>
                              )}
                          </HStack>
                      </CardBody>
                  </Card>

                  <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
                      <VStack spacing={6} align="stretch" gridColumn={{ lg: 'span 2' }}>
                          
                          {usuarioAtivo.minibio && (
                              <Card bg="white" shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.200">
                                  <CardBody p={8}>
                                      <Heading size="sm" color="gray.700" mb={4}>Resumo Profissional</Heading>
                                      <Text color="gray.600" lineHeight="relaxed">{usuarioAtivo.minibio}</Text>
                                  </CardBody>
                              </Card>
                          )}

                          <Card bg="white" shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.200">
                              <CardBody p={8}>
                                  <Heading size="sm" color="gray.700" mb={6}>Experiência Profissional</Heading>
                                  {usuarioAtivo.experiencias && usuarioAtivo.experiencias.length > 0 ? (
                                      <VStack align="stretch" spacing={6}>
                                          {usuarioAtivo.experiencias.map((exp, idx) => (
                                              <Box key={idx} p={4} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.100">
                                                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                                                      <Box><Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase">Cargo / Função</Text><Text color="gray.800" fontWeight="bold">{exp.cargo || '--'}</Text></Box>
                                                      <Box><Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase">Local / Empresa</Text><Text color="teal.600" fontWeight="medium">{exp.local || exp.empresa || '--'}</Text></Box>
                                                      <Box><Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase">Período</Text><Text color="gray.600">{exp.periodo || '--'}</Text></Box>
                                                  </SimpleGrid>
                                              </Box>
                                          ))}
                                      </VStack>
                                  ) : (<Text color="gray.400" fontStyle="italic">Nenhuma experiência cadastrada.</Text>)}
                              </CardBody>
                          </Card>

                          <Card bg="white" shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.200">
                              <CardBody p={8}>
                                  <Heading size="sm" color="gray.700" mb={6}>Formação Acadêmica</Heading>
                                  {usuarioAtivo.formacoes && usuarioAtivo.formacoes.length > 0 ? (
                                      <VStack align="stretch" spacing={6}>
                                          {usuarioAtivo.formacoes.map((form, idx) => (
                                              <Box key={idx} p={4} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.100">
                                                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                                                      <Box><Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase">Instituição</Text><Text color="gray.800" fontWeight="bold">{form.instituicao || '--'}</Text></Box>
                                                      <Box><Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase">Curso / Titulação</Text><Text color="teal.600" fontWeight="medium">{form.curso || '--'}</Text></Box>
                                                      <Box><Text fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase">Ano de Conclusão</Text><Text color="gray.600">{form.ano || '--'}</Text></Box>
                                                  </SimpleGrid>
                                              </Box>
                                          ))}
                                      </VStack>
                                  ) : (<Text color="gray.400" fontStyle="italic">Nenhuma formação cadastrada.</Text>)}
                              </CardBody>
                          </Card>
                      </VStack>

                      <VStack spacing={6} align="stretch" gridColumn={{ lg: 'span 1' }}>
                          <Card bg="white" shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.200">
                              <CardBody p={6}>
                                  <Heading size="sm" color="gray.700" mb={4}>Nível de Acesso</Heading>
                                  <VStack align="stretch" spacing={3}>
                                      <Box>
                                          <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">Cargo na Plataforma</Text>
                                          <Box mt={2}>{renderBadgePapel(papel)}</Box>
                                      </Box>
                                  </VStack>
                              </CardBody>
                          </Card>

                          {/* DADOS BANCÁRIOS APARECEM PARA EQUIPA E CORRETORES */}
                          {(papel !== 'ALUNO') && (
                              <Card bg="green.50" shadow="sm" borderRadius="xl" border="1px solid" borderColor="green.200">
                                  <CardBody p={6}>
                                      <Heading size="sm" color="green.800" mb={4}>Dados Financeiros</Heading>
                                      <VStack align="stretch" spacing={4}>
                                          <Box><Text fontSize="xs" color="green.600" fontWeight="bold" textTransform="uppercase">Chave PIX ({usuarioAtivo.tipo_chave_pix || 'Não inf.'})</Text><Text color="gray.800" fontWeight="bold">{usuarioAtivo.chave_pix || 'Não cadastrada'}</Text></Box>
                                          {(usuarioAtivo.banco || usuarioAtivo.agencia_conta) && (
                                              <><Divider borderColor="green.300" /><Box><Text fontSize="xs" color="green.600" fontWeight="bold" textTransform="uppercase">Conta Bancária</Text><Text color="gray.800" fontSize="sm">{usuarioAtivo.banco}</Text><Text color="gray.800" fontSize="sm">{usuarioAtivo.agencia_conta}</Text></Box></>
                                          )}
                                      </VStack>
                                  </CardBody>
                              </Card>
                          )}
                      </VStack>
                  </SimpleGrid>

                  {/* MODAL DE EDIÇÃO DO USUÁRIO ATIVO */}
                  <Modal isOpen={isEditOpen} onClose={onEditClose} isCentered size="lg">
                      <ModalOverlay backdropFilter="blur(4px)" />
                      <ModalContent borderRadius="xl">
                          <ModalHeader color="teal.700">Editar Dados Administrativos</ModalHeader>
                          <ModalCloseButton />
                          <ModalBody>
                              <VStack spacing={4}>
                                  <SimpleGrid columns={2} spacing={4} w="full">
                                      <FormControl>
                                          <FormLabel>Nome</FormLabel>
                                          <Input value={dadosEdicao.first_name} onChange={e => setDadosEdicao({...dadosEdicao, first_name: e.target.value})} />
                                      </FormControl>
                                      <FormControl>
                                          <FormLabel>Sobrenome</FormLabel>
                                          <Input value={dadosEdicao.last_name} onChange={e => setDadosEdicao({...dadosEdicao, last_name: e.target.value})} />
                                      </FormControl>
                                  </SimpleGrid>
                                  <FormControl>
                                      <FormLabel>E-mail (Usado no Login)</FormLabel>
                                      <Input type="email" value={dadosEdicao.email} onChange={e => setDadosEdicao({...dadosEdicao, email: e.target.value})} />
                                  </FormControl>
                                  
                                  <FormControl>
                                      <FormLabel>Nova Senha (Opcional)</FormLabel>
                                      <InputGroup>
                                        <InputLeftElement pointerEvents='none'><LockIcon color='gray.300' /></InputLeftElement>
                                        <Input type="text" placeholder="Deixe em branco para não alterar" value={dadosEdicao.password} onChange={e => setDadosEdicao({...dadosEdicao, password: e.target.value})} />
                                      </InputGroup>
                                  </FormControl>
                                  
                                  <Divider my={2} />
                                  
                                  <FormControl>
                                      <FormLabel>Nível de Acesso</FormLabel>
                                      <Select value={
                                          dadosEdicao.is_superuser ? 'MASTER' : 
                                          dadosEdicao.is_financeiro ? 'FINANCEIRO' : 
                                          (dadosEdicao.is_staff || dadosEdicao.is_coordenador) ? 'COORDENADOR' : 
                                          dadosEdicao.is_corretor ? 'CORRETOR' : 'ALUNO'
                                      } onChange={e => {
                                          const v = e.target.value;
                                          setDadosEdicao({
                                              ...dadosEdicao,
                                              is_superuser: v === 'MASTER',
                                              is_financeiro: v === 'FINANCEIRO',
                                              is_coordenador: v === 'COORDENADOR' || v === 'MASTER',
                                              is_staff: ['MASTER', 'FINANCEIRO', 'COORDENADOR'].includes(v),
                                              is_corretor: v === 'CORRETOR'
                                          });
                                      }}>
                                          {isMaster && <option value="MASTER">👑 Admin Master</option>}
                                          {isMaster && <option value="FINANCEIRO">💰 Financeiro</option>}
                                          {isMaster && <option value="COORDENADOR">🛡️ Coordenador</option>}
                                          <option value="CORRETOR">✍️ Corretor</option>
                                          <option value="ALUNO">🎓 Aluno</option>
                                      </Select>
                                      {!isMaster && (
                                        <Text fontSize="xs" color="orange.500" mt={1}>
                                            Como Coordenador, você não pode atribuir cargos de diretoria financeira/master.
                                        </Text>
                                      )}
                                  </FormControl>
                              </VStack>
                          </ModalBody>
                          <ModalFooter borderTop="1px solid" borderColor="gray.100" mt={4}>
                              <Button variant="ghost" mr={3} onClick={onEditClose}>Cancelar</Button>
                              <Button colorScheme="blue" onClick={salvarEdicao}>Salvar Alterações</Button>
                          </ModalFooter>
                      </ModalContent>
                  </Modal>

              </VStack>
          </Container>
      );
  }

  // ==========================================
  // RENDERIZAÇÃO MODO: LISTA GERAL
  // ==========================================
  return (
    <Container maxW="full" py={8} px={{ base: 4, md: 8 }} bg="gray.50" minH="100vh">
      <VStack spacing={6} align="stretch">
        
        <Flex justify="space-between" align="center" wrap="wrap" gap={6} bg="white" p={6} borderRadius="xl" border="1px solid" borderColor="gray.200" shadow="sm">
            <Box>
                <Heading size="lg" color="teal.700">Gestão de Usuários</Heading>
                <Text color="gray.500" fontSize="md" mt={1}>Administração de alunos, corretores e coordenação.</Text>
            </Box>
            
            <HStack spacing={4} wrap="wrap">
                <Box textAlign="center" px={4} borderRight="1px solid" borderColor="gray.200">
                    <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">Pendentes</Text>
                    <Text fontSize="2xl" fontWeight="black" color="orange.500">{qtdPendentes}</Text>
                </Box>
                <Box textAlign="center" px={4} borderRight="1px solid" borderColor="gray.200">
                    <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">Corretores</Text>
                    <Text fontSize="2xl" fontWeight="black" color="teal.600">{qtdCorretores}</Text>
                </Box>
                <Box textAlign="center" px={4}>
                    <Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">Alunos</Text>
                    <Text fontSize="2xl" fontWeight="black" color="blue.500">{qtdAlunos}</Text>
                </Box>
            </HStack>
        </Flex>

        <Flex gap={4} bg="white" p={5} borderRadius="xl" boxShadow="sm" align="center" border="1px solid" borderColor="gray.100" wrap="wrap">
            <InputGroup flex={1} minW="250px"><InputLeftElement pointerEvents='none'><SearchIcon color='gray.400' /></InputLeftElement><Input placeholder="Buscar por nome ou e-mail..." value={busca} onChange={e => setBusca(e.target.value)} /></InputGroup>
            <Select w="180px" value={filtroPapel} onChange={e => setFiltroPapel(e.target.value)}>
                <option value="TODOS">Perfil: Todos</option>
                <option value="CORRETOR">Apenas Corretores</option>
                <option value="ALUNO">Apenas Alunos</option>
                <option value="ADMIN">Apenas Equipe/Admin</option>
            </Select>
            <Select w="180px" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                <option value="TODOS">Status: Todos</option>
                <option value="ATIVOS">Apenas Ativos</option>
                <option value="SUSPENSOS">Pendentes/Suspensos</option>
            </Select>
            
            <Button colorScheme="teal" leftIcon={<AddIcon />} shadow="md" onClick={abrirNovaConta} ml={{ base: 0, md: "auto" }}>
                Novo Usuário
            </Button>
        </Flex>

        <Box bg="white" shadow="sm" borderRadius="lg" overflowX="auto" border="1px solid" borderColor="gray.200">
            <Table variant="simple">
                <Thead bg="gray.50">
                    <Tr>
                        <Th px={6}>Nome / Contato</Th>
                        <Th px={4} textAlign="center">Cargo</Th>
                        <Th px={4} textAlign="center">Status</Th>
                        <Th px={6} textAlign="center">Ação</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {listaFiltrada.map(u => {
                        const papel = getPapelUsuario(u);
                        return (
                            <Tr key={u.id} _hover={{ bg: 'gray.50' }} transition="all 0.2s">
                                <Td px={6}>
                                    <Flex align="center" gap={3}>
                                        {/* AQUI ESTÁ A FOTO NA LISTA SEGURO */}
                                        <Avatar size="sm" name={`${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Usuário'} src={getUrlFoto(u.foto_perfil)} bg="teal.500" color="white" />
                                        <Box>
                                            <Text fontWeight="bold" fontSize="sm" color="gray.800">{u.first_name || 'Sem Nome'} {u.last_name}</Text>
                                            <Text fontSize="xs" color="gray.500">{u.email}</Text>
                                        </Box>
                                    </Flex>
                                </Td>
                                
                                <Td px={4} textAlign="center">
                                    {renderBadgePapel(papel)}
                                </Td>

                                <Td px={4} textAlign="center">
                                    {u.is_active ? 
                                        <Badge colorScheme="green" variant="subtle" borderRadius="md" px={2}>Ativo</Badge> : 
                                        <Badge colorScheme="orange" variant="solid" borderRadius="md" px={2}>Pendente</Badge>
                                    }
                                </Td>

                                {/* AQUI ESTÁ O BOTÃO DE CRÉDITOS NA TABELA LADO A LADO COM O PERFIL */}
                                <Td px={6} textAlign="center">
                                    <HStack spacing={2} justify="center">
                                        <Button size="sm" colorScheme="teal" variant={u.is_active ? "ghost" : "solid"} onClick={() => abrirPerfil(u)}>
                                            {u.is_active ? 'Ver Perfil' : 'Avaliar'}
                                        </Button>
                                        
                                        {/* Mostrar o botão de créditos apenas se o usuário for ALUNO */}
                                        {(papel === 'ALUNO') && (
                                            <Button size="sm" colorScheme="purple" variant="outline" onClick={() => abrirModalCreditos(u)}>
                                                Créditos
                                            </Button>
                                        )}
                                    </HStack>
                                </Td>
                            </Tr>
                        )
                    })}
                    {listaFiltrada.length === 0 && <Tr><Td colSpan={4} textAlign="center" py={10} color="gray.500">Nenhum registro encontrado.</Td></Tr>}
                </Tbody>
            </Table>

            {/* MODAL DE GERIR CRÉDITOS (ESTORNOS) */}
            <Modal isOpen={modalCreditosOpen} onClose={() => setModalCreditosOpen(false)} isCentered>
                <ModalOverlay backdropFilter="blur(3px)" />
                <ModalContent borderRadius="xl">
                    <ModalHeader bg="teal.600" color="white" borderTopRadius="xl">
                        Gerir Créditos Manuais
                    </ModalHeader>
                    <ModalCloseButton color="white" mt={1} />
                    <ModalBody py={6}>
                        <Text mb={4} color="gray.600">
                            Injetar créditos para o aluno: <b>{alunoSelecionado?.first_name || alunoSelecionado?.username}</b>
                        </Text>

                        <VStack spacing={4} align="stretch">
                            <SimpleGrid columns={2} spacing={4}>
                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="bold">Créditos Normais</FormLabel>
                                    <Input type="number" value={qtdSimples} onChange={(e) => setQtdSimples(Number(e.target.value))} bg="blue.50" />
                                    <Text fontSize="xs" color="gray.500" mt={1}>Pode usar números negativos para remover.</Text>
                                </FormControl>
                                
                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="bold" color="purple.600"><StarIcon mr={1}/> Créditos VIP</FormLabel>
                                    <Input type="number" value={qtdVip} onChange={(e) => setQtdVip(Number(e.target.value))} bg="purple.50" />
                                </FormControl>
                            </SimpleGrid>

                            <FormControl isRequired>
                                <FormLabel fontSize="sm" fontWeight="bold">Motivo (Opcional)</FormLabel>
                                <Textarea 
                                    placeholder="Ex: Estorno devido a erro no sistema..." 
                                    value={motivoCredito} onChange={(e) => setMotivoCredito(e.target.value)} 
                                />
                            </FormControl>
                        </VStack>
                    </ModalBody>
                    <ModalFooter bg="gray.50" borderBottomRadius="xl">
                        <Button variant="ghost" mr={3} onClick={() => setModalCreditosOpen(false)}>Cancelar</Button>
                        <Button colorScheme="teal" onClick={handleAdicionarCreditos} isLoading={enviandoCredito}>Confirmar</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

        </Box>

        {/* MODAL PARA CRIAR NOVO USUÁRIO */}
        <Modal isOpen={isNewOpen} onClose={onNewClose} isCentered>
            <ModalOverlay backdropFilter="blur(4px)" />
            <ModalContent borderRadius="xl">
                <ModalHeader color="teal.700">Adicionar Membro da Equipe</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4}>
                        <Alert status="info" borderRadius="md" fontSize="sm">
                          <AlertIcon />
                          Crie um perfil administrativo, professor ou aluno manualmente sem precisar passar pela página de cadastro do site.
                        </Alert>
                        
                        <SimpleGrid columns={2} spacing={4} w="full">
                            <FormControl isRequired>
                                <FormLabel>Nome</FormLabel>
                                <Input value={novoAdmin.first_name} onChange={e => setNovoAdmin({...novoAdmin, first_name: e.target.value})} placeholder="Ex: Maria Clara" />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Sobrenome</FormLabel>
                                <Input value={novoAdmin.last_name} onChange={e => setNovoAdmin({...novoAdmin, last_name: e.target.value})} placeholder="Ex: de Souza" />
                            </FormControl>
                        </SimpleGrid>

                        <FormControl isRequired>
                            <FormLabel>E-mail Corporativo</FormLabel>
                            <Input type="email" value={novoAdmin.email} onChange={e => setNovoAdmin({...novoAdmin, email: e.target.value})} placeholder="email@plataforma.com" />
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel>Senha de Acesso</FormLabel>
                            <Input type="password" value={novoAdmin.password} onChange={e => setNovoAdmin({...novoAdmin, password: e.target.value})} placeholder="Crie uma senha inicial" />
                        </FormControl>
                        
                        {/* SELECT SEGURO SEM CONDICIONAIS DENTRO */}
                        <FormControl isRequired>
                            <FormLabel>Nível de Acesso</FormLabel>
                            <Select value={novoAdmin.perfil_acesso} onChange={e => setNovoAdmin({...novoAdmin, perfil_acesso: e.target.value})}>
                                {isMaster && <option value="MASTER">👑 Admin Master</option>}
                                {isMaster && <option value="FINANCEIRO">💰 Financeiro</option>}
                                {isMaster && <option value="COORDENADOR">🛡️ Coordenador</option>}
                                <option value="CORRETOR">📝 Professor Corretor</option>
                                <option value="ALUNO">🎓 Aluno Treineiro</option>
                            </Select>
                        </FormControl>
                    </VStack>
                </ModalBody>
                <ModalFooter borderTop="1px solid" borderColor="gray.100" mt={4}>
                    <Button variant="ghost" mr={3} onClick={onNewClose}>Cancelar</Button>
                    <Button colorScheme="teal" onClick={criarMembroEquipe} isLoading={salvandoAdmin}>Adicionar Membro</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>

      </VStack>
    </Container>
  );
}

export default GestaoUsuarios;