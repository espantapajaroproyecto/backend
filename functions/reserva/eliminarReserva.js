require("dotenv").config();
const dbService = require("../../services/dbService");
const s3Service = require("../../services/s3Service");

module.exports.handler = async (event) => {
  try {
    
    const body = JSON.parse(event.body);

    const { id } = body;

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "El ID de la reserva es obligatorio" }),
      };
    }

    const useS3 = process.env.USE_S3 === "true";
    const eliminarReserva = useS3
      ? s3Service.eliminarReserva
      : dbService.eliminarReserva;

    await eliminarReserva(id);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: useS3
          ? "Reserva eliminada en S3"
          : "Reserva eliminada en base de datos",
      }),
    };
  } catch (error) {
    console.error("Error en deleteReserva:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error interno del servidor",
        error: error.message,
      }),
    };
  }
};
