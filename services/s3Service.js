const AWS = require('aws-sdk');
const s3 = new AWS.S3();


const BUCKET = process.env.S3_BUCKET;
const KEY = process.env.S3_KEY;


async function agregarUsuario(user) {
  const data = await s3.getObject({ Bucket: BUCKET, Key: KEY }).promise();
  const users = JSON.parse(data.Body.toString());

  const maxId = users.reduce((max, u) => (u.id > max ? u.id : max), 0);
  const newId = Number(maxId) + 1;
  const userWithId = { id: newId, ...user };
  users.push(userWithId);


  await s3.putObject({
    Bucket: BUCKET,
    Key: KEY,
    Body: JSON.stringify(users, null, 2),
    ContentType: 'application/json',
  }).promise();
}

async function obtenerUsuarioPorDNI(dni) {
  const data = await s3.getObject({ Bucket: BUCKET, Key: KEY }).promise();
  const users = JSON.parse(data.Body.toString());
  return users.find((u) => u.dni == dni) || null;
}

async function obtenerUsuarios() {
  const data = await s3.getObject({ Bucket: BUCKET, Key: KEY }).promise();
  const users = JSON.parse(data.Body.toString());
  return users;
}

// sls invoke local --function usuarioLogin --path ./data/eventos/evento_login.json

module.exports = {
  agregarUsuario,
  obtenerUsuarioPorDNI,
  obtenerUsuarios
};
