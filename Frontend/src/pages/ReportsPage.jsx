import React, { useState, useEffect, useMemo, useRef } from 'react'; 
import { 
    getTechnicianReport, 
    getTopDevicesReport, 
    getSectorReport, 
    getStatusReport,
    getHistoryReport
} from '../services/api.js';

// Bibliotecas para PDF
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { 
    Card, Text, Title, ThemeIcon, Group, Stack, SimpleGrid, 
    Loader, Alert, Paper, RingProgress, Center, Button 
} from '@mantine/core'; 

// Importar Gráficos
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement, 
  PointElement, 
  LineElement,  
  Filler,       
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';

import { 
    IconChartBar, IconTool, IconBuildingFactory, IconActivity, 
    IconAlertTriangle, IconCheck, IconDownload, IconTrendingUp, 
    IconPrinter // <--- Ícone de Impressora
} from '@tabler/icons-react';

// Registrar componentes do ChartJS
ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement, 
  PointElement, LineElement, Filler, 
  ChartTitle, Tooltip, Legend
);

function ReportsPage() {
  const [techReportData, setTechReportData] = useState([]);
  const [topDevicesData, setTopDevicesData] = useState([]);
  const [sectorData, setSectorData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  
  const dashboardRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [techRes, topDevRes, sectorRes, statusRes, historyRes] = await Promise.all([
          getTechnicianReport(),
          getTopDevicesReport(),
          getSectorReport(),
          getStatusReport(),
          getHistoryReport()
        ]);

        if (techRes.success) setTechReportData(techRes.data);
        if (topDevRes.success) setTopDevicesData(topDevRes.data);
        if (sectorRes.success) setSectorData(sectorRes.data);
        if (statusRes.success) setStatusData(statusRes.data);
        if (historyRes.success) setHistoryData(historyRes.data);

      } catch (err) {
        setError(err.message || 'Erro ao carregar dados.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []); 

  // --- FUNÇÃO GERAR PDF ---
  const handleDownloadPDF = async () => {
    if (!dashboardRef.current) return;
    
    const canvas = await html2canvas(dashboardRef.current, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Relatorio_TechFlow_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  // --- CÁLCULOS DE KPI ---
  const kpis = useMemo(() => {
    const totalDevices = sectorData.reduce((acc, curr) => acc + curr.value, 0);
    const totalMaintenances = techReportData.reduce((acc, curr) => acc + curr.value, 0);

    const emDiaItem = statusData.find(d => d.name === 'Em Dia');
    const emDiaCount = emDiaItem ? emDiaItem.value : 0;
    const totalStatusCount = statusData.reduce((acc, curr) => acc + curr.value, 0);
    
    const complianceRate = totalStatusCount > 0 
        ? Math.round((emDiaCount / totalStatusCount) * 100) 
        : 0;

    const topSector = sectorData.length > 0 
        ? sectorData.reduce((prev, current) => (prev.value > current.value) ? prev : current)
        : { name: '-', value: 0 };

    return { totalDevices, totalMaintenances, complianceRate, topSector };
  }, [sectorData, techReportData, statusData]);


  if (isLoading) return <Center h={300}><Loader size="lg" /></Center>;
  if (error) return <Alert icon={<IconAlertTriangle/>} title="Erro" color="red">{error}</Alert>;

  // --- CONFIGURAÇÃO GRÁFICOS ---
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } }
  };

  const historyChartData = {
    labels: historyData.map(d => d.name),
    datasets: [{
      label: 'Manutenções',
      data: historyData.map(d => d.value),
      borderColor: '#228be6',
      backgroundColor: 'rgba(34, 139, 230, 0.2)',
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointBackgroundColor: '#fff',
      pointBorderColor: '#228be6'
    }]
  };

  const techChartData = {
    labels: techReportData.map(d => d.name),
    datasets: [{
      label: 'Preventivas',
      data: techReportData.map(d => d.value),
      backgroundColor: '#228be6',
      borderRadius: 4,
    }]
  };
  
  const topDevicesChartData = {
    labels: topDevicesData.map(d => d.name),
    datasets: [{
      label: 'Manutenções',
      data: topDevicesData.map(d => d.value),
      backgroundColor: '#868e96',
      borderRadius: 4,
    }]
  };

  const sectorChartData = {
    labels: sectorData.map(d => d.name),
    datasets: [{
      label: 'Qtd.',
      data: sectorData.map(d => d.value),
      backgroundColor: '#fab005',
      borderRadius: 4,
    }]
  };

  const statusChartData = {
    labels: statusData.map(d => d.name),
    datasets: [{
      data: statusData.map(d => d.value),
      backgroundColor: statusData.map(d => d.color || '#ccc'),
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  // --- COMPONENTES AUXILIARES ---
  const KpiCard = ({ title, value, icon: Icon, color, subtext }) => (
    <Paper withBorder p="md" radius="md" shadow="xs">
        <Group justify="space-between">
            <div>
                <Text c="dimmed" tt="uppercase" fw={700} size="xs">{title}</Text>
                <Text fw={700} size="xl">{value}</Text>
                {subtext && <Text c="dimmed" size="xs" mt="sm">{subtext}</Text>}
            </div>
            <ThemeIcon color={color} variant="light" size="xl" radius="md">
                <Icon size={28} stroke={1.5} />
            </ThemeIcon>
        </Group>
    </Paper>
  );

  const ChartCard = ({ title, children }) => (
    <Card withBorder radius="md" p="lg" shadow="sm">
        <Text size="lg" fw={700} mb="md">{title}</Text>
        <div style={{ height: '250px', position: 'relative' }}>{children}</div>
    </Card>
  );

  return (
    <Stack gap="lg" pb="xl">
      <Group justify="space-between" align="center">
        <div>
            <Title order={2}>Dashboard de Operações</Title>
            <Text c="dimmed">Visão consolidada e histórico de manutenção</Text>
        </div>
        
        {/* GRUPO DE BOTÕES (Imprimir + Baixar) */}
        <Group>
            <Button 
                leftSection={<IconPrinter size={18}/>} 
                variant="default" 
                onClick={() => window.print()}
            >
                Imprimir
            </Button>

            <Button 
                leftSection={<IconDownload size={18}/>} 
                color="red" 
                variant="filled"
                onClick={handleDownloadPDF}
            >
                Baixar PDF
            </Button>
        </Group>
      </Group>

      {/* ÁREA DE IMPRESSÃO (Tudo dentro desta div sairá no PDF) */}
      <div ref={dashboardRef} style={{ padding: '10px', backgroundColor: '#fff' }}> 
        
        {/* --- SEÇÃO 1: KPIS --- */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="lg">
            <KpiCard 
                title="Total de Ativos" 
                value={kpis.totalDevices} 
                icon={IconBuildingFactory} 
                color="blue"
                subtext="Dispositivos cadastrados" 
            />
            
            <Paper withBorder p="md" radius="md" shadow="xs">
                <Group>
                    <RingProgress
                        size={80}
                        roundCaps
                        thickness={8}
                        sections={[{ value: kpis.complianceRate, color: kpis.complianceRate > 70 ? 'teal' : 'red' }]}
                        label={<Center><IconCheck size={20} /></Center>}
                    />
                    <div>
                        <Text c="dimmed" tt="uppercase" fw={700} size="xs">Conformidade</Text>
                        <Text fw={700} size="xl">{kpis.complianceRate}%</Text>
                        <Text c="dimmed" size="xs">Equipamentos em dia</Text>
                    </div>
                </Group>
            </Paper>

            <KpiCard 
                title="Produtividade Total" 
                value={kpis.totalMaintenances} 
                icon={IconTool} 
                color="orange"
                subtext="Preventivas realizadas" 
            />

            <KpiCard 
                title="Maior Setor" 
                value={kpis.topSector.name} 
                icon={IconActivity} 
                color="grape"
                subtext={`${kpis.topSector.value} dispositivos`} 
            />
        </SimpleGrid>

        {/* --- SEÇÃO 2: HISTÓRICO --- */}
        <Card withBorder radius="md" p="lg" shadow="sm" mb="lg">
            <Group mb="md">
                <ThemeIcon variant="light" size="lg" radius="md" color="blue">
                    <IconTrendingUp size={24} />
                </ThemeIcon>
                <Text size="lg" fw={700}>Evolução Mensal (Últimos 6 Meses)</Text>
            </Group>
            <div style={{ height: '300px' }}>
                <Line data={historyChartData} options={commonOptions} />
            </div>
        </Card>

        {/* --- SEÇÃO 3: GRÁFICOS DETALHADOS --- */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <ChartCard title="Status dos dispositivos">
                <Doughnut data={statusChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />
            </ChartCard>

            <ChartCard title="Equipamentos por Setor">
                <Bar data={sectorChartData} options={commonOptions} />
            </ChartCard>

            <ChartCard title="Performance Técnica">
                <Bar data={techChartData} options={commonOptions} />
            </ChartCard>

            <ChartCard title="Top 10 - Manutenções Recorrentes">
                <Bar data={topDevicesChartData} options={commonOptions} />
            </ChartCard>
        </SimpleGrid>

      </div>
    </Stack>
  );
}

export default ReportsPage;