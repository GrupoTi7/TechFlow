// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute() {
  // Verifica se o token de autenticação existe no armazenamento local
  const token = localStorage.getItem('authToken');

  // Se não houver token, redireciona o usuário para a página de login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Se houver um token, renderiza a página que está a ser protegida (usando o Outlet)
  return <Outlet />;
}

export default ProtectedRoute;