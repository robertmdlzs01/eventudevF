import { Metadata } from 'next'
import MiCuentaClient from './MiCuentaClient'

export const metadata: Metadata = {
  title: 'Mi Cuenta - Eventu',
  description: 'Gestiona tu cuenta de Eventu, ve tus boletos, historial de compras y configuración personal.',
  keywords: 'mi cuenta, perfil, usuario, boletos, historial, configuración',
}

export default function MiCuentaPage() {
  return <MiCuentaClient />
}
