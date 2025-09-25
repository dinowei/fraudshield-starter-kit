const jwt = require('jsonwebtoken');

// Middleware para proteger rotas
const protect = (req, res, next) => {
    let token;

    // Verifica se o token está no cabeçalho de autorização e começa com "Bearer"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Extrai o token do cabeçalho (formato: "Bearer TOKEN")
            token = req.headers.authorization.split(' ')[1];

            // 2. Verifica se o token é válido usando a nossa chave secreta
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Adiciona os dados do usuário (do token) ao objeto 'req'
            //    Isso permite que as próximas rotas saibam quem é o usuário.
            //    (Vamos precisar buscar o usuário no banco de dados aqui no futuro, mas por agora isso é suficiente)
            req.user = decoded; // Ex: { id: '...', iat: ..., exp: ... }

            // 4. Deixa o pedido continuar para a próxima etapa (a rota protegida)
            next();

        } catch (error) {
            console.error('Erro na autenticação do token:', error);
            res.status(401).json({ message: 'Não autorizado, token falhou.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Não autorizado, nenhum token encontrado.' });
    }
};

module.exports = { protect };
