// src/pages/AdminSetorPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { getDevices, bulkUpdateSetors } from '../services/api.js';
import { 
  Title, 
  Table, 
  Select, 
  Button, 
  Stack, 
  Text, 
  Group, 
  Paper, 
  LoadingOverlay,
  Alert,
  TextInput // <-- 1. Importe o TextInput
} from '@mantine/core';
import { IconAlertCircle, IconDeviceFloppy, IconSearch } from '@tabler/icons-react'; // <-- 2. Importe o IconSearch

// ==========================================================
// --- SUAS LISTAS DE SETORES ---
// (Estas listas definem o dropdown)
// ==========================================================
const setoresAdministrativos = [
  // (Por favor, adicione os seus 11 setores de escritório aqui)
  { value: 'TI', label: 'TI' },
  { value: 'Recursos Humanos', label: 'Recursos Humanos' },
  { value: 'PCP', label: 'PCP' },
  { value: 'Ambulatório', label: 'Ambulatório' },
  { value: 'Segurança do Trabalho', label: 'Segurança do Trabalho' },
  { value: 'SGI', label: 'SGI' },
  { value: 'Gerência de Produção', label: 'Gerência de Produção' },
  { value: 'Faturamento', label: 'Faturamento' },
  { value: 'Contabilidade', label: 'Contabilidade' },
  { value: 'Automação Industrial', label: 'Automação Industrial' },
  { value: 'Portaria', label: 'Portaria' },
  { value: 'Compras', label: 'Compras' },
  { value: 'Qualidade Escritório', label: 'Qualidade Escritório' },
  { value: 'Cotação', label: 'Cotação' },
  { value: 'Gerencia', label: 'Gerencia' },
  { value: 'Sala do Fernando', label: 'Sala do Fernando' },
  // ...
];

const setoresProducao = [
  { value: 'Solda', label: 'Solda' },
  { value: 'Usinagem', label: 'Usinagem' },
  { value: 'Dobra', label: 'Dobra' },
  { value: 'Estoque de Componentes', label: 'Estoque de Componentes' },
  { value: 'Calandra', label: 'Calandra' },
  { value: 'Serra', label: 'Serra' },
  { value: 'Prensa', label: 'Prensa' },
  { value: 'Solda Robo', label: 'Solda Robo' },
  { value: 'Ecoat', label: 'Ecoat' },
  { value: 'Qualidade Produção', label: 'Qualidade Produção' },
  { value: 'Seis Sigma', label: 'Seis Sigma' },
  { value: 'Manutenção', label: 'Manutenção' },
  { value: 'Expedição (Deni)', label: 'Expedição (Deni)' },
  { value: 'Laser', label: 'Laser' },
  { value: 'Puncionadeira', label: 'Puncionadeira' },
  { value: 'Recebimento', label: 'Recebimento' },
  { value: 'Pintura Liquida', label: 'Pintura Liquida' },
  { value: 'Pintura Pó', label: 'Pintura Pó' },
  { value: 'Logística', label: 'Logística' },
  { value: 'Portaria Catraca', label: 'Portaria Catraca' },
  { value: 'Laboratório Químico', label: 'Laboratório Químico' },
  { value: 'Almoxarifado', label: 'Almoxarifado' },
  { value: 'Balança', label: 'Balança' },
  { value: 'Expedição', label: 'Expedição' },
  { value: 'Processos', label: 'Processos' },
  { value: 'Sala Limpa', label: 'Sala Limpa' },
  { value: 'Ferramentaria', label: 'Ferramentaria' },
  { value: 'Braço Tridimencional', label: 'Braço Tridimencional' },
  { value: 'Casa de Tintas', label: 'Casa de Tintas' },
  { value: 'Depart. Técnico de Solda', label: 'Depart. Técnico de Solda' },
  { value: 'Logística Empilhadeiras', label: 'Logística Empilhadeiras' },
  { value: 'Almoxarifado Transferíveis', label: 'Almoxarifado Transferíveis' },
  { value: 'Amostra', label: 'Amostra' },
  { value: 'Jato de Granalha', label: 'Jato de Granalha' },
  { value: 'Treinamento', label: 'Treinamento' },
];
// ==========================================================

const allSetorOptions = [
  { group: 'Administrativo (120 dias)', items: setoresAdministrativos },
  { group: 'Produção (30 dias)', items: setoresProducao },
];

function getIntervalFromSetor(setor) {
  const isProducao = setoresProducao.some(s => s.value === setor);
  return isProducao ? 30 : 120;
}


function AdminSetorPage() {
  const [devices, setDevices] = useState([]); 
  const [changes, setChanges] = useState({}); 
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState(''); // <-- 3. Adicione o estado da pesquisa

  // Busca todos os dispositivos ao carregar
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

  // Quando o usuário muda um dropdown
  const handleSetorChange = (deviceId, newSetor) => {
    setChanges(prev => ({
      ...prev,
      [deviceId]: newSetor
    }));
  };

  // Quando o usuário clica em "Salvar"
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(null);

    const updates = Object.keys(changes).map(deviceId => ({
      id: deviceId,
      setor: changes[deviceId],
      interval: getIntervalFromSetor(changes[deviceId]) 
    }));

    if (updates.length === 0) {
      setSaveSuccess("Nenhuma alteração para salvar.");
      setIsSaving(false);
      return;
    }

    try {
      const response = await bulkUpdateSetors(updates);
      if (response.success) {
        setSaveSuccess(response.message);
        setChanges({}); 
        // Recarrega a lista para mostrar os novos valores
        const data = await getDevices(); 
        if (data.success) setDevices(data.devices);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // --- 4. FILTRA OS DISPOSITIVOS (Para a Pesquisa) ---
  const filteredDevices = useMemo(() => {
    if (!searchQuery) {
      return devices; // Retorna tudo se a pesquisa estiver vazia
    }
    const searchLower = searchQuery.toLowerCase();
    return devices.filter(device => 
      device.name.toLowerCase().includes(searchLower)
    );
  }, [devices, searchQuery]); // Recalcula se a lista principal ou a pesquisa mudar


  // 5. Constrói as linhas (usando a lista filtrada)
  const rows = useMemo(() => filteredDevices.map((device) => {
    const currentSetor = changes[device.id] !== undefined ? changes[device.id] : (device.setor || null);

    return (
      <Table.Tr key={device.id}>
        <Table.Td>{device.name}</Table.Td>
        <Table.Td>{device.operatingSystem || 'N/D'}</Table.Td>
        <Table.Td>
          <Select
            placeholder="Selecione um setor..."
            data={allSetorOptions}
            value={currentSetor}
            onChange={(value) => handleSetorChange(device.id, value)}
            searchable
            clearable 
          />
        </Table.Td>
        <Table.Td>
          {changes[device.id] 
             ? getIntervalFromSetor(changes[device.id]) 
             : (device.maintenanceIntervalDays || 'N/D')
          }
        </Table.Td>
      </Table.Tr>
    );
  }), [filteredDevices, changes]); // <-- 6. Depende da lista FILTRADA


  return (
    <Stack>
      {/* --- 7. LAYOUT NOVO (Como o DeviceListPage) --- */}
      <Group justify="space-between" mb="md">
        <Title order={2}>Categorização de Setores ({filteredDevices.length})</Title>
        <Group>
          <TextInput
            placeholder="Buscar por nome..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button 
            leftSection={<IconDeviceFloppy size={18} />}
            onClick={handleSave}
            loading={isSaving}
            disabled={Object.keys(changes).length === 0}
          >
            Salvar {Object.keys(changes).length > 0 ? `(${Object.keys(changes).length})` : ''} Alterações
          </Button>
        </Group>
      </Group>

      <Paper withBorder p="md" radius="md">
        {saveSuccess && <Alert color="green" title="Sucesso" mb="md">{saveSuccess}</Alert>}
        {error && <Alert color="red" title="Erro" mb="md">{error}</Alert>}

        {/* --- 8. O TEXTO FOI REMOVIDO DAQUI --- */}

        <LoadingOverlay visible={isLoading} />
        <Table striped highlightOnHover verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nome do Dispositivo</Table.Th>
              <Table.Th>Sistema Operacional</Table.Th>
              <Table.Th>Setor</Table.Th>
              <Table.Th>Intervalo (Dias)</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Paper>
    </Stack>
  );
}

export default AdminSetorPage;