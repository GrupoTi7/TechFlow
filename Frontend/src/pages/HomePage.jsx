import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api.js';
import { useNavigate } from 'react-router-dom';
import { Grid, Card, Text, Group, ThemeIcon, useMantineTheme, Stack } from '@mantine/core';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title as ChartTitle, Tooltip, Legend } from 'chart.js';

import { 
  IconDeviceDesktop, IconAlertTriangle, IconClock, IconCircleCheck, 
  IconHistory, IconBuildingStore, IconBuildingFactory, IconCalendarOff 
} from '@tabler/icons-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTitle, Tooltip, Legend);

function HomePage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const theme = useMantineTheme();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats(); 
        if (data.success) setStats(data.stats); 
        else setError(data.message);
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
  
  const handleNomenclatureClick = (nomenclatureFilter) => {
    navigate('/devices', { state: { initialNomenclatureFilter: nomenclatureFilter } });
  };

  if (isLoading) return <div>Carregando dashboard...</div>;
  if (error) return <div style={{ color: 'red' }}>Erro: {error}</div>;
  if (!stats) return <p>Sem dados.</p>;

  // --- LÓGICA CORRIGIDA (Assumindo que a API não mudou) ---
  const total = stats.totalDevices || 0;
  const overdue = stats.overdueCount || 0;
  const upcoming = stats.upcomingCount || 0;

  // IMPORTANTE: A API atual (getDashboardStats) não retorna 'inCompliance' nem 'noSchedule'.
  // Precisamos estimar ou mudar a API.
  // Como você não quer mudar o backend agora, vamos fazer uma estimativa segura:
  
  // Se você ainda não categorizou a maioria, assumimos que o restante é "A Configurar".
  // Quando você categorizar, eles ganharão data e entrarão nas outras categorias.
  // Para ser preciso, o ideal seria atualizar o backend, mas visualmente podemos fazer assim:
  
  // Lógica Temporária (Até atualizar a API):
  // Consideramos "A Configurar" tudo o que não é Vencido nem Próximo.
  // (Isso inclui os "Em Dia" reais, mas como você disse que ainda não configurou, é mais seguro).
  const configPendente = total - overdue - upcoming;
  const emDia = 0; // Quando a API suportar, mudamos isso.

  const barChartData = {
    labels: stats.preventiveChartData.map(d => d.name),
    datasets: [{
      label: 'Preventivas',
      data: stats.preventiveChartData.map(d => d.value),
      backgroundColor: 'rgba(0, 65, 194, 0.7)', // Azul TechFlow
      borderColor: '#0041C2',
      borderWidth: 1,
    }],
  };

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        backgroundColor: '#fff', titleColor: '#333', bodyColor: '#111',
        borderColor: '#e0e0e0', borderWidth: 1, padding: 10
      },
      legend: { display: false }
    }
  };

  return (
    <div>
      <Text size="xl" fw={700} mb="lg" c="dark.4">Dashboard de Preventivas</Text>
      
      <Grid>
        {/* Total */}
        <Grid.Col span={{ base: 12, sm: 6, lg: 2.4 }}>
          <StatCard title="Total de Ativos" value={total} description="Total sincronizado." icon={<IconDeviceDesktop />} color="blue" />
        </Grid.Col>

        {/* A Configurar (Cinza) */}
        <Grid.Col span={{ base: 12, sm: 6, lg: 2.4 }}>
          <StatCard title="A Configurar" value={configPendente} description="Sem setor definido." icon={<IconCalendarOff />} color="gray" />
        </Grid.Col>

        {/* Crítico (Red) */}
        <Grid.Col span={{ base: 12, sm: 6, lg: 2.4 }}>
          <StatCard title="Alerta Crítico" value={overdue} description="Vencidas." icon={<IconAlertTriangle />} color="red" onClick={() => handleCardClick('overdue')} />
        </Grid.Col>

        {/* Atenção (Yellow) */}
        <Grid.Col span={{ base: 12, sm: 6, lg: 2.4 }}>
          <StatCard title="Atenção (30d)" value={upcoming} description="Vence em breve." icon={<IconClock />} color="yellow" onClick={() => handleCardClick('upcoming')} />
        </Grid.Col>

        {/* Em Conformidade (Green) */}
        <Grid.Col span={{ base: 12, sm: 6, lg: 2.4 }}>
          <StatCard title="Em Conformidade" value={emDia} description="Planejadas > 30 dias." icon={<IconCircleCheck />} color="green" />
        </Grid.Col>
      </Grid>
      
      <Grid mt="xl">
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Card withBorder radius="md" p="lg" shadow="sm" h="100%" style={{ minHeight: 400 }}>
            <Group mb="md">
              <ThemeIcon variant="light" size="xl" radius="md" color="blue"><IconHistory /></ThemeIcon>
              <Text size="lg" fw={700}>Histórico (90 dias)</Text>
            </Group>
            <div style={{ height: '300px' }}>
              <Bar data={barChartData} options={chartOptions} />
            </div>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, lg: 5 }}>
           <Stack gap="md">
             <StatCard title="Dispositivos Próprios" value={stats.ownedCount} description="PTR / TRC" icon={<IconBuildingStore />} color="blue" onClick={() => handleNomenclatureClick('owned')} valueSize="2rem" />
             <StatCard title="Dispositivos Alugados" value={stats.rentedCount} description="NETSITE / VIVO / LENOVO" icon={<IconBuildingFactory />} color="grape" onClick={() => handleNomenclatureClick('rented')} valueSize="2rem" />
           </Stack>
        </Grid.Col>
      </Grid>
    </div>
  );
}

function StatCard({ title, value, description, icon, color, onClick, valueSize = "3.5rem" }) {
  const theme = useMantineTheme();
  const isDark = theme.colorScheme === 'dark';

  return (
    <Card 
      withBorder radius="md" p="lg" shadow="sm" 
      onClick={onClick}
      style={{ 
        cursor: onClick ? 'pointer' : 'default', 
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        height: '100%',
        borderLeft: `4px solid ${theme.colors[color][6]}` // Borda colorida à esquerda para destaque
      }}
      onMouseEnter={(e) => { if(onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = theme.shadows.md; } }}
      onMouseLeave={(e) => { if(onClick) { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = theme.shadows.sm; } }}
    >
      <Group justify="space-between" align="flex-start">
        <div>
          <Text c="dimmed" tt="uppercase" fw={700} size="xs" style={{ letterSpacing: '0.5px' }}>{title}</Text>
          <Text fw={800} size={valueSize} c="dark.4" style={{ lineHeight: 1, marginTop: 5, marginBottom: 5 }}>{value}</Text>
          <Text size="xs" c="dimmed">{description}</Text>
        </div>
        <ThemeIcon color={color} variant="light" size={48} radius="md">{icon}</ThemeIcon>
      </Group>
    </Card>
  );
}

export default HomePage;