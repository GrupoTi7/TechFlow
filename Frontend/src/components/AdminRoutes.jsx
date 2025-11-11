// src/components/AdminRoutes.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingOverlay } from '@mantine/core'; // Para um ecrã de loading

const AdminRoutes = () => {
  const { user } = useAuth();

  // Se o 'user' ainda não foi carregado (estado inicial)
  if (user === undefined) {
    return <LoadingOverlay visible={true} />; // Mostra um ecrã de loading
  }

  // Se não há usuário (não logado)
  if (!user) {
    return <Navigate to="/login" />;
  }

  // --- Defina aqui os seus nomes de utilizador Admin ---
  const isAdmin = user.username === 'sync' || user.username === 'vinicius.izidoro';
  // ----------------------------------------------------

  if (isAdmin) {
    return <Outlet />; // Permite o acesso à rota filha (ex: AdminSetorPage)
  } else {
    // Se for um utilizador logado, mas NÃO for admin,
    // envia-o para o dashboard.
    return <Navigate to="/dashboard" />;
  }
};

export default AdminRoutes;