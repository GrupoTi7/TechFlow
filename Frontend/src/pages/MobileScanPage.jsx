import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Card, Text, Button, Textarea, Stack, 
  ThemeIcon, Center, Loader, Alert, Badge 
} from '@mantine/core';
import { 
  IconDeviceDesktop, IconCheck, IconAlertCircle, IconRocket, IconServerCog 
} from '@tabler/icons-react';

import { 
  getDeviceById, 
  createPreventive, 
  startAgideskTicket, 
  playAgideskTicket, 
  finishAgideskTicket,
  updateDeviceTicketInDb,
  getDeviceTicketFromDb
} from '../services/api';

const BRAND_BLUE = '#0003d9';

// 🟢 O CADEADO: Bloqueia duplo clique fantasma de extensões/iframes
let isExecutionLocked = false;

export default function MobileScanPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loadingText, setLoadingText] = useState(''); 
  const [success, setSuccess] = useState(false);
  
  // 🟢 ESTADO PARA AVISO NA TELA
  const [existingTicketId, setExistingTicketId] = useState(null);
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchDevice = async () => {
      try {
        const res = await getDeviceById(id);
        if (res.success) {
          setDevice(res.device);
        } else {
          setError("Dispositivo não encontrado.");
        }

        // 🟢 A CORREÇÃO: O Túnel agora roda quando a página abre!
        const ticketId = await getDeviceTicketFromDb(id);
        if (ticketId) {
            setExistingTicketId(ticketId);
        }

      } catch (err) {
        setError("Erro ao buscar dados do dispositivo.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDevice();
  }, [id]);

  const handleFastExecution = async () => {
    if (!notes.trim()) {
      return alert("Por favor, digite o que foi realizado na manutenção.");
    }

    if (isExecutionLocked) return; 
    
    isExecutionLocked = true; 
    setIsSaving(true);
    setError(null);

    try {
      setLoadingText('Verificando status do laboratório...');
      
      // 🟢 O TÚNEL: Busca o status FRESQUINHO do banco direto na hora do clique!
      const freshTicketId = await getDeviceTicketFromDb(id);
      let ticketIdToFinish = freshTicketId;

      setLoadingText('Registrando no TechFlow...');
      await createPreventive(id, { date: new Date().toISOString(), notes });

      // SE A GAVETA ESTIVER VAZIA (O celular faz tudo sozinho)
      if (!ticketIdToFinish) {
          setLoadingText('Criando ticket no Agidesk...');
          const ticketRes = await startAgideskTicket({
            deviceName: device.name,
            deviceType: device.deviceType || 'Desktop',
            techIdentifier: currentUser.email || currentUser.username,
            deviceSector: device.sector?.name || device.setor || 'Não informado'
          });

          if (ticketRes && ticketRes.ticketId) {
            ticketIdToFinish = ticketRes.ticketId;
            
            setLoadingText('Iniciando atendimento...');
            try { await playAgideskTicket(ticketIdToFinish); } catch(e) { console.warn(e); }
            
            setLoadingText('Sincronizando dados...');
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
      } 
      // SE O DESKTOP JÁ TINHA COLOCADO O TICKET NA GAVETA
      else {
          setLoadingText(`Ticket ${ticketIdToFinish} localizado...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); 
      }

      // PROCESSAMENTO FINAL
      if (ticketIdToFinish) {
          setLoadingText('Encerrando chamado...');
          const relatorioHtml = `Manutenção preventiva concluída via Mobile.<br><br><b>Notas do Serviço:</b><br>${notes}`;
          
          try {
              // Tenta encerrar
              await finishAgideskTicket(ticketIdToFinish, relatorioHtml);
              
              // Deu certo? Limpa a gaveta no banco!
              await updateDeviceTicketInDb(id, null);
              
          } catch (agideskError) {
              // ❌ DEU ERRO NO AGIDESK?
              // Limpa a gaveta mesmo assim para não travar a máquina...
              await updateDeviceTicketInDb(id, null);
              
              // ... E JOGA O ERRO NA TELA PARA FICAR VERMELHO!
              throw agideskError; 
          }
      }

      setSuccess(true);
    } catch (err) {
      setError("Erro ao processar: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSaving(false);
      setLoadingText('');
      isExecutionLocked = false; 
    }
  };

  if (loading) return <Center h="100vh" bg={BRAND_BLUE}><Loader color="white" size="xl" /></Center>;

  if (success) {
    return (
      <Container size="xs" px="md" py="xl" style={{ backgroundColor: BRAND_BLUE, minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Card shadow="xl" p="xl" radius="lg" w="100%">
          <Stack align="center" gap="md">
            <ThemeIcon color="teal" size={80} radius="100%" variant="light"><IconCheck size={40} /></ThemeIcon>
            <Text fw={900} size="xl" ta="center">Tudo Pronto!</Text>
            <Text c="dimmed" ta="center">Preventiva registrada e chamado encerrado com sucesso no Agidesk.</Text>
            <Button mt="xl" fullWidth color={BRAND_BLUE} onClick={() => navigate('/devices')}>Ir para Ativos</Button>
          </Stack>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="xs" px="md" py="xl" style={{ backgroundColor: BRAND_BLUE, minHeight: '100vh' }}>
      
      <Stack align="center" mb="xl" mt="xl">
        <ThemeIcon size={70} radius="100%" color="white" variant="filled" style={{ color: BRAND_BLUE }}>
          <IconDeviceDesktop size={40} />
        </ThemeIcon>
        <Text fw={900} size="2.5rem" lh={1} ta="center" c="white">{device?.name}</Text>
        <Badge size="lg" color="white" variant="light" style={{ color: 'white', borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }}>
          {device?.sector?.name || device?.setor || 'Sem Setor'}
        </Badge>
      </Stack>

      {error && <Alert color="red" icon={<IconAlertCircle />} mb="md">{error}</Alert>}

      <Card shadow="xl" p="xl" radius="lg" withBorder>
        <Stack gap="md">
          <Text fw={800} size="xl" c="dark.4" ta="center">Registro Rápido</Text>
          
          {/* 🟢 AVISO VISUAL: O celular mostra se está integrado com o Desktop */}
          {existingTicketId ? (
              <Alert variant="light" color="teal" icon={<IconServerCog />} p="xs">
                 <Text size="xs" fw={600}>Ticket em andamento detectado! O encerramento será feito nele.</Text>
              </Alert>
          ) : (
              <Text size="sm" c="dimmed" ta="center">
                O sistema cuidará do TechFlow e do Agidesk automaticamente para você.
              </Text>
          )}

          <Textarea 
            label="O que foi feito?" 
            placeholder="Ex: Limpeza interna, formatação, troca de pasta térmica..." 
            minRows={4}
            size="md"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            required
            styles={{ input: { fontSize: '16px', backgroundColor: '#f8f9fa' } }} 
          />

          <Button 
            size="xl" 
            radius="md" 
            color="teal" 
            mt="md"
            fullWidth 
            loading={isSaving}
            onClick={handleFastExecution}
            leftSection={!isSaving && <IconRocket size={24} />}
            styles={{ root: { height: '60px' }, label: { fontSize: '1.1rem' } }}
          >
            {isSaving ? loadingText : 'Registrar e Encerrar'}
          </Button>
        </Stack>
      </Card>
    </Container>
  );
}