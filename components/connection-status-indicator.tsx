"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, AlertCircle, CheckCircle } from "lucide-react"
import { getWebSocketClient } from "@/lib/websocket-client"

interface ConnectionStatusIndicatorProps {
  eventId?: string
  showLabel?: boolean
  variant?: "badge" | "icon" | "full"
}

export default function ConnectionStatusIndicator({
  eventId,
  showLabel = true,
  variant = "badge",
}: ConnectionStatusIndicatorProps) {
  const [connectionStatus, setConnectionStatus] = useState<string>("disconnected")
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    const wsClient = getWebSocketClient()

    const handleConnectionChange = (status: string) => {
      setConnectionStatus(status)
      if (status === "connected") {
        setLastUpdate(new Date())
      }
    }

    const handleSeatUpdate = () => {
      setLastUpdate(new Date())
    }

    // Conectar y obtener estado inicial
    wsClient.connect(eventId)
    setConnectionStatus(wsClient.isConnectedToServer() ? "connected" : "disconnected")

    // Escuchar actualizaciones de asientos
    wsClient.onSeatUpdate(handleSeatUpdate)

    return () => {
      wsClient.offSeatUpdate(handleSeatUpdate)
    }
  }, [eventId])

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case "connected":
        return {
          icon: CheckCircle,
          color: "bg-green-500",
          badgeVariant: "default" as const,
          text: "",
          description: "Actualizaciones en tiempo real",
        }
      case "connecting":
        return {
          icon: Wifi,
          color: "bg-yellow-500",
          badgeVariant: "secondary" as const,
          text: "Conectando...",
          description: "Estableciendo conexión",
        }
      case "error":
        return {
          icon: AlertCircle,
          color: "bg-red-500",
          badgeVariant: "destructive" as const,
          text: "Error",
          description: "Error de conexión",
        }
      default:
        return {
          icon: WifiOff,
          color: "bg-gray-500",
          badgeVariant: "outline" as const,
          text: "Desconectado",
          description: "Sin actualizaciones en tiempo real",
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  if (variant === "icon") {
    return (
      <div className="relative">
        <Icon className={`h-4 w-4 ${connectionStatus === "connected" ? "text-green-500" : "text-gray-500"}`} />
        {connectionStatus === "connected" && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        )}
      </div>
    )
  }

  if (variant === "full") {
    return (
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
        <div className="relative">
          <Icon className={`h-5 w-5 ${connectionStatus === "connected" ? "text-green-500" : "text-gray-500"}`} />
          {connectionStatus === "connected" && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm">{config.text}</div>
          <div className="text-xs text-muted-foreground">{config.description}</div>
          {lastUpdate && connectionStatus === "connected" && (
            <div className="text-xs text-muted-foreground">Última actualización: {lastUpdate.toLocaleTimeString()}</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Badge variant={config.badgeVariant} className="flex items-center gap-2">
      <Icon className="h-3 w-3" />
      {showLabel && config.text}
      {connectionStatus === "connected" && <div className="w-2 h-2 bg-current rounded-full animate-pulse" />}
    </Badge>
  )
}
