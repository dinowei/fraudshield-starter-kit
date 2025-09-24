const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');


// Por enquanto, nossas rotas não farão nada, apenas responderão com uma mensagem.
// Isso nos permite testar se a rota está funcionando antes de adicionar a lógica complexa.

// @route   POST api/auth/register
// @desc    Registrar um novo usuário
// @access  Public
router.post('/register', authController.register);


// @route   POST api/auth/login
// @desc    Autenticar um usuário e obter token
// @access  Public
router.post('/login', authController.login);


module.exports = router;
