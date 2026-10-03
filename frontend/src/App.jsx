import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Flex, Box } from '@chakra-ui/react'; 
import GestaoMateriais from './GestaoMateriais';
import GestaoGabarito from './GestaoGabarito';
import Home from './Home';

import axios from 'axios';

// --- SEGURANÇA INVISÍVEL (Axios Interceptor) ---
// Vigia todas as respostas do servidor. Se o token expirar (Erro 401),
// ele limpa o cache silenciosamente e devolve o utilizador ao Login sem quebrar a tela.
axios.interceptors.response.use(
  (response) => {
    // Se a resposta for sucesso, apenas deixa passar
    return response;
  },
  (error) => {
    // Se bater na porta e o servidor disser 401 (Não Autorizado)
    if (error.response && error.response.status === 401) {
      // 1. Limpa as chaves caducadas da memória
      localStorage.removeItem('token');
      localStorage.removeItem('redacao_em_andamento');
      localStorage.removeItem('correcao_endtime');
      
      // 2. Chuta para a tela de login (apenas se ele já não estiver nela)
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// IMPORTAÇÕES
import Login from './Login';
import Cadastro from './Cadastro';
import Dashboard from './Dashboard'; 
import PainelAluno from './PainelAluno';
import PainelCorretor from './PainelCorretor';
import GerenciarTemas from './GerenciarTemas';
import Sidebar from './Sidebar'; 
import GerenciarRespostas from './GerenciarRespostas';
import TorreControle from './TorreControle'; 
import GestaoUsuarios from './GestaoUsuarios'; 
import GestaoVitrine from './GestaoVitrine';
import TrabalheConosco from './TrabalheConosco';
import MeuPerfil from './MeuPerfil';
import EsqueceuSenha from './EsqueceuSenha';
import RedefinirSenha from './RedefinirSenha';
import GestaoFinanceira from './GestaoFinanceira';

function App() {
  const location = useLocation();
  
  // Lista de todas as páginas públicas (sem barra lateral)
  const hideSidebar = location.pathname === '/' || 
                      location.pathname === '/login' ||
                      location.pathname === '/cadastro' || 
                      location.pathname === '/trabalhe-conosco' || 
                      location.pathname === '/esqueceu-senha' || 
                      location.pathname.startsWith('/redefinir-senha');
  
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Flex h="100vh" overflow="hidden" position="relative">
      
      {!hideSidebar && (
        <Box 
          className="no-print"
          w={isSidebarOpen ? "250px" : "80px"} 
          minW={isSidebarOpen ? "250px" : "80px"} 
          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          borderRight="1px solid"
          borderColor="gray.200"
          bg="white"
          zIndex={100} 
        >
          <Sidebar 
             isOpen={isSidebarOpen} 
             toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} 
          />
        </Box>
      )}

      <Box 
        flex="1" 
        overflowY="auto" 
        bg="gray.50" 
        position="relative"
        transition="all 0.3s"
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/meu-perfil" element={<MeuPerfil />} />          
          <Route path="/dashboard" element={<Dashboard />} /> 
          
          <Route path="/painel-aluno" element={<PainelAluno />} />
          <Route path="/painel-corretor" element={<PainelCorretor />} />
          <Route path="/temas" element={<GerenciarTemas />} />
          <Route path="/gestao-gabarito" element={<GestaoGabarito />} />
          <Route path="/gestao-materiais" element={<GestaoMateriais />} />
          <Route path="/corretor/respostas" element={<GerenciarRespostas />} />
          <Route path="/gestao-fila" element={<TorreControle />} /> 
          <Route path="/gestao-usuarios" element={<GestaoUsuarios />} /> 
          <Route path="/trabalhe-conosco" element={<TrabalheConosco />} />
          <Route path='/esqueceu-senha' element={<EsqueceuSenha />} />
          <Route path="/redefinir-senha/:uidb64/:token" element={<RedefinirSenha />} />
          <Route path="/gestao-vitrine" element={<GestaoVitrine />} />
          <Route path="/gestao-financeira" element={<GestaoFinanceira />} />
        </Routes>
      </Box>
    </Flex>
  );
}

export default App;