const axios = require('axios');
const FormData = require('form-data');
const SearchHistory = require('../models/SearchHistory');

// ===================================================================
// === FUNÇÃO ATUALIZADA PARA RECEBER E SALVAR O visitorId ===
// ===================================================================
const checkFileSecurity = async (file, userId, visitorId) => { // <<< 1. visitorId recebido como parâmetro
    const apiKey = process.env.VIRUSTOTAL_API_KEY;
    const apiUrl = 'https://www.virustotal.com/api/v3/files';

    try {
        const form = new FormData();
        form.append('file', file.buffer, file.originalname);

        const response = await axios.post(apiUrl, form, {
            headers: {
                ...form.getHeaders(),
                'x-apikey': apiKey,
            },
        });

        const analysisId = response.data.data.id;
        const reportUrl = `https://www.virustotal.com/api/v3/analyses/${analysisId}`;

        // A análise de arquivos pode demorar. Vamos esperar 30 segundos.
        // NOTA: Em uma aplicação de produção, o ideal seria usar um sistema de polling mais inteligente ou webhooks.
        await new Promise(resolve => setTimeout(resolve, 30000));

        const reportResponse = await axios.get(reportUrl, {
            headers: { 'x-apikey': apiKey },
        });

        const stats = reportResponse.data.data.attributes.stats;
        const maliciousCount = stats.malicious + stats.suspicious;
        const isSafe = maliciousCount === 0;

        const resultDetails = {
            source: 'VirusTotal File Scan',
            isSafe: isSafe,
            details: isSafe
                ? 'Nenhuma ameaça encontrada.'
                : `${maliciousCount} de ${stats.harmless + maliciousCount} motores classificaram como malicioso.`,
            stats: stats,
        };

        // Salva o resultado no histórico (se o usuário estiver logado)
        if (userId) { // Adicionado um 'if' para garantir que só salve se houver userId
            try {
                const newHistoryEntry = new SearchHistory({
                    user: userId,
                    visitorId: visitorId, // <<< 2. visitorId adicionado ao registro do histórico
                    searchType: 'file',
                    query: file.originalname,
                    isSafe: isSafe,
                    results: [resultDetails],
                });
                await newHistoryEntry.save();
                console.log('Histórico de análise de arquivo salvo com sucesso!');
            } catch (dbError) {
                console.error('Erro ao salvar histórico do arquivo:', dbError.message);
            }
        }

        return resultDetails;

    } catch (error) {
        console.error('Erro ao chamar API de arquivos do VirusTotal:', error.response ? error.response.data : error.message);
        return {
            source: 'VirusTotal File Scan',
            isSafe: false,
            error: 'Não foi possível analisar o arquivo.',
        };
    }
};

module.exports = { checkFileSecurity };
