import React from 'react';
import { SimpleGrid, Paper, Text, Group, ThemeIcon, rem } from '@mantine/core';
import { IconAlertTriangle, IconCheck, IconDeviceDesktop } from '@tabler/icons-react';
import { differenceInDays, parseISO } from 'date-fns';

function DashboardStats({ devices }) {
  // Se a lista de dispositivos ainda não carregou, não mostra nada
  if (!devices) return null;

  const today = new Date();
  const total = devices.length;
  
  // Lógica para contar quantos estão em cada estado
  const atrasados = devices.filter(d => {
    if (!d.nextPreventiveDate) return false;
    const date = typeof d.nextPreventiveDate === 'string' ? parseISO(d.nextPreventiveDate) : d.nextPreventiveDate;
    return differenceInDays(date, today) < 0;
  }).length;

  const atencao = devices.filter(d => {
    if (!d.nextPreventiveDate) return false;
    const date = typeof d.nextPreventiveDate === 'string' ? parseISO(d.nextPreventiveDate) : d.nextPreventiveDate;
    const diff = differenceInDays(date, today);
    return diff >= 0 && diff <= 30;
  }).length;

  const emDia = devices.filter(d => {
    if (!d.nextPreventiveDate) return false;
    const date = typeof d.nextPreventiveDate === 'string' ? parseISO(d.nextPreventiveDate) : d.nextPreventiveDate;
    return differenceInDays(date, today) > 30;
  }).length;

  // Sub-componente para desenhar cada cartão
  const StatCard = ({ title, value, icon, color }) => (
    <Paper withBorder p="md" radius="md" shadow="xs">
      <Group justify="space-between">
        <div>
          <Text c="dimmed" tt="uppercase" fw={700} size="xs" style={{ letterSpacing: '0.5px' }}>
            {title}
          </Text>
          <Text fw={700} size={rem(24)} c={color} style={{ lineHeight: 1 }}>
            {value}
          </Text>
        </div>
        <ThemeIcon color={color} variant="light" size={48} radius="md">
          {icon}
        </ThemeIcon>
      </Group>
    </Paper>
  );

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="md" mb="lg">
      <StatCard title="Total Ativos" value={total} icon={<IconDeviceDesktop size="1.8rem" />} color="blue" />
      <StatCard title="Vencidas" value={atrasados} icon={<IconAlertTriangle size="1.8rem" />} color="red" />
      <StatCard title="Atenção (30d)" value={atencao} icon={<IconAlertTriangle size="1.8rem" />} color="orange" />
      <StatCard title="Em Dia" value={emDia} icon={<IconCheck size="1.8rem" />} color="green" />
    </SimpleGrid>
  );
}

export default DashboardStats;