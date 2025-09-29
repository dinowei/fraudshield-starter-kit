const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Tenta se conectar ao MongoDB usando a URL que estará no nosso arquivo .env
        const conn = await mongoose.connect(process.env.MONGO_URI);

        // Se a conexão for bem-sucedida, exibe uma mensagem no console
        console.log(`MongoDB Conectado: ${conn.connection.host}`);
    } catch (error) {
        // Se a conexão falhar, exibe o erro e encerra o processo do servidor
        console.error(`Erro ao conectar ao MongoDB: ${error.message}`);
        process.exit(1); // Encerra a aplicação com status de falha
    }
};

module.exports = connectDB;
