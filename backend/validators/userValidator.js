const Joi = require('joi');

/**
 * Validaciones robustas para usuarios con Joi
 */
const userValidationSchemas = {
  // Validación para registro de usuario
  register: Joi.object({
    first_name: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .required()
      .messages({
        'string.min': 'El nombre debe tener al menos 2 caracteres',
        'string.max': 'El nombre no puede exceder 50 caracteres',
        'string.pattern.base': 'El nombre solo puede contener letras y espacios',
        'any.required': 'El nombre es obligatorio'
      }),
    
    last_name: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .required()
      .messages({
        'string.min': 'El apellido debe tener al menos 2 caracteres',
        'string.max': 'El apellido no puede exceder 50 caracteres',
        'string.pattern.base': 'El apellido solo puede contener letras y espacios',
        'any.required': 'El apellido es obligatorio'
      }),
    
    email: Joi.string()
      .email()
      .max(100)
      .required()
      .messages({
        'string.email': 'El email debe tener un formato válido',
        'string.max': 'El email no puede exceder 100 caracteres',
        'any.required': 'El email es obligatorio'
      }),
    
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'La contraseña debe tener al menos 8 caracteres',
        'string.max': 'La contraseña no puede exceder 128 caracteres',
        'string.pattern.base': 'La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial',
        'any.required': 'La contraseña es obligatoria'
      }),
    
    confirm_password: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Las contraseñas no coinciden',
        'any.required': 'La confirmación de contraseña es obligatoria'
      }),
    
    phone: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .optional()
      .messages({
        'string.pattern.base': 'El teléfono debe tener un formato válido internacional'
      }),
    
    role: Joi.string()
      .valid('user', 'organizer', 'admin')
      .default('user')
      .messages({
        'any.only': 'El rol debe ser: user, organizer o admin'
      })
  }),

  // Validación para login
  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'El email debe tener un formato válido',
        'any.required': 'El email es obligatorio'
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'La contraseña es obligatoria'
      }),
    
    remember_me: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'Remember me debe ser verdadero o falso'
      })
  }),

  // Validación para actualizar perfil
  updateProfile: Joi.object({
    first_name: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .optional(),
    
    last_name: Joi.string()
      .min(2)
      .max(50)
      .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .optional(),
    
    email: Joi.string()
      .email()
      .max(100)
      .optional(),
    
    phone: Joi.string()
      .pattern(/^\+?[1-9]\d{1,14}$/)
      .optional(),
    
    current_password: Joi.string()
      .when('password', {
        is: Joi.exist(),
        then: Joi.required(),
        otherwise: Joi.optional()
      })
      .messages({
        'any.required': 'La contraseña actual es requerida para cambiar la contraseña'
      }),
    
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .optional()
      .messages({
        'string.min': 'La contraseña debe tener al menos 8 caracteres',
        'string.max': 'La contraseña no puede exceder 128 caracteres',
        'string.pattern.base': 'La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial'
      }),
    
    confirm_password: Joi.string()
      .when('password', {
        is: Joi.exist(),
        then: Joi.valid(Joi.ref('password')).required(),
        otherwise: Joi.optional()
      })
      .messages({
        'any.only': 'Las contraseñas no coinciden',
        'any.required': 'La confirmación de contraseña es requerida'
      })
  }).min(1), // Al menos un campo debe ser proporcionado

  // Validación para cambio de contraseña
  changePassword: Joi.object({
    current_password: Joi.string()
      .required()
      .messages({
        'any.required': 'La contraseña actual es obligatoria'
      }),
    
    new_password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'La nueva contraseña debe tener al menos 8 caracteres',
        'string.max': 'La nueva contraseña no puede exceder 128 caracteres',
        'string.pattern.base': 'La nueva contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial',
        'any.required': 'La nueva contraseña es obligatoria'
      }),
    
    confirm_new_password: Joi.string()
      .valid(Joi.ref('new_password'))
      .required()
      .messages({
        'any.only': 'Las contraseñas no coinciden',
        'any.required': 'La confirmación de la nueva contraseña es obligatoria'
      })
  }),

  // Validación para recuperación de contraseña
  forgotPassword: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'El email debe tener un formato válido',
        'any.required': 'El email es obligatorio'
      })
  }),

  // Validación para reset de contraseña
  resetPassword: Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'any.required': 'El token de reset es obligatorio'
      }),
    
    new_password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'La nueva contraseña debe tener al menos 8 caracteres',
        'string.max': 'La nueva contraseña no puede exceder 128 caracteres',
        'string.pattern.base': 'La nueva contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial',
        'any.required': 'La nueva contraseña es obligatoria'
      }),
    
    confirm_new_password: Joi.string()
      .valid(Joi.ref('new_password'))
      .required()
      .messages({
        'any.only': 'Las contraseñas no coinciden',
        'any.required': 'La confirmación de la nueva contraseña es obligatoria'
      })
  }),

  // Validación para 2FA
  twoFactorAuth: Joi.object({
    code: Joi.string()
      .length(6)
      .pattern(/^\d{6}$/)
      .required()
      .messages({
        'string.length': 'El código 2FA debe tener exactamente 6 dígitos',
        'string.pattern.base': 'El código 2FA solo puede contener números',
        'any.required': 'El código 2FA es obligatorio'
      })
  })
};

/**
 * Middleware de validación para usuarios
 */
const validateUser = (schema) => {
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

      console.warn(`🚨 Validación fallida para usuario:`, {
        ip: req.ip,
        user: req.user?.userId,
        errors: errorDetails
      });

      return res.status(400).json({
        success: false,
        message: 'Datos de usuario inválidos',
        errors: errorDetails
      });
    }

    // Reemplazar req.body con los datos validados y sanitizados
    req.body = value;
    next();
  };
};

module.exports = {
  userValidationSchemas,
  validateUser
};
