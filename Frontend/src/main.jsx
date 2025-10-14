// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Importações
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx'; // <-- 1. IMPORTE O GUARDIÃO

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // A rota de login continua pública
      {
        path: "/login",
        element: <LoginPage />,
      },
      // As rotas dentro deste elemento serão protegidas
      {
        element: <ProtectedRoute />, // <-- 2. COLOQUE O GUARDIÃO AQUI
        children: [
          {
            path: "/", // A página inicial agora está protegida
            element: <HomePage />,
          },
          // No futuro, podemos adicionar mais rotas protegidas aqui (ex: /devices)
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