require("dotenv").config();
const dbService = require("../../services/dbService");
const s3Service = require("../../services/s3Service");
const { hashPassword } = require("../../utils/utils");

module.exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    const { id, dni, nombre, apellido, mail, celular, contrasenia } = body;

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Se requiere Id del Usuario, para buscar al usuario",
        }),
      };
    }

    const useS3 = process.env.USE_S3 === "true";

    const modificarUsuario = useS3
      ? s3Service.modificarUsuario
      : dbService.modificarUsuario;

    if (
      dni !== undefined ||
      nombre !== undefined ||
      apellido !== undefined ||
      mail !== undefined ||
      celular !== undefined
    ) {
      await modificarUsuario(id, {
        ...(dni !== undefined && { dni }),
        ...(nombre !== undefined && { nombre }),
        ...(apellido !== undefined && { apellido }),
        ...(mail !== undefined && { mail }),
        ...(celular !== undefined && { celular }),
      });
    }

    if (contrasenia !== undefined && contrasenia !== "") {
      const contraseniaHasheada = await hashPassword(contrasenia);
      await modificarUsuario(id, { contrasenia: contraseniaHasheada });
    }
    if (contrasenia !== undefined && contrasenia == "") {
      await modificarUsuario(id, { contrasenia });
    }
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: useS3
          ? "Usuario modificado en S3"
          : "Usuario modificado en base de datos",
      }),
    };
  } catch (error) {
    console.error("Error en modificar Usuario:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error interno del servidor",
        error: error.message,
      }),
    };
  }
};
