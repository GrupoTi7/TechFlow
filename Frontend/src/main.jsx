// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { AuthProvider } from './context/AuthContext.jsx'; // <-- Importação (correta)

// Importações de CSS
import '@mantine/core/styles.css';
import './index.css';

// Importar o nosso novo Tema e Roteador
import { router } from './router.jsx'; // Importa de router.jsx (correto)
import { theme } from './theme.js';   // Importa do nosso ficheiro de tema (correto)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      
      {/* --- A CORREÇÃO ESTÁ AQUI --- */}
      <AuthProvider> {/* 1. Envolve a aplicação com o "cérebro" */}
        <RouterProvider router={router} />
      </AuthProvider>
      {/* ------------------------- */}

    </MantineProvider>
  </React.StrictMode>,
);