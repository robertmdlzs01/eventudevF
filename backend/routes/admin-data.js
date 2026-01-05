const express = require('express')
const router = express.Router()
const { auth, requireRole } = require('../middleware/auth')
const AuditService = require('../services/auditService')

// Middleware para verificar que el usuario es administrador
const requireAdmin = requireRole('admin')

/**
 * POST /api/admin/populate-audit-data
 * Endpoint para poblar datos de auditoría realistas (solo para desarrollo)
 */
router.post('/populate-audit-data', auth, requireAdmin, async (req, res) => {
  try {
    console.log('🔧 Poblando datos de auditoría desde endpoint...')
    
    // Datos de ejemplo realistas
    const auditData = [
      {
        user_id: '1',
        user_name: 'Admin Principal',
        user_email: 'admin@eventu.com',
        action: 'CREATE_EVENT',
        resource: 'EVENT',
        resource_id: '1',
        details: {
          path: '/api/events',
          method: 'POST',
          statusCode: 201,
          duration: 245,
          eventName: 'Conferencia Tech 2024',
          eventId: '1'
        },
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: 'medium',
        status: 'success'
      },
      {
        user_id: '2',
        user_name: 'Organizador Eventos',
        user_email: 'organizer@eventu.com',
        action: 'UPDATE_EVENT',
        resource: 'EVENT',
        resource_id: '1',
        details: {
          path: '/api/events/1',
          method: 'PUT',
          statusCode: 200,
          duration: 189,
          eventName: 'Conferencia Tech 2024',
          changes: ['title', 'description']
        },
        ip_address: '192.168.1.101',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        severity: 'medium',
        status: 'success'
      },
      {
        user_id: '3',
        user_name: 'Usuario Regular',
        user_email: 'user@eventu.com',
        action: 'CREATE_TICKET',
        resource: 'TICKET',
        resource_id: '1',
        details: {
          path: '/api/tickets',
          method: 'POST',
          statusCode: 201,
          duration: 156,
          eventId: '1',
          ticketType: 'general',
          quantity: 2,
          totalAmount: 50000
        },
        ip_address: '192.168.1.102',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: 'low',
        status: 'success'
      },
      {
        user_id: '3',
        user_name: 'Usuario Regular',
        user_email: 'user@eventu.com',
        action: 'CREATE_PAYMENT',
        resource: 'PAYMENT',
        resource_id: '1',
        details: {
          path: '/api/payments',
          method: 'POST',
          statusCode: 201,
          duration: 234,
          amount: 50000,
          currency: 'COP',
          paymentMethod: 'credit_card',
          transactionId: 'TXN_123456'
        },
        ip_address: '192.168.1.102',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: 'medium',
        status: 'success'
      },
      {
        user_id: '1',
        user_name: 'Admin Principal',
        user_email: 'admin@eventu.com',
        action: 'ADMIN_READ',
        resource: 'ADMIN',
        resource_id: null,
        details: {
          path: '/api/admin/users',
          method: 'GET',
          statusCode: 200,
          duration: 89,
          filters: { role: 'user', status: 'active' }
        },
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: 'medium',
        status: 'success'
      },
      {
        user_id: '4',
        user_name: 'María García',
        user_email: 'maria@eventu.com',
        action: 'FAILED_LOGIN',
        resource: 'AUTH',
        resource_id: 'maria@eventu.com',
        details: {
          path: '/api/auth/login',
          method: 'POST',
          statusCode: 401,
          duration: 45,
          reason: 'Invalid password',
          attempts: 3
        },
        ip_address: '192.168.1.103',
        user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        severity: 'high',
        status: 'failure'
      },
      {
        user_id: '1',
        user_name: 'Admin Principal',
        user_email: 'admin@eventu.com',
        action: 'AUDIT_READ',
        resource: 'AUDIT',
        resource_id: null,
        details: {
          path: '/api/audit/logs',
          method: 'GET',
          statusCode: 200,
          duration: 123,
          filters: { limit: 50, offset: 0 }
        },
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: 'medium',
        status: 'success'
      },
      {
        user_id: '2',
        user_name: 'Organizador Eventos',
        user_email: 'organizer@eventu.com',
        action: 'REPORT_READ',
        resource: 'REPORT',
        resource_id: null,
        details: {
          path: '/api/reports/sales',
          method: 'GET',
          statusCode: 200,
          duration: 267,
          dateRange: 'last_30_days',
          eventId: '1'
        },
        ip_address: '192.168.1.101',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        severity: 'medium',
        status: 'success'
      },
      {
        user_id: '5',
        user_name: 'Carlos López',
        user_email: 'carlos@eventu.com',
        action: 'DELETE_TICKET',
        resource: 'TICKET',
        resource_id: '2',
        details: {
          path: '/api/tickets/2',
          method: 'DELETE',
          statusCode: 200,
          duration: 98,
          reason: 'User cancellation',
          refundAmount: 25000
        },
        ip_address: '192.168.1.104',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: 'medium',
        status: 'success'
      },
      {
        user_id: '1',
        user_name: 'Admin Principal',
        user_email: 'admin@eventu.com',
        action: 'ADMIN_DELETE',
        resource: 'ADMIN',
        resource_id: '6',
        details: {
          path: '/api/admin/users/6',
          method: 'DELETE',
          statusCode: 200,
          duration: 156,
          reason: 'Account violation',
          deletedUser: 'spam@example.com'
        },
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        severity: 'critical',
        status: 'success'
      }
    ]
    
    // Insertar los datos usando el servicio de auditoría
    const insertedIds = []
    for (const data of auditData) {
      const id = await AuditService.logActivity({
        userId: data.user_id,
        userName: data.user_name,
        userEmail: data.user_email,
        action: data.action,
        resource: data.resource,
        resourceId: data.resource_id,
        details: data.details,
        ipAddress: data.ip_address,
        userAgent: data.user_agent,
        severity: data.severity,
        status: data.status
      })
      if (id) insertedIds.push(id)
    }
    
    console.log(`✅ Insertados ${insertedIds.length} logs de auditoría`)
    
    res.json({
      success: true,
      message: `Se insertaron ${insertedIds.length} logs de auditoría realistas`,
      data: {
        insertedCount: insertedIds.length,
        insertedIds: insertedIds.slice(0, 5) // Mostrar solo los primeros 5 IDs
      }
    })
    
  } catch (error) {
    console.error('Error poblando datos de auditoría:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    })
  }
})

module.exports = router
