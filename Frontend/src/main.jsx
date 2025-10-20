// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// 1. Importe o Mantine
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';

// 2. Importe as suas páginas e componentes (como antes)
import App from './App.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DeviceListPage from './pages/DeviceListPage.jsx';
import DeviceDetailPage from './pages/DeviceDetailPage.jsx';
import './index.css'; // O seu CSS global (que agora importa o Tailwind ou CSS Modules)

// 3. O seu router (sem alterações)
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/login", element: <LoginPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "/", element: <HomePage /> },
          { path: "/devices", element: <DeviceListPage /> },
          { path: "/devices/:id", element: <DeviceDetailPage /> },
        ],
      },
    ],
  },
]);

// 4. "Envolva" a sua aplicação com o MantineProvider
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="dark"> {/* <--- MODO ESCURO ATIVADO! */}
      <RouterProvider router={router} />
    </MantineProvider>
  </React.StrictMode>,
);