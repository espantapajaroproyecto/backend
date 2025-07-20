require("dotenv").config();
const dbService = require("../../services/dbService");
const s3Service = require("../../services/s3Service");

module.exports.handler = async (event) => {
  const useS3 = process.env.USE_S3 == "true";

  try {
    // {
    //   gradoId: "2" // gradoId : 2
    //   fechaInicio: "2025-07-18" // opcional
    //   fechaFin: "2025-07-30" // opcional
    //   materiaId: "7"
    //   temaId: "3"
    //   nivelId: "1" // nivelId
    //   profesorId: "", // profesorId
    //   modalidad: "PRESENCIAL"
    //   frecuencia: "FIJA"
    // }
    const body = JSON.parse(event.body);
    
    // Campos requeridos
    const requiredFields = [
      "gradoId",
      "materiaId",
      "temaId",
      "nivelId",
      "modalidad",
      "frecuencia",
    ];

    // Verificar campos obligatorios
    const missingFields = requiredFields.filter(
      (field) => !body[field] || body[field].toString().trim() === ""
    );

    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Faltan campos requeridos: ${missingFields.join(", ")}`,
        }),
      };
    }

    const obtenerDisponiblesPor = useS3
      ? s3Service.obtenerDisponiblesPor
      : dbService.obtenerDisponiblesPor;

    const results = await obtenerDisponiblesPor(body);

    // return {
    //   statusCode: 200,
    //   body: JSON.stringify(
    //     {
    //       message: useS3
    //         ? 'Disponibles cargados desde S3'
    //         : 'Disponibles cargados desde Aurora',
    //       results,
    //     },
    //     null,
    //     2
    //   ),
    // };
  } catch (error) {
    console.error("DB error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify(
        {
          message: "Error al obtener los docentes",
          error: error.message,
        },
        null,
        2
      ),
    };
  }
};
