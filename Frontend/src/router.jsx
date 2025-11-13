// src/router.jsx
import { createBrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DeviceListPage from './pages/DeviceListPage.jsx';
import DeviceDetailPage from './pages/DeviceDetailPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import AdminSetorPage from './pages/AdminSetorPage.jsx';
import AdminRoutes from './components/AdminRoutes.jsx';

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
        element: <App />, 
        children: [
          // 3. E renderiza as páginas filhas dentro do <Outlet> do App
          {
            index: true, // <-- CORRIGIDO (Usa 'index: true' em vez de 'path: "/"')
            element: <HomePage />,
          },
          {
            path: "devices", // <-- CORRIGIDO (Removida a barra '/')
            element: <DeviceListPage />,
          },
          {
            path: 'admin',
            element: <AdminRoutes />, // Protege (Verifica se é ADMIN)
            children: [
              {
                path: 'setores',
                element: <AdminSetorPage />
              }
            ]
          },
          {
            path: "devices/:id", // <-- CORRIGIDO (Removida a barra '/')
            element: <DeviceDetailPage />,
          },
          // { // <-- A ROTA DUPLICADA (LINHAS 41-44) FOI REMOVIDA
          //   path: 'admin/setores',
          //   element: <AdminSetorPage />,
          // },
          {
            path: "history", // <-- CORRIGIDO (Removida a barra '/')
            element: <ReportsPage />, 
          },
        ]
      }
    ]
  },
]);