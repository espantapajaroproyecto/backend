const bcrypt = require('bcryptjs');

// Cantidad de rondas de sal (seguridad). 10 es un buen equilibrio
const SALT_ROUNDS = 10;

const validarLoginInput = (username, password) => {
    if (!username || !password) {
        return {
            valid: false,
            message: 'Username y password requeridos',
        };
    }
    return { valid: true };
}

// Hashea la contraseña original antes de guardarla
const hashPassword = async (plainPassword) => {
    return await bcrypt.hash(plainPassword, SALT_ROUNDS);
};

// Compara una contraseña ingresada con la ya encriptada
const compararContrasenias = async (inputPassword, storedHashedPassword) => {
    return await bcrypt.compare(inputPassword, storedHashedPassword);
};

module.exports = {
    validarLoginInput,
    hashPassword,
    compararContrasenias,
};

