require('dotenv').config();
const dbService = require('../../services/dbService');
const s3Service = require('../../services/s3Service');
const UTILS = require('../../utils/utils');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;

module.exports.handler = async (event) => {
  try {
    console.log({ event });

    const body = JSON.parse(event.body);
    const { dni, contrasenia } = JSON.parse(event.body);
    // const { valid, message } = UTILS.validarLoginInput(usuario, contrasenia);
    // if (!valid) {
    //   return {
    //     statusCode: 400,
    //     body: JSON.stringify({ message }),
    //   };
    // }

    const useS3 = process.env.USE_S3 === 'true';
    const obtenerUsuarioPorDNI = useS3 ? s3Service.obtenerUsuariosConRoles : dbService.obtenerUsuarioPorDNI;

    const user = await obtenerUsuarioPorDNI(dni);
    console.log({user});
    

    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Usuario no encontrado' }),
      };
    }

    const isValid = await UTILS.compararContrasenias(contrasenia, user.contrasenia);
    if (!isValid) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Password incorrecta' }),
      };
    }

    //JWT con rol incluido
    const token = jwt.sign(
      {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        dni: user.dni,
        rol: user.rol, // ej: "alumno", "profesor", "admin"
      },
      SECRET,
      //{ expiresIn: '2h' }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Login exitoso',
        token,
        user: {
          id: user.id || null, // S3 no tiene ID
          nombre: user.nombre,
          apellido: user.apellido,
          usuario: user.usuario || user.usuario, // en S3 usamos "usuario"
          //agregar rol en s3
          rol: user.rol || null, // agregamos el rol si viene de base
        }, 
      }),
    };
  } catch (error) {
    console.error('Error en login:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error interno', error: error.message }),
    };
  }
};
