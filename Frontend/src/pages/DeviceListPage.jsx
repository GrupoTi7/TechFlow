// src/pages/DeviceListPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getDevices } from '../services/api.js';

// 1. Importações do Mantine (Adicionado ScrollArea)
import { 
  Table, Title, Group, Button, Anchor, Text, Menu, TextInput,
  Badge,
  ThemeIcon,
  SimpleGrid,
  Stack,
  ScrollArea // <--- ADICIONADO
} from '@mantine/core';

// 2. Importações de Ícones (Mantido igual)
import { 
  IconFilter, IconDeviceDesktop, IconPrinter, IconList, IconSearch,
  IconAlertTriangle, IconClock, IconBuildingStore, IconBuildingFactory,
  IconDeviceLaptop,
  IconServer,
  IconDeviceFloppy
} from '@tabler/icons-react';

const filterLabels = {
  all: 'Todos',
  computer: 'Computadores', 
  printer: 'Impressoras' 
};

// --- FUNÇÃO-ASSISTENTE 1: Ícones de Dispositivo (Mantida igual) ---
function getDeviceIcon(deviceType) {
  const type = (deviceType || '').toLowerCase(); 
  if (type.includes('notebook')) {
    return <ThemeIcon variant="light" color="blue"><IconDeviceLaptop size="1.1rem" /></ThemeIcon>;
  }
  if (type.includes('printer') || type.includes('impressora')) {
    return <ThemeIcon variant="light" color="gray"><IconPrinter size="1.1rem" /></ThemeIcon>;
  }
  if (type.includes('vmware') || type.includes('virtual')) {
    return <ThemeIcon variant="light" color="grape"><IconServer size="1.1rem" /></ThemeIcon>;
  }
  if (type.includes('desktop') || type.includes('mini pc')) {
    return <ThemeIcon variant="light" color="teal"><IconDeviceDesktop size="1.1rem" /></ThemeIcon>;
  }
  return <ThemeIcon variant="light" color="dark"><IconDeviceFloppy size="1.1rem" /></ThemeIcon>;
}

// --- FUNÇÃO-ASSISTENTE 2: Badges de Status (Mantida igual) ---
function getStatusBadge(nextDateStr) {
  const now = new Date();
  now.setHours(0, 0, 0, 0); 

  if (!nextDateStr) {
    return <Badge color="gray" variant="light">Não agendada</Badge>;
  }

  const nextDate = new Date(nextDateStr);
  nextDate.setHours(0, 0, 0, 0);

  if (nextDate < now) {
    return <Badge color="red" variant="filled">Atrasado</Badge>;
  }

  const upcomingLimit = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); 

  if (nextDate <= upcomingLimit) {
    return <Badge color="yellow" variant="light">Atenção</Badge>;
  }

  return <Badge color="green" variant="light">Em Dia</Badge>;
}


function DeviceListPage() {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const location = useLocation();
  
  const [filterType, setFilterType] = useState('all');
  const [statusFilter, setStatusFilter] = useState(location.state?.initialStatusFilter || 'all'); 
  const [nomenclatureFilter, setNomenclatureFilter] = useState(location.state?.initialNomenclatureFilter || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setIsLoading(true);
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

  // --- Lógica de Filtros (Mantida igual) ---
  const filteredDevices = useMemo(() => {
    let tempDevices = devices;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (filterType === 'computer') {
      tempDevices = tempDevices.filter(d => 
        !d.deviceType.toLowerCase().includes('printer')
      );
    } else if (filterType === 'printer') {
      tempDevices = tempDevices.filter(d => 
        d.deviceType.toLowerCase().includes('printer')
      );
    }

    if (statusFilter === 'overdue') {
      tempDevices = tempDevices.filter(d => 
        d.nextPreventiveDate && new Date(new Date(d.nextPreventiveDate).setHours(0,0,0,0)) < now
      );
    } else if (statusFilter === 'upcoming') {
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      tempDevices = tempDevices.filter(d => 
        d.nextPreventiveDate && 
        new Date(new Date(d.nextPreventiveDate).setHours(0,0,0,0)) >= now && 
        new Date(new Date(d.nextPreventiveDate).setHours(0,0,0,0)) <= thirtyDaysFromNow
      );
    }
    
    if (nomenclatureFilter === 'owned') {
      tempDevices = tempDevices.filter(d => d.name.toUpperCase().startsWith('PTR') || d.name.toUpperCase().startsWith('TRC'));
    
    } else if (nomenclatureFilter === 'rented') {
      tempDevices = tempDevices.filter(d => {
        const upperName = d.name.toUpperCase();
        return (
          upperName.startsWith('NETSITE') || 
          upperName.startsWith('VIVO') ||
          upperName.startsWith('SOROCAMP') || 
          upperName.startsWith('INFOBRAS') ||
          upperName.startsWith('LENOVO')
        );
      });
    }
    
    if (searchQuery.trim() !== '') {
      const searchLower = searchQuery.toLowerCase(); 
      tempDevices = tempDevices.filter(device => {
        const nameLower = device.name.toLowerCase(); 
        const normalSearch = nameLower.includes(searchLower);
        let specialSearch = false;
        if (searchLower.includes('vivo')) {
          specialSearch = nameLower.startsWith('lenovo');
        }
        return normalSearch || specialSearch;
      });
    }
    return tempDevices;
  }, [devices, filterType, statusFilter, searchQuery, nomenclatureFilter]);


  const subGroupCounts = useMemo(() => {
    if (nomenclatureFilter === 'owned') {
      const ptrCount = filteredDevices.filter(d => d.name.toUpperCase().startsWith('PTR')).length;
      const trcCount = filteredDevices.filter(d => d.name.toUpperCase().startsWith('TRC')).length;
      return `(Comprados: ${ptrCount} PTR, ${trcCount} TRC)`;
    }
    
    if (nomenclatureFilter === 'rented') {
      const netsiteCount = filteredDevices.filter(d => d.name.toUpperCase().startsWith('NETSITE')).length;
      const vivoCount = filteredDevices.filter(d => 
        d.name.toUpperCase().startsWith('VIVO') || 
        d.name.toUpperCase().startsWith('LENOVO')
      ).length; 
      const sorocampCount = filteredDevices.filter(d => d.name.toUpperCase().startsWith('SOROCAMP')).length; 
      const infobrasCount = filteredDevices.filter(d => d.name.toUpperCase().startsWith('INFOBRAS')).length;
      return `(Alugados: ${netsiteCount} NETSITE, ${vivoCount} VIVO, ${sorocampCount} SOROCAMP, ${infobrasCount} INFOBRAS)`; 
    }
    
    return null;
  }, [filteredDevices, nomenclatureFilter]);


  if (isLoading) return <div>A carregar dispositivos...</div>;
  if (error) return <div style={{ color: 'red' }}>Erro: {error}</div>;

  const rows = filteredDevices.map((device) => (
    <Table.Tr key={device.id}>
      <Table.Td>
        <Group gap="sm">
          {getDeviceIcon(device.deviceType)}
          <Anchor component={Link} to={`/devices/${device.id}`} size="sm" fw={500}>
            {device.name}
          </Anchor>
        </Group>
      </Table.Td>
      <Table.Td>{device.setor || 'N/D'}</Table.Td>
      <Table.Td>{device.serial || 'N/A'}</Table.Td>
      <Table.Td>{getStatusBadge(device.nextPreventiveDate)}</Table.Td>
    </Table.Tr>
  ));
  
  return (
    <div>
      <Group justify="space-between" mb="lg">
        <Group>
          <Title order={2}>Inventário de Dispositivos ({filteredDevices.length})</Title>
          {subGroupCounts && <Text c="dimmed" size="lg">{subGroupCounts}</Text>}
        </Group>
        
        {/* --- RESPONSIVIDADE 1: Grid de filtros ajustável --- */}
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="sm">
          <TextInput
            placeholder="Buscar por nome..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Menu shadow="md" width={200} withinPortal>
            <Menu.Target>
              <Button 
                fullWidth
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
          
          <Menu shadow="md" width={200} withinPortal>
            <Menu.Target>
              <Button 
                fullWidth
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
              
              <Menu.Divider />
              <Menu.Label>Legenda de Ícones</Menu.Label>
              <Stack gap="xs" p="xs">
                <Group gap="xs" wrap="nowrap">
                  <ThemeIcon variant="light" color="teal" size="sm"><IconDeviceDesktop size="0.8rem" /></ThemeIcon>
                  <Text size="xs">Desktop / Mini PC</Text>
                </Group>
                <Group gap="xs" wrap="nowrap">
                  <ThemeIcon variant="light" color="blue" size="sm"><IconDeviceLaptop size="0.8rem" /></ThemeIcon>
                  <Text size="xs">Notebook</Text>
                </Group>
                <Group gap="xs" wrap="nowrap">
                  <ThemeIcon variant="light" color="grape" size="sm"><IconServer size="0.8rem" /></ThemeIcon>
                  <Text size="xs">Virtual / VMware</Text>
                </Group>
              </Stack>
            </Menu.Dropdown>
          </Menu>

          <Menu shadow="md" width={200} withinPortal>
            <Menu.Target>
              <Button 
                fullWidth
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
        </SimpleGrid>
      </Group>

      {/* --- RESPONSIVIDADE 2: ScrollArea na Tabela --- */}
      <ScrollArea>
        <Table withTableBorder withColumnBorders highlightOnHover verticalSpacing="sm" minWidth={800}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nome</Table.Th>
              <Table.Th>Setor</Table.Th>
              <Table.Th>Nº de Série</Table.Th>
              <Table.Th>Status da Preventiva</Table.Th>
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
      </ScrollArea>
    </div>
  );
}

export default DeviceListPage;