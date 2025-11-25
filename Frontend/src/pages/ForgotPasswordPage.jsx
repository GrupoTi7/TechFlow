import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../services/api';
import { Paper, Title, TextInput, Button, Text, Stack, Alert, Center, Anchor } from '@mantine/core';
import { IconMail, IconArrowLeft } from '@tabler/icons-react';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ loading: false, error: null, success: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: null });
    try {
      await requestPasswordReset(email);
      setStatus({ loading: false, error: null, success: 'Se o e-mail existir, o link foi enviado!' });
    } catch (err) {
      setStatus({ loading: false, error: 'Erro ao enviar solicitação.', success: null });
    }
  };

  return (
    <Center h="100vh" bg="#0000CD">
      <Paper radius="md" p="xl" w="100%" maw={400} bg="white">
        <Stack align="center" mb="lg">
          <Title order={2} ta="center">Recuperar Senha</Title>
          <Text c="dimmed" size="sm" ta="center">Digite seu e-mail para receber o link</Text>
        </Stack>

        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="E-mail"
              placeholder="seu@email.com"
              leftSection={<IconMail size={16} />}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {status.error && <Alert color="red">{status.error}</Alert>}
            {status.success && <Alert color="green">{status.success}</Alert>}
            
            <Button type="submit" fullWidth loading={status.loading} color="blue">Enviar Link</Button>
            
            <Center>
              <Anchor component={Link} to="/login" size="sm" c="dimmed">
                <Group gap={5}><IconArrowLeft size={12}/> Voltar ao Login</Group>
              </Anchor>
            </Center>
          </Stack>
        </form>
      </Paper>
    </Center>
  );
}
export default ForgotPasswordPage;