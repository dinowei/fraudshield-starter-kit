const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');

// Serviços
const { checkUrlSecurity } = require('../services/urlService');
const { checkTextSecurity } = require('../services/textService');
const { checkFileSecurity } = require('../services/fileService');
const { checkIpRisk } = require('../services/ipService');
const { checkMailboxlayer, checkLeakCheck } = require('../services/EmailService'); // <<< 1. IMPORTADO O NOVO SERVIÇO
const SearchHistory = require('../models/SearchHistory');

// Configuração do Multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Rota de URL
router.post('/url', authMiddleware.optional, async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL é obrigatória.' });
    console.log(`Iniciando verificação de URL para: ${url}`);
    const userId = req.user ? req.user.id : null;
    const results = await checkUrlSecurity(url, userId);
    res.json(results);
});

// Rota de IP
router.post('/ip', authMiddleware.optional, async (req, res) => {
    const { ip } = req.body;
    if (!ip) return res.status(400).json({ message: 'IP é obrigatório.' });

    console.log(`Iniciando verificação de risco para o IP: ${ip}`);

    const userId = req.user ? req.user.id : null;
    const result = await checkIpRisk(ip, userId);

    if (userId) {
        try {
            const newHistoryEntry = new SearchHistory({
                user: userId,
                searchType: 'ip',
                query: ip,
                isSafe: !result.isHighRisk,
                results: [result]
            });
            await newHistoryEntry.save();
            console.log('Histórico de análise de IP salvo com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar histórico de análise de IP:', error.message);
        }
    }

    res.json(result);
});

// Rota de Texto
router.post('/text', (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Texto é obrigatório.' });
    console.log(`Iniciando análise de texto.`);
    const result = checkTextSecurity(text);
    res.json(result);
});

// Rota de Arquivo
router.post('/file', authMiddleware.optional, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    }
    console.log(`Iniciando análise do arquivo: ${req.file.originalname}`);
    const userId = req.user ? req.user.id : null;
    const result = await checkFileSecurity(req.file, userId);
    res.json(result);
});

// ===================================================================
// === NOVA ROTA PARA ANÁLISE DE E-MAIL ===
// ===================================================================
router.post('/email', authMiddleware.optional, async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'O campo de e-mail é obrigatório.' });
    }

    console.log(`Iniciando verificação de risco para o e-mail: ${email}`);
    const userId = req.user ? req.user.id : null;

    try {
        // Chama as duas APIs de e-mail em paralelo para otimizar o tempo
        const [mailboxlayerResult, leakcheckResult] = await Promise.all([
            checkMailboxlayer(email),
            checkLeakCheck(email)
        ]);

        // Combina os resultados em um único objeto
        const finalResult = {
            email: email,
            mailboxlayer: mailboxlayerResult,
            leakcheck: leakcheckResult,
        };

        // Lógica para salvar no histórico (pode ser adicionada depois, se necessário)
        if (userId) {
            try {
                const newHistoryEntry = new SearchHistory({
                    user: userId,
                    searchType: 'email',
                    query: email,
                    // A lógica de 'isSafe' para e-mail pode ser mais complexa
                    // Por enquanto, vamos considerar seguro se não for descartável
                    isSafe: mailboxlayerResult.disposable === false,
                    results: [finalResult]
                });
                await newHistoryEntry.save();
                console.log('Histórico de análise de e-mail salvo com sucesso!');
            } catch (error) {
                console.error('Erro ao salvar histórico de análise de e-mail:', error.message);
            }
        }

        res.status(200).json(finalResult);

    } catch (error) {
        console.error('Erro na rota /check/email:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao processar a análise de e-mail.' });
    }
});


module.exports = router;
