import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getDevices } from '../services/api.js';

import { 
  Table, Title, Group, Button, Anchor, Text, Menu, TextInput,
  Badge, ThemeIcon, SimpleGrid, Stack, Paper, ScrollArea,
  LoadingOverlay, Pagination, Avatar, SegmentedControl
} from '@mantine/core';

import { 
  IconFilter, IconDeviceDesktop, IconPrinter, IconList, IconSearch,
  IconAlertTriangle, IconClock, IconBuildingStore, IconBuildingFactory,
  IconDeviceLaptop, IconServer, IconDeviceFloppy, IconRefresh,
  IconDatabase, IconArrowRight, IconArrowLeft,
  IconRouter, IconWifi, IconTerminal2 
} from '@tabler/icons-react';

import NetworkMap from '../components/NetworkMap.jsx';

const BRAND_BLUE = '#0003d9';

const filterLabels = {
  all: 'Todos',
  computer: 'Computadores',
  printer: 'Impressoras'
};

function getDeviceIcon(deviceType) {
  const type = (deviceType || '').toLowerCase();
  if (type.includes('notebook') || type.includes('laptop')) return <ThemeIcon variant="light" color="#0003d9" size="lg" radius="md"><IconDeviceLaptop size="1.2rem" /></ThemeIcon>;
  if (type.includes('printer') || type.includes('impressora')) return <ThemeIcon variant="light" color="orange" size="lg" radius="md"><IconPrinter size="1.2rem" /></ThemeIcon>;
  if (type.includes('server') || type.includes('vm') || type.includes('servidor')) return <ThemeIcon variant="light" color="grape" size="lg" radius="md"><IconServer size="1.2rem" /></ThemeIcon>;
  if (type.includes('desktop') || type.includes('computador')) return <ThemeIcon variant="light" color="teal" size="lg" radius="md"><IconDeviceDesktop size="1.2rem" /></ThemeIcon>;
  if (type.includes('switch')) return <ThemeIcon variant="light" color="indigo" size="lg" radius="md"><IconRouter size="1.2rem" /></ThemeIcon>;
  if (type === 'ap' || type.includes('access point') || type.includes('wifi')) return <ThemeIcon variant="light" color="cyan" size="lg" radius="md"><IconWifi size="1.2rem" /></ThemeIcon>;
  if (type.includes('microterminal') || type.includes('terminal')) return <ThemeIcon variant="light" color="yellow" size="lg" radius="md"><IconTerminal2 size="1.2rem" /></ThemeIcon>;
  return <ThemeIcon variant="light" color="gray" size="lg" radius="md"><IconDeviceFloppy size="1.2rem" /></ThemeIcon>;
}

// --- BADGE DE STATUS ---
function getStatusBadge(nextDateStr) {
  const now = new Date();
  now.setHours(0, 0, 0, 0); 
  const badgeProps = { radius: "sm", size: "md", fw: 700, variant: "light" };
  if (!nextDateStr) return <Badge color="gray" {...badgeProps}>Sem Agendamento</Badge>;
  const nextDate = new Date(nextDateStr);
  nextDate.setHours(0, 0, 0, 0);
  if (nextDate < now) return <Badge color="red" variant="filled" {...badgeProps}>Atrasado</Badge>;
  const upcomingLimit = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); 
  if (nextDate <= upcomingLimit) return <Badge color="yellow" c="orange.9" {...badgeProps}>Atenção</Badge>;
  return <Badge color="green" {...badgeProps}>Em Dia</Badge>;
}

function DeviceListPage() {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  
  const initialTypeFilter = location.state?.initialTypeFilter || 'all';
  const hasCategoryState = !!location.state?.initialTypeFilter; 
  
  const [filterType, setFilterType] = useState(initialTypeFilter);
  const [statusFilter, setStatusFilter] = useState(location.state?.initialStatusFilter || 'all'); 
  const [nomenclatureFilter, setNomenclatureFilter] = useState(location.state?.initialNomenclatureFilter || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // 🟢 AQUI ESTÁ A MÁGICA: O MAPA AGORA É A VISUALIZAÇÃO PADRÃO!
  const [viewMode, setViewMode] = useState('map'); 
  
  const itemsPerPage = 10;

  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      const data = await getDevices();
      if (data.success) setDevices(data.devices);
      else setError(data.message);
    } catch (err) { setError(err.message); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchDevices(); }, []);

  const filteredDevices = useMemo(() => {
    let temp = devices;
    const now = new Date(); now.setHours(0,0,0,0);

    // FILTRO INTELIGENTE DE TIPO ATUALIZADO
    if (filterType !== 'all') {
      if (filterType === 'computer') {
          // Agora ele esconde Impressoras E também toda a Infraestrutura!
          temp = temp.filter(d => {
              const t = (d.deviceType || '').toLowerCase();
              return !t.includes('printer') && 
                     !t.includes('switch') && 
                     !t.includes('ap') && 
                     !t.includes('wifi') && 
                     !t.includes('access point');
          });
      } else if (filterType === 'printer') {
          temp = temp.filter(d => d.deviceType && d.deviceType.toLowerCase().includes('printer'));
      } else {
          // Captura os cartões dinâmicos (Ex: 'Desktop', 'Notebook', 'Servidor', 'Switch')
          temp = temp.filter(d => {
             const t = d.deviceType || d.type || 'Outros';
             return t.toLowerCase() === filterType.toLowerCase();
          });
      }
    }

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
      return `Comprados: ${ptr} PTR, ${trc} TRC`;
    }
    if (nomenclatureFilter === 'rented') {
      const netsite = filteredDevices.filter(d => d.name.toUpperCase().startsWith('NETSITE')).length;
      const vivo = filteredDevices.filter(d => d.name.toUpperCase().startsWith('VIVO') || d.name.toUpperCase().startsWith('LENOVO')).length; 
      const sorocamp = filteredDevices.filter(d => d.name.toUpperCase().startsWith('SOROCAMP')).length; 
      const infobras = filteredDevices.filter(d => d.name.toUpperCase().startsWith('INFOBRAS')).length;
      return `Alugados: ${netsite} NETSITE, ${vivo} VIVO, ${sorocamp} SOROCAMP, ${infobras} INFOBRAS`; 
    }
    return null;
  }, [filteredDevices, nomenclatureFilter]);

  if (error) return <div style={{ color: 'red' }}>Erro: {error}</div>;

  const rows = paginatedData.map((device) => (
    <Table.Tr key={device.id}>
      <Table.Td>
        <Group gap="sm" wrap="nowrap">
          {getDeviceIcon(device.deviceType)}
          <div style={{ lineHeight: 1.2 }}>
            <Anchor component={Link} to={`/devices/${device.id}`} size="sm" fw={700} c="dark.9" style={{ textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.color = BRAND_BLUE} onMouseLeave={(e) => e.target.style.color = '#212529'}>
              {device.name}
            </Anchor>
            <Text size="xs" c="dimmed" fw={500}>{device.serial || 'S/N Não registrado'}</Text>
          </div>
        </Group>
      </Table.Td>
      <Table.Td><Badge variant="outline" color="gray" size="sm" radius="sm" tt="none" style={{ color: '#495057', borderColor: '#dee2e6' }}>{device.setor || 'N/D'}</Badge></Table.Td>
      <Table.Td>
          <Group gap="xs">
             <Avatar size="sm" radius="xl" color="#0003d9">{device.contact?.charAt(0).toUpperCase()}</Avatar>
             <Text size="sm" c="dimmed" fw={500} style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{device.contact ? device.contact.split('@')[0] : 'N/D'}</Text>
          </Group>
      </Table.Td>
      <Table.Td>{getStatusBadge(device.nextPreventiveDate)}</Table.Td>
      <Table.Td style={{ textAlign: 'right' }}>
          <Button component={Link} to={`/devices/${device.id}`} variant="light" color={BRAND_BLUE} size="xs" radius="md" rightSection={<IconArrowRight size={14} />}>Detalhes</Button>
      </Table.Td>

      
    </Table.Tr>
  ));
  
  return (
    <Stack gap="lg">
      {hasCategoryState && (
         <Group>
            <Button component={Link} to="/devices/categories" variant="subtle" size="sm" leftSection={<IconArrowLeft size={16} />} color="gray" style={{ paddingLeft: 0, '&:hover': { background: 'transparent', textDecoration: 'underline' }}}>Voltar para Categorias</Button>
         </Group>
      )}

      <Paper p="xl" radius="md" withBorder style={{ borderLeft: `6px solid ${BRAND_BLUE}` }}>
        <Group justify="space-between" align="center">
            <div>
                <Title order={2} fw={800} c="dark.5">{filterType === 'all' ? 'Inventário de Ativos' : `Inventário: ${filterLabels[filterType] || filterType}`}</Title>
                <Text c="dimmed" size="sm" mt={4}>Dispositivos da empresa em um só lugar.</Text>
                {subGroupCounts && (<Badge mt="xs" variant="light" color="#0003d9" size="lg" radius="md">{subGroupCounts}</Badge>)}
            </div>
            <Button variant="light" color={BRAND_BLUE} onClick={fetchDevices} loading={isLoading} leftSection={<IconRefresh size={18}/>} size="md">Atualizar Lista</Button>
        </Group>
      </Paper>

      <Paper p="md" radius="md" withBorder>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
          <TextInput placeholder="Buscar por nome, serial ou usuário..." leftSection={<IconSearch size={16} />} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} radius="md" />
          <Menu shadow="md" width={200} withinPortal radius="md">
            <Menu.Target><Button fullWidth leftSection={<IconFilter size={16} />} variant="default" radius="md" justify="space-between" rightSection={<IconArrowRight size={14} style={{ opacity: 0.5 }} />}>Status: <span style={{ fontWeight: 700, marginLeft: 4 }}>{statusFilter === 'all' ? 'Todos' : (statusFilter === 'overdue' ? 'Atrasados' : 'Próximos')}</span></Button></Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconList size={14} />} onClick={() => setStatusFilter('all')}>Todos</Menu.Item>
              <Menu.Item color="red" leftSection={<IconAlertTriangle size={14} />} onClick={() => setStatusFilter('overdue')}>Atrasados</Menu.Item>
              <Menu.Item color="yellow" leftSection={<IconClock size={14} />} onClick={() => setStatusFilter('upcoming')}>Próximos</Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <Menu shadow="md" width={200} withinPortal radius="md">
            <Menu.Target><Button fullWidth leftSection={<IconDeviceDesktop size={16} />} variant="default" radius="md" justify="space-between" rightSection={<IconArrowRight size={14} style={{ opacity: 0.5 }} />}>Tipo: <span style={{ fontWeight: 700, marginLeft: 4 }}>{filterType === 'all' ? 'Todos' : (filterLabels[filterType] || filterType)}</span></Button></Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconList size={14} />} onClick={() => setFilterType('all')}>Todos</Menu.Item>
              <Menu.Item leftSection={<IconDeviceDesktop size={14} />} onClick={() => setFilterType('computer')}>Computadores</Menu.Item>
              <Menu.Item leftSection={<IconPrinter size={14} />} onClick={() => setFilterType('printer')}>Impressoras</Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <Menu shadow="md" width={200} withinPortal radius="md">
            <Menu.Target><Button fullWidth leftSection={<IconBuildingStore size={16} />} variant="default" radius="md" justify="space-between" rightSection={<IconArrowRight size={14} style={{ opacity: 0.5 }} />}>Origem: <span style={{ fontWeight: 700, marginLeft: 4 }}>{nomenclatureFilter === 'all' ? 'Todas' : (nomenclatureFilter === 'owned' ? 'Comprados' : 'Alugados')}</span></Button></Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconList size={14} />} onClick={() => setNomenclatureFilter('all')}>Todas</Menu.Item>
              <Menu.Item leftSection={<IconBuildingStore size={14} />} onClick={() => setNomenclatureFilter('owned')}>Comprados</Menu.Item>
              <Menu.Item leftSection={<IconBuildingFactory size={14} />} onClick={() => setNomenclatureFilter('rented')}>Alugados</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </SimpleGrid>
      </Paper>

      {/* 🟢 BOTÃO DE TROCAR VISÃO (APARECE PARA SWITCH E AP) */}
      {['switch', 'ap', 'access point', 'wifi'].some(t => filterType.toLowerCase().includes(t)) && (
         <Group justify="flex-end" mb="md">
            <SegmentedControl 
               value={viewMode} 
               onChange={setViewMode} 
               data={[
                 { label: 'Lista Padrão', value: 'list' },
                 { label: 'Mapa de Topologia', value: 'map' },
               ]}
               color={BRAND_BLUE}
            />
         </Group>
      )}

      {/* 🟢 SE É SWITCH/AP, AGORA MOSTRA O MAPA COMO PADRÃO. SENÃO, MOSTRA A TABELA */}
      {viewMode === 'map' && ['switch', 'ap', 'access point', 'wifi'].some(t => filterType.toLowerCase().includes(t)) ? (
          <NetworkMap devices={filteredDevices} filterType={filterType} />
      ) : (
        <Paper withBorder radius="md" shadow="sm" style={{ overflow: 'hidden' }}>
          <div style={{ position: 'relative', minHeight: 200 }}>
            <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
            <ScrollArea>
              <Table highlightOnHover verticalSpacing="md" horizontalSpacing="lg">
                <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
                  <Table.Tr>
                    <Table.Th style={{ color: '#868e96', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dispositivo</Table.Th>
                    <Table.Th style={{ color: '#868e96', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Setor</Table.Th>
                    <Table.Th style={{ color: '#868e96', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Usuário</Table.Th>
                    <Table.Th style={{ color: '#868e96', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status da Manutenção</Table.Th>
                    <Table.Th style={{ width: 60 }}></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {rows.length > 0 ? rows : (
                    <Table.Tr>
                      <Table.Td colSpan={5} align="center" py={50}>
                          <Stack align="center" gap="xs">
                              <IconDatabase size={40} color="#dee2e6" />
                              <Text c="dimmed" fw={500}>Nenhum dispositivo encontrado.</Text>
                              <Button variant="subtle" size="xs" onClick={() => {setSearchQuery(''); setStatusFilter('all'); setFilterType('all');}}>Limpar Filtros</Button>
                          </Stack>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </ScrollArea>
            <Group justify="space-between" p="md" style={{ borderTop: '1px solid #f1f3f5', backgroundColor: '#fff' }}>
              <Text size="sm" c="dimmed">Exibindo <b>{paginatedData.length}</b> de <b>{filteredDevices.length}</b> registros</Text>
              {totalPages > 1 && (<Pagination total={totalPages} value={currentPage} onChange={setCurrentPage} color="blue" radius="md" size="sm" />)}
            </Group>
          </div>
        </Paper>
      )}
    </Stack>
  );
}

export default DeviceListPage;