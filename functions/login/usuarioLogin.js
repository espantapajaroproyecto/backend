require("dotenv").config();
const dbService = require("../../services/dbService");
const s3Service = require("../../services/s3Service");
const UTILS = require("../../utils/utils");
const { makeHeader } = require("../../utils/utils");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;

module.exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { dni, contrasenia } = body;

    const useS3 = process.env.USE_S3 === "true";
    const obtenerUsuarioPorDNI = useS3
      ? s3Service.obtenerUsuarioPorDNI
      : dbService.obtenerUsuarioPorDNI;

    const user = await obtenerUsuarioPorDNI(dni);

    if (user.length == 0) {
      return {
        statusCode: 401,
        headers: makeHeader(),
        body: JSON.stringify({ message: "Usuario no encontrado" }),
      };
    }

    let isValid = false;
    if (user.length > 0) {
      isValid = await UTILS.compararContrasenias(
        contrasenia,
        user[0].contrasenia
      );
    }

    if (!user[0].contrasenia || user[0].contrasenia === "") {
      return {
        statusCode: 403,
        headers: makeHeader(),
        body: JSON.stringify({
          message: "El usuario debe reiniciar las credenciales ",
          usuarioId: user[0].id,
        }),
      };
    }
    
    if (!isValid || !contrasenia) {
      return {
        statusCode: 401,
        headers: makeHeader(),
        body: JSON.stringify({ message: "Password incorrecta" }),
      };
    }

    //JWT con rol incluido
    const token = jwt.sign(
      {
        usuarioId: user[0].id,
        dni: user[0].dni,
        nombre: user[0].nombre,
        apellido: user[0].apellido,
        mail: user[0].mail,
        celular: user[0].celular,
        rol: user[0]?.rol?.nombre, // ej: "alumno", "profesor", "admin"
      },
      SECRET,
      { expiresIn: "8h" }
    );

    return {
      statusCode: 200,
      headers: makeHeader(),
      body: JSON.stringify({
        message: "Login exitoso",
        token,
      }),
    };
  } catch (error) {
    console.error("Error en login:", error);
    return {
      statusCode: 500,
      headers: makeHeader(),
      body: JSON.stringify({ message: "Error interno", error: error.message }),
    };
  }
};
