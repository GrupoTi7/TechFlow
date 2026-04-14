import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';;
import { io } from 'socket.io-client';

export default function WebTerminal({ ip, username, password }) {
  const terminalRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Inicializa a interface do Terminal
    const term = new Terminal({
      cursorBlink: true,
      theme: { background: '#1e1e1e' },
      fontFamily: 'monospace',
      fontSize: 14
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    term.writeln(`Iniciando handshake seguro com ${ip}...`);

    // Conecta ao Backend via WebSocket (ajuste a URL se precisar)
    const socket = io('http://localhost:3000'); 
    socketRef.current = socket;

    // Envia credenciais para o backend iniciar o SSH
    socket.emit('start-ssh', { ip, username, password });

    // Recebe dados do Backend (o que o Switch responde) e escreve na tela
    socket.on('data', (data) => {
      term.write(data);
    });

    // Captura o que o usuário digita na tela e envia para o Backend
    term.onData((data) => {
      socket.emit('data', data);
    });

    // Lida com o redimensionamento da janela
    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      socket.disconnect();
      term.dispose();
    };
  }, [ip, username, password]);

  return (
    <div 
      ref={terminalRef} 
      style={{ width: '100%', height: '400px', backgroundColor: '#1e1e1e', padding: '10px', borderRadius: '8px' }} 
    />
  );
}