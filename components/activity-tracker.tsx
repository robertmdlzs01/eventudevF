"use client"

import { useActivityTracker } from "@/hooks/use-activity-tracker"

export function ActivityTracker() {
  // Este componente no renderiza nada, solo maneja el tracking de actividad
  useActivityTracker({
    interval: 2 * 60 * 1000, // Actualizar cada 2 minutos para detectar advertencias más rápido
    events: ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
  })

  return null
}
