import React, { useState, useRef, useEffect } from 'react';
import {
  Box, IconButton, Popover, PopoverTrigger, PopoverContent, 
  PopoverHeader, PopoverBody, PopoverCloseButton, 
  Button, VStack, Text, Flex, Avatar, InputGroup, InputRightElement,
  Textarea // <-- Importamos o Textarea do Chakra UI
} from '@chakra-ui/react';
import { ChatIcon } from '@chakra-ui/icons';
import { IoSend } from 'react-icons/io5'; 

function BotaoSuporte() {
  const [mensagens, setMensagens] = useState([
    { remetente: 'ia', texto: 'Olá! Sou a assistente virtual do Guia do Texto. Como posso ajudar com a sua jornada rumo à nota 1000 hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [escrevendo, setEscrevendo] = useState(false);
  const fimDoChatRef = useRef(null);
  const textareaRef = useRef(null);

  // Faz scroll automático para o fundo quando há nova mensagem
  useEffect(() => {
    fimDoChatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const handleEnviar = async () => {
    if (!input.trim()) return;

    // 1. Adiciona a mensagem do Aluno na tela imediatamente
    const mensagemAtual = input;
    const novaMensagemAluno = { remetente: 'aluno', texto: mensagemAtual };
    setMensagens((prev) => [...prev, novaMensagemAluno]);
    
    // Limpa o campo e mostra o status "A escrever..."
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setEscrevendo(true);

    try {
        // Pega o token de login do aluno (ajuste 'token' se você salvou com outro nome no seu Login.jsx)
        const token = localStorage.getItem('token'); 

        // 2. Dispara a mensagem para a nossa IA no Django
        const resposta = await fetch('http://localhost:8000/api/chat-assistente/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ mensagem: mensagemAtual })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            // 3. Recebe a resposta do Gemini e joga na tela
            setMensagens((prev) => [...prev, { remetente: 'ia', texto: dados.resposta }]);
        } else {
            console.error("Erro do servidor:", dados.erro);
            setMensagens((prev) => [...prev, { 
                remetente: 'ia', 
                texto: 'Desculpe, ocorreu um erro de comunicação com o sistema. Tente novamente em instantes.' 
            }]);
        }
    } catch (erro) {
        console.error("Erro de conexão:", erro);
        setMensagens((prev) => [...prev, { 
            remetente: 'ia', 
            texto: 'Parece que você está sem internet ou nosso servidor está reiniciando.' 
        }]);
    } finally {
        setEscrevendo(false);
    }
  };

  const handleKeyPress = (e) => {
    // Se apertar Enter (sem segurar Shift), envia a mensagem
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Evita que pule uma linha antes de enviar
      handleEnviar();
    }
  };

  return (
    <Box position="fixed" bottom="6" right="6" zIndex="tooltip">
      <Popover placement="top-end" isLazy>
        <PopoverTrigger>
          <IconButton
            colorScheme="teal"
            aria-label="Suporte"
            icon={<ChatIcon boxSize={6} />}
            size="lg"
            w="60px"
            h="60px"
            isRound
            boxShadow="dark-lg"
            _hover={{ transform: 'scale(1.1)' }}
            transition="all 0.2s"
          />
        </PopoverTrigger>
        
        <PopoverContent w="350px" h="450px" boxShadow="2xl" borderRadius="xl" border="none" overflow="hidden" display="flex" flexDirection="column">
          
          <PopoverHeader bg="teal.600" color="white" fontWeight="bold" borderBottom="none" py={4} display="flex" alignItems="center" gap={3}>
            <Avatar size="sm" name="Assistente IA" bg="teal.300" src="/ia-avatar.png" />
            <Box>
                <Text fontSize="md">Assistente Virtual</Text>
                <Text fontSize="xs" color="teal.100" fontWeight="normal">Suporte Guia do Texto</Text>
            </Box>
            <PopoverCloseButton color="white" top="4" right="4" />
          </PopoverHeader>
          
          <PopoverBody p={0} bg="gray.50" flex="1" overflowY="auto" display="flex" flexDirection="column">
            <VStack spacing={4} align="stretch" p={4} flex="1">
              {mensagens.map((msg, index) => (
                <Flex key={index} justify={msg.remetente === 'aluno' ? 'flex-end' : 'flex-start'}>
                  {msg.remetente === 'ia' && <Avatar size="xs" name="IA" bg="teal.500" mr={2} mt={1} />}
                  <Box 
                    bg={msg.remetente === 'aluno' ? 'teal.500' : 'white'} 
                    color={msg.remetente === 'aluno' ? 'white' : 'gray.700'}
                    px={4} py={2} 
                    borderRadius="2xl" 
                    borderTopRightRadius={msg.remetente === 'aluno' ? 'sm' : '2xl'}
                    borderTopLeftRadius={msg.remetente === 'ia' ? 'sm' : '2xl'}
                    boxShadow="sm"
                    maxW="80%"
                    border={msg.remetente === 'ia' ? '1px solid' : 'none'}
                    borderColor="gray.200"
                  >
                    <Text fontSize="sm" whiteSpace="pre-wrap">{msg.texto}</Text>
                  </Box>
                </Flex>
              ))}
              
              {escrevendo && (
                <Flex justify="flex-start">
                  <Avatar size="xs" name="IA" bg="teal.500" mr={2} mt={1} />
                  <Box bg="white" px={4} py={2} borderRadius="2xl" borderTopLeftRadius="sm" boxShadow="sm" border="1px solid" borderColor="gray.200">
                    <Text fontSize="xs" color="gray.400" fontStyle="italic">A escrever...</Text>
                  </Box>
                </Flex>
              )}
              <div ref={fimDoChatRef} />
            </VStack>
          </PopoverBody>

          {/* Nova Área de Digitação com Textarea */}
          <Box p={3} bg="white" borderTop="1px solid" borderColor="gray.100">
            <InputGroup size="md" alignItems="center">
              <Textarea 
                ref={textareaRef} // Conecta a referência
                pr="3rem" 
                placeholder="Escreva a sua dúvida..." 
                borderRadius="xl"
                bg="gray.50"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // Mágica do Auto-Resize:
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={handleKeyPress}
                _focus={{ borderColor: 'teal.400', bg: 'white' }}
                resize="none"
                minH="45px"       // Altura inicial (1 linha e meia)
                maxH="120px"      // Altura máxima (após umas 4 linhas, ele para de crescer e rola internamente)
                overflowY="auto"  // Permite rolagem suave se passar de 120px
                rows={1}
                py={3} // Padding vertical para o texto não ficar colado nas bordas
              />
              <InputRightElement h="100%" width="3rem" alignItems="center">
                <IconButton 
                  h="1.75rem" size="sm" isRound colorScheme="teal" variant="ghost" 
                  icon={<IoSend />} 
                  onClick={handleEnviar}
                  aria-label="Enviar"
                />
              </InputRightElement>
            </InputGroup>
          </Box>
        </PopoverContent>
      </Popover>
    </Box>
  );
}

export default BotaoSuporte;