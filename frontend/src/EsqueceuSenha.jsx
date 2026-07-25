import React, { useState } from 'react';
import axios from 'axios'; // <-- O Axios estava a faltar na primeira versão!
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Button, FormControl, Input, VStack, 
  Heading, Text, useToast, Image, Flex, InputGroup, 
  InputLeftElement, Icon, Divider
} from '@chakra-ui/react';
import { EmailIcon, ArrowBackIcon, CheckCircleIcon } from '@chakra-ui/icons';

function EsqueceuSenha() {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast(); // <-- Faltava instanciar o toast!

  const handleRecuperar = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    
    try {
        await axios.post('http://127.0.0.1:8000/api/recuperar-senha/', { email });
        setEnviado(true);
    } catch (error) {
        toast({
            title: 'Não foi possível enviar',
            description: error.response?.data?.erro || 'Verifique o e-mail ou a configuração do servidor.',
            status: 'error',
            duration: 5000,
            isClosable: true,
        });
    } finally {
        // O finally garante que o botão para de girar sempre, mesmo que dê erro
        setLoading(false); 
    }
  };

  return (
    <Flex minH="100vh" w="full" bg="gray.50" align="center" justify="center" p={4}>
        
        <Box w="full" maxW="450px" bg="white" p={{ base: 8, md: 10 }} borderRadius="2xl" shadow="xl" border="1px solid" borderColor="gray.100" textAlign="center">
            
            <Image src="/logo.svg" alt="Logo" maxH="40px" objectFit="contain" mx="auto" mb={6} />
            
            {!enviado ? (
                <>
                    <Heading size="lg" color="gray.800" mb={3} letterSpacing="tight">Esqueceu a sua senha?</Heading>
                    <Text color="gray.500" fontSize="md" mb={8}>Não se preocupe! Insira o e-mail associado à sua conta e enviaremos um link para a redefinir.</Text>
                    
                    <form onSubmit={handleRecuperar} style={{ width: '100%' }}>
                        <VStack spacing={5}>
                            <FormControl isRequired>
                                <InputGroup size="lg">
                                    <InputLeftElement pointerEvents="none"><EmailIcon color="gray.400" /></InputLeftElement>
                                    <Input 
                                      type="email" 
                                      value={email} 
                                      onChange={(e) => setEmail(e.target.value)} 
                                      placeholder="Digite o seu e-mail" 
                                      bg="gray.50" 
                                      _focus={{ bg: "white", borderColor: "teal.400" }} 
                                    />
                                </InputGroup>
                            </FormControl>
                            
                            <Button type="submit" colorScheme="teal" size="lg" w="full" isLoading={loading} shadow="md">
                                Enviar Link de Recuperação
                            </Button>
                        </VStack>
                    </form>
                </>
            ) : (
                <VStack spacing={4} py={4}>
                    <Icon as={CheckCircleIcon} color="green.400" boxSize={16} />
                    <Heading size="md" color="gray.800">E-mail Enviado!</Heading>
                    <Text color="gray.500" fontSize="md">Verifique a sua caixa de entrada (e a pasta de spam) de <b>{email}</b> para redefinir a sua senha.</Text>
                </VStack>
            )}

            <Divider my={8} />

            <Button as={RouterLink} to="/" variant="link" colorScheme="gray" leftIcon={<ArrowBackIcon />}>
                Voltar para o Login
            </Button>
        </Box>
    </Flex>
  );
}

export default EsqueceuSenha;