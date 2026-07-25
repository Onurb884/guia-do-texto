import React, { useState, useEffect } from 'react';
import {
  Box, Button, Container, Flex, Heading, Text, VStack, HStack,
  SimpleGrid, Card, CardBody, Icon, Badge, Divider, Image, Avatar
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
    CheckCircleIcon, StarIcon, TimeIcon, 
    ArrowForwardIcon, ViewIcon, InfoIcon 
} from '@chakra-ui/icons';
import axios from 'axios';

const Home = () => {
  const navigate = useNavigate();
  const [pacotes, setPacotes] = useState([]);

  useEffect(() => {
    const buscarPacotes = async () => {
      try {
        const res = await axios.get('http://127.0.0.1:8000/api/gestao/pacotes/');
        setPacotes(res.data.filter(p => p.visivel_loja));
      } catch (error) {
        setPacotes([
            { id: 1, nome: "Treino Básico", descricao: "Ideal para começar a testar os seus conhecimentos.", preco: "29.90", qtd_creditos_simples: 3, qtd_creditos_vip: 0 },
            { id: 2, nome: "Aprovação ENEM", descricao: "O pacote mais escolhido pelos alunos nota 1000.", preco: "59.90", preco_original: "79.90", qtd_creditos_simples: 5, qtd_creditos_vip: 2, selo_destaque: "Mais Popular", permite_parcelamento: true, max_parcelas: 2 },
            { id: 3, nome: "Reta Final VIP", descricao: "Prioridade máxima na correção e atenção aos detalhes.", preco: "99.90", qtd_creditos_simples: 10, qtd_creditos_vip: 5, permite_parcelamento: true, max_parcelas: 3 }
        ]);
      }
    };
    buscarPacotes();
  }, []);

  return (
    <Box w="full" minH="100vh" bg="gray.50" fontFamily="Inter, sans-serif">
      
      {/* ================= NAVBAR ================= */}
      <Box bg="white" borderBottom="1px solid" borderColor="gray.200" position="sticky" top="0" zIndex="100" shadow="sm">
        <Container maxW="container.xl" py={4}>
          <Flex justify="space-between" align="center">
            <Flex align="center" cursor="pointer" onClick={() => navigate('/')}>
              <Image 
                src="/logo.svg" 
                alt="Guia do Texto" 
                h={{ base: "30px", md: "30px" }} 
                fallbackSrc="https://via.placeholder.com/150x40?text=Sua+Logo+Aqui" 
                objectFit="contain"
              />
            </Flex>
            <HStack spacing={4}>
              <Button as={RouterLink} to="/trabalhe-conosco" variant="ghost" colorScheme="teal" size="sm" display={{ base: 'none', md: 'flex' }}>
                Trabalhe Conosco
              </Button>
              <Button as={RouterLink} to="/login" variant="outline" colorScheme="teal" size="sm">
                Entrar
              </Button>
              <Button as={RouterLink} to="/cadastro" colorScheme="teal" size="sm" shadow="md">
                Começar Grátis
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* ================= HERO SECTION COM IMAGEM LOCAL ================= */}
      <Box 
        bgImage="linear-gradient(rgba(49, 151, 149, 0.9), rgba(35, 78, 82, 0.95)), url('/bg-home.jpg')"
        bgSize="cover"
        bgPosition="center"
        bgAttachment="fixed"
        color="white" 
        pt={{ base: 16, md: 24 }} 
        pb={{ base: 20, md: 32 }} 
        position="relative" 
        overflow="hidden"
      >
        <Container maxW="container.xl" position="relative" zIndex="1">
          <Flex direction={{ base: "column", lg: "row" }} align="center" gap={12}>
            
            <VStack align="start" flex="1" spacing={6}>
              <Badge colorScheme="yellow" bg="yellow.400" color="yellow.900" px={3} py={1} borderRadius="full" fontWeight="900" letterSpacing="wide">
                MÉTODO COMPROVADO
              </Badge>
              <Heading fontSize={{ base: "4xl", md: "5xl", lg: "6xl" }} fontWeight="900" lineHeight="1.1" letterSpacing="tight">
                A sua nota 1000 começa com a <Text as="span" color="yellow.400">correção certa.</Text>
              </Heading>
              <Text fontSize={{ base: "lg", md: "xl" }} color="teal.50" maxW="600px" lineHeight="1.6">
                Treine com propostas no modelo ENEM, escreva à mão ou no simulador digital, e receba um feedback detalhado de professores especialistas em menos de 24 horas.
              </Text>
              
              <HStack spacing={4} pt={4} w={{ base: "full", sm: "auto" }}>
                <Button size="lg" colorScheme="yellow" bg="yellow.400" color="yellow.900" _hover={{ bg: 'yellow.500' }} px={8} h="60px" fontSize="lg" shadow="xl" onClick={() => navigate('/cadastro')}>
                  Começar a Treinar
                </Button>
                <Button size="lg" variant="outline" color="white" _hover={{ bg: 'whiteAlpha.200' }} border="2px solid" h="60px" px={8} onClick={() => document.getElementById('planos').scrollIntoView({ behavior: 'smooth' })}>
                  Ver Planos
                </Button>
              </HStack>
              
              <HStack spacing={6} pt={6} color="teal.100" fontSize="sm" fontWeight="medium">
                <Flex align="center" gap={2}><CheckCircleIcon color="green.300" /> Correção por competências</Flex>
                <Flex align="center" gap={2}><CheckCircleIcon color="green.300" /> Fila VIP (Urgência)</Flex>
              </HStack>
            </VStack>

            <Box flex="1" w="full" maxW="600px" position="relative">
              <Box bg="white" borderRadius="2xl" p={2} shadow="2xl" transform="rotate(2deg)" transition="all 0.3s" _hover={{ transform: 'rotate(0deg) scale(1.02)' }}>
                <Box border="1px solid" borderColor="gray.100" borderRadius="xl" overflow="hidden" bg="gray.50" h="auto" minH="400px" display="flex" flexDirection="column">
                    <Box bg="gray.100" p={3} borderBottom="1px solid" borderColor="gray.200" display="flex" gap={2}>
                        <Box w="12px" h="12px" borderRadius="full" bg="red.400" />
                        <Box w="12px" h="12px" borderRadius="full" bg="yellow.400" />
                        <Box w="12px" h="12px" borderRadius="full" bg="green.400" />
                    </Box>
                    <Box p={6} flex="1">
                        <Heading size="md" color="gray.700" mb={4}>Feedback da Correção</Heading>
                        <VStack spacing={3} align="stretch">
                            <Flex justify="space-between" bg="green.50" p={3} borderRadius="lg" borderLeft="4px solid" borderColor="green.400" mb={1}><Text fontWeight="bold" color="green.700">Competência 1</Text><Text fontWeight="900" color="green.700">200 pts</Text></Flex>
                            <Box mt={-2} mb={2} ml={4} bg="white" p={3} borderRadius="md" border="1px solid" borderColor="gray.200" borderLeft="3px solid" borderLeftColor="green.400" shadow="sm">
                                <Text fontSize="xs" color="gray.600" fontStyle="italic">
                                    "Ótimo domínio da norma culta! Excelente uso de vocabulário e vírgulas perfeitas no 2º parágrafo."
                                </Text>
                            </Box>
                            <Flex justify="space-between" bg="blue.50" p={3} borderRadius="lg" borderLeft="4px solid" borderColor="blue.400"><Text fontWeight="bold" color="blue.700">Competência 2</Text><Text fontWeight="900" color="blue.700">200 pts</Text></Flex>
                            <Flex justify="space-between" bg="purple.50" p={3} borderRadius="lg" borderLeft="4px solid" borderColor="purple.400"><Text fontWeight="bold" color="purple.700">Competência 3</Text><Text fontWeight="900" color="purple.700">160 pts</Text></Flex>
                        </VStack>
                    </Box>
                </Box>
              </Box>
              <Card position="absolute" bottom="-20px" left="-20px" bg="white" p={4} shadow="xl" borderRadius="xl" border="1px solid" borderColor="gray.100" animation="pulseBanner 4s infinite">
                  <HStack>
                      <Box bg="green.100" p={2} borderRadius="full"><CheckCircleIcon color="green.500" boxSize={6} /></Box>
                      <Box><Text fontSize="xs" color="gray.500" fontWeight="bold" textTransform="uppercase">Nota Final</Text><Text fontSize="2xl" fontWeight="900" color="gray.800" lineHeight="1">920</Text></Box>
                  </HStack>
              </Card>
            </Box>

          </Flex>
        </Container>
      </Box>

      {/* ================= COMO FUNCIONA ================= */}
      <Box py={20} bg="white">
        <Container maxW="container.xl">
          <VStack mb={16} textAlign="center">
            <Text color="teal.600" fontWeight="bold" letterSpacing="widest" textTransform="uppercase" fontSize="sm">Jornada do Aluno</Text>
            <Heading size="xl" color="gray.800">Como funciona a plataforma?</Heading>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
            <VStack align="center" textAlign="center" spacing={4}>
              <Flex w="80px" h="80px" bg="teal.50" borderRadius="full" align="center" justify="center" border="2px solid" borderColor="teal.200"><Text fontSize="3xl">📝</Text></Flex>
              <Heading size="md" color="gray.700">1. Escolha o Tema</Heading>
              <Text color="gray.500">Navegue por dezenas de propostas no estilo ENEM e concursos. Utilize a nossa IA para ter ideias de repertório.</Text>
            </VStack>
            <VStack align="center" textAlign="center" spacing={4}>
              <Flex w="80px" h="80px" bg="blue.50" borderRadius="full" align="center" justify="center" border="2px solid" borderColor="blue.200"><Text fontSize="3xl">📸</Text></Flex>
              <Heading size="md" color="gray.700">2. Escreva e Envie</Heading>
              <Text color="gray.500">Escreva à mão, tire uma foto e anexe, ou digite diretamente no nosso simulador de folha online.</Text>
            </VStack>
            <VStack align="center" textAlign="center" spacing={4}>
              <Flex w="80px" h="80px" bg="green.50" borderRadius="full" align="center" justify="center" border="2px solid" borderColor="green.200"><Text fontSize="3xl">🎯</Text></Flex>
              <Heading size="md" color="gray.700">3. Receba o Feedback</Heading>
              <Text color="gray.500">Em pouco tempo, o seu texto é devolvido com notas por competência, marcações de erros e dicas de melhoria.</Text>
            </VStack>
          </SimpleGrid>
        </Container>
      </Box>

      {/* ================= DIFERENCIAIS ================= */}
      <Box py={20} bg="gray.50">
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={16} align="center">
            <VStack align="start" spacing={6} justify="center">
              <Heading size="xl" color="gray.800" lineHeight="1.2">Tudo o que você precisa para <Text as="span" color="teal.600">evoluir a sua escrita.</Text></Heading>
              <Text fontSize="lg" color="gray.600">Não somos apenas um corretor automático. Somos uma plataforma completa focada no seu desenvolvimento contínuo.</Text>
              
              <VStack align="start" spacing={4} pt={4} w="full">
                <Flex bg="white" p={4} borderRadius="xl" border="1px solid" borderColor="gray.200" w="full" shadow="sm" align="center" gap={4}>
                  <Box bg="purple.100" p={3} borderRadius="lg"><StarIcon color="purple.600" boxSize={6} /></Box>
                  <Box textAlign="left"><Heading size="sm" color="gray.800">Fila de Correção VIP</Heading><Text fontSize="sm" color="gray.500">Tem urgência? Use um crédito VIP e fure a fila de correções.</Text></Box>
                </Flex>
                <Flex bg="white" p={4} borderRadius="xl" border="1px solid" borderColor="gray.200" w="full" shadow="sm" align="center" gap={4}>
                  <Box bg="blue.100" p={3} borderRadius="lg"><InfoIcon color="blue.600" boxSize={6} /></Box>
                  <Box textAlign="left"><Heading size="sm" color="gray.800">Brainstorm com IA</Heading><Text fontSize="sm" color="gray.500">Bloqueio criativo? Nossa IA sugere repertórios socioculturais na hora.</Text></Box>
                </Flex>
                <Flex bg="white" p={4} borderRadius="xl" border="1px solid" borderColor="gray.200" w="full" shadow="sm" align="center" gap={4}>
                  <Box bg="orange.100" p={3} borderRadius="lg"><ViewIcon color="orange.600" boxSize={6} /></Box>
                  <Box textAlign="left"><Heading size="sm" color="gray.800">Materiais de Apoio</Heading><Text fontSize="sm" color="gray.500">Acesso a cartilhas, manuais e redações Nota 1000 para estudar.</Text></Box>
                </Flex>
              </VStack>
            </VStack>
            <Box bgGradient="linear(to-br, teal.50, blue.50)" borderRadius="3xl" p={10} display="flex" alignItems="center" justifyContent="center">
                <Image src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop" alt="Aluno estudando" borderRadius="2xl" shadow="xl" />
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* ================= PROVA SOCIAL / DEPOIMENTOS (NOVA SECÇÃO) ================= */}
      <Box py={20} bg="teal.800" color="white">
        <Container maxW="container.xl">
            <VStack mb={16} textAlign="center">
                <Text color="yellow.400" fontWeight="bold" letterSpacing="widest" textTransform="uppercase" fontSize="sm">Aprovações</Text>
                <Heading size="xl">Resultados que falam por si.</Heading>
            </VStack>
            
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
                <Card bg="white" p={6} borderRadius="2xl" shadow="lg">
                    <VStack align="start" spacing={4}>
                        <HStack color="yellow.400"><StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon /></HStack>
                        <Text color="gray.600" fontSize="md" fontStyle="italic">"A correção detalhada por competência fez toda a diferença. Eu estava preso nos 700 pontos e consegui bater os incríveis 960 no ENEM! A plataforma é muito fácil de usar."</Text>
                        <HStack mt={2}>
                            <Avatar size="sm" name="Lucas F." bg="teal.500" color="white" />
                            <Box><Text fontWeight="bold" color="gray.800" fontSize="sm">Lucas F.</Text><Text fontSize="xs" color="green.500" fontWeight="bold">Nota: 960</Text></Box>
                        </HStack>
                    </VStack>
                </Card>

                <Card bg="white" p={6} borderRadius="2xl" shadow="lg" transform={{ md: "translateY(-15px)" }}>
                    <VStack align="start" spacing={4}>
                        <HStack color="yellow.400"><StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon /></HStack>
                        <Text color="gray.600" fontSize="md" fontStyle="italic">"Poder enviar a foto do meu caderno foi essencial para simular a prova real. E a IA sugerindo repertórios desbloqueou a minha criatividade nas semanas finais!"</Text>
                        <HStack mt={2}>
                            <Avatar size="sm" name="Mariana S." bg="blue.500" color="white" />
                            <Box><Text fontWeight="bold" color="gray.800" fontSize="sm">Mariana S.</Text><Text fontSize="xs" color="green.500" fontWeight="bold">Aprovada em Medicina</Text></Box>
                        </HStack>
                    </VStack>
                </Card>

                <Card bg="white" p={6} borderRadius="2xl" shadow="lg">
                    <VStack align="start" spacing={4}>
                        <HStack color="yellow.400"><StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon /></HStack>
                        <Text color="gray.600" fontSize="md" fontStyle="italic">"A fila VIP salvou-me na véspera do vestibular. Enviei o meu texto e em poucas horas recebi um feedback impecável. Excelente investimento."</Text>
                        <HStack mt={2}>
                            <Avatar size="sm" name="Pedro C." bg="purple.500" color="white" />
                            <Box><Text fontWeight="bold" color="gray.800" fontSize="sm">Pedro C.</Text><Text fontSize="xs" color="green.500" fontWeight="bold">Nota: 920</Text></Box>
                        </HStack>
                    </VStack>
                </Card>
            </SimpleGrid>

            {/* PEQUENOS NÚMEROS (ESTATÍSTICAS) */}
            <Flex justify="center" align="center" mt={16} gap={{ base: 8, md: 16 }} wrap="wrap">
                <VStack><Heading size="lg" color="yellow.400">15k+</Heading><Text fontSize="sm" color="teal.100">Redações Corrigidas</Text></VStack>
                <VStack><Heading size="lg" color="yellow.400">24h</Heading><Text fontSize="sm" color="teal.100">Tempo Médio de Retorno</Text></VStack>
                <VStack><Heading size="lg" color="yellow.400">920+</Heading><Text fontSize="sm" color="teal.100">Média dos Alunos Ativos</Text></VStack>
            </Flex>
        </Container>
      </Box>

      {/* ================= PLANOS E PREÇOS ================= */}
      <Box id="planos" py={20} bg="white">
        <Container maxW="container.xl">
          <VStack mb={12} textAlign="center">
            <Heading size="xl" color="gray.800">Escolha o seu plano de treino</Heading>
            <Text color="gray.500" fontSize="lg" maxW="600px">Sem mensalidades ou assinaturas presas. Compre pacotes de créditos e use quando quiser.</Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} maxW="1000px" mx="auto">
            {pacotes.map((p, index) => {
              const precoNum = parseFloat(p.preco);
              const isDestaque = p.selo_destaque || index === 1;
              
              return (
                <Card key={p.id} bg="white" shadow={isDestaque ? "2xl" : "md"} borderRadius="2xl" border="1px solid" borderColor={isDestaque ? "yellow.400" : "gray.200"} position="relative" overflow="hidden" transform={isDestaque ? { md: "scale(1.05)" } : "none"} zIndex={isDestaque ? 2 : 1}>
                    {isDestaque && (<Box position="absolute" top="0" w="full" bg="yellow.400" color="yellow.900" py={1} textAlign="center" fontSize="xs" fontWeight="900" textTransform="uppercase">🔥 {p.selo_destaque ? p.selo_destaque.toUpperCase() : "MAIS POPULAR"}</Box>)}
                    
                    <Box bg={isDestaque ? "yellow.50" : "gray.50"} p={6} pt={isDestaque ? 10 : 6} textAlign="center" borderBottom="1px solid" borderColor="gray.100">
                        <Heading size="md" color={isDestaque ? "yellow.800" : "gray.700"} mb={2}>{p.nome}</Heading>
                        <Text fontSize="sm" color="gray.500" mb={4} minH="40px">{p.descricao}</Text>
                        <Flex justify="center" align="flex-end" gap={1}>
                            <Text fontSize="md" color="gray.500" fontWeight="bold" pb={1}>R$</Text>
                            <Text fontSize="5xl" fontWeight="900" color="gray.800" lineHeight="0.9">{precoNum.toFixed(2).replace('.', ',')}</Text>
                        </Flex>
                        {p.preco_original && <Text fontSize="xs" color="gray.400" textDecoration="line-through" mt={1}>De R$ {parseFloat(p.preco_original).toFixed(2).replace('.', ',')}</Text>}
                    </Box>
                    
                    <CardBody p={6} display="flex" flexDirection="column" flex="1">
                        <VStack spacing={4} align="stretch" flex="1" mb={6}>
                            <HStack><CheckCircleIcon color="green.500" boxSize={4}/><Text fontWeight="bold" color="gray.700">{p.qtd_creditos_simples} Correções detalhadas</Text></HStack>
                            <HStack><CheckCircleIcon color={p.qtd_creditos_vip > 0 ? "purple.500" : "gray.300"} boxSize={4}/><Text color={p.qtd_creditos_vip > 0 ? "gray.700" : "gray.400"} fontWeight={p.qtd_creditos_vip > 0 ? "bold" : "normal"}>{p.qtd_creditos_vip} Fila VIP (Prioridade)</Text></HStack>
                            <HStack><CheckCircleIcon color="green.500" boxSize={4}/><Text color="gray.600">Acesso a Temas Oficiais</Text></HStack>
                            <HStack><CheckCircleIcon color="green.500" boxSize={4}/><Text color="gray.600">Material de Apoio Grátis</Text></HStack>
                        </VStack>
                        
                        <Box mt="auto">
                            {p.permite_parcelamento && p.max_parcelas > 1 ? (
                                <Text fontSize="xs" color="green.500" fontWeight="bold" mb={2} textAlign="center">
                                    Em até {p.max_parcelas}x de R$ {(precoNum / p.max_parcelas).toFixed(2).replace('.', ',')} no cartão
                                </Text>
                            ) : (
                                <Text fontSize="xs" color="gray.400" mb={2} textAlign="center">Pagamento à vista</Text>
                            )}
                            <Button w="full" size="lg" colorScheme={isDestaque ? "yellow" : "teal"} bg={isDestaque ? "yellow.400" : undefined} color={isDestaque ? "yellow.900" : undefined} _hover={isDestaque ? { bg: 'yellow.500' } : undefined} onClick={() => navigate(`/cadastro?pacote=${p.id}`)}>
                                Assinar Agora
                            </Button>
                        </Box>
                    </CardBody>
                </Card>
              )
            })}
          </SimpleGrid>
        </Container>
      </Box>

      {/* ================= FOOTER ================= */}
      <Box bg="gray.900" color="gray.400" py={12}>
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={8} mb={8}>
            <Box colSpan={{ base: 1, md: 2 }}>
              <Image src="/logo-footer.svg" alt="Guia do Texto" h="30px" mb={4} style={{ filter: 'grayscale(100%) brightness(200%)' }} fallbackSrc="https://via.placeholder.com/150x30?text=Sua+Logo" />
              <Text fontSize="sm" maxW="300px">Ajudamos milhares de alunos a conquistarem a sua vaga na universidade através da escrita perfeita.</Text>
            </Box>
            <VStack align="start" spacing={2}>
              <Text color="white" fontWeight="bold" mb={2}>Plataforma</Text>
              <RouterLink to="/login"><Text _hover={{ color: "white" }}>Entrar na conta</Text></RouterLink>
              <RouterLink to="/cadastro"><Text _hover={{ color: "white" }}>Criar conta grátis</Text></RouterLink>
              <RouterLink to="/trabalhe-conosco"><Text _hover={{ color: "white" }}>Seja um Corretor</Text></RouterLink>
            </VStack>
            <VStack align="start" spacing={2}>
              <Text color="white" fontWeight="bold" mb={2}>Segurança</Text>
              <Text fontSize="sm">Pagamentos processados com segurança pelo Mercado Pago.</Text>
              <Badge colorScheme="blue" variant="outline">Ambiente 100% Seguro</Badge>
            </VStack>
          </SimpleGrid>
          <Divider borderColor="gray.700" mb={6} />
          <Flex justify="space-between" align="center" wrap="wrap" fontSize="sm">
            <Text>© {new Date().getFullYear()} Guia do Texto. Todos os direitos reservados.</Text>
            <HStack spacing={4}>
              <Text cursor="pointer" _hover={{ color: "white" }}>Termos de Uso</Text>
              <Text cursor="pointer" _hover={{ color: "white" }}>Privacidade</Text>
            </HStack>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;