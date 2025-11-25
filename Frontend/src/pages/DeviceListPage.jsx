import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getDevices } from '../services/api.js';

// Importações do Mantine
import { 
  Table, Title, Group, Button, Anchor, Text, Menu, TextInput,
  Badge,
  ThemeIcon,
  SimpleGrid,
  Stack,
  Paper,
  ScrollArea,
  LoadingOverlay,
  Pagination
} from '@mantine/core';

// Importações de Ícones
import { 
  IconFilter, IconDeviceDesktop, IconPrinter, IconList, IconSearch,
  IconAlertTriangle, IconClock, IconBuildingStore, IconBuildingFactory,
  IconDeviceLaptop,
  IconServer,
  IconDeviceFloppy,
  IconRefresh,
  IconEye,
  IconDatabase // Ícone para o total no rodapé
} from '@tabler/icons-react';

const filterLabels = {
  all: 'Todos',
  computer: 'Computadores',
  printer: 'Impressoras'
};

// --- FUNÇÕES AUXILIARES ---
function getDeviceIcon(deviceType) {
  const type = (deviceType || '').toLowerCase();
  if (type.includes('notebook')) return <ThemeIcon variant="light" color="blue" size="md" radius="md"><IconDeviceLaptop size="1rem" /></ThemeIcon>;
  if (type.includes('printer')) return <ThemeIcon variant="light" color="gray" size="md" radius="md"><IconPrinter size="1rem" /></ThemeIcon>;
  if (type.includes('server') || type.includes('vm')) return <ThemeIcon variant="light" color="grape" size="md" radius="md"><IconServer size="1rem" /></ThemeIcon>;
  if (type.includes('desktop')) return <ThemeIcon variant="light" color="teal" size="md" radius="md"><IconDeviceDesktop size="1rem" /></ThemeIcon>;
  return <ThemeIcon variant="light" color="gray" size="md" radius="md"><IconDeviceFloppy size="1rem" /></ThemeIcon>;
}

function getStatusBadge(nextDateStr) {
  const now = new Date();
  now.setHours(0, 0, 0, 0); 
  const badgeProps = { radius: "xl", size: "md", tt: "capitalize" };

  if (!nextDateStr) return <Badge color="gray" variant="outline" {...badgeProps} c="dimmed" style={{ borderColor: '#dee2e6' }}>N/D</Badge>;

  const nextDate = new Date(nextDateStr);
  nextDate.setHours(0, 0, 0, 0);

  if (nextDate < now) return <Badge color="red" variant="filled" {...badgeProps}>Atrasado</Badge>;
  const upcomingLimit = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); 
  if (nextDate <= upcomingLimit) return <Badge color="yellow" variant="light" {...badgeProps}>Atenção</Badge>;

  return <Badge color="green" variant="light" {...badgeProps}>Em Dia</Badge>;
}

// --- COMPONENTE PRINCIPAL ---
function DeviceListPage() {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  
  const [filterType, setFilterType] = useState('all');
  const [statusFilter, setStatusFilter] = useState(location.state?.initialStatusFilter || 'all'); 
  const [nomenclatureFilter, setNomenclatureFilter] = useState(location.state?.initialNomenclatureFilter || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      const data = await getDevices();
      if (data.success) setDevices(data.devices);
      else setError(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDevices(); }, []);

  const filteredDevices = useMemo(() => {
    let tempDevices = devices;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (filterType === 'computer') tempDevices = tempDevices.filter(d => !d.deviceType.toLowerCase().includes('printer'));
    else if (filterType === 'printer') tempDevices = tempDevices.filter(d => d.deviceType.toLowerCase().includes('printer'));

    if (statusFilter === 'overdue') tempDevices = tempDevices.filter(d => d.nextPreventiveDate && new Date(new Date(d.nextPreventiveDate).setHours(0,0,0,0)) < now);
    else if (statusFilter === 'upcoming') {
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      tempDevices = tempDevices.filter(d => d.nextPreventiveDate && new Date(new Date(d.nextPreventiveDate).setHours(0,0,0,0)) >= now && new Date(new Date(d.nextPreventiveDate).setHours(0,0,0,0)) <= thirtyDaysFromNow);
    }
    
    if (nomenclatureFilter === 'owned') tempDevices = tempDevices.filter(d => d.name.toUpperCase().startsWith('PTR') || d.name.toUpperCase().startsWith('TRC'));
    else if (nomenclatureFilter === 'rented') tempDevices = tempDevices.filter(d => {
      const upperName = d.name.toUpperCase();
      return (upperName.startsWith('NETSITE') || upperName.startsWith('VIVO') || upperName.startsWith('SOROCAMP') || upperName.startsWith('INFOBRAS') || upperName.startsWith('LENOVO'));
    });
    
    if (searchQuery.trim() !== '') {
      const searchLower = searchQuery.toLowerCase(); 
      tempDevices = tempDevices.filter(device => {
        const nameLower = device.name.toLowerCase(); 
        const normalSearch = nameLower.includes(searchLower);
        let specialSearch = false;
        if (searchLower.includes('vivo')) specialSearch = nameLower.startsWith('lenovo');
        return normalSearch || specialSearch;
      });
    }
    return tempDevices;
  }, [devices, filterType, statusFilter, searchQuery, nomenclatureFilter]);

  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
  const paginatedData = filteredDevices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const subGroupCounts = useMemo(() => {
    if (nomenclatureFilter === 'owned') {
      const ptrCount = filteredDevices.filter(d => d.name.toUpperCase().startsWith('PTR')).length;
      const trcCount = filteredDevices.filter(d => d.name.toUpperCase().startsWith('TRC')).length;
      return `(Comprados: ${ptrCount} PTR, ${trcCount} TRC)`;
    }
    if (nomenclatureFilter === 'rented') {
      const netsiteCount = filteredDevices.filter(d => d.name.toUpperCase().startsWith('NETSITE')).length;
      const vivoCount = filteredDevices.filter(d => d.name.toUpperCase().startsWith('VIVO') || d.name.toUpperCase().startsWith('LENOVO')).length; 
      const sorocampCount = filteredDevices.filter(d => d.name.toUpperCase().startsWith('SOROCAMP')).length; 
      const infobrasCount = filteredDevices.filter(d => d.name.toUpperCase().startsWith('INFOBRAS')).length;
      return `(Alugados: ${netsiteCount} NETSITE, ${vivoCount} VIVO, ${sorocampCount} SOROCAMP, ${infobrasCount} INFOBRAS)`; 
    }
    return null;
  }, [filteredDevices, nomenclatureFilter]);

  if (error) return <div style={{ color: 'red' }}>Erro: {error}</div>;

  const rows = paginatedData.map((device) => (
    <Table.Tr key={device.id} style={{ height: '60px' }}>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          {getDeviceIcon(device.deviceType)}
          <Text size="sm" fw={600} c="dark">{device.name}</Text>
        </Group>
      </Table.Td>
      <Table.Td><Text size="sm" c="dimmed">{device.setor || 'N/D'}</Text></Table.Td>
      <Table.Td><Text size="sm" c="dimmed" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{device.contact ? device.contact.split('@')[0] : 'N/D'}</Text></Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>{getStatusBadge(device.nextPreventiveDate)}</Table.Td>
      <Table.Td style={{ textAlign: 'right' }}>
        <Anchor component={Link} to={`/devices/${device.id}`} size="sm" c="blue" fw={500} style={{ textDecoration: 'none' }}>Detalhes</Anchor>
      </Table.Td>
    </Table.Tr>
  ));
  
  return (
    <Stack gap="lg">
      <Paper p="md" radius="sm" withBorder={false} style={{ backgroundColor: 'transparent' }}>
        <Group justify="space-between" align="center">
          <div>
            {/* TÍTULO LIMPO (Sem badge) */}
            <Title order={2} style={{ fontWeight: 700, letterSpacing: -0.5 }}>Inventário de Dispositivos</Title>
            {subGroupCounts && <Text c="dimmed" size="sm" mt={4}>{subGroupCounts}</Text>}
          </div>
          <Group>
            <Button variant="default" onClick={fetchDevices} loading={isLoading} leftSection={<IconRefresh size={16}/>}>Atualizar</Button>
          </Group>
        </Group>
        
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mt="lg">
          <TextInput placeholder="Buscar dispositivo..." leftSection={<IconSearch size={16} />} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} radius="md" />
          
          <Menu shadow="md" width={200} withinPortal radius="md">
            <Menu.Target>
              <Button fullWidth leftSection={<IconFilter size={16} />} variant="light" color={statusFilter === 'overdue' ? 'red' : (statusFilter === 'upcoming' ? 'yellow' : 'blue')}>
                Status: {statusFilter === 'all' ? 'Todos' : (statusFilter === 'overdue' ? 'Atrasados' : 'Próximos')}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconList size={14} />} onClick={() => setStatusFilter('all')}>Todos</Menu.Item>
              <Menu.Item color="red" leftSection={<IconAlertTriangle size={14} />} onClick={() => setStatusFilter('overdue')}>Atrasados</Menu.Item>
              <Menu.Item color="yellow" leftSection={<IconClock size={14} />} onClick={() => setStatusFilter('upcoming')}>Próximos</Menu.Item>
            </Menu.Dropdown>
          </Menu>
          
          <Menu shadow="md" width={200} withinPortal radius="md">
            <Menu.Target>
              <Button fullWidth leftSection={<IconFilter size={16} />} variant="light" color="violet">Tipo: {filterLabels[filterType]}</Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconList size={14} />} onClick={() => setFilterType('all')}>Todos</Menu.Item>
              <Menu.Item leftSection={<IconDeviceDesktop size={14} />} onClick={() => setFilterType('computer')}>Computadores</Menu.Item>
              <Menu.Item leftSection={<IconPrinter size={14} />} onClick={() => setFilterType('printer')}>Impressoras</Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <Menu shadow="md" width={200} withinPortal radius="md">
            <Menu.Target>
              <Button fullWidth leftSection={<IconFilter size={16} />} variant="light" color={nomenclatureFilter === 'all' ? 'gray' : 'blue'}>
                Nomenclatura: {nomenclatureFilter === 'all' ? 'Todas' : (nomenclatureFilter === 'owned' ? 'Comprados' : 'Alugados')}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconList size={14} />} onClick={() => setNomenclatureFilter('all')}>Todas</Menu.Item>
              <Menu.Item leftSection={<IconBuildingStore size={14} />} onClick={() => setNomenclatureFilter('owned')}>Comprados</Menu.Item>
              <Menu.Item leftSection={<IconBuildingFactory size={14} />} onClick={() => setNomenclatureFilter('rented')}>Alugados</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </SimpleGrid>
      </Paper>

      <Paper withBorder radius="lg" shadow="xs" style={{ overflow: 'hidden' }}>
        <div style={{ position: 'relative', minHeight: 200 }}>
          <LoadingOverlay visible={isLoading} />
          
          <ScrollArea>
            <Table highlightOnHover verticalSpacing="md" horizontalSpacing="md">
              <Table.Thead style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <Table.Tr>
                  <Table.Th style={{ color: '#868e96', fontWeight: 600, paddingLeft: 20 }}>DISPOSITIVO</Table.Th>
                  <Table.Th style={{ color: '#868e96', fontWeight: 600 }}>SETOR</Table.Th>
                  <Table.Th style={{ color: '#868e96', fontWeight: 600 }}>USUÁRIO</Table.Th>
                  <Table.Th style={{ color: '#868e96', fontWeight: 600, textAlign: 'center' }}>STATUS</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.length > 0 ? rows : (
                  <Table.Tr><Table.Td colSpan={5} ta="center" py={40} c="dimmed">Nenhum dispositivo encontrado.</Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>

          {/* --- RODAPÉ UNIFICADO (Total + Paginação) --- */}
          <Group justify="space-between" p="md" style={{ borderTop: '1px solid #f1f3f5', backgroundColor: '#fcfcfc' }}>
            {/* Contador de Total com Ícone */}
            <Group gap="xs">
               <ThemeIcon variant="light" color="gray" size="md" radius="md">
                  <IconDatabase size="1rem" />
               </ThemeIcon>
               <Text size="sm" fw={500} c="dimmed">
                 Total de dispositivos: <span style={{ color: '#000' }}>{filteredDevices.length}</span>
               </Text>
            </Group>

            {totalPages > 1 && (
              <Pagination total={totalPages} value={currentPage} onChange={setCurrentPage} color="dark" radius="md" size="sm" />
            )}
          </Group>
        </div>
      </Paper>
    </Stack>
  );
}

export default DeviceListPage;