require("dotenv").config();
const dbService = require("../../services/dbService");
const s3Service = require("../../services/s3Service");
const { hashPassword, makeHeader } = require("../../utils/utils");

module.exports.handler = async (event) => {
  try {
    
    const body = JSON.parse(event.body);

    const { id, institucion_id, dni, nombre, apellido, mail, celular } = body;

    if (!id) {
      return {
        statusCode: 400,
        headers: makeHeader(),
        body: JSON.stringify({
          message: "Se requiere Id del Usuario docente, para buscar al usuario",
        }),
      };
    }

    const useS3 = process.env.USE_S3 === "true";

    const modificarAlumno = useS3
      ? s3Service.modificarAlumno
      : dbService.modificarAlumno;

    const modificarUsuario = useS3
      ? s3Service.modificarUsuario
      : dbService.modificarUsuario;
    
    
    if (institucion_id !== undefined) {
      await modificarAlumno(id, {
        ...(institucion_id !== undefined && { institucion_id: institucion_id }),
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
      headers: makeHeader(),
      body: JSON.stringify({
        message: useS3
          ? "Alumno modificado en S3"
          : "Alumno modificado en base de datos",
      }),
    };
  } catch (error) {
    console.error("Error en modificarAlumno:", error);
    return {
      statusCode: 500,
      headers: makeHeader(),
      body: JSON.stringify({
        message: "Error interno del servidor",
        error: error.message,
      }),
    };
  }
};
