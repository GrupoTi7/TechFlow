import React, { useState, useEffect } from 'react';
import '@mantine/dates/styles.css';
import { 
  Title, Text, SimpleGrid, Card, Group, ThemeIcon, 
  Button, Modal, TextInput, Stack, ActionIcon, Table, 
  Badge, Alert, Divider, Loader, Center, MultiSelect,
  Switch, Popover, NumberInput, Select, Code, Box, Paper
} from '@mantine/core';

import { DatePickerInput, DatesProvider } from '@mantine/dates'; 
import { useDisclosure } from '@mantine/hooks';
import { 
  IconBuildingStore, IconDeviceDesktopAnalytics, IconListCheck, 
  IconTrash, IconEdit, IconArrowRight, IconInfoCircle, 
  IconCheck, IconX, IconCalendar, IconFilter, IconUsers, IconDatabaseImport,
  // Ícones para o catálogo
  IconDeviceDesktop, IconDeviceLaptop, IconPrinter, IconServer, 
  IconRouter, IconWifi, IconTerminal2, IconBarcode, IconDeviceMobile, IconDevices
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

// 🟢 MAPA DE ÍCONES DISPONÍVEIS PARA O CATÁLOGO
const availableIcons = [
  { value: 'IconDeviceDesktop', label: 'Desktop / Computador', icon: <IconDeviceDesktop size={18} /> },
  { value: 'IconDeviceLaptop', label: 'Notebook / Laptop', icon: <IconDeviceLaptop size={18} /> },
  { value: 'IconPrinter', label: 'Impressora', icon: <IconPrinter size={18} /> },
  { value: 'IconServer', label: 'Servidor', icon: <IconServer size={18} /> },
  { value: 'IconRouter', label: 'Switch / Rede', icon: <IconRouter size={18} /> },
  { value: 'IconWifi', label: 'Access Point (Wi-Fi)', icon: <IconWifi size={18} /> },
  { value: 'IconTerminal2', label: 'Microterminal', icon: <IconTerminal2 size={18} /> },
  { value: 'IconBarcode', label: 'Coletor / Leitor', icon: <IconBarcode size={18} /> },
  { value: 'IconDeviceMobile', label: 'Smartphone / Tablet', icon: <IconDeviceMobile size={18} /> },
  { value: 'IconDevices', label: 'Genérico (Outros)', icon: <IconDevices size={18} /> },
];

function renderIconPreview(iconName) {
    const found = availableIcons.find(i => i.value === iconName);
    return found ? found.icon : <IconDevices size={18} color="gray" />;
}

// 🟢 FUNÇÕES DE CÁLCULO DE DATAS
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

function addBusinessDays(startDate, daysToAdd) {
    if (!startDate) return new Date();
    let currentDate = new Date(startDate);
    currentDate.setHours(0,0,0,0);
    if (daysToAdd <= 0) return currentDate;

    let addedDays = 0;
    const fixedHolidays = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '12-25'];
    
    while (addedDays < daysToAdd) {
        currentDate.setDate(currentDate.getDate() + 1);
        const dayOfWeek = currentDate.getDay();
        const monthDay = String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + String(currentDate.getDate()).padStart(2, '0');
        
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !fixedHolidays.includes(monthDay)) {
            addedDays++;
        }
    }
    return currentDate;
}

// ============================================================================
// 1. GERENCIADOR DE SETORES
// ============================================================================
const SectorsManager = () => {
    const [sectors, setSectors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ name: '', type: 'ADMINISTRATIVO', maintenanceInterval: 120 });

    const loadSectors = async () => {
        setLoading(true);
        try {
            const data = await getSectors();
            setSectors(Array.isArray(data) ? data : []);
        } catch (error) { console.error("Erro ao carregar setores", error); } finally { setLoading(false); }
    };

    useEffect(() => { loadSectors(); }, []);

    const handleSubmit = async () => {
        if (!form.name) return alert("O nome do setor é obrigatório.");
        try {
            setLoading(true);
            if (editingId) await updateSector(editingId, form);
            else await createSector(form);
            setForm({ name: '', type: 'ADMINISTRATIVO', maintenanceInterval: 120 });
            setEditingId(null);
            await loadSectors();
        } catch (error) { alert("Erro ao salvar setor: " + error.message); } finally { setLoading(false); }
    };

    const handleEdit = (sector) => {
        setForm({ name: sector.name, type: sector.type, maintenanceInterval: sector.maintenanceInterval });
        setEditingId(sector.id);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Certeza que deseja excluir este setor?")) {
            await deleteSector(id);
            setSectors(sectors.filter(s => s.id !== id));
        }
    };

    return (
        <Stack gap="lg">
            {/* 🟢 DESIGN PREMIUM PARA NOVO CADASTRO */}
            <Paper p="md" radius="md" bg="#f8f9fa" style={{ border: '1px solid #e9ecef', borderLeft: `4px solid ${BRAND_BLUE}` }}>
                <Text size="sm" fw={700} c="dimmed" tt="uppercase" mb="md">
                    {editingId ? 'Editando Setor Existente' : 'Cadastrar Novo Setor'}
                </Text>
                <Group align="flex-end" gap="md">
                    <TextInput label="Nome do Setor" placeholder="Ex: Usinagem" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ flex: 1 }} />
                    <Select label="Prioridade (Tipo)" data={['ADMINISTRATIVO', 'PRODUCAO']} value={form.type} onChange={(val) => setForm({ ...form, type: val })} style={{ width: 180 }} />
                    <NumberInput label="Intervalo (Dias)" value={form.maintenanceInterval} onChange={(val) => setForm({ ...form, maintenanceInterval: val })} min={1} style={{ width: 120 }} />
                    <Button color={BRAND_BLUE} onClick={handleSubmit} loading={loading}>{editingId ? 'Atualizar' : 'Adicionar'}</Button>
                    {editingId && <Button variant="subtle" color="gray" onClick={() => { setEditingId(null); setForm({ name: '', type: 'ADMINISTRATIVO', maintenanceInterval: 120 }); }}>Cancelar</Button>}
                </Group>
            </Paper>

            {loading && !sectors.length ? <Center p="xl"><Loader color={BRAND_BLUE} /></Center> : (
                <Table striped highlightOnHover verticalSpacing="sm" style={{ border: '1px solid #e9ecef', borderRadius: '8px', overflow: 'hidden' }}>
                    <Table.Thead bg="gray.0">
                        <Table.Tr>
                            <Table.Th>Setor</Table.Th>
                            <Table.Th>Tipo de Operação</Table.Th>
                            <Table.Th>Ciclo de Preventiva</Table.Th>
                            <Table.Th style={{ width: 100, textAlign: 'center' }}>Ações</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {sectors.map((sector) => (
                            <Table.Tr key={sector.id}>
                                <Table.Td fw={600} c="dark.4">{sector.name}</Table.Td>
                                <Table.Td><Badge variant="light" color={sector.type === 'PRODUCAO' ? 'red' : 'blue'}>{sector.type}</Badge></Table.Td>
                                <Table.Td><Text size="sm" fw={500} c="dimmed">{sector.maintenanceInterval} dias úteis</Text></Table.Td>
                                <Table.Td>
                                    <Group gap={8} justify="center">
                                        <ActionIcon color="blue" variant="subtle" radius="md" onClick={() => handleEdit(sector)}><IconEdit size={18} /></ActionIcon>
                                        <ActionIcon color="red" variant="subtle" radius="md" onClick={() => handleDelete(sector.id)}><IconTrash size={18} /></ActionIcon>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                        {sectors.length === 0 && <Table.Tr><Table.Td colSpan={4} align="center"><Text c="dimmed" py="xl">Nenhum setor cadastrado ainda.</Text></Table.Td></Table.Tr>}
                    </Table.Tbody>
                </Table>
            )}
        </Stack>
    );
};

// ============================================================================
// 2. GERENCIADOR DE TIPOS DE DISPOSITIVO (Profissionalizado)
// ============================================================================
const DeviceTypesManager = () => {
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ name: '', key: '', icon: '' });

    const loadTypes = async () => {
        setLoading(true);
        try {
            const data = await getDeviceTypes();
            setTypes(Array.isArray(data) ? data : []);
        } catch (error) { console.error("Erro ao carregar tipos", error); } finally { setLoading(false); }
    };

    useEffect(() => { loadTypes(); }, []);

    const handleSubmit = async () => {
        if (!form.name || !form.key) return alert("Nome e Chave são obrigatórios.");
        try {
            setLoading(true);
            if (editingId) await updateDeviceType(editingId, form);
            else await createDeviceType(form);
            setForm({ name: '', key: '', icon: '' });
            setEditingId(null);
            await loadTypes();
        } catch (error) { alert("Erro ao salvar tipo: " + error.message); } finally { setLoading(false); }
    };

    const handleEdit = (type) => {
        setForm({ name: type.name, key: type.key, icon: type.icon || '' });
        setEditingId(type.id);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Certeza que deseja excluir este tipo? O sistema pode parar de agrupar as máquinas corretamente.")) {
            await deleteDeviceType(id);
            setTypes(types.filter(t => t.id !== id));
        }
    };

    return (
        <Stack gap="lg">
            {/* 🟢 DESIGN PREMIUM E SELECT DE ÍCONES */}
            <Paper p="md" radius="md" bg="#f8f9fa" style={{ border: '1px solid #e9ecef', borderLeft: `4px solid ${BRAND_BLUE}` }}>
                <Text size="sm" fw={700} c="dimmed" tt="uppercase" mb="md">
                    {editingId ? 'Editando Categoria Existente' : 'Cadastrar Nova Categoria'}
                </Text>
                <Group align="flex-end" gap="md">
                    <TextInput label="Nome de Exibição" placeholder="Ex: Roteador de Borda" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ flex: 1.5 }} />
                    <TextInput label="Chave de Sistema (Obrigatório)" description="A exata palavra que o inventário envia" placeholder="Ex: switch" required value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value.toLowerCase() })} style={{ flex: 1 }} />
                    
                    {/* 🟢 SELECT DE ÍCONES */}
                    <Select 
                        label="Ícone Visual" 
                        placeholder="Escolha um ícone..." 
                        data={availableIcons} 
                        value={form.icon} 
                        onChange={(val) => setForm({ ...form, icon: val })} 
                        style={{ width: 200 }} 
                        leftSection={form.icon ? renderIconPreview(form.icon) : null}
                    />

                    <Button color={BRAND_BLUE} onClick={handleSubmit} loading={loading}>{editingId ? 'Atualizar' : 'Adicionar'}</Button>
                    {editingId && <Button variant="subtle" color="gray" onClick={() => { setEditingId(null); setForm({ name: '', key: '', icon: '' }); }}>Cancelar</Button>}
                </Group>
            </Paper>

            {loading && !types.length ? <Center p="xl"><Loader color={BRAND_BLUE} /></Center> : (
                <Table striped highlightOnHover verticalSpacing="sm" style={{ border: '1px solid #e9ecef', borderRadius: '8px', overflow: 'hidden' }}>
                    <Table.Thead bg="gray.0">
                        <Table.Tr>
                            <Table.Th style={{ width: 60, textAlign: 'center' }}>Visual</Table.Th>
                            <Table.Th>Nome de Exibição</Table.Th>
                            <Table.Th>Chave (Database)</Table.Th>
                            <Table.Th style={{ width: 100, textAlign: 'center' }}>Ações</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {types.map((type) => (
                            <Table.Tr key={type.id}>
                                {/* 🟢 ÍCONE RENDERIZADO DE VERDADE NA TABELA */}
                                <Table.Td align="center">
                                    <ThemeIcon variant="light" color={BRAND_BLUE} size="md" radius="md">
                                        {renderIconPreview(type.icon)}
                                    </ThemeIcon>
                                </Table.Td>
                                <Table.Td fw={600} c="dark.4">{type.name}</Table.Td>
                                <Table.Td><Code color="gray.2" c="gray.7" fw={700}>{type.key}</Code></Table.Td>
                                <Table.Td>
                                    <Group gap={8} justify="center">
                                        <ActionIcon color="blue" variant="subtle" radius="md" onClick={() => handleEdit(type)}><IconEdit size={18} /></ActionIcon>
                                        <ActionIcon color="red" variant="subtle" radius="md" onClick={() => handleDelete(type.id)}><IconTrash size={18} /></ActionIcon>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                        {types.length === 0 && <Table.Tr><Table.Td colSpan={4} align="center"><Text c="dimmed" py="xl">Nenhum tipo de dispositivo cadastrado.</Text></Table.Td></Table.Tr>}
                    </Table.Tbody>
                </Table>
            )}
        </Stack>
    );
};

// ============================================================================
// 3. GERENCIADOR DE PLANOS DE AÇÃO (Polido)
// ============================================================================
const ActionPlansManager = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sectors, setSectors] = useState([]);
    const [deviceTypes, setDeviceTypes] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    
    const [newPlan, setNewPlan] = useState({
        name: '', 
        startDate: new Date(), 
        deadline: null,
        targetSectors: [], 
        targetTypes: ['Desktop', 'Notebook', 'Switch'], // Deixei Switch por padrão também!
        distributeToAllTechs: true, 
        selectedTechs: []
    });

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [p, s, t, u] = await Promise.all([getActionPlans(), getSectors(), getDeviceTypes(), getUsers()]);
            setPlans(p);
            setSectors(s.map(i => ({ value: String(i.name), label: i.name }))); 
            setDeviceTypes(t.map(i => ({ value: i.key, label: i.name })));
            
            const userList = Array.isArray(u.users) ? u.users : (Array.isArray(u) ? u : []);
            setTechnicians(userList.filter(user => user.role !== 'ADMIN').map(i => ({ value: String(i.id), label: i.name })));
        } catch (error) {} finally { setLoading(false); }
    };

    useEffect(() => { loadInitialData(); }, []);

    const handleCreatePlan = async () => {
        if (!newPlan.name) return alert("Dê um nome ao plano.");
        if (newPlan.deadline && new Date(newPlan.deadline) < new Date(newPlan.startDate)) {
            return alert("A data final não pode ser anterior ao início.");
        }
        
        try {
            setLoading(true);
            let finalDeadline = newPlan.deadline;
            if (!finalDeadline) finalDeadline = addBusinessDays(newPlan.startDate, 22);

            const payload = { 
                name: newPlan.name,
                startDate: newPlan.startDate,
                deadline: finalDeadline,
                targetTypes: newPlan.targetTypes,
                targetSectors: newPlan.targetSectors,
                distributeToAllTechs: newPlan.distributeToAllTechs,
                selectedTechs: newPlan.selectedTechs
            };
            
            await createActionPlan(payload);
            
            setIsCreating(false);
            setNewPlan({
                name: '', startDate: new Date(), deadline: null,
                targetSectors: [], targetTypes: ['Desktop', 'Notebook', 'Switch'], distributeToAllTechs: true, selectedTechs: []
            });
            await loadInitialData();
        } catch (error) { 
            alert("Erro ao criar plano: " + (error.response?.data?.error || error.message)); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleDeletePlan = async (id) => {
        if(window.confirm("Isso removerá o plano e as atribuições. Certeza?")){
            await deleteActionPlan(id);
            setPlans(plans.filter(p => p.id !== id));
        }
    };

    if (loading && !plans) return <Center p="xl"><Loader color={BRAND_BLUE} /></Center>;

    if (isCreating) {
        return (
            <DatesProvider settings={{ locale: 'pt-br', firstDayOfWeek: 0 }}>
                <Stack gap="xl">
                    <Group justify="space-between" align="center">
                        <Title order={3} c="dark.5">Novo Plano Estratégico</Title>
                        <Button variant="subtle" color="gray" onClick={() => setIsCreating(false)}>Voltar para Lista</Button>
                    </Group>
                    
                    {/* 🟢 DESIGN LIMPO E ORGANIZADO DO FORMULÁRIO */}
                    <Card withBorder padding="xl" radius="lg" shadow="sm">
                        <Stack gap="xl">
                            <Divider label={<Text fw={700} c={BRAND_BLUE} size="sm">1. CRONOGRAMA</Text>} labelPosition="left" variant="dashed" />
                            <SimpleGrid cols={{ base: 1, sm: 2 }}>
                                <TextInput label="Nome da Campanha" placeholder="Ex: Preventiva Geral Q3" required value={newPlan.name} onChange={(e) => setNewPlan({...newPlan, name: e.target.value})} />
                                <DatePickerInput label="Data de Início" required value={newPlan.startDate} onChange={(date) => setNewPlan({...newPlan, startDate: date})} leftSection={<IconCalendar size={16} color={BRAND_BLUE}/>} valueFormat="DD/MM/YYYY" />
                                <DatePickerInput 
                                    label="Data Limite (Opcional)" 
                                    description="Se vazio, o sistema assume o ciclo de 1 mês (22 dias úteis)."
                                    placeholder="Até quando deve terminar?" 
                                    value={newPlan.deadline} 
                                    onChange={(date) => setNewPlan({...newPlan, deadline: date})} 
                                    leftSection={<IconCalendar size={16} color="orange" />} 
                                    valueFormat="DD/MM/YYYY" 
                                    minDate={newPlan.startDate} 
                                    clearable
                                />
                            </SimpleGrid>

                            <Divider label={<Text fw={700} c={BRAND_BLUE} size="sm">2. ESCOPO (ALVOS)</Text>} labelPosition="left" variant="dashed" mt="md" />
                            <SimpleGrid cols={{ base: 1, sm: 2 }}>
                                <MultiSelect 
                                    label="Tipos de Equipamento" 
                                    description="Máquinas que receberão manutenção."
                                    data={deviceTypes.length > 0 ? deviceTypes : ['Desktop', 'Notebook']} 
                                    value={newPlan.targetTypes} 
                                    onChange={(val) => setNewPlan({...newPlan, targetTypes: val})} 
                                    leftSection={<IconFilter size={16}/>} 
                                    searchable clearable
                                />
                                <MultiSelect 
                                    label="Restringir por Setor (Opcional)" 
                                    description="Vazio = Planta Inteira."
                                    data={sectors} 
                                    value={newPlan.targetSectors} 
                                    onChange={(val) => setNewPlan({...newPlan, targetSectors: val})} 
                                    leftSection={<IconBuildingStore size={16}/>} 
                                    searchable clearable
                                />
                            </SimpleGrid>

                            <Divider label={<Text fw={700} c={BRAND_BLUE} size="sm">3. FORÇA DE TRABALHO</Text>} labelPosition="left" variant="dashed" mt="md" />
                            <Box bg="blue.0" p="md" style={{ borderRadius: '8px', border: '1px solid #d0ebff' }}>
                                <Switch label={<Text fw={600} size="sm">Distribuir tarefas automaticamente para TODOS os técnicos</Text>} checked={newPlan.distributeToAllTechs} onChange={(e) => setNewPlan({...newPlan, distributeToAllTechs: e.currentTarget.checked})} size="md" color={BRAND_BLUE} />
                            </Box>
                            
                            {!newPlan.distributeToAllTechs && (
                                <MultiSelect label="Selecionar Técnicos Específicos" data={technicians} value={newPlan.selectedTechs} onChange={(val) => setNewPlan({...newPlan, selectedTechs: val})} leftSection={<IconUsers size={16}/>} required />
                            )}
                            
                            <Button fullWidth size="lg" mt="xl" color={BRAND_BLUE} onClick={handleCreatePlan} loading={loading}>
                                Lançar Plano de Ação
                            </Button>
                        </Stack>
                    </Card>
                </Stack>
            </DatesProvider>
        )
    }

    return (
        <Stack gap="lg">
            <Group justify="space-between" align="center" bg="#f8f9fa" p="md" style={{ borderRadius: '8px', border: '1px solid #e9ecef' }}>
                <Text fw={500} c="dimmed">Gerencie campanhas ativas e acompanhe os prazos.</Text>
                <Button leftSection={<IconListCheck size={18} />} color={BRAND_BLUE} onClick={() => setIsCreating(true)}>Criar Nova Campanha</Button>
            </Group>

            {plans.length === 0 ? (
                <Center h={200} style={{ border: '2px dashed #e9ecef', borderRadius: '12px', backgroundColor: '#f8f9fa' }}>
                    <Stack align="center" gap="xs">
                        <IconListCheck size={40} color="#adb5bd" />
                        <Text fw={600} c="dark.3" size="lg">Nenhum plano ativo</Text>
                        <Text c="dimmed" size="sm">Crie uma campanha para distribuir tarefas para a equipe.</Text>
                    </Stack>
                </Center>
            ) : (
                <SimpleGrid cols={{ base: 1, md: 2 }}>
                    {plans.map(plan => {
                        const isFuture = new Date(plan.startDate) > new Date();
                        const totalDevs = plan._count?.assignments || 0;
                        const totalTechs = plan.technicianCount || 1;
                        const finalDeadline = plan.deadline ? new Date(plan.deadline) : new Date();
                        const bDays = calculateBusinessDays(plan.startDate, finalDeadline) || 1; 
                        
                        const cargaPorTecnico = Math.ceil(totalDevs / totalTechs);
                        const metaDiariaTecnico = Math.ceil(cargaPorTecnico / bDays);
                        const metaSemanalTecnico = metaDiariaTecnico * 5;
                        const metaMensalTecnico = metaDiariaTecnico * 20;

                        return (
                            <Card key={plan.id} shadow="sm" radius="lg" withBorder padding="lg" style={{ transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}}>
                                <Group justify="space-between" mb="xs">
                                    <Badge variant="light" color={isFuture ? "orange" : "teal"} size="lg" radius="sm">{isFuture ? "Agendado" : "Em Andamento"}</Badge>
                                    <ActionIcon color="red" variant="subtle" onClick={() => handleDeletePlan(plan.id)}><IconTrash size={18} /></ActionIcon>
                                </Group>
                                
                                <Text fw={800} size="xl" mt="sm">{plan.name}</Text>
                                <Text size="sm" c="dimmed" fw={500} mt={4} mb="md">
                                    <IconCalendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                    {new Date(plan.startDate).toLocaleDateString('pt-BR')} até {finalDeadline.toLocaleDateString('pt-BR')}
                                </Text>

                                <Group gap={6} p="sm" bg="gray.0" style={{ borderRadius: '8px' }}>
                                    <Text size="sm" fw={700} c={BRAND_BLUE}>
                                        🎯 Meta: {metaDiariaTecnico} maq/dia por técnico
                                    </Text>
                                    
                                    <Popover width={320} position="bottom-start" withArrow shadow="xl">
                                        <Popover.Target>
                                            <ActionIcon size="sm" variant="transparent" color="gray" style={{ marginTop: '-2px' }}>
                                                <IconInfoCircle size={16} />
                                            </ActionIcon>
                                        </Popover.Target>
                                        <Popover.Dropdown p="md">
                                            <Stack gap="xs">
                                                <Text size="sm" fw={800} c={BRAND_BLUE} tt="uppercase">Análise de Viabilidade</Text>
                                                <Divider />
                                                <Group justify="space-between"><Text size="xs" c="dimmed">Equipamentos no Plano:</Text><Text size="xs" fw={700}>{totalDevs}</Text></Group>
                                                <Group justify="space-between"><Text size="xs" c="dimmed">Técnicos Alocados:</Text><Text size="xs" fw={700}>{totalTechs}</Text></Group>
                                                <Group justify="space-between"><Text size="xs" c="dimmed">Dias Úteis Disponíveis:</Text><Text size="xs" fw={700}>{bDays} dias</Text></Group>
                                                <Divider variant="dashed" />
                                                <Text size="10px" fw={800} c="dimmed" mt={4} tt="uppercase">Metas por Técnico</Text>
                                                <Group justify="space-between"><Text size="xs" fw={500}>Diária:</Text><Text size="xs" fw={800} c="teal">{metaDiariaTecnico} /dia</Text></Group>
                                                <Group justify="space-between"><Text size="xs" fw={500}>Semanal:</Text><Text size="xs" fw={800} c="teal">{metaSemanalTecnico} /sem</Text></Group>
                                            </Stack>
                                        </Popover.Dropdown>
                                    </Popover>
                                </Group>

                                <Divider my="lg" variant="dotted" />
                                <Group grow>
                                    <div style={{ textAlign: 'center' }}><Text size="10px" c="dimmed" tt="uppercase" fw={700}>Equipamentos</Text><Text fw={800} size="lg" c="dark.4">{totalDevs}</Text></div>
                                    <div style={{ textAlign: 'center', borderLeft: '1px solid #e9ecef' }}><Text size="10px" c="dimmed" tt="uppercase" fw={700}>Técnicos</Text><Text fw={800} size="lg" c="dark.4">{totalTechs}</Text></div>
                                </Group>
                            </Card>
                        )
                    })}
                </SimpleGrid>
            )}
        </Stack>
    );
};

// ============================================================================
// COMPONENTE PRINCIPAL DA PÁGINA
// ============================================================================
export default function ServicesPage() {
  const [activeModal, setActiveModal] = useState(null); 
  const [opened, { open, close }] = useDisclosure(false);

  const services = [
    { key: 'sectors', title: 'Estrutura de Setores', description: 'Configure os setores da fábrica e seus ciclos automáticos de manutenção.', icon: IconBuildingStore, color: 'blue' },
    { key: 'types', title: 'Catálogo de Dispositivos', description: 'Defina as categorias e ícones visuais (ex: Switch, Desktop, Access Point).', icon: IconDeviceDesktopAnalytics, color: 'cyan' },
    { key: 'plans', title: 'Campanhas de Manutenção', description: 'Crie metas, distribua dispositivos e defina prazos para a equipe de TI.', icon: IconListCheck, color: 'teal' }
  ];

  return (
    <Stack gap="xl" pb="xl">
       <Modal 
          opened={opened} 
          onClose={close} 
          title={<Text size="xl" fw={900} c={BRAND_BLUE}>{activeModal === 'sectors' ? 'Estrutura de Setores' : activeModal === 'types' ? 'Catálogo de Dispositivos' : 'Gestão de Campanhas'}</Text>} 
          size={activeModal === 'plans' ? "65rem" : "55rem"} // Modais levemente mais largos
          radius="lg" 
          centered 
          padding="xl"
          overlayProps={{ blur: 3, opacity: 0.55 }}
       >   
          {activeModal === 'sectors' && <SectorsManager />}
          {activeModal === 'types' && <DeviceTypesManager />}
          {activeModal === 'plans' && <ActionPlansManager />}
       </Modal>
       
       <Card shadow="sm" p="xl" radius="lg" withBorder style={{ borderLeft: `6px solid ${BRAND_BLUE}` }}>
          <Title order={2} fw={800} c="dark.5">Painel de Configurações Administrativas</Title>
          <Text c="dimmed" size="sm" mt={4}>Gerencie os parâmetros do sistema que controlam a automação e distribuição de chamados.</Text>
       </Card>

       <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
          {services.map((service) => (
             <Card 
                key={service.key} 
                shadow="sm" 
                p="xl" 
                radius="lg" 
                withBorder 
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }} 
                onClick={() => {setActiveModal(service.key); open();}}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = `var(--mantine-color-${service.color}-light)`; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = '#dee2e6'; }}
             >
                <ThemeIcon size={54} radius="xl" variant="light" color={service.color} mb="lg">
                    <service.icon size={28} stroke={1.5} />
                </ThemeIcon>
                <Text fw={800} size="xl" c="dark.4">{service.title}</Text>
                <Text size="sm" c="dimmed" mt="sm" lh={1.5}>{service.description}</Text>
             </Card>
          ))}
       </SimpleGrid>
    </Stack>
  );
}