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
            // Consulta si usamos con roll
            // `SELECT u.id, u.nombre, u.apellido, u.usuario, u.dni, u.contrasenia, r.nombre AS rol
            // FROM usuario u
            // LEFT JOIN roles r ON u.rol_id = r.id
            // WHERE u.dni = ?`,
            // [dni]
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

async function obtenerNombreRolPorId(rol_id) {
  const query = 'SELECT nombre FROM Rol WHERE rol_id = ?';
  const [rows] = await connection.execute(query, [rol_id]);
  return rows.length > 0 ? rows[0].nombre : null;
}
// dbService.js

async function buscarUsuarioPorDniOMail(dni, mail) {
  const result = await pool.query(
    "SELECT * FROM usuarios WHERE dni = $1 OR mail = $2 LIMIT 1",
    [dni, mail]
  );
  return result.rows[0] || null;
}

module.exports = {
    agregarUsuario,
    obtenerUsuarioPorDNI,
    obtenerUsuarios
};
