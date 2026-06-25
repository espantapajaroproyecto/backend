require("dotenv").config();
const {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");

const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const BUCKET_NAME = process.env.S3_BUCKET;

module.exports.handler = async () => {
  if (!BUCKET_NAME) {
    throw new Error("S3_BUCKET environment variable is not set");
  }

  console.log(`Limpiando bucket: ${BUCKET_NAME}`);
  await limpiarS3(BUCKET_NAME);

  console.log("Subiendo archivos de data/clases/...");
  const archivosSubidos = await subirArchivos(BUCKET_NAME);

  return {
    statusCode: 200,
    body: JSON.stringify({ mensaje: "Carga completada.", archivosSubidos }),
  };
};

async function limpiarS3(bucket) {
  const listar = await s3.send(new ListObjectsV2Command({ Bucket: bucket }));
  if (!listar.Contents || listar.Contents.length === 0) {
    console.log("Bucket ya vacío, nada que limpiar.");
    return;
  }
  await s3.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: listar.Contents.map((obj) => ({ Key: obj.Key })) },
    })
  );
  console.log(`Eliminados ${listar.Contents.length} archivos.`);
}

async function subirArchivos(bucket) {
  const rutaLocal = path.join(__dirname, "..", "data", "clases");
  const archivos = fs.readdirSync(rutaLocal).filter((f) => f.endsWith(".json"));
  const subidos = [];

  for (const archivo of archivos) {
    const contenido = fs.readFileSync(path.join(rutaLocal, archivo));
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: archivo,
        Body: contenido,
        ContentType: "application/json",
      })
    );
    console.log(`Subido: ${archivo}`);
    subidos.push(archivo);
  }
  return subidos;
}
