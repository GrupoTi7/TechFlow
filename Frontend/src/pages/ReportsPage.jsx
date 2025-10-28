// src/pages/ReportsPage.jsx
import React, { useState, useEffect } from 'react'; 
import { getTechnicianReport, getTopDevicesReport } from '../services/api';
import { Card, Text, Title, ThemeIcon, Group, Stack } from '@mantine/core'; 
import { BarChart } from '@mantine/charts';
import { IconChartBar, IconTool } from '@tabler/icons-react';

function ReportsPage() {
  const [techReportData, setTechReportData] = useState([]);
  const [topDevicesData, setTopDevicesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // ... (a sua lógica de fetch continua igual)
    const fetchReports = async () => {
      try {
        const [techResult, topDevicesResult] = await Promise.all([
          getTechnicianReport(),
          getTopDevicesReport()
        ]);
        if (techResult.success) setTechReportData(techResult.data);
        if (topDevicesResult.success) setTopDevicesData(topDevicesResult.data);
        if (!techResult.success || !topDevicesResult.success) {
          throw new Error('Falha ao carregar um ou mais relatórios.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (isLoading) return <div>A carregar relatórios...</div>;
  if (error) return <div style={{ color: 'red' }}>Erro: {error}</div>;

  // --- A NOVA ABORDAGEM PARA O TOOLTIP ---
  const tooltipStyles = {
    wrapperStyle: { 
      background: 'white', 
      borderColor: '#e0e0e0',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      padding: '8px 12px'
    },
    labelStyle: { 
      color: '#333', 
      fontSize: '12px',
      marginBottom: '5px' 
    },
    itemStyle: { 
      color: '#111',
      fontSize: '12px',
      fontWeight: 'bold'
    },
  };
  // ------------------------------------------

  return (
    <Stack gap="xl">
      <Title order={2}>Relatórios de Manutenção</Title>

      {/* Gráfico 1: Preventivas por Técnico */}
      <Card withBorder radius="md" p="lg" shadow="sm">
        <Group>
          <ThemeIcon variant="light" size="xl" radius="md"><IconTool /></ThemeIcon>
          <Text size="lg" fw={700}>Preventivas Realizadas por Técnico</Text>
        </Group>
        <BarChart
          h={300}
          data={techReportData}
          dataKey="name"
          series={[{ name: 'value', color: 'blue.6', label: 'Preventivas' }]}
          tickLine="y"
          // APLICA OS NOVOS ESTILOS DE TOOLTIP
          tooltipProps={{
            ...tooltipStyles,
            formatter: (value) => `${value} manutenções`,
          }}
        />
      </Card>

      {/* Gráfico 2: Top 10 Dispositivos */}
      <Card withBorder radius="md" p="lg" shadow="sm">
        <Group>
          <ThemeIcon variant="light" size="xl" radius="md" color="gray"><IconChartBar /></ThemeIcon>
          <Text size="lg" fw={700}>Top 10 Dispositivos por N.º de Manutenções</Text>
        </Group>
        <BarChart
          h={300}
          data={topDevicesData}
          dataKey="name"
          series={[{ name: 'value', color: 'gray.6', label: 'Preventivas' }]}
          tickLine="y"
          // APLICA OS NOVOS ESTILOS DE TOOLTIP
          tooltipProps={{
            ...tooltipStyles,
            formatter: (value) => `${value} manutenções`,
          }}
        />
      </Card>
    </Stack>
  );
}

export default ReportsPage;