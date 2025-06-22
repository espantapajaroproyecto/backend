import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { readdirSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Manejo de __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cliente S3 usando AWS SDK v3
const s3 = new S3Client({ region: "us-east-1" }); // Cambia la región si es necesario

const BUCKET_NAME = "proyecto-espantapajaro-bucket";
const S3_PREFIX = "/";

export const handler = async () => {
  console.log("Iniciando limpieza del bucket...");
  await limpiarS3Carpeta(BUCKET_NAME, S3_PREFIX);

  console.log("Subiendo archivos locales...");
  const archivosSubidos = await subirArchivosLocales(BUCKET_NAME, S3_PREFIX);

  return {
    statusCode: 200,
    body: JSON.stringify({
      mensaje: "Carga completada con éxito.",
      archivosSubidos,
    }),
  };
};

async function limpiarS3Carpeta(bucket, prefix) {

  const listar = await s3.send(new ListObjectsV2Command({
    Bucket: bucket,
  }));

  if (!listar.Contents || listar.Contents.length === 0) {
    console.log("No hay archivos que eliminar.");
    return;
  }

  const objetosAEliminar = listar.Contents.map(obj => ({ Key: obj.Key }));

  await s3.send(new DeleteObjectsCommand({
    Bucket: bucket,
    Delete: { Objects: objetosAEliminar },
  }));

  console.log(`${objetosAEliminar.length} archivos eliminados de S3.`);
}

async function subirArchivosLocales(bucket, s3Prefix) {
  const rutaLocal = path.join(__dirname, "..", "data", "clases");
  const archivos = readdirSync(rutaLocal).filter(f => f.endsWith(".json"));


  const subidos = [];

  for (const archivo of archivos) {
    const contenido = readFileSync(path.join(rutaLocal, archivo));
    const key = `${""}${archivo}`;

    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: contenido,
      ContentType: "application/json",
    }));

    console.log(`Archivo subido: ${archivo}`);
    subidos.push(key);
  }

  return subidos;
}
