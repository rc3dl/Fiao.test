# AGENTS.md — FIA'O

## Proyecto

FIA'O es una aplicación para pequeños comercios de Panamá: clientes, fiados/créditos, pagos, productos/inventario y reportes. Existe como web (GitHub Pages) y como app Android (Capacitor) que comparten el mismo código.

Empieza por `README.md` (instalación, variables de entorno, despliegue y Android).

## Arquitectura

- Frontend: React + Vite (JavaScript/JSX), Tailwind, TanStack Query, React Router.
- Backend: Supabase (autenticación, base de datos, RPC). No es un proyecto Base44.
- Android: Capacitor 8. Identificador `com.fiao.panama`.

```
src/
  api/        acceso a Supabase (supabaseClient, authClient y un *Api.js por área)
  contexts/   sesión, idioma y tema
  lib/        reglas de negocio y utilidades (funciones puras); env.js lee las variables VITE_
  tour/       tutorial guiado (pasos, overlay, provider, traducciones)
  native/     SOLO Android: barra inferior, splash animado, botón atrás, pantallas móviles
  components/ piezas compartidas (components/ui es el kit de shadcn)
  pages/      una pantalla por archivo
```

## Web y Android

- Todo lo exclusivo de Android cuelga de `IS_NATIVE` (`src/native/useIsNative.js`) o de la clase `html.is-native` (bloque final de `src/index.css`). En el navegador `IS_NATIVE` es `false`.
- No cambies la versión web para resolver algo propio de Android.
- Google no permite iniciar sesión dentro de un WebView: en Android se abre el navegador del sistema y se regresa por `com.fiao.panama://auth` (`authClient.loginWithProvider` y `src/native/native.js`). Ese enlace debe estar en las Redirect URLs de Supabase.
- Notificaciones en Android: la campana va fija arriba a la derecha y `src/native/notifications.js` programa un recordatorio local diario (9:00) con los mismos avisos. WhatsApp se abre con `src/native/openExternal.js`.
- En Android no hay barra superior: la navegación es la barra inferior (`src/native/BottomDock.jsx`) y la campana va en el Dashboard.

## Variables de entorno

Se leen solo en `src/lib/env.js`. Local y Android: `.env.local` (copia `.env.example`). GitHub Pages: secrets del repositorio. `vite.config.js` detiene la compilación de GitHub Actions y de `npm run build:android` si faltan las de Supabase.

## Reglas

1. Revisa `package.json` antes de proponer comandos y comprueba que `package-lock.json` corresponda.
2. No asumas rutas: inspecciona el árbol real.
3. No introduzcas `@base44/*` ni comandos Base44.
4. Usa los módulos de `src/api/`; no dupliques consultas ni lógica de negocio.
5. No cambies el esquema de Supabase, las políticas RLS ni las RPC sin explicar el impacto.
6. No expongas claves ni secretos: nada de `service_role` en el frontend ni en variables `VITE_`.
7. Los textos visibles van en español e inglés (`src/lib/translations.js`).
8. Si añades un paso o una pantalla al tutorial, actualiza `src/tour/tourSteps.js` y verifica que existan sus elementos `data-tour`.
9. Actualiza la documentación si cambia la arquitectura, la configuración o el comportamiento.

## Informe de cambios

Indica el requisito, los archivos tocados, la verificación y los pendientes. Distingue revisión estática de prueba real.
