const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Por favor, adicione um nome.']
    },
    email: {
        type: String,
        required: [true, 'Por favor, adicione um email.'],
        unique: true, // Garante que cada email seja único no banco de dados
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Por favor, adicione um email válido.'
        ]
    },
    password: {
        type: String,
        required: [true, 'Por favor, adicione uma senha.'],
        minlength: 6,
        select: false // Não retorna a senha nas buscas por padrão
    }
}, {
    timestamps: true // Cria os campos createdAt e updatedAt automaticamente
});

module.exports = mongoose.model('User', userSchema);
