import React, { useEffect, useState } from 'react';
import { 
  Paper, Text, Group, Stack, ThemeIcon, Badge, 
  Loader, Button, Avatar, SimpleGrid, Divider, SegmentedControl, Modal, Center, Select
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconBuildingFactory, 
  IconDeviceDesktop, IconArrowRight, IconList, 
  IconClipboardList, IconCalendar, IconCheck // 🟢 Adicionado IconCheck
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

import { 
  getActionPlanData, 
  startAgideskTicket, 
  playAgideskTicket, 
  getActionPlans, 
  updateDeviceTicketInDb 
} from '../services/api'; 

const BRAND_BLUE = '#0003d9';

const DeviceCardWidget = ({ device, index, onStart }) => {
    const isPriority = device.priority === 'ALTA';
    const [loading, setLoading] = useState(false);

    const handleStartClick = async () => {
        setLoading(true);
        await onStart(device); 
        setLoading(false);
    };

    return (
        <Paper shadow="sm" p="lg" radius="md" withBorder bg={isPriority ? '#fff5f5' : 'white'} style={{ borderColor: isPriority ? '#ffc9c9' : '#e9ecef', borderWidth: isPriority ? '2px' : '1px' }}>
            <Group justify="space-between" align="flex-start" wrap="nowrap" mb="sm">
                <Group gap="md" style={{ flex: 1, minWidth: 0 }}>
                    <ThemeIcon color={isPriority ? 'red' : BRAND_BLUE} variant={isPriority ? 'filled' : 'light'} size={42} radius="md">
                        {isPriority ? <IconBuildingFactory size={26} /> : <IconDeviceDesktop size={26} />}
                    </ThemeIcon>
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                        <Text fw={700} size="lg" truncate>{index + 1}. {device.name}</Text>
                        <Group gap={6} mt={4}>
                            <Badge size="sm" color={isPriority ? 'red' : 'gray'} variant="light">{device.setor || 'S/ Setor'}</Badge>
                            {isPriority && <Badge size="sm" color="red" variant="filled">PRIORIDADE</Badge>}
                        </Group>
                    </div>
                </Group>
            </Group>
            <Divider my="md" color={isPriority ? 'red.1' : 'gray.2'} />
            <Group justify="space-between" align="center" wrap="wrap">
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

const ModernDeviceRow = ({ device, index, onClose, onStart }) => {
    const isPriority = device.priority === 'ALTA';
    const statusColor = isPriority ? 'red' : BRAND_BLUE; 
    const [loading, setLoading] = useState(false);

    const handleStartClick = async () => {
        setLoading(true);
        await onStart(device);
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

const ActionPlanWidget = () => {
  const [loading, setLoading] = useState(true);
  
  // States para o Modal de Ações
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [deviceToAction, setDeviceToAction] = useState(null);

  const [allPlans, setAllPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [viewMode, setViewMode] = useState('diaria'); 
  const [opened, { open, close }] = useDisclosure(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const userObj = storedUser ? JSON.parse(storedUser) : null;
    setCurrentUser(userObj);
    
    const fetchData = async () => {
        try {
            const isGestorUser = userObj?.role === 'ADMIN' || userObj?.username === 'vinicius.izidoro';

            let plansRaw = [];
            if (isGestorUser) {
                const response = await getActionPlans();
                plansRaw = Array.isArray(response) ? response : (response?.plans || response?.data || []);
            } else {
                const response = await getActionPlanData();
                plansRaw = Array.isArray(response) ? response : (response ? [response] : []);
            }
            
            const formattedPlans = plansRaw.map(p => {
                const dataInicio = p.startDate || p.createdAt || new Date();
                
                // 🟢 O AJUSTE ESTÁ AQUI: 
                // Primeiro "achatamos" o objeto device para que o 'name' e 'setorName' 
                // fiquem disponíveis diretamente no nível principal da atribuição.
                const allAssignmentsFlattened = (p.assignments || []).map(a => {
                    if (a.device) {
                        return { 
                            ...a, 
                            ...a.device, 
                            setor: a.device.setorName || a.device.setor || 'S/ Setor' 
                        };
                    }
                    return a;
                });

                // Agora filtramos apenas o que é do técnico logado
                const myAssignments = allAssignmentsFlattened.filter(a => 
                    String(a.technicianId) === String(userObj.id)
                );

                // Aplicamos o filtro para esconder as que já foram feitas
                const pendingOnly = myAssignments.filter(a => {
                    const lastPrevStr = a.lastPreventiveDate || a.lastPreventive;
                    if (lastPrevStr) {
                        const prevDate = new Date(lastPrevStr);
                        const planStart = new Date(dataInicio);
                        prevDate.setHours(0,0,0,0);
                        planStart.setHours(0,0,0,0);
                        if (prevDate >= planStart) return false;
                    }
                    return true;
                });

                return {
                    id: p.id || p.planId,
                    name: p.name,
                    startDate: p.startDate,
                    deadline: p.deadline || p.stats?.estimatedEndDate,
                    stats: { ...p.stats, totalPending: pendingOnly.length },
                    assignments: pendingOnly 
                };
            }).filter(p => p.assignments.length > 0);

            setAllPlans(formattedPlans);
            if (formattedPlans.length > 0) setSelectedPlanId(String(formattedPlans[0].id));
            
        } catch (err) {
            console.error("Erro ao carregar planos:", err);
            setAllPlans([]);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []); 

  // 🟢 FUNÇÃO 1: Decide se abre o Modal (Switch/AP) ou vai direto (PC/Notebook)
  const handleStartDeviceClick = (device) => {
      const tipoCorreto = (device.deviceType || device.type || '').toLowerCase();
      const isInfra = tipoCorreto.match(/switch|ap|wifi/);

      if (isInfra) {
          setDeviceToAction(device);
          setActionModalOpen(true);
      } else {
          executeTicketCreation(device, 'Preventiva');
      }
  };

  // 🟢 FUNÇÃO 2: Disparada pelo Modal após escolher a Ação
  const confirmStartAction = (actionType) => {
      setActionModalOpen(false);
      if (deviceToAction) {
          executeTicketCreation(deviceToAction, actionType);
      }
  };

  // 🟢 FUNÇÃO 3: O motor que faz a integração com a API
  const executeTicketCreation = async (device, actionType) => {
      const agideskTab = window.open('about:blank', '_blank');
      
      try {
          const tipoCorreto = device.deviceType || device.type || 'Desktop';
          const ipCorreto = device.ipAddress || device.ip || 'Não informado';

          const response = await startAgideskTicket({
              deviceName: device.name,
              deviceType: tipoCorreto, 
              techIdentifier: currentUser.email || currentUser.username,
              deviceSector: device.setor || device.setorName || (device.device && (device.device.setor || device.device.setorName)) || 'Não informado',
              ipAddress: ipCorreto,
              actionType: actionType 
          });

          if (response && response.ticketId) {
              try { await playAgideskTicket(response.ticketId); } catch (playErr) {}
              await updateDeviceTicketInDb(device.id, response.ticketId);
              agideskTab.location.href = response.url;
          } else {
              agideskTab.close(); 
          }
          navigate(`/devices/${device.id}`);
          
      } catch (error) {
          console.error("Erro ao integrar Agidesk:", error);
          if (agideskTab) agideskTab.close(); 
          alert("Aviso: O atendimento no Agidesk não pôde ser criado automaticamente.");
          navigate(`/devices/${device.id}`);
      }
  };

  if (loading) return <Paper p="md" withBorder><Center h={100}><Loader size="sm" /></Center></Paper>;
  if (!currentUser) return null;

  const planData = allPlans.find(p => String(p.id) === String(selectedPlanId));

  if (!planData || !planData.assignments || planData.assignments.length === 0) {
      return (
        <Paper shadow="sm" p="xl" radius="md" withBorder bg="gray.0" mb="xl" mt="xl">
            <Center>
                <Stack align="center" gap="xs">
                    <ThemeIcon size={60} radius="xl" color="gray" variant="light"><IconClipboardList size={32} /></ThemeIcon>
                    <Text size="lg" fw={700} c="dimmed">Fila de Atendimento Livre</Text>
                    <Text size="sm" c="dimmed" ta="center" maw={400}>Você não possui nenhum plano de ação com máquinas pendentes no momento.</Text>
                    {(currentUser?.role === 'ADMIN' || currentUser?.username === 'vinicius.izidoro') && (
                        <Button variant="outline" color="dark" mt="md" onClick={() => navigate('/services')}>Gerenciar Planos</Button>
                    )}
                </Stack>
            </Center>
        </Paper>
      );
  }
  
  // =======================================================================
  // 🟢 INÍCIO DO FILTRO VISUAL SEGURO
  // =======================================================================
  
  const planStartDate = new Date(planData.startDate || new Date());
  planStartDate.setHours(0, 0, 0, 0); 

  const filteredAssignments = (planData.assignments || []).filter(assignment => {
      const deviceData = assignment.device || assignment;
      const status = String(assignment.status || '').toUpperCase();
      
      // Regra 1: Removido pelo Backend (via status)
      if (['COMPLETED', 'CONCLUIDO', 'FINALIZADO', 'DONE'].includes(status)) return false;
      
      // Regra 2: Filtrado no Frontend (A preventiva ocorreu DEPOIS que o plano começou?)
      const lastPrevStr = deviceData.lastPreventiveDate || deviceData.lastPreventive;
      if (lastPrevStr) {
          const prevDate = new Date(lastPrevStr);
          prevDate.setHours(0, 0, 0, 0);
          if (prevDate >= planStartDate) return false; 
      }
      return true; // Máquina continua pendente
  });

  const pendentes = filteredAssignments.length;

  // Se o filtro ocultou todas as máquinas, a campanha acabou com sucesso!
  if (pendentes === 0) {
      return (
        <Paper shadow="sm" p="xl" radius="md" withBorder bg="teal.0" mb="xl" mt="xl">
            <Center>
                <Stack align="center" gap="xs">
                    <ThemeIcon size={60} radius="xl" color="teal" variant="light"><IconCheck size={32} /></ThemeIcon>
                    <Text size="lg" fw={700} c="teal.9">Plano Concluído!</Text>
                    <Text size="sm" c="teal.8" ta="center" maw={400}>Excelente trabalho! Todas as máquinas deste plano já receberam manutenção preventiva.</Text>
                    {(currentUser?.role === 'ADMIN' || currentUser?.username === 'vinicius.izidoro') && (
                        <Button variant="outline" color="teal" mt="md" onClick={() => navigate('/services')}>Gerenciar Planos</Button>
                    )}
                </Stack>
            </Center>
        </Paper>
      );
  }

  // =======================================================================
  // 🟢 FIM DO FILTRO VISUAL SEGURO
  // =======================================================================

  const metaDiariaReal = planData.stats?.dailyGoal || 4;
const metaSemanalReal = planData.stats?.weeklyGoal || (metaDiariaReal * 5);
const dataFimReal = planData.stats?.estimatedEndDate ? new Date(planData.stats.estimatedEndDate) : null;

  const viewLimits = {
    diaria: { label: 'Meta Diária', total: metaDiariaReal },
    semanal: { label: 'Meta Semanal', total: metaSemanalReal },
    mensal: { label: 'Meta Mensal', total: pendentes }
  };

  const segmentOptions = [ { label: 'Hoje', value: 'diaria' }, { label: 'Semana', value: 'semanal' } ];
  if (pendentes > metaSemanalReal) segmentOptions.push({ label: 'Mensal', value: 'mensal' });

  const currentView = viewLimits[viewMode] || viewLimits['diaria'];
  
  // 🟢 Usando a lista filtrada em vez da lista crua do Backend
  const allAssignments = filteredAssignments;
  
  const WIDGET_DISPLAY_LIMIT = 4;
  const previewList = allAssignments.slice(0, WIDGET_DISPLAY_LIMIT);

  return (
    <>
        {/* MODAL DE ESCOLHA DE AÇÃO (SÓ ABRE PARA SWITCH/AP) */}
        <Modal opened={actionModalOpen} onClose={() => setActionModalOpen(false)} title={<Text fw={900} size="lg">Selecione o Tipo de Atendimento</Text>} centered>
            <Stack gap="md">
                <Text size="sm" c="dimmed">Qual ação você deseja registrar para o equipamento <Text component="span" fw={700} c="dark">{deviceToAction?.name}</Text>?</Text>
                <Group grow>
                    <Button size="md" color="blue" variant="light" onClick={() => confirmStartAction('Preventiva')}>Preventiva</Button>
                    <Button size="md" color="teal" variant="light" onClick={() => confirmStartAction('Verificação')}>Verificação</Button>
                    <Button size="md" color="gray" variant="light" onClick={() => confirmStartAction('Outros')}>Outros</Button>
                </Group>
            </Stack>
        </Modal>

        <Modal opened={opened} onClose={close} size="80%" radius="md" padding="xl" title={<Text size="xl" fw={700} c={BRAND_BLUE}>Fila Completa: {planData.name}</Text>}>
            <Stack gap="md">
                {allAssignments.map((device, index) => (
                    <ModernDeviceRow key={device.id || index} device={device} index={index} onClose={close} onStart={handleStartDeviceClick} />
                ))}
            </Stack>
        </Modal>

        <Stack gap="lg" mb="xl" mt="xl">
            <Paper shadow="xs" p="xl" radius="md" style={{ borderLeft: `6px solid ${BRAND_BLUE}`, backgroundColor: '#fff' }}>
                <Group justify="space-between" align="center" wrap="wrap" gap="xl">
                    <Group wrap="nowrap" style={{ flex: '1 1 300px', minWidth: 0 }}>
                        <Avatar color={BRAND_BLUE} radius="xl" size="lg">{currentUser.name?.charAt(0).toUpperCase()}</Avatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700} truncate>PLANO EM ANDAMENTO</Text>
                            
                            {allPlans.length > 1 ? (
                                <Select
                                    data={allPlans.map(p => ({ value: String(p.id), label: p.name }))}
                                    value={String(selectedPlanId)}
                                    onChange={(val) => setSelectedPlanId(val)}
                                    variant="filled"
                                    size="sm"
                                    fw={800}
                                    mt={2}
                                    w={250}
                                    styles={{ input: { fontSize: '1.1rem', paddingLeft: 8, cursor: 'pointer' } }}
                                />
                            ) : (
                                <Text size="xl" fw={800} c="dark.4" lh={1.2} truncate>{planData.name}</Text>
                            )}

                            <Group gap="sm" mt={8} wrap="wrap">
                                <Text size="sm" c="dimmed">Total Pendente: <b>{pendentes} máquinas</b></Text>
                                <Divider orientation="vertical" display={{ base: 'none', sm: 'block' }} />
                                {dataFimReal && (
                                    <Badge size="md" variant="light" color="teal" leftSection={<IconCalendar size={14} />} style={{ textTransform: 'none' }}>
                                        Previsão: <b>{dataFimReal.toLocaleDateString('pt-BR')}</b>
                                    </Badge>
                                )}
                            </Group>
                        </div>
                    </Group>

                    <Group gap="xl" align="center" justify="flex-end" style={{ flex: '1 1 250px' }}>
                        <SegmentedControl 
                            value={segmentOptions.some(opt => opt.value === viewMode) ? viewMode : 'diaria'} 
                            onChange={setViewMode} 
                            data={segmentOptions} 
                            color={BRAND_BLUE} 
                            radius="md" 
                        />
                        <div style={{ textAlign: 'right', minWidth: '100px' }}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{currentView.label}</Text>
                            <Text fw={900} size="2.6rem" lh={1} c={BRAND_BLUE}>{currentView.total}</Text>
                        </div>
                    </Group>
                </Group>
            </Paper>

            <Group justify="space-between" align="center">
                <Text size="md" fw={700} c="dimmed" tt="uppercase">Fila de Atendimento (Próximos)</Text>
            </Group>
            
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                {previewList.map((device, index) => (
                    <DeviceCardWidget key={device.id || index} device={device} index={index} onStart={handleStartDeviceClick} />
                ))}
            </SimpleGrid>

            {allAssignments.length > previewList.length && (
                <Button variant="outline" color={BRAND_BLUE} fullWidth mt="md" size="lg" leftSection={<IconList size={24} />} onClick={open}>
                    Ver Fila Completa ({allAssignments.length})
                </Button>
            )}
        </Stack>
    </>
  );
};

export default ActionPlanWidget;