require('dotenv').config()
const dbService = require('../../services/dbService');
const s3Service = require('../../services/s3Service');
<<<<<<< Updated upstream
const { hashPassword } = require('../../utils/utils');
=======
const { hashPassword } = require('../../utils/utils'); 
>>>>>>> Stashed changes
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;

module.exports.handler = async (event) => {
    try {
        console.log('event.body:', event.body);
        const body = JSON.parse(event.body);
        const { dni, nombre, apellido, mail, contrasenia, celular, rol_id } = body;

        if (!dni || !nombre || !apellido || !mail || !contrasenia || !celular || !rol_id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Faltan campos obligatorios' }),
            };
        }
        const useS3 = process.env.USE_S3 === 'true';
        const agregarUsuario = useS3 ? s3Service.agregarUsuario : dbService.agregarUsuario;
        const buscarUsuario = useS3 ? s3Service.buscarUsuarioPorDniOMail : dbService.buscarUsuarioPorDniOMail;

        // Verificar si ya existe usuario con ese dni o mail
        const usuarioExistente = await buscarUsuario(dni, mail);
        if (usuarioExistente) {
            return {
                statusCode: 409,
                body: JSON.stringify({ message: 'Ya existe un usuario con ese DNI o correo' }),
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
            rol_id
        });

        const user = await buscarUsuario(dni, mail);

<<<<<<< Updated upstream
        const rol = useS3
            ? await s3Service.obtenerNombreRolPorId(user.rol_id)
            : await dbService.obtenerNombreRolPorId(user.rol_id);
=======
        const nombreRol = useS3
        ? await s3Service.obtenerNombreRolPorId(user.rol_id)
        : await dbService.obtenerNombreRolPorId(user.rol_id);
>>>>>>> Stashed changes

        //JWT con rol incluido
        const token = jwt.sign(
            {
<<<<<<< Updated upstream
                dni: user.dni,
                nombre: user.nombre,
                apellido: user.apellido,
                mail: user.mail,
                celular: user.celular,
                rol, // ej: "alumno", "profesor", "admin"
            },
            SECRET,
            //{ expiresIn: '2h' }
        );
=======
            dni: user.dni,
            nombre: user.nombre,
            apellido: user.apellido,
            mail: user.mail,
            celular: user.celular,
            nombreRol, // ej: "alumno", "profesor", "admin"
            },
            SECRET,
            //{ expiresIn: '2h' }
        ); 
>>>>>>> Stashed changes

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: useS3 ? 'Usuario guardado en S3' : 'Usuario guardado en base de datos',
<<<<<<< Updated upstream
                user: { dni, nombre, apellido, mail, celular, rol }, // omitimos contraseña
=======
                token,
                user: { dni, nombre, apellido, mail, celular, rol: nombreRol }, // omitimos contraseña
>>>>>>> Stashed changes
            }),
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error interno',
                error: error.message,
            }),
        };
    }
};
