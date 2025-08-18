require("dotenv").config();
const dbService = require("../../services/dbService");
const s3Service = require("../../services/s3Service");
const { validarCuerpoEvento, makeHeader } = require("../../utils/utils");

const CAMPOS_REQUERIDOS = ["profesorId"];

module.exports.handler = async (event) => {
  const useS3 = process.env.USE_S3 == "true";
  const cuerpo = event?.body && JSON.parse(event?.body);
  const obtenerDocentes = useS3
    ? s3Service.obtenerDocentes
    : dbService.obtenerDocentes;

  try {
    const results = await obtenerDocentes(cuerpo);

    return {
      statusCode: 200,
      headers: makeHeader(),
      body: JSON.stringify(
        {
          message: useS3
            ? "Docentes cargados desde S3"
            : "Docentes cargados desde Aurora",
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
          message: "Error al obtener los docentes",
          error: error.message,
        },
        null,
        2
      ),
    };
  }
};
