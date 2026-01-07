"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Printer, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { TicketTemplate, TicketData } from "@/lib/ticket-templates"
import { ticketTemplateService } from "@/lib/ticket-template-service"
import { printService } from "@/lib/print-service"

interface TicketPrintDialogProps {
  ticketData: TicketData
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function TicketPrintDialog({ ticketData, trigger, open, onOpenChange }: TicketPrintDialogProps) {
  const [templates, setTemplates] = useState<TicketTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(open || false)

  // Sincronizar con prop open
  useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open)
    }
  }, [open])

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

  const loadTemplates = async () => {
    try {
      const loaded = await ticketTemplateService.getTemplates()
      setTemplates(loaded)
      
      // Seleccionar plantilla por defecto
      const defaultTemplate = loaded.find(t => t.isDefault) || loaded[0]
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id)
      }
    } catch (error) {
      console.error("Error cargando plantillas:", error)
    }
  }

  const handlePrint = async () => {
    if (!selectedTemplateId) {
      toast({
        title: "Error",
        description: "Selecciona una plantilla",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const template = await ticketTemplateService.getTemplate(selectedTemplateId)
      if (!template) {
        throw new Error("Plantilla no encontrada")
      }

      const success = await printService.printTicketWithTemplate(template, ticketData as TicketData)
      
      if (success) {
        toast({
          title: "Éxito",
          description: "Boleto enviado a impresión",
        })
        setIsOpen(false)
        onOpenChange?.(false)
      } else {
        throw new Error("Error al imprimir")
      }
    } catch (error) {
      console.error("Error imprimiendo:", error)
      toast({
        title: "Error",
        description: "No se pudo imprimir el boleto. Verifica que QZ Tray esté instalado y funcionando.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    onOpenChange?.(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Imprimir Boleto</DialogTitle>
          <DialogDescription>
            Selecciona una plantilla para imprimir el boleto
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Plantilla</Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar plantilla" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                    {template.isDefault && " (Por Defecto)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Tamaño:</strong> {selectedTemplate.measurements.width} × {selectedTemplate.measurements.height} {selectedTemplate.measurements.unit}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Campos:</strong> {selectedTemplate.fields.length}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePrint} disabled={isLoading || !selectedTemplateId}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Imprimiendo...
                </>
              ) : (
                <>
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


