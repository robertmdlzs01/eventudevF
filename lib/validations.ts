import * as z from "zod"

// Esquemas de validación para eventos
export const eventSchema = z.object({
  title: z.string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(100, "El título no puede exceder 100 caracteres"),
  description: z.string()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(1000, "La descripción no puede exceder 1000 caracteres"),
  date: z.coerce.date().refine((date) => date > new Date(), {
    message: "La fecha del evento debe ser futura",
  }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Formato de hora inválido (HH:MM)",
  }),
  location: z.string()
    .min(5, "La ubicación debe tener al menos 5 caracteres")
    .max(200, "La ubicación no puede exceder 200 caracteres"),
  category: z.string().min(1, "Debe seleccionar una categoría"),
  totalCapacity: z.number()
    .min(1, "La capacidad debe ser al menos 1")
    .max(10000, "La capacidad no puede exceder 10,000"),
  price: z.number()
    .min(0, "El precio no puede ser negativo")
    .max(10000, "El precio no puede exceder $10,000"),
  image: z.string().url("URL de imagen inválida").optional(),
})

// Esquemas de validación para usuarios
export const userSchema = z.object({
  firstName: z.string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras"),
  lastName: z.string()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(50, "El apellido no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El apellido solo puede contener letras"),
  email: z.string()
    .email("Formato de email inválido")
    .min(5, "El email debe tener al menos 5 caracteres")
    .max(100, "El email no puede exceder 100 caracteres"),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Formato de teléfono inválido")
    .optional(),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: "La contraseña debe contener al menos una mayúscula, una minúscula y un número",
    }),
  confirmPassword: z.string(),
  role: z.enum(["user", "organizer", "admin"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

// Esquemas de validación para pagos
export const paymentSchema = z.object({
  amount: z.number()
    .min(0.01, "El monto debe ser mayor a 0")
    .max(10000, "El monto no puede exceder $10,000"),
  currency: z.enum(["USD", "EUR", "COP"]),
  paymentMethod: z.enum(["credit_card", "paypal", "bank_transfer", "cash"]),
  cardNumber: z.string()
    .regex(/^\d{16}$/, "Número de tarjeta inválido")
    .optional(),
  expiryDate: z.string()
    .regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, "Formato de fecha inválido (MM/YY)")
    .optional(),
  cvv: z.string()
    .regex(/^\d{3,4}$/, "CVV inválido")
    .optional(),
})

// Esquemas de validación para notificaciones
export const notificationSchema = z.object({
  title: z.string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(100, "El título no puede exceder 100 caracteres"),
  message: z.string()
    .min(10, "El mensaje debe tener al menos 10 caracteres")
    .max(500, "El mensaje no puede exceder 500 caracteres"),
  type: z.enum(["info", "success", "warning", "error"]),
  target: z.enum(["all", "admins", "organizers", "users", "specific"]),
  recipients: z.array(z.string()).optional(),
})

// Esquemas de validación para reportes
export const reportSchema = z.object({
  name: z.string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  description: z.string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional(),
  type: z.enum(["sales", "events", "users", "financial"]),
  filters: z.record(z.string(), z.any()).optional(),
  schedule: z.object({
    frequency: z.enum(["daily", "weekly", "monthly"]),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  }).optional(),
})

// Esquemas de validación para check-in
export const checkInSchema = z.object({
  ticketNumber: z.string()
    .min(5, "El número de boleta debe tener al menos 5 caracteres")
    .max(50, "El número de boleta no puede exceder 50 caracteres")
    .regex(/^[A-Z0-9-]+$/, "El número de boleta solo puede contener letras mayúsculas, números y guiones"),
  eventName: z.string()
    .min(3, "El nombre del evento debe tener al menos 3 caracteres")
    .max(100, "El nombre del evento no puede exceder 100 caracteres"),
  gate: z.string()
    .min(2, "La puerta debe tener al menos 2 caracteres")
    .max(50, "La puerta no puede exceder 50 caracteres"),
  operator: z.string()
    .min(2, "El operador debe tener al menos 2 caracteres")
    .max(100, "El operador no puede exceder 100 caracteres"),
})

// Esquemas de validación para mapas de asientos
export const seatMapSchema = z.object({
  name: z.string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  venueName: z.string()
    .min(3, "El nombre del venue debe tener al menos 3 caracteres")
    .max(100, "El nombre del venue no puede exceder 100 caracteres"),
  totalCapacity: z.number()
    .min(1, "La capacidad debe ser al menos 1")
    .max(50000, "La capacidad no puede exceder 50,000"),
  rows: z.number()
    .min(1, "El número de filas debe ser al menos 1")
    .max(100, "El número de filas no puede exceder 100"),
  seatsPerRow: z.number()
    .min(1, "El número de asientos por fila debe ser al menos 1")
    .max(200, "El número de asientos por fila no puede exceder 200"),
})

// Funciones de validación personalizadas
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone)
}

export const validateCreditCard = (cardNumber: string): boolean => {
  // Algoritmo de Luhn
  const digits = cardNumber.replace(/\D/g, "")
  if (digits.length < 13 || digits.length > 19) return false
  
  let sum = 0
  let isEven = false
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i])
    
    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }
    
    sum += digit
    isEven = !isEven
  }
  
  return sum % 10 === 0
}

export const validatePasswordStrength = (password: string): {
  isValid: boolean
  score: number
  feedback: string[]
} => {
  const feedback: string[] = []
  let score = 0
  
  // Longitud mínima
  if (password.length >= 8) score += 1
  else feedback.push("Al menos 8 caracteres")
  
  // Contiene mayúscula
  if (/[A-Z]/.test(password)) score += 1
  else feedback.push("Al menos una mayúscula")
  
  // Contiene minúscula
  if (/[a-z]/.test(password)) score += 1
  else feedback.push("Al menos una minúscula")
  
  // Contiene número
  if (/\d/.test(password)) score += 1
  else feedback.push("Al menos un número")
  
  // Contiene carácter especial
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1
  else feedback.push("Al menos un carácter especial")
  
  // Longitud adicional
  if (password.length >= 12) score += 1
  
  return {
    isValid: score >= 4,
    score: Math.min(score, 6),
    feedback: feedback.length > 0 ? feedback : ["Contraseña fuerte"]
  }
}

// Validación de archivos
export const validateFile = (file: File, options: {
  maxSize?: number // en bytes
  allowedTypes?: string[]
  maxWidth?: number
  maxHeight?: number
} = {}): Promise<{ isValid: boolean; error?: string }> => {
  return new Promise((resolve) => {
    const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/gif'] } = options
    
    // Validar tamaño
    if (file.size > maxSize) {
      resolve({
        isValid: false,
        error: `El archivo es demasiado grande. Máximo ${Math.round(maxSize / 1024 / 1024)}MB`
      })
      return
    }
    
    // Validar tipo
    if (!allowedTypes.includes(file.type)) {
      resolve({
        isValid: false,
        error: `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`
      })
      return
    }
    
    // Validar dimensiones de imagen
    if (file.type.startsWith('image/') && (options.maxWidth || options.maxHeight)) {
      const img = new Image()
      img.onload = () => {
        if (options.maxWidth && img.width > options.maxWidth) {
          resolve({
            isValid: false,
            error: `La imagen es demasiado ancha. Máximo ${options.maxWidth}px`
          })
          return
        }
        
        if (options.maxHeight && img.height > options.maxHeight) {
          resolve({
            isValid: false,
            error: `La imagen es demasiado alta. Máximo ${options.maxHeight}px`
          })
          return
        }
        
        resolve({ isValid: true })
      }
      img.onerror = () => {
        resolve({
          isValid: false,
          error: "No se pudo validar la imagen"
        })
      }
      img.src = URL.createObjectURL(file)
    } else {
      resolve({ isValid: true })
    }
  })
}

// Validación de fechas
export const validateDateRange = (startDate: Date, endDate: Date): {
  isValid: boolean
  error?: string
} => {
  if (startDate >= endDate) {
    return {
      isValid: false,
      error: "La fecha de inicio debe ser anterior a la fecha de fin"
    }
  }
  
  const diffTime = endDate.getTime() - startDate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays > 365) {
    return {
      isValid: false,
      error: "El rango de fechas no puede exceder 1 año"
    }
  }
  
  return { isValid: true }
}

// Validación de horarios
export const validateTimeRange = (startTime: string, endTime: string): {
  isValid: boolean
  error?: string
} => {
  const start = new Date(`2000-01-01T${startTime}`)
  const end = new Date(`2000-01-01T${endTime}`)
  
  if (start >= end) {
    return {
      isValid: false,
      error: "La hora de inicio debe ser anterior a la hora de fin"
    }
  }
  
  const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  
  if (diffHours > 24) {
    return {
      isValid: false,
      error: "El evento no puede durar más de 24 horas"
    }
  }
  
  return { isValid: true }
}

// Exportar todos los esquemas
export const schemas = {
  event: eventSchema,
  user: userSchema,
  payment: paymentSchema,
  notification: notificationSchema,
  report: reportSchema,
  checkIn: checkInSchema,
  seatMap: seatMapSchema,
}

// Tipos TypeScript derivados de los esquemas
export type EventFormData = z.infer<typeof eventSchema>
export type UserFormData = z.infer<typeof userSchema>
export type PaymentFormData = z.infer<typeof paymentSchema>
export type NotificationFormData = z.infer<typeof notificationSchema>
export type ReportFormData = z.infer<typeof reportSchema>
export type CheckInFormData = z.infer<typeof checkInSchema>
export type SeatMapFormData = z.infer<typeof seatMapSchema>
