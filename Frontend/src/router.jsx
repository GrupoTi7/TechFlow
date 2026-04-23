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
import ReportsPage from './pages/ReportsPage.jsx'; // Dashboard de Relatórios
import HistoryPage from './pages/HistoryPage.jsx'; // Tabela Nova
import AdminSetorPage from './pages/AdminSetorPage.jsx';
import AdminRoutes from './components/AdminRoutes.jsx';
import ServicesPage from './pages/ServicesPage.jsx'; 
import DeviceCategoriesPage from './pages/DeviceCategoriesPage.jsx'; 

export const router = createBrowserRouter([
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
  {
    path: "/",
    element: <ProtectedRoute />, 
    children: [
      {
        path: "scan/:id",
        element: <MobileScanPage />
      },
      {
        path: "/",
        element: <App />, 
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
          // 🟢 DASHBOARD DE RELATÓRIOS VOLTOU PARA A ROTA ORIGINAL
          {
            path: "reports", 
            element: <ReportsPage />, 
          },
          // 🟢 TABELA DE HISTÓRICO FICA NA SUA PRÓPRIA ROTA
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