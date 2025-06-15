require('dotenv').config()
const dbService = require('../../services/dbService');
const s3Service = require('../../services/s3Service');

module.exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const { nombre, apellido, usuario, contrasenia, telefono, dni } = body;

        if (!nombre || !apellido || !usuario || !contrasenia || !dni) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Faltan campos obligatorios' }),
            };
        }

        const useS3 = process.env.USE_S3 === 'true';
        const agregarUsuario = useS3 ? s3Service.agregarUsuario : dbService.agregarUsuario;

        await agregarUsuario({ nombre, apellido, usuario, contrasenia, telefono, dni });

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: useS3 ? 'Usuario guardado en S3' : 'Usuario guardado en base de datos',
                user: body,
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
