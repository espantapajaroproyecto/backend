#!/bin/bash

EVENT_DIR="data/eventos"

# Si se pasan como argumentos, usarlos; si no, pedirlos
FUNCTION_NAME=$1
EVENT_FILE=$2

if [ -z "$FUNCTION_NAME" ]; then
  echo "🔧 Ingresá el nombre de la función (como está en serverless.yml):"
  read FUNCTION_NAME
fi

if [ -z "$EVENT_FILE" ]; then
  echo "📄 Ingresá el nombre del archivo de evento (sin .json), asegurece que exista en $EVENT_DIR:"
  read EVENT_FILE
fi

EVENT_PATH="$EVENT_DIR/$EVENT_FILE.json"

# Validación mínima
if [ ! -f "$EVENT_PATH" ]; then
  echo "❌ El archivo '$EVENT_PATH' no existe. Abortando."
  exit 1
fi

echo "🚀 Ejecutando: sls invoke local --function $FUNCTION_NAME --path $EVENT_PATH"
sls invoke local --function "$FUNCTION_NAME" --path "$EVENT_PATH"
