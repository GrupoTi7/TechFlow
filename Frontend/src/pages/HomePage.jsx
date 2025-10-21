// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api';
// 1. Importe os componentes de layout e ícones do Mantine
import { Grid, Card, Text, Group, ThemeIcon, useMantineTheme } from '@mantine/core';
import { 
  IconDeviceDesktop, 
  IconAlertTriangle, 
  IconClock, 
  IconCircleCheck 
} from '@tabler/icons-react';

function HomePage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // ... (a sua lógica de fetch continua igual)
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        if (data.success) {
          setStats(data.stats);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return <div>A carregar estatísticas do dashboard...</div>;
  }
  if (error) {
    return <div style={{ color: 'red' }}>Erro: {error}</div>;
  }

  return (
    <div>
      {/* 2. Layout do Dashboard com os novos cartões */}
      {stats ? (
        <Grid>
          {/* Cartão 1: Total de Ativos (Azul Royal) */}
          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
            <StatCard 
              title="Total de Ativos" 
              value={stats.totalDevices} 
              description="Total de equipamentos sincronizados."
              icon={<IconDeviceDesktop />} 
              color="blue" 
            />
          </Grid.Col>
          
          {/* Cartão 2: Em Conformidade (Verde) */}
          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
            <StatCard 
              title="Em Conformidade" 
              value={stats.totalDevices - stats.overdueCount - stats.upcomingCount} 
              description="Ativos com a preventiva planejada."
              icon={<IconCircleCheck />} 
              color="green" 
            />
          </Grid.Col>

          {/* Cartão 3: Atenção (Amarelo) */}
          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
            <StatCard 
              title="Atenção (30 dias)" 
              value={stats.upcomingCount} 
              description="Manutenção vencendo nos próximos 30 dias."
              icon={<IconClock />} 
              color="yellow" 
            />
          </Grid.Col>

          {/* Cartão 4: Alerta Crítico (Vermelho) */}
          <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
            <StatCard 
              title="Alerta Crítico" 
              value={stats.overdueCount} 
              description="Manutenção preventiva vencida. Ação imediata!"
              icon={<IconAlertTriangle />} 
              color="red" 
            />
          </Grid.Col>
        </Grid>
      ) : (
        <p>Não foi possível carregar as estatísticas.</p>
      )}
    </div>
  );
}

// 3. Componente auxiliar para os cartões (MUITO parecido com o seu alvo)
// O <Card> do Mantine já tem o efeito "hover" subtil que você pediu
function StatCard({ title, value, description, icon, color }) {
  const theme = useMantineTheme();
  const isDark = theme.colorScheme === 'dark';

  return (
    <Card withBorder radius="md" p="lg" shadow="sm">
      <Group justify="space-between">
        <Text size="md" c="dimmed" fw={700} tt="uppercase">
          {title}
        </Text>
        <ThemeIcon
          color={color}
          // No modo claro, o fundo é colorido; no escuro, o ícone é colorido
          variant={isDark ? 'light' : 'filled'}
          size="xl"
          radius="md"
        >
          {icon}
        </ThemeIcon>
      </Group>
      <Text size="3rem" fw={900} c={isDark ? theme.colors[color][5] : theme.colors[color][7]}>
        {value}
      </Text>
      <Text size="sm" c="dimmed" mt="sm">
        {description}
      </Text>
    </Card>
  );
}

export default HomePage;