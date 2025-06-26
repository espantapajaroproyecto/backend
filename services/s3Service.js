const AWS = require("aws-sdk");
const s3 = new AWS.S3();

const BUCKET = process.env.S3_BUCKET;
const USERS_KEY = process.env.S3_KEY;
const ROLES_KEY = process.env.S3_ROLES_KEY; // roles.json

const TABLAS = {
  ROL_KEY: "roles",
  USUARIO_KEY: "usuarios",
  INSTITUCION_EDUCATIVA_KEY: "instituciones_educativas",
  ALUMNO_KEY: "alumnos",
  PROFESOR_KEY: "profesores",
  NIVEL_KEY: "niveles",
  GRADO_KEY: "grados",
  MATERIA_KEY: "materias",
  TEMA_KEY: "temas",
  PROFESOR_MATERIA_KEY: "profesor_materia",
  AULA_KEY: "aulas",
  PC_KEY: "pcs",
  RESERVA_KEY: "reservas"
};


const tablasRelacion = {
  "roles": [],
  "usuarios": [
    { "key": "roles", "propiedad": "rol_id" }
  ],
  "institucion_educativas": [],
  "alumnos": [
    { "key": "usuarios", "propiedad": "usuario_id" },
    { "key": "instituciones_educativas", "propiedad": "institucion_id" }
  ],
  "profesores": [
    { "key": "usuarios", "propiedad": "usuario_id" }
  ],
  "niveles": [],
  "grados": [
    { "key": "niveles", "propiedad": "nivel_id" }
  ],
  "materias": [
    { "key": "grados", "propiedad": "grado_id" }
  ],
  "temas": [
    { "key": "materias", "propiedad": "materia_id" }
  ],
  "profesor_materia": [
    { "key": "profesores", "propiedad": "profesor_id" },
    { "key": "materias", "propiedad": "materia_id" }
  ],
  "aulas": [],
  "pc": [],
  "reservas": [
    { "key": "profesores", "propiedad": "profesor_id" },
    { "key": "alumnos", "propiedad": "alumno_id" },
    { "key": "materias", "propiedad": "materia_id" },
    { "key": "temas", "propiedad": "tema_id" },
    { "key": "aulas", "propiedad": "aula_id" },
    { "key": "pcs", "propiedad": "pc_id" }
  ]
}


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

async function obtener({ key, propiedad = null, valor = null, populate = true }) {
  // Leer datos base
  const response = await s3.getObject({ Bucket: BUCKET, Key: key + ".json" }).promise();
  const data = JSON.parse(response.Body.toString());

  let result = data;

  // Si hay filtro (como obtenerPor), lo aplicamos
  if (propiedad && valor !== null) {
    result = data.find(e => e[propiedad] == valor) || null;
    if (!populate || !tablasRelacion[key]) return result ? { ...result } : null;
  }

  // Si no hay populate o no hay relaciones definidas
  if (!populate || !tablasRelacion[key]) return result;

  // Determinar si es un array o un solo objeto
  const registros = Array.isArray(result) ? result : [result];

  // Relación de claves a traer
  const relaciones = tablasRelacion[key];
  const relatedDataMap = {};

  // Cargar datos relacionados
  await Promise.all(relaciones.map(async ({ key: relatedKey }) => {
    const response = await s3.getObject({ Bucket: BUCKET, Key: relatedKey + ".json" }).promise();
    const relatedData = JSON.parse(response.Body.toString());
    relatedDataMap[relatedKey] = Object.fromEntries(relatedData.map(obj => [obj.id, obj]));
  }));

  // Realizar populate
  const populated = registros.map(obj => {
    const newObj = { ...obj };
    relaciones.forEach(({ key: relatedKey, propiedad }) => {
      const relatedObj = relatedDataMap[relatedKey]?.[obj[propiedad]];
      if (relatedObj) {
        newObj[propiedad.replace('_id', '')] = relatedObj;
      }
    });
    return newObj;
  });

  return Array.isArray(result) ? populated : populated[0];
}

async function eliminar({ key, propiedad = "id", valor }) {
  const s3Key = key + ".json";

  // Leer datos actuales
  const response = await s3.getObject({ Bucket: BUCKET, Key: s3Key }).promise();
  const data = JSON.parse(response.Body.toString());

  // Filtrar los datos sin el valor especificado
  const nuevosDatos = data.filter(item => item[propiedad] != valor);

  // Guardar nuevamente
  await s3.putObject({
    Bucket: BUCKET,
    Key: s3Key,
    Body: JSON.stringify(nuevosDatos, null, 2),
    ContentType: "application/json"
  }).promise();

  return { eliminado: true, cantidad: data.length - nuevosDatos.length };
}

async function actualizar({ key, propiedad = "id", valor, nuevosValores }) {
  const s3Key = key + ".json";

  // Leer datos actuales
  const response = await s3.getObject({ Bucket: BUCKET, Key: s3Key }).promise();
  const data = JSON.parse(response.Body.toString());

  // Encontrar y actualizar el objeto
  const nuevosDatos = data.map(item => {
    if (item[propiedad] == valor) {
      return { ...item, ...nuevosValores };
    }
    return item;
  });

  // Guardar actualizado
  await s3.putObject({
    Bucket: BUCKET,
    Key: s3Key,
    Body: JSON.stringify(nuevosDatos, null, 2),
    ContentType: "application/json"
  }).promise();

  return { actualizado: true };
}



// Usuarios
async function agregarUsuario(user) {
  return await agregar(USERS_KEY, user);
}

async function obtenerUsuarioPorDNI(dni) {
  const obtenerParams = { key: TABLAS.USUARIO_KEY, propiedad: "dni", valor: dni, populate: true }
  return await obtener(obtenerParams);
}

async function obtenerUsuarios() {
  const obtenerParams = { key: TABLAS.USUARIO_KEY, propiedad: null, valor: null, populate: false }
  return await obtener(obtenerParams);
}

async function obtenerUsuariosConRoles() {
  const obtenerParams = { key: TABLAS.USUARIO_KEY, propiedad: null, valor: null, populate: true }
  return await obtener(obtenerParams);
}

// sls invoke local --function usuarioLogin --path ./data/eventos/evento_login.json

module.exports = {
  agregarUsuario,
  obtenerUsuarioPorDNI,
  obtenerUsuarios,
  obtenerUsuariosConRoles,
};
