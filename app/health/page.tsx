import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Health Check - Eventu',
  description: 'Página de verificación de salud de la aplicación Eventu',
}

export default function HealthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-green-800 mb-2">Aplicación Saludable</h1>
        <p className="text-green-600">Eventu está funcionando correctamente</p>
        <p className="text-sm text-gray-500 mt-4">
          Timestamp: {new Date().toISOString()}
        </p>
      </div>
    </div>
  )
}
