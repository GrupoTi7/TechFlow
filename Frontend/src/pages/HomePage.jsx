// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api'; // A nossa API agora retorna tudo
import { useNavigate } from 'react-router-dom';
import { Grid, Card, Text, Group, ThemeIcon, useMantineTheme } from '@mantine/core';
// Importe os DOIS tipos de gráfico
import { BarChart, DonutChart } from '@mantine/charts';
import { 
  IconDeviceDesktop, 
  IconAlertTriangle, 
  IconClock, 
  IconCircleCheck,
  IconHistory,
  IconBuildingStore
} from '@tabler/icons-react';

function HomePage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Hook para navegação

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats(); // Apenas uma chamada de API
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

  // Função para navegar para a lista de dispositivos com um filtro de status
  const handleCardClick = (statusFilter) => {
    navigate('/devices', { state: { initialStatusFilter: statusFilter } });
  };

  if (isLoading) return <div>A carregar estatísticas do dashboard...</div>;
  if (error) return <div style={{ color: 'red' }}>Erro: {error}</div>;
  if (!stats) return <p>Não foi possível carregar as estatísticas.</p>;

  // Calcula o cartão "Em Conformidade"
  const inComplianceCount = stats.totalDevices - stats.overdueCount - stats.upcomingCount;

  // Calcula o total para o gráfico de pizza (para evitar o bug 'NaN')
  const analyzedTotal = stats.ownedCount + stats.rentedCount;

  return (
    <div>
      <Text size="xl" fw={700} mb="lg">Dashboard de Preventivas</Text>
      
      {/* --- 1. GRELHA DOS 4 CARTÕES ORIGINAIS --- */}
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
            onClick={() => handleCardClick('upcoming')} // <-- Clicável
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <StatCard 
            title="Alerta Crítico" 
            value={stats.overdueCount} 
            description="Manutenção preventiva vencida."
            icon={<IconAlertTriangle />} 
            color="red" 
            onClick={() => handleCardClick('overdue')} // <-- Clicável
          />
        </Grid.Col>
      </Grid>
      
      {/* --- 2. GRELHA DOS 2 GRÁFICOS NOVOS --- */}
      <Grid mt="xl">
        {/* Gráfico 1: Preventivas Realizadas (Gráfico de Barras) */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Card withBorder radius="md" p="lg" shadow="sm" h="100%">
            <Group>
              <ThemeIcon variant="light" size="xl" radius="md"><IconHistory /></ThemeIcon>
              <Text size="lg" fw={700}>Preventivas Realizadas (Últimos 90 dias)</Text>
            </Group>
            <BarChart
              h={300}
              data={stats.preventiveChartData}
              dataKey="name"
              series={[{ name: 'value', color: 'blue.6' }]}
              tickLine="y"
              // Tooltip (legenda) que não sobrepõe o gráfico
              tooltipProps={{
                content: ({ label, payload }) => 
                  <Card withBorder p="sm" radius="sm">
                    <Text size="sm">{label}</Text>
                    {payload && payload.length > 0 &&
                      <Text size="sm" fw={700}>{payload[0].value} manutenções</Text>
                    }
                  </Card>
              }}
            />
          </Card>
        </Grid.Col>
        
        {/* Gráfico 2: Dispositivos por Nomenclatura (Gráfico de Pizza) */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Card withBorder radius="md" p="lg" shadow="sm" h="100%">
            <Group>
              <ThemeIcon variant="light" size="xl" radius="md"><IconBuildingStore /></ThemeIcon>
              <Text size="lg" fw={700}>Dispositivos por Nomenclatura</Text>
            </Group>
            <DonutChart
              h={300}
              data={stats.ownershipChartData}
              // --- CORREÇÃO: Tooltip (legenda) que não sobrepõe o gráfico ---
              tooltipProps={{
                content: ({ label, payload }) => 
                  <Card withBorder p="sm" radius="sm">
                    {payload && payload.length > 0 &&
                      <>
                        <Text size="sm">{payload[0].name}</Text>
                        <Text size="sm" fw={700}>{payload[0].value}</Text>
                      </>
                    }
                  </Card>
              }}
              // --- CORREÇÃO: "NaN analisados" ---
              chartLabel={`${analyzedTotal} analisados`}
              withLabelsLine
              withLabels
            />
          </Card>
        </Grid.Col>
      </Grid>
    </div>
  );
}

// O componente StatCard (com lógica de 'hover' melhorada)
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
        <Text size="md" c="dimmed" fw={700} tt="uppercase">
          {title}
        </Text>
        <ThemeIcon color={color} variant={isDark ? 'light' : 'filled'} size="xl" radius="md">
          {icon}
        </ThemeIcon>
      </Group>
      <Text size="4rem" fw={900} c={isDark ? theme.colors[color][5] : theme.colors[color][7]}>
        {value}
      </Text>
      <Text size="md" c="dimmed" mt="sm">
        {description}
      </Text>
    </Card>
  );
}

export default HomePage;