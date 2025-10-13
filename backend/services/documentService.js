const axios = require('axios');

/**
 * (Função interna) Consulta um documento (CPF ou CNPJ) na BrasilAPI.
 */
const consultarBrasilAPI = async (documento) => {
    const numeroLimpo = documento.replace(/\D/g, '');
    let tipo = '';

    if (numeroLimpo.length === 11) {
        tipo = 'cpf';
    } else if (numeroLimpo.length === 14) {
        tipo = 'cnpj';
    } else {
        console.error('Número de documento inválido. Forneça um CPF (11 dígitos) ou CNPJ (14 dígitos).');
        throw new Error('Número de documento inválido.');
    }

    const url = `https://brasilapi.com.br/api/${tipo}/v1/${numeroLimpo}`;
    console.log(`Consultando ${tipo.toUpperCase()} na BrasilAPI: ${url}`);

    try {
        const response = await axios.get(url);
        return { source: 'BrasilAPI', details: response.data };
    } catch (error) {
        // ===================================================================
        // === CORREÇÃO DE SEGURANÇA APLICADA AQUI ===
        // Verifica se as propriedades existem antes de usá-las para evitar o 'TypeError'.
        // ===================================================================
        const errorMessage = (error.response && error.response.data && error.response.data.message)
            ? error.response.data.message
            : error.message;
        console.error(`Erro ao consultar ${tipo.toUpperCase()} na BrasilAPI:`, errorMessage);

        throw new Error('Falha ao consultar BrasilAPI.');
    }
};

/**
 * (Função interna) Consulta um CNPJ na API pública da ReceitaWS.
 */
const consultarReceitaWS = async (cnpj) => {
    if (cnpj.length !== 14) {
        return null;
    }

    const url = `https://www.receitaws.com.br/v1/cnpj/${cnpj}`;
    console.log(`(Fallback ) Consultando CNPJ na ReceitaWS: ${cnpj}`);

    try {
        const response = await axios.get(url, { timeout: 5000 });
        if (response.data && response.data.status !== 'ERROR') {
            return { source: 'ReceitaWS', details: response.data };
        }
        throw new Error(response.data.message || 'ReceitaWS retornou um erro.');
    } catch (error) {
        // Correção de segurança similar aplicada aqui também.
        const errorMessage = (error.response && error.response.data)
            ? JSON.stringify(error.response.data)
            : error.message;
        console.error('Erro ao consultar CNPJ na ReceitaWS:', errorMessage);
        throw new Error('Falha ao consultar ReceitaWS.');
    }
};

/**
 * Função principal que orquestra a consulta de documentos com lógica de fallback.
 */
const checkDocument = async (documento) => {
    const numeroLimpo = documento.replace(/\D/g, '');

    try {
        const resultadoBrasilAPI = await consultarBrasilAPI(numeroLimpo);
        return { isSafe: true, ...resultadoBrasilAPI };

    } catch (errorBrasilAPI) {
        console.log('BrasilAPI falhou. Verificando possibilidade de fallback...');

        if (numeroLimpo.length === 14) {
            try {
                const resultadoReceitaWS = await consultarReceitaWS(numeroLimpo);
                return { isSafe: true, ...resultadoReceitaWS };
            } catch (errorReceitaWS) {
                console.error('Fallback da ReceitaWS também falhou.');
                throw new Error('Serviço de consulta indisponível ou documento não encontrado.');
            }
        } else {
            console.log('Documento não é um CNPJ, não há fallback disponível.');
            throw new Error(errorBrasilAPI.message);
        }
    }
};

module.exports = {
    checkDocument,
};
