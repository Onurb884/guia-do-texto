import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Heading, Text, VStack, HStack, Button, Icon, Box, 
  useToast, Flex, Badge, Input, Select, InputGroup, InputLeftElement, 
  Table, Thead, Tbody, Tr, Th, Td, Card, SimpleGrid, Stat, StatLabel, 
  StatNumber, Tooltip, useDisclosure, Modal, ModalOverlay, ModalContent, 
  ModalHeader, ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel, 
  Switch, Divider, Tabs, TabList, TabPanels, Tab, TabPanel,
  Alert, AlertIcon, Textarea, Image
} from '@chakra-ui/react';
import { SearchIcon, WarningIcon, UnlockIcon, WarningTwoIcon, StarIcon, ViewIcon } from '@chakra-ui/icons';

function TorreControle() {
  const [redacoes, setRedacoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [somenteUrgentes, setSomenteUrgentes] = useState(false);
  
  const [tabIndex, setTabIndex] = useState(0);

  // Modais de Ação
  const modalAlerta = useDisclosure();
  const [idParaLiberar, setIdParaLiberar] = useState(null);

  const modalAuditoria = useDisclosure();
  const [redacaoAuditando, setRedacaoAuditoria] = useState(null);
  const [mensagemAluno, setMensagemAluno] = useState('');
  const [loadingAudit, setLoadingAudit] = useState(false);

  const toast = useToast();

  useEffect(() => { 
      carregarDados(); 
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try { 
        const res = await axios.get('http://127.0.0.1:8000/api/gestao/redacoes/', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
        setRedacoes(res.data); 
    } catch (e) {
        toast({ title: "Erro ao carregar fila", status: "error" });
    }
    setLoading(false);
  };

  // --- FUNÇÕES DA AUDITORIA ---
  const abrirJulgamento = async (id) => {
    try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://127.0.0.1:8000/api/redacao/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
        setRedacaoAuditoria(res.data);
        setMensagemAluno('Olá! A sua redação foi anulada pois não conseguimos ler o texto da imagem. Por favor, reenvie uma foto mais nítida. O seu crédito já foi devolvido!');
        modalAuditoria.onOpen();
    } catch (e) { toast({ title: 'Erro ao carregar', status: 'error' }); }
  };

  const resolverAuditoria = async (acao) => {
      if (acao === 'DEVOLVER_ALUNO' && !mensagemAluno.trim()) {
          return toast({ title: 'Atenção', description: 'Escreva um recado explicando o motivo para o aluno.', status: 'warning' });
      }

      setLoadingAudit(true);
      try {
          const token = localStorage.getItem('token');
          await axios.post(`http://127.0.0.1:8000/api/auditoria/${redacaoAuditando.id}/resolver/`, {
              acao: acao,
              mensagem: mensagemAluno
          }, { headers: { Authorization: `Bearer ${token}` } });

          toast({ title: 'Resolvido!', description: acao === 'VOLTAR_FILA' ? 'A redação voltou para os corretores.' : 'A redação foi anulada e o crédito devolvido.', status: 'success' });
          modalAuditoria.onClose();
          carregarDados(); 
      } catch (e) { toast({ title: 'Erro ao resolver', status: 'error' }); }
      setLoadingAudit(false);
  };

  // --- OUTRAS FUNÇÕES ---
  const confirmarLiberacao = (id) => { setIdParaLiberar(id); modalAlerta.onOpen(); };
  
  const forcarLiberacaoReal = async () => {
    try { 
        await axios.post(`http://127.0.0.1:8000/api/gestao/redacoes/${idParaLiberar}/liberar/`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
        carregarDados(); 
        toast({ title: "Devolvida!", status: "success" }); 
    } catch (e) {}
    modalAlerta.onClose();
  };

  const toggleUrgencia = async (r) => {
    if(r.vip_pago) return;
    try { 
        await axios.post(`http://127.0.0.1:8000/api/gestao/redacoes/${r.id}/urgencia/`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
        carregarDados(); 
        toast({ title: "Urgência alterada!", status: "success" }); 
    } catch (e) {}
  };

  // Separação das Listas (Fila Normal vs Auditoria)
  const listaFilaNormal = redacoes.filter(r => r.status !== 'AUDITORIA');
  const listaAuditoria = redacoes.filter(r => r.status === 'AUDITORIA');

  const redacoesFiltradas = listaFilaNormal.filter(r => {
      const matchTexto = (r.tema_titulo || '').toLowerCase().includes(busca.toLowerCase()) || (r.aluno_nome || '').toLowerCase().includes(busca.toLowerCase()) || r.id.toString() === busca;
      const matchStatus = filtroStatus === 'TODOS' ? true : r.status === filtroStatus;
      if (somenteUrgentes && !r.is_urgente && !r.vip_pago) return false;
      return matchTexto && matchStatus;
  });

  return (
    <Container maxW="full" py={8} px={{ base: 4, md: 8 }} bg="gray.50" minH="100vh">
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <Box mb={2}>
                <Heading size="lg" color="teal.700">Torre de Controle</Heading>
                <Text color="gray.500" fontSize="md">Monitoramento operacional e pedagógico da fila de correções.</Text>
            </Box>
        </Flex>

        <Tabs isLazy index={tabIndex} onChange={(i) => setTabIndex(i)}>
            <TabList mb={6} borderBottom="2px solid" borderColor="gray.200" gap={2}>
                <Tab _selected={{ color: 'teal.700', bg: 'teal.50', borderBottom: '3px solid', borderColor: 'teal.500', fontWeight: 'bold' }}>🚦 Gestão da Fila</Tab>
                <Tab _selected={{ color: 'orange.700', bg: 'orange.50', borderBottom: '3px solid', borderColor: 'orange.500', fontWeight: 'bold' }}>
                    🚩 Auditoria
                    {listaAuditoria.length > 0 && <Badge ml={2} colorScheme="red" borderRadius="full">{listaAuditoria.length}</Badge>}
                </Tab>
            </TabList>

            <TabPanels>
                {/* 1. ABA DE FILA */}
                <TabPanel p={0}>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
                        <Card bg="white" shadow="sm" border="1px solid" borderColor="gray.100" borderTop="4px solid" borderTopColor="yellow.400"><Box p={5}><Stat><StatLabel color="gray.500">Na Fila (Aguardando)</StatLabel><StatNumber fontSize="3xl" color="yellow.600">{redacoes.filter(r => r.status === 'AGUARDANDO').length}</StatNumber></Stat></Box></Card>
                        <Card bg="white" shadow="sm" border="1px solid" borderColor="gray.100" borderTop="4px solid" borderTopColor="blue.400"><Box p={5}><Stat><StatLabel color="gray.500">Em Correção Agora</StatLabel><StatNumber fontSize="3xl" color="blue.600">{redacoes.filter(r => r.status === 'EM_CORRECAO').length}</StatNumber></Stat></Box></Card>
                        <Card bg="white" shadow="sm" border="1px solid" borderColor="gray.100" borderTop="4px solid" borderTopColor="purple.500" bgGradient="linear(to-br, white, purple.50)"><Box p={5}><Stat><StatLabel color="purple.600" fontWeight="bold">Sinal de Alerta (VIPs)</StatLabel><StatNumber fontSize="3xl" color="purple.700">{redacoes.filter(r => (r.is_urgente || r.vip_pago) && r.status !== 'CORRIGIDA').length}</StatNumber></Stat></Box></Card>
                    </SimpleGrid>
                    <Flex gap={4} bg="white" p={5} borderRadius="xl" boxShadow="sm" align="center" border="1px solid" borderColor="gray.100" wrap="wrap" mb={6}>
                        <InputGroup flex={1} minW="250px"><InputLeftElement pointerEvents='none'><SearchIcon color='gray.400' /></InputLeftElement><Input placeholder="Buscar Cód, Tema ou Aluno..." value={busca} onChange={e => setBusca(e.target.value)} /></InputGroup>
                        <Select w="180px" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}><option value="TODOS">Status: Todos</option><option value="AGUARDANDO">Aguardando</option><option value="EM_CORRECAO">Em Correção</option><option value="CORRIGIDA">Corrigidas</option></Select>
                        <Divider orientation="vertical" h="30px" display={{ base: 'none', md: 'block' }} />
                        <FormControl display='flex' alignItems='center' w="auto"><Switch colorScheme="purple" isChecked={somenteUrgentes} onChange={(e) => setSomenteUrgentes(e.target.checked)} mr={2} /><FormLabel mb='0' fontSize="sm" fontWeight="bold" color="purple.600">Apenas VIPs</FormLabel></FormControl>
                        <Button colorScheme="teal" onClick={carregarDados} isLoading={loading}>Atualizar</Button>
                    </Flex>
                    <Box bg="white" shadow="sm" borderRadius="lg" overflowX="auto" border="1px solid" borderColor="gray.200">
                        <Table variant="simple" style={{ tableLayout: 'fixed', width: '100%' }}>
                            <Thead bg="gray.50"><Tr><Th w="8%" px={4}>Cód.</Th><Th w="32%" px={4}>Tema</Th><Th w="15%" px={3} textAlign="center">Status</Th><Th w="15%" px={3} textAlign="center">SLA / Envio</Th><Th w="15%" px={3} textAlign="center">Ações</Th></Tr></Thead>
                            <Tbody>
                                {redacoesFiltradas.map(r => (
                                <Tr key={r.id} _hover={{ bg: 'gray.50' }} bg={(r.is_urgente || r.vip_pago) && r.status !== 'CORRIGIDA' ? 'purple.50' : 'transparent'}>
                                    <Td fontWeight="bold" color="gray.700" px={4}>#{r.id}</Td>
                                    <Td px={4} isTruncated title={r.tema_titulo}><Text fontWeight="bold" fontSize="sm" color="gray.800" isTruncated>{r.tema_titulo}</Text><Text fontSize="xs" color="gray.500">Aluno: <strong>{r.aluno_nome || "Desconhecido"}</strong></Text></Td>
                                    <Td px={3} textAlign="center"><Badge colorScheme={r.status === 'CORRIGIDA' ? 'green' : r.status === 'EM_CORRECAO' ? 'blue' : 'yellow'} borderRadius="md" px={2} py={1} fontSize="xs">{r.status.replace('_', ' ')}</Badge>{r.corretor_atual && r.status === 'EM_CORRECAO' && (<Text fontSize="2xs" color="blue.600" mt={1} fontWeight="bold">Prof ID: {r.corretor_atual}</Text>)}</Td>
                                    <Td px={3} textAlign="center"><Text fontSize="xs" color="gray.600">{new Date(r.data_envio).toLocaleDateString()}</Text>{r.vip_pago && r.status !== 'CORRIGIDA' && <Badge colorScheme="purple" variant="solid" mt={1} fontSize="2xs"><StarIcon mr={1} mb={0.5}/> VIP PAGO</Badge>}{!r.vip_pago && r.is_urgente && r.status !== 'CORRIGIDA' && <Badge colorScheme="red" variant="solid" mt={1} fontSize="2xs"><WarningIcon mr={1}/> URGENTE</Badge>}</Td>
                                    <Td px={3} textAlign="center"><HStack spacing={2} justify="center">{r.status !== 'CORRIGIDA' && (<Tooltip label={r.vip_pago ? "Urgência comprada (Inalterável)" : (r.is_urgente ? "Remover Urgência" : "Marcar Urgente")} hasArrow><Button size="sm" colorScheme={r.vip_pago || r.is_urgente ? "purple" : "gray"} variant={r.vip_pago || r.is_urgente ? "solid" : "outline"} onClick={() => toggleUrgencia(r)} isDisabled={r.vip_pago}><Icon as={r.vip_pago ? StarIcon : WarningIcon} /></Button></Tooltip>)}{r.status !== 'CORRIGIDA' && (<Tooltip label={r.status === 'EM_CORRECAO' ? "Arrancar do Corretor" : "Nenhum corretor pegou ainda"} hasArrow><Button size="sm" colorScheme="orange" variant="outline" isDisabled={r.status !== 'EM_CORRECAO'} onClick={() => confirmarLiberacao(r.id)}><Icon as={UnlockIcon} /></Button></Tooltip>)}</HStack></Td>
                                </Tr>
                                ))}
                                {redacoesFiltradas.length === 0 && <Tr><Td colSpan={5} textAlign="center" py={10} color="gray.500">Nenhum resultado encontrado.</Td></Tr>}
                            </Tbody>
                        </Table>
                    </Box>
                </TabPanel>

                {/* 2. NOVA ABA DE AUDITORIA */}
                <TabPanel p={0}>
                    <Card bg="orange.50" shadow="sm" borderRadius="lg" overflowX="auto" border="1px solid" borderColor="orange.200">
                        <Table variant="simple">
                            <Thead bg="orange.100">
                                <Tr>
                                    <Th px={6} color="orange.800">Código / Tema</Th>
                                    <Th px={4} textAlign="center" color="orange.800">Aluno</Th>
                                    <Th px={4} textAlign="center" color="orange.800">Status</Th>
                                    <Th px={6} textAlign="right" color="orange.800">Ação</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {listaAuditoria.map(r => (
                                    <Tr key={r.id} _hover={{ bg: 'orange.100' }}>
                                        <Td px={6}>
                                            <Text fontWeight="bold" fontSize="sm" color="gray.800">#{r.id} - {r.tema_titulo}</Text>
                                            <Text fontSize="xs" color="gray.500">Enviada em {new Date(r.data_envio).toLocaleDateString()}</Text>
                                        </Td>
                                        <Td px={4} textAlign="center">
                                            <Text fontWeight="medium" fontSize="sm">{r.aluno_nome}</Text>
                                        </Td>
                                        <Td px={4} textAlign="center">
                                            <Badge colorScheme="orange" variant="solid" borderRadius="md" px={2}><WarningTwoIcon mr={1}/> AGUARDANDO JULGAMENTO</Badge>
                                        </Td>
                                        <Td px={6} textAlign="right">
                                            <Button size="sm" colorScheme="orange" leftIcon={<ViewIcon />} onClick={() => abrirJulgamento(r.id)}>
                                                Julgar
                                            </Button>
                                        </Td>
                                    </Tr>
                                ))}
                                {listaAuditoria.length === 0 && <Tr><Td colSpan={4} textAlign="center" py={10} color="gray.500">Nenhuma redação em quarentena. Tudo tranquilo!</Td></Tr>}
                            </Tbody>
                        </Table>
                    </Card>
                </TabPanel>
            </TabPanels>
        </Tabs>
      </VStack>

      {/* MODAL LIBERAR REDAÇÃO FORÇADA */}
      <Modal isOpen={modalAlerta.isOpen} onClose={modalAlerta.onClose} isCentered size="sm">
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent borderRadius="xl">
            <ModalHeader>Arrancar Redação?</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
                <VStack spacing={4} align="center" py={2}>
                    <WarningTwoIcon w={10} h={10} color="orange.400" />
                    <Text textAlign="center" color="gray.600">O corretor perderá acesso a esta redação imediatamente.</Text>
                </VStack>
            </ModalBody>
            <ModalFooter>
                <Button variant="ghost" mr={3} onClick={modalAlerta.onClose}>Cancelar</Button>
                <Button colorScheme="orange" onClick={forcarLiberacaoReal}>Sim, Arrancar</Button>
            </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* NOVO MODAL: JULGAMENTO (AUDITORIA) */}
      <Modal isOpen={modalAuditoria.isOpen} onClose={modalAuditoria.onClose} size="3xl" isCentered>
            <ModalOverlay backdropFilter="blur(4px)" />
            <ModalContent borderRadius="xl">
                <ModalHeader color="orange.600" borderBottom="1px solid" borderColor="gray.100">
                    <HStack><WarningTwoIcon /> <Text>Julgar Redação Sinalizada</Text></HStack>
                </ModalHeader>
                <ModalCloseButton />
                
                {redacaoAuditando && (
                <ModalBody py={6}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                        {/* Lado Esquerdo: Redação do Aluno */}
                        <Box>
                            <Text fontSize="sm" fontWeight="bold" color="gray.700" mb={2}>Material Enviado pelo Aluno:</Text>
                            <Box bg="gray.100" p={2} borderRadius="md" border="1px solid" borderColor="gray.200" h="300px" overflowY="auto">
                                {redacaoAuditando.texto ? (
                                    <Text fontSize="sm" whiteSpace="pre-wrap" bg="white" p={3} borderRadius="md">{redacaoAuditando.texto}</Text>
                                ) : (
                                    <Image src={redacaoAuditando.arquivo} alt="Foto da Redação" borderRadius="md" w="full" />
                                )}
                            </Box>
                        </Box>

                        {/* Lado Direito: O Relato do Professor e Ações */}
                        <VStack align="stretch" spacing={4}>
                            <Alert status="error" variant="subtle" borderRadius="md" flexDirection="column" alignItems="start" p={4}>
                                <HStack mb={2}><WarningIcon color="red.500" /><Text fontWeight="bold" fontSize="sm" color="red.800">Relato do Corretor:</Text></HStack>
                                <Text fontSize="sm" color="red.700" bg="white" p={3} borderRadius="md" w="full" fontStyle="italic" border="1px solid" borderColor="red.100">
                                    "{redacaoAuditando.correcao?.comentario_geral || 'Nenhum detalhe fornecido.'}"
                                </Text>
                            </Alert>

                            <Divider />

                            <Box>
                                <Text fontSize="sm" fontWeight="bold" color="teal.700" mb={2}>O Corretor está enganado?</Text>
                                <Button w="full" colorScheme="blue" variant="outline" onClick={() => resolverAuditoria('VOLTAR_FILA')} isLoading={loadingAudit}>
                                    Ignorar Sinalização e Voltar para Fila
                                </Button>
                                <Text fontSize="xs" color="gray.500" mt={1} textAlign="center">A redação ficará disponível para outro professor corrigir.</Text>
                            </Box>

                            <Divider />

                            <Box>
                                <Text fontSize="sm" fontWeight="bold" color="red.700" mb={2}>O Corretor está certo?</Text>
                                <FormControl mb={3}>
                                    <FormLabel fontSize="xs" color="gray.600">Recado para o aluno (Motivo da Anulação):</FormLabel>
                                    <Textarea size="sm" value={mensagemAluno} onChange={(e) => setMensagemAluno(e.target.value)} rows={3} bg="gray.50" />
                                </FormControl>
                                <Button w="full" colorScheme="red" onClick={() => resolverAuditoria('DEVOLVER_ALUNO')} isLoading={loadingAudit}>
                                    Anular Redação e Estornar Crédito
                                </Button>
                                <Text fontSize="xs" color="gray.500" mt={1} textAlign="center">O aluno verá o recado e receberá +1 crédito de volta.</Text>
                            </Box>

                        </VStack>
                    </SimpleGrid>
                </ModalBody>
                )}
            </ModalContent>
        </Modal>

    </Container>
  );
}

export default TorreControle;