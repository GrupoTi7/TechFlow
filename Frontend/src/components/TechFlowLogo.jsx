// src/components/TechFlowLogo.jsx
import React from 'react';
import { Group, Title, Text, useMantineTheme } from '@mantine/core';
import { IconAtom2 } from '@tabler/icons-react'; // Importamos o IconAtom2

function TechFlowLogo() {
  const theme = useMantineTheme(); // Para acessar as cores do tema

  return (
    <Group justify="center" gap="xs" mb="xl">
      <IconAtom2 
        size="2.5rem" 
        stroke={1.5} 
        // Aplicamos a classe CSS global aqui
        className="techflow-logo-glowing"
        // Se quiser uma cor específica, pode sobrescrever:
        // color={theme.colors.techFlowBlue[3]} 
        style={{ 
            transform: 'rotate(15deg)',
            // Garante que a cor do ícone seja o azul do tema, se a classe não pegar
            color: theme.colors.techFlowBlue[3] 
        }} 
      /> 
      <Title order={1} style={{ fontSize: '2.5rem', lineHeight: 1 }}>
        TechFlow
      </Title>
    </Group>
  );
}

export default TechFlowLogo;