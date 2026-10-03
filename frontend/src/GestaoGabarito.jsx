import React from 'react';
import { Container } from '@chakra-ui/react';
import AbaGestaoGabaritoPins from './abas/AbaGestaoGabaritoPins';

const GestaoGabarito = () => {
  return (
    <Container maxW="full" py={8} px={{ base: 4, md: 8 }} bg="gray.50" minH="100vh">
      <AbaGestaoGabaritoPins />
    </Container>
  );
};

export default GestaoGabarito;