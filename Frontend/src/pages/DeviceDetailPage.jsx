import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react'; // 🟢 NOVO IMPORT DO GERADOR DE QR CODE
import { 
  getDeviceById, 
  getPreventivesForDevice, 
  createPreventive, 
  deletePreventive,
  updateDeviceSetor,
  finishAgideskTicket,
  startAgideskTicket, 
  playAgideskTicket,  
  updateDeviceTicketInDb,
  getDeviceTicketFromDb
} from '../services/api';

import { 
  Title, Text, Paper, Grid, Stack, TextInput, Textarea, 
  Button, Alert, Table, ThemeIcon, Group, SimpleGrid, Center, 
  Modal, Select, ActionIcon, Badge, Avatar, Card, Tooltip, Loader,
  Divider
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

import { 
  IconAlertCircle, IconDeviceDesktop, 
  IconBuildingFactory, IconId, IconUserCircle, IconBrandWindows, 
  IconCalendarDue, IconPencilPlus, IconHistory, 
  IconDeviceAnalytics, IconCalendarCheck, IconEdit, IconArrowLeft, IconTrash,
  IconCalendarTime, IconCheck, IconServerCog, IconPlayerPlay, IconPrinter // 🟢 Ícone da Impressora
} from '@tabler/icons-react';

import { allSetorOptions, getIntervalFromSetor } from '../utils/sectors';

const BRAND_BLUE = '#0003d9';

// --- FUNÇÃO AUXILIAR ---
const formatDateNoTimezone = (dateString) => {
  if (!dateString) return 'N/D';
  try {
    const isoDate = dateString.split('T')[0];
    return isoDate.split('-').reverse().join('/');
  } catch (e) {
    return dateString;
  }
};

// --- STAT CARD ---
function StatCard({ title, value, subtext, icon, color }) {
    const isBrand = color === 'blue';
    return (
        <Card shadow="sm" p="lg" radius="lg" withBorder style={{ transition: 'transform 0.2s ease', '&:hover': { transform: 'translateY(-2px)' } }}>
            <Group justify="space-between" align="flex-start" wrap="nowrap">
                <div>
                    <Text c="dimmed" tt="uppercase" fw={800} size="xs" ls={1}>{title}</Text>
                    <Text fw={900} size="1.8rem" mt={4} lh={1.1} c={isBrand ? BRAND_BLUE : 'dark.5'}>{value}</Text>
                    <Text c="dimmed" size="xs" mt={8} fw={500}>{subtext}</Text>
                </div>
                <ThemeIcon size={48} color={isBrand ? BRAND_BLUE : color} variant="light" radius="md">
                    {icon}
                </ThemeIcon>
            </Group>
        </Card>
    );
}

// --- INFO ITEM ---
function InfoItem({ icon, label, children }) {
  const isValueEmpty = !children || children === 'N/D' || children === 'Não categorizado';

  return (
    <Group wrap="nowrap" align="flex-start" gap="sm">
      <ThemeIcon variant="light" color={BRAND_BLUE} size={34} radius="md" style={{ flexShrink: 0 }}>
        {icon}
      </ThemeIcon>
      <div style={{ overflow: 'hidden' }}>
        <Text size="10px" c="dimmed" tt="uppercase" fw={800} ls={0.5}>{label}</Text>
        <Text 
          size="sm" 
          fw={600} 
          c={isValueEmpty ? 'gray.5' : 'dark.4'}
          style={{ wordBreak: 'break-word', lineHeight: 1.2, marginTop: '2px' }}
        >
          {isValueEmpty ? 'Não definido' : children}
        </Text>
      </div>
    </Group>
  );
}

function DeviceDetailPage() {
  const { id } = useParams();
  const [device, setDevice] = useState(null);
  const [preventives, setPreventives] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [newPreventiveDate, setNewPreventiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNotes, setNewNotes] = useState('');
  const [savedNotesForAgidesk, setSavedNotesForAgidesk] = useState('');
  const [formError, setFormError] = useState(null);

  const [openedModal, { open, close }] = useDisclosure(false);
  const [selectedSetor, setSelectedSetor] = useState('');
  const [savingSetor, setSavingSetor] = useState(false);

  // 🟢 ESTADOS DO AGIDESK
  const [isFinishingTicket, setIsFinishingTicket] = useState(false);
  const [isStartingTicket, setIsStartingTicket] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState(null);

  // Pegamos o usuário para registrar no Agidesk
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const loadData = async () => {
    try {
      setIsLoading(true); 
      const [deviceRes, preventivesRes] = await Promise.all([
        getDeviceById(id),
        getPreventivesForDevice(id)
      ]);
      
      if (deviceRes.success) {
        setDevice(deviceRes.device);
        setSelectedSetor(deviceRes.device.setor || ''); 
      }
      if (preventivesRes.success) setPreventives(preventivesRes.preventives);

      const ticketId = await getDeviceTicketFromDb(id);
      setActiveTicketId(ticketId || null);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (id) loadData(); }, [id]);

  const handleSaveSetor = async () => {
    if (!selectedSetor) return;
    setSavingSetor(true);
    try {
      const interval = getIntervalFromSetor(selectedSetor);
      await updateDeviceSetor(id, selectedSetor, interval);
      setDevice(prev => ({ ...prev, setor: selectedSetor, maintenanceIntervalDays: interval }));
      close(); 
    } catch (err) {
      alert('Erro ao atualizar setor: ' + err.message);
    } finally {
      setSavingSetor(false);
    }
  };

  const handlePreventiveSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    try {
      await createPreventive(id, { date: new Date(newPreventiveDate), notes: newNotes });
      setSavedNotesForAgidesk(newNotes);
      setNewNotes(''); 
      loadData(); 
      alert('Preventiva registrada com sucesso!');
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDeletePreventive = async (preventiveId) => {
    if (!window.confirm('Tem certeza que deseja apagar este registro do histórico?')) return;
    try {
      await deletePreventive(preventiveId);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStartAgidesk = async () => {
      setIsStartingTicket(true);
      try {
          const ticketRes = await startAgideskTicket({
              deviceName: device.name,
              deviceType: device.deviceType || 'Desktop',
              techIdentifier: currentUser.email || currentUser.username,
              deviceSector: device.sector?.name || device.setor || 'Não informado'
          });

          if (ticketRes && ticketRes.ticketId) {
              const newTicketId = ticketRes.ticketId;
              try { await playAgideskTicket(newTicketId); } catch(e) { console.warn(e); }
              await updateDeviceTicketInDb(id, newTicketId);
              setActiveTicketId(newTicketId);
          }
      } catch (err) {
          alert(`❌ Erro ao iniciar chamado: ${err.message}`);
      } finally {
          setIsStartingTicket(false);
      }
  };

  const handleFinishAgidesk = async () => {
      if (!activeTicketId) return;

      setIsFinishingTicket(true);
      try {
          const textToAgidesk = savedNotesForAgidesk || newNotes;
          
          const relatorio = textToAgidesk 
            ? `Manutenção preventiva concluída.<br><br><b>Notas do Serviço:</b><br>${textToAgidesk}` 
            : "Manutenção preventiva concluída com sucesso via TechFlow.";
              
          await finishAgideskTicket(activeTicketId, relatorio);
          await updateDeviceTicketInDb(id, null);
          
          setActiveTicketId(null);
          setSavedNotesForAgidesk('');
          alert(`✅ SUCESSO! O chamado ${activeTicketId} foi encerrado!`);
          
      } catch (err) {
          console.error("Erro ao encerrar:", err);
          alert(`❌ Falha ao encerrar no Agidesk: ${err.message}`);
      } finally {
          setIsFinishingTicket(false);
      }
  };

  if (isLoading) return <Center h="100vh"><Loader color={BRAND_BLUE} type="dots" /></Center>;
  if (error) return <Alert color="red" title="Erro" icon={<IconAlertCircle/>}>{error}</Alert>;
  if (!device) return <Alert color="orange">Dispositivo não encontrado.</Alert>;

  // 🟢 URL dinâmica para o QR Code e Estilos da Impressora
  const scanUrl = `${window.location.origin}/scan/${device?.id}`;

  const printStyles = `
    @media screen {
      .print-only { display: none; }
    }
    @media print {
      /* 1. Tira as margens padrão do navegador */
      @page { 
        margin: 0; 
      }
      
      /* 2. A MÁGICA: Trava o tamanho do corpo da página e corta todo o excesso invisível */
      body, html {
        margin: 0;
        padding: 0;
        height: 100vh;
        overflow: hidden !important; 
      }
      
      /* 3. Deixa o resto do site invisível */
      body * { 
        visibility: hidden; 
      }
      
      /* 4. Mostra apenas a etiqueta */
      .print-only, .print-only * { 
        visibility: visible; 
      }
      
      /* 5. Prega a etiqueta no canto superior esquerdo da folha 1 */
      .print-only { 
        position: fixed; 
        left: 0; 
        top: 0; 
        width: 100vw;
        height: 100vh;
        display: flex;
        justify-content: flex-start;
        align-items: flex-start;
        padding: 20px;
        background-color: white;
      }
      
      /* Estilo da caixinha */
      .etiqueta-box {
        border: 2px solid #000;
        padding: 15px;
        width: 250px;
        text-align: center;
        border-radius: 8px;
        font-family: sans-serif;
      }
    }
  `;

  return (
    <Stack gap="xl" pb="xl">
      <Group>
          <Button component={Link} to="/devices" variant="subtle" size="sm" leftSection={<IconArrowLeft size={16} />} color="gray" style={{ paddingLeft: 0, '&:hover': { background: 'transparent', textDecoration: 'underline' }}}>
            Voltar para Ativos
          </Button>
      </Group>

      <Modal opened={openedModal} onClose={close} title={<Text fw={800} size="lg">Alterar Setor do Ativo</Text>} centered radius="md" overlayProps={{ blur: 3 }}>
        <Stack>
          <Select
            label="Selecione o Novo Setor"
            placeholder="Ex: Administração, Produção..."
            data={allSetorOptions}
            value={selectedSetor}
            onChange={setSelectedSetor}
            searchable
            mb="sm"
          />
          <Alert variant="light" color="blue" title="Atualização Automática" icon={<IconCalendarTime/>}>
             O intervalo de manutenção será ajustado automaticamente para <strong>{selectedSetor ? getIntervalFromSetor(selectedSetor) : '?'} dias</strong>.
          </Alert>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={close}>Cancelar</Button>
            <Button onClick={handleSaveSetor} loading={savingSetor} color={BRAND_BLUE}>Confirmar Alteração</Button>
          </Group>
        </Stack>
      </Modal>

      <Card shadow="md" p="xl" radius="lg" withBorder style={{ overflow: 'visible' }}>
         <Group justify="space-between" align="center" wrap="wrap" gap="xl">
            <Group gap="lg" wrap="nowrap">
                <Avatar color={BRAND_BLUE} size={70} radius="md" variant="light">
                    <IconDeviceDesktop size={40} />
                </Avatar>
                <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={800} ls={1}>Perfil do Ativo</Text>
                    <Title order={2} fw={900} style={{ color: '#212529', letterSpacing: '-0.5px' }}>{device.name}</Title>
                    <Group gap="sm" mt={8}>
                         <Badge size="md" color={BRAND_BLUE} variant="filled">{device.setor || 'Sem Setor'}</Badge>
                         <Badge size="md" color="gray" variant="outline" style={{ textTransform: 'none' }}>NS: {device.serial || 'Não informado'}</Badge>
                    </Group>
                </div>
            </Group>
            
            <Group>
                {/* 🟢 NOVO BOTÃO DE IMPRIMIR */}
                <Button variant="default" onClick={() => window.print()} leftSection={<IconPrinter size={16} />} radius="md" size="md">
                    Imprimir Etiqueta
                </Button>

                <Button variant="light" color={BRAND_BLUE} onClick={open} leftSection={<IconEdit size={16} />} radius="md" size="md">
                    Gerenciar Setor
                </Button>
            </Group>
         </Group>
      </Card>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
         <StatCard 
            title="Ciclo Padrão" 
            value={`${device.maintenanceIntervalDays || 0} dias`} 
            subtext="Intervalo definido pelo setor"
            icon={<IconHistory size={26}/>}
            color="gray"
         />
         <StatCard 
            title="Última Preventiva" 
            value={formatDateNoTimezone(device.lastPreventiveDate)} 
            subtext={device.lastPreventiveDate ? "Manutenção confirmada" : "Nenhum registro"}
            icon={<IconCheck size={26}/>}
            color="teal"
         />
         <StatCard 
            title="Próxima Preventiva" 
            value={formatDateNoTimezone(device.nextPreventiveDate)} 
            subtext={device.nextPreventiveDate ? 'Agendamento automático' : 'Aguardando sincronização'}
            icon={<IconCalendarDue size={26}/>}
            color="blue" 
         />
      </SimpleGrid>

      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Stack gap="xl">
            <Card shadow="sm" p="xl" radius="lg" withBorder>
              <Group mb="xl" justify="space-between">
                 <Group gap="sm">
                    <ThemeIcon color="gray" variant="light" radius="md" size={36}><IconDeviceAnalytics size={22} /></ThemeIcon>
                    <Text fw={800} size="lg" c="dark.5">Ficha Técnica</Text>
                 </Group>
              </Group>

              <SimpleGrid cols={2} spacing="lg" verticalSpacing="xl">
                <InfoItem icon={<IconDeviceDesktop size="1.2rem" />} label="Tipo">{device.deviceType}</InfoItem>
                <InfoItem icon={<IconBuildingFactory size="1.2rem" />} label="Fabricante">{device.manufacturer}</InfoItem>
                <InfoItem icon={<IconId size="1.2rem" />} label="Modelo">{device.model}</InfoItem>
                <InfoItem icon={<IconBrandWindows size="1.2rem" />} label="Sistema">{device.operatingSystem}</InfoItem>
              </SimpleGrid>
              
              <Divider my="xl" variant="dashed" />
              <InfoItem icon={<IconUserCircle size="1.2rem" />} label="Usuário / Responsável">{device.contact}</InfoItem>
            </Card>

            <Card shadow="md" p="xl" radius="lg" withBorder bg="blue.0" style={{ borderColor: '#d0ebff' }}>
              <Group mb="lg">
                 <ThemeIcon color={BRAND_BLUE} variant="filled" radius="md" size={36}><IconPencilPlus size={22} /></ThemeIcon>
                 <Text fw={800} size="lg" c={BRAND_BLUE}>Registrar Preventiva</Text>
              </Group>
              
              <form onSubmit={handlePreventiveSubmit}>
                <Stack>
                  <TextInput 
                    label="Data da Execução" 
                    type="date" 
                    value={newPreventiveDate} 
                    onChange={(e) => setNewPreventiveDate(e.target.value)} 
                    required 
                    styles={{ input: { backgroundColor: 'white' } }}
                  />
                  <Textarea 
                    label="Observações / Notas do Serviço" 
                    placeholder="Descreva as ações realizadas no equipamento..." 
                    value={newNotes} 
                    onChange={(e) => setNewNotes(e.target.value)} 
                    minRows={3} 
                    styles={{ input: { backgroundColor: 'white' } }}
                  />
                  {formError && <Alert color="red" icon={<IconAlertCircle />}>{formError}</Alert>}
                  <Button type="submit" fullWidth mt="md" size="md" color={BRAND_BLUE} radius="md">Salvar Manutenção</Button>
                </Stack>
              </form>

              <Divider my="xl" variant="dashed" color="blue.2" />
              
              {activeTicketId ? (
                  <>
                      <Alert variant="light" color="teal" icon={<IconServerCog />} title="Integração Agidesk Ativa">
                          Você possui um chamado em andamento (ID: <b>{activeTicketId}</b>). Você pode encerrar o atendimento bipando o celular no usuário ou pelo botão abaixo.
                      </Alert>
                      <Button 
                          onClick={handleFinishAgidesk} 
                          loading={isFinishingTicket} 
                          fullWidth 
                          mt="md" 
                          size="md" 
                          color="teal" 
                          radius="md" 
                          leftSection={<IconCheck size={20} />}
                      >
                          Finalizar Ticket no Agidesk
                      </Button>
                  </>
              ) : (
                  <>
                      <Alert variant="light" color="blue" icon={<IconServerCog />} title="Agidesk: Iniciar no Laboratório">
                          Deseja iniciar o cronômetro do chamado antes de ir à campo? Clique abaixo.
                      </Alert>
                      <Button 
                          onClick={handleStartAgidesk} 
                          loading={isStartingTicket} 
                          fullWidth 
                          mt="md" 
                          size="md" 
                          color="blue" 
                          radius="md" 
                          leftSection={<IconPlayerPlay size={20} />}
                      >
                          Iniciar Atendimento no Agidesk
                      </Button>
                  </>
              )}
            </Card>
          </Stack>
        </Grid.Col>

        {/* --- COLUNA DA DIREITA: HISTÓRICO (CINZA MANTIDO) --- */}
        <Grid.Col span={{ base: 12, md: 7 }}>
           <Card shadow="sm" p="xl" radius="lg" withBorder h="100%">
             <Group mb="xl" justify="space-between" align="center">
                <Group gap="sm">
                    <ThemeIcon color="gray" variant="light" radius="md" size={36}><IconHistory size={22} /></ThemeIcon>
                    <Text fw={800} size="lg" c="dark.5">Histórico de Manutenções</Text>
                </Group>
                <Badge variant="filled" color="gray" size="lg" radius="sm">{preventives.length} Registros</Badge>
             </Group>

             {preventives.length > 0 ? (
               <Table.ScrollContainer minWidth={500}>
                 <Table verticalSpacing="md" horizontalSpacing="sm" striped highlightOnHover>
                   <Table.Thead>
                     <Table.Tr>
                       <Table.Th style={{ width: '120px' }}>Data</Table.Th>
                       <Table.Th>Técnico Responsável</Table.Th>
                       <Table.Th>Observações</Table.Th>
                       <Table.Th style={{ textAlign: 'center', width: '80px' }}>Ação</Table.Th>
                     </Table.Tr>
                   </Table.Thead>
                   <Table.Tbody>
                     {preventives.map((prev) => (
                       <Table.Tr key={prev.id}>
                         <Table.Td><Text fw={700} size="sm" c="dark.4">{formatDateNoTimezone(prev.date)}</Text></Table.Td>
                         <Table.Td>
                             <Group gap="xs">
                                 <Avatar size={24} color={BRAND_BLUE} radius="xl">{prev.technician?.charAt(0).toUpperCase() || 'T'}</Avatar>
                                 <Text size="sm" fw={600}>{prev.technician}</Text>
                             </Group>
                         </Table.Td>
                         <Table.Td><Text size="sm" c="dimmed" lineClamp={2} title={prev.notes}>{prev.notes || 'Sem observações'}</Text></Table.Td>
                         <Table.Td style={{ textAlign: 'center' }}>
                             <Tooltip label="Apagar Registro" position="top" withArrow>
                                 <ActionIcon color="red" variant="subtle" radius="md" onClick={() => handleDeletePreventive(prev.id)}>
                                     <IconTrash size={18} />
                                 </ActionIcon>
                             </Tooltip>
                         </Table.Td>
                       </Table.Tr>
                     ))}
                   </Table.Tbody>
                 </Table>
               </Table.ScrollContainer>
             ) : (
                <Center h={300} style={{ border: '2px dashed #e9ecef', borderRadius: '12px', backgroundColor: '#f8f9fa' }}>
                    <Stack align="center" gap="xs">
                        <ThemeIcon size={60} radius="100%" color="gray" variant="light"><IconHistory size={30} /></ThemeIcon>
                        <Text fw={600} c="dark.3" size="lg" mt="sm">Nenhum registro encontrado</Text>
                        <Text c="dimmed" size="sm" ta="center" maw={300}>As manutenções preventivas registradas para este dispositivo aparecerão aqui.</Text>
                    </Stack>
                </Center>
             )}
           </Card>
        </Grid.Col>
      </Grid>
      
      {/* 🟢 ETIQUETA INVISÍVEL (SÓ APARECE NA IMPRESSÃO) */}
      <style>{printStyles}</style>
      <div className="print-only">
          <div className="etiqueta-box">
              <h2 style={{ margin: '0 0 10px 0', color: '#0003d9' }}>TechFlow</h2>
              <QRCodeSVG value={scanUrl} size={150} level="H" />
              <h3 style={{ margin: '10px 0 5px 0', fontSize: '20px' }}>{device.name}</h3>
              <p style={{ margin: '0', fontSize: '14px', color: '#555' }}>Setor: {device.setor || device.sector?.name || 'Não definido'}</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', fontWeight: 'bold' }}>NS: {device.serial || 'N/A'}</p>
          </div>
      </div>
    </Stack>
  );
}

export default DeviceDetailPage;