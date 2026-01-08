// Servicio de impresión basado en el sistema QZ del WordPress
// Integración con QZ Tray para impresión de tickets
// Actualizado para soportar plantillas personalizables
//
// IMPORTANTE: Los drivers de impresora NO están incluidos en este proyecto.
// Los drivers deben instalarse en el equipo donde se ejecutará la impresión.
// Ver documentación completa en: docs/DRIVERS_IMPRESION.md
//
// Requisitos:
// 1. QZ Tray instalado y ejecutándose (https://qz.io/download/)
// 2. Drivers de impresora instalados en el sistema operativo
// 3. Al menos una impresora configurada en el sistema

import type { TicketTemplate, TicketData } from './ticket-templates'
import { ticketTemplateService } from './ticket-template-service'

export interface PrintTicketData {
  ticketNumber: string
  eventName: string
  customerName: string
  ticketType: string
  price: number
  eventDate: string
  eventLocation: string
  qrCode: string
  seatNumber?: string
  gate?: string
}

export interface PrintConfig {
  printerName?: string
  paperSize: 'A4' | 'A5' | 'thermal'
  orientation: 'portrait' | 'landscape'
  copies: number
}

class PrintService {
  private qzEndpoint: string = 'ws://localhost:8282'
  private isConnected: boolean = false

  // Conectar con QZ Tray
  async connect(): Promise<boolean> {
    try {
      // Verificar si QZ Tray está disponible
      const response = await fetch(`${this.qzEndpoint}/status`)
      this.isConnected = response.ok
      return this.isConnected
    } catch (error) {
      console.error('Error conectando con QZ Tray:', error)
      this.isConnected = false
      return false
    }
  }

  // Generar QR Code para ticket
  generateQRCode(ticketData: PrintTicketData): string {
    // Generar código QR único basado en datos del ticket
    const qrData = {
      ticketId: ticketData.ticketNumber,
      eventId: ticketData.eventName,
      customerId: ticketData.customerName,
      timestamp: Date.now(),
      checksum: this.generateChecksum(ticketData)
    }
    
    return JSON.stringify(qrData)
  }

  // Generar checksum para validación
  private generateChecksum(ticketData: PrintTicketData): string {
    const data = `${ticketData.ticketNumber}-${ticketData.eventName}-${ticketData.customerName}`
    // Implementar algoritmo de checksum simple
    return btoa(data).substring(0, 8)
  }

  // Imprimir ticket con plantilla
  async printTicketWithTemplate(
    template: TicketTemplate,
    ticketData: TicketData,
    config?: PrintConfig
  ): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect()
      }

      // Generar HTML usando la plantilla
      const ticketHTML = ticketTemplateService.generateTicketHTML(template, ticketData)
      
      const printConfig = config || template.printConfig
      
      // Enviar a impresora
      const printData = {
        type: 'raw',
        format: 'html',
        data: ticketHTML,
        printer: printConfig.printerName,
        copies: printConfig.copies,
        paperSize: printConfig.paperSize,
        orientation: printConfig.orientation,
      }

      const response = await fetch(`${this.qzEndpoint}/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(printData)
      })

      return response.ok
    } catch (error) {
      console.error('Error imprimiendo ticket con plantilla:', error)
      return false
    }
  }

  // Imprimir ticket (método legacy - mantiene compatibilidad)
  async printTicket(ticketData: PrintTicketData, config: PrintConfig = {
    paperSize: 'thermal',
    orientation: 'portrait',
    copies: 1
  }): Promise<boolean> {
    try {
      // Convertir PrintTicketData a TicketData
      const ticketDataConverted: TicketData = {
        eventName: ticketData.eventName,
        eventDate: ticketData.eventDate,
        eventTime: '',
        eventLocation: ticketData.eventLocation,
        ticketNumber: ticketData.ticketNumber,
        ticketId: ticketData.ticketNumber,
        ticketType: ticketData.ticketType,
        price: ticketData.price,
        customerName: ticketData.customerName,
        customerEmail: '',
        seatNumber: ticketData.seatNumber,
        gate: ticketData.gate,
        qrCode: ticketData.qrCode,
        purchaseDate: new Date().toISOString(),
        purchaseId: '',
      }

      // Obtener plantilla por defecto
      const defaultTemplate = await ticketTemplateService.getDefaultTemplate()
      
      // Usar el nuevo método con plantilla
      return await this.printTicketWithTemplate(defaultTemplate, ticketDataConverted, config)
    } catch (error) {
      console.error('Error imprimiendo ticket:', error)
      return false
    }
  }

  // Generar HTML del ticket
  private generateTicketHTML(ticketData: PrintTicketData, qrCode: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ticket ${ticketData.ticketNumber}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            width: 300px; 
            margin: 0; 
            padding: 10px;
            font-size: 12px;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 10px; 
            margin-bottom: 15px;
          }
          .event-name { 
            font-size: 16px; 
            font-weight: bold; 
            margin-bottom: 5px;
          }
          .ticket-info { 
            margin-bottom: 10px; 
          }
          .qr-code { 
            text-align: center; 
            margin: 15px 0; 
          }
          .footer { 
            text-align: center; 
            font-size: 10px; 
            color: #666; 
            margin-top: 15px;
            border-top: 1px solid #ccc;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="event-name">${ticketData.eventName}</div>
          <div>Ticket #${ticketData.ticketNumber}</div>
        </div>
        
        <div class="ticket-info">
          <div><strong>Cliente:</strong> ${ticketData.customerName}</div>
          <div><strong>Tipo:</strong> ${ticketData.ticketType}</div>
          <div><strong>Precio:</strong> $${ticketData.price.toLocaleString()}</div>
          <div><strong>Fecha:</strong> ${ticketData.eventDate}</div>
          <div><strong>Ubicación:</strong> ${ticketData.eventLocation}</div>
          ${ticketData.seatNumber ? `<div><strong>Asiento:</strong> ${ticketData.seatNumber}</div>` : ''}
          ${ticketData.gate ? `<div><strong>Puerta:</strong> ${ticketData.gate}</div>` : ''}
        </div>
        
        <div class="qr-code">
          <div>Escanea este código QR para validar</div>
          <div style="font-family: monospace; font-size: 10px; word-break: break-all;">
            ${qrCode}
          </div>
        </div>
        
        <div class="footer">
          <div>Eventu - Sistema de Tickets</div>
          <div>Impreso: ${new Date().toLocaleString()}</div>
        </div>
      </body>
      </html>
    `
  }

  // Obtener impresoras disponibles
  async getAvailablePrinters(): Promise<string[]> {
    try {
      const response = await fetch(`${this.qzEndpoint}/printers`)
      const data = await response.json()
      return data.printers || []
    } catch (error) {
      console.error('Error obteniendo impresoras:', error)
      return []
    }
  }

  // Verificar estado de QZ Tray
  async getStatus(): Promise<{ connected: boolean; version?: string; printers?: string[] }> {
    try {
      const response = await fetch(`${this.qzEndpoint}/status`)
      const data = await response.json()
      return {
        connected: response.ok,
        version: data.version,
        printers: data.printers
      }
    } catch (error) {
      return { connected: false }
    }
  }
}

export const printService = new PrintService()
