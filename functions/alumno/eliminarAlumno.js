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
        body: JSON.stringify({
          message: "El ID del Usuario Alumno es obligatorio",
        }),
      };
    }

    const useS3 = process.env.USE_S3 === "true";
    const eliminarAlumno = useS3
      ? s3Service.eliminarAlumno
      : dbService.eliminarAlumno;

    const alumnoExists = useS3
      ? await s3Service.obtenerAlumno(id)
      : await dbService.obtenerAlumno(id);
    if (!alumnoExists) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Alumno no encontrado",
        }),
      };
    } 
    // Eliminar el alumno
    await eliminarAlumno(id); 

    // Eliminar el usuario asociado
    const eliminarUsuario = useS3
      ? s3Service.eliminarUsuario
      : dbService.eliminarUsuario;
    await eliminarUsuario(id);  

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: useS3
          ? "Alumno eliminada en S3"
          : "Alumno eliminada en base de datos",
      }),
    };
  } catch (error) {
    console.error("Error en deleteAlumno:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error interno del servidor",
        error: error.message,
      }),
    };
  }
};
