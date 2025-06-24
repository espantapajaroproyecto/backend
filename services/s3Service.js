const AWS = require("aws-sdk");
const s3 = new AWS.S3();

const BUCKET = process.env.S3_BUCKET;
const USERS_KEY = process.env.S3_KEY;
const ROLES_KEY = process.env.S3_ROLES_KEY; // roles.json

const tablas = {
  usuarios: {
    campos: [
      "id",
      "nombre",
      "apellido",
      "dni",
      "rol_id",
      "grado_id",
      "unidad_id",
      "arma_id",
      "email",
    ],
    relaciones: {
      rol_id: "roles",
      grado_id: "grados",
      unidad_id: "unidades",
      arma_id: "armas",
    },
  },

  roles: {
    campos: ["id", "nombre"],
    relaciones: {},
  },

  grados: {
    campos: ["id", "nombre"],
    relaciones: {},
  },

  unidades: {
    campos: ["id", "nombre"],
    relaciones: {},
  },

  armas: {
    campos: ["id", "nombre"],
    relaciones: {},
  },

  escalafones: {
    campos: ["id", "nombre"],
    relaciones: {},
  },

  cargos: {
    campos: ["id", "nombre"],
    relaciones: {},
  },

  destinos: {
    campos: ["id", "nombre"],
    relaciones: {},
  },
};

async function agregar(key, dataNueva) {
  try {

    const respuesta = await s3.getObject({ Bucket: BUCKET, Key: key }).promise();

    // response.Body es un Buffer, lo convertimos a string
    const jsonString = respuesta.Body.toString("utf-8");

    // luego parseamos a objeto JS
    const data = JSON.parse(jsonString);

    const maxId = data.reduce((max, d) => (d.id > max ? d.id : max), 0);
    const newId = Number(maxId) + 1;
    const dataWithId = { id: newId, ...dataNueva };
    data.push(dataWithId);

    await s3
      .putObject({
        Bucket: BUCKET,
        Key: key,
        Body: JSON.stringify(data, null, 2),
        ContentType: "application/json",
      })
      .promise();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Usuarios
async function agregarUsuario(user) {
  return await agregar(USERS_KEY, user);
}

async function obtenerUsuarioPorDNI(dni) {
  // populada
  const data = await s3.getObject({ Bucket: BUCKET, Key: USERS_KEY }).promise();
  const users = JSON.parse(data.Body.toString());
  return users.find((u) => u.dni == dni) || null;
}

async function obtenerUsuarios() {
  const data = await s3.getObject({ Bucket: BUCKET, Key: USERS_KEY }).promise();
  const users = JSON.parse(data.Body.toString());
  return users;
}

async function obtenerUsuariosConRoles() {
  const [usersData, rolesData] = await Promise.all([
    s3.getObject({ Bucket: BUCKET, Key: USERS_KEY }).promise(),
    s3.getObject({ Bucket: BUCKET, Key: ROLES_KEY }).promise(),
  ]);

  const users = JSON.parse(usersData.Body.toString());
  const roles = JSON.parse(rolesData.Body.toString());

  // Crear mapa rol_id → nombre
  const rolesMap = {};
  roles.forEach((rol) => {
    rolesMap[rol.id] = rol.nombre;
  });

  // Agregar el nombre del rol a cada usuario
  const usuariosConRoles = users.map((user) => ({
    ...user,
    rol: rolesMap[user.rol_id] || "desconocido",
  }));

  return usuariosConRoles;
}

// sls invoke local --function usuarioLogin --path ./data/eventos/evento_login.json

module.exports = {
  agregarUsuario,
  obtenerUsuarioPorDNI,
  obtenerUsuarios,
  obtenerUsuariosConRoles,
};
