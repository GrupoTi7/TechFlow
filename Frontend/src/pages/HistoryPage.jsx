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

// Assumindo que você tem ou vai criar esta função no seu api.js
import { getHistory } from '../services/api.js'; 

const BRAND_BLUE = '#0003d9';

function HistoryPage() {
  const location = useLocation();
  
  // 🟢 AQUI ESTÁ A MÁGICA: Ele captura o mês que veio do clique no gráfico!
  const mesFiltroInicial = location.state?.initialMonthFilter || '';

  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState(mesFiltroInicial);

  useEffect(() => {
    // Função para buscar o histórico no backend
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        // Chama a API (você precisará garantir que essa rota existe no backend)
        const data = await getHistory(); 
        if (data.success) {
          setRecords(data.preventives || []);
        }
      } catch (err) {
        console.error("Erro ao buscar histórico:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Filtra os dados com base na busca e no mês clicado no Dashboard
  const filteredRecords = useMemo(() => {
    let temp = records;

    // Filtro do Gráfico (ex: "03/2026")
    if (monthFilter) {
      temp = temp.filter(record => {
        if (!record.date) return false;
        const dateObj = new Date(record.date);
        // Adiciona um zero à esquerda se for menor que 10
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        const recordMonthStr = `${month}/${year}`;
        return recordMonthStr === monthFilter;
      });
    }

    // Filtro de Texto (Busca livre)
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      temp = temp.filter(record => 
        (record.technician?.toLowerCase() || '').includes(lower) ||
        (record.notes?.toLowerCase() || '').includes(lower) ||
        (record.device?.name?.toLowerCase() || '').includes(lower)
      );
    }

    // Ordenar da mais recente para a mais antiga
    return temp.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [records, monthFilter, searchQuery]);

  // Formata a data para padrão Brasileiro
  const formatDate = (dateString) => {
    if (!dateString) return 'N/D';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <Stack gap="lg" style={{ paddingBottom: '40px' }}>
      
      {/* Cabeçalho da Página */}
      <Paper p="xl" radius="md" withBorder style={{ borderLeft: `6px solid ${BRAND_BLUE}` }}>
        <Group justify="space-between" align="center">
          <div>
            <Group gap="sm">
              <IconHistory color={BRAND_BLUE} size={28} />
              <Title order={2} fw={800} c="dark.5">Histórico de Preventivas</Title>
            </Group>
            <Text c="dimmed" size="sm" mt={4}>
              Registro completo de todas as manutenções realizadas.
            </Text>
          </div>
        </Group>
      </Paper>

      {/* Barra de Filtros */}
      <Paper p="md" radius="md" withBorder>
        <Group grow align="flex-end">
          <TextInput 
            label="Buscar no histórico"
            placeholder="Técnico, observação ou dispositivo..." 
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

      {/* Tabela de Resultados */}
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