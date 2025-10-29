// src/App.jsx
import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { 
  AppShell, 
  NavLink, 
  Title, 
  Group, 
  Burger
  // Removemos ActionIcon e useMantineColorScheme
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconHome, 
  IconDeviceDesktop, 
  IconLogout, 
  IconHistory 
  // Removemos IconSun e IconMoon
} from '@tabler/icons-react';

function App() {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  
  // Removemos a lógica do colorScheme
  // const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="white" />
            
            <Title order={3} c="white"> 
              TechFlow - Gestão de Preventivas
            </Title>
          </Group>
          
          {/* O Grupo que continha o ActionIcon foi removido */}

        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          label="Painel"
          leftSection={<IconHome size="1rem" stroke={1.5} />}
          component={Link} to="/"
          onClick={toggle}
        />
        <NavLink
          label="Dispositivos"
          leftSection={<IconDeviceDesktop size="1rem" stroke={1.5} />}
          component={Link} to="/devices"
          onClick={toggle}
        />
        <NavLink
          label="Relatórios"
          leftSection={<IconHistory size="1rem" stroke={1.5} />}
          component={Link} to="/history"
          onClick={toggle}
        />
        
        <span style={{ flexGrow: 1 }}></span> 
        
        <NavLink
          label="Sair"
          leftSection={<IconLogout size="1rem" stroke={1.5} />}
          onClick={handleLogout}
          color="red"
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

export default App;