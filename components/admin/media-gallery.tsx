"use client"
import { useState } from "react"
import { Search, Grid, List, Eye, Check, X, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface MediaFile {
  id: string
  name: string
  originalName?: string
  type: "image" | "video" | "audio" | "document"
  size: number
  url: string
  uploadDate: string
  alt?: string
  description?: string
  tags: string[]
}

interface MediaGalleryProps {
  files: MediaFile[]
  selectable?: boolean
  selectedFiles?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  onFileSelect?: (file: MediaFile) => void
  viewMode?: "grid" | "list"
  showFilters?: boolean
}

export function MediaGallery({
  files,
  selectable = false,
  selectedFiles = [],
  onSelectionChange,
  onFileSelect,
  viewMode: initialViewMode = "grid",
  showFilters = true,
}: MediaGalleryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedDateRange, setSelectedDateRange] = useState<string>("all")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">(initialViewMode)
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null)

  // Get all unique tags from files
  const allTags = Array.from(new Set(files.flatMap((file) => file.tags))).sort()

  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (file.originalName && file.originalName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      file.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (file.description && file.description.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = selectedType === "all" || file.type === selectedType

    const matchesDateRange = (() => {
      if (selectedDateRange === "all") return true
      const fileDate = new Date(file.uploadDate)
      const now = new Date()
      const daysDiff = Math.floor((now.getTime() - fileDate.getTime()) / (1000 * 60 * 60 * 24))

      switch (selectedDateRange) {
        case "today":
          return daysDiff === 0
        case "week":
          return daysDiff <= 7
        case "month":
          return daysDiff <= 30
        case "year":
          return daysDiff <= 365
        default:
          return true
      }
    })()

    const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => file.tags.includes(tag))

    return matchesSearch && matchesType && matchesDateRange && matchesTags
  })

  const handleFileClick = (file: MediaFile) => {
    if (selectable && onSelectionChange) {
      const isSelected = selectedFiles.includes(file.id)
      const newSelection = isSelected ? selectedFiles.filter((id) => id !== file.id) : [...selectedFiles, file.id]
      onSelectionChange(newSelection)
    } else if (onFileSelect) {
      onFileSelect(file)
    } else {
      setPreviewFile(file)
    }
  }

  const handleSelectAll = () => {
    if (!selectable || !onSelectionChange) return

    const allFilteredIds = filteredFiles.map((file) => file.id)
    const allSelected = allFilteredIds.every((id) => selectedFiles.includes(id))

    if (allSelected) {
      onSelectionChange(selectedFiles.filter((id) => !allFilteredIds.includes(id)))
    } else {
      onSelectionChange([...new Set([...selectedFiles, ...allFilteredIds])])
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return "🖼️"
      case "video":
        return "🎥"
      case "audio":
        return "🎵"
      default:
        return "📄"
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      {showFilters && (
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar archivos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="image">Imágenes</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="document">Documentos</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las fechas</SelectItem>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mes</SelectItem>
                  <SelectItem value="year">Este año</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              {selectable && (
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  <Check className="h-4 w-4 mr-2" />
                  Seleccionar todo
                </Button>
              )}
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtrar por etiquetas:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => {
                      setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
                {selectedTags.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTags([])} className="h-6 px-2 text-xs">
                    <X className="h-3 w-3 mr-1" />
                    Limpiar
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredFiles.length} archivo{filteredFiles.length !== 1 ? "s" : ""} encontrado
          {filteredFiles.length !== 1 ? "s" : ""}
          {selectable && selectedFiles.length > 0 && (
            <span className="ml-2 font-medium">
              ({selectedFiles.length} seleccionado{selectedFiles.length !== 1 ? "s" : ""})
            </span>
          )}
        </p>
      </div>

      {/* Media Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredFiles.map((file) => {
            const isSelected = selectedFiles.includes(file.id)
            return (
              <Card
                key={file.id}
                className={`group hover:shadow-md transition-all cursor-pointer ${
                  isSelected ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => handleFileClick(file)}
              >
                <CardContent className="p-3">
                  <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden relative">
                    {file.type === "image" ? (
                      <img
                        src={file.url || "/placeholder.svg"}
                        alt={file.alt || file.originalName || file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        {getFileIcon(file.type)}
                      </div>
                    )}

                    {selectable && (
                      <div className="absolute top-2 left-2">
                        <Checkbox checked={isSelected} className="bg-white/90 border-2" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button size="sm" variant="secondary">
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-medium truncate" title={file.originalName || file.name}>
                      {file.originalName || file.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {file.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                    </div>
                    {file.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {file.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                            {tag}
                          </Badge>
                        ))}
                        {file.tags.length > 2 && (
                          <span className="text-xs text-muted-foreground">+{file.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFiles.map((file) => {
            const isSelected = selectedFiles.includes(file.id)
            return (
              <Card
                key={file.id}
                className={`hover:shadow-sm transition-all cursor-pointer ${isSelected ? "ring-2 ring-primary" : ""}`}
                onClick={() => handleFileClick(file)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {selectable && <Checkbox checked={isSelected} className="flex-shrink-0" />}

                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      {file.type === "image" ? (
                        <img
                          src={file.url || "/placeholder.svg"}
                          alt={file.alt || file.originalName || file.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-xl">{getFileIcon(file.type)}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.originalName || file.name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span>{file.uploadDate}</span>
                        <Badge variant="secondary" className="text-xs">
                          {file.type}
                        </Badge>
                      </div>
                      {file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {file.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewFile?.originalName || previewFile?.name}</DialogTitle>
          </DialogHeader>
          {previewFile && (
            <div className="space-y-4">
              <div className="flex justify-center">
                {previewFile.type === "image" ? (
                  <img
                    src={previewFile.url || "/placeholder.svg"}
                    alt={previewFile.alt || previewFile.originalName || previewFile.name}
                    className="max-w-full max-h-96 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-6xl">{getFileIcon(previewFile.type)}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Tipo:</strong> {previewFile.type}
                </div>
                <div>
                  <strong>Tamaño:</strong> {formatFileSize(previewFile.size)}
                </div>
                <div>
                  <strong>Fecha de subida:</strong> {previewFile.uploadDate}
                </div>
                <div>
                  <strong>URL:</strong>
                  <code className="ml-1 text-xs bg-muted px-1 rounded">{previewFile.url}</code>
                </div>
              </div>

              {previewFile.description && (
                <div>
                  <strong>Descripción:</strong>
                  <p className="mt-1 text-muted-foreground">{previewFile.description}</p>
                </div>
              )}

              {previewFile.tags.length > 0 && (
                <div>
                  <strong>Etiquetas:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {previewFile.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
