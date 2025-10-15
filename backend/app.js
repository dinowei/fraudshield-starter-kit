// backend/app.js
const express = require('express');
require('dotenv-safe').config();
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
