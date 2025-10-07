const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Função auxiliar para gerar o token JWT
const generateToken = (id) => {
    // Gera um token de autenticação que expira em 30 dias
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

/**
 * @desc    Registrar um novo usuário com verificação hCaptcha
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
    // Extrai os dados do corpo da requisição
    const { name, email, password } = req.body;

    // --- 1. VERIFICAÇÃO DO HCAPTCHA ---
    const hCaptchaToken = req.body['h-captcha-response'];

    // Garante que o token do captcha foi enviado pelo formulário
    if (!hCaptchaToken) {
        console.warn('Tentativa de registro sem o token do hCaptcha.');
        return res.status(400).json({ message: 'Por favor, complete a verificação "Não sou um robô".' });
    }

    try {
        // --- Início do bloco de verificação e registro ---

        // Prepara os dados para enviar à API do hCaptcha de forma segura
        const secret = process.env.HCAPTCHA_SECRET_KEY;
        const params = new URLSearchParams();
        params.append('response', hCaptchaToken);
        params.append('secret', secret);

        console.log('Enviando solicitação de verificação para a API do hCaptcha...');

        // Faz a chamada POST para o endpoint CORRETO do hCaptcha
        const hCaptchaResponse = await axios.post('https://hcaptcha.com/siteverify', params);

        console.log('Resposta da API hCaptcha:', hCaptchaResponse.data);

        // Verifica se a API retornou sucesso na verificação
        if (!hCaptchaResponse.data.success) {
            const errorCodes = hCaptchaResponse.data['error-codes'] || [];
            console.warn(`Falha na verificação do hCaptcha. Motivos: [${errorCodes.join(', ')}]`);

            // Verifica se o erro é uma chave secreta inválida (erro de configuração)
            if (errorCodes.includes('invalid-input-secret')) {
                console.error('ERRO CRÍTICO: A chave secreta do hCaptcha (HCAPTCHA_SECRET_KEY) está incorreta!');
                return res.status(500).json({ message: 'Erro de configuração no servidor. Contate o administrador.' });
            }

            return res.status(400).json({ message: 'Falha ao validar o hCaptcha. Por favor, tente novamente.' });
        }

        console.log('hCaptcha verificado com sucesso!');

        // --- 2. LÓGICA DE REGISTRO DO USUÁRIO ---
        // Esta parte só é executada se a verificação do hCaptcha for bem-sucedida.

        console.log(`Prosseguindo com o registro do usuário para o e-mail: ${email}`);

        // Verifica se já existe um usuário com o mesmo e-mail
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(409).json({ message: 'Este endereço de e-mail já está em uso.' });
        }

        // Cria o novo usuário no banco de dados
        const user = await User.create({ name, email, password });

        // Se o usuário foi criado com sucesso, retorna os dados e o token
        if (user) {
            console.log(`Usuário ${user.email} criado com sucesso.`);
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            // Caso raro em que a criação falha sem gerar um erro
            res.status(400).json({ message: 'Dados de usuário inválidos. Não foi possível criar a conta.' });
        }

    } catch (error) {
        // O bloco 'catch' captura erros tanto da API do hCaptcha quanto do banco de dados
        console.error('Ocorreu um erro durante o processo de registro:', error.message);
        res.status(500).json({ message: 'Erro interno no servidor. Por favor, tente novamente mais tarde.' });
    }
};

/**
 * @desc    Autenticar um usuário existente
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Procura o usuário pelo e-mail
        const user = await User.findOne({ email });

        // Verifica se o usuário existe e se a senha corresponde
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            // Mensagem de erro genérica por segurança
            res.status(401).json({ message: 'Email ou senha inválidos' });
        }
    } catch (error) {
        console.error('Erro durante o login:', error.message);
        res.status(500).json({ message: 'Erro no servidor ao fazer login.' });
    }
};

// Exporta as funções para serem usadas nas rotas
module.exports = { registerUser, loginUser };
