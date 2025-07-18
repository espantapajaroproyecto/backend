const mysql = require("mysql2/promise");

const connectionConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 10000,
};

async function agregarUsuario(user) {
  try {
    const connection = await mysql.createConnection(connectionConfig);
    const { nombre, apellido, usuario, contrasenia, telefono, dni } = user;
    const sql = `INSERT INTO usuario (nombre, apellido, username, contrasenia, telefono, dni) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [nombre, apellido, usuario, contrasenia, telefono, dni];
    await connection.execute(sql, values);
  } finally {
    await connection.end();
  }
}

async function obtenerUsuarioPorDNI(dni) {
  try {
    const connection = await mysql.createConnection(connectionConfig);
    const [rows] = await connection.execute(
      "SELECT * FROM usuario WHERE dni = ?",
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
    const [rows] = await connection.execute(`SELECT 
                                              u.id,
                                              u.dni,
                                              u.nombre,
                                              u.apellido,
                                              u.mail,
                                              u.contrasenia,
                                              u.celular,
                                              u.rol_id,
                                              JSON_OBJECT('id', r.id, 'nombre', r.nombre) AS rol
                                            FROM usuario u
                                            JOIN rol r ON r.id = u.rol_id`);
    return rows;
  } finally {
    await connection.end();
  }
}

async function obtenerNombreRolPorId(rol_id) {
  const query = "SELECT nombre FROM Rol WHERE rol_id = ?";
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

// RESERVAS

async function agregarReserva(reserva) {
  const connection = await mysql.createConnection(connectionConfig);
  try {
    const sql = `INSERT INTO reserva 
      (fecha_hora, tiempo, profesor_id, alumno_id, materia_id, tema_id, aula_id, estado, observaciones, modalidad, pc_id, en_instituto, grupal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      reserva.fecha_hora,
      reserva.tiempo,
      reserva.profesor_id,
      reserva.alumno_id,
      reserva.materia_id,
      reserva.tema_id,
      reserva.aula_id,
      reserva.estado || "PENDIENTE",
      reserva.observaciones || null,
      reserva.modalidad !== undefined ? reserva.modalidad : true,
      reserva.pc_id || null,
      reserva.en_instituto !== undefined ? reserva.en_instituto : true,
      reserva.grupal !== undefined ? reserva.grupal : false,
    ];
    const [result] = await connection.execute(sql, values);
    return { id: result.insertId };
  } finally {
    await connection.end();
  }
}

async function obtenerReservas() {
  const connection = await mysql.createConnection(connectionConfig);
  try {
    const sql = `
      SELECT 
        r.*,
        JSON_OBJECT('id', p.id, 'nombre', p.nombre) AS profesor,
        JSON_OBJECT('id', a.id, 'nombre', a.nombre) AS alumno
      FROM reserva r
      JOIN profesor p ON p.id = r.profesor_id
      JOIN alumno a ON a.id = r.alumno_id
    `;
    const [rows] = await connection.execute(sql);
    return rows;
  } finally {
    await connection.end();
  }
}

async function modificarReserva(id, camposNuevos) {
  const connection = await mysql.createConnection(connectionConfig);
  try {
    const campos = [];
    const valores = [];
    for (const [key, value] of Object.entries(camposNuevos)) {
      campos.push(`${key} = ?`);
      valores.push(value);
    }
    if (campos.length === 0) return null;

    valores.push(id);
    const sql = `UPDATE reserva SET ${campos.join(", ")} WHERE id = ?`;
    const [result] = await connection.execute(sql, valores);
    return result.affectedRows;
  } finally {
    await connection.end();
  }
}

async function eliminarReserva(id) {
  const connection = await mysql.createConnection(connectionConfig);
  try {
    const sql = `DELETE FROM reserva WHERE id = ?`;
    const [result] = await connection.execute(sql, [id]);
    return result.affectedRows;
  } finally {
    await connection.end();
  }
}

// DOCENTES
async function agregarDocente(docente) {
  const connection = await mysql.createConnection(connectionConfig);
  try {
    const sql = `INSERT INTO docente (usuario_id, habilitado, valor_hora) VALUES (?, ?, ?)`;
    const values = [
      docente.usuario_id,
      docente.habilitado !== undefined ? docente.habilitado : true,
      docente.valor_hora,
    ];
    const [result] = await connection.execute(sql, values);
    return { id: result.insertId };
  } finally {
    await connection.end();
  }
}

async function obtenerDocentes() {
  const connection = await mysql.createConnection(connectionConfig);
  try {
    const sql = `
      SELECT d.*, 
        JSON_OBJECT('id', u.id, 'nombre', u.nombre, 'apellido', u.apellido, 'mail', u.mail, 'celular', u.celular) AS usuario
      FROM docente d
      JOIN usuario u ON u.id = d.usuario_id
    `;
    const [rows] = await connection.execute(sql);
    return rows;
  } finally {
    await connection.end();
  }
}

async function modificarDocente(id, camposNuevos) {
  const connection = await mysql.createConnection(connectionConfig);
  try {
    const campos = [];
    const valores = [];
    for (const [key, value] of Object.entries(camposNuevos)) {
      campos.push(`${key} = ?`);
      valores.push(value);
    }
    if (campos.length === 0) return null;

    valores.push(id);
    const sql = `UPDATE docente SET ${campos.join(", ")} WHERE id = ?`;
    const [result] = await connection.execute(sql, valores);
    return result.affectedRows;
  } finally {
    await connection.end();
  }
}

async function eliminarDocente(id) {
  const connection = await mysql.createConnection(connectionConfig);
  try {
    const sql = `DELETE FROM docente WHERE id = ?`;
    const [result] = await connection.execute(sql, [id]);
    return result.affectedRows;
  } finally {
    await connection.end();
  }
}

// CONFIGURACIONES - GRADOS - MATERIAS - NIVELES - AULAS - PCS - TEMAS
async function obtenerConfiguraciones() {
  const connection = await mysql.createConnection(connectionConfig);
  try {
    const sql = `          
      SELECT JSON_OBJECT(
          'grados', (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'id', g.id,
                'numero', g.numero,
                'nivel_id', g.nivel_id,
                'nivel', JSON_OBJECT(
                  'id', n.id,
                  'nombre', n.nombre
                )
              )
            )
            FROM grado g
            JOIN nivel n ON g.nivel_id = n.id
          ),
          'materias', (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'id', m.id,
                'nombre', m.nombre,
                'grado_id', m.grado_id,
                'habilitado', m.habilitado,
                'grado', JSON_OBJECT(
                  'id', g.id,
                  'numero', g.numero,
                  'nivel_id', g.nivel_id
                )
              )
            )
            FROM materia m
            JOIN grado g ON m.grado_id = g.id
          ),
          'niveles', (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'id', id,
                'nombre', nombre
              )
            )
            FROM nivel
          ),
          'aulas', (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'id', id,
                'numero', numero,
                'nombre', nombre,
                'disponible', disponible
              )
            )
            FROM aula
          ),
          'pcs', (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'id', id,
                'tipo', tipo,
                'disponible', disponible
              )
            )
            FROM pc
          ),
          'temas', (
          SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', t.id,
            'nombre', t.nombre,
            'materia_id', mt.id,
            'materia', JSON_OBJECT(
            'id', mt.id,
            'nombre', mt.nombre,
            'grado_id', mt.grado_id,
            'habilitado', mt.habilitado
            )
          )
          )
          FROM tema t
          JOIN materia mt ON t.materia_id = mt.id
        )
      ) AS configuraciones;
          `;
    let [results] = await connection.execute(sql);
    if (results.length > 0) {
      return results[0];
    }
    return [];
  } finally {
    await connection.end();
  }
}

module.exports = {
  agregarUsuario,
  obtenerUsuarioPorDNI,
  obtenerUsuarios,
  agregarReserva,
  obtenerReservas,
  modificarReserva,
  eliminarReserva,
  agregarDocente,
  obtenerDocentes,
  modificarDocente,
  eliminarDocente,
  buscarUsuarioPorDniOMail,
  obtenerConfiguraciones,
};
