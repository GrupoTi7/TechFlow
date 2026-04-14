import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Title, Text, Grid, Card, ThemeIcon, Group, Stack, 
  Center, Loader, Alert, Badge, Transition 
} from '@mantine/core';
import { 
  IconDeviceDesktop, IconDeviceLaptop, IconPrinter, IconBarcode, 
  IconDeviceTv, IconDeviceMobile, IconServer, IconDevices, 
  IconAlertCircle, IconArrowRight,
  IconRouter, IconWifi, IconTerminal2
} from '@tabler/icons-react';

import { getDevices } from '../services/api';

const BRAND_BLUE = '#0003d9';

// 🟢 DICIONÁRIO INTELIGENTE DE ÍCONES E CORES
const getCategoryConfig = (type) => {
  const t = type?.toLowerCase() || '';
  if (t.includes('desktop') || t.includes('computador')) return { icon: <IconDeviceDesktop size={32} />, color: 'blue' };
  if (t.includes('notebook') || t.includes('laptop')) return { icon: <IconDeviceLaptop size={32} />, color: 'teal' };
  if (t.includes('impressora') || t.includes('printer')) return { icon: <IconPrinter size={32} />, color: 'grape' };
  if (t.includes('switch')) return { icon: <IconRouter size={32} />, color: 'indigo' };
  if (t === 'ap' || t.includes('access point') || t.includes('wifi')) return { icon: <IconWifi size={32} />, color: 'cyan' };
  if (t.includes('microterminal') || t.includes('terminal')) return { icon: <IconTerminal2 size={32} />, color: 'yellow' };
  if (t.includes('monitor')) return { icon: <IconDeviceTv size={32} />, color: 'gray' };
 if (t.includes('servidor') || t.includes('server')) return { icon: <IconServer size={32} />, color: 'red' };
  return { icon: <IconDevices size={32} />, color: 'gray' }; // Padrão genérico
};

export default function DeviceCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAndGroupDevices = async () => {
      try {
    
         const response = await getDevices();

        const devicesData = Array.isArray(response) ? response : (response.devices || response.data || []);
        
        const grouped = devicesData.reduce((acc, device) => {
          const type = device.deviceType || device.type || 'Outros';
          if (!acc[type]) {
            acc[type] = { count: 0, items: [] };
          }
          acc[type].count += 1;
          acc[type].items.push(device);
          return acc;
        }, {});

        const categoriesArray = Object.keys(grouped).map(key => ({
          name: key,
          count: grouped[key].count,
          ...getCategoryConfig(key)
        })).sort((a, b) => b.count - a.count);

        setCategories(categoriesArray);
      } catch (err) {
        console.error("Erro ao buscar dispositivos:", err);
        setError("Não foi possível carregar as categorias.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndGroupDevices();
  }, []);

  const handleCategoryClick = (categoryName) => {
    // Envia o usuário para a lista de dispositivos passando o tipo como filtro!
    navigate('/devices', { state: { initialTypeFilter: categoryName } });
  };

  if (isLoading) return <Center h="60vh"><Loader color={BRAND_BLUE} size="xl" type="bars" /></Center>;
  if (error) return <Alert color="red" icon={<IconAlertCircle/>}>{error}</Alert>;

  return (
    <Stack gap="xl" pb="xl">
      <div>
        <Title order={2} fw={900} style={{ color: '#212529', letterSpacing: '-0.5px' }}>
          Categorias de Ativos
        </Title>
        <Text c="dimmed" size="sm" mt={4}>
          Selecione uma categoria abaixo para visualizar e gerenciar os equipamentos específicos.
        </Text>
      </div>

      <Grid gutter="lg">
        {/* CARTÃO ESPECIAL: TODOS OS DISPOSITIVOS */}
        <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
          <Card 
            shadow="sm" p="xl" radius="lg" withBorder 
            onClick={() => navigate('/devices')}
            style={{ cursor: 'pointer', transition: 'all 0.2s ease', borderTop: `4px solid ${BRAND_BLUE}` }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
          >
            <Stack align="flex-start" gap="md">
              <ThemeIcon size={54} radius="xl" color={BRAND_BLUE} variant="light">
                <IconDevices size={28} />
              </ThemeIcon>
              <div>
                <Text fw={800} size="xl" c="dark.4">Todos os Ativos</Text>
                <Group gap="xs" mt={8}>
                  <Badge color={BRAND_BLUE} variant="filled" size="lg">
                    {categories.reduce((acc, cat) => acc + cat.count, 0)} Total
                  </Badge>
                </Group>
              </div>
            </Stack>
            <Group justify="flex-end" mt="md">
              <IconArrowRight size={20} color="#adb5bd" />
            </Group>
          </Card>
        </Grid.Col>

        {/* CARTÕES DINÂMICOS POR CATEGORIA */}
        {categories.map((cat, index) => (
          <Grid.Col span={{ base: 12, sm: 6, md: 4, lg: 3 }} key={index}>
            <Card 
              shadow="sm" p="xl" radius="lg" withBorder 
              onClick={() => handleCategoryClick(cat.name)}
              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = `var(--mantine-color-${cat.color}-filled)`; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = '#dee2e6'; }}
            >
              <Stack align="flex-start" gap="md">
                <ThemeIcon size={54} radius="xl" color={cat.color} variant="light">
                  {cat.icon}
                </ThemeIcon>
                <div>
                  <Text fw={800} size="xl" c="dark.4" lineClamp={1} title={cat.name} tt="capitalize">
                    {cat.name}
                  </Text>
                  <Group gap="xs" mt={8}>
                    <Badge color="gray" variant="light" size="lg">
                      {cat.count} {cat.count === 1 ? 'Máquina' : 'Máquinas'}
                    </Badge>
                  </Group>
                </div>
              </Stack>
              <Group justify="flex-end" mt="md">
                <IconArrowRight size={20} color="#adb5bd" />
              </Group>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </Stack>
  );
}