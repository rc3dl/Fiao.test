import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'

const REQUIRED = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // .env, .env.local, .env.<modo> y las variables del sistema (por ejemplo los secrets de GitHub Actions)
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const isAndroid = mode === 'android' // npm run build:android
  const isCI = Boolean(process.env.GITHUB_ACTIONS)

  // Publicar la web o compilar la app sin credenciales dejaría el login roto: mejor detener el proceso.
  const missing = REQUIRED.filter((key) => !env[key])
  if (missing.length && (isAndroid || isCI)) {
    throw new Error(
      `Faltan variables de entorno: ${missing.join(', ')}. ` +
        (isCI
          ? 'Créalas en GitHub: Settings > Secrets and variables > Actions.'
          : 'Copia .env.example a .env.local y complétalo.')
    )
  }

  return {
    // GitHub Pages sirve la web en /Fia-O/. Local, Vercel y la app Android la sirven en la raíz.
    // VITE_BASE permite cambiarlo (por ejemplo, un dominio propio).
    base: env.VITE_BASE || (isAndroid ? '/' : isCI ? '/Fia-O/' : '/'),
    plugins: [react()],
    resolve: {
      alias: {
        // El atajo "@/" significa "src/" (antes lo daba el plugin de Base44)
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
