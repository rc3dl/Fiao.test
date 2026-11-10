# Integración del tutorial interactivo de FIA'O

Esta versión integra `tutorial-fiao.zip` sobre la versión principal `Fia-O-main(1).zip`.

## Qué se conservó y qué se corrigió

- Se conserva `LanguageProvider` y todo el sistema español/inglés original.
- Se conserva `BrowserRouter` con `basename={import.meta.env.BASE_URL}` para no romper las rutas de GitHub Pages.
- Se conserva la lógica original de clientes, créditos, productos, informes, notificaciones y perfil. Los archivos de páginas se tomaron de la versión principal y solo recibieron los atributos `data-tour` necesarios.
- Se añade el recorrido interactivo, con resaltado de secciones, navegación entre páginas, avance, retroceso y cierre.
- El tutorial se muestra automáticamente la primera vez que un usuario completo entra al panel; la preferencia se guarda por usuario en el almacenamiento local. Se puede volver a iniciar desde el botón `?`, desde el menú móvil o desde Perfil.
- Los textos del recorrido y sus controles están disponibles en español e inglés y siguen el idioma seleccionado en FIA'O.
- No se agregaron dependencias nuevas al `package.json`.

## Archivos principales añadidos

- `src/tour/TourProvider.jsx`
- `src/tour/TourOverlay.jsx`
- `src/tour/TourButton.jsx`
- `src/tour/tour.js`
- `src/tour/tourSteps.js`
- `src/tour/tourTranslations.js`

## Verificación realizada

- Se revisó la sintaxis de los 112 archivos JavaScript/JSX de `src`; no se encontraron errores de análisis.
- Se verificaron los 44 identificadores de objetivos y acciones del tutorial; todos tienen su selector correspondiente, incluido el selector dinámico de las pestañas de Productos.
- Se comprobó que se conservan el proveedor de idioma, el `basename` del router, los controles de idioma de Navbar y las alertas traducidas.

No fue posible ejecutar `npm run build` en el entorno de preparación porque no se pudo acceder al registro de paquetes de npm (error de red `EAI_AGAIN`). Ejecuta `npm ci` y `npm run build` en tu equipo antes de publicar.
