// Arquivo: backend/services/phoneService.js

// 1. Importa as variáveis de ambiente e a biblioteca do Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

/**
 * Verifica um número de telefone usando a API Twilio Lookup.
 * @param {string} phoneNumber - O número de telefone a ser verificado, em formato E.164 (ex: +5511999998888).
 * @returns {Promise<object>} Um objeto com os dados do telefone ou um erro.
 */
async function checkPhoneNumber(phoneNumber) {
    console.log(`Iniciando verificação de telefone para: ${phoneNumber}`);

    // Validação básica de entrada
    if (!accountSid || !authToken) {
        console.error('Credenciais do Twilio (ACCOUNT_SID ou AUTH_TOKEN) não encontradas no .env');
        throw new Error('Serviço de verificação de telefone não configurado.');
    }

    if (!phoneNumber) {
        throw new Error('Número de telefone é obrigatório.');
    }

    try {
        // ===================================================================
        // === MODIFICAÇÃO APLICADA AQUI ===
        // Adicionamos o parâmetro 'fields' para solicitar os dados da operadora.
        // ===================================================================
        const phoneData = await client.lookups.v2.phoneNumbers(phoneNumber).fetch({ fields: 'line_type_intelligence' });

        console.log('Telefone verificado com sucesso pelo Twilio.');

        // 3. Formata a resposta para o nosso padrão
        const result = {
            isSafe: true, // Consideramos "safe" se o número for válido
            source: 'Twilio Lookup',
            details: {
                phoneNumber: phoneData.phoneNumber,
                countryCode: phoneData.countryCode,
                nationalFormat: phoneData.nationalFormat,
                isValid: phoneData.valid,
                validationErrors: phoneData.validationErrors,
            }
        };

        // A API PODE retornar informações da operadora, se disponíveis
        if (phoneData.lineTypeIntelligence) {
            result.details.carrierName = phoneData.lineTypeIntelligence.carrier_name;
            result.details.lineType = phoneData.lineTypeIntelligence.type; // ex: mobile, landline, voip
        }

        return result;

    } catch (error) {
        console.error('Erro ao consultar a API do Twilio:', error.message);

        // Personaliza a mensagem de erro para o usuário
        if (error.status === 404) {
            throw new Error('O número de telefone não foi encontrado ou é inválido.');
        }
        // Outros erros (credenciais inválidas, etc.)
        throw new Error('Falha na comunicação com o serviço de verificação de telefone.');
    }
}

module.exports = {
    checkPhoneNumber,
};
