import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Paper, Title, Text, Group, Table, Badge, Button, 
  TextInput, Stack, ScrollArea, LoadingOverlay, ActionIcon
} from '@mantine/core';
import { 
  IconHistory, IconSearch, IconCalendarEvent, 
  IconX, IconArrowRight, IconUserCog 
} from '@tabler/icons-react';
import { getHistory } from '../services/api.js'; 

const BRAND_BLUE = '#0003d9';

function HistoryPage() {
  const location = useLocation();
  const mesFiltroInicial = location.state?.initialMonthFilter || '';

  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState(mesFiltroInicial);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const data = await getHistory(); 
        
        // 🟢 LÊ OS DADOS INDEPENDENTE DE COMO O BACKEND OS ENVIA
        if (Array.isArray(data)) {
            setRecords(data);
        } else if (data && data.preventives) {
            setRecords(data.preventives);
        } else if (data && data.data) {
            setRecords(data.data);
        } else {
            setRecords([]);
        }
      } catch (err) {
        console.error("Erro ao buscar histórico:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredRecords = useMemo(() => {
    let temp = records;

    // Filtro do Gráfico (ex: "03/2026")
    if (monthFilter) {
      temp = temp.filter(record => {
        if (!record.date) return false;
        const dateObj = new Date(record.date);
        
        // 🟢 USA UTC PARA NÃO HAVER ERRO COM FUSO HORÁRIO
        const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
        const year = dateObj.getUTCFullYear();
        const recordMonthStr = `${month}/${year}`;
        
        return recordMonthStr === monthFilter;
      });
    }

    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      temp = temp.filter(record => 
        (record.technician?.toLowerCase() || '').includes(lower) ||
        (record.notes?.toLowerCase() || '').includes(lower) ||
        (record.device?.name?.toLowerCase() || '').includes(lower) ||
        (record.device?.serial?.toLowerCase() || '').includes(lower)
      );
    }

    return temp.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [records, monthFilter, searchQuery]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/D';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
  };

  return (
    <Stack gap="lg" style={{ paddingBottom: '40px' }}>
      <Paper p="xl" radius="md" withBorder style={{ borderLeft: `6px solid ${BRAND_BLUE}` }}>
        <Group justify="space-between" align="center">
          <div>
            <Group gap="sm">
              <IconHistory color={BRAND_BLUE} size={28} />
              <Title order={2} fw={800} c="dark.5">Histórico de Preventivas</Title>
            </Group>
            <Text c="dimmed" size="sm" mt={4}>
              Registro detalhado das manutenções realizadas.
            </Text>
          </div>
        </Group>
      </Paper>

      <Paper p="md" radius="md" withBorder>
        <Group grow align="flex-end">
          <TextInput 
            label="Buscar no histórico"
            placeholder="Técnico, observação ou equipamento..." 
            leftSection={<IconSearch size={16} />} 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            radius="md" 
          />
          <TextInput 
            label="Mês de Referência"
            placeholder="Ex: 03/2026" 
            leftSection={<IconCalendarEvent size={16} />} 
            value={monthFilter} 
            onChange={(e) => setMonthFilter(e.target.value)} 
            radius="md" 
            rightSection={
              monthFilter ? (
                <ActionIcon size="sm" radius="xl" color="gray" variant="subtle" onClick={() => setMonthFilter('')}>
                  <IconX size={14} />
                </ActionIcon>
              ) : null
            }
          />
        </Group>
      </Paper>

      <Paper withBorder radius="md" shadow="sm" style={{ overflow: 'hidden' }}>
        <div style={{ position: 'relative', minHeight: 300 }}>
          <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
          <ScrollArea>
            <Table highlightOnHover verticalSpacing="md" horizontalSpacing="lg">
              <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
                <Table.Tr>
                  <Table.Th>Data</Table.Th>
                  <Table.Th>Dispositivo</Table.Th>
                  <Table.Th>Técnico</Table.Th>
                  <Table.Th>Observações</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <Table.Tr key={record.id}>
                      <Table.Td>
                        <Badge color="gray" variant="light">{formatDate(record.date)}</Badge>
                      </Table.Td>
                      <Table.Td fw={600} c="dark.7">
                        {record.device?.name || 'Dispositivo Removido'}
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <IconUserCog size={16} color="gray" />
                          <Text size="sm">{record.technician}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed" lineClamp={2} style={{ maxWidth: '300px' }}>
                          {record.notes || 'Sem observações.'}
                        </Text>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        {record.deviceId && (
                          <Button 
                            component={Link} 
                            to={`/devices/${record.deviceId}`} 
                            variant="subtle" 
                            color={BRAND_BLUE} 
                            size="xs" 
                            rightSection={<IconArrowRight size={14} />}
                          >
                            Ver Ativo
                          </Button>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={5} align="center" py={50}>
                      <Stack align="center" gap="xs">
                        <IconHistory size={40} color="#dee2e6" />
                        <Text c="dimmed" fw={500}>Nenhum registro encontrado para este filtro.</Text>
                        {(monthFilter || searchQuery) && (
                          <Button variant="subtle" size="xs" onClick={() => { setMonthFilter(''); setSearchQuery(''); }}>
                            Limpar Filtros
                          </Button>
                        )}
                      </Stack>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </div>
      </Paper>
    </Stack>
  );
}

export default HistoryPage;