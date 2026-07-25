import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Button, FormControl, FormLabel, Input, VStack, 
  Heading, Text, useToast, Image, Flex, SimpleGrid,
  HStack, Icon, Textarea, Select, Divider, IconButton, Grid
} from '@chakra-ui/react';
import { ArrowBackIcon, CheckCircleIcon, AttachmentIcon, StarIcon, TimeIcon, AddIcon, DeleteIcon } from '@chakra-ui/icons';

function TrabalheConosco() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', cpf: '', telefone: '', password: '', confirm_password: '',
    minibio: '', banco: '', agencia: '', conta: '', tipo_chave_pix: '', chave_pix: ''
  });
  
  // ARRAYS PARA OS CAMPOS DINÂMICOS
  const [formacoes, setFormacoes] = useState([]);
  const [experiencias, setExperiencias] = useState([]);
  
  const [arquivo, setArquivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();

  // ================= MÁSCARAS DE FORMATAÇÃO =================
  const maskCPF = (value) => {
    return value
      .replace(/\D/g, '') 
      .replace(/(\d{3})(\d)/, '$1.$2') 
      .replace(/(\d{3})(\d)/, '$1.$2') 
      .replace(/(\d{3})(\d{1,2})/, '$1-$2') 
      .replace(/(-\d{2})\d+?$/, '$1'); 
  };

  const maskTelefone = (value) => {
    return value
      .replace(/\D/g, '') 
      .replace(/(\d{2})(\d)/, '($1) $2') 
      .replace(/(\d{5})(\d)/, '$1-$2') 
      .replace(/(-\d{4})\d+?$/, '$1'); 
  };

  // FUNÇÕES DINÂMICAS DE FORMAÇÃO
  const addFormacao = () => setFormacoes([...formacoes, { instituicao: '', curso: '', ano: '' }]);
  const removeFormacao = (index) => setFormacoes(formacoes.filter((_, i) => i !== index));
  const updateFormacao = (index, field, value) => {
    const newFormacoes = [...formacoes];
    newFormacoes[index][field] = value;
    setFormacoes(newFormacoes);
  };

  // FUNÇÕES DINÂMICAS DE EXPERIÊNCIA
  const addExperiencia = () => setExperiencias([...experiencias, { cargo: '', empresa: '', periodo: '' }]);
  const removeExperiencia = (index) => setExperiencias(experiencias.filter((_, i) => i !== index));
  const updateExperiencia = (index, field, value) => {
    const newExp = [...experiencias];
    newExp[index][field] = value;
    setExperiencias(newExp);
  };

  const handleNextStep1 = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
        return toast({ title: "Erro", description: "As senhas não coincidem.", status: "error" });
    }
    setStep(2);
  };

  const handleNextStep2 = (e) => {
    e.preventDefault();
    setStep(3);
  };

  const handlePrev = () => setStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const data = new FormData();
    Object.keys(formData).forEach(key => {
        if (key !== 'confirm_password') data.append(key, formData[key]);
    });
    
    data.append('formacoes', JSON.stringify(formacoes));
    data.append('experiencias', JSON.stringify(experiencias));
    
    if (arquivo) data.append('curriculo', arquivo);

    try {
      await axios.post('http://127.0.0.1:8000/api/candidatura-corretor/', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast({ title: "Candidatura enviada!", description: "A nossa equipa vai analisar o seu perfil.", status: "success", duration: 5000 });
      navigate('/'); 
    } catch (error) {
      toast({ title: "Erro no envio", description: error.response?.data?.erro || "Verifique os dados informados.", status: "error" });
    }
    setLoading(false);
  };

  const getSubmitHandler = () => {
      if (step === 1) return handleNextStep1;
      if (step === 2) return handleNextStep2;
      return handleSubmit;
  };

  return (
    <Flex minH="100vh" w="full" direction={{ base: "column", lg: "row" }} overflow="hidden">
      
      {/* COLUNA ESQUERDA (50%) - TONS DE TEAL (VERDE-AZULADO) */}
      <Flex 
        w={{ base: '100%', lg: '50%' }} 
        bg="teal.800" 
        direction="column" 
        justify="center" 
        align="center"
        px={{ base: 8, lg: 12, xl: 20 }} 
        py={12}
        position="relative" 
      >
        {/* IMAGEM CORRIGIDA PARA FICAR LOCAL! (NA PASTA PUBLIC) */}
        <Image src="/bg-trabalhe.jpg" alt="Professores" objectFit="cover" position="absolute" top={0} left={0} w="100%" h="100%" opacity={0.15} />
        
        <Box w="full" maxW="700px" zIndex={2}>
            <Button as={RouterLink} to="/" variant="link" color="whiteAlpha.800" leftIcon={<ArrowBackIcon />} mb={6} _hover={{ color: "white" }}>Voltar ao Início</Button>
            
            <Heading fontSize="42px" color="white" mb={4} letterSpacing="tight" lineHeight="shorter">Junte-se à nossa equipe de elite.</Heading>
            <Text fontSize="lg" color="teal.200" mb={8}>Procuramos professores apaixonados por transformar a escrita de milhares de alunos e que buscam uma fonte de renda extra flexível.</Text>
            
            <VStack spacing={5} align="stretch">
                <Box bg="whiteAlpha.200" p={5} borderRadius="xl" backdropFilter="blur(10px)" border="1px solid" borderColor="whiteAlpha.300">
                    <HStack mb={2}><Icon as={TimeIcon} color="yellow.400" boxSize={5} /><Heading size="sm" color="white">Horários Flexíveis</Heading></HStack>
                    <Text color="teal.100" fontSize="sm">Corrija de onde quiser e na hora que preferir. Você faz o seu próprio horário de trabalho.</Text>
                </Box>
                
                <Box bg="whiteAlpha.200" p={5} borderRadius="xl" backdropFilter="blur(10px)" border="1px solid" borderColor="whiteAlpha.300">
                    <HStack mb={2}><Icon as={CheckCircleIcon} color="green.400" boxSize={5} /><Heading size="sm" color="white">Pagamento Justo e Transparente</Heading></HStack>
                    <Text color="teal.100" fontSize="sm">Receba um valor fixo por cada redação corrigida, com bônus especiais para correções VIPs. Saque direto para o seu PIX.</Text>
                </Box>

                <Box bg="whiteAlpha.200" p={5} borderRadius="xl" backdropFilter="blur(10px)" border="1px solid" borderColor="whiteAlpha.300">
                    <HStack mb={2}><Icon as={StarIcon} color="blue.300" boxSize={5} /><Heading size="sm" color="white">Plataforma IA Exclusiva</Heading></HStack>
                    <Text color="teal.100" fontSize="sm">A nossa IA de pré-avaliação poupa 40% do seu tempo, sugerindo notas baseadas na régua do ENEM.</Text>
                </Box>
            </VStack>
        </Box>
      </Flex>

      {/* COLUNA DIREITA (50%) - COM BARRA DE ROLAGEM */}
      <Flex 
        w={{ base: '100%', lg: '50%' }} 
        align={{ base: "flex-start", lg: "center" }} 
        justify="center" 
        bg="gray.50" 
        p={{ base: 6, md: 8, xl: 12 }}
        overflowY="auto"
        maxH="100vh"
      >
        <Box w="full" maxW="700px" bg="white" p={{ base: 6, md: 8 }} borderRadius="2xl" shadow="xl" border="1px solid" borderColor="gray.100" my="auto">
            
            {/* INDICADOR DE PASSOS - TONS DE TEAL */}
            <HStack mb={6} spacing={3} justify="center">
                <Box flex="1" h="4px" bg="teal.500" borderRadius="full" opacity={step >= 1 ? 1 : 0.2} transition="all 0.3s" />
                <Box flex="1" h="4px" bg="teal.500" borderRadius="full" opacity={step >= 2 ? 1 : 0.2} transition="all 0.3s" />
                <Box flex="1" h="4px" bg="teal.500" borderRadius="full" opacity={step >= 3 ? 1 : 0.2} transition="all 0.3s" />
            </HStack>

            <Box mb={6} textAlign="center">
                <Heading size="md" color="gray.800" mb={1}>
                    {step === 1 && 'Dados Pessoais'}
                    {step === 2 && 'Perfil Profissional'}
                    {step === 3 && 'Dados de Pagamento'}
                </Heading>
                <Text color="gray.500" fontSize="sm">
                    {step === 1 && 'Informações básicas para o seu cadastro.'}
                    {step === 2 && 'Fale um pouco sobre a sua experiência e currículo.'}
                    {step === 3 && 'Como prefere receber os seus ganhos?'}
                </Text>
            </Box>

            <form onSubmit={getSubmitHandler()}>
              
              {/* ================= ETAPA 1: DADOS PESSOAIS ================= */}
              {step === 1 && (
                  <VStack spacing={4} align="stretch">
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <FormControl isRequired>
                              <FormLabel fontSize="sm" color="gray.700" fontWeight="bold" mb={1}>Nome</FormLabel>
                              <Input size="md" bg="gray.50" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} placeholder="Ex: Maria" _focus={{ borderColor: "teal.400", bg: "white" }} />
                          </FormControl>
                          <FormControl isRequired>
                              <FormLabel fontSize="sm" color="gray.700" fontWeight="bold" mb={1}>Sobrenome</FormLabel>
                              <Input size="md" bg="gray.50" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} placeholder="Ex: da Silva" _focus={{ borderColor: "teal.400", bg: "white" }} />
                          </FormControl>
                      </SimpleGrid>

                      <FormControl isRequired>
                          <FormLabel fontSize="sm" color="gray.700" fontWeight="bold" mb={1}>E-mail</FormLabel>
                          <Input size="md" type="email" bg="gray.50" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="seu.email@exemplo.com" _focus={{ borderColor: "teal.400", bg: "white" }} />
                      </FormControl>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <FormControl isRequired>
                              <FormLabel fontSize="sm" color="gray.700" fontWeight="bold" mb={1}>CPF</FormLabel>
                              <Input 
                                size="md" bg="gray.50" 
                                value={formData.cpf} 
                                onChange={(e) => setFormData({...formData, cpf: maskCPF(e.target.value)})} 
                                placeholder="000.000.000-00" 
                                _focus={{ borderColor: "teal.400", bg: "white" }} 
                              />
                          </FormControl>
                          <FormControl isRequired>
                              <FormLabel fontSize="sm" color="gray.700" fontWeight="bold" mb={1}>WhatsApp</FormLabel>
                              <Input 
                                size="md" bg="gray.50" 
                                value={formData.telefone} 
                                onChange={(e) => setFormData({...formData, telefone: maskTelefone(e.target.value)})} 
                                placeholder="(00) 00000-0000" 
                                _focus={{ borderColor: "teal.400", bg: "white" }} 
                              />
                          </FormControl>
                      </SimpleGrid>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <FormControl isRequired>
                              <FormLabel fontSize="sm" color="gray.700" fontWeight="bold" mb={1}>Criar Senha</FormLabel>
                              <Input size="md" type="password" bg="gray.50" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="Mínimo 6 caracteres" _focus={{ borderColor: "teal.400", bg: "white" }} />
                          </FormControl>
                          <FormControl isRequired>
                              <FormLabel fontSize="sm" color="gray.700" fontWeight="bold" mb={1}>Confirmar Senha</FormLabel>
                              <Input size="md" type="password" bg="gray.50" value={formData.confirm_password} onChange={(e) => setFormData({...formData, confirm_password: e.target.value})} placeholder="Repita a senha" _focus={{ borderColor: "teal.400", bg: "white" }} />
                          </FormControl>
                      </SimpleGrid>

                      <Button type="submit" colorScheme="teal" size="md" w="full" mt={4} shadow="md">
                          Continuar (1/3)
                      </Button>
                      
                      <Text textAlign="center" fontSize="sm" color="gray.600" mt={2}>
                          Já é corretor aprovado? <Button as={RouterLink} to="/login" variant="link" colorScheme="teal" fontWeight="bold">Faça login aqui</Button>
                      </Text>
                  </VStack>
              )}

              {/* ================= ETAPA 2: PERFIL E CURRÍCULO ================= */}
              {step === 2 && (
                  <VStack spacing={5} align="stretch">
                      <FormControl>
                          <FormLabel fontSize="sm" color="gray.700" fontWeight="bold" mb={1}>Mini Biografia</FormLabel>
                          <Textarea bg="gray.50" rows={2} value={formData.minibio} onChange={(e) => setFormData({...formData, minibio: e.target.value})} placeholder="Faça uma breve apresentação sobre si..." _focus={{ borderColor: "teal.400", bg: "white" }} />
                      </FormControl>

                      {/* LISTA DINÂMICA: EXPERIÊNCIA PROFISSIONAL */}
                      <Box>
                          <Flex justify="space-between" align="center" mb={3}>
                              <FormLabel fontSize="sm" color="gray.700" fontWeight="bold" m={0}>Experiência Profissional</FormLabel>
                              <Button size="xs" leftIcon={<AddIcon />} colorScheme="teal" variant="outline" onClick={addExperiencia}>Adicionar</Button>
                          </Flex>
                          <VStack spacing={3} align="stretch">
                              {experiencias.map((exp, idx) => (
                                  <Box key={idx} p={4} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                                      <Flex justify="space-between" align="center" mb={3}>
                                          <Text fontSize="xs" fontWeight="bold" color="teal.600" textTransform="uppercase">Experiência {idx + 1}</Text>
                                          <IconButton size="xs" icon={<DeleteIcon />} colorScheme="red" variant="ghost" onClick={() => removeExperiencia(idx)} aria-label="Remover" />
                                      </Flex>
                                      <Grid templateColumns={{ base: "1fr", md: "2fr 2fr 1.2fr" }} gap={3}>
                                          <FormControl>
                                              <FormLabel fontSize="xs" color="gray.600" mb={1} fontWeight="bold">Cargo / Função</FormLabel>
                                              <Input size="sm" bg="white" placeholder="Ex: Prof. Redação" value={exp.cargo} onChange={(e) => updateExperiencia(idx, 'cargo', e.target.value)} _focus={{ borderColor: "teal.400" }} />
                                          </FormControl>
                                          <FormControl>
                                              <FormLabel fontSize="xs" color="gray.600" mb={1} fontWeight="bold">Local / Empresa</FormLabel>
                                              <Input size="sm" bg="white" placeholder="Ex: Colégio Anglo" value={exp.empresa} onChange={(e) => updateExperiencia(idx, 'empresa', e.target.value)} _focus={{ borderColor: "teal.400" }} />
                                          </FormControl>
                                          <FormControl>
                                              <FormLabel fontSize="xs" color="gray.600" mb={1} fontWeight="bold">Período</FormLabel>
                                              <Input size="sm" bg="white" placeholder="Ex: 2020 - Atual" value={exp.periodo} onChange={(e) => updateExperiencia(idx, 'periodo', e.target.value)} _focus={{ borderColor: "teal.400" }} />
                                          </FormControl>
                                      </Grid>
                                  </Box>
                              ))}
                              {experiencias.length === 0 && <Text fontSize="xs" color="gray.500" textAlign="center" py={2}>Nenhuma experiência adicionada.</Text>}
                          </VStack>
                      </Box>

                      {/* LISTA DINÂMICA: FORMAÇÃO ACADÉMICA */}
                      <Box>
                          <Flex justify="space-between" align="center" mb={3}>
                              <FormLabel fontSize="sm" color="gray.700" fontWeight="bold" m={0}>Formação Académica</FormLabel>
                              <Button size="xs" leftIcon={<AddIcon />} colorScheme="teal" variant="outline" onClick={addFormacao}>Adicionar</Button>
                          </Flex>
                          <VStack spacing={3} align="stretch">
                              {formacoes.map((form, idx) => (
                                  <Box key={idx} p={4} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                                      <Flex justify="space-between" align="center" mb={3}>
                                          <Text fontSize="xs" fontWeight="bold" color="teal.600" textTransform="uppercase">Formação {idx + 1}</Text>
                                          <IconButton size="xs" icon={<DeleteIcon />} colorScheme="red" variant="ghost" onClick={() => removeFormacao(idx)} aria-label="Remover" />
                                      </Flex>
                                      <Grid templateColumns={{ base: "1fr", md: "2fr 2fr 1.2fr" }} gap={3}>
                                          <FormControl>
                                              <FormLabel fontSize="xs" color="gray.600" mb={1} fontWeight="bold">Instituição</FormLabel>
                                              <Input size="sm" bg="white" placeholder="Ex: USP" value={form.instituicao} onChange={(e) => updateFormacao(idx, 'instituicao', e.target.value)} _focus={{ borderColor: "teal.400" }} />
                                          </FormControl>
                                          <FormControl>
                                              <FormLabel fontSize="xs" color="gray.600" mb={1} fontWeight="bold">Curso / Titulação</FormLabel>
                                              <Input size="sm" bg="white" placeholder="Ex: Letras" value={form.curso} onChange={(e) => updateFormacao(idx, 'curso', e.target.value)} _focus={{ borderColor: "teal.400" }} />
                                          </FormControl>
                                          <FormControl>
                                              <FormLabel fontSize="xs" color="gray.600" mb={1} fontWeight="bold">Ano Conclusão</FormLabel>
                                              <Input size="sm" bg="white" placeholder="Ex: 2022" value={form.ano} onChange={(e) => updateFormacao(idx, 'ano', e.target.value)} _focus={{ borderColor: "teal.400" }} />
                                          </FormControl>
                                      </Grid>
                                  </Box>
                              ))}
                              {formacoes.length === 0 && <Text fontSize="xs" color="gray.500" textAlign="center" py={2}>Nenhuma formação adicionada.</Text>}
                          </VStack>
                      </Box>

                      {/* ARQUIVO CURRÍCULO (AGORA COM ESTILO TEAL) */}
                      <FormControl p={4} bg="teal.50" borderRadius="lg" border="2px dashed" borderColor={arquivo ? "teal.400" : "teal.200"} textAlign="center" cursor="pointer" onClick={() => fileInputRef.current.click()} _hover={{ bg: "teal.100" }} transition="all 0.2s">
                          <Icon as={AttachmentIcon} boxSize={5} color={arquivo ? "teal.500" : "teal.400"} mb={2} />
                          <Text fontWeight="bold" fontSize="sm" color={arquivo ? "teal.700" : "teal.600"}>{arquivo ? arquivo.name : "Anexar Currículo Lattes ou PDF (Opcional)"}</Text>
                          <Input type="file" display="none" ref={fileInputRef} accept=".pdf" onChange={e => setArquivo(e.target.files[0])} />
                      </FormControl>

                      <HStack spacing={4} mt={2}>
                          <Button type="button" onClick={handlePrev} size="md" variant="outline" colorScheme="gray" w="30%">Voltar</Button>
                          <Button type="submit" colorScheme="teal" size="md" w="70%" shadow="md">Continuar (2/3)</Button>
                      </HStack>
                  </VStack>
              )}

              {/* ================= ETAPA 3: DADOS DE PAGAMENTO ================= */}
              {step === 3 && (
                  <VStack spacing={5} align="stretch">
                      
                      <Text fontSize="sm" color="gray.500" mb={-2}>Os dados bancários são opcionais. Priorizamos o pagamento via PIX.</Text>
                      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                          <FormControl>
                              <FormLabel fontSize="sm" color="gray.700" fontWeight="bold" mb={1}>Banco (Opcional)</FormLabel>
                              <Input size="md" bg="gray.50" value={formData.banco} onChange={(e) => setFormData({...formData, banco: e.target.value})} placeholder="Ex: Nubank" _focus={{ borderColor: "teal.400", bg: "white" }} />
                          </FormControl>
                          <FormControl>
                              <FormLabel fontSize="sm" color="gray.700" fontWeight="bold" mb={1}>Agência (Opcional)</FormLabel>
                              <Input size="md" bg="gray.50" value={formData.agencia} onChange={(e) => setFormData({...formData, agencia: e.target.value})} placeholder="0001" _focus={{ borderColor: "teal.400", bg: "white" }} />
                          </FormControl>
                          <FormControl>
                              <FormLabel fontSize="sm" color="gray.700" fontWeight="bold" mb={1}>Conta (Opcional)</FormLabel>
                              <Input size="md" bg="gray.50" value={formData.conta} onChange={(e) => setFormData({...formData, conta: e.target.value})} placeholder="00000-0" _focus={{ borderColor: "teal.400", bg: "white" }} />
                          </FormControl>
                      </SimpleGrid>

                      <Divider my={1} borderColor="gray.300" />

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <FormControl isRequired>
                              <FormLabel fontSize="sm" color="gray.700" fontWeight="bold" mb={1}>Tipo de Chave PIX</FormLabel>
                              <Select size="md" bg="gray.50" value={formData.tipo_chave_pix} onChange={(e) => setFormData({...formData, tipo_chave_pix: e.target.value})} _focus={{ borderColor: "teal.400", bg: "white" }}>
                                  <option value="">Selecione...</option>
                                  <option value="CPF">CPF</option><option value="EMAIL">E-mail</option><option value="TELEFONE">Telefone</option><option value="ALEATORIA">Chave Aleatória</option>
                              </Select>
                          </FormControl>
                          <FormControl isRequired>
                              <FormLabel fontSize="sm" color="gray.700" fontWeight="bold" mb={1}>Sua Chave PIX</FormLabel>
                              <Input size="md" bg="gray.50" value={formData.chave_pix} onChange={(e) => setFormData({...formData, chave_pix: e.target.value})} placeholder="Insira a chave" _focus={{ borderColor: "teal.400", bg: "white" }} />
                          </FormControl>
                      </SimpleGrid>

                      <HStack spacing={4} mt={4}>
                          <Button type="button" onClick={handlePrev} size="md" variant="outline" colorScheme="gray" w="30%">Voltar</Button>
                          <Button type="submit" colorScheme="green" size="md" w="70%" isLoading={loading} shadow="md" leftIcon={<CheckCircleIcon />}>Finalizar Inscrição</Button>
                      </HStack>
                  </VStack>
              )}
            </form>
        </Box>
      </Flex>
    </Flex>
  );
}

export default TrabalheConosco;