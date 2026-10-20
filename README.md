# studyTool

App para estudiar desde cualquier lado: resúmenes en markdown, quizzes y progreso por materia. Es una PWA que se instala en el teléfono y se publica en GitHub Pages.

El contenido (resúmenes, quizzes, progreso) está en un repo privado aparte; este repo tiene solo el código.

## Desarrollo

```bash
npm install
npm run dev
```

- `npm run lint`, `npm run typecheck`, `npm run build`: lo mismo que corre la CI.
- `npm run icons`: regenera los íconos de la PWA desde `public/favicon.svg`.

El roadmap está en los [issues](https://github.com/TomMaspero/studyTool/issues) y el [project](https://github.com/users/TomMaspero/projects).
