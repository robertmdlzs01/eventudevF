"use client"

import { useRouter } from "next/navigation"
import { getAdminEvent, updateAdminEvent } from "@/app/admin/actions"
import { EventForm } from "@/components/admin/event-form"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"
import type { AdminEvent } from "@/app/admin/actions" // Importar AdminEvent desde actions

interface AdminEditEventPageProps {
  params: {
    id: string
  }
}

export default function AdminEditEventPageClient({ params }: AdminEditEventPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [event, setEvent] = useState<AdminEvent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const fetchedEvent = await getAdminEvent(params.id)
        setEvent(fetchedEvent)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "No se pudo cargar el evento.",
          variant: "destructive",
        })
        router.push("/admin/eventos") // Redirect if event not found
      } finally {
        setIsLoading(false)
      }
    }
    fetchEvent()
  }, [params.id, router, toast])

  const handleSubmit = async (eventData: Partial<AdminEvent>) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('id', params.id)
      Object.entries(eventData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })
      await updateAdminEvent(formData)
      toast({
        title: "Evento Actualizado",
        description: `El evento "${eventData.title || event?.title}" ha sido actualizado exitosamente.`,
      })
      router.push("/admin/eventos")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al actualizar el evento.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push("/admin/eventos")
  }

  if (isLoading) {
    return <div className="text-center py-8">Cargando evento...</div>
  }

  if (!event) {
    return <div className="text-center py-8 text-red-500">Evento no encontrado.</div>
  }

  return (
    <div className="container mx-auto py-8">
      <EventForm event={event} onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isSubmitting} />
    </div>
  )
}
