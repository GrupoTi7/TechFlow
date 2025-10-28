// src/App.jsx
import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { 
  AppShell, 
  NavLink, 
  Title, 
  Group, 
  Burger, 
  ActionIcon, 
  useMantineColorScheme 
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconHome, 
  IconDeviceDesktop, // <-- O ícone que precisávamos
  IconLogout, 
  IconHistory, 
  IconSun, 
  IconMoon 
} from '@tabler/icons-react';

function App() {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

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
        {/* ... (O seu cabeçalho com o título e o botão de tema) ... */}
         <Group h="100%" px="md" justify="space-between">
            <Group>
              <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" color="white" />
              <Title order={3} c="white">
                TechFlow - Gestão de Preventivas
              </Title>
            </Group>
            <Group>
              <ActionIcon
                onClick={toggleColorScheme}
                variant="transparent"
                size="lg"
                c={colorScheme === 'dark' ? "yellow" : "white"}
                aria-label="Toggle color scheme"
              >
                {colorScheme === 'dark' ? <IconSun stroke={1.5} /> : <IconMoon stroke={1.5} />}
              </ActionIcon>
            </Group>
          </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        {/* Links Principais */}
        <NavLink
          label="Painel"
          leftSection={<IconHome size="1rem" stroke={1.5} />}
          component={Link} to="/"
          onClick={toggle}
        />

        {/* --- O LINK QUE ESTAVA EM FALTA --- */}
        <NavLink
          label="Dispositivos"
          leftSection={<IconDeviceDesktop size="1rem" stroke={1.5} />}
          component={Link} to="/devices"
          onClick={toggle}
        />
        {/* --- FIM DA CORREÇÃO --- */}
        
        <NavLink
          label="Relatórios"
          leftSection={<IconHistory size="1rem" stroke={1.5} />}
          component={Link} to="/history" // Continua a apontar para /history
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