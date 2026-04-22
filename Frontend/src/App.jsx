import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { 
  AppShell, 
  NavLink, 
  Title, 
  Group, 
  Burger,
  ScrollArea,
  rem,
  Text
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconHome, 
  IconDeviceDesktop, 
  IconLogout, 
  IconHistory,
  IconBriefcase // Ícone para Serviços
} from '@tabler/icons-react';

// Cor da marca
const BRAND_BLUE = '#0003d9';

function App() {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure(false);
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth(); 
  
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload(); 
  };

  const getNavLinkStyles = (isActive) => ({
    root: {
      borderRadius: '8px',
      marginBottom: '5px',
      backgroundColor: isActive ? 'white' : 'transparent',
      color: isActive ? BRAND_BLUE : 'white',
      fontWeight: 500,
      '&:hover': {
        backgroundColor: isActive ? 'white' : 'rgba(255, 255, 255, 0.1)', 
      },
    },
    label: {
      fontSize: '0.95rem',
    },
    section: {
      color: isActive ? BRAND_BLUE : 'white', 
    }
  });

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 280,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding="md"
      layout="alt" 
    >
      <AppShell.Header style={{ backgroundColor: BRAND_BLUE, borderBottom: 'none' }}>
        <Group h="100%" px="md">
          <Burger 
            opened={mobileOpened} 
            onClick={toggleMobile} 
            hiddenFrom="sm" 
            size="sm" 
            color="white" 
          />
          <Burger 
            opened={desktopOpened} 
            onClick={toggleDesktop} 
            visibleFrom="sm" 
            size="sm" 
            color="white" 
            mr="sm"
          />
          <Title order={3} c="white" style={{ letterSpacing: '0.5px' }}> 
            TechFlow
          </Title>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" style={{ backgroundColor: BRAND_BLUE, borderRight: 'none' }}>
        <AppShell.Section grow component={ScrollArea}>
            <div style={{ paddingTop: '80px' }}>
                <NavLink
                  label="Painel"
                  leftSection={<IconHome size="1.2rem" stroke={1.5} />}
                  component={Link} to="/"
                  active={location.pathname === '/'}
                  styles={getNavLinkStyles(location.pathname === '/')}
                  onClick={() => { if(window.innerWidth < 768) toggleMobile() }}
                />
                <NavLink
                  label="Dispositivos"
                  leftSection={<IconDeviceDesktop size="1.2rem" stroke={1.5} />}
                  component={Link} 
                  to="/devices/categories"
                  active={location.pathname.startsWith('/devices')}
                  styles={getNavLinkStyles(location.pathname.startsWith('/devices'))}
                  onClick={() => { if(window.innerWidth < 768) toggleMobile() }}
                />
                <NavLink
                  label="Relatórios"
                  leftSection={<IconHistory size="1.2rem" stroke={1.5} />}
                  component={Link} to="/history"
                  active={location.pathname.startsWith('/history')}
                  styles={getNavLinkStyles(location.pathname.startsWith('/history'))}
                  onClick={() => { if(window.innerWidth < 768) toggleMobile() }}
                />

                {/* 🟢 O CADEADO FOI REMOVIDO! Esta aba agora é livre para todos. */}
                <Text c="white" size="xs" fw={700} tt="uppercase" mt="xl" mb="xs" style={{ opacity: 0.7, paddingLeft: 12 }}>
                    Configurações
                </Text>
                
                <NavLink
                  label="Serviços & Parâmetros"
                  leftSection={<IconBriefcase size="1.2rem" stroke={1.5} />}
                  component={Link} to="/services"
                  active={location.pathname.startsWith('/services')}
                  styles={getNavLinkStyles(location.pathname.startsWith('/services'))}
                  onClick={() => { if(window.innerWidth < 768) toggleMobile() }}
                />
            </div>
        </AppShell.Section>
        
        <AppShell.Section style={{ borderTop: `1px solid rgba(255,255,255,0.2)`, paddingTop: '10px' }}>
          <NavLink
            label="Sair"
            leftSection={<IconLogout size="1.2rem" stroke={1.5} />}
            onClick={handleLogout}
            styles={{
                root: {
                    color: '#ffc9c9', 
                    borderRadius: '8px',
                    '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.1)' }
                },
                section: { color: '#ffc9c9' }
            }}
          />
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main style={{ backgroundColor: '#f1f3f5' }}>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

export default App;