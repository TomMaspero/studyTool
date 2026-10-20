# studyTool

PWA para estudiar desde el celular: leer resúmenes, hacer quizzes y seguir el progreso por materia. Se publica en GitHub Pages (`https://tommaspero.github.io/studyTool/`).

## Arquitectura

- Este repo es público y tiene **solo código**. El contenido vive en el repo privado `TomMaspero/atlantida-contenido` (la carpeta `Desktop\Atlantida`), que la app lee y escribe con la API de GitHub usando un token fine-grained que se carga en cada dispositivo.
- Nunca commitear contenido, tokens ni datos personales acá.
- Stack: Vite + React + TypeScript, `vite-plugin-pwa`, Oxlint.
- `base` de Vite es `/studyTool/`: las rutas a archivos de `public/` y los links internos tienen que respetarlo.

## Convenciones

- Código en inglés (nombres, tipos); textos de la interfaz, issues, docs y commits en español.
- Componentes en PascalCase, uno por archivo.
- Diseño mobile first: tiene que andar bien con una mano en el teléfono.
- Íconos de la PWA: se generan desde `public/favicon.svg` con `npm run icons`.

## Verificación

`npm run lint`, `npm run typecheck` y `npm run build`. La CI (`.github/workflows/ci.yml`) corre lo mismo en cada PR y, al mergear a `main`, despliega a Pages.

## Git y pull requests

- Nunca commitear ni pushear directo a `main`. Cada cambio va en una rama (`feature/...`, `fix/...`, `docs/...`) y entra por pull request.
- Commits chicos agrupados por funcionalidad; cada uno tiene que compilar.
- Máximo ~300 líneas de código por PR (sin contar lockfiles ni assets generados). Si es más grande, separarlo; si dependen entre sí, apilarlos.
- Descripción del PR corta: qué cambia, por qué y cómo probarlo. Referencia su issue con `Closes #N`.
- Se pueden pushear las ramas de trabajo para abrir el PR con `gh pr create`. El usuario revisa y aprueba el merge en GitHub.
- Confirmar con el usuario antes de cada commit.
