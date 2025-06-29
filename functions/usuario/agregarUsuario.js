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
    const { dni, nombre, apellido, mail, contrasenia, celular, rol_id } = body;

    if (
      !dni ||
      !nombre ||
      !apellido ||
      !mail ||
      !contrasenia ||
      !celular ||
      !rol_id
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
      rol_id,
    });

    const user = await buscarUsuario(dni, mail);

    // const rol = useS3
    //     ? await s3Service.obtenerNombreRolPorId(user.rol_id)
    //     : await dbService.obtenerNombreRolPorId(user.rol_id);

    //JWT con rol incluido
    const token = jwt.sign(
      {
        dni: user.dni,
        nombre: user.nombre,
        apellido: user.apellido,
        mail: user.mail,
        celular: user.celular,
        rol: user?.rol?.nombre, // ej: "alumno", "profesor", "admin"
      },
      SECRET
      //{ expiresIn: '2h' }
    );
    console.log([token]);

    return {
      statusCode: 201,
      body: JSON.stringify({
        token,
        message: useS3
          ? "Usuario guardado en S3"
          : "Usuario guardado en base de datos",
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
