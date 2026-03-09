// src/router.jsx
import { createBrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DeviceListPage from './pages/DeviceListPage.jsx';
import DeviceDetailPage from './pages/DeviceDetailPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import AdminSetorPage from './pages/AdminSetorPage.jsx';
import AdminRoutes from './components/AdminRoutes.jsx';

// --- IMPORTAÇÃO NOVA ---
import ServicesPage from './pages/ServicesPage.jsx'; 

export const router = createBrowserRouter([
  // --- ROTAS PÚBLICAS ---
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
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
        element: <App />, // Layout Principal (Menu Lateral + Header)
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
            path: "history", 
            element: <ReportsPage />, 
          },
          
          // --- NOVA ROTA DE SERVIÇOS ---
          // Substitui a antiga gestão individual de setores
          {
            path: "services",
            // Se quiser proteger estritamente para admins, envolva com <AdminRoutes>
            // Ex: element: <AdminRoutes><ServicesPage /></AdminRoutes>
            element: <ServicesPage />, 
          },

          // --- ROTA LEGADA (ADMIN) ---
          // Mantida por segurança, mas o menu agora aponta para /services
          {
            path: 'admin',
            element: <AdminRoutes />, 
            children: [
              {
                path: 'setores',
                element: <AdminSetorPage />
              }
            ]
          },
        ]
      }
    ]
  },
]);