const AWS = require('aws-sdk');
const s3 = new AWS.S3();


const BUCKET = process.env.S3_BUCKET;
const USERS_KEY = process.env.S3_KEY;
const ROLES_KEY = process.env.S3_ROLES_KEY;   // roles.json

async function agregarUsuario(user) {
  const data = await s3.getObject({ Bucket: BUCKET, Key: USERS_KEY }).promise();
  const users = JSON.parse(data.Body.toString());

  const maxId = users.reduce((max, u) => (u.id > max ? u.id : max), 0);
  const newId = Number(maxId) + 1;
  const userWithId = { id: newId, ...user };
  users.push(userWithId);


  await s3.putObject({
    Bucket: BUCKET,
    Key: USERS_KEY,
    Body: JSON.stringify(users, null, 2),
    ContentType: 'application/json',
  }).promise();
}

async function obtenerUsuarioPorDNI(dni) {
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
    s3.getObject({ Bucket: BUCKET, Key: ROLES_KEY }).promise()
  ]);

  const users = JSON.parse(usersData.Body.toString());
  const roles = JSON.parse(rolesData.Body.toString());

  // Crear mapa rol_id → nombre
  const rolesMap = {};
  roles.forEach(rol => {
    rolesMap[rol.id] = rol.nombre;
  });

  // Agregar el nombre del rol a cada usuario
  const usuariosConRoles = users.map(user => ({
    ...user,
    rol: rolesMap[user.rol_id] || 'desconocido'
  }));

  return usuariosConRoles;
}

// sls invoke local --function usuarioLogin --path ./data/eventos/evento_login.json

module.exports = {
  agregarUsuario,
  obtenerUsuarioPorDNI,
  obtenerUsuarios,
  obtenerUsuariosConRoles
};
