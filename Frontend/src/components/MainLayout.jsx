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
  Box
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  IconLayoutDashboard, 
  IconDeviceDesktopAnalytics, 
  IconFileAnalytics, 
  IconSettings, 
  IconLogout,
  IconActivity // Ícone da Diretoria
} from '@tabler/icons-react';

const BRAND_BLUE = '#0003d9';

export default function MainLayout() {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true); 

  const navigate = useNavigate();
  const location = useLocation();

  // 🟢 1. IDENTIFICAÇÃO (Para saber quem logou)
  const storedUser = localStorage.getItem('user');
  const userObj = storedUser ? JSON.parse(storedUser) : null;

  const isGestorUser = 
    userObj?.role === 'ADMIN' || 
    userObj?.username === 'vinicius.izidoro' || 
    userObj?.name?.toLowerCase().includes('juliano') || 
    userObj?.username?.toLowerCase().includes('juliano') ||
    userObj?.name?.toLowerCase().includes('eduardo') ||
    userObj?.username?.toLowerCase().includes('eduardo');

  // 🟢 2. MENU FIXO (Visível para todo mundo, sem esconder nada!)
  const navItems = [
    { label: 'Painel', icon: IconLayoutDashboard, to: '/' },
    { label: 'Dispositivos', icon: IconDeviceDesktopAnalytics, to: '/devices' },
    { label: 'Relatórios', icon: IconFileAnalytics, to: '/reports' },
    { label: 'Administração', icon: IconSettings, to: '/admin' } // <-- Voltou para cá!
  ];

  // 🟢 3. MENU DINÂMICO (Adiciona a Torre de Controle SÓ para a chefia)
  if (isGestorUser) {
      navItems.push({ label: 'Monitor de Campanhas', icon: IconActivity, to: '/campaign-monitor' });
  }

  return (
    <AppShell
      header={{ height: 60 }} 
      navbar={{
        width: 300, 
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
      layout="alt" 
    >
      <AppShell.Header style={{ borderBottom: '1px solid #dee2e6' }}>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
            <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
            
            <Group gap="xs" style={{ userSelect: 'none', cursor: 'pointer' }} onClick={() => navigate('/')}>
               <Text fw={900} size="xl" c={BRAND_BLUE} style={{ letterSpacing: '-0.5px' }}>
                 TechFlow
               </Text>
               <Text c="dimmed" size="sm" visibleFrom="xs">Gestão de Preventivas</Text>
            </Group>
          </Group>

          <Group>
             <Text size="sm" fw={500} c="dimmed" visibleFrom="sm">
                Olá, {userObj?.name?.split(' ')[0] || 'Usuário'}
             </Text>
          </Group>
        </Group>
      </AppShell.Header>

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
                    if (window.innerWidth < 768) toggleMobile();
                  }}
                  active={isActive}
                  variant="filled"
                  color="blue" 
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

        <AppShell.Section style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '10px' }}>
          <NavLink
            label={<Text c="white" fw={500}>Sair</Text>}
            leftSection={<IconLogout size="1.2rem" color="white" />}
            onClick={() => {
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

      <AppShell.Main style={{ backgroundColor: '#f8f9fa' }}>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}