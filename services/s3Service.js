const AWS = require("aws-sdk");
const s3 = new AWS.S3();

const BUCKET = process.env.S3_BUCKET;

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
  PROFESOR_TIENE_DISPONIBLE_KEY: "profesor_tiene_disponible",
  AULA_KEY: "aulas",
  PC_KEY: "pcs",
  RESERVA_KEY: "reservas",
  DISPONIBLE_KEY: "disponibles",
};

const tablasRelacion = {
  roles: [],
  usuarios: [{ key: "roles", propiedad: "rol_id" }],
  institucion_educativas: [],
  alumnos: [
    { key: "usuarios", propiedad: "usuario_id" },
    { key: "instituciones_educativas", propiedad: "usuario_id" },
  ],
  profesores: [{ key: "usuarios", propiedad: "usuario_id" }],
  niveles: [],
  grados: [{ key: "niveles", propiedad: "nivel_id" }],
  materias: [{ key: "grados", propiedad: "grado_id" }],
  disponibles: [],
  temas: [{ key: "materias", propiedad: "materia_id" }],
  profesor_materia: [
    { key: "profesores", propiedad: "usuario_id" },
    { key: "materias", propiedad: "materia_id" },
  ],
  profesor_tiene_disponible: [
    { key: "usuarios", propiedad: "usuario_id" },
    { key: "disponibles", propiedad: "disponible_id" },
  ],
  aulas: [],
  pc: [],
  reservas: [
    { key: "profesores", propiedad: "usuario_id" },
    { key: "alumnos", propiedad: "alumno_id" },
    { key: "materias", propiedad: "materia_id" },
    { key: "temas", propiedad: "tema_id" },
    { key: "aulas", propiedad: "aula_id" },
    { key: "pcs", propiedad: "pc_id" },
  ],
};

async function agregar(key, dataNueva) {
  try {
    const respuesta = await s3
      .getObject({ Bucket: BUCKET, Key: key + ".json" })
      .promise();

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
        Key: key + ".json",
        Body: JSON.stringify(data, null, 2),
        ContentType: "application/json",
      })
      .promise();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function obtener({
  key,
  propiedad = null,
  valor = null,
  populate = true,
}) {
  // Leer datos base
  const response = await s3
    .getObject({ Bucket: BUCKET, Key: key + ".json" })
    .promise();
  const data = JSON.parse(response.Body.toString());

  let result = data;

  // Si hay filtro (como obtenerPor), lo aplicamos
  if (propiedad && valor !== null) {
    result = data.find((e) => e[propiedad] == valor) || null;
    if (!populate || !tablasRelacion[key]) return result ? { ...result } : null;
  }
  console.log({ result });
  if (!result) {
    return result;
  }

  // Si no hay populate o no hay relaciones definidas
  if (!populate || !tablasRelacion[key]) return result;

  // Determinar si es un array o un solo objeto
  const registros = Array.isArray(result) ? result : [result];

  // Relación de claves a traer
  const relaciones = tablasRelacion[key];

  const relatedDataMap = {};

  // Cargar datos relacionados
  await Promise.allSettled(
    relaciones.map(async ({ key: relatedKey }) => {
      try {
        const response = await s3
          .getObject({ Bucket: BUCKET, Key: relatedKey + ".json" })
          .promise();

        const relatedData = JSON.parse(response.Body.toString());

        relatedDataMap[relatedKey] = Object.fromEntries(
          relatedData.map((obj) => [obj.id, obj])
        );
      } catch (err) {
        console.error(`Error cargando ${relatedKey}:`, err); // ✅ debug útil
      }
    })
  );

  // Realizar populate
  console.log({ registros, propiedad });
  if (registros) {
  }
  const populated = registros.map((obj) => {
    const newObj = { ...obj };
    relaciones.forEach(({ key: relatedKey, propiedad }) => {
      const relatedObj = relatedDataMap[relatedKey]?.[obj[propiedad]];
      if (relatedObj) {
        newObj[propiedad.replace("_id", "")] = relatedObj;
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
  const nuevosDatos = data.filter((item) => item[propiedad] != valor);

  // Guardar nuevamente
  await s3
    .putObject({
      Bucket: BUCKET,
      Key: s3Key,
      Body: JSON.stringify(nuevosDatos, null, 2),
      ContentType: "application/json",
    })
    .promise();

  return { eliminado: true, cantidad: data.length - nuevosDatos.length };
}

async function actualizar({ key, propiedad = "id", valor, nuevosValores }) {
  const s3Key = key + ".json";

  // Leer datos actuales
  const response = await s3.getObject({ Bucket: BUCKET, Key: s3Key }).promise();
  const data = JSON.parse(response.Body.toString());

  // Encontrar y actualizar el objeto
  const nuevosDatos = data.map((item) => {
    if (item[propiedad] == valor) {
      const nuevosValoresFiltrados = Object.fromEntries(
        Object.entries(nuevosValores).filter(([_, v]) => v !== undefined)
      );
      const modificada = { ...item, ...nuevosValoresFiltrados };
      return modificada;
    }
    return item;
  });

  // Guardar actualizado
  await s3
    .putObject({
      Bucket: BUCKET,
      Key: s3Key,
      Body: JSON.stringify(nuevosDatos, null, 2),
      ContentType: "application/json",
    })
    .promise();
  console.log(JSON.stringify(nuevosDatos));

  return { actualizado: true };
}

// USUARIOS
async function agregarUsuario(user) {
  return await agregar(TABLAS.USUARIO_KEY, user);
}

async function obtenerUsuarios() {
  const obtenerParams = {
    key: TABLAS.USUARIO_KEY,
    propiedad: null,
    valor: null,
    populate: true,
  };
  return await obtener(obtenerParams);
}

async function obtenerUsuariosConRoles() {
  const obtenerParams = {
    key: TABLAS.USUARIO_KEY,
    propiedad: null,
    valor: null,
    populate: true,
  };
  return await obtener(obtenerParams);
}

async function obtenerUsuarioPorDNI(dni) {
  const obtenerParams = {
    key: TABLAS.USUARIO_KEY,
    propiedad: "dni",
    valor: dni,
    populate: true,
  };
  return await obtener(obtenerParams);
}

async function buscarUsuarioPorDniOMail(dni, mail) {
  const s3Key = TABLAS.USUARIO_KEY + ".json";

  // Obtener los usuarios
  const response = await s3.getObject({ Bucket: BUCKET, Key: s3Key }).promise();
  const usuarios = JSON.parse(response.Body.toString());

  // Buscar por DNI o mail
  const usuario = usuarios.find((u) => u.dni == dni || u.mail == mail);

  if (!usuario) return null;

  // Hacer populate si corresponde
  const relaciones = tablasRelacion[TABLAS.USUARIO_KEY];
  if (!relaciones || relaciones.length === 0) return usuario;

  const relatedDataMap = {};
  await Promise.all(
    relaciones.map(async ({ key: relatedKey }) => {
      const relResponse = await s3
        .getObject({
          Bucket: BUCKET,
          Key: relatedKey + ".json",
        })
        .promise();
      const relatedData = JSON.parse(relResponse.Body.toString());
      relatedDataMap[relatedKey] = Object.fromEntries(
        relatedData.map((obj) => [obj.id, obj])
      );
    })
  );

  // Popular el usuario
  const usuarioPopulado = { ...usuario };
  relaciones.forEach(({ key: relatedKey, propiedad }) => {
    const relatedObj = relatedDataMap[relatedKey]?.[usuario[propiedad]];
    if (relatedObj) {
      usuarioPopulado[propiedad.replace("_id", "")] = relatedObj;
    }
  });

  return usuarioPopulado;
}

async function obtenerNombreRolPorId(id) {
  const obtenerParams = {
    key: TABLAS.USUARIO_KEY,
    propiedad: "id",
    valor: id,
    populate: true,
  };
  const rol = await obtener(obtenerParams);
  return rol;
}

async function agregarReserva(reserva) {
  return await agregar(TABLAS.RESERVA_KEY, reserva);
}

// RESERVAS

async function obtenerReservas() {
  const obtenerParams = {
    key: TABLAS.RESERVA_KEY,
    propiedad: null,
    valor: null,
    populate: true,
  };
  return await obtener(obtenerParams);
}

async function modificarReserva(id, camposActualizados) {
  const modificarParams = {
    key: TABLAS.RESERVA_KEY,
    valor: id,
    nuevosValores: camposActualizados,
  };
  return await actualizar(modificarParams);
}
async function eliminarReserva(id) {
  const modificarParams = {
    key: TABLAS.RESERVA_KEY,
    valor: id,
  };
  return await eliminar(modificarParams);
}

// DOCENTES
async function obtenerDocentes() {
  const obtenerParams = {
    key: TABLAS.PROFESOR_KEY,
    propiedad: null,
    valor: null,
    populate: true,
  };
  const docentes = await obtener(obtenerParams);
  console.log(JSON.stringify(docentes));

  obtenerParams.key = TABLAS.PROFESOR_TIENE_DISPONIBLE_KEY;
  const disponiblesDocentes = await obtener(obtenerParams);

  obtenerParams.key = TABLAS.PROFESOR_MATERIA_KEY;
  const materiaDocentes = await obtener(obtenerParams);


  for (let i = 0; i < disponiblesDocentes.length; i++) {
    const disponibleDocente = disponiblesDocentes[i];
    for (let j = 0; j < docentes.length; j++) {
      const docente = docentes[j];
      if (disponibleDocente?.usuario_id == docente?.usuario_id) {
        console.log({ disponible: disponibleDocente.disponible });
        const { disponible } = disponibleDocente;
        let { disponibles } = docente;
        console.log(disponible);
        console.log(disponibles);
        
        if (!disponibles) {
          disponibles = [disponible];
        } else {
          disponibles.push(disponible);
        }
        docentes[j] = {
          ...docente,
          disponibles,
        };
      }
    }
  }
  console.log(JSON.stringify(docentes));

  return docentes;
}

async function agregarDocente(docente) {
  return await agregar(TABLAS.PROFESOR_KEY, docente);
}

async function eliminarDocente(id) {
  const eliminarUsuarioParams = {
    key: TABLAS.USUARIO_KEY,
    valor: id,
  };
  const eliminarProfesorParams = {
    key: TABLAS.PROFESOR_KEY,
    propiedad: "usuario_id",
    valor: id,
  };

  await eliminar(eliminarUsuarioParams);
  await eliminar(eliminarProfesorParams);
}

async function modificarDocente(id, camposActualizados) {
  const modificarParams = {
    key: TABLAS.PROFESOR_KEY,
    propiedad: "usuario_id",
    valor: id,
    nuevosValores: camposActualizados,
  };
  return await actualizar(modificarParams);
}

// CONFIGURACION

async function obtenerConfiguraciones() {
  try {
    const configuraciones = {};
    const errores = {};

    const keys = [
      { key: TABLAS.GRADO_KEY, nombre: "grados" },
      { key: TABLAS.MATERIA_KEY, nombre: "materias" },
      { key: TABLAS.NIVEL_KEY, nombre: "niveles" },
      { key: TABLAS.AULA_KEY, nombre: "aulas" },
      { key: TABLAS.PC_KEY, nombre: "pcs" },
      { key: TABLAS.TEMA_KEY, nombre: "temas" },
    ];

    const promesas = keys.map(({ key }) =>
      obtener({
        key,
        propiedad: null,
        valor: null,
        populate: true,
      })
    );

    const resultados = await Promise.allSettled(promesas);

    resultados.forEach((resultado, index) => {
      const nombre = keys[index].nombre;
      if (resultado.status === "fulfilled") {
        configuraciones[nombre] = resultado.value;
      } else {
        errores[nombre] = resultado.reason;
      }
    });

    return { configuraciones, errores };
  } catch (error) {
    console.error(error);
  }
}

// DISPONIBLES
async function obtenerDisponibles() {
  const obtenerParams = {
    key: TABLAS.DISPONIBLE_KEY,
    propiedad: null,
    valor: null,
    populate: true,
  };
  return await obtener(obtenerParams);
}

module.exports = {
  agregarUsuario,
  obtenerUsuarioPorDNI,
  obtenerUsuarios,
  obtenerUsuariosConRoles,
  buscarUsuarioPorDniOMail,
  obtenerNombreRolPorId,
  agregarReserva,
  obtenerReservas,
  modificarReserva,
  eliminarReserva,
  obtenerDocentes,
  agregarDocente,
  eliminarDocente,
  modificarDocente,
  obtenerConfiguraciones,
  obtenerDisponibles,
};
