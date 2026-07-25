import React, { useState, useEffect } from 'react';
import { 
    VStack, Button, Icon, Text, Box, Flex, Tooltip, Image, Avatar, useDisclosure, useToast,
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, 
    FormControl, FormLabel, Input, SimpleGrid, Divider, Badge, Select 
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
    CheckCircleIcon, StarIcon, 
    ChevronLeftIcon, ChevronRightIcon, WarningTwoIcon
} from '@chakra-ui/icons';

// Máscaras Brasileiras
const maskPhone = (value) => value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');
const maskCPF = (value) => value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');

// Ícones Customizados Premium (Padrão Ouro)
const UsersIcon = (props) => <Icon viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></Icon>;
const IconDashboard = (props) => <Icon viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></Icon>;
const IconWrite = (props) => <Icon viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M3 17.25V21h3.75L17.81 10.19l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></Icon>;
const IconHistory = (props) => <Icon viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></Icon>;
const IconStore = (props) => <Icon viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></Icon>;
const IconWallet = (props) => <Icon viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M21 7h-2v2h-2V7H7v2H5V7H3v12h18V7zm-2 8h-4v-2h4v2zm0-4h-4v-2h4v2z" /><path fill="currentColor" d="M5 5h14c1.1 0 2 .9 2 2v2H3V7c0-1.1.9-2 2-2z" /></Icon>;
const IconBook = (props) => <Icon viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S4.16 4.65 3 5v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C5.05 19.15 6.98 18.5 8.5 18.5c1.9 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V5z" /></Icon>;
const IconLogout = (props) => <Icon viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></Icon>;
const IconChatBubble = (props) => <Icon viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M4 2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2z"/></Icon>;
const IconFinance = (props) => <Icon viewBox="0 0 24 24" {...props}><path fill="currentColor" d="M7 24h-6v-14h6v14zm8-18h-6v18h6v-18zm8 4h-6v14h6v-14z"/></Icon>;

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [carteira, setCarteira] = useState({ saldo_simples: 0, saldo_vip: 0 });
  const toast = useToast();

  const { isOpen: isProfileOpen, onOpen: onProfileOpen, onClose: onProfileClose } = useDisclosure();
  const [profileData, setProfileData] = useState({ first_name: '', last_name: '', telefone: '', cpf: '', password: '', confirm_password: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await axios.get('http://127.0.0.1:8000/api/me/', { headers: { Authorization: `Bearer ${token}` } });
            setUser(res.data);
            
            if (!res.data.is_staff && !res.data.is_corretor) {
                const cartRes = await axios.get('http://127.0.0.1:8000/api/aluno/carteira/', { headers: { Authorization: `Bearer ${token}` } });
                setCarteira(cartRes.data);
            }
        } catch (e) { console.error("Erro sidebar:", e); }
    };

    fetchUser();
    window.addEventListener('atualizarCarteira', fetchUser);

    return () => {
        window.removeEventListener('atualizarCarteira', fetchUser);
    };
  }, [location.search]);

  const handleOpenProfile = () => {
      // Separa a agência da conta para mostrar bonito nos inputs
      let ag = ''; let cc = '';
      if (user.agencia_conta) {
          const parts = user.agencia_conta.split('Cc:');
          if(parts.length > 1) {
              ag = parts[0].replace('Ag:', '').trim();
              cc = parts[1].trim();
          } else { ag = user.agencia_conta; }
      }

      setProfileData({
          first_name: user.first_name || '', last_name: user.last_name || '',
          telefone: user.telefone || '', cpf: user.cpf || '',
          password: '', confirm_password: '',
          chave_pix: user.chave_pix || '', tipo_chave_pix: user.tipo_chave_pix || '',
          banco: user.banco || '', agencia: ag, conta: cc
      });
      onProfileOpen();
  };

  const handleSaveProfile = async () => {
      if (profileData.password && profileData.password !== profileData.confirm_password) return toast({ title: "As senhas não coincidem!", status: "warning" });
      setSavingProfile(true);
      try {
          const token = localStorage.getItem('token');
          const payload = { 
              first_name: profileData.first_name, last_name: profileData.last_name, 
              telefone: profileData.telefone, cpf: profileData.cpf,
              chave_pix: profileData.chave_pix, tipo_chave_pix: profileData.tipo_chave_pix,
              banco: profileData.banco, agencia: profileData.agencia, conta: profileData.conta,
              ...(profileData.password ? { password: profileData.password } : {}) 
          };
          await axios.patch('http://127.0.0.1:8000/api/me/', payload, { headers: { Authorization: `Bearer ${token}` } });
          setUser({ ...user, ...payload }); 
          toast({ title: "Perfil atualizado com sucesso!", status: "success" });
          onProfileClose();
      } catch (error) { toast({ title: "Erro ao atualizar dados", status: "error" }); }
      setSavingProfile(false);
  };

  const isActive = (path) => {
      const [basePath, search] = path.split('?');
      if (location.pathname !== basePath) return false;
      
      const currentParams = new URLSearchParams(location.search);
      const targetParams = new URLSearchParams(search || '');
      const currentAba = currentParams.get('aba') || 'dashboard';
      const targetAba = targetParams.get('aba') || 'dashboard';
      if (basePath === '/painel-corretor' && currentAba === 'fila' && !targetParams.get('aba')) return true; 
      return currentAba === targetAba;
  };
  
  const MenuButton = ({ path, icon, label }) => {
    const active = isActive(path);
    return (
      <Tooltip label={!isOpen ? label : ""} placement="right" hasArrow>
          <Button 
              w={isOpen ? "90%" : "48px"} h="48px" mx="auto" mb={1} borderRadius="xl"
              display="flex" alignItems="center" justifyContent={isOpen ? "flex-start" : "center"} px={isOpen ? 4 : 0} 
              variant={active ? "solid" : "ghost"} colorScheme={active ? "teal" : "gray"} bg={active ? "teal.500" : "transparent"} color={active ? "white" : "gray.600"}
              _hover={{ bg: active ? "teal.600" : "gray.100", transform: "translateY(-1px)", shadow: "sm" }}
              transition="all 0.2s" onClick={() => navigate(path)}
          >
              <Icon as={icon} boxSize={5} mr={isOpen ? 3 : 0} />
              {isOpen && <Text fontSize="sm" fontWeight="medium" noOfLines={1}>{label}</Text>}
          </Button>
      </Tooltip>
    );
  };

  const handleLogout = () => { localStorage.removeItem('token'); navigate('/'); };

  if (!user) return <Box w={isOpen ? "260px" : "80px"} h="full" bg="white" borderRight="1px solid #E2E8F0" />;

  const isAdmin = user.is_staff || user.is_superuser;
  const isCorretor = user.is_corretor;
  const isApenasAluno = !isAdmin && !isCorretor;

  return (
    <Flex direction="column" h="full" pt={6} pb={4} position="relative" bg="white" overflow="hidden">
      
      <Box mb={6} textAlign={isOpen ? "left" : "center"} px={isOpen ? 6 : 0} h="40px" display="flex" alignItems="center" justifyContent={isOpen ? "flex-start" : "center"}>
        {isOpen ? (
            <Image src="/logo.svg" alt="Logo" maxH="30px" objectFit="contain" fallback={<Box><Text fontSize="xl" fontWeight="900" color="teal.600" lineHeight="1">Guia do <Text as="span" color="yellow.400">Texto</Text></Text></Box>} />
        ) : (
            <Image src="/logo-icon.svg" alt="Ícone" maxH="40px" objectFit="contain" fallback={<Text fontSize="2xl" fontWeight="900" color="teal.600">GT</Text>} />
        )}
      </Box>

      <VStack spacing={2} align="stretch" flex="1" px={0} overflowY="auto" sx={{ '&::-webkit-scrollbar': { display: 'none' } }}>
        
        {(isAdmin || isApenasAluno) && (
            <Box>
                {isOpen && <Text fontSize="10px" fontWeight="bold" color="gray.400" textTransform="uppercase" px={6} mt={2} mb={1}>Aluno</Text>}
                <MenuButton path="/painel-aluno?aba=dashboard" icon={IconDashboard} label="Meu Painel" />
                <MenuButton path="/painel-aluno?aba=selecao_tema" icon={IconWrite} label="Treinar Redação" />
                <MenuButton path="/painel-aluno?aba=historico" icon={IconHistory} label="Minhas Redações" />
                <MenuButton path="/painel-aluno?aba=material_apoio" icon={IconBook} label="Material de Apoio" />
                <MenuButton path="/painel-aluno?aba=loja" icon={IconStore} label="Loja de Créditos" />
                <Box h={4} />
            </Box>
        )}
        
        {(isAdmin || isCorretor) && (
            <Box>
                {isOpen && <Text fontSize="10px" fontWeight="bold" color="gray.400" textTransform="uppercase" px={6} mb={1}>Professor</Text>}
                <MenuButton path="/painel-corretor?aba=fila" icon={IconWrite} label="Fila de Correção" />
                <MenuButton path="/painel-corretor?aba=historico" icon={IconHistory} label="Meu Histórico" />
                <MenuButton path="/painel-corretor?aba=carteira" icon={IconWallet} label="Minha Carteira" />
                <MenuButton path="/painel-corretor?aba=respostas" icon={IconChatBubble} label="Respostas Rápidas" />
                <MenuButton path="/painel-corretor?aba=manuais" icon={IconBook} label="Manual do Corretor" />
                <Box h={4} />
            </Box>
        )}

        {isAdmin && (
            <Box>
                {isOpen && <Text fontSize="10px" fontWeight="bold" color="gray.400" textTransform="uppercase" px={6} mb={1}>Gestão</Text>}
                <MenuButton path="/gestao-financeira" icon={IconFinance} label="Gestão Financeira" />
                <MenuButton path="/temas" icon={CheckCircleIcon} label="Banco de Propostas" />
                <MenuButton path="/gestao-materiais" icon={IconBook} label="Materiais de Apoio" />
                <MenuButton path="/gestao-fila" icon={WarningTwoIcon} label="Torre de Controle" />
                <MenuButton path="/gestao-vitrine" icon={StarIcon} label="Catálogo & E-commerce" />
                <MenuButton path="/gestao-usuarios" icon={UsersIcon} label="Base de Usuários" />
            </Box>
        )}

        <Box flex="1" minH="20px" /> 

        {isApenasAluno && (
            <Box px={isOpen ? 4 : 2} mb={4}>
                {isOpen ? (
                    <Box p={4} bgGradient="linear(to-br, teal.50, white)" borderRadius="xl" border="1px solid" borderColor="teal.100" shadow="sm">
                        <Flex align="center" mb={3} gap={2}>
                            <Icon as={IconWallet} color="teal.600" boxSize={4} />
                            <Text fontSize="xs" fontWeight="900" color="teal.800" textTransform="uppercase" letterSpacing="wider">Sua Carteira</Text>
                        </Flex>
                        <Flex justify="space-between" mb={2} align="center"><Text fontSize="sm" color="gray.600" fontWeight="bold">Normais:</Text><Badge colorScheme="blue" px={2} py={0.5} borderRadius="md" fontSize="sm">{carteira.saldo_simples}</Badge></Flex>
                        <Flex justify="space-between" align="center"><Text fontSize="sm" color="gray.600" fontWeight="bold">VIPs:</Text><Badge colorScheme="purple" px={2} py={0.5} borderRadius="md" fontSize="sm"><StarIcon mr={1} mb={0.5} boxSize={2.5}/>{carteira.saldo_vip}</Badge></Flex>
                    </Box>
                ) : (
                    <VStack p={2} bgGradient="linear(to-b, teal.50, white)" borderRadius="xl" border="1px solid" borderColor="teal.100" spacing={2} mx="auto" w="48px">
                        <Icon as={IconWallet} color="teal.600" boxSize={5} />
                        <VStack spacing={1} w="full">
                            <Tooltip label="Créditos Normais" placement="right"><Badge colorScheme="blue" fontSize="xs" w="full" textAlign="center" borderRadius="sm" px={0}>{carteira.saldo_simples}</Badge></Tooltip>
                            <Tooltip label="Créditos VIPs" placement="right"><Badge colorScheme="purple" fontSize="xs" w="full" display="flex" justifyContent="center" alignItems="center" borderRadius="sm" px={0}><StarIcon mr={0.5} boxSize={2}/>{carteira.saldo_vip}</Badge></Tooltip>
                        </VStack>
                    </VStack>
                )}
            </Box>
        )}
      </VStack>

      <Box borderTop="1px solid" borderColor="gray.100" pt={4} w="full">
        
        <Box px={isOpen ? 4 : 0} mb={3} display="flex" justifyContent="center">
            <Tooltip label={!isOpen ? "Meu Perfil" : ""} placement="right" hasArrow>
                <Flex 
                    w={isOpen ? "full" : "48px"} h={isOpen ? "auto" : "48px"} align="center" justify={isOpen ? "flex-start" : "center"} gap={3} p={isOpen ? 2 : 0} 
                    borderRadius="xl" _hover={{ bg: "gray.50" }} cursor="pointer" transition="all 0.2s"
                    onClick={handleOpenProfile} mx="auto"
                >
                    <Avatar size="sm" name={user.first_name || "Usuário"} bg="teal.600" color="white" />
                    {isOpen && (
                        <Box overflow="hidden" textAlign="left">
                            <Text fontSize="sm" fontWeight="bold" color="gray.800" isTruncated>{user.first_name || 'Completar Perfil'}</Text>
                            <Text fontSize="xs" color="gray.500" isTruncated>{isAdmin ? 'Administrador' : isCorretor ? 'Professor' : 'Aluno'}</Text>
                        </Box>
                    )}
                </Flex>
            </Tooltip>
        </Box>

        <Flex px={isOpen ? 4 : 0} align="center" justify={isOpen ? "space-between" : "center"} direction={isOpen ? "row" : "column"} gap={isOpen ? 2 : 2} w="full">
            <Tooltip label={!isOpen ? "Sair da Conta" : ""} placement="right" hasArrow>
                <Button flex={isOpen ? 1 : "none"} w={isOpen ? "auto" : "48px"} h="48px" borderRadius="xl" variant="ghost" colorScheme="red" color="red.500" justifyContent={isOpen ? "flex-start" : "center"} px={isOpen ? 3 : 0} onClick={handleLogout} _hover={{ bg: "red.50" }} mx={isOpen ? 0 : "auto"}>
                    <Icon as={IconLogout} boxSize={5} mr={isOpen ? 3 : 0} />{isOpen && "Sair"}
                </Button>
            </Tooltip>
            <Tooltip label={isOpen ? "Recolher Menu" : "Expandir Menu"} placement="right" hasArrow>
                <Button onClick={toggleSidebar} w={isOpen ? "40px" : "48px"} h={isOpen ? "40px" : "48px"} minW={isOpen ? "40px" : "48px"} borderRadius="xl" variant="ghost" color="gray.400" _hover={{ bg: "gray.100", color: "teal.600" }} px={0} mx={isOpen ? 0 : "auto"}>
                    <Icon as={isOpen ? ChevronLeftIcon : ChevronRightIcon} boxSize={6} />
                </Button>
            </Tooltip>
        </Flex>
      </Box>

      <Modal isOpen={isProfileOpen} onClose={onProfileClose} size="lg" isCentered>
          <ModalOverlay backdropFilter="blur(4px)" />
          <ModalContent borderRadius="xl">
              <ModalHeader color="teal.700">Meu Perfil</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                  <VStack spacing={4} align="stretch">
                      <SimpleGrid columns={2} spacing={4}>
                          <FormControl isRequired><FormLabel fontSize="sm" color="gray.600">Nome</FormLabel><Input bg="gray.50" value={profileData.first_name} onChange={e => setProfileData({...profileData, first_name: e.target.value})} /></FormControl>
                          <FormControl isRequired><FormLabel fontSize="sm" color="gray.600">Sobrenome</FormLabel><Input bg="gray.50" value={profileData.last_name} onChange={e => setProfileData({...profileData, last_name: e.target.value})} placeholder="Seu apelido" /></FormControl>
                      </SimpleGrid>
                      <FormControl><FormLabel fontSize="sm" color="gray.600">E-mail (Acesso)</FormLabel><Input bg="gray.100" value={user.email} isReadOnly color="gray.500" /></FormControl>
                      <SimpleGrid columns={2} spacing={4}>
                          <FormControl><FormLabel fontSize="sm" color="gray.600">Celular / WhatsApp</FormLabel><Input bg="gray.50" value={profileData.telefone} onChange={e => setProfileData({...profileData, telefone: maskPhone(e.target.value)})} placeholder="(00) 00000-0000" maxLength={15} /></FormControl>
                          <FormControl><FormLabel fontSize="sm" color="gray.600">CPF</FormLabel><Input bg="gray.50" value={profileData.cpf} onChange={e => setProfileData({...profileData, cpf: maskCPF(e.target.value)})} placeholder="000.000.000-00" maxLength={14} /></FormControl>
                      </SimpleGrid>
                      
                      <Divider my={2} />
                      <Text fontSize="sm" fontWeight="bold" color="gray.700">Segurança</Text>
                      <Text fontSize="xs" color="gray.500" mb={2}>Deixe em branco se não quiser alterar a sua senha.</Text>
                      <SimpleGrid columns={2} spacing={4}>
                          <FormControl><FormLabel fontSize="sm" color="gray.600">Nova Senha</FormLabel><Input type="password" bg="gray.50" value={profileData.password} onChange={e => setProfileData({...profileData, password: e.target.value})} placeholder="******" /></FormControl>
                          <FormControl><FormLabel fontSize="sm" color="gray.600">Confirmar Senha</FormLabel><Input type="password" bg="gray.50" value={profileData.confirm_password} onChange={e => setProfileData({...profileData, confirm_password: e.target.value})} placeholder="******" /></FormControl>
                      </SimpleGrid>

                      {/* --- NOVO BLOCO BANCÁRIO PARA O CORRETOR --- */}
                      {user.is_corretor && (
                          <Box mt={2}>
                              <Divider my={3} />
                              <Text fontSize="sm" fontWeight="bold" color="teal.700" mb={3}>Dados de Recebimento</Text>
                              <SimpleGrid columns={2} spacing={4} mb={3}>
                                  <FormControl isRequired>
                                      <FormLabel fontSize="sm" color="gray.600">Tipo de PIX</FormLabel>
                                      <Select bg="gray.50" value={profileData.tipo_chave_pix || ''} onChange={e => setProfileData({...profileData, tipo_chave_pix: e.target.value})}>
                                          <option value="">Selecione...</option>
                                          <option value="CPF">CPF</option><option value="EMAIL">E-mail</option><option value="TELEFONE">Telefone</option><option value="ALEATORIA">Chave Aleatória</option>
                                      </Select>
                                  </FormControl>
                                  <FormControl isRequired>
                                      <FormLabel fontSize="sm" color="gray.600">Chave PIX</FormLabel>
                                      <Input bg="gray.50" value={profileData.chave_pix || ''} onChange={e => setProfileData({...profileData, chave_pix: e.target.value})} placeholder="Obrigatório" />
                                  </FormControl>
                              </SimpleGrid>
                              <SimpleGrid columns={3} spacing={3}>
                                  <FormControl><FormLabel fontSize="sm" color="gray.600">Banco (Opc.)</FormLabel><Input bg="gray.50" value={profileData.banco || ''} onChange={e => setProfileData({...profileData, banco: e.target.value})} placeholder="Ex: Nubank" /></FormControl>
                                  <FormControl><FormLabel fontSize="sm" color="gray.600">Agência (Opc.)</FormLabel><Input bg="gray.50" value={profileData.agencia || ''} onChange={e => setProfileData({...profileData, agencia: e.target.value})} placeholder="0001" /></FormControl>
                                  <FormControl><FormLabel fontSize="sm" color="gray.600">Conta (Opc.)</FormLabel><Input bg="gray.50" value={profileData.conta || ''} onChange={e => setProfileData({...profileData, conta: e.target.value})} placeholder="0000-0" /></FormControl>
                              </SimpleGrid>
                          </Box>
                      )}
                  </VStack>
              </ModalBody>
              <ModalFooter borderTop="1px solid" borderColor="gray.100" mt={4}>
                  <Button variant="ghost" mr={3} onClick={onProfileClose}>Cancelar</Button>
                  <Button colorScheme="teal" onClick={handleSaveProfile} isLoading={savingProfile}>Salvar Alterações</Button>
              </ModalFooter>
          </ModalContent>
      </Modal>

    </Flex>
  );
};

export default Sidebar;