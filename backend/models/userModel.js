const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define o "molde" para os dados do usuário no banco de dados
const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, // Garante que cada email seja único
    },
    password: {
        type: String,
        required: true,
    },
}, {
    timestamps: true, // Cria campos `createdAt` e `updatedAt` automaticamente
});

// =================================================================
//      1. MÉTODO PARA COMPARAR SENHAS (CORREÇÃO DO ERRO)
// =================================================================
// Adiciona um método chamado 'matchPassword' a cada objeto de usuário
userSchema.methods.matchPassword = async function (enteredPassword) {
    // Usa o bcrypt para comparar a senha digitada com a senha criptografada no DB
    return await bcrypt.compare(enteredPassword, this.password);
};

// =================================================================
//      2. CRIPTOGRAFIA AUTOMÁTICA ANTES DE SALVAR
// =================================================================
// Middleware que executa ANTES de um usuário ser salvo ('pre('save', ...)')
userSchema.pre('save', async function (next) {
    // Se a senha não foi modificada (ex: usuário está apenas atualizando o nome), não faz nada
    if (!this.isModified('password')) {
        next();
    }

    // Gera um "salt" para fortalecer a criptografia
    const salt = await bcrypt.genSalt(10);
    // Substitui a senha em texto plano pela sua versão criptografada
    this.password = await bcrypt.hash(this.password, salt);
});

// Cria o modelo 'User' a partir do schema que definimos
const User = mongoose.model('User', userSchema);

module.exports = User;
