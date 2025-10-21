// src/router.jsx
import { createBrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DeviceListPage from './pages/DeviceListPage.jsx';
import DeviceDetailPage from './pages/DeviceDetailPage.jsx';

export const router = createBrowserRouter([
  // --- ROTA PÚBLICA (Sem o layout do AppShell) ---
  {
    path: "/login",
    element: <LoginPage />,
  },

  // --- ROTAS PROTEGIDAS (Com o layout do AppShell) ---
  {
    path: "/",
    element: <ProtectedRoute />, // 1. Verifica se está logado
    children: [
      {
        path: "/",
        element: <App />, // 2. Se sim, mostra o layout (cabeçalho/sidebar)
        children: [
          // 3. E renderiza as páginas filhas dentro do <Outlet> do App
          {
            path: "/",
            element: <HomePage />,
          },
          {
            path: "/devices",
            element: <DeviceListPage />,
          },
          {
            path: "/devices/:id",
            element: <DeviceDetailPage />,
          },
        ]
      }
    ]
  },
]);