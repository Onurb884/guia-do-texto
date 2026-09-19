import React, { useState, useEffect } from 'react';
import {
  Box, Container, Heading, Text, SimpleGrid, Card, CardBody, Flex,
  Stat, StatLabel, StatNumber, StatHelpText, Icon, Table, Thead, Tbody,
  Tr, Th, Td, Badge, Button, useToast, Spinner, Alert, AlertIcon,
  useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, 
  ModalCloseButton, ModalBody, ModalFooter, VStack, FormControl, 
  FormLabel, InputGroup, InputLeftAddon, Input, InputRightAddon, Divider,
  Tabs, TabList, TabPanels, Tab, TabPanel, Textarea, HStack, Select, InputLeftElement
} from '@chakra-ui/react';
import { 
  CheckCircleIcon, ArrowUpIcon, TimeIcon, SettingsIcon, SearchIcon, ViewIcon, WarningTwoIcon, DownloadIcon
} from '@chakra-ui/icons';
import { MdAttachMoney, MdAccountBalanceWallet, MdTrendingUp, MdPeople } from 'react-icons/md'; 
import axios from 'axios';

const GestaoFinanceira = () => {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processandoId, setProcessandoId] = useState(null);
  const [buscaHistorico, setBuscaHistorico] = useState('');
  const toast = useToast();

  const modalConfig = useDisclosure();
  const [configCompleta, setConfigCompleta] = useState({});
  const [tempoEnem, setTempoEnem] = useState(40); 
  const [tempoSimples, setTempoSimples] = useState(25);
  const [valorEnem, setValorEnem] = useState(4.00); 
  const [valorSimples, setValorSimples] = useState(3.00); 
  const [valorVIP, setValorVIP] = useState(1.50);
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [salvandoConfig, setSalvandoConfig] = useState(false);

  // GUARDAMOS AS TAXAS EM MEMÓRIA PARA O CÁLCULO DO RECIBO
  const [taxasPlataforma, setTaxasPlataforma] = useState({ enem: 4.00, simples: 3.00, vip: 1.50 });

  const modalAnalise = useDisclosure();
  const [pagamentoEmAnalise, setPagamentoEmAnalise] = useState(null);
  const [motivoRecusa, setMotivoRecusa] = useState('');
  const [recusando, setRecusando] = useState(false);

  const modalRecibo = useDisclosure();
  const [reciboVisualizar, setReciboVisualizar] = useState(null);

  const [filtroDataAuditoria, setFiltroDataAuditoria] = useState('MES_ATUAL');
  const [dtInicioAuditoria, setDtInicioAuditoria] = useState('');
  const [dtFimAuditoria, setDtFimAuditoria] = useState('');

  const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

  const aplicarMascaraCNPJ = (valor) => {
    let v = valor.replace(/\D/g, ''); 
    if (v.length > 14) v = v.substring(0, 14); 
    v = v.replace(/^(\d{2})(\d)/, '$1.$2');
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
    v = v.replace(/(\d{4})(\d)/, '$1-$2');
    return v;
  };

  const aplicarFiltroData = (itemData, filtro, inicio, fim) => {
      if (!itemData) return false;
      const dataItem = new Date(itemData);
      const hoje = new Date();
      if (filtro === 'MES_ATUAL') { return dataItem.getMonth() === hoje.getMonth() && dataItem.getFullYear() === hoje.getFullYear(); }
      if (filtro === 'MES_ANTERIOR') { const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1); return dataItem.getMonth() === mesAnterior.getMonth() && dataItem.getFullYear() === mesAnterior.getFullYear(); }
      if (filtro === 'PERIODO') {
          if (!inicio && !fim) return true;
          const dInicio = inicio ? new Date(inicio) : new Date('2000-01-01');
          const dFim = fim ? new Date(fim) : new Date('2100-01-01');
          dFim.setHours(23, 59, 59, 999);
          return dataItem >= dInicio && dataItem <= dFim;
      }
      return true; 
  };

  const renderFiltroData = (filtro, setFiltro, dtInicio, setDtInicio, dtFim, setDtFim) => (
      <Flex gap={3} wrap="wrap" mb={4} p={4} bg="white" borderRadius="xl" border="1px solid" borderColor="gray.200" align="center" shadow="sm">
          <Icon as={TimeIcon} color="gray.500" />
          <Select w="200px" size="sm" bg="gray.50" value={filtro} onChange={e => setFiltro(e.target.value)}>
              <option value="TUDO">Todo o Histórico</option>
              <option value="MES_ATUAL">Mês Atual</option>
              <option value="MES_ANTERIOR">Mês Anterior</option>
              <option value="PERIODO">Período Específico</option>
          </Select>
          {filtro === 'PERIODO' && (<HStack><Input type="date" bg="gray.50" size="sm" value={dtInicio} onChange={e => setDtInicio(e.target.value)} /><Text fontSize="sm" color="gray.500">até</Text><Input type="date" bg="gray.50" size="sm" value={dtFim} onChange={e => setDtFim(e.target.value)} /></HStack>)}
          <Divider orientation="vertical" h="30px" display={{ base: 'none', md: 'block' }} mx={2} />
          <InputGroup size="sm" maxW="300px" flex={1}><InputLeftElement pointerEvents='none'><SearchIcon color='gray.400' /></InputLeftElement><Input placeholder="Filtrar por nome ou e-mail..." value={buscaHistorico} onChange={e => setBuscaHistorico(e.target.value)} bg="gray.50" /></InputGroup>
      </Flex>
  );

  const carregarDados = async (silencioso = false) => {
    try {
      if (!silencioso) setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://127.0.0.1:8000/api/gestao/financeiro/dashboard/', { headers: { Authorization: `Bearer ${token}` } });
      setDados(res.data);
      
      // Carrega as taxas de pagamento em background para fazermos os cálculos locais
      try {
          const cfgRes = await axios.get('http://127.0.0.1:8000/api/gestao/configuracoes/', { headers: { Authorization: `Bearer ${token}` } });
          setTaxasPlataforma({
              enem: parseFloat(cfgRes.data.valor_pagamento_enem) || 4.00,
              simples: parseFloat(cfgRes.data.valor_pagamento_simples) || 3.00,
              vip: parseFloat(cfgRes.data.valor_bonus_vip) || 1.50
          });
      } catch(e) {}

    } catch (error) {
      if (!silencioso) toast({ title: 'Erro ao carregar dados financeiros', status: 'error' });
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  useEffect(() => { 
      carregarDados(); 
      const interval = setInterval(() => { carregarDados(true); }, 10000);
      return () => clearInterval(interval);
  }, []);

  const abrirAnalise = (pagamento) => { setPagamentoEmAnalise(pagamento); setMotivoRecusa(''); setRecusando(false); modalAnalise.onOpen(); };

  const confirmarBaixaReal = async () => {
    setProcessandoId(pagamentoEmAnalise.pagamento_id);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://127.0.0.1:8000/api/gestao/financeiro/baixar-pagamento/${pagamentoEmAnalise.pagamento_id}/`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: 'Pagamento Finalizado!', description: `A carteira foi subtraída e o recibo arquivado.`, status: 'success' });
      carregarDados();
    } catch (error) { toast({ title: 'Erro ao baixar pagamento', status: 'error' }); } finally { setProcessandoId(null); modalAnalise.onClose(); }
  };

  const recusarReciboReal = async () => {
      if(!motivoRecusa.trim()) { return toast({ title: 'Atenção', description: 'Escreva o motivo da recusa.', status: 'warning' }); }
      setProcessandoId(pagamentoEmAnalise.pagamento_id);
      try {
        const token = localStorage.getItem('token');
        await axios.post(`http://127.0.0.1:8000/api/gestao/financeiro/recusar-recibo/${pagamentoEmAnalise.pagamento_id}/`, { motivo_recusa: motivoRecusa }, { headers: { Authorization: `Bearer ${token}` } });
        toast({ title: 'Recibo Recusado', description: `O corretor foi notificado para enviar novamente.`, status: 'info' });
        carregarDados();
      } catch (error) { toast({ title: 'Erro ao recusar', status: 'error' }); } finally { setProcessandoId(null); modalAnalise.onClose(); }
  };

  const abrirConfiguracoes = async () => {
    try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://127.0.0.1:8000/api/gestao/configuracoes/', { headers: { Authorization: `Bearer ${token}` } });
        setConfigCompleta(res.data);
        setTempoEnem(res.data.tempo_limite_enem_minutos); setTempoSimples(res.data.tempo_limite_simples_minutos);
        setValorEnem(res.data.valor_pagamento_enem); setValorSimples(res.data.valor_pagamento_simples); setValorVIP(res.data.valor_bonus_vip);
        setRazaoSocial(res.data.razao_social_plataforma || ''); setCnpj(aplicarMascaraCNPJ(res.data.cnpj_plataforma || ''));
        modalConfig.onOpen();
    } catch (e) { toast({ title: 'Erro ao carregar', status: 'error' }); }
  };

  const salvarConfiguracoes = async () => {
      setSalvandoConfig(true);
      try {
          const token = localStorage.getItem('token');
          const payload = { 
            ...configCompleta, tempo_limite_enem_minutos: tempoEnem, tempo_limite_simples_minutos: tempoSimples, 
            valor_pagamento_enem: valorEnem, valor_pagamento_simples: valorSimples, valor_bonus_vip: valorVIP, 
            razao_social_plataforma: razaoSocial, cnpj_plataforma: cnpj 
          };
          await axios.put('http://127.0.0.1:8000/api/gestao/configuracoes/', payload, { headers: { Authorization: `Bearer ${token}` } });
          toast({ title: "Atualizado com sucesso!", status: "success" }); modalConfig.onClose(); carregarDados(); 
      } catch (e) { toast({ title: 'Erro ao salvar', status: 'error' }); }
      setSalvandoConfig(false);
  };

  // ==============================================================================
  // A MÁGICA DE CÁLCULO DAS REDAÇÕES NO FRONTEND
  // ==============================================================================
  const abrirModalRedacoes = async (reciboItem) => {
    setReciboVisualizar({ ...reciboItem, loading: true });
    modalRecibo.onOpen();

    try {
        const token = localStorage.getItem('token');
        // Usamos a lista geral de redações para pescar as deste professor
        const res = await axios.get('http://127.0.0.1:8000/api/gestao/redacoes/', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const todasRedacoes = res.data;
        const dataReferencia = new Date(reciboItem.data_solicitacao || reciboItem.data_pagamento || reciboItem.data);

        // Filtra as redações que ele corrigiu antes desse pagamento
        let redaDoProfessor = todasRedacoes.filter(r => 
            r.corretor_nome === reciboItem.corretor_nome &&
            ['CORRIGIDA', 'EM_QA', 'FINALIZADA'].includes(r.status) &&
            new Date(r.data_envio) <= dataReferencia
        );

        // Puxa as mais antigas primeiro (Primeiras a entrar = Primeiras a serem pagas)
        redaDoProfessor.sort((a, b) => new Date(a.data_envio).getTime() - new Date(b.data_envio).getTime());

        let normaisAContar = reciboItem.qtd_normal || 0;
        let vipsAContar = reciboItem.qtd_vip || 0;
        let redaFinais = [];

        // Monta o detalhe da tabela com a quantidade cobrada no recibo
        for (let r of redaDoProfessor) {
            if (normaisAContar === 0 && vipsAContar === 0) break;

            const isVip = r.is_urgente || r.vip_pago;
            const tipo = r.tema_tipo || r.tipo || 'ENEM';
            const base = tipo.toUpperCase() === 'SIMPLES' ? taxasPlataforma.simples : taxasPlataforma.enem;
            const bonus = isVip ? taxasPlataforma.vip : 0;

            let descricao = `Correção ${tipo} (#${r.id})`;
            if (bonus > 0) descricao += " + Bônus Especial";

            if (isVip && vipsAContar > 0) {
                redaFinais.push({ id: r.id, data: r.data_envio, descricao, valor: base + bonus });
                vipsAContar--;
            } else if (!isVip && normaisAContar > 0) {
                redaFinais.push({ id: r.id, data: r.data_envio, descricao, valor: base + bonus });
                normaisAContar--;
            }
        }

        // Mostra na tabela da mais recente para a mais antiga
        redaFinais.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

        setReciboVisualizar({ ...reciboItem, redacoes: redaFinais, loading: false });

    } catch (e) {
        setReciboVisualizar({ ...reciboItem, redacoes: [], loading: false });
        toast({ title: "Erro de Conexão", description: "Não conseguimos extrair o extrato detalhado.", status: "error" });
    }
  };

  if (loading) return <Flex w="full" h="100vh" align="center" justify="center"><Spinner size="xl" color="teal.500" thickness="4px" /></Flex>;

  const historicoAuditoriaFiltrado = dados?.historico_pagamentos?.filter(p => {
      const matchBusca = p.corretor_nome.toLowerCase().includes(buscaHistorico.toLowerCase()) || p.email.toLowerCase().includes(buscaHistorico.toLowerCase());
      const matchData = aplicarFiltroData(p.data_pagamento || p.data, filtroDataAuditoria, dtInicioAuditoria, dtFimAuditoria);
      const matchStatus = p.status === 'PAGO'; 
      return matchBusca && matchData && matchStatus;
  }) || [];

  return (
    <Container maxW="container.xl" py={8} px={{ base: 4, md: 8 }}>
      
      <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
        <Box>
          <Heading color="gray.800" mb={1}>Painel Financeiro 📊</Heading>
          <Text color="gray.500">Acompanhe o faturamento da plataforma e faça a gestão financeira.</Text>
        </Box>
        <Button leftIcon={<SettingsIcon />} colorScheme="teal" variant="outline" onClick={abrirConfiguracoes} shadow="sm">
          Configurações da Plataforma
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 5 }} spacing={6} mb={10}>
        <Card bg="white" shadow="sm" border="1px solid" borderColor="gray.200" borderRadius="xl" borderTop="4px solid" borderTopColor="green.400"><CardBody><Stat><Flex justify="space-between" align="center" mb={2}><StatLabel color="gray.500" fontWeight="bold" textTransform="uppercase" fontSize="xs">Faturamento (Mês)</StatLabel><Flex bg="green.50" p={2} borderRadius="md"><Icon as={ArrowUpIcon} color="green.500" /></Flex></Flex><StatNumber fontSize="2xl" fontWeight="900" color="gray.700">{formatarMoeda(dados?.faturamento_mes || 0)}</StatNumber><StatHelpText mb={0} color="green.500" fontSize="xs" fontWeight="bold">Dinheiro em caixa</StatHelpText></Stat></CardBody></Card>
        <Card bg="orange.50" shadow="sm" border="1px solid" borderColor="orange.200" borderRadius="xl"><CardBody><Stat><Flex justify="space-between" align="center" mb={2}><StatLabel color="orange.700" fontWeight="bold" textTransform="uppercase" fontSize="xs">Aguardando Pagto</StatLabel><Flex bg="orange.100" p={2} borderRadius="md"><Icon as={TimeIcon} color="orange.600" /></Flex></Flex><StatNumber fontSize="2xl" fontWeight="900" color="orange.800">{formatarMoeda(dados?.aguardando_pagamento || 0)}</StatNumber><StatHelpText mb={0} color="orange.600" fontSize="xs" fontWeight="bold">PIX/Cartão deste mês</StatHelpText></Stat></CardBody></Card>
        <Card bg="blue.50" shadow="sm" border="1px solid" borderColor="blue.200" borderRadius="xl"><CardBody><Stat><Flex justify="space-between" align="center" mb={2}><StatLabel color="blue.700" fontWeight="bold" textTransform="uppercase" fontSize="xs">Lucro Bruto (Mês)</StatLabel><Flex bg="blue.100" p={2} borderRadius="md"><Icon as={MdTrendingUp} color="blue.600" /></Flex></Flex><StatNumber fontSize="2xl" fontWeight="900" color="blue.800">{formatarMoeda(dados?.lucro_bruto_estimado || 0)}</StatNumber><StatHelpText mb={0} color="blue.600" fontSize="xs" fontWeight="bold">Após pagar corretores</StatHelpText></Stat></CardBody></Card>
        <Card bg="white" shadow="sm" border="1px solid" borderColor="gray.200" borderRadius="xl" borderTop="4px solid" borderTopColor="red.400"><CardBody><Stat><Flex justify="space-between" align="center" mb={2}><StatLabel color="gray.500" fontWeight="bold" textTransform="uppercase" fontSize="xs">A Pagar (Equipe)</StatLabel><Flex bg="red.50" p={2} borderRadius="md"><Icon as={MdPeople} color="red.500" /></Flex></Flex><StatNumber fontSize="2xl" fontWeight="900" color="red.600">{formatarMoeda(dados?.total_a_pagar_corretores || 0)}</StatNumber><StatHelpText mb={0} color="red.400" fontSize="xs" fontWeight="bold">Dívida pendente</StatHelpText></Stat></CardBody></Card>
        <Card bg="gray.800" shadow="xl" borderRadius="xl"><CardBody><Stat><Flex justify="space-between" align="center" mb={2}><StatLabel color="gray.400" fontWeight="bold" textTransform="uppercase" fontSize="xs">Total Histórico</StatLabel><Flex bg="gray.700" p={2} borderRadius="md"><Icon as={MdAccountBalanceWallet} color="yellow.400" /></Flex></Flex><StatNumber fontSize="2xl" fontWeight="900" color="white">{formatarMoeda(dados?.faturamento_total || 0)}</StatNumber><StatHelpText mb={0} color="gray.400" fontSize="xs">Desde o lançamento</StatHelpText></Stat></CardBody></Card>
      </SimpleGrid>

      <Tabs colorScheme="teal" isLazy>
        <TabList mb={4}>
            <Tab fontWeight="bold" fontSize="md"><Icon as={MdAttachMoney} mr={2} /> Folha a Transferir</Tab>
            <Tab fontWeight="bold" fontSize="md"><Icon as={CheckCircleIcon} mr={2} /> Auditoria de Pagamentos</Tab>
        </TabList>

        <TabPanels>
            <TabPanel p={0}>
              <Card shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.200" overflow="hidden" bg="white">
                <Box overflowX="auto">
                  {dados?.folha_pagamento && dados.folha_pagamento.length > 0 ? (
                    <Table variant="simple">
                      <Thead bg="gray.50"><Tr><Th py={4}>Corretor</Th><Th>Contacto</Th><Th>Dados Bancários</Th><Th textAlign="center">Redações Feitas</Th><Th isNumeric>Valor a Receber</Th><Th textAlign="center" w="180px">Status / Ação</Th></Tr></Thead>
                      <Tbody>
                        {dados.folha_pagamento.map((prof) => (
                          <Tr key={prof.corretor_id} _hover={{ bg: "gray.50" }} bg={prof.status_pagamento === 'EM_ANALISE' ? 'blue.50' : prof.status_pagamento === 'RECUSADO' ? 'red.50' : prof.saque_solicitado ? 'yellow.50' : 'transparent'}>
                            <Td fontWeight="bold" color="gray.700"><Flex align="center" wrap="wrap">{prof.nome}{prof.saque_solicitado && !prof.status_pagamento && <Badge ml={2} colorScheme="yellow">💰 SOLICITOU SAQUE</Badge>}</Flex></Td>
                            <Td><Text fontSize="sm" color="gray.600">{prof.email}</Text><Text fontSize="xs" color="gray.400">{prof.telefone}</Text></Td>
                            <Td>
                              {prof.chave_pix ? (
                                <Box><Badge colorScheme="teal" mb={1} px={2} py={0.5} borderRadius="md">PIX {prof.tipo_chave_pix ? `- ${prof.tipo_chave_pix}` : ''}</Badge><Text fontSize="sm" fontWeight="bold" color="gray.700">{prof.chave_pix}</Text></Box>
                              ) : prof.agencia_conta ? (
                                <Box><Badge colorScheme="blue" mb={1} px={2} py={0.5} borderRadius="md">BANCÁRIO</Badge><Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">{prof.banco}</Text><Text fontSize="sm" color="gray.700">{prof.agencia_conta}</Text></Box>
                              ) : (<Text fontSize="xs" color="red.500" fontStyle="italic">Sem dados bancários.</Text>)}
                            </Td>
                            <Td textAlign="center"><Badge colorScheme="blue" mr={1}>{prof.qtd_normal} Normal</Badge><Badge colorScheme="purple">{prof.qtd_vip} VIP</Badge></Td>
                            <Td isNumeric><Badge colorScheme="red" fontSize="sm" px={3} py={1} borderRadius="full">{formatarMoeda(prof.valor_a_receber)}</Badge></Td>
                            <Td textAlign="center">
                              {!prof.status_pagamento && prof.saque_solicitado === false && (<Badge colorScheme="gray">Aguardando Corretor</Badge>)}
                              {prof.status_pagamento === 'AGUARDANDO_RECIBO' && (<Badge colorScheme="yellow" p={1.5} borderRadius="md"><TimeIcon mr={1}/> Aguardando PDF</Badge>)}
                              {prof.status_pagamento === 'EM_ANALISE' && (<Button size="sm" colorScheme="blue" leftIcon={<ViewIcon />} onClick={() => abrirAnalise(prof)} shadow="sm" animation="pulse 1.5s infinite">Analisar Recibo</Button>)}
                              {prof.status_pagamento === 'RECUSADO' && (<Badge colorScheme="red" p={1.5} borderRadius="md"><WarningTwoIcon mr={1}/> RECUSADO</Badge>)}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  ) : (
                    <Flex direction="column" align="center" justify="center" p={10} bg="gray.50"><CheckCircleIcon boxSize={10} color="green.400" mb={4} /><Heading size="sm" color="gray.600" mb={1}>Tudo em dia!</Heading><Text color="gray.500" fontSize="sm">Não há nenhum pagamento pendente para os professores neste momento.</Text></Flex>
                  )}
                </Box>
              </Card>
            </TabPanel>

            <TabPanel p={0}>
              {renderFiltroData(filtroDataAuditoria, setFiltroDataAuditoria, dtInicioAuditoria, setDtInicioAuditoria, dtFimAuditoria, setDtFimAuditoria)}

              <Card shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.200" overflow="hidden" bg="white">
                <Box overflowX="auto">
                  <Table variant="simple">
                    <Thead bg="gray.50"><Tr><Th py={4}>Solicitação</Th><Th>Pagamento</Th><Th>Corretor</Th><Th textAlign="center">Redações Quitadas</Th><Th isNumeric>Valor Pago</Th><Th textAlign="center">Recibo</Th></Tr></Thead>
                    <Tbody>
                      {historicoAuditoriaFiltrado.map((item) => (
                        <Tr key={item.id} _hover={{ bg: "gray.50" }}>
                          <Td>
                            <Text fontSize="sm" fontWeight="bold" color="gray.700">{item.data_solicitacao ? new Date(item.data_solicitacao).toLocaleDateString('pt-BR') : 'N/A'}</Text>
                            {item.data_solicitacao && (<Text fontSize="xs" color="gray.500">{new Date(item.data_solicitacao).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</Text>)}
                          </Td>
                          <Td>
                            <Text fontSize="sm" fontWeight="bold" color="green.600">{item.data_pagamento ? new Date(item.data_pagamento).toLocaleDateString('pt-BR') : new Date(item.data).toLocaleDateString('pt-BR')}</Text>
                            <Text fontSize="xs" color="gray.500">{item.data_pagamento ? new Date(item.data_pagamento).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : new Date(item.data).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</Text>
                          </Td>
                          <Td><Text fontWeight="bold" color="gray.800">{item.corretor_nome}</Text><Text fontSize="xs" color="gray.500">{item.email}</Text></Td>
                          <Td textAlign="center"><Badge colorScheme="blue" mr={1}>{item.qtd_normal} Normais</Badge><Badge colorScheme="purple">{item.qtd_vip} VIPs</Badge></Td>
                          <Td isNumeric fontWeight="bold" color="green.600">{formatarMoeda(item.valor)}</Td>
                          <Td textAlign="center">
                              <HStack spacing={2} justify="center">
                                  {/* BOTÃO CHAMA A NOVA FUNÇÃO DE AUTO-CÁLCULO */}
                                  <Button size="sm" colorScheme="blue" variant="solid" leftIcon={<ViewIcon />} onClick={() => abrirModalRedacoes(item)}>Ver Redações</Button>
                                  {item.arquivo_recibo_url ? (
                                      <Button size="sm" colorScheme="teal" variant="outline" leftIcon={<DownloadIcon />} as="a" href={`http://127.0.0.1:8000${item.arquivo_recibo_url}`} target="_blank">PDF</Button>
                                  ) : (
                                      <Text fontSize="xs" color="gray.400" fontStyle="italic">Antigo/S.Arq</Text>
                                  )}
                              </HStack>
                          </Td>
                        </Tr>
                      ))}
                      {historicoAuditoriaFiltrado.length === 0 && (<Tr><Td colSpan={6} textAlign="center" py={8} color="gray.500">Nenhum registo de pagamento finalizado encontrado para este filtro.</Td></Tr>)}
                    </Tbody>
                  </Table>
                </Box>
              </Card>
            </TabPanel>
        </TabPanels>
      </Tabs>

      <Modal isOpen={modalAnalise.isOpen} onClose={modalAnalise.onClose} isCentered size="xl">
          <ModalOverlay backdropFilter="blur(3px)" />
          <ModalContent borderRadius="xl">
              <ModalHeader bg="blue.50" borderBottom="1px solid" borderColor="blue.100" color="blue.800">Análise Financeira</ModalHeader>
              <ModalCloseButton />
              <ModalBody py={6}>
                  <VStack spacing={5} align="stretch">
                      <Box bg="gray.50" p={4} borderRadius="md" border="1px dashed" borderColor="gray.300">
                          <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">Favorecido</Text>
                          <Heading size="sm" mb={1}>{pagamentoEmAnalise?.nome}</Heading>
                          <Text fontSize="lg" fontWeight="900" color="green.500" mb={3}>{formatarMoeda(pagamentoEmAnalise?.valor_a_receber)}</Text>
                          <Divider borderColor="gray.300" mb={3} />
                          {pagamentoEmAnalise?.chave_pix ? (
                              <Box><Text fontSize="xs" fontWeight="bold" color="gray.500">PIX ({pagamentoEmAnalise.tipo_chave_pix})</Text><Text fontWeight="bold" color="gray.800">{pagamentoEmAnalise.chave_pix}</Text></Box>
                          ) : (
                              <Box><Text fontSize="xs" fontWeight="bold" color="gray.500">CONTA BANCÁRIA ({pagamentoEmAnalise?.banco})</Text><Text fontWeight="bold" color="gray.800">{pagamentoEmAnalise?.agencia_conta}</Text></Box>
                          )}
                      </Box>
                      <Button as="a" href={pagamentoEmAnalise?.arquivo_recibo_url ? `http://127.0.0.1:8000${pagamentoEmAnalise.arquivo_recibo_url}` : '#'} target="_blank" size="lg" colorScheme="blue" variant="outline" leftIcon={<ViewIcon />} w="full">Ver PDF do Recibo Assinado</Button>
                      {recusando ? (
                          <Box bg="red.50" p={4} borderRadius="md" border="1px solid" borderColor="red.200">
                              <FormLabel fontSize="sm" fontWeight="bold" color="red.700">Qual o problema com o recibo?</FormLabel>
                              <Textarea bg="white" value={motivoRecusa} onChange={e => setMotivoRecusa(e.target.value)} placeholder="Ex: A assinatura está ilegível ou faltou preencher o CPF." rows={3} mb={3} />
                              <HStack><Button size="sm" onClick={() => setRecusando(false)}>Cancelar</Button><Button size="sm" colorScheme="red" onClick={recusarReciboReal} isLoading={processandoId === pagamentoEmAnalise?.pagamento_id}>Confirmar Recusa</Button></HStack>
                          </Box>
                      ) : (
                          <HStack spacing={3}>
                              <Button colorScheme="red" variant="ghost" flex={1} onClick={() => setRecusando(true)}>Recusar Recibo</Button>
                              <Button colorScheme="green" flex={2} onClick={confirmarBaixaReal} isLoading={processandoId === pagamentoEmAnalise?.pagamento_id}>Já Fiz o PIX e Aprovo</Button>
                          </HStack>
                      )}
                  </VStack>
              </ModalBody>
          </ModalContent>
      </Modal>

      {/* O NOVO MODAL INTELIGENTE DO FINANCEIRO COM CARREGAMENTO */}
      <Modal isOpen={modalRecibo.isOpen} onClose={modalRecibo.onClose} isCentered size="2xl" scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(3px)" />
        <ModalContent borderRadius="xl">
          <ModalHeader bg="teal.600" color="white" borderTopRadius="xl">Redações Pagas neste Recibo</ModalHeader>
          <ModalCloseButton color="white" mt={1} />
          <ModalBody py={6}>
            {reciboVisualizar?.loading ? (
                <Flex justify="center" align="center" py={10} direction="column" gap={4}>
                    <Spinner size="xl" color="teal.500" thickness="4px" />
                    <Text color="gray.500" fontWeight="bold">Calculando redações do recibo...</Text>
                </Flex>
            ) : reciboVisualizar && (
              <>
                <Flex justify="space-between" mb={4} p={3} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200" wrap="wrap" gap={3}>
                  <Text fontWeight="bold" color="gray.600">Data do Pagamento: {new Date(reciboVisualizar.data_pagamento || reciboVisualizar.data_solicitacao).toLocaleDateString('pt-BR')}</Text>
                  <Text fontWeight="bold" color="green.600">Valor Total: {formatarMoeda(reciboVisualizar.valor)}</Text>
                </Flex>
                <Table variant="simple" size="sm">
                  <Thead bg="gray.100"><Tr><Th>Data da Correção</Th><Th>Descrição</Th><Th isNumeric>Valor</Th></Tr></Thead>
                  <Tbody>
                    {reciboVisualizar.redacoes && reciboVisualizar.redacoes.map((t, index) => (
                      <Tr key={index}><Td>{new Date(t.data).toLocaleString('pt-BR')}</Td><Td fontWeight="medium">{t.descricao}</Td><Td isNumeric fontWeight="bold" color="green.500">{formatarMoeda(t.valor)}</Td></Tr>
                    ))}
                    {(!reciboVisualizar.redacoes || reciboVisualizar.redacoes.length === 0) && (
                      <Tr><Td colSpan={3} textAlign="center" py={6} color="gray.500">Nenhuma redação antiga pôde ser resgatada deste recibo.</Td></Tr>
                    )}
                  </Tbody>
                </Table>
              </>
            )}
          </ModalBody>
          <ModalFooter bg="gray.50" borderBottomRadius="xl"><Button colorScheme="teal" onClick={modalRecibo.onClose}>Fechar</Button></ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={modalConfig.isOpen} onClose={modalConfig.onClose} isCentered size="xl">
        <ModalOverlay backdropFilter="blur(3px)" />
        <ModalContent borderRadius="xl" overflow="hidden">
            <ModalHeader color="teal.700" bg="white" borderBottom="1px solid" borderColor="gray.100">Configurações e Taxas</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={8} bg="gray.50">
                <VStack spacing={6} align="stretch" mt={4}>
                    <Box mb={2}>
                        <Text fontWeight="bold" color="gray.700" fontSize="sm" mb={3} textTransform="uppercase" letterSpacing="wide">Dados da Empresa (Recibos)</Text>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            <FormControl bg="white" p={4} borderRadius="xl" border="1px solid" borderColor="gray.200" shadow="sm"><FormLabel fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>Razão Social</FormLabel><Input size="sm" value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} placeholder="Ex: Guia do Texto LTDA" /></FormControl>
                            <FormControl bg="white" p={4} borderRadius="xl" border="1px solid" borderColor="gray.200" shadow="sm"><FormLabel fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>CNPJ</FormLabel><Input size="sm" value={cnpj} onChange={e => setCnpj(aplicarMascaraCNPJ(e.target.value))} placeholder="Ex: 00.000.000/0001-00" maxLength={18} /></FormControl>
                        </SimpleGrid>
                    </Box>
                    <Divider borderColor="gray.300" />
                    
                    <Box>
                        <Text fontWeight="bold" color="gray.700" fontSize="sm" mb={3} textTransform="uppercase" letterSpacing="wide">Repasse aos Professores</Text>
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                            <FormControl bg="white" p={4} borderRadius="xl" border="1px solid" borderColor="gray.200" shadow="sm"><FormLabel fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>Correção ENEM</FormLabel><InputGroup size="sm"><InputLeftAddon children='R$' bg="gray.100" /><Input type="number" step="0.01" value={valorEnem} onChange={e => setValorEnem(e.target.value)} /></InputGroup></FormControl>
                            <FormControl bg="white" p={4} borderRadius="xl" border="1px solid" borderColor="gray.200" shadow="sm"><FormLabel fontSize="xs" fontWeight="bold" color="gray.600" mb={2}>Correção Simples</FormLabel><InputGroup size="sm"><InputLeftAddon children='R$' bg="gray.100" /><Input type="number" step="0.01" value={valorSimples} onChange={e => setValorSimples(e.target.value)} /></InputGroup></FormControl>
                            <FormControl bg="purple.50" p={4} borderRadius="xl" border="1px solid" borderColor="purple.200" shadow="sm"><FormLabel fontSize="xs" color="purple.700" fontWeight="bold" mb={2}>Bônus VIP</FormLabel><InputGroup size="sm"><InputLeftAddon children='+ R$' bg="purple.100" color="purple.800" fontWeight="bold" /><Input type="number" step="0.01" value={valorVIP} onChange={e => setValorVIP(e.target.value)} bg="white" borderColor="purple.300" /></InputGroup></FormControl>
                        </SimpleGrid>
                    </Box>
                    <Divider borderColor="gray.300" />
                    <Box>
                        <Text fontWeight="bold" color="gray.700" fontSize="sm" mb={3} textTransform="uppercase" letterSpacing="wide">Prazos de Entrega (SLA)</Text>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                            <FormControl display="flex" alignItems="center" justifyContent="space-between" bg="white" p={3} borderRadius="xl" border="1px solid" borderColor="gray.200" shadow="sm"><FormLabel fontSize="sm" fontWeight="bold" color="gray.600" mb={0} m={0}>Fila ENEM</FormLabel><InputGroup size="sm" w="100px"><Input type="number" textAlign="right" value={tempoEnem} onChange={e => setTempoEnem(e.target.value)} /><InputRightAddon children='min' bg="gray.100" /></InputGroup></FormControl>
                            <FormControl display="flex" alignItems="center" justifyContent="space-between" bg="white" p={3} borderRadius="xl" border="1px solid" borderColor="gray.200" shadow="sm"><FormLabel fontSize="sm" fontWeight="bold" color="gray.600" mb={0} m={0}>Fila Simples</FormLabel><InputGroup size="sm" w="100px"><Input type="number" textAlign="right" value={tempoSimples} onChange={e => setTempoSimples(e.target.value)} /><InputRightAddon children='min' bg="gray.100" /></InputGroup></FormControl>
                        </SimpleGrid>
                    </Box>
                </VStack>
            </ModalBody>
            <ModalFooter bg="white" borderTop="1px solid" borderColor="gray.200"><Button variant="ghost" mr={3} onClick={modalConfig.onClose}>Cancelar</Button><Button colorScheme="teal" onClick={salvarConfiguracoes} isLoading={salvandoConfig} shadow="md">Guardar Alterações</Button></ModalFooter>
        </ModalContent>
      </Modal>

    </Container>
  );
};

export default GestaoFinanceira;