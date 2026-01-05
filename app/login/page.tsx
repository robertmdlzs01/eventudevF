import { Metadata } from 'next'
import LoginPageClient from "./LoginPageClient"

export const metadata: Metadata = {
  title: 'Iniciar Sesión - Eventu',
  description: 'Inicia sesión en tu cuenta de Eventu para acceder a todos los eventos y funcionalidades.',
  keywords: 'login, iniciar sesión, cuenta, usuario, eventos',
}

export default function LoginPage() {
  return <LoginPageClient />
}
