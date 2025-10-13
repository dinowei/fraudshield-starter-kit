const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
    // Referência ao usuário que fez a busca (se ele estiver logado)
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    // A impressão digital do dispositivo que realizou a busca.
    visitorId: {
        type: String,
        required: false
    },
    // O tipo de busca realizada
    searchType: {
        type: String,
        required: true,
        // ===================================================================
        // === 'phone' ADICIONADO AQUI PARA PERMITIR O NOVO HISTÓRICO ===
        // ===================================================================
        enum: ['url', 'file', 'text', 'ip', 'email', 'document', 'phone']
    },
    // O conteúdo que foi pesquisado
    query: {
        type: String,
        required: true
    },
    // O resultado da análise
    isSafe: {
        type: Boolean,
        required: true
    },
    // Um resumo dos resultados das APIs
    results: {
        type: mongoose.Schema.Types.Mixed,
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
