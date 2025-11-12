// src/App.jsx
import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { 
  AppShell, 
  NavLink, 
  Title, 
  Group, 
  Burger
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconHome, 
  IconDeviceDesktop, 
  IconLogout, 
  IconHistory,
  IconSettings // <-- Ícone de Admin importado
} from '@tabler/icons-react';

function App() {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const { user } = useAuth(); // <-- Obtém o usuário do "cérebro" (AuthContext)

  // --- Lógica de Permissão ---
  // (Defina aqui quais usuários são administradores)
  const isAdmin = user && (user.username === 'sync' || user.username === 'vinicius.izidoro');
  
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
    window.location.reload(); // Força a limpeza do 'user' no AuthContext
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

        {/* --- O LINK DE ADMIN SEGURO --- */}
        {/* (Este bloco só aparece se 'isAdmin' for verdadeiro) */}
        {isAdmin && (
          <NavLink
            label="Admin (Setores)"
            leftSection={<IconSettings size="1rem" stroke={1.5} />}
            component={Link} to="/admin/setores"
            onClick={toggle}
            mt="xl" // Adiciona espaço acima
          />
        )}
        {/* ----------------------------- */}
        
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