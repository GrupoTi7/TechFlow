// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Grid, Card, Text, Group, ThemeIcon, useMantineTheme, Stack } from '@mantine/core';

// 1. Importe APENAS o BarChart do 'chart.js'
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';

import { 
  IconDeviceDesktop, 
  IconAlertTriangle, 
  IconClock, 
  IconCircleCheck,
  IconHistory,
  IconBuildingStore,
  IconBuildingFactory
} from '@tabler/icons-react';

// 2. Registe os componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend
);

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
  
  // Função para os novos cartões clicáveis
  const handleNomenclatureClick = (nomenclatureFilter) => {
    navigate('/devices', { state: { initialNomenclatureFilter: nomenclatureFilter } });
  };

  if (isLoading) return <div>A carregar estatísticas do dashboard...</div>;
  if (error) return <div style={{ color: 'red' }}>Erro ao carregar dashboard: {error}</div>;
  if (!stats) return <p>Aguardando dados das estatísticas...</p>;

  const inComplianceCount = (stats.totalDevices || 0) - (stats.overdueCount || 0) - (stats.upcomingCount || 0);

  // 3. Transforme os dados para o formato do Chart.js
  const barChartData = {
    labels: stats.preventiveChartData.map(d => d.name),
    datasets: [
      {
        label: 'Preventivas Realizadas',
        data: stats.preventiveChartData.map(d => d.value),
        backgroundColor: 'rgba(0, 4, 240, 0.6)', 
        borderColor: 'rgba(0, 4, 240, 1)',
        borderWidth: 1,
      },
    ],
  };

  // 4. Opções para o gráfico (incluindo o tooltip branco que corrige o bug)
  const chartOptions = {
    maintainAspectRatio: false, // Permite que o gráfico preencha o 'div'
    plugins: {
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#333',
        bodyColor: '#111',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                  label += ': ';
              }
              label += context.parsed.y + ' manutenções';
              return label;
          }
        }
      },
      legend: {
        display: false 
      }
    }
  };

  return (
    <div>
      <Text size="xl" fw={700} mb="lg">Dashboard de Preventivas</Text>
      
      {/* --- 5. GRELHA DOS 4 CARTÕES ORIGINAIS (RESTAURADA) --- */}
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
      
      <Grid mt="xl">
        {/* Gráfico de Barras */}
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Card withBorder radius="md" p="lg" shadow="sm" h="100%" style={{ minHeight: 400 }}>
            <Group>
              <ThemeIcon variant="light" size="xl" radius="md"><IconHistory /></ThemeIcon>
              <Text size="lg" fw={700}>Preventivas Realizadas (Últimos 90 dias)</Text>
            </Group>
            {/* 6. Use o BarChart do Chart.js */}
            <div style={{ height: '300px', marginTop: '20px' }}>
              <Bar data={barChartData} options={chartOptions} />
            </div>
          </Card>
        </Grid.Col>
        
        {/* --- 7. NOVOS CARTÕES CLICÁVEIS (COMO PEDIDO) --- */}
        <Grid.Col span={{ base: 12, lg: 5 }}>
           <Stack gap="xl">
             <StatCard 
               title="Dispositivos Internos (Comprados)" 
               value={stats.ownedCount} 
               description="Prefixos PTR e TRC."
               icon={<IconBuildingStore />} 
               color="blue"
               onClick={() => handleNomenclatureClick('owned')} // <-- Clicável
               valueSize="2.5rem" // Tamanho menor para caber
             />
             <StatCard 
               title="Dispositivos Alugados" 
               value={stats.rentedCount} 
               description="Prefixos NETSITE e VIVO."
               icon={<IconBuildingFactory />} 
               color="gray"
               onClick={() => handleNomenclatureClick('rented')} // <-- Clicável
               valueSize="2.5rem" // Tamanho menor para caber
             />
           </Stack>
        </Grid.Col>
      </Grid>
    </div>
  );
}

// O componente StatCard (com tamanho de fonte ajustado)
function StatCard({ title, value, description, icon, color, onClick, valueSize = "4rem" }) {
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
      <Text size={valueSize} fw={900} c={isDark ? theme.colors[color][5] : theme.colors[color][7]}>
        {value}
      </Text>
      <Text size="sm" c="dimmed" mt="xs">
        {description}
      </Text>
    </Card>
  );
}

export default HomePage;