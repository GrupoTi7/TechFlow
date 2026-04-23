// src/router.jsx
import { createBrowserRouter } from 'react-router-dom';
import MobileScanPage from './pages/MobileScanPage.jsx';
import App from './App.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DeviceListPage from './pages/DeviceListPage.jsx';
import DeviceDetailPage from './pages/DeviceDetailPage.jsx';

// 🟢 AQUI ESTÁ A MUDANÇA: Importando a nova página de Histórico que criámos!
import HistoryPage from './pages/HistoryPage.jsx'; 

import AdminSetorPage from './pages/AdminSetorPage.jsx';
import AdminRoutes from './components/AdminRoutes.jsx';
import ServicesPage from './pages/ServicesPage.jsx'; 
import DeviceCategoriesPage from './pages/DeviceCategoriesPage.jsx'; 

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
      
      // 🟢 ROTA MOBILE ISOLADA
      {
        path: "scan/:id",
        element: <MobileScanPage />
      },

      // 🔵 ROTAS NORMAIS DO SISTEMA
      {
        path: "/",
        element: <App />, // Layout Principal (Menu Lateral + Header)
        children: [
          {
            index: true, 
            element: <HomePage />,
          },
          {
            path: "devices/categories", 
            element: <DeviceCategoriesPage />,
          },
          {
            path: "devices", 
            element: <DeviceListPage />,
          },
          {
            path: "devices/:id", 
            element: <DeviceDetailPage />,
          },
          // 🟢 AQUI ESTÁ A LIGAÇÃO: Agora a rota "/history" abre a nossa página nova!
          {
            path: "history", 
            element: <HistoryPage />, 
          },
          {
            path: "services",
            element: <ServicesPage />, 
          },
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