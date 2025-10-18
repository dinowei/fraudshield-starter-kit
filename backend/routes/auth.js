const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { registerUser, loginUser } = require('../controllers/authController');

// ===============================
// Rotas de Autenticação de Usuário
// ===============================

/**
 * @route   POST /api/auth/register
 * @desc    Registra um novo usuário
 * @access  Public
 */
router.post(
    '/register',
    [
        check('name').notEmpty().withMessage('O nome é obrigatório.'),
        check('email').isEmail().withMessage('Por favor, inclua um e-mail válido.'),
        check('password').isLength({ min: 6 }).withMessage('A senha deve ter 6 ou mais caracteres.'),
        // Validação do hCaptcha segue no controller
    ],
    registerUser
);

/**
 * @route   POST /api/auth/login
 * @desc    Autentica um usuário e retorna um token
 * @access  Public
 */
router.post(
    '/login',
    [
        check('email').isEmail().withMessage('Por favor, inclua um e-mail válido.'),
        check('password').exists().withMessage('A senha é obrigatória.'),
    ],
    loginUser
);

module.exports = router;
