require("dotenv").config();
const dbService = require("../../services/dbService");
const s3Service = require("../../services/s3Service");
const { validarCuerpoEvento } = require("../../utils/utils");
const CAMPOS_REQUERIDOS = [
  "gradoId",
  "materiaId",
  "temaId",
  "nivelId",
  "modalidad",
  "frecuencia",
];

module.exports.handler = async (event) => {
  const useS3 = process.env.USE_S3 == "true";
  const cuerpo = event?.body && JSON.parse(event?.body);

  const obtenerDispponibles = useS3
    ? s3Service.obtenerDisponibles
    : dbService.obtenerDisponibles;

  const obtenerDisponiblesPor = useS3
    ? s3Service.obtenerDisponiblesPor
    : dbService.obtenerDisponiblesPor;

  if (cuerpo && !validarCuerpoEvento(cuerpo, CAMPOS_REQUERIDOS)) {
    return {
      statusCode: 500,
      body: JSON.stringify(
        {
          message: "Error Faltan campos requeridos",
        },
        null,
        2
      ),
    };
  }
  try {
    const results = !cuerpo
      ? await obtenerDispponibles()
      : await obtenerDisponiblesPor(cuerpo);
    console.log(results);

    return {
      statusCode: 200,
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
      body: JSON.stringify(
        {
          message: "Error al obtener los Disponibles",
          error: error.message,
        },
        null,
        2
      ),
    };
  }
};
