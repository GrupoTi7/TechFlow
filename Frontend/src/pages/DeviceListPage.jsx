// src/pages/DeviceListPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getDevices } from '../services/api';

// 1. Importe TextInput e o ícone de Lupa
import { 
  Table, 
  Title, 
  Group, 
  Button, 
  Anchor, 
  Text, 
  Menu, 
  TextInput // <-- Importe o TextInput
} from '@mantine/core';
import { 
  IconFilter, 
  IconDeviceDesktop, 
  IconPrinter, 
  IconList,
  IconSearch // <-- Importe o ícone de Lupa
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
  const [filterType, setFilterType] = useState('computer'); 
  
  // --- 2. ADICIONE O ESTADO PARA A PESQUISA ---
  const [searchQuery, setSearchQuery] = useState('');

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

  // --- 3. ATUALIZE A LÓGICA DE FILTRAGEM ---
  // Agora, filtramos por TIPO e DEPOIS por NOME
  const filteredDevices = useMemo(() => {
    let tempDevices = devices;

    // Primeiro, filtra por tipo
    if (filterType !== 'all') {
      tempDevices = tempDevices.filter(device => device.deviceType === filterType);
    }

    // Depois, filtra pelo texto da pesquisa
    if (searchQuery.trim() !== '') {
      tempDevices = tempDevices.filter(device => 
        device.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return tempDevices;
  }, [devices, filterType, searchQuery]); // Adicione searchQuery às dependências

  
  if (isLoading) {
    return <div>A carregar dispositivos...</div>;
  }
  if (error) {
    return <div style={{ color: 'red' }}>Erro: {error}</div>;
  }

  const rows = filteredDevices.map((device) => (
    <Table.Tr key={device.id}>
      <Table.Td>
        <Anchor component={Link} to={`/devices/${device.id}`} size="sm" fw={500}>
          {device.name}
        </Anchor>
      </Table.Td>
      <Table.Td>
        {device.deviceType.charAt(0).toUpperCase() + device.deviceType.slice(1)}
      </Table.Td>
      <Table.Td>{device.serial || 'N/A'}</Table.Td>
      <Table.Td>
        {device.nextPreventiveDate ? new Date(device.nextPreventiveDate).toLocaleDateString() : 'N/D'}
      </Table.Td>
    </Table.Tr>
  ));


  return (
    <div>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Inventário de Dispositivos ({filteredDevices.length})</Title>
        
        {/* --- 4. ADICIONE O CAMPO DE PESQUISA --- */}
        <Group>
          <TextInput
            placeholder="Buscar por nome..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <Menu shadow="md" width={200}>
            <Menu.Target>
              <Button 
                leftSection={<IconFilter size={16} />} 
                variant="light"
              >
                Filtro: {filterLabels[filterType]}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Filtrar por tipo</Menu.Label>
              <Menu.Item leftSection={<IconList size={14} />} onClick={() => setFilterType('all')}>
                Todos
              </Menu.Item>
              <Menu.Item leftSection={<IconDeviceDesktop size={14} />} onClick={() => setFilterType('computer')}>
                Computadores
              </Menu.Item>
              <Menu.Item leftSection={<IconPrinter size={14} />} onClick={() => setFilterType('printer')}>
                Impressoras
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      {/* Tabela (sem alterações) */}
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