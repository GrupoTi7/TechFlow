import React, { useEffect, useState } from 'react';
import { 
  Title, Text, Card, Group, Stack, Progress, Badge, Loader, 
  Center, RingProgress, Paper, SimpleGrid, Divider, Tabs, 
  ThemeIcon, Grid, Avatar, TextInput, Menu, ActionIcon, Timeline, Tooltip, Button
} from '@mantine/core';
import { 
  IconTrophy, IconActivity, IconClock, IconBuildingStore, 
  IconDeviceDesktop, IconCheck, IconAlertCircle, IconUsers,
  IconSearch, IconDotsVertical, IconBellRinging, IconDownload, 
  IconFlame, IconHeartRateMonitor, IconSettings
} from '@tabler/icons-react';
import { getActionPlans } from '../services/api';

const BRAND_BLUE = '#0003d9';

export default function ActionPlanManagerPage() {
  const [plans, setPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Estatísticas Globais Nível Enterprise
  const [globalStats, setGlobalStats] = useState({ 
    totalPending: 0, 
    totalDone: 0, 
    activePlans: 0,
    healthScore: 100 // % de planos dentro do prazo
  });

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plansRaw = await getActionPlans();
        const plansData = Array.isArray(plansRaw) ? plansRaw : (plansRaw?.plans || plansRaw?.data || []);
        
        let gPending = 0;
        let gDone = 0;
        let onTrackPlans = 0;

        const enrichedPlans = plansData.map(plan => {
          const assignments = plan.assignments || [];
          const total = assignments.length;
          
          const planStartDate = new Date(plan.startDate || plan.createdAt || new Date());
          planStartDate.setHours(0, 0, 0, 0);

          // 1. Mapeamento de Conclusões e Linha do Tempo
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
              recentActivity.push({
                ...a,
                deviceName: deviceData.name || 'Dispositivo Desconhecido',
                techName: a.technician?.name || a.technicianName || 'Técnico',
                doneDate: doneDate
              });
            }
          });

          // Ordena atividades da mais recente para a mais antiga (Timeline)
          recentActivity.sort((a, b) => b.doneDate - a.doneDate);

          gPending += (total - completed.length);
          gDone += completed.length;

          // 2. Dissecação de Dados (Técnicos, Setores e Tipos)
          const techStats = {};
          const sectorStats = {};
          const typeStats = {};

          assignments.forEach(a => {
            const isDone = completed.includes(a);
            
            const tName = a.technician?.name || a.technician?.username || `Téc. ID: ${String(a.technicianId).substring(0,4)}`;
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

          // 3. Inteligência de Prazos e SLA
          let daysLeft = null;
          let urgencyColor = 'blue';
          let isOnTrack = true;

          if (plan.deadline) {
            const diffTime = new Date(plan.deadline).getTime() - new Date().getTime();
            daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (daysLeft < 0 && completed.length < total) {
              urgencyColor = 'red';
              isOnTrack = false; // Estourou o SLA
            } else if (daysLeft <= 3 && completed.length < total) {
              urgencyColor = 'orange';
            }
          }

          if (isOnTrack || completed.length === total) onTrackPlans++;

          return {
            ...plan,
            daysLeft,
            urgencyColor,
            isOnTrack,
            recentActivity: recentActivity.slice(0, 10), // Top 10 mais recentes
            stats: {
              total, done: completed.length, pending: total - completed.length,
              progress: total > 0 ? Math.round((completed.length / total) * 100) : 0
            },
            leaderboard: formatStats(techStats).reverse(), 
            sectors: formatStats(sectorStats),
            types: formatStats(typeStats)
          };
        });

        // Calcula a saúde geral da operação
        const health = enrichedPlans.length > 0 ? Math.round((onTrackPlans / enrichedPlans.length) * 100) : 100;

        setGlobalStats({ totalPending: gPending, totalDone: gDone, activePlans: enrichedPlans.length, healthScore: health });
        setPlans(enrichedPlans);
        setFilteredPlans(enrichedPlans);
      } catch (error) { console.error('Erro ao carregar Torre de Controle:', error); } 
      finally { setLoading(false); }
    };
    
    fetchPlans();
  }, []);

  // Motor de Busca em Tempo Real
  useEffect(() => {
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = plans.filter(p => p.name.toLowerCase().includes(lowerQuery));
    setFilteredPlans(filtered);
  }, [searchQuery, plans]);

  if (loading) return <Center h={400}><Loader color={BRAND_BLUE} size="xl" type="bars" /></Center>;

  return (
    <Stack gap="xl" pb="xl">
      {/* 🟢 CABEÇALHO ENTERPRISE COM SLA E SEARCH */}
      <Paper p="xl" radius="lg" bg="dark.9" c="white" style={{ overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 250, height: 250, background: globalStats.healthScore < 50 ? 'red' : BRAND_BLUE, borderRadius: '50%', filter: 'blur(100px)', opacity: 0.3, transition: 'background 0.5s' }}></div>
        <Grid align="center" gutter="xl">
          <Grid.Col span={{ base: 12, lg: 5 }}>
            <Group gap="sm">
              <ThemeIcon size={42} radius="md" variant="light" color={globalStats.healthScore === 100 ? 'teal' : (globalStats.healthScore < 50 ? 'red' : 'orange')}>
                <IconHeartRateMonitor size={26} />
              </ThemeIcon>
              <div>
                <Title order={2} fw={900} style={{ letterSpacing: '-1px' }}>Command Center</Title>
                <Text c="dimmed" mt={-4} size="sm">Visão global e preditiva de manutenções.</Text>
              </div>
            </Group>
            <TextInput 
              mt="lg"
              placeholder="Pesquisar campanha pelo nome..." 
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              styles={{ input: { backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' } }}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 7 }}>
            <Group justify="flex-end" gap="xl" wrap="wrap">
              <Stack gap={0} align="center">
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Saúde SLA</Text>
                <Text size="2.5rem" fw={900} c={globalStats.healthScore === 100 ? 'teal.4' : (globalStats.healthScore < 50 ? 'red.4' : 'orange.4')} lh={1}>{globalStats.healthScore}%</Text>
              </Stack>
              <Divider orientation="vertical" color="dark.6" />
              <Stack gap={0} align="center">
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Planos Ativos</Text>
                <Text size="2.5rem" fw={900} c="white" lh={1}>{globalStats.activePlans}</Text>
              </Stack>
              <Divider orientation="vertical" color="dark.6" />
              <Stack gap={0} align="center">
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Pendências</Text>
                <Text size="2.5rem" fw={900} c="blue.4" lh={1}>{globalStats.totalPending}</Text>
              </Stack>
              <Divider orientation="vertical" color="dark.6" />
              <Stack gap={0} align="center">
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Concluídas</Text>
                <Text size="2.5rem" fw={900} c="teal.4" lh={1}>{globalStats.totalDone}</Text>
              </Stack>
            </Group>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* 🟢 LISTAGEM INTELIGENTE DE PLANOS */}
      {filteredPlans.length === 0 ? (
        <Paper withBorder p="xl" radius="md" bg="transparent"><Center><Text c="dimmed">Nenhuma campanha encontrada.</Text></Center></Paper>
      ) : (
        filteredPlans.map(plan => (
          <Card key={plan.id} shadow="md" radius="lg" withBorder padding={0} style={{ overflow: 'visible', borderColor: plan.stats.progress === 100 ? 'var(--mantine-color-teal-3)' : (!plan.isOnTrack ? 'var(--mantine-color-red-3)' : '#e9ecef') }}>
            
            {/* CABEÇALHO DO PLANO COM QUICK ACTIONS */}
            <Group justify="space-between" align="flex-start" p="xl" style={{ borderBottom: '1px solid #e9ecef', backgroundColor: plan.stats.progress === 100 ? '#f3faf6' : (!plan.isOnTrack ? '#fff5f5' : '#f8f9fa') }}>
              <Group gap="md" style={{ flex: 1 }}>
                <ThemeIcon size={54} radius="md" variant="light" color={plan.stats.progress === 100 ? 'teal' : (!plan.isOnTrack ? 'red' : BRAND_BLUE)}>
                  {plan.stats.progress === 100 ? <IconCheck size={32} /> : (!plan.isOnTrack ? <IconAlertCircle size={32} /> : <IconActivity size={32} />)}
                </ThemeIcon>
                <div>
                  <Group align="center">
                    <Title order={3} fw={800} c="dark.7">{plan.name}</Title>
                    {/* QUICK ACTIONS MENU */}
                    <Menu shadow="md" width={200} position="bottom-start">
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray"><IconDotsVertical size={18} /></ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Label>Ações Gerenciais</Menu.Label>
                        <Menu.Item leftSection={<IconBellRinging size={14} />}>Cobrar Equipe</Menu.Item>
                        <Menu.Item leftSection={<IconDownload size={14} />}>Exportar Relatório PDF</Menu.Item>
                        <Menu.Divider />
                        <Menu.Item color="red" leftSection={<IconSettings size={14} />}>Forçar Conclusão</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                  <Group gap="xs" mt={4}>
                    <Badge variant="dot" color={plan.stats.progress === 100 ? 'teal' : (!plan.isOnTrack ? 'red' : BRAND_BLUE)}>
                      {plan.stats.progress === 100 ? 'Finalizado' : (!plan.isOnTrack ? 'Atrasado (SLA Quebrado)' : 'Em Execução')}
                    </Badge>
                    <Text size="sm" c="dimmed" fw={500}>Início: {new Date(plan.startDate).toLocaleDateString('pt-BR')}</Text>
                  </Group>
                </div>
              </Group>

              <Group gap="xl" wrap="nowrap" align="center">
                {plan.daysLeft !== null && plan.stats.progress < 100 && (
                  <Paper p="sm" radius="md" withBorder bg={`${plan.urgencyColor}.0`} style={{ borderColor: `var(--mantine-color-${plan.urgencyColor}-2)` }}>
                    <Group gap="xs">
                      <IconClock size={20} color={`var(--mantine-color-${plan.urgencyColor}-7)`} />
                      <Stack gap={0}>
                        <Text size="xs" tt="uppercase" fw={800} c={`${plan.urgencyColor}.7`}>Prazo Restante</Text>
                        <Text size="lg" fw={900} c={`${plan.urgencyColor}.9`} lh={1}>
                          {plan.daysLeft < 0 ? `Atrasado ${Math.abs(plan.daysLeft)}d` : `${plan.daysLeft} Dias`}
                        </Text>
                      </Stack>
                    </Group>
                  </Paper>
                )}
                
                <RingProgress
                  size={90} thickness={8} roundCaps
                  sections={[{ value: plan.stats.progress, color: plan.stats.progress === 100 ? 'teal' : (!plan.isOnTrack ? 'red' : BRAND_BLUE) }]}
                  label={<Text ta="center" size="sm" fw={800} c="dark.6">{plan.stats.progress}%</Text>}
                />
              </Group>
            </Group>

            {/* CORPO DO PLANO COM ABAS */}
            <Box p="xl">
              <Tabs defaultValue="equipe" variant="pills" color={BRAND_BLUE} radius="md">
                <Tabs.List mb="lg">
                  <Tabs.Tab value="equipe" leftSection={<IconUsers size={16} />}>Ranking da Equipe</Tabs.Tab>
                  <Tabs.Tab value="setores" leftSection={<IconBuildingStore size={16} />}>Gargalos por Setor</Tabs.Tab>
                  <Tabs.Tab value="tipos" leftSection={<IconDeviceDesktop size={16} />}>Ativos Físicos</Tabs.Tab>
                  <Tabs.Tab value="timeline" leftSection={<IconActivity size={16} />}>Live Feed</Tabs.Tab>
                </Tabs.List>

                {/* ABA 1: EQUIPE */}
                <Tabs.Panel value="equipe">
                  <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
                    {plan.leaderboard.map((tech, index) => (
                      <Paper key={tech.name} p="md" radius="md" withBorder style={{ transition: 'all 0.2s', borderColor: tech.percent === 100 ? 'var(--mantine-color-teal-3)' : '#e9ecef' }}>
                        <Group justify="space-between" mb="xs">
                          <Group gap="sm">
                            <Avatar color={index === 0 && tech.percent > 0 ? 'orange' : (tech.percent === 100 ? 'teal' : BRAND_BLUE)} radius="xl">
                              {index === 0 && tech.percent > 0 ? <IconTrophy size={18} /> : tech.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Text fw={700} c="dark.7" truncate w={120}>{tech.name}</Text>
                          </Group>
                          <Badge variant="light" size="lg" color={tech.percent === 100 ? 'teal' : BRAND_BLUE}>
                            {tech.done} / {tech.total}
                          </Badge>
                        </Group>
                        <Group gap="sm" grow>
                          <Progress value={tech.percent} size="xl" radius="xl" animated={tech.percent > 0 && tech.percent < 100} color={tech.percent === 100 ? 'teal' : (index === 0 && tech.percent > 0 ? 'orange' : BRAND_BLUE)} />
                          <Text size="sm" fw={800} c="dimmed" style={{ flex: '0 0 40px', textAlign: 'right' }}>{tech.percent}%</Text>
                        </Group>
                      </Paper>
                    ))}
                  </SimpleGrid>
                </Tabs.Panel>

                {/* ABA 2: SETORES */}
                <Tabs.Panel value="setores">
                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                    {plan.sectors.map(sector => (
                      <Paper key={sector.name} p="md" radius="md" withBorder bg={sector.percent < 30 ? 'red.0' : 'gray.0'} style={{ borderColor: sector.percent < 30 ? 'var(--mantine-color-red-2)' : '#e9ecef' }}>
                        <Group justify="space-between" align="flex-start" wrap="nowrap">
                          <Text size="sm" tt="uppercase" fw={800} c={sector.percent < 30 ? 'red.9' : 'dimmed'} truncate>{sector.name}</Text>
                          {sector.percent < 30 && sector.total > 0 && <Tooltip label="Setor Crítico (Gargalo)"><IconFlame size={18} color="red" /></Tooltip>}
                        </Group>
                        <Group justify="space-between" mt={8} mb={8}>
                          <Text size="xl" fw={900} c="dark.6">{sector.done} <Text component="span" size="sm" c="dimmed" fw={500}>/ {sector.total}</Text></Text>
                          <Text size="md" fw={800} c={sector.percent < 30 ? 'red' : (sector.percent === 100 ? 'teal' : BRAND_BLUE)}>{sector.percent}%</Text>
                        </Group>
                        <Progress value={sector.percent} size="md" color={sector.percent < 30 ? 'red' : (sector.percent === 100 ? 'teal' : BRAND_BLUE)} />
                      </Paper>
                    ))}
                  </SimpleGrid>
                </Tabs.Panel>

                {/* ABA 3: TIPOS */}
                <Tabs.Panel value="tipos">
                  <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                    {plan.types.map(type => (
                      <Paper key={type.name} p="md" radius="md" withBorder bg="gray.0">
                        <Text size="sm" tt="uppercase" fw={800} c="dimmed" truncate>{type.name}</Text>
                        <Group justify="space-between" mt={8} mb={8}>
                          <Text size="xl" fw={900} c="dark.6">{type.done} <Text component="span" size="sm" c="dimmed" fw={500}>/ {type.total}</Text></Text>
                          <Text size="md" fw={800} c={type.percent === 100 ? 'teal' : BRAND_BLUE}>{type.percent}%</Text>
                        </Group>
                        <Progress value={type.percent} size="md" color={type.percent === 100 ? 'teal' : BRAND_BLUE} />
                      </Paper>
                    ))}
                  </SimpleGrid>
                </Tabs.Panel>

                {/* ABA 4: TIMELINE / LIVE FEED */}
                <Tabs.Panel value="timeline" pt="md">
                  {plan.recentActivity.length === 0 ? (
                    <Text c="dimmed">Nenhuma máquina finalizada ainda.</Text>
                  ) : (
                    <Timeline active={plan.recentActivity.length} bulletSize={28} lineWidth={2} color="teal">
                      {plan.recentActivity.map((act, i) => (
                        <Timeline.Item key={i} title={<Text fw={700} c="dark.7">{act.deviceName}</Text>} bullet={<IconCheck size={14} />}>
                          <Text c="dimmed" size="sm">Preventiva finalizada por <b>{act.techName}</b>.</Text>
                          <Text size="xs" mt={4} fw={600} c="blue.4">
                            {act.doneDate.toLocaleDateString('pt-BR')} às {act.doneDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  )}
                  {plan.recentActivity.length === 10 && <Text size="xs" c="dimmed" mt="lg" fs="italic">* Exibindo apenas as 10 últimas atividades.</Text>}
                </Tabs.Panel>

              </Tabs>
            </Box>
          </Card>
        ))
      )}
    </Stack>
  );
}