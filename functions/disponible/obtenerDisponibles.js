require('dotenv').config()
const dbService = require('../../services/dbService');
const s3Service = require('../../services/s3Service');

module.exports.handler = async (event) => {  
  const useS3 = process.env.USE_S3 == 'true';
  const obtenerDisponibles = useS3 ? s3Service.obtenerDisponibles : dbService.obtenerDisponibles;

  try {
    const results = await obtenerDisponibles();

    return { 
      statusCode: 200,
      body: JSON.stringify(
        {
          message: useS3
            ? 'Disponibles cargados desde S3'
            : 'Disponibles cargados desde Aurora',
          results,
        },
        null,
        2
      ),
    };
  } catch (error) {
    console.error('DB error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify(
        {
          message: 'Error al obtener los docentes',
          error: error.message,
        },
        null,
        2
      ),
    };
  }
};
