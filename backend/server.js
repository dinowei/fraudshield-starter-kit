// 1. Importações das dependências
require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');


// 2. Inicialização do App Express
const app = express();

// 3. Configuração dos Middlewares
app.use(cors()); // Permite que o frontend (de outro domínio) faça requisições para este backend
app.use(express.json()); // Permite que o servidor entenda requisições com corpo no formato JSON

// 4. Conexão com o Banco de Dados MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/fraudshield';

mongoose.connect(MONGO_URI)
    .then(() => console.log('Conectado com sucesso ao MongoDB!'))
    .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

/// 5. Rotas da API
app.use('/api/auth', authRoutes);


// 6. Inicialização do Servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
