// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

import { 
  Paper, 
  Title, 
  TextInput, 
  PasswordInput, 
  Button, 
  Text, 
  Alert,
  Center,
  Container,
  useMantineTheme // Para aceder às cores do tema
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useMantineTheme(); // Hook para aceder ao tema

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!username || !password) {
      setError('Nome de usuário e senha são obrigatórios.');
      setIsLoading(false);
      return;
    }

    try {
      const data = await login(username, password);
      if (data.success && data.token) {
        localStorage.setItem('authToken', data.token);
        navigate('/'); // Redireciona para o dashboard
      }
    } catch (err) {
      setError(err.message || 'Falha na autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 1. Fundo Azul Escuro (do seu tema)
    <Container 
      size="100vw" 
      h="100vh" 
      style={{ 
        // --- A CORREÇÃO ESTÁ AQUI ---
        // Usa a cor "indigoBlue" do seu theme.js
        background: theme.colors.indigoBlue[8], 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}
    >
      <Paper 
        withBorder 
        shadow="md" 
        p="xl" 
        radius="lg" 
        style={{ 
          width: 'min(90%, 450px)', // Elementos maiores
          padding: '2.5rem' // Preenchimento interno maior
        }}
      >
        {/* 2. Título "TechFlow" */}
        <Title order={1} ta="center" mb="xl" style={{ fontSize: '2.5rem' }}> 
          TechFlow
        </Title>
        
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Usuário"
            placeholder="Seu nome de usuário"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            mb="lg"
            size="md" // Campo de texto maior
          />
          
          <PasswordInput
            label="Senha"
            placeholder="Sua senha"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            mb="xl"
            size="md" // Campo de senha maior
          />

          {error && (
            <Alert color="red" title="Erro no Login" icon={<IconAlertCircle />} mb="lg" size="md">
              {error}
            </Alert>
          )}

          <Button type="submit" fullWidth loading={isLoading} size="lg">
            Entrar
          </Button>
        </form>
      </Paper>
    </Container>
  );
}

export default LoginPage;