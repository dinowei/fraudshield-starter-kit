// utils/axiosRetry.js
const axios = require('axios');
const axiosRetry = require('axios-retry');
const logger = require('./logger');

function createHttpClient(baseURL, headers = {}) {
    const client = axios.create({ baseURL, headers, timeout: 10000 });

    axiosRetry(client, {
        retries: 3,
        retryDelay: axiosRetry.exponentialDelay,
        retryCondition: axiosRetry.isNetworkOrIdempotentRequestError,
        onRetry: (retryCount, error, requestConfig) => {
            logger.warn(
                `Tentando novamente (${retryCount}) para: ${requestConfig.url} - Motivo: ${error && error.message}`
            );
        }
    });

    client.interceptors.response.use(
        res => res,
        err => {
            logger.error(
                `Erro HTTP (${err.response ? err.response.status : 'sem resposta'}): ${err.message}`
            );
            return Promise.reject(err);
        }
    );

    return client;
}

module.exports = { createHttpClient };
