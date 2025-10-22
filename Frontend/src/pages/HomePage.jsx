// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Grid, Card, Text, Group, ThemeIcon, useMantineTheme, Stack } from '@mantine/core'; // Garanta que Stack está aqui
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
        console.log("HomePage: Iniciando busca de dados..."); // <-- LOG 1
        const data = await getDashboardStats();
        console.log("HomePage: Dados recebidos da API:", data); // <-- LOG 2 (Veja a estrutura completa)

        if (data && data.success && data.stats) { // <-- Verificação mais segura
          console.log("HomePage: API retornou sucesso. Stats:", data.stats); // <-- LOG 3 (Veja o objeto stats)
          setStats(data.stats);
        } else {
          console.error("HomePage: API não retornou sucesso ou 'stats' está em falta.", data); // <-- LOG 4
          setError(data?.message || 'Resposta inválida da API.');
        }
      } catch (err) {
        console.error("HomePage: Erro no fetchStats:", err); // <-- LOG 5
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

  // Função para navegar para a lista de dispositivos com filtro de nomenclatura
  const handleNomenclatureClick = (nomenclatureFilter) => {
    // --- ADICIONE ESTE CONSOLE.LOG ---
    console.log(`Tentando navegar para lista com filtro: ${nomenclatureFilter}`);
    navigate('/devices', { state: { initialNomenclatureFilter: nomenclatureFilter } });
  };

  if (isLoading) return <div>A carregar estatísticas do dashboard...</div>;
  if (error) return <div style={{ color: 'red' }}>Erro ao carregar dashboard: {error}</div>; // Mensagem de erro mais clara

  // Verificação crucial ANTES de tentar usar 'stats'
  if (!stats) {
     console.warn("HomePage: Tentando renderizar, mas 'stats' ainda é null."); // <-- LOG 6
     return <p>Aguardando dados das estatísticas...</p>; // Ou <LoadingOverlay visible={true} />
  }

  // Cálculos (só executam se 'stats' existir)
  const inComplianceCount = (stats.totalDevices || 0) - (stats.overdueCount || 0) - (stats.upcomingCount || 0);
  console.log("HomePage: Calculando inComplianceCount:", inComplianceCount); // <-- LOG 7

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
            {/* Garanta que stats.preventiveChartData existe antes de renderizar */}
            {stats.preventiveChartData && (
              <BarChart
                h={300}
                data={stats.preventiveChartData}
                dataKey="name"
                series={[{ name: 'value', color: 'blue.6' }]}
                tickLine="y"
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
               onClick={() => {
                   console.log('Clicou em Comprados!'); // <-- LOG DE CLIQUE
                   handleNomenclatureClick('owned');
               }}
             />
             <StatCard
               title="Dispositivos Alugados"
               value={stats.rentedCount}
               description="Prefixos NETSITE e VIVO."
               icon={<IconBuildingFactory />}
               color="gray"
               onClick={() => {
                   console.log('Clicou em Alugados!'); // <-- LOG DE CLIQUE
                   handleNomenclatureClick('rented');
               }}
             />
           </Stack>
        </Grid.Col>
      </Grid>
    </div>
  );
}

// O componente StatCard (com tamanho de fonte ajustado)
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