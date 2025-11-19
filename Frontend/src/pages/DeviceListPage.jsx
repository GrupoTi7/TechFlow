import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getDevices } from '../services/api';
import { 
  Table, Title, Group, Button, Text, TextInput, Paper, 
  LoadingOverlay, Stack, Pagination, ScrollArea, ActionIcon, Tooltip
} from '@mantine/core';
import { IconSearch, IconEye, IconRefresh } from '@tabler/icons-react';

// Importação dos componentes visuais
import StatusBadge from '../components/StatusBadge';
import DashboardStats from '../components/DashboardStats';

function DeviceListPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Mostra 10 itens por página para caber bem em notebooks

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const data = await getDevices();
      if (data.success) setDevices(data.devices);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDevices(); }, []);

  // Filtro de Pesquisa
  const filteredDevices = useMemo(() => {
    if (!search) return devices;
    const lower = search.toLowerCase();
    return devices.filter((d) =>
      (d.name?.toLowerCase() || '').includes(lower) ||
      (d.serial?.toLowerCase() || '').includes(lower) ||
      (d.contact?.toLowerCase() || '').includes(lower)
    );
  }, [devices, search]);

  // Cálculo da Paginação
  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
  const paginatedData = filteredDevices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Stack gap="md">
      {/* 1. DASHBOARD DE RESUMO */}
      <DashboardStats devices={devices} />

      <Paper withBorder p="md" radius="md" shadow="sm">
        {/* Cabeçalho da Tabela */}
        <Group justify="space-between" mb="md">
          <Title order={4}>Inventário ({filteredDevices.length})</Title>
          <Group gap="xs">
            <TextInput
              placeholder="Buscar dispositivo..."
              leftSection={<IconSearch size={14} />}
              size="sm"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              style={{ width: 250 }}
            />
            <Tooltip label="Atualizar Lista">
              <ActionIcon variant="light" size="lg" onClick={fetchDevices} loading={loading}>
                <IconRefresh size="1.1rem" />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {/* 2. TABELA COM SCROLL HORIZONTAL (Crucial para Notebooks) */}
        <div style={{ position: 'relative', minHeight: 200 }}>
          <LoadingOverlay visible={loading} />
          
          <ScrollArea>
            <Table striped highlightOnHover verticalSpacing="xs" minWidth={800}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nome</Table.Th>
                  <Table.Th>Setor</Table.Th>
                  <Table.Th>Usuário</Table.Th>
                  <Table.Th style={{ textAlign: 'center' }}>Status</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Ações</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((device) => (
                    <Table.Tr key={device.id}>
                      <Table.Td fw={600}>{device.name}</Table.Td>
                      <Table.Td style={{ fontSize: '0.9rem' }}>{device.setor || '-'}</Table.Td>
                      <Table.Td style={{ fontSize: '0.9rem' }}>{device.contact?.split('@')[0] || '-'}</Table.Td>
                      <Table.Td style={{ textAlign: 'center' }}>
                        <StatusBadge nextDate={device.nextPreventiveDate} />
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Button 
                          component={Link} 
                          to={`/devices/${device.id}`} 
                          variant="subtle" 
                          size="xs" 
                          compact
                        >
                          Detalhes
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={5} ta="center" py="xl" c="dimmed">
                      Nenhum dispositivo encontrado
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
          
          {/* Paginação */}
          {totalPages > 1 && (
            <Group justify="center" mt="md">
              <Pagination total={totalPages} value={currentPage} onChange={setCurrentPage} size="sm" />
            </Group>
          )}
        </div>
      </Paper>
    </Stack>
  );
}

export default DeviceListPage;