// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

// Importe os componentes visuais do Mantine
import { 
  Paper, 
  Title, 
  TextInput, 
  PasswordInput, 
  Button, 
  Text, 
  Alert,
  Center,
  Container
} from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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

  // Layout que centra o cartão de login na página
  return (
    <Container size="100vw" h="100vh">
      <Center h="100%">
        <Paper withBorder shadow="md" p="xl" radius="md" style={{ width: 400 }}>
          <Title order={2} ta="center" mb="lg">
            TechFlow Login
          </Title>

          <form onSubmit={handleSubmit}>
            <TextInput
              label="Usuário"
              placeholder="Seu nome de usuário"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              mb="md" // margem inferior
            />

            <PasswordInput
              label="Senha"
              placeholder="Sua senha"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              mb="lg" // margem inferior grande
            />

            {error && (
              <Alert 
                color="red" 
                title="Erro no Login" 
                icon={<IconAlertCircle />} 
                mb="md"
              >
                {error}
              </Alert>
            )}

            <Button type="submit" fullWidth loading={isLoading}>
              Entrar
            </Button>
          </form>
        </Paper>
      </Center>
    </Container>
  );
}

export default LoginPage;