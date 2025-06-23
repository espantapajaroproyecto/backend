const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

// Función utilitaria para generar el objeto de respuesta requerido por API Gateway
const generatePolicy = (principalId, effect, resource, context = {}) => {
    return {
        principalId,
        policyDocument: {
            Version: "2012-10-17",
            Statement: [
                {
                    Action: "execute-api:Invoke",
                    Effect: effect,
                    Resource: resource,
                },
            ],
        },
        context, // Aquí podés pasar datos útiles como el email, role, etc.
    };
}

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
  generatePolicy
};
