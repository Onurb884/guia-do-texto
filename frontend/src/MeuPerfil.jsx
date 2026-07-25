import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Heading, Text, VStack, Button, Box, Flex, 
  FormControl, FormLabel, Input, useToast, SimpleGrid, Card, CardBody, Divider
} from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';

// Máscaras brasileiras
const maskPhone = (value) => value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');
const maskCPF = (value) => value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');

function MeuPerfil() {
  const [formData, setFormData] = useState({
      first_name: '', last_name: '', email: '', telefone: '', cpf: '', password: '', confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    carregarDadosPessoais();
  }, []);

  const carregarDadosPessoais = async () => {
    try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://127.0.0.1:8000/api/me/', { headers: { Authorization: `Bearer ${token}` } });
        setFormData({
            ...formData,
            first_name: res.data.first_name || '',
            last_name: res.data.last_name || '',
            email: res.data.email || '',
            telefone: res.data.telefone || '',
            cpf: res.data.cpf || ''
        });
    } catch (error) {
        toast({ title: 'Erro ao carregar os dados', status: 'error' });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirm_password) {
        return toast({ title: "As senhas não coincidem!", status: "warning" });
    }

    setLoading(true);
    try {
        const token = localStorage.getItem('token');
        // Envia apenas o que pode ser atualizado (E-mail fica de fora por segurança)
        const payload = {
            first_name: formData.first_name,
            last_name: formData.last_name,
            telefone: formData.telefone,
            cpf: formData.cpf,
            ...(formData.password ? { password: formData.password } : {})
        };

        await axios.patch('http://127.0.0.1:8000/api/me/', payload, { headers: { Authorization: `Bearer ${token}` } });
        
        toast({ title: "Perfil atualizado com sucesso!", status: "success" });
        setFormData({ ...formData, password: '', confirm_password: '' }); // Limpa os campos de senha
        
        // Dispara um evento para o Sidebar atualizar o nome automaticamente
        window.location.reload(); 
    } catch (error) {
        toast({ title: "Erro ao atualizar dados", status: "error" });
    }
    setLoading(false);
  };

  return (
    <Container maxW="container.md" py={10} bg="gray.50" minH="100vh">
      <VStack spacing={6} align="stretch" as="form" onSubmit={handleSave}>
        
        <Box mb={4}>
            <Heading size="lg" color="teal.700">Meu Perfil</Heading>
            <Text color="gray.500" fontSize="md">Gerencie os seus dados pessoais e preferências de segurança.</Text>
        </Box>

        <Card bg="white" shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.200">
            <CardBody p={8}>
                <VStack spacing={6} align="stretch">
                    
                    <Box>
                        <Heading size="sm" color="gray.700" mb={4}>Informações Pessoais</Heading>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                            <FormControl isRequired>
                                <FormLabel color="gray.600" fontSize="sm">Nome</FormLabel>
                                <Input bg="gray.50" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel color="gray.600" fontSize="sm">Sobrenome</FormLabel>
                                <Input bg="gray.50" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} placeholder="Seu apelido/sobrenome" />
                            </FormControl>
                            <FormControl>
                                <FormLabel color="gray.600" fontSize="sm">E-mail (Acesso)</FormLabel>
                                <Input bg="gray.100" value={formData.email} isReadOnly cursor="not-allowed" color="gray.500" />
                                <Text fontSize="xs" color="gray.400" mt={1}>O e-mail de acesso não pode ser alterado.</Text>
                            </FormControl>
                            <FormControl>
                                <FormLabel color="gray.600" fontSize="sm">Telefone / WhatsApp</FormLabel>
                                <Input bg="gray.50" value={formData.telefone} onChange={e => setFormData({...formData, telefone: maskPhone(e.target.value)})} placeholder="(00) 00000-0000" maxLength={15} />
                            </FormControl>
                            <FormControl>
                                <FormLabel color="gray.600" fontSize="sm">CPF</FormLabel>
                                <Input bg="gray.50" value={formData.cpf} onChange={e => setFormData({...formData, cpf: maskCPF(e.target.value)})} placeholder="000.000.000-00" maxLength={14} />
                            </FormControl>
                        </SimpleGrid>
                    </Box>

                    <Divider borderColor="gray.200" />

                    <Box>
                        <Heading size="sm" color="gray.700" mb={4}>Segurança</Heading>
                        <Text fontSize="sm" color="gray.500" mb={4}>Deixe os campos em branco caso não queira alterar a sua senha atual.</Text>
                        
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                            <FormControl>
                                <FormLabel color="gray.600" fontSize="sm">Nova Senha</FormLabel>
                                <Input type="password" bg="gray.50" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="******" />
                            </FormControl>
                            <FormControl>
                                <FormLabel color="gray.600" fontSize="sm">Confirmar Nova Senha</FormLabel>
                                <Input type="password" bg="gray.50" value={formData.confirm_password} onChange={e => setFormData({...formData, confirm_password: e.target.value})} placeholder="******" />
                            </FormControl>
                        </SimpleGrid>
                    </Box>

                </VStack>
            </CardBody>
        </Card>

        <Flex justify="flex-end">
            <Button type="submit" size="lg" colorScheme="teal" isLoading={loading} leftIcon={<CheckCircleIcon />} shadow="md" px={8}>
                Salvar Alterações
            </Button>
        </Flex>

      </VStack>
    </Container>
  );
}

export default MeuPerfil;