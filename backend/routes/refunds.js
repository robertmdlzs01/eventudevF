const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const { db } = require('../config/database-postgres');

// ===== GESTIÓN DE REEMBOLSOS =====

// Obtener todos los reembolsos (con filtros)
router.get('/', auth, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { status, search, dateFrom, dateTo, limit = 50, offset = 0 } = req.query;
        
        let query = `
            SELECT r.*, 
                   s.order_number as sale_order_number,
                   s.total_amount as sale_amount,
                   e.title as event_title
            FROM refunds r
            LEFT JOIN sales s ON r.sale_id = s.id
            LEFT JOIN events e ON s.event_id = e.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramCount = 0;
        
        if (status && status !== 'all') {
            paramCount++;
            query += ` AND r.status = $${paramCount}`;
            params.push(status);
        }
        
        if (search) {
            paramCount++;
            query += ` AND (
                r.order_number ILIKE $${paramCount} OR
                r.customer_name ILIKE $${paramCount} OR
                r.customer_email ILIKE $${paramCount}
            )`;
            params.push(`%${search}%`);
        }
        
        if (dateFrom) {
            paramCount++;
            query += ` AND r.created_at >= $${paramCount}`;
            params.push(dateFrom);
        }
        
        if (dateTo) {
            paramCount++;
            query += ` AND r.created_at <= $${paramCount}`;
            params.push(dateTo);
        }
        
        query += ` ORDER BY r.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(parseInt(limit), parseInt(offset));
        
        const result = await db.query(query, params);
        
        // Obtener total para paginación
        let countQuery = `
            SELECT COUNT(*) as total
            FROM refunds r
            WHERE 1=1
        `;
        const countParams = [];
        let countParamCount = 0;
        
        if (status && status !== 'all') {
            countParamCount++;
            countQuery += ` AND r.status = $${countParamCount}`;
            countParams.push(status);
        }
        
        if (search) {
            countParamCount++;
            countQuery += ` AND (
                r.order_number ILIKE $${countParamCount} OR
                r.customer_name ILIKE $${countParamCount} OR
                r.customer_email ILIKE $${countParamCount}
            )`;
            countParams.push(`%${search}%`);
        }
        
        if (dateFrom) {
            countParamCount++;
            countQuery += ` AND r.created_at >= $${countParamCount}`;
            countParams.push(dateFrom);
        }
        
        if (dateTo) {
            countParamCount++;
            countQuery += ` AND r.created_at <= $${countParamCount}`;
            countParams.push(dateTo);
        }
        
        const countResult = await db.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);
        
        res.json({
            success: true,
            refunds: result.rows,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('Error obteniendo reembolsos:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Obtener un reembolso específico
router.get('/:id', auth, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT r.*, 
                   s.order_number as sale_order_number,
                   s.total_amount as sale_amount,
                   s.status as sale_status,
                   e.title as event_title,
                   e.date as event_date
            FROM refunds r
            LEFT JOIN sales s ON r.sale_id = s.id
            LEFT JOIN events e ON s.event_id = e.id
            WHERE r.id = $1
        `;
        
        const result = await db.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Reembolso no encontrado' });
        }
        
        res.json({ success: true, refund: result.rows[0] });
    } catch (error) {
        console.error('Error obteniendo reembolso:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Crear nuevo reembolso
router.post('/', auth, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const {
            sale_id,
            order_number,
            customer_id,
            customer_name,
            customer_email,
            customer_phone,
            amount,
            reason,
            refund_method,
            notes
        } = req.body;
        
        if (!sale_id || !customer_name || !amount || !reason) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: sale_id, customer_name, amount, reason'
            });
        }
        
        // Verificar que la venta existe
        const saleQuery = `SELECT id, status, total_amount FROM sales WHERE id = $1`;
        const saleResult = await db.query(saleQuery, [sale_id]);
        
        if (saleResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Venta no encontrada' });
        }
        
        const sale = saleResult.rows[0];
        
        // Verificar que la venta no esté cancelada
        if (sale.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                error: 'No se puede crear un reembolso para una venta cancelada'
            });
        }
        
        // Verificar que el monto no exceda el total de la venta
        if (parseFloat(amount) > parseFloat(sale.total_amount)) {
            return res.status(400).json({
                success: false,
                error: 'El monto del reembolso no puede exceder el total de la venta'
            });
        }
        
        // Crear el reembolso
        const insertQuery = `
            INSERT INTO refunds (
                sale_id, order_number, customer_id, customer_name, customer_email, customer_phone,
                amount, reason, refund_method, notes, requested_by, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
            RETURNING *
        `;
        
        const result = await db.query(insertQuery, [
            sale_id,
            order_number || null,
            customer_id || null,
            customer_name,
            customer_email || null,
            customer_phone || null,
            amount,
            reason,
            refund_method || null,
            notes || null,
            req.user.id
        ]);
        
        res.json({ success: true, refund: result.rows[0] });
    } catch (error) {
        console.error('Error creando reembolso:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Aprobar reembolso
router.post('/:id/approve', auth, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        
        // Verificar que el reembolso existe y está pendiente
        const refundQuery = `SELECT * FROM refunds WHERE id = $1`;
        const refundResult = await db.query(refundQuery, [id]);
        
        if (refundResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Reembolso no encontrado' });
        }
        
        const refund = refundResult.rows[0];
        
        if (refund.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: `El reembolso ya está ${refund.status}`
            });
        }
        
        // Actualizar estado
        const updateQuery = `
            UPDATE refunds 
            SET status = 'approved',
                approved_by = $1,
                approved_at = CURRENT_TIMESTAMP,
                notes = CASE WHEN $2 IS NOT NULL THEN $2 ELSE notes END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `;
        
        const result = await db.query(updateQuery, [req.user.id, notes, id]);
        
        res.json({ success: true, refund: result.rows[0] });
    } catch (error) {
        console.error('Error aprobando reembolso:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Rechazar reembolso
router.post('/:id/reject', auth, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        
        if (!reason) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere una razón para rechazar el reembolso'
            });
        }
        
        // Verificar que el reembolso existe y está pendiente
        const refundQuery = `SELECT * FROM refunds WHERE id = $1`;
        const refundResult = await db.query(refundQuery, [id]);
        
        if (refundResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Reembolso no encontrado' });
        }
        
        const refund = refundResult.rows[0];
        
        if (refund.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: `El reembolso ya está ${refund.status}`
            });
        }
        
        // Actualizar estado
        const updateQuery = `
            UPDATE refunds 
            SET status = 'rejected',
                rejected_at = CURRENT_TIMESTAMP,
                notes = CASE WHEN $1 IS NOT NULL THEN notes || E'\\n\\nRazón de rechazo: ' || $1 ELSE notes END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;
        
        const result = await db.query(updateQuery, [reason, id]);
        
        res.json({ success: true, refund: result.rows[0] });
    } catch (error) {
        console.error('Error rechazando reembolso:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Procesar reembolso (devolver dinero)
router.post('/:id/process', auth, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { transaction_id, notes } = req.body;
        
        // Verificar que el reembolso existe y está aprobado
        const refundQuery = `SELECT * FROM refunds WHERE id = $1`;
        const refundResult = await db.query(refundQuery, [id]);
        
        if (refundResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Reembolso no encontrado' });
        }
        
        const refund = refundResult.rows[0];
        
        if (refund.status !== 'approved') {
            return res.status(400).json({
                success: false,
                error: 'Solo se pueden procesar reembolsos aprobados'
            });
        }
        
        // Iniciar transacción
        await db.query('BEGIN');
        
        try {
            // Actualizar estado del reembolso
            const updateQuery = `
                UPDATE refunds 
                SET status = 'processed',
                    processed_by = $1,
                    processed_at = CURRENT_TIMESTAMP,
                    notes = CASE WHEN $2 IS NOT NULL THEN notes || E'\\n\\n' || $2 ELSE notes END,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
                RETURNING *
            `;
            
            const result = await db.query(updateQuery, [req.user.id, notes, id]);
            
            // Aquí se podría integrar con la pasarela de pago para reversar la transacción
            // Por ahora solo actualizamos el estado
            
            // Cancelar los tickets asociados a la venta
            await db.query(
                `UPDATE tickets SET status = 'cancelled' WHERE sale_id = $1`,
                [refund.sale_id]
            );
            
            // Actualizar cantidad vendida del tipo de ticket
            await db.query(
                `UPDATE ticket_types 
                 SET sold = sold - (
                     SELECT COUNT(*) FROM tickets WHERE sale_id = $1
                 )
                 WHERE id = (
                     SELECT ticket_type_id FROM sales WHERE id = $1
                 )`,
                [refund.sale_id]
            );
            
            // Actualizar estado de la venta
            await db.query(
                `UPDATE sales SET status = 'refunded', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
                [refund.sale_id]
            );
            
            await db.query('COMMIT');
            
            res.json({ success: true, refund: result.rows[0] });
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error procesando reembolso:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

// Verificar si una venta es elegible para reembolso
router.get('/sales/:saleId/eligible', auth, requireRole(['admin', 'manager']), async (req, res) => {
    try {
        const { saleId } = req.params;
        
        const query = `
            SELECT s.*, 
                   COUNT(r.id) as refund_count,
                   COALESCE(SUM(r.amount), 0) as total_refunded
            FROM sales s
            LEFT JOIN refunds r ON s.id = r.sale_id AND r.status IN ('approved', 'processed')
            WHERE s.id = $1
            GROUP BY s.id
        `;
        
        const result = await db.query(query, [saleId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Venta no encontrada' });
        }
        
        const sale = result.rows[0];
        const isEligible = sale.status === 'completed' && 
                          parseFloat(sale.total_refunded) < parseFloat(sale.total_amount);
        
        res.json({
            success: true,
            eligible: isEligible,
            sale: sale,
            canRefundAmount: parseFloat(sale.total_amount) - parseFloat(sale.total_refunded)
        });
    } catch (error) {
        console.error('Error verificando elegibilidad:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
});

module.exports = router;
