// src/pages/DeviceDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

// 1. Funções da API (sem alterações)
import { 
  getDeviceById, 
  getPreventivesForDevice, 
  createPreventive, 
  deletePreventive
} from '../services/api.js';

// 2. Componentes Mantine (Novas importações: ThemeIcon, SimpleGrid, Center)
import {
  Title,
  Text,
  Paper,
  Grid,
  Stack,
  Anchor,
  TextInput,
  Textarea,
  Button,
  Alert,
  Table,
  ThemeIcon,
  Group,
  SimpleGrid,
  Center
} from '@mantine/core';

// 3. Ícones (Novas importações)

import { 
  IconAlertCircle, 
  IconDeviceDesktop, 
  IconBuildingCommunity, 
  IconBuildingFactory, 
  IconId, 
  IconUserCircle, 
  IconBrandWindows, 
  IconCalendarDue, 
  IconPencilPlus,
  IconHistory,
  IconSearchOff,
  IconCalendarTime,
  IconDeviceAnalytics,
  IconCalendarCheck,
  IconWorldWww, 
  IconTag         
} from '@tabler/icons-react';


// --- Componente Auxiliar para o Cartão de Informações ---
// (Isso torna o nosso cartão principal muito mais limpo)
function InfoItem({ icon, label, children }) {
  const isValueEmpty = !children || children === 'N/D' || children === 'Não categorizado';

  return (
    <Group gap="sm" wrap="nowrap" align="flex-start"> {/* align="flex-start" alinha o ícone ao topo se o texto tiver várias linhas */}
      <ThemeIcon variant="light" size="lg" radius="md" style={{ flexShrink: 0 }}> {/* flexShrink: 0 impede o ícone de esmagar */}
        {icon}
      </ThemeIcon>
      <div style={{ overflow: 'hidden', width: '100%' }}> {/* Garante que o texto respeite a largura */}
        <Text size="xs" c="dimmed">{label}</Text>
        <Text 
          size="sm" 
          fw={500} 
          c={isValueEmpty ? 'dimmed' : 'inherit'}
          style={{ 
            wordBreak: 'break-word',      // Força a quebra de palavras longas (como e-mails)
            overflowWrap: 'anywhere',     // Garante a quebra em qualquer ponto se necessário
            whiteSpace: 'normal'          // Permite que o texto ocupe várias linhas
          }}
        >
          {isValueEmpty ? 'Não definido' : children}
        </Text>
      </div>
    </Group>
  );
}


// --- Componente Principal da Página ---
function DeviceDetailPage() {
  const { id } = useParams();
  const [device, setDevice] = useState(null);
  const [preventives, setPreventives] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPreventiveDate, setNewPreventiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNotes, setNewNotes] = useState('');
  const [formError, setFormError] = useState(null);

  // --- Funções de Lógica (sem alteração) ---
  const loadData = async () => {
    try {
      setError(null); 
      setIsLoading(true); 
      const [deviceRes, preventivesRes] = await Promise.all([
        getDeviceById(id),
        getPreventivesForDevice(id)
      ]);
      if (deviceRes.success) setDevice(deviceRes.device);
      else throw new Error(deviceRes.message || 'Falha ao buscar dispositivo');
    	if (preventivesRes.success) setPreventives(preventivesRes.preventives);
    	else throw new Error(preventivesRes.message || 'Falha ao buscar preventivas');
    } catch (err) {
    	console.error("Falha ao carregar dados:", err);
    	setError(err.message || 'Erro ao carregar dados do dispositivo.');
    } finally {
    	setIsLoading(false);
    }
  };

  useEffect(() => {
  	if (id) loadData();
  	else {
    	setError("ID do dispositivo não fornecido na URL.");
    	setIsLoading(false);
  	}
  }, [id]);

  const handlePreventiveSubmit = async (event) => {
  	event.preventDefault();
  	setFormError(null);
  	if (!newPreventiveDate) { 
    	setFormError('Data é obrigatória.');
    	return;
  	}
  	try {
    	const preventiveData = { date: new Date(newPreventiveDate), notes: newNotes };
    	await createPreventive(id, preventiveData);
    	setNewNotes('');
    	setNewPreventiveDate(new Date().toISOString().split('T')[0]);
    	alert('Preventiva registada com sucesso!');
    	loadData(); 
  	} catch (err) {
    	console.error("Erro ao criar preventiva:", err);
    	setFormError(err.message || "Erro desconhecido ao salvar.");
  	}
  };

  const handleDeletePreventive = async (preventiveId) => {
  	if (!window.confirm('Tem certeza que deseja apagar este registo? Esta ação é irreversível.')) {
    	return;
  	}
  	try {
    	await deletePreventive(preventiveId);
    	alert('Preventiva apagada com sucesso.');
    	loadData(); 
  	} catch (err) {
    	console.error("Erro ao apagar preventiva:", err);
    	alert(err.message || "Erro desconhecido ao apagar.");
  	}
  };

  // --- Renderização condicional ---
  if (isLoading) return <div>A carregar detalhes do dispositivo...</div>;
  if (error) return <Alert color="red" title="Erro Crítico">{error}</Alert>;
  if (!device) return <div>Dispositivo não encontrado.</div>;

  // --- Renderização Principal (JSX) ---
  return (
    <Stack gap="xl">
      <Anchor component={Link} to="/">
        &larr; Voltar para a Lista
      </Anchor>

      <Title order={2}>
        Detalhes: {device.name}
      </Title>

      <Grid>
        {/* Coluna Esquerda: Detalhes e Registo */}
    	<Grid.Col span={{ base: 12, md: 5 }}>
      	<Stack gap="xl">
          
          	{/* --- CARTÃO DE INFORMAÇÕES REFINADO --- */}
          	<Paper withBorder shadow="sm" p="lg" radius="md">
            	<Group gap="sm" mb="lg">
                <ThemeIcon size="xl" variant="light" radius="md">
                  <IconDeviceAnalytics size="1.5rem" />
                </ThemeIcon>
            	  <Title order={4}>Informações do Dispositivo</Title>
              </Group>

              {/* Grelha de 2 colunas para os detalhes */}
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                <InfoItem icon={<IconDeviceDesktop size="1.2rem" />} label="Tipo">
                  {device.deviceType}
                </InfoItem>
                <InfoItem icon={<IconBuildingCommunity size="1.2rem" />} label="Setor">
                  {device.setor}
                </InfoItem>
                <InfoItem icon={<IconBuildingFactory size="1.2rem" />} label="Fabricante">
                  {device.manufacturer}
                </InfoItem>
                <InfoItem icon={<IconId size="1.2rem" />} label="Modelo">
                  {device.model}
                </InfoItem>
                <InfoItem icon={<IconUserCircle size="1.2rem" />} label="Usuário">
                  {device.contact}
                </InfoItem>
                <InfoItem icon={<IconBrandWindows size="1.2rem" />} label="Sistema Operacional">
                  {device.operatingSystem}
                </InfoItem>
                 {/*}
                 <InfoItem icon={<IconWorldWww size="1.2rem" />} label="Endereço IP">
                  {device.ipAddress}
                </InfoItem>
               <InfoItem icon={<IconTag size="1.2rem" />} label="Tag de Inventário">
                  {device.inventoryTag} 
                </InfoItem> 
                */}
              </SimpleGrid>

              {/* Seção de Manutenção */}
              <Stack mt="xl" gap="md">
                <Title order={5} ta="center">Manutenção</Title>
                <InfoItem icon={<IconCalendarTime size="1.2rem" />} label="Intervalo (Dias)">
                  {device.maintenanceIntervalDays} 
                </InfoItem>
                <InfoItem icon={<IconCalendarCheck size="1.2rem" />} label="Última Preventiva">
                  {device.lastPreventiveDate ? new Date(device.lastPreventiveDate).toLocaleDateString() : 'N/D'}
                </InfoItem>
                <InfoItem icon={<IconCalendarDue size="1.2rem" />} label="Próxima Preventiva">
                  {device.nextPreventiveDate ? new Date(device.nextPreventiveDate).toLocaleDateString() : 'N/D'}
                </InfoItem>
              </Stack>
          	</Paper>

        	{/* --- CARTÃO DE REGISTO REFINADO --- */}
        	<Paper withBorder shadow="sm" p="lg" radius="md">
          		<Group gap="sm" mb="lg">
                <ThemeIcon size="xl" variant="light" color="blue" radius="md">
                  <IconPencilPlus size="1.5rem" />
                </ThemeIcon>
          	    <Title order={4}>Registar Nova Preventiva</Title>
            </Group>
          		<form onSubmit={handlePreventiveSubmit}>
            		<Stack>
              		<TextInput
                		label="Data da Manutenção"
                		type="date"
                		value={newPreventiveDate}
              		onChange={(e) => setNewPreventiveDate(e.target.value)}
              		required
            		/>
            		<Textarea
              		label="Notas da Manutenção"
              		placeholder="Descreva o que foi feito..."
              		value={newNotes}
              		onChange={(e) => setNewNotes(e.target.value)}
              		minRows={3}
            		/>
            		{formError && (
              		<Alert color="red" icon={<IconAlertCircle size="1rem" />} title="Erro no Formulário">
                		{formError}
              		</Alert>
            		)}
            		<Button type="submit" leftSection={<IconPencilPlus size={18} />}>
                  Adicionar Registo
                </Button>
          		</Stack>
        	</form>
        	</Paper>
      	</Stack>
    	</Grid.Col>

    	{/* --- COLUNA DIREITA: HISTÓRICO REFINADO --- */}
    	<Grid.Col span={{ base: 12, md: 7 }}>
      		<Paper withBorder shadow="sm" p="lg" radius="md">
        		<Group gap="sm" mb="lg">
                <ThemeIcon size="xl" variant="light" color="gray" radius="md">
                  <IconHistory size="1.5rem" />
                </ThemeIcon>
        		  <Title order={4}>Histórico de Preventivas</Title>
            </Group>
        		{preventives.length > 0 ? (
        		<Table striped highlightOnHover verticalSpacing="sm">
          		<Table.Thead>
            	<Table.Tr>
              	<Table.Th>Data</Table.Th>
              	<Table.Th>Técnico</Table.Th>
              	<Table.Th>Notas</Table.Th>
              	<Table.Th ta="right">Ações</Table.Th>
             </Table.Tr>
            	</Table.Thead>
            	<Table.Tbody>
            		{preventives.map((prev) => (
              		<Table.Tr key={prev.id}>
                		<Table.Td>{new Date(prev.date).toLocaleDateString()}</Table.Td>
                		<Table.Td>{prev.technician}</Table.Td>
                		<Table.Td>{prev.notes}</Table.Td>
              		<Table.Td ta="right">
                  		<Button
                    		color="red"
                    		variant="outline"
                    		size="xs"
                    		onClick={() => handleDeletePreventive(prev.id)}
               	>
                    		Apagar
                  		</Button>
                	</Table.Td>
              		</Table.Tr>
            		))}
            	</Table.Tbody>
         	</Table>
    	) : (
          // --- Mensagem de "Vazio" Refinada ---
        	<Center style={{ height: 100, flexDirection: 'column' }}>
            <ThemeIcon variant="light" color="gray" size="xl" radius="xl">
              <IconSearchOff />
            </ThemeIcon>
        		  <Text c="dimmed" mt="md">Nenhum registo de preventiva encontrado.</Text>
          </Center>
    	)}
    	</Paper>
  	</Grid.Col>
  	</Grid>
  </Stack>
  );
}

export default DeviceDetailPage;