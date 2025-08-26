require("dotenv").config();
const dbService = require("../../services/dbService");
const s3Service = require("../../services/s3Service");
const { ESTADO_RESERVA } = require("../../utils/utils");

module.exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    const {
      fecha_hora,
      tiempo,
      profesor_id,
      alumno_id,
      materia_id,
      tema_id,
      aula_id,
      disponible_id,
      estado = ESTADO_RESERVA.PEDIENTE,
      observaciones = "",
      es_presencial,
      pc_id,
      en_instituto,
      grupal,
    } = body;

    // Validación básica
    if (
      !fecha_hora ||
      !tiempo ||
      !profesor_id ||
      !alumno_id ||
      !materia_id ||
      !disponible_id ||
      !tema_id ||
      !aula_id ||
      es_presencial === undefined ||
      en_instituto === undefined ||
      grupal === undefined ||
      !pc_id
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Faltan campos obligatorios" }),
      };
    }

    const useS3 = process.env.USE_S3 === "true";
    const agregarReserva = useS3
      ? s3Service.agregarReserva
      : dbService.agregarReserva;

    const nuevaReserva = {
      fecha_hora,
      tiempo,
      profesor_id,
      alumno_id,
      materia_id,
      disponible_id,
      tema_id,
      aula_id,
      estado,
      observaciones,
      es_presencial,
      pc_id,
      en_instituto,
      grupal,
    };

    const reservaResult = await agregarReserva(nuevaReserva);
    console.log("Resultado de agregarReserva:", reservaResult);

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: useS3
          ? "Reserva guardada en S3"
          : "Reserva guardada en base de datos",
      }),
    };
  } catch (error) {
    console.error("Error en createReserva:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error interno del servidor",
        error: error.message,
      }),
    };
  }
};
