import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Center, Spinner } from '@chakra-ui/react';

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const verificarDestino = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }
        // Pergunta ao servidor quem é o utilizador logado
        const res = await axios.get('http://127.0.0.1:8000/api/me/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const user = res.data;
        
        // REDIRECIONAMENTO INTELIGENTE
        if (user.is_staff || user.is_superuser) {
          // Admin ou Coordenador vai direto para a Torre de Controlo
          navigate('/gestao-fila');
        } else if (user.is_corretor) {
          // Professor vai para a sua Fila de Correção
          navigate('/painel-corretor');
        } else {
          // Se não for nenhum dos dois, é Aluno
          navigate('/painel-aluno');
        }
      } catch (e) {
        navigate('/');
      }
    };
    verificarDestino();
  }, [navigate]);

  return (
    <Center h="100vh">
      <Spinner size="xl" color="teal.500" thickness="4px" />
    </Center>
  );
};

export default Dashboard;