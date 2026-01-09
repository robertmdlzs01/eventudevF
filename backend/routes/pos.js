const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { db } = require('../config/database-postgres');

// ===== GESTIÓN DE CAJAS REGISTRADORAS =====

// Obtener todas las cajas registradoras
router.get('/registers', auth, async (req, res) => {
    try {
        const query = `
            SELECT r.*, 
                   COUNT(ru.user_id) as user_count,
                   COUNT(CASE WHEN rs.is_active = true THEN 1 END) as active_sessions
            FROM pos_registers r
            LEFT JOIN pos_register_users ru ON r.id = ru.register_id
            LEFT JOIN pos_register_sessions rs ON r.id = rs.register_id
            WHERE r.is_active = true
            GROUP BY r.id
            ORDER BY r.name
        `;
        
        const result = await db.query(query);
        res.json({ success: true, registers: result.rows });
    } catch (error) {
        console.error('Error obteniendo cajas registradoras:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Crear nueva caja registradora
router.post('/registers', auth, async (req, res) => {
    try {
        const { name, location } = req.body;
        
        if (!name) {
            return res.status(400).json({ success: false, error: 'El nombre es requerido' });
        }

        const query = `
            INSERT INTO pos_registers (name, location, is_active)
            VALUES ($1, $2, true)
            RETURNING *
        `;
        
        const result = await db.query(query, [name, location]);
        res.json({ success: true, register: result.rows[0] });
    } catch (error) {
        console.error('Error creando caja registradora:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Actualizar caja registradora
router.put('/registers/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, location, is_active } = req.body;
        
        const query = `
            UPDATE pos_registers 
            SET name = $1, location = $2, is_active = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING *
        `;
        
        const result = await db.query(query, [name, location, is_active, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Caja registradora no encontrada' });
        }
        
        res.json({ success: true, register: result.rows[0] });
    } catch (error) {
        console.error('Error actualizando caja registradora:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Eliminar caja registradora
router.delete('/registers/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar si hay sesiones activas
        const activeSessionQuery = `
            SELECT COUNT(*) as count FROM pos_register_sessions 
            WHERE register_id = $1 AND is_active = true
        `;
        
        const activeSessionResult = await db.query(activeSessionQuery, [id]);
        
        if (parseInt(activeSessionResult.rows[0].count) > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'No se puede eliminar una caja con sesiones activas. Cierre las sesiones primero.' 
            });
        }
        
        // Desactivar la caja en lugar de eliminarla físicamente (soft delete)
        const query = `
            UPDATE pos_registers 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;
        
        const result = await db.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Caja registradora no encontrada' });
        }
        
        res.json({ success: true, message: 'Caja registradora eliminada exitosamente', register: result.rows[0] });
    } catch (error) {
        console.error('Error eliminando caja registradora:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// ===== GESTIÓN DE SESIONES DE CAJA =====

// Abrir sesión de caja
router.post('/sessions/open', auth, async (req, res) => {
    try {
        const { register_id, opening_amount } = req.body;
        const user_id = req.user.id;
        
        // Verificar si el usuario puede abrir esta caja
        const checkQuery = `
            SELECT ru.* FROM pos_register_users ru
            WHERE ru.register_id = $1 AND ru.user_id = $2 AND ru.can_open = true
        `;
        
        const checkResult = await db.query(checkQuery, [register_id, user_id]);
        
        if (checkResult.rows.length === 0) {
            return res.status(403).json({ success: false, error: 'No tienes permisos para abrir esta caja' });
        }
        
        // Verificar si ya hay una sesión activa
        const activeSessionQuery = `
            SELECT * FROM pos_register_sessions 
            WHERE register_id = $1 AND is_active = true
        `;
        
        const activeSession = await db.query(activeSessionQuery, [register_id]);
        
        if (activeSession.rows.length > 0) {
            return res.status(400).json({ success: false, error: 'Ya hay una sesión activa en esta caja' });
        }
        
        // Crear nueva sesión
        const insertQuery = `
            INSERT INTO pos_register_sessions (register_id, user_id, opening_amount, is_active)
            VALUES ($1, $2, $3, true)
            RETURNING *
        `;
        
        const result = await db.query(insertQuery, [register_id, user_id, opening_amount || 0]);
        
        res.json({ success: true, session: result.rows[0] });
    } catch (error) {
        console.error('Error abriendo sesión de caja:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Cerrar sesión de caja
router.post('/sessions/:id/close', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { closing_amount } = req.body;
        const user_id = req.user.id;
        
        // Verificar si la sesión existe y está activa
        const sessionQuery = `
            SELECT rs.*, ru.can_close FROM pos_register_sessions rs
            JOIN pos_register_users ru ON rs.register_id = ru.register_id AND ru.user_id = $2
            WHERE rs.id = $1 AND rs.is_active = true
        `;
        
        const sessionResult = await db.query(sessionQuery, [id, user_id]);
        
        if (sessionResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Sesión no encontrada o no tienes permisos' });
        }
        
        if (!sessionResult.rows[0].can_close) {
            return res.status(403).json({ success: false, error: 'No tienes permisos para cerrar esta caja' });
        }
        
        // Calcular total de ventas
        const salesQuery = `
            SELECT COALESCE(SUM(total_amount), 0) as total_sales,
                   COALESCE(SUM(CASE WHEN order_status = 'refunded' THEN total_amount ELSE 0 END), 0) as total_refunds
            FROM pos_orders 
            WHERE session_id = $1
        `;
        
        const salesResult = await db.query(salesQuery, [id]);
        const { total_sales, total_refunds } = salesResult.rows[0];
        
        // Cerrar sesión
        const closeQuery = `
            UPDATE pos_register_sessions 
            SET closed_at = CURRENT_TIMESTAMP, 
                closing_amount = $1,
                total_sales = $2,
                total_refunds = $3,
                is_active = false
            WHERE id = $4
            RETURNING *
        `;
        
        const result = await db.query(closeQuery, [closing_amount, total_sales, total_refunds, id]);
        
        res.json({ success: true, session: result.rows[0] });
    } catch (error) {
        console.error('Error cerrando sesión de caja:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Obtener sesiones activas
router.get('/sessions/active', auth, async (req, res) => {
    try {
        const query = `
            SELECT rs.*, r.name as register_name, u.name as user_name
            FROM pos_register_sessions rs
            JOIN pos_registers r ON rs.register_id = r.id
            JOIN users u ON rs.user_id = u.id
            WHERE rs.is_active = true
            ORDER BY rs.opened_at DESC
        `;
        
        const result = await db.query(query);
        res.json({ success: true, sessions: result.rows });
    } catch (error) {
        console.error('Error obteniendo sesiones activas:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Obtener sesiones por caja registradora
router.get('/registers/:id/sessions', auth, async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT rs.*, r.name as register_name, u.name as user_name, u.email as user_email
            FROM pos_register_sessions rs
            JOIN pos_registers r ON rs.register_id = r.id
            JOIN users u ON rs.user_id = u.id
            WHERE rs.register_id = $1
            ORDER BY rs.opened_at DESC
            LIMIT 50
        `;
        
        const result = await db.query(query, [id]);
        res.json({ success: true, sessions: result.rows });
    } catch (error) {
        console.error('Error obteniendo sesiones de caja:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// ===== GESTIÓN DE ÓRDENES POS =====

// Crear nueva orden
router.post('/orders', auth, async (req, res) => {
    try {
        const { register_id, session_id, customer_name, customer_email, customer_phone, items, payment_method } = req.body;
        const user_id = req.user.id;
        
        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, error: 'La orden debe tener al menos un item' });
        }
        
        // Calcular totales
        let subtotal = 0;
        let total_amount = 0;
        
        for (const item of items) {
            const item_total = item.quantity * item.unit_price;
            subtotal += item_total;
        }
        
        total_amount = subtotal; // Por ahora sin impuestos ni descuentos
        
        // Generar número de orden
        const order_number = `POS-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        
        // Crear orden
        const orderQuery = `
            INSERT INTO pos_orders (register_id, session_id, user_id, order_number, customer_name, customer_email, customer_phone, subtotal, total_amount, payment_method, payment_status, order_status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'completed', 'completed')
            RETURNING *
        `;
        
        const orderResult = await db.query(orderQuery, [
            register_id, session_id, user_id, order_number, customer_name, customer_email, customer_phone, subtotal, total_amount, payment_method
        ]);
        
        const order_id = orderResult.rows[0].id;
        
        // Crear items de la orden
        for (const item of items) {
            const itemQuery = `
                INSERT INTO pos_order_items (order_id, product_id, product_name, product_sku, quantity, unit_price, total_price)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;
            
            await db.query(itemQuery, [
                order_id, item.product_id, item.product_name, item.product_sku, item.quantity, item.unit_price, item.quantity * item.unit_price
            ]);
        }
        
        // Crear pago
        const paymentQuery = `
            INSERT INTO pos_payments (order_id, payment_method, amount, status)
            VALUES ($1, $2, $3, 'completed')
        `;
        
        await db.query(paymentQuery, [order_id, payment_method, total_amount]);
        
        res.json({ success: true, order: orderResult.rows[0] });
    } catch (error) {
        console.error('Error creando orden:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Obtener órdenes por sesión
router.get('/orders/session/:session_id', auth, async (req, res) => {
    try {
        const { session_id } = req.params;
        
        const query = `
            SELECT o.*, 
                   r.name as register_name,
                   u.name as user_name,
                   COUNT(oi.id) as item_count
            FROM pos_orders o
            JOIN pos_registers r ON o.register_id = r.id
            JOIN users u ON o.user_id = u.id
            LEFT JOIN pos_order_items oi ON o.id = oi.order_id
            WHERE o.session_id = $1
            GROUP BY o.id, r.name, u.name
            ORDER BY o.created_at DESC
        `;
        
        const result = await db.query(query, [session_id]);
        res.json({ success: true, orders: result.rows });
    } catch (error) {
        console.error('Error obteniendo órdenes:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Obtener detalles de orden
router.get('/orders/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Obtener orden
        const orderQuery = `
            SELECT o.*, r.name as register_name, u.name as user_name
            FROM pos_orders o
            JOIN pos_registers r ON o.register_id = r.id
            JOIN users u ON o.user_id = u.id
            WHERE o.id = $1
        `;
        
        const orderResult = await db.query(orderQuery, [id]);
        
        if (orderResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Orden no encontrada' });
        }
        
        // Obtener items de la orden
        const itemsQuery = `
            SELECT oi.*, p.name as product_name, p.sku as product_sku
            FROM pos_order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = $1
        `;
        
        const itemsResult = await db.query(itemsQuery, [id]);
        
        // Obtener pagos
        const paymentsQuery = `
            SELECT * FROM pos_payments WHERE order_id = $1
        `;
        
        const paymentsResult = await db.query(paymentsQuery, [id]);
        
        res.json({ 
            success: true, 
            order: orderResult.rows[0],
            items: itemsResult.rows,
            payments: paymentsResult.rows
        });
    } catch (error) {
        console.error('Error obteniendo detalles de orden:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

module.exports = router;
