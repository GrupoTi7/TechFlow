// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        // Assumimos que o seu token tem um campo 'username'
        return { username: decodedToken.username, token };
      } catch (e) {
        console.error("Token inválido:", e);
        localStorage.removeItem('authToken');
        return null;
      }
    }
    return null;
  });

  // Memoize o valor para evitar re-renders desnecessários
  const authValue = useMemo(() => ({
    user,
    // (Poderíamos adicionar funções de login/logout aqui, mas por agora mantemos simples)
  }), [user]);

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Este é o "hook" que os nossos componentes vão usar
export const useAuth = () => {
  return useContext(AuthContext);
};