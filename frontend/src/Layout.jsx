import React, { useState, useEffect } from 'react';
import { Box, Flex, Spinner, Center, Alert, AlertIcon, AlertTitle, AlertDescription } from '@chakra-ui/react';
import { Outlet, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';

const Layout = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [debugErro, setDebugErro] = useState(null); // <--- NOVO: Para ver o erro real
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) { 
        navigate('/'); 
        return; 
      }
      
      try {
        // Tenta buscar quem é o usuário
        const response = await axios.get('http://127.0.0.1:8000/api/me/', { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        console.log("Sucesso ao carregar usuário:", response.data);
        setUser(response.data);
      } catch (error) {
        console.error("ERRO DETALHADO:", error);
        // Aqui vamos capturar o motivo exato
        const mensagem = error.response 
          ? `Status: ${error.response.status} - ${JSON.stringify(error.response.data)}`
          : error.message;
        
        setDebugErro(mensagem);
        
        // Se for erro de Token Inválido (401), aí sim desloga
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            navigate('/');
        }
      } finally { 
        setLoading(false); 
      }
    };
    fetchUser();
  }, [navigate]);

  if (loading) return <Center h="100vh"><Spinner size="xl" color="teal.500" /></Center>;

  return (
    <Flex bg="gray.50" minH="100vh">
      {/* Se tiver usuário, mostra o menu. Se não, esconde mas não trava a tela */}
      {user && <Sidebar user={user} />}
      
      <Box ml={{ base: 0, md: user ? 64 : 0 }} w="full" p="0">
        {/* MOSTRAR O ERRO NA TELA PARA A GENTE VER */}
        {debugErro && (
            <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" height="200px">
              <AlertIcon boxSize="40px" mr={0} />
              <AlertTitle mt={4} mb={1} fontSize="lg">Erro de Conexão com API!</AlertTitle>
              <AlertDescription maxWidth="sm">
                <b>O que aconteceu:</b> {debugErro}
              </AlertDescription>
            </Alert>
        )}
        
        <Outlet context={{ user }} />
      </Box>
    </Flex>
  );
};
export default Layout;