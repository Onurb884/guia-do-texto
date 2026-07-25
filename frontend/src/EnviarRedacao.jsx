import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Container, Heading, Text, VStack, Box, Button, useToast, Card, CardBody, Divider, Flex, HStack, Badge, Textarea, Alert, AlertIcon
} from '@chakra-ui/react';
import { CheckCircleIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { useNavigate, useLocation } from 'react-router-dom';

function EnviarRedacao() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { temaId } = state || {};

  const [temaDetalhes, setTemaDetalhes] = useState(null);
  const [textoRedacao, setTextoRedacao] = useState('');
  const [contagemPalavras, setContagemPalavras] = useState(0);
  const [contagemLinhas, setContagemLinhas] = useState(1); // Começa com 1
  const [loading, setLoading] = useState(false);
  const [isFull, setIsFull] = useState(false); // Novo estado para indicar limite

  // Refs para calcular altura real
  const shadowRef = useRef(null); 

  useEffect(() => {
    if (!temaId) { navigate('/painel-aluno'); return; }
    const carregar = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/temas/', { headers: { Authorization: `Bearer ${token}` }});
            const tema = res.data.find(t => t.id === parseInt(temaId));
            if (tema) setTemaDetalhes(tema);
        } catch (e) { console.error(e); }
    };
    carregar();
  }, [temaId, navigate]);

  // --- LÓGICA DE CONTAGEM E LIMITE ---
  const handleTextoChange = (e) => {
    const novoTexto = e.target.value;
    
    // 1. Joga o texto no "Espelho Invisível" para medir a altura real
    if (shadowRef.current) {
        shadowRef.current.value = novoTexto;
        
        // Mede a altura do conteúdo no espelho
        const alturaReal = shadowRef.current.scrollHeight - 60; // 30px padding top + 30px padding bottom
        
        // Calcula linhas visuais (altura / 30px)
        let linhasVisuais = Math.floor(alturaReal / 30);
        
        // Conta "Enters" explícitos (quebras de parágrafo)
        const quebrasEnter = (novoTexto.match(/\n/g) || []).length;
        
        // O número de linhas é o maior valor entre o visual e os enters (+1 pois começa na linha 1)
        // Mas se a alturaVisual for maior (texto wrap), ela prevalece.
        // Ajuste fino: Se o texto for vazio, é 1.
        let linhasTotais = Math.max(1, linhasVisuais);
        
        // Ajuste específico para ENTER no final da linha
        if (novoTexto.endsWith('\n')) {
             // Se acabou de dar enter, tecnicamente criou uma nova linha vazia visualmente
             linhasTotais = Math.max(linhasVisuais, quebrasEnter + 1);
        }

        // --- BLOQUEIO DE DIGITAÇÃO ---
        if (linhasTotais > 30) {
            // Se ultrapassar 30, não atualiza o estado do texto!
            // (Bloqueia a digitação do caractere que causou o estouro)
            setIsFull(true);
            
            // Permite apagar (se o novo texto for menor que o atual, deixa passar)
            if (novoTexto.length < textoRedacao.length) {
                setTextoRedacao(novoTexto);
                setIsFull(false); // Saiu do limite
                // Recalcula para exibir correto ao apagar
                // (Poderia otimizar, mas vamos deixar simples)
            } else {
                // Toca um feedback visual ou toast rápido se quiser
                if (!toast.isActive('limite-toast')) {
                    toast({ 
                        id: 'limite-toast',
                        title: "Limite de linhas atingido!", 
                        status: "warning", 
                        duration: 1000,
                        isClosable: true 
                    });
                }
            }
            return; // ABORTA A MUDANÇA
        } else {
            setIsFull(false);
        }

        // Se passou no teste, atualiza tudo
        setContagemLinhas(linhasTotais);
        setTextoRedacao(novoTexto);
        setContagemPalavras(novoTexto.trim().split(/\s+/).filter(w => w.length > 0).length);
    }
  };

  const handleSubmit = async () => {
      if (!textoRedacao.trim()) { toast({ title: "Escreva algo!", status: "warning" }); return; }
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const blob = new Blob([textoRedacao], { type: 'text/plain' });
      const arquivo = new File([blob], "digitada.txt", { type: "text/plain" });
      
      const formData = new FormData();
      formData.append('tema', temaId);
      formData.append('arquivo', arquivo);

      try {
          await axios.post('http://127.0.0.1:8000/api/enviar/', formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }});
          toast({ title: "Sucesso!", status: "success" });
          navigate('/painel-aluno');
      } catch (e) { toast({ title: "Erro", status: "error" }); setLoading(false); }
  };

  // Estilo Base (Compartilhado entre o Real e o Sombra)
  const baseStyle = {
    fontFamily: "'Inter', sans-serif",
    fontSize: '16px',
    lineHeight: '30px',
    padding: '30px',
    width: '100%',
    border: '1px solid #cbd5e1',
    resize: 'none',
    overflow: 'hidden', // Sem scroll no elemento, scroll é na página
    textAlign: 'justify',
  };

  const paperStyle = {
    ...baseStyle,
    // Linha Sólida
    backgroundImage: 'linear-gradient(to bottom, transparent 29px, #94a3b8 29px, #94a3b8 30px)',
    backgroundSize: '100% 30px',
    backgroundAttachment: 'local',
    backgroundColor: '#fff',
    height: '100%', // Altura fixa do A4 visual
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    border: isFull ? '2px solid red' : '1px solid #cbd5e1'
  };

  // Estilo do Sombra (Invisível mas com mesmas métricas físicas)
  const shadowStyle = {
    ...baseStyle,
    position: 'absolute',
    top: 0,
    left: -9999, // Tira da tela
    visibility: 'hidden',
    height: 'auto', // Altura automática para medir o crescimento
    minHeight: 'auto'
  };

  return (
    <Container maxW="container.xl" py={6} h="calc(100vh - 20px)">
      <Flex align="center" mb={6}>
        <Button leftIcon={<ArrowBackIcon />} variant="ghost" onClick={() => navigate('/painel-aluno')} mr={4}>Voltar</Button>
        <Heading size="md" color="teal.600">Sala de Redação</Heading>
      </Flex>

      <Flex gap={8} h="full" direction={{ base: 'column', lg: 'row' }}>
        
        {/* COLUNA ESQUERDA: FOLHA A4 */}
        <Box flex={1} bg="#f0f2f5" p={8} borderRadius="lg" h="full" overflowY="auto" display="flex" justifyContent="center">
            {/* Box A4 Fixo (297mm altura) */}
            <Box w="210mm" minH="297mm" bg="white" boxShadow="xl" position="relative">
                
                {/* 1. TEXTAREA REAL (Onde o aluno digita) */}
                <Textarea 
                    value={textoRedacao} 
                    onChange={handleTextoChange} 
                    sx={paperStyle} 
                    placeholder="Comece seu texto..." 
                    _focus={{ outline: 'none' }} 
                    spellCheck={false} 
                />

                {/* 2. TEXTAREA SOMBRA (Usado apenas para cálculo matemático) */}
                <textarea 
                    ref={shadowRef}
                    style={shadowStyle}
                    tabIndex={-1}
                    aria-hidden="true"
                />
            </Box>
        </Box>

        {/* COLUNA DIREITA: PAINEL */}
        <Box w={{ base: '100%', lg: '350px' }}>
            <VStack spacing={4} align="stretch">
                <Button colorScheme="green" size="lg" onClick={handleSubmit} isLoading={loading} rightIcon={<CheckCircleIcon />} w="full" h="50px">
                    Entregar Redação
                </Button>

                <Card bg={isFull ? "red.50" : "blue.50"} border={isFull ? "1px solid red" : "none"}>
                    <CardBody py={3}>
                        <HStack justify="space-between">
                            <Text fontWeight="bold" color={isFull ? "red.600" : "blue.800"}>
                                Linhas: {contagemLinhas} / 30
                            </Text>
                            <Text fontWeight="bold" color="blue.900">Palavras: {contagemPalavras}</Text>
                        </HStack>
                    </CardBody>
                </Card>

                {isFull && (
                    <Alert status="error" variant="solid" borderRadius="md">
                        <AlertIcon />
                        Limite de 30 linhas atingido!
                    </Alert>
                )}

                <Card variant="outline" bg="white" borderColor="teal.100" boxShadow="sm">
                    <CardBody>
                        <Heading size="xs" color="teal.500" textTransform="uppercase" mb={2}>Tema da Proposta</Heading>
                        <Heading size="md" color="gray.700" mb={3}>{temaDetalhes?.titulo}</Heading>
                        <Divider mb={3} />
                        <Box maxH="300px" overflowY="auto">
                            <Text fontSize="sm" color="gray.600">{temaDetalhes?.descricao}</Text>
                        </Box>
                    </CardBody>
                </Card>
                
                <Alert status="warning" variant="subtle" fontSize="xs" borderRadius="md">
                    <AlertIcon boxSize="12px" />
                    Corretor ortográfico desativado.
                </Alert>
            </VStack>
        </Box>
      </Flex>
    </Container>
  );
}

export default EnviarRedacao;