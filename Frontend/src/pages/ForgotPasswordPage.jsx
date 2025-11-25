import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../services/api.js';
import { 
  Paper, Title, TextInput, Button, Text, Stack, Alert, Center, Anchor, Group, Container // <-- Group ADICIONADO AQUI
} from '@mantine/core';
import { IconMail, IconArrowLeft, IconAlertCircle, IconCheck } from '@tabler/icons-react';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ loading: false, error: null, success: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: null });
    try {
      await requestPasswordReset(email);
      setStatus({ loading: false, error: null, success: 'Se o e-mail estiver cadastrado, você receberá um link em instantes.' });
    } catch (err) {
      setStatus({ loading: false, error: 'Erro ao processar a solicitação.', success: null });
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
          <Title order={2} style={{ color: '#000', fontWeight: 800 }}>Recuperar Senha</Title>
          <Text c="dimmed" size="sm" ta="center">
            Digite o seu e-mail corporativo para receber o link de redefinição.
          </Text>
        </Stack>

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="E-mail"
              placeholder="seu.nome@ptractor.com.br"
              leftSection={<IconMail size={16} />}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              size="md"
            />
            
            {status.error && (
              <Alert color="red" icon={<IconAlertCircle />} title="Erro" variant="light">
                {status.error}
              </Alert>
            )}
            
            {status.success && (
              <Alert color="green" icon={<IconCheck />} title="E-mail Enviado" variant="light">
                {status.success}
              </Alert>
            )}
            
            <Button type="submit" fullWidth loading={status.loading} size="lg" color="blue">
              Enviar Link de Recuperação
            </Button>
            
            <Center mt="md">
              <Anchor component={Link} to="/login" size="sm" c="dimmed" style={{ textDecoration: 'none' }}>
                <Group gap={5}>
                   <IconArrowLeft size={14}/> 
                   <span>Voltar ao Login</span>
                </Group>
              </Anchor>
            </Center>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
export default ForgotPasswordPage;