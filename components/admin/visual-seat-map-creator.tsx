"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { 
  Plus, 
  Minus, 
  MousePointer, 
  Theater, 
  Square, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  AlignLeft, 
  Grid3X3, 
  Copy, 
  Trash2, 
  Save, 
  Undo, 
  Redo, 
  Eye, 
  Sun, 
  Settings, 
  Info, 
  Users, 
  Star, 
  DollarSign,
  Edit3
} from 'lucide-react'

interface Seat {
  id: string
  x: number
  y: number
  section: string
  row: string
  number: string
  price: number
  type: string
  isWheelchairAccessible: boolean
  isHearingImpaired: boolean
  isRestrictedView: boolean
  hasExtraLegroom: boolean
  customPrice: boolean
  label: string
  displayLabel: string
  entrance?: string
  isWindowSeat?: boolean
  hasLiftUpArmrests?: boolean
}

interface Section {
  id: string
  name: string
  color: string
  price: number
  type: string
  capacity: number
  description: string
}

interface Stage {
  x: number
  y: number
  width: number
  height: number
  label: string
}

interface NonSellableElement {
  id: string
  x: number
  y: number
  width: number
  height: number
  type: 'stage' | 'aisle' | 'exit' | 'bathroom' | 'bar' | 'decorative'
  label: string
  color: string
}

interface Layer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  order: number
  color: string
}

interface HistoryState {
  seats: Seat[]
  sections: Section[]
  stage: Stage
  nonSellableElements: NonSellableElement[]
}

interface ValidationRule {
  id: string
  name: string
  type: 'orphan_seats' | 'accessibility' | 'spacing' | 'capacity'
  enabled: boolean
  message: string
}

interface Template {
  id: string
  name: string
  description: string
  stage: Stage
  sections: Section[]
}

interface VisualSeatMapCreatorProps {
  eventId: string
  onSave: (seatMapData: any) => void
}

export default function VisualSeatMapCreator({ eventId, onSave }: VisualSeatMapCreatorProps) {
  const { toast } = useToast()
  const canvasRef = useRef<HTMLDivElement>(null)
  
  // Estados principales
  const [seats, setSeats] = useState<Seat[]>([])
  const [sections, setSections] = useState<Section[]>([
    {
      id: 'vip',
      name: 'VIP',
      color: '#EF4444',
      price: 500000,
      type: 'VIP',
      capacity: 0,
      description: 'Asientos VIP con vista privilegiada'
    },
    {
      id: 'general',
      name: 'General',
      color: '#6B7280',
      price: 300000,
      type: 'General',
      capacity: 0,
      description: 'Asientos generales'
    }
  ])
  const [stage, setStage] = useState<Stage>({
    x: 400,
    y: 100,
    width: 200,
    height: 80,
    label: 'ESCENARIO'
  })
  const [nonSellableElements, setNonSellableElements] = useState<NonSellableElement[]>([])
  const [layers, setLayers] = useState<Layer[]>([
    { id: 'seats', name: 'Asientos', visible: true, locked: false, order: 1, color: '#6B7280' },
    { id: 'stage', name: 'Escenario', visible: true, locked: false, order: 2, color: '#9CA3AF' },
    { id: 'elements', name: 'Elementos', visible: true, locked: false, order: 3, color: '#F59E0B' }
  ])
  const [activeLayer, setActiveLayer] = useState('seats')
  const [history, setHistory] = useState<HistoryState[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([
    { id: 'orphan', name: 'Asientos huérfanos', type: 'orphan_seats', enabled: true, message: 'Detecta asientos aislados' },
    { id: 'accessibility', name: 'Accesibilidad', type: 'accessibility', enabled: true, message: 'Verifica accesibilidad requerida' },
    { id: 'spacing', name: 'Espaciado', type: 'spacing', enabled: true, message: 'Valida espaciado mínimo' },
    { id: 'capacity', name: 'Capacidad', type: 'capacity', enabled: true, message: 'Controla capacidad máxima' }
  ])
  
  // Estados de herramientas
  const [selectedTool, setSelectedTool] = useState('select')
  const [selectedSection, setSelectedSection] = useState('vip')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [bulkSelection, setBulkSelection] = useState<string[]>([])
  const [seatSize, setSeatSize] = useState(20)
  const [seatSpacing, setSeatSpacing] = useState(25)
  const [drawingMode, setDrawingMode] = useState<'single' | 'row' | 'area'>('single')
  const [autoNumbering, setAutoNumbering] = useState(true)
  const [rowCounter, setRowCounter] = useState(1)
  
  // Estados de UI
  const [showGrid, setShowGrid] = useState(true)
  const [gridSize, setGridSize] = useState(20)
  const [selectedSeatProperties, setSelectedSeatProperties] = useState<Seat | null>(null)
  const [currentCategory, setCurrentCategory] = useState('vip')
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true)
  const [copiedElements, setCopiedElements] = useState<Seat[]>([])
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [autoSave, setAutoSave] = useState(true)
  const [collaborativeMode, setCollaborativeMode] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [currentUser, setCurrentUser] = useState('admin')
  const [showHistory, setShowHistory] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState({
    autoSave: true,
    snapToGrid: true,
    showLabels: true,
    showPrices: true,
    showGrid: true,
    gridSize: 20,
    seatSize: 12,
    seatSpacing: 4
  })
  
  // Estados para funcionalidades de Seats.io
  const [selectedTemplate, setSelectedTemplate] = useState<string>('small-theatre')
  const [readOnlyMode, setReadOnlyMode] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  
  // Templates
  const [templates] = useState<Template[]>([
    {
      id: 'small-theatre',
      name: 'Small Theatre',
      description: 'Teatro pequeño con asientos generales',
      stage: { x: 400, y: 100, width: 200, height: 80, label: 'ESCENARIO' },
      sections: [
        { id: 'orchestra', name: 'Orchestra', color: '#EF4444', price: 500000, type: 'VIP', capacity: 0, description: 'Orchestra seats' },
        { id: 'balcony', name: 'Balcony', color: '#10B981', price: 400000, type: 'Premium', capacity: 0, description: 'Balcony seats' }
      ]
    },
    {
      id: 'large-theatre',
      name: 'Large Theatre',
      description: 'Teatro grande con múltiples niveles',
      stage: { x: 500, y: 150, width: 300, height: 100, label: 'ESCENARIO' },
      sections: [
        { id: 'orchestra', name: 'Orchestra', color: '#EF4444', price: 600000, type: 'VIP', capacity: 0, description: 'Orchestra seats' },
        { id: 'mezzanine', name: 'Mezzanine', color: '#3B82F6', price: 450000, type: 'Premium', capacity: 0, description: 'Mezzanine seats' },
        { id: 'balcony', name: 'Balcony', color: '#10B981', price: 350000, type: 'Standard', capacity: 0, description: 'Balcony seats' }
      ]
    }
  ])
  
  // Categorías para el sidebar
  const [categories] = useState([
    { id: 'vip', name: 'VIP', color: '#EF4444', price: 500000 },
    { id: 'premium', name: 'Premium', color: '#3B82F6', price: 400000 },
    { id: 'standard', name: 'Standard', color: '#10B981', price: 300000 },
    { id: 'general', name: 'General', color: '#6B7280', price: 200000 }
  ])

  // Funciones de historial
  const saveToHistory = () => {
    const newState: HistoryState = {
      seats: [...seats],
      sections: [...sections],
      stage: { ...stage },
      nonSellableElements: [...nonSellableElements]
    }
    
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newState)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1]
      setSeats(prevState.seats)
      setSections(prevState.sections)
      setStage(prevState.stage)
      setNonSellableElements(prevState.nonSellableElements)
      setHistoryIndex(historyIndex - 1)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1]
      setSeats(nextState.seats)
      setSections(nextState.sections)
      setStage(nextState.stage)
      setNonSellableElements(nextState.nonSellableElements)
      setHistoryIndex(historyIndex + 1)
    }
  }

  // Funciones principales
  const handleCanvasClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = (e.clientX - rect.left - pan.x) / zoom
    const y = (e.clientY - rect.top - pan.y) / zoom
    
    if (selectedTool === 'add-seats') {
      if (drawingMode === 'single') {
        addSingleSeat(x, y)
      } else if (drawingMode === 'row') {
        addRowOfSeats(x, y)
      } else if (drawingMode === 'area') {
        addAreaOfSeats(x, y)
      }
    } else if (selectedTool === 'add-stage') {
      saveToHistory()
      setStage({
        x: snapToGrid ? Math.round(x / gridSize) * gridSize : x,
        y: snapToGrid ? Math.round(y / gridSize) * gridSize : y,
        width: 200,
        height: 80,
        label: 'ESCENARIO'
      })
    } else if (selectedTool === 'add-element') {
      addNonSellableElement(x, y)
    }
  }

  const addSingleSeat = (x: number, y: number) => {
    const newSeat: Seat = {
      id: `seat-${Date.now()}`,
      x: snapToGrid ? Math.round(x / gridSize) * gridSize : x,
      y: snapToGrid ? Math.round(y / gridSize) * gridSize : y,
      section: selectedSection,
      row: String.fromCharCode(65 + Math.floor(y / 50)), // Auto-generate row based on Y position
      number: (seats.filter(s => s.section === selectedSection).length + 1).toString(),
      price: sections.find(s => s.id === selectedSection)?.price || 300000,
      type: 'Seat',
      isWheelchairAccessible: false,
      isHearingImpaired: false,
      isRestrictedView: false,
      hasExtraLegroom: false,
      customPrice: false,
      label: (seats.filter(s => s.section === selectedSection).length + 1).toString(),
      displayLabel: (seats.filter(s => s.section === selectedSection).length + 1).toString()
    }
    
    saveToHistory()
    setSeats(prev => [...prev, newSeat])
    toast({
      title: "Asiento agregado",
      description: "Se ha agregado un nuevo asiento al mapa",
    })
  }

  const addRowOfSeats = (x: number, y: number) => {
    const numSeats = 10 // Default row size
    const newSeats: Seat[] = []
    
    for (let i = 0; i < numSeats; i++) {
      const seatX = snapToGrid ? 
        Math.round((x + (i * seatSpacing)) / gridSize) * gridSize : 
        x + (i * seatSpacing)
      
      newSeats.push({
        id: `seat-${Date.now()}-${i}`,
        x: seatX,
        y: snapToGrid ? Math.round(y / gridSize) * gridSize : y,
        section: selectedSection,
        row: String.fromCharCode(65 + Math.floor(y / 50)),
        number: (i + 1).toString(),
        price: sections.find(s => s.id === selectedSection)?.price || 300000,
        type: 'Seat',
        isWheelchairAccessible: false,
        isHearingImpaired: false,
        isRestrictedView: false,
        hasExtraLegroom: false,
        customPrice: false,
        label: (i + 1).toString(),
        displayLabel: (i + 1).toString()
      })
    }
    
    saveToHistory()
    setSeats(prev => [...prev, ...newSeats])
    toast({
      title: "Fila de asientos agregada",
      description: `Se han agregado ${numSeats} asientos en fila`,
    })
  }

  const addAreaOfSeats = (x: number, y: number) => {
    const rows = 5
    const seatsPerRow = 8
    const newSeats: Seat[] = []
    
    for (let row = 0; row < rows; row++) {
      for (let seat = 0; seat < seatsPerRow; seat++) {
        const seatX = snapToGrid ? 
          Math.round((x + (seat * seatSpacing)) / gridSize) * gridSize : 
          x + (seat * seatSpacing)
        const seatY = snapToGrid ? 
          Math.round((y + (row * seatSpacing)) / gridSize) * gridSize : 
          y + (row * seatSpacing)
        
        newSeats.push({
          id: `seat-${Date.now()}-${row}-${seat}`,
          x: seatX,
          y: seatY,
          section: selectedSection,
          row: String.fromCharCode(65 + row),
          number: (seat + 1).toString(),
          price: sections.find(s => s.id === selectedSection)?.price || 300000,
          type: 'Seat',
          isWheelchairAccessible: false,
          isHearingImpaired: false,
          isRestrictedView: false,
          hasExtraLegroom: false,
          customPrice: false,
          label: `${String.fromCharCode(65 + row)}${seat + 1}`,
          displayLabel: `${String.fromCharCode(65 + row)}${seat + 1}`
        })
      }
    }
    
    saveToHistory()
    setSeats(prev => [...prev, ...newSeats])
    toast({
      title: "Área de asientos agregada",
      description: `Se han agregado ${rows * seatsPerRow} asientos en área`,
    })
  }

  const addNonSellableElement = (x: number, y: number) => {
    const newElement: NonSellableElement = {
      id: `element-${Date.now()}`,
      x: snapToGrid ? Math.round(x / gridSize) * gridSize : x,
      y: snapToGrid ? Math.round(y / gridSize) * gridSize : y,
      width: 100,
      height: 50,
      type: 'aisle',
      label: 'PASILLO',
      color: '#9CA3AF'
    }
    
    saveToHistory()
    setNonSellableElements(prev => [...prev, newElement])
    toast({
      title: "Elemento agregado",
      description: "Se ha agregado un elemento no vendible",
    })
  }

  const handleSeatClick = (seat: Seat) => {
    setSelectedSeatProperties(seat)
    setBulkSelection([seat.id])
  }

  const deleteSeat = (seatId: string) => {
    setSeats(prev => prev.filter(seat => seat.id !== seatId))
    if (selectedSeatProperties?.id === seatId) {
      setSelectedSeatProperties(null)
    }
    setBulkSelection(prev => prev.filter(id => id !== seatId))
  }

  const updateSeatProperties = (seatId: string, updates: Partial<Seat>) => {
    setSeats(prev => prev.map(seat => 
      seat.id === seatId ? { ...seat, ...updates } : seat
    ))
    
    if (selectedSeatProperties?.id === seatId) {
      setSelectedSeatProperties(prev => prev ? { ...prev, ...updates } : null)
    }
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.1))
  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectedTool === 'select') {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedTool === 'select') {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const getSeatColor = (seat: Seat) => {
    const section = sections.find(s => s.id === seat.section)
    return section?.color || '#6B7280'
  }

  const getSeatIcon = (seat: Seat) => {
    if (seat.isWheelchairAccessible) return '♿'
    if (seat.hasExtraLegroom) return '★'
    return seat.number
  }

  // Funciones avanzadas
  const alignSeats = (alignment: 'left' | 'right' | 'top' | 'bottom' | 'center') => {
    if (bulkSelection.length === 0) return
    
    const selectedSeats = seats.filter(seat => bulkSelection.includes(seat.id))
    if (selectedSeats.length === 0) return
    
    let newSeats = [...seats]
    
    if (alignment === 'left') {
      const minX = Math.min(...selectedSeats.map(seat => seat.x))
      selectedSeats.forEach(seat => {
        const index = newSeats.findIndex(s => s.id === seat.id)
        if (index !== -1) {
          newSeats[index] = { ...newSeats[index], x: minX }
        }
      })
    } else if (alignment === 'right') {
      const maxX = Math.max(...selectedSeats.map(seat => seat.x))
      selectedSeats.forEach(seat => {
        const index = newSeats.findIndex(s => s.id === seat.id)
        if (index !== -1) {
          newSeats[index] = { ...newSeats[index], x: maxX }
        }
      })
    } else if (alignment === 'top') {
      const minY = Math.min(...selectedSeats.map(seat => seat.y))
      selectedSeats.forEach(seat => {
        const index = newSeats.findIndex(s => s.id === seat.id)
        if (index !== -1) {
          newSeats[index] = { ...newSeats[index], y: minY }
        }
      })
    } else if (alignment === 'bottom') {
      const maxY = Math.max(...selectedSeats.map(seat => seat.y))
      selectedSeats.forEach(seat => {
        const index = newSeats.findIndex(s => s.id === seat.id)
        if (index !== -1) {
          newSeats[index] = { ...newSeats[index], y: maxY }
        }
      })
    }
    
    saveToHistory()
    setSeats(newSeats)
    toast({
      title: "Asientos alineados",
      description: `Se han alineado ${bulkSelection.length} asientos`,
    })
  }

  const distributeSeats = (direction: 'horizontal' | 'vertical') => {
    if (bulkSelection.length < 3) return
    
    const selectedSeats = seats.filter(seat => bulkSelection.includes(seat.id))
    if (selectedSeats.length < 3) return
    
    let newSeats = [...seats]
    
    if (direction === 'horizontal') {
      selectedSeats.sort((a, b) => a.x - b.x)
      const startX = selectedSeats[0].x
      const endX = selectedSeats[selectedSeats.length - 1].x
      const spacing = (endX - startX) / (selectedSeats.length - 1)
      
      selectedSeats.forEach((seat, index) => {
        const seatIndex = newSeats.findIndex(s => s.id === seat.id)
        if (seatIndex !== -1) {
          newSeats[seatIndex] = { ...newSeats[seatIndex], x: startX + (spacing * index) }
        }
      })
    } else if (direction === 'vertical') {
      selectedSeats.sort((a, b) => a.y - b.y)
      const startY = selectedSeats[0].y
      const endY = selectedSeats[selectedSeats.length - 1].y
      const spacing = (endY - startY) / (selectedSeats.length - 1)
      
      selectedSeats.forEach((seat, index) => {
        const seatIndex = newSeats.findIndex(s => s.id === seat.id)
        if (seatIndex !== -1) {
          newSeats[seatIndex] = { ...newSeats[seatIndex], y: startY + (spacing * index) }
        }
      })
    }
    
    saveToHistory()
    setSeats(newSeats)
    toast({
      title: "Asientos distribuidos",
      description: `Se han distribuido ${bulkSelection.length} asientos`,
    })
  }

  const copySeats = () => {
    const selectedSeats = seats.filter(seat => bulkSelection.includes(seat.id))
    setCopiedElements(selectedSeats)
    toast({
      title: "Asientos copiados",
      description: `Se han copiado ${selectedSeats.length} asientos`,
    })
  }

  const pasteSeats = () => {
    if (copiedElements.length === 0) return
    
    const offset = 50
    const newSeats = copiedElements.map((seat, index) => ({
      ...seat,
      id: `seat-${Date.now()}-${index}`,
      x: seat.x + offset,
      y: seat.y + offset
    }))
    
    saveToHistory()
    setSeats(prev => [...prev, ...newSeats])
    setBulkSelection(newSeats.map(seat => seat.id))
    toast({
      title: "Asientos pegados",
      description: `Se han pegado ${newSeats.length} asientos`,
    })
  }

  const validateMap = () => {
    const errors: string[] = []
    
    // Validar asientos huérfanos
    const orphanRule = validationRules.find(rule => rule.type === 'orphan_seats' && rule.enabled)
    if (orphanRule) {
      // Lógica para detectar asientos huérfanos
      const orphanSeats = seats.filter(seat => {
        const nearbySeats = seats.filter(otherSeat => 
          otherSeat.id !== seat.id &&
          Math.abs(otherSeat.x - seat.x) < 100 &&
          Math.abs(otherSeat.y - seat.y) < 100
        )
        return nearbySeats.length === 0
      })
      
      if (orphanSeats.length > 0) {
        errors.push(`Se encontraron ${orphanSeats.length} asientos huérfanos`)
      }
    }
    
    // Validar accesibilidad
    const accessibilityRule = validationRules.find(rule => rule.type === 'accessibility' && rule.enabled)
    if (accessibilityRule) {
      const accessibleSeats = seats.filter(seat => seat.isWheelchairAccessible)
      if (accessibleSeats.length === 0) {
        errors.push('No hay asientos accesibles para sillas de ruedas')
      }
    }
    
    if (errors.length === 0) {
      toast({
        title: "Validación exitosa",
        description: "El mapa cumple con todas las reglas de validación",
      })
    } else {
      toast({
        title: "Errores de validación",
        description: errors.join(', '),
        variant: "destructive"
      })
    }
  }

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) return
    
    saveToHistory()
    setStage(template.stage)
    setSections(template.sections)
    setSeats([])
    setSelectedTemplate(templateId)
    
    toast({
      title: "Template aplicado",
      description: `Se ha aplicado el template ${template.name}`,
    })
  }

  const handleSave = () => {
    const seatMapData = {
      id: `map-${Date.now()}`,
      eventId,
      name: `Mapa de Asientos - ${new Date().toLocaleDateString()}`,
      seats: seats.map(seat => ({
        ...seat,
        status: 'available', // available, sold, reserved, blocked
        soldAt: null,
        soldTo: null,
        reservedUntil: null
      })),
      sections,
      stage,
      nonSellableElements,
      layers,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin',
        version: 1,
        totalSeats: seats.length,
        totalSections: sections.length
      },
      settings: {
        gridSize,
        seatSize,
        seatSpacing,
        snapToGrid,
        showGrid
      }
    }
    onSave(seatMapData)
    toast({
      title: "Mapa guardado",
      description: "El mapa de asientos ha sido guardado exitosamente",
    })
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-gray-900">Creador de Mapas de Asientos</h1>
          </div>
        </div>
        
        {/* Barra de herramientas */}
        <div className="flex items-center justify-between px-6 py-2 bg-gray-50 border-t">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={undo} disabled={historyIndex <= 0}>
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
              <Redo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSave}>
              <Save className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={copySeats} disabled={bulkSelection.length === 0}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={pasteSeats} disabled={copiedElements.length === 0}>
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSeats([])}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <span className="text-xs px-2">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Reset
            </Button>
            <Button variant="ghost" size="sm" onClick={validateMap}>
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar izquierdo - Herramientas */}
        <div className="w-64 bg-white border-r overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold mb-3">Tools</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={selectedTool === 'select' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('select')}
                className="h-10"
              >
                <MousePointer className="h-4 w-4" />
              </Button>
              <Button
                variant={selectedTool === 'add-seats' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('add-seats')}
                className="h-10"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant={selectedTool === 'add-stage' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('add-stage')}
                className="h-10"
              >
                <Theater className="h-4 w-4" />
              </Button>
              <Button
                variant={selectedTool === 'add-element' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('add-element')}
                className="h-10"
              >
                <Square className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Modo de dibujo */}
          {selectedTool === 'add-seats' && (
            <div className="p-4 border-t">
              <h3 className="font-semibold mb-3">Drawing Mode</h3>
              <div className="space-y-2">
                <Button
                  variant={drawingMode === 'single' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDrawingMode('single')}
                  className="w-full justify-start"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Single Seat
                </Button>
                <Button
                  variant={drawingMode === 'row' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDrawingMode('row')}
                  className="w-full justify-start"
                >
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Row of Seats
                </Button>
                <Button
                  variant={drawingMode === 'area' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDrawingMode('area')}
                  className="w-full justify-start"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Area of Seats
                </Button>
              </div>
            </div>
          )}

          {/* Herramientas avanzadas */}
          <div className="p-4 border-t">
            <h3 className="font-semibold mb-3">Advanced Tools</h3>
            <div className="space-y-3">
              {/* Alineación */}
              <div>
                <Label className="text-xs font-medium mb-2 block">Align</Label>
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => alignSeats('left')}
                    disabled={bulkSelection.length === 0}
                    className="h-7 text-xs"
                  >
                    <AlignLeft className="h-3 w-3 mr-1" />
                    Left
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => alignSeats('right')}
                    disabled={bulkSelection.length === 0}
                    className="h-7 text-xs"
                  >
                    Right
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => alignSeats('top')}
                    disabled={bulkSelection.length === 0}
                    className="h-7 text-xs"
                  >
                    Top
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => alignSeats('bottom')}
                    disabled={bulkSelection.length === 0}
                    className="h-7 text-xs"
                  >
                    Bottom
                  </Button>
                </div>
              </div>

              {/* Distribución */}
              <div>
                <Label className="text-xs font-medium mb-2 block">Distribute</Label>
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => distributeSeats('horizontal')}
                    disabled={bulkSelection.length < 3}
                    className="h-7 text-xs"
                  >
                    <Grid3X3 className="h-3 w-3 mr-1" />
                    H-Dist
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => distributeSeats('vertical')}
                    disabled={bulkSelection.length < 3}
                    className="h-7 text-xs"
                  >
                    V-Dist
                  </Button>
                </div>
              </div>

              {/* Copiar/Pegar */}
              <div>
                <Label className="text-xs font-medium mb-2 block">Copy/Paste</Label>
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copySeats}
                    disabled={bulkSelection.length === 0}
                    className="h-7 text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={pasteSeats}
                    disabled={copiedElements.length === 0}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Paste
                  </Button>
                </div>
              </div>

              {/* Validación */}
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={validateMap}
                  className="w-full h-7 text-xs"
                >
                  <Info className="h-3 w-3 mr-1" />
                  Validate Map
                </Button>
              </div>
            </div>
          </div>

          {/* Configuración */}
          <div className="p-4 border-t">
            <h3 className="font-semibold mb-3">Settings</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium mb-1 block">Grid Size</Label>
                <Input
                  type="number"
                  value={gridSize}
                  onChange={(e) => setGridSize(Number(e.target.value))}
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">Seat Size</Label>
                <Input
                  type="number"
                  value={seatSize}
                  onChange={(e) => setSeatSize(Number(e.target.value))}
                  className="h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-medium mb-1 block">Seat Spacing</Label>
                <Input
                  type="number"
                  value={seatSpacing}
                  onChange={(e) => setSeatSpacing(Number(e.target.value))}
                  className="h-7 text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="snap-to-grid"
                  checked={snapToGrid}
                  onChange={(e) => setSnapToGrid(e.target.checked)}
                />
                <Label htmlFor="snap-to-grid" className="text-xs">Snap to Grid</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="show-grid"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                />
                <Label htmlFor="show-grid" className="text-xs">Show Grid</Label>
              </div>
            </div>
          </div>

          {/* Templates */}
          <div className="p-4 border-t">
            <h3 className="font-semibold mb-3">Templates</h3>
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-3 rounded-lg border-2 cursor-pointer transition-all border-gray-200 hover:border-gray-300"
                  onClick={() => applyTemplate(template.id)}
                >
                  <div className="w-full h-16 bg-gray-100 rounded mb-2 flex items-center justify-center">
                    <Theater className="h-6 w-6 text-gray-400" />
                  </div>
                  <h4 className="font-medium text-sm">{template.name}</h4>
                  <p className="text-xs text-gray-600">{template.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Área de dibujo principal - Pantalla completa */}
        <div className="flex-1 relative bg-gray-100">
          <div
            ref={canvasRef}
            className="w-full h-full overflow-auto cursor-crosshair"
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              cursor: selectedTool === 'select' ? (isDragging ? 'grabbing' : 'grab') : 'crosshair'
            }}
          >
            {/* Lienzo con zoom y pan */}
            <div
              className="relative min-h-full min-w-full"
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transformOrigin: 'top left',
                transition: 'transform 0.1s ease-out'
              }}
            >
              {/* Escenario */}
              <div
                className="absolute bg-gray-300 rounded-lg flex items-center justify-center text-gray-600 font-semibold text-lg shadow-lg"
                style={{
                  left: stage.x,
                  top: stage.y,
                  width: stage.width,
                  height: stage.height
                }}
              >
                {stage.label}
              </div>

              {/* Elementos no vendibles */}
              {nonSellableElements.map((element) => (
                <div
                  key={element.id}
                  className="absolute rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer group"
                  style={{
                    left: element.x,
                    top: element.y,
                    width: element.width,
                    height: element.height,
                    backgroundColor: element.color
                  }}
                  title={element.label}
                >
                  {element.label}
                  
                  {/* Botón de eliminar */}
                  <button
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      setNonSellableElements(prev => prev.filter(el => el.id !== element.id))
                    }}
                  >
                    <Minus className="w-2 h-2 text-white" />
                  </button>
                </div>
              ))}

              {/* Asientos */}
              {seats.map((seat) => (
                <div
                  key={seat.id}
                  className={`absolute rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer group ${
                    bulkSelection.includes(seat.id) ? 'ring-2 ring-yellow-400' : ''
                  }`}
                  style={{
                    left: seat.x,
                    top: seat.y,
                    width: seatSize,
                    height: seatSize,
                    backgroundColor: getSeatColor(seat)
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSeatClick(seat)
                  }}
                  title={`${seat.section} - Fila ${seat.row} - Asiento ${seat.number} - $${seat.price.toLocaleString()}`}
                >
                  {getSeatIcon(seat)}
                  
                  {/* Botón de eliminar */}
                  <button
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteSeat(seat.id)
                    }}
                  >
                    <Minus className="w-2 h-2 text-white" />
                  </button>
                </div>
              ))}

              {/* Grid de ayuda */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none">
                  <svg className="w-full h-full">
                    <defs>
                      <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
                        <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="#E5E7EB" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar derecho - Propiedades */}
        <div className="w-80 bg-white border-l p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Categorías */}
            <div>
              <h3 className="font-semibold mb-3">Category</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      currentCategory === category.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setCurrentCategory(category.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{category.name}</div>
                        <div className="text-xs text-gray-600">${category.price.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Propiedades del asiento seleccionado */}
            {selectedSeatProperties && (
              <div>
                <h3 className="font-semibold mb-3">Properties</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Label</Label>
                    <Input
                      value={selectedSeatProperties.label}
                      onChange={(e) => updateSeatProperties(selectedSeatProperties.id, { label: e.target.value })}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Price</Label>
                    <Input
                      type="number"
                      value={selectedSeatProperties.price}
                      onChange={(e) => updateSeatProperties(selectedSeatProperties.id, { price: Number(e.target.value) })}
                      className="h-8"
                    />
                  </div>
                  
                  {/* Opciones de accesibilidad */}
                  <div>
                    <Label className="text-sm font-medium">Accessibility</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedSeatProperties.isWheelchairAccessible}
                          onChange={(e) => updateSeatProperties(selectedSeatProperties.id, { isWheelchairAccessible: e.target.checked })}
                        />
                        <Label className="text-xs">Wheelchair accessible</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedSeatProperties.isHearingImpaired}
                          onChange={(e) => updateSeatProperties(selectedSeatProperties.id, { isHearingImpaired: e.target.checked })}
                        />
                        <Label className="text-xs">Hearing impaired</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedSeatProperties.isRestrictedView}
                          onChange={(e) => updateSeatProperties(selectedSeatProperties.id, { isRestrictedView: e.target.checked })}
                        />
                        <Label className="text-xs">Restricted view</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Información de selección */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Selection Info</h4>
              <div className="text-xs text-gray-600 space-y-1">
                {selectedSeatProperties ? (
                  <div>
                    <div><strong>Seat:</strong> {selectedSeatProperties.section} {selectedSeatProperties.row}{selectedSeatProperties.number}</div>
                    <div><strong>Price:</strong> ${selectedSeatProperties.price.toLocaleString()}</div>
                    <div><strong>Type:</strong> {selectedSeatProperties.type}</div>
                    {selectedSeatProperties.isWheelchairAccessible && <div className="text-blue-600">♿ Wheelchair Accessible</div>}
                    {selectedSeatProperties.hasExtraLegroom && <div className="text-green-600">★ Extra Legroom</div>}
                  </div>
                ) : bulkSelection.length > 0 ? (
                  <div>
                    <div><strong>Selected:</strong> {bulkSelection.length} objects</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Use Advanced Tools to align, distribute, or copy/paste
                    </div>
                  </div>
                ) : (
                  <div>
                    <div>Click on a seat to edit its properties</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Shift + Click to select multiple seats
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
