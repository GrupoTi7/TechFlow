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
// ... resto do seu código continua igualzinho para baixo