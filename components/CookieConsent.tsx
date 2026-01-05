"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { X, Cookie, Settings } from 'lucide-react'

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [analyticsConsent, setAnalyticsConsent] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShowConsent(true)
    }
  }, [])

  const handleAcceptAll = () => {
    localStorage.setItem('cookie-consent', 'all')
    localStorage.setItem('analytics-consent', 'true')
    localStorage.setItem('marketing-consent', 'true')
    
    // Enable Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        'analytics_storage': 'granted',
        'ad_storage': 'granted'
      })
    }
    
    setShowConsent(false)
  }

  const handleAcceptNecessary = () => {
    localStorage.setItem('cookie-consent', 'necessary')
    localStorage.setItem('analytics-consent', 'false')
    localStorage.setItem('marketing-consent', 'false')
    
    // Disable Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        'analytics_storage': 'denied',
        'ad_storage': 'denied'
      })
    }
    
    setShowConsent(false)
  }

  const handleSaveSettings = () => {
    localStorage.setItem('cookie-consent', 'custom')
    localStorage.setItem('analytics-consent', analyticsConsent.toString())
    localStorage.setItem('marketing-consent', marketingConsent.toString())
    
    // Update Google Analytics consent
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        'analytics_storage': analyticsConsent ? 'granted' : 'denied',
        'ad_storage': marketingConsent ? 'granted' : 'denied'
      })
    }
    
    setShowSettings(false)
    setShowConsent(false)
  }

  const handleManageSettings = () => {
    setShowSettings(true)
    setShowConsent(false)
  }

  if (!showConsent && !showSettings) {
    return null
  }

  return (
    <>
      {/* Main consent banner */}
      {showConsent && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t shadow-lg">
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Cookie className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">
                    Utilizamos cookies para mejorar tu experiencia
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Utilizamos cookies para analizar el tráfico del sitio, personalizar el contenido y proporcionar funciones de redes sociales. 
                    Puedes aceptar todas las cookies o configurar tus preferencias.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={handleAcceptAll} className="bg-blue-600 hover:bg-blue-700">
                      Aceptar todas
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleAcceptNecessary}
                    >
                      Solo necesarias
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={handleManageSettings}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Configurar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Configuración de cookies</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="analytics" 
                      checked={analyticsConsent}
                      onCheckedChange={(checked) => setAnalyticsConsent(checked as boolean)}
                    />
                    <Label htmlFor="analytics" className="font-medium">
                      Cookies analíticas
                    </Label>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    Nos ayudan a entender cómo interactúas con el sitio web recopilando y reportando información de forma anónima.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="marketing" 
                      checked={marketingConsent}
                      onCheckedChange={(checked) => setMarketingConsent(checked as boolean)}
                    />
                    <Label htmlFor="marketing" className="font-medium">
                      Cookies de marketing
                    </Label>
                  </div>
                  <p className="text-sm text-gray-600 ml-6">
                    Se utilizan para rastrear visitantes en sitios web para mostrar anuncios relevantes y atractivos.
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleSaveSettings}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Guardar configuración
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowSettings(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
