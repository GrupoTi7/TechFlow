import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getDevices } from '../services/api';
import { 
  Table, 
  Title, 
  Group, 
  Button, 
  Text, 
  TextInput, 
  Paper, 
  LoadingOverlay, 
  Stack,
  Pagination,
  ScrollArea // <-- A única importação nova necessária
} from '@mantine/core';
import { IconSearch, IconEye } from '@tabler/icons-react';

function DeviceListPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const data = await getDevices();
      if (data.success) {
        setDevices(data.devices);
      }
    } catch (error) {
      console.error('Erro ao buscar dispositivos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtro
  const filteredDevices = useMemo(() => {
    if (!search) return devices;
    const lower = search.toLowerCase();
    return devices.filter((d) =>
      (d.name?.toLowerCase() || '').includes(lower) ||
      (d.serial?.toLowerCase() || '').includes(lower) ||
      (d.contact?.toLowerCase() || '').includes(lower)
    );
  }, [devices, search]);

  // Paginação
  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
  const paginatedData = filteredDevices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Stack gap="lg">
      <Paper withBorder p="md" radius="md" shadow="sm">
        <Group justify="space-between" mb="md">
          <Title order={3}>Inventário de Dispositivos ({filteredDevices.length})</Title>
          
          <Group>
             <TextInput
              placeholder="Buscar por nome, serial..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              style={{ width: 300 }}
            />
            <Button variant="light" onClick={fetchDevices} loading={loading}>
              Atualizar
            </Button>
          </Group>
        </Group>

        <div style={{ position: 'relative', minHeight: 200 }}>
          <LoadingOverlay visible={loading} />
          
          {/* --- AQUI ESTÁ A CORREÇÃO DE RESPONSIVIDADE --- */}
          <ScrollArea>
            {/* minWidth=800 garante que a tabela não esmaga em telas pequenas */}
            <Table striped highlightOnHover verticalSpacing="sm" minWidth={800}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nome</Table.Th>
                  <Table.Th>Setor</Table.Th>
                  <Table.Th>Tipo</Table.Th>
                  <Table.Th>Usuário</Table.Th>
                  {/* Mantendo o seu texto original de Status */}
                  <Table.Th>Status</Table.Th> 
                  <Table.Th>Ações</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((device) => (
                    <Table.Tr key={device.id}>
                      <Table.Td fw={500}>{device.name}</Table.Td>
                      <Table.Td>{device.setor || 'N/D'}</Table.Td>
                      <Table.Td>{device.deviceType || 'N/D'}</Table.Td>
                      <Table.Td>{device.contact || 'N/D'}</Table.Td>
                      <Table.Td>
                        {/* Lógica simples de texto para status, como antes */}
                        {device.maintenanceIntervalDays ? (
                            device.maintenanceIntervalDays === 30 ? 'Produção (30d)' : 'Adm (120d)'
                        ) : 'N/D'}
                      </Table.Td>
                      <Table.Td>
                        <Button 
                          component={Link} 
                          to={`/devices/${device.id}`} 
                          variant="subtle" 
                          size="xs"
                          leftSection={<IconEye size={16} />}
                        >
                          Detalhes
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={6} ta="center">
                      <Text c="dimmed">Nenhum dispositivo encontrado.</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
          {/* --------------------------------------------- */}

          {totalPages > 1 && (
            <Group justify="center" mt="lg">
              <Pagination total={totalPages} value={currentPage} onChange={setCurrentPage} />
            </Group>
          )}
        </div>
      </Paper>
    </Stack>
  );
}

export default DeviceListPage;