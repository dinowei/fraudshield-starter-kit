const axios = require('axios');

// Carrega as chaves de API do arquivo .env
const mailboxlayerApiKey = process.env.MAILBOXLAYER_API_KEY;
// A chave do LeakCheck não é mais necessária para a API pública, mas podemos mantê-la aqui.
const leakcheckApiKey = process.env.LEAKCHECK_API_KEY;

/**
 * Verifica a validade técnica de um e-mail usando a API Mailboxlayer.
 * @param {string} email O endereço de e-mail a ser verificado.
 * @returns {Promise<object>} Os dados da API ou um objeto de erro.
 */
const checkMailboxlayer = async (email) => {
    if (!mailboxlayerApiKey) {
        console.error('Erro: A chave da API do Mailboxlayer não foi encontrada.');
        return { error: true, message: 'Chave da API do Mailboxlayer não configurada no servidor.' };
    }

    try {
        const response = await axios.get('http://apilayer.net/api/check', {
            params: {
                access_key: mailboxlayerApiKey,
                email: email,
                smtp: 1,
                format: 1
            }
        });
        return response.data;
    } catch (error) {
        console.error('Erro ao verificar e-mail no Mailboxlayer:', error.response ? error.response.data : error.message);
        return { error: true, message: 'Não foi possível verificar o e-mail no Mailboxlayer.' };
    }
};

/**
 * Verifica se um e-mail apareceu em vazamentos de dados usando a API PÚBLICA do LeakCheck.
 * @param {string} email O endereço de e-mail a ser verificado.
 * @returns {Promise<object>} Os dados da API ou um objeto de erro.
 */
const checkLeakCheck = async (email) => {
    // ===================================================================
    // === CÓDIGO ATUALIZADO PARA USAR A API PÚBLICA E GRATUITA ===
    // ===================================================================
    try {
        // A chamada agora é para a API pública e não requer chave (key)
        const response = await axios.get('https://leakcheck.io/api/public', {
            params: {
                check: email,
                type: 'email'
            }
        });
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 429) {
            console.warn('Limite de requisições da API Pública do LeakCheck atingido.');
            return { error: true, limit_reached: true, message: 'Limite diário da API Pública do LeakCheck atingido.' };
        }
        console.error('Erro ao verificar e-mail no LeakCheck (API Pública):', error.response ? error.response.data : error.message);
        return { error: true, message: 'Não foi possível verificar o e-mail no LeakCheck.' };
    }
};

module.exports = {
    checkMailboxlayer,
    checkLeakCheck,
};