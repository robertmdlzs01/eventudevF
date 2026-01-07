// Sistema de plantillas de boletos físicos
// Permite crear plantillas personalizables con medidas configurables

export interface TicketMeasurements {
  // Medidas del boleto
  width: number // Ancho en mm
  height: number // Alto en mm
  unit: 'mm' | 'cm' | 'inch' // Unidad de medida
  
  // Márgenes
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number
  
  // Espaciado
  padding: number
  spacing: number // Espaciado entre elementos
}

export interface TicketField {
  id: string
  type: 'text' | 'image' | 'qr' | 'barcode' | 'line' | 'rectangle' | 'logo'
  label: string
  dataField?: string // Campo de datos a mostrar (eventName, customerName, etc.)
  position: {
    x: number // Posición X en mm
    y: number // Posición Y en mm
  }
  size: {
    width: number
    height: number
  }
  style: {
    fontSize?: number
    fontFamily?: string
    fontWeight?: 'normal' | 'bold' | 'italic'
    color?: string
    textAlign?: 'left' | 'center' | 'right'
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
  }
  content?: string // Contenido estático o template
  visible: boolean
}

export interface TicketTemplate {
  id: string
  name: string
  description?: string
  clientId?: string // ID del cliente (opcional, para plantillas personalizadas)
  eventId?: string // ID del evento (opcional, para plantillas específicas)
  
  // Configuración de medidas
  measurements: TicketMeasurements
  
  // Campos del boleto
  fields: TicketField[]
  
  // Configuración de impresión
  printConfig: {
    paperSize: 'A4' | 'A5' | 'thermal' | 'custom'
    orientation: 'portrait' | 'landscape'
    copies: number
    printerName?: string
  }
  
  // Metadata
  createdAt: string
  updatedAt: string
  createdBy: string
  isDefault: boolean
  isActive: boolean
}

export interface TicketData {
  // Datos del evento
  eventName: string
  eventDate: string
  eventTime: string
  eventLocation: string
  eventVenue?: string
  
  // Datos del boleto
  ticketNumber: string
  ticketId: string
  ticketType: string
  price: number
  
  // Datos del cliente
  customerName: string
  customerEmail: string
  
  // Datos adicionales
  seatNumber?: string
  gate?: string
  section?: string
  row?: string
  
  // Códigos
  qrCode: string
  barcode?: string
  
  // Imágenes
  logo?: string
  eventImage?: string
  
  // Metadata
  purchaseDate: string
  purchaseId: string
}

// Campos de datos disponibles para usar en plantillas
export const AVAILABLE_DATA_FIELDS = {
  // Evento
  eventName: 'Nombre del Evento',
  eventDate: 'Fecha del Evento',
  eventTime: 'Hora del Evento',
  eventLocation: 'Ubicación del Evento',
  eventVenue: 'Lugar del Evento',
  
  // Boleto
  ticketNumber: 'Número de Boleto',
  ticketId: 'ID del Boleto',
  ticketType: 'Tipo de Boleto',
  price: 'Precio',
  
  // Cliente
  customerName: 'Nombre del Cliente',
  customerEmail: 'Email del Cliente',
  
  // Asientos
  seatNumber: 'Número de Asiento',
  gate: 'Puerta',
  section: 'Sección',
  row: 'Fila',
  
  // Metadata
  purchaseDate: 'Fecha de Compra',
  purchaseId: 'ID de Compra',
  
  // Códigos
  qrCode: 'Código QR',
  barcode: 'Código de Barras',
  
  // Imágenes
  logo: 'Logo',
  eventImage: 'Imagen del Evento',
} as const

export type DataFieldKey = keyof typeof AVAILABLE_DATA_FIELDS

// Plantilla por defecto
export const DEFAULT_TEMPLATE: TicketTemplate = {
  id: 'default',
  name: 'Plantilla Por Defecto',
  description: 'Plantilla estándar para boletos físicos',
  measurements: {
    width: 80, // 80mm (tamaño estándar de ticket)
    height: 200, // 200mm
    unit: 'mm',
    marginTop: 5,
    marginBottom: 5,
    marginLeft: 5,
    marginRight: 5,
    padding: 5,
    spacing: 3,
  },
  fields: [
    {
      id: 'logo',
      type: 'logo',
      label: 'Logo',
      position: { x: 10, y: 10 },
      size: { width: 60, height: 20 },
      style: {},
      visible: true,
    },
    {
      id: 'eventName',
      type: 'text',
      label: 'Nombre del Evento',
      dataField: 'eventName',
      position: { x: 10, y: 35 },
      size: { width: 70, height: 10 },
      style: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#000000',
      },
      visible: true,
    },
    {
      id: 'ticketNumber',
      type: 'text',
      label: 'Número de Boleto',
      dataField: 'ticketNumber',
      position: { x: 10, y: 50 },
      size: { width: 70, height: 8 },
      style: {
        fontSize: 10,
        textAlign: 'center',
        color: '#666666',
      },
      visible: true,
    },
    {
      id: 'line1',
      type: 'line',
      label: 'Línea Separadora',
      position: { x: 5, y: 60 },
      size: { width: 70, height: 1 },
      style: {
        borderColor: '#000000',
        borderWidth: 1,
      },
      visible: true,
    },
    {
      id: 'customerName',
      type: 'text',
      label: 'Cliente',
      dataField: 'customerName',
      position: { x: 10, y: 70 },
      size: { width: 70, height: 8 },
      style: {
        fontSize: 10,
        textAlign: 'left',
        color: '#000000',
      },
      visible: true,
    },
    {
      id: 'eventDate',
      type: 'text',
      label: 'Fecha',
      dataField: 'eventDate',
      position: { x: 10, y: 85 },
      size: { width: 35, height: 8 },
      style: {
        fontSize: 9,
        textAlign: 'left',
        color: '#000000',
      },
      visible: true,
    },
    {
      id: 'eventTime',
      type: 'text',
      label: 'Hora',
      dataField: 'eventTime',
      position: { x: 45, y: 85 },
      size: { width: 35, height: 8 },
      style: {
        fontSize: 9,
        textAlign: 'left',
        color: '#000000',
      },
      visible: true,
    },
    {
      id: 'eventLocation',
      type: 'text',
      label: 'Ubicación',
      dataField: 'eventLocation',
      position: { x: 10, y: 100 },
      size: { width: 70, height: 8 },
      style: {
        fontSize: 9,
        textAlign: 'left',
        color: '#000000',
      },
      visible: true,
    },
    {
      id: 'price',
      type: 'text',
      label: 'Precio',
      dataField: 'price',
      position: { x: 10, y: 115 },
      size: { width: 70, height: 8 },
      style: {
        fontSize: 11,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#000000',
      },
      visible: true,
    },
    {
      id: 'qrCode',
      type: 'qr',
      label: 'Código QR',
      dataField: 'qrCode',
      position: { x: 20, y: 130 },
      size: { width: 40, height: 40 },
      style: {},
      visible: true,
    },
    {
      id: 'footer',
      type: 'text',
      label: 'Pie de Página',
      content: 'Eventu - Sistema de Tickets',
      position: { x: 10, y: 180 },
      size: { width: 70, height: 8 },
      style: {
        fontSize: 8,
        textAlign: 'center',
        color: '#666666',
      },
      visible: true,
    },
  ],
  printConfig: {
    paperSize: 'thermal',
    orientation: 'portrait',
    copies: 1,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'system',
  isDefault: true,
  isActive: true,
}

// Tamaños predefinidos de boletos
export const PREDEFINED_SIZES = {
  thermal: {
    name: 'Térmico Estándar',
    width: 80,
    height: 200,
    unit: 'mm' as const,
  },
  thermal_wide: {
    name: 'Térmico Ancho',
    width: 110,
    height: 200,
    unit: 'mm' as const,
  },
  a4_portrait: {
    name: 'A4 Vertical',
    width: 210,
    height: 297,
    unit: 'mm' as const,
  },
  a4_landscape: {
    name: 'A4 Horizontal',
    width: 297,
    height: 210,
    unit: 'mm' as const,
  },
  a5_portrait: {
    name: 'A5 Vertical',
    width: 148,
    height: 210,
    unit: 'mm' as const,
  },
  custom: {
    name: 'Personalizado',
    width: 80,
    height: 200,
    unit: 'mm' as const,
  },
} as const


