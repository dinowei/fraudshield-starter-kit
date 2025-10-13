const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');

// Serviços
const { checkUrlSecurity } = require('../services/urlService');
const { checkTextSecurity } = require('../services/textService');
const { checkFileSecurity } = require('../services/fileService');
const { checkIpRisk } = require('../services/ipService');
const { checkMailboxlayer, checkLeakCheck } = require('../services/EmailService');
const documentService = require('../services/documentService');
const phoneService = require('../services/phoneService'); // <<< 1. IMPORTADO O NOVO SERVIÇO
const SearchHistory = require('../models/SearchHistory');

// Configuração do Multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Rota de URL
router.post('/url', authMiddleware.optional, async (req, res) => {
    const { url, visitorId } = req.body;
    if (!url) return res.status(400).json({ message: 'URL é obrigatória.' });
    console.log(`Iniciando verificação de URL para: ${url}`);
    const userId = req.user ? req.user.id : null;
    const results = await checkUrlSecurity(url, userId, visitorId);
    res.json(results);
});

// Rota de IP
router.post('/ip', authMiddleware.optional, async (req, res) => {
    const { ip, visitorId } = req.body;
    if (!ip) return res.status(400).json({ message: 'IP é obrigatório.' });
    console.log(`Iniciando verificação de risco para o IP: ${ip}`);
    const userId = req.user ? req.user.id : null;
    const result = await checkIpRisk(ip, userId);
    if (userId) {
        try {
            const newHistoryEntry = new SearchHistory({
                user: userId,
                visitorId: visitorId,
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
    const { visitorId } = req.body;
    console.log(`Iniciando análise do arquivo: ${req.file.originalname}`);
    const userId = req.user ? req.user.id : null;
    const result = await checkFileSecurity(req.file, userId, visitorId);
    res.json(result);
});

// Rota de E-mail
router.post('/email', authMiddleware.optional, async (req, res) => {
    const { email, visitorId } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'O campo de e-mail é obrigatório.' });
    }
    console.log(`Iniciando verificação de risco para o e-mail: ${email}`);
    const userId = req.user ? req.user.id : null;
    try {
        const [mailboxlayerResult, leakcheckResult] = await Promise.all([
            checkMailboxlayer(email),
            checkLeakCheck(email)
        ]);
        const finalResult = {
            email: email,
            mailboxlayer: mailboxlayerResult,
            leakcheck: leakcheckResult,
        };
        if (userId) {
            try {
                const newHistoryEntry = new SearchHistory({
                    user: userId,
                    visitorId: visitorId,
                    searchType: 'email',
                    query: email,
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

// Rota de Documentos
router.post('/document', authMiddleware.optional, async (req, res) => {
    const { document, visitorId } = req.body;
    const user = req.user;

    try {
        if (!document) {
            return res.status(400).json({ message: 'Número do documento é obrigatório.' });
        }
        const result = await documentService.checkDocument(document);
        if (user || visitorId) {
            const historyEntry = new SearchHistory({
                user: user ? user.id : null,
                visitorId: visitorId,
                searchType: 'document',
                query: document,
                isSafe: result.isSafe,
                results: {
                    source: result.source,
                    details: result.details
                }
            });
            await historyEntry.save();
            console.log('Histórico de análise de documento salvo com sucesso!');
        }
        res.status(200).json(result);
    } catch (error) {
        console.error(`Erro na rota /check/document:`, error.message);
        res.status(400).json({ message: error.message || 'Ocorreu um erro inesperado ao processar o documento.' });
    }
});

// ===================================================================
// === 2. NOVA ROTA PARA ANÁLISE DE TELEFONE ===
// ===================================================================
router.post('/phone', authMiddleware.optional, async (req, res) => {
    const { phone, visitorId } = req.body;
    const user = req.user;

    try {
        if (!phone) {
            return res.status(400).json({ message: 'Número de telefone é obrigatório.' });
        }

        const result = await phoneService.checkPhoneNumber(phone);

        if (user || visitorId) {
            const historyEntry = new SearchHistory({
                user: user ? user.id : null,
                visitorId: visitorId,
                searchType: 'phone',
                query: phone,
                isSafe: result.isSafe,
                results: result
            });
            await historyEntry.save();
            console.log('Histórico de análise de telefone salvo com sucesso!');
        }
        res.status(200).json(result);
    } catch (error) {
        console.error(`Erro na rota /check/phone:`, error.message);
        res.status(400).json({ message: error.message || 'Ocorreu um erro inesperado ao processar o telefone.' });
    }
});

module.exports = router;
