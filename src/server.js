
// src/server.js
require('dotenv').config();
const express = require('express');

// Importar os nossos dois ficheiros de rotas
const syncRoutes = require('./routes/sync.routes');
const authRoutes = require('./routes/auth.routes'); // <-- LINHA ADICIONADA

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('API do Projeto TechFlow está no ar!');
});

// Usar as rotas de sincronização com o prefixo /api
app.use('/api', syncRoutes);

// Usar as rotas de autenticação com o prefixo /auth
app.use('/auth', authRoutes); // <-- LINHA ADICIONADA

app.listen(PORT, () => {
  console.log(`Servidor a correr na porta http://localhost:${PORT}`);
});