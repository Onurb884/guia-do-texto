import React from 'react';
import { Box, Container, Heading, Text, VStack, Button, Divider } from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';

const Termos = () => {
    const navigate = useNavigate();

    return (
        <Box w="full" minH="100vh" bg="gray.50" py={10}>
            <Container maxW="container.lg" bg="white" p={{ base: 6, md: 10 }} borderRadius="xl" shadow="sm" border="1px solid" borderColor="gray.200">
                <Button leftIcon={<ArrowBackIcon />} variant="ghost" colorScheme="teal" mb={6} onClick={() => navigate(-1)}>
                    Voltar
                </Button>
                
                <Heading size="xl" color="gray.800" mb={2}>Termos de Uso</Heading>
                <Text color="gray.500" mb={6}>Última atualização: {new Date().toLocaleDateString('pt-BR')}</Text>
                <Divider mb={8} />

                <VStack align="stretch" spacing={6} color="gray.700" lineHeight="tall">
                    <Box>
                        <Heading size="md" mb={2} color="teal.700">1. Aceitação dos Termos</Heading>
                        <Text>Ao aceder e utilizar a plataforma Guia do Texto, o utilizador concorda em cumprir e sujeitar-se aos presentes Termos de Uso. Se não concordar com alguma parte destes termos, não deverá utilizar os nossos serviços.</Text>
                    </Box>

                    <Box>
                        <Heading size="md" mb={2} color="teal.700">2. Serviços Oferecidos</Heading>
                        <Text>A nossa plataforma disponibiliza a correção de redações focadas no modelo ENEM e outros exames, bem como a venda de materiais de apoio pedagógico. Os prazos de devolução (SLA) dependem do pacote adquirido pelo utilizador (Normal ou VIP).</Text>
                    </Box>

                    <Box>
                        <Heading size="md" mb={2} color="teal.700">3. Política de Compras e Créditos</Heading>
                        <Text>Os pacotes de créditos não possuem data de expiração, salvo indicação em contrário na oferta promocional. Em caso de anulação de redação por motivos técnicos da plataforma (imagem corrompida, etc.), o crédito será estornado para a conta do aluno.</Text>
                    </Box>
                    
                    {/* Pode adicionar mais texto aqui livremente */}
                </VStack>
            </Container>
        </Box>
    );
};

export default Termos;