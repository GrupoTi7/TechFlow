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
  Title, Text, Paper, Grid, Stack, Anchor, TextInput, Textarea, 
  Button, Alert, Table, ThemeIcon, Group, SimpleGrid, Center, 
  Modal, Select, ActionIcon 
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import { 
  IconAlertCircle, IconDeviceDesktop, IconBuildingCommunity, 
  IconBuildingFactory, IconId, IconUserCircle, IconBrandWindows, 
  IconCalendarDue, IconPencilPlus, IconHistory, IconCalendarTime, 
  IconDeviceAnalytics, IconCalendarCheck, IconEdit 
} from '@tabler/icons-react';

import { allSetorOptions, getIntervalFromSetor } from '../utils/sectors';

// --- FUNÇÃO AUXILIAR À PROVA DE BALAS ---
// Pega "2026-01-27T00:00:00.000Z" e transforma em "27/01/2026" na marra.
const formatDateNoTimezone = (dateString) => {
  if (!dateString) return 'N/D';
  try {
    // Pega só a parte antes do T (2026-01-27)
    const isoDate = dateString.split('T')[0];
    // Divide por traço, inverte e junta com barra
    return isoDate.split('-').reverse().join('/');
  } catch (e) {
    return dateString; // Retorna original se falhar
  }
};

function InfoItem({ icon, label, children, onEdit }) {
  const isValueEmpty = !children || children === 'N/D' || children === 'Não categorizado';

  return (
    <Group gap="sm" wrap="nowrap" align="flex-start">
      <ThemeIcon variant="light" size="lg" radius="md" style={{ flexShrink: 0 }}>
        {icon}
      </ThemeIcon>
      <div style={{ overflow: 'hidden', width: '100%' }}>
        <Group justify="space-between" align="center" style={{ width: '100%' }}>
          <Text size="xs" c="dimmed">{label}</Text>
          {onEdit && (
            <ActionIcon variant="subtle" size="xs" color="blue" onClick={onEdit}>
              <IconEdit size="0.8rem" />
            </ActionIcon>
          )}
        </Group>
        <Text 
          size="sm" 
          fw={500} 
          c={isValueEmpty ? 'dimmed' : 'inherit'}
          style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'normal' }}
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

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <Alert color="red">{error}</Alert>;
  if (!device) return <div>Dispositivo não encontrado.</div>;

  return (
    <Stack gap="xl">
      <Anchor component={Link} to="/devices">&larr; Voltar para a Lista</Anchor>
      <Title order={2}>Detalhes: {device.name}</Title>

      <Modal opened={openedModal} onClose={close} title="Alterar Setor do Dispositivo" centered>
        <Stack>
          <Select
            label="Selecione o novo setor"
            placeholder="Escolha um setor..."
            data={allSetorOptions}
            value={selectedSetor}
            onChange={setSelectedSetor}
            searchable
            nothingFoundMessage="Setor não encontrado"
          />
          <Text size="sm" c="dimmed">
            Ao alterar para <strong>{selectedSetor || '...'}</strong>, o intervalo de manutenção será atualizado automaticamente para <strong>{selectedSetor ? getIntervalFromSetor(selectedSetor) : '?'} dias</strong>.
          </Text>
          <Button onClick={handleSaveSetor} loading={savingSetor}>Salvar Alteração</Button>
        </Stack>
      </Modal>

      <Grid>
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Stack gap="xl">
            <Paper withBorder shadow="sm" p="lg" radius="md">
              <Group gap="sm" mb="lg">
                <ThemeIcon size="xl" variant="light" radius="md"><IconDeviceAnalytics size="1.5rem" /></ThemeIcon>
                <Title order={4}>Informações do Dispositivo</Title>
              </Group>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                <InfoItem icon={<IconDeviceDesktop size="1.2rem" />} label="Tipo">{device.deviceType}</InfoItem>
                <InfoItem icon={<IconBuildingCommunity size="1.2rem" />} label="Setor" onEdit={open}>{device.setor}</InfoItem>
                <InfoItem icon={<IconBuildingFactory size="1.2rem" />} label="Fabricante">{device.manufacturer}</InfoItem>
                <InfoItem icon={<IconId size="1.2rem" />} label="Modelo">{device.model}</InfoItem>
                <InfoItem icon={<IconUserCircle size="1.2rem" />} label="Usuário">{device.contact}</InfoItem>
                <InfoItem icon={<IconBrandWindows size="1.2rem" />} label="Sistema Operacional">{device.operatingSystem}</InfoItem>
              </SimpleGrid>

              <Stack mt="xl" gap="md">
                <Title order={5} ta="center">Manutenção</Title>
                <InfoItem icon={<IconCalendarTime size="1.2rem" />} label="Intervalo (Dias)">{device.maintenanceIntervalDays} dias</InfoItem>
                
                {/* USA A NOVA FUNÇÃO AQUI */}
                <InfoItem icon={<IconCalendarCheck size="1.2rem" />} label="Última Preventiva">
                  {formatDateNoTimezone(device.lastPreventiveDate)}
                </InfoItem>
                
                {/* E AQUI */}
                <InfoItem icon={<IconCalendarDue size="1.2rem" />} label="Próxima Preventiva">
                  {formatDateNoTimezone(device.nextPreventiveDate)}
                </InfoItem>
              </Stack>
            </Paper>

            <Paper withBorder shadow="sm" p="lg" radius="md">
              <Title order={4} mb="md">Registar Nova Preventiva</Title>
              <form onSubmit={handlePreventiveSubmit}>
                <Stack>
                  <TextInput label="Data" type="date" value={newPreventiveDate} onChange={(e) => setNewPreventiveDate(e.target.value)} required />
                  <Textarea label="Notas" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} minRows={3} />
                  {formError && <Alert color="red" icon={<IconAlertCircle />}>{formError}</Alert>}
                  <Button type="submit" leftSection={<IconPencilPlus size={18} />}>Adicionar Registo</Button>
                </Stack>
              </form>
            </Paper>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 7 }}>
           <Paper withBorder shadow="sm" p="lg" radius="md">
             <Title order={4} mb="md">Histórico de Preventivas</Title>
             {preventives.length > 0 ? (
               <Table striped highlightOnHover>
                 <Table.Thead><Table.Tr><Table.Th>Data</Table.Th><Table.Th>Técnico</Table.Th><Table.Th>Notas</Table.Th><Table.Th>Ações</Table.Th></Table.Tr></Table.Thead>
                 <Table.Tbody>
                   {preventives.map((prev) => (
                     <Table.Tr key={prev.id}>
                       {/* E FINALMENTE AQUI NA TABELA */}
                       <Table.Td>{formatDateNoTimezone(prev.date)}</Table.Td>
                       <Table.Td>{prev.technician}</Table.Td>
                       <Table.Td>{prev.notes}</Table.Td>
                       <Table.Td><Button color="red" variant="outline" size="xs" onClick={() => handleDeletePreventive(prev.id)}>Apagar</Button></Table.Td>
                     </Table.Tr>
                   ))}
                 </Table.Tbody>
               </Table>
             ) : (<Center h={100}><Text c="dimmed">Nenhum registo encontrado.</Text></Center>)}
           </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

export default DeviceDetailPage;