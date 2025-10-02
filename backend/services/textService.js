// Lista de palavras-chave suspeitas. Podemos expandir isso no futuro.
const suspiciousKeywords = [
    'senha', 'password', 'credit card', 'cartão de crédito', 'banco', 'bank',
    'login', 'username', 'usuário', 'account', 'conta', 'verificar', 'verify',
    'urgente', 'urgent', 'prêmio', 'ganhou', 'winner', 'loteria', 'lottery',
    'clique aqui', 'click here', 'oferta limitada', 'limited offer'
];

/**
 * Analisa um texto em busca de palavras-chave suspeitas.
 * @param {string} text - O texto a ser analisado.
 * @returns {object} - Um objeto com o resultado da análise.
 */
const checkTextSecurity = (text) => {
    if (!text || typeof text !== 'string') {
        return {
            isSafe: false,
            details: 'Texto inválido ou não fornecido.',
            foundKeywords: []
        };
    }

    const foundKeywords = [];
    const lowerCaseText = text.toLowerCase(); // Converte o texto para minúsculas para a busca

    suspiciousKeywords.forEach(keyword => {
        if (lowerCaseText.includes(keyword)) {
            foundKeywords.push(keyword);
        }
    });

    if (foundKeywords.length > 0) {
        return {
            isSafe: false,
            details: `Análise de texto encontrou ${foundKeywords.length} palavra(s)-chave suspeita(s).`,
            foundKeywords: foundKeywords
        };
    }

    return {
        isSafe: true,
        details: 'Nenhuma palavra-chave suspeita encontrada no texto.',
        foundKeywords: []
    };
};

module.exports = {
    checkTextSecurity
};
