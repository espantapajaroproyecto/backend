require("dotenv").config();
const dbService = require("../../services/dbService");
const s3Service = require("../../services/s3Service");
const { validarCuerpoEvento, makeHeader } = require("../../utils/utils");

const CAMPOS_REQUERIDOS = ["alumnoId"];

module.exports.handler = async (event) => {
  const useS3 = process.env.USE_S3 == "true";
  const params = event?.queryStringParameters || null;

  const obtenerAlumnos = useS3
    ? s3Service.obtenerAlumnos
    : dbService.obtenerAlumnos;

  if (params && !validarCuerpoEvento(params, CAMPOS_REQUERIDOS)) {
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
    const results = !params
      ? await obtenerAlumnos()
      : await obtenerAlumnos(params);

    return {
      statusCode: 200,
      headers: makeHeader(),
      body: JSON.stringify(
        {
          message: useS3
            ? "Alumno cargados desde S3"
            : "Alumno cargados desde Aurora",
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
