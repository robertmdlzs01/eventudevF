"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MediaSelector } from "./media-selector"
import { X } from "lucide-react"

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

interface EventFormData {
  title: string
  description: string
  date: string
  location: string
  price: string
  capacity: string
  category: string
  images: MediaFile[]
}

export function EventFormWithMedia() {
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    description: "",
    date: "",
    location: "",
    price: "",
    capacity: "",
    category: "",
    images: [],
  })

  const handleImageSelect = (files: MediaFile[]) => {
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }))
  }

  const removeImage = (imageId: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.id !== imageId),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Event data:", formData)
    // Handle form submission
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Evento con Medios</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título del Evento</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Nombre del evento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="datetime-local"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción del evento"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="Lugar del evento"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Precio</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidad</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData((prev) => ({ ...prev, capacity: e.target.value }))}
                placeholder="100"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Imágenes del Evento</Label>
              <MediaSelector onSelect={handleImageSelect} multiple={true} fileTypes={["image"]}>
                <Button type="button" variant="outline">
                  Seleccionar Imágenes
                </Button>
              </MediaSelector>
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.url || "/placeholder.svg"}
                      alt={image.alt || image.originalName || image.name}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(image.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{image.originalName || image.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
            <Button type="submit">Crear Evento</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
