const Joi = require('joi');

/**
 * Validaciones robustas para eventos con Joi
 */
const eventValidationSchemas = {
  // Validación para crear evento
  createEvent: Joi.object({
    title: Joi.string()
      .min(3)
      .max(100)
      .required()
      .messages({
        'string.min': 'El título debe tener al menos 3 caracteres',
        'string.max': 'El título no puede exceder 100 caracteres',
        'any.required': 'El título es obligatorio'
      }),
    
    slug: Joi.string()
      .pattern(/^[a-z0-9-]+$/)
      .min(3)
      .max(50)
      .optional()
      .messages({
        'string.pattern.base': 'El slug solo puede contener letras minúsculas, números y guiones',
        'string.min': 'El slug debe tener al menos 3 caracteres',
        'string.max': 'El slug no puede exceder 50 caracteres'
      }),
    
    description: Joi.string()
      .min(10)
      .max(500)
      .required()
      .messages({
        'string.min': 'La descripción debe tener al menos 10 caracteres',
        'string.max': 'La descripción no puede exceder 500 caracteres',
        'any.required': 'La descripción es obligatoria'
      }),
    
    long_description: Joi.string()
      .min(20)
      .max(2000)
      .optional()
      .messages({
        'string.min': 'La descripción larga debe tener al menos 20 caracteres',
        'string.max': 'La descripción larga no puede exceder 2000 caracteres'
      }),
    
    date: Joi.date()
      .iso()
      .min('now')
      .required()
      .messages({
        'date.base': 'La fecha debe ser válida',
        'date.min': 'La fecha debe ser futura',
        'any.required': 'La fecha es obligatoria'
      }),
    
    time: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .required()
      .messages({
        'string.pattern.base': 'La hora debe estar en formato HH:MM',
        'any.required': 'La hora es obligatoria'
      }),
    
    venue: Joi.string()
      .min(3)
      .max(100)
      .required()
      .messages({
        'string.min': 'El lugar debe tener al menos 3 caracteres',
        'string.max': 'El lugar no puede exceder 100 caracteres',
        'any.required': 'El lugar es obligatorio'
      }),
    
    location: Joi.string()
      .min(5)
      .max(200)
      .required()
      .messages({
        'string.min': 'La ubicación debe tener al menos 5 caracteres',
        'string.max': 'La ubicación no puede exceder 200 caracteres',
        'any.required': 'La ubicación es obligatoria'
      }),
    
    category_id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'El ID de categoría debe ser un número',
        'number.integer': 'El ID de categoría debe ser un entero',
        'number.positive': 'El ID de categoría debe ser positivo',
        'any.required': 'El ID de categoría es obligatorio'
      }),
    
    total_capacity: Joi.number()
      .integer()
      .min(1)
      .max(100000)
      .required()
      .messages({
        'number.base': 'La capacidad debe ser un número',
        'number.integer': 'La capacidad debe ser un entero',
        'number.min': 'La capacidad debe ser al menos 1',
        'number.max': 'La capacidad no puede exceder 100,000',
        'any.required': 'La capacidad es obligatoria'
      }),
    
    price: Joi.number()
      .precision(2)
      .min(0)
      .max(10000)
      .required()
      .messages({
        'number.base': 'El precio debe ser un número',
        'number.min': 'El precio no puede ser negativo',
        'number.max': 'El precio no puede exceder $10,000',
        'any.required': 'El precio es obligatorio'
      }),
    
    status: Joi.string()
      .valid('draft', 'published', 'cancelled', 'completed')
      .default('draft')
      .messages({
        'any.only': 'El estado debe ser: draft, published, cancelled o completed'
      }),
    
    sales_start_date: Joi.date()
      .iso()
      .min('now')
      .optional()
      .messages({
        'date.base': 'La fecha de inicio de ventas debe ser válida',
        'date.min': 'La fecha de inicio de ventas debe ser futura'
      }),
    
    sales_end_date: Joi.date()
      .iso()
      .min(Joi.ref('sales_start_date'))
      .optional()
      .messages({
        'date.base': 'La fecha de fin de ventas debe ser válida',
        'date.min': 'La fecha de fin de ventas debe ser posterior al inicio'
      }),
    
    youtube_url: Joi.string()
      .uri()
      .pattern(/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//)
      .optional()
      .messages({
        'string.uri': 'La URL de YouTube debe ser válida',
        'string.pattern.base': 'La URL debe ser de YouTube'
      }),
    
    image_url: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.uri': 'La URL de imagen debe ser válida'
      }),
    
    featured: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'Featured debe ser verdadero o falso'
      }),
    
    seat_map_id: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'El ID del mapa de asientos debe ser un número',
        'number.integer': 'El ID del mapa de asientos debe ser un entero',
        'number.positive': 'El ID del mapa de asientos debe ser positivo'
      })
  }),

  // Validación para actualizar evento
  updateEvent: Joi.object({
    title: Joi.string()
      .min(3)
      .max(100)
      .optional(),
    
    slug: Joi.string()
      .pattern(/^[a-z0-9-]+$/)
      .min(3)
      .max(50)
      .optional(),
    
    description: Joi.string()
      .min(10)
      .max(500)
      .optional(),
    
    long_description: Joi.string()
      .min(20)
      .max(2000)
      .optional(),
    
    date: Joi.date()
      .iso()
      .min('now')
      .optional(),
    
    time: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional(),
    
    venue: Joi.string()
      .min(3)
      .max(100)
      .optional(),
    
    location: Joi.string()
      .min(5)
      .max(200)
      .optional(),
    
    category_id: Joi.number()
      .integer()
      .positive()
      .optional(),
    
    total_capacity: Joi.number()
      .integer()
      .min(1)
      .max(100000)
      .optional(),
    
    price: Joi.number()
      .precision(2)
      .min(0)
      .max(10000)
      .optional(),
    
    status: Joi.string()
      .valid('draft', 'published', 'cancelled', 'completed')
      .optional(),
    
    sales_start_date: Joi.date()
      .iso()
      .min('now')
      .optional(),
    
    sales_end_date: Joi.date()
      .iso()
      .min(Joi.ref('sales_start_date'))
      .optional(),
    
    youtube_url: Joi.string()
      .uri()
      .pattern(/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//)
      .optional(),
    
    image_url: Joi.string()
      .uri()
      .optional(),
    
    featured: Joi.boolean()
      .optional(),
    
    seat_map_id: Joi.number()
      .integer()
      .positive()
      .optional()
  }).min(1) // Al menos un campo debe ser proporcionado
};

/**
 * Middleware de validación para eventos
 */
const validateEvent = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Mostrar todos los errores
      stripUnknown: true, // Eliminar campos no definidos
      convert: true // Convertir tipos automáticamente
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      console.warn(`🚨 Validación fallida para evento:`, {
        ip: req.ip,
        user: req.user?.userId,
        errors: errorDetails
      });

      return res.status(400).json({
        success: false,
        message: 'Datos de evento inválidos',
        errors: errorDetails
      });
    }

    // Reemplazar req.body con los datos validados y sanitizados
    req.body = value;
    next();
  };
};

module.exports = {
  eventValidationSchemas,
  validateEvent
};
