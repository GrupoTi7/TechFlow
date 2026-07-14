import React, { useState, useEffect, useMemo } from 'react';
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
  IconDeviceDesktop, IconDeviceLaptop, IconPrinter, IconServer, 
  IconRouter, IconWifi, IconTerminal2, IconBarcode, IconDeviceMobile, IconDevices
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');
import { getSectors, createSector, updateSector, deleteSector, 
  getDeviceTypes, createDeviceType, updateDeviceType, deleteDeviceType,
  getUsers, getActionPlans, createActionPlan, deleteActionPlan , getDevices
} from '../services/api';

const BRAND_BLUE = '#0003d9';

const availableIcons = [
  { value: 'IconDeviceDesktop', label: 'Desktop', icon: <IconDeviceDesktop size={18} /> },
  { value: 'IconDeviceLaptop', label: 'Notebook', icon: <IconDeviceLaptop size={18} /> },
  { value: 'IconPrinter', label: 'Impressora', icon: <IconPrinter size={18} /> },
  { value: 'IconServer', label: 'Servidor', icon: <IconServer size={18} /> },
  { value: 'IconRouter', label: 'Switch', icon: <IconRouter size={18} /> },
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
            <Paper p="md" radius="md" bg="#f8f9fa" style={{ border: '1px solid #e9ecef', borderLeft: `4px solid ${BRAND_BLUE}` }}>
                <Text size="sm" fw={700} c="dimmed" tt="uppercase" mb="md">
                    {editingId ? 'Editando Categoria Existente' : 'Cadastrar Nova Categoria'}
                </Text>
                <Group align="flex-end" gap="md">
                    <TextInput label="Nome de Exibição" placeholder="Ex: Roteador de Borda" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ flex: 1.5 }} />
                    <TextInput 
                        label="Chave de Sistema (Obrigatório)" 
                        description="Exato texto do GLPI (Ex: Desktop)" 
                        placeholder="Ex: Desktop" 
                        required 
                        value={form.key} 
                        onChange={(e) => setForm({ ...form, key: e.target.value })} 
                        style={{ flex: 1 }} 
                    />
                    
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

const ActionPlansManager = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sectors, setSectors] = useState([]);
    const [deviceTypes, setDeviceTypes] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [allDevices, setAllDevices] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    
    const [newPlan, setNewPlan] = useState({
        name: '', 
        startDate: new Date(), 
        dailyCapacity: 1, 
        deadline: null, 
        lastEdited: 'capacity', // 🟢 Controla quem atualiza quem
        targetSectors: [], 
        targetTypes: [], 
        selectedTechs: []
    });

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [p, s, t, u, devsRes] = await Promise.all([
                getActionPlans(), getSectors(), getDeviceTypes(), getUsers(), getDevices()
            ]);
            setPlans(p);
            setSectors(s.map(i => ({ value: String(i.name), label: i.name }))); 
            const mappedTypes = t.map(i => ({ value: i.key, label: i.name }));
            setDeviceTypes(mappedTypes);
            setAllDevices(devsRes?.devices || []);
            const userList = Array.isArray(u.users) ? u.users : (Array.isArray(u) ? u : []);
            const validTechs = userList.filter(user => {
                const nameStr = String(user.name || '').toLowerCase();
                const userStr = String(user.username || '').toLowerCase();
                return !nameStr.includes('juliano') && !userStr.includes('juliano') && !nameStr.includes('eduardo') && !userStr.includes('eduardo');
            });
            setTechnicians(validTechs.map(i => ({ value: String(i.id || i.username), label: i.name || i.username })));
        } catch (error) {} finally { setLoading(false); }
    };

    useEffect(() => { loadInitialData(); }, []);

    // 🟢 CÉREBRO DA ESTIMATIVA (Bidirecional e sem quebrar a data)
    const estimation = useMemo(() => {
        if (!newPlan.startDate) return null;

        let filtered = allDevices.filter(d => d.isActive !== false);

        if (newPlan.targetTypes.length > 0) {
            const selectedTypes = newPlan.targetTypes.map(t => String(t).trim().toUpperCase());
            filtered = filtered.filter(d => {
                const dType = String(d.deviceType || d.type || '').trim().toUpperCase();
                return selectedTypes.includes(dType);
            });
        }

        if (newPlan.targetSectors.length > 0) {
            const selectedSectors = newPlan.targetSectors.map(s => String(s).trim().toUpperCase());
            filtered = filtered.filter(d => {
                const sName = String(d.sector?.name || d.setorName || d.setor || '').trim().toUpperCase();
                return selectedSectors.includes(sName);
            });
        }

        const targetCount = filtered.length;
        const techCount = newPlan.selectedTechs.length; // 🟢 Apenas técnicos manuais

        if (targetCount === 0 || techCount === 0) return { targetCount, techCount, calcDeadline: null, calcCapacity: 0 };

        let calcDeadline = null;
        let calcCapacity = 1;

        if (newPlan.lastEdited === 'deadline' && newPlan.deadline) {
            // MODO 1: Você mexeu na Data Limite, o sistema calcula a capacidade
            const safeDeadline = new Date(newPlan.deadline);
            const businessDays = calculateBusinessDays(newPlan.startDate, safeDeadline);
            calcCapacity = businessDays > 0 ? Math.ceil(targetCount / (techCount * businessDays)) : 1;
            calcDeadline = safeDeadline;
        } else {
            // MODO 2: Você mexeu na Capacidade, o sistema calcula a Data Limite
            const capacityPerDay = techCount * newPlan.dailyCapacity;
            const daysNeeded = Math.ceil(targetCount / capacityPerDay);
            calcDeadline = addBusinessDays(newPlan.startDate, Math.max(0, daysNeeded - 1));
            calcCapacity = newPlan.dailyCapacity;
        }

        return { targetCount, techCount, calcDeadline, calcCapacity };
    }, [newPlan, allDevices]);

    const handleCreatePlan = async () => {
        if (!newPlan.name) return alert("Dê um nome ao plano.");
        if (newPlan.selectedTechs.length === 0) return alert("Selecione ao menos um técnico.");
        
        try {
            setLoading(true);

            // 🟢 Blindagem do Meio-Dia na Data de Início
            const dataInicioSegura = new Date(newPlan.startDate);
            dataInicioSegura.setHours(12, 0, 0, 0);

            // 🟢 Blindagem do Meio-Dia na Data Limite (se o usuário a escolheu)
            let dataLimiteSegura = null;
            if (newPlan.deadline && newPlan.lastEdited === 'deadline') {
                dataLimiteSegura = new Date(newPlan.deadline);
                dataLimiteSegura.setHours(12, 0, 0, 0);
            }

            // 🟢 O NOVO PAYLOAD INTELIGENTE
            // Enviamos apenas o que o utilizador travou. O Backend calcula o resto!
            const payload = { 
                name: newPlan.name,
                startDate: dataInicioSegura,
                dailyCapacity: newPlan.lastEdited === 'capacity' ? newPlan.dailyCapacity : null, // Envia NULO se mexeu na data
                deadline: newPlan.lastEdited === 'deadline' ? dataLimiteSegura : null, // Envia NULO se mexeu na capacidade
                targetTypes: newPlan.targetTypes,
                targetSectors: newPlan.targetSectors,
                distributeToAllTechs: false, 
                selectedTechs: newPlan.selectedTechs,
                targetCount: estimation.targetCount
            };
            
            await createActionPlan(payload);
            setIsCreating(false);
            setNewPlan({ name: '', startDate: new Date(), dailyCapacity: 1, deadline: null, lastEdited: 'capacity', targetSectors: [], targetTypes: [], selectedTechs: [] });
            await loadInitialData();
        } catch (error) { 
            alert("Erro ao criar plano: " + (error.response?.data?.error || error.message)); 
        } finally { setLoading(false); }
    };

    const handleDeletePlan = async (id) => {
        if(window.confirm("Isso removerá o plano e todas as atribuições. Certeza?")){
            try {
                setLoading(true);
                await deleteActionPlan(id);
                setPlans(plans.filter(p => p.id !== id));
            } catch (error) {
                console.error("Erro ao excluir plano:", error);
                alert("Erro ao excluir: " + (error.response?.data?.error || error.message));
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading && !plans) return <Center p="xl"><Loader color={BRAND_BLUE} /></Center>;

    if (isCreating) {
        return (
            <DatesProvider settings={{ locale: 'pt-br' }}>
                <Stack gap="xl">
                    <Group justify="space-between">
                        <Title order={3}>Crie um novo plano de preventivas:</Title>
                        <Button variant="subtle" color="gray" onClick={() => setIsCreating(false)}>Cancelar</Button>
                    </Group>
                    
                    <Card withBorder radius="lg" shadow="sm" p="xl">
                        <Stack gap="lg">
                            
                            <Divider label={<Text fw={700} c={BRAND_BLUE} size="sm">1. Duração e Capacidade</Text>} labelPosition="left" variant="dashed" />

                            <SimpleGrid cols={{ base: 1, sm: 2 }} align="flex-end">
                                <TextInput label="Nome da Campanha *" placeholder="Ex: Geral Q3" required value={newPlan.name} onChange={(e) => setNewPlan({...newPlan, name: e.target.value})} />
                                <DatePickerInput label="Data de Início *" required value={newPlan.startDate} onChange={(date) => setNewPlan({...newPlan, startDate: date})} valueFormat="DD/MM/YYYY" />
                            </SimpleGrid>

                            {/* 🟢 CAMPOS BIDIRECIONAIS MÁGICOS LADO A LADO */}
                            <SimpleGrid cols={{ base: 1, sm: 2 }} align="flex-end">
                                <NumberInput 
                                    label="Capacidade Diária (maq/dia) *" 
                                    value={newPlan.lastEdited === 'deadline' ? estimation?.calcCapacity || 1 : newPlan.dailyCapacity} 
                                    onChange={(val) => setNewPlan({...newPlan, dailyCapacity: val || 1, lastEdited: 'capacity'})} 
                                    min={1} 
                                    required 
                                />
                                <DatePickerInput 
                                    label="Data Limite de Finalização" 
                                    placeholder="Calculado automaticamente..."
                                    value={newPlan.lastEdited === 'capacity' ? estimation?.calcDeadline : newPlan.deadline} 
                                    onChange={(date) => setNewPlan({...newPlan, deadline: date, lastEdited: 'deadline'})}
                                    minDate={newPlan.startDate}
                                    valueFormat="DD/MM/YYYY"
                                />
                            </SimpleGrid>

                            <Divider label={<Text fw={700} c={BRAND_BLUE} size="sm">2. Dispositivos</Text>} labelPosition="left" variant="dashed" mt="md" />
                            <SimpleGrid cols={{ base: 1, sm: 2 }}>
                                <MultiSelect label="Tipos de Equipamento" description="Máquinas que receberão manutenção." data={deviceTypes} value={newPlan.targetTypes} onChange={(val) => setNewPlan({...newPlan, targetTypes: val})} searchable clearable />
                                <MultiSelect label="Restringir por Setor (Opcional)" description="Vazio = Planta Inteira." data={sectors} value={newPlan.targetSectors} onChange={(val) => setNewPlan({...newPlan, targetSectors: val})} searchable clearable />
                            </SimpleGrid>

                            <Divider label={<Text fw={700} c={BRAND_BLUE} size="sm">3. Técnicos</Text>} labelPosition="left" variant="dashed" mt="md" />
                            
                            <MultiSelect 
                                label="Selecionar Técnicos Específicos *" 
                                placeholder="Escolha quem vai participar da campanha..."
                                data={technicians} 
                                value={newPlan.selectedTechs} 
                                onChange={(val) => setNewPlan({...newPlan, selectedTechs: val})} 
                                leftSection={<IconUsers size={16}/>} 
                                required 
                            />

                            {/* 🟢 CARD DE ANÁLISE DINÂMICA (Protegido contra erros de Data) */}
                            {estimation && estimation.targetCount > 0 && newPlan.selectedTechs.length > 0 && (
                                <Paper p="md" radius="md" bg="blue.0" style={{ border: '1px solid #d0ebff' }}>
                                    <Stack gap={4}>
                                        <Group>
                                            <ThemeIcon color={BRAND_BLUE} variant="light">
                                                <IconCalendar size={18} />
                                            </ThemeIcon>
                                            <Text fw={700}>Análise da Campanha</Text>
                                        </Group>
                                        <Text size="sm">Fim estimado: <b>{estimation.calcDeadline instanceof Date && !isNaN(estimation.calcDeadline.getTime()) ? estimation.calcDeadline.toLocaleDateString('pt-BR') : '---'}</b></Text>
                                        <Text size="sm">Carga de trabalho: <b>{estimation.calcCapacity} máquinas / dia</b> por técnico.</Text>
                                        <Text size="xs" c="dimmed">Total de {estimation.targetCount} equipamentos para {estimation.techCount} técnicos.</Text>
                                    </Stack>
                                </Paper>
                            )}
                            
                            {estimation && estimation.targetCount === 0 && (
                                <Paper p="md" radius="md" bg="orange.0" style={{ border: '1px solid #ffe8cc' }}>
                                    <Group wrap="nowrap" align="flex-start">
                                        <ThemeIcon size="lg" radius="md" color="orange" variant="light">
                                            <IconInfoCircle size={20} />
                                        </ThemeIcon>
                                        <div>
                                            <Text size="sm" fw={700} c="orange.9">Nenhum equipamento encontrado</Text>
                                            <Text size="xs" c="orange.8" mt={2}>Os filtros selecionados não retornaram nenhuma máquina elegível.</Text>
                                        </div>
                                    </Group>
                                </Paper>
                            )}
                            
                            <Button 
                                fullWidth 
                                size="lg" 
                                mt="sm" 
                                color={BRAND_BLUE} 
                                onClick={handleCreatePlan} 
                                loading={loading} 
                                disabled={estimation?.targetCount === 0 || newPlan.selectedTechs.length === 0}
                            >
                                Lançar Plano de Ação
                            </Button>
                        </Stack>
                    </Card>
                </Stack>
            </DatesProvider>
        );
    }

    return (
        <Stack gap="lg">
            <Group justify="space-between" bg="#f8f9fa" p="md" style={{ borderRadius: '8px' }}>
                <Text fw={500} c="dimmed">Gerencie campanhas ativas.</Text>
                <Button leftSection={<IconListCheck size={18} />} color={BRAND_BLUE} onClick={() => setIsCreating(true)}>Nova Campanha</Button>
            </Group>

            <SimpleGrid cols={{ base: 1, md: 2 }}>
                {plans.map(plan => (
                    <Card key={plan.id} shadow="sm" radius="lg" withBorder padding="lg">
                        <Group justify="space-between">
                            <Badge variant="light" color={new Date(plan.startDate) > new Date() ? "orange" : "teal"}>{new Date(plan.startDate) > new Date() ? "Agendado" : "Ativo"}</Badge>
                            <ActionIcon color="red" variant="subtle" onClick={() => handleDeletePlan(plan.id)}><IconTrash size={18} /></ActionIcon>
                        </Group>
                        <Text fw={800} size="xl" mt="sm">{plan.name}</Text>
                        <Text size="sm" c="dimmed" mb="md">{new Date(plan.startDate).toLocaleDateString('pt-BR')} até {new Date(plan.deadline).toLocaleDateString('pt-BR')}</Text>
                        <Group gap={6} p="sm" bg="gray.0" style={{ borderRadius: '8px' }}>
                            <Text size="sm" fw={700} c={BRAND_BLUE}>🎯 Meta: {plan.dailyCapacity} maq/dia</Text>
                        </Group>
                    </Card>
                ))}
            </SimpleGrid>
        </Stack>
    );
};

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
          size={activeModal === 'plans' ? "65rem" : "55rem"} 
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