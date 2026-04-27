import React, { useEffect, useState, useMemo } from 'react';
import { 
  Title, Text, Card, Group, Stack, Progress, Badge, Loader, 
  Center, RingProgress, Paper, SimpleGrid, Divider, Tabs, 
  ThemeIcon, Grid, Avatar, TextInput, Menu, ActionIcon, Timeline, Tooltip, Box 
} from '@mantine/core';
import { 
  IconTrophy, IconActivity, IconClock, IconBuildingStore, 
  IconDeviceDesktop, IconCheck, IconAlertCircle, IconUsers,
  IconSearch, IconDotsVertical, IconBellRinging, IconDownload, 
  IconFlame, IconHeartRateMonitor
} from '@tabler/icons-react';

// 🟢 Importação limpa e única com a função do E-mail (sendPlanReminder)
import { getActionPlans, getUsers, sendPlanReminder } from '../services/api';

const BRAND_BLUE = '#0003d9';

export default function ActionPlanManagerPage() {
  const [plans, setPlans] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [loading, setLoading] = useState(true);
  
  const [globalStats, setGlobalStats] = useState({ 
    totalPending: 0, 
    totalDone: 0, 
    activePlans: 0,
    healthScore: 100 
  });

  // 🟢 MOTOR DE BUSCA CORRIGIDO: Filtra em tempo real sem travar
  const filteredPlans = useMemo(() => {
    if (!searchQuery) return plans;
    return plans.filter(plan => plan.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, plans]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const [plansRaw, usersRaw] = await Promise.all([
            getActionPlans(),
            getUsers()
        ]);

        const plansData = Array.isArray(plansRaw) ? plansRaw : (plansRaw?.plans || plansRaw?.data || []);
        const usersData = Array.isArray(usersRaw?.users) ? usersRaw.users : (Array.isArray(usersRaw) ? usersRaw : []);

        const userMap = {};
        usersData.forEach(u => { userMap[u.id] = u.name || u.username; });
        
        let gPending = 0;
        let gDone = 0;
        let onTrackPlans = 0;

        const enrichedPlans = plansData.map(plan => {
          const assignments = plan.assignments || [];
          const total = assignments.length;
          const planStartDate = new Date(plan.startDate || plan.createdAt || new Date());
          planStartDate.setHours(0, 0, 0, 0);

          const completed = [];
          const recentActivity = [];

          assignments.forEach(a => {
            const status = String(a.status || '').toUpperCase();
            const deviceData = a.device || a;
            const lastPrevStr = deviceData.lastPreventiveDate || deviceData.lastPreventive;
            
            let isDone = false;
            let doneDate = null;

            if (['COMPLETED', 'CONCLUIDO', 'FINALIZADO', 'DONE'].includes(status)) {
              isDone = true;
              doneDate = a.completedAt ? new Date(a.completedAt) : new Date();
            } else if (lastPrevStr) {
              const prevDate = new Date(lastPrevStr);
              prevDate.setHours(0, 0, 0, 0);
              if (prevDate >= planStartDate) {
                isDone = true;
                doneDate = new Date(lastPrevStr);
              }
            }

            if (isDone) {
              completed.push(a);
              const techName = a.technician?.name || a.technician?.username || userMap[a.technicianId] || 'Técnico';
              recentActivity.push({
                ...a,
                deviceName: deviceData.name || 'Dispositivo Desconhecido',
                techName: techName,
                doneDate: doneDate
              });
            }
          });

          recentActivity.sort((a, b) => b.doneDate - a.doneDate);
          gPending += (total - completed.length);
          gDone += completed.length;

          const techStats = {};
          const sectorStats = {};
          const typeStats = {};

          assignments.forEach(a => {
            const isDone = completed.includes(a);
            const tName = a.technician?.name || a.technician?.username || userMap[a.technicianId] || 'Técnico';
            
            if (!techStats[tName]) techStats[tName] = { total: 0, done: 0 };
            techStats[tName].total += 1;
            if (isDone) techStats[tName].done += 1;

            const deviceData = a.device || a;
            const sName = deviceData.setorName || deviceData.setor || 'S/ Setor';
            if (!sectorStats[sName]) sectorStats[sName] = { total: 0, done: 0 };
            sectorStats[sName].total += 1;
            if (isDone) sectorStats[sName].done += 1;

            const typeName = deviceData.deviceType || deviceData.type || 'Outros';
            if (!typeStats[typeName]) typeStats[typeName] = { total: 0, done: 0 };
            typeStats[typeName].total += 1;
            if (isDone) typeStats[typeName].done += 1;
          });

          const formatStats = (obj) => Object.keys(obj).map(name => ({
            name, total: obj[name].total, done: obj[name].done,
            percent: obj[name].total > 0 ? Math.round((obj[name].done / obj[name].total) * 100) : 0
          })).sort((a, b) => a.percent - b.percent);

          let daysLeft = null;
          let urgencyColor = 'blue';
          let isOnTrack = true;

          if (plan.deadline) {
            const diffTime = new Date(plan.deadline).getTime() - new Date().getTime();
            daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (daysLeft < 0 && completed.length < total) { urgencyColor = 'red'; isOnTrack = false; }
            else if (daysLeft <= 3 && completed.length < total) { urgencyColor = 'orange'; }
          }

          if (isOnTrack || completed.length === total) onTrackPlans++;

          return {
            ...plan, daysLeft, urgencyColor, isOnTrack,
            recentActivity: recentActivity.slice(0, 10),
            stats: {
              total, done: completed.length, pending: total - completed.length,
              progress: total > 0 ? Math.round((completed.length / total) * 100) : 0
            },
            leaderboard: formatStats(techStats).reverse(), sectors: formatStats(sectorStats), types: formatStats(typeStats)
          };
        });

        const health = enrichedPlans.length > 0 ? Math.round((onTrackPlans / enrichedPlans.length) * 100) : 100;
        setGlobalStats({ totalPending: gPending, totalDone: gDone, activePlans: enrichedPlans.length, healthScore: health });
        setPlans(enrichedPlans);
        
      } catch (error) { 
        console.error('Erro ao carregar Torre de Controle:', error); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchPlans();
  }, []);

  if (loading) return <Center h={400}><Loader color={BRAND_BLUE} size="xl" type="bars" /></Center>;

  return (
    <Stack gap="xl" pb="xl">
      {/* CABEÇALHO */}
      <Paper p="xl" radius="lg" style={{ background: `linear-gradient(135deg, ${BRAND_BLUE} 0%, #3b5bdb 100%)`, color: 'white', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 250, height: 250, background: globalStats.healthScore < 50 ? '#ff6b6b' : '#4dabf7', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.4 }}></div>
        <Grid align="center" gutter="xl">
          <Grid.Col span={{ base: 12, lg: 5 }}>
            <Group gap="sm">
              <ThemeIcon size={42} radius="md" variant="white" color={BRAND_BLUE}><IconHeartRateMonitor size={26} /></ThemeIcon>
              <div>
                <Title order={2} fw={900} style={{ letterSpacing: '-1px', color: 'white' }}>Command Center</Title>
                <Text style={{ color: 'rgba(255,255,255,0.7)' }} mt={-4} size="sm">Monitoramento tático de eficiência.</Text>
              </div>
            </Group>
            <TextInput 
              mt="lg"
              placeholder="Pesquisar campanha pelo nome..." 
              leftSection={<IconSearch size={16} color="white" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              styles={{ 
                input: { backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' },
                inputPlaceholder: { color: 'rgba(255,255,255,0.6)' }
              }}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 7 }}>
            <Group justify="flex-end" gap="xl" wrap="wrap">
              <Stack gap={0} align="center"><Text size="xs" tt="uppercase" fw={700} style={{ color: 'rgba(255,255,255,0.7)' }}>Saúde SLA</Text><Text size="2.5rem" fw={900} c={globalStats.healthScore === 100 ? '#69db7c' : '#ffd43b'} lh={1}>{globalStats.healthScore}%</Text></Stack>
              <Divider orientation="vertical" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
              <Stack gap={0} align="center"><Text size="xs" tt="uppercase" fw={700} style={{ color: 'rgba(255,255,255,0.7)' }}>Planos Ativos</Text><Text size="2.5rem" fw={900} c="white" lh={1}>{globalStats.activePlans}</Text></Stack>
              <Divider orientation="vertical" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
              <Stack gap={0} align="center"><Text size="xs" tt="uppercase" fw={700} style={{ color: 'rgba(255,255,255,0.7)' }}>Pendências</Text><Text size="2.5rem" fw={900} c="#a5d8ff" lh={1}>{globalStats.totalPending}</Text></Stack>
              <Divider orientation="vertical" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
              <Stack gap={0} align="center"><Text size="xs" tt="uppercase" fw={700} style={{ color: 'rgba(255,255,255,0.7)' }}>Concluídas</Text><Text size="2.5rem" fw={900} c="#69db7c" lh={1}>{globalStats.totalDone}</Text></Stack>
            </Group>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* LISTAGEM DE PLANOS */}
      {filteredPlans.length === 0 ? (
        <Paper withBorder p="xl" radius="md" bg="transparent"><Center><Text c="dimmed">Nenhuma campanha encontrada.</Text></Center></Paper>
      ) : (
        filteredPlans.map(plan => (
          <Card key={plan.id} shadow="md" radius="lg" withBorder padding={0} style={{ overflow: 'visible', borderColor: plan.stats.progress === 100 ? 'teal' : (!plan.isOnTrack ? 'red' : '#e9ecef') }}>
            <Group justify="space-between" align="flex-start" p="xl" style={{ borderBottom: '1px solid #e9ecef', backgroundColor: plan.stats.progress === 100 ? '#f3faf6' : (!plan.isOnTrack ? '#fff5f5' : '#f8f9fa') }}>
              <Group gap="md">
                <ThemeIcon size={54} radius="md" variant="light" color={plan.stats.progress === 100 ? 'teal' : (!plan.isOnTrack ? 'red' : BRAND_BLUE)}>
                  {plan.stats.progress === 100 ? <IconCheck size={32} /> : <IconActivity size={32} />}
                </ThemeIcon>
                <div>
                  <Group align="center">
                    <Title order={3} fw={800} c="dark.7">{plan.name}</Title>
                    <Menu shadow="md" width={200} position="bottom-start">
                      <Menu.Target><ActionIcon variant="subtle" color="gray"><IconDotsVertical size={18} /></ActionIcon></Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Label>Ações</Menu.Label>
                        {/* 🟢 BOTÃO DE E-MAIL CONECTADO À API */}
                        <Menu.Item 
                          leftSection={<IconBellRinging size={14} />} 
                          onClick={async () => {
                            try {
                              await sendPlanReminder({ 
                                planName: plan.name, 
                                totalPending: plan.stats.pending, 
                                daysLeft: plan.daysLeft || 0 
                              });
                              alert(`E-mail de cobrança enviado com sucesso para a equipe sobre o plano: ${plan.name}`);
                            } catch (error) {
                              alert('Erro ao enviar e-mail. Verifique a conexão com o servidor SMTP.');
                            }
                          }}
                        >
                          Cobrar Equipe
                        </Menu.Item>
                        <Menu.Item 
                          leftSection={<IconDownload size={14} />}
                          onClick={() => window.print()}
                        >
                          Exportar PDF
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                  <Group gap="xs" mt={4}>
                    <Badge variant="dot" color={plan.stats.progress === 100 ? 'teal' : (!plan.isOnTrack ? 'red' : BRAND_BLUE)}>
                      {plan.stats.progress === 100 ? 'Finalizado' : (!plan.isOnTrack ? 'Atrasado' : 'Em Execução')}
                    </Badge>
                    <Text size="sm" c="dimmed" fw={500}>Início: {new Date(plan.startDate).toLocaleDateString('pt-BR')}</Text>
                  </Group>
                </div>
              </Group>

              <Group gap="xl" wrap="nowrap">
                {plan.daysLeft !== null && plan.stats.progress < 100 && (
                  <Paper p="sm" radius="md" withBorder bg={`${plan.urgencyColor}.0`} style={{ borderColor: `var(--mantine-color-${plan.urgencyColor}-2)` }}>
                    <Group gap="xs"><IconClock size={20} color={`var(--mantine-color-${plan.urgencyColor}-7)`} /><Stack gap={0}><Text size="xs" tt="uppercase" fw={800} c={`${plan.urgencyColor}.7`}>Prazo</Text><Text size="lg" fw={900} c={`${plan.urgencyColor}.9`} lh={1}>{plan.daysLeft < 0 ? `Atrasado ${Math.abs(plan.daysLeft)}d` : `${plan.daysLeft} Dias`}</Text></Stack></Group>
                  </Paper>
                )}
                <RingProgress size={90} thickness={8} roundCaps sections={[{ value: plan.stats.progress, color: plan.stats.progress === 100 ? 'teal' : BRAND_BLUE }]} label={<Text ta="center" size="sm" fw={800} c="dark.6">{plan.stats.progress}%</Text>} />
              </Group>
            </Group>

            <Box p="xl">
              <Tabs defaultValue="equipe" variant="pills" color={BRAND_BLUE} radius="md">
                <Tabs.List mb="lg">
                  <Tabs.Tab value="equipe" leftSection={<IconUsers size={16} />}>Ranking</Tabs.Tab>
                  <Tabs.Tab value="setores" leftSection={<IconBuildingStore size={16} />}>Gargalos</Tabs.Tab>
                  <Tabs.Tab value="tipos" leftSection={<IconDeviceDesktop size={16} />}>Dispositivos</Tabs.Tab>
                  <Tabs.Tab value="timeline" leftSection={<IconActivity size={16} />}>Live Feed</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="equipe"><SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                  {plan.leaderboard.map((tech, index) => (
                    <Paper key={tech.name} p="md" radius="md" withBorder>
                      <Group justify="space-between" mb="xs"><Group gap="xs"><Avatar color={tech.percent === 100 ? 'teal' : (index === 0 && tech.percent > 0 ? 'orange' : BRAND_BLUE)} radius="xl">{index === 0 && tech.percent > 0 ? <IconTrophy size={16} /> : tech.name.charAt(0).toUpperCase()}</Avatar><Text fw={700} size="sm" truncate w={100}>{tech.name}</Text></Group><Badge variant="light" color={BRAND_BLUE}>{tech.done}/{tech.total}</Badge></Group>
                      <Progress value={tech.percent} size="lg" radius="xl" color={tech.percent === 100 ? 'teal' : (index === 0 && tech.percent > 0 ? 'orange' : BRAND_BLUE)} /><Text size="xs" ta="right" mt={4} fw={800} c="dimmed">{tech.percent}%</Text>
                    </Paper>
                  ))}</SimpleGrid></Tabs.Panel>

                <Tabs.Panel value="setores"><SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                  {plan.sectors.map(sector => (
                    <Paper key={sector.name} p="md" radius="md" withBorder bg={sector.percent < 30 && sector.total > 0 ? 'red.0' : 'gray.0'}>
                      <Group justify="space-between" wrap="nowrap"><Text size="xs" tt="uppercase" fw={800} c={sector.percent < 30 && sector.total > 0 ? 'red.9' : 'dimmed'}>{sector.name}</Text>{sector.percent < 30 && sector.total > 0 && <IconFlame size={16} color="red" />}</Group>
                      <Group justify="space-between" mt={4}><Text size="lg" fw={900}>{sector.done}/{sector.total}</Text><Text size="sm" fw={800}>{sector.percent}%</Text></Group>
                      <Progress value={sector.percent} size="sm" color={sector.percent < 30 ? 'red' : BRAND_BLUE} />
                    </Paper>
                  ))}</SimpleGrid></Tabs.Panel>

                <Tabs.Panel value="tipos"><SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                  {plan.types.map(type => (
                    <Paper key={type.name} p="md" radius="md" withBorder><Text size="xs" tt="uppercase" fw={800} c="dimmed">{type.name}</Text><Group justify="space-between" mt={4}><Text size="lg" fw={900}>{type.done}/{type.total}</Text><Text size="sm" fw={800} c={BRAND_BLUE}>{type.percent}%</Text></Group><Progress value={type.percent} size="sm" color={BRAND_BLUE} /></Paper>
                  ))}</SimpleGrid></Tabs.Panel>

                <Tabs.Panel value="timeline" pt="md">
                  {plan.recentActivity.length === 0 ? <Text c="dimmed">Aguardando atividades...</Text> : (
                    <Timeline active={plan.recentActivity.length} bulletSize={24} lineWidth={2} color="teal">
                      {plan.recentActivity.map((act, i) => (
                        <Timeline.Item key={i} title={<Text fw={700} size="sm">{act.deviceName}</Text>} bullet={<IconCheck size={12} />}>
                          <Text c="dimmed" size="xs">Por <b>{act.techName}</b> em {act.doneDate.toLocaleDateString('pt-BR')}</Text>
                        </Timeline.Item>
                      ))}</Timeline>
                  )}
                </Tabs.Panel>
              </Tabs>
            </Box>
          </Card>
        ))
      )}
    </Stack>
  );
}