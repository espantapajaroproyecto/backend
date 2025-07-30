dir=$@

echo "Argumentos: $dir"

cmd="cross-env FUNCTION_DIR=$dir npx webpack bundle"
echo "📦 Ejecutando: $cmd"
$cmd