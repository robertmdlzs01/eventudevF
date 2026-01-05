"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Star, Crown, Users, Building, Zap } from "lucide-react"
import { SEAT_MAP_TEMPLATES, getTemplatesByCategory, getPopularTemplates, searchTemplates } from "@/lib/seat-map-templates"
import { SeatMapTemplate } from "@/lib/seat-map-types"

interface SeatMapTemplateSelectorProps {
  onTemplateSelect: (template: SeatMapTemplate) => void
  disabled?: boolean
}

export default function SeatMapTemplateSelector({ onTemplateSelect, disabled = false }: SeatMapTemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isOpen, setIsOpen] = useState(false)

  const categories = [
    { value: "all", label: "Todos", icon: Zap },
    { value: "theater", label: "Teatro", icon: Star },
    { value: "arena", label: "Arena", icon: Crown },
    { value: "stadium", label: "Estadio", icon: Building },
    { value: "conference", label: "Conferencia", icon: Users }
  ]

  const filteredTemplates = searchQuery 
    ? searchTemplates(searchQuery)
    : selectedCategory === "all"
    ? SEAT_MAP_TEMPLATES
    : getTemplatesByCategory(selectedCategory)

  const popularTemplates = getPopularTemplates(4)

  const handleTemplateSelect = (template: SeatMapTemplate) => {
    onTemplateSelect(template)
    setIsOpen(false)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "theater":
        return <Star className="w-4 h-4" />
      case "arena":
        return <Crown className="w-4 h-4" />
      case "stadium":
        return <Building className="w-4 h-4" />
      case "conference":
        return <Users className="w-4 h-4" />
      default:
        return <Zap className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "theater":
        return "bg-purple-100 text-purple-800"
      case "arena":
        return "bg-blue-100 text-blue-800"
      case "stadium":
        return "bg-green-100 text-green-800"
      case "conference":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} className="w-full">
          <Zap className="w-4 h-4 mr-2" />
          Seleccionar Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Seleccionar Template de Mapa de Asientos</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Búsqueda y filtros */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => {
                  const Icon = category.icon
                  return (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {category.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="popular" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="popular">Populares</TabsTrigger>
              <TabsTrigger value="all">Todos</TabsTrigger>
            </TabsList>

            <TabsContent value="popular" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {popularTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={handleTemplateSelect}
                    getCategoryIcon={getCategoryIcon}
                    getCategoryColor={getCategoryColor}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No se encontraron templates que coincidan con tu búsqueda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onSelect={handleTemplateSelect}
                      getCategoryIcon={getCategoryIcon}
                      getCategoryColor={getCategoryColor}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface TemplateCardProps {
  template: SeatMapTemplate
  onSelect: (template: SeatMapTemplate) => void
  getCategoryIcon: (category: string) => React.ReactNode
  getCategoryColor: (category: string) => string
}

function TemplateCard({ template, onSelect, getCategoryIcon, getCategoryColor }: TemplateCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelect(template)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
          </div>
          <Badge className={getCategoryColor(template.category)}>
            {getCategoryIcon(template.category)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Estadísticas del template */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Capacidad:</span>
            <span className="font-medium">{template.config.venue?.capacity?.toLocaleString() || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Secciones:</span>
            <span className="font-medium">{template.sections.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Popularidad:</span>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="font-medium">{template.popularity}%</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>

          {/* Botón de selección */}
          <Button className="w-full mt-3" size="sm">
            Usar Template
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
