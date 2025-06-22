#!/bin/bash
SERVERLESS_DIR=".serverless"

echo "📦 Ingresá el nombre del archivo ZIP (sin .zip):"
read ZIP_NAME

SERVERLESS_PATH="$SERVERLESS_DIR/$ZIP_NAME.zip"

# Verificar existencia del ZIP
if [ ! -f "$SERVERLESS_PATH" ]; then
  echo "❌ El archivo '$SERVERLESS_PATH' no existe."
  exit 1
fi

# Crear directorio unzip
mkdir unzip
UNZIP_DIR=unzip

echo "📂 Descomprimiendo $ZIP_NAME.zip en $UNZIP_DIR"
unzip "$SERVERLESS_PATH" -d "$UNZIP_DIR"

# Buscar archivo .js con el mismo nombre que el ZIP
TARGET_FILE=$(find "$UNZIP_DIR" -type f -name "$ZIP_NAME.js")

if [ -z "$TARGET_FILE" ]; then
  echo "⚠️ No se encontró ningún archivo llamado '$ZIP_NAME.js' en el zip."
else
  echo "✅ Archivo encontrado: $TARGET_FILE"
  
  echo ""
  echo "📖 Primeras 10 líneas del archivo:"
  echo "---------------------------------"
  head -n 10 "$TARGET_FILE"
  echo "---------------------------------"
  echo ""

  echo "📤 Moviéndolo a la raíz como index.js..."
  mv "$TARGET_FILE" "$UNZIP_DIR/index.js"
fi


# Ruta de salida final
ZIP_PATH="$SERVERLESS_DIR/$ZIP_NAME.procesado.zip"

# Empaquetar todo lo que hay dentro de la carpeta unzip, manteniendo estructura
(cd "$UNZIP_DIR" && zip -r "../$ZIP_PATH" .)

echo "📦 ZIP generado en: $ZIP_PATH"


# 🔥 Eliminar carpeta temporal
rm -rf "$UNZIP_DIR"
echo "🧹 Carpeta temporal '$UNZIP_DIR' eliminada."

# echo "🚀 ¿Querés actualizar la Lambda '$ZIP_NAME' en AWS con este zip? (s/n)"
# read CONFIRMAR

# if [[ "$CONFIRMAR" == "s" ]]; then
#   aws lambda update-function-code \
#     --function-name "$ZIP_NAME" \
#     --zip-file "fileb://$ZIP_PATH"
#   echo "✅ Lambda '$ZIP_NAME' actualizada correctamente."
# else
#   echo "❌ Salteando actualización de Lambda."
# fi
