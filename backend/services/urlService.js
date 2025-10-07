// Caminho do arquivo: backend/services/urlService.js

const axios = require('axios');
const SearchHistory = require('../models/SearchHistory');

// Função para chamar a API do Google Safe Browsing (SEU CÓDIGO ORIGINAL)
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
        return { source: 'Google Safe Browsing', error: 'Não foi possível verificar com o Google.' };
    }
};

// Função para chamar a API do VirusTotal (SEU CÓDIGO ORIGINAL)
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
        return { source: 'VirusTotal', error: 'Não foi possível verificar com o VirusTotal.' };
    }
};

// ===================================================================
// === FUNÇÃO ATUALIZADA PARA URLSCAN.IO (COM SCREENSHOT) ===
// ===================================================================
const checkUrlScan = async (url) => {
    const apiKey = process.env.URLSCAN_API_KEY;
    const domain = new URL(url).hostname;
    const apiUrl = `https://urlscan.io/api/v1/search/?q=domain:${domain}`;

    try {
        const { data } = await axios.get(apiUrl, {
            headers: { 'API-Key': apiKey }
        });

        if (data.results && data.results.length > 0) {
            const maliciousScan = data.results.find(
                result => result.verdicts?.overall?.malicious
            );

            if (maliciousScan) {
                // Retorna um objeto 'details' mais rico com a mensagem e o screenshot
                return {
                    source: 'URLScan.io',
                    isSafe: false,
                    details: {
                        message: 'Veredito malicioso encontrado em varreduras recentes.',
                        screenshot: maliciousScan.screenshot // <<< URL DO SCREENSHOT INCLUÍDA
                    }
                };
            }
        }
        return { source: 'URLScan.io', isSafe: true, details: 'Nenhuma varredura recente com veredito malicioso.' };
    } catch (error) {
        console.error('Erro no URLScan.io:', error.message);
        return { source: 'URLScan.io', error: 'Não foi possível verificar com o URLScan.io.' };
    }
};


// Função principal que orquestra as chamadas E SALVA NO BANCO (ATUALIZADA)
const checkUrlSecurity = async (url, userId) => {
    console.log(`Iniciando verificação de segurança para: ${url}`);

    // Chama as TRÊS APIs em paralelo
    const results = await Promise.all([
        checkGoogleSafeBrowsing(url),
        checkVirusTotal(url),
        checkUrlScan(url) // <<< NOVA API ADICIONADA AQUI
    ]);

    const isOverallSafe = results.every(res => res.isSafe === true);

    if (userId) {
        try {
            const newHistoryEntry = new SearchHistory({
                user: userId,
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
