// backend/app.js

// 1. Importa o 'path' para lidar com caminhos de arquivo de forma segura
const path = require('path');

// 2. Configura o dotenv-safe de forma explícita e robusta
const result = require('dotenv-safe').config({
    allowEmptyValues: true,
    // Garante que ele SEMPRE procure o .env na pasta raiz do projeto (um nível acima de 'backend')
    path: path.resolve(__dirname, '..', '.env'),
    // Garante que ele SEMPRE procure o .env.example na pasta raiz
    example: path.resolve(__dirname, '..', '.env.example')
});

// 3. LOG DE DEBUG: Mostra qual arquivo foi carregado.
// Se 'result.error' existir, algo deu errado.
if (result.error) {
    console.error('ERRO AO CARREGAR O ARQUIVO .env:', result.error.message);
} else {
    console.log('Arquivo .env carregado com sucesso.');
    // Vamos verificar a chave da Twilio especificamente
    console.log('DEBUG app.js -> TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? process.env.TWILIO_AUTH_TOKEN.substring(0, 4) + '...' : 'NÃO ENCONTRADO NO app.js');
}


// O resto do seu código original continua aqui...
const express = require('express');
const setupMiddleware = require('./middleware/setupMiddleware');
const routes = require('./routes');
const logger = require('./utils/logger');

const app = express();

// Configura todos os middlewares de uma vez
setupMiddleware(app);

// Log de requisições
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
});

// Rotas da aplicação
app.use('/api/auth', routes.auth);
app.use('/api/check', routes.check);

// Health check
app.get('/health', (req, res) => {
    logger.info('Health check solicitado.');
    res.json({ status: 'ok', uptime: process.uptime() });
});

module.exports = app;
