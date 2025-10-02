const User = require('../models/userModel'); // <-- AGORA ESTÁ CORRETO
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Função para registrar um novo usuário
exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // 1. Verifica se o usuário já existe
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'Usuário com este e-mail já existe.' });
        }

        // 2. Cria um novo usuário com os dados recebidos
        user = new User({
            name,
            email,
            password,
        });

        // 3. Salva o usuário no banco de dados (a senha será criptografada pelo middleware no modelo)
        await user.save();

        // 4. Gera um token JWT para o novo usuário
        const payload = {
            user: {
                id: user.id,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 3600 }, // Token expira em 1 hora
            (err, token) => {
                if (err) throw err;
                res.status(201).json({ token }); // Retorna o token para o usuário
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};

// Função para fazer o login de um usuário
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // 1. Verifica se o usuário existe
        const user = await User.findOne({ email }).select('+password'); // Pede para o Mongoose incluir a senha na busca
        if (!user) {
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }
        // 2. Compara a senha enviada com a senha criptografada no banco de dados
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }
        // 3. Se as senhas baterem, gera um novo token JWT
        const payload = {
            user: {
                id: user.id,
            },
        };
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 3600 },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
};
