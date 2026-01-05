// Datos mock temporales para el build de Netlify
// En producción, estos datos vendrán del backend

export interface EventData {
  id: string
  title: string
  slug: string
  description: string
  longDescription?: string
  long_description?: string // Alias para compatibilidad
  date: string
  startDate?: string
  time: string
  venue: string
  location: string
  category: {
    id: string
    name: string
  }
  organizer: {
    id: string
    name: string
  }
  totalCapacity: number
  total_capacity: number // Alias para compatibilidad
  capacity: number // Alias para compatibilidad
  sold: number
  soldTickets: number // Alias para compatibilidad
  price: number
  status: "cancelled" | "active" | "inactive"
  featured: boolean
  imageUrl?: string
  image_url?: string // Alias para compatibilidad
  image: string // Alias para compatibilidad
  youtubeUrl?: string
  video_url?: string // Alias para compatibilidad
  gallery_images?: string[]
  tags: string[]
  rating: number
  locationDisplay: string
  categoryDisplay: string
  ticketTypes?: any[] // Para compatibilidad con el componente
  seatMapId?: string // Para compatibilidad con el componente
  maxSeatsPerPurchase?: number // Máximo de asientos por compra
  organizerName?: string // Para compatibilidad con el componente
  organizerId?: string // Para compatibilidad con el componente
  ageRestriction?: string
  alcoholSales?: boolean
  pregnantWomen?: boolean
  disabledAccess?: boolean
  accommodationType?: string
  pulepCode?: string
  externalFood?: boolean
  parking?: boolean
}

// Función para obtener eventos reales de la base de datos
export async function getRealEvents(): Promise<EventData[]> {
  try {
    const response = await fetch('/api/events', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener eventos');
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data.map((event: any) => ({
        id: event.id.toString(),
        title: event.title,
        slug: event.slug,
        description: event.description,
        longDescription: event.description,
        date: event.date,
        startDate: event.date,
        time: event.time,
        venue: event.venue,
        location: event.location,
        category: {
          id: event.category_id?.toString() || "1",
          name: event.category_name || "General"
        },
        organizer: {
          id: event.organizer_id?.toString() || "1",
          name: event.organizer_name || "Organizador"
        },
        totalCapacity: event.total_capacity,
        total_capacity: event.total_capacity,
        capacity: event.total_capacity,
        sold: event.sold || 0,
        soldTickets: event.sold || 0,
        price: event.price,
        status: event.status,
        featured: event.featured || false,
        imageUrl: event.image_url || "/placeholder.jpg",
        image: event.image_url || "/placeholder.jpg",
        tags: event.tags || [],
        rating: event.rating || 4.0,
        locationDisplay: event.location,
        categoryDisplay: event.category_name || "General"
      }));
    }

    return [];
  } catch (error) {
    console.error('Error obteniendo eventos reales:', error);
    return [];
  }
}

// Datos mock de eventos (fallback)
const mockEvents: EventData[] = [
  {
    id: "1",
    title: "Rock en la Noche 2025",
    slug: "rock-en-la-noche-2025",
    description: "Festival internacional de rock con las mejores bandas del mundo",
    longDescription: "Un festival épico que reúne a las mejores bandas de rock internacionales en un evento único.",
    date: "2025-06-15",
    startDate: "2025-06-15",
    time: "20:00",
    venue: "Autódromo Hermanos Rodríguez",
    location: "Ciudad de México, México",
    category: {
      id: "1",
      name: "Música"
    },
    organizer: {
      id: "1",
      name: "María González"
    },
    totalCapacity: 50000,
    total_capacity: 50000,
    capacity: 50000,
    sold: 25000,
    soldTickets: 25000,
    price: 1500,
    status: "active",
    featured: true,
    imageUrl: "/placeholder.jpg",
    image: "/placeholder.jpg",
    tags: ["rock", "música", "festival"],
    rating: 4.8,
    locationDisplay: "Ciudad de México, México",
    categoryDisplay: "Música"
  },
  {
    id: "2",
    title: "Tech Summit México 2025",
    slug: "tech-summit-mexico-2025",
    description: "Conferencia de tecnología más importante de México",
    longDescription: "Únete a los líderes de la industria tecnológica en esta conferencia única.",
    date: "2025-07-20",
    startDate: "2025-07-20",
    time: "09:00",
    venue: "Cintermex",
    location: "Monterrey, México",
    category: {
      id: "2",
      name: "Tecnología"
    },
    organizer: {
      id: "2",
      name: "Carlos Rodríguez"
    },
    totalCapacity: 2000,
    total_capacity: 2000,
    capacity: 2000,
    sold: 800,
    soldTickets: 800,
    price: 2500,
    status: "active",
    featured: true,
    imageUrl: "/placeholder.jpg",
    image: "/placeholder.jpg",
    tags: ["tecnología", "conferencia", "innovación"],
    rating: 4.5,
    locationDisplay: "Monterrey, México",
    categoryDisplay: "Tecnología"
  },
  {
    id: "3",
    title: "Clásico Nacional 2025",
    slug: "clasico-nacional-2025",
    description: "América vs Chivas - El clásico más esperado",
    longDescription: "No te pierdas el clásico más importante del fútbol mexicano.",
    date: "2025-08-10",
    startDate: "2025-08-10",
    time: "19:00",
    venue: "Estadio Azteca",
    location: "Ciudad de México, México",
    category: {
      id: "3",
      name: "Deportes"
    },
    organizer: {
      id: "3",
      name: "Ana Martínez"
    },
    totalCapacity: 87000,
    total_capacity: 87000,
    capacity: 87000,
    sold: 45000,
    soldTickets: 45000,
    price: 800,
    status: "active",
    featured: false,
    imageUrl: "/placeholder.jpg",
    image: "/placeholder.jpg",
    tags: ["fútbol", "deportes", "clásico"],
    rating: 4.9,
    locationDisplay: "Ciudad de México, México",
    categoryDisplay: "Deportes"
  }
]

export async function getAllEvents(): Promise<EventData[]> {
  try {
    // Llamada al backend
    const response = await fetch('http://localhost:3002/api/events', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch events')
    }
    
    const result = await response.json()
    if (result.success && result.data) {
      // Mapear los datos del backend al formato esperado
      return result.data.map((backendEvent: any) => ({
        id: backendEvent.id.toString(),
        title: backendEvent.title,
        slug: backendEvent.slug,
        description: backendEvent.description || "",
        date: backendEvent.date,
        startDate: backendEvent.date,
        endDate: backendEvent.date,
        time: backendEvent.time || "",
        location: backendEvent.location,
        locationDisplay: backendEvent.location,
        category: {
          id: "1",
          name: typeof backendEvent.category === 'object' ? backendEvent.category.name : backendEvent.category || "General"
        },
        categoryDisplay: typeof backendEvent.category === 'object' ? backendEvent.category.name : backendEvent.category || "General",
        organizer: {
          id: backendEvent.organizer_id?.toString() || "0",
          name: backendEvent.organizer_name || "Organizador"
        },
        totalCapacity: backendEvent.total_capacity || 0,
        total_capacity: backendEvent.total_capacity || 0,
        capacity: backendEvent.total_capacity || 0,
        sold: backendEvent.sold || 0,
        soldTickets: backendEvent.sold || 0,
        price: parseFloat(backendEvent.price) || 0,
        status: backendEvent.status === "published" ? "active" : "inactive",
        featured: backendEvent.featured || false,
        image_url: backendEvent.image_url,
        imageUrl: backendEvent.image_url,
        image: backendEvent.image_url || "/placeholder.svg",
        youtubeUrl: backendEvent.youtube_url,
        video_url: backendEvent.video_url,
        gallery_images: backendEvent.gallery_images || [],
        tags: [],
        rating: 0,
        venue: backendEvent.location,
        organizerName: backendEvent.organizer_name || "Organizador",
        organizerId: backendEvent.organizer_id?.toString() || "0"
      }))
    }
    return mockEvents
  } catch (error) {
    console.warn('Failed to fetch events from API, using mock data:', error)
    return mockEvents
  }
}

export async function getFeaturedEvents(): Promise<EventData[]> {
  try {
    // Llamada a la API de Vercel
    const response = await fetch('/api/events?featured=true', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch featured events')
    }
    
    const result = await response.json()
    return result.success ? result.data : mockEvents.filter(event => event.featured)
  } catch (error) {
    console.warn('Failed to fetch featured events from API, using mock data:', error)
    return mockEvents.filter(event => event.featured)
  }
}

export async function getEventBySlug(slug: string): Promise<EventData | null> {
  // En producción, esto haría una llamada al API
  // Por ahora buscamos en los datos mock
  const event = mockEvents.find(event => event.slug === slug)
  return event || null
}

export async function getEventBySlugOriginal(slug: string): Promise<EventData | null> {
  try {
    // Primero intentar obtener del backend
    const response = await fetch(`http://localhost:3002/api/events?slug=${slug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.data && data.data.length > 0) {
        const backendEvent = data.data[0]
        
        // Transformar los datos del backend al formato esperado por EventData
        const transformedEvent: EventData = {
          id: backendEvent.id.toString(),
          title: backendEvent.title,
          slug: backendEvent.slug,
          description: backendEvent.description,
          longDescription: backendEvent.long_description,
          long_description: backendEvent.long_description,
          date: backendEvent.date,
          startDate: backendEvent.date,
          time: backendEvent.time,
          venue: backendEvent.venue || '',
          location: backendEvent.location,
          category: {
            id: backendEvent.category_id?.toString() || '1',
            name: 'Categoría' // Por ahora usar un nombre genérico
          },
          organizer: {
            id: backendEvent.organizer_id?.toString() || '1',
            name: 'Organizador' // Por ahora usar un nombre genérico
          },
          totalCapacity: backendEvent.total_capacity || 0,
          total_capacity: backendEvent.total_capacity || 0,
          capacity: backendEvent.total_capacity || 0,
          sold: 0, // Por ahora 0, se puede calcular después
          soldTickets: 0,
          price: parseFloat(backendEvent.price) || 0,
          status: backendEvent.status === 'published' ? 'active' : 'inactive',
          featured: backendEvent.featured || false,
          imageUrl: backendEvent.image_url ? `http://localhost:3002${backendEvent.image_url}` : undefined,
          image_url: backendEvent.image_url ? `http://localhost:3002${backendEvent.image_url}` : undefined,
          image: backendEvent.image_url ? `http://localhost:3002${backendEvent.image_url}` : '/placeholder.jpg',
          youtubeUrl: backendEvent.youtube_url,
          video_url: backendEvent.video_url,
          gallery_images: backendEvent.gallery_images || [],
          tags: [], // Por ahora vacío
          rating: 4.5, // Por ahora un valor por defecto
          locationDisplay: backendEvent.location,
          categoryDisplay: 'Categoría', // Por ahora genérico
          ticketTypes: [], // Por ahora vacío
          seatMapId: backendEvent.seat_map_id?.toString(),
          maxSeatsPerPurchase: backendEvent.max_seats_per_purchase || 4,
          organizerName: 'Organizador',
          organizerId: backendEvent.organizer_id?.toString() || '1',
          ageRestriction: 'Todas las edades',
          alcoholSales: false,
          pregnantWomen: true,
          disabledAccess: true,
          accommodationType: 'No incluido',
          pulepCode: '',
          externalFood: false,
          parking: false
        }
        
        return transformedEvent
      }
    }
  } catch (error) {
    console.error('Error fetching event from backend:', error)
  }

  // Si falla el backend, usar datos mock como fallback
  return getEventBySlug(slug)
}
