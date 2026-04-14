import React from 'react';
import { 
  AppShell, 
  Burger, 
  Group, 
  NavLink, 
  ScrollArea, 
  Text, 
  ThemeIcon, 
  rem, 
  Box,
  Button
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  IconLayoutDashboard, 
  IconDeviceDesktopAnalytics, 
  IconFileAnalytics, 
  IconSettings, 
  IconLogout 
} from '@tabler/icons-react';

// --- CONFIGURAÇÃO DA MARCA ---
const BRAND_BLUE = '#0003d9';

// Lista de itens do menu
const navItems = [
  { label: 'Painel', icon: IconLayoutDashboard, to: '/' },
  { label: 'Dispositivos', icon: IconDeviceDesktopAnalytics, to: '/devices' },
  { label: 'Relatórios', icon: IconFileAnalytics, to: '/reports' }, // Exemplo
  { label: 'Administração', icon: IconSettings, to: '/admin' },     // Exemplo
];

export default function MainLayout() {
  // Controle de estado para Mobile e Desktop
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true); // Começa aberto no desktop

  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AppShell
      header={{ height: 60 }} // Altura do cabeçalho
      navbar={{
        width: 300, // Largura do menu lateral
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
      layout="alt" // 'alt' faz o Header cobrir toda a largura, ou use padrão se preferir
    >
      {/* --- CABEÇALHO SUPERIOR (HEADER) --- */}
      <AppShell.Header style={{ borderBottom: '1px solid #dee2e6' }}>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            {/* Botão Hambúrguer para controlar o menu */}
            <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
            <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
            
            {/* Logo / Título no Header */}
            <Group gap="xs" style={{ userSelect: 'none', cursor: 'pointer' }} onClick={() => navigate('/')}>
               {/* Você pode colocar sua logo de imagem aqui se tiver */}
               <Text fw={900} size="xl" c={BRAND_BLUE} style={{ letterSpacing: '-0.5px' }}>
                 TechFlow
               </Text>
               <Text c="dimmed" size="sm" visibleFrom="xs">Gestão de Preventivas</Text>
            </Group>
          </Group>

          {/* Área direita do Header (Avatar, Notificações, etc - Opcional) */}
          <Group>
             <Text size="sm" fw={500} c="dimmed" visibleFrom="sm">
               Olá, Vinicius
             </Text>
          </Group>
        </Group>
      </AppShell.Header>

      {/* --- MENU LATERAL (NAVBAR) --- */}
      <AppShell.Navbar p="md" style={{ backgroundColor: BRAND_BLUE, borderRight: 'none' }}>
        <AppShell.Section grow component={ScrollArea} scrollbars="y">
          <Box mt="md">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
              
              return (
                <NavLink
                  key={item.label}
                  label={
                    <Text size="md" fw={500} c="white">
                      {item.label}
                    </Text>
                  }
                  leftSection={
                    <ThemeIcon variant="transparent" c="white">
                      <item.icon style={{ width: rem(22), height: rem(22) }} stroke={1.5} />
                    </ThemeIcon>
                  }
                  onClick={() => {
                    navigate(item.to);
                    if (window.innerWidth < 768) toggleMobile(); // Fecha no mobile ao clicar
                  }}
                  active={isActive}
                  variant="filled"
                  color="blue" 
                  // Estilização customizada para o item ativo ficar mais claro/destacado
                  styles={{
                    root: {
                      borderRadius: '8px',
                      marginBottom: '4px',
                      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      },
                    },
                  }}
                />
              );
            })}
          </Box>
        </AppShell.Section>

        {/* Rodapé do Menu (Botão Sair) */}
        <AppShell.Section style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '10px' }}>
          <NavLink
            label={<Text c="white" fw={500}>Sair</Text>}
            leftSection={<IconLogout size="1.2rem" color="white" />}
            onClick={() => {
              // Lógica de Logout
              localStorage.removeItem('user');
              localStorage.removeItem('authToken');
              window.location.href = '/login';
            }}
            styles={{
              root: {
                borderRadius: '8px',
                '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.2)' },
              }
            }}
          />
        </AppShell.Section>
      </AppShell.Navbar>

      {/* --- ÁREA PRINCIPAL DE CONTEÚDO --- */}
      <AppShell.Main style={{ backgroundColor: '#f8f9fa' }}>
        {/* O Outlet renderiza a página atual (Home, Devices, etc) */}
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}