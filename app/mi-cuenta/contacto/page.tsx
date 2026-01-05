"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, User, Mail, Phone, MapPin, Globe, Building, Edit, Save, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"

interface ContactInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  company: string
  website: string
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  }
}

export default function ContactoPage() {
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "Colombia",
    postalCode: "",
    company: "",
    website: "",
    emergencyContact: {
      name: "",
      phone: "",
      relationship: ""
    }
  })
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Cargar información del usuario actual
    const userStr = localStorage.getItem("current_user")
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setContactInfo(prev => ({
          ...prev,
          firstName: user.first_name || "",
          lastName: user.last_name || "",
          email: user.email || "",
          phone: user.phone || ""
        }))
      } catch (error) {
        console.error("Error loading user data:", error)
      }
    }

    // Cargar información de contacto guardada
    const savedContact = localStorage.getItem("contact_info")
    if (savedContact) {
      try {
        const saved = JSON.parse(savedContact)
        setContactInfo(prev => ({ ...prev, ...saved }))
      } catch (error) {
        console.error("Error loading contact info:", error)
      }
    }
  }, [])

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setContactInfo(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof ContactInfo] as Record<string, any> || {}),
          [child]: value
        }
      }))
    } else {
      setContactInfo(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      // Guardar en localStorage primero
      localStorage.setItem("contact_info", JSON.stringify(contactInfo))
      
      // También actualizar el perfil del usuario en el backend
      const userStr = localStorage.getItem("current_user")
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          const updatedUser = {
            ...user,
            first_name: contactInfo.firstName,
            last_name: contactInfo.lastName,
            phone: contactInfo.phone
          }
          
          // Actualizar en localStorage
          localStorage.setItem("current_user", JSON.stringify(updatedUser))
          
          // Intentar actualizar en el backend (opcional)
          try {
            await apiClient.updateProfile({
              first_name: contactInfo.firstName,
              last_name: contactInfo.lastName,
              phone: contactInfo.phone
            })
          } catch (backendError) {
            console.warn("No se pudo actualizar en el backend:", backendError)
          }
        } catch (parseError) {
          console.error("Error parsing user data:", parseError)
        }
      }
      
      setIsEditing(false)
      
      toast({
        title: "Información guardada",
        description: "Tu información de contacto se ha actualizado correctamente.",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la información. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Recargar información original
    const savedContact = localStorage.getItem("contact_info")
    if (savedContact) {
      try {
        const saved = JSON.parse(savedContact)
        setContactInfo(prev => ({ ...prev, ...saved }))
      } catch (error) {
        console.error("Error loading contact info:", error)
      }
    }
    setIsEditing(false)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Información de Contacto</h1>
            <p className="text-gray-600">
              Gestiona tu información personal y de contacto
            </p>
          </div>
          
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Tu información personal básica
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  value={contactInfo.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  value={contactInfo.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={contactInfo.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={contactInfo.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </CardContent>
        </Card>

        {/* Información de Dirección */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Dirección
            </CardTitle>
            <CardDescription>
              Tu dirección de residencia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">Dirección</Label>
              <Textarea
                id="address"
                value={contactInfo.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                disabled={!isEditing}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={contactInfo.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="state">Departamento/Estado</Label>
                <Input
                  id="state"
                  value={contactInfo.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">País</Label>
                <Select 
                  value={contactInfo.country} 
                  onValueChange={(value) => handleInputChange("country", value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Colombia">Colombia</SelectItem>
                    <SelectItem value="México">México</SelectItem>
                    <SelectItem value="Argentina">Argentina</SelectItem>
                    <SelectItem value="Chile">Chile</SelectItem>
                    <SelectItem value="Perú">Perú</SelectItem>
                    <SelectItem value="España">España</SelectItem>
                    <SelectItem value="Estados Unidos">Estados Unidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="postalCode">Código Postal</Label>
                <Input
                  id="postalCode"
                  value={contactInfo.postalCode}
                  onChange={(e) => handleInputChange("postalCode", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información Profesional */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Información Profesional
            </CardTitle>
            <CardDescription>
              Información sobre tu trabajo o empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                value={contactInfo.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="website">Sitio Web</Label>
              <Input
                id="website"
                type="url"
                value={contactInfo.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contacto de Emergencia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contacto de Emergencia
            </CardTitle>
            <CardDescription>
              Persona a contactar en caso de emergencia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="emergencyName">Nombre</Label>
              <Input
                id="emergencyName"
                value={contactInfo.emergencyContact.name}
                onChange={(e) => handleInputChange("emergencyContact.name", e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="emergencyPhone">Teléfono</Label>
              <Input
                id="emergencyPhone"
                type="tel"
                value={contactInfo.emergencyContact.phone}
                onChange={(e) => handleInputChange("emergencyContact.phone", e.target.value)}
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="emergencyRelationship">Relación</Label>
              <Select 
                value={contactInfo.emergencyContact.relationship} 
                onValueChange={(value) => handleInputChange("emergencyContact.relationship", value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la relación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Familiar">Familiar</SelectItem>
                  <SelectItem value="Amigo">Amigo</SelectItem>
                  <SelectItem value="Compañero de trabajo">Compañero de trabajo</SelectItem>
                  <SelectItem value="Vecino">Vecino</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información adicional */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Información Importante</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• Tu información de contacto se utiliza para enviarte notificaciones importantes sobre eventos</p>
            <p>• El contacto de emergencia solo se usará en situaciones críticas</p>
            <p>• Puedes actualizar esta información en cualquier momento</p>
            <p>• Tu información personal está protegida y no se comparte con terceros</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
