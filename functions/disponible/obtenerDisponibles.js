require("dotenv").config();
const dbService = require("../../services/dbService");
const s3Service = require("../../services/s3Service");
const { validarCuerpoEvento, makeHeader } = require("../../utils/utils");
const CAMPOS_REQUERIDOS = [
  // "gradoId",
  // "materiaId",
  // "temaId",
  // "nivelId",
  // "es_presencial",
  // "frecuencia",
];

module.exports.handler = async (event) => {
  const useS3 = process.env.USE_S3 == "true";
  console.log({ event });

  const params = event?.queryStringParameters || null;

  console.log({ params });

  const obtenerDispponibles = useS3
    ? s3Service.obtenerDisponibles
    : dbService.obtenerDisponibles;

  const obtenerDisponiblesPor = useS3
    ? s3Service.obtenerDisponiblesPor
    : dbService.obtenerDisponiblesPor;
  try {
    const results = !params
      ? await obtenerDispponibles()
      : await obtenerDisponiblesPor(params);

    return {
      statusCode: 200,
      headers: makeHeader(),
      body: JSON.stringify(
        {
          message: useS3
            ? "Disponibles cargados desde S3"
            : "Disponibles cargados desde Aurora",
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
      body: JSON.stringify({
        message: "Error al obtener los Disponibles",
        error: error.message,
      }),
    };
  }
};
