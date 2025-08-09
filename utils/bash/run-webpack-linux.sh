#!/bin/bash

dir=$1

echo "Argumento: $dir"

# 🧹 Borrar contenido del directorio
if [ -d "./.serverless" ]; then
  echo "🧹 Limpiando el directorio ./.serverless"
  find ./.serverless -mindepth 1 -delete
else
  echo "⚠️ El directorio ./.serverless no existe, no se borró nada."
fi

# 📦 Ejecutar Webpack bundle con variable de entorno FUNCTION_DIR
echo "📦 Ejecutando: cross-env FUNCTION_DIR=$dir npx webpack bundle"
cross-env FUNCTION_DIR=$dir npx webpack bundle
