#!/bin/bash
EVENT_DIR="data/eventos"

echo "🔧 Ingresá el nombre de la función (como está en serverless.yml):"
read FUNCTION_NAME

echo "📄 Ingresá el nombre del archivo de evento, asegurece que exista en data/eventos (ej: evento_autorizer):"
read EVENT_FILE


EVENT_PATH="$EVENT_DIR/$EVENT_FILE".json

# Validación mínima
if [ ! -f "$EVENT_PATH" ]; then
  echo "❌ El archivo '$EVENT_PATH' no existe. Abortando."
  exit 1
fi

echo "🚀 Ejecutando: sls invoke local --function $FUNCTION_NAME --path $EVENT_PATH"
sls invoke local --function "$FUNCTION_NAME" --path "$EVENT_PATH"
