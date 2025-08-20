require("dotenv").config();
const dbService = require("../../services/dbService");
const s3Service = require("../../services/s3Service");
const { hashPassword } = require("../../utils/utils");

const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;

module.exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    const {
      nombre,
      apellido,
      celular,
      dni,
      mail,
      contrasenia,
      institucion_id,
    } = body;

    // Validar campos obligatorios
    if (
      !dni ||
      !nombre ||
      !apellido ||
      !mail ||
      !contrasenia ||
      !celular ||
      !institucion_id
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
    const agregarAlumno = useS3
      ? s3Service.agregarAlumno
      : dbService.agregarAlumno;
    const buscarUsuario = useS3
      ? s3Service.buscarUsuarioPorDniOMail
      : dbService.buscarUsuarioPorDniOMail;

    // Verificar si ya existe usuario con ese dni o mail
    let usuario = await buscarUsuario(dni, mail);
    if (!usuario) {
      const contraseniaHasheada = await hashPassword(contrasenia);
      usuario = {
        dni,
        nombre,
        apellido,
        mail,
        contrasenia: contraseniaHasheada,
        celular,
        rol_id: 1, // alumno
      };
      usuario = await agregarUsuario(usuario);
      
    }

    //JWT con rol incluido
    if (institucion_id) {
      if (usuario && usuario.id) {
        const { id } = usuario;
        await agregarAlumno({
          usuario_id: id,
          institucion_id,
        });
      }
    }

    const token = jwt.sign(
      {
        dni: usuario.dni,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        mail: usuario.mail,
        celular: usuario.celular,
        rol: "alumno", // ej: "alumno", "profesor", "admin"
      },
      SECRET
      //{ expiresIn: '2h' }
    );

    return {
      statusCode: 201,
      body: JSON.stringify({
        token,
        message: useS3
          ? "Alumno guardado en S3"
          : "Alumno guardado en base de datos",
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
