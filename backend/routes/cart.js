const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { db } = require('../config/database-postgres');

// Obtener carrito del usuario
router.get('/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Simular carrito (en producción esto vendría de la base de datos)
    const cart = {
      id: `cart_${sessionId}`,
      sessionId,
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      discount: 0,
      fees: {
        serviceFee: 0,
        processingFee: 0,
        convenienceFee: 0
      },
      status: 'active',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error obteniendo carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Agregar item al carrito
router.post('/:sessionId/items', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { productId, productName, productType, eventId, eventName, ticketType, seatNumber, price, quantity } = req.body;
    
    // Validar datos requeridos
    if (!productId || !productName || !price || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Datos requeridos: productId, productName, price, quantity'
      });
    }

    // Crear item del carrito
    const item = {
      id: `item_${Date.now()}`,
      productId,
      productName,
      productType: productType || 'ticket',
      eventId,
      eventName,
      ticketType,
      seatNumber,
      price: parseFloat(price),
      quantity: parseInt(quantity),
      subtotal: parseFloat(price) * parseInt(quantity),
      tax: parseFloat(price) * parseInt(quantity) * 0.19, // 19% impuesto
      total: parseFloat(price) * parseInt(quantity) * 1.19,
      metadata: {
        eventDate: req.body.eventDate,
        eventLocation: req.body.eventLocation,
        seatSection: req.body.seatSection,
        gate: req.body.gate,
        restrictions: req.body.restrictions || [],
        imageUrl: req.body.imageUrl
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Simular agregar al carrito
    console.log('Item agregado al carrito:', item);

    res.json({
      success: true,
      message: 'Item agregado al carrito',
      data: item
    });
  } catch (error) {
    console.error('Error agregando item al carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar cantidad de item
router.put('/:sessionId/items/:itemId', auth, async (req, res) => {
  try {
    const { sessionId, itemId } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Cantidad debe ser mayor a 0'
      });
    }

    // Simular actualización
    console.log(`Actualizando item ${itemId} en carrito ${sessionId} a cantidad ${quantity}`);

    res.json({
      success: true,
      message: 'Cantidad actualizada'
    });
  } catch (error) {
    console.error('Error actualizando item:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Remover item del carrito
router.delete('/:sessionId/items/:itemId', auth, async (req, res) => {
  try {
    const { sessionId, itemId } = req.params;
    
    // Simular remoción
    console.log(`Removiendo item ${itemId} del carrito ${sessionId}`);

    res.json({
      success: true,
      message: 'Item removido del carrito'
    });
  } catch (error) {
    console.error('Error removiendo item:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Limpiar carrito
router.delete('/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Simular limpieza
    console.log(`Limpiando carrito ${sessionId}`);

    res.json({
      success: true,
      message: 'Carrito limpiado'
    });
  } catch (error) {
    console.error('Error limpiando carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Aplicar descuento
router.post('/:sessionId/discount', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Código de descuento requerido'
      });
    }

    // Descuentos disponibles
    const discounts = {
      'EARLYBIRD': { type: 'percentage', value: 10, minAmount: 50000 },
      'STUDENT': { type: 'percentage', value: 15, minAmount: 30000 },
      'FIRSTTIME': { type: 'fixed', value: 20000, minAmount: 100000 }
    };

    const discount = discounts[code.toUpperCase()];
    if (!discount) {
      return res.status(400).json({
        success: false,
        message: 'Código de descuento no válido'
      });
    }

    res.json({
      success: true,
      message: 'Descuento aplicado',
      data: discount
    });
  } catch (error) {
    console.error('Error aplicando descuento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Remover descuento
router.delete('/:sessionId/discount', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    console.log(`Removiendo descuento del carrito ${sessionId}`);

    res.json({
      success: true,
      message: 'Descuento removido'
    });
  } catch (error) {
    console.error('Error removiendo descuento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Validar carrito
router.post('/:sessionId/validate', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Simular validación
    const validation = {
      isValid: true,
      errors: []
    };

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validando carrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Completar compra
router.post('/:sessionId/checkout', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { paymentData } = req.body;
    
    if (!paymentData) {
      return res.status(400).json({
        success: false,
        message: 'Datos de pago requeridos'
      });
    }

    // Simular procesamiento de pago
    const orderId = `order_${Date.now()}`;
    
    console.log(`Procesando compra para carrito ${sessionId}:`, paymentData);

    res.json({
      success: true,
      message: 'Compra completada exitosamente',
      data: {
        orderId,
        status: 'completed',
        total: req.body.total || 0
      }
    });
  } catch (error) {
    console.error('Error completando compra:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener estadísticas del carrito
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = {
      activeCarts: 0,
      abandonedCarts: 0,
      completedCarts: 0,
      totalRevenue: 0,
      averageCartValue: 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
