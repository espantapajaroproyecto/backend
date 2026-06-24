require("dotenv").config();
const dbService = require("../../services/dbService");
const s3Service = require("../../services/s3Service");
const { makeHeader } = require("../../utils/utils");

module.exports.handler = async (event) => {
  const useS3 = process.env.USE_S3 == "true";
  const obtenerConfiguraciones = useS3
    ? s3Service.obtenerConfiguraciones
    : dbService.obtenerConfiguraciones;

  try {
    const results = await obtenerConfiguraciones();
    

    return {
      statusCode: 200,
      headers: makeHeader(),
      body: JSON.stringify(
        {
          message: useS3
            ? "Configuraciones cargados desde S3"
            : "Configuraciones cargados desde Aurora",
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
          message: "Error al obtener los Configuraciones",
          error: error.message,
        },
        null,
        2
      ),
    };
  }
};
