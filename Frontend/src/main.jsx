// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Importações de todas as nossas páginas
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DeviceListPage from './pages/DeviceListPage.jsx';
import DeviceDetailPage from './pages/DeviceDetailPage.jsx'; // A página que estava em falta na rota

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // Rota pública
      {
        path: "/login",
        element: <LoginPage />,
      },
      // Rota "guardiã" que protege todas as rotas filhas
      {
        element: <ProtectedRoute />,
        children: [
          // Rotas Protegidas
          {
            path: "/",
            element: <HomePage />,
          },
          {
            path: "/devices",
            element: <DeviceListPage />,
          },
          {
            // A ROTA QUE ESTAVA EM FALTA
            path: "/devices/:id", 
            element: <DeviceDetailPage />,
          },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);