const AWS = require("aws-sdk");
const {
  ROLES_BASE,
  obtenerValorSeguro,
  calcularFin,
} = require("../utils/utils");
const s3 = new AWS.S3();
const dayjs = require("dayjs");
const BUCKET = process.env.S3_BUCKET;

const TABLAS = {
  ROL_KEY: "roles",
  USUARIO_KEY: "usuarios",
  INSTITUCION_EDUCATIVA_KEY: "instituciones_educativas",
  ALUMNO_KEY: "alumnos",
  ALUMNO_TIENE_RESERVA_KEY: "alumno_tiene_reserva",
  PROFESOR_KEY: "profesores",
  NIVEL_KEY: "niveles",
  GRADO_KEY: "grados",
  MATERIA_KEY: "materias",
  TEMA_KEY: "temas",
  PROFESOR_TIENE_DISPONIBLE_KEY: "profesor_tiene_disponible",
  PROFESOR_TIENE_MATERIA_KEY: "profesor_tiene_materia",
  PROFESOR_TIENE_RESERVA_KEY: "profesor_tiene_reserva",
  AULA_KEY: "aulas",
  PC_KEY: "pcs",
  RESERVA_KEY: "reservas",
  DISPONIBLE_KEY: "disponibles",
};

const tablasRelacion = {
  roles: [],
  usuarios: [{ key: "roles", propiedad: "rol_id" }],
  institucion_educativas: [],
  alumnos: [{ key: "usuarios", propiedad: "usuario_id" }],
  profesores: [{ key: "usuarios", propiedad: "usuario_id" }],
  niveles: [],
  grados: [{ key: "niveles", propiedad: "nivel_id" }],
  materias: [{ key: "grados", propiedad: "grado_id" }],
  disponibles: [],
  temas: [{ key: "materias", propiedad: "materia_id" }],
  profesor_tiene_disponible: [
    { key: "profesores", propiedad: "profesor_id" },
    { key: "disponibles", propiedad: "disponible_id" },
  ],
  alumno_tiene_reserva: [
    { key: "alumnos", propiedad: "id" },
    { key: "reservas", propiedad: "reserva_id" },
  ],
  profesor_tiene_materia: [
    { key: "profesores", propiedad: "profesor_id" },
    { key: "materias", propiedad: "materia_id" },
  ],
  profesor_tiene_reserva: [
    { key: "profesores", propiedad: "profesor_id" },
    { key: "reservas", propiedad: "reserva_id" },
  ],
  aulas: [],
  pc: [],
  reservas: [
    { key: "profesores", propiedad: "profesor_id" },
    { key: "alumnos", propiedad: "alumno_id" },
    { key: "materias", propiedad: "materia_id" },
    { key: "temas", propiedad: "tema_id" },
    { key: "aulas", propiedad: "aula_id" },
    { key: "pcs", propiedad: "pc_id" },
    { key: "usuarios", propiedad: "usuario_id" },
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
    return dataWithId;
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
    result =
      data.filter((e) => {
        return e[propiedad] == valor;
      }) || null;
    if (!populate || !tablasRelacion[key]) return result ? { ...result } : null;
  }

  if (!result) {
    return result;
  }

  const registros = Array.isArray(result) ? result : [result];
  // Si no hay populate o no hay relaciones definidas
  if (!populate || !tablasRelacion[key]) return registros;

  // Determinar si es un array o un solo objeto

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
  console.log({ key, propiedad, valor });
  const s3Key = key + ".json";
  try {
    // Leer datos actuales
    const response = await s3
      .getObject({ Bucket: BUCKET, Key: s3Key })
      .promise();
    const data = JSON.parse(response.Body.toString());

    let itemToDelete = null;
    const nuevosDatos = [];

    for (let i = 0; i < data.length; i++) {
      const element = data[i];

      const isItemToDelete =
        String(element[propiedad]).trim() === String(valor).trim();
      if (isItemToDelete) {
        console.log({ element });

        itemToDelete = element;
      } else {
        nuevosDatos.push(element);
      }
    }

    // Guardar nuevamente
    await s3
      .putObject({
        Bucket: BUCKET,
        Key: s3Key,
        Body: JSON.stringify(nuevosDatos, null, 2),
        ContentType: "application/json",
      })
      .promise();

    return {
      itemEliminado: itemToDelete,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
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
  try {
    console.log({ reserva });
    const {
      fecha_hora,
      tiempo,
      profesor_id,
      alumno_id,
      materia_id,
      disponible_id,
      tema_id,
      aula_id,
      estado,
      observaciones,
      es_presencial,
      pc_id,
      en_instituto,
      grupal,
    } = reserva;

    // Buscar si el disponible_id pertenece al profesor
    const profesorDisponibleParams = {
      key: TABLAS.PROFESOR_TIENE_DISPONIBLE_KEY,
      propiedad: "disponible_id",
      valor: disponible_id,
      populate: true,
    };

    const profesorDisponible = await obtener(profesorDisponibleParams);
    console.log({ profesorDisponible });

    if (profesorDisponible.length === 0) {
      throw new Error(
        `No se encontró disponible con ID ${disponible_id} para el profesor ${profesor_id}`
      );
    }

    if (profesorDisponible[0].profesor.id !== profesor_id) {
      throw new Error(
        `El disponible con ID ${disponible_id} no pertenece al profesor ${profesor_id}`
      );
    }

    // Extraer disponible y profesor
    const { disponible, profesor } = profesorDisponible[0];

    const fechaReserva = dayjs(fecha_hora);
    const [hora, minutos, segundos] = tiempo.split(":").map(Number);

    const inicioDisponible = dayjs(`${disponible.fecha} ${disponible.inicio}`);
    const finDisponible = dayjs(`${disponible.fecha} ${disponible.fin}`);

    console.log({
      fecha_hora,
      inicio: inicioDisponible.format(),
      fin: finDisponible.format(),
      reserva: fechaReserva.format(),
      // horaReservaFin: horaReservaFin,
    });
    console.log({ hora, minutos, segundos });

    // ✅ calcular hora de fin correctamente con dayjs
    const horaReservaFin = fechaReserva
      .add(hora, "hour")
      .add(minutos, "minute");

    console.log({ horaReservaFin: horaReservaFin.format() });

    if (
      fechaReserva.isBefore(inicioDisponible) ||
      horaReservaFin.isAfter(finDisponible)
    ) {
      throw new Error(
        `La hora ${fecha_hora} mas horas: ${hora} y minuttos: ${minutos} no está dentro del rango disponible (${disponible.inicio} - ${disponible.fin})`
      );
    }

    // ✅ Validar que no se excedan las horas_deseadas
    if (disponible.horas_asignadas >= disponible.horas_deseadas) {
      throw new Error(
        `El profesor ya alcanzó el máximo de horas (${disponible.horas_deseadas}) para este día`
      );
    }

    // // ✅ Validar que no se superponga con otra reserva del mismo profesor ese día
    const reservasProfesor = await obtener({
      key: TABLAS.PROFESOR_TIENE_RESERVA_KEY,
      propiedad: "profesor_id",
      valor: profesor_id,
      populate: true,
    });

    console.log({ reservasProfesor });
    console.log();

    const haySuperposicion = reservasProfesor.some((rp) => {
      const r = rp.reserva;

      // Inicio y fin de la reserva existente
      const rInicio = dayjs(r.fecha_hora);
      const rFin = calcularFin(rInicio, r.tiempo);

      // Inicio y fin de la nueva reserva

      console.log({
        rInicio: rInicio.format(),
        rFin: rFin.format(),
        fr: fechaReserva.format(),
      });

      return (
        (fechaReserva >= rInicio && fechaReserva < rFin) || // empieza dentro de otra
        (horaReservaFin > rInicio && horaReservaFin <= rFin) || // termina dentro de otra
        (fechaReserva <= rInicio && horaReservaFin >= rFin) // cubre otra entera
      );
    });
    console.log({ haySuperposicion });

    if (haySuperposicion) {
      throw new Error(
        `El profesor ya tiene una reserva que se superpone con la hora solicitada`
      );
    }

    // // ✅ Si todo está bien, guardar la reserva
    // const reservaResult = await agregar(TABLAS.RESERVA_KEY, reserva);
    // const { id: reserva_id } = reservaResult;

    // const alumnoTieneReserva = { alumno_id, reserva_id };
    // await agregar(TABLAS.ALUMNO_TIENE_RESERVA_KEY, alumnoTieneReserva);

    // return reservaResult;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function modificarUsuario(id, camposActualizados) {
  const modificarParams = {
    key: TABLAS.USUARIO_KEY,
    valor: id,
    nuevosValores: camposActualizados,
  };
  return await actualizar(modificarParams);
}

// RESERVAS
async function obtenerReservas() {
  const obtenerParams = {
    key: TABLAS.RESERVA_KEY,
    propiedad: null,
    valor: null,
    populate: true,
  };
  const reservas = await obtener(obtenerParams);
  return reservas.length == 0 ? [] : populateReservarAlumnoProfesor(reservas);
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

  const eliminarAlumnoReservaParams = {
    key: TABLAS.ALUMNO_TIENE_RESERVA_KEY,
    propiedad: "reserva_id",
    valor: id,
  };

  const [resultElimninarAlumnoReserva, resultElimninarReserva] =
    Promise.allSettled([
      eliminar(modificarParams),
      eliminar(eliminarAlumnoReservaParams),
    ]);

  const eliminarReservaData = obtenerValorSeguro(resultElimninarAlumnoReserva);
  const eliminarAlumnoReservaData = obtenerValorSeguro(resultElimninarReserva);

  return { eliminarReservaData, eliminarAlumnoReservaData };
}

// DOCENTES
async function obtenerDocentesPorMateriaId(materiaId) {
  const obtenerParams = {
    key: TABLAS.PROFESOR_TIENE_MATERIA_KEY,
    propiedad: "materia_id",
    valor: materiaId,
    populate: true,
  };
  const docentes = await obtener(obtenerParams);
  return docentes;
}

async function obtenerDocentes(cuerpo = { profesorId: undefined }) {
  const { profesorId } = cuerpo;

  let docentes = [];
  const [docentesResult, disponiblesDocentesResult, materiaDocentesResult] =
    await Promise.allSettled([
      obtener({
        key: TABLAS.PROFESOR_KEY,
        propiedad: null,
        valor: null,
        populate: true,
      }),
      obtener({
        key: TABLAS.PROFESOR_TIENE_DISPONIBLE_KEY,
        propiedad: null,
        valor: null,
        populate: true,
      }),
      obtener({
        key: TABLAS.PROFESOR_TIENE_MATERIA_KEY,
        propiedad: null,
        valor: null,
        populate: true,
      }),
    ]);

  const docentesData = obtenerValorSeguro(docentesResult);
  const disponibleDocenteData = obtenerValorSeguro(disponiblesDocentesResult);
  const materiaDocentesData = obtenerValorSeguro(materiaDocentesResult);

  if (docentesData.length == 0) {
    return docentes;
  }
  for (let i = 0; i < docentesData.length; i++) {
    const docente = docentesData[i];

    const { id } = docente;

    if (disponibleDocenteData.length > 0) {
      docente.disponibles = disponibleDocenteData
        .filter((disponible) => {
          return disponible.profesor_id == id;
        })
        .map((elemento) => {
          return elemento.disponible;
        });
    }
    if (materiaDocentesData.length > 0) {
      docente.materias = materiaDocentesData
        .filter((materia) => {
          return materia.profesor_id == id;
        })
        .map((elemento) => {
          return elemento.materia;
        });
    }
    delete docente.usuario.contrasenia;

    if (profesorId && id == profesorId) {
      docentes = [];
      docentes.push(docente);
      break;
    } else {
      docentes.push(docente);
    }
  }
  return docentes;
}

async function agregarDocente(docente) {
  return await agregar(TABLAS.PROFESOR_KEY, docente);
}

async function eliminarDocente(id) {
  try {
    const eliminarUsuarioParams = {
      key: TABLAS.USUARIO_KEY,
      valor: id,
      populate: true,
    };
    const eliminarProfesorParams = {
      key: TABLAS.PROFESOR_KEY,
      propiedad: "id",
      populate: true,
      valor: id,
    };

    const profesorEliminado = await eliminar(eliminarProfesorParams);

    if (profesorEliminado) {
      console.log("Docente eliminado:", profesorEliminado);
      const { itemEliminado } = profesorEliminado;
      const { usuario_id } = itemEliminado;
      eliminarUsuarioParams.valor = usuario_id;
      const usuarioEliminado = await eliminar(eliminarUsuarioParams);
      console.log({ usuarioEliminado });
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function modificarDocente(id, camposActualizados) {
  const modificarParams = {
    key: TABLAS.PROFESOR_KEY,
    propiedad: "id",
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
      { key: TABLAS.TEMA_KEY, nombre: "temas" },
      { key: TABLAS.AULA_KEY, nombre: "aulas" },
      { key: TABLAS.PC_KEY, nombre: "pcs" },
      { key: TABLAS.TEMA_KEY, nombre: "temas" },
      {
        key: TABLAS.INSTITUCION_EDUCATIVA_KEY,
        nombre: "instituciones_educativas",
      },
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
    console.log(error);
    throw error;
  }
}

async function guardarConfiguraciones(config) {
  try {
    // Para cada tipo de configuración presente, agregamos su contenido
    if (config.niveles && Array.isArray(config.niveles)) {
      for (const nivel of config.niveles) {
        await agregar(TABLAS.NIVEL_KEY, nivel);
      }
    }

    if (config.grados && Array.isArray(config.grados)) {
      for (const grado of config.grados) {
        await agregar(TABLAS.GRADO_KEY, grado);
      }
    }

    if (config.materias && Array.isArray(config.materias)) {
      for (const materia of config.materias) {
        await agregar(TABLAS.MATERIA_KEY, materia);
      }
    }

    if (config.temas && Array.isArray(config.temas)) {
      for (const tema of config.temas) {
        await agregar(TABLAS.TEMA_KEY, tema);
      }
    }

    if (config.aulas && Array.isArray(config.aulas)) {
      for (const aula of config.aulas) {
        await agregar(TABLAS.AULA_KEY, aula);
      }
    }

    if (config.pcs && Array.isArray(config.pcs)) {
      for (const pc of config.pcs) {
        await agregar(TABLAS.PC_KEY, pc);
      }
    }

    return { message: "Configuraciones guardadas correctamente en S3" };
  } catch (error) {
    console.error("Error guardando configuraciones en S3:", error);
    throw error;
  }
}

async function eliminarConfiguraciones(tipo, id) {
  const keyMap = {
    niveles: TABLAS.NIVEL_KEY,
    grados: TABLAS.GRADO_KEY,
    materias: TABLAS.MATERIA_KEY,
    temas: TABLAS.TEMA_KEY,
    aulas: TABLAS.AULA_KEY,
    pcs: TABLAS.PC_KEY,
    instituciones_educativas: TABLAS.INSTITUCION_EDUCATIVA_KEY,
  };

  const eliminarConfiguracion = {
    key: keyMap[tipo],
    valor: id,
  };

  await eliminar(eliminarConfiguracion);
}

async function modificarConfiguracion(tipo, id, datosActualizados) {
  try {
    const key = `${tipo}.json`;

    // Obtener archivo desde S3
    const respuesta = await s3
      .getObject({ Bucket: BUCKET, Key: key })
      .promise();

    const jsonString = respuesta.Body.toString("utf-8");
    let items = JSON.parse(jsonString);

    // Buscar índice del elemento
    const index = items.findIndex((item) => item.id === Number(id));
    if (index === -1) {
      throw new Error(`No se encontró elemento con ID ${id} en ${tipo}`);
    }

    // Actualizar el elemento
    items[index] = { ...items[index], ...datosActualizados };

    // Guardar en S3
    await s3
      .putObject({
        Bucket: BUCKET,
        Key: key,
        Body: JSON.stringify(items, null, 2),
        ContentType: "application/json",
      })
      .promise();
  } catch (error) {
    console.error(`Error modificando ${tipo} en S3:`, error);
    throw error;
  }
}

// DISPONIBLES
async function obtenerDisponibles() {
  const obtenerProfesoresParams = {
    key: TABLAS.PROFESOR_KEY,
    propiedad: null,
    valor: null,
    populate: true,
  };

  const obtenerProfesorDisponibles = {
    key: TABLAS.PROFESOR_TIENE_DISPONIBLE_KEY,
    propiedad: null,
    valor: null,
    populate: true,
  };

  const [profesoresResult, profesorDisponibleResult] = await Promise.allSettled(
    [obtener(obtenerProfesoresParams), obtener(obtenerProfesorDisponibles)]
  );

  const profesoresData = obtenerValorSeguro(profesoresResult).map(
    (elemento) => {
      const { usuario, id: profesor_id } = elemento;
      delete usuario.contrasenia;
      delete usuario.id;
      delete elemento.usuario;
      return { ...elemento, ...usuario, profesor_id };
    }
  );
  const profesorDisponibleData = obtenerValorSeguro(
    profesorDisponibleResult
  ).map((elemento) => {
    let { disponible, profesor } = elemento;
    profesor = profesoresData.find((profesor) => {
      return profesor.id == elemento.profesor_id;
    });
    return { disponible, profesor };
  });

  return profesorDisponibleData;
}

async function obtenerDisponiblesPor(cuerpo) {
  const {
    gradoId,
    fechaInicio,
    fechaFin,
    materiaId,
    temaId,
    nivelId,
    profesorId,
    es_presencial,
    frecuencia,
  } = cuerpo;

  const configuraciones = {};
  const errores = {};
  let respuesta = [];
  const keys = [
    { key: TABLAS.GRADO_KEY, nombre: "grados" },
    { key: TABLAS.MATERIA_KEY, nombre: "materias" },
    {
      key: TABLAS.INSTITUCION_EDUCATIVA_KEY,
      nombre: "instituciones_educativas",
    },
    { key: TABLAS.TEMA_KEY, nombre: "temas" },
    { key: TABLAS.NIVEL_KEY, nombre: "niveles" },
    { key: TABLAS.PROFESOR_TIENE_MATERIA_KEY, nombre: "profesoresMaterias" },
    { key: TABLAS.DISPONIBLE_KEY, nombre: "disponibles" },
    { key: TABLAS.PROFESOR_KEY, nombre: "profesores" },
    {
      key: TABLAS.PROFESOR_TIENE_DISPONIBLE_KEY,
      nombre: "profesoresDisponibles",
    },
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

  const nivelEducativo = configuraciones.niveles.find((nivel) => {
    return nivel.id == nivelId;
  });
  const grado = configuraciones.grados.find((grado) => {
    return grado.id == gradoId;
  });

  const checkearNivelGrado =
    nivelEducativo && grado && grado.nivel_id == nivelEducativo.id;

  if (!checkearNivelGrado) {
    return respuesta;
  }

  const materia = configuraciones.materias.find((materia) => {
    return materia.id == materiaId;
  });

  const checkearMateriaGrado = grado && materia && materia.grado_id == grado.id;
  if (!checkearMateriaGrado) {
    return respuesta;
  }

  const tema = configuraciones.temas.find((tema) => {
    return tema.id == temaId;
  });

  const checkearTemaMateria = materia && tema && tema.materia_id == materia.id;
  if (!checkearTemaMateria) {
    return respuesta;
  }

  let profesoresMateria = configuraciones.profesoresMaterias.filter(
    (profesorMateria) => {
      return profesorMateria.materia_id == materiaId;
    }
  );

  if (profesoresMateria.length == 0) {
    return respuesta;
  }
  if (profesorId) {
    const filtradoPorProfesor = profesoresMateria.find((profesorMateria) => {
      return profesorMateria.profesor_id == profesorId;
    });
    if (filtradoPorProfesor) {
      profesoresMateria = [filtradoPorProfesor];
    } else {
      profesoresMateria = [];
    }
  }

  let profesoresDisponibles = [];
  for (let i = 0; i < profesoresMateria.length; i++) {
    const profesorMateria = profesoresMateria[i];
    const { profesor_id } = profesorMateria;
    const disponiblesProfesor = [];
    for (let j = 0; j < configuraciones.profesoresDisponibles.length; j++) {
      const profesorDisponible = configuraciones.profesoresDisponibles[j];
      if (profesorDisponible.profesor_id == profesor_id) {
        disponiblesProfesor.push({ profesorDisponible, profesorMateria });
      }
    }

    if (disponiblesProfesor.length > 0) {
      profesoresDisponibles.push(...disponiblesProfesor);
    }
  }

  if (profesoresDisponibles.length == 0) {
    return respuesta;
  }

  if (fechaInicio && fechaFin) {
    profesoresDisponibles = profesoresDisponibles.filter((elemento) => {
      const { profesorDisponible } = elemento;
      const { disponible } = profesorDisponible;
      const estaEnFecha =
        disponible.fecha >= fechaInicio && disponible.fecha <= fechaFin;

      return estaEnFecha;
    });
  }

  respuesta = profesoresDisponibles.map((elemento) => {
    let { profesorDisponible, profesorMateria } = elemento;
    let { disponible, profesor } = profesorDisponible;
    let { materia } = profesorMateria;

    profesor = configuraciones.profesores.find((profesorData) => {
      return profesorData.id == profesor.id;
    });

    const { usuario } = profesor;
    profesor = { ...profesor, ...usuario };
    delete profesor.usuario;
    delete profesor.contrasenia;
    return { disponible, profesor };
  });
  return respuesta;
}

const populateReservarAlumnoProfesor = async (reservas) => {
  const respuesta = [];
  for (let i = 0; i < reservas.length; i++) {
    const reserva = reservas[i];
    const { profesor, alumno } = reserva;
    const { usuario_id: alumno_usuario_id } = alumno;
    const { usuario_id: profesor_usuario_id } = profesor;

    const obtenerUsuarioProfesor = {
      key: TABLAS.USUARIO_KEY,
      propiedad: "id",
      valor: profesor_usuario_id,
      populate: true,
    };

    const obtenerUsuarioAlumno = {
      key: TABLAS.USUARIO_KEY,
      propiedad: "id", // ⚠️ probablemente querías usar "alumno_id" aquí
      valor: alumno_usuario_id,
      populate: true,
    };
    const [profesorUsuarioResult, alumnoUsuarioResult] =
      await Promise.allSettled([
        obtener(obtenerUsuarioProfesor),
        obtener(obtenerUsuarioAlumno),
      ]);

    const profesorUsuarioData =
      profesorUsuarioResult.status === "fulfilled"
        ? profesorUsuarioResult.value
        : [];

    const alumnoUsuarioData =
      alumnoUsuarioResult.status === "fulfilled"
        ? alumnoUsuarioResult.value
        : [];

    if (profesorUsuarioData.length === 1) {
      const mergedProfesor = { ...profesor, ...profesorUsuarioData[0] };
      reserva.profesor = mergedProfesor;
      delete reserva.profesor.contrasenia;
    }

    if (alumnoUsuarioData.length === 1) {
      const mergedAlumno = { ...alumno, ...alumnoUsuarioData[0] };

      reserva.alumno = mergedAlumno;
      delete reserva.alumno.contrasenia;
    }
    respuesta.push(reserva);
  }
  return respuesta;
};

async function obtenerReservasPorUsuarioId(cuerpo) {
  const { usuarioId } = cuerpo;
  let reservas = [];
  try {
    const obtenerParamsProfesor = {
      key: TABLAS.PROFESOR_KEY,
      propiedad: "usuario_id",
      valor: usuarioId,
      populate: true,
    };

    const obtenerParamsAlumno = {
      key: TABLAS.ALUMNO_KEY,
      propiedad: "usuario_id", // ⚠️ probablemente querías usar "alumno_id" aquí
      valor: usuarioId,
      populate: true,
    };

    const [profesorResult, alumnoResult] = await Promise.allSettled([
      obtener(obtenerParamsProfesor),
      obtener(obtenerParamsAlumno),
    ]);

    const profesorData =
      profesorResult.status === "fulfilled" ? profesorResult.value : [];

    const alumnoData =
      alumnoResult.status === "fulfilled" ? alumnoResult.value : [];

    if (profesorData.length == 0 && alumnoData.length == 0) {
      return reservas;
    }
    const usuarioEsProfesor = profesorData.length > 0;
    const usuarioEsAlumno = alumnoData.length > 0;

    const id = usuarioEsProfesor ? profesorData[0].id : alumnoData[0].id;
    const obtenerReservasUsuaio = {
      key: TABLAS.RESERVA_KEY,
      propiedad: usuarioEsProfesor ? "profesor_id" : "alumno_id", // ⚠️ probablemente querías usar "alumno_id" aquí
      valor: id,
      populate: true,
    };
    const reservarResult = await obtener(obtenerReservasUsuaio);

    if (reservarResult.length == 0) {
      return reservas;
    }
    reservas = populateReservarAlumnoProfesor(reservarResult);

    return reservas;
  } catch (error) {
    console.error("Error al obtener reservas:", error);
    throw error;
  }
}

// ALUMNOS
async function agregarAlumno(alumno) {
  return await agregar(TABLAS.ALUMNO_KEY, alumno);
}

async function eliminarAlumno(id) {
  const eliminarUsuarioParams = {
    key: TABLAS.USUARIO_KEY,
    valor: id,
  };
  const eliminarAlumnoParams = {
    key: TABLAS.ALUMNO_KEY,
    propiedad: "id",
    valor: id,
  };

  await eliminar(eliminarUsuarioParams);
  await eliminar(eliminarAlumnoParams);
}

async function modificarAlumno(id, camposActualizados) {
  const modificarParams = {
    key: TABLAS.ALUMNO_KEY,
    propiedad: "id",
    valor: id,
    nuevosValores: camposActualizados,
  };
  return await actualizar(modificarParams);
}

async function obtenerAlumnos(params = { alumnoId: undefined }) {
  console.log(params);

  const { alumnoId } = params;

  let alumnos = [];
  const [alumnoResult, reservasAlumnoResult] = await Promise.allSettled([
    obtener({
      key: TABLAS.ALUMNO_KEY,
      propiedad: null,
      valor: null,
      populate: true,
    }),
    obtener({
      key: TABLAS.ALUMNO_TIENE_RESERVA_KEY,
      propiedad: null,
      valor: null,
      populate: true,
    }),
  ]);

  const alumnosData = obtenerValorSeguro(alumnoResult);
  const reservasAlumnoData = obtenerValorSeguro(reservasAlumnoResult);
  console.log(alumnosData, reservasAlumnoData);
  if (alumnosData.length == 0) {
    console.log("no hay alumnos");

    return alumnos;
  }
  for (let i = 0; i < alumnosData.length; i++) {
    const alumno = alumnosData[i];
    console.log(alumno);

    const { id } = alumno;
    if (reservasAlumnoData.length > 0) {
      alumno.reservas = reservasAlumnoData
        .filter((elemento) => {
          return elemento.reserva.alumno_id == id;
        })
        .map((elemento) => {
          return elemento.reserva;
        });
    }
    console.log({ alumno });

    delete alumno?.usuario?.contrasenia;

    if (alumnoId == id) {
      alumnos = [];
      alumnos.push(alumno);
      break;
    } else {
      alumnos.push(alumno);
    }
  }
  return alumnos;
}

async function agregarReservaAlumno(data) {
  return await agregar(TABLAS.ALUMNO_TIENE_RESERVA_KEY, data);
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
  obtenerDisponiblesPor,
  obtenerReservasPorUsuarioId,
  guardarConfiguraciones,
  eliminarConfiguraciones,
  modificarConfiguracion,
  modificarUsuario,
  agregarAlumno,
  eliminarAlumno,
  modificarAlumno,
  obtenerAlumnos,
  agregarReservaAlumno,
  // eliminarReservaAlumno
};
