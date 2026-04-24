import React, { useEffect, useState } from 'react';
import { 
  Title, Text, Card, Group, Stack, Progress, 
  Table, Badge, Loader, Center, RingProgress, Paper, SimpleGrid
} from '@mantine/core';
import { IconCheck, IconClock, IconListCheck, IconTrophy } from '@tabler/icons-react';
import { getActionPlans } from '../services/api';

const BRAND_BLUE = '#0003d9';

export default function ActionPlanManagerPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plansRaw = await getActionPlans();
        const plansData = Array.isArray(plansRaw) ? plansRaw : (plansRaw?.plans || plansRaw?.data || []);
        
        // Formata e calcula as estatísticas em tempo real
        const enrichedPlans = plansData.map(plan => {
          const assignments = plan.assignments || [];
          const total = assignments.length;
          
          const planStartDate = new Date(plan.startDate || plan.createdAt || new Date());
          planStartDate.setHours(0, 0, 0, 0);

          // Verifica quantas estão prontas (Status DONE ou Preventiva Feita)
          const completed = assignments.filter(a => {
            const status = String(a.status || '').toUpperCase();
            if (['COMPLETED', 'CONCLUIDO', 'FINALIZADO', 'DONE'].includes(status)) return true;
            
            const deviceData = a.device || a;
            const lastPrevStr = deviceData.lastPreventiveDate || deviceData.lastPreventive;
            if (lastPrevStr) {
                const prevDate = new Date(lastPrevStr);
                prevDate.setHours(0, 0, 0, 0);
                if (prevDate >= planStartDate) return true;
            }
            return false;
          });

          // Ranking por Técnico
          const techStats = {};
          assignments.forEach(a => {
            const tName = a.technician?.name || a.technicianName || 'Técnico Removido';
            if (!techStats[tName]) techStats[tName] = { total: 0, done: 0 };
            techStats[tName].total += 1;
            if (completed.includes(a)) techStats[tName].done += 1;
          });

          const leaderboard = Object.keys(techStats).map(name => ({
            name,
            total: techStats[name].total,
            done: techStats[name].done,
            percent: techStats[name].total > 0 ? Math.round((techStats[name].done / techStats[name].total) * 100) : 0
          })).sort((a, b) => b.percent - a.percent);

          return {
            ...plan,
            stats: {
              total,
              done: completed.length,
              pending: total - completed.length,
              progress: total > 0 ? Math.round((completed.length / total) * 100) : 0
            },
            leaderboard
          };
        });

        setPlans(enrichedPlans);
      } catch (error) {
        console.error('Erro ao carregar Torre de Controle:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  if (loading) return <Center h={400}><Loader color={BRAND_BLUE} size="lg" /></Center>;

  return (
    <Stack gap="xl" pb="xl">
      <div>
        <Title order={2} c="dark.6">Monitoramento de Campanhas</Title>
        <Text c="dimmed">Visão executiva em tempo real do andamento dos Planos de Ação.</Text>
      </div>

      {plans.length === 0 ? (
        <Paper withBorder p="xl" radius="md"><Center><Text c="dimmed">Nenhum plano de ação ativo no momento.</Text></Center></Paper>
      ) : (
        plans.map(plan => (
          <Card key={plan.id} shadow="sm" radius="lg" withBorder p="xl" style={{ borderTop: `6px solid ${BRAND_BLUE}` }}>
            <Group justify="space-between" align="flex-start" mb="lg">
              <div>
                <Group gap="sm">
                  <Title order={3}>{plan.name}</Title>
                  <Badge color={plan.stats.progress === 100 ? 'teal' : 'blue'} variant="light">
                    {plan.stats.progress === 100 ? 'Finalizado' : 'Em Andamento'}
                  </Badge>
                </Group>
                <Text size="sm" c="dimmed" mt={4}>
                  Iniciado em: {new Date(plan.startDate).toLocaleDateString()} 
                  {plan.deadline && ` • Prazo: ${new Date(plan.deadline).toLocaleDateString()}`}
                </Text>
              </div>

              <Group gap="md">
                <RingProgress
                  size={90}
                  thickness={8}
                  roundCaps
                  sections={[{ value: plan.stats.progress, color: plan.stats.progress === 100 ? 'teal' : BRAND_BLUE }]}
                  label={<Text ta="center" size="sm" fw={800}>{plan.stats.progress}%</Text>}
                />
                <Stack gap={0}>
                  <Text size="sm" fw={600} c="dimmed">Progresso Geral</Text>
                  <Text size="xl" fw={800} c="dark.4">{plan.stats.done} / {plan.stats.total}</Text>
                </Stack>
              </Group>
            </Group>

            <Divider mb="lg" />

            <Title order={5} c="dark.4" mb="md"><IconTrophy size={18} style={{ verticalAlign: 'sub', marginRight: 8 }} color="orange" /> Leaderboard da Equipe</Title>
            
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
              {plan.leaderboard.map(tech => (
                <Paper key={tech.name} p="md" radius="md" bg="gray.0" withBorder>
                  <Group justify="space-between" mb="xs">
                    <Text fw={700}>{tech.name}</Text>
                    <Text size="sm" fw={800} c={tech.percent === 100 ? 'teal' : BRAND_BLUE}>{tech.done} de {tech.total} ({tech.percent}%)</Text>
                  </Group>
                  <Progress 
                    value={tech.percent} 
                    color={tech.percent === 100 ? 'teal' : BRAND_BLUE} 
                    size="xl" 
                    radius="xl" 
                    striped={tech.percent > 0 && tech.percent < 100} 
                    animated={tech.percent > 0 && tech.percent < 100} 
                  />
                </Paper>
              ))}
            </SimpleGrid>
          </Card>
        ))
      )}
    </Stack>
  );
}