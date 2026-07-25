import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box, Button, FormControl, FormLabel, Input, VStack, 
  Heading, Text, useToast, Image, Flex, InputGroup, 
  InputLeftElement, Divider, AbsoluteCenter, HStack, Icon, SimpleGrid
} from '@chakra-ui/react';
import { EmailIcon, LockIcon, CheckCircleIcon } from '@chakra-ui/icons';
import { GoogleLogin } from '@react-oauth/google';

function Cadastro() {
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const queryParams = new URLSearchParams(location.search);
  const pacoteId = queryParams.get('pacote');

  const handleCadastro = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
        return toast({ title: "Erro", description: "As senhas não coincidem.", status: "error" });
    }

    setLoading(true);
    try {
      await axios.post('http://127.0.0.1:8000/api/cadastrar/', formData);
      const resLogin = await axios.post('http://127.0.0.1:8000/api/login/', { username: formData.email, password: formData.password });
      localStorage.setItem('token', resLogin.data.token);
      
      toast({ title: "Conta criada com sucesso!", description: "Bem-vindo ao Guia do Texto.", status: "success" });
      
      if (pacoteId) {
          navigate(`/painel-aluno?aba=loja&checkout=${pacoteId}`);
      } else {
          navigate('/painel-aluno'); 
      }
    } catch (error) {
      toast({ title: "Erro no cadastro", description: error.response?.data?.erro || "Verifique os dados informados.", status: "error" });
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const tokenGoogle = credentialResponse.credential;
      const res = await axios.post('http://127.0.0.1:8000/api/auth/google/', { token: tokenGoogle });
      localStorage.setItem('token', res.data.token);
      
      toast({ title: "Conta criada com o Google!", status: "success" });
      
      if (pacoteId) {
          navigate(`/painel-aluno?aba=loja&checkout=${pacoteId}`);
      } else {
          navigate('/painel-aluno');
      }
    } catch (error) {
      toast({ title: "Erro", description: "Tente novamente.", status: "error" });
    }
    setLoading(false);
  };

  return (
    <Flex minH="100vh" w="full" direction={{ base: "column", lg: "row" }}>
      
      <Flex 
        flex={1} 
        w={{ base: '100%', lg: '40%' }} 
        display={{ base: 'none', lg: 'flex' }} 
        direction="column" align="center" justify="center" p={12} position="relative" 
        bgImage="linear-gradient(rgba(49, 151, 149, 0.9), rgba(35, 78, 82, 0.95)), url('/bg-cadastro.jpg')"
        bgSize="cover"
        bgPosition="center"
      >
        <Box maxW="500px" zIndex={2}>
            <Image src="/logo-login.svg" alt="Logo Guia do Texto" maxH="70px" objectFit="contain" mb={10} fallback={<Heading size="2xl" color="white" mb={10}>Guia do <Text as="span" color="yellow.400">Texto</Text></Heading>} />
            
            <Heading size="2xl" color="white" lineHeight="1.2" mb={6} letterSpacing="tight">Alcance a sua melhor versão.</Heading>
            <Text fontSize="xl" color="teal.50" mb={10} lineHeight="relaxed">A ferramenta definitiva para alunos que buscam a nota 1000 através de feedbacks precisos e acompanhamento contínuo.</Text>
            <VStack align="start" spacing={4}>
                <HStack><Icon as={CheckCircleIcon} color="yellow.400" boxSize={5} /><Text color="white" fontSize="lg" fontWeight="medium">Painel inteligente de desempenho</Text></HStack>
                <HStack><Icon as={CheckCircleIcon} color="yellow.400" boxSize={5} /><Text color="white" fontSize="lg" fontWeight="medium">Compra de pacotes e redações avulsas</Text></HStack>
                <HStack><Icon as={CheckCircleIcon} color="yellow.400" boxSize={5} /><Text color="white" fontSize="lg" fontWeight="medium">Simulador digital e correção manuscrita</Text></HStack>
            </VStack>
        </Box>
      </Flex>

      <Flex flex={1} w={{ base: '100%', lg: '60%' }} align="center" justify="center" bg="white" p={8} boxShadow="-10px 0 20px rgba(0,0,0,0.05)" zIndex={10}>
        <Box w="full" maxW="500px">
          
          <Flex justify="center" mb={8} display={{ base: 'flex', lg: 'none' }}>
              <Image src="/logo-login.svg" alt="Logo" maxH="40px" objectFit="contain" fallback={<Heading size="md" color="teal.600">Guia do <Text as="span" color="yellow.500">Texto</Text></Heading>} />
          </Flex>

          <form onSubmit={handleCadastro} style={{ width: '100%' }}>
            <VStack spacing={6} align="stretch">
              <Box mb={2}>
                  <Heading size="xl" color="gray.800" mb={2} letterSpacing="tight">Crie a sua conta</Heading>
                  <Text color="gray.500" fontSize="md">Junte-se a nós e eleve o nível das suas redações.</Text>
              </Box>

              <VStack spacing={4} align="stretch">
                  <SimpleGrid columns={2} spacing={4}>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm" color="gray.700" fontWeight="bold">Nome</FormLabel>
                        <Input size="lg" type="text" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} placeholder="Ex: João" bg="gray.50" _focus={{ bg: "white", borderColor: "teal.400" }} />
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm" color="gray.700" fontWeight="bold">Sobrenome</FormLabel>
                        <Input size="lg" type="text" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} placeholder="Ex: da Silva" bg="gray.50" _focus={{ bg: "white", borderColor: "teal.400" }} />
                      </FormControl>
                  </SimpleGrid>

                  <FormControl isRequired>
                    <FormLabel fontSize="sm" color="gray.700" fontWeight="bold">E-mail</FormLabel>
                    <InputGroup size="lg">
                        <InputLeftElement pointerEvents="none"><EmailIcon color="gray.400" /></InputLeftElement>
                        <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="seu.email@exemplo.com" bg="gray.50" _focus={{ bg: "white", borderColor: "teal.400" }} />
                    </InputGroup>
                  </FormControl>

                  <SimpleGrid columns={2} spacing={4}>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm" color="gray.700" fontWeight="bold">Senha</FormLabel>
                        <InputGroup size="lg">
                            <InputLeftElement pointerEvents="none"><LockIcon color="gray.400" fontSize="sm" /></InputLeftElement>
                            <Input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="••••••••" bg="gray.50" _focus={{ bg: "white", borderColor: "teal.400" }} />
                        </InputGroup>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel fontSize="sm" color="gray.700" fontWeight="bold">Confirmar</FormLabel>
                        <InputGroup size="lg">
                            <InputLeftElement pointerEvents="none"><LockIcon color="gray.400" fontSize="sm" /></InputLeftElement>
                            <Input type="password" value={formData.confirm_password} onChange={(e) => setFormData({...formData, confirm_password: e.target.value})} placeholder="••••••••" bg="gray.50" _focus={{ bg: "white", borderColor: "teal.400" }} />
                        </InputGroup>
                      </FormControl>
                  </SimpleGrid>
              </VStack>

              <Button type="submit" colorScheme="teal" size="lg" fontSize="md" mt={2} isLoading={loading} w="full" shadow="md" _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }} transition="all 0.2s">
                Criar Conta Grátis
              </Button>

              <Box position='relative' py={4}>
                  <Divider borderColor="gray.300" />
                  <AbsoluteCenter bg='white' px='4' fontSize="xs" color="gray.400" fontWeight="bold" textTransform="uppercase" letterSpacing="widest">
                      Ou acesse com
                  </AbsoluteCenter>
              </Box>

              <Flex justify="center" w="full">
                  <Box>
                      <GoogleLogin 
                        onSuccess={handleGoogleSuccess} 
                        onError={() => toast({ title: "Cadastro cancelado", status: "warning" })} 
                        shape="rectangular"
                        size="large"
                        theme="outline"
                        text="signup_with"
                      />
                  </Box>
              </Flex>
              
              <Text textAlign="center" fontSize="sm" color="gray.600" mt={4}>
                Já tem conta? <Button as={RouterLink} to="/login" variant="link" colorScheme="teal" fontWeight="bold">Entrar agora</Button>
              </Text>
            </VStack>
          </form>
        </Box>
      </Flex>
    </Flex>
  );
}

export default Cadastro;