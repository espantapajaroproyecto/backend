const validarLoginInput = (username, password) => {
    if (!username || !password) {
        return {
            valid: false,
            message: 'Username y password requeridos',
        };
    }
    return { valid: true };
}

const compararContrasenias = (inputPassword, storedPassword) => {
    return inputPassword === storedPassword;
}

module.exports = {
    validarLoginInput,
    compararContrasenias,
};