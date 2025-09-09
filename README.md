This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

Convenciones de Código y Commits

Este documento define los estilos de nomenclatura que usamos en el proyecto y el proceso para hacer commits siguiendo el estándar Conventional Commits.
📂 Convenciones de Nombres
📁 Archivos y Carpetas
Usar como referencia Vercel Next.js Starter Example

    Formato: kebab-case - ✅ user-profile.js, main-layout/, auth-form/

🐫 Variables y Funciones

    Formato: camelCase - ✅
    Lenguaje: español
    Ejemplo:
    obtenerDatosUsuario, ejecutarLogin, autenticarToken

🧱 Clases y Componentes React

    Formato: PascalCase - ✅
    Lenguaje: español
    Ejemplo:
    Perfilusuario, FormularioLogin, LayoutPrincipal

📢 Constantes Globales

    Formato: UPPER_SNAKE_CASE
    Lenguaje: español
    Ejemplo:
    API_BASE_URL, TIEMO_ESPERA_DEFAULT

Nomenclatura Gihub Branchs

    Posicionado en la rama dev cree una nueva rama. 2 El nombre de la rama debe de seguir la siguiente convencion: //

Ejemplo estructura rama: feat/pi-22/initial-commit
✅ Commits con Conventional Commits

Usamos Conventional Commits para mantener un historial claro y semántico. Esto mejora la legibilidad, automatiza el changelog y facilita los despliegues.

Utilizá la extensión de VS Code:

🔗 Conventional Commits by vivaxy
🧱 Estructura

    En lugar de escribir un commit manualmente, hacé clic en "Conventional Commits".
    Seleccioná el tipo de cambio (feat, fix, chore, etc.)
    Ingresá el scope opcional (ej. none)
    Selecione un emoji correspondiente al trabajo realizado en el commit
    Escribí el mensaje corto del commit (ej. PI-22 | Initial commit)
    Presione la tecla enter el paso 5/6 no es obligatorio
    Escriba la URL del ticket de jira asociado
    Confirmá el commit generado

Ejemplo estructura commit :

feat: ✨ PI-22 | Initial commit

https://proyectoespanta.atlassian.net/browse/PI-22

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

