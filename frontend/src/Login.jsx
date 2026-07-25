import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Button, FormControl, FormLabel, Input, VStack, 
  Heading, Text, useToast, Image, Flex, InputGroup, 
  InputLeftElement, Divider, AbsoluteCenter, HStack, Icon
} from '@chakra-ui/react';
import { EmailIcon, LockIcon, CheckCircleIcon } from '@chakra-ui/icons';
import { GoogleLogin } from '@react-oauth/google';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Faz o Login e pega o token e o tipo
      const response = await axios.post('http://127.0.0.1:8000/api/login/', {
        username: email,
        password: password
      });
      
      const token = response.data.token;
      const tipoUser = response.data.tipo; 
      
      localStorage.setItem('token', token);
      
      // 2. Rota Expressa para o Admin -> Direto para o Financeiro
      if (tipoUser === 'ADMIN' || email.toLowerCase() === 'admin') {
          toast({ title: 'Acesso Administrativo', status: 'success', duration: 2000 });
          navigate('/gestao-financeira'); 
          return; 
      }

      // 3. Se não for admin óbvio, busca os detalhes da conta para confirmar
      const meResponse = await axios.get('http://127.0.0.1:8000/api/me/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = meResponse.data;

      toast({ title: 'Login com sucesso!', status: 'success', duration: 2000 });
      
      // 4. Redirecionamento correto
      if (userData.is_staff) {
          navigate('/gestao-financeira');
      } else if (userData.is_corretor || tipoUser === 'CORRETOR') {
          navigate('/painel-corretor');
      } else {
          navigate('/painel-aluno');
      }
      
    } catch (error) {
      toast({ title: 'Erro ao entrar', description: 'Verifique as suas credenciais.', status: 'error', duration: 3000 });
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const tokenGoogle = credentialResponse.credential;
      const res = await axios.post('http://127.0.0.1:8000/api/auth/google/', { token: tokenGoogle });
      const token = res.data.token;
      const tipoUser = res.data.tipo;
      
      localStorage.setItem('token', token);
      
      if (tipoUser === 'ADMIN') {
          navigate('/gestao-financeira');
          return;
      }
      
      const meResponse = await axios.get('http://127.0.0.1:8000/api/me/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = meResponse.data;
      
      if (userData.is_staff) {
          navigate('/gestao-financeira');
      } else if (userData.is_corretor) {
          navigate('/painel-corretor');
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
        bgImage="linear-gradient(rgba(49, 151, 149, 0.9), rgba(35, 78, 82, 0.95)), url('/bg-login.jpg')"
        bgSize="cover"
        bgPosition="center"
      >
        <Box maxW="500px" zIndex={2}>
            <Image src="/logo-login.svg" alt="Logo Guia do Texto" maxH="70px" objectFit="contain" mb={10} fallback={<Heading size="2xl" color="white" mb={10}>Guia do <Text as="span" color="yellow.400">Texto</Text></Heading>} />
            
            <Heading size="2xl" color="white" lineHeight="1.2" mb={6} letterSpacing="tight">Bem-vindo de volta.</Heading>
            <Text fontSize="xl" color="teal.50" mb={10} lineHeight="relaxed">Acompanhe a sua evolução, compre novos pacotes de correção e conquiste a nota 1000.</Text>
            <VStack align="start" spacing={4}>
                <HStack><Icon as={CheckCircleIcon} color="yellow.400" boxSize={5} /><Text color="white" fontSize="lg" fontWeight="medium">Acesso a professores especialistas</Text></HStack>
                <HStack><Icon as={CheckCircleIcon} color="yellow.400" boxSize={5} /><Text color="white" fontSize="lg" fontWeight="medium">Análise detalhada por competências</Text></HStack>
            </VStack>
        </Box>
      </Flex>

      <Flex flex={1} w={{ base: '100%', lg: '60%' }} align="center" justify="center" bg="white" p={8} boxShadow="-10px 0 20px rgba(0,0,0,0.05)" zIndex={10}>
        <Box w="full" maxW="450px">
          
          <Flex justify="center" mb={8} display={{ base: 'flex', lg: 'none' }}>
              <Image src="/logo-login.svg" alt="Logo" maxH="40px" objectFit="contain" fallback={<Heading size="md" color="teal.600">Guia do <Text as="span" color="yellow.500">Texto</Text></Heading>} />
          </Flex>

          <form onSubmit={handleLogin} style={{ width: '100%' }}>
            <VStack spacing={6} align="stretch">
              <Box mb={4}>
                  <Heading size="xl" color="gray.800" mb={2} letterSpacing="tight">Acesse a sua conta</Heading>
                  <Text color="gray.500" fontSize="md">Insira as suas credenciais para continuar.</Text>
              </Box>

              <VStack spacing={5} align="stretch">
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" color="gray.700" fontWeight="bold">E-mail ou Usuário</FormLabel>
                    <InputGroup size="lg">
                        <InputLeftElement pointerEvents="none"><EmailIcon color="gray.400" /></InputLeftElement>
                        <Input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu.email@exemplo.com ou admin" bg="gray.50" _focus={{ bg: "white", borderColor: "teal.400" }} />
                    </InputGroup>
                  </FormControl>

                  <FormControl isRequired>
                    <Flex justify="space-between">
                        <FormLabel fontSize="sm" color="gray.700" fontWeight="bold">Senha</FormLabel>
                        <Button variant="link" colorScheme="teal" size="sm">Esqueceu a senha?</Button>
                    </Flex>
                    <InputGroup size="lg">
                        <InputLeftElement pointerEvents="none"><LockIcon color="gray.400" fontSize="sm" /></InputLeftElement>
                        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" bg="gray.50" _focus={{ bg: "white", borderColor: "teal.400" }} />
                    </InputGroup>
                  </FormControl>
              </VStack>

              <Button type="submit" colorScheme="teal" size="lg" fontSize="md" mt={4} isLoading={loading} w="full" shadow="md" _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }} transition="all 0.2s">
                Entrar na Plataforma
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
                        onError={() => toast({ title: "Login cancelado", status: "warning" })} 
                        shape="rectangular"
                        size="large"
                        theme="outline"
                        text="signin_with"
                      />
                  </Box>
              </Flex>
              
              <Text textAlign="center" fontSize="sm" color="gray.600" mt={4}>
                Ainda não tem conta? <Button as={RouterLink} to="/cadastro" variant="link" colorScheme="teal" fontWeight="bold">Cadastre-se grátis</Button>
              </Text>
            </VStack>
          </form>
        </Box>
      </Flex>
    </Flex>
  );
}

export default Login;