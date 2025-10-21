// src/pages/DeviceListPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getDevices } from '../services/api';
// 1. Importe os componentes visuais do Mantine
import { Table, Title, Group, Button, Anchor, Text } from '@mantine/core';

function DeviceListPage() {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');

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

  // 2. Crie as linhas da tabela (rows)
  const rows = filteredDevices.map((device) => (
    <Table.Tr key={device.id}>
      <Table.Td>
        {/* Usamos o Anchor do Mantine para um link com estilo */}
        <Anchor component={Link} to={`/devices/${device.id}`} size="sm" fw={500}>
          {device.name}
        </Anchor>
      </Table.Td>
      <Table.Td>
        {/* Capitaliza a primeira letra (ex: 'computer' -> 'Computer') */}
        {device.deviceType.charAt(0).toUpperCase() + device.deviceType.slice(1)}
      </Table.Td>
      <Table.Td>{device.serial || 'N/A'}</Table.Td>
      <Table.Td>
        {device.nextPreventiveDate ? new Date(device.nextPreventiveDate).toLocaleDateString() : 'N/D'}
      </Table.Td>
    </Table.Tr>
  ));

  // 3. Renderize a página com os componentes Mantine
  return (
    <div>
      <Title order={2} mb="lg">Inventário de Dispositivos ({filteredDevices.length})</Title>

      <Group mb="lg">
        <Text fw={500} size="sm">Filtrar por:</Text>
        <Button onClick={() => setFilterType('all')} variant={filterType === 'all' ? 'filled' : 'light'}>
          Todos
        </Button>
        <Button onClick={() => setFilterType('computer')} variant={filterType === 'computer' ? 'filled' : 'light'}>
          Computadores
        </Button>
        <Button onClick={() => setFilterType('printer')} variant={filterType === 'printer' ? 'filled' : 'light'}>
          Impressoras
        </Button>
      </Group>

      {/* A <Table> do Mantine adapta-se ao modo claro/escuro */}
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