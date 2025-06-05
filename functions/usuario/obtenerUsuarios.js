const mysql = require("mysql");

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432,
  // connectTimeout: 10000, // 10 segundos
});

function queryDatabase(sql) {
  return new Promise((resolve, reject) => {
    connection.query(sql, (error, results, fields) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
}

module.exports.handler = async (event) => {
  try {
    const results = await queryDatabase("SELECT * FROM usuario");
    console.log(results);

    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: "Conectado a Aurora con éxito",
          results,
        },
        null,
        2
      ),
    };
  } catch (error) {
    console.error("DB error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify(
        {
          message: "Error en conexión con Aurora",
          error: error.message,
        },
        null,
        2
      ),
    };
  } finally {
    connection.end(); // importante cerrar siempre
  }
};
