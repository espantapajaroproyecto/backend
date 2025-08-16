require("dotenv").config();
const dbService = require("../../services/dbService");
const s3Service = require("../../services/s3Service");

module.exports.handler = async (event) => {
  try {
    console.log("event.body:", event.body);
    const body = JSON.parse(event.body);

    const { tipo, id, ...datosActualizados } = body;

    if (!tipo || !id) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "El tipo y el ID son obligatorios para modificar una configuración",
        }),
      };
    }

    // Validar que el tipo sea uno válido
    const tiposValidos = ["niveles", "grados", "materias", "temas", "aulas", "pcs", "instituciones_educativas"];
    if (!tiposValidos.includes(tipo)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: `Tipo inválido. Debe ser uno de: ${tiposValidos.join(", ")}` }),
      };
    }

    const useS3 = process.env.USE_S3 === "true";
    const modificarConfiguracion = useS3
      ? s3Service.modificarConfiguracion
      : dbService.modificarConfiguracion;

    await modificarConfiguracion(tipo, id, datosActualizados);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: useS3
          ? `Elemento de ${tipo} modificado en S3`
          : `Elemento de ${tipo} modificado en base de datos`,
      }),
    };
  } catch (error) {
    console.error("Error en modificarConfiguracion:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error interno del servidor",
        error: error.message,
      }),
    };
  }
};
