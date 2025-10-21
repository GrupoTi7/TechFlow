// src/router.js
import { createBrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DeviceListPage from './pages/DeviceListPage.jsx';
import DeviceDetailPage from './pages/DeviceDetailPage.jsx';

export const router = createBrowserRouter([
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