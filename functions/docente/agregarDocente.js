require("dotenv").config();
const dbService = require("../../services/dbService");
const s3Service = require("../../services/s3Service");
const { hashPassword } = require("../../utils/utils");

const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;

module.exports.handler = async (event) => {
  try {
    console.log("event.body:", event.body);
    const body = JSON.parse(event.body);

    const {
      nombre,
      apellido,
      usuario,
      contrasenia,
      celular,
      dni,
      mail,
      habilitado,
      valor_hora,
    } = body;

    // Validar campos obligatorios
    if (
      !dni ||
      !nombre ||
      !apellido ||
      !mail ||
      !contrasenia ||
      !celular ||
      !usuario
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Faltan campos obligatorios" }),
      };
    }
    const useS3 = process.env.USE_S3 === "true";
    const agregarUsuario = useS3
      ? s3Service.agregarUsuario
      : dbService.agregarUsuario;
    const agregarDocente = useS3
      ? s3Service.agregarDocente
      : dbService.agregarDocente;
    const buscarUsuario = useS3
      ? s3Service.buscarUsuarioPorDniOMail
      : dbService.buscarUsuarioPorDniOMail;

    // Verificar si ya existe usuario con ese dni o mail
    let usuarioExistente = await buscarUsuario(dni, mail);
    if (usuarioExistente?.rol) {
      usuarioExistente.rol = usuarioExistente.rol.nombre;
    }

    if (usuarioExistente) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          message: "Ya existe un usuario con ese DNI o correo",
        }),
      };
    }

    const contraseniaHasheada = await hashPassword(contrasenia);

    await agregarUsuario({
      dni,
      nombre,
      apellido,
      mail,
      contrasenia: contraseniaHasheada,
      celular,
      rol_id: 2, // docente
    });

    //JWT con rol incluido

    let nuevoUsuario = await buscarUsuario(dni, mail);
    if (habilitado && valor_hora) {
      if (nuevoUsuario) {
        const { id } = nuevoUsuario;
        await agregarDocente({ usuario_id: id, habilitado, valor_hora });
      }
    }

    const token = jwt.sign(
      {
        dni: nuevoUsuario.dni,
        nombre: nuevoUsuario.nombre,
        apellido: nuevoUsuario.apellido,
        mail: nuevoUsuario.mail,
        celular: nuevoUsuario.celular,
        rol: "profesor", // ej: "alumno", "profesor", "admin"
      },
      SECRET
      //{ expiresIn: '2h' }
    );
    // console.log([token]);

    return {
      statusCode: 201,
      body: JSON.stringify({
        token,
        message: useS3
          ? "Docente guardado en S3"
          : "Docente guardado en base de datos",
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error interno",
        error: error.message,
      }),
    };
  }
};
