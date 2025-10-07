const express = require('express');
const router = express.Router();
// Corrigido para importar os nomes corretos das funções
const { registerUser, loginUser } = require('../controllers/authController');

// @route   POST /api/auth/register
// @desc    Registra um novo usuário
router.post('/register', registerUser); // <-- NOME CORRIGIDO

// @route   POST /api/auth/login
// @desc    Autentica um usuário e retorna um token
router.post('/login', loginUser); // <-- NOME CORRIGIDO

module.exports = router;
