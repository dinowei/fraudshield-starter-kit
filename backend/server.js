const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

connectDB(); // Conecta ao banco de dados ao iniciar o servidor

// =================================================================
// IMPORTAÇÃO DAS ROTAS
// =================================================================
const authRoutes = require('./routes/auth');
const checkRoutes = require('./routes/check'); // <-- 1. IMPORTAMOS A NOVA ROTA DE VERIFICAÇÃO

const app = express();

// =================================================================
// MIDDLEWARES ESSENCIAIS
// =================================================================
app.use(cors());
app.use(express.json()); // Permite que o servidor entenda JSON no corpo das requisições

// =================================================================
// ROTAS DA APLICAÇÃO
// =================================================================
app.use('/api/auth', authRoutes);
app.use('/api/check', checkRoutes); // <-- 2. DIZEMOS AO SERVIDOR PARA USAR A NOVA ROTA

// Rota de teste para verificar se a API está no ar
app.get('/api', (req, res) => {
    res.send('API do FraudGuard está funcionando!');
});

// Define a porta do servidor, usando a do .env ou a 3000 como padrão
const PORT = process.env.PORT || 3000;

// Inicia o servidor e fica "escutando" por requisições
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
