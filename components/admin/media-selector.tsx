"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MediaGallery } from "./media-gallery"
import { ImageIcon } from "lucide-react"

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

interface MediaSelectorProps {
  onSelect: (files: MediaFile[]) => void
  multiple?: boolean
  fileTypes?: ("image" | "video" | "audio" | "document")[]
  children?: React.ReactNode
}

// Mock data - in real app this would come from API
const mockMediaFiles: MediaFile[] = [
  {
    id: "1",
    name: "eventu-logo.svg",
    type: "image",
    size: 15420,
    url: "/images/eventu-logo.svg",
    uploadDate: "2024-08-15",
    alt: "Logo de Eventu",
    description: "Logo principal de la plataforma",
    tags: ["logo", "branding"],
  },
  {
    id: "2",
    name: "panaca-poster.jpg",
    type: "image",
    size: 245680,
    url: "/placeholder.jpg",
    uploadDate: "2024-08-14",
    alt: "Poster del evento Panaca",
    description: "Imagen promocional del evento Panaca",
    tags: ["evento", "poster", "panaca"],
  },
  {
    id: "3",
    name: "seat-map-example-1.png",
    type: "image",
    size: 89340,
    url: "/images/seat-map-example-1.png",
    uploadDate: "2024-08-13",
    alt: "Ejemplo de mapa de asientos",
    description: "Plantilla de mapa de asientos para eventos",
    tags: ["mapa", "asientos", "plantilla"],
  },
]

export function MediaSelector({ onSelect, multiple = false, fileTypes, children }: MediaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])

  const filteredFiles = fileTypes ? mockMediaFiles.filter((file) => fileTypes.includes(file.type)) : mockMediaFiles

  const handleSelectionChange = (selectedIds: string[]) => {
    if (multiple) {
      setSelectedFiles(selectedIds)
    } else {
      setSelectedFiles(selectedIds.slice(-1)) // Keep only the last selected
    }
  }

  const handleConfirm = () => {
    const selected = filteredFiles.filter((file) => selectedFiles.includes(file.id))
    onSelect(selected)
    setIsOpen(false)
    setSelectedFiles([])
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline">
            <ImageIcon className="h-4 w-4 mr-2" />
            Seleccionar imagen
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Seleccionar {multiple ? "archivos" : "archivo"}
            {selectedFiles.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({selectedFiles.length} seleccionado{selectedFiles.length !== 1 ? "s" : ""})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <MediaGallery
            files={filteredFiles}
            selectable={true}
            selectedFiles={selectedFiles}
            onSelectionChange={handleSelectionChange}
            viewMode="grid"
            showFilters={true}
          />

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={selectedFiles.length === 0}>
              Seleccionar ({selectedFiles.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
