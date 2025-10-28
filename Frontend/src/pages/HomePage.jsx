// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Grid, Card, Text, Group, ThemeIcon, useMantineTheme, Stack } from '@mantine/core';
import { BarChart } from '@mantine/charts';
import {
  IconDeviceDesktop,
  IconAlertTriangle,
  IconClock,
  IconCircleCheck,
  IconHistory,
  IconBuildingStore,
  IconBuildingFactory
} from '@tabler/icons-react';

function HomePage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
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

  const handleCardClick = (statusFilter) => {
    navigate('/devices', { state: { initialStatusFilter: statusFilter } });
  };

  // --- A CORREÇÃO ESTÁ AQUI ---
  const handleNomenclatureClick = (nomenclatureFilter) => {
    console.log(`Navegando com filtro de nomenclatura: ${nomenclatureFilter}`);
    // Corrigimos o nome da variável para corresponder ao parâmetro
    // A chave é 'initialNomenclatureFilter', o valor é a variável 'nomenclatureFilter'
    navigate('/devices', { state: { initialNomenclatureFilter: nomenclatureFilter } });
  };
  // --- FIM DA CORREÇÃO ---

  if (isLoading) return <div>A carregar estatísticas do dashboard...</div>;
  if (error) return <div style={{ color: 'red' }}>Erro ao carregar dashboard: {error}</div>;
  if (!stats) return <p>Não foi possível carregar as estatísticas.</p>;

  const inComplianceCount = (stats.totalDevices || 0) - (stats.overdueCount || 0) - (stats.upcomingCount || 0);

  return (
    <div>
      <Text size="xl" fw={700} mb="lg">Dashboard de Preventivas</Text>

      {/* Grelha dos 4 Cartões Originais */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <StatCard
            title="Total de Ativos"
            value={stats.totalDevices}
            description="Total de equipamentos sincronizados."
            icon={<IconDeviceDesktop />}
            color="blue"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <StatCard
            title="Em Conformidade"
            value={inComplianceCount}
            description="Ativos com a preventiva planejada."
            icon={<IconCircleCheck />}
            color="green"
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <StatCard
            title="Atenção (30 dias)"
            value={stats.upcomingCount}
            description="Vencendo nos próximos 30 dias."
            icon={<IconClock />}
            color="yellow"
            onClick={() => handleCardClick('upcoming')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <StatCard
            title="Alerta Crítico"
            value={stats.overdueCount}
            description="Manutenção preventiva vencida."
            icon={<IconAlertTriangle />}
            color="red"
            onClick={() => handleCardClick('overdue')}
          />
        </Grid.Col>
      </Grid>

      {/* Grelha dos Novos Elementos */}
      <Grid mt="xl">
        {/* Gráfico de Barras */}
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Card withBorder radius="md" p="lg" shadow="sm" h="100%" style={{ minHeight: 360 }}>
            <Group>
              <ThemeIcon variant="light" size="xl" radius="md"><IconHistory /></ThemeIcon>
              <Text size="lg" fw={700}>Preventivas Realizadas (Últimos 90 dias)</Text>
            </Group>
            {stats.preventiveChartData && (
              <BarChart
                h={300}
                data={stats.preventiveChartData}
                dataKey="name"
                series={[{ name: 'value', color: 'blue.6' }]}
                tickLine="y"
                tooltipProps={{
                  wrapperStyle: { background: 'transparent', border: '0', padding: '0' },
                  content: ({ label, payload }) =>
                    <Card p="sm" radius="sm" shadow="md" withBorder={false}>
                      <Text size="sm">{label}</Text>
                      {payload && payload.length > 0 &&
                        <Text size="sm" fw={700}>{payload[0].value} manutenções</Text>
                      }
                    </Card>
                }}
              />
            )}
          </Card>
        </Grid.Col>

        {/* Novos Cartões (Comprados/Alugados) */}
        <Grid.Col span={{ base: 12, lg: 5 }}>
           <Stack gap="xl">
             <StatCard
               title="Dispositivos Comprados"
               value={stats.ownedCount}
               description="Prefixos PTR e TRC."
               icon={<IconBuildingStore />}
               color="blue"
               onClick={() => handleNomenclatureClick('owned')} // <-- Agora chama a função correta
             />
             <StatCard
               title="Dispositivos Alugados"
               value={stats.rentedCount}
               description="Prefixos NETSITE e VIVO."
               icon={<IconBuildingFactory />}
               color="gray"
               onClick={() => handleNomenclatureClick('rented')} // <-- Agora chama a função correta
             />
           </Stack>
        </Grid.Col>
      </Grid>
    </div>
  );
}

// O componente StatCard
function StatCard({ title, value, description, icon, color, onClick }) {
  const theme = useMantineTheme();
  const isDark = theme.colorScheme === 'dark';

  return (
    <Card
      withBorder
      radius="md"
      p="lg"
      shadow="sm"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        if(onClick) e.currentTarget.style.transform = 'translateY(-3px)';
        if(onClick) e.currentTarget.style.boxShadow = theme.shadows.md;
      }}
      onMouseLeave={(e) => {
        if(onClick) e.currentTarget.style.transform = 'translateY(0)';
        if(onClick) e.currentTarget.style.boxShadow = theme.shadows.sm;
      }}
    >
      <Group justify="space-between">
        <Text size="sm" c="dimmed" fw={700} tt="uppercase">
          {title}
        </Text>
        <ThemeIcon color={color} variant={isDark ? 'light' : 'filled'} size="lg" radius="md">
          {icon}
        </ThemeIcon>
      </Group>
      <Text size="2.5rem" fw={900} c={isDark ? theme.colors[color][5] : theme.colors[color][7]}>
        {value}
      </Text>
      <Text size="sm" c="dimmed" mt="xs">
        {description}
      </Text>
    </Card>
  );
}

export default HomePage;
