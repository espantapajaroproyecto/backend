require("dotenv").config();
const dbService = require("../../services/dbService");
const s3Service = require("../../services/s3Service");
const { validarCuerpoEvento, makeHeader } = require("../../utils/utils");

const CAMPOS_REQUERIDOS = ["usuarioId"];

module.exports.handler = async (event) => {
  const useS3 = process.env.USE_S3 == "true";
  const cuerpo = event?.body && JSON.parse(event?.body);

  const obtenerReservas = useS3
    ? s3Service.obtenerReservas
    : dbService.obtenerReservas;

  const obtenerReservasPorUsuarioId = useS3
    ? s3Service.obtenerReservasPorUsuarioId
    : dbService.obtenerReservasPorUsuarioId;

  if (cuerpo && !validarCuerpoEvento(cuerpo, CAMPOS_REQUERIDOS)) {
    return {
      statusCode: 500,
      headers: makeHeader(),
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
      ? await obtenerReservas()
      : await obtenerReservasPorUsuarioId(cuerpo);

    return {
      statusCode: 200,
      headers: makeHeader(),
      body: JSON.stringify(
        {
          message: useS3
            ? "Reservas cargados desde S3"
            : "Reservas cargados desde Aurora",
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
          message: "Error al obtener los reservas",
          error: error.message,
        },
        null,
        2
      ),
    };
  }
};
