import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Container, Heading, Text, VStack, HStack, Button, Box, Flex, 
  FormControl, FormLabel, Input, useToast, SimpleGrid, Card, CardBody, 
  Divider, Avatar, Textarea, IconButton, Icon, Badge, Spinner, Select,
  InputGroup, InputLeftElement
} from '@chakra-ui/react';
import { 
    CheckCircleIcon, LockIcon, DeleteIcon, AddIcon 
} from '@chakra-ui/icons';
import { MdCameraAlt } from 'react-icons/md';

// Máscaras brasileiras preservadas
const maskPhone = (value) => value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');
const maskCPF = (value) => value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');

function MeuPerfil() {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // --- DADOS BÁSICOS E SEGURANÇA ---
  const [dados, setDados] = useState({
      first_name: '', last_name: '', email: '', telefone: '', cpf: '', password: '', confirm_password: '', minibio: ''
  });

  // --- DADOS FINANCEIROS ---
  const [financeiro, setFinanceiro] = useState({
      chave_pix: '', tipo_chave_pix: '', banco: '', agencia: '', conta: ''
  });

  // --- FOTO DE PERFIL ---
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);

  // --- ARRAYS DINÂMICOS (CURRÍCULO) ---
  const [formacoes, setFormacoes] = useState([]);
  const [experiencias, setExperiencias] = useState([]);

  // --- PERMISSÕES DE EXIBIÇÃO ---
  const [isCorretor, setIsCorretor] = useState(false);
  const [isEquipe, setIsEquipe] = useState(false);

  useEffect(() => {
    carregarDadosPessoais();
  }, []);

  const carregarDadosPessoais = async () => {
    setLoading(true);
    try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://127.0.0.1:8000/api/me/', { headers: { Authorization: `Bearer ${token}` } });
        const u = res.data;

        setDados({
            first_name: u.first_name || '',
            last_name: u.last_name || '',
            email: u.email || '',
            telefone: u.telefone || '',
            cpf: u.cpf || '',
            minibio: u.minibio || '',
            password: '', 
            confirm_password: ''
        });

        // Separar a Agência e a Conta que vêm juntas
        let ag = ''; let cc = '';
        if (u.agencia_conta) {
            const parts = u.agencia_conta.split('Cc:');
            ag = parts[0]?.replace('Ag:', '').trim() || '';
            cc = parts[1]?.trim() || '';
        }

        setFinanceiro({
            chave_pix: u.chave_pix || '', tipo_chave_pix: u.tipo_chave_pix || '',
            banco: u.banco || '', agencia: ag, conta: cc
        });

        // ==========================================
        // SOLUÇÃO DA FOTO SUMINDO (CORREÇÃO DE URL)
        // ==========================================
        let urlFoto = u.foto_perfil;
        if (urlFoto && !urlFoto.startsWith('http')) {
            urlFoto = `http://127.0.0.1:8000${urlFoto}`;
        }
        setFotoPreview(urlFoto);
        
        setFormacoes(u.formacoes || []);
        setExperiencias(u.experiencias || []);
        
        setIsCorretor(u.is_corretor);
        setIsEquipe(u.is_staff || u.is_superuser);

    } catch (error) {
        toast({ title: 'Erro ao carregar os dados', status: 'error' });
    }
    setLoading(false);
  };

  // --- LÓGICA DE FOTO ---
  const handleFotoClick = () => fileInputRef.current.click();
  const handleFotoChange = (e) => {
      const file = e.target.files[0];
      if (file) {
          setFotoFile(file);
          setFotoPreview(URL.createObjectURL(file));
      }
  };

  // --- LÓGICA DE FORMAÇÕES ---
  const addFormacao = () => setFormacoes([...formacoes, { instituicao: '', curso: '', ano: '' }]);
  const removeFormacao = (index) => setFormacoes(formacoes.filter((_, i) => i !== index));
  const updateFormacao = (index, campo, valor) => {
      const novas = [...formacoes];
      novas[index][campo] = valor;
      setFormacoes(novas);
  };

  // --- LÓGICA DE EXPERIÊNCIAS ---
  const addExperiencia = () => setExperiencias([...experiencias, { empresa: '', cargo: '', periodo: '' }]);
  const removeExperiencia = (index) => setExperiencias(experiencias.filter((_, i) => i !== index));
  const updateExperiencia = (index, campo, valor) => {
      const novas = [...experiencias];
      novas[index][campo] = valor;
      setExperiencias(novas);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (dados.password && dados.password !== dados.confirm_password) {
        return toast({ title: "As senhas não coincidem!", status: "warning" });
    }

    setSalvando(true);
    try {
        const token = localStorage.getItem('token');
        const formData = new FormData();

        // Dados Básicos
        formData.append('first_name', dados.first_name);
        formData.append('last_name', dados.last_name);
        formData.append('telefone', dados.telefone);
        formData.append('cpf', dados.cpf);
        if (dados.password.trim() !== '') formData.append('password', dados.password);
        
        // Dados de Repasse Financeiro e Currículo (Apenas se for equipe ou corretor)
        if (isEquipe || isCorretor) {
            formData.append('chave_pix', financeiro.chave_pix);
            formData.append('tipo_chave_pix', financeiro.tipo_chave_pix);
            formData.append('banco', financeiro.banco);
            formData.append('agencia', financeiro.agencia);
            formData.append('conta', financeiro.conta);
        }

        if (isCorretor) {
            formData.append('minibio', dados.minibio);
            formData.append('formacoes', JSON.stringify(formacoes));
            formData.append('experiencias', JSON.stringify(experiencias));
        }

        // A Imagem do Avatar
        if (fotoFile) formData.append('foto_perfil', fotoFile);

        await axios.patch('http://127.0.0.1:8000/api/me/', formData, { 
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            } 
        });
        
        toast({ title: "Perfil atualizado com sucesso!", status: "success" });
        setDados({ ...dados, password: '', confirm_password: '' }); 
        
        // Recarregar a página para atualizar o nome/foto no Header principal
        setTimeout(() => { window.location.reload(); }, 1000);
    } catch (error) {
        toast({ title: "Erro ao atualizar dados", status: "error" });
    }
    setSalvando(false);
  };

  if (loading) return <Flex w="full" h="100vh" align="center" justify="center"><Spinner size="xl" color="teal.500" /></Flex>;

  return (
    <Container maxW="container.xl" py={10} bg="gray.50" minH="100vh">
      <VStack spacing={6} align="stretch" as="form" onSubmit={handleSave}>
        
        <Flex justify="space-between" align="center" mb={4} wrap="wrap" gap={4}>
            <Box>
                <Heading size="lg" color="teal.700">Meu Perfil</Heading>
                <Text color="gray.500" fontSize="md">Gerencie os seus dados pessoais, carreira e preferências de segurança.</Text>
            </Box>
            <Button type="submit" size="lg" colorScheme="teal" isLoading={salvando} leftIcon={<CheckCircleIcon />} shadow="md">
                Salvar Alterações
            </Button>
        </Flex>

        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8}>
            
            {/* LADO ESQUERDO: FOTO E SEGURANÇA (STICKY) */}
            <VStack 
                spacing={6} 
                align="stretch" 
                gridColumn={{ lg: 'span 1' }}
                position={{ lg: 'sticky' }} 
                top={{ lg: '24px' }}
                alignSelf="flex-start" 
            >
                <Card bg="white" shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.200" overflow="hidden">
                    <Box bgGradient="linear(to-r, teal.600, blue.600)" h="100px" w="full"></Box>
                    <CardBody display="flex" flexDirection="column" alignItems="center" mt="-60px">
                        
                        <Box position="relative" cursor="pointer" onClick={handleFotoClick} _hover={{ opacity: 0.8 }} transition="opacity 0.2s">
                            <Avatar size="2xl" name={`${dados.first_name} ${dados.last_name}`} src={fotoPreview} border="4px solid white" shadow="md" bg="teal.500" color="white" />
                            <Flex position="absolute" bottom="0" right="0" bg="gray.800" color="white" w="36px" h="36px" borderRadius="full" justify="center" align="center" shadow="md" border="3px solid white">
                                <Icon as={MdCameraAlt} />
                            </Flex>
                        </Box>
                        <Input type="file" display="none" ref={fileInputRef} onChange={handleFotoChange} accept="image/*" />
                        
                        <Heading size="md" mt={4} color="gray.800" textAlign="center">{dados.first_name} {dados.last_name}</Heading>
                        <Text color="gray.500" fontSize="sm" mb={4}>{dados.email}</Text>
                        
                        <Badge colorScheme={isCorretor ? "teal" : isEquipe ? "purple" : "gray"} px={3} py={1} borderRadius="full">
                            {isCorretor ? "Professor / Corretor" : isEquipe ? "Membro da Equipa" : "Aluno Treineiro"}
                        </Badge>
                    </CardBody>
                </Card>

                <Card bg="white" shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.200">
                    <CardBody>
                        <Heading size="sm" color="gray.700" mb={4}>Acesso e Segurança</Heading>
                        <Text fontSize="xs" color="gray.500" mb={4}>Deixe em branco caso não queira alterar a sua senha.</Text>
                        
                        <VStack spacing={4}>
                            <FormControl>
                                <FormLabel color="gray.600" fontSize="sm">Nova Senha</FormLabel>
                                <InputGroup>
                                    <InputLeftElement pointerEvents='none'><LockIcon color='gray.300' /></InputLeftElement>
                                    <Input type="password" bg="gray.50" value={dados.password} onChange={e => setDados({...dados, password: e.target.value})} placeholder="******" />
                                </InputGroup>
                            </FormControl>
                            <FormControl>
                                <FormLabel color="gray.600" fontSize="sm">Confirmar Nova Senha</FormLabel>
                                <InputGroup>
                                    <InputLeftElement pointerEvents='none'><LockIcon color='gray.300' /></InputLeftElement>
                                    <Input type="password" bg="gray.50" value={dados.confirm_password} onChange={e => setDados({...dados, confirm_password: e.target.value})} placeholder="******" />
                                </InputGroup>
                            </FormControl>
                        </VStack>
                    </CardBody>
                </Card>
            </VStack>

            {/* LADO DIREITO: INFORMAÇÕES PESSOAIS E PROFISSIONAIS (ROLA NORMALMENTE) */}
            <VStack spacing={6} align="stretch" gridColumn={{ lg: 'span 2' }}>
                
                {/* DADOS BÁSICOS (APARECE PARA TODOS) */}
                <Card bg="white" shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.200">
                    <CardBody p={8}>
                        <Heading size="sm" color="gray.700" mb={6}>Informações Pessoais</Heading>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                            <FormControl isRequired>
                                <FormLabel color="gray.600" fontSize="sm">Nome</FormLabel>
                                <Input bg="gray.50" value={dados.first_name} onChange={e => setDados({...dados, first_name: e.target.value})} />
                            </FormControl>
                            <FormControl isRequired>
                                <FormLabel color="gray.600" fontSize="sm">Sobrenome</FormLabel>
                                <Input bg="gray.50" value={dados.last_name} onChange={e => setDados({...dados, last_name: e.target.value})} />
                            </FormControl>
                            <FormControl>
                                <FormLabel color="gray.600" fontSize="sm">E-mail (Acesso)</FormLabel>
                                <Input bg="gray.100" value={dados.email} isReadOnly cursor="not-allowed" color="gray.500" />
                                <Text fontSize="xs" color="gray.400" mt={1}>O e-mail de acesso não pode ser alterado.</Text>
                            </FormControl>
                            <FormControl>
                                <FormLabel color="gray.600" fontSize="sm">Telefone / WhatsApp</FormLabel>
                                <Input bg="gray.50" value={dados.telefone} onChange={e => setDados({...dados, telefone: maskPhone(e.target.value)})} placeholder="(00) 00000-0000" maxLength={15} />
                            </FormControl>
                            <FormControl>
                                <FormLabel color="gray.600" fontSize="sm">CPF</FormLabel>
                                <Input bg="gray.50" value={dados.cpf} onChange={e => setDados({...dados, cpf: maskCPF(e.target.value)})} placeholder="000.000.000-00" maxLength={14} />
                            </FormControl>
                        </SimpleGrid>
                    </CardBody>
                </Card>

                {/* DADOS FINANCEIROS (APARECE PARA CORRETORES E EQUIPA) */}
                {(isEquipe || isCorretor) && (
                    <Card bg="green.50" shadow="sm" borderRadius="xl" border="1px solid" borderColor="green.200">
                        <CardBody p={8}>
                            <Heading size="sm" color="green.800" mb={6}>Dados de Repasse (Conta para Recebimento)</Heading>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="bold" color="green.700">Tipo de Chave PIX</FormLabel>
                                    <Select value={financeiro.tipo_chave_pix} onChange={e => setFinanceiro({...financeiro, tipo_chave_pix: e.target.value})} bg="white">
                                        <option value="">Selecione...</option>
                                        <option value="CPF">CPF / CNPJ</option>
                                        <option value="CELULAR">Telefone</option>
                                        <option value="EMAIL">E-mail</option>
                                        <option value="ALEATORIA">Chave Aleatória</option>
                                    </Select>
                                </FormControl>
                                <FormControl>
                                    <FormLabel fontSize="sm" fontWeight="bold" color="green.700">Chave PIX</FormLabel>
                                    <Input value={financeiro.chave_pix} onChange={e => setFinanceiro({...financeiro, chave_pix: e.target.value})} bg="white" />
                                </FormControl>
                            </SimpleGrid>
                            
                            <Divider borderColor="green.300" my={6} />
                            <Text fontSize="sm" fontWeight="bold" color="green.700" mb={4}>Ou Conta Bancária Tradicional</Text>
                            
                            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                                <FormControl>
                                    <FormLabel fontSize="xs" fontWeight="bold" color="gray.600">Banco</FormLabel>
                                    <Input value={financeiro.banco} onChange={e => setFinanceiro({...financeiro, banco: e.target.value})} bg="white" placeholder="Ex: Nubank, Itaú..." />
                                </FormControl>
                                <FormControl>
                                    <FormLabel fontSize="xs" fontWeight="bold" color="gray.600">Agência</FormLabel>
                                    <Input value={financeiro.agencia} onChange={e => setFinanceiro({...financeiro, agencia: e.target.value})} bg="white" />
                                </FormControl>
                                <FormControl>
                                    <FormLabel fontSize="xs" fontWeight="bold" color="gray.600">Conta com Dígito</FormLabel>
                                    <Input value={financeiro.conta} onChange={e => setFinanceiro({...financeiro, conta: e.target.value})} bg="white" />
                                </FormControl>
                            </SimpleGrid>
                        </CardBody>
                    </Card>
                )}

                {/* SESSÃO EXCLUSIVA DO PROFESSOR: CURRÍCULO E MINIBIO */}
                {isCorretor && (
                    <Box>
                        {/* MINIBIO */}
                        <Card bg="white" shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.200" mb={6}>
                            <CardBody p={8}>
                                <Heading size="sm" color="gray.700" mb={4}>Resumo Profissional (Minibio)</Heading>
                                <Textarea 
                                    rows={4} bg="gray.50" 
                                    placeholder="Escreva um breve resumo da sua carreira, áreas de especialidade e abordagem pedagógica." 
                                    value={dados.minibio} onChange={e => setDados({...dados, minibio: e.target.value})} 
                                />
                            </CardBody>
                        </Card>

                        {/* EXPERIÊNCIAS */}
                        <Card bg="white" shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.200" mb={6}>
                            <CardBody p={8}>
                                <Flex justify="space-between" align="center" mb={6}>
                                    <Heading size="sm" color="gray.700">Experiência Profissional</Heading>
                                    <Button size="sm" colorScheme="blue" variant="ghost" leftIcon={<AddIcon />} onClick={addExperiencia}>Adicionar Nova</Button>
                                </Flex>
                                
                                <VStack spacing={4} align="stretch">
                                    {experiencias.map((exp, index) => (
                                        <Flex key={index} gap={4} align="flex-end" p={4} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200" wrap={{ base: 'wrap', md: 'nowrap' }}>
                                            <FormControl>
                                                <FormLabel fontSize="xs" color="gray.500" fontWeight="bold">Cargo / Função</FormLabel>
                                                <Input bg="white" size="sm" value={exp.cargo} onChange={e => updateExperiencia(index, 'cargo', e.target.value)} />
                                            </FormControl>
                                            <FormControl>
                                                <FormLabel fontSize="xs" color="gray.500" fontWeight="bold">Empresa / Escola</FormLabel>
                                                <Input bg="white" size="sm" value={exp.empresa || exp.local} onChange={e => updateExperiencia(index, 'empresa', e.target.value)} />
                                            </FormControl>
                                            <FormControl maxW={{ md: "150px" }}>
                                                <FormLabel fontSize="xs" color="gray.500" fontWeight="bold">Período</FormLabel>
                                                <Input bg="white" size="sm" placeholder="Ex: 2020 - Atual" value={exp.periodo} onChange={e => updateExperiencia(index, 'periodo', e.target.value)} />
                                            </FormControl>
                                            <IconButton icon={<DeleteIcon />} colorScheme="red" variant="outline" size="sm" onClick={() => removeExperiencia(index)} aria-label="Remover" />
                                        </Flex>
                                    ))}
                                    {experiencias.length === 0 && <Text color="gray.400" fontSize="sm" fontStyle="italic">Nenhuma experiência cadastrada.</Text>}
                                </VStack>
                            </CardBody>
                        </Card>

                        {/* FORMAÇÕES */}
                        <Card bg="white" shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.200">
                            <CardBody p={8}>
                                <Flex justify="space-between" align="center" mb={6}>
                                    <Heading size="sm" color="gray.700">Formação Acadêmica</Heading>
                                    <Button size="sm" colorScheme="blue" variant="ghost" leftIcon={<AddIcon />} onClick={addFormacao}>Adicionar Nova</Button>
                                </Flex>
                                
                                <VStack spacing={4} align="stretch">
                                    {formacoes.map((form, index) => (
                                        <Flex key={index} gap={4} align="flex-end" p={4} bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200" wrap={{ base: 'wrap', md: 'nowrap' }}>
                                            <FormControl>
                                                <FormLabel fontSize="xs" color="gray.500" fontWeight="bold">Curso / Titulação</FormLabel>
                                                <Input bg="white" size="sm" value={form.curso} onChange={e => updateFormacao(index, 'curso', e.target.value)} />
                                            </FormControl>
                                            <FormControl>
                                                <FormLabel fontSize="xs" color="gray.500" fontWeight="bold">Instituição</FormLabel>
                                                <Input bg="white" size="sm" value={form.instituicao} onChange={e => updateFormacao(index, 'instituicao', e.target.value)} />
                                            </FormControl>
                                            <FormControl maxW={{ md: "120px" }}>
                                                <FormLabel fontSize="xs" color="gray.500" fontWeight="bold">Ano Conc.</FormLabel>
                                                <Input bg="white" size="sm" type="number" value={form.ano} onChange={e => updateFormacao(index, 'ano', e.target.value)} />
                                            </FormControl>
                                            <IconButton icon={<DeleteIcon />} colorScheme="red" variant="outline" size="sm" onClick={() => removeFormacao(index)} aria-label="Remover" />
                                        </Flex>
                                    ))}
                                    {formacoes.length === 0 && <Text color="gray.400" fontSize="sm" fontStyle="italic">Nenhuma formação cadastrada.</Text>}
                                </VStack>
                            </CardBody>
                        </Card>
                    </Box>
                )}

            </VStack>
        </SimpleGrid>
      </VStack>
    </Container>
  );
}

export default MeuPerfil;