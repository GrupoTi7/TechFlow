// src/pages/DeviceListPage.jsx
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
  IconDatabase
} from '@tabler/icons-react';

const filterLabels = {
  all: 'Todos',
  computer: 'Computadores',
  printer: 'Impressoras'
};

// --- FUNÇÕES AUXILIARES (Cores mais vivas nos ícones) ---
function getDeviceIcon(deviceType) {
  const type = (deviceType || '').toLowerCase();
  // Usando tons .6 ou .7 para cores mais saturadas no variant="light"
  if (type.includes('notebook')) return <ThemeIcon variant="light" color="blue.6" size="lg" radius="md"><IconDeviceLaptop size="1.2rem" /></ThemeIcon>;
  if (type.includes('printer')) return <ThemeIcon variant="light" color="orange.7" size="lg" radius="md"><IconPrinter size="1.2rem" /></ThemeIcon>; // Laranja para impressora
  if (type.includes('server') || type.includes('vm')) return <ThemeIcon variant="light" color="grape.7" size="lg" radius="md"><IconServer size="1.2rem" /></ThemeIcon>;
  if (type.includes('desktop')) return <ThemeIcon variant="light" color="teal.7" size="lg" radius="md"><IconDeviceDesktop size="1.2rem" /></ThemeIcon>;
  return <ThemeIcon variant="light" color="gray.6" size="lg" radius="md"><IconDeviceFloppy size="1.2rem" /></ThemeIcon>;
}

function getStatusBadge(nextDateStr) {
  const now = new Date();
  now.setHours(0, 0, 0, 0); 
  // Badge com fonte mais forte
  const badgeProps = { radius: "xl", size: "sm", tt: "capitalize", fw: 700 };

  if (!nextDateStr) return <Badge color="gray" variant="outline" {...badgeProps} style={{ borderColor: '#ced4da', color: '#495057' }}>N/D</Badge>;

  const nextDate = new Date(nextDateStr);
  nextDate.setHours(0, 0, 0, 0);

  if (nextDate < now) return <Badge color="red" variant="filled" {...badgeProps}>Atrasado</Badge>;
  const upcomingLimit = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); 
  if (nextDate <= upcomingLimit) return <Badge color="yellow" variant="light" {...badgeProps} c="orange.9">Atenção</Badge>;

  return <Badge color="green" variant="light" {...badgeProps}>Em Dia</Badge>;
}

function DeviceListPage() {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  
  // Filtros
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

  // Lógica de Filtros (Intacta)
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

  const subGroupCounts = useMemo(() => {
    if (nomenclatureFilter === 'owned') {
      const ptr = filteredDevices.filter(d => d.name.toUpperCase().startsWith('PTR')).length;
      const trc = filteredDevices.filter(d => d.name.toUpperCase().startsWith('TRC')).length;
      return `(Comprados: ${ptr} PTR, ${trc} TRC)`;
    }
    if (nomenclatureFilter === 'rented') {
      const netsite = filteredDevices.filter(d => d.name.toUpperCase().startsWith('NETSITE')).length;
      const vivo = filteredDevices.filter(d => d.name.toUpperCase().startsWith('VIVO') || d.name.toUpperCase().startsWith('LENOVO')).length; 
      const sorocamp = filteredDevices.filter(d => d.name.toUpperCase().startsWith('SOROCAMP')).length; 
      const infobras = filteredDevices.filter(d => d.name.toUpperCase().startsWith('INFOBRAS')).length;
      return `(Alugados: ${netsite} NETSITE, ${vivo} VIVO, ${sorocamp} SOROCAMP, ${infobras} INFOBRAS)`; 
    }
    return null;
  }, [filteredDevices, nomenclatureFilter]);

  if (error) return <div style={{ color: 'red' }}>Erro: {error}</div>;

  // --- LINHAS DA TABELA (ALTO CONTRASTE) ---
  const rows = paginatedData.map((device) => (
    <Table.Tr key={device.id} style={{ height: '65px' }}>
      {/* NOME (Azul Forte e Negrito) */}
      <Table.Td>
        <Group gap="md" wrap="nowrap">
          {getDeviceIcon(device.deviceType)}
          <div style={{ lineHeight: 1.3 }}>
            <Anchor 
              component={Link} 
              to={`/devices/${device.id}`} 
              size="sm" 
              fw={700} // Negrito forte
              c="blue.8" // Azul vibrante
              style={{ textDecoration: 'none' }}
            >
              {device.name}
            </Anchor>
            {/* Serial em cinza escuro, não apagado */}
            <Text size="xs" c="dark.3" fw={500} mt={2}>S/N: {device.serial || '-'}</Text>
          </div>
        </Group>
      </Table.Td>
      
      {/* SETOR (Texto Escuro) */}
      <Table.Td>
        <Text size="sm" c="dark.9" fw={500}>{device.setor || 'N/D'}</Text>
      </Table.Td>
      
      {/* USUÁRIO (Texto Escuro) */}
      <Table.Td>
         <Text size="sm" c="dark.9" fw={500} style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
           {device.contact ? device.contact.split('@')[0] : 'N/D'}
         </Text>
      </Table.Td>

      {/* STATUS (Centralizado) */}
      <Table.Td style={{ textAlign: 'center' }}>
        {getStatusBadge(device.nextPreventiveDate)}
      </Table.Td>
    </Table.Tr>
  ));
  
  return (
    <Stack gap="lg">
      {/* Painel de Controles */}
      <Paper p="md" radius="md" withBorder={false} bg="transparent">
        <Group justify="space-between" align="center" mb="md">
           <div>
             {/* Título Preto Forte */}
             <Title order={2} style={{ fontWeight: 800, color: '#1A1B1E', letterSpacing: -0.5 }}>
                Inventário de Dispositivos
             </Title>
             {subGroupCounts && <Text c="dark.4" size="sm" mt={4} fw={500}>{subGroupCounts}</Text>}
           </div>
           <Button variant="white" color="dark" onClick={fetchDevices} loading={isLoading} leftSection={<IconRefresh size={16}/>} style={{ border: '1px solid #ced4da', color: '#1A1B1E', fontWeight: 600 }}>
              Atualizar
           </Button>
        </Group>
        
        {/* Filtros com bordas e texto mais definidos */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
          <TextInput
            placeholder="Buscar..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            radius="md"
            styles={{ input: { borderColor: '#ced4da', color: '#1A1B1E' } }}
          />
          <Menu shadow="md" width={200} withinPortal radius="md">
            <Menu.Target>
              <Button fullWidth leftSection={<IconFilter size={16} />} variant="default" radius="md" style={{ color: '#1A1B1E', borderColor: '#ced4da', fontWeight: 500 }}>
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
              <Button fullWidth leftSection={<IconFilter size={16} />} variant="default" radius="md" style={{ color: '#1A1B1E', borderColor: '#ced4da', fontWeight: 500 }}>
                Tipo: {filterLabels[filterType]}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconList size={14} />} onClick={() => setFilterType('all')}>Todos</Menu.Item>
              <Menu.Item leftSection={<IconDeviceDesktop size={14} />} onClick={() => setFilterType('computer')}>Computadores</Menu.Item>
              <Menu.Item leftSection={<IconPrinter size={14} />} onClick={() => setFilterType('printer')}>Impressoras</Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <Menu shadow="md" width={200} withinPortal radius="md">
            <Menu.Target>
              <Button fullWidth leftSection={<IconFilter size={16} />} variant="default" radius="md" style={{ color: '#1A1B1E', borderColor: '#ced4da', fontWeight: 500 }}>
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

      {/* --- TABELA COM ALTO CONTRASTE --- */}
      <Paper withBorder radius="lg" shadow="sm" style={{ overflow: 'hidden', borderColor: '#e9ecef' }}>
        <div style={{ position: 'relative', minHeight: 200 }}>
          <LoadingOverlay visible={isLoading} />
          
          <ScrollArea>
            <Table 
              highlightOnHover 
              verticalSpacing="md" 
              horizontalSpacing="md"
            >
              {/* Cabeçalho: Preto e Negrito */}
              <Table.Thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <Table.Tr>
                  <Table.Th style={{ color: '#1A1B1E', fontWeight: 700, fontSize: '0.9rem', paddingLeft: 20 }}>DISPOSITIVO</Table.Th>
                  <Table.Th style={{ color: '#1A1B1E', fontWeight: 700, fontSize: '0.9rem' }}>SETOR</Table.Th>
                  <Table.Th style={{ color: '#1A1B1E', fontWeight: 700, fontSize: '0.9rem' }}>USUÁRIO</Table.Th>
                  <Table.Th style={{ color: '#1A1B1E', fontWeight: 700, fontSize: '0.9rem', textAlign: 'center' }}>STATUS</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.length > 0 ? rows : (
                  <Table.Tr><Table.Td colSpan={4} ta="center" py={40} c="dark.4" fw={500}>Nenhum dispositivo encontrado.</Table.Td></Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>

          {/* Rodapé */}
          <Group justify="space-between" p="md" style={{ borderTop: '1px solid #f1f3f5', backgroundColor: '#fff' }}>
            <Group gap="xs">
               <ThemeIcon variant="light" color="gray.6" size="md" radius="md">
                  <IconDatabase size="1rem" />
               </ThemeIcon>
               <Text size="sm" fw={600} c="dark.5">
                 Total de dispositivos: <span style={{ color: '#1A1B1E', fontWeight: 700, fontSize: '1rem' }}>{filteredDevices.length}</span>
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