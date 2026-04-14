import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api.js';

import { 
  Paper, 
  Title,
  TextInput, 
  PasswordInput, 
  Button, 
  Alert,
  Container,
  Anchor, 
  Stack 
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
        // 1. Salva o Token
        localStorage.setItem('authToken', data.token);

        // 2. CORREÇÃO: Salva o objeto User também!
        // Sem isso, o widget de Plano de Ação não sabe quem é você.
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        // 3. Redireciona e recarrega
        navigate('/'); 
        window.location.reload(); 
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
      fluid 
      h="100vh" 
      style={{ 
        backgroundColor: '#0003d9', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        margin: 0,
        padding: 0
      }}
    >
      <Paper 
        withBorder 
        shadow="xl" 
        p="2.5rem" 
        radius="md" 
        style={{ 
          width: '100%', 
          maxWidth: '400px', 
          backgroundColor: 'white'
        }}
      >
        <Title order={1} ta="center" mb="xl" style={{ color: '#000', fontWeight: 800 }}> 
          TechFlow
        </Title>
        
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Usuário"
              placeholder="Seu nome de usuário"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              size="md" 
            />
            
            <div>
              <PasswordInput
                label="Senha"
                placeholder="Sua senha"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                size="md"
              />
              <Anchor 
                component={Link} 
                to="/forgot-password" 
                size="sm" 
                c="dimmed" 
                mt={5} 
                style={{ display: 'block', textAlign: 'right' }}
              >
                Esqueceu a senha?
              </Anchor>
            </div>

            {error && (
              <Alert color="red" title="Erro" icon={<IconAlertCircle />} variant="light">
                {error}
              </Alert>
            )}

            <Button 
              type="submit" 
              fullWidth 
              loading={isLoading} 
              size="lg" 
              style={{ backgroundColor: '#0003d9' }} 
            >
              Entrar
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

export default LoginPage;