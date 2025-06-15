const mysql = require('mysql2/promise');

const connectionConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: 10000,
};

async function agregarUsuario(user) {
    const connection = await mysql.createConnection(connectionConfig);
    try {
        const { nombre, apellido, usuario, contrasenia, telefono, dni } = user;
        const sql = `INSERT INTO usuario (nombre, apellido, username, contrasenia, telefono, dni) VALUES (?, ?, ?, ?, ?, ?)`;
        const values = [nombre, apellido, usuario, contrasenia, telefono, dni];
        await connection.execute(sql, values);
    } finally {
        await connection.end();
    }
}

async function obtenerUsuarioPorDNI(dni) {
    const connection = await mysql.createConnection(connectionConfig);
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM usuario WHERE dni = ?',
            [username]
        );
        return rows[0] || null;
    } finally {
        await connection.end();
    }
}

async function obtenerUsuarios() {
    const connection = await mysql.createConnection(connectionConfig);
    try {
        const [rows] = await connection.execute('SELECT * FROM usuario');
        return rows;
    } finally {
        await connection.end();
    }
}

module.exports = {
    agregarUsuario,
    obtenerUsuarioPorDNI,
    obtenerUsuarios
};
