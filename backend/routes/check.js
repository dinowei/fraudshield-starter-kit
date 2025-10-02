const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');

// Serviços
const { checkUrlSecurity } = require('../services/urlService');
const { checkTextSecurity } = require('../services/textService');
const { checkFileSecurity } = require('../services/fileService');

// Configuração do Multer para guardar o arquivo na memória
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Rota de URL
router.post('/url', authMiddleware.optional, async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL é obrigatória.' });
    const userId = req.user ? req.user.id : null;
    const results = await checkUrlSecurity(url, userId);
    res.json(results);
});

// Rota de Texto
router.post('/text', (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Texto é obrigatório.' });
    const result = checkTextSecurity(text);
    res.json(result);
});

// NOVA ROTA DE ARQUIVO
router.post('/file', authMiddleware.optional, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    }
    const userId = req.user ? req.user.id : null;
    const result = await checkFileSecurity(req.file, userId);
    res.json(result);
});

module.exports = router;
