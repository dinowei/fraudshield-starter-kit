const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');

// Serviços
const { checkUrlSecurity } = require('../services/urlService');
const { checkTextSecurity } = require('../services/textService');
const { checkFileSecurity } = require('../services/fileService');
const { checkIpRisk } = require('../services/ipService'); // Importa o novo serviço

// Configuração do Multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Rota de URL
router.post('/url', authMiddleware.optional, async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL é obrigatória.' });
    console.log(`Iniciando verificação de URL para: ${url}`); // Adicionando log aqui também
    const userId = req.user ? req.user.id : null;
    const results = await checkUrlSecurity(url, userId);
    res.json(results);
});

// Rota de IP
router.post('/ip', authMiddleware.optional, async (req, res) => {
    const { ip } = req.body;
    if (!ip) return res.status(400).json({ message: 'IP é obrigatório.' });

    // 👇 LOG ADICIONADO AQUI 👇
    console.log(`Iniciando verificação de risco para o IP: ${ip}`);

    const userId = req.user ? req.user.id : null;
    const result = await checkIpRisk(ip, userId);
    res.json(result);
});

// Rota de Texto
router.post('/text', (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Texto é obrigatório.' });
    console.log(`Iniciando análise de texto.`); // Adicionando log
    const result = checkTextSecurity(text);
    res.json(result);
});

// Rota de Arquivo
router.post('/file', authMiddleware.optional, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    }
    console.log(`Iniciando análise do arquivo: ${req.file.originalname}`); // Adicionando log
    const userId = req.user ? req.user.id : null;
    const result = await checkFileSecurity(req.file, userId);
    res.json(result);
});

module.exports = router;
