"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  GraduationCap, 
  Shield, 
  Lock, 
  Clock, 
  Key, 
  Activity, 
  Bell, 
  CheckCircle,
  AlertTriangle,
  Play,
  BookOpen,
  Award,
  Users,
  Calendar,
  Target
} from "lucide-react"

interface TrainingModule {
  id: string
  title: string
  description: string
  duration: number // minutos
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  completed: boolean
  score?: number
  topics: string[]
}

interface SecurityTrainingProps {
  onComplete: (moduleId: string) => void
}

export default function SecurityTraining({ onComplete }: SecurityTrainingProps) {
  const [modules, setModules] = useState<TrainingModule[]>([
    {
      id: 'authentication-basics',
      title: 'Fundamentos de Autenticación',
      description: 'Aprende los conceptos básicos de autenticación y autorización',
      duration: 30,
      difficulty: 'beginner',
      completed: false,
      topics: [
        '¿Qué es la autenticación?',
        'Tipos de autenticación',
        'Autenticación de dos factores (2FA)',
        'Mejores prácticas de login'
      ]
    },
    {
      id: 'password-security',
      title: 'Seguridad de Contraseñas',
      description: 'Implementa políticas robustas de contraseñas',
      duration: 45,
      difficulty: 'beginner',
      completed: false,
      topics: [
        'Creación de contraseñas seguras',
        'Políticas de contraseñas',
        'Historial de contraseñas',
        'Expiración de contraseñas'
      ]
    },
    {
      id: 'session-management',
      title: 'Gestión de Sesiones',
      description: 'Configura y gestiona sesiones de usuario de forma segura',
      duration: 40,
      difficulty: 'intermediate',
      completed: false,
      topics: [
        'Tiempo de sesión',
        'Sesiones concurrentes',
        'Cierre automático',
        'Renovación de sesiones'
      ]
    },
    {
      id: 'audit-logging',
      title: 'Registro y Auditoría',
      description: 'Implementa sistemas de registro para monitorear actividades',
      duration: 60,
      difficulty: 'intermediate',
      completed: false,
      topics: [
        'Tipos de eventos a registrar',
        'Retención de logs',
        'Análisis de logs',
        'Cumplimiento normativo'
      ]
    },
    {
      id: 'incident-response',
      title: 'Respuesta a Incidentes',
      description: 'Aprende a responder efectivamente a incidentes de seguridad',
      duration: 90,
      difficulty: 'advanced',
      completed: false,
      topics: [
        'Identificación de incidentes',
        'Contención de amenazas',
        'Investigación y análisis',
        'Recuperación y lecciones aprendidas'
      ]
    },
    {
      id: 'compliance-standards',
      title: 'Estándares de Cumplimiento',
      description: 'Conoce los estándares de seguridad y cómo implementarlos',
      duration: 75,
      difficulty: 'advanced',
      completed: false,
      topics: [
        'ISO 27001',
        'GDPR',
        'PCI DSS',
        'Auditorías de seguridad'
      ]
    }
  ])

  const [currentModule, setCurrentModule] = useState<string | null>(null)
  const [showQuiz, setShowQuiz] = useState(false)

  const completedModules = modules.filter(m => m.completed).length
  const totalModules = modules.length
  const progressPercentage = (completedModules / totalModules) * 100

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Principiante'
      case 'intermediate': return 'Intermedio'
      case 'advanced': return 'Avanzado'
      default: return 'Desconocido'
    }
  }

  const handleStartModule = (moduleId: string) => {
    setCurrentModule(moduleId)
    setShowQuiz(false)
  }

  const handleCompleteModule = (moduleId: string) => {
    setModules(modules.map(m => 
      m.id === moduleId 
        ? { ...m, completed: true, score: Math.floor(Math.random() * 20) + 80 }
        : m
    ))
    onComplete(moduleId)
    setCurrentModule(null)
    setShowQuiz(false)
  }

  const handleTakeQuiz = () => {
    setShowQuiz(true)
  }

  const getCurrentModule = () => {
    return modules.find(m => m.id === currentModule)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="h-8 w-8" />
            Capacitación en Seguridad
          </h1>
          <p className="text-muted-foreground mt-2">
            Programa completo de capacitación para administradores de seguridad
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{completedModules}/{totalModules}</div>
          <div className="text-sm text-muted-foreground">Módulos Completados</div>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Progreso General
          </CardTitle>
          <CardDescription>
            Tu progreso en el programa de capacitación de seguridad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progreso Total</span>
              <span className="text-sm font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
            
            {progressPercentage >= 100 && (
              <Alert>
                <Award className="h-4 w-4" />
                <AlertDescription>
                  ¡Felicitaciones! Has completado todo el programa de capacitación en seguridad.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Training Modules */}
      <Tabs defaultValue="modules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="modules">Módulos de Capacitación</TabsTrigger>
          <TabsTrigger value="certificates">Certificados</TabsTrigger>
          <TabsTrigger value="resources">Recursos Adicionales</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <Card key={module.id} className="relative">
                {module.completed && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {module.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getDifficultyColor(module.difficulty)}>
                      {getDifficultyLabel(module.difficulty)}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {module.duration} min
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Temas Cubiertos:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {module.topics.map((topic, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {module.completed && module.score && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Puntuación:</span>
                        <Badge variant="outline">{module.score}%</Badge>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {!module.completed ? (
                        <Button 
                          onClick={() => handleStartModule(module.id)}
                          className="flex-1"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Comenzar
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          onClick={() => handleStartModule(module.id)}
                          className="flex-1"
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Repasar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certificados de Seguridad
              </CardTitle>
              <CardDescription>
                Certificados obtenidos por completar módulos de capacitación
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedModules > 0 ? (
                <div className="space-y-4">
                  {modules.filter(m => m.completed).map((module) => (
                    <div key={module.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{module.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Completado con {module.score}% de puntuación
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Descargar Certificado
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Completa módulos de capacitación para obtener certificados
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Documentación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Políticas de Seguridad
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Lock className="h-4 w-4 mr-2" />
                    Guía de Autenticación
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Activity className="h-4 w-4 mr-2" />
                    Manual de Auditoría
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Bell className="h-4 w-4 mr-2" />
                    Procedimientos de Emergencia
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Soporte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Programar Sesión de Capacitación
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Reportar Problema
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Solicitar Certificación Avanzada
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Current Module View */}
      {currentModule && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {getCurrentModule()?.title}
            </CardTitle>
            <CardDescription>
              {getCurrentModule()?.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showQuiz ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Contenido del Módulo:</h4>
                  <div className="space-y-2">
                    {getCurrentModule()?.topics.map((topic, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <span>{topic}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={handleTakeQuiz} className="flex-1">
                    Tomar Evaluación
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleCompleteModule(currentModule)}
                  >
                    Marcar como Completado
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Esta es una evaluación de práctica. Las respuestas no afectarán tu progreso real.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Pregunta 1:</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      ¿Cuál es la longitud mínima recomendada para una contraseña segura?
                    </p>
                    <div className="space-y-2">
                      {['8 caracteres', '12 caracteres', '16 caracteres', '20 caracteres'].map((option, index) => (
                        <label key={index} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="q1" value={option} />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Pregunta 2:</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      ¿Qué método de autenticación de dos factores es más seguro?
                    </p>
                    <div className="space-y-2">
                      {['SMS', 'Email', 'Aplicación (Google Authenticator)', 'Todos son igual de seguros'].map((option, index) => (
                        <label key={index} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="q2" value={option} />
                          <span className="text-sm">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowQuiz(false)}
                    variant="outline"
                  >
                    Volver al Contenido
                  </Button>
                  <Button 
                    onClick={() => handleCompleteModule(currentModule)}
                    className="flex-1"
                  >
                    Completar Evaluación
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
