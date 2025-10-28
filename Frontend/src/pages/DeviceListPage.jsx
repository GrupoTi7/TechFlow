// src/pages/DeviceListPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getDevices } from '../services/api';
import { 
  Table, Title, Group, Button, Anchor, Text, Menu, TextInput 
} from '@mantine/core';
import { 
  IconFilter, IconDeviceDesktop, IconPrinter, IconList, IconSearch,
  IconAlertTriangle, IconClock, IconBuildingStore, IconBuildingFactory
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
  
  const location = useLocation();
  
  // --- Definição de TODOS os estados de filtro ---
  const [filterType, setFilterType] = useState('computer');
  const [statusFilter, setStatusFilter] = useState(location.state?.initialStatusFilter || 'all'); 
  const [nomenclatureFilter, setNomenclatureFilter] = useState(location.state?.initialNomenclatureFilter || 'all');
  const [searchQuery, setSearchQuery] = useState(''); // <-- Corrige o 'searchQuery is not defined'

  useEffect(() => {
    // Busca os dados APENAS UMA VEZ
    const fetchDevices = async () => {
      try {
        setIsLoading(true);
        const data = await getDevices(); // Busca todos
        if (data.success) {
          setDevices(data.devices); // Salva a lista completa
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
  }, []); // <-- Array de dependências VAZIO

  // Toda a lógica de filtragem agora acontece AQUI, no frontend
  const filteredDevices = useMemo(() => {
    let tempDevices = devices;
    const now = new Date();

    // Filtro por TIPO
    if (filterType !== 'all') {
      tempDevices = tempDevices.filter(device => device.deviceType === filterType);
    }
    // Filtro por STATUS
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
    // Filtro por NOMENCLATURA (vinda do dashboard)
    if (nomenclatureFilter === 'owned') {
      tempDevices = tempDevices.filter(d => d.name.startsWith('PTR') || d.name.startsWith('TRC'));
    } else if (nomenclatureFilter === 'rented') {
      tempDevices = tempDevices.filter(d => d.name.startsWith('NETSITE') || d.name.startsWith('VIVO'));
    }
    // Filtro por PESQUISA (Nome)
    if (searchQuery.trim() !== '') {
      tempDevices = tempDevices.filter(device => 
        device.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return tempDevices;
  }, [devices, filterType, statusFilter, searchQuery, nomenclatureFilter]); 

  // Lógica dos Subgrupos (para mostrar o título)
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
    return null;
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

          {/* O menu de Nomenclatura, que era clicável apenas a partir do dashboard */}
          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button 
                leftSection={<IconFilter size={16} />} 
                variant="light"
                color={nomenclatureFilter === 'all' ? 'blue' : 'gray'}
              >
                Nomenclatura: {nomenclatureFilter === 'all' ? 'Todas' : (nomenclatureFilter === 'owned' ? 'Comprados' : 'Alugados')}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Filtrar por Nomenclatura</Menu.Label>
              <Menu.Item leftSection={<IconList size={14} />} onClick={() => setNomenclatureFilter('all')}>Todas</Menu.Item>
              <Menu.Item leftSection={<IconBuildingStore size={14} />} onClick={() => setNomenclatureFilter('owned')}>Comprados</Menu.Item>
              <Menu.Item leftSection={<IconBuildingFactory size={14} />} onClick={() => setNomenclatureFilter('rented')}>Alugados</Menu.Item>
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