require("dotenv").config();
const dbService = require("../../services/dbService");
const s3Service = require("../../services/s3Service");

module.exports.handler = async (event) => {
  try {
    
    const body = JSON.parse(event.body);

    const { grados, materias, niveles, temas, aulas, pcs, instituciones_educativas } = body;

    // Validar que al menos una configuración esté presente
    if (!grados && !materias && !niveles && !temas && !aulas && !pcs && !instituciones_educativas) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Debe incluirse al menos una configuración para guardar",
        }),
      };
    }

    // ======== Validaciones de dependencia ========

    // // 1. Grados dependen de niveles
    // if (grados && niveles) {
    //   const nivelIds = new Set(niveles.map((n) => n.id));
    //   for (const g of grados) {
    //     if (!nivelIds.has(g.nivel_id)) {
    //       return {
    //         statusCode: 400,
    //         body: JSON.stringify({
    //           message: `Grado con id ${g.id} hace referencia a un nivel inexistente (nivel_id ${g.nivel_id})`,
    //         }),
    //       };
    //     }
    //   }
    // }

    // // 2. Materias dependen de grados
    // if (materias && grados) {
    //   const gradoIds = new Set(grados.map((g) => g.id));
    //   for (const m of materias) {
    //     if (!gradoIds.has(m.grado_id)) {
    //       return {
    //         statusCode: 400,
    //         body: JSON.stringify({
    //           message: `Materia "${m.nombre}" hace referencia a un grado inexistente (grado_id ${m.grado_id})`,
    //         }),
    //       };
    //     }
    //   }
    // }

    // // 3. Temas dependen de materias
    // if (temas && materias) {
    //   const materiaIds = new Set(materias.map((m) => m.id));
    //   for (const t of temas) {
    //     if (!materiaIds.has(t.materia_id)) {
    //       return {
    //         statusCode: 400,
    //         body: JSON.stringify({
    //           message: `Tema "${t.nombre}" hace referencia a una materia inexistente (materia_id ${t.materia_id})`,
    //         }),
    //       };
    //     }
    //   }
    // }

    // (Opcional) Si no mandas todos los niveles/grados/materias, tendríamos que
    // buscar en la base de datos los existentes para validar referencias.

    // ======== Guardado ========
    const useS3 = process.env.USE_S3 === "true";
    const guardarConfiguraciones = useS3
      ? s3Service.guardarConfiguraciones
      : dbService.guardarConfiguraciones;
    
      niveles,
      grados,
      materias,
      temas,
      aulas,
    });

    await guardarConfiguraciones({
      ...(niveles && { niveles }),
      ...(grados && { grados }),
      ...(materias && { materias }),
      ...(temas && { temas }),
      ...(aulas && { aulas }),
    });

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: useS3
          ? "Configuraciones guardadas en S3"
          : "Configuraciones guardadas en base de datos",
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error interno",
        error: error.message,
      }),
    };
  }
};
