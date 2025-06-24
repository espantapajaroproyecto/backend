// authorizer.js
const jwt = require('jsonwebtoken');
const { generatePolicy } = require('../../utils/auth');


// ⚠️ Clave secreta para verificar el token. Puede venir de una variable de entorno.
const JWT_SECRET = "unaClaveSuperSecreta123!";



exports.handler = async (event) => {
    const token = event.authorizationToken;
    console.log({ token });


    if (!token || !token.startsWith("Bearer ")) {
        return generatePolicy("anonymous", "Deny", event.methodArn);
    }

    const jwtToken = token.replace("Bearer ", "");

    try {
        console.log(JWT_SECRET);
        console.log(jwtToken);

        // Verificamos y decodificamos el token
        const decoded = jwt.verify(jwtToken, JWT_SECRET);

        // Podés incluir más lógica aquí según `decoded.role`, `decoded.email`, etc.
        const principalId = decoded.sub || "usuario";

        return generatePolicy(principalId, "Allow", event.methodArn, decoded);
    } catch (err) {
        console.error("Error al verificar token:", err);
        return generatePolicy("anonymous", "Deny", event.methodArn);
    }
};


