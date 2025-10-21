// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';

// Importações de CSS
import '@mantine/core/styles.css';
import './index.css';

// Importar o nosso novo Tema e Roteador
import { router } from './router.jsx'; // Importa de router.jsx (que você renomeou)
import { theme } from './theme.js';   // Importa do nosso ficheiro de tema

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* O Provider FICA AQUI, no topo, e com o defaultColorScheme
      para que o App.jsx possa LER o valor.
    */}
    <MantineProvider theme={theme} defaultColorScheme="light">
      <RouterProvider router={router} />
    </MantineProvider>
  </React.StrictMode>,
);