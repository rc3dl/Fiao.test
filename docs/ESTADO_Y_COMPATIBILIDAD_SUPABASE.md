# Estado del proyecto y compatibilidad de Supabase

**Documento de referencia del repositorio Fiao.test.**  
Actualizado: 14 de noviembre de 2026.

## 1. Repositorio principal

A partir de esta transición, `rc3dl/Fiao.test` es el repositorio que continuará el desarrollo y sustituirá al repositorio anterior `rc3dl/Fia-O`. El código de Fiao.test es la línea principal de desarrollo; no se deben mezclar archivos antiguos por rutina ni tratar ambos repositorios como versiones equivalentes.

Antes de publicar una versión, se deben ejecutar las comprobaciones disponibles en el proyecto (pruebas, lint, typecheck y build) y revisar sus resultados. Que las pruebas hayan pasado anteriormente no garantiza que sigan pasando después de cambios nuevos.

## 2. Compatibilidad de la base de datos

Fiao.test incorpora sincronización offline y ventas fiadas idempotentes. Estas funciones requieren que el esquema de Supabase corresponda a esta versión del cliente.

### Migraciones importantes

Aplicar, en este orden, sobre una base de datos existente:

1. `supabase/migrations/001_idempotent_fiado_sale.sql`
2. `supabase/migrations/003_sync_and_archive_guards.sql`

La primera actualiza la RPC `register_fiado_sale` para recibir una clave de solicitud y evitar duplicar una venta cuando se reintenta. La segunda instala las protecciones de sincronización e historial, adapta `apply_sync_op` a la RPC idempotente y agrega las protecciones de archivo descritas en la migración.

La firma nueva no es compatible con el cliente antiguo de `rc3dl/Fia-O`, que llamaba a `register_fiado_sale` con cuatro argumentos. Por tanto, después de aplicar estas migraciones, no se debe seguir usando una versión antigua de FIA'O que dependa de esa firma.

### Procedimiento de transición recomendado

1. Confirmar que se va a desplegar Fiao.test como versión principal.
2. Hacer una copia de seguridad de la base de datos y revisar el estado actual de las migraciones.
3. Confirmar que la versión nueva de la aplicación y su cliente de ventas fiadas están listos para usar la RPC idempotente.
4. Aplicar las migraciones pendientes en el orden indicado, una sola vez y después de revisar su contenido.
5. Desplegar Fiao.test y realizar pruebas reales controladas: iniciar sesión, registrar un producto, registrar una venta fiada desde inventario, comprobar que baja el stock una sola vez y verificar el historial/sincronización.
6. No volver a desplegar el cliente antiguo contra esa misma base de datos.

No ejecutar todo `supabase/schema.sql` sobre una base de datos que ya contiene datos. Ese archivo completo es para crear un proyecto nuevo; en una base existente se aplican únicamente las migraciones pendientes y revisadas.

## 3. Migraciones y estado del entorno

Los archivos SQL versionados en `supabase/migrations/` son la referencia reproducible del esquema que necesita el código. El estado real del proyecto Supabase puede contener objetos creados manualmente o migraciones que no estén versionadas todavía.

En la revisión del 14 de noviembre de 2026, el proyecto Supabase usado por FIA'O ya tenía la tabla `public.app_releases`, su política de lectura de publicaciones y el bucket público `app-releases`. Sin embargo, la revisión del repositorio no encontró una migración versionada que reprodujera esa configuración. Esto significa que una base nueva no debe darse por preparada para actualizaciones Android solo porque el entorno existente ya tenga esos objetos.

Antes de crear un proyecto Supabase nuevo o reconstruir el entorno, hay que incorporar y revisar una migración reproducible para `app_releases`, sus políticas RLS y la configuración del bucket. No volver a crear ni modificar esos objetos a ciegas en el proyecto existente.

## 4. Reglas para evitar incompatibilidades

- Mantener las migraciones SQL junto al código que las necesita.
- No cambiar la firma de una RPC sin actualizar todos sus clientes y sus pruebas.
- No aplicar migraciones destructivas directamente al proyecto con datos sin copia de seguridad y revisión.
- No usar `schema.sql` como si fuera una actualización incremental.
- Probar la aplicación con el mismo esquema de Supabase que tendrá producción.
- No guardar claves `service_role`, contraseñas, tokens ni archivos de firma Android en Git.
- Registrar en este documento cualquier cambio que altere la compatibilidad entre el cliente y Supabase.

## 5. Qué significa que Fiao.test sustituya al repositorio anterior

La sustitución es una decisión de desarrollo y despliegue, no una migración automática de datos. Los datos continúan en Supabase. Lo que debe cambiar es el código publicado y, cuando corresponda, el esquema de base de datos que ese código necesita.

Si todavía hay instalaciones antiguas de Android en uso, deben actualizarse mediante una versión compatible antes de retirar el cliente anterior. No se debe asumir que cambiar GitHub Pages o el repositorio actualiza automáticamente los APK ya instalados.
