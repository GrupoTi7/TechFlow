import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/api.js';
import { Paper, Title, PasswordInput, Button, Stack, Alert, Container, Text } from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';

function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Adicionado confirmação
  const [status, setStatus] = useState({ loading: false, error: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
        setStatus({ loading: false, error: 'As senhas não coincidem.' });
        return;
    }

    setStatus({ loading: true, error: null });
    try {
      await resetPassword(token, password);
      alert('Senha alterada com sucesso! Você será redirecionado para o login.');
      navigate('/login');
    } catch (err) {
      setStatus({ loading: false, error: err.message || 'O link é inválido ou expirou.' });
    }
  };

  return (
    <Container 
      fluid 
      h="100vh" 
      style={{ 
        backgroundColor: '#0041C2', // Azul TechFlow
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
          maxWidth: '450px', 
          backgroundColor: 'white'
        }}
      >
        <Stack align="center" mb="xl">
            <Title order={2} style={{ color: '#000', fontWeight: 800 }}>Nova Senha</Title>
            <Text c="dimmed" size="sm">Crie uma nova senha segura para a sua conta.</Text>
        </Stack>
        
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <PasswordInput
              label="Nova Senha"
              placeholder="Digite a nova senha"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              size="md"
            />
             <PasswordInput
              label="Confirmar Senha"
              placeholder="Digite novamente"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              size="md"
            />

            {status.error && (
              <Alert color="red" icon={<IconAlertCircle />} title="Erro" variant="light">
                {status.error}
              </Alert>
            )}
            
            <Button type="submit" fullWidth loading={status.loading} size="lg" color="blue">
              Salvar Nova Senha
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
export default ResetPasswordPage;