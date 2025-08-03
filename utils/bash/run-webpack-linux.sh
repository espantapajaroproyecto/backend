#!/bin/bash

dir=$@

echo "Argumentos: $dir"

echo "📦 Ejecutando: cross-env FUNCTION_DIR=$dir npx webpack bundle"
cross-env FUNCTION_DIR=$dir npx webpack bundle
