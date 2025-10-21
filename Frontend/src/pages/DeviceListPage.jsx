// src/pages/DeviceListPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getDevices } from '../services/api';

// 1. Importe os novos componentes <Menu> e <IconFilter>
import { 
  Table, 
  Title, 
  Group, 
  Button, 
  Anchor, 
  Text, 
  Menu 
} from '@mantine/core';
import { 
  IconFilter, 
  IconDeviceDesktop, 
  IconPrinter, 
  IconList 
} from '@tabler/icons-react';

// 2. Mapeamento para os nomes dos filtros (para mostrar no botão)
const filterLabels = {
  all: 'Todos',
  computer: 'Computadores',
  printer: 'Impressoras'
};

function DeviceListPage() {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 3. Mude o filtro padrão para 'computer'
  const [filterType, setFilterType] = useState('computer'); 

  useEffect(() => {
    // ... (a sua lógica de fetch continua igual)
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

  const filteredDevices = useMemo(() => {
    // ... (a sua lógica de filtro continua igual)
    if (filterType === 'all') return devices;
    return devices.filter(device => device.deviceType === filterType);
  }, [devices, filterType]);

  if (isLoading) {
    return <div>A carregar dispositivos...</div>;
  }
  if (error) {
    return <div style={{ color: 'red' }}>Erro: {error}</div>;
  }

  const rows = filteredDevices.map((device) => (
    // ... (a sua lógica de tabela continua igual)
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
        
        {/* --- 4. SUBSTITUA OS BOTÕES POR UM MENU "DROPDOWN" --- */}
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <Button 
              leftSection={<IconFilter size={16} />} 
              variant="light" // Usa o estilo "light" que definimos no theme.js
            >
              Filtro: {filterLabels[filterType]}
            </Button>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>Filtrar por tipo</Menu.Label>
            <Menu.Item 
              leftSection={<IconList size={14} />}
              onClick={() => setFilterType('all')}
            >
              Todos
            </Menu.Item>
            <Menu.Item 
              leftSection={<IconDeviceDesktop size={14} />}
              onClick={() => setFilterType('computer')}
            >
              Computadores
            </Menu.Item>
            <Menu.Item 
              leftSection={<IconPrinter size={14} />}
              onClick={() => setFilterType('printer')}
            >
              Impressoras
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      {/* Tabela (sem alterações) */}
      <Table withTableBorder withColumnBorders highlightOnHover>
        <Table.Thead>
          {/* ... (cabeçalhos da tabela) ... */}
        </Table.Thead>
        <Table.Tbody>
          {rows.length > 0 ? rows : (
            <Table.Tr>
              <Table.Td colSpan={4} ta="center">Nenhum dispositivo encontrado para este filtro.</Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </div>
  );
}

export default DeviceListPage;