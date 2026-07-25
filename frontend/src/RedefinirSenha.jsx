import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box, Button, FormControl, FormLabel, Input, VStack, 
  Heading, Text, useToast, Image, Flex, InputGroup, 
  InputLeftElement
} from '@chakra-ui/react';
import { LockIcon, ArrowBackIcon } from '@chakra-ui/icons';

function RedefinirSenha() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  
  // Isto captura o uidb64 e o token diretamente do link (URL)
  const { uidb64, token } = useParams();

  const handleRedefinir = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
        return toast({ title: 'Erro', description: 'As senhas não coincidem.', status: 'error', isClosable: true });
    }
    
    if (password.length < 6) {
        return toast({ title: 'Senha fraca', description: 'A senha deve ter pelo menos 6 caracteres.', status: 'warning', isClosable: true });
    }

    setLoading(true);
    
    try {
        await axios.post(`http://127.0.0.1:8000/api/redefinir-senha/${uidb64}/${token}/`, { password });
        toast({
            title: 'Sucesso!',
            description: 'A sua senha foi alterada. Pode fazer login agora.',
            status: 'success',
            duration: 4000,
            isClosable: true,
        });
        navigate('/'); // Volta para o Login
    } catch (error) {
        toast({
            title: 'Link Inválido',
            description: error.response?.data?.erro || 'Este link já expirou ou é inválido. Peça um novo.',
            status: 'error',
            duration: 5000,
            isClosable: true,
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Flex minH="100vh" w="full" bg="gray.50" align="center" justify="center" p={4}>
        <Box w="full" maxW="450px" bg="white" p={{ base: 8, md: 10 }} borderRadius="2xl" shadow="xl" border="1px solid" borderColor="gray.100" textAlign="center">
            
            <Image src="/logo.svg" alt="Logo" maxH="40px" objectFit="contain" mx="auto" mb={6} />
            
            <Heading size="lg" color="gray.800" mb={3} letterSpacing="tight">Criar Nova Senha</Heading>
            <Text color="gray.500" fontSize="md" mb={8}>Digite a sua nova senha abaixo para recuperar o acesso à plataforma.</Text>
            
            <form onSubmit={handleRedefinir} style={{ width: '100%' }}>
                <VStack spacing={5} align="stretch" textAlign="left">
                    <FormControl isRequired>
                        <FormLabel fontSize="sm" color="gray.700" fontWeight="bold">Nova Senha</FormLabel>
                        <InputGroup size="lg">
                            <InputLeftElement pointerEvents="none"><LockIcon color="gray.400" /></InputLeftElement>
                            <Input 
                              type="password" 
                              value={password} 
                              onChange={(e) => setPassword(e.target.value)} 
                              placeholder="Mínimo 6 caracteres" 
                              bg="gray.50" _focus={{ bg: "white", borderColor: "teal.400" }} 
                            />
                        </InputGroup>
                    </FormControl>

                    <FormControl isRequired>
                        <FormLabel fontSize="sm" color="gray.700" fontWeight="bold">Confirmar Nova Senha</FormLabel>
                        <InputGroup size="lg">
                            <InputLeftElement pointerEvents="none"><LockIcon color="gray.400" /></InputLeftElement>
                            <Input 
                              type="password" 
                              value={confirmPassword} 
                              onChange={(e) => setConfirmPassword(e.target.value)} 
                              placeholder="Repita a senha" 
                              bg="gray.50" _focus={{ bg: "white", borderColor: "teal.400" }} 
                            />
                        </InputGroup>
                    </FormControl>
                    
                    <Button type="submit" colorScheme="teal" size="lg" w="full" mt={2} isLoading={loading} shadow="md">
                        Salvar Nova Senha
                    </Button>
                </VStack>
            </form>

            <Button as={RouterLink} to="/" variant="link" colorScheme="gray" leftIcon={<ArrowBackIcon />} mt={8}>
                Voltar para o Login
            </Button>
        </Box>
    </Flex>
  );
}

export default RedefinirSenha;