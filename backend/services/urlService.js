// Caminho: backend/services/urlService.js (Versão Limpa Final)

const axios = require('axios');
const SearchHistory = require('../models/SearchHistory');

const checkGoogleSafeBrowsing = async (url) => {
    const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    const apiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;
    try {
        const response = await axios.post(apiUrl, {
            client: { clientId: 'fraudguard-app', clientVersion: '1.0.0' },
            threatInfo: {
                threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
                platformTypes: ['ANY_PLATFORM'],
                threatEntryTypes: ['URL'],
                threatEntries: [{ url: url }]
            }
        });
        if (response.data.matches) {
            return { source: 'Google Safe Browsing', isSafe: false, details: `Ameaça encontrada: ${response.data.matches[0].threatType}` };
        }
        return { source: 'Google Safe Browsing', isSafe: true, details: 'Nenhuma ameaça encontrada.' };
    } catch (error) {
        console.error('Erro ao chamar Google Safe Browsing:', error.message);
        return { source: 'Google Safe Browsing', isSafe: false, details: 'Não foi possível verificar com o Google.' };
    }
};

const checkVirusTotal = async (url) => {
    const apiKey = process.env.VIRUSTOTAL_API_KEY;
    const apiUrl = `https://www.virustotal.com/api/v3/urls`;
    try {
        const submissionResponse = await axios.post(apiUrl, `url=${url}`, {
            headers: { 'x-apikey': apiKey, 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const analysisId = submissionResponse.data.data.id;
        const reportUrl = `https://www.virustotal.com/api/v3/analyses/${analysisId}`;
        await new Promise(resolve => setTimeout(resolve, 15000));
        const reportResponse = await axios.get(reportUrl, { headers: { 'x-apikey': apiKey } });
        const stats = reportResponse.data.data.attributes.stats;
        const maliciousCount = stats.malicious + stats.suspicious;
        if (maliciousCount > 0) {
            return { source: 'VirusTotal', isSafe: false, details: `${maliciousCount} de ${stats.harmless + stats.malicious + stats.suspicious} motores classificaram como malicioso.` };
        }
        return { source: 'VirusTotal', isSafe: true, details: 'Nenhuma ameaça encontrada.' };
    } catch (error) {
        console.error('Erro ao chamar VirusTotal:', error.response ? error.response.data : error.message);
        return { source: 'VirusTotal', isSafe: false, details: 'Não foi possível verificar com o VirusTotal.' };
    }
};

const checkUrlScan = async (url) => {
    const apiKey = process.env.URLSCAN_API_KEY;
    const apiUrl = 'https://urlscan.io/api/v1/scan/';

    try {
        const submissionResponse = await axios.post(apiUrl, {
            url: url,
            visibility: 'public'
        }, {
            headers: {
                'API-Key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (submissionResponse.data && submissionResponse.data.result) {
            return {
                source: 'URLScan.io',
                isSafe: true,
                details: `Análise submetida. Resultado em: ${submissionResponse.data.result}`
            };
        }
        return { source: 'URLScan.io', isSafe: false, details: 'Falha ao submeter URL para análise.' };

    } catch (error) {
        console.error('Erro no URLScan.io:', error.response ? error.response.data.message : error.message);
        return { source: 'URLScan.io', isSafe: false, details: error.response ? error.response.data.message : 'Não foi possível verificar com o URLScan.io.' };
    }
};

const checkUrlSecurity = async (url, userId, visitorId) => {
    console.log(`Iniciando verificação de segurança para: ${url}`);

    const results = await Promise.all([
        checkGoogleSafeBrowsing(url),
        checkVirusTotal(url),
        checkUrlScan(url)
    ]);

    const isOverallSafe = results.every(res => res.isSafe === true);

    if (userId) {
        try {
            const newHistoryEntry = new SearchHistory({
                user: userId,
                visitorId: visitorId,
                searchType: 'url',
                query: url,
                isSafe: isOverallSafe,
                results: results
            });
            await newHistoryEntry.save();
            console.log('Histórico de busca salvo com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar histórico de busca:', error.message);
        }
    }

    return results;
};

module.exports = {
    checkUrlSecurity
};