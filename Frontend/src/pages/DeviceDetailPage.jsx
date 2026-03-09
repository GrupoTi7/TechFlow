import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  getDeviceById, 
  getPreventivesForDevice, 
  createPreventive, 
  deletePreventive,
  updateDeviceSetor 
} from '../services/api';

import { 
  Title, Text, Paper, Grid, Stack, TextInput, Textarea, 
  Button, Alert, Table, ThemeIcon, Group, SimpleGrid, Center, 
  Modal, Select, ActionIcon, Badge, Avatar
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import { 
  IconAlertCircle, IconDeviceDesktop, 
  IconBuildingFactory, IconId, IconUserCircle, IconBrandWindows, 
  IconCalendarDue, IconPencilPlus, IconHistory, 
  IconDeviceAnalytics, IconCalendarCheck, IconEdit, IconArrowLeft, IconTrash,
  IconCalendarTime 
} from '@tabler/icons-react';

import { allSetorOptions, getIntervalFromSetor } from '../utils/sectors';

// --- COR DA MARCA (SIDEBAR) ---
const BRAND_BLUE = '#0003d9';

// --- FUNÇÃO AUXILIAR ---
const formatDateNoTimezone = (dateString) => {
  if (!dateString) return 'N/D';
  try {
    const isoDate = dateString.split('T')[0];
    return isoDate.split('-').reverse().join('/');
  } catch (e) {
    return dateString;
  }
};

// --- STAT CARD ---
function StatCard({ title, value, subtext, icon, color }) {
    // Se a cor passada for "blue", forçamos o azul da marca, senão usa a cor padrão mantine
    const borderColor = color === 'blue' ? BRAND_BLUE : `var(--mantine-color-${color}-filled)`;
    
    return (
        <Paper withBorder p="md" radius="md" style={{ borderLeft: `5px solid ${borderColor}` }}>
            <Group justify="space-between" align="flex-start">
                <div>
                    <Text c="dimmed" tt="uppercase" fw={700} size="xs">{title}</Text>
                    <Text fw={800} size="xl" mt={4}>{value}</Text>
                    <Text c="dimmed" size="xs" mt={4}>{subtext}</Text>
                </div>
                <ThemeIcon size={42} color={color === 'blue' ? BRAND_BLUE : color} variant="light" radius="md">
                    {icon}
                </ThemeIcon>
            </Group>
        </Paper>
    );
}

// --- INFO ITEM (FICHA TÉCNICA) ---
function InfoItem({ icon, label, children, onEdit }) {
  const isValueEmpty = !children || children === 'N/D' || children === 'Não categorizado';

  return (
    <Group gap="md" wrap="nowrap" align="center" mb="md">
      {/* Ícone VIVO com Azul da Marca */}
      <ThemeIcon variant="filled" color={BRAND_BLUE} size={38} radius="md" style={{ flexShrink: 0 }}>
        {icon}
      </ThemeIcon>
      
      <div style={{ overflow: 'hidden', width: '100%' }}>
        <Group justify="space-between" align="center" style={{ width: '100%' }}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700} ls={1}>{label}</Text>
          {onEdit && (
            <ActionIcon variant="subtle" size="xs" color={BRAND_BLUE} onClick={onEdit}>
              <IconEdit size="0.9rem" />
            </ActionIcon>
          )}
        </Group>
        <Text 
          size="sm" 
          fw={600} 
          c={isValueEmpty ? 'dimmed' : 'dark.4'}
          style={{ wordBreak: 'break-word', lineHeight: 1.3 }}
        >
          {isValueEmpty ? 'Não definido' : children}
        </Text>
      </div>
    </Group>
  );
}

function DeviceDetailPage() {
  const { id } = useParams();
  const [device, setDevice] = useState(null);
  const [preventives, setPreventives] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [newPreventiveDate, setNewPreventiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNotes, setNewNotes] = useState('');
  const [formError, setFormError] = useState(null);

  const [openedModal, { open, close }] = useDisclosure(false);
  const [selectedSetor, setSelectedSetor] = useState('');
  const [savingSetor, setSavingSetor] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true); 
      const [deviceRes, preventivesRes] = await Promise.all([
        getDeviceById(id),
        getPreventivesForDevice(id)
      ]);
      if (deviceRes.success) {
        setDevice(deviceRes.device);
        setSelectedSetor(deviceRes.device.setor || ''); 
      }
      if (preventivesRes.success) setPreventives(preventivesRes.preventives);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (id) loadData(); }, [id]);

  const handleSaveSetor = async () => {
    if (!selectedSetor) return;
    setSavingSetor(true);
    try {
      const interval = getIntervalFromSetor(selectedSetor);
      await updateDeviceSetor(id, selectedSetor, interval);
      setDevice(prev => ({ ...prev, setor: selectedSetor, maintenanceIntervalDays: interval }));
      close(); 
    } catch (err) {
      alert('Erro ao atualizar setor: ' + err.message);
    } finally {
      setSavingSetor(false);
    }
  };

  const handlePreventiveSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    try {
      await createPreventive(id, { date: new Date(newPreventiveDate), notes: newNotes });
      setNewNotes('');
      loadData(); 
      alert('Preventiva registada!');
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDeletePreventive = async (preventiveId) => {
    if (!window.confirm('Apagar este registo?')) return;
    try {
      await deletePreventive(preventiveId);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (isLoading) return <Center h="100vh">Carregando...</Center>;
  if (error) return <Alert color="red" title="Erro">{error}</Alert>;
  if (!device) return <Alert color="orange">Dispositivo não encontrado.</Alert>;

  return (
    <Stack gap="lg" pb="xl">
      {/* --- HEADER --- */}
      <Group>
          <Button component={Link} to="/devices" variant="subtle" leftSection={<IconArrowLeft size={18} />} color="gray">
            Voltar para Lista
          </Button>
      </Group>

      {/* --- MODAL --- */}
      <Modal opened={openedModal} onClose={close} title={<Text fw={700}>Alterar Setor</Text>} centered radius="md">
        <Stack>
          <Select
            label="Novo Setor"
            placeholder="Escolha..."
            data={allSetorOptions}
            value={selectedSetor}
            onChange={setSelectedSetor}
            searchable
            mb="sm"
          />
          <Alert variant="light" color={BRAND_BLUE} title="Atualização Automática" icon={<IconCalendarTime/>}>
             Intervalo será ajustado para <strong>{selectedSetor ? getIntervalFromSetor(selectedSetor) : '?'} dias</strong>.
          </Alert>
          <Button onClick={handleSaveSetor} loading={savingSetor} fullWidth mt="md" color={BRAND_BLUE}>Confirmar Alteração</Button>
        </Stack>
      </Modal>

      {/* --- HERO SECTION --- */}
      <Paper p="xl" radius="md" withBorder style={{ borderLeft: `6px solid ${BRAND_BLUE}` }}>
         <Group justify="space-between" align="flex-start">
            <Group gap="lg">
                <Avatar color={BRAND_BLUE} size="xl" radius="md">
                    <IconDeviceDesktop size={40} />
                </Avatar>
                <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={800} ls={1}>Detalhes do Ativo</Text>
                    <Title order={2} style={{ lineHeight: 1.1, color: '#212529' }}>{device.name}</Title>
                    <Group gap="xs" mt={6}>
                         {/* Badge Azul Sidebar */}
                         <Badge size="lg" color={BRAND_BLUE} variant="light">{device.setor || 'Sem Setor'}</Badge>
                         <Badge size="lg" color="gray" variant="outline">{device.serial || 'S/N'}</Badge>
                    </Group>
                </div>
            </Group>
            
            <Button variant="light" color={BRAND_BLUE} onClick={open} leftSection={<IconEdit size={16} />}>
                Editar Setor
            </Button>
         </Group>
      </Paper>

      {/* --- STATS CARDS --- */}
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
         <StatCard 
            title="Ciclo de Manutenção" 
            value={`${device.maintenanceIntervalDays || 0} dias`} 
            subtext="Intervalo padrão do setor"
            icon={<IconHistory size={24}/>}
            color="gray"
         />
         <StatCard 
            title="Última Preventiva" 
            value={formatDateNoTimezone(device.lastPreventiveDate)} 
            subtext="Execução confirmada"
            icon={<IconCalendarCheck size={24}/>}
            color="teal"
         />
         {/* Este card usa o Azul da Marca */}
         <StatCard 
            title="Próxima Preventiva" 
            value={formatDateNoTimezone(device.nextPreventiveDate)} 
            subtext={device.nextPreventiveDate ? 'Data programada' : 'Sem agendamento'}
            icon={<IconCalendarDue size={24}/>}
            color="blue" 
         />
      </SimpleGrid>

      <Grid gutter="lg">
        {/* --- COLUNA DA ESQUERDA --- */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Stack gap="lg">
            
            {/* --- CARD FICHA TÉCNICA (AZUL DA MARCA) --- */}
            <Paper 
                withBorder 
                shadow="sm" 
                p="lg" 
                radius="md" 
                style={{ borderTop: `4px solid ${BRAND_BLUE}` }}
            >
              <Group mb="lg" pb="xs" style={{ borderBottom: '1px solid #eee' }}>
                 <ThemeIcon color={BRAND_BLUE} variant="filled" radius="md" size={32}><IconDeviceAnalytics size={20} /></ThemeIcon>
                 <Text fw={800} size="lg" c={BRAND_BLUE}>Ficha Técnica</Text>
              </Group>

              <Stack gap="xs">
                <InfoItem icon={<IconDeviceDesktop size="1.1rem" />} label="Tipo">{device.deviceType}</InfoItem>
                <InfoItem icon={<IconBuildingFactory size="1.1rem" />} label="Fabricante">{device.manufacturer}</InfoItem>
                <InfoItem icon={<IconId size="1.1rem" />} label="Modelo">{device.model}</InfoItem>
                <InfoItem icon={<IconBrandWindows size="1.1rem" />} label="Sistema Operacional">{device.operatingSystem}</InfoItem>
                <InfoItem icon={<IconUserCircle size="1.1rem" />} label="Usuário/Responsável">{device.contact}</InfoItem>
              </Stack>
            </Paper>

            {/* --- CARD NOVA PREVENTIVA (ROXO MANTIDO) --- */}
            <Paper 
                withBorder 
                shadow="sm" 
                p="lg" 
                radius="md"
                style={{ borderTop: `4px solid ${BRAND_BLUE}` }} 
            >
              <Group mb="md">
                 <ThemeIcon color={BRAND_BLUE} variant="light" radius="xl"><IconPencilPlus size={18} /></ThemeIcon>
                 <Text fw={700} size="lg" c={BRAND_BLUE}>Nova Preventiva</Text>
              </Group>
              
              <form onSubmit={handlePreventiveSubmit}>
                <Stack>
                  <TextInput 
                    label="Data da Execução" 
                    type="date" 
                    value={newPreventiveDate} 
                    onChange={(e) => setNewPreventiveDate(e.target.value)} 
                    required 
                  />
                  <Textarea 
                    label="Observações / Notas" 
                    placeholder="Descreva o que foi feito..." 
                    value={newNotes} 
                    onChange={(e) => setNewNotes(e.target.value)} 
                    minRows={3} 
                  />
                  {formError && <Alert color="red" icon={<IconAlertCircle />}>{formError}</Alert>}
                  <Button type="submit" fullWidth mt="xs" color={BRAND_BLUE}>Registrar Manutenção</Button>
                </Stack>
              </form>
            </Paper>
          </Stack>
        </Grid.Col>

        {/* --- COLUNA DA DIREITA: HISTÓRICO (CINZA MANTIDO) --- */}
        <Grid.Col span={{ base: 12, md: 7 }}>
           <Paper 
              withBorder 
              shadow="sm" 
              p="lg" 
              radius="md" 
              h="100%"
              style={{ borderTop: '4px solid #868e96' }} 
           >
             <Group mb="lg" justify="space-between" align="center">
                <Group>
                    <ThemeIcon color="gray" variant="light" radius="xl"><IconHistory size={20} /></ThemeIcon>
                    <Text fw={700} size="lg">Histórico de Atividades</Text>
                </Group>
                <Badge variant="light" color="gray" size="lg">{preventives.length} Registros</Badge>
             </Group>

             {preventives.length > 0 ? (
               <Table striped highlightOnHover verticalSpacing="sm">
                 <Table.Thead>
                   <Table.Tr>
                     <Table.Th>Data</Table.Th>
                     <Table.Th>Técnico</Table.Th>
                     <Table.Th>Notas</Table.Th>
                     <Table.Th style={{ textAlign: 'right' }}>Ações</Table.Th>
                   </Table.Tr>
                 </Table.Thead>
                 <Table.Tbody>
                   {preventives.map((prev) => (
                     <Table.Tr key={prev.id}>
                       <Table.Td style={{ whiteSpace: 'nowrap' }}>
                            <Badge variant="dot" color="green" size="md">
                                {formatDateNoTimezone(prev.date)}
                            </Badge>
                       </Table.Td>
                       <Table.Td>
                            <Text size="sm" fw={500}>{prev.technician}</Text>
                       </Table.Td>
                       <Table.Td>
                            <Text size="sm" c="dimmed" lineClamp={2} title={prev.notes}>{prev.notes || '-'}</Text>
                       </Table.Td>
                       <Table.Td style={{ textAlign: 'right' }}>
                            <ActionIcon color="red" variant="subtle" onClick={() => handleDeletePreventive(prev.id)}>
                                <IconTrash size={18} />
                            </ActionIcon>
                       </Table.Td>
                     </Table.Tr>
                   ))}
                 </Table.Tbody>
               </Table>
             ) : (
                <Center h={200} bg="gray.0" style={{ borderRadius: 8 }}>
                    <Stack align="center" gap="xs">
                        <IconHistory size={40} color="#adb5bd" />
                        <Text c="dimmed">Nenhum registro encontrado.</Text>
                    </Stack>
                </Center>
             )}
           </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

export default DeviceDetailPage;