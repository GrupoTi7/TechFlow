import React, { useEffect, useState } from 'react';
import { 
  Paper, Text, Group, Stack, ThemeIcon, Badge, 
  Loader, Button, Avatar, SimpleGrid, Divider, SegmentedControl, Modal, Alert, Center
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconBuildingFactory, 
  IconDeviceDesktop, IconArrowRight, IconList, 
  IconClipboardList, IconCalendar
} from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router-dom';
import { getActionPlanData, startAgideskTicket } from '../services/api'; 

const BRAND_BLUE = '#0003d9';

// ============================================================================
// 1. COMPONENTE CARD (WIDGET)
// ============================================================================
const DeviceCardWidget = ({ device, index, onStart }) => {
    const isPriority = device.priority === 'ALTA';
    const [loading, setLoading] = useState(false);

    const handleStartClick = async () => {
        setLoading(true);
        await onStart(device.id); 
        setLoading(false);
    };

    return (
        <Paper shadow="sm" p="lg" radius="md" withBorder bg={isPriority ? '#fff5f5' : 'white'} style={{ borderColor: isPriority ? '#ffc9c9' : '#e9ecef', borderWidth: isPriority ? '2px' : '1px' }}>
            <Group justify="space-between" align="flex-start" wrap="nowrap" mb="sm">
                <Group gap="md">
                    <ThemeIcon color={isPriority ? 'red' : BRAND_BLUE} variant={isPriority ? 'filled' : 'light'} size={42} radius="md">
                        {isPriority ? <IconBuildingFactory size={26} /> : <IconDeviceDesktop size={26} />}
                    </ThemeIcon>
                    <div style={{ overflow: 'hidden' }}>
                        <Text fw={700} size="lg" truncate>{index + 1}. {device.name}</Text>
                        <Group gap={6} mt={4}>
                            <Badge size="sm" color={isPriority ? 'red' : 'gray'} variant="light">{device.setor || 'S/ Setor'}</Badge>
                            {isPriority && <Badge size="sm" color="red" variant="filled">PRIORIDADE</Badge>}
                        </Group>
                    </div>
                </Group>
            </Group>
            <Divider my="md" color={isPriority ? 'red.1' : 'gray.2'} />
            <Group justify="space-between" align="center">
                <Text size="sm" c="dimmed">
                    Última: <b>{device.lastPreventive ? new Date(device.lastPreventive).toLocaleDateString() : 'Nunca'}</b>
                </Text>
                
                <Button onClick={handleStartClick} loading={loading} rightSection={!loading && <IconArrowRight size={18} />} variant={isPriority ? "filled" : "light"} color={isPriority ? "red" : BRAND_BLUE} size="sm">
                    Iniciar
                </Button>
            </Group>
        </Paper>
    );
};

// ============================================================================
// 2. COMPONENTE LINHA (MODAL)
// ============================================================================
const ModernDeviceRow = ({ device, index, onClose, onStart }) => {
    const isPriority = device.priority === 'ALTA';
    const statusColor = isPriority ? 'red' : BRAND_BLUE; 
    const [loading, setLoading] = useState(false);

    const handleStartClick = async () => {
        setLoading(true);
        await onStart(device.id);
        setLoading(false);
        onClose(); 
    };

    return (
      <Paper p="md" radius="md" withBorder style={{ borderLeft: `6px solid ${isPriority ? 'var(--mantine-color-red-filled)' : BRAND_BLUE}`, cursor: 'default' }}>
        <Group justify="space-between" wrap="nowrap" align="center">
          <Group gap="md" style={{ flex: 1, minWidth: 0 }}>
            <ThemeIcon color={statusColor} variant="light" size={48} radius="xl">
                {isPriority ? <IconBuildingFactory size={28} /> : <IconDeviceDesktop size={28} />}
            </ThemeIcon>
            <Stack gap={2} style={{ overflow: 'hidden' }}>
               <Text size="md" c="dimmed" fw={500}>#{index + 1}</Text>
               <Text fw={800} size="lg" truncate title={device.name}>{device.name}</Text>
            </Stack>
          </Group>
          <Button onClick={handleStartClick} loading={loading} rightSection={!loading && <IconArrowRight size={20} />} variant="light" color={statusColor} size="md" radius="md">
              Iniciar
          </Button>
        </Group>
      </Paper>
    );
};

// ============================================================================
// 3. WIDGET PRINCIPAL
// ============================================================================
const ActionPlanWidget = () => {
  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [viewMode, setViewMode] = useState('diaria'); 
  const [opened, { open, close }] = useDisclosure(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
    
    getActionPlanData()
        .then(data => {
            if (data && data.name) setPlanData(data);
            else setPlanData(null);
        })
        .catch(err => console.error("Erro ao carregar plano:", err))
        .finally(() => setLoading(false));
  }, []);

  const handleStartDevice = async (deviceId) => {
      try {
          await startAgideskTicket(deviceId);
          navigate(`/devices/${deviceId}`);
      } catch (error) {
          alert("Atenção: Não foi possível integrar com o Agidesk no momento.");
          navigate(`/devices/${deviceId}`);
      }
  };

  if (loading) return <Paper p="md" withBorder><Center h={100}><Loader size="sm" /></Center></Paper>;
  if (!currentUser) return null;

  if (!planData) {
      return (
        <Paper shadow="sm" p="xl" radius="md" withBorder bg="gray.0" mb="xl" mt="xl">
            <Center>
                <Stack align="center" gap="xs">
                    <ThemeIcon size={60} radius="xl" color="gray" variant="light"><IconClipboardList size={32} /></ThemeIcon>
                    <Text size="lg" fw={700} c="dimmed">Nenhum Plano Ativo</Text>
                    <Text size="sm" c="dimmed" ta="center" maw={400}>Você não possui tarefas pendentes. Aguarde um novo ciclo ou crie um plano.</Text>
                    <Button variant="outline" color="dark" mt="md" onClick={() => navigate('/services')}>Gerenciar Planos</Button>
                </Stack>
            </Center>
        </Paper>
      );
  }
  
  const viewLimits = {
    diaria: { label: 'Sua Meta Diária', total: planData.stats?.dailyGoal || 0 },
    semanal: { label: 'Sua Meta Semanal', total: planData.stats?.weeklyGoal || 0 },
    tudo: { label: 'Seu Total Pendente', total: planData.stats?.totalPending || 0 }
  };

  const currentView = viewLimits[viewMode];
  const allAssignments = planData.assignments || [];
  const WIDGET_DISPLAY_LIMIT = 4;
  const previewList = allAssignments.slice(0, WIDGET_DISPLAY_LIMIT);
  const remainingCount = currentView.total - previewList.length;
  const showButton = remainingCount > 0;

  return (
    <>
        <Modal opened={opened} onClose={close} size="80%" radius="md" padding="xl" title={<Text size="xl" fw={700} c={BRAND_BLUE}>Sua Lista: {planData.name}</Text>}>
            <Stack gap="md">
                {allAssignments.map((device, index) => (
                    <ModernDeviceRow key={device.id} device={device} index={index} onClose={close} onStart={handleStartDevice} />
                ))}
            </Stack>
        </Modal>

        <Stack gap="lg" mb="xl" mt="xl">
            <Paper shadow="xs" p="xl" radius="md" style={{ borderLeft: `6px solid ${BRAND_BLUE}`, backgroundColor: '#fff' }}>
                <Group justify="space-between" align="center" wrap="wrap">
                    <Group>
                        <Avatar color={BRAND_BLUE} radius="xl" size="lg">{currentUser.name?.charAt(0).toUpperCase()}</Avatar>
                        <div>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>PLANO EM ANDAMENTO</Text>
                            <Text size="xl" fw={800} c="dark.4" lh={1.2}>{planData.name}</Text>
                            <Group gap="sm" mt={8}>
                                <Text size="sm" c="dimmed" style={{ display: 'flex', alignItems: 'center' }}>Total Atribuído a Você: <b style={{ marginLeft: 4 }}>{planData.stats.totalPending} dispositivos</b></Text>
                                <Divider orientation="vertical" />
                                {planData.stats.estimatedEndDate ? (
                                    <Badge size="md" variant="light" color="teal" leftSection={<IconCalendar size={14} style={{ marginTop: 2 }} />} style={{ textTransform: 'none' }}>
                                        Previsão de Conclusão: <b>{new Date(planData.stats.estimatedEndDate).toLocaleDateString('pt-BR')}</b>
                                    </Badge>
                                ) : (
                                    <Badge size="md" variant="light" color="gray" leftSection={<IconCalendar size={14} style={{ marginTop: 2 }} />} style={{ textTransform: 'none' }}>
                                        Previsão de Conclusão: <b>Não definido</b>
                                    </Badge>
                                )}
                            </Group>
                        </div>
                    </Group>

                    <Group gap="xl" align="center">
                        <SegmentedControl value={viewMode} onChange={setViewMode} data={[{ label: 'Hoje', value: 'diaria' }, { label: 'Semana', value: 'semanal' }, { label: 'Todos', value: 'tudo' }]} color={BRAND_BLUE} radius="md" />
                        <div style={{ textAlign: 'right', minWidth: '120px' }}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{currentView.label}</Text>
                            <Text fw={900} size="2.6rem" lh={1} c={BRAND_BLUE}>{currentView.total}</Text>
                        </div>
                    </Group>
                </Group>
            </Paper>

            <Group justify="space-between" align="center">
                <Text size="md" fw={700} c="dimmed" tt="uppercase">Fila de Atendimento (Próximos)</Text>
                <Badge variant="light" color={BRAND_BLUE}>Mostrando {previewList.length}</Badge>
            </Group>
            
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                {previewList.map((device, index) => (
                    <DeviceCardWidget key={device.id} device={device} index={index} onStart={handleStartDevice} />
                ))}
            </SimpleGrid>

            {showButton && (
                <Button variant="outline" color={BRAND_BLUE} fullWidth mt="md" size="lg" leftSection={<IconList size={24} />} onClick={open}>
                    {viewMode === 'tudo' ? `Ver lista completa (+${planData.stats.totalPending - previewList.length} itens)` : `Ver restante da ${currentView.label} (+${remainingCount} itens)`}
                </Button>
            )}
        </Stack>
    </>
  );
};

export default ActionPlanWidget;