import React, { useState, useCallback, useEffect, memo, useRef } from 'react';
import ReactFlow, { 
  Controls, Background, applyNodeChanges, applyEdgeChanges, addEdge, Handle, Position, NodeResizer
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Paper, Text, Group, ThemeIcon, Modal, Button, Stack, TextInput, Divider, FileButton, Tabs, Indicator, Badge, ScrollArea, Menu } from '@mantine/core';
import { IconRouter, IconWifi, IconServer, IconDeviceDesktop, IconPrinter, IconDeviceFloppy, IconWorldWww, IconTerminal2, IconPlug, IconCheck, IconPlus, IconUpload, IconTrash, IconRefresh, IconBuildingStore, IconBuildingFactory, IconPhoto, IconPlayerStop, IconSettings, IconLock, IconLockOpen } from '@tabler/icons-react';
import { 
  updateDevicePosition, getNetworkLinks, createNetworkLink, deleteNetworkLink, 
  updateDeviceNetworkInfo, getMapZones, createMapZone, updateMapZone, deleteMapZone, 
  importZabbixData, clearTopology, deleteDevice, clearAllLinks, createManualDevice, pingDevices 
} from '../services/api';

import WebTerminal from './WebTerminal';

// 🟢 1. IMPORTAÇÃO DIRETA DA IMAGEM PELO VITE
import plantaBg from '../assets/planta_ap.png';

const BRAND_BLUE = '#0003d9';

// 🟢 2. A CONSTANTE AGORA USA A IMAGEM IMPORTADA
const DEFAULT_AP_MAP_BG = plantaBg; 

const ImageBackgroundNode = memo(({ data }) => {
  return (
    <img
      src={data.url}
      alt="Planta Baixa"
      style={{ pointerEvents: 'none', userSelect: 'none', display: 'block', maxWidth: 'none', opacity: 0.8 }}
    />
  );
});

const DeviceNode = memo(({ data }) => {
  let Icon = IconRouter;
  const type = (data.type || '').toLowerCase();
  
  if (type.includes('ap') || type.includes('wifi') || type.includes('access point')) Icon = IconWifi;
  else if (type.includes('server')) Icon = IconServer;
  else if (type.includes('desktop')) Icon = IconDeviceDesktop;
  else if (type.includes('printer')) Icon = IconPrinter;
  else if (type === 'outros') Icon = IconDeviceFloppy;

  const statusColor = data.isAlive === true ? 'green' : data.isAlive === false ? 'red' : 'gray';

  if (data.isAPMap) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title={`IP: ${data.ip || 'Sem IP'}`}>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <Icon size={32} color="#1864ab" stroke={2} style={{ filter: 'drop-shadow(0px 0px 2px rgba(255,255,255,1)) drop-shadow(0px 2px 3px rgba(0,0,0,0.4))', marginBottom: -4 }} />
          <div style={{
            position: 'absolute', top: 2, right: -2, width: 9, height: 9,
            backgroundColor: data.isAlive === true ? '#40c057' : data.isAlive === false ? '#fa5252' : '#adb5bd',
            border: '1.5px solid #fff', borderRadius: '50%', boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 2 }}>
          <Text size={11} fw={800} c="#212529" style={{ whiteSpace: 'nowrap', lineHeight: 1.1, letterSpacing: '-0.3px', textShadow: '1px 1px 0 #fff, -1px 1px 0 #fff, 1px -1px 0 #fff, -1px -1px 0 #fff, 0px 0px 4px #fff' }}>{data.label}</Text>
          {data.ip && <Text size={9} fw={700} c="#495057" style={{ whiteSpace: 'nowrap', lineHeight: 1, marginTop: 1, textShadow: '1px 1px 0 #fff, -1px 1px 0 #fff, 1px -1px 0 #fff, -1px -1px 0 #fff, 0px 0px 4px #fff' }}>{data.ip}</Text>}
        </div>
      </div>
    );
  }

  return (
    <Paper withBorder shadow="sm" p="xs" radius="md" style={{ width: 180, borderColor: '#dee2e6', backgroundColor: '#fff', cursor: 'pointer' }}>
      <Handle type="target" position={Position.Top} id="t-top" style={{ background: '#555', left: '45%' }} />
      <Handle type="source" position={Position.Top} id="s-top" style={{ background: '#555', left: '55%' }} />
      <Handle type="target" position={Position.Bottom} id="t-bottom" style={{ background: '#555', left: '45%' }} />
      <Handle type="source" position={Position.Bottom} id="s-bottom" style={{ background: '#555', left: '55%' }} />
      <Handle type="target" position={Position.Left} id="t-left" style={{ background: '#555', top: '45%' }} />
      <Handle type="source" position={Position.Left} id="s-left" style={{ background: '#555', top: '55%' }} />
      <Handle type="target" position={Position.Right} id="t-right" style={{ background: '#555', top: '45%' }} />
      <Handle type="source" position={Position.Right} id="s-right" style={{ background: '#555', top: '55%' }} />

      <Group gap="xs" align="center" wrap="nowrap">
        <Indicator color={statusColor} size={14} offset={4} processing={data.isAlive === true} withBorder>
           <ThemeIcon color={BRAND_BLUE} variant="light" size="lg" radius="md"><Icon size={20} /></ThemeIcon>
        </Indicator>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Text size="xs" fw={800} truncate title={data.label}>{data.label}</Text>
          <Text size="xs" c={data.ip ? "dimmed" : "red"} fw={600} truncate>{data.ip || 'Sem IP'}</Text>
        </div>
      </Group>
    </Paper>
  );
});

const ZoneNode = memo(({ data, selected }) => {
  return (
    <div style={{ width: '100%', height: '100%', border: '2px dashed #adb5bd', borderRadius: 12, backgroundColor: 'rgba(248, 249, 250, 0.4)', position: 'relative' }}>
      <NodeResizer color={BRAND_BLUE} isVisible={selected && !data.isLocked} minWidth={200} minHeight={150} onResizeStop={data.onResize} />
      <div style={{ position: 'absolute', top: -14, left: 16, background: '#f8f9fa', padding: '2px 8px', borderRadius: 4, fontSize: 14, fontWeight: 800, color: '#495057' }}>{data.label}</div>
    </div>
  );
});

const nodeTypes = { device: DeviceNode, zone: ZoneNode, bgImage: ImageBackgroundNode };

export default function NetworkMap({ devices, filterType = 'switch' }) {
  const isAPMap = filterType && (
    filterType.toLowerCase().includes('access point') || 
    filterType.toLowerCase() === 'ap' || 
    filterType.toLowerCase().includes('wifi')
  );

  const [activeTab, setActiveTab] = useState('matriz'); 
  const currentContext = isAPMap ? 'aps' : activeTab;

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [pingStatus, setPingStatus] = useState({}); 
  const [isLocked, setIsLocked] = useState(true);
  
  // 🟢 CORREÇÃO: Lê do localStorage, se não tiver e for AP, assume a planta padrão
  const [bgImage, setBgImage] = useState(() => {
    const saved = localStorage.getItem(`map_bg_${currentContext}`);
    if (saved) return saved;
    return isAPMap ? DEFAULT_AP_MAP_BG : null;
  });
  
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  
  const [editName, setEditName] = useState('');
  const [editIp, setEditIp] = useState('');
  const [editNobreak, setEditNobreak] = useState('');
  const [editZoneName, setEditZoneName] = useState('');

  const [newDeviceModal, setNewDeviceModal] = useState(false);
  const [newData, setNewData] = useState({ name: '', ip: '', type: isAPMap ? 'Access Point' : 'Switch' });
  const [isSavingLayout, setIsSavingLayout] = useState(false);

  const [pingTerminalIp, setPingTerminalIp] = useState(null);
  const [pingLogs, setPingLogs] = useState([]);
  const terminalEndRef = useRef(null);

  const [terminalConfig, setTerminalConfig] = useState(null);
  const [loginModal, setLoginModal] = useState({ opened: false, ip: '', username: '', password: '' });

  const zabbixInputRef = useRef(null);
  const bgInputRef = useRef(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [pingLogs]);

  useEffect(() => {
    if (!pingTerminalIp) return;
    setPingLogs([`> Estabelecendo conexão com o servidor...`, `> Iniciando ping contínuo para ${pingTerminalIp}`, `======================================================`]);
    const eventSource = new EventSource(`http://localhost:3000/api/ping-stream/${pingTerminalIp}`);
    eventSource.onmessage = (event) => setPingLogs(prev => [...prev, event.data]);
    eventSource.onerror = () => {
        setPingLogs(prev => [...prev, `[SISTEMA] Conexão com o servidor encerrada.`]);
        eventSource.close();
    };
    return () => eventSource.close(); 
  }, [pingTerminalIp]);

  const mapDevices = (devices || []).filter(dev => {
    if (isAPMap) return true; 
    const isTractor = (dev.name || '').toUpperCase().includes('TRC') || (dev.name || '').toUpperCase().includes('TRACTOR');
    if (currentContext === 'tractor') return isTractor;
    return !isTractor; 
  });

  // 🟢 CORREÇÃO: Ao mudar de aba/contexto, aplica a lógica do fundo padrão
  useEffect(() => {
    const saved = localStorage.getItem(`map_bg_${currentContext}`);
    if (saved) {
      setBgImage(saved);
    } else {
      setBgImage(currentContext === 'aps' ? DEFAULT_AP_MAP_BG : null);
    }
  }, [currentContext]);

  const loadTopology = async () => {
    try {
      const dbZones = await getMapZones(currentContext);
      const zoneNodes = dbZones.map(z => ({
        id: `zone-${z.id}`, type: 'zone', position: { x: z.x, y: z.y }, style: { width: z.width, height: z.height },
        zIndex: -1,
        data: { id: z.id, label: z.name, isLocked: isLocked, onResize: async (evt, params) => { await updateMapZone(z.id, { width: params.width, height: params.height, x: params.x, y: params.y }); } }
      }));

      const deviceNodes = mapDevices.map((dev) => ({
        id: String(dev.id), type: 'device',
        position: { x: dev.mapPositionX != null ? Number(dev.mapPositionX) : (Math.random() * 300), y: dev.mapPositionY != null ? Number(dev.mapPositionY) : (Math.random() * 300) },
        zIndex: 10,
        data: { id: dev.id, label: dev.name, ip: dev.ipAddress || '', type: dev.deviceType || 'outros', nobreak: dev.nobreakModel || '', isAlive: pingStatus[dev.ipAddress], isAPMap: isAPMap }
      }));

      // 🟢 CORREÇÃO: Injete o fallback na carga inicial da topologia
      const savedBg = localStorage.getItem(`map_bg_${currentContext}`);
      const currentBg = savedBg ? savedBg : (currentContext === 'aps' ? DEFAULT_AP_MAP_BG : null);

      const bgNode = currentBg ? [{
        id: 'bg-image-node', type: 'bgImage', position: { x: 0, y: 0 }, data: { url: currentBg }, selectable: false, draggable: false, zIndex: -100      
      }] : [];

      setNodes([...bgNode, ...zoneNodes, ...deviceNodes]);

      const links = await getNetworkLinks(currentContext);
      setEdges(links.map(link => ({
        id: String(link.id), source: String(link.sourceId), target: String(link.targetId), sourceHandle: link.sourceHandle, targetHandle: link.targetHandle, animated: true, style: { stroke: '#40c057', strokeWidth: 2 }
      })));
    } catch (err) { console.error("Erro ao carregar topologia", err); }
  };

  useEffect(() => { loadTopology(); }, [devices, currentContext]);

  useEffect(() => {
    setNodes(nds => nds.map(n => n.type === 'zone' ? { ...n, data: { ...n.data, isLocked } } : n));
  }, [isLocked]);

  useEffect(() => {
    setNodes((currentNodes) => {
      const withoutBg = currentNodes.filter(n => n.id !== 'bg-image-node');
      if (bgImage) return [{ id: 'bg-image-node', type: 'bgImage', position: { x: 0, y: 0 }, data: { url: bgImage }, selectable: false, draggable: false, zIndex: -100 }, ...withoutBg];
      return withoutBg;
    });
  }, [bgImage]);

  useEffect(() => {
    if (Object.keys(pingStatus).length === 0) return;
    setNodes((currentNodes) => currentNodes.map((node) => {
      if (node.type === 'device' && node.data.ip) {
        const newStatus = pingStatus[node.data.ip];
        if (node.data.isAlive !== newStatus) return { ...node, data: { ...node.data, isAlive: newStatus } };
      }
      return node;
    }));
  }, [pingStatus]);

  useEffect(() => {
    const ipsToPing = mapDevices.map(d => d.ipAddress).filter(ip => ip);
    const runPing = async () => {
      if (ipsToPing.length === 0) return;
      try {
        const results = await pingDevices(ipsToPing);
        setPingStatus(results);
      } catch (e) {}
    };
    runPing(); 
    const interval = setInterval(runPing, 20000); 
    return () => clearInterval(interval);
  }, [currentContext, devices]);

  const onNodeDragStop = async (event, node) => {
    if (node.type === 'device') await updateDevicePosition(node.data.id, node.position.x, node.position.y);
    else if (node.type === 'zone') await updateMapZone(node.data.id, { x: node.position.x, y: node.position.y, width: node.style.width, height: node.style.height });
  };

  const onConnect = async (params) => {
    try {
      const newLink = await createNetworkLink(params.source, params.target, params.sourceHandle, params.targetHandle, currentContext);
      setEdges((eds) => addEdge({ id: String(newLink.id), source: String(newLink.sourceId), target: String(newLink.targetId), sourceHandle: newLink.sourceHandle, targetHandle: newLink.targetHandle, animated: true, style: { stroke: '#40c057', strokeWidth: 2 } }, eds));
    } catch (err) { alert("Cabo já existe!"); }
  };

  const onEdgesDelete = async (edgesToDelete) => {
    for (const edge of edgesToDelete) await deleteNetworkLink(edge.id);
  };

  const onNodesDelete = async (nodesToDelete) => {
    for (const node of nodesToDelete) {
      if (node.type === 'device') {
        try { await deleteDevice(node.data.id); } catch(e) { console.error("Erro ao apagar:", e); }
      } else if (node.type === 'zone') {
        try { await deleteMapZone(node.data.id); } catch(e) { console.error("Erro ao apagar zona:", e); }
      }
    }
  };

  const onNodeClick = (event, node) => {
    if (node.type === 'device') { 
      setSelectedDevice(node); 
      setEditName(node.data.label || '');
      setEditIp(node.data.ip || ''); 
      setEditNobreak(node.data.nobreak || ''); 
    } 
    else if (node.type === 'zone') { setSelectedZone(node); setEditZoneName(node.data.label); }
  };

  const handleClearTopology = async () => {
    if (!window.confirm("CUIDADO: Deseja apagar as caixas e cabos desta aba? (Os equipamentos não serão excluídos do banco)")) return;
    try { await clearTopology(currentContext); await loadTopology(); } catch (error) { alert("Erro ao limpar a topologia."); }
  };

  const handleClearLinks = async () => {
    if (!window.confirm("Deseja apagar TODOS os cabos deste mapa e refazer as ligações do zero?")) return;
    try { await clearAllLinks(currentContext); await loadTopology(); } catch(e) { alert("Erro ao limpar cabos."); }
  };

  const handleAddManualDevice = async () => {
    if (!newData.name) return alert("O nome é obrigatório!");
    try {
      const res = await createManualDevice({ name: newData.name, ipAddress: newData.ip, deviceType: newData.type });
      setNewDeviceModal(false);
      setNewData({ name: '', ip: '', type: isAPMap ? 'Access Point' : 'Switch' });
      
      const createdDevice = res.device || res.data?.device || res;

      if (createdDevice && createdDevice.id) {
         const newNode = { 
           id: String(createdDevice.id), 
           type: 'device', 
           position: { x: 300, y: 200 }, 
           zIndex: 10, 
           data: { id: createdDevice.id, label: newData.name, ip: newData.ip, type: newData.type, isAPMap: isAPMap } 
         };
         setNodes((nds) => [...nds, newNode]);
      } else { 
         window.location.reload(); 
      }
    } catch (error) { 
        console.error(error); 
        alert("Erro ao criar equipamento.");
    }
  };

  const handleSaveLayout = async () => {
    setIsSavingLayout(true);
    try {
      const promises = nodes.map(node => {
        if (node.type === 'device') return updateDevicePosition(node.data.id, node.position.x, node.position.y);
        else if (node.type === 'zone') return updateMapZone(node.data.id, { x: node.position.x, y: node.position.y, width: node.style?.width || 200, height: node.style?.height || 150, context: currentContext });
        return Promise.resolve();
      });
      await Promise.all(promises);
      alert("Layout do mapa salvo com sucesso!");
    } catch (error) { console.error(error); } finally { setIsSavingLayout(false); }
  };

  const handleAddManualZone = async () => {
    await createMapZone({ name: 'Novo Setor', x: 50, y: 50, width: 400, height: 300, context: currentContext });
    loadTopology();
  };

  const handleUploadZabbix = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        await importZabbixData(json, currentContext); 
        alert("Importado com sucesso!"); 
        await loadTopology(); 
      } catch (err) { 
        alert("Erro ao importar: " + err.message); 
      } finally {
        if (zabbixInputRef.current) zabbixInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleUploadBackground = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setBgImage(e.target.result);
      localStorage.setItem(`map_bg_${currentContext}`, e.target.result);
      if (bgInputRef.current) bgInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleClearBackground = () => {
    localStorage.removeItem(`map_bg_${currentContext}`);
    // 🟢 CORREÇÃO: Ao limpar, se for o mapa de APs, volta para a planta padrão nativa.
    setBgImage(currentContext === 'aps' ? DEFAULT_AP_MAP_BG : null);
  };

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  const getWebAccessUrl = () => {
    if (isAPMap) {
      if (editName.toLowerCase().includes('ubiquiti')) return 'https://10.20.99.180:8443/manage/account/login';
      return `https://${editIp}:4343/login`; 
    }
    return `http://${editIp}`; 
  };

  return (
    <div style={{ width: '100%' }}>
      {!isAPMap && (
        <Tabs value={activeTab} onChange={setActiveTab} mb="md" color={BRAND_BLUE}>
          <Tabs.List>
            <Tabs.Tab value="matriz" leftSection={<IconBuildingStore size={16} />}>Pedertractor</Tabs.Tab>
            <Tabs.Tab value="tractor" leftSection={<IconBuildingFactory size={16} />}>Tractor</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      )}

      <Group justify="space-between" mb="sm">
        <Group>
          <Text fw={700} c="dimmed">
            Mesa de Operações: {isAPMap ? 'MAPA DE ACESS POINTS' : (currentContext === 'matriz' ? 'PEDERTRACTOR' : 'TRACTOR')}
          </Text>
          <Badge color="green" variant="light" size="sm" ml="sm">Monitoramento Ping Ativo</Badge>
        </Group>
        
        <Group>
          <Button 
            variant={isLocked ? "subtle" : "filled"} 
            color={isLocked ? "gray" : "red"} 
            leftSection={isLocked ? <IconLock size={16} /> : <IconLockOpen size={16} />} 
            onClick={() => setIsLocked(!isLocked)}
          >
            {isLocked ? 'Desbloquear Mapa' : 'Bloquear Mapa'}
          </Button>

          {!isLocked && (
             <Button color="green" leftSection={<IconDeviceFloppy size={16}/>} onClick={handleSaveLayout} loading={isSavingLayout}>Salvar Layout</Button>
          )}

          <Button variant="light" color="blue" leftSection={<IconPlus size={16}/>} onClick={() => setNewDeviceModal(true)}>Novo Equipamento</Button>
          
          <input type="file" ref={bgInputRef} style={{ display: 'none' }} accept="image/png,image/jpeg" onChange={(e) => handleUploadBackground(e.target.files[0])} />
          <input type="file" ref={zabbixInputRef} style={{ display: 'none' }} accept="application/json" onChange={(e) => handleUploadZabbix(e.target.files[0])} />
          
          <Menu shadow="xl" width={220} position="bottom-end" radius="md" withArrow>
            <Menu.Target>
              <Button variant="default" leftSection={<IconSettings size={16}/>}>Ferramentas</Button>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Construção do Mapa</Menu.Label>
              <Menu.Item leftSection={<IconPlus size={14}/>} onClick={handleAddManualZone}>Novo Setor</Menu.Item>
              
              <Menu.Item leftSection={<IconPhoto size={14}/>} onClick={() => bgInputRef.current?.click()}>
                Alterar Planta (Fundo)
              </Menu.Item>
              
              {bgImage && <Menu.Item color="red" leftSection={<IconTrash size={14}/>} onClick={handleClearBackground}>Remover Planta</Menu.Item>}
              
              <Menu.Divider />
              <Menu.Label>Integração</Menu.Label>
              
              <Menu.Item leftSection={<IconUpload size={14}/>} onClick={() => zabbixInputRef.current?.click()}>
                Importar Zabbix (.json)
              </Menu.Item>

              <Menu.Divider />
              <Menu.Label color="red">Ações de Risco</Menu.Label>
              <Menu.Item color="orange" leftSection={<IconRefresh size={14}/>} onClick={handleClearLinks}>Limpar Ligações</Menu.Item>
              <Menu.Item color="red" leftSection={<IconTrash size={14}/>} onClick={handleClearTopology}>Limpar Todo o Mapa</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      <Modal 
         opened={!!pingTerminalIp} 
         onClose={() => setPingTerminalIp(null)} 
         title={<Text fw={900} c="green.6" style={{ fontFamily: 'monospace' }}>&gt;_ Terminal TechFlow: {pingTerminalIp}</Text>} 
         size="lg" 
         centered
         styles={{ header: { backgroundColor: '#141517' }, body: { backgroundColor: '#141517' }, close: { color: 'white' } }}
      >
         <ScrollArea h={350} style={{ backgroundColor: '#000', borderRadius: 8, padding: 16 }}>
            <Stack gap={2}>
               {pingLogs.map((log, i) => (
                  <Text key={i} size="sm" style={{ fontFamily: 'monospace', color: log.includes('ERRO') || log.includes('esgotado') ? '#ff5252' : '#40c057' }}>
                     {log}
                  </Text>
               ))}
               <div ref={terminalEndRef} />
            </Stack>
         </ScrollArea>
         <Group justify="flex-end" mt="md">
             <Button color="red" variant="subtle" leftSection={<IconPlayerStop size={16} />} onClick={() => setPingTerminalIp(null)}>Parar Monitoramento</Button>
         </Group>
      </Modal>

      <Modal opened={loginModal.opened} onClose={() => setLoginModal({ ...loginModal, opened: false })} title={<Text fw={900}>Autenticação SSH</Text>} centered>
        <Stack gap="md">
          <TextInput label="Usuário" value={loginModal.username} onChange={(e) => setLoginModal({...loginModal, username: e.target.value})} autoFocus />
          <TextInput label="Senha" type="password" value={loginModal.password} onChange={(e) => setLoginModal({...loginModal, password: e.target.value})} />
          <Button color="dark" onClick={() => {
            setTerminalConfig({ ip: loginModal.ip, username: loginModal.username, password: loginModal.password });
            setLoginModal({ ...loginModal, opened: false });
          }}>Conectar ao Terminal</Button>
        </Stack>
      </Modal>

      <Modal 
        opened={!!terminalConfig} 
        onClose={() => setTerminalConfig(null)} 
        title={<Text fw={900} c="green.4" style={{ fontFamily: 'monospace' }}>&gt;_ Acesso Remoto: {terminalConfig?.ip}</Text>} 
        size="xl" 
        centered
        styles={{ header: { backgroundColor: '#141517' }, body: { backgroundColor: '#141517' }, close: { color: 'white' } }}
      >
        {terminalConfig && (
          <WebTerminal ip={terminalConfig.ip} username={terminalConfig.username} password={terminalConfig.password} />
        )}
      </Modal>

      <Modal opened={newDeviceModal} onClose={() => setNewDeviceModal(false)} title={<Text fw={900}>Cadastrar Novo Equipamento</Text>} centered>
        <Stack gap="md">
          <TextInput label="Nome do Dispositivo" placeholder={isAPMap ? "Ex: AP-WIFI" : "Ex: SW-NOVO"} value={newData.name} onChange={(e) => setNewData({...newData, name: e.target.value})} />
          <TextInput label="Endereço IP" placeholder="Ex: 10.20.99.100" value={newData.ip} onChange={(e) => setNewData({...newData, ip: e.target.value})} />
          <Button color={BRAND_BLUE} onClick={handleAddManualDevice} leftSection={<IconCheck size={16} />}>Adicionar ao Mapa</Button>
        </Stack>
      </Modal>

      <Modal opened={!!selectedDevice} onClose={() => setSelectedDevice(null)} title={<Text fw={900}>Gerenciar Equipamento</Text>} centered>
        {selectedDevice && (
          <Stack gap="md">
            <TextInput label="Nome do Equipamento" value={editName} onChange={(e) => setEditName(e.target.value)} />
            <TextInput label="Endereço IP" value={editIp} onChange={(e) => setEditIp(e.target.value)} />
            {!isAPMap && <TextInput label="Nobreak Conectado" value={editNobreak} onChange={(e) => setEditNobreak(e.target.value)} leftSection={<IconPlug size={16} />} />}
            
            <Button color={BRAND_BLUE} onClick={async () => {
              try {
                await updateDeviceNetworkInfo(selectedDevice.data.id, editName, editIp, editNobreak);
                setNodes((nds) => nds.map((node) => node.id === selectedDevice.id ? { ...node, data: { ...node.data, label: editName, ip: editIp, nobreak: editNobreak } } : node));
                setSelectedDevice(null);
              } catch (error) { alert("Erro ao salvar!"); }
            }} leftSection={<IconCheck size={16} />}>Salvar Informações</Button>
            
            <Divider variant="dashed" />
            <Text fw={700} size="sm" c="dimmed">FERRAMENTAS DE DIAGNÓSTICO</Text>
            
            <Stack gap="sm">
              <Button 
                component="a" 
                href={getWebAccessUrl()} 
                target="_blank" 
                disabled={!editIp && !(isAPMap && editName.toLowerCase().includes('ubiquiti'))} 
                leftSection={<IconWorldWww size={18} />} 
                variant="default"
              >
                {!isAPMap ? 'Acesso Web' : (editName.toLowerCase().includes('ubiquiti') ? 'Unifi Controller' : 'Painel Aruba')}
              </Button>
              
              {isAPMap ? (
                <Button 
                  onClick={() => {
                    setSelectedDevice(null);
                    setPingTerminalIp(editIp); 
                  }} 
                  disabled={!editIp} 
                  leftSection={<IconTerminal2 size={18} />} 
                  color="dark"
                >
                  Inspecionar (Ping)
                </Button>
              ) : (
                <Group grow>
                  <Button 
                    onClick={() => {
                      setSelectedDevice(null);
                      setLoginModal({ opened: true, ip: editIp, username: '', password: '' });
                    }} 
                    disabled={!editIp} 
                    leftSection={<IconTerminal2 size={18} />} 
                    color="dark"
                  >
                    SSH
                  </Button>
                  <Button 
                    component="a" 
                    href={`telnet://${editIp}`} 
                    disabled={!editIp} 
                    leftSection={<IconTerminal2 size={18} />} 
                    color="dark"
                  >
                    Telnet
                  </Button>
                </Group>
              )}
            </Stack>

            <Button color="red" variant="subtle" mt="sm" onClick={async () => {
                if(window.confirm(`Tem certeza que deseja excluir o ${selectedDevice.data.label} do sistema?`)) {
                  try {
                    await deleteDevice(selectedDevice.data.id);
                    setNodes((nds) => nds.filter((n) => n.id !== selectedDevice.id));
                    setEdges((eds) => eds.filter((e) => e.source !== selectedDevice.id && e.target !== selectedDevice.id));
                    setSelectedDevice(null);
                  } catch(e) { alert("Erro ao excluir. A máquina pode ter amarras."); }
                }
              }} leftSection={<IconTrash size={16}/>}>Apagar do Banco de Dados</Button>
          </Stack>
        )}
      </Modal>

      <Modal opened={!!selectedZone} onClose={() => setSelectedZone(null)} title={<Text fw={900}>Editar Setor</Text>} centered size="sm">
        {selectedZone && (
          <Stack gap="md">
            <TextInput label="Nome do Setor" value={editZoneName} onChange={(e) => setEditZoneName(e.target.value)} />
            <Button color={BRAND_BLUE} onClick={async () => {
              await updateMapZone(selectedZone.data.id, { name: editZoneName, context: currentContext });
              setNodes((nds) => nds.map((n) => n.id === selectedZone.id ? { ...n, data: { ...n.data, label: editZoneName } } : n));
              setSelectedZone(null);
            }}>Salvar Nome</Button>
            <Button color="red" variant="subtle" onClick={async () => {
              await deleteMapZone(selectedZone.data.id);
              setNodes((nds) => nds.filter((n) => n.id !== selectedZone.id));
              setSelectedZone(null);
            }} leftSection={<IconTrash size={16}/>}>Excluir Setor</Button>
          </Stack>
        )}
      </Modal>

      <div style={{ width: '100%', height: '65vh', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          onNodesChange={onNodesChange} 
          onEdgesChange={onEdgesChange} 
          onNodeDragStop={onNodeDragStop} 
          onConnect={onConnect} 
          onEdgesDelete={onEdgesDelete} 
          onNodesDelete={onNodesDelete}   
          onNodeClick={onNodeClick} 
          nodeTypes={nodeTypes} 
          fitView
          nodesDraggable={!isLocked}     
          nodesConnectable={!isLocked}   
          elementsSelectable={true}      
        >
          <Controls />
          <Background variant="dots" gap={16} size={1} color="#adb5bd" />
        </ReactFlow>
      </div>
    </div>
  );
}