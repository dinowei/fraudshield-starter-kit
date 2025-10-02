const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Middleware para proteger rotas (usuário PRECISA estar logado)
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Pega o token do cabeçalho (ex: "Bearer eyJhbGci...")
            token = req.headers.authorization.split(' ')[1];

            // Verifica se o token é válido
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Pega o usuário do banco de dados pelo ID do token e o anexa ao objeto 'req'
            req.user = await User.findById(decoded.id).select('-password');

            next(); // Passa para a próxima função (o controller da rota)
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Não autorizado, token falhou' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Não autorizado, sem token' });
    }
};

// Middleware opcional (TENTA autenticar, mas não falha se não conseguir)
const optional = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
        } catch (error) {
            // Se o token for inválido ou expirado, simplesmente ignoramos e definimos req.user como null
            req.user = null;
        }
    }

    next(); // Sempre continua para a próxima função, com ou sem usuário
};

// Exporta as duas funções para que possam ser usadas em outros arquivos
module.exports = { protect, optional };
