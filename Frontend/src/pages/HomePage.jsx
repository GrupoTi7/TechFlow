import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api.js';
import { useNavigate } from 'react-router-dom';
import { Grid, Card, Text, Group, ThemeIcon, useMantineTheme, Stack } from '@mantine/core';

import ActionPlanWidget from '../components/ActionPlanWidget'; 

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title as ChartTitle, Tooltip, Legend,
} from 'chart.js';

import { 
  IconDeviceDesktop, IconAlertTriangle, IconClock, IconCircleCheck,
  IconHistory, IconBuildingStore, IconBuildingFactory
} from '@tabler/icons-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTitle, Tooltip, Legend);

const BRAND_BLUE = '#0003d9';    
const VIVID_GREEN = '#05a828';   
const VIVID_ORANGE = '#f76707';  
const VIVID_RED = '#d90429';     
const VIVID_GRAY = '#495057';    

function HomePage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // 🟢 LÓGICA PARA OCULTAR A FILA DA DIRETORIA
  const storedUser = localStorage.getItem('user');
  const userObj = storedUser ? JSON.parse(storedUser) : null;
  const checkUsername = (userObj?.username || userObj?.email || '').toLowerCase();
  const checkName = (userObj?.name || '').toLowerCase();

  // Lista restrita: Apenas estes não verão a fila de execução (você continua vendo)
  const gestoresSemFila = ['eduardo.nakai', 'juliano.veroneze'];
  
  const isGestorSemFila = 
    gestoresSemFila.some(gestor => checkUsername.includes(gestor)) || 
    checkName.includes('eduardo') || 
    checkName.includes('juliano');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats(); 
        if (data.success) {
          const rawStats = data.stats;
          
          let serverCount = 0;
          let serverOwnedCount = 0;
          let serverRentedCount = 0;

          if (rawStats.allDevices && Array.isArray(rawStats.allDevices)) {
              rawStats.allDevices.forEach(d => {
                  const name = (d.name || '').toUpperCase();
                  if (name.includes('SRV') || name.includes('VMWARE') || name.includes('SERVIDOR')) {
                      serverCount++;
                      if (name.startsWith('PTR') || name.startsWith('TRC')) {
                          serverOwnedCount++;
                      } else if (['NETSITE','VIVO','SOROCAMP','INFOBRAS','LENOVO'].some(p => name.startsWith(p))) {
                          serverRentedCount++;
                      }
                  }
              });
          }

          setStats({
              ...rawStats,
              computerCount: Math.max(0, (rawStats.computerCount || 0) - serverCount),
              ownedCount: Math.max(0, (rawStats.ownedCount || 0) - serverOwnedCount),
              rentedCount: Math.max(0, (rawStats.rentedCount || 0) - serverRentedCount),
          });

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

  const handleCardClick = (statusFilter) => navigate('/devices', { state: { initialStatusFilter: statusFilter } });
  const handleNomenclatureClick = (nomenclatureFilter) => navigate('/devices', { state: { initialNomenclatureFilter: nomenclatureFilter } });
  const handleTypeClick = (type) => navigate('/devices', { state: { initialTypeFilter: type } });

  if (isLoading) return <div>A carregar estatísticas do dashboard...</div>;
  if (error) return <div style={{ color: 'red' }}>Erro ao carregar dashboard: {error}</div>;
  if (!stats) return <p>Aguardando dados das estatísticas...</p>;

  const inComplianceCount = stats.compliantCount || 0;

  const barChartData = {
    labels: stats.preventiveChartData ? stats.preventiveChartData.map(d => d.name) : [],
    datasets: [
      {
        label: 'Preventivas Realizadas',
        data: stats.preventiveChartData ? stats.preventiveChartData.map(d => d.value) : [],
        backgroundColor: 'rgba(0, 3, 217, 0.7)',
        borderColor: BRAND_BLUE,
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(0, 3, 217, 0.9)', 
        cursor: 'pointer' 
      },
    ],
  };

  const chartOptions = {
    maintainAspectRatio: false, 
    onClick: (event, elements, chart) => {
      if (elements.length > 0) {
        const dataIndex = elements[0].index;
        const selectedMonth = chart.data.labels[dataIndex]; 
        navigate('/history', { state: { initialMonthFilter: selectedMonth } });
      }
    },
    onHover: (event, chartElement) => {
      event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
    },
    plugins: {
      tooltip: {
        backgroundColor: '#fff', titleColor: '#333', bodyColor: '#111', borderColor: '#e0e0e0', borderWidth: 1, padding: 10,
        callbacks: {
          label: function(context) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              label += context.parsed.y + ' manutenções (Clique para ver)';
              return label;
          }
        }
      },
      legend: { display: false }
    }
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      <Text size="xl" fw={700} mb="lg" c="dark.4">Dashboard de Preventivas</Text>
      <Grid>
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <StatCard title="Estações de Trabalho" value={stats.computerCount || 0} description={`+ ${stats.infraCount || 0} Ativos de Infra`} icon={<IconDeviceDesktop />} color={BRAND_BLUE} onClick={() => handleTypeClick('computer')} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <StatCard title="Em Conformidade" value={inComplianceCount} description="Ativos com a preventiva planejada." icon={<IconCircleCheck />} color={VIVID_GREEN} onClick={() => handleCardClick('compliant')} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <StatCard title="Atenção (30 dias)" value={stats.upcomingCount || 0} description="Vencendo nos próximos 30 dias." icon={<IconClock />} color={VIVID_ORANGE} onClick={() => handleCardClick('upcoming')} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <StatCard title="Alerta Crítico" value={stats.overdueCount || 0} description="Manutenção preventiva vencida." icon={<IconAlertTriangle />} color={VIVID_RED} onClick={() => handleCardClick('overdue')} />
        </Grid.Col>
      </Grid>
      
      {/* 🟢 O SEGREDO ESTÁ AQUI: O componente só é renderizado se NÃO for um gestor sem fila */}
      {!isGestorSemFila && <ActionPlanWidget />}

      <Grid mt="xl">
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <Card withBorder radius="md" p="lg" shadow="sm" h="100%" style={{ minHeight: 400 }}>
            <Group>
              <ThemeIcon variant="light" size="xl" radius="md" color="blue"><IconHistory /></ThemeIcon>
              <Text size="lg" fw={700}>Preventivas Realizadas (Últimos 90 dias)</Text>
            </Group>
            <div style={{ height: '300px', marginTop: '20px' }}>
              <Bar data={barChartData} options={chartOptions} />
            </div>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, lg: 5 }}>
           <Stack gap="xl">
             <StatCard title="Dispositivos Internos (Comprados)" value={stats.ownedCount || 0} description="Prefixos PTR e TRC." icon={<IconBuildingStore />} color={BRAND_BLUE} onClick={() => handleNomenclatureClick('owned')} valueSize="2.5rem" />
             <StatCard title="Dispositivos Alugados" value={stats.rentedCount || 0} description="Prefixos NETSITE, VIVO, SOROCAMP e INFOBRAS." icon={<IconBuildingFactory />} color={VIVID_GRAY} onClick={() => handleNomenclatureClick('rented')} valueSize="2.5rem" />
           </Stack>
        </Grid.Col>
      </Grid>
    </div>
  );
}

function StatCard({ title, value, description, icon, color, onClick, valueSize = "4rem" }) {
  const theme = useMantineTheme();
  const isDark = theme.colorScheme === 'dark';
  const textColor = color.startsWith('#') ? color : (isDark ? theme.colors[color][5] : theme.colors[color][7]);

  return (
    <Card 
      withBorder radius="md" p="lg" shadow="sm" onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s ease', borderTop: `3px solid ${textColor}` }}
      onMouseEnter={(e) => { if(onClick) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = theme.shadows.md; } }}
      onMouseLeave={(e) => { if(onClick) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = theme.shadows.sm; } }}
    >
      <Group justify="space-between">
        <Text size="sm" c="dimmed" fw={700} tt="uppercase">{title}</Text>
        <ThemeIcon color={color} variant="filled" size="lg" radius="md">{icon}</ThemeIcon>
      </Group>
      <Text size={valueSize} fw={900} c={textColor}>{value}</Text>
      <Text size="sm" c="dimmed" mt="xs">{description}</Text>
    </Card>
  );
}

export default HomePage;