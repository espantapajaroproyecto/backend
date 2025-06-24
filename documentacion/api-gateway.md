Perfecto. A continuación te dejo una guía clara y paso a paso en **Markdown** para configurar un **autenticador en API Gateway** usando un **Authorizer de tipo Lambda (Lambda Authorizer)**.

---

````markdown
# 🔐 Configurar un Lambda Authorizer en API Gateway (REST API)

Esta guía muestra cómo proteger tus endpoints REST en API Gateway usando un autenticador personalizado basado en una función Lambda, conocido como **Lambda Authorizer**.

---

## 🧰 Prerrequisitos

- Una REST API creada en API Gateway
- La funcion lambdaAutorizer.js deployada

---

## 2️⃣ Configurar el Authorizer en API Gateway

1. Ve a la consola de API Gateway.
2. Selecciona tu REST API.
3. En el menú izquierdo, ve a **Authorizers**.
4. Haz clic en **Create New Authorizer**.
5. Configura:
   * **Authorizer name**: `MiAuthorizer`
   * **Authorizer type**: Lambda   
   * **Lambda function**: lambdaAutorizer
   * **Token Source**: `authorizationToken` (debe coincidir con el header enviado)
6. Haz clic en **Create**

---

## 3️⃣ Asociar el Authorizer a un endpoint

1. En el menú izquierdo, ve a tus recursos (por ejemplo `/users`).
2. Selecciona el método (por ejemplo `GET`).
3. Haz clic en **Method Request**.
4. En **Authorization**, selecciona tu Authorizer (`MiAuthorizer`).
5. Haz clic en el botón de ✔️ para guardar.

---

