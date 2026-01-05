import { SeatMapTemplate } from './seat-map-types'

export const SEAT_MAP_TEMPLATES: SeatMapTemplate[] = [
  {
    id: 'theater-classic',
    name: 'Teatro Clásico',
    description: 'Teatro tradicional con asientos numerados en filas',
    category: 'theater',
    thumbnail: '/templates/theater-classic.png',
    popularity: 95,
    tags: ['teatro', 'clásico', 'numerado', 'filas'],
    config: {
      venue: {
        name: 'Teatro Clásico',
        address: '',
        capacity: 500,
        type: 'theater'
      },
      stage: {
        position: 'front',
        width: 800,
        height: 200,
        name: 'Escenario Principal'
      },
      pricing: {
        currency: 'COP',
        showPrices: true,
        allowDiscounts: true
      },
      features: {
        allowSeatSelection: true,
        allowGroupBooking: true,
        maxSeatsPerBooking: 10,
        reservationTimeout: 15,
        showSeatNumbers: true,
        showRowNumbers: true,
        allowZoom: true,
        allowPan: true
      }
    },
    sections: [
      {
        id: 'orchestra',
        name: 'Orquesta',
        type: 'seats',
        x: 100,
        y: 300,
        width: 600,
        height: 400,
        capacity: 200,
        price: 80000,
        color: '#3B82F6',
        rows: 10,
        seatsPerRow: 20,
        seats: [],
        category: 'vip',
        description: 'Asientos de orquesta con mejor vista',
        isPremium: true,
        amenities: ['Vista privilegiada', 'Acceso prioritario']
      },
      {
        id: 'mezzanine',
        name: 'Mezzanine',
        type: 'seats',
        x: 100,
        y: 100,
        width: 600,
        height: 200,
        capacity: 150,
        price: 60000,
        color: '#10B981',
        rows: 6,
        seatsPerRow: 25,
        seats: [],
        category: 'business',
        description: 'Segundo nivel con vista panorámica'
      },
      {
        id: 'balcony',
        name: 'Balcón',
        type: 'seats',
        x: 100,
        y: 50,
        width: 600,
        height: 150,
        capacity: 150,
        price: 40000,
        color: '#F59E0B',
        rows: 5,
        seatsPerRow: 30,
        seats: [],
        category: 'economy',
        description: 'Vista elevada del escenario'
      }
    ]
  },
  {
    id: 'arena-concert',
    name: 'Arena de Concierto',
    description: 'Arena circular para conciertos y eventos masivos',
    category: 'arena',
    thumbnail: '/templates/arena-concert.png',
    popularity: 88,
    tags: ['arena', 'concierto', 'circular', 'masivo'],
    config: {
      venue: {
        name: 'Arena de Concierto',
        address: '',
        capacity: 15000,
        type: 'arena'
      },
      stage: {
        position: 'center',
        width: 400,
        height: 400,
        name: 'Escenario Central'
      },
      pricing: {
        currency: 'COP',
        showPrices: true,
        allowDiscounts: true
      },
      features: {
        allowSeatSelection: true,
        allowGroupBooking: true,
        maxSeatsPerBooking: 8,
        reservationTimeout: 10,
        showSeatNumbers: true,
        showRowNumbers: true,
        allowZoom: true,
        allowPan: true
      }
    },
    sections: [
      {
        id: 'floor',
        name: 'Piso General',
        type: 'general',
        x: 200,
        y: 200,
        width: 800,
        height: 800,
        capacity: 5000,
        price: 120000,
        color: '#EF4444',
        rows: 0,
        seatsPerRow: 0,
        seats: [],
        category: 'vip',
        description: 'Área de piso general sin asientos asignados',
        isPremium: true,
        amenities: ['Vista cercana', 'Área de baile']
      },
      {
        id: 'vip-floor',
        name: 'VIP Piso',
        type: 'seats',
        x: 300,
        y: 300,
        width: 600,
        height: 600,
        capacity: 1000,
        price: 200000,
        color: '#8B5CF6',
        rows: 20,
        seatsPerRow: 50,
        seats: [],
        category: 'vip',
        description: 'Asientos VIP en el piso',
        isPremium: true,
        amenities: ['Asientos numerados', 'Servicio VIP', 'Catering']
      },
      {
        id: 'lower-bowl',
        name: 'Bowl Inferior',
        type: 'seats',
        x: 50,
        y: 50,
        width: 900,
        height: 900,
        capacity: 6000,
        price: 80000,
        color: '#3B82F6',
        rows: 30,
        seatsPerRow: 200,
        seats: [],
        category: 'business',
        description: 'Asientos en bowl inferior'
      },
      {
        id: 'upper-bowl',
        name: 'Bowl Superior',
        type: 'seats',
        x: 0,
        y: 0,
        width: 1000,
        height: 1000,
        capacity: 3000,
        price: 50000,
        color: '#10B981',
        rows: 20,
        seatsPerRow: 150,
        seats: [],
        category: 'economy',
        description: 'Asientos en bowl superior'
      }
    ]
  },
  {
    id: 'conference-hall',
    name: 'Sala de Conferencias',
    description: 'Sala para conferencias y presentaciones',
    category: 'conference',
    thumbnail: '/templates/conference-hall.png',
    popularity: 75,
    tags: ['conferencia', 'presentación', 'profesional'],
    config: {
      venue: {
        name: 'Sala de Conferencias',
        address: '',
        capacity: 300,
        type: 'conference'
      },
      stage: {
        position: 'front',
        width: 600,
        height: 150,
        name: 'Podium Principal'
      },
      pricing: {
        currency: 'COP',
        showPrices: true,
        allowDiscounts: false
      },
      features: {
        allowSeatSelection: true,
        allowGroupBooking: true,
        maxSeatsPerBooking: 20,
        reservationTimeout: 20,
        showSeatNumbers: true,
        showRowNumbers: true,
        allowZoom: true,
        allowPan: true
      }
    },
    sections: [
      {
        id: 'main-floor',
        name: 'Piso Principal',
        type: 'seats',
        x: 100,
        y: 200,
        width: 800,
        height: 400,
        capacity: 200,
        price: 50000,
        color: '#3B82F6',
        rows: 10,
        seatsPerRow: 20,
        seats: [],
        category: 'business',
        description: 'Asientos principales para conferencias'
      },
      {
        id: 'accessible-area',
        name: 'Área Accesible',
        type: 'accessible',
        x: 50,
        y: 200,
        width: 50,
        height: 400,
        capacity: 20,
        price: 50000,
        color: '#F59E0B',
        rows: 4,
        seatsPerRow: 5,
        seats: [],
        category: 'economy',
        description: 'Asientos para personas con discapacidad',
        hasWheelchairAccess: true,
        amenities: ['Acceso para sillas de ruedas', 'Espacio amplio']
      },
      {
        id: 'vip-front',
        name: 'VIP Frente',
        type: 'seats',
        x: 100,
        y: 150,
        width: 800,
        height: 50,
        capacity: 80,
        price: 80000,
        color: '#8B5CF6',
        rows: 2,
        seatsPerRow: 40,
        seats: [],
        category: 'vip',
        description: 'Asientos VIP en primera fila',
        isPremium: true,
        amenities: ['Vista privilegiada', 'Mesa de trabajo']
      }
    ]
  },
  {
    id: 'stadium-soccer',
    name: 'Estadio de Fútbol',
    description: 'Estadio para partidos de fútbol y eventos deportivos',
    category: 'stadium',
    thumbnail: '/templates/stadium-soccer.png',
    popularity: 92,
    tags: ['estadio', 'fútbol', 'deportes', 'gradas'],
    config: {
      venue: {
        name: 'Estadio de Fútbol',
        address: '',
        capacity: 45000,
        type: 'stadium'
      },
      stage: {
        position: 'center',
        width: 600,
        height: 400,
        name: 'Campo de Juego'
      },
      pricing: {
        currency: 'COP',
        showPrices: true,
        allowDiscounts: true
      },
      features: {
        allowSeatSelection: true,
        allowGroupBooking: true,
        maxSeatsPerBooking: 15,
        reservationTimeout: 12,
        showSeatNumbers: true,
        showRowNumbers: true,
        allowZoom: true,
        allowPan: true
      }
    },
    sections: [
      {
        id: 'north-stand',
        name: 'Tribuna Norte',
        type: 'seats',
        x: 100,
        y: 50,
        width: 800,
        height: 300,
        capacity: 12000,
        price: 30000,
        color: '#3B82F6',
        rows: 40,
        seatsPerRow: 300,
        seats: [],
        category: 'economy',
        description: 'Tribuna norte del estadio'
      },
      {
        id: 'south-stand',
        name: 'Tribuna Sur',
        type: 'seats',
        x: 100,
        y: 650,
        width: 800,
        height: 300,
        capacity: 12000,
        price: 30000,
        color: '#3B82F6',
        rows: 40,
        seatsPerRow: 300,
        seats: [],
        category: 'economy',
        description: 'Tribuna sur del estadio'
      },
      {
        id: 'east-stand',
        name: 'Tribuna Oriental',
        type: 'seats',
        x: 50,
        y: 100,
        width: 50,
        height: 800,
        capacity: 8000,
        price: 45000,
        color: '#10B981',
        rows: 50,
        seatsPerRow: 160,
        seats: [],
        category: 'business',
        description: 'Tribuna oriental con mejor vista'
      },
      {
        id: 'west-stand',
        name: 'Tribuna Occidental',
        type: 'seats',
        x: 900,
        y: 100,
        width: 50,
        height: 800,
        capacity: 8000,
        price: 45000,
        color: '#10B981',
        rows: 50,
        seatsPerRow: 160,
        seats: [],
        category: 'business',
        description: 'Tribuna occidental con mejor vista'
      },
      {
        id: 'vip-boxes',
        name: 'Palcos VIP',
        type: 'boxes',
        x: 200,
        y: 200,
        width: 600,
        height: 400,
        capacity: 500,
        price: 150000,
        color: '#8B5CF6',
        rows: 10,
        seatsPerRow: 50,
        seats: [],
        category: 'vip',
        description: 'Palcos VIP con servicios exclusivos',
        isPremium: true,
        amenities: ['Servicio de catering', 'Área privada', 'Vista privilegiada']
      }
    ]
  }
]

export function getTemplateById(id: string): SeatMapTemplate | undefined {
  return SEAT_MAP_TEMPLATES.find(template => template.id === id)
}

export function getTemplatesByCategory(category: string): SeatMapTemplate[] {
  return SEAT_MAP_TEMPLATES.filter(template => template.category === category)
}

export function getPopularTemplates(limit: number = 4): SeatMapTemplate[] {
  return SEAT_MAP_TEMPLATES
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit)
}

export function searchTemplates(query: string): SeatMapTemplate[] {
  const lowercaseQuery = query.toLowerCase()
  return SEAT_MAP_TEMPLATES.filter(template => 
    template.name.toLowerCase().includes(lowercaseQuery) ||
    template.description.toLowerCase().includes(lowercaseQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  )
}
