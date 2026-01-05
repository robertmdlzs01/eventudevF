"use client"

import { useState, useEffect, useCallback } from "react"
import { getWebSocketClient, type SeatMapUpdate } from "@/lib/websocket-client"
import { useToast } from "@/hooks/use-toast"

interface UseSeatUpdatesOptions {
  eventId: string
  onSeatUpdate?: (update: SeatMapUpdate) => void
  onConnectionChange?: (status: string) => void
}

export function useSeatUpdates({ eventId, onSeatUpdate, onConnectionChange }: UseSeatUpdatesOptions) {
  const [connectionStatus, setConnectionStatus] = useState<string>("disconnected")
  const [lastUpdate, setLastUpdate] = useState<SeatMapUpdate | null>(null)
  const { toast } = useToast()
  const wsClient = getWebSocketClient()

  const handleSeatUpdate = useCallback(
    (update: SeatMapUpdate) => {
      setLastUpdate(update)
      onSeatUpdate?.(update)

      // Show toast for relevant updates
      if (update.updates.length > 0) {
        const reservedSeats = update.updates.filter((u) => u.status === "reserved").length
        const occupiedSeats = update.updates.filter((u) => u.status === "occupied").length
        const releasedSeats = update.updates.filter((u) => u.status === "available").length

        if (reservedSeats > 0) {
          toast({
            title: "Asientos reservados",
            description: `${reservedSeats} asiento${reservedSeats > 1 ? "s" : ""} ha${reservedSeats > 1 ? "n" : ""} sido reservado${reservedSeats > 1 ? "s" : ""} por otro usuario`,
            variant: "default",
          })
        }

        if (occupiedSeats > 0) {
          toast({
            title: "Asientos vendidos",
            description: `${occupiedSeats} asiento${occupiedSeats > 1 ? "s" : ""} ha${occupiedSeats > 1 ? "n" : ""} sido vendido${occupiedSeats > 1 ? "s" : ""}`,
            variant: "default",
          })
        }

        if (releasedSeats > 0) {
          toast({
            title: "Asientos liberados",
            description: `${releasedSeats} asiento${releasedSeats > 1 ? "s" : ""} ha${releasedSeats > 1 ? "n" : ""} sido liberado${releasedSeats > 1 ? "s" : ""}`,
            variant: "default",
          })
        }
      }
    },
    [onSeatUpdate, toast],
  )

  const handleConnectionChange = useCallback(
    (status: string) => {
      setConnectionStatus(status)
      onConnectionChange?.(status)

      if (status === "connected") {
        toast({
          title: "Conectado",
          description: "Actualizaciones en tiempo real activadas",
          variant: "default",
        })
      } else if (status === "disconnected") {
        toast({
          title: "Desconectado",
          description: "Las actualizaciones en tiempo real no están disponibles",
          variant: "destructive",
        })
      }
    },
    [onConnectionChange, toast],
  )

  useEffect(() => {
    if (!eventId) return

    // Set up event listeners
    wsClient.onSeatUpdate(handleSeatUpdate)
    // Note: maxReconnectAttemptsReached event handling removed as it's not available in the current WebSocketClient

    // Connect to WebSocket
    wsClient.connect(eventId)

    // Update connection status
    setConnectionStatus(wsClient.isConnectedToServer() ? "connected" : "disconnected")

    return () => {
      // Clean up event listeners
      wsClient.offSeatUpdate(handleSeatUpdate)
    }
  }, [eventId, handleSeatUpdate, handleConnectionChange, wsClient, toast])

  const reserveSeats = useCallback(
    (seatIds: string[], userId: string) => {
      wsClient.reserveSeats(seatIds, userId)
    },
    [wsClient],
  )

  const releaseSeats = useCallback(
    (seatIds: string[], userId: string) => {
      wsClient.releaseSeats(seatIds, userId)
    },
    [wsClient],
  )

  const occupySeats = useCallback(
    (seatIds: string[], userId: string, transactionId: string) => {
      wsClient.occupySeats(seatIds, userId, transactionId)
    },
    [wsClient],
  )

  return {
    connectionStatus,
    lastUpdate,
    reserveSeats,
    releaseSeats,
    occupySeats,
    isConnected: connectionStatus === "connected",
    isConnecting: connectionStatus === "connecting",
    isDisconnected: connectionStatus === "disconnected",
  }
}
