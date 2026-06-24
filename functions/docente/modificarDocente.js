require("dotenv").config();
const dbService = require("../../services/dbService");
const s3Service = require("../../services/s3Service");
const { hashPassword, makeHeader } = require("../../utils/utils");

module.exports.handler = async (event) => {
  try {
    console.log({ event });

    const body = JSON.parse(event.body);

    const {
      id,
      habilitado,
      valor_hora,
      dni,
      nombre,
      apellido,
      mail,
      celular,
      color,
    } = body;
    let itemModificado = null;
    if (!id) {
      return {
        statusCode: 400,
        headers: makeHeader(),
        body: JSON.stringify({
          message: "Se requiere Id del Usuario docente, para buscar al usuario",
        }),
      };
    }

    const useS3 = process.env.USE_S3 === "true";

    const obtenerDocentes = useS3
      ? s3Service.obtenerDocentes
      : dbService.obtenerDocentes;

    const modificarDocente = useS3
      ? s3Service.modificarDocente
      : dbService.modificarDocente;

    const modificarUsuario = useS3
      ? s3Service.modificarUsuario
      : dbService.modificarUsuario;

    const docenteAModificar = await obtenerDocentes({ profesorId: id });
    console.log({ docenteAModificar });
    if (docenteAModificar.length === 0) {
      return {
        statusCode: 404,
        headers: makeHeader(),
        body: JSON.stringify({ message: "No se encontró el docente" }),
      };
    }
    if (
      color !== undefined ||
      habilitado !== undefined ||
      valor_hora !== undefined
    ) {
      itemModificado = await modificarDocente(id, {
        ...(habilitado !== undefined && { habilitado }),
        ...(color !== undefined && { color }),
        ...(valor_hora !== undefined && { valor_hora }),
      });
    }
    if (
      dni !== undefined ||
      nombre !== undefined ||
      apellido !== undefined ||
      mail !== undefined ||
      celular !== undefined
    ) {
      const { usuario_id } = docenteAModificar[0];
      console.log({ usuario_id });
      
      await modificarUsuario(usuario_id, {
        ...(dni !== undefined && { dni }),
        ...(nombre !== undefined && { nombre }),
        ...(apellido !== undefined && { apellido }),
        ...(mail !== undefined && { mail }),
        ...(celular !== undefined && { celular }),
      });
    }

    return {
      statusCode: 200,
      headers: makeHeader(),
      body: JSON.stringify({
        message: useS3
          ? "Docente modificado en S3"
          : "Docente modificado en base de datos",
      }),
    };
  } catch (error) {
    console.error("Error en modificarDocente:", error);
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
