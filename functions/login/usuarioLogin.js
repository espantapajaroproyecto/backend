const mysql = require('mysql2/promise');

module.exports.handler = async (event) => {
  const connectionConfig = {
    host: process.env.DB_HOST,       // Aurora endpoint
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_USER,
    connectTimeout: 10000,
  };
  let connection;
  try {
    const body = JSON.parse(event.body);
    console.log(body);
    const { username, password } = body;

    if (!username || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Username y password requeridos' }),
      };
    }

    connection = await mysql.createConnection(connectionConfig);
    const [rows] = await connection.execute(
      'SELECT * FROM usuario WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Usuario no encontrado' }),
      };
    }

    const user = rows[0];

    const validPassword = password == user.password;
    if (!validPassword) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Password incorrecta' }),
      };
    }

    // Aquí podrías generar y devolver un JWT si querés
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Login exitoso',
        user: {
          id: user.id,
          nombre: user.nombre,
          apellido: user.apellido,
          username: user.username,
        },
      }),
    };
  } catch (error) {
    console.error('Error en login:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error interno', error: error.message }),
    };
  } finally {
    if (connection) await connection.end();
  }
};
