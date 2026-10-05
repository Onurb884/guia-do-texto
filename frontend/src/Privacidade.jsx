import React from 'react';
import { Box, Container, Heading, Text, VStack, Button, Divider } from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';

const Privacidade = () => {
    const navigate = useNavigate();

    return (
        <Box w="full" minH="100vh" bg="gray.50" py={10}>
            <Container maxW="container.lg" bg="white" p={{ base: 6, md: 10 }} borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.200">
                <Button leftIcon={<ArrowBackIcon />} variant="ghost" colorScheme="teal" mb={6} onClick={() => navigate(-1)}>
                    Voltar
                </Button>
                
                <Heading size="xl" color="gray.800" mb={2}>Política de Privacidade</Heading>
                <Text color="gray.500" mb={6}>Última atualização: {new Date().toLocaleDateString('pt-BR')}</Text>
                <Divider mb={8} />

                <VStack align="stretch" spacing={6} color="gray.700" lineHeight="tall">
                    <Box>
                        <Heading size="md" mb={2} color="teal.700">1. Coleta de Dados</Heading>
                        <Text>Coletamos informações pessoais que nos fornece voluntariamente ao registar-se na nossa plataforma, manifestar interesse nos nossos serviços ou de outra forma entrar em contacto connosco. Isso inclui nome, e-mail e dados de uso da plataforma.</Text>
                    </Box>

                    <Box>
                        <Heading size="md" mb={2} color="teal.700">2. Uso das Informações</Heading>
                        <Text>As suas redações poderão ser anonimizadas e utilizadas para fins estatísticos e de treino e aprimoramento dos nossos sistemas internos de inteligência artificial e controle de qualidade (QA).</Text>
                    </Box>

                    <Box>
                        <Heading size="md" mb={2} color="teal.700">3. Segurança dos Pagamentos</Heading>
                        <Text>Não armazenamos dados completos de cartão de crédito nos nossos servidores. Todas as transações financeiras são processadas através de um gateway de pagamento terceiro (Mercado Pago), garantindo ambiente criptografado e seguro.</Text>
                    </Box>
                </VStack>
            </Container>
        </Box>
    );
};

export default Privacidade;