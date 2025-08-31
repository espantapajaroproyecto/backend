require("dotenv").config();
const dbService = require("../../services/dbService");
const s3Service = require("../../services/s3Service");
const { hashPassword } = require("../../utils/utils");

module.exports.handler = async (event) => {
  try {
    
    const body = JSON.parse(event.body);

    const { id, habilitado, valor_hora, dni, nombre, apellido, mail, celular } =
      body;

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Se requiere Id del Usuario docente, para buscar al usuario",
        }),
      };
    }

    const useS3 = process.env.USE_S3 === "true";

    const modificarDocente = useS3
      ? s3Service.modificarDocente
      : dbService.modificarDocente;

    const modificarUsuario = useS3
      ? s3Service.modificarUsuario
      : dbService.modificarUsuario;

    if (habilitado !== undefined || valor_hora !== undefined) {
      await modificarDocente(id, {
        ...(habilitado !== undefined && { habilitado }),
        ...(valor_hora !== undefined && { valor_hora }),
      });
    }
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

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: useS3
          ? "Docente modificado en S3"
          : "Docente modificado en base de datos",
      }),
    };
  } catch (error) {
    console.error("Error en modificarDocente:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error interno del servidor",
        error: error.message,
      }),
    };
  }
};
