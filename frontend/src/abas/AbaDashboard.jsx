import React, { useState } from 'react';
import { SimpleGrid, Card, Flex, Box, Heading, Text, Select, Grid, GridItem, Stat, StatLabel, StatNumber, CardBody, Icon, Button, HStack } from '@chakra-ui/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { InfoIcon } from '@chakra-ui/icons';

// Dicas atualizadas para englobar os novos nomes de Competências Premium
const DICAS_INTELIGENTES = {
    // ENEM
    'C1 (Gramática)': 'Atenção à norma culta! Revise as regras de pontuação (especialmente vírgulas), crase e concordância.',
    'C2 (Tema)': 'Cuidado com o tangenciamento! Certifique-se de abordar todas as palavras-chave do tema na introdução.',
    'C3 (Argumentos)': 'Fortaleça sua argumentação! Evite apenas expor fatos; você precisa explicá-los.',
    'C4 (Coesão)': 'Melhore a ligação do seu texto! Use conectivos variados não apenas no início dos parágrafos, mas também dentro deles.',
    'C5 (Proposta)': 'Sua proposta de intervenção precisa estar mais completa. Detalhe: Quem fará? O que será feito? Como? Para quê?',
    
    // PADRÃO CONCURSOS (Simples, 100 e 10)
    'C1 (Norma Culta)': 'Atenção à norma culta! Revise as regras de ortografia, pontuação, crase e concordância.',
    'C2 (Tema/Estrutura)': 'Foque em estruturar bem o seu texto (introdução, desenvolvimento e conclusão) e não fuja das palavras-chave do tema.',
    'C3 (Argumentação)': 'Seus argumentos precisam ser mais sólidos. Tente desenvolver melhor suas ideias, trazendo fatos, causas e consequências.',
    'C4 (Coesão Textual)': 'Fique atento à ligação entre suas frases e parágrafos para que o texto tenha uma leitura fluida e lógica.'
};

const AbaDashboard = ({ redacoes }) => {
    // Agora o Default começa na visão mais premium da plataforma (se quiser pode trocar para ENEM)
    const [filtroGraficoTipo, setFiltroGraficoTipo] = useState('ENEM');
    const [filtroPeriodo, setFiltroPeriodo] = useState('30D');

    const redacoesCorrigidas = redacoes.filter(r => r.status === 'CORRIGIDA' && r.nota_final != null);
    
    const redacoesGrafico = redacoesCorrigidas.filter(r => {
        const tipoOriginal = (r.tema_tipo || r.tipo || 'ENEM').toUpperCase();
        // Agrupa "SIMPLES" e "PADRAO_100" no mesmo guarda-chuva lógico para os gráficos, pois a escala é a mesma.
        const tipoVisual = tipoOriginal === 'SIMPLES' ? 'PADRAO_100' : tipoOriginal;
        
        const matchTipo = tipoVisual === filtroGraficoTipo;
        
        let matchTempo = true;
        if (filtroPeriodo !== 'TUDO') {
            const dataRed = new Date(r.data_envio);
            const dataLimite = new Date();
            if (filtroPeriodo === '30D') dataLimite.setDate(dataLimite.getDate() - 30);
            else if (filtroPeriodo === '6M') dataLimite.setMonth(dataLimite.getMonth() - 6);
            else if (filtroPeriodo === '1A') dataLimite.setFullYear(dataLimite.getFullYear() - 1);
            matchTempo = dataRed >= dataLimite;
        }
        
        return matchTipo && matchTempo;
    });

    // Matemática Segura para Decimais
    const somaNotas = redacoesGrafico.reduce((acc, r) => acc + parseFloat(r.nota_final), 0);
    const mediaGeralRaw = redacoesGrafico.length > 0 ? (somaNotas / redacoesGrafico.length) : 0;
    
    // Arredondamentos e Formatações dependendo do padrão
    const isDecimal = filtroGraficoTipo === 'PADRAO_10';
    const mediaGeral = isDecimal ? mediaGeralRaw.toFixed(1) : Math.round(mediaGeralRaw);
    const maiorNotaAlcancadaRaw = redacoesGrafico.length > 0 ? Math.max(...redacoesGrafico.map(r => parseFloat(r.nota_final))) : 0;
    const maiorNotaAlcancada = isDecimal ? maiorNotaAlcancadaRaw.toFixed(1) : Math.round(maiorNotaAlcancadaRaw);
    
    const totalCorrigidas = redacoesGrafico.length;

    const historicoNotas = redacoesGrafico.slice().sort((a, b) => new Date(a.data_envio) - new Date(b.data_envio)).map((r, index) => ({ 
        name: `R${index + 1}`, 
        tema: r.tema_titulo, 
        nota: parseFloat(r.nota_final || 0) 
    }));

    // Definição da Estrutura do Radar
    let radarData = [];
    if (filtroGraficoTipo === 'ENEM') {
        radarData = [ 
            { name: 'C1 (Gramática)', media: 0, fullMark: 200 }, 
            { name: 'C2 (Tema)', media: 0, fullMark: 200 }, 
            { name: 'C3 (Argumentos)', media: 0, fullMark: 200 }, 
            { name: 'C4 (Coesão)', media: 0, fullMark: 200 }, 
            { name: 'C5 (Proposta)', media: 0, fullMark: 200 } 
        ];
    } else if (filtroGraficoTipo === 'PADRAO_100') {
        radarData = [ 
            { name: 'C1 (Norma Culta)', media: 0, fullMark: 25 }, 
            { name: 'C2 (Tema/Estrutura)', media: 0, fullMark: 25 }, 
            { name: 'C3 (Argumentação)', media: 0, fullMark: 25 }, 
            { name: 'C4 (Coesão Textual)', media: 0, fullMark: 25 } 
        ];
    } else if (filtroGraficoTipo === 'PADRAO_10') {
        radarData = [ 
            { name: 'C1 (Norma Culta)', media: 0, fullMark: 2.5 }, 
            { name: 'C2 (Tema/Estrutura)', media: 0, fullMark: 2.5 }, 
            { name: 'C3 (Argumentação)', media: 0, fullMark: 2.5 }, 
            { name: 'C4 (Coesão Textual)', media: 0, fullMark: 2.5 } 
        ];
    }
    
    let piorCompetencia = null;

    if (redacoesGrafico.length > 0) {
        let numComps = filtroGraficoTipo === 'ENEM' ? 5 : 4;
        let totals = Array(numComps).fill(0);
        let counts = Array(numComps).fill(0);

        redacoesGrafico.forEach(r => {
            if (r.correcao && r.correcao.competencias) {
                r.correcao.competencias.forEach(c => { 
                    if(c.comp >= 1 && c.comp <= numComps) { 
                        totals[c.comp - 1] += parseFloat(c.nota); 
                        counts[c.comp - 1] += 1; 
                    } 
                });
            }
        });
        
        radarData = radarData.map((item, idx) => {
            const mediaRaw = counts[idx] > 0 ? (totals[idx] / counts[idx]) : 0;
            const mediaFormatada = isDecimal ? parseFloat(mediaRaw.toFixed(1)) : Math.round(mediaRaw);
            return { ...item, media: mediaFormatada };
        });
        
        let minRatio = Infinity;
        radarData.forEach(comp => { 
            if (comp.media > 0) { 
                const ratio = comp.media / comp.fullMark; 
                if (ratio < minRatio) { minRatio = ratio; piorCompetencia = comp; } 
            } 
        });
    }

    return (
        <Box>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
                <Card p={5} shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.100" borderTop="4px solid" borderTopColor="teal.400">
                    <Stat>
                        <StatLabel color="gray.500" fontSize="xs" textTransform="uppercase" fontWeight="bold">Média Geral</StatLabel>
                        <StatNumber fontSize="3xl" color="teal.600" fontWeight="900">{mediaGeral} <Text as="span" fontSize="lg" color="gray.400">/ {filtroGraficoTipo === 'PADRAO_10' ? '10' : (filtroGraficoTipo === 'PADRAO_100' ? '100' : '1000')}</Text></StatNumber>
                    </Stat>
                </Card>
                <Card p={5} shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.100" borderTop="4px solid" borderTopColor="yellow.400">
                    <Stat>
                        <StatLabel color="gray.500" fontSize="xs" textTransform="uppercase" fontWeight="bold">Maior Nota Alcançada</StatLabel>
                        <StatNumber fontSize="3xl" color="yellow.600" fontWeight="900">{maiorNotaAlcancada}</StatNumber>
                    </Stat>
                </Card>
                <Card p={5} shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.100" borderTop="4px solid" borderTopColor="blue.400">
                    <Stat>
                        <StatLabel color="gray.500" fontSize="xs" textTransform="uppercase" fontWeight="bold">Redações Analisadas</StatLabel>
                        <StatNumber fontSize="3xl" color="blue.600" fontWeight="900">{totalCorrigidas}</StatNumber>
                    </Stat>
                </Card>
            </SimpleGrid>

            <Grid templateColumns={{ base: "repeat(1, 1fr)", xl: "repeat(3, 1fr)" }} gap={6} mb={8}>
                <GridItem colSpan={{ base: 1, xl: 2 }}>
                    <Card p={5} shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.200" bg="white" h="100%">
                        <Flex justify="space-between" align="flex-start" mb={2} wrap="wrap" gap={3}>
                            <Box><Heading size="sm" color="gray.700" textTransform="uppercase" letterSpacing="wide">Evolução das Notas</Heading><Text fontSize="xs" color="gray.400" mt={1}>* R1, R2... indicam a ordem de envio.</Text></Box>
                            <HStack spacing={2} wrap="wrap">
                                <HStack spacing={1} bg="gray.100" p={1} borderRadius="md">
                                    <Button size="xs" variant={filtroPeriodo === '30D' ? 'solid' : 'ghost'} colorScheme="teal" onClick={() => setFiltroPeriodo('30D')}>30 Dias</Button>
                                    <Button size="xs" variant={filtroPeriodo === '6M' ? 'solid' : 'ghost'} colorScheme="teal" onClick={() => setFiltroPeriodo('6M')}>6 Meses</Button>
                                    <Button size="xs" variant={filtroPeriodo === '1A' ? 'solid' : 'ghost'} colorScheme="teal" onClick={() => setFiltroPeriodo('1A')}>1 Ano</Button>
                                    <Button size="xs" variant={filtroPeriodo === 'TUDO' ? 'solid' : 'ghost'} colorScheme="teal" onClick={() => setFiltroPeriodo('TUDO')}>Tudo</Button>
                                </HStack>
                                <Box bg="gray.50" p={1} borderRadius="md" border="1px solid" borderColor="gray.200">
                                    <Select size="sm" variant="unstyled" px={2} fontWeight="bold" color="teal.700" value={filtroGraficoTipo} onChange={(e) => setFiltroGraficoTipo(e.target.value)}>
                                        <option value="ENEM">Modelo ENEM (1000)</option>
                                        <option value="PADRAO_100">Modelo Bancas (100)</option>
                                        <option value="PADRAO_10">Modelo Bancas (10)</option>
                                    </Select>
                                </Box>
                            </HStack>
                        </Flex>
                        {historicoNotas.length > 0 ? (
                            <Box h="250px" w="100%" mt={4}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={historicoNotas} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                                        <defs><linearGradient id="colorNota" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#319795" stopOpacity={0.4}/><stop offset="95%" stopColor="#319795" stopOpacity={0}/></linearGradient></defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDF2F7"/>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#718096'}} dy={10} />
                                        <YAxis domain={[0, filtroGraficoTipo === 'ENEM' ? 1000 : (filtroGraficoTipo === 'PADRAO_10' ? 10 : 100)]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#718096'}} />
                                        <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} labelStyle={{ fontWeight: 'bold', color: '#2D3748', marginBottom: '4px' }} formatter={(value) => [`${value} pts`, 'Nota Final']} labelFormatter={(label) => { const reda = historicoNotas.find(r => r.name === label); return reda ? reda.tema : label; }} />
                                        <Area type="monotone" dataKey="nota" stroke="#319795" strokeWidth={4} fillOpacity={1} fill="url(#colorNota)" activeDot={{r: 7, strokeWidth: 0, fill: '#319795'}} animationDuration={1500} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </Box>
                        ) : (<Flex h="250px" align="center" justify="center" bg="gray.50" borderRadius="lg" border="1px dashed" borderColor="gray.300"><Text color="gray.400" fontSize="sm">Nenhuma redação no período.</Text></Flex>)}
                    </Card>
                </GridItem>

                <GridItem colSpan={1}>
                    <Card p={5} shadow="sm" borderRadius="xl" border="1px solid" borderColor="gray.200" bg="white" h="100%">
                        <Heading size="sm" mb={2} color="gray.700" textTransform="uppercase" letterSpacing="wide">Desempenho da Escrita</Heading>
                        {redacoesGrafico.length > 0 ? (
                            <Box h="265px" w="100%">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                                        <PolarGrid stroke="#E2E8F0" />
                                        <PolarAngleAxis dataKey="name" tick={{fontSize: 10, fill: '#4A5568', fontWeight: 'bold'}} />
                                        <PolarRadiusAxis angle={30} domain={[0, filtroGraficoTipo === 'ENEM' ? 200 : (filtroGraficoTipo === 'PADRAO_10' ? 2.5 : 25)]} tick={false} axisLine={false} />
                                        <Radar name="Média" dataKey="media" stroke="#805AD5" strokeWidth={2} fill="#B794F4" fillOpacity={0.6} animationDuration={1500} />
                                        <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value) => [`${value} pts`, 'Sua Média']} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </Box>
                        ) : (<Flex h="250px" align="center" justify="center" bg="gray.50" borderRadius="lg" border="1px dashed" borderColor="gray.300"><Text color="gray.400" fontSize="sm">Nenhum dado para analisar.</Text></Flex>)}
                    </Card>
                </GridItem>
                
                {piorCompetencia && (
                    <GridItem colSpan={{ base: 1, xl: 3 }}>
                        <Card bg="blue.50" shadow="sm" borderRadius="xl" border="1px solid" borderColor="blue.100">
                            <CardBody display="flex" flexDirection={{ base: "column", md: "row" }} alignItems="center" gap={6}>
                                <Flex bg="blue.500" w="60px" h="60px" borderRadius="full" align="center" justify="center" flexShrink={0}><Icon as={InfoIcon} color="white" boxSize={6} /></Flex>
                                <Box flex="1">
                                    <Heading size="sm" color="blue.800" mb={1} textTransform="uppercase">Dica Estratégica: Onde Focar</Heading>
                                    <Text color="blue.900" fontSize="md">Notamos que sua média em <strong>{piorCompetencia.name}</strong> está em {piorCompetencia.media} pontos. <br /><em>💡 {DICAS_INTELIGENTES[piorCompetencia.name] || 'Procure rever os conceitos desta competência nas suas próximas produções.'}</em></Text>
                                </Box>
                            </CardBody>
                        </Card>
                    </GridItem>
                )}
            </Grid>
        </Box>
    );
};

export default AbaDashboard;