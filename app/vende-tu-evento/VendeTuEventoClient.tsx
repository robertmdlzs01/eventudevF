"use client"
import Link from "next/link"

import React, { useState } from "react"
import {
  Users,
  DollarSign,
  Upload,
  Eye,
  Shield,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  ShoppingCart,
  User,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SellEventPage() {
  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    category: "",
    date: "",
    time: "",
    location: "",
    capacity: "",
    ticketPrice: "",
    organizerName: "",
    organizerEmail: "",
    organizerPhone: "",
  })

  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4

  const [captchaVerified, setCaptchaVerified] = useState(false)
  const [captchaChallenge, setCaptchaChallenge] = useState("")
  const [captchaAnswer, setCaptchaAnswer] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!captchaVerified) {
      alert("Por favor, completa la verificación de seguridad.")
      return
    }
    alert("Evento enviado para revisión. Te contactaremos pronto.")
  }

  const handleInputChange = (field: string, value: string) => {
    setEventData((prev) => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1
    const num2 = Math.floor(Math.random() * 10) + 1
    const operators = ["+", "-", "*"]
    const operator = operators[Math.floor(Math.random() * operators.length)]

    let result
    switch (operator) {
      case "+":
        result = num1 + num2
        break
      case "-":
        result = num1 - num2
        break
      case "*":
        result = num1 * num2
        break
      default:
        result = num1 + num2
    }

    setCaptchaChallenge(`${num1} ${operator} ${num2} = ?`)
    return result
  }

  const [correctAnswer, setCorrectAnswer] = useState(() => generateCaptcha())

  const verifyCaptcha = () => {
    const userAnswer = Number.parseInt(captchaAnswer)
    if (userAnswer === correctAnswer) {
      setCaptchaVerified(true)
    } else {
      setCaptchaVerified(false)
      setCaptchaAnswer("")
      setCorrectAnswer(generateCaptcha())
      alert("Respuesta incorrecta. Inténtalo de nuevo.")
    }
  }

  const refreshCaptcha = () => {
    setCaptchaVerified(false)
    setCaptchaAnswer("")
    setCorrectAnswer(generateCaptcha())
  }

  const benefits = [
    {
      icon: Users,
      title: "Amplia audiencia",
      description: "Accede a miles de usuarios activos buscando eventos",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: DollarSign,
      title: "Pagos seguros",
      description: "Recibe tus pagos de forma segura y puntual",
      color: "from-green-500 to-green-600",
    },
    {
      icon: Eye,
      title: "Análisis detallados",
      description: "Obtén estadísticas completas de tus ventas",
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: Shield,
      title: "Soporte 24/7",
      description: "Equipo de soporte dedicado para ayudarte",
      color: "from-orange-500 to-orange-600",
    },
  ]

  const steps = [
    { number: 1, title: "Información básica", description: "Detalles del evento" },
    { number: 2, title: "Fecha y ubicación", description: "Cuándo y dónde" },
    { number: 3, title: "Precios y organizador", description: "Costos y contacto" },
    { number: 4, title: "Imagen y revisión", description: "Finalizar publicación" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100">

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 via-secondary-600 to-primary-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              Vende tu evento y
              <span className="block bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
                llega a miles
              </span>
            </h1>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-neutral-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-neutral-800">¿Por qué elegir Eventu?</h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Te ofrecemos todas las herramientas que necesitas para hacer de tu evento un éxito
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon
              return (
                <Card
                  key={index}
                  className="group hover:shadow-xl transition-all duration-300 border-0 bg-white hover:scale-105"
                >
                  <CardContent className="p-8 text-center">
                    <div
                      className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-r ${benefit.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                    >
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-neutral-800">{benefit.title}</h3>
                    <p className="text-neutral-600 leading-relaxed">{benefit.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section id="form-section" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-neutral-800">Publica tu evento</h2>
              <p className="text-xl text-neutral-600">
                Completa la información de tu evento y comienza a vender entradas
              </p>
            </div>

            {/* Progress Steps */}
            <div className="mb-12">
              <div className="flex justify-between items-center mb-8">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                        currentStep >= step.number ? "bg-primary-600 text-white" : "bg-neutral-200 text-neutral-500"
                      }`}
                    >
                      {currentStep > step.number ? <CheckCircle className="h-6 w-6" /> : step.number}
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-16 md:w-24 h-1 mx-4 transition-all duration-300 ${
                          currentStep > step.number ? "bg-primary-600" : "bg-neutral-200"
                        }`}
                      ></div>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-neutral-800">{steps[currentStep - 1].title}</h3>
                <p className="text-neutral-600">{steps[currentStep - 1].description}</p>
              </div>
            </div>

            {/* Form */}
            <Card className="shadow-xl border-0">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Step 1: Basic Info */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="title" className="text-lg font-semibold text-neutral-800">
                          Nombre del evento *
                        </Label>
                        <Input
                          id="title"
                          value={eventData.title}
                          onChange={(e) => handleInputChange("title", e.target.value)}
                          placeholder="Ej: Concierto de Rock en vivo"
                          className="mt-2 h-12 text-lg rounded-xl border-2 border-neutral-200 focus:border-primary-500"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="description" className="text-lg font-semibold text-neutral-800">
                          Descripción *
                        </Label>
                        <Textarea
                          id="description"
                          value={eventData.description}
                          onChange={(e) => handleInputChange("description", e.target.value)}
                          placeholder="Describe tu evento, qué pueden esperar los asistentes..."
                          rows={6}
                          className="mt-2 text-lg rounded-xl border-2 border-neutral-200 focus:border-primary-500"
                          required
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="category" className="text-lg font-semibold text-neutral-800">
                            Categoría *
                          </Label>
                          <Select
                            value={eventData.category}
                            onValueChange={(value) => handleInputChange("category", value)}
                          >
                            <SelectTrigger className="mt-2 h-12 rounded-xl border-2 border-neutral-200 focus:border-primary-500">
                              <SelectValue placeholder="Selecciona una categoría" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="conciertos">Conciertos</SelectItem>
                              <SelectItem value="festivales">Festivales</SelectItem>
                              <SelectItem value="teatro">Teatro</SelectItem>
                              <SelectItem value="deportes">Deportes</SelectItem>
                              <SelectItem value="familiar">Familiar</SelectItem>
                              <SelectItem value="cultura">Cultura</SelectItem>
                              <SelectItem value="gastronomia">Gastronomía</SelectItem>
                              <SelectItem value="negocios">Negocios</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="capacity" className="text-lg font-semibold text-neutral-800">
                            Capacidad máxima *
                          </Label>
                          <Input
                            id="capacity"
                            type="number"
                            value={eventData.capacity}
                            onChange={(e) => handleInputChange("capacity", e.target.value)}
                            placeholder="Número de asistentes"
                            className="mt-2 h-12 text-lg rounded-xl border-2 border-neutral-200 focus:border-primary-500"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Date and Location */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="date" className="text-lg font-semibold text-neutral-800">
                            Fecha del evento *
                          </Label>
                          <Input
                            id="date"
                            type="date"
                            value={eventData.date}
                            onChange={(e) => handleInputChange("date", e.target.value)}
                            className="mt-2 h-12 text-lg rounded-xl border-2 border-neutral-200 focus:border-primary-500"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="time" className="text-lg font-semibold text-neutral-800">
                            Hora de inicio *
                          </Label>
                          <Input
                            id="time"
                            type="time"
                            value={eventData.time}
                            onChange={(e) => handleInputChange("time", e.target.value)}
                            className="mt-2 h-12 text-lg rounded-xl border-2 border-neutral-200 focus:border-primary-500"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="location" className="text-lg font-semibold text-neutral-800">
                          Ubicación *
                        </Label>
                        <Input
                          id="location"
                          value={eventData.location}
                          onChange={(e) => handleInputChange("location", e.target.value)}
                          placeholder="Dirección completa del evento"
                          className="mt-2 h-12 text-lg rounded-xl border-2 border-neutral-200 focus:border-primary-500"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 3: Pricing and Organizer */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="ticketPrice" className="text-lg font-semibold text-neutral-800">
                          Precio de entrada (COP) *
                        </Label>
                        <Input
                          id="ticketPrice"
                          type="number"
                          value={eventData.ticketPrice}
                          onChange={(e) => handleInputChange("ticketPrice", e.target.value)}
                          placeholder="Precio en pesos colombianos"
                          className="mt-2 h-12 text-lg rounded-xl border-2 border-neutral-200 focus:border-primary-500"
                          required
                        />
                        <p className="text-sm text-neutral-600 mt-2 bg-amber-50 p-3 rounded-lg border border-amber-200">
                          💡 Eventu cobra una comisión del 8% + IVA sobre cada venta
                        </p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="organizerName" className="text-lg font-semibold text-neutral-800">
                            Nombre o empresa *
                          </Label>
                          <Input
                            id="organizerName"
                            value={eventData.organizerName}
                            onChange={(e) => handleInputChange("organizerName", e.target.value)}
                            placeholder="Tu nombre o nombre de la empresa"
                            className="mt-2 h-12 text-lg rounded-xl border-2 border-neutral-200 focus:border-primary-500"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="organizerPhone" className="text-lg font-semibold text-neutral-800">
                            Teléfono *
                          </Label>
                          <Input
                            id="organizerPhone"
                            value={eventData.organizerPhone}
                            onChange={(e) => handleInputChange("organizerPhone", e.target.value)}
                            placeholder="+57 300 123 4567"
                            className="mt-2 h-12 text-lg rounded-xl border-2 border-neutral-200 focus:border-primary-500"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="organizerEmail" className="text-lg font-semibold text-neutral-800">
                          Correo electrónico *
                        </Label>
                        <Input
                          id="organizerEmail"
                          type="email"
                          value={eventData.organizerEmail}
                          onChange={(e) => handleInputChange("organizerEmail", e.target.value)}
                          placeholder="tu@email.com"
                          className="mt-2 h-12 text-lg rounded-xl border-2 border-neutral-200 focus:border-primary-500"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 4: Image and Review */}
                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <div>
                        <Label className="text-lg font-semibold text-neutral-800">Imagen del evento</Label>
                        <div className="mt-2 border-2 border-dashed border-neutral-300 rounded-2xl p-12 text-center hover:border-primary-400 transition-colors">
                          <Upload className="h-16 w-16 mx-auto mb-4 text-neutral-400" />
                          <p className="text-neutral-600 mb-2 text-lg">
                            Arrastra una imagen aquí o haz clic para seleccionar
                          </p>
                          <p className="text-sm text-neutral-500">PNG, JPG hasta 5MB</p>
                          <Button type="button" variant="outline" className="mt-4 rounded-xl">
                            Seleccionar imagen
                          </Button>
                        </div>
                      </div>

                      {/* Verificación de seguridad */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-4 flex items-center">
                          <Shield className="h-5 w-5 mr-2" />
                          Verificación de seguridad
                        </h4>

                        <div className="space-y-4">
                          <div className="flex items-center space-x-4">
                            <div className="bg-white p-4 rounded-lg border-2 border-blue-200 font-mono text-lg font-bold text-center min-w-[120px]">
                              {captchaChallenge}
                            </div>
                            <Input
                              type="number"
                              placeholder="Respuesta"
                              value={captchaAnswer}
                              onChange={(e) => setCaptchaAnswer(e.target.value)}
                              className="w-24 text-center font-bold"
                              disabled={captchaVerified}
                            />
                            <Button
                              type="button"
                              onClick={verifyCaptcha}
                              disabled={captchaVerified || !captchaAnswer}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Verificar
                            </Button>
                            <Button
                              type="button"
                              onClick={refreshCaptcha}
                              variant="outline"
                              className="border-blue-300 text-blue-600 hover:bg-blue-50"
                            >
                              🔄
                            </Button>
                          </div>

                          {captchaVerified && (
                            <div className="flex items-center text-green-700 bg-green-100 p-3 rounded-lg">
                              <CheckCircle className="h-5 w-5 mr-2" />
                              <span className="font-medium">✓ Verificación completada</span>
                            </div>
                          )}

                          <p className="text-sm text-blue-700">
                            Esta verificación nos ayuda a prevenir el spam y mantener la calidad de nuestra plataforma.
                          </p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2 flex items-center">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          ¡Casi listo!
                        </h4>
                        <p className="text-green-700">
                          Tu evento será revisado por nuestro equipo en un plazo de 24-48 horas. Te contactaremos por
                          email con el resultado.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-8 border-t border-neutral-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      disabled={currentStep === 1}
                      className="px-8 py-3 rounded-xl"
                    >
                      Anterior
                    </Button>

                    {currentStep < totalSteps ? (
                      <Button
                        type="button"
                        onClick={nextStep}
                        className="bg-primary-600 hover:bg-primary-700 px-8 py-3 rounded-xl"
                      >
                        Siguiente
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={!captchaVerified}
                        className={`bg-gradient-to-r px-8 py-3 rounded-xl ${
                          captchaVerified
                            ? "from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                            : "from-gray-400 to-gray-500 cursor-not-allowed"
                        }`}
                      >
                        {captchaVerified ? "Enviar para revisión" : "Completa la verificación"}
                        <CheckCircle className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Necesitas ayuda?</h2>
          <p className="text-xl text-neutral-300 mb-8 max-w-2xl mx-auto">
            Nuestro equipo está aquí para ayudarte a hacer de tu evento un éxito
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-primary-600 hover:bg-primary-700 px-8 py-4 rounded-2xl text-lg">
              Contactar soporte
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}