 import React, { useState, useEffect, useMemo, useRef } from 'react'; 

import { 

    getTechnicianReport, 

    getTopDevicesReport, 

    getHistoryReport, 

    getDevices // 🟢 IMPORTAMOS A LISTA REAL DE DISPOSITIVOS

} from '../services/api.js';

import jsPDF from 'jspdf';

import html2canvas from 'html2canvas';

import { Card, Text, Title, ThemeIcon, Group, Stack, SimpleGrid, Loader, Alert, Paper, RingProgress, Center, Button } from '@mantine/core'; 

import { Bar, Doughnut, Line } from 'react-chartjs-2';

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Filler, Title as ChartTitle, Tooltip, Legend } from 'chart.js';

import { IconChartBar, IconTool, IconBuildingFactory, IconActivity, IconAlertTriangle, IconCheck, IconDownload, IconTrendingUp, IconPrinter, IconDatabaseOff } from '@tabler/icons-react';


ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Filler, ChartTitle, Tooltip, Legend);


function ReportsPage() {

  const [techReportData, setTechReportData] = useState([]);

  const [topDevicesData, setTopDevicesData] = useState([]);

  const [historyData, setHistoryData] = useState([]);

  

  // 🟢 A FONTE DA VERDADE

  const [rawDevices, setRawDevices] = useState([]); 

  

  const dashboardRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState(null);


  useEffect(() => {

    const fetchReports = async () => {

      try {

        // Ignoramos o Status e Setor do Backend, vamos calcular tudo pela lista real!

        const [techRes, topDevRes, historyRes, devicesRes] = await Promise.all([

          getTechnicianReport(), 

          getTopDevicesReport(), 

          getHistoryReport(),

          getDevices()

        ]);

        

        if (techRes.success) setTechReportData(techRes.data);

        if (topDevRes.success) setTopDevicesData(topDevRes.data);

        if (historyRes.success) setHistoryData(historyRes.data);


        const allDevs = devicesRes.devices || devicesRes || [];

        setRawDevices(allDevs);


      } catch (err) {

        setError(err.message || 'Erro ao carregar dados.');

      } finally {

        setIsLoading(false);

      }

    };

    fetchReports();

  }, []); 


  const handleDownloadPDF = async () => {

    if (!dashboardRef.current) return;

    const canvas = await html2canvas(dashboardRef.current, { scale: 2, useCORS: true, windowWidth: dashboardRef.current.scrollWidth });

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();

    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    pdf.save(`Relatorio_TechFlow_${new Date().toISOString().slice(0,10)}.pdf`);

  };


  // 🟢 CÁLCULO BLINDADO DOS GRÁFICOS E KPIS

  const { statusData, sectorData, kpis } = useMemo(() => {

    let emDia = 0, atencao = 0, vencidos = 0, semAgendamento = 0;

    const sectorCounts = {};

    let semSetorCount = 0;


    const now = new Date(); now.setHours(0,0,0,0);

    const limit = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);


    // Varre todos os 552 dispositivos um a um

    rawDevices.forEach(d => {

        // 1. Distribuição de Status (A mesma regra da Home)

        if (!d.nextPreventiveDate) {

            semAgendamento++;

        } else {

            const nextDate = new Date(d.nextPreventiveDate);

            nextDate.setHours(0,0,0,0);

            if (nextDate < now) vencidos++;

            else if (nextDate <= limit) atencao++;

            else emDia++;

        }


        // 2. Distribuição por Setores

        const s = d.setor || d.sector;

        if (s && s.trim() !== '') {

            sectorCounts[s] = (sectorCounts[s] || 0) + 1;

        } else {

            semSetorCount++;

        }

    });


    // Formata para o Gráfico de Status

    const sData = [

        { name: 'Em Dia', value: emDia, color: '#05a828' },

        { name: 'Atenção (30 dias)', value: atencao, color: '#f76707' },

        { name: 'Vencidos', value: vencidos, color: '#d90429' },

        { name: 'Sem Agend.', value: semAgendamento, color: '#495057' }

    ].filter(x => x.value > 0);


    // Formata para o Gráfico de Setor

    const secData = Object.keys(sectorCounts).map(k => ({ name: k, value: sectorCounts[k] }));

    if (semSetorCount > 0) secData.push({ name: 'Sem Setor', value: semSetorCount });

    secData.sort((a,b) => b.value - a.value);


    // Gera os KPIs Exatos

    const totalDevices = rawDevices.length; // O número absoluto 552

    const totalMaintenances = techReportData.reduce((acc, curr) => acc + curr.value, 0);

    const complianceRate = totalDevices > 0 ? Math.round((emDia / totalDevices) * 100) : 0;

    const topSector = secData.length > 0 ? secData[0] : { name: '-', value: 0 };


    return {

        statusData: sData,

        sectorData: secData,

        kpis: { totalDevices, totalMaintenances, complianceRate, topSector }

    };

  }, [rawDevices, techReportData]);


  if (isLoading) return <Center h={300}><Loader size="lg" color="#0003d9" /></Center>;

  if (error) return <Alert icon={<IconAlertTriangle/>} title="Erro" color="red">{error}</Alert>;


  const commonOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };


  const historyChartData = {

    labels: historyData.map(d => d.name),

    datasets: [{ label: 'Manutenções', data: historyData.map(d => d.value), borderColor: '#228be6', backgroundColor: 'rgba(34, 139, 230, 0.2)', tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#fff', pointBorderColor: '#228be6' }]

  };


  const techChartData = {

    labels: techReportData.map(d => d.name),

    datasets: [{ label: 'Preventivas', data: techReportData.map(d => d.value), backgroundColor: '#228be6', borderRadius: 4 }]

  };

  

  const topDevicesChartData = {

    labels: topDevicesData.map(d => d.name),

    datasets: [{ label: 'Manutenções', data: topDevicesData.map(d => d.value), backgroundColor: '#868e96', borderRadius: 4 }]

  };


  const sectorChartData = {

    labels: sectorData.map(d => d.name),

    datasets: [{ label: 'Qtd.', data: sectorData.map(d => d.value), backgroundColor: '#fab005', borderRadius: 4 }]

  };


  const statusChartData = {

    labels: statusData.map(d => d.name),

    datasets: [{ data: statusData.map(d => d.value), backgroundColor: statusData.map(d => d.color), borderWidth: 0, hoverOffset: 4 }]

  };


  const KpiCard = ({ title, value, icon: Icon, color, subtext }) => (

    <Paper withBorder p="md" radius="md" shadow="xs">

        <Group justify="space-between">

            <div>

                <Text c="dimmed" tt="uppercase" fw={700} size="xs">{title}</Text>

                <Text fw={700} size="xl">{value}</Text>

                {subtext && <Text c="dimmed" size="xs" mt="sm">{subtext}</Text>}

            </div>

            <ThemeIcon color={color} variant="light" size="xl" radius="md"><Icon size={28} stroke={1.5} /></ThemeIcon>

        </Group>

    </Paper>

  );


  const ChartCard = ({ title, children, hasData }) => (

    <Card withBorder radius="md" p="lg" shadow="sm">

        <Text size="lg" fw={700} mb="md">{title}</Text>

        <div style={{ height: '250px', position: 'relative' }}>

            {hasData ? children : (

                <Center h="100%"><Stack align="center" gap="xs"><IconDatabaseOff size={32} color="#dee2e6" /><Text c="dimmed" size="sm">Sem dados suficientes</Text></Stack></Center>

            )}

        </div>

    </Card>

  );


  const printStyles = `

    @media print {

      body * { visibility: hidden; }

      #print-area, #print-area * { visibility: visible; }

      #print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; background: white !important; }

      .no-print { display: none !important; }

      .mantine-Paper-root { break-inside: avoid; }

    }

  `;


  return (

    <Stack gap="lg" pb="xl">

      <style>{printStyles}</style>

      <Group justify="space-between" align="center" className="no-print">

        <div>

            <Title order={2}>Dashboard de Operações</Title>

            <Text c="dimmed">Visão consolidada e histórico de manutenção</Text>

        </div>

        <Group>

            <Button leftSection={<IconPrinter size={18}/>} variant="default" onClick={() => window.print()}>Imprimir</Button>

            <Button leftSection={<IconDownload size={18}/>} color="red" variant="filled" onClick={handleDownloadPDF}>Baixar PDF</Button>

        </Group>

      </Group>


      <div id="print-area" ref={dashboardRef} style={{ padding: '10px', backgroundColor: '#fff', borderRadius: '8px' }}> 

        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="lg">

            <KpiCard title="Total de Ativos" value={kpis.totalDevices} icon={IconBuildingFactory} color="blue" subtext="Dispositivos cadastrados" />

            <Paper withBorder p="md" radius="md" shadow="xs">

                <Group>

                    <RingProgress size={80} roundCaps thickness={8} sections={[{ value: kpis.complianceRate, color: kpis.complianceRate > 70 ? 'teal' : 'red' }]} label={<Center><IconCheck size={20} /></Center>} />

                    <div><Text c="dimmed" tt="uppercase" fw={700} size="xs">Conformidade</Text><Text fw={700} size="xl">{kpis.complianceRate}%</Text><Text c="dimmed" size="xs">Equipamentos em dia</Text></div>

                </Group>

            </Paper>

            <KpiCard title="Produtividade Total" value={kpis.totalMaintenances} icon={IconTool} color="orange" subtext="Preventivas realizadas" />

            <KpiCard title="Maior Setor" value={kpis.topSector.name} icon={IconActivity} color="grape" subtext={`${kpis.topSector.value} dispositivos`} />

        </SimpleGrid>


        <Card withBorder radius="md" p="lg" shadow="sm" mb="lg">

            <Group mb="md">

                <ThemeIcon variant="light" size="lg" radius="md" color="blue"><IconTrendingUp size={24} /></ThemeIcon>

                <Text size="lg" fw={700}>Evolução Mensal (Últimos 6 Meses)</Text>

            </Group>

            <div style={{ height: '300px' }}>

                {historyData.length > 0 ? <Line data={historyChartData} options={commonOptions} /> : <Center h="100%"><Text c="dimmed">Aguardando dados de manutenção...</Text></Center>}

            </div>

        </Card>


        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">

            <ChartCard title="Status dos dispositivos" hasData={statusData.length > 0}>

                <Doughnut data={statusChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }} />

            </ChartCard>

            <ChartCard title="Equipamentos por Setor" hasData={sectorData.length > 0}>

                <Bar data={sectorChartData} options={commonOptions} />

            </ChartCard>

            <ChartCard title="Performance Técnica" hasData={techReportData.length > 0}>

                <Bar data={techChartData} options={commonOptions} />

            </ChartCard>

            <ChartCard title="Top 10 - Manutenções Recorrentes" hasData={topDevicesData.length > 0}>

                <Bar data={topDevicesChartData} options={commonOptions} />

            </ChartCard>

        </SimpleGrid>

      </div>

    </Stack>

  );

}


export default ReportsPage; 