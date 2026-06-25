require("dotenv").config();
const dbService = require("../../services/dbService");
const s3Service = require("../../services/s3Service");
const { makeHeader } = require("../../utils/utils");

module.exports.handler = async (event) => {
  try {
    
    const body = JSON.parse(event.body);

    const { id } = body;

    if (!id) {
      return {
        statusCode: 400,
        headers: makeHeader(),
        body: JSON.stringify({ message: "El ID del Usuario Docente es obligatorio" }),
      };
    }

    const useS3 = process.env.USE_S3 === "true";
    const eliminarDocente = useS3
      ? s3Service.eliminarDocente
      : dbService.eliminarDocente;

    await eliminarDocente(id);

    return {
      statusCode: 200,
      headers: makeHeader(),
      body: JSON.stringify({
        message: useS3
          ? "Docente eliminada en S3"
          : "Docente eliminada en base de datos",
      }),
    };
  } catch (error) {
    console.error("Error en delete Docente:", error);
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
