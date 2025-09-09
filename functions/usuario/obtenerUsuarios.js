require("dotenv").config();
const dbService = require("../../services/dbService");
const s3Service = require("../../services/s3Service");
const { validarCuerpoEvento, makeHeader } = require("../../utils/utils");

module.exports.handler = async (event) => {
  const useS3 = process.env.USE_S3 == "true";
  const obtenerUsuarios = useS3
    ? s3Service.obtenerUsuarios
    : dbService.obtenerUsuarios;

  try {
    const results = await obtenerUsuarios();

    return {
      statusCode: 200,
      headers: makeHeader(),
      body: JSON.stringify(
        {
          message: useS3
            ? "Usuarios cargados desde S3"
            : "Usuarios cargados desde Aurora",
          results,
        },
        null,
        2
      ),
    };
  } catch (error) {
    console.error("DB error:", error);

    return {
      statusCode: 500,
      headers: makeHeader(),
      body: JSON.stringify(
        {
          message: "Error al obtener los usuarios",
          error: error.message,
        },
        null,
        2
      ),
    };
  }
};
