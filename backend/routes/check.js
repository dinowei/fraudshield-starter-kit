const express = require('express');
const router = express.Router();

// Futuramente, vamos importar nosso urlService aqui
// const { checkUrl } = require('../services/urlService');

// @route   POST /api/check/url
// @desc    Verifica a segurança de uma URL
// @access  Public
router.post('/url', (req, res) => {
    // Por enquanto, vamos apenas confirmar que a rota funciona
    const { url } = req.body; // Pega a URL que o frontend enviou

    if (!url) {
        return res.status(400).json({ message: 'URL é obrigatória.' });
    }

    console.log(`Recebida solicitação para verificar a URL: ${url}`);

    // Resposta temporária de sucesso
    res.json({
        message: `Análise da URL ${url} será implementada aqui.`,
        status: 'Em desenvolvimento'
    });
});

module.exports = router;
