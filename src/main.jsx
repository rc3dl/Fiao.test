import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { IS_NATIVE } from '@/native/useIsNative'

// Solo en la app Android: activa los estilos móviles antes del primer pintado.
if (IS_NATIVE) {
  document.documentElement.classList.add('is-native')
  import('@/native/native').then((m) => m.initNative()).catch(() => {})
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
