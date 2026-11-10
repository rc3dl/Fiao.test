import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fiao.panama',
  appName: 'Fiao',
  webDir: 'dist',
  // Rojo de marca: fondo del WebView mientras carga (así no hay destellos blancos al abrir la app).
  backgroundColor: '#B91C1C',
  server: { androidScheme: 'https' },
};

export default config;
