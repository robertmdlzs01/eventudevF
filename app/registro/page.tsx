import { Metadata } from 'next'
import SignupClientPage from "./SignupClientPage"

export const metadata: Metadata = {
  title: 'Registro - Eventu',
  description: 'Crea tu cuenta en Eventu para acceder a todos los eventos y funcionalidades de la plataforma.',
  keywords: 'registro, crear cuenta, usuario, eventos, tickets',
}

export default function RegistroPage() {
  return <SignupClientPage />
}
