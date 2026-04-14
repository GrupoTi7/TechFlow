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
import ReportsPage from './pages/ReportsPage.jsx';
import AdminSetorPage from './pages/AdminSetorPage.jsx';
import AdminRoutes from './components/AdminRoutes.jsx';
import ServicesPage from './pages/ServicesPage.jsx'; 

// 🟢 IMPORTAÇÃO DA NOVA PÁGINA DE CATEGORIAS
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
        element: <App />, 
        children: [
          {
            index: true, 
            element: <HomePage />,
          },
          // 🟢 A NOVA "PORTA DE ENTRADA" DAS CATEGORIAS (Fica ANTES do :id para evitar conflitos)
          {
            path: "devices/categories", 
            element: <DeviceCategoriesPage />,
          },
          // A lista antiga de dispositivos
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