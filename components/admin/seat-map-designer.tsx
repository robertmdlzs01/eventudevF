"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { 
  Layout, 
  Settings, 
  Shield, 
  BarChart3, 
  Save, 
  Download,
  Upload,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Eye,
  EyeOff,
  Layers,
  Palette,
  MousePointer,
  Square,
  Circle,
  Triangle,
  AlignLeft,
  Ruler,
  Move,
  Copy,
  Trash2,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Group,
  Ungroup,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter as AlignMiddle,
  AlignVerticalJustifyEnd,
  AlignCenter,
  AlignRight,
  Plus,
  Minus,
  Maximize,
  Minimize,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Target,
  Zap,
  RefreshCw,
  Clock,
  Users,
  DollarSign,
  MapPin,
  Accessibility,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Star,
  Crown,
  Building,
  Theater,
  Edit3,
  Sun,
  Type,
  DoorOpen,
  DoorClosed,
  Wifi
} from 'lucide-react'

const RestroomUnisexIcon = ({ className = "w-6 h-6", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 64 64" className={className} style={style} xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" preserveAspectRatio="xMidYMid meet">
    <path d="M17.991 6.007a4.976 4.976 0 1 1-9.952 0a4.976 4.976 0 0 1 9.952 0z" fill="currentColor"></path>
    <path d="M24.77 20.092v-2.514a4.787 4.787 0 0 0-4.788-4.788H6.033a4.788 4.788 0 0 0-4.788 4.788v2.514a2.007 2.007 0 0 0-.008.174v14.475a2.036 2.036 0 1 0 4.072 0v-14.26h1.365v16.297h.01v23.029a2.715 2.715 0 0 0 5.429 0V36.778h1.791v23.029a2.714 2.714 0 0 0 5.428 0V36.778h.008V20.481h1.365v14.26a2.037 2.037 0 0 0 4.072 0V20.266a1.643 1.643 0 0 0-.007-.174z" fill="currentColor"></path>
    <path d="M48.715 10.662a4.976 4.976 0 1 0-4.978-4.974a4.976 4.976 0 0 0 4.978 4.974z" fill="currentColor"></path>
    <path d="M62.666 32.116l-4.464-16.558a2.04 2.04 0 0 0-.171-.426a3.878 3.878 0 0 0-3.683-2.674H43.05a3.878 3.878 0 0 0-3.742 2.875c-.03.073-.055.149-.077.227l-4.385 16.556a2.035 2.035 0 1 0 3.932 1.054l3.445-13.006h1.435l-6.251 23.531h5.889v16.246a2.262 2.262 0 1 0 4.524 0V43.695h1.8v16.246a2.263 2.263 0 0 0 4.524 0V43.695h5.886l-6.274-23.531h1.472l3.506 13.006a2.037 2.037 0 0 0 2.493 1.439a2.037 2.037 0 0 0 1.44-2.493z" fill="currentColor"></path>
    <path d="M28.746.815h3.51v61.382h-3.51V.815z" fill="currentColor"></path>
  </svg>
)

const RestroomMenIcon = ({ className = "w-6 h-6", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" className={className} style={style} xmlns="http://www.w3.org/2000/svg">
    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7,13.5 L11,8 L10,21 M17,13.5 L13,8 L14,21 M12,5 C12.5522847,5 13,4.55228475 13,4 C13,3.44771525 12.5522847,3 12,3 C11.4477153,3 11,3.44771525 11,4 C11,4.55228475 11.4477153,5 12,5 Z M11,8 L13,8 L13,13.5 L11,13.5 L11,8 Z"></path>
  </svg>
)

const RestroomWomenIcon = ({ className = "w-6 h-6", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" className={className} style={style} xmlns="http://www.w3.org/2000/svg">
    <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7,13.5 L11,8 L12,21 M17,13.5 L13,8 L12,21 M12,5 C12.5522847,5 13,4.55228475 13,4 C13,3.44771525 12.5522847,3 12,3 C11.4477153,3 11,3.44771525 11,4 C11,4.55228475 11.4477153,5 12,5 Z M11,8 L13,8 L14.5,16.5 L9.5,16.5 L11,8 Z"></path>
  </svg>
)

const StairsIcon = ({ className = "w-6 h-6", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 64 64" className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="1.792">
    <polyline points="48 48 28 48 28 40 48 40"></polyline>
    <polyline points="48 40 32 40 32 32 48 32"></polyline>
    <polyline points="48 32 36 32 36 24 48 24"></polyline>
    <polyline points="24 56 24 48 48 48"></polyline>
    <rect x="16" y="8" width="32" height="48"></rect>
  </svg>
)

const EmergencyExitIcon = ({ className = "w-6 h-6", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 60.601004 60.601004" className={className} style={style} xmlns="http://www.w3.org/2000/svg">
    <path d="m 4.5630022,4.5605012 0,51.4687528 51.4625028,0 0,-51.4687528 -51.4625028,0 z" style={{fill:'currentColor', fillOpacity:0.1, fillRule:'nonzero', stroke:'none'}}></path>
    <path d="m 27.150503,51.406754 4.625,4.63375 -5.6,0 -6.05,-5.985 3.6125,0 c 1.2875,0 2.5125,0.515 3.4125,1.35125 z m -1.6125,-40.92625 c 1.9875,0 3.6625,1.67375 3.6625,3.6675 0,1.995 -1.675,3.60375 -3.6625,3.60375 -2,0 -3.6,-1.60875 -3.6,-3.60375 0,-1.99375 1.6,-3.6675 3.6,-3.6675 z m 24.0625,33.26875 -1.2875,-3.41 c -0.575,-1.41625 -1.8625,-2.38125 -3.475,-2.38125 l -0.575,0 0,-29.4074998 -27.925,0 0,16.2799998 3.6625,0 4.1875,-5.2125 c 0.8375,-0.965 2.125,-1.60875 3.5375,-1.60875 l 8.95,0 c 1.4125,0 2.6375,0.77125 3.275,1.995 l 2.6375,5.01875 c 0.1375,0.19375 0.2,0.45125 0.2,0.7725 0,0.90125 -0.775,1.67375 -1.675,1.67375 -0.7125,0 -1.225,-0.3225 -1.55,-0.90125 l -2.375,-4.56875 -3.8625,0 2.9625,7.4 0.9,9.46 7.65,0 c 1.225,0 2.1875,0.77125 2.6375,1.80125 l 0.8375,2.18875 -13.125,0 c -0.9625,0 -1.8,-0.70875 -1.8625,-1.67375 l -0.9,-8.30125 -7.0875,14.67125 c -0.375,0.8375 -1.275,1.41625 -2.3125,1.41625 l -3.4125,0 8.6875,-17.95375 -2.7,-6.75625 -2.575,3.1525 c -0.6375,0.8375 -1.7375,1.41625 -2.9,1.41625 l -3.7875,0 0,21.235 6.05,5.985 -17.8249998,0 0,-51.4799998 51.4749998,0 0,51.4799998 -5.7875,0 -5.9875,-5.985 0,-6.30625 5.3375,0" style={{fill:'currentColor', fillOpacity:1, fillRule:'nonzero', stroke:'none'}}></path>
  </svg>
)

const EntranceIcon = ({ className = "w-6 h-6", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" className={className} style={style} role="img" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="0.72" strokeLinecap="square" strokeLinejoin="miter" fill="none">
    <path d="M11 15l3-3-3-3"></path>
    <path d="M4.5 12H13"></path>
    <path strokeLinecap="round" d="M14 12h-1"></path>
    <path d="M18 4v16H7V4z"></path>
  </svg>
)

const WarningIcon = ({ className = "w-6 h-6", style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" className={className} style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M13.0619 4.4295C12.6213 3.54786 11.3636 3.54786 10.9229 4.4295L3.89008 18.5006C3.49256 19.2959 4.07069 20.2317 4.95957 20.2317H19.0253C19.9142 20.2317 20.4923 19.2959 20.0948 18.5006L13.0619 4.4295ZM9.34196 3.6387C10.434 1.45376 13.5508 1.45377 14.6429 3.63871L21.6758 17.7098C22.6609 19.6809 21.2282 22 19.0253 22H4.95957C2.75669 22 1.32395 19.6809 2.3091 17.7098L9.34196 3.6387Z" fill="currentColor"></path>
    <path d="M12 8V13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"></path>
    <path d="M12 16L12 16.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"></path>
  </svg>
)

const PropertyEditor = ({ element, onClose, onSave, sections }: { element: any, onClose: () => void, onSave: (el: any) => void, sections: any[] }) => {
  const [editedElement, setEditedElement] = useState(element)
  const { toast } = useToast()
  
  const handleSave = () => {
    onSave(editedElement)
    onClose()
    toast({
      title: "Propiedades actualizadas",
      description: "Los cambios se han guardado exitosamente",
    })
  }
  
  const isTable = editedElement.type === 'table' || editedElement.capacity !== undefined
  const isText = editedElement.type === 'text'
  const isDecorative = editedElement.type === 'restroom' || editedElement.type === 'stairs' || editedElement.type === 'exit' || editedElement.type === 'entrance' || editedElement.type === 'bar' || editedElement.type === 'cafe' || editedElement.type === 'restaurant' || editedElement.type === 'warning'
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isText ? 'Propiedades de Texto' : 
             isDecorative ? 'Propiedades de Elemento' :
             isTable ? 'Propiedades de Mesa' : 
             'Propiedades de Asiento'}: {editedElement.label}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          {/* Campos para texto */}
          {isText && (
            <>
              <div className="col-span-2">
                <Label>Texto</Label>
                <Input
                  value={editedElement.label}
                  onChange={(e) => setEditedElement({ ...editedElement, label: e.target.value })}
                  placeholder="Escribe el texto aquí..."
                />
              </div>
              <div>
                <Label>Tamaño de Fuente</Label>
                <Input
                  type="number"
                  value={editedElement.fontSize || 16}
                  onChange={(e) => setEditedElement({ ...editedElement, fontSize: parseInt(e.target.value) || 16 })}
                  min="8"
                  max="72"
                />
              </div>
              <div>
                <Label>Grosor de Fuente</Label>
                <Select 
                  value={editedElement.fontWeight || 'normal'} 
                  onValueChange={(value) => setEditedElement({ ...editedElement, fontWeight: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bold">Negrita</SelectItem>
                    <SelectItem value="lighter">Ligera</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={editedElement.color || '#000000'}
                    onChange={(e) => setEditedElement({ ...editedElement, color: e.target.value })}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={editedElement.color || '#000000'}
                    onChange={(e) => setEditedElement({ ...editedElement, color: e.target.value })}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>
            </>
          )}
          
          {/* Campos para elementos decorativos */}
          {isDecorative && (
            <>
              <div className="col-span-2">
                <Label>Etiqueta</Label>
                <Input
                  value={editedElement.label}
                  onChange={(e) => setEditedElement({ ...editedElement, label: e.target.value })}
                />
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={editedElement.color}
                    onChange={(e) => setEditedElement({ ...editedElement, color: e.target.value })}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={editedElement.color}
                    onChange={(e) => setEditedElement({ ...editedElement, color: e.target.value })}
                    placeholder="#10B981"
                    className="flex-1"
                  />
                </div>
              </div>
            </>
          )}
          
          {/* Campos para asientos */}
          {!isTable && !isText && !isDecorative && (
            <>
              <div>
                <Label>Fila</Label>
                <Input
                  value={editedElement.row}
                  onChange={(e) => setEditedElement({ ...editedElement, row: e.target.value, label: e.target.value + editedElement.number, displayLabel: e.target.value + editedElement.number })}
                />
              </div>
              <div>
                <Label>Número</Label>
                <Input
                  value={editedElement.number}
                  onChange={(e) => setEditedElement({ ...editedElement, number: e.target.value, label: editedElement.row + e.target.value, displayLabel: editedElement.row + e.target.value })}
                />
              </div>
            </>
          )}
          
          {/* Campos para mesas */}
          {isTable && (
            <>
              <div>
                <Label>Nombre/Número de Mesa</Label>
                <Input
                  value={editedElement.label}
                  onChange={(e) => setEditedElement({ ...editedElement, label: e.target.value })}
                />
              </div>
              <div>
                <Label>Capacidad (Personas)</Label>
                <Input
                  type="number"
                  value={editedElement.capacity || 4}
                  onChange={(e) => setEditedElement({ ...editedElement, capacity: parseInt(e.target.value) || 4 })}
                  min="1"
                  max="20"
                />
              </div>
            </>
          )}
          
          {/* Campos comunes para asientos y mesas (no para texto ni decorativos) */}
          {!isText && !isDecorative && (
            <>
              <div>
            <Label>Sección</Label>
            <Select value={editedElement.section} onValueChange={(value) => setEditedElement({ ...editedElement, section: value, price: sections.find(s => s.id === value)?.price || editedElement.price })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sections.map(section => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Precio</Label>
            <Input
              type="number"
              value={editedElement.price}
              onChange={(e) => setEditedElement({ ...editedElement, price: parseInt(e.target.value) || 0 })}
            />
          </div>
          
              {/* Selector de forma */}
              <div className="col-span-2">
                <Label>Forma {isTable ? 'de la Mesa' : 'del Asiento'}</Label>
                <Select 
                  value={editedElement.shape || (isTable ? 'circle' : 'circle')} 
                  onValueChange={(value) => setEditedElement({ ...editedElement, shape: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isTable ? (
                      <>
                        <SelectItem value="circle">⭕ Circular</SelectItem>
                        <SelectItem value="rectangle">▭ Rectangular</SelectItem>
                        <SelectItem value="rounded-rectangle">▭ Rectangular Redondeada</SelectItem>
                        <SelectItem value="oval">⬭ Ovalada</SelectItem>
                        <SelectItem value="hexagon">⬡ Hexagonal</SelectItem>
                        <SelectItem value="diamond">◆ Diamante</SelectItem>
                        <SelectItem value="u-shape">⊃ Forma U</SelectItem>
                        <SelectItem value="conference">▬ Conferencia</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="circle">⭕ Circular</SelectItem>
                        <SelectItem value="square">⬜ Cuadrado</SelectItem>
                        <SelectItem value="rectangle">▭ Rectangular</SelectItem>
                        <SelectItem value="rounded-square">▢ Cuadrado Redondeado</SelectItem>
                        <SelectItem value="hexagon">⬡ Hexagonal</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          {/* Características especiales solo para asientos */}
          {!isTable && !isText && !isDecorative && (
            <div className="col-span-2">
              <Label>Características Especiales</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editedElement.isWheelchairAccessible}
                    onChange={(e) => setEditedElement({ ...editedElement, isWheelchairAccessible: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Accesible para silla de ruedas</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editedElement.isHearingImpaired}
                    onChange={(e) => setEditedElement({ ...editedElement, isHearingImpaired: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Accesible para discapacidad auditiva</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editedElement.isRestrictedView}
                    onChange={(e) => setEditedElement({ ...editedElement, isRestrictedView: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Vista restringida</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={editedElement.hasExtraLegroom}
                    onChange={(e) => setEditedElement({ ...editedElement, hasExtraLegroom: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Espacio extra para piernas</span>
                </label>
              </div>
            </div>
          )}
          <div>
            <Label>Posición X</Label>
            <Input
              type="number"
              value={editedElement.x}
              onChange={(e) => setEditedElement({ ...editedElement, x: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>Posición Y</Label>
            <Input
              type="number"
              value={editedElement.y}
              onChange={(e) => setEditedElement({ ...editedElement, y: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Guardar Cambios
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface Seat {
  id: string
  x: number
  y: number
  section: string
  row: string
  number: string
  price: number
  type: string
  status: 'available' | 'sold' | 'reserved'
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
  shape?: 'circle' | 'square' | 'rectangle' | 'hexagon' | 'rounded-square'
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
  type: 'table' | 'aisle' | 'entrance' | 'exit' | 'restroom' | 'restroom-men' | 'restroom-women' | 'elevator' | 'stairs' | 'text' | 'warning'
  x: number
  y: number
  width: number
  height: number
  label: string
  color: string
  shape?: 'circle' | 'rectangle' | 'oval' | 'rounded-rectangle' | 'u-shape' | 'hexagon' | 'diamond' | 'conference'
  section?: string
  price?: number
  capacity?: number
  number?: string
  status?: 'available' | 'sold' | 'reserved'
  fontSize?: number
  fontWeight?: string
  rotation?: number
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
  id: string
  timestamp: Date
  action: string
  data: any
}

interface ValidationRule {
  id: string
  name: string
  type: string
  enabled: boolean
  message: string
}

interface SeatMapTemplate {
  id: string
  name: string
  description: string
  category: string
  thumbnail: string
  capacity: number
  popularity: number
  tags: string[]
  config: any
  sections: any[]
}

interface SeatMapDesignerProps {
  eventId?: string
  onSave: (data: any) => void
  onExport?: (format: string) => void
  onImport?: (file: File) => void
  initialData?: any
}

export default function SeatMapDesigner({ 
  eventId, 
  onSave, 
  onExport = () => {},
  onImport = () => {},
  initialData 
}: SeatMapDesignerProps) {
  const { toast } = useToast()
  const canvasRef = useRef<HTMLDivElement>(null)
  
  const [activeTab, setActiveTab] = useState('visual')
  const [seats, setSeats] = useState<Seat[]>([])
  const [sections, setSections] = useState<Section[]>([])
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
  
  const [selectedTool, setSelectedTool] = useState<'select' | 'seat' | 'row' | 'circle' | 'rectangle' | 'polygon' | 'stage' | 'label' | 'pan' | 'bathroom' | 'bathroom-men' | 'bathroom-women' | 'stairs' | 'exit' | 'entrance' | 'text' | 'warning'>('select')
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [gridSize, setGridSize] = useState(20)
  const [showRowModal, setShowRowModal] = useState(false)
  const [rowConfig, setRowConfig] = useState({
    rows: 5,
    seatsPerRow: 10,
    rowSpacing: 40,
    seatSpacing: 30,
    startRow: 'A',
    startNumber: 1,
    curved: false,
    curveIntensity: 0.5,
    curveType: 'concave' as 'concave' | 'convex',
    curveStyle: 'elliptical' as 'elliptical' | 'circular' | 'parabolic' | 'hyperbolic',
    progressiveCurve: true,
    radius: 500,
    section: sections[0]?.id || ''
  })
  
  const [tempRowConfig, setTempRowConfig] = useState(rowConfig)
  const [isPanning, setIsPanning] = useState(false)
  const [panStartPoint, setPanStartPoint] = useState({ x: 0, y: 0 })
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true)
  const [selectedElement, setSelectedElement] = useState<any>(null)
  const [multiSelectMode, setMultiSelectMode] = useState(false)
  const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, width: number, height: number } | null>(null)
  const [drawingStart, setDrawingStart] = useState<{ x: number, y: number } | null>(null)
  const [showSnapGuides, setShowSnapGuides] = useState(true)
  const [isDraggingSeats, setIsDraggingSeats] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [canvasSize] = useState({ width: 5000, height: 5000 })
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [bulkEditValues, setBulkEditValues] = useState<any>({})
  const [isBoxSelecting, setIsBoxSelecting] = useState(false)
  const [boxStart, setBoxStart] = useState<{ x: number, y: number } | null>(null)
  const [boxEnd, setBoxEnd] = useState<{ x: number, y: number } | null>(null)
  const [showSectionModal, setShowSectionModal] = useState(false)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [isNewSection, setIsNewSection] = useState(false)
  const [isDrawingShape, setIsDrawingShape] = useState(false)
  const [shapeStart, setShapeStart] = useState<{ x: number, y: number } | null>(null)
  const [shapeEnd, setShapeEnd] = useState<{ x: number, y: number } | null>(null)
  const [selectedSeatShape, setSelectedSeatShape] = useState<'circle' | 'square' | 'rectangle' | 'hexagon' | 'rounded-square'>('circle')
  const [selectedTableShape, setSelectedTableShape] = useState<'circle' | 'rectangle' | 'oval' | 'rounded-rectangle' | 'u-shape' | 'hexagon' | 'diamond' | 'conference'>('circle')
  const [showShapeSelector, setShowShapeSelector] = useState(false)
  const [selectedElements, setSelectedElements] = useState<string[]>([])
  const [isDraggingElements, setIsDraggingElements] = useState(false)
  const [isResizingElement, setIsResizingElement] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | null>(null)
  const [resizeStartPoint, setResizeStartPoint] = useState<{ x: number, y: number } | null>(null)
  const [resizeStartSize, setResizeStartSize] = useState<{ width: number, height: number, x: number, y: number } | null>(null)
  const [templates, setTemplates] = useState<SeatMapTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<SeatMapTemplate | null>(null)
  const [templateConfig, setTemplateConfig] = useState<any>({})
  const [validationResults, setValidationResults] = useState<any[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [analytics, setAnalytics] = useState<any>({})
  const [showAnalytics, setShowAnalytics] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    if (sections.length > 0 && !rowConfig.section) {
      setRowConfig(prev => ({ ...prev, section: sections[0].id }))
    }
  }, [sections])

  const loadTemplates = async () => {
    const mockTemplates: SeatMapTemplate[] = [
      {
        id: 'stadium-grandstand',
        name: 'Estadio con Gradas y Tribunas',
        description: 'Layout tipo estadio con tribunas norte/sur y secciones numeradas como los partidos de fútbol',
        category: 'stadium',
        thumbnail: '/templates/stadium-grandstand.png',
        capacity: 4000,
        popularity: 100,
        tags: ['estadio', 'gradas', 'deportes', 'tribunas', 'partidos'],
        config: {
          type: 'stadium',
          hasTribunas: true,
          hasSections: true,
          hasStage: true
        },
        sections: []
      },
      {
        id: 'theater-classic',
        name: 'Teatro Clásico',
        description: 'Teatro tradicional con asientos numerados en filas',
        category: 'theater',
        thumbnail: '/templates/theater-classic.png',
        capacity: 500,
        popularity: 95,
        tags: ['teatro', 'clásico', 'numerado', 'filas'],
        config: {},
        sections: []
      },
      {
        id: 'stadium-style',
        name: 'Estilo Estadio Simple',
        description: 'Configuración tipo estadio con gradas básicas',
        category: 'stadium',
        thumbnail: '/templates/stadium-style.png',
        capacity: 1000,
        popularity: 88,
        tags: ['estadio', 'gradas', 'deportes'],
        config: {},
        sections: []
      }
    ]
    setTemplates(mockTemplates)
  }

  const saveToHistory = (action: string, data: any) => {
    const newState: HistoryState = {
      id: Date.now().toString(),
      timestamp: new Date(),
      action,
      data: JSON.parse(JSON.stringify(data))
    }
    
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newState)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      const state = history[historyIndex - 1]
      applyState(state.data)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      const state = history[historyIndex + 1]
      applyState(state.data)
    }
  }

  const applyState = (data: any) => {
    setSeats(data.seats || [])
    setSections(data.sections || [])
    setStage(data.stage || {})
    setNonSellableElements(data.nonSellableElements || [])
  }


  const handleCanvasMouseDown = (event: React.MouseEvent) => {
    if (!canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (event.clientX - rect.left - pan.x * zoom) / zoom
    const y = (event.clientY - rect.top - pan.y * zoom) / zoom
    
    if (selectedTool === 'pan' || event.button === 1) {
      setIsPanning(true)
      setPanStartPoint({ x: event.clientX - pan.x, y: event.clientY - pan.y })
      event.preventDefault()
      return
    }
    
    if (selectedTool === 'seat') {
      handleCanvasClick(event)
      return
    }
    
    if (selectedTool === 'circle' || selectedTool === 'rectangle' || selectedTool === 'stage') {
      setIsDrawingShape(true)
      setShapeStart({ x, y })
      setShapeEnd({ x, y })
      return
    }
    
    if (selectedTool === 'bathroom' || selectedTool === 'bathroom-men' || selectedTool === 'bathroom-women' || selectedTool === 'stairs' || selectedTool === 'exit' || selectedTool === 'entrance' || selectedTool === 'warning') {
      setIsDrawingShape(true)
      setShapeStart({ x, y })
      setShapeEnd({ x, y })
      return
    }
    
    if (selectedTool === 'text') {
      createTextElement(x, y)
      return
    }
    
    if (selectedTool === 'select') {
      setIsBoxSelecting(true)
      setBoxStart({ x, y })
      setBoxEnd({ x, y })
      
      if (!event.shiftKey) {
        setSelectedSeats([])
        setSelectedElements([])
      }
    }
  }

  const handleCanvasClick = (event: React.MouseEvent) => {
    if (selectedTool === 'seat' && canvasRef.current) {
      if (sections.length === 0) {
        toast({
          title: "Crea una sección primero",
          description: "Necesitas crear al menos una sección antes de agregar asientos.",
          variant: "destructive"
        })
        return
      }
      
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (event.clientX - rect.left - pan.x * zoom) / zoom
      const y = (event.clientY - rect.top - pan.y * zoom) / zoom
      
      const newSeat: Seat = {
        id: `seat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        x: snapToGrid ? Math.round(x / gridSize) * gridSize : x,
        y: snapToGrid ? Math.round(y / gridSize) * gridSize : y,
        section: sections[0]?.id || 'default',
        row: 'A',
        number: (seats.length + 1).toString(),
        price: sections[0]?.price || 0,
        type: 'Seat',
        status: 'available',
        isWheelchairAccessible: false,
        isHearingImpaired: false,
        isRestrictedView: false,
        hasExtraLegroom: false,
        customPrice: false,
        label: `A${seats.length + 1}`,
        displayLabel: `A${seats.length + 1}`,
        shape: selectedSeatShape
      }
      
      const newSeats = [...seats, newSeat]
      setSeats(newSeats)
      saveToHistory('add_seat', { seats: newSeats, sections, stage, nonSellableElements })
    }
  }

  const deleteSelectedSeats = () => {
    const newSeats = seats.filter(seat => !selectedSeats.includes(seat.id))
    setSeats(newSeats)
    setSelectedSeats([])
    saveToHistory('delete_seats', { seats: newSeats, sections, stage, nonSellableElements })
  }
  
  const moveSelectedSeats = (dx: number, dy: number) => {
    const newSeats = seats.map(seat => {
      if (selectedSeats.includes(seat.id)) {
        return {
          ...seat,
          x: snapToGrid ? Math.round((seat.x + dx) / gridSize) * gridSize : seat.x + dx,
          y: snapToGrid ? Math.round((seat.y + dy) / gridSize) * gridSize : seat.y + dy
        }
      }
      return seat
    })
    setSeats(newSeats)
  }
  
  const alignSelectedSeats = (alignment: 'left' | 'right' | 'top' | 'bottom' | 'center-v' | 'center-h') => {
    if (selectedSeats.length < 2) return
    
    const selectedSeatsData = seats.filter(s => selectedSeats.includes(s.id))
    
    switch (alignment) {
      case 'left':
        const leftMost = Math.min(...selectedSeatsData.map(s => s.x))
        setSeats(seats.map(s => selectedSeats.includes(s.id) ? { ...s, x: leftMost } : s))
        break
      case 'right':
        const rightMost = Math.max(...selectedSeatsData.map(s => s.x))
        setSeats(seats.map(s => selectedSeats.includes(s.id) ? { ...s, x: rightMost } : s))
        break
      case 'top':
        const topMost = Math.min(...selectedSeatsData.map(s => s.y))
        setSeats(seats.map(s => selectedSeats.includes(s.id) ? { ...s, y: topMost } : s))
        break
      case 'bottom':
        const bottomMost = Math.max(...selectedSeatsData.map(s => s.y))
        setSeats(seats.map(s => selectedSeats.includes(s.id) ? { ...s, y: bottomMost } : s))
        break
      case 'center-v':
        const avgX = selectedSeatsData.reduce((sum, s) => sum + s.x, 0) / selectedSeatsData.length
        setSeats(seats.map(s => selectedSeats.includes(s.id) ? { ...s, x: avgX } : s))
        break
      case 'center-h':
        const avgY = selectedSeatsData.reduce((sum, s) => sum + s.y, 0) / selectedSeatsData.length
        setSeats(seats.map(s => selectedSeats.includes(s.id) ? { ...s, y: avgY } : s))
        break
    }
    saveToHistory('align_seats', { seats, sections, stage, nonSellableElements })
  }
  
  const distributeSelectedSeats = (direction: 'horizontal' | 'vertical') => {
    if (selectedSeats.length < 3) return
    
    const selectedSeatsData = seats.filter(s => selectedSeats.includes(s.id)).sort((a, b) => 
      direction === 'horizontal' ? a.x - b.x : a.y - b.y
    )
    
    const first = selectedSeatsData[0]
    const last = selectedSeatsData[selectedSeatsData.length - 1]
    const totalDistance = direction === 'horizontal' ? last.x - first.x : last.y - first.y
    const interval = totalDistance / (selectedSeatsData.length - 1)
    
    selectedSeatsData.forEach((seat, index) => {
      if (index > 0 && index < selectedSeatsData.length - 1) {
        const newPosition = direction === 'horizontal' 
          ? first.x + (interval * index)
          : first.y + (interval * index)
        
        setSeats(seats.map(s => s.id === seat.id ? { ...s, [direction === 'horizontal' ? 'x' : 'y']: newPosition } : s))
      }
    })
    saveToHistory('distribute_seats', { seats, sections, stage, nonSellableElements })
  }

  const duplicateSelectedSeats = () => {
    const duplicatedSeats = selectedSeats.map(seatId => {
      const seat = seats.find(s => s.id === seatId)
      if (!seat) return null
      return {
        ...seat,
        id: `seat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        x: seat.x + 50,
        y: seat.y + 50,
        label: `${seat.label}-copy`,
        displayLabel: `${seat.displayLabel}-copy`
      }
    }).filter(Boolean) as Seat[]
    
    const newSeats = [...seats, ...duplicatedSeats]
    setSeats(newSeats)
    saveToHistory('duplicate_seats', { seats: newSeats, sections, stage, nonSellableElements })
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(template)
      generateFromTemplate(template)
    }
  }

  const generateFromTemplate = (template: SeatMapTemplate) => {
    if (template.id === 'stadium-grandstand') {
      const generatedSeats: Seat[] = []
      
      const sectionsToCreate: Section[] = [
        { id: '219', name: 'Sección 219', color: '#FB923C', price: 353600, type: 'General', capacity: 48, description: 'Sección 219 - Gradas laterales' },
        { id: '217', name: 'Sección 217', color: '#F59E0B', price: 353600, type: 'General', capacity: 48, description: 'Sección 217 - Gradas laterales' },
        { id: 'platea-norte', name: 'Platea Norte', color: '#3B82F6', price: 495000, type: 'VIP', capacity: 80, description: 'Platea Norte - Vista preferencial' },
        { id: 'platea-sur', name: 'Platea Sur', color: '#3B82F6', price: 495000, type: 'VIP', capacity: 80, description: 'Platea Sur - Vista preferencial' },
        { id: 'tribuna-norte', name: 'Tribuna Norte', color: '#10B981', price: 495000, type: 'Tribuna', capacity: 20, description: 'Tribuna Norte - Fan Zone' },
        { id: 'tribuna-sur', name: 'Tribuna Sur', color: '#10B981', price: 495000, type: 'Tribuna', capacity: 20, description: 'Tribuna Sur - Fan Zone' },
      ]
      
      let seatIndex = 0
      
      for (let row = 0; row < 8; row++) {
        for (let num = 0; num < 6; num++) {
          generatedSeats.push({
            id: `seat-219-${row}-${num}`,
            x: 200 + num * 30,
            y: 250 + row * 30,
            section: '219',
            row: (row + 1).toString(),
            number: (num + 1).toString(),
            price: 353600,
            type: 'Seat',
            status: 'available',
            isWheelchairAccessible: false,
            isHearingImpaired: false,
            isRestrictedView: false,
            hasExtraLegroom: false,
            customPrice: false,
            label: `${row + 1}-${num + 1}`,
            displayLabel: `${row + 1}-${num + 1}`,
            shape: 'circle'
          })
          seatIndex++
        }
      }
      
      for (let row = 0; row < 8; row++) {
        for (let num = 0; num < 6; num++) {
          generatedSeats.push({
            id: `seat-217-${row}-${num}`,
            x: 200 + num * 30,
            y: 550 + row * 30,
            section: '217',
            row: (row + 1).toString(),
            number: (num + 1).toString(),
            price: 353600,
            type: 'Seat',
            status: 'available',
            isWheelchairAccessible: false,
            isHearingImpaired: false,
            isRestrictedView: false,
            hasExtraLegroom: false,
            customPrice: false,
            label: `${row + 1}-${num + 1}`,
            displayLabel: `${row + 1}-${num + 1}`,
            shape: 'circle'
          })
          seatIndex++
        }
      }
      
      for (let i = 0; i < 20; i++) {
        generatedSeats.push({
          id: `seat-tribuna-norte-${i}`,
          x: 50 + i * 25,
          y: 80,
          section: 'tribuna-norte',
          row: '1',
          number: (i + 1).toString(),
          price: 495000,
          type: 'Seat',
          status: 'available',
          isWheelchairAccessible: false,
          isHearingImpaired: false,
          isRestrictedView: false,
          hasExtraLegroom: false,
          customPrice: false,
          label: `${i + 1}`,
          displayLabel: `${i + 1}`,
          shape: 'circle'
        })
        seatIndex++
      }
      
      for (let i = 0; i < 20; i++) {
        generatedSeats.push({
          id: `seat-tribuna-sur-${i}`,
          x: 50 + i * 25,
          y: 950,
          section: 'tribuna-sur',
          row: '1',
          number: (i + 1).toString(),
          price: 495000,
          type: 'Seat',
          status: 'available',
          isWheelchairAccessible: false,
          isHearingImpaired: false,
          isRestrictedView: false,
          hasExtraLegroom: false,
          customPrice: false,
          label: `${i + 1}`,
          displayLabel: `${i + 1}`,
          shape: 'circle'
        })
        seatIndex++
      }
      
      for (let row = 0; row < 8; row++) {
        for (let num = 0; num < 10; num++) {
          generatedSeats.push({
            id: `seat-platea-norte-${row}-${num}`,
            x: 400 + num * 25,
            y: 250 + row * 30,
            section: 'platea-norte',
            row: (row + 1).toString(),
            number: (num + 1).toString(),
            price: 495000,
            type: 'Seat',
            status: 'available',
            isWheelchairAccessible: false,
            isHearingImpaired: false,
            isRestrictedView: false,
            hasExtraLegroom: false,
            customPrice: false,
            label: `${row + 1}-${num + 1}`,
            displayLabel: `${row + 1}-${num + 1}`,
            shape: 'circle'
          })
          seatIndex++
        }
      }
      
      for (let row = 0; row < 8; row++) {
        for (let num = 0; num < 10; num++) {
          generatedSeats.push({
            id: `seat-platea-sur-${row}-${num}`,
            x: 700 + num * 25,
            y: 250 + row * 30,
            section: 'platea-sur',
            row: (row + 1).toString(),
            number: (num + 1).toString(),
            price: 495000,
            type: 'Seat',
            status: 'available',
            isWheelchairAccessible: false,
            isHearingImpaired: false,
            isRestrictedView: false,
            hasExtraLegroom: false,
            customPrice: false,
            label: `${row + 1}-${num + 1}`,
            displayLabel: `${row + 1}-${num + 1}`,
            shape: 'circle'
          })
          seatIndex++
        }
      }
      
      setSections(sectionsToCreate)
      setStage({
        x: 400,
        y: 100,
        width: 300,
        height: 100,
        label: 'CANCHA'
      })
      Promise.resolve().then(() => {
        setSections(sectionsToCreate)
        setStage({
          x: 400,
          y: 100,
          width: 300,
          height: 100,
          label: 'CANCHA'
        })
        setSeats(generatedSeats)
        
        setZoom(0.5)
        setPan({ x: -200, y: -200 })
      })
      
      toast({
        title: "Mapa tipo estadio generado",
        description: `Se generaron ${generatedSeats.length} asientos con layout tipo estadio (tribunas, gradas, secciones)`,
      })
    } else {
      const generatedSeats: Seat[] = []
      const seatCount = Math.min(template.capacity, 100)
      
      for (let i = 0; i < seatCount; i++) {
        const row = String.fromCharCode(65 + Math.floor(i / 10))
        const number = (i % 10) + 1
        
        generatedSeats.push({
          id: `seat-${i}`,
          x: 100 + (i % 10) * 30,
          y: 200 + Math.floor(i / 10) * 30,
          section: i < 20 ? 'vip' : 'general',
          row,
          number: number.toString(),
          price: i < 20 ? 500000 : 300000,
          type: 'Seat',
          status: 'available',
          isWheelchairAccessible: i % 20 === 0,
          isHearingImpaired: false,
          isRestrictedView: false,
          hasExtraLegroom: i < 20,
          customPrice: false,
          label: `${row}${number}`,
          displayLabel: `${row}${number}`,
          shape: 'circle'
        })
      }
      
      setSeats(generatedSeats)
      saveToHistory('generate_from_template', { 
        seats: generatedSeats, 
        sections, 
        stage, 
        nonSellableElements 
      })
      
      toast({
        title: "Mapa generado",
        description: `Se generaron ${generatedSeats.length} asientos desde la plantilla ${template.name}`,
      })
    }
  }

  const runValidation = async () => {
    setIsValidating(true)
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const results = [
      {
        id: 'orphan-1',
        type: 'warning',
        message: 'Asiento A15 está aislado',
        seatId: 'seat-14',
        severity: 'medium'
      },
      {
        id: 'accessibility-1',
        type: 'info',
        message: 'Se requiere al menos 2 asientos accesibles',
        severity: 'low'
      }
    ]
    
    setValidationResults(results)
    setIsValidating(false)
    
    toast({
      title: "Validación completada",
      description: `Se encontraron ${results.length} problemas`,
    })
  }

  const calculateAnalytics = () => {
    const totalSeats = seats.length
    const vipSeats = seats.filter(s => s.section === 'vip').length
    const generalSeats = seats.filter(s => s.section === 'general').length
    const accessibleSeats = seats.filter(s => s.isWheelchairAccessible).length
    const totalCapacity = sections.reduce((sum, section) => sum + section.capacity, 0)
    
    setAnalytics({
      totalSeats,
      vipSeats,
      generalSeats,
      accessibleSeats,
      totalCapacity,
      occupancyRate: 0,
      revenue: seats.reduce((sum, seat) => sum + seat.price, 0)
    })
  }

  const handleExport = (format: string) => {
    const data = {
      seats,
      sections,
      stage,
      nonSellableElements,
      layers,
      config: {
        zoom,
        pan,
        gridSize,
        snapToGrid
      }
    }
    
    if (onExport) {
      onExport(format)
    }
    toast({
      title: "Exportación iniciada",
      description: `Exportando en formato ${format}`,
    })
  }

  const handleSave = () => {
    const data = {
      seats,
      sections,
      stage,
      nonSellableElements,
      layers,
      config: {
        zoom,
        pan,
        gridSize,
        snapToGrid
      }
    }
    
    onSave(data)
    toast({
      title: "Mapa guardado",
      description: "El mapa de asientos se ha guardado exitosamente",
    })
  }
  
  const handleSaveElement = (updatedElement: any) => {
    if (updatedElement.type === 'table' || 
        updatedElement.type === 'text' || 
        updatedElement.type === 'restroom' || 
        updatedElement.type === 'restroom-men' || 
        updatedElement.type === 'restroom-women' || 
        updatedElement.type === 'stairs' || 
        updatedElement.type === 'exit' || 
        updatedElement.type === 'entrance' || 
        updatedElement.type === 'warning' || 
        updatedElement.capacity !== undefined) {
      setNonSellableElements(nonSellableElements.map(el => el.id === updatedElement.id ? updatedElement : el))
      saveToHistory('edit_element', { seats, sections, stage, nonSellableElements })
    } else {
      setSeats(seats.map(s => s.id === updatedElement.id ? updatedElement : s))
      saveToHistory('edit_seat', { seats, sections, stage, nonSellableElements })
    }
  }

  const getSeatIcon = (seat: Seat) => {
    if (seat.isWheelchairAccessible) return '♿'
    if (seat.hasExtraLegroom) return '★'
    if (seat.status === 'sold') return '✓'
    if (seat.status === 'reserved') return '⏰'
    return seat.number
  }

  const getSeatShapeClass = (shape?: string) => {
    switch (shape) {
      case 'circle':
        return 'rounded-full'
      case 'square':
        return 'rounded-none'
      case 'rectangle':
        return 'rounded-none'
      case 'hexagon':
        return 'clip-hexagon'
      case 'rounded-square':
        return 'rounded-md'
      default:
        return 'rounded-full'
    }
  }

  const getTableShapeStyle = (element: NonSellableElement) => {
    const baseStyle: React.CSSProperties = {
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      borderColor: element.color,
      backgroundColor: element.color + '30'
    }

    switch (element.shape) {
      case 'circle':
        return { ...baseStyle, borderRadius: '50%' }
      case 'oval':
        return { ...baseStyle, borderRadius: '50%' }
      case 'rounded-rectangle':
        return { ...baseStyle, borderRadius: '12px' }
      case 'hexagon':
        return { ...baseStyle, clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)' }
      case 'diamond':
        return { ...baseStyle, transform: 'rotate(45deg)' }
      case 'u-shape':
        return { ...baseStyle, borderRadius: '50% 50% 0 0' }
      case 'conference':
        return { ...baseStyle, borderRadius: '40px' }
      default:
        return baseStyle
    }
  }

  const getElementIcon = (type: NonSellableElement['type'], width: number, height: number) => {
    const iconSize = Math.min(width, height) * 0.7
    const iconStyle = { width: `${iconSize}px`, height: `${iconSize}px`, minWidth: '20px', minHeight: '20px' }
    
    switch (type) {
      case 'restroom':
        return <RestroomUnisexIcon className="flex-shrink-0" style={iconStyle} />
      case 'restroom-men':
        return <RestroomMenIcon className="flex-shrink-0" style={iconStyle} />
      case 'restroom-women':
        return <RestroomWomenIcon className="flex-shrink-0" style={iconStyle} />
      case 'stairs':
        return <StairsIcon className="flex-shrink-0" style={iconStyle} />
      case 'exit':
        return <EmergencyExitIcon className="flex-shrink-0" style={iconStyle} />
      case 'entrance':
        return <EntranceIcon className="flex-shrink-0" style={iconStyle} />
      case 'warning':
        return <WarningIcon className="flex-shrink-0" style={iconStyle} />
      default:
        return null
    }
  }

  const handleSeatMouseDown = (e: React.MouseEvent, seatId: string) => {
    if (selectedTool !== 'select') return
    
    e.stopPropagation()
    
    setSelectedElements([])
    
    const wasSelected = selectedSeats.includes(seatId)
    
    if (!wasSelected) {
      if (!e.shiftKey) {
        setSelectedSeats([seatId])
      } else {
        setSelectedSeats([...selectedSeats, seatId])
      }
      return
    }
    
    const seat = seats.find(s => s.id === seatId)
    if (seat && canvasRef.current && wasSelected) {
      const rect = canvasRef.current.getBoundingClientRect()
      const mouseX = (e.clientX - rect.left) / zoom
      const mouseY = (e.clientY - rect.top) / zoom
      
      setIsDraggingSeats(true)
      setDragOffset({
        x: mouseX - seat.x,
        y: mouseY - seat.y
      })
    }
  }

  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    if (selectedTool !== 'select') return
    
    e.stopPropagation()
    
    setSelectedSeats([])
    
    const wasSelected = selectedElements.includes(elementId)
    
    if (!wasSelected) {
      if (!e.shiftKey) {
        setSelectedElements([elementId])
      } else {
        setSelectedElements([...selectedElements, elementId])
      }
      return
    }
    
    const element = nonSellableElements.find(el => el.id === elementId)
    if (element && canvasRef.current && wasSelected) {
      const rect = canvasRef.current.getBoundingClientRect()
      const mouseX = (e.clientX - rect.left) / zoom
      const mouseY = (e.clientY - rect.top) / zoom
      
      setIsDraggingElements(true)
      setDragOffset({
        x: mouseX - element.x,
        y: mouseY - element.y
      })
    }
  }

  const handleResizeStart = (e: React.MouseEvent, elementId: string, handle: 'nw' | 'ne' | 'sw' | 'se') => {
    e.stopPropagation()
    
    if (!canvasRef.current) return
    
    const element = nonSellableElements.find(el => el.id === elementId)
    if (!element) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const mouseX = (e.clientX - rect.left - pan.x * zoom) / zoom
    const mouseY = (e.clientY - rect.top - pan.y * zoom) / zoom
    
    setIsResizingElement(true)
    setResizeHandle(handle)
    setResizeStartPoint({ x: mouseX, y: mouseY })
    setResizeStartSize({ 
      width: element.width, 
      height: element.height, 
      x: element.x, 
      y: element.y 
    })
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return
    
    if (isPanning) {
      const newPanX = e.clientX - panStartPoint.x
      const newPanY = e.clientY - panStartPoint.y
      setPan({ x: newPanX, y: newPanY })
      return
    }
    
    const rect = canvasRef.current.getBoundingClientRect()
    const mouseX = (e.clientX - rect.left - pan.x * zoom) / zoom
    const mouseY = (e.clientY - rect.top - pan.y * zoom) / zoom
    
    if (isResizingElement && resizeHandle && resizeStartPoint && resizeStartSize && selectedElements.length === 1) {
      const element = nonSellableElements.find(el => el.id === selectedElements[0])
      if (!element) return
      
      const deltaX = mouseX - resizeStartPoint.x
      const deltaY = mouseY - resizeStartPoint.y
      
      let newWidth = resizeStartSize.width
      let newHeight = resizeStartSize.height
      let newX = resizeStartSize.x
      let newY = resizeStartSize.y
      
      const minSize = 30
      
      switch (resizeHandle) {
        case "se":
          newWidth = Math.max(minSize, resizeStartSize.width + deltaX)
          newHeight = Math.max(minSize, resizeStartSize.height + deltaY)
          break
        case "sw":
          newWidth = Math.max(minSize, resizeStartSize.width - deltaX)
          newHeight = Math.max(minSize, resizeStartSize.height + deltaY)
          if (newWidth > minSize) newX = resizeStartSize.x + deltaX
          break
        case "ne":
          newWidth = Math.max(minSize, resizeStartSize.width + deltaX)
          newHeight = Math.max(minSize, resizeStartSize.height - deltaY)
          if (newHeight > minSize) newY = resizeStartSize.y + deltaY
          break
        case "nw":
          newWidth = Math.max(minSize, resizeStartSize.width - deltaX)
          newHeight = Math.max(minSize, resizeStartSize.height - deltaY)
          if (newWidth > minSize) newX = resizeStartSize.x + deltaX
          if (newHeight > minSize) newY = resizeStartSize.y + deltaY
          break
      }
      
      const newElements = nonSellableElements.map(el => 
        el.id === element.id 
          ? { ...el, width: newWidth, height: newHeight, x: newX, y: newY }
          : el
      )
      
      setNonSellableElements(newElements)
      return
    }
    
    if (isDrawingShape && shapeStart) {
      setShapeEnd({ x: mouseX, y: mouseY })
      return
    }
    
    if (isBoxSelecting && boxStart) {
      setBoxEnd({ x: mouseX, y: mouseY })
      
      const minX = Math.min(boxStart.x, mouseX)
      const maxX = Math.max(boxStart.x, mouseX)
      const minY = Math.min(boxStart.y, mouseY)
      const maxY = Math.max(boxStart.y, mouseY)
      
      const seatsInBox = seats
        .filter(seat => 
          seat.x >= minX && 
          seat.x <= maxX && 
          seat.y >= minY && 
          seat.y <= maxY
        )
        .map(seat => seat.id)
      
      if (e.shiftKey) {
        setSelectedSeats(prev => [...new Set([...prev, ...seatsInBox])])
      } else {
        setSelectedSeats(seatsInBox)
      }
      
      return
    }
    
    if (isDraggingSeats && selectedSeats.length > 0) {
      const firstSelectedSeat = seats.find(s => s.id === selectedSeats[0])
      if (!firstSelectedSeat) return
      
      const dx = mouseX - dragOffset.x - firstSelectedSeat.x
      const dy = mouseY - dragOffset.y - firstSelectedSeat.y
      
      const newSeats = seats.map(seat => {
        if (selectedSeats.includes(seat.id)) {
          const newX = snapToGrid ? Math.round((seat.x + dx) / gridSize) * gridSize : seat.x + dx
          const newY = snapToGrid ? Math.round((seat.y + dy) / gridSize) * gridSize : seat.y + dy
          return { ...seat, x: newX, y: newY }
        }
        return seat
      })
      
      setSeats(newSeats)
    }
    
    if (isDraggingElements && selectedElements.length > 0) {
      const firstSelectedElement = nonSellableElements.find(el => el.id === selectedElements[0])
      if (!firstSelectedElement) return
      
      const dx = mouseX - dragOffset.x - firstSelectedElement.x
      const dy = mouseY - dragOffset.y - firstSelectedElement.y
      
      const newElements = nonSellableElements.map(element => {
        if (selectedElements.includes(element.id)) {
          const newX = snapToGrid ? Math.round((element.x + dx) / gridSize) * gridSize : element.x + dx
          const newY = snapToGrid ? Math.round((element.y + dy) / gridSize) * gridSize : element.y + dy
          return { ...element, x: newX, y: newY }
        }
        return element
      })
      
      setNonSellableElements(newElements)
    }
  }

  const handleCanvasMouseUp = () => {
    if (isPanning) {
      setIsPanning(false)
    }
    
    if (isDraggingSeats) {
      setIsDraggingSeats(false)
      saveToHistory('move_seats', { seats, sections, stage, nonSellableElements })
    }
    
    if (isDraggingElements) {
      setIsDraggingElements(false)
      saveToHistory('move_elements', { seats, sections, stage, nonSellableElements })
    }
    
    if (isResizingElement) {
      setIsResizingElement(false)
      setResizeHandle(null)
      setResizeStartPoint(null)
      setResizeStartSize(null)
      saveToHistory('resize_element', { seats, sections, stage, nonSellableElements })
    }
    
    if (isBoxSelecting) {
      setIsBoxSelecting(false)
      setBoxStart(null)
      setBoxEnd(null)
    }
    
    if (isDrawingShape && shapeStart && shapeEnd) {
      createShape(selectedTool, shapeStart, shapeEnd)
      setIsDrawingShape(false)
      setShapeStart(null)
      setShapeEnd(null)
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
  }

  const createShape = (tool: string, start: { x: number, y: number }, end: { x: number, y: number }) => {
    const width = Math.abs(end.x - start.x)
    const height = Math.abs(end.y - start.y)
    const x = Math.min(start.x, end.x)
    const y = Math.min(start.y, end.y)
    
    if (width < 20 || height < 20) {
      toast({
        title: "Forma muy pequeña",
        description: "Dibuja una forma más grande",
        variant: "destructive"
      })
      return
    }
    
    if (tool === 'stage') {
      setStage({
        x: snapToGrid ? Math.round(x / gridSize) * gridSize : x,
        y: snapToGrid ? Math.round(y / gridSize) * gridSize : y,
        width: snapToGrid ? Math.round(width / gridSize) * gridSize : width,
        height: snapToGrid ? Math.round(height / gridSize) * gridSize : height,
        label: 'ESCENARIO'
      })
      
      saveToHistory('create_stage', { seats, sections, stage, nonSellableElements })
      
      toast({
        title: "Escenario creado",
        description: "Puedes moverlo o redimensionarlo después"
      })
    } else if (tool === 'circle' || tool === 'rectangle') {
      if (sections.length === 0) {
        toast({
          title: "Crea una sección primero",
          description: "Necesitas crear al menos una sección antes de agregar mesas.",
          variant: "destructive"
        })
        return
      }
      
      const tableNumber = nonSellableElements.filter(el => el.type === 'table').length + 1
      const newElement: NonSellableElement = {
        id: `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'table',
        x: snapToGrid ? Math.round(x / gridSize) * gridSize : x,
        y: snapToGrid ? Math.round(y / gridSize) * gridSize : y,
        width: snapToGrid ? Math.round(width / gridSize) * gridSize : width,
        height: snapToGrid ? Math.round(height / gridSize) * gridSize : height,
        label: `Mesa ${tableNumber}`,
        color: sections[0]?.color || '#9CA3AF',
        shape: tool === 'circle' ? 'circle' : selectedTableShape,
        section: sections[0]?.id,
        price: sections[0]?.price || 0,
        capacity: 4,
        number: tableNumber.toString(),
        status: 'available'
      }
      
      const newElements = [...nonSellableElements, newElement]
      setNonSellableElements(newElements)
      saveToHistory('create_table', { seats, sections, stage, nonSellableElements: newElements })
      
      toast({
        title: `${tool === 'circle' ? 'Mesa circular' : 'Mesa'} creada`,
        description: `Mesa ${tableNumber} - Capacidad: 4 personas - $${(sections[0]?.price || 0).toLocaleString()}`
      })
    } else if (tool === 'bathroom' || tool === 'bathroom-men' || tool === 'bathroom-women' || tool === 'stairs' || tool === 'exit' || tool === 'entrance' || tool === 'warning') {
      const labels: Record<string, string> = {
        bathroom: 'Baños',
        'bathroom-men': 'Baños Hombres',
        'bathroom-women': 'Baños Mujeres',
        stairs: 'Escaleras',
        exit: 'Salida',
        entrance: 'Entrada',
        warning: 'Advertencia'
      }
      
      const colors: Record<string, string> = {
        bathroom: '#06B6D4',
        'bathroom-men': '#3B82F6',
        'bathroom-women': '#EC4899',
        stairs: '#8B5CF6',
        exit: '#EF4444',
        entrance: '#10B981',
        warning: '#FBBF24'
      }
      
      const types: Record<string, NonSellableElement['type']> = {
        bathroom: 'restroom',
        'bathroom-men': 'restroom-men',
        'bathroom-women': 'restroom-women',
        stairs: 'stairs',
        exit: 'exit',
        entrance: 'entrance',
        warning: 'warning'
      }
      
      const newElement: NonSellableElement = {
        id: `${tool}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: types[tool],
        x: snapToGrid ? Math.round(x / gridSize) * gridSize : x,
        y: snapToGrid ? Math.round(y / gridSize) * gridSize : y,
        width: snapToGrid ? Math.round(width / gridSize) * gridSize : width,
        height: snapToGrid ? Math.round(height / gridSize) * gridSize : height,
        label: labels[tool],
        color: colors[tool],
        shape: 'rectangle'
      }
      
      const newElements = [...nonSellableElements, newElement]
      setNonSellableElements(newElements)
      saveToHistory('create_element', { seats, sections, stage, nonSellableElements: newElements })
      
      toast({
        title: `${labels[tool]} creado`,
        description: "Puedes moverlo o editarlo después"
      })
    }
    
    setSelectedTool('select')
  }

  const createTextElement = (x: number, y: number) => {
    const newElement: NonSellableElement = {
      id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      x: snapToGrid ? Math.round(x / gridSize) * gridSize : x,
      y: snapToGrid ? Math.round(y / gridSize) * gridSize : y,
      width: 100,
      height: 30,
      label: 'Texto',
      color: '#000000',
      fontSize: 16,
      fontWeight: 'normal'
    }
    
    const newElements = [...nonSellableElements, newElement]
    setNonSellableElements(newElements)
    saveToHistory('create_text', { seats, sections, stage, nonSellableElements: newElements })
    
    setSelectedElement(newElement)
    
    toast({
      title: "Texto creado",
      description: "Haz doble clic para editar el contenido"
    })
    
    setSelectedTool('select')
  }

  const handleBulkEdit = () => {
    if (selectedSeats.length === 0) {
      toast({
        title: "Sin selección",
        description: "Selecciona al menos un asiento para editar",
        variant: "destructive"
      })
      return
    }
    
    const firstSeat = seats.find(s => s.id === selectedSeats[0])
    if (firstSeat) {
      setBulkEditValues({
        section: firstSeat.section,
        price: firstSeat.price,
        status: firstSeat.status,
        isWheelchairAccessible: firstSeat.isWheelchairAccessible,
        isHearingImpaired: firstSeat.isHearingImpaired,
        isRestrictedView: firstSeat.isRestrictedView,
        hasExtraLegroom: firstSeat.hasExtraLegroom
      })
    }
    setShowBulkEditModal(true)
  }

  const applyBulkEdit = () => {
    const newSeats = seats.map(seat => {
      if (selectedSeats.includes(seat.id)) {
        return {
          ...seat,
          ...(bulkEditValues.section && { section: bulkEditValues.section }),
          ...(bulkEditValues.price !== undefined && { price: bulkEditValues.price }),
          ...(bulkEditValues.status && { status: bulkEditValues.status }),
          ...(bulkEditValues.isWheelchairAccessible !== undefined && { isWheelchairAccessible: bulkEditValues.isWheelchairAccessible }),
          ...(bulkEditValues.isHearingImpaired !== undefined && { isHearingImpaired: bulkEditValues.isHearingImpaired }),
          ...(bulkEditValues.isRestrictedView !== undefined && { isRestrictedView: bulkEditValues.isRestrictedView }),
          ...(bulkEditValues.hasExtraLegroom !== undefined && { hasExtraLegroom: bulkEditValues.hasExtraLegroom })
        }
      }
      return seat
    })
    
    setSeats(newSeats)
    saveToHistory('bulk_edit', { seats: newSeats, sections, stage, nonSellableElements })
    setShowBulkEditModal(false)
    
    toast({
      title: "Actualización completada",
      description: `Se actualizaron ${selectedSeats.length} asientos`
    })
  }

  const createRowsOfSeats = (config: typeof rowConfig, startX: number, startY: number) => {
    if (sections.length === 0) {
      toast({
        title: "Crea una sección primero",
        description: "Necesitas crear al menos una sección antes de crear filas de asientos.",
        variant: "destructive"
      })
      setShowRowModal(false)
      return
    }
    
    const newSeats: Seat[] = []
    const section = sections.find(s => s.id === config.section) || sections[0]
    
    for (let row = 0; row < config.rows; row++) {
      const rowLetter = String.fromCharCode(config.startRow.charCodeAt(0) + row)
      
      for (let seatNum = 0; seatNum < config.seatsPerRow; seatNum++) {
        const seatNumber = config.startNumber + seatNum
        
        let x = startX + (seatNum * config.seatSpacing)
        let y = startY + (row * config.rowSpacing)
        
        if (config.curved) {
          const centerSeat = (config.seatsPerRow - 1) / 2
          const distanceFromCenter = seatNum - centerSeat
          const normalizedDistance = distanceFromCenter / centerSeat // -1 a 1
          
          // Intensidad base de la curvatura (ajustable por el usuario)
          const baseIntensity = config.curveIntensity || 0.5
          
          // Intensidad progresiva: las filas más alejadas tienen más curvatura
          const rowProgressiveFactor = config.progressiveCurve 
            ? 1 + (row / (config.rows - 1)) * 0.5 // Aumenta de 1.0 a 1.5
            : 1
          
          const effectiveIntensity = baseIntensity * rowProgressiveFactor
          
          const direction = config.curveType === 'concave' ? -1 : 1
          
          let verticalCurveFactor = 0
          let horizontalCurveFactor = 0
          
          switch (config.curveStyle) {
            case 'circular':
              const radius = config.radius || 500
              const angle = normalizedDistance * Math.PI / 4 // ±45 grados máximo
              const arcDistance = radius * Math.sin(angle)
              verticalCurveFactor = radius * (1 - Math.cos(angle)) * effectiveIntensity
              horizontalCurveFactor = arcDistance * 0.3 * effectiveIntensity
              break
              
            case 'elliptical':
              const ellipseA = config.radius || 500 // Eje mayor
              const ellipseB = ellipseA * 0.6 // Eje menor
              const theta = Math.asin(normalizedDistance)
              verticalCurveFactor = ellipseB * (1 - Math.cos(theta)) * effectiveIntensity
              horizontalCurveFactor = Math.pow(Math.abs(normalizedDistance), 2.5) * 18 * effectiveIntensity
              break
              
            case 'parabolic':
              verticalCurveFactor = Math.pow(Math.abs(normalizedDistance), 2) * 
                                   (config.rowSpacing * 1.5) * 
                                   effectiveIntensity
              horizontalCurveFactor = Math.pow(Math.abs(normalizedDistance), 2.2) * 
                                     20 * 
                                     effectiveIntensity
              break
              
            case 'hyperbolic':
              const hyperbolicFactor = Math.pow(Math.abs(normalizedDistance), 3.5)
              verticalCurveFactor = hyperbolicFactor * 
                                   (config.rowSpacing * 2) * 
                                   effectiveIntensity
              horizontalCurveFactor = Math.pow(Math.abs(normalizedDistance), 3) * 
                                     25 * 
                                     effectiveIntensity
              break
          }
          
          y += direction * verticalCurveFactor
          x += normalizedDistance * horizontalCurveFactor
          
          // Compensación de espaciado para mantener distancia uniforme entre asientos
          // (esto evita que los asientos se amontonen en los extremos)
          if (Math.abs(normalizedDistance) > 0.3) {
            const spacingCompensation = Math.pow(Math.abs(normalizedDistance), 1.5) * 2
            x += (distanceFromCenter > 0 ? 1 : -1) * spacingCompensation
          }
        }
        
        newSeats.push({
          id: `seat-${Date.now()}-${row}-${seatNum}-${Math.random().toString(36).substr(2, 9)}`,
          x: snapToGrid ? Math.round(x / gridSize) * gridSize : x,
          y: snapToGrid ? Math.round(y / gridSize) * gridSize : y,
          section: config.section,
          row: rowLetter,
          number: seatNumber.toString(),
          price: section?.price || 300000,
          type: 'Seat',
          status: 'available',
          isWheelchairAccessible: false,
          isHearingImpaired: false,
          isRestrictedView: false,
          hasExtraLegroom: false,
          customPrice: false,
          label: `${rowLetter}${seatNumber}`,
          displayLabel: `${rowLetter}${seatNumber}`,
          shape: selectedSeatShape
        })
      }
    }
    
    const updatedSeats = [...seats, ...newSeats]
    setSeats(updatedSeats)
    
    const newSeatIds = newSeats.map(seat => seat.id)
    setSelectedSeats(newSeatIds)
    
    saveToHistory('create_rows', { seats: updatedSeats, sections, stage, nonSellableElements })
    
    toast({
      title: config.curved ? "✨ Filas curvas creadas" : "Filas creadas",
      description: `Se crearon ${config.rows} filas ${config.curved ? 'curvas' : 'rectas'} con ${config.seatsPerRow} asientos cada una. Total: ${newSeats.length} asientos seleccionados y listos para mover.`
    })
    
    setShowRowModal(false)
    setSelectedTool('select')
  }

  const handleCreateRows = () => {
    setRowConfig(tempRowConfig)
    
    const startX = 200
    const startY = 300
    createRowsOfSeats(tempRowConfig, startX, startY)
  }

  const handleAddSection = () => {
    setEditingSection({
      id: `section-${Date.now()}`,
      name: '',
      color: '#10B981',
      price: 0,
      type: 'General',
      capacity: 0,
      description: ''
    })
    setIsNewSection(true)
    setShowSectionModal(true)
  }

  const handleEditSection = (section: Section) => {
    setEditingSection({ ...section })
    setIsNewSection(false)
    setShowSectionModal(true)
  }

  const handleSaveSection = () => {
    if (!editingSection) return

    if (!editingSection.name || !editingSection.color) {
      toast({
        title: "Error",
        description: "El nombre y el color son obligatorios",
        variant: "destructive"
      })
      return
    }

    if (isNewSection) {
      setSections([...sections, editingSection])
      toast({
        title: "Sección creada",
        description: `La sección "${editingSection.name}" ha sido creada`
      })
    } else {
      setSections(sections.map(s => s.id === editingSection.id ? editingSection : s))
      
      const updatedSeats = seats.map(seat => 
        seat.section === editingSection.id 
          ? { ...seat, price: editingSection.price }
          : seat
      )
      setSeats(updatedSeats)
      
      toast({
        title: "Sección actualizada",
        description: `La sección "${editingSection.name}" ha sido actualizada`
      })
    }

    saveToHistory('edit_section', { seats, sections, stage, nonSellableElements })
    setShowSectionModal(false)
    setEditingSection(null)
  }

  const handleDeleteSection = (sectionId: string) => {
    const seatsInSection = seats.filter(s => s.section === sectionId).length
    
    if (seatsInSection > 0) {
      toast({
        title: "No se puede eliminar",
        description: `Hay ${seatsInSection} asientos usando esta sección. Reasígnalos primero.`,
        variant: "destructive"
      })
      return
    }

    setSections(sections.filter(s => s.id !== sectionId))
    saveToHistory('delete_section', { seats, sections, stage, nonSellableElements })
    
    toast({
      title: "Sección eliminada",
      description: "La sección ha sido eliminada exitosamente"
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header con herramientas principales */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Diseñador de Mapas de Asientos</h2>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Guardar
            </Button>
            <Button variant="outline" onClick={() => handleExport('json')}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Barra de herramientas */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Herramientas de historial */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
              <Undo className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
              <Redo className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Herramientas de selección y dibujo */}
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedTool === 'select' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTool('select')}
                  >
                    <MousePointer className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Seleccionar</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedTool === 'seat' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTool('seat')}
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Asiento Individual</TooltipContent>
              </Tooltip>
              {selectedTool === 'seat' && (
                <Select value={selectedSeatShape} onValueChange={(value: any) => setSelectedSeatShape(value)}>
                  <SelectTrigger className="h-8 w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="circle">⭕ Circular</SelectItem>
                    <SelectItem value="square">⬜ Cuadrado</SelectItem>
                    <SelectItem value="rectangle">▭ Rectangular</SelectItem>
                    <SelectItem value="rounded-square">▢ Cuadrado Redondeado</SelectItem>
                    <SelectItem value="hexagon">⬡ Hexagonal</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedTool === 'row' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSelectedTool('row')
                      setShowRowModal(true)
                    }}
                  >
                    <Layout className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Crear Filas</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedTool === 'circle' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTool('circle')}
                  >
                    <Circle className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mesa Circular</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedTool === 'rectangle' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTool('rectangle')}
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mesa Rectangular</TooltipContent>
              </Tooltip>
              {selectedTool === 'rectangle' && (
                <Select value={selectedTableShape} onValueChange={(value: any) => setSelectedTableShape(value)}>
                  <SelectTrigger className="h-8 w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rectangle">▭ Rectangular</SelectItem>
                    <SelectItem value="rounded-rectangle">▭ Rect. Redondeada</SelectItem>
                    <SelectItem value="oval">⬭ Ovalada</SelectItem>
                    <SelectItem value="hexagon">⬡ Hexagonal</SelectItem>
                    <SelectItem value="diamond">◆ Diamante</SelectItem>
                    <SelectItem value="u-shape">⊃ Forma U</SelectItem>
                    <SelectItem value="conference">▬ Conferencia</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedTool === 'stage' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTool('stage')}
                  >
                    <Theater className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Escenario</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedTool === 'pan' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTool('pan')}
                  >
                    <Move className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mover Canvas (Pan)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Herramientas de elementos decorativos */}
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedTool === 'bathroom' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTool('bathroom')}
                  >
                    <RestroomUnisexIcon className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Baños Unisex</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedTool === 'bathroom-men' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTool('bathroom-men')}
                  >
                    <RestroomMenIcon className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Baños Hombres</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedTool === 'bathroom-women' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTool('bathroom-women')}
                  >
                    <RestroomWomenIcon className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Baños Mujeres</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedTool === 'stairs' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTool('stairs')}
                  >
                    <StairsIcon className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Escaleras</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedTool === 'exit' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTool('exit')}
                  >
                    <EmergencyExitIcon className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Salida de Emergencia</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedTool === 'entrance' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTool('entrance')}
                  >
                    <EntranceIcon className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Entrada</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedTool === 'warning' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTool('warning')}
                  >
                    <WarningIcon className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Advertencia / Alerta</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedTool === 'text' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTool('text')}
                  >
                    <Type className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Agregar Texto</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Herramientas de zoom */}
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(0.1, zoom * 0.8))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium px-2">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(3, zoom * 1.2))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setZoom(1)
                setPan({ x: 0, y: 0 })
              }}
              title="Resetear vista"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Herramientas de vista */}
          <div className="flex items-center gap-1">
            <Button
              variant={showGrid ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={snapToGrid ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSnapToGrid(!snapToGrid)}
            >
              <Target className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          {/* Herramientas de transformación avanzadas */}
          {selectedSeats.length > 0 && (
            <>
              <Separator orientation="vertical" className="h-8" />
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => alignSelectedSeats('left')}
                        disabled={selectedSeats.length < 2}
                      >
                        <AlignLeft className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Alinear Izquierda</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => alignSelectedSeats('center-h')}
                        disabled={selectedSeats.length < 2}
                      >
                        <AlignVerticalJustifyCenter className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Centrar Horizontalmente</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => alignSelectedSeats('top')}
                        disabled={selectedSeats.length < 2}
                      >
                        <AlignVerticalJustifyStart className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Alinear Superior</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => distributeSelectedSeats('horizontal')}
                        disabled={selectedSeats.length < 3}
                      >
                        <AlignHorizontalJustifyCenter className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Distribuir Horizontalmente</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <Separator orientation="vertical" className="h-8" />
              
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={duplicateSelectedSeats}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkEdit} title="Editar valores">
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={deleteSelectedSeats}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
          
          {/* Herramientas para elementos seleccionados (mesas) */}
          {selectedElements.length > 0 && (
            <>
              <Separator orientation="vertical" className="h-8" />
              
              <div className="flex items-center gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    const newElements = nonSellableElements.filter(el => !selectedElements.includes(el.id))
                    setNonSellableElements(newElements)
                    setSelectedElements([])
                    saveToHistory('delete_elements', { seats, sections, stage, nonSellableElements: newElements })
                    toast({
                      title: "Elementos eliminados",
                      description: `Se eliminaron ${selectedElements.length} elemento(s)`
                    })
                  }}
                  title="Eliminar elementos"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <Badge variant="secondary" className="text-sm">
                {selectedElements.length} elemento{selectedElements.length > 1 ? 's' : ''} seleccionado{selectedElements.length > 1 ? 's' : ''}
              </Badge>
            </>
          )}
        </div>

      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex">
        {/* Panel lateral */}
        <div className="w-80 border-r bg-gray-50 p-4 space-y-4">
          {/* Capas */}
          <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Capas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {layers.map(layer => (
                      <div key={layer.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLayers(prev => prev.map(l => 
                              l.id === layer.id ? { ...l, visible: !l.visible } : l
                            ))}
                          >
                            {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </Button>
                          <span className="text-sm">{layer.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {layer.id === 'seats' ? seats.length : 
                           layer.id === 'stage' ? 1 : 
                           nonSellableElements.length}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Secciones */}
                <Card>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm">Secciones</CardTitle>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={handleAddSection}
                      className="h-6 w-6 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {sections.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-xs text-gray-500 mb-2">
                          No hay secciones creadas
                        </p>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={handleAddSection}
                          className="text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Crear Primera Sección
                        </Button>
                      </div>
                    ) : (
                      sections.map(section => (
                        <div key={section.id} className="flex items-center justify-between group">
                          <div className="flex items-center gap-2 flex-1">
                            <div 
                              className="w-4 h-4 rounded" 
                              style={{ backgroundColor: section.color }}
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{section.name}</div>
                              <div className="text-xs text-gray-500">
                                ${section.price.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleEditSection(section)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleDeleteSection(section.id)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Estadísticas */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Estadísticas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total asientos:</span>
                      <span className="font-medium">{seats.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Seleccionados:</span>
                      <span className="font-medium">{selectedSeats.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Capacidad:</span>
                      <span className="font-medium">
                        {sections.reduce((sum, s) => sum + s.capacity, 0)}
                      </span>
                    </div>
                  </CardContent>
              </Card>
            </div>

        {/* Canvas principal */}
        <div className="flex-1 relative overflow-hidden bg-gray-100">
                <div
                  ref={canvasRef}
                  className="absolute"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  onMouseLeave={handleCanvasMouseUp}
                  onWheel={handleWheel}
                  style={{
                    width: `${canvasSize.width}px`,
                    height: `${canvasSize.height}px`,
                    backgroundImage: showGrid ? 
                      `radial-gradient(circle, #e5e7eb 1px, transparent 1px)` : 
                      'none',
                    backgroundSize: `${gridSize}px ${gridSize}px`,
                    backgroundColor: '#ffffff',
                    transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                    transformOrigin: '0 0',
                    cursor: isPanning ? 'grabbing' : selectedTool === 'pan' ? 'grab' : 'crosshair'
                  }}
                >
                  {/* Escenario */}
                  {layers.find(l => l.id === 'stage')?.visible && (
                    <div
                      className="absolute bg-gray-800 text-white flex items-center justify-center text-sm font-bold border-2 border-gray-600"
                      style={{
                        left: `${stage.x}px`,
                        top: `${stage.y}px`,
                        width: `${stage.width}px`,
                        height: `${stage.height}px`
                      }}
                    >
                      {stage.label}
                    </div>
                  )}

                  {/* Asientos */}
                  {layers.find(l => l.id === 'seats')?.visible && seats.map(seat => (
                    <div
                      key={seat.id}
                      className={`absolute flex items-center justify-center text-white text-xs font-bold shadow-md hover:shadow-lg transition-all ${
                        getSeatShapeClass(seat.shape)
                      } ${
                        selectedSeats.includes(seat.id) 
                          ? 'ring-2 ring-blue-400 cursor-move' 
                          : 'cursor-pointer'
                      }`}
                      style={{
                        left: `${seat.x}px`,
                        top: `${seat.y}px`,
                        width: seat.shape === 'rectangle' ? '32px' : '24px',
                        height: '24px',
                        backgroundColor: seat.status === 'sold' 
                          ? '#EF4444' 
                          : seat.status === 'reserved'
                            ? '#F59E0B'
                            : sections.find(s => s.id === seat.section)?.color || '#10B981'
                      }}
                      onMouseDown={(e) => handleSeatMouseDown(e, seat.id)}
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        setSelectedElement(seat)
                      }}
                      title={`${seat.section} - Fila ${seat.row} - Asiento ${seat.number} - $${seat.price.toLocaleString()} - ${seat.status.toUpperCase()}`}
                    >
                      {getSeatIcon(seat)}
                      
                      {/* Indicadores especiales */}
                      {seat.isWheelchairAccessible && (
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-[8px]">♿</span>
                        </div>
                      )}
                      {seat.hasExtraLegroom && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-[8px]">★</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Elementos no vendibles */}
                  {layers.find(l => l.id === 'elements')?.visible && nonSellableElements.map(element => {
                    if (element.type === 'text') {
                      return (
                        <div
                          key={element.id}
                          className={`absolute flex items-center justify-center cursor-pointer transition-all ${
                            selectedElements.includes(element.id) ? 'ring-2 ring-blue-400' : ''
                          }`}
                          style={{
                            left: `${element.x}px`,
                            top: `${element.y}px`,
                            color: element.color || '#000000',
                            fontSize: `${element.fontSize || 16}px`,
                            fontWeight: element.fontWeight || 'normal',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                          onDoubleClick={(e) => {
                            e.stopPropagation()
                            setSelectedElement(element)
                          }}
                          title="Texto - Haz doble clic para editar"
                        >
                          {element.label}
                        </div>
                      )
                    }
                    
                    const isDecorative = element.type === 'restroom' || element.type === 'restroom-men' || element.type === 'restroom-women' || element.type === 'stairs' || element.type === 'exit' || element.type === 'entrance' || element.type === 'warning'
                    
                    if (isDecorative) {
                      const isSelected = selectedElements.includes(element.id)
                      return (
                        <React.Fragment key={element.id}>
                          <div
                            className={`absolute flex items-center justify-center transition-all ${
                              isSelected
                                ? 'ring-2 ring-blue-400 cursor-move'
                                : 'cursor-pointer'
                            }`}
                            style={{
                              left: `${element.x}px`,
                              top: `${element.y}px`,
                              width: `${element.width}px`,
                              height: `${element.height}px`,
                              color: '#000000'
                            }}
                            onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                            onDoubleClick={(e) => {
                              e.stopPropagation()
                              setSelectedElement(element)
                            }}
                            title={element.label}
                          >
                            {getElementIcon(element.type, element.width, element.height)}
                          </div>
                          
                          {/* Handles de redimensionamiento */}
                          {isSelected && selectedElements.length === 1 && (
                            <>
                              {/* Esquina superior izquierda */}
                              <div
                                className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-nw-resize hover:scale-125 transition-transform"
                                style={{
                                  left: `${element.x - 6}px`,
                                  top: `${element.y - 6}px`
                                }}
                                onMouseDown={(e) => handleResizeStart(e, element.id, 'nw')}
                              />
                              {/* Esquina superior derecha */}
                              <div
                                className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-ne-resize hover:scale-125 transition-transform"
                                style={{
                                  left: `${element.x + element.width - 6}px`,
                                  top: `${element.y - 6}px`
                                }}
                                onMouseDown={(e) => handleResizeStart(e, element.id, 'ne')}
                              />
                              {/* Esquina inferior izquierda */}
                              <div
                                className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-sw-resize hover:scale-125 transition-transform"
                                style={{
                                  left: `${element.x - 6}px`,
                                  top: `${element.y + element.height - 6}px`
                                }}
                                onMouseDown={(e) => handleResizeStart(e, element.id, 'sw')}
                              />
                              {/* Esquina inferior derecha */}
                              <div
                                className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-se-resize hover:scale-125 transition-transform"
                                style={{
                                  left: `${element.x + element.width - 6}px`,
                                  top: `${element.y + element.height - 6}px`
                                }}
                                onMouseDown={(e) => handleResizeStart(e, element.id, 'se')}
                              />
                            </>
                          )}
                        </React.Fragment>
                      )
                    }
                    
                    return (
                      <div
                        key={element.id}
                        className={`absolute border-2 border-dashed flex items-center justify-center text-xs font-semibold transition-all ${
                          selectedElements.includes(element.id)
                            ? 'ring-2 ring-green-400 cursor-move border-solid'
                            : 'cursor-pointer hover:border-solid'
                        }`}
                        style={{
                          ...getTableShapeStyle(element),
                          color: element.color
                        }}
                        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          setSelectedElement(element)
                        }}
                        title={element.section ? `${element.label} - Capacidad: ${element.capacity || 4} personas - Sección: ${sections.find(s => s.id === element.section)?.name} - $${(element.price || 0).toLocaleString()}` : element.label}
                      >
                        {element.label}
                        {element.capacity && (
                          <span className="ml-1 text-[10px] opacity-75">({element.capacity}p)</span>
                        )}
                      </div>
                    )
                  })}

                  {/* Preview de forma mientras se dibuja */}
                  {isDrawingShape && shapeStart && shapeEnd && (
                    <div
                      className={`absolute border-2 border-dashed border-purple-500 bg-purple-200 bg-opacity-20 pointer-events-none flex items-center justify-center text-xs font-semibold ${
                        selectedTool === 'circle' ? 'rounded-full' : ''
                      }`}
                      style={{
                        left: `${Math.min(shapeStart.x, shapeEnd.x)}px`,
                        top: `${Math.min(shapeStart.y, shapeEnd.y)}px`,
                        width: `${Math.abs(shapeEnd.x - shapeStart.x)}px`,
                        height: `${Math.abs(shapeEnd.y - shapeStart.y)}px`
                      }}
                    >
                      {selectedTool === 'stage' && 'ESCENARIO'}
                      {selectedTool === 'circle' && '⭕ Mesa'}
                      {selectedTool === 'rectangle' && '⬜ Mesa'}
                    </div>
                  )}

                  {/* Rectángulo de selección por área */}
                  {isBoxSelecting && boxStart && boxEnd && (
                    <div
                      className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-20 pointer-events-none"
                      style={{
                        left: `${Math.min(boxStart.x, boxEnd.x)}px`,
                        top: `${Math.min(boxStart.y, boxEnd.y)}px`,
                        width: `${Math.abs(boxEnd.x - boxStart.x)}px`,
                        height: `${Math.abs(boxEnd.y - boxStart.y)}px`
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

      {/* Modal de propiedades */}
      {selectedElement && (
        <PropertyEditor 
          element={selectedElement} 
          onClose={() => setSelectedElement(null)}
          onSave={handleSaveElement}
          sections={sections}
        />
      )}

      {/* Modal de edición masiva */}
      {showBulkEditModal && (
        <Dialog open={showBulkEditModal} onOpenChange={setShowBulkEditModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Editar {selectedSeats.length} asiento{selectedSeats.length > 1 ? 's' : ''}
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label>Sección</Label>
                <Select 
                  value={bulkEditValues.section} 
                  onValueChange={(value) => setBulkEditValues({ ...bulkEditValues, section: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sección" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map(section => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Precio</Label>
                <Input
                  type="number"
                  value={bulkEditValues.price || ''}
                  onChange={(e) => setBulkEditValues({ ...bulkEditValues, price: parseInt(e.target.value) || 0 })}
                  placeholder="Precio"
                />
              </div>

              <div>
                <Label>Estado</Label>
                <Select 
                  value={bulkEditValues.status} 
                  onValueChange={(value) => setBulkEditValues({ ...bulkEditValues, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="sold">Vendido</SelectItem>
                    <SelectItem value="reserved">Reservado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label className="mb-2 block">Características</Label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={bulkEditValues.isWheelchairAccessible || false}
                      onChange={(e) => setBulkEditValues({ ...bulkEditValues, isWheelchairAccessible: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Accesible silla de ruedas</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={bulkEditValues.isHearingImpaired || false}
                      onChange={(e) => setBulkEditValues({ ...bulkEditValues, isHearingImpaired: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Discapacidad auditiva</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={bulkEditValues.isRestrictedView || false}
                      onChange={(e) => setBulkEditValues({ ...bulkEditValues, isRestrictedView: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Vista restringida</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={bulkEditValues.hasExtraLegroom || false}
                      onChange={(e) => setBulkEditValues({ ...bulkEditValues, hasExtraLegroom: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Espacio extra</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBulkEditModal(false)}>
                Cancelar
              </Button>
              <Button onClick={applyBulkEdit}>
                Aplicar a {selectedSeats.length} asiento{selectedSeats.length > 1 ? 's' : ''}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de edición de secciones */}
      {showSectionModal && editingSection && (
        <Dialog open={showSectionModal} onOpenChange={setShowSectionModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {isNewSection ? 'Crear Nueva Sección' : 'Editar Sección'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>Nombre de la Sección</Label>
                <Input
                  value={editingSection.name}
                  onChange={(e) => setEditingSection({ ...editingSection, name: e.target.value })}
                  placeholder="ej. VIP, Platea, General"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select 
                    value={editingSection.type} 
                    onValueChange={(value) => setEditingSection({ ...editingSection, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VIP">VIP</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Tribuna">Tribuna</SelectItem>
                      <SelectItem value="Platea">Platea</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={editingSection.color}
                      onChange={(e) => setEditingSection({ ...editingSection, color: e.target.value })}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={editingSection.color}
                      onChange={(e) => setEditingSection({ ...editingSection, color: e.target.value })}
                      placeholder="#10B981"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Precio</Label>
                <Input
                  type="number"
                  value={editingSection.price}
                  onChange={(e) => setEditingSection({ ...editingSection, price: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Los asientos de esta sección tendrán este precio por defecto
                </p>
              </div>

              <div>
                <Label>Capacidad (opcional)</Label>
                <Input
                  type="number"
                  value={editingSection.capacity}
                  onChange={(e) => setEditingSection({ ...editingSection, capacity: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>

              <div>
                <Label>Descripción</Label>
                <Input
                  value={editingSection.description}
                  onChange={(e) => setEditingSection({ ...editingSection, description: e.target.value })}
                  placeholder="ej. Asientos VIP con vista privilegiada"
                />
              </div>

              {!isNewSection && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <strong>Nota:</strong> Al cambiar el precio, se actualizarán automáticamente todos los asientos de esta sección ({seats.filter(s => s.section === editingSection.id).length} asientos).
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <div>
                {!isNewSection && (
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      handleDeleteSection(editingSection.id)
                      setShowSectionModal(false)
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowSectionModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveSection}>
                  {isNewSection ? 'Crear Sección' : 'Guardar Cambios'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de creación de filas */}
      {showRowModal && (
        <Dialog open={showRowModal} onOpenChange={setShowRowModal}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>🪑 Crear Filas de Asientos</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div>
                <Label>Número de Filas</Label>
                <Input
                  type="number"
                  value={tempRowConfig.rows}
                  onChange={(e) => setTempRowConfig({ ...tempRowConfig, rows: parseInt(e.target.value) || 1 })}
                  min="1"
                  max="50"
                />
              </div>

              <div>
                <Label>Asientos por Fila</Label>
                <Input
                  type="number"
                  value={tempRowConfig.seatsPerRow}
                  onChange={(e) => setTempRowConfig({ ...tempRowConfig, seatsPerRow: parseInt(e.target.value) || 1 })}
                  min="1"
                  max="100"
                />
              </div>

              <div>
                <Label>Espaciado entre Filas</Label>
                <Input
                  type="number"
                  value={tempRowConfig.rowSpacing}
                  onChange={(e) => setTempRowConfig({ ...tempRowConfig, rowSpacing: parseInt(e.target.value) || 20 })}
                  min="20"
                  max="200"
                />
              </div>

              <div>
                <Label>Espaciado entre Asientos</Label>
                <Input
                  type="number"
                  value={tempRowConfig.seatSpacing}
                  onChange={(e) => setTempRowConfig({ ...tempRowConfig, seatSpacing: parseInt(e.target.value) || 20 })}
                  min="20"
                  max="100"
                />
              </div>

              <div>
                <Label>Fila Inicial</Label>
                <Input
                  type="text"
                  maxLength={1}
                  value={tempRowConfig.startRow}
                  onChange={(e) => setTempRowConfig({ ...tempRowConfig, startRow: e.target.value.toUpperCase() || 'A' })}
                  placeholder="A"
                />
              </div>

              <div>
                <Label>Número Inicial</Label>
                <Input
                  type="number"
                  value={tempRowConfig.startNumber}
                  onChange={(e) => setTempRowConfig({ ...tempRowConfig, startNumber: parseInt(e.target.value) || 1 })}
                  min="1"
                />
              </div>

              <div>
                <Label>Sección</Label>
                {sections.length === 0 ? (
                  <div className="text-xs text-red-500 mt-2 p-2 bg-red-50 rounded">
                    ⚠️ No hay secciones creadas. Crea una sección primero.
                  </div>
                ) : (
                  <Select 
                    value={tempRowConfig.section} 
                    onValueChange={(value) => setTempRowConfig({ ...tempRowConfig, section: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map(section => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="col-span-2 space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={tempRowConfig.curved}
                    onChange={(e) => setTempRowConfig({ ...tempRowConfig, curved: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Filas Curvas</span>
                </label>
                
                {/* Controles adicionales cuando las filas curvas están activadas */}
                {tempRowConfig.curved && (
                  <div className="ml-6 space-y-4 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 shadow-sm">
                    
                    <div>
                      <Label className="text-xs font-semibold text-gray-700">Tipo de Curva</Label>
                      <Select 
                        value={tempRowConfig.curveStyle} 
                        onValueChange={(value: 'elliptical' | 'circular' | 'parabolic' | 'hyperbolic') => setTempRowConfig({ ...tempRowConfig, curveStyle: value })}
                      >
                        <SelectTrigger className="h-9 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="elliptical">
                            <span className="font-medium">Suave (Recomendada)</span>
                          </SelectItem>
                          <SelectItem value="circular">
                            <span className="font-medium">Arco Circular</span>
                          </SelectItem>
                          <SelectItem value="parabolic">
                            <span className="font-medium">Clásica</span>
                          </SelectItem>
                          <SelectItem value="hyperbolic">
                            <span className="font-medium">Muy Curva</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-xs font-semibold text-gray-700">Intensidad de Curvatura</Label>
                        <Badge variant="secondary" className="text-xs font-bold">
                          {Math.round(tempRowConfig.curveIntensity * 100)}%
                        </Badge>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={tempRowConfig.curveIntensity}
                        onChange={(e) => setTempRowConfig({ ...tempRowConfig, curveIntensity: parseFloat(e.target.value) })}
                        className="w-full h-3 bg-gradient-to-r from-blue-200 to-purple-400 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #8b5cf6 ${tempRowConfig.curveIntensity * 100}%, #e5e7eb ${tempRowConfig.curveIntensity * 100}%, #e5e7eb 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-gray-600 mt-1 font-medium">
                        <span>Mínima</span>
                        <span>Media</span>
                        <span>Máxima</span>
                      </div>
                    </div>
                    
                    {(tempRowConfig.curveStyle === 'circular' || tempRowConfig.curveStyle === 'elliptical') && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <Label className="text-xs font-semibold text-gray-700">Radio de Curvatura</Label>
                          <span className="text-xs font-medium text-purple-600">{tempRowConfig.radius}px</span>
                        </div>
                        <input
                          type="range"
                          min="200"
                          max="1000"
                          step="50"
                          value={tempRowConfig.radius}
                          onChange={(e) => setTempRowConfig({ ...tempRowConfig, radius: parseInt(e.target.value) })}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Cerrado</span>
                          <span>Amplio</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2 pt-2 border-t border-blue-300">
                      <input
                        type="checkbox"
                        checked={tempRowConfig.progressiveCurve}
                        onChange={(e) => setTempRowConfig({ ...tempRowConfig, progressiveCurve: e.target.checked })}
                        className="rounded"
                        id="progressiveCurve"
                      />
                      <Label htmlFor="progressiveCurve" className="text-xs cursor-pointer">
                        <span className="font-semibold">Curvatura Progresiva</span>
                        <span className="text-gray-600 ml-1">(Las filas traseras se curvan más)</span>
                      </Label>
                    </div>
                    
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700 text-center">
                <strong>Total: {tempRowConfig.rows * tempRowConfig.seatsPerRow} asientos</strong>
                {tempRowConfig.curved && ` · Filas curvas`}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRowModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateRows}>
                <Layout className="w-4 h-4 mr-2" />
                Crear Filas
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
