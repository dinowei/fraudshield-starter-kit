const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const {
    checkUrl,
    checkIp,
    checkText,
    checkFile,
    checkEmail,
    checkDocument,
    checkPhone
} = require('../controllers/checkController');

const router = express.Router();

// Multer em memória para upload de arquivo
const upload = multer({ storage: multer.memoryStorage() });

// --- Rotas de Check ---

// URL
router.post(
    '/url',
    authMiddleware.optional,
    checkUrl
);

// IP
router.post(
    '/ip',
    authMiddleware.optional,
    checkIp
);

// Texto
router.post(
    '/text',
    checkText
);

// Arquivo
router.post(
    '/file',
    authMiddleware.optional,
    upload.single('file'),
    checkFile
);

// E-mail
router.post(
    '/email',
    authMiddleware.optional,
    checkEmail
);

// Documento
router.post(
    '/document',
    authMiddleware.optional,
    checkDocument
);

// Telefone
router.post(
    '/phone',
    authMiddleware.optional,
    checkPhone
);

module.exports = router;
