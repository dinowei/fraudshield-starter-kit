// backend/utils/logger.js
const { createLogger, transports, format } = require('winston');

module.exports = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
        format.timestamp(),
        format.printf(
            ({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`
        )
    ),
    transports: [new transports.Console()],
});
