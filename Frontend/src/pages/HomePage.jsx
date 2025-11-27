import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api.js';
import { useNavigate } from 'react-router-dom';
import { Grid, Card, Text, Group, ThemeIcon, useMantineTheme, Stack, SimpleGrid, Paper } from '@mantine/core';

// Chart.js
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title as ChartTitle, Tooltip, Legend } from 'chart.js';

// Ícones
import { 
  IconDeviceDesktop, IconAlertTriangle, IconClock, IconCircleCheck, 
  IconHistory, IconBuildingStore, IconBuildingFactory
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

  // Dados do Gráfico
  const barChartData = {
    labels: stats.preventiveChartData.map(d => d.name),
    datasets: [{
      label: 'Preventivas',
      data: stats.preventiveChartData.map(d => d.value),
      backgroundColor: 'rgba(0, 65, 194, 0.7)',
      borderColor: '#0041C2',
      borderWidth: 1,
    }],
  };

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      tooltip: { backgroundColor: '#fff', titleColor: '#333', bodyColor: '#111', borderColor: '#e0e0e0', borderWidth: 1, padding: 10 },
      legend: { display: false }
    }
  };

  // Componente de Cartão Interno
  const StatCard = ({ title, value, description, icon, color, onClick, valueSize = "3rem" }) => (
    <Paper 
      withBorder radius="md" p="lg" shadow="sm" 
      onClick={onClick}
      style={{ 
        cursor: onClick ? 'pointer' : 'default', 
        transition: 'transform 0.2s ease',
        height: '100%',
        borderLeft: `5px solid ${theme.colors[color][6]}`
      }}
    >
      <Group justify="space-between" align="flex-start" mb="xs">
        <Text c="dimmed" tt="uppercase" fw={700} size="xs" style={{ letterSpacing: '0.5px' }}>{title}</Text>
        <ThemeIcon color={color} variant="light" size="xl" radius="md">{icon}</ThemeIcon>
      </Group>
      <Text fw={800} size={valueSize} c="dark.4" style={{ lineHeight: 1 }}>{value}</Text>
      <Text size="xs" c="dimmed" mt="sm">{description}</Text>
    </Paper>
  );

  return (
    <Stack gap="lg">
      <Text size="xl" fw={800} c="dark.4">Dashboard de Preventivas</Text>
      
      {/* --- OS 4 CARTÕES DO TOPO --- */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        
        <StatCard 
          title="Total de Ativos" 
          value={stats.totalDevices} 
          description="Total de equipamentos sincronizados."
          icon={<IconDeviceDesktop size="1.5rem" />} 
          color="blue" 
        />

        <StatCard 
          title="Em Conformidade" 
          value={stats.compliantCount || 0} // <-- USA O NOVO VALOR DO BACKEND
          description="Ativos com preventiva agendada (futura)."
          icon={<IconCircleCheck size="1.5rem" />} 
          color="green" 
        />

        <StatCard 
          title="Atenção (30 dias)" 
          value={stats.upcomingCount} 
          description="Vencendo nos próximos 30 dias."
          icon={<IconClock size="1.5rem" />} 
          color="yellow"
          onClick={() => handleCardClick('upcoming')}
        />

        <StatCard 
          title="Alerta Crítico" 
          value={stats.overdueCount} 
          description="Manutenção preventiva vencida."
          icon={<IconAlertTriangle size="1.5rem" />} 
          color="red" 
          onClick={() => handleCardClick('overdue')}
        />
      </SimpleGrid>
      
      {/* --- PARTE INFERIOR (Gráfico e Tipos) --- */}
      <Grid>
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Paper withBorder radius="md" p="lg" shadow="sm" h="100%" style={{ minHeight: 400 }}>
            <Group mb="md">
              <ThemeIcon variant="light" size="lg" radius="md" color="blue"><IconHistory /></ThemeIcon>
              <Text size="lg" fw={700}>Histórico de Manutenções (90 dias)</Text>
            </Group>
            <div style={{ height: '300px' }}>
              <Bar data={barChartData} options={chartOptions} />
            </div>
          </Paper>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, lg: 4 }}>
           <Stack gap="md" h="100%">
             <StatCard 
               title="Dispositivos Próprios" 
               value={stats.ownedCount} 
               description="Prefixos PTR e TRC."
               icon={<IconBuildingStore size="1.4rem" />} 
               color="blue"
               onClick={() => handleNomenclatureClick('owned')}
               valueSize="2rem" 
             />
             <StatCard 
               title="Dispositivos Alugados" 
               value={stats.rentedCount} 
               description="Prefixos NETSITE, VIVO, LENOVO..."
               icon={<IconBuildingFactory size="1.4rem" />} 
               color="grape"
               onClick={() => handleNomenclatureClick('rented')}
               valueSize="2rem" 
             />
           </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

export default HomePage;