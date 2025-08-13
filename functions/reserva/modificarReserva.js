require("dotenv").config();
const dbService = require("../../services/dbService");
const s3Service = require("../../services/s3Service");

module.exports.handler = async (event) => {
  try {
    console.log("event.body:", event.body);
    const body = JSON.parse(event.body);

    const {
      id,
      fecha_hora,
      tiempo,
      profesor_id,
      alumno_id,
      materia_id,
      tema_id,
      aula_id,
      estado,
      observaciones,
      es_presencial,
      pc_id,
      en_instituto,
      grupal,
    } = body;

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "El ID de la reserva es obligatorio" }),
      };
    }

    const useS3 = process.env.USE_S3 == "true";
    const modificarReserva = useS3
      ? s3Service.modificarReserva
      : dbService.modificarReserva;

    const camposActualizados = {
      fecha_hora,
      tiempo,
      profesor_id,
      alumno_id,
      materia_id,
      tema_id,
      aula_id,
      estado,
      observaciones,
      es_presencial,
      pc_id,
      en_instituto,
      grupal,
    };

    const actualizada = await modificarReserva(id, camposActualizados);
   

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: useS3
          ? "Reserva modificada en S3"
          : "Reserva modificada en base de datos",
        actualizada,
      }),
    };
  } catch (error) {
    console.error("Error en modifyReserva:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error interno del servidor",
        error: error.message,
      }),
    };
  }
};
