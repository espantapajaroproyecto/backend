const fs = require("fs");
const path = require("path");
const ZipPlugin = require("zip-webpack-plugin");



// Buscar todos los entry points dinámicamente
const functionsDir = path.resolve(__dirname, "functions", process.env.FUNCTION_DIR);

const getEntries = () => {
  const entries = {};

  const walkDir = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (file.endsWith(".js")) {
        // Obtener nombre relativo de la función como clave
        const relPath = path.relative(functionsDir, fullPath);
        const name = relPath.replace(/\.js$/, "").replace(/\\/g, "/");
        entries[name] = fullPath;
      }
    }
  };

  walkDir(functionsDir);
  return entries;
};

const entries = getEntries();

const configList = Object.keys(entries).map((entryName) => {
  return {
    entry: {
      [entryName]: entries[entryName],
    },
    output: {
      filename: "index.js",
      path: path.resolve(__dirname, `dist/${entryName}`),
      libraryTarget: "umd",
    },
    target: "node",
    mode: "production",
    optimization: { minimize: false },
    plugins: [
      new ZipPlugin({
        path: path.resolve(__dirname, ".serverless"),
        filename: `${entryName}.procesado`,
        extension: "zip",
        pathPrefix: "", // para que esté en la raíz del zip
      }),
    ],
  };
});

module.exports = configList;
