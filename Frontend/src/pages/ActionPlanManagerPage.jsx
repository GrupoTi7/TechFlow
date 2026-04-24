import React, { useEffect, useState } from 'react';
import { Title, Text, Card, Group, Stack, Progress, Badge, Loader, Center, RingProgress, Paper, SimpleGrid, Divider } from '@mantine/core';
import { IconTrophy, IconActivity } from '@tabler/icons-react';
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
        
        const enrichedPlans = plansData.map(plan => {
          const assignments = plan.assignments || [];
          const total = assignments.length;
          const planStart = new Date(plan.startDate || plan.createdAt || new Date());
          planStart.setHours(0,0,0,0);

          const completed = assignments.filter(a => {
            const deviceData = a.device || a;
            const lastPrev = deviceData.lastPreventiveDate || deviceData.lastPreventive;
            if (lastPrev) {
              const d = new Date(lastPrev); d.setHours(0,0,0,0);
              return d >= planStart;
            }
            return false;
          });

          const techStats = {};
          assignments.forEach(a => {
            const name = a.technician?.name || a.technician?.username || 'Técnico';
            if (!techStats[name]) techStats[name] = { total: 0, done: 0 };
            techStats[name].total++;
            const isDone = completed.includes(a);
            if (isDone) techStats[name].done++;
          });

          const leaderboard = Object.keys(techStats).map(name => ({
            name,
            total: techStats[name].total,
            done: techStats[name].done,
            percent: Math.round((techStats[name].done / techStats[name].total) * 100) || 0
          })).sort((a, b) => b.percent - a.percent);

          return { ...plan, stats: { total, done: completed.length, progress: Math.round((completed.length/total)*100) || 0 }, leaderboard };
        });
        setPlans(enrichedPlans);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchPlans();
  }, []);

  if (loading) return <Center h={400}><Loader color={BRAND_BLUE} size="lg" /></Center>;

  return (
    <Stack gap="xl">
      <Title order={2}>Gestão de Campanhas</Title>
      {plans.map(plan => (
        <Card key={plan.id} withBorder radius="lg" shadow="sm">
          <Group justify="space-between" mb="xl">
            <Stack gap={0}>
              <Title order={3}>{plan.name}</Title>
              <Text size="sm" c="dimmed">Progresso Geral do Plano</Text>
            </Stack>
            <RingProgress size={120} thickness={12} sections={[{ value: plan.stats.progress, color: BRAND_BLUE }]} label={<Text ta="center" fw={700}>{plan.stats.progress}%</Text>} />
          </Group>
          <Divider label="Performance por Técnico" mb="md" />
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {plan.leaderboard.map(t => (
              <Paper key={t.name} p="md" withBorder bg="gray.0">
                <Group justify="space-between" mb="xs">
                  <Text fw={700}>{t.name}</Text>
                  <Badge variant="filled" color={t.percent === 100 ? 'teal' : BRAND_BLUE}>{t.done}/{t.total}</Badge>
                </Group>
                <Progress value={t.percent} size="xl" radius="xl" animated={t.percent < 100} color={t.percent === 100 ? 'teal' : BRAND_BLUE} />
              </Paper>
            ))}
          </SimpleGrid>
        </Card>
      ))}
    </Stack>
  );
}