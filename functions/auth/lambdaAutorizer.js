const jwt = require("jsonwebtoken");
const { generatePolicy } = require("../../utils/auth");

const JWT_SECRET = process.env.JWT_SECRET;

// Reglas de acceso por rol: cada ruta con los métodos permitidos
const accessControl = {
  admin: ["*"], // Acceso total
  alumno: [
    { path: "/login", methods: ["POST"] },
    { path: "/usuario", methods: ["GET"] },
  ],
  profesor: [
    { path: "/login", methods: ["POST"] },
    { path: "/usuario", methods: ["GET"] },
  ],
};

function isAuthorized(role, methodArn) {
  const rules = accessControl[role];

  if (!rules) return false;

  if (rules === "*" || rules.includes("*")) return true;

  // ARN típico: arn:aws:execute-api:{region}:{accountId}:{apiId}/{stage}/{method}/{resourcePath}
  const match = methodArn.match(
    /^[^:]+:[^:]+:[^:]+:[^:]+:[^:]+\/[^/]+\/([^/]+)\/(.+)$/
  );

  if (!match) return false;

  const method = match[1]; // e.g., GET, POST, etc.
  const path = "/" + match[2]; // e.g., "/usuario" (puede incluir subrutas)

  // Normalizamos (por si hay más de una barra)
  const normalizedPath = path.replace(/\/+/g, "/");

  return rules.some(({ path: rulePath, methods }) => {
    // permite coincidencias por prefijo (podés ajustarlo si necesitás exactitud)
    return (
      normalizedPath.startsWith(rulePath) &&
      methods.includes(method.toUpperCase())
    );
  });
}

exports.handler = async (event) => {
  const token = event.authorizationToken;

  if (!token || !token.startsWith("Bearer ")) {
    return generatePolicy("anonymous", "Deny", event.methodArn);
  }

  const jwtToken = token.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(jwtToken, JWT_SECRET);
    const principalId = decoded.sub || "usuario";
    const role = decoded.rol || "desconocido";

    

    if (isAuthorized(role, event.methodArn)) {
      return generatePolicy(principalId, "Allow", event.methodArn, decoded);
    } else {
      return generatePolicy(principalId, "Deny", event.methodArn, decoded);
    }
  } catch (err) {
    console.error("Error al verificar token:", err);
    return generatePolicy("anonymous", "Deny", event.methodArn);
  }
};
