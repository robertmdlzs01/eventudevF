// Servicio para gestionar plantillas de boletos físicos

import type { TicketTemplate, TicketData, TicketMeasurements } from './ticket-templates'

class TicketTemplateService {
  private storageKey = 'ticket_templates'
  private defaultTemplateKey = 'default_ticket_template'

  // Obtener todas las plantillas
  async getTemplates(): Promise<TicketTemplate[]> {
    try {
      // Intentar obtener del backend primero
      const response = await fetch('/api/admin/ticket-templates')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          return data.data
        }
      }
    } catch (error) {
      console.warn('Error obteniendo plantillas del backend, usando localStorage:', error)
    }

    // Fallback a localStorage
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error parseando plantillas de localStorage:', error)
    }

    // Si no hay plantillas, retornar la plantilla por defecto
    const { DEFAULT_TEMPLATE } = await import('./ticket-templates')
    return [DEFAULT_TEMPLATE]
  }

  // Obtener una plantilla por ID
  async getTemplate(id: string): Promise<TicketTemplate | null> {
    const templates = await this.getTemplates()
    return templates.find(t => t.id === id) || null
  }

  // Obtener plantilla por defecto
  async getDefaultTemplate(): Promise<TicketTemplate> {
    const stored = localStorage.getItem(this.defaultTemplateKey)
    if (stored) {
      return JSON.parse(stored)
    }

    // Importar plantilla por defecto
    const { DEFAULT_TEMPLATE } = await import('./ticket-templates')
    return DEFAULT_TEMPLATE
  }

  // Guardar plantilla
  async saveTemplate(template: TicketTemplate): Promise<boolean> {
    try {
      // Intentar guardar en backend
      const response = await fetch('/api/admin/ticket-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          return true
        }
      }
    } catch (error) {
      console.warn('Error guardando plantilla en backend, usando localStorage:', error)
    }

    // Fallback a localStorage
    try {
      const templates = await this.getTemplates()
      // Filtrar la plantilla por defecto si estamos guardando una nueva
      const filteredTemplates = templates.filter(t => !t.isDefault || t.id === template.id)
      const index = filteredTemplates.findIndex(t => t.id === template.id)
      
      if (index >= 0) {
        filteredTemplates[index] = { ...template, updatedAt: new Date().toISOString() }
      } else {
        filteredTemplates.push({ ...template, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
      }

      localStorage.setItem(this.storageKey, JSON.stringify(filteredTemplates))
      
      if (template.isDefault) {
        localStorage.setItem(this.defaultTemplateKey, JSON.stringify(template))
      }

      return true
    } catch (error) {
      console.error('Error guardando plantilla:', error)
      return false
    }
  }

  // Eliminar plantilla
  async deleteTemplate(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/admin/ticket-templates/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        return true
      }
    } catch (error) {
      console.warn('Error eliminando plantilla del backend, usando localStorage:', error)
    }

    // Fallback a localStorage
    try {
      const templates = await this.getTemplates()
      const filtered = templates.filter(t => t.id !== id)
      localStorage.setItem(this.storageKey, JSON.stringify(filtered))
      return true
    } catch (error) {
      console.error('Error eliminando plantilla:', error)
      return false
    }
  }

  // Generar HTML del boleto desde plantilla
  generateTicketHTML(template: TicketTemplate, data: TicketData): string {
    const { measurements, fields } = template
    
    // Convertir medidas a píxeles (asumiendo 96 DPI: 1mm = 3.7795px)
    const mmToPx = (mm: number) => mm * 3.7795
    
    const widthPx = mmToPx(measurements.width)
    const heightPx = mmToPx(measurements.height)
    
    // Generar CSS para cada campo
    const fieldStyles = fields
      .filter(field => field.visible)
      .map(field => {
        const x = mmToPx(field.position.x)
        const y = mmToPx(field.position.y)
        const w = mmToPx(field.size.width)
        const h = mmToPx(field.size.height)
        
        let content = ''
        
        switch (field.type) {
          case 'text':
            content = this.getFieldContent(field, data)
            return `
              <div class="field-${field.id}" style="
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: ${w}px;
                height: ${h}px;
                font-size: ${field.style.fontSize || 12}pt;
                font-family: ${field.style.fontFamily || 'Arial, sans-serif'};
                font-weight: ${field.style.fontWeight || 'normal'};
                color: ${field.style.color || '#000000'};
                text-align: ${field.style.textAlign || 'left'};
                background-color: ${field.style.backgroundColor || 'transparent'};
                border: ${field.style.borderWidth || 0}px solid ${field.style.borderColor || 'transparent'};
                padding: ${measurements.padding}px;
                overflow: hidden;
              ">${content}</div>
            `
            
          case 'qr':
            return `
              <div class="field-${field.id}" style="
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: ${w}px;
                height: ${h}px;
              ">
                <img src="${data.qrCode}" alt="QR Code" style="width: 100%; height: 100%; object-fit: contain;" />
              </div>
            `
            
          case 'image':
          case 'logo':
            const imageUrl = field.type === 'logo' ? (data.logo || '') : (data.eventImage || '')
            if (!imageUrl) return ''
            return `
              <div class="field-${field.id}" style="
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: ${w}px;
                height: ${h}px;
              ">
                <img src="${imageUrl}" alt="${field.label}" style="width: 100%; height: 100%; object-fit: contain;" />
              </div>
            `
            
          case 'line':
            return `
              <div class="field-${field.id}" style="
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: ${w}px;
                height: ${h}px;
                border-top: ${field.style.borderWidth || 1}px solid ${field.style.borderColor || '#000000'};
              "></div>
            `
            
          case 'rectangle':
            return `
              <div class="field-${field.id}" style="
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: ${w}px;
                height: ${h}px;
                border: ${field.style.borderWidth || 1}px solid ${field.style.borderColor || '#000000'};
                background-color: ${field.style.backgroundColor || 'transparent'};
              "></div>
            `
            
          default:
            return ''
        }
      })
      .join('\n')
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ticket ${data.ticketNumber}</title>
        <style>
          @media print {
            @page {
              size: ${measurements.width}mm ${measurements.height}mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }
          body {
            margin: 0;
            padding: 0;
            width: ${widthPx}px;
            height: ${heightPx}px;
            position: relative;
            font-family: Arial, sans-serif;
            background: white;
          }
        </style>
      </head>
      <body>
        ${fieldStyles}
      </body>
      </html>
    `
  }

  // Obtener contenido de un campo
  private getFieldContent(field: any, data: TicketData): string {
    if (field.content) {
      // Reemplazar variables en el contenido
      return field.content
        .replace(/\{\{eventName\}\}/g, data.eventName)
        .replace(/\{\{ticketNumber\}\}/g, data.ticketNumber)
        .replace(/\{\{customerName\}\}/g, data.customerName)
        .replace(/\{\{price\}\}/g, data.price.toLocaleString('es-CO', { style: 'currency', currency: 'COP' }))
        .replace(/\{\{eventDate\}\}/g, data.eventDate)
        .replace(/\{\{eventTime\}\}/g, data.eventTime)
        .replace(/\{\{eventLocation\}\}/g, data.eventLocation)
    }
    
    if (field.dataField && data[field.dataField as keyof TicketData]) {
      const value = data[field.dataField as keyof TicketData]
      
      // Formatear según el tipo de campo
      if (field.dataField === 'price') {
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0,
        }).format(Number(value))
      }
      
      return String(value || '')
    }
    
    return field.label || ''
  }

  // Validar plantilla
  validateTemplate(template: TicketTemplate): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (!template.name || template.name.trim() === '') {
      errors.push('El nombre de la plantilla es requerido')
    }
    
    if (!template.measurements) {
      errors.push('Las medidas son requeridas')
    } else {
      if (template.measurements.width <= 0) {
        errors.push('El ancho debe ser mayor a 0')
      }
      if (template.measurements.height <= 0) {
        errors.push('El alto debe ser mayor a 0')
      }
    }
    
    if (!template.fields || template.fields.length === 0) {
      errors.push('La plantilla debe tener al menos un campo')
    }
    
    // Validar que los campos no se salgan de los límites
    template.fields?.forEach((field, index) => {
      if (field.position.x + field.size.width > template.measurements.width) {
        errors.push(`El campo "${field.label}" se sale del ancho del boleto`)
      }
      if (field.position.y + field.size.height > template.measurements.height) {
        errors.push(`El campo "${field.label}" se sale del alto del boleto`)
      }
    })
    
    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

export const ticketTemplateService = new TicketTemplateService()

