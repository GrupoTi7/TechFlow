// src/pages/DeviceDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDeviceById, getPreventivesForDevice, createPreventive } from '../services/api';

// 1. Importe os novos componentes Mantine
import {
  Title,
  Text,
  Paper,
  Grid,
  Stack,
  Anchor,
  TextInput,
  Textarea,
  Button,
  Alert,
  Table,
  Badge,
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { addDays } from 'date-fns';

function DeviceDetailPage() {
  const { id } = useParams(); // Pega o ID do dispositivo do URL
  const [device, setDevice] = useState(null);
  const [preventives, setPreventives] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para o formulário da nova preventiva
  const [newPreventiveDate, setNewPreventiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTechnician, setNewTechnician] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [formError, setFormError] = useState(null);

  // Função para carregar todos os dados (detalhes + histórico)
  const loadData = async () => {
    try {
      setIsLoading(true);
      const deviceResult = await getDeviceById(id);
      const preventivesResult = await getPreventivesForDevice(id);

      if (deviceResult.success) setDevice(deviceResult.device);
      if (preventivesResult.success) setPreventives(preventivesResult.preventives);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Função para lidar com o envio do formulário
  const handlePreventiveSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    if (!newTechnician || !newPreventiveDate) {
      setFormError('Data e Técnico são obrigatórios.');
      return;
    }
    try {
      const preventiveData = {
        date: new Date(newPreventiveDate),
        technician: newTechnician,
        notes: newNotes,
      };
      await createPreventive(id, preventiveData);
      setNewTechnician('');
      setNewNotes('');
      setNewPreventiveDate(new Date().toISOString().split('T')[0]);
      alert('Preventiva registada com sucesso!');
      loadData(); // Recarrega os dados
    } catch (err) {
      setFormError(err.message);
    }
  };

  if (isLoading) return <div>A carregar detalhes do dispositivo...</div>;
  if (error) return <div style={{ color: 'red' }}>Erro: {error}</div>;
  if (!device) return <div>Dispositivo não encontrado.</div>;

  // 2. Renderize a página com os componentes Mantine
  return (
    <Stack gap="xl">
      <div>
        <Anchor component={Link} to="/devices" size="sm">
          &larr; Voltar para a lista de dispositivos
        </Anchor>
        <Title order={2} mt="md">{device.name}</Title>
      </div>

      <Grid>
        {/* Coluna Esquerda: Detalhes e Registo */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Stack gap="xl">
            {/* Cartão de Detalhes do Dispositivo */}
            <Paper withBorder shadow="sm" p="lg" radius="md">
              <Title order={4} mb="md">Detalhes</Title>
              <Stack gap="xs">
                <Text><strong>Tipo:</strong> {device.deviceType.charAt(0).toUpperCase() + device.deviceType.slice(1)}</Text>
                <Text><strong>Nº de Série:</strong> {device.serial || 'N/A'}</Text>
                <Text><strong>Intervalo de Manutenção:</strong> A cada {device.maintenanceIntervalDays} dias</Text>
                <Text fw={700} c="blue.7">
                  <strong>Próxima Preventiva: </strong>
                  {device.nextPreventiveDate ? new Date(device.nextPreventiveDate).toLocaleDateString() : 'Nenhuma agendada'}
                </Text>
              </Stack>
            </Paper>

            {/* Cartão de Registo de Preventiva */}
            <Paper withBorder shadow="sm" p="lg" radius="md">
              <Title order={4} mb="md">Registar Nova Preventiva</Title>
              <form onSubmit={handlePreventiveSubmit}>
                <Stack>
                  <TextInput
                    label="Data da Manutenção"
                    type="date"
                    value={newPreventiveDate}
                    onChange={(e) => setNewPreventiveDate(e.target.value)}
                    required
                  />
                  <TextInput
                    label="Nome do Técnico"
                    placeholder="Seu nome"
                    value={newTechnician}
                    onChange={(e) => setNewTechnician(e.target.value)}
                    required
                  />
                  <Textarea
                    label="Notas da Manutenção"
                    placeholder="Descreva o que foi feito..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    minRows={3}
                  />
                  {formError && (
                    <Alert color="red" icon={<IconAlertCircle size="1rem" />} title="Erro">
                      {formError}
                    </Alert>
                  )}
                  <Button type="submit">Adicionar Registo</Button>
                </Stack>
              </form>
            </Paper>
          </Stack>
        </Grid.Col>

        {/* Coluna Direita: Histórico */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Paper withBorder shadow="sm" p="lg" radius="md">
            <Title order={4} mb="md">Histórico de Preventivas</Title>
            <Table withTableBorder withColumnBorders highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Data</Table.Th>
                  <Table.Th>Técnico</Table.Th>
                  <Table.Th>Notas</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {preventives.length > 0 ? (
                  preventives.map(prev => (
                    <Table.Tr key={prev.id}>
                      <Table.Td>{new Date(prev.date).toLocaleDateString()}</Table.Td>
                      <Table.Td>{prev.technician}</Table.Td>
                      <Table.Td>{prev.notes || 'N/A'}</Table.Td>
                    </Table.Tr>
                  ))
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={3} ta="center">
                      Nenhum registo de preventiva encontrado.
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

export default DeviceDetailPage;