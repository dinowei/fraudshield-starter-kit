const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // Importamos o CORS

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Importa nossas rotas
const authRoutes = require('./routes/auth');

const app = express();

// === MIDDLEWARES ESSENCIAIS ===
// Habilita o CORS para permitir que o frontend (rodando em outra porta) acesse o backend
app.use(cors());
// Permite que o servidor entenda JSON enviado no corpo das requisições
app.use(express.json());

// === ROTAS DA APLICAÇÃO ===
// Diz ao Express para usar as rotas de autenticação para qualquer URL que comece com /api/auth
app.use('/api/auth', authRoutes);

// Rota de teste para a raiz da API
app.get('/api', (req, res) => {
    res.send('API do FraudGuard está funcionando!');
});

// Define a porta do servidor
const PORT = process.env.PORT || 3000;

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
