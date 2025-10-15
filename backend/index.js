// backend/index.js
const mongoose = require('mongoose');
const app = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;

(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        logger.info('MongoDB conectado em ' + mongoose.connection.host);
        app.listen(PORT, () =>
            logger.info(`Servidor rodando na porta ${PORT}`)
        );
    } catch (err) {
        logger.error('Falha ao iniciar servidor:', err);
        process.exit(1);
    }
})();
