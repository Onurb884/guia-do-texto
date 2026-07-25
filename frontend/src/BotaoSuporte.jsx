import React, { useState, useRef, useEffect } from 'react';
import {
  Box, IconButton, Popover, PopoverTrigger, PopoverContent, 
  PopoverHeader, PopoverBody, PopoverCloseButton, 
  Input, Button, VStack, Text, Flex, Avatar, InputGroup, InputRightElement
} from '@chakra-ui/react';
import { ChatIcon } from '@chakra-ui/icons';
import { IoSend } from 'react-icons/io5'; // npm install react-icons

function BotaoSuporte() {
  const [mensagens, setMensagens] = useState([
    { remetente: 'ia', texto: 'Olá! Sou a assistente virtual do Guia do Texto. Como posso ajudar com a sua jornada rumo à nota 1000 hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [escrevendo, setEscrevendo] = useState(false);
  const fimDoChatRef = useRef(null);

  // Faz scroll automático para o fundo quando há nova mensagem
  useEffect(() => {
    fimDoChatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const handleEnviar = () => {
    if (!input.trim()) return;

    // 1. Adiciona a mensagem do Aluno
    const novaMensagemAluno = { remetente: 'aluno', texto: input };
    setMensagens((prev) => [...prev, novaMensagemAluno]);
    setInput('');
    setEscrevendo(true);

    // 2. Simula o "Pensamento" da IA e a resposta
    setTimeout(() => {
      setEscrevendo(false);
      setMensagens((prev) => [...prev, { 
          remetente: 'ia', 
          texto: 'Entendi! Como ainda estou em fase de testes e aprendizado, vou transferir a sua dúvida diretamente para a nossa equipa de especialistas humanos. Um momento, por favor...' 
      }]);
      
      // Aqui, no futuro, nós disparamos a mensagem real para o Backend (Painel do Gestor ou integração com WhatsApp Business API)
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleEnviar();
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
                    <Text fontSize="sm">{msg.texto}</Text>
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

          {/* Área de Digitação */}
          <Box p={3} bg="white" borderTop="1px solid" borderColor="gray.100">
            <InputGroup size="md">
              <Input 
                pr="3rem" 
                placeholder="Escreva a sua dúvida..." 
                borderRadius="full"
                bg="gray.50"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                _focus={{ borderColor: 'teal.400', bg: 'white' }}
              />
              <InputRightElement width="3rem">
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