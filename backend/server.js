// =================================================================
// IMPORTAÇÕES PRINCIPAIS
// =================================================================
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Conecta ao banco de dados ao iniciar o servidor
connectDB();

// =================================================================
// CONFIGURAÇÃO DOS MIDDLEWARES DE SEGURANÇA
// =================================================================
// Configuração do Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // Janela de 15 minutos
    max: 100, // Limita cada IP a 100 requisições por janela
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Muitas requisições deste IP, por favor, tente novamente após 15 minutos.'
});

// =================================================================
// IMPORTAÇÃO DAS ROTAS
// =================================================================
const authRoutes = require('./routes/auth');
const checkRoutes = require('./routes/check');

const app = express();

// =================================================================
// MIDDLEWARES ESSENCIAIS (AGORA COM SEGURANÇA)
// =================================================================
app.use(helmet()); // Usa o HELMET para proteção geral
app.use(limiter); // Usa o LIMITER para prevenir abuso

// Configuração do CORS para permitir requisições do seu frontend
// A origem 'http://127.0.0.1:5500' é o endereço padrão do Live Server do VS Code.
app.use(cors({ origin: 'http://127.0.0.1:5500' }));

// Middleware para o Express entender requisições com corpo em JSON
app.use(express.json());

// =================================================================
// ROTAS DA APLICAÇÃO
// =================================================================
app.use('/api/auth', authRoutes);
app.use('/api/check', checkRoutes);

// Rota de teste para verificar se a API está no ar
app.get('/api', (req, res) => {
    res.send('API do FraudGuard está funcionando!');
});

// =================================================================
//      CORREÇÃO APLICADA AQUI
// =================================================================
// Define a porta do servidor. Alterado para 5000 para corresponder ao frontend.
const PORT = process.env.PORT || 5000;

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
