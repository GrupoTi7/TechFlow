// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Hook para navegação
import { login } from '../services/api'; // Importa a nossa função de login

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Inicializa o hook de navegação

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!username || !password) {
      setError('Nome de usuário e senha são obrigatórios.');
      return;
    }

    try {
      // Chama a nossa função de API
      const data = await login(username, password);

      if (data.success && data.token) {
        // Se o login for bem-sucedido, guarda o token no armazenamento local do navegador
        localStorage.setItem('authToken', data.token);
        console.log('Login bem-sucedido! Redirecionando...');
        // Redireciona o usuário para a página inicial
        navigate('/');
      }
    } catch (err) {
      // Se a API retornar um erro (ex: 401 Credenciais inválidas), mostra a mensagem
      setError(err.message || 'Falha na autenticação.');
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Usuário:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password">Senha:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}

export default LoginPage;