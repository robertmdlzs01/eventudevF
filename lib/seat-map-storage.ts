export interface SeatMapData {
  id: string
  name: string
  eventId: string
  sections: SeatSection[]
  metadata: {
    capacity: number
    createdAt: Date
    updatedAt: Date
    isPublished: boolean
  }
}

export interface SeatSection {
  id: string
  name: string
  type: "seats" | "boxes" | "tables" | "general"
  position: { x: number; y: number }
  dimensions: { width: number; height: number }
  capacity: number
  price: number
  color: string
  seats: Seat[]
  isSelected: boolean
  officialNotes?: string // Added for official notes
}

export interface Seat {
  id: string
  row: string
  number: string
  position: { x: number; y: number }
  status: "available" | "reserved" | "occupied"
  price: number
  sectionId: string
  type: "regular" | "vip" | "table-unit" // Added seat types
}

export interface SavedTemplate {
  id: string
  name: string
  description: string
  type: string // e.g., "custom", "theater", "arena"
  data: {
    sections: Omit<SeatSection, "isSelected">[] // Templates don't need isSelected
    metadata: {
      capacity: number
      createdAt: Date
      updatedAt: Date
      isPublished: boolean
    }
  }
  createdAt: Date
}

export class SeatMapStorage {
  private static readonly SEAT_MAPS_KEY = "eventu_seat_maps"
  private static readonly TEMPLATES_KEY = "eventu_seat_map_templates"

  constructor() {
    if (typeof window !== "undefined") {
      // Initialize storage if not present
      if (!localStorage.getItem(SeatMapStorage.SEAT_MAPS_KEY)) {
        localStorage.setItem(SeatMapStorage.SEAT_MAPS_KEY, JSON.stringify([]))
      }
      if (!localStorage.getItem(SeatMapStorage.TEMPLATES_KEY)) {
        localStorage.setItem(SeatMapStorage.TEMPLATES_KEY, JSON.stringify([]))
      }
    }
  }

  private getStorageItem<T>(key: string): T[] {
    if (typeof window === "undefined") return []
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : []
  }

  private setStorageItem<T>(key: string, value: T[]) {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(value))
    }
  }

  // Seat Maps
  getAllSeatMaps(): SeatMapData[] {
    return this.getStorageItem<SeatMapData>(SeatMapStorage.SEAT_MAPS_KEY).map((map) => ({
      ...map,
      metadata: {
        ...map.metadata,
        createdAt: new Date(map.metadata.createdAt),
        updatedAt: new Date(map.metadata.updatedAt),
      },
    }))
  }

  getSeatMap(id: string): SeatMapData | undefined {
    return this.getAllSeatMaps().find((map) => map.id === id)
  }

  saveSeatMap(seatMap: SeatMapData) {
    const maps = this.getAllSeatMaps()
    const existingIndex = maps.findIndex((m) => m.id === seatMap.id)
    if (existingIndex > -1) {
      maps[existingIndex] = {
        ...seatMap,
        metadata: { ...seatMap.metadata, updatedAt: new Date() },
      }
    } else {
      maps.push({
        ...seatMap,
        metadata: { ...seatMap.metadata, createdAt: new Date(), updatedAt: new Date() },
      })
    }
    this.setStorageItem(SeatMapStorage.SEAT_MAPS_KEY, maps)
  }

  deleteSeatMap(id: string) {
    const maps = this.getAllSeatMaps().filter((map) => map.id !== id)
    this.setStorageItem(SeatMapStorage.SEAT_MAPS_KEY, maps)
  }

  // Templates
  static getAllTemplates(): SavedTemplate[] {
    if (typeof window === "undefined") return []
    const item = localStorage.getItem(SeatMapStorage.TEMPLATES_KEY)
    return item
      ? JSON.parse(item).map((template: SavedTemplate) => ({
          ...template,
          createdAt: new Date(template.createdAt),
          data: {
            ...template.data,
            metadata: {
              ...template.data.metadata,
              createdAt: new Date(template.data.metadata.createdAt),
              updatedAt: new Date(template.data.metadata.updatedAt),
            },
          },
        }))
      : []
  }

  static getTemplate(id: string): SavedTemplate | undefined {
    return SeatMapStorage.getAllTemplates().find((template) => template.id === id)
  }

  saveTemplate(template: SavedTemplate) {
    const templates = SeatMapStorage.getAllTemplates()
    const existingIndex = templates.findIndex((t) => t.id === template.id)
    if (existingIndex > -1) {
      templates[existingIndex] = { ...template, createdAt: new Date() }
    } else {
      templates.push({ ...template, createdAt: new Date() })
    }
    this.setStorageItem(SeatMapStorage.TEMPLATES_KEY, templates)
  }

  deleteTemplate(id: string) {
    const templates = SeatMapStorage.getAllTemplates().filter((template) => template.id !== id)
    this.setStorageItem(SeatMapStorage.TEMPLATES_KEY, templates)
  }
}
