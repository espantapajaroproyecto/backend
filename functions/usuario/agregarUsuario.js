const mysql = require('mysql2/promise');

module.exports.handler = async (event) => {
    const connectionConfig = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        connectTimeout: 10000,
    };

    let connection;

    try {
        // Parsear el body JSON del evento
        const body = JSON.parse(event.body);

        // Validar campos mínimos (puedes agregar más validaciones)
        const { nombre, apellido, usuario, password, telefono, dni } = body;
        if (!nombre || !apellido || !usuario || !password || !dni) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Faltan campos obligatorios' }),
            };
        }

        connection = await mysql.createConnection(connectionConfig);

        // Query para insertar usuario (ajusta el nombre de tabla y columnas)
        const sql = `INSERT INTO usuario (nombre, apellido, username, password, telefono, dni) VALUES (?, ?, ?, ?, ?, ?)`;
        const values = [nombre, apellido, usuario, password, telefono, dni];

        await connection.execute(sql, values);

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: 'Usuario creado con éxito',
                user: body,
            }),
        };
    } catch (error) {
        console.error('DB error:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error en conexión con Aurora MySQL',
                error: error.message,
            }),
        };
    } finally {
        if (connection) await connection.end();
    }
};