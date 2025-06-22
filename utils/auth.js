const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

function verificarToken(event) {
  const authHeader = event.headers.Authorization || event.headers.authorization;

  if (!authHeader) {
    throw new Error('No se proporcionó token');
  }

  const token = authHeader.split(' ')[1];
  return jwt.verify(token, SECRET);
}

function autorizarRoles(tokenPayload, rolesPermitidos) {
  if (!rolesPermitidos.includes(tokenPayload.rol)) {
    throw new Error('Acceso denegado');
  }
}

module.exports = {
  verificarToken,
  autorizarRoles,
};
