// Caminho do arquivo: backend/services/ipService.js

const axios = require('axios');
require('dotenv').config();

// Função para consultar a API do IPQualityScore
const checkIpRisk = async (ip) => {
    const apiKey = process.env.IPQS_API_KEY;
    const apiUrl = `https://www.ipqualityscore.com/api/json/ip/${apiKey}/${ip}`;

    try {
        const { data } = await axios.get(apiUrl);

        if (!data.success) {
            throw new Error(data.message || 'A API do IPQS retornou um erro.');
        }

        // LÓGICA DE ALTO RISCO MELHORADA: considera score, proxy, vpn ou tor.
        const isHighRisk = data.fraud_score >= 75 || data.proxy || data.vpn || data.tor;

        // Retorna um objeto formatado com TODAS as informações úteis
        return {
            source: 'IPQualityScore',
            isHighRisk: isHighRisk, // Usando a lógica melhorada
            details: {
                fraudScore: data.fraud_score,
                countryCode: data.country_code, // NOME CORRETO para o frontend
                city: data.city,
                isp: data.ISP,
                isProxy: data.proxy,
                isVpn: data.vpn,
                isTor: data.tor,
                isBot: data.bot_status,
                recentAbuse: data.recent_abuse
            }
        };

    } catch (error) {
        console.error('Erro ao chamar IPQualityScore:', error.message);
        return { source: 'IPQualityScore', error: 'Não foi possível verificar o IP com o IPQS.' };
    }
};

module.exports = {
    checkIpRisk
};
