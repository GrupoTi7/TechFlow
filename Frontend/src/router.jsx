// src/router.jsx
import { createBrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
// --- NOVAS PÁGINAS (Crie estes arquivos se ainda não existirem) ---
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
// ------------------------------------------------------------------
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DeviceListPage from './pages/DeviceListPage.jsx';
import DeviceDetailPage from './pages/DeviceDetailPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import AdminSetorPage from './pages/AdminSetorPage.jsx';
import AdminRoutes from './components/AdminRoutes.jsx';

export const router = createBrowserRouter([
  // --- ROTAS PÚBLICAS (Acessíveis sem login) ---
  {
    path: "/login",
    element: <LoginPage />,
  },
  // --- NOVA ROTA: Esqueci a Senha ---
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  // --- NOVA ROTA: Redefinir Senha (com Token) ---
  {
    path: "/reset-password/:token",
    element: <ResetPasswordPage />,
  },

  // --- ROTAS PROTEGIDAS (Exigem Login) ---
  {
    path: "/",
    element: <ProtectedRoute />, 
    children: [
      {
        path: "/",
        element: <App />, 
        children: [
          {
            index: true, 
            element: <HomePage />,
          },
          {
            path: "devices", 
            element: <DeviceListPage />,
          },
          {
            path: "devices/:id", 
            element: <DeviceDetailPage />,
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
            path: "history", 
            element: <ReportsPage />, 
          },
        ]
      }
    ]
  },
]);