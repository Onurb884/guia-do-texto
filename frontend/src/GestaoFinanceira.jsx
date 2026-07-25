import React, { useState, useEffect } from 'react';
import {
  Box, Container, Heading, Text, SimpleGrid, Card, CardBody, Flex,
  Stat, StatLabel, StatNumber, StatHelpText, Icon, Table, Thead, Tbody,
  Tr, Th, Td, Badge, Button, useToast, Spinner, Alert, AlertIcon,
  useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, 
  ModalCloseButton, ModalBody, ModalFooter, VStack, FormControl, 
  FormLabel, InputGroup, InputLeftAddon, Input, InputRightAddon, Divider 
} from '@chakra-ui/react';
import { 
  CheckCircleIcon, ArrowUpIcon, TimeIcon, SettingsIcon
} from '@chakra-ui/icons';
import { MdAttachMoney, MdAccountBalanceWallet, MdTrendingUp, MdPeople } from 'react-icons/md'; 
import axios from 'axios';

const GestaoFinanceira = () => {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processandoId, setProcessandoId] = useState(null);
  const toast = useToast();

  // Estados para as Configurações
  const modalConfig = useDisclosure();
  const [configCompleta, setConfigCompleta] = useState({});
  const [tempoEnem, setTempoEnem] = useState(40); 
  const [tempoSimples, setTempoSimples] = useState(25);
  const [valorEnem, setValorEnem] = useState(4.00); 
  const [valorSimples, setValorSimples] = useState(3.00); 
  const [valorVIP, setValorVIP] = useState(1.50);
  const [salvandoConfig, setSalvandoConfig] = useState(false);

  const carregarDados = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://127.0.0.1:8000/api/gestao/financeiro/dashboard/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDados(res.data);
    } catch (error) {
      toast({
        title: 'Erro ao carregar dados financeiros',
        description: 'Verifique a sua permissão.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const baixarPagamento = async (corretorId, nome) => {
    const confirmar = window.confirm(`Tem a certeza que já realizou o PIX para o(a) professor(a) ${nome}? Esta ação zerará o saldo a receber dele(a).`);
    if (!confirmar) return;

    setProcessandoId(corretorId);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://127.0.0.1:8000/api/gestao/financeiro/baixar-pagamento/${corretorId}/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast({
        title: 'Pagamento Registado!',
        description: `O saldo de ${nome} foi zerado com sucesso.`,
        status: 'success',
        duration: 4000,
      });
      
      carregarDados();
    } catch (error) {
      toast({ title: 'Erro ao baixar pagamento', status: 'error', duration: 4000 });
    } finally {
      setProcessandoId(null);
    }
  };

  // Funções do Modal de Configurações
  const abrirConfiguracoes = async () => {
    try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://127.0.0.1:8000/api/gestao/configuracoes/', { 
            headers: { Authorization: `Bearer ${token}` } 
        });
        setConfigCompleta(res.data);
        setTempoEnem(res.data.tempo_limite_enem_minutos); 
        setTempoSimples(res.data.tempo_limite_simples_minutos);
        setValorEnem(res.data.valor_pagamento_enem); 
        setValorSimples(res.data.valor_pagamento_simples); 
        setValorVIP(res.data.valor_bonus_vip);
        modalConfig.onOpen();
    } catch (e) {
        toast({ title: 'Erro ao carregar configurações', status: 'error' });
    }
  };

  const salvarConfiguracoes = async () => {
      setSalvandoConfig(true);
      try {
          const token = localStorage.getItem('token');
          const payload = { 
              ...configCompleta, 
              tempo_limite_enem_minutos: tempoEnem, 
              tempo_limite_simples_minutos: tempoSimples, 
              valor_pagamento_enem: valorEnem, 
              valor_pagamento_simples: valorSimples, 
              valor_bonus_vip: valorVIP 
          };
          await axios.put('http://127.0.0.1:8000/api/gestao/configuracoes/', payload, { 
              headers: { Authorization: `Bearer ${token}` } 
          });
          toast({ title: "Valores atualizados com sucesso!", status: "success" }); 
          modalConfig.onClose();
          carregarDados(); 
      } catch (e) {
          toast({ title: 'Erro ao salvar', status: 'error' });
      }
      setSalvandoConfig(false);
  };

  if (loading) {
    return (
      <Flex w="full" h="100vh" align="center" justify="center">
        <Spinner size="xl" color="teal.500" thickness="4px" />
      </Flex>
    );
  }

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  return (
    <Container maxW="container.xl" py={8} px={{ base: 4, md: 8 }}>
      
      {/* CABEÇALHO COM O NOVO BOTÃO DE CONFIGURAÇÕES */}
      <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
        <Box>
            <Heading color="gray.800" mb={1}>Painel Financeiro 📊</Heading>
            <Text color="gray.500">Acompanhe o faturamento da plataforma e faça a gestão financeira.</Text>
        </Box>
        <Button leftIcon={<SettingsIcon />} colorScheme="teal" variant="outline" onClick={abrirConfiguracoes} shadow="sm">
            Taxas e Comissões
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 5 }} spacing={6} mb={10}>
        
        <Card bg="white" shadow="sm" border="1px solid" borderColor="gray.200" borderRadius="xl" borderTop="4px solid" borderTopColor="green.400">
          <CardBody>
            <Stat>
              <Flex justify="space-between" align="center" mb={2}>
                <StatLabel color="gray.500" fontWeight="bold" textTransform="uppercase" fontSize="xs">Faturamento (Mês)</StatLabel>
                <Flex bg="green.50" p={2} borderRadius="md"><Icon as={ArrowUpIcon} color="green.500" /></Flex>
              </Flex>
              <StatNumber fontSize="2xl" fontWeight="900" color="gray.700">{formatarMoeda(dados?.faturamento_mes || 0)}</StatNumber>
              <StatHelpText mb={0} color="green.500" fontSize="xs" fontWeight="bold">Dinheiro em caixa</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="orange.50" shadow="sm" border="1px solid" borderColor="orange.200" borderRadius="xl">
          <CardBody>
            <Stat>
              <Flex justify="space-between" align="center" mb={2}>
                <StatLabel color="orange.700" fontWeight="bold" textTransform="uppercase" fontSize="xs">Aguardando Pagto</StatLabel>
                <Flex bg="orange.100" p={2} borderRadius="md"><Icon as={TimeIcon} color="orange.600" /></Flex>
              </Flex>
              <StatNumber fontSize="2xl" fontWeight="900" color="orange.800">{formatarMoeda(dados?.aguardando_pagamento || 0)}</StatNumber>
              <StatHelpText mb={0} color="orange.600" fontSize="xs" fontWeight="bold">PIX/Cartão deste mês</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="blue.50" shadow="sm" border="1px solid" borderColor="blue.200" borderRadius="xl">
          <CardBody>
            <Stat>
              <Flex justify="space-between" align="center" mb={2}>
                <StatLabel color="blue.700" fontWeight="bold" textTransform="uppercase" fontSize="xs">Lucro Bruto (Mês)</StatLabel>
                <Flex bg="blue.100" p={2} borderRadius="md"><Icon as={MdTrendingUp} color="blue.600" /></Flex>
              </Flex>
              <StatNumber fontSize="2xl" fontWeight="900" color="blue.800">{formatarMoeda(dados?.lucro_bruto_estimado || 0)}</StatNumber>
              <StatHelpText mb={0} color="blue.600" fontSize="xs" fontWeight="bold">Após pagar corretores</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="white" shadow="sm" border="1px solid" borderColor="gray.200" borderRadius="xl" borderTop="4px solid" borderTopColor="red.400">
          <CardBody>
            <Stat>
              <Flex justify="space-between" align="center" mb={2}>
                <StatLabel color="gray.500" fontWeight="bold" textTransform="uppercase" fontSize="xs">A Pagar (Equipe)</StatLabel>
                <Flex bg="red.50" p={2} borderRadius="md"><Icon as={MdPeople} color="red.500" /></Flex>
              </Flex>
              <StatNumber fontSize="2xl" fontWeight="900" color="red.600">{formatarMoeda(dados?.total_a_pagar_corretores || 0)}</StatNumber>
              <StatHelpText mb={0} color="red.400" fontSize="xs" fontWeight="bold">Dívida pendente</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="gray.800" shadow="xl" borderRadius="xl">
          <CardBody>
            <Stat>
              <Flex justify="space-between" align="center" mb={2}>
                <StatLabel color="gray.400" fontWeight="bold" textTransform="uppercase" fontSize="xs">Total Histórico</StatLabel>
                <Flex bg="gray.700" p={2} borderRadius="md"><Icon as={MdAccountBalanceWallet} color="yellow.400" /></Flex>
              </Flex>
              <StatNumber fontSize="2xl" fontWeight="900" color="white">{formatarMoeda(dados?.faturamento_total || 0)}</StatNumber>
              <StatHelpText mb={0} color="gray.400" fontSize="xs">Desde o lançamento</StatHelpText>
            </Stat>
          </CardBody>
        </Card>

      </SimpleGrid>

      <Box mb={4} display="flex" alignItems="center" gap={2}>
        <Icon as={MdAttachMoney} color="teal.600" boxSize={6} />
        <Heading size="md" color="gray.700">Folha de Pagamento a Transferir</Heading>
      </Box>
      
      <Card shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.200" overflow="hidden" bg="white">
        <Box overflowX="auto">
          {dados?.folha_pagamento && dados.folha_pagamento.length > 0 ? (
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th py={4}>Corretor</Th>
                  <Th>Contacto</Th>
                  <Th isNumeric>Valor a Receber</Th>
                  <Th textAlign="center" w="200px">Ação (Comprovativo)</Th>
                </Tr>
              </Thead>
              <Tbody>
                {dados.folha_pagamento.map((prof) => (
                  <Tr key={prof.corretor_id} _hover={{ bg: "gray.50" }}>
                    <Td fontWeight="bold" color="gray.700">{prof.nome}</Td>
                    <Td>
                      <Text fontSize="sm" color="gray.600">{prof.email}</Text>
                      <Text fontSize="xs" color="gray.400">{prof.telefone}</Text>
                    </Td>
                    <Td isNumeric>
                      <Badge colorScheme="red" fontSize="sm" px={3} py={1} borderRadius="full">
                        {formatarMoeda(prof.valor_a_receber)}
                      </Badge>
                    </Td>
                    <Td textAlign="center">
                      <Button 
                        size="sm" 
                        colorScheme="teal" 
                        leftIcon={<CheckCircleIcon />}
                        isLoading={processandoId === prof.corretor_id}
                        onClick={() => baixarPagamento(prof.corretor_id, prof.nome)}
                        shadow="sm"
                      >
                        Marcar Pago
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <Flex direction="column" align="center" justify="center" p={10} bg="gray.50">
              <CheckCircleIcon boxSize={10} color="green.400" mb={4} />
              <Heading size="sm" color="gray.600" mb={1}>Tudo em dia!</Heading>
              <Text color="gray.500" fontSize="sm">Não há nenhum pagamento pendente para os professores neste momento.</Text>
            </Flex>
          )}
        </Box>
      </Card>
      
      <Alert status="info" mt={6} borderRadius="md" bg="blue.50" color="blue.800">
        <AlertIcon />
        <Box>
          <Text fontSize="sm" fontWeight="bold">Como funciona a baixa?</Text>
          <Text fontSize="sm">Copie a chave PIX do professor (disponível no perfil dele) e faça a transferência no seu app do banco. Depois de enviar o dinheiro, clique em <b>"Marcar Pago"</b> nesta tela para zerar a conta dele no sistema.</Text>
        </Box>
      </Alert>

      {/* MODAL DE TAXAS E COMISSÕES (LAYOUT REFINADO) */}
      <Modal isOpen={modalConfig.isOpen} onClose={modalConfig.onClose} isCentered size="lg">
        <ModalOverlay backdropFilter="blur(3px)" />
        <ModalContent borderRadius="xl" overflow="hidden">
            <ModalHeader color="teal.700" bg="white" borderBottom="1px solid" borderColor="gray.100">
              Taxas e Comissões
            </ModalHeader>
            <ModalCloseButton />
            
            <ModalBody pb={8} bg="gray.50">
                <VStack spacing={6} align="stretch" mt={4}>
                    <Alert status="info" borderRadius="md" size="sm" py={2} bg="blue.50" border="1px solid" borderColor="blue.100">
                        <AlertIcon />
                        <Text fontSize="xs">O Lucro Bruto da plataforma é calculado subtraindo automaticamente estes valores em cada redação corrigida.</Text>
                    </Alert>
                    
                    <Box>
                        <Text fontWeight="bold" color="gray.700" fontSize="sm" mb={3} textTransform="uppercase" letterSpacing="wide">
                          Repasse aos Professores
                        </Text>
                        
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                            
                            <FormControl bg="white" p={4} borderRadius="xl" border="1px solid" borderColor="gray.200" shadow="sm">
                                <FormLabel fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>Correção ENEM</FormLabel>
                                <InputGroup size="sm">
                                    <InputLeftAddon children='R$' bg="gray.100" />
                                    <Input type="number" step="0.01" value={valorEnem} onChange={e => setValorEnem(e.target.value)} />
                                </InputGroup>
                            </FormControl>
                            
                            <FormControl bg="white" p={4} borderRadius="xl" border="1px solid" borderColor="gray.200" shadow="sm">
                                <FormLabel fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>Correção Simples</FormLabel>
                                <InputGroup size="sm">
                                    <InputLeftAddon children='R$' bg="gray.100" />
                                    <Input type="number" step="0.01" value={valorSimples} onChange={e => setValorSimples(e.target.value)} />
                                </InputGroup>
                            </FormControl>
                            
                            <FormControl bg="purple.50" p={4} borderRadius="xl" border="1px solid" borderColor="purple.200" shadow="sm">
                                <FormLabel fontSize="xs" color="purple.700" fontWeight="bold" mb={2}>Bônus VIP</FormLabel>
                                <InputGroup size="sm">
                                    <InputLeftAddon children='+ R$' bg="purple.100" color="purple.800" fontWeight="bold" />
                                    <Input type="number" step="0.01" value={valorVIP} onChange={e => setValorVIP(e.target.value)} bg="white" borderColor="purple.300" />
                                </InputGroup>
                            </FormControl>

                        </SimpleGrid>
                    </Box>

                    <Divider borderColor="gray.300" />

                    <Box>
                        <Text fontWeight="bold" color="gray.700" fontSize="sm" mb={3} textTransform="uppercase" letterSpacing="wide">
                          Prazos de Entrega (SLA)
                        </Text>
                        
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            
                            <FormControl display="flex" alignItems="center" justifyContent="space-between" bg="white" p={3} borderRadius="xl" border="1px solid" borderColor="gray.200" shadow="sm">
                                <FormLabel fontSize="sm" fontWeight="bold" color="gray.600" mb={0} m={0}>Fila ENEM</FormLabel>
                                <InputGroup size="sm" w="100px">
                                    <Input type="number" textAlign="right" value={tempoEnem} onChange={e => setTempoEnem(e.target.value)} />
                                    <InputRightAddon children='min' bg="gray.100" />
                                </InputGroup>
                            </FormControl>
                            
                            <FormControl display="flex" alignItems="center" justifyContent="space-between" bg="white" p={3} borderRadius="xl" border="1px solid" borderColor="gray.200" shadow="sm">
                                <FormLabel fontSize="sm" fontWeight="bold" color="gray.600" mb={0} m={0}>Fila Simples</FormLabel>
                                <InputGroup size="sm" w="100px">
                                    <Input type="number" textAlign="right" value={tempoSimples} onChange={e => setTempoSimples(e.target.value)} />
                                    <InputRightAddon children='min' bg="gray.100" />
                                </InputGroup>
                            </FormControl>

                        </SimpleGrid>
                    </Box>
                </VStack>
            </ModalBody>
            <ModalFooter bg="white" borderTop="1px solid" borderColor="gray.200">
                <Button variant="ghost" mr={3} onClick={modalConfig.onClose}>Cancelar</Button>
                <Button colorScheme="teal" onClick={salvarConfiguracoes} isLoading={salvandoConfig} shadow="md">Guardar Alterações</Button>
            </ModalFooter>
        </ModalContent>
      </Modal>

    </Container>
  );
};

export default GestaoFinanceira;