const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
    // Referência ao usuário que fez a busca (se ele estiver logado)
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Isso cria um link com o nosso 'userModel.js'
        required: false // Não é obrigatório, pois usuários não logados também podem pesquisar
    },
    // O tipo de busca realizada ('url', 'file', 'text')
    searchType: {
        type: String,
        required: true,
        enum: ['url', 'file', 'text'] // Só permite esses três valores
    },
    // O conteúdo que foi pesquisado (a URL, o nome do arquivo, etc.)
    query: {
        type: String,
        required: true
    },
    // O resultado da análise (se foi seguro ou não)
    isSafe: {
        type: Boolean,
        required: true
    },
    // Um resumo dos resultados das APIs
    results: {
        type: Object, // Usamos um objeto para guardar detalhes flexíveis das APIs
        required: true
    },
    // A data e hora em que a busca foi realizada
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);

module.exports = SearchHistory;
