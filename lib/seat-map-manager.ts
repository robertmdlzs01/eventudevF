import { SeatMapStorage, type SeatMapData, type SeatSection, type Seat, type SavedTemplate } from "./seat-map-storage"

export class SeatMapManager {
  private eventId: string
  private sections: SeatSection[] = []
  private hasUnsavedChanges = false
  private storage: SeatMapStorage

  constructor(eventId: string) {
    this.eventId = eventId
    this.storage = new SeatMapStorage()
    this.loadFromStorage()
  }

  private loadFromStorage() {
    const saved = this.storage.getSeatMap(this.eventId)
    if (saved) {
      this.sections = saved.sections
    }
  }

  getSections(): SeatSection[] {
    return [...this.sections]
  }

  createSection(config: {
    name: string
    type: "seats" | "boxes" | "tables" | "general"
    x: number
    y: number
    width?: number
    height?: number
    capacity: number
    price: number
    color: string
    rows?: number
    seatsPerRow?: number
    officialNotes?: string
  }): SeatSection {
    const section: SeatSection = {
      id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: config.name,
      type: config.type,
      position: { x: config.x, y: config.y },
      dimensions: { width: config.width || 0, height: config.height || 0 },
      capacity: config.capacity,
      price: config.price,
      color: config.color,
      seats: [],
      isSelected: false,
      officialNotes: config.officialNotes || "",
    }

    // Generate seats and calculate dimensions if not provided
    if (!config.width || !config.height) {
      this.generateSeats(section, config.rows || 5, config.seatsPerRow || 10)
    } else {
      // Use provided dimensions and auto-calculate seat arrangement
      const seatSize = 16
      const seatSpacing = 8
      const maxSeatsPerRow = Math.floor(config.width / (seatSize + seatSpacing))
      const maxRows = Math.floor(config.height / (seatSize + seatSpacing))

      section.dimensions.width = config.width
      section.dimensions.height = config.height

      this.generateSeats(
        section,
        Math.min(maxRows, config.rows || 5),
        Math.min(maxSeatsPerRow, config.seatsPerRow || 10),
      )
    }

    this.sections.push(section)
    this.hasUnsavedChanges = true
    this.autoSave()

    return section
  }

  private generateSeats(section: SeatSection, rows: number, seatsPerRow: number) {
    const seats: Seat[] = []
    const seatSize = 16 // Increased base size for better visibility
    const seatSpacing = 8 // Reduced spacing for tighter layout
    const rowSpacing = 24 // Spacing between rows
    const tableUnitSize = 32 // Size for table unit
    const tableUnitSpacing = 40 // Spacing between table units

    if (section.type === "general") {
      // General area does not have individual seats, just set default dimensions
      section.dimensions.width = 200
      section.dimensions.height = 100
      return
    }

    let maxWidth = 0
    let totalHeight = 0

    for (let row = 0; row < rows; row++) {
      const rowLetter = String.fromCharCode(65 + row) // A, B, C, etc.
      let rowWidth = 0

      for (let itemNum = 1; itemNum <= seatsPerRow; itemNum++) {
        let seat: Seat
        let currentX, currentY

        if (section.type === "seats") {
          currentX = section.position.x + (itemNum - 1) * (seatSize + seatSpacing)
          currentY = section.position.y + row * (seatSize + rowSpacing)
          rowWidth = seatsPerRow * (seatSize + seatSpacing) - seatSpacing

          seat = {
            id: `${section.id}_${rowLetter}${itemNum}`,
            row: rowLetter,
            number: itemNum.toString(),
            position: { x: currentX, y: currentY },
            status: "available",
            price: section.price,
            sectionId: section.id,
            type: "regular",
          }
        } else if (section.type === "boxes") {
          currentX = section.position.x + (itemNum - 1) * (seatSize * 1.5 + seatSpacing)
          currentY = section.position.y + row * (seatSize * 1.5 + rowSpacing)
          rowWidth = seatsPerRow * (seatSize * 1.5 + seatSpacing) - seatSpacing

          seat = {
            id: `${section.id}_${rowLetter}B${itemNum}`,
            row: rowLetter,
            number: `B${itemNum}`,
            position: { x: currentX, y: currentY },
            status: "available",
            price: section.price,
            sectionId: section.id,
            type: "vip",
          }
        } else if (section.type === "tables") {
          currentX = section.position.x + (itemNum - 1) * tableUnitSpacing
          currentY = section.position.y + row * tableUnitSpacing
          rowWidth = seatsPerRow * tableUnitSpacing - (tableUnitSpacing - tableUnitSize)

          seat = {
            id: `${section.id}_${rowLetter}T${itemNum}`,
            row: rowLetter,
            number: `T${itemNum}`,
            position: { x: currentX, y: currentY },
            status: "available",
            price: section.price,
            sectionId: section.id,
            type: "table-unit",
          }
        } else {
          continue
        }
        seats.push(seat)
      }

      maxWidth = Math.max(maxWidth, rowWidth)
    }

    // Calculate total height based on rows
    if (section.type === "tables") {
      totalHeight = rows * tableUnitSpacing - (tableUnitSpacing - tableUnitSize)
    } else {
      totalHeight = rows * (seatSize + rowSpacing) - rowSpacing
    }

    // Set dynamic dimensions
    section.dimensions.width = maxWidth
    section.dimensions.height = totalHeight
    section.seats = seats
  }

  selectSection(sectionId: string) {
    this.sections.forEach((section) => {
      section.isSelected = section.id === sectionId
    })
  }

  updateSectionPosition(sectionId: string, x: number, y: number) {
    const section = this.sections.find((s) => s.id === sectionId)
    if (section) {
      const deltaX = x - section.position.x
      const deltaY = y - section.position.y

      section.position.x = x
      section.position.y = y

      // Update seat positions relative to the section's new position
      section.seats.forEach((seat) => {
        seat.position.x += deltaX
        seat.position.y += deltaY
      })

      this.hasUnsavedChanges = true
      this.autoSave()
    }
  }

  updateSectionProperties(
    sectionId: string,
    updates: {
      name?: string
      capacity?: number
      price?: number
      color?: string
      officialNotes?: string
    },
  ) {
    const section = this.sections.find((s) => s.id === sectionId)
    if (section) {
      if (updates.name !== undefined) section.name = updates.name
      if (updates.capacity !== undefined) section.capacity = updates.capacity
      if (updates.color !== undefined) section.color = updates.color
      if (updates.officialNotes !== undefined) section.officialNotes = updates.officialNotes

      // Update price for both section and all its seats
      if (updates.price !== undefined) {
        section.price = updates.price
        section.seats.forEach((seat) => {
          seat.price = updates.price!
        })
      }

      this.hasUnsavedChanges = true
      this.autoSave()
    }
  }

  updateSectionNotes(sectionId: string, notes: string) {
    this.updateSectionProperties(sectionId, { officialNotes: notes })
  }

  removeSection(sectionId: string) {
    this.sections = this.sections.filter((s) => s.id !== sectionId)
    this.hasUnsavedChanges = true
    this.autoSave()
  }

  // Alias para deleteSection para mantener compatibilidad
  deleteSection(sectionId: string) {
    this.removeSection(sectionId)
  }

  // Método para eliminar un asiento individual
  deleteSeat(sectionId: string, seatId: string) {
    const section = this.sections.find((s) => s.id === sectionId)
    if (section) {
      section.seats = section.seats.filter((seat) => seat.id !== seatId)
      // Recalcular la capacidad de la sección
      section.capacity = section.seats.length
      this.hasUnsavedChanges = true
      this.autoSave()
    }
  }

  clear() {
    this.sections = []
    this.hasUnsavedChanges = true
    this.autoSave()
  }

  hasChanges(): boolean {
    return this.hasUnsavedChanges
  }

  getTotalCapacity(): number {
    return this.sections.reduce((total, section) => total + section.capacity, 0)
  }

  getAveragePrice(): number {
    if (this.sections.length === 0) return 0
    const totalPrice = this.sections.reduce((total, section) => total + section.price, 0)
    return totalPrice / this.sections.length
  }

  async save(name?: string): Promise<void> {
    const seatMapData: SeatMapData = {
      id: this.eventId,
      name: name || `Mapa ${new Date().toLocaleDateString()}`,
      eventId: this.eventId,
      sections: this.sections,
      metadata: {
        capacity: this.getTotalCapacity(),
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublished: false,
      },
    }

    this.storage.saveSeatMap(seatMapData)
    this.hasUnsavedChanges = false
  }

  async load(mapId: string): Promise<void> {
    const seatMap = this.storage.getSeatMap(mapId)
    if (seatMap) {
      this.sections = seatMap.sections
      this.hasUnsavedChanges = false
    } else {
      this.sections = []
      this.hasUnsavedChanges = false
      throw new Error(`Seat map with ID ${mapId} not found.`)
    }
  }

  async getSavedMaps(): Promise<SeatMapData[]> {
    return this.storage.getAllSeatMaps().filter((map) => map.eventId === this.eventId)
  }

  async delete(mapId: string): Promise<void> {
    this.storage.deleteSeatMap(mapId)
  }

  async saveAsTemplate(name: string, description: string, category: string): Promise<void> {
    const template: SavedTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      type: category,
      data: {
        sections: this.sections,
        metadata: {
          capacity: this.getTotalCapacity(),
          createdAt: new Date(),
          updatedAt: new Date(),
          isPublished: false,
        },
      },
      createdAt: new Date(),
    }

    this.storage.saveTemplate(template)
  }

  async loadFromTemplate(templateId: string): Promise<void> {
    const template = SeatMapStorage.getTemplate(templateId)
    if (template) {
      this.sections = template.data.sections.map((section) => ({
        ...section,
        id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        isSelected: false,
        seats: section.seats.map((seat) => ({
          ...seat,
          id: `${section.id}_${seat.row}${seat.number}_${Math.random().toString(36).substr(2, 4)}`,
          sectionId: section.id,
        })),
      }))
      this.hasUnsavedChanges = true
    }
  }

  export(): string {
    const exportData = {
      eventId: this.eventId,
      sections: this.sections,
      metadata: {
        capacity: this.getTotalCapacity(),
        exportedAt: new Date(),
        version: "1.0",
      },
    }
    return JSON.stringify(exportData, null, 2)
  }

  async import(jsonData: string): Promise<void> {
    try {
      const importData = JSON.parse(jsonData)
      if (importData.sections && Array.isArray(importData.sections)) {
        this.sections = importData.sections
        this.hasUnsavedChanges = true
        this.autoSave()
      } else {
        throw new Error("Formato de datos inválido")
      }
    } catch (error) {
      throw new Error("Error al importar datos: " + (error as Error).message)
    }
  }

  async publish(): Promise<void> {
    await this.save()
    const seatMap = this.storage.getSeatMap(this.eventId)
    if (seatMap) {
      seatMap.metadata.isPublished = true
      this.storage.saveSeatMap(seatMap)
    }
  }

  async unpublish(): Promise<void> {
    const seatMap = this.storage.getSeatMap(this.eventId)
    if (seatMap) {
      seatMap.metadata.isPublished = false
      this.storage.saveSeatMap(seatMap)
    }
  }

  private autoSave() {
    setTimeout(() => {
      if (this.hasUnsavedChanges) {
        this.save()
      }
    }, 30000)
  }

  destroy() {
    this.sections = []
    this.hasUnsavedChanges = false
  }
}
