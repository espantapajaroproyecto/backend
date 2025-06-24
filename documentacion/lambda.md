Claro, aquí tienes tu sección mejorada y con formato más claro y profesional para incluirla en tu archivo `.md`:

---

## 📦 Cómo generar el archivo ZIP con Webpack y subirlo a AWS Lambda

### 1️⃣ Empaquetar la función Lambda

Ejecuta el siguiente comando en la raíz del proyecto:

```bash
npm run package
```


### 2️⃣ Ubicación del archivo ZIP generado

Después de ejecutar el comando, se generará una carpeta llamada `.serverless/` (o `dist/` si usas otro flujo), que contendrá uno o varios archivos `.zip` procesados:

```
.project-root/
├── .serverless/
│   ├── lambda1.procesado.zip
│   ├── lambda2.procesado.zip
│   └── lambda3.procesado.zip
```

> ⚠️ Asegúrate de saber cuál ZIP corresponde a la función que vas a subir.

---

### 3️⃣ Subir ZIP a AWS Lambda desde la consola

1. Accede a la consola de AWS:
   👉 [https://console.aws.amazon.com/lambda](https://console.aws.amazon.com/lambda)

2. Selecciona una función Lambda existente o crea una nueva.

3. En la pestaña **Código**, haz clic en el botón **Cargar desde** y elige **Archivo .zip**.

4. Haz clic en **Subir** y selecciona el archivo `.zip` correspondiente desde la carpeta `.serverless/`.


5. Haz clic en **Guardar**.

6. Asegúrate de configurar las variables de ambiente en la configuracion de la lambda

---

Claro, aquí tienes una versión mejorada y clara de la sección sobre cómo invocar una función Lambda **localmente**, ideal si estás usando el framework **Serverless**:

---

## 🧪 Cómo invocar una Lambda localmente con Serverless Framework

Esta sección explica cómo probar tu función Lambda localmente antes de desplegarla en AWS. Esto es útil para depuración rápida y desarrollo local sin necesidad de subir nada.

---

### 1️⃣ Requisitos previos

- Tener instalado el framework [Serverless](https://www.serverless.com/)
- Tener Node.js instalado
- Tu función Lambda debe estar correctamente declarada en `serverless.yml`

Instalación (si aún no lo tienes):

```bash
npm install -g serverless
````

---

### 2️⃣ Declarar la Lambda en `serverless.yml`

Ejemplo de configuración básica:

```yaml
functions:
  obtenerUsuarios:
    handler: functions/usuario/obtenerUsuarios/index.handler
```

Esto le dice a Serverless dónde está el archivo y qué función exportada se debe ejecutar.

Estructura esperada del proyecto:

```
project-root/
├── functions/
│   └── usuario/
│       └── obtenerUsuarios/
│           └── index.js
├── serverless.yml
```

---

### 3️⃣ Comando para ejecutar la Lambda localmente

```bash
npm run local obtenerUsuarios
```

