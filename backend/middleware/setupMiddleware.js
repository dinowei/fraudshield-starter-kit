// setupMiddleware.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

function setupMiddleware(app) {
    app.use(express.json({ limit: '10mb' }));
    app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));
    app.use(helmet());
    app.use(
        rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 100,
            standardHeaders: true,
            legacyHeaders: false,
            message: 'Muitas requisições deste IP, tente novamente em 15 minutos.',
        })
    );
}

module.exports = setupMiddleware;
