// src/pages/DeviceListPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom'; // <-- 1. Importe useLocation
import { getDevices } from '../services/api';
import { 
  Table, Title, Group, Button, Anchor, Text, Menu, TextInput 
} from '@mantine/core';
import { 
  IconFilter, IconDeviceDesktop, IconPrinter, IconList, IconSearch,
  IconAlertTriangle, IconClock // <-- 2. Importe os ícones de status
} from '@tabler/icons-react';

const filterLabels = {
  all: 'Todos',
  computer: 'Computadores',
  printer: 'Impressoras'
};

function DeviceListPage() {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const location = useLocation(); // <-- 3. Obtenha a localização
  
  const [filterType, setFilterType] = useState('computer');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 4. O novo filtro de status, lido do clique no dashboard (ou 'all' por defeito)
  const [statusFilter, setStatusFilter] = useState(location.state?.initialStatusFilter || 'all'); 

  useEffect(() => {
    // ... (lógica de fetch igual)
    const fetchDevices = async () => {
      try {
        const data = await getDevices();
        if (data.success) {
          setDevices(data.devices);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDevices();
  }, []);

  // --- 5. ATUALIZE A LÓGICA DE FILTRAGEM ---
  const filteredDevices = useMemo(() => {
    let tempDevices = devices;
    const now = new Date();

    // Filtro por TIPO (Computador/Impressora)
    if (filterType !== 'all') {
      tempDevices = tempDevices.filter(device => device.deviceType === filterType);
    }

    // Filtro por STATUS (Atrasado/Próximo)
    if (statusFilter === 'overdue') {
      tempDevices = tempDevices.filter(device => 
        device.nextPreventiveDate && new Date(device.nextPreventiveDate) <= now
      );
    } else if (statusFilter === 'upcoming') {
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      tempDevices = tempDevices.filter(device => 
        device.nextPreventiveDate && 
        new Date(device.nextPreventiveDate) > now && 
        new Date(device.nextPreventiveDate) <= thirtyDaysFromNow
      );
    }
    
    // Filtro por PESQUISA (Nome)
    if (searchQuery.trim() !== '') {
      tempDevices = tempDevices.filter(device => 
        device.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return tempDevices;
  }, [devices, filterType, statusFilter, searchQuery]); // Adicione statusFilter e searchQuery
  
  if (isLoading) return <div>A carregar dispositivos...</div>;
  if (error) return <div style={{ color: 'red' }}>Erro: {error}</div>;

  const rows = filteredDevices.map((device) => (
    <Table.Tr key={device.id}>
      <Table.Td>
        <Anchor component={Link} to={`/devices/${device.id}`} size="sm" fw={500}>
          {device.name}
        </Anchor>
      </Table.Td>
      <Table.Td>{device.deviceType.charAt(0).toUpperCase() + device.deviceType.slice(1)}</Table.Td>
      <Table.Td>{device.serial || 'N/A'}</Table.Td>
      <Table.Td>{device.nextPreventiveDate ? new Date(device.nextPreventiveDate).toLocaleDateString() : 'N/D'}</Table.Td>
    </Table.Tr>
  ));
  
  return (
    <div>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Inventário de Dispositivos ({filteredDevices.length})</Title>
        <Group>
          <TextInput
            placeholder="Buscar por nome..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* --- 6. MENU DE FILTRO DE STATUS --- */}
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button 
                leftSection={<IconFilter size={16} />} 
                variant="light"
                // Muda a cor do botão com base no filtro ativo
                color={statusFilter === 'overdue' ? 'red' : (statusFilter === 'upcoming' ? 'yellow' : 'blue')}
              >
                Status: {statusFilter === 'all' ? 'Todos' : (statusFilter === 'overdue' ? 'Atrasados' : 'Próximos')}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Filtrar por Status</Menu.Label>
              <Menu.Item leftSection={<IconList size={14} />} onClick={() => setStatusFilter('all')}>Todos</Menu.Item>
              <Menu.Item color="red" leftSection={<IconAlertTriangle size={14} />} onClick={() => setStatusFilter('overdue')}>Atrasados</Menu.Item>
              <Menu.Item color="yellow" leftSection={<IconClock size={14} />} onClick={() => setStatusFilter('upcoming')}>Próximos</Menu.Item>
            </Menu.Dropdown>
          </Menu>

          {/* Menu de Filtro de TIPO */}
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button 
                leftSection={<IconFilter size={16} />} 
                variant="light"
              >
                Tipo: {filterLabels[filterType]}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Filtrar por tipo</Menu.Label>
              <Menu.Item leftSection={<IconList size={14} />} onClick={() => setFilterType('all')}>Todos</Menu.Item>
              <Menu.Item leftSection={<IconDeviceDesktop size={14} />} onClick={() => setFilterType('computer')}>Computadores</Menu.Item>
              <Menu.Item leftSection={<IconPrinter size={14} />} onClick={() => setFilterType('printer')}>Impressoras</Menu.Item>
            </Menu.Dropdown>
          </Menu>
          
        </Group>
      </Group>

      {/* Tabela */}
      <Table withTableBorder withColumnBorders highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nome</Table.Th>
            <Table.Th>Tipo</Table.Th>
            <Table.Th>Nº de Série</Table.Th>
            <Table.Th>Próxima Preventiva</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length > 0 ? rows : (
            <Table.Tr>
              <Table.Td colSpan={4} ta="center">Nenhum dispositivo encontrado.</Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </div>
  );
}

export default DeviceListPage;