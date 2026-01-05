"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Shield, 
  Lock, 
  Clock, 
  Key, 
  Activity, 
  Bell, 
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react"

interface AdvancedSecuritySettingsProps {
  settings: any
  onSave: (settings: any) => void
  loading?: boolean
}

export default function AdvancedSecuritySettings({ 
  settings, 
  onSave, 
  loading = false 
}: AdvancedSecuritySettingsProps) {
  const [advancedSettings, setAdvancedSettings] = useState({
    // Configuraciones de 2FA
    twoFactorAuth: settings.twoFactorAuth || false,
    twoFactorMethod: settings.twoFactorMethod || 'app', // 'app', 'sms', 'email'
    twoFactorGracePeriod: settings.twoFactorGracePeriod || 24, // horas
    
    // Configuraciones de login
    loginAttemptsLimit: settings.loginAttemptsLimit || true,
    maxLoginAttempts: settings.maxLoginAttempts || 5,
    lockoutDuration: settings.lockoutDuration || 30,
    progressiveLockout: settings.progressiveLockout || true,
    lockoutMultiplier: settings.lockoutMultiplier || 2,
    
    // Configuraciones de sesión
    autoLogout: settings.autoLogout || true,
    sessionTimeout: settings.sessionTimeout || 60,
    sessionRenewal: settings.sessionRenewal || true,
    maxConcurrentSessions: settings.maxConcurrentSessions || 3,
    forceLogoutOnPasswordChange: settings.forceLogoutOnPasswordChange || true,
    
    // Configuraciones de contraseña
    passwordMinLength: settings.passwordMinLength || 8,
    passwordMaxLength: settings.passwordMaxLength || 128,
    passwordRequireUppercase: settings.passwordRequireUppercase || true,
    passwordRequireLowercase: settings.passwordRequireLowercase || true,
    passwordRequireNumbers: settings.passwordRequireNumbers || true,
    passwordRequireSymbols: settings.passwordRequireSymbols || false,
    passwordHistory: settings.passwordHistory || 5,
    passwordExpiryDays: settings.passwordExpiryDays || 90,
    preventCommonPasswords: settings.preventCommonPasswords || true,
    
    // Configuraciones de auditoría
    activityLogging: settings.activityLogging || true,
    logRetentionDays: settings.logRetentionDays || 365,
    logSensitiveActions: settings.logSensitiveActions || true,
    logFailedAttempts: settings.logFailedAttempts || true,
    logSuccessfulLogins: settings.logSuccessfulLogins || false,
    
    // Configuraciones de notificaciones
    securityNotifications: settings.securityNotifications || true,
    notifyOnFailedLogin: settings.notifyOnFailedLogin || true,
    notifyOnPasswordChange: settings.notifyOnPasswordChange || true,
    notifyOnSuspiciousActivity: settings.notifyOnSuspiciousActivity || true,
    notificationChannels: settings.notificationChannels || ['email'],
    
    // Configuraciones de IP
    ipWhitelist: settings.ipWhitelist || [],
    ipBlacklist: settings.ipBlacklist || [],
    geoBlocking: settings.geoBlocking || false,
    allowedCountries: settings.allowedCountries || [],
    
    // Configuraciones de API
    apiRateLimit: settings.apiRateLimit || 100,
    apiRateLimitWindow: settings.apiRateLimitWindow || 15,
    requireApiKey: settings.requireApiKey || true,
    apiKeyExpiryDays: settings.apiKeyExpiryDays || 365,
  })

  const handleSave = () => {
    onSave(advancedSettings)
  }

  const getSecurityScore = () => {
    let score = 0
    let total = 0

    // 2FA
    if (advancedSettings.twoFactorAuth) score += 20
    total += 20

    // Login attempts
    if (advancedSettings.loginAttemptsLimit) score += 15
    if (advancedSettings.progressiveLockout) score += 5
    total += 20

    // Session management
    if (advancedSettings.autoLogout) score += 10
    if (advancedSettings.maxConcurrentSessions <= 3) score += 5
    total += 15

    // Password strength
    if (advancedSettings.passwordMinLength >= 12) score += 10
    if (advancedSettings.passwordRequireSymbols) score += 5
    if (advancedSettings.passwordHistory >= 5) score += 5
    if (advancedSettings.preventCommonPasswords) score += 5
    total += 25

    // Logging
    if (advancedSettings.activityLogging) score += 10
    if (advancedSettings.logSensitiveActions) score += 5
    total += 15

    // Notifications
    if (advancedSettings.securityNotifications) score += 5
    total += 5

    return Math.round((score / total) * 100)
  }

  const securityScore = getSecurityScore()

  return (
    <div className="space-y-6">
      {/* Security Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Puntuación de Seguridad
          </CardTitle>
          <CardDescription>
            Evaluación automática de la configuración de seguridad actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-gray-200 flex items-center justify-center">
                <span className="text-xl font-bold">{securityScore}%</span>
              </div>
              <div 
                className="absolute inset-0 rounded-full border-4 border-transparent"
                style={{
                  background: `conic-gradient(${
                    securityScore >= 80 ? '#10b981' : 
                    securityScore >= 60 ? '#f59e0b' : '#ef4444'
                  } 0deg, transparent ${(securityScore / 100) * 360}deg)`
                }}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={
                  securityScore >= 80 ? "default" : 
                  securityScore >= 60 ? "secondary" : "destructive"
                }>
                  {securityScore >= 80 ? "Excelente" : 
                   securityScore >= 60 ? "Buena" : "Necesita Mejoras"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {securityScore >= 80 ? "Tu configuración de seguridad es muy robusta" :
                 securityScore >= 60 ? "Tu configuración de seguridad es adecuada" :
                 "Recomendamos mejorar la configuración de seguridad"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="authentication" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="authentication">Autenticación</TabsTrigger>
          <TabsTrigger value="sessions">Sesiones</TabsTrigger>
          <TabsTrigger value="passwords">Contraseñas</TabsTrigger>
          <TabsTrigger value="audit">Auditoría</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
        </TabsList>

        {/* Autenticación */}
        <TabsContent value="authentication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Autenticación de Dos Factores (2FA)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Habilitar 2FA</Label>
                  <p className="text-sm text-muted-foreground">
                    Requerir verificación adicional para acceder al panel
                  </p>
                </div>
                <Switch
                  checked={advancedSettings.twoFactorAuth}
                  onCheckedChange={(checked) => setAdvancedSettings({
                    ...advancedSettings,
                    twoFactorAuth: checked
                  })}
                />
              </div>
              
              {advancedSettings.twoFactorAuth && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="twoFactorMethod">Método de 2FA</Label>
                      <select
                        id="twoFactorMethod"
                        value={advancedSettings.twoFactorMethod}
                        onChange={(e) => setAdvancedSettings({
                          ...advancedSettings,
                          twoFactorMethod: e.target.value
                        })}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="app">Aplicación (Google Authenticator)</option>
                        <option value="sms">SMS</option>
                        <option value="email">Email</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twoFactorGracePeriod">Período de Gracia (horas)</Label>
                      <Input
                        id="twoFactorGracePeriod"
                        type="number"
                        min="0"
                        max="168"
                        value={advancedSettings.twoFactorGracePeriod}
                        onChange={(e) => setAdvancedSettings({
                          ...advancedSettings,
                          twoFactorGracePeriod: Number(e.target.value)
                        })}
                      />
                    </div>
                  </div>
                </>
              )}

              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Límite de Intentos de Login</Label>
                    <p className="text-sm text-muted-foreground">
                      Bloquear cuenta después de múltiples intentos fallidos
                    </p>
                  </div>
                  <Switch
                    checked={advancedSettings.loginAttemptsLimit}
                    onCheckedChange={(checked) => setAdvancedSettings({
                      ...advancedSettings,
                      loginAttemptsLimit: checked
                    })}
                  />
                </div>

                {advancedSettings.loginAttemptsLimit && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxLoginAttempts">Máximo Intentos</Label>
                      <Input
                        id="maxLoginAttempts"
                        type="number"
                        min="3"
                        max="10"
                        value={advancedSettings.maxLoginAttempts}
                        onChange={(e) => setAdvancedSettings({
                          ...advancedSettings,
                          maxLoginAttempts: Number(e.target.value)
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lockoutDuration">Duración Bloqueo (min)</Label>
                      <Input
                        id="lockoutDuration"
                        type="number"
                        min="5"
                        max="1440"
                        value={advancedSettings.lockoutDuration}
                        onChange={(e) => setAdvancedSettings({
                          ...advancedSettings,
                          lockoutDuration: Number(e.target.value)
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={advancedSettings.progressiveLockout}
                          onCheckedChange={(checked) => setAdvancedSettings({
                            ...advancedSettings,
                            progressiveLockout: checked
                          })}
                        />
                        <Label className="text-sm">Bloqueo Progresivo</Label>
                      </div>
                      {advancedSettings.progressiveLockout && (
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          placeholder="Multiplicador"
                          value={advancedSettings.lockoutMultiplier}
                          onChange={(e) => setAdvancedSettings({
                            ...advancedSettings,
                            lockoutMultiplier: Number(e.target.value)
                          })}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sesiones */}
        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Gestión de Sesiones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cierre Automático de Sesión</Label>
                  <p className="text-sm text-muted-foreground">
                    Cerrar sesión automáticamente después de inactividad
                  </p>
                </div>
                <Switch
                  checked={advancedSettings.autoLogout}
                  onCheckedChange={(checked) => setAdvancedSettings({
                    ...advancedSettings,
                    autoLogout: checked
                  })}
                />
              </div>

              {advancedSettings.autoLogout && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Tiempo de Sesión (minutos)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      min="15"
                      max="1440"
                      value={advancedSettings.sessionTimeout}
                      onChange={(e) => setAdvancedSettings({
                        ...advancedSettings,
                        sessionTimeout: Number(e.target.value)
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxConcurrentSessions">Máximo Sesiones Concurrentes</Label>
                    <Input
                      id="maxConcurrentSessions"
                      type="number"
                      min="1"
                      max="10"
                      value={advancedSettings.maxConcurrentSessions}
                      onChange={(e) => setAdvancedSettings({
                        ...advancedSettings,
                        maxConcurrentSessions: Number(e.target.value)
                      })}
                    />
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={advancedSettings.sessionRenewal}
                    onCheckedChange={(checked) => setAdvancedSettings({
                      ...advancedSettings,
                      sessionRenewal: checked
                    })}
                  />
                  <Label>Renovación Automática de Sesión</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={advancedSettings.forceLogoutOnPasswordChange}
                    onCheckedChange={(checked) => setAdvancedSettings({
                      ...advancedSettings,
                      forceLogoutOnPasswordChange: checked
                    })}
                  />
                  <Label>Cerrar Sesión al Cambiar Contraseña</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contraseñas */}
        <TabsContent value="passwords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Política de Contraseñas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Longitud Mínima</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min="8"
                    max="32"
                    value={advancedSettings.passwordMinLength}
                    onChange={(e) => setAdvancedSettings({
                      ...advancedSettings,
                      passwordMinLength: Number(e.target.value)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordMaxLength">Longitud Máxima</Label>
                  <Input
                    id="passwordMaxLength"
                    type="number"
                    min="32"
                    max="256"
                    value={advancedSettings.passwordMaxLength}
                    onChange={(e) => setAdvancedSettings({
                      ...advancedSettings,
                      passwordMaxLength: Number(e.target.value)
                    })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Requisitos de Contraseña</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={advancedSettings.passwordRequireUppercase}
                      onCheckedChange={(checked) => setAdvancedSettings({
                        ...advancedSettings,
                        passwordRequireUppercase: checked
                      })}
                    />
                    <Label className="text-sm">Requerir mayúsculas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={advancedSettings.passwordRequireLowercase}
                      onCheckedChange={(checked) => setAdvancedSettings({
                        ...advancedSettings,
                        passwordRequireLowercase: checked
                      })}
                    />
                    <Label className="text-sm">Requerir minúsculas</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={advancedSettings.passwordRequireNumbers}
                      onCheckedChange={(checked) => setAdvancedSettings({
                        ...advancedSettings,
                        passwordRequireNumbers: checked
                      })}
                    />
                    <Label className="text-sm">Requerir números</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={advancedSettings.passwordRequireSymbols}
                      onCheckedChange={(checked) => setAdvancedSettings({
                        ...advancedSettings,
                        passwordRequireSymbols: checked
                      })}
                    />
                    <Label className="text-sm">Requerir símbolos</Label>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passwordHistory">Historial de Contraseñas</Label>
                  <Input
                    id="passwordHistory"
                    type="number"
                    min="0"
                    max="20"
                    value={advancedSettings.passwordHistory}
                    onChange={(e) => setAdvancedSettings({
                      ...advancedSettings,
                      passwordHistory: Number(e.target.value)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordExpiryDays">Expiración (días)</Label>
                  <Input
                    id="passwordExpiryDays"
                    type="number"
                    min="0"
                    max="365"
                    value={advancedSettings.passwordExpiryDays}
                    onChange={(e) => setAdvancedSettings({
                      ...advancedSettings,
                      passwordExpiryDays: Number(e.target.value)
                    })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={advancedSettings.preventCommonPasswords}
                  onCheckedChange={(checked) => setAdvancedSettings({
                    ...advancedSettings,
                    preventCommonPasswords: checked
                  })}
                />
                <Label>Prevenir Contraseñas Comunes</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auditoría */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Registro de Actividad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Registro de Actividad</Label>
                  <p className="text-sm text-muted-foreground">
                    Registrar todas las acciones de administradores
                  </p>
                </div>
                <Switch
                  checked={advancedSettings.activityLogging}
                  onCheckedChange={(checked) => setAdvancedSettings({
                    ...advancedSettings,
                    activityLogging: checked
                  })}
                />
              </div>

              {advancedSettings.activityLogging && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="logRetentionDays">Retención de Logs (días)</Label>
                      <Input
                        id="logRetentionDays"
                        type="number"
                        min="30"
                        max="2555"
                        value={advancedSettings.logRetentionDays}
                        onChange={(e) => setAdvancedSettings({
                          ...advancedSettings,
                          logRetentionDays: Number(e.target.value)
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tipos de Eventos a Registrar</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={advancedSettings.logSensitiveActions}
                            onCheckedChange={(checked) => setAdvancedSettings({
                              ...advancedSettings,
                              logSensitiveActions: checked
                            })}
                          />
                          <Label className="text-sm">Acciones Sensibles</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={advancedSettings.logFailedAttempts}
                            onCheckedChange={(checked) => setAdvancedSettings({
                              ...advancedSettings,
                              logFailedAttempts: checked
                            })}
                          />
                          <Label className="text-sm">Intentos Fallidos</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={advancedSettings.logSuccessfulLogins}
                            onCheckedChange={(checked) => setAdvancedSettings({
                              ...advancedSettings,
                              logSuccessfulLogins: checked
                            })}
                          />
                          <Label className="text-sm">Logins Exitosos</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notificaciones */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificaciones de Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones de Seguridad</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar alertas por email para eventos de seguridad
                  </p>
                </div>
                <Switch
                  checked={advancedSettings.securityNotifications}
                  onCheckedChange={(checked) => setAdvancedSettings({
                    ...advancedSettings,
                    securityNotifications: checked
                  })}
                />
              </div>

              {advancedSettings.securityNotifications && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tipos de Notificaciones</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={advancedSettings.notifyOnFailedLogin}
                            onCheckedChange={(checked) => setAdvancedSettings({
                              ...advancedSettings,
                              notifyOnFailedLogin: checked
                            })}
                          />
                          <Label className="text-sm">Login Fallido</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={advancedSettings.notifyOnPasswordChange}
                            onCheckedChange={(checked) => setAdvancedSettings({
                              ...advancedSettings,
                              notifyOnPasswordChange: checked
                            })}
                          />
                          <Label className="text-sm">Cambio de Contraseña</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={advancedSettings.notifyOnSuspiciousActivity}
                            onCheckedChange={(checked) => setAdvancedSettings({
                              ...advancedSettings,
                              notifyOnSuspiciousActivity: checked
                            })}
                          />
                          <Label className="text-sm">Actividad Sospechosa</Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Canales de Notificación</Label>
                      <div className="space-y-2">
                        {['email', 'sms', 'webhook'].map((channel) => (
                          <div key={channel} className="flex items-center space-x-2">
                            <Switch
                              checked={advancedSettings.notificationChannels.includes(channel)}
                              onCheckedChange={(checked) => {
                                const channels = checked
                                  ? [...advancedSettings.notificationChannels, channel]
                                  : advancedSettings.notificationChannels.filter((c: any) => c !== channel)
                                setAdvancedSettings({
                                  ...advancedSettings,
                                  notificationChannels: channels
                                })
                              }}
                            />
                            <Label className="text-sm capitalize">{channel}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => setAdvancedSettings(settings)}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Guardando..." : "Guardar Configuraciones"}
        </Button>
      </div>

      {/* Alertas de seguridad */}
      {securityScore < 60 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Tu puntuación de seguridad es baja. Recomendamos habilitar más configuraciones de seguridad.
          </AlertDescription>
        </Alert>
      )}

      {securityScore >= 80 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            ¡Excelente! Tu configuración de seguridad es muy robusta.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
