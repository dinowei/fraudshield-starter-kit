const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Esta é a "planta" para cada usuário que se cadastrar no sistema.
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'O nome é obrigatório.'],
    },
    email: {
        type: String,
        required: [true, 'O e-mail é obrigatório.'],
        unique: true, // Garante que não haverá dois usuários com o mesmo e-mail.
        lowercase: true, // Salva o e-mail sempre em letras minúsculas.
        match: [/\S+@\S+\.\S+/, 'Por favor, use um e-mail válido.'],
    },
    password: {
        type: String,
        required: [true, 'A senha é obrigatória.'],
        select: false, // Faz com que a senha não seja enviada em buscas por padrão.
    },
}, {
    timestamps: true, // Cria automaticamente os campos `createdAt` e `updatedAt`.
});

// Middleware "pre-save": Antes de salvar um novo usuário, este código será executado.
UserSchema.pre('save', async function (next) {
    // Se a senha não foi modificada, não faz nada e continua.
    if (!this.isModified('password')) {
        return next();
    }

    // Gera o "salt" e criptografa a senha.
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Cria o modelo 'User' baseado no Schema que definimos.
const User = mongoose.model('User', UserSchema);

module.exports = User;
