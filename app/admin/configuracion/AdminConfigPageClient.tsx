"use client"

import { useState, useEffect } from "react"
import { getAdminSettings, updateAdminSettings, resetAdminSettings, exportAdminSettings, importAdminSettings } from "@/app/admin/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"

export default function AdminConfigPageClient() {
  const { toast } = useToast()
  const [settings, setSettings] = useState({
    siteName: "Eventu",
    siteDescription: "La mejor plataforma para eventos en Colombia",
    contactEmail: "contacto@eventu.com",
    supportEmail: "soporte@eventu.com",
    currency: "COP",
    timezone: "America/Bogota",
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    maxTicketsPerPurchase: 10,
    commissionRate: 5,
    // Configuraciones de seguridad
    twoFactorAuth: false,
    loginAttemptsLimit: true,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    autoLogout: true,
    sessionTimeout: 60,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSymbols: false,
    activityLogging: true,
    securityNotifications: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Cargar configuraciones del backend
  const fetchSettings = async () => {
    setLoading(true)
    try {
      const settingsData = await getAdminSettings()
      setSettings(settingsData)
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las configuraciones.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const success = await updateAdminSettings(settings)
      if (success) {
        toast({
          title: "Configuración Guardada",
          description: "Los cambios han sido guardados exitosamente.",
        })
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: "Error",
        description: "No se pudieron guardar las configuraciones.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    try {
      const success = await resetAdminSettings()
      if (success) {
        await fetchSettings() // Recargar configuraciones
        toast({
          title: "Configuración Reseteada",
          description: "Las configuraciones han sido restauradas a los valores por defecto.",
        })
      } else {
        throw new Error('Failed to reset settings')
      }
    } catch (error) {
      console.error('Error resetting settings:', error)
      toast({
        title: "Error",
        description: "No se pudieron resetear las configuraciones.",
        variant: "destructive",
      })
    }
  }

  const handleExport = async () => {
    try {
      const downloadUrl = await exportAdminSettings()
      if (downloadUrl) {
        window.open(downloadUrl, '_blank')
        toast({
          title: "Configuración Exportada",
          description: "Las configuraciones han sido exportadas exitosamente.",
        })
      } else {
        throw new Error('Failed to export settings')
      }
    } catch (error) {
      console.error('Error exporting settings:', error)
      toast({
        title: "Error",
        description: "No se pudieron exportar las configuraciones.",
        variant: "destructive",
      })
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const success = await importAdminSettings(file)
      if (success) {
        await fetchSettings() // Recargar configuraciones
        toast({
          title: "Configuración Importada",
          description: "Las configuraciones han sido importadas exitosamente.",
        })
      } else {
        throw new Error('Failed to import settings')
      }
    } catch (error) {
      console.error('Error importing settings:', error)
      toast({
        title: "Error",
        description: "No se pudieron importar las configuraciones.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Configuración del Sistema
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            Resetear
          </Button>
          <Button variant="outline" onClick={handleExport}>
            Exportar
          </Button>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json,.csv"
              onChange={handleImport}
              className="hidden"
            />
            <Button variant="outline" asChild>
              <span>Importar</span>
            </Button>
          </label>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando configuraciones...</div>
        </div>
      ) : (
        <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>Configuración básica de la plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nombre del Sitio</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email de Contacto</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Descripción del Sitio</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <Select
                    value={settings.currency}
                    onValueChange={(value) => setSettings({ ...settings, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COP">Peso Colombiano (COP)</SelectItem>
                      <SelectItem value="USD">Dólar Americano (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) => setSettings({ ...settings, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Bogota">Bogotá (GMT-5)</SelectItem>
                      <SelectItem value="America/New_York">Nueva York (GMT-5)</SelectItem>
                      <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuración de Funcionalidades</CardTitle>
              <CardDescription>Habilitar o deshabilitar funciones del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo Mantenimiento</Label>
                  <p className="text-sm text-muted-foreground">Deshabilita el acceso público al sitio</p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Registro de Usuarios</Label>
                  <p className="text-sm text-muted-foreground">Permitir que nuevos usuarios se registren</p>
                </div>
                <Switch
                  checked={settings.registrationEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, registrationEnabled: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Pagos</CardTitle>
              <CardDescription>Gestiona las opciones de pago y comisiones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxTickets">Máximo Boletas por Compra</Label>
                  <Input
                    id="maxTickets"
                    type="number"
                    value={settings.maxTicketsPerPurchase}
                    onChange={(e) => setSettings({ ...settings, maxTicketsPerPurchase: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commission">Tasa de Comisión (%)</Label>
                  <Input
                    id="commission"
                    type="number"
                    value={settings.commissionRate}
                    onChange={(e) => setSettings({ ...settings, commissionRate: Number(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Notificaciones</CardTitle>
              <CardDescription>Gestiona cómo se envían las notificaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones por Email</Label>
                  <p className="text-sm text-muted-foreground">Enviar notificaciones por correo electrónico</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones por SMS</Label>
                  <p className="text-sm text-muted-foreground">Enviar notificaciones por mensaje de texto</p>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Seguridad</CardTitle>
              <CardDescription>Gestiona las opciones de seguridad del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Autenticación de Dos Factores (2FA)</Label>
                  <p className="text-sm text-muted-foreground">Requerir verificación adicional para acceder al panel</p>
                </div>
                <Switch
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => setSettings({ ...settings, twoFactorAuth: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Límite de Intentos de Login</Label>
                  <p className="text-sm text-muted-foreground">Bloquear cuenta después de múltiples intentos fallidos</p>
                </div>
                <Switch
                  checked={settings.loginAttemptsLimit}
                  onCheckedChange={(checked) => setSettings({ ...settings, loginAttemptsLimit: checked })}
                />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Máximo Intentos de Login</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    min="3"
                    max="10"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => setSettings({ ...settings, maxLoginAttempts: Number(e.target.value) })}
                    disabled={!settings.loginAttemptsLimit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lockoutDuration">Duración del Bloqueo (minutos)</Label>
                  <Input
                    id="lockoutDuration"
                    type="number"
                    min="5"
                    max="1440"
                    value={settings.lockoutDuration}
                    onChange={(e) => setSettings({ ...settings, lockoutDuration: Number(e.target.value) })}
                    disabled={!settings.loginAttemptsLimit}
                  />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sesión Automática</Label>
                  <p className="text-sm text-muted-foreground">Cerrar sesión automáticamente después de inactividad</p>
                </div>
                <Switch
                  checked={settings.autoLogout}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoLogout: checked })}
                />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Tiempo de Sesión (minutos)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="15"
                    max="1440"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({ ...settings, sessionTimeout: Number(e.target.value) })}
                    disabled={!settings.autoLogout}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Longitud Mínima de Contraseña</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min="8"
                    max="32"
                    value={settings.passwordMinLength}
                    onChange={(e) => setSettings({ ...settings, passwordMinLength: Number(e.target.value) })}
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <Label>Requisitos de Contraseña</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.passwordRequireUppercase}
                      onCheckedChange={(checked) => setSettings({ ...settings, passwordRequireUppercase: checked })}
                    />
                    <Label className="text-sm">Requerir mayúsculas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.passwordRequireLowercase}
                      onCheckedChange={(checked) => setSettings({ ...settings, passwordRequireLowercase: checked })}
                    />
                    <Label className="text-sm">Requerir minúsculas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.passwordRequireNumbers}
                      onCheckedChange={(checked) => setSettings({ ...settings, passwordRequireNumbers: checked })}
                    />
                    <Label className="text-sm">Requerir números</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.passwordRequireSymbols}
                      onCheckedChange={(checked) => setSettings({ ...settings, passwordRequireSymbols: checked })}
                    />
                    <Label className="text-sm">Requerir símbolos</Label>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Registro de Actividad</Label>
                  <p className="text-sm text-muted-foreground">Registrar todas las acciones de administradores</p>
                </div>
                <Switch
                  checked={settings.activityLogging}
                  onCheckedChange={(checked) => setSettings({ ...settings, activityLogging: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones de Seguridad</Label>
                  <p className="text-sm text-muted-foreground">Enviar alertas por email para eventos de seguridad</p>
                </div>
                <Switch
                  checked={settings.securityNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, securityNotifications: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      )}
    </div>
  )
}
