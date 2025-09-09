Perfecto 🙌, te armo una sección para tu **README.md** explicando esos scripts en español, clara y ordenada:

---

## 📜 Scripts disponibles

En este proyecto podés ejecutar los siguientes scripts definidos en `package.json`:

### ▶️ `npm run local`

Ejecuta una función de **AWS Lambda** de manera local usando **Serverless Framework**.

> Útil para probar funciones sin necesidad de desplegarlas en AWS.

```bash
npm run local nombreDeLaFuncion
```

---

### 🧪 `npm run local:evento`

Corre un **test local** ejecutando el script `ejecutar-test-local.sh` ubicado en `./utils/bash/`.

> Ideal para simular un evento completo y verificar cómo responde la Lambda.

```bash
npm run local:evento
```

---

### 🔄 `npm run reload:s3`

Invoca de forma local la función **`cargarDataS3`**.

> Se usa para recargar o probar la carga de datos en un bucket S3 desde el entorno local.

```bash
npm run reload:s3
```

---

### 📦 `npm run package`

Ejecuta el script `run-webpack-linux.sh` que empaqueta el proyecto utilizando **Webpack**.

> Este comando genera el bundle necesario para desplegar la aplicación en AWS.

```bash
npm run package
```

---

¿Querés que te lo deje ya maquetado en un **README.md completo** (con introducción, instalación, scripts y convenciones) o solamente esta sección lista para pegarla en el README que ya tenés?
