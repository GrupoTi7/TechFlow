// src/pages/DeviceListPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getDevices } from '../services/api';
import { 
  Table, Title, Group, Button, Anchor, Text, Menu, TextInput 
} from '@mantine/core';
import { 
  IconFilter, IconDeviceDesktop, IconPrinter, IconList, IconSearch,
  IconAlertTriangle, IconClock 
} from '@tabler/icons-react';
// (Não precisamos mais de IconBuildingStore ou IconBuildingFactory aqui)

const filterLabels = {
  all: 'Todos',
  computer: 'Computadores',
  printer: 'Impressoras'
};

function DeviceListPage() {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const location = useLocation();
  
  const [filterType, setFilterType] = useState('computer');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(location.state?.initialStatusFilter || 'all'); 
  
  // --- 1. LEIA O NOVO FILTRO DO DASHBOARD ---
  // Este estado controla o filtro, mas o botão para o mudar foi removido
  const [nomenclatureFilter, setNomenclatureFilter] = useState(location.state?.initialNomenclatureFilter || 'all');

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setIsLoading(true);
        // --- 2. PASSE TODOS OS FILTROS PARA A API ---
        const filters = {
          deviceType: filterType,
          status: statusFilter,
          searchQuery: searchQuery,
          nomenclature: nomenclatureFilter,
        };
        const data = await getDevices(filters);
        
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

    // 3. RE-BUSQUE OS DADOS sempre que qualquer filtro mudar
    fetchDevices();
  }, [filterType, statusFilter, searchQuery, nomenclatureFilter]); 

  // 4. O backend está a fazer a filtragem
  const filteredDevices = devices; 

  // --- 5. NOVA LÓGICA: Calcular contagens de subgrupos ---
  const subGroupCounts = useMemo(() => {
    if (nomenclatureFilter === 'owned') {
      const ptrCount = filteredDevices.filter(d => d.name.startsWith('PTR')).length;
      const trcCount = filteredDevices.filter(d => d.name.startsWith('TRC')).length;
      return `(Comprados: ${ptrCount} PTR, ${trcCount} TRC)`;
    }
    if (nomenclatureFilter === 'rented') {
      const netsiteCount = filteredDevices.filter(d => d.name.startsWith('NETSITE')).length;
      const vivoCount = filteredDevices.filter(d => d.name.startsWith('VIVO')).length;
      return `(Alugados: ${netsiteCount} NETSITE, ${vivoCount} VIVO)`;
    }
    return null; // Não mostra nada se o filtro for "all"
  }, [filteredDevices, nomenclatureFilter]);


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
        <Group>
          <Title order={2}>Inventário de Dispositivos ({filteredDevices.length})</Title>
          {/* --- 6. MOSTRAR AS CONTAGENS DOS SUBGRUPOS --- */}
          {subGroupCounts && <Text c="dimmed" size="lg">{subGroupCounts}</Text>}
        </Group>
        
        <Group>
          <TextInput
            placeholder="Buscar por nome..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {/* Menu de Filtro de Status */}
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button 
                leftSection={<IconFilter size={16} />} 
                variant="light"
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
          
          {/* Menu de Filtro de Tipo */}
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
          
          {/* --- 7. O MENU DE FILTRO DE NOMENCLATURA FOI REMOVIDO --- */}
          
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