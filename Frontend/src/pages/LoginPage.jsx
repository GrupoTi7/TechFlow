// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api.js'; // (Usando a sua função de login correta)

// 1. Importações do Mantine (Limpas)
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
  useMantineTheme
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

function LoginPage() {
  // (Usando os seus useState originais, que funcionam)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useMantineTheme(); 

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
        navigate('/'); 
        window.location.reload(); // Força a atualização do contexto de autenticação
      } else {
        setError(data.message || 'Falha na autenticação.');
      }
    } catch (err) {
      setError(err.message || 'Falha na autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container 
      size="100vw" 
      h="100vh" 
      style={{ 
        background: theme.colors.techFlowBlue[7], 
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
          width: 'min(90%, 450px)', 
          padding: '2.5rem'
        }}
      >
        
        {/* --- TÍTULO REVERTIDO AO ORIGINAL --- */}
        <Title order={1} ta="center" mb="xl" style={{ fontSize: '2.5rem' }}> 
          TechFlow
        </Title>
        {/* ---------------------------------- */}
        
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Usuário"
            placeholder="Seu nome de usuário"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
// (Removido o '_' que estava a causar erros)
            mb="lg"
            size="md" 
          />
          
          <PasswordInput
            label="Senha"
            placeholder="Sua senha"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            mb="xl"
            size="md"
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