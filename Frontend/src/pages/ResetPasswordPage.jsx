import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/api';
import { Paper, Title, PasswordInput, Button, Stack, Alert, Center } from '@mantine/core';

function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ loading: false, error: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null });
    try {
      await resetPassword(token, password);
      alert('Senha alterada com sucesso!');
      navigate('/login');
    } catch (err) {
      setStatus({ loading: false, error: err.message || 'Erro ao alterar senha.' });
    }
  };

  return (
    <Center h="100vh" bg="#0000CD">
      <Paper radius="md" p="xl" w="100%" maw={400} bg="white">
        <Title order={2} ta="center" mb="lg">Nova Senha</Title>
        <form onSubmit={handleSubmit}>
          <Stack>
            <PasswordInput
              label="Nova Senha"
              placeholder="Digite a nova senha"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {status.error && <Alert color="red">{status.error}</Alert>}
            <Button type="submit" fullWidth loading={status.loading} color="blue">Salvar Nova Senha</Button>
          </Stack>
        </form>
      </Paper>
    </Center>
  );
}
export default ResetPasswordPage;