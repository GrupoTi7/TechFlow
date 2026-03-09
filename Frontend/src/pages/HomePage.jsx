import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api.js';
import { useNavigate } from 'react-router-dom';
import { Grid, Card, Text, Group, ThemeIcon, useMantineTheme, Stack } from '@mantine/core';

// IMPORTA O NOVO WIDGET DE PLANO DE AÇÃO
import ActionPlanWidget from '../components/ActionPlanWidget'; 

// Importa APENAS o BarChart do 'chart.js'
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

// Regista os componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend
);

// --- CORES VIBRANTES E PERSONALIZADAS ---
const BRAND_BLUE = '#0003d9';    // Seu azul oficial
const VIVID_GREEN = '#05a828';   // Verde Esmeralda Vivo
// Usei laranja em vez de amarelo para melhor contraste e "vida" no fundo branco
const VIVID_ORANGE = '#f76707';  // Laranja Intenso (Atenção)
const VIVID_RED = '#d90429';     // Vermelho Carmim Vibrante (Alerta)
const VIVID_GRAY = '#495057';    // Cinza Chumbo Moderno

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
  
  const handleNomenclatureClick = (nomenclatureFilter) => {
    navigate('/devices', { state: { initialNomenclatureFilter: nomenclatureFilter } });
  };

  if (isLoading) return <div>A carregar estatísticas do dashboard...</div>;
  if (error) return <div style={{ color: 'red' }}>Erro ao carregar dashboard: {error}</div>;
  if (!stats) return <p>Aguardando dados das estatísticas...</p>;

  // Correção para conformidade
  const inComplianceCount = stats.compliantCount || 0;

  // Transforme os dados para o formato do Chart.js
  const barChartData = {
    labels: stats.preventiveChartData.map(d => d.name),
    datasets: [
      {
        label: 'Preventivas Realizadas',
        data: stats.preventiveChartData.map(d => d.value),
        backgroundColor: 'rgba(0, 3, 217, 0.7)', // Azul da marca com transparência
        borderColor: BRAND_BLUE,
        borderWidth: 1,
      },
    ],
  };

  // Opções para o gráfico
  const chartOptions = {
    maintainAspectRatio: false, 
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
    <div style={{ paddingBottom: '40px' }}>
      <Text size="xl" fw={700} mb="lg" c="dark.4">Dashboard de Preventivas</Text>
      
      {/* --- 1. GRELHA DOS 4 CARTÕES DE STATUS --- */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          <StatCard 
            title="Total de Ativos" 
            value={stats.totalDevices} 
            description="Total de equipamentos sincronizados."
            icon={<IconDeviceDesktop />} 
            color={BRAND_BLUE} 
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
          {/* CARD VERDE VIVO */}
          <StatCard 
            title="Em Conformidade" 
            value={inComplianceCount}
            description="Ativos com a preventiva planejada."
            icon={<IconCircleCheck />} 
            color={VIVID_GREEN} // <-- Mudança
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
           {/* CARD LARANJA VIVO (Atenção) */}
          <StatCard 
            title="Atenção (30 dias)" 
            value={stats.upcomingCount} 
            description="Vencendo nos próximos 30 dias."
            icon={<IconClock />} 
            color={VIVID_ORANGE} // <-- Mudança
            onClick={() => handleCardClick('upcoming')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
           {/* CARD VERMELHO VIVO (Alerta) */}
          <StatCard 
            title="Alerta Crítico" 
            value={stats.overdueCount} 
            description="Manutenção preventiva vencida."
            icon={<IconAlertTriangle />} 
            color={VIVID_RED} // <-- Mudança
            onClick={() => handleCardClick('overdue')}
          />
        </Grid.Col>
      </Grid>
      
      {/* --- 2. NOVO WIDGET: PLANO DE AÇÃO --- */}
      <ActionPlanWidget />
      {/* ------------------------------------- */}

      {/* --- 3. GRÁFICOS E INFO ADICIONAL --- */}
      <Grid mt="xl">
        {/* Gráfico de Barras */}
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
        
        {/* Cartões Clicáveis (Internos / Alugados) */}
        <Grid.Col span={{ base: 12, lg: 5 }}>
           <Stack gap="xl">
             <StatCard 
               title="Dispositivos Internos (Comprados)" 
               value={stats.ownedCount} 
               description="Prefixos PTR e TRC."
               icon={<IconBuildingStore />} 
               color={BRAND_BLUE} 
               onClick={() => handleNomenclatureClick('owned')}
               valueSize="2.5rem" 
             />
             
             {/* CARD CINZA MAIS VIVO */}
             <StatCard 
               title="Dispositivos Alugados" 
               value={stats.rentedCount} 
               description="Prefixos NETSITE, VIVO, SOROCAMP e INFOBRAS."
               icon={<IconBuildingFactory />} 
               color={VIVID_GRAY} // <-- Mudança
               onClick={() => handleNomenclatureClick('rented')}
               valueSize="2.5rem" 
             />
           </Stack>
        </Grid.Col>
      </Grid>
    </div>
  );
}

// Componente StatCard Auxiliar (Já estava pronto para aceitar HEX)
function StatCard({ title, value, description, icon, color, onClick, valueSize = "4rem" }) {
  const theme = useMantineTheme();
  const isDark = theme.colorScheme === 'dark';

  // Lógica: Se a cor começar com '#', usa ela direto. Se não, busca no tema.
  const textColor = color.startsWith('#') 
    ? color 
    : (isDark ? theme.colors[color][5] : theme.colors[color][7]);

  return (
    <Card 
      withBorder 
      radius="md" 
      p="lg" 
      shadow="sm" 
      onClick={onClick}
      style={{ 
        cursor: onClick ? 'pointer' : 'default', 
        transition: 'all 0.2s ease',
        // Adiciona uma borda superior colorida sutil para mais destaque
        borderTop: `3px solid ${textColor}` 
      }}
      onMouseEnter={(e) => {
        if(onClick) {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = theme.shadows.md;
        }
      }}
      onMouseLeave={(e) => {
        if(onClick) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = theme.shadows.sm;
        }
      }}
    >
      <Group justify="space-between">
        <Text size="sm" c="dimmed" fw={700} tt="uppercase">
          {title}
        </Text>
        {/* O ThemeIcon variant="filled" usa a cor HEX como background, ficando bem vivo */}
        <ThemeIcon color={color} variant="filled" size="lg" radius="md">
          {icon}
        </ThemeIcon>
      </Group>
      <Text size={valueSize} fw={900} c={textColor}>
        {value}
      </Text>
      <Text size="sm" c="dimmed" mt="xs">
        {description}
      </Text>
    </Card>
  );
}

export default HomePage;