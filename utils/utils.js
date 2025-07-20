const bcrypt = require("bcryptjs");

// Cantidad de rondas de sal (seguridad). 10 es un buen equilibrio
const SALT_ROUNDS = 10;

const validarLoginInput = (username, password) => {
  if (!username || !password) {
    return {
      valid: false,
      message: "Username y password requeridos",
    };
  }
  return { valid: true };
};

// Hashea la contraseña original antes de guardarla
const hashPassword = async (plainPassword) => {
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
};

// Compara una contraseña ingresada con la ya encriptada
const compararContrasenias = async (inputPassword, storedHashedPassword) => {
  return await bcrypt.compare(inputPassword, storedHashedPassword);
};

const ESTADO_RESERVA = {
  PEDIENTE: "PENDIENTE",
  CONFIRMADA: "CONFIRMADA",
  CANCELADA: "CANCELADA",
};

const MODALIDAD_CLASE = {
  PRESENCIAL: "PRESENCIAL",
  VIRTUAL: "VIRTUAL",
};

const FRECUENCIA_CLASE = {
  FIJA: "FIJA",
  PUNTUAL: "PUNTUAL",
};

const validarCuerpoEvento = (cuerpo, camposRequeridos = []) => {
  if (camposRequeridos.length == 0) {
    return false;
  }

  const camposFaltantes = camposRequeridos.filter(
    (campo) => !cuerpo[campo] || cuerpo[campo].toString().trim() === ""
  );

  if (camposFaltantes.length > 0) {
    return false;
  }

  return true;
};

module.exports = {
  validarLoginInput,
  hashPassword,
  compararContrasenias,
  validarCuerpoEvento,
  ESTADO_RESERVA,
  MODALIDAD_CLASE,
  FRECUENCIA_CLASE,
};
