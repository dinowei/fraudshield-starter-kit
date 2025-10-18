const { validationResult } = require('express-validator');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const logger = require('../utils/logger');

const signUserToken = (userId) =>
    jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });

const handleValidation = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return false;
    }
    return true;
};

const verifyHCaptcha = async (token) => {
    const secret = process.env.HCAPTCHA_SECRET_KEY;
    const params = new URLSearchParams({ response: token, secret });
    const { data } = await axios.post('https://hcaptcha.com/siteverify', params);
    return data;
};

const getUserPayload = (user) => ({
    _id: user.id,
    name: user.name,
    email: user.email,
    token: signUserToken(user._id),
});

// REGISTRO
const registerUser = async (req, res, next) => {
    if (!handleValidation(req, res)) return;
    const { name, email, password, ['h-captcha-response']: hCaptchaToken } = req.body;
    if (!hCaptchaToken) {
        logger.warn('Registro sem o token do hCaptcha.');
        return res.status(400).json({ message: 'Por favor, complete a verificação "Não sou um robô".' });
    }
    try {
        logger.info('Verificando hCaptcha...');
        const { success, ['error-codes']: errorCodes } = await verifyHCaptcha(hCaptchaToken);
        if (!success) {
            logger.warn(`hCaptcha falhou: [${(errorCodes || []).join(', ')}]`);
            if ((errorCodes || []).includes('invalid-input-secret')) {
                logger.error('Chave secreta do hCaptcha inválida!');
                return res.status(500).json({ message: 'Erro de configuração no servidor.' });
            }
            return res.status(400).json({ message: 'Falha ao validar o hCaptcha. Tente novamente.' });
        }
        if (await User.findOne({ email }))
            return res.status(409).json({ message: 'Este endereço de e-mail já está em uso.' });
        const user = await User.create({ name, email, password });
        logger.info(`Usuário ${user.email} criado com sucesso.`);
        res.status(201).json(getUserPayload(user));
    } catch (error) {
        logger.error('Erro durante registro:', error);
        next(error);
    }
};

// LOGIN
const loginUser = async (req, res, next) => {
    if (!handleValidation(req, res)) return;
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password))) {
            logger.warn(`Falha de login para: ${email}`);
            return res.status(401).json({ message: 'Email ou senha inválidos' });
        }
        logger.info(`Login bem-sucedido para: ${email}`);
        res.json(getUserPayload(user));
    } catch (error) {
        logger.error('Erro durante login:', error);
        next(error);
    }
};

module.exports = { registerUser, loginUser };
