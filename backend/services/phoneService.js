// Arquivo: backend/services/phoneService.js

// 1. Importa a biblioteca do Twilio
const twilio = require('twilio');

/**
 * Verifica um número de telefone usando a API Twilio Lookup.
 * @param {string} phoneNumber - O número de telefone a ser verificado, em formato E.164 (ex: +5511999998888).
 * @returns {Promise<object>} Um objeto com os dados do telefone ou um erro.
 */
async function checkPhoneNumber(phoneNumber) {
    console.log(`Iniciando verificação de telefone para: ${phoneNumber}`);

    // ===================================================================
    // === MODIFICAÇÃO APLICADA AQUI ===
    // Movemos a leitura das credenciais e a inicialização do cliente
    // para DENTRO da função. Isso garante que as credenciais mais
    // recentes do .env sejam usadas a cada chamada.
    // ===================================================================
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    // Validação básica de entrada
    if (!accountSid || !authToken) {
        console.error('Credenciais do Twilio (ACCOUNT_SID ou AUTH_TOKEN) não encontradas no .env');
        throw new Error('Serviço de verificação de telefone não configurado.');
    }

    if (!phoneNumber) {
        throw new Error('Número de telefone é obrigatório.');
    }

    // Adicionamos um log de depuração para ter 100% de certeza
    console.log('--- DEBUG TWILIO ---');
    console.log('Usando Account SID:', accountSid);
    console.log('Usando Auth Token:', authToken ? authToken.substring(0, 4) + '...' : 'NÃO ENCONTRADO'); // Mostra só o início do token por segurança
    console.log('--------------------');

    // Inicializa o cliente AQUI, a cada chamada
    const client = twilio(accountSid, authToken);

    try {
        const phoneData = await client.lookups.v2.phoneNumbers(phoneNumber).fetch({ fields: 'line_type_intelligence' });

        console.log('Telefone verificado com sucesso pelo Twilio.');

        // Formata a resposta
        const result = {
            isSafe: true,
            source: 'Twilio Lookup',
            details: {
                phoneNumber: phoneData.phoneNumber,
                countryCode: phoneData.countryCode,
                nationalFormat: phoneData.nationalFormat,
                isValid: phoneData.valid,
                validationErrors: phoneData.validationErrors,
            }
        };

        if (phoneData.lineTypeIntelligence) {
            result.details.carrierName = phoneData.lineTypeIntelligence.carrier_name;
            result.details.lineType = phoneData.lineTypeIntelligence.type;
        }

        return result;

    } catch (error) {
        console.error('Erro ao consultar a API do Twilio:', error.message);

        if (error.status === 404) {
            throw new Error('O número de telefone não foi encontrado ou é inválido.');
        }
        throw new Error('Falha na comunicação com o serviço de verificação de telefone.');
    }
}

module.exports = {
    checkPhoneNumber,
};
