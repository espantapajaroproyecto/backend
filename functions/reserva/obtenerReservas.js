require('dotenv').config()
const dbService = require('../../services/dbService');
const s3Service = require('../../services/s3Service');

module.exports.handler = async (event) => {  
  const useS3 = process.env.USE_S3 == 'true';
  const obtenerReservas = useS3 ? s3Service.obtenerReservas : dbService.obtenerReservas;

  try {
    const results = await obtenerReservas();

    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: useS3
            ? 'Reservas cargados desde S3'
            : 'Reservas cargados desde Aurora',
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
          message: 'Error al obtener los reservas',
          error: error.message,
        },
        null,
        2
      ),
    };
  }
};
