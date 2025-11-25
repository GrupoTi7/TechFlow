import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getDevices } from '../services/api.js';

// 1. Importações do Mantine
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

// 2. Importações de Ícones
import { 
  IconFilter, IconDeviceDesktop, IconPrinter, IconList, IconSearch,
  IconAlertTriangle, IconClock, IconBuildingStore, IconBuildingFactory,
  IconDeviceLaptop,
  IconServer,
  IconDeviceFloppy,
  IconEye,        
  IconRefresh     
} from '@tabler/icons-react';

const filterLabels = {
  all: 'Todos',
  computer: 'Computadores',
  printer: 'Impressoras'
};

// --- FUNÇÃO-ASSISTENTE 1: Ícones de Dispositivo ---
function getDeviceIcon(deviceType) {
  const type = (deviceType || '').toLowerCase();
  if (type.includes('notebook')) {
    return <ThemeIcon variant="light" color="blue" radius="md"><IconDeviceLaptop size="1.1rem" /></ThemeIcon>;
  }
  if (type.includes('printer') || type.includes('impressora')) {
    return <ThemeIcon variant="light" color="gray" radius="md"><IconPrinter size="1.1rem" /></ThemeIcon>;
  }
  if (type.includes('vmware') || type.includes('virtual')) {
    return <ThemeIcon variant="light" color="grape" radius="md"><IconServer size="1.1rem" /></ThemeIcon>;
  }
  if (type.includes('desktop') || type.includes('mini pc')) {
    return <ThemeIcon variant="light" color="teal" radius="md"><IconDeviceDesktop size="1.1rem" /></ThemeIcon>;
  }
  return <ThemeIcon variant="light" color="dark" radius="md"><IconDeviceFloppy size="1.1rem" /></ThemeIcon>;
}

// --- FUNÇÃO-ASSISTENTE 2: Badges de Status ---
function getStatusBadge(nextDateStr) {
  const now = new Date();
  now.setHours(0, 0, 0, 0); 

  if (!nextDateStr) {
    return <Badge color="gray" variant="outline" size="sm" radius="sm">N/D</Badge>;
  }

  const nextDate = new Date(nextDateStr);
  nextDate.setHours(0, 0, 0, 0);

  if (nextDate < now) {
    return <Badge color="red" variant="light" size="sm" radius="sm">Atrasado</Badge>;
  }

  const upcomingLimit = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias

  if (nextDate <= upcomingLimit) {
    return <Badge color="yellow" variant="light" size="sm" radius="sm">Atenção</Badge>;
  }

  return <Badge color="green" variant="light" size="sm" radius="sm">Em Dia</Badge>;
}


function DeviceListPage() {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const location = useLocation();
  
  // Estados de Filtro
  const [filterType, setFilterType] = useState('all');
  const [statusFilter, setStatusFilter] = useState(location.state?.initialStatusFilter || 'all'); 
  const [nomenclatureFilter, setNomenclatureFilter] = useState(location.state?.initialNomenclatureFilter || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  // Estado de Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  useEffect(() => {
    fetchDevices();
  }, []); 

  // --- Lógica de Filtragem (Intacta) ---
  const filteredDevices = useMemo(() => {
    let tempDevices = devices;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Filtro por TIPO
    if (filterType === 'computer') {
      tempDevices = tempDevices.filter(d => 
        !d.deviceType.toLowerCase().includes('printer')
      );
    } else if (filterType === 'printer') {
      tempDevices = tempDevices.filter(d => 
        d.deviceType.toLowerCase().includes('printer')
      );
    }

    // Filtro por STATUS
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
    
    // Filtro por NOMENCLATURA
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
    
    // Filtro por PESQUISA
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

  // --- Lógica de Paginação ---
  const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
  const paginatedData = filteredDevices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Contagem de Subgrupos (apenas visual)
  const subGroupCounts = useMemo(() => {
    if (nomenclatureFilter === 'owned') {
      const ptrCount = filteredDevices.filter(d => d.name.toUpperCase().startsWith('PTR')).length;
      const trcCount = filteredDevices.filter(d => d.name.toUpperCase().startsWith('TRC')).length;
      return `(Comprados: ${ptrCount} PTR, ${trcCount} TRC)`;
    }
    if (nomenclatureFilter === 'rented') {
      const netsiteCount = filteredDevices.filter(d => d.name.toUpperCase().startsWith('NETSITE')).length;
      const vivoCount = filteredDevices.filter(d => 
        d.name.toUpperCase().startsWith('VIVO') || d.name.toUpperCase().startsWith('LENOVO')
      ).length; 
      const sorocampCount = filteredDevices.filter(d => d.name.toUpperCase().startsWith('SOROCAMP')).length; 
      const infobrasCount = filteredDevices.filter(d => d.name.toUpperCase().startsWith('INFOBRAS')).length;
      return `(Alugados: ${netsiteCount} NETSITE, ${vivoCount} VIVO, ${sorocampCount} SOROCAMP, ${infobrasCount} INFOBRAS)`; 
    }
    return null;
  }, [filteredDevices, nomenclatureFilter]);


  if (error) return <div style={{ color: 'red' }}>Erro: {error}</div>;

  // --- CONSTRUÇÃO DAS LINHAS DA TABELA ---
  const rows = paginatedData.map((device) => (
    <Table.Tr key={device.id}>
      {/* Nome com Ícone - Negrito para destaque */}
      <Table.Td>
        <Group gap="sm" wrap="nowrap">
          {getDeviceIcon(device.deviceType)}
          <Stack gap={0}>
            <Anchor component={Link} to={`/devices/${device.id}`} size="sm" fw={600} c="dark" underline="never">
                {device.name}
            </Anchor>
            {/* Pequena melhoria: mostrar o serial abaixo do nome se quiser, ou manter separado */}
          </Stack>
        </Group>
      </Table.Td>
      
      {/* Setor */}
      <Table.Td>
        <Text size="sm" c="dimmed">{device.setor || 'N/D'}</Text>
      </Table.Td>
      
      {/* Usuário - Limpo */}
      <Table.Td>
        <Text size="sm" c="dimmed">{device.contact ? device.contact.split('@')[0] : 'N/D'}</Text>
      </Table.Td>

      {/* Status - Centralizado */}
      <Table.Td style={{ textAlign: 'center' }}>
        {getStatusBadge(device.nextPreventiveDate)}
      </Table.Td>

      {/* Ações - Alinhado à direita */}
      <Table.Td style={{ textAlign: 'right' }}>
        <Button 
          component={Link} 
          to={`/devices/${device.id}`} 
          variant="subtle" 
          color="blue"
          size="xs" 
          radius="md"
          leftSection={<IconEye size={14} />}
        >
          Detalhes
        </Button>
      </Table.Td>
    </Table.Tr>
  ));
  
  return (
    <Stack gap="lg">
      {/* --- CABEÇALHO UNIFICADO --- */}
      <Paper withBorder p="md" radius="md" shadow="sm">
        <Group justify="space-between" align="center" mb="lg">
            <Group gap="xs">
                <Title order={3}>Inventário de Dispositivos</Title>
                <Badge size="lg" variant="light" color="blue" circle>
                    {filteredDevices.length}
                </Badge>
            </Group>
            {subGroupCounts && <Text c="dimmed" size="sm">{subGroupCounts}</Text>}
            
            <Button variant="light" size="xs" onClick={fetchDevices} loading={isLoading} leftSection={<IconRefresh size={14}/>}>
              Atualizar Lista
            </Button>
        </Group>

        {/* Grade de Filtros (Mantida igual, só dentro do Paper agora) */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="sm">
            <TextInput
            placeholder="Buscar por nome, serial..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
            
            <Menu shadow="md" width={200} withinPortal>
            <Menu.Target>
                <Button 
                fullWidth leftSection={<IconFilter size={16} />} variant="default"
                c={statusFilter !== 'all' ? (statusFilter === 'overdue' ? 'red' : 'yellow.8') : 'dimmed'}
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
                <Button fullWidth leftSection={<IconFilter size={16} />} variant="default" c={filterType !== 'all' ? 'blue' : 'dimmed'}>
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

            <Menu shadow="md" width={200} withinPortal>
            <Menu.Target>
                <Button 
                fullWidth leftSection={<IconFilter size={16} />} variant="default"
                c={nomenclatureFilter !== 'all' ? 'blue' : 'dimmed'}
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
      </Paper>

      {/* --- TABELA (Design Unificado) --- */}
      <Paper withBorder p="0" radius="md" shadow="sm" style={{ overflow: 'hidden' }}>
        <div style={{ position: 'relative', minHeight: 200 }}>
          <LoadingOverlay visible={isLoading} />
          
          <ScrollArea>
            <Table 
              striped 
              highlightOnHover 
              verticalSpacing="md"  // Mais espaçamento vertical (como na pag detalhes)
              horizontalSpacing="md"
              minWidth={800} 
            >
              <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
                <Table.Tr>
                  <Table.Th>Nome</Table.Th>
                  <Table.Th>Setor</Table.Th>
                  <Table.Th>Usuário</Table.Th>
                  <Table.Th style={{ textAlign: 'center' }}>Status</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>Ações</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.length > 0 ? rows : (
                  <Table.Tr>
                    <Table.Td colSpan={5} ta="center" py="xl" c="dimmed">
                      Nenhum dispositivo encontrado para os filtros selecionados.
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>

          {/* Paginação Centralizada */}
          {totalPages > 1 && (
            <Group justify="center" p="md" style={{ borderTop: '1px solid #dee2e6' }}>
              <Pagination total={totalPages} value={currentPage} onChange={setCurrentPage} />
            </Group>
          )}
        </div>
      </Paper>
    </Stack>
  );
}

export default DeviceListPage;