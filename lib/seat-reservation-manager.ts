import { SeatReservation, Seat } from './seat-map-types'

export class SeatReservationManager {
  private reservations: Map<string, SeatReservation> = new Map()
  private readonly RESERVATION_TIMEOUT = 15 * 60 * 1000 // 15 minutos en milisegundos
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    this.startCleanupInterval()
  }

  /**
   * Reserva un asiento temporalmente
   */
  reserveSeat(seatId: string, userId: string, eventId: string): boolean {
    // Verificar si el asiento ya está reservado
    if (this.isSeatReserved(seatId)) {
      return false
    }

    const reservation: SeatReservation = {
      id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      seatId,
      userId,
      eventId,
      expiresAt: new Date(Date.now() + this.RESERVATION_TIMEOUT),
      status: 'pending'
    }

    this.reservations.set(seatId, reservation)
    return true
  }

  /**
   * Confirma una reserva (convierte a compra)
   */
  confirmReservation(seatId: string, userId: string): boolean {
    const reservation = this.reservations.get(seatId)
    if (!reservation || reservation.userId !== userId) {
      return false
    }

    reservation.status = 'confirmed'
    this.reservations.set(seatId, reservation)
    return true
  }

  /**
   * Libera una reserva
   */
  releaseReservation(seatId: string, userId: string): boolean {
    const reservation = this.reservations.get(seatId)
    if (!reservation || reservation.userId !== userId) {
      return false
    }

    this.reservations.delete(seatId)
    return true
  }

  /**
   * Verifica si un asiento está reservado
   */
  isSeatReserved(seatId: string): boolean {
    const reservation = this.reservations.get(seatId)
    if (!reservation) return false

    // Verificar si la reserva ha expirado
    if (reservation.expiresAt < new Date()) {
      this.reservations.delete(seatId)
      return false
    }

    return reservation.status === 'pending'
  }

  /**
   * Obtiene todas las reservas de un usuario
   */
  getUserReservations(userId: string, eventId: string): SeatReservation[] {
    return Array.from(this.reservations.values()).filter(
      reservation => reservation.userId === userId && 
                    reservation.eventId === eventId &&
                    reservation.status === 'pending'
    )
  }

  /**
   * Obtiene el tiempo restante de una reserva
   */
  getReservationTimeLeft(seatId: string): number {
    const reservation = this.reservations.get(seatId)
    if (!reservation) return 0

    const timeLeft = reservation.expiresAt.getTime() - Date.now()
    return Math.max(0, timeLeft)
  }

  /**
   * Extiende el tiempo de una reserva
   */
  extendReservation(seatId: string, userId: string, additionalMinutes: number = 5): boolean {
    const reservation = this.reservations.get(seatId)
    if (!reservation || reservation.userId !== userId) {
      return false
    }

    reservation.expiresAt = new Date(Date.now() + this.RESERVATION_TIMEOUT + (additionalMinutes * 60 * 1000))
    this.reservations.set(seatId, reservation)
    return true
  }

  /**
   * Limpia reservas expiradas
   */
  private cleanupExpiredReservations(): void {
    const now = new Date()
    for (const [seatId, reservation] of this.reservations.entries()) {
      if (reservation.expiresAt < now && reservation.status === 'pending') {
        this.reservations.delete(seatId)
      }
    }
  }

  /**
   * Inicia el intervalo de limpieza automática
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredReservations()
    }, 60000) // Limpiar cada minuto
  }

  /**
   * Detiene el intervalo de limpieza
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Obtiene estadísticas de reservas
   */
  getReservationStats(eventId: string): {
    totalReservations: number
    activeReservations: number
    expiredReservations: number
    confirmedReservations: number
  } {
    const eventReservations = Array.from(this.reservations.values()).filter(
      reservation => reservation.eventId === eventId
    )

    const now = new Date()
    const activeReservations = eventReservations.filter(
      reservation => reservation.expiresAt > now && reservation.status === 'pending'
    )
    const expiredReservations = eventReservations.filter(
      reservation => reservation.expiresAt <= now && reservation.status === 'pending'
    )
    const confirmedReservations = eventReservations.filter(
      reservation => reservation.status === 'confirmed'
    )

    return {
      totalReservations: eventReservations.length,
      activeReservations: activeReservations.length,
      expiredReservations: expiredReservations.length,
      confirmedReservations: confirmedReservations.length
    }
  }
}

// Instancia global del manager de reservas
export const seatReservationManager = new SeatReservationManager()

// Hook para usar en componentes React
export function useSeatReservation() {
  const reserveSeat = (seatId: string, userId: string, eventId: string): boolean => {
    return seatReservationManager.reserveSeat(seatId, userId, eventId)
  }

  const releaseSeat = (seatId: string, userId: string): boolean => {
    return seatReservationManager.releaseReservation(seatId, userId)
  }

  const isSeatReserved = (seatId: string): boolean => {
    return seatReservationManager.isSeatReserved(seatId)
  }

  const getUserReservations = (userId: string, eventId: string): SeatReservation[] => {
    return seatReservationManager.getUserReservations(userId, eventId)
  }

  const getTimeLeft = (seatId: string): number => {
    return seatReservationManager.getReservationTimeLeft(seatId)
  }

  const extendReservation = (seatId: string, userId: string, additionalMinutes?: number): boolean => {
    return seatReservationManager.extendReservation(seatId, userId, additionalMinutes)
  }

  return {
    reserveSeat,
    releaseSeat,
    isSeatReserved,
    getUserReservations,
    getTimeLeft,
    extendReservation
  }
}
