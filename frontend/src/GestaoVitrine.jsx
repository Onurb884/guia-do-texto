import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Container, Heading, Text, VStack, HStack, Button, Box, Icon,
  useToast, Flex, Badge, Card, SimpleGrid, useDisclosure, Modal, ModalOverlay, 
  ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, 
  FormControl, FormLabel, Input, Select, IconButton, Tabs, TabList, TabPanels, Tab, TabPanel, Switch, Textarea, Divider, Image,
  InputGroup, InputLeftAddon, InputRightAddon, InputLeftElement
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon, TimeIcon, CalendarIcon, AttachmentIcon, SettingsIcon, SearchIcon } from '@chakra-ui/icons';

function GestaoVitrine() {
  const [tabIndex, setTabIndex] = useState(0);

  const [banners, setBanners] = useState([]);
  const [pacotes, setPacotes] = useState([]);
  const [cupons, setCupons] = useState([]);

  // Estados dos Filtros
  const [buscaPacote, setBuscaPacote] = useState('');
  const [filtroPacote, setFiltroPacote] = useState('TODOS');
  
  const [buscaBanner, setBuscaBanner] = useState('');
  const [filtroBanner, setFiltroBanner] = useState('TODOS');
  
  const [buscaCupom, setBuscaCupom] = useState('');
  const [filtroCupom, setFiltroCupom] = useState('TODOS');

  // Configurações Globais da Loja
  const modalConfigLoja = useDisclosure();
  const [configCompleta, setConfigCompleta] = useState({});
  const [configLoja, setConfigLoja] = useState({ custo_creditos_vip: 2, preco_avulso_normal: 9.90, preco_avulso_vip: 14.90, tempo_carrossel_segundos: 6 });
  const [salvandoConfig, setSalvandoConfig] = useState(false);

  // Modais de Itens
  const modalBanner = useDisclosure();
  const [formBanner, setFormBanner] = useState({ id: null, tipo: 'OFERTA', titulo: '', descricao: '', cor_fundo: 'linear(to-br, orange.400, red.400)', pacote_vinculado: '', data_fim: '', ativo: true });
  const [arquivoBase64, setArquivoBase64] = useState(''); 
  const fileInputRef = useRef(null);

  const modalPacote = useDisclosure();
  const [formPacote, setFormPacote] = useState({ id: null, nome: '', descricao: '', preco: '', preco_original: '', qtd_creditos_simples: 0, qtd_creditos_vip: 0, ativo: true, permite_parcelamento: false, max_parcelas: 1, visivel_loja: true, compra_unica: false, selo_destaque: '' });

  const modalCupom = useDisclosure();
  const [formCupom, setFormCupom] = useState({ id: null, codigo: '', desconto_percentual: '', limite_usos: 100, data_validade: '', ativo: true });

  const toast = useToast();

  useEffect(() => { 
      if (tabIndex === 0) carregarPacotes();
      if (tabIndex === 1) { carregarBanners(); carregarPacotes(); }
      if (tabIndex === 2) carregarCupons();
  }, [tabIndex]);

  const carregarPacotes = async () => { try { const res = await axios.get('http://127.0.0.1:8000/api/gestao/pacotes/', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); setPacotes(res.data); } catch (e) {} };
  const carregarBanners = async () => { try { const res = await axios.get('http://127.0.0.1:8000/api/gestao/banners/', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); setBanners(res.data); } catch (e) {} };
  const carregarCupons = async () => { try { const res = await axios.get('http://127.0.0.1:8000/api/gestao/cupons/', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); setCupons(res.data); } catch (e) {} };

  // --- FILTRAGENS ---
  const pacotesFiltrados = pacotes.filter(p => {
      const matchBusca = p.nome.toLowerCase().includes(buscaPacote.toLowerCase());
      const matchStatus = filtroPacote === 'TODOS' ? true : (filtroPacote === 'ATIVOS' ? p.ativo : !p.ativo);
      return matchBusca && matchStatus;
  });

  const bannersFiltrados = banners.filter(b => {
      const matchBusca = b.titulo.toLowerCase().includes(buscaBanner.toLowerCase());
      const matchStatus = filtroBanner === 'TODOS' ? true : (filtroBanner === 'ATIVOS' ? b.ativo : !b.ativo);
      return matchBusca && matchStatus;
  });

  const cuponsFiltrados = cupons.filter(c => {
      const matchBusca = c.codigo.toLowerCase().includes(buscaCupom.toLowerCase());
      const matchStatus = filtroCupom === 'TODOS' ? true : (filtroCupom === 'ATIVOS' ? c.ativo : !c.ativo);
      return matchBusca && matchStatus;
  });

  // --- CONFIGURAÇÕES DA LOJA ---
  const abrirConfiguracoes = async () => {
      try {
          const res = await axios.get('http://127.0.0.1:8000/api/gestao/configuracoes/', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
          setConfigCompleta(res.data);
          setConfigLoja({
              custo_creditos_vip: res.data.custo_creditos_vip,
              preco_avulso_normal: res.data.preco_avulso_normal,
              preco_avulso_vip: res.data.preco_avulso_vip,
              tempo_carrossel_segundos: res.data.tempo_carrossel_segundos || 6
          });
          modalConfigLoja.onOpen();
      } catch (e) {}
  };

  const salvarConfiguracoes = async () => {
      setSalvandoConfig(true);
      try {
          const payload = { ...configCompleta, ...configLoja };
          await axios.put('http://127.0.0.1:8000/api/gestao/configuracoes/', payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
          toast({ title: "Configurações salvas!", status: "success" });
          modalConfigLoja.onClose();
      } catch (e) { toast({ title: "Erro ao salvar", status: "error" }); }
      setSalvandoConfig(false);
  };

  // --- BANNERS ---
  const handleImageUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => { setArquivoBase64(reader.result); };
          reader.readAsDataURL(file);
      }
  };

  const removerImagem = () => {
      setArquivoBase64('');
      if (fileInputRef.current) { fileInputRef.current.value = ''; }
  };

  const abrirModalBanner = (b = null) => {
      setArquivoBase64('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (b) {
          const dataFimFormatada = b.data_fim ? b.data_fim.split('T')[0] + 'T' + b.data_fim.split('T')[1].substring(0,5) : '';
          setFormBanner({...b, data_fim: dataFimFormatada, pacote_vinculado: b.pacote_vinculado || ''});
          setArquivoBase64(b.imagem_fundo || ''); 
      } else {
          setFormBanner({ id: null, tipo: 'OFERTA', titulo: '', descricao: '', cor_fundo: 'linear(to-br, orange.400, red.400)', pacote_vinculado: '', data_fim: '', ativo: true });
      }
      modalBanner.onOpen();
  };

  const salvarBanner = async () => {
      try {
          const token = localStorage.getItem('token');
          const payload = { tipo: formBanner.tipo, titulo: formBanner.titulo, descricao: formBanner.descricao || '', cor_fundo: formBanner.cor_fundo, ativo: formBanner.ativo, imagem_fundo: arquivoBase64 || '', pacote_vinculado: formBanner.pacote_vinculado || null, data_fim: formBanner.data_fim || null };
          if (formBanner.id) await axios.patch(`http://127.0.0.1:8000/api/gestao/banners/${formBanner.id}/`, payload, { headers: { Authorization: `Bearer ${token}` } });
          else await axios.post('http://127.0.0.1:8000/api/gestao/banners/', payload, { headers: { Authorization: `Bearer ${token}` } });
          toast({ title: "Campanha salva!", status: "success" }); modalBanner.onClose(); carregarBanners();
      } catch (e) { toast({ title: "Erro ao salvar", status: "error" }); }
  };

  const excluirBanner = async (id) => {
      if (!window.confirm("Excluir esta campanha?")) return;
      try { await axios.delete(`http://127.0.0.1:8000/api/gestao/banners/${id}/`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); toast({ title: "Excluída", status: "info" }); carregarBanners(); } catch (e) {}
  };

  // --- PACOTES E CUPONS ---
  const abrirModalPacote = (p = null) => { if (p) setFormPacote({...p, preco_original: p.preco_original || '', selo_destaque: p.selo_destaque || ''}); else setFormPacote({ id: null, nome: '', descricao: '', preco: '', preco_original: '', qtd_creditos_simples: 0, qtd_creditos_vip: 0, ativo: true, permite_parcelamento: false, max_parcelas: 1, visivel_loja: true, compra_unica: false, selo_destaque: '' }); modalPacote.onOpen(); };
  const salvarPacote = async () => { try { const payload = { ...formPacote }; if(!payload.preco_original) payload.preco_original = null; if (formPacote.id) await axios.put(`http://127.0.0.1:8000/api/gestao/pacotes/${formPacote.id}/`, payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); else await axios.post('http://127.0.0.1:8000/api/gestao/pacotes/', payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); toast({ title: "Pacote salvo", status: "success" }); modalPacote.onClose(); carregarPacotes(); } catch (e) {} };
  const excluirPacote = async (id) => { if (window.confirm("Excluir?")) { await axios.delete(`http://127.0.0.1:8000/api/gestao/pacotes/${id}/`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); carregarPacotes(); } };

  const abrirModalCupom = (c = null) => { if (c) setFormCupom({ ...c, data_validade: c.data_validade ? c.data_validade.split('T')[0] : '' }); else setFormCupom({ id: null, codigo: '', desconto_percentual: '', limite_usos: 100, data_validade: '', ativo: true }); modalCupom.onOpen(); };
  const salvarCupom = async () => { try { const payload = { ...formCupom, codigo: formCupom.codigo.toUpperCase() }; if (!payload.data_validade) payload.data_validade = null; if (formCupom.id) await axios.put(`http://127.0.0.1:8000/api/gestao/cupons/${formCupom.id}/`, payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); else await axios.post('http://127.0.0.1:8000/api/gestao/cupons/', payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); toast({ title: "Salvo", status: "success" }); modalCupom.onClose(); carregarCupons(); } catch (e) {} };
  const excluirCupom = async (id) => { if (window.confirm("Excluir?")) { await axios.delete(`http://127.0.0.1:8000/api/gestao/cupons/${id}/`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); carregarCupons(); } };

  return (
    <Container maxW="container.xl" py={8} bg="gray.50" minH="100vh">
        <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={4}>
            <Box><Heading size="lg" color="blue.700">Catálogo & E-commerce</Heading><Text color="gray.500">Gerencie pacotes, vitrine e cupons de desconto.</Text></Box>
            <Button leftIcon={<SettingsIcon />} colorScheme="gray" variant="outline" onClick={abrirConfiguracoes} shadow="sm">Configurações da Loja</Button>
        </Flex>

        <Tabs isLazy index={tabIndex} onChange={(i) => setTabIndex(i)}>
            <TabList mb={6} borderBottom="2px solid" borderColor="gray.200" gap={2}>
                <Tab _selected={{ color: 'blue.700', bg: 'blue.50', borderBottom: '3px solid', borderColor: 'blue.500', fontWeight: 'bold' }}>📦 Pacotes</Tab>
                <Tab _selected={{ color: 'orange.700', bg: 'orange.50', borderBottom: '3px solid', borderColor: 'orange.500', fontWeight: 'bold' }}>🖼️ Vitrine (Carrossel)</Tab>
                <Tab _selected={{ color: 'purple.700', bg: 'purple.50', borderBottom: '3px solid', borderColor: 'purple.500', fontWeight: 'bold' }}>🎟️ Cupons</Tab>
            </TabList>

            <TabPanels>
                {/* ABA PACOTES */}
                <TabPanel p={0}>
                    <Flex gap={4} bg="white" p={5} borderRadius="xl" boxShadow="sm" align="center" border="1px solid" borderColor="gray.100" mb={6} wrap="wrap">
                        <InputGroup flex={1} minW="250px">
                            <InputLeftElement pointerEvents='none'><SearchIcon color='gray.400'/></InputLeftElement>
                            <Input placeholder="Buscar pacote por nome..." value={buscaPacote} onChange={e => setBuscaPacote(e.target.value)} />
                        </InputGroup>
                        <Select w={{ base: "full", md: "180px" }} value={filtroPacote} onChange={e => setFiltroPacote(e.target.value)}>
                            <option value="TODOS">Status: Todos</option><option value="ATIVOS">Apenas Ativos</option><option value="INATIVOS">Apenas Inativos</option>
                        </Select>
                        <Divider orientation="vertical" h="30px" display={{ base: 'none', md: 'block' }} />
                        <Button colorScheme="blue" leftIcon={<AddIcon />} onClick={() => abrirModalPacote()} w={{ base: "full", md: "auto" }}>Novo Pacote</Button>
                    </Flex>
                    
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                        {pacotesFiltrados.map(p => (
                            <Card key={p.id} bg="white" shadow="md" borderRadius="xl" border="1px solid" borderColor={p.selo_destaque ? "yellow.400" : "gray.200"} position="relative" overflow="hidden" opacity={p.ativo ? 1 : 0.6}>
                                {!p.ativo && (<Box position="absolute" inset={0} bg="whiteAlpha.700" zIndex={1} display="flex" alignItems="center" justifyContent="center" pointerEvents="none"><Badge colorScheme="red" fontSize="lg" px={4} py={2} borderRadius="md" shadow="sm">INATIVO</Badge></Box>)}
                                {p.selo_destaque && (<Box position="absolute" top="0" right="0" bg="yellow.400" color="yellow.900" px={3} py={1} borderBottomLeftRadius="lg" fontSize="xs" fontWeight="900" zIndex={2}>🔥 {p.selo_destaque.toUpperCase()}</Box>)}
                                <Box p={5} display="flex" flexDirection="column" h="full" position="relative" zIndex={2}>
                                    <HStack mb={2} mt={p.selo_destaque ? 2 : 0}><Heading size="md" color="gray.800">{p.nome}</Heading>{!p.visivel_loja && <Badge colorScheme="gray">Oculto</Badge>}{p.compra_unica && <Badge colorScheme="purple">1x Única</Badge>}</HStack><Text fontSize="sm" color="gray.500" mb={4} noOfLines={2}>{p.descricao}</Text><HStack mb={4}><Badge colorScheme="blue">{p.qtd_creditos_simples} Normais</Badge><Badge colorScheme="purple">{p.qtd_creditos_vip} VIPs</Badge></HStack><Box mt="auto" pt={4} borderTop="1px solid" borderColor="gray.100" display="flex" justifyContent="space-between" alignItems="center"><Box>{p.preco_original && <Text fontSize="xs" color="gray.400" textDecoration="line-through">R$ {p.preco_original}</Text>}<Text fontSize="xl" fontWeight="900" color="green.600">R$ {parseFloat(p.preco).toFixed(2)}</Text></Box><HStack><IconButton size="sm" icon={<EditIcon />} variant="ghost" colorScheme="blue" onClick={() => abrirModalPacote(p)} /><IconButton size="sm" icon={<DeleteIcon />} variant="ghost" colorScheme="red" onClick={() => excluirPacote(p.id)} /></HStack></Box></Box>
                            </Card>
                        ))}
                        {pacotesFiltrados.length === 0 && <Text color="gray.500" gridColumn="1 / -1" textAlign="center">Nenhum pacote encontrado.</Text>}
                    </SimpleGrid>
                </TabPanel>

                {/* ABA BANNERS */}
                <TabPanel p={0}>
                    <Flex gap={4} bg="white" p={5} borderRadius="xl" boxShadow="sm" align="center" border="1px solid" borderColor="gray.100" mb={6} wrap="wrap">
                        <InputGroup flex={1} minW="250px">
                            <InputLeftElement pointerEvents='none'><SearchIcon color='gray.400'/></InputLeftElement>
                            <Input placeholder="Buscar campanha por título..." value={buscaBanner} onChange={e => setBuscaBanner(e.target.value)} />
                        </InputGroup>
                        <Select w={{ base: "full", md: "180px" }} value={filtroBanner} onChange={e => setFiltroBanner(e.target.value)}>
                            <option value="TODOS">Status: Todos</option><option value="ATIVOS">Apenas Ativos</option><option value="INATIVOS">Apenas Inativos</option>
                        </Select>
                        <Divider orientation="vertical" h="30px" display={{ base: 'none', md: 'block' }} />
                        <Button colorScheme="orange" leftIcon={<AddIcon />} onClick={() => abrirModalBanner()} w={{ base: "full", md: "auto" }}>Nova Campanha</Button>
                    </Flex>

                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                        {bannersFiltrados.map(b => {
                            const isExpirado = b.data_fim && new Date(b.data_fim).getTime() < new Date().getTime();
                            const mostrarOverlay = !b.ativo || isExpirado;
                            return (
                            <Card key={b.id} shadow="xl" borderRadius="2xl" border="none" overflow="hidden" position="relative" minH="200px" opacity={mostrarOverlay ? 0.6 : 1}>
                                {b.imagem_fundo ? (<><Image src={b.imagem_fundo} position="absolute" top={0} left={0} w="100%" h="100%" objectFit="cover" zIndex={0} pointerEvents="none" /><Box position="absolute" top={0} left={0} w="100%" h="100%" bgGradient="linear(to-r, rgba(0,0,0,0.9), rgba(0,0,0,0.4))" zIndex={1} pointerEvents="none" /></>) : (<Box position="absolute" top={0} left={0} w="100%" h="100%" bgGradient={b.cor_fundo} zIndex={0} pointerEvents="none" />)}
                                {mostrarOverlay && (<Box position="absolute" inset={0} bg="blackAlpha.600" zIndex={2} display="flex" flexDirection="column" alignItems="center" justifyContent="center" pointerEvents="none">{!b.ativo && <Badge colorScheme="red" fontSize="lg" px={4} py={2} borderRadius="md" mb={2} shadow="md">INATIVO</Badge>}{b.ativo && isExpirado && <Badge colorScheme="orange" fontSize="lg" px={4} py={2} borderRadius="md" shadow="md">EXPIRADO</Badge>}</Box>)}
                                <Box p={6} color="white" position="relative" zIndex={3} display="flex" flexDirection="column" h="full"><Flex justify="space-between" align="start" mb={4}><Badge colorScheme={b.tipo === 'EVENTO' ? 'green' : (b.tipo === 'OFERTA' ? 'red' : 'blue')} px={3} py={1} borderRadius="full">{b.tipo}</Badge><HStack><IconButton size="sm" icon={<EditIcon />} colorScheme="whiteAlpha" variant="solid" onClick={() => abrirModalBanner(b)} /><IconButton size="sm" icon={<DeleteIcon />} colorScheme="red" variant="solid" onClick={() => excluirBanner(b.id)} /></HStack></Flex><Heading size="md" mb={2} lineHeight="tight" noOfLines={2} textShadow={b.imagem_fundo ? "0px 2px 4px rgba(0,0,0,0.8)" : "none"}>{b.titulo}</Heading><Text fontSize="sm" opacity={0.9} mb={4} noOfLines={3}>{b.descricao}</Text><VStack align="stretch" spacing={2} mt="auto" bg="blackAlpha.400" backdropFilter="blur(4px)" p={3} borderRadius="lg">{b.tipo === 'OFERTA' && b.pacote_info && (<Text fontSize="xs" fontWeight="bold">📦 Ligado a: {b.pacote_info.nome}</Text>)}{b.data_fim ? (<HStack><Icon as={b.tipo === 'EVENTO' ? CalendarIcon : TimeIcon} color={isExpirado ? "orange.300" : "white"} /><Text fontSize="xs" fontWeight="bold" color={isExpirado ? "orange.300" : "white"}>{isExpirado ? 'Expirou em:' : (b.tipo === 'EVENTO' ? 'Data do Evento:' : 'Expira:')} {new Date(b.data_fim).toLocaleString()}</Text></HStack>) : (<HStack><Icon as={TimeIcon} /><Text fontSize="xs" fontWeight="bold">Campanha Permanente</Text></HStack>)}</VStack></Box>
                            </Card>
                        )})}
                        {bannersFiltrados.length === 0 && <Text color="gray.500" gridColumn="1 / -1" textAlign="center">Nenhuma campanha encontrada.</Text>}
                    </SimpleGrid>
                </TabPanel>

                {/* ABA CUPONS */}
                <TabPanel p={0}>
                    <Flex gap={4} bg="white" p={5} borderRadius="xl" boxShadow="sm" align="center" border="1px solid" borderColor="gray.100" mb={6} wrap="wrap">
                        <InputGroup flex={1} minW="250px">
                            <InputLeftElement pointerEvents='none'><SearchIcon color='gray.400'/></InputLeftElement>
                            <Input placeholder="Buscar por código do cupom..." value={buscaCupom} onChange={e => setBuscaCupom(e.target.value)} />
                        </InputGroup>
                        <Select w={{ base: "full", md: "180px" }} value={filtroCupom} onChange={e => setFiltroCupom(e.target.value)}>
                            <option value="TODOS">Status: Todos</option><option value="ATIVOS">Apenas Ativos</option><option value="INATIVOS">Apenas Inativos</option>
                        </Select>
                        <Divider orientation="vertical" h="30px" display={{ base: 'none', md: 'block' }} />
                        <Button colorScheme="purple" leftIcon={<AddIcon />} onClick={() => abrirModalCupom()} w={{ base: "full", md: "auto" }}>Criar Cupom</Button>
                    </Flex>

                    <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6}>
                        {cuponsFiltrados.map(c => {
                            const inativo = !c.ativo || (c.data_validade && new Date(c.data_validade) < new Date()) || (c.limite_usos > 0 && c.usos_atuais >= c.limite_usos);
                            return (
                            <Card key={c.id} p={5} bg="white" border="1px solid" borderColor={inativo ? "gray.300" : "purple.200"} borderRadius="xl" position="relative" overflow="hidden" opacity={inativo ? 0.6 : 1} shadow="sm">
                                {inativo && (<Box position="absolute" inset={0} bg="whiteAlpha.700" zIndex={1} display="flex" alignItems="center" justifyContent="center" pointerEvents="none"><Badge colorScheme="red" fontSize="lg" px={4} py={2} borderRadius="md" shadow="sm">{(!c.ativo) ? 'INATIVO' : 'ESGOTADO / EXPIRADO'}</Badge></Box>)}
                                <Box position="relative" zIndex={2}><Flex justify="space-between" align="start" mb={4}><Box><Heading size="md" color="gray.800" textTransform="uppercase" mb={1}>{c.codigo}</Heading><Badge colorScheme="green" fontSize="sm" px={2} py={1} borderRadius="md">-{parseFloat(c.desconto_percentual)}% OFF</Badge></Box><HStack><IconButton size="sm" icon={<EditIcon />} colorScheme="blue" variant="ghost" onClick={() => abrirModalCupom(c)} /><IconButton size="sm" icon={<DeleteIcon />} colorScheme="red" variant="ghost" onClick={() => excluirCupom(c.id)} /></HStack></Flex><Divider mb={4} /><HStack fontSize="sm" color="gray.600" justify="space-between"><Text><strong>Usos:</strong> {c.usos_atuais} / {c.limite_usos === 0 ? 'Ilimitado' : c.limite_usos}</Text>{c.data_validade && <Text><strong>Até:</strong> {new Date(c.data_validade).toLocaleDateString()}</Text>}</HStack></Box>
                            </Card>
                        )})}
                        {cuponsFiltrados.length === 0 && <Text color="gray.500" gridColumn="1 / -1" textAlign="center">Nenhum cupom encontrado.</Text>}
                    </SimpleGrid>
                </TabPanel>
            </TabPanels>
        </Tabs>

        {/* MODAL CONFIGURAÇÕES DA LOJA */}
        <Modal isOpen={modalConfigLoja.isOpen} onClose={modalConfigLoja.onClose} isCentered size="md">
            <ModalOverlay />
            <ModalContent borderRadius="xl">
                <ModalHeader>Configurações da Loja</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <VStack spacing={4} align="stretch">
                        
                        <FormControl display="flex" alignItems="center" justifyContent="space-between" bg="gray.50" p={3} borderRadius="md">
                            <FormLabel fontSize="sm" color="purple.600" mb={0} flex="1">Custo da Correção VIP</FormLabel>
                            <InputGroup size="sm" w="150px">
                                <Input type="number" bg="white" value={configLoja.custo_creditos_vip} onChange={e => setConfigLoja({...configLoja, custo_creditos_vip: e.target.value})} />
                                <InputRightAddon children='Créditos' />
                            </InputGroup>
                        </FormControl>
                        
                        <FormControl display="flex" alignItems="center" justifyContent="space-between" bg="gray.50" p={3} borderRadius="md">
                            <FormLabel fontSize="sm" color="blue.600" mb={0} flex="1">Preço Avulso Normal</FormLabel>
                            <InputGroup size="sm" w="150px">
                                <InputLeftAddon children='R$' />
                                <Input type="number" step="0.01" bg="white" value={configLoja.preco_avulso_normal} onChange={e => setConfigLoja({...configLoja, preco_avulso_normal: e.target.value})} />
                            </InputGroup>
                        </FormControl>
                        
                        <FormControl display="flex" alignItems="center" justifyContent="space-between" bg="gray.50" p={3} borderRadius="md">
                            <FormLabel fontSize="sm" color="purple.600" mb={0} flex="1">Preço Avulso VIP</FormLabel>
                            <InputGroup size="sm" w="150px">
                                <InputLeftAddon children='R$' />
                                <Input type="number" step="0.01" bg="white" value={configLoja.preco_avulso_vip} onChange={e => setConfigLoja({...configLoja, preco_avulso_vip: e.target.value})} />
                            </InputGroup>
                        </FormControl>

                        <Divider my={2} />
                        
                        <FormControl bg="orange.50" p={3} borderRadius="md" border="1px dashed" borderColor="orange.200">
                            <Flex align="center" justify="space-between" mb={2}>
                                <FormLabel fontSize="sm" color="orange.800" fontWeight="bold" mb={0} flex="1">Tempo de Rotação (Banner)</FormLabel>
                                <InputGroup size="sm" w="150px">
                                    <Input type="number" bg="white" value={configLoja.tempo_carrossel_segundos} onChange={e => setConfigLoja({...configLoja, tempo_carrossel_segundos: e.target.value})} />
                                    <InputRightAddon children='seg' />
                                </InputGroup>
                            </Flex>
                            <Text fontSize="xs" color="gray.600">Tempo que cada campanha fica visível na tela do aluno antes de passar para a próxima.</Text>
                        </FormControl>

                    </VStack>
                </ModalBody>
                <ModalFooter bg="gray.50" borderTopRadius="none" borderRadius="xl">
                    <Button variant="ghost" mr={3} onClick={modalConfigLoja.onClose}>Cancelar</Button>
                    <Button colorScheme="teal" onClick={salvarConfiguracoes} isLoading={salvandoConfig}>Salvar Alterações</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>

        {/* MODAL BANNER */}
        <Modal isOpen={modalBanner.isOpen} onClose={modalBanner.onClose} isCentered size="3xl">
            <ModalOverlay backdropFilter="blur(3px)" />
            <ModalContent borderRadius="xl">
                <ModalHeader>{formBanner.id ? 'Editar Campanha' : 'Nova Campanha'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
                        
                        <VStack spacing={5} align="stretch">
                            <Heading size="sm" color="gray.500" borderBottom="1px solid" borderColor="gray.200" pb={2}>Conteúdo e Visual</Heading>
                            
                            <FormControl bg="gray.50" p={3} borderRadius="md" border="1px dashed" borderColor="gray.300">
                                <FormLabel fontSize="sm" fontWeight="bold">Imagem de Fundo (Opcional)</FormLabel>
                                {arquivoBase64 ? (
                                    <VStack align="start" spacing={3} mt={2}>
                                        <Image src={arquivoBase64} w="full" h="100px" objectFit="cover" borderRadius="md" border="1px solid #ccc" alt="Preview" />
                                        <Button size="sm" colorScheme="red" variant="outline" leftIcon={<DeleteIcon />} onClick={removerImagem}>Remover Imagem</Button>
                                    </VStack>
                                ) : (
                                    <Flex align="center">
                                        <Icon as={AttachmentIcon} mr={2} color="gray.500" />
                                        <Input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" p={1} border="none" ref={fileInputRef} onChange={handleImageUpload} />
                                    </Flex>
                                )}
                                <Text fontSize="2xs" color="gray.500" mt={3} lineHeight="shorter">Formatos aceitos: <b>PNG, JPG, WEBP</b>.<br/>Dimensões ideais: <b>1200x400 pixels</b>.</Text>
                            </FormControl>

                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="bold">Título Principal</FormLabel>
                                <Input value={formBanner.titulo} onChange={e=>setFormBanner({...formBanner, titulo: e.target.value})} placeholder="Ex: Aulão de Redação ENEM" />
                            </FormControl>
                            
                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="bold">Descrição Curta</FormLabel>
                                <Textarea rows={3} value={formBanner.descricao} onChange={e=>setFormBanner({...formBanner, descricao: e.target.value})} placeholder="Ex: Quarta-feira, ao vivo no Zoom. Garanta sua vaga com desconto especial." />
                            </FormControl>
                        </VStack>

                        <VStack spacing={5} align="stretch">
                            <Heading size="sm" color="gray.500" borderBottom="1px solid" borderColor="gray.200" pb={2}>Regras da Campanha</Heading>
                            
                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="bold">Tipo de Banner</FormLabel>
                                <Select value={formBanner.tipo} onChange={e=>setFormBanner({...formBanner, tipo: e.target.value})} bg="gray.50">
                                    <option value="EVENTO">Evento / Aulão (Mostra Data)</option>
                                    <option value="OFERTA">Oferta Relâmpago (Mostra Cronômetro)</option>
                                    <option value="AVISO">Aviso Simples (Apenas Texto)</option>
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="bold">Cor de Fundo Base</FormLabel>
                                <Select value={formBanner.cor_fundo} onChange={e=>setFormBanner({...formBanner, cor_fundo: e.target.value})}>
                                    <option value="linear(to-br, orange.400, red.400)">Laranja para Vermelho</option>
                                    <option value="linear(to-br, purple.500, pink.400)">Roxo para Rosa</option>
                                    <option value="linear(to-br, teal.400, blue.500)">Verde para Azul</option>
                                    <option value="linear(to-br, gray.700, gray.900)">Preto Dark (Black Friday)</option>
                                </Select>
                            </FormControl>
                            
                            {formBanner.tipo === 'OFERTA' && (
                                <FormControl p={3} bg="orange.50" borderRadius="md" border="1px solid" borderColor="orange.200">
                                    <FormLabel fontSize="sm" color="orange.800" fontWeight="bold">Ao clicar, vender qual pacote?</FormLabel>
                                    <Select placeholder="Selecione o pacote..." value={formBanner.pacote_vinculado} onChange={e=>setFormBanner({...formBanner, pacote_vinculado: e.target.value})} bg="white">
                                        {pacotes.filter(p => p.ativo).map(p => <option key={p.id} value={p.id}>{p.nome} (R$ {p.preco})</option>)}
                                    </Select>
                                </FormControl>
                            )}
                            
                            {(formBanner.tipo === 'OFERTA' || formBanner.tipo === 'EVENTO') && (
                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="bold">{formBanner.tipo === 'EVENTO' ? 'Data e Hora do Evento' : 'Fim da Promoção (Ativa Cronômetro)'}</FormLabel>
                                    <Input type="datetime-local" value={formBanner.data_fim} onChange={e=>setFormBanner({...formBanner, data_fim: e.target.value})} />
                                </FormControl>
                            )}
                            
                            <FormControl display="flex" alignItems="center" mt="auto" p={3} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                                <FormLabel mb="0" ml={2} fontSize="sm" fontWeight="bold" flex="1">Campanha Ativa no Sistema?</FormLabel>
                                <Switch colorScheme="orange" isChecked={formBanner.ativo} onChange={e=>setFormBanner({...formBanner, ativo: e.target.checked})} />
                            </FormControl>
                        </VStack>

                    </SimpleGrid>
                </ModalBody>
                <ModalFooter bg="gray.50" borderTopRadius="none" borderRadius="xl">
                    <Button variant="ghost" mr={3} onClick={modalBanner.onClose}>Cancelar</Button>
                    <Button colorScheme="orange" size="lg" onClick={salvarBanner}>Salvar Campanha</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>

        {/* MODAL PACOTE */}
        <Modal isOpen={modalPacote.isOpen} onClose={modalPacote.onClose} isCentered size="3xl">
            <ModalOverlay backdropFilter="blur(2px)" />
            <ModalContent borderRadius="xl">
                <ModalHeader>{formPacote.id ? 'Editar Pacote' : 'Novo Pacote'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
                        
                        <VStack spacing={5} align="stretch">
                            <Heading size="sm" color="gray.500" borderBottom="1px solid" borderColor="gray.200" pb={2}>Apresentação na Loja</Heading>
                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="bold">Título Comercial</FormLabel>
                                <Input value={formPacote.nome} onChange={e => setFormPacote({...formPacote, nome: e.target.value})} placeholder="Ex: Combo Aprovação Medicina" />
                            </FormControl>
                            
                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="bold">Descrição / Benefícios</FormLabel>
                                <Textarea rows={5} value={formPacote.descricao} onChange={e => setFormPacote({...formPacote, descricao: e.target.value})} placeholder="Descreva as vantagens que o aluno ganha ao comprar..." />
                            </FormControl>
                            
                            <FormControl bg="yellow.50" p={3} borderRadius="md" border="1px dashed" borderColor="yellow.400">
                                <FormLabel fontSize="sm" color="yellow.800" fontWeight="bold">Selo de Destaque Visual (Opcional)</FormLabel>
                                <Input bg="white" placeholder="Ex: Mais Vendido, Recomendado, 50% OFF" value={formPacote.selo_destaque} onChange={e => setFormPacote({...formPacote, selo_destaque: e.target.value})} />
                            </FormControl>
                        </VStack>

                        <VStack spacing={5} align="stretch">
                            <Heading size="sm" color="gray.500" borderBottom="1px solid" borderColor="gray.200" pb={2}>Valores e Créditos</Heading>
                            
                            <Flex gap={4}>
                                <FormControl>
                                    <FormLabel fontSize="sm" color="red.500" fontWeight="bold">De R$ (Riscado)</FormLabel>
                                    <Input type="number" step="0.01" value={formPacote.preco_original} onChange={e => setFormPacote({...formPacote, preco_original: e.target.value})} placeholder="Opcional" />
                                </FormControl>
                                <FormControl>
                                    <FormLabel fontSize="sm" color="green.600" fontWeight="bold">Por R$ (Venda)</FormLabel>
                                    <Input type="number" step="0.01" value={formPacote.preco} onChange={e => setFormPacote({...formPacote, preco: e.target.value})} placeholder="0.00" />
                                </FormControl>
                            </Flex>

                            <Flex justify="space-between" align="center" w="full" bg="gray.50" p={3} borderRadius="md" border="1px solid #eee">
                                <FormControl display="flex" alignItems="center" w="auto" m={0}>
                                    <Switch colorScheme="green" isChecked={formPacote.permite_parcelamento} onChange={e => setFormPacote({...formPacote, permite_parcelamento: e.target.checked})} />
                                    <FormLabel mb="0" ml={2} fontSize="xs" fontWeight="bold">Permite Parcelar?</FormLabel>
                                </FormControl>
                                {formPacote.permite_parcelamento && (
                                    <Flex align="center">
                                        <Text fontSize="xs" mr={2} color="gray.600">Em até</Text>
                                        <Input w="55px" size="sm" type="number" textAlign="center" bg="white" px={1} value={formPacote.max_parcelas} onChange={e => setFormPacote({...formPacote, max_parcelas: e.target.value})} />
                                        <Text fontSize="xs" ml={2} color="gray.600">vezes</Text>
                                    </Flex>
                                )}
                            </Flex>

                            <Flex gap={4}>
                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="bold">Qtd. Créditos Normais</FormLabel>
                                    <Input type="number" value={formPacote.qtd_creditos_simples} onChange={e => setFormPacote({...formPacote, qtd_creditos_simples: e.target.value})} />
                                </FormControl>
                                <FormControl>
                                    <FormLabel fontSize="sm" color="purple.600" fontWeight="bold">Qtd. Créditos VIPs</FormLabel>
                                    <Input type="number" value={formPacote.qtd_creditos_vip} onChange={e => setFormPacote({...formPacote, qtd_creditos_vip: e.target.value})} />
                                </FormControl>
                            </Flex>

                            <HStack w="full" justify="space-between" bg="blue.50" p={3} borderRadius="md">
                                <FormControl display="flex" alignItems="center">
                                    <Switch colorScheme="blue" isChecked={formPacote.visivel_loja} onChange={e => setFormPacote({...formPacote, visivel_loja: e.target.checked})} />
                                    <FormLabel mb="0" ml={2} fontSize="xs" fontWeight="bold" color="blue.800">Visível na Loja?</FormLabel>
                                </FormControl>
                                <FormControl display="flex" alignItems="center">
                                    <Switch colorScheme="purple" isChecked={formPacote.compra_unica} onChange={e => setFormPacote({...formPacote, compra_unica: e.target.checked})} />
                                    <FormLabel mb="0" ml={2} fontSize="xs" fontWeight="bold" color="purple.800">Apenas 1x por Aluno?</FormLabel>
                                </FormControl>
                            </HStack>
                            
                            <FormControl display="flex" alignItems="center" mt="auto">
                                <Switch colorScheme="teal" isChecked={formPacote.ativo} onChange={e => setFormPacote({...formPacote, ativo: e.target.checked})} />
                                <FormLabel mb="0" ml={2} fontSize="sm" fontWeight="bold">Pacote Ativo no Sistema</FormLabel>
                            </FormControl>
                        </VStack>

                    </SimpleGrid>
                </ModalBody>
                <ModalFooter bg="gray.50" borderTopRadius="none" borderRadius="xl">
                    <Button variant="ghost" mr={3} onClick={modalPacote.onClose}>Cancelar</Button>
                    <Button colorScheme="blue" size="lg" onClick={salvarPacote}>Salvar Pacote</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>

        {/* MODAL CUPOM */}
        <Modal isOpen={modalCupom.isOpen} onClose={modalCupom.onClose} isCentered size="md">
            <ModalOverlay backdropFilter="blur(2px)" />
            <ModalContent borderRadius="xl">
                <ModalHeader>{formCupom.id ? 'Editar Cupom' : 'Novo Cupom'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <VStack spacing={4}>
                        <FormControl>
                            <FormLabel fontSize="sm" fontWeight="bold">Código Promocional</FormLabel>
                            <Input textTransform="uppercase" value={formCupom.codigo} onChange={e => setFormCupom({...formCupom, codigo: e.target.value.toUpperCase()})} placeholder="Ex: BLACKFRIDAY" />
                        </FormControl>
                        <Flex gap={4} w="full">
                            <FormControl>
                                <FormLabel fontSize="sm" color="green.600" fontWeight="bold">Desconto (%)</FormLabel>
                                <Input type="number" step="0.01" value={formCupom.desconto_percentual} onChange={e => setFormCupom({...formCupom, desconto_percentual: e.target.value})} placeholder="0.00" />
                            </FormControl>
                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="bold">Limite de Usos</FormLabel>
                                <Input type="number" value={formCupom.limite_usos} onChange={e => setFormCupom({...formCupom, limite_usos: e.target.value})} placeholder="0 = Ilimitado" />
                            </FormControl>
                        </Flex>
                        <FormControl>
                            <FormLabel fontSize="sm" fontWeight="bold">Válido até (Opcional)</FormLabel>
                            <Input type="date" value={formCupom.data_validade} onChange={e => setFormCupom({...formCupom, data_validade: e.target.value})} />
                        </FormControl>
                        <FormControl display="flex" alignItems="center" bg="gray.50" p={3} borderRadius="md" border="1px solid" borderColor="gray.100">
                            <FormLabel fontSize="sm" mb={0} flex="1" fontWeight="bold">Cupom Ativado</FormLabel>
                            <Switch colorScheme="purple" isChecked={formCupom.ativo} onChange={e => setFormCupom({...formCupom, ativo: e.target.checked})} />
                        </FormControl>
                    </VStack>
                </ModalBody>
                <ModalFooter bg="gray.50" borderTopRadius="none" borderRadius="xl">
                    <Button variant="ghost" mr={3} onClick={modalCupom.onClose}>Cancelar</Button>
                    <Button colorScheme="purple" onClick={salvarCupom}>Salvar Cupom</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>

    </Container>
  );
}

export default GestaoVitrine;