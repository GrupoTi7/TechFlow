import React, { useState, useEffect } from 'react';
import '@mantine/dates/styles.css';
import { 
  Title, Text, SimpleGrid, Card, Group, ThemeIcon, 
  Button, Modal, TextInput, Stack, ActionIcon, Table, 
  Badge, Alert, Divider, Loader, Center, MultiSelect,
  Switch, Popover, NumberInput
} from '@mantine/core';

import { DatePickerInput, DatesProvider } from '@mantine/dates'; 
import { useDisclosure } from '@mantine/hooks';
import { 
  IconBuildingStore, IconDeviceDesktopAnalytics, IconListCheck, 
  IconTrash, IconEdit, IconArrowRight, IconInfoCircle, 
  IconCheck, IconX, IconCalendar, IconFilter, IconUsers, IconDatabaseImport
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');
import { allSetorOptions, setoresAdministrativos, setoresProducao } from '../utils/sectors';
import { 
  getSectors, createSector, updateSector, deleteSector, 
  getDeviceTypes, createDeviceType, updateDeviceType, deleteDeviceType,
  getUsers, getActionPlans, createActionPlan, deleteActionPlan 
} from '../services/api';

const BRAND_BLUE = '#0003d9';

// Conta dias úteis exatos para exibir no relatório do Front
function calculateBusinessDays(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    let count = 0;
    let currentDate = new Date(startDate);
    let end = new Date(endDate);
    currentDate.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    const fixedHolidays = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '12-25'];
    
    while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        const monthDay = String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + String(currentDate.getDate()).padStart(2, '0');
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !fixedHolidays.includes(monthDay)) count++;
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return count;
}

// ============================================================================
// 1 E 2: SETORES E TIPOS (Ocultos para brevidade, mas você mantém igual ao que você já tem no seu código)
// ============================================================================
const SectorsManager = () => { /* ... seu código igual ... */ return null; };
const DeviceTypesManager = () => { /* ... seu código igual ... */ return null; };

// ============================================================================
// 3. GERENCIADOR DE PLANOS DE AÇÃO
// ============================================================================
const ActionPlansManager = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sectors, setSectors] = useState([]);
    const [deviceTypes, setDeviceTypes] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    
    // 🟢 ESTADO INCLUINDO DAILY CAPACITY (Default 8)
    const [newPlan, setNewPlan] = useState({
        name: '', startDate: new Date(), dailyCapacity: 8,
        allDevices: true, selectedSectors: [], selectedTypes: [], allTechnicians: true, selectedTechnicians: []
    });

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [p, s, t, u] = await Promise.all([getActionPlans(), getSectors(), getDeviceTypes(), getUsers()]);
            setPlans(p);
            setSectors(s.map(i => ({ value: String(i.id), label: i.name })));
            setDeviceTypes(t.map(i => ({ value: i.key, label: i.name })));
            const userList = Array.isArray(u.users) ? u.users : (Array.isArray(u) ? u : []);
            setTechnicians(userList.filter(user => user.role !== 'ADMIN').map(i => ({ value: String(i.id), label: i.name })));
        } catch (error) {} finally { setLoading(false); }
    };

    useEffect(() => { loadInitialData(); }, []);

    const handleCreatePlan = async () => {
        if (!newPlan.name) return alert("Dê um nome ao plano.");
        if (newPlan.dailyCapacity <= 0) return alert("A produtividade deve ser maior que zero.");
        
        try {
            setLoading(true);
            await createActionPlan(newPlan);
            setIsCreating(false);
            setNewPlan({
                name: '', startDate: new Date(), dailyCapacity: 8,
                allDevices: true, selectedSectors: [], selectedTypes: [], allTechnicians: true, selectedTechnicians: []
            });
            await loadInitialData();
        } catch (error) { alert("Erro ao criar plano: " + error.message); } finally { setLoading(false); }
    };

    const handleDeletePlan = async (id) => {
        if(window.confirm("Isso removerá o plano e as atribuições. Certeza?")){
            await deleteActionPlan(id);
            setPlans(plans.filter(p => p.id !== id));
        }
    };

    if (loading && !plans) return <Center p="xl"><Loader /></Center>;

    if (isCreating) {
        return (
            <DatesProvider settings={{ locale: 'pt-br', firstDayOfWeek: 0 }}>
                <Stack>
                    <Group justify="space-between">
                        <Title order={3}>Novo Plano de Ação</Title>
                        <Button variant="subtle" color="gray" onClick={() => setIsCreating(false)}>Cancelar</Button>
                    </Group>
                    <Card withBorder padding="xl" radius="md">
                        <Stack gap="lg">
                            <Divider label="1. Configuração e Produtividade" labelPosition="left" />
                            <SimpleGrid cols={{ base: 1, sm: 3 }}>
                                <TextInput label="Nome do Plano" required value={newPlan.name} onChange={(e) => setNewPlan({...newPlan, name: e.target.value})} />
                                <DatePickerInput label="Data de Início" required value={newPlan.startDate} onChange={(date) => setNewPlan({...newPlan, startDate: date})} leftSection={<IconCalendar size={16}/>} valueFormat="DD/MM/YYYY" />
                                {/* 🟢 CAMPO PARA DEFINIR A CAPACIDADE (Usado para o cálculo) */}
                                <NumberInput label="Produtividade Média" description="Unidades por dia/técnico" value={newPlan.dailyCapacity} onChange={(val) => setNewPlan({...newPlan, dailyCapacity: val})} min={1} required />
                            </SimpleGrid>

                            <Divider label="2. Escopo (Dispositivos)" labelPosition="left" />
                            <Switch label="Incluir TODOS os dispositivos disponíveis" checked={newPlan.allDevices} onChange={(e) => setNewPlan({...newPlan, allDevices: e.currentTarget.checked})} size="md" />
                            {!newPlan.allDevices && (
                                <SimpleGrid cols={2}>
                                    <MultiSelect label="Filtrar por Setor" data={allSetorOptions} value={newPlan.selectedSectors} onChange={(val) => setNewPlan({...newPlan, selectedSectors: val})} leftSection={<IconBuildingStore size={16}/>} />
                                    <MultiSelect label="Filtrar por Tipo" data={deviceTypes} value={newPlan.selectedTypes} onChange={(val) => setNewPlan({...newPlan, selectedTypes: val})} leftSection={<IconFilter size={16}/>} />
                                </SimpleGrid>
                            )}

                            <Divider label="3. Equipe" labelPosition="left" />
                            <Switch label="Distribuir para TODOS os técnicos" checked={newPlan.allTechnicians} onChange={(e) => setNewPlan({...newPlan, allTechnicians: e.currentTarget.checked})} size="md" />
                            {!newPlan.allTechnicians && (
                                <MultiSelect label="Selecionar Técnicos" data={technicians} value={newPlan.selectedTechnicians} onChange={(val) => setNewPlan({...newPlan, selectedTechnicians: val})} leftSection={<IconUsers size={16}/>} required />
                            )}
                            <Button fullWidth size="lg" mt="xl" color={BRAND_BLUE} onClick={handleCreatePlan} loading={loading}>Calcular Prazo e Criar Plano</Button>
                        </Stack>
                    </Card>
                </Stack>
            </DatesProvider>
        )
    }

    return (
        <Stack>
            <Group justify="space-between">
                <Text>Gerencie campanhas de manutenção e visualize as metas de execução.</Text>
                <Button leftSection={<IconListCheck />} color={BRAND_BLUE} onClick={() => setIsCreating(true)}>Criar Novo Plano</Button>
            </Group>

            {plans.length === 0 ? (
                <Alert color="gray" title="Nenhum plano ativo">Crie um plano para distribuir tarefas.</Alert>
            ) : (
                <SimpleGrid cols={{ base: 1, md: 2 }}>
                    {plans.map(plan => {
                        const isFuture = new Date(plan.startDate) > new Date();
                        
                        // 🟢 MATEMÁTICA EXATA DO POPOVER (100% Baseada nos Dados)
                        const totalDevs = plan._count?.assignments || 0;
                        const totalTechs = plan.technicianCount || 1;
                        const bDays = calculateBusinessDays(plan.startDate, plan.deadline);
                        
                        // 1. Média de Dispositivos por Técnico
                        const cargaPorTecnico = Math.ceil(totalDevs / totalTechs);
                        
                        // 2. Metas do Técnico
                        const metaDiariaTecnico = Math.ceil(cargaPorTecnico / (bDays || 1));
                        const metaSemanalTecnico = metaDiariaTecnico * 5;
                        const metaMensalTecnico = metaDiariaTecnico * 22;

                        return (
                            <Card key={plan.id} shadow="sm" radius="md" withBorder padding="lg">
                                <Group justify="space-between" mb="xs">
                                    <Badge color={isFuture ? "orange" : "green"} size="lg">{isFuture ? "Agendado" : "Em Andamento"}</Badge>
                                    <ActionIcon color="red" variant="subtle" onClick={() => handleDeletePlan(plan.id)}><IconTrash size={18} /></ActionIcon>
                                </Group>
                                
                                <Text fw={700} size="lg">{plan.name}</Text>
                                <Group gap={6} mt={2}>
                                    <Text size="sm" c="dimmed">Início: {new Date(plan.startDate).toLocaleDateString('pt-BR')}</Text>
                                </Group>

                                {/* 🟢 POPOVER MODERNO MOSTRANDO AS MÉDIAS E METAS */}
                                <Group gap={4} mt={4}>
                                    <Text size="sm" fw={600} c="teal.7">
                                        Término Calculado: {plan.deadline ? new Date(plan.deadline).toLocaleDateString('pt-BR') : 'Não definido'}
                                    </Text>
                                    
                                    {plan.deadline && (
                                        <Popover width={320} position="bottom-start" withArrow shadow="md">
                                            <Popover.Target>
                                                <ActionIcon size="sm" variant="transparent" color="gray" style={{ marginTop: '-2px' }}>
                                                    <IconInfoCircle size={16} />
                                                </ActionIcon>
                                            </Popover.Target>
                                            <Popover.Dropdown>
                                                <Stack gap="xs">
                                                    <Text size="sm" fw={700} c={BRAND_BLUE}>Relatório de Execução</Text>
                                                    <Divider />
                                                    <Group justify="space-between"><Text size="xs" c="dimmed">1️⃣ Dispositivos (Total):</Text><Text size="xs" fw={600}>{totalDevs}</Text></Group>
                                                    <Group justify="space-between"><Text size="xs" c="dimmed">1️⃣ Técnicos (Total):</Text><Text size="xs" fw={600}>{totalTechs}</Text></Group>
                                                    <Group justify="space-between"><Text size="xs" c="dimmed">1️⃣ Carga Média (Por Téc):</Text><Text size="xs" fw={600}>{cargaPorTecnico} unids</Text></Group>
                                                    
                                                    <Divider variant="dashed" />
                                                    <Text size="xs" fw={700} c="dimmed" mt={4}>2️⃣ MÉDIAS DE EXECUÇÃO (POR TÉCNICO):</Text>
                                                    
                                                    <Group justify="space-between"><Text size="xs" c="dimmed">Meta Diária (1 dia):</Text><Text size="xs" fw={600} c="teal">{metaDiariaTecnico} unids</Text></Group>
                                                    <Group justify="space-between"><Text size="xs" c="dimmed">Meta Semanal (5 dias):</Text><Text size="xs" fw={600} c="teal">{metaSemanalTecnico} unids</Text></Group>
                                                    <Group justify="space-between"><Text size="xs" c="dimmed">Meta Mensal (22 dias):</Text><Text size="xs" fw={600} c="teal">{metaMensalTecnico} unids</Text></Group>

                                                    <Divider variant="dashed" />
                                                    <Text size="xs" fw={700} c="dimmed" mt={4}>3️⃣ ESTIMATIVA DE PRAZO:</Text>
                                                    <Group justify="space-between"><Text size="xs" c="dimmed">Dias Úteis Necessários:</Text><Text size="xs" fw={600} c="indigo">{bDays} dias úteis</Text></Group>
                                                </Stack>
                                            </Popover.Dropdown>
                                        </Popover>
                                    )}
                                </Group>

                                <Divider my="sm" />
                                <Group grow>
                                    <div><Text size="xs" c="dimmed" tt="uppercase">Dispositivos</Text><Text fw={700}>{totalDevs}</Text></div>
                                    <div><Text size="xs" c="dimmed" tt="uppercase">Técnicos</Text><Text fw={700}>{totalTechs}</Text></div>
                                </Group>
                            </Card>
                        )
                    })}
                </SimpleGrid>
            )}
        </Stack>
    );
};

export default function ServicesPage() {
  const [activeModal, setActiveModal] = useState(null); 
  const [opened, { open, close }] = useDisclosure(false);

  const services = [
    { key: 'sectors', title: 'Gerenciar Setores', icon: IconBuildingStore, color: 'blue' },
    { key: 'types', title: 'Tipos de Dispositivo', icon: IconDeviceDesktopAnalytics, color: 'cyan' },
    { key: 'plans', title: 'Planos de Ação', icon: IconListCheck, color: 'teal' }
  ];

  return (
    <Stack gap="lg">
       <Modal opened={opened} onClose={close} title={<Text size="xl" fw={700} c={BRAND_BLUE}>{activeModal === 'sectors' ? 'Gerenciar Setores' : activeModal === 'types' ? 'Catálogo de Tipos' : 'Planos de Ação'}</Text>} size={activeModal === 'plans' ? "xl" : "80%"} radius="md" centered padding="xl">   
          {activeModal === 'sectors' && <SectorsManager />}
          {activeModal === 'types' && <DeviceTypesManager />}
          {activeModal === 'plans' && <ActionPlansManager />}
       </Modal>
       <Card shadow="sm" padding="lg" radius="md" withBorder style={{ borderLeft: `6px solid ${BRAND_BLUE}` }}>
          <Title order={2} c="dark.5">Central de Serviços</Title>
       </Card>
       <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {services.map((service) => (
             <Card key={service.key} shadow="sm" padding="xl" radius="md" withBorder style={{ cursor: 'pointer' }} onClick={() => {setActiveModal(service.key); open();}}>
                <ThemeIcon size={48} radius="md" variant="light" color={service.color} mb="md"><service.icon size={28} stroke={1.5} /></ThemeIcon>
                <Text fw={700} size="lg">{service.title}</Text>
             </Card>
          ))}
       </SimpleGrid>
    </Stack>
  );
}