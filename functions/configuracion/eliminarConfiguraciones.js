require("dotenv").config();
const dbService = require("../../services/dbService");
const s3Service = require("../../services/s3Service");
const { makeHeader } = require("../../utils/utils");

module.exports.handler = async (event) => {
  try {
    
    const body = JSON.parse(event.body);

    const { tipo, id } = body;

    if (!tipo || !id) {
      return {
        statusCode: 400,
        headers: makeHeader(),
        body: JSON.stringify({ message: "El tipo y el ID son obligatorios" }),
      };
    }

    // Validar que el tipo sea uno válido
    const tiposValidos = ["niveles", "grados", "materias", "temas", "aulas", "pcs", "instituciones_educativas"];
    if (!tiposValidos.includes(tipo)) {
      return {
        statusCode: 400,
        headers: makeHeader(),
        body: JSON.stringify({ message: `Tipo inválido. Debe ser uno de: ${tiposValidos.join(", ")}` }),
      };
    }

    const useS3 = process.env.USE_S3 === "true";
    const eliminarConfiguraciones = useS3
      ? s3Service.eliminarConfiguraciones
      : dbService.eliminarConfiguraciones;

    await eliminarConfiguraciones(tipo, id);

    return {
      statusCode: 200,
      headers: makeHeader(),
      body: JSON.stringify({
        message: useS3
          ? `Elemento de ${tipo} eliminado en S3`
          : `Elemento de ${tipo} eliminado en base de datos`,
      }),
    };
  } catch (error) {
    console.error("Error en deleteConfiguracion:", error);
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
