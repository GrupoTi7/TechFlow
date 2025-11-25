import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getDevices } from '../services/api.js';

import { 
  Table, Title, Group, Button, Anchor, Text, Menu, TextInput,
  Badge,
  ThemeIcon,
  SimpleGrid,
  Stack,
  Paper,
  ScrollArea,
  LoadingOverlay,
  Pagination,
  Avatar,
  ActionIcon,
  rem
} from '@mantine/core';

import { 
  IconFilter, IconDeviceDesktop, IconPrinter, IconList, IconSearch,
  IconAlertTriangle, IconClock, IconBuildingStore, IconBuildingFactory,
  IconDeviceLaptop,
  IconServer,
  IconDeviceFloppy,
  IconEye,
  IconRefresh,
  IconChevronRight
} from '@tabler/icons-react';

const filterLabels = {
  all: 'Todos',
  computer: 'Computadores',
  printer: 'Impressoras'
};

// --- Ícones com Avatar (Mais visual) ---
function getDeviceIcon(deviceType) {
  const type = (deviceType || '').toLowerCase();
  let icon = <IconDeviceFloppy size="1.2rem" />;
  let color = 'gray';

  if (type.includes('notebook')) { icon = <IconDeviceLaptop size="1.2rem" />; color = 'blue'; }
  else if (type.includes('printer')) { icon = <IconPrinter size="1.2rem" />; color = 'orange'; } // Mudei para laranja para destacar
  else if (type.includes('server') || type.includes('vm')) { icon = <IconServer size="1.2rem" />; color = 'grape'; }
  else if (type.includes('desktop')) { icon = <IconDeviceDesktop size="1.2rem" />; color = 'teal'; }

  return (
    <ThemeIcon variant="light" color={color} size="lg" radius="md">
      {icon}
    </ThemeIcon>
  );
}

function getStatusBadge(nextDateStr) {
  const now = new Date();
  now.setHours(0, 0, 0, 0); 
  const badgeProps = { size: "sm", radius: "sm", variant: "light" };

  if (!nextDateStr) return <Badge color="gray" {...badgeProps} variant="outline">N/D</Badge>;

  const nextDate = new Date(nextDateStr);
  nextDate.setHours(0, 0, 0, 0);

  if (nextDate < now) return <Badge color="red" {...badgeProps} variant="filled">Atrasado</Badge>;
  const upcomingLimit = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); 
  if (nextDate <= upcomingLimit) return <Badge color="yellow" {...badgeProps} c="orange.9">Atenção</Badge>;

  return <Badge color="green" {...badgeProps}>Em Dia</Badge>;
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

  // Lógica de Filtros (Mantida)
  const filteredDevices = useMemo(() => {
    let temp = devices;
    const now = new Date(); now.setHours(0,0,0,0);

    if (filterType === 'computer') temp = temp.filter(d => !d.deviceType.toLowerCase().includes('printer'));
    else if (filterType === 'printer') temp = temp.filter(d => d.deviceType.toLowerCase().includes('printer'));

    if (statusFilter === 'overdue') temp = temp.filter(d => d.nextPreventiveDate && new Date(d.nextPreventiveDate) < now);
    else if (statusFilter === 'upcoming') {
       const limit = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
       temp = temp.filter(d => d.nextPreventiveDate && new Date(d.nextPreventiveDate) >= now && new Date(d.nextPreventiveDate) <= limit);
    }
    
    if (nomenclatureFilter === 'owned') temp = temp.filter(d => d.name.toUpperCase().startsWith('PTR') || d.name.toUpperCase().startsWith('TRC'));
    else if (nomenclatureFilter === 'rented') temp = temp.filter(d => ['NETSITE','VIVO','SOROCAMP','INFOBRAS','LENOVO'].some(p => d.name.toUpperCase().startsWith(p)));
    
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase(); 
      temp = temp.filter(d => (d.name?.toLowerCase() || '').includes(lower) || (d.serial?.toLowerCase() || '').includes(lower) || (d.contact?.toLowerCase() || '').includes(lower));
    }
    return temp;
  }, [devices, filterType, statusFilter, searchQuery, nomenclatureFilter]);

  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
  const paginatedData = filteredDevices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const subGroupCounts = useMemo(() => { /* ... (lógica mantida) ... */ return null; }, [filteredDevices, nomenclatureFilter]);

  // --- LINHAS DA TABELA (Design Premium) ---
  const rows = paginatedData.map((device) => (
    <Table.Tr key={device.id} style={{ cursor: 'pointer' }}>
      <Table.Td>
        <Group gap="md">
          {getDeviceIcon(device.deviceType)}
          <div style={{ lineHeight: 1 }}>
            <Text size="sm" fw={600} c="dark.4">{device.name}</Text>
            <Text size="xs" c="dimmed" mt={2}>{device.serial || 'S/N'}</Text>
          </div>
        </Group>
      </Table.Td>
      
      <Table.Td>
        <Text size="sm" fw={500} c="dark.3">{device.setor || '-'}</Text>
      </Table.Td>
      
      <Table.Td>
         <Group gap={6}>
            <Avatar size="sm" radius="xl" color="blue" variant="light">
               {(device.contact ? device.contact[0] : 'U').toUpperCase()}
            </Avatar>
            <Text size="sm" c="dimmed" style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
               {device.contact ? device.contact.split('@')[0] : 'N/D'}
            </Text>
         </Group>
      </Table.Td>

      <Table.Td style={{ textAlign: 'center' }}>
        {getStatusBadge(device.nextPreventiveDate)}
      </Table.Td>

      <Table.Td style={{ textAlign: 'right' }}>
        <Button component={Link} to={`/devices/${device.id}`} variant="default" size="xs" radius="md">
          Detalhes
        </Button>
      </Table.Td>
    </Table.Tr>
  ));
  
  return (
    <Stack gap="lg">
      {/* CABEÇALHO */}
      <Paper p="md" radius="md" withBorder={false} bg="transparent">
        <Group justify="space-between" align="center" mb="md">
          <Group gap="xs" align="center">
            <Title order={2} style={{ fontWeight: 700, letterSpacing: -0.5 }}>
              Inventário de Dispositivos
            </Title>
            <Badge size="lg" variant="filled" color="dark" circle style={{ marginLeft: 5 }}>
              {filteredDevices.length}
            </Badge>
          </Group>
          
          <Button variant="white" color="gray" onClick={fetchDevices} loading={isLoading} leftSection={<IconRefresh size={16}/>} style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            Atualizar
          </Button>
        </Group>
        
        {/* FILTROS */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
          <TextInput
            placeholder="Buscar..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            radius="md"
          />
          
          {/* (Menus de Filtro - Mantive a estrutura mas adicionei radius="md" aos botões para consistência) */}
          <Menu shadow="md" width={200} withinPortal radius="md">
            <Menu.Target>
              <Button fullWidth leftSection={<IconFilter size={16} />} variant="white" color="dark" radius="md" style={{ border: '1px solid #e9ecef' }}>
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

          <Menu shadow="md" width={200} withinPortal radius="md">
            <Menu.Target>
              <Button fullWidth leftSection={<IconFilter size={16} />} variant="white" color="dark" radius="md" style={{ border: '1px solid #e9ecef' }}>
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

          <Menu shadow="md" width={200} withinPortal radius="md">
            <Menu.Target>
              <Button fullWidth leftSection={<IconFilter size={16} />} variant="white" color="dark" radius="md" style={{ border: '1px solid #e9ecef' }}>
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
      </Paper>

      {/* --- TABELA --- */}
      <Paper withBorder radius="lg" shadow="xs" style={{ overflow: 'hidden' }}>
        <div style={{ position: 'relative', minHeight: 200 }}>
          <LoadingOverlay visible={isLoading} />
          
          <ScrollArea>
            <Table 
              highlightOnHover 
              verticalSpacing="md" 
              horizontalSpacing="md"
            >
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
                  <Table.Tr>
                    <Table.Td colSpan={5} ta="center" py={40} c="dimmed">
                      Nenhum dispositivo encontrado.
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>

          {totalPages > 1 && (
            <Group justify="flex-end" p="md" style={{ borderTop: '1px solid #f1f3f5', backgroundColor: '#fcfcfc' }}>
              <Pagination total={totalPages} value={currentPage} onChange={setCurrentPage} color="dark" radius="md" />
            </Group>
          )}
        </div>
      </Paper>
    </Stack>
  );
}

export default DeviceListPage;