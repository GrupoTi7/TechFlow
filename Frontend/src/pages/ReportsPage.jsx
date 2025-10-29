// src/pages/ReportsPage.jsx
import React, { useState, useEffect } from 'react'; 
import { getTechnicianReport, getTopDevicesReport } from '../services/api';
import { Card, Text, Title, ThemeIcon, Group, Stack } from '@mantine/core'; 
// 1. Importe o Chart.js
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';
import { IconChartBar, IconTool } from '@tabler/icons-react';

// 2. Registe os componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend
);

function ReportsPage() {
  const [techReportData, setTechReportData] = useState([]);
  const [topDevicesData, setTopDevicesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

  // 3. Opções para os gráficos (incluindo o tooltip branco)
  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#333',
        bodyColor: '#111',
        borderColor: '#e0e0e0',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y} manutenções`;
          }
        }
      },
      legend: {
        display: false
      }
    }
  };

  // 4. Transforme os dados para o formato do Chart.js
  const techChartData = {
    labels: techReportData.map(d => d.name),
    datasets: [{
      label: 'Preventivas',
      data: techReportData.map(d => d.value),
      backgroundColor: 'rgba(34, 139, 230, 0.6)',
      borderColor: 'rgba(34, 139, 230, 1)',
      borderWidth: 1,
    }]
  };
  
  const topDevicesChartData = {
    labels: topDevicesData.map(d => d.name),
    datasets: [{
      label: 'Preventivas',
      data: topDevicesData.map(d => d.value),
      backgroundColor: 'rgba(134, 142, 150, 0.6)',
      borderColor: 'rgba(134, 142, 150, 1)',
      borderWidth: 1,
    }]
  };

  return (
    <Stack gap="xl">
      <Title order={2}>Relatórios de Manutenção</Title>

      {/* Gráfico 1: Preventivas por Técnico */}
      <Card withBorder radius="md" p="lg" shadow="sm" style={{ minHeight: 400 }}>
        <Group>
          <ThemeIcon variant="light" size="xl" radius="md"><IconTool /></ThemeIcon>
          <Text size="lg" fw={700}>Preventivas Realizadas por Técnico</Text>
        </Group>
        <div style={{ height: '300px', marginTop: '20px' }}>
          <Bar data={techChartData} options={chartOptions} />
        </div>
      </Card>

      {/* Gráfico 2: Top 10 Dispositivos */}
      <Card withBorder radius="md" p="lg" shadow="sm" style={{ minHeight: 400 }}>
        <Group>
          <ThemeIcon variant="light" size="xl" radius="md" color="gray"><IconChartBar /></ThemeIcon>
          <Text size="lg" fw={700}>Top 10 Dispositivos por N.º de Manutenções</Text>
        </Group>
        <div style={{ height: '300px', marginTop: '20px' }}>
          <Bar data={topDevicesChartData} options={chartOptions} />
        </div>
      </Card>
    </Stack>
  );
}

export default ReportsPage;