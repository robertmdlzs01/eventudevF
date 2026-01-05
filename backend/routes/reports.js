const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { db } = require('../config/database-postgres');

// Generar reporte de ventas
router.get('/sales', auth, async (req, res) => {
  try {
    const { startDate, endDate, eventId, userId, status, paymentMethod } = req.query;
    
    // Construir consulta SQL
    let query = `
      SELECT 
        s.id,
        s.total_amount,
        s.created_at,
        s.status,
        s.payment_method,
        u.first_name,
        u.last_name,
        u.email,
        e.title as event_name
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN events e ON s.event_id = e.id
      WHERE s.created_at BETWEEN $1 AND $2
    `;
    
    const params = [startDate, endDate];
    let paramCount = 3;
    
    if (eventId) {
      query += ` AND s.event_id = $${paramCount}`;
      params.push(eventId);
      paramCount++;
    }
    
    if (userId) {
      query += ` AND s.user_id = $${paramCount}`;
      params.push(userId);
      paramCount++;
    }
    
    if (status) {
      query += ` AND s.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (paymentMethod) {
      query += ` AND s.payment_method = $${paramCount}`;
      params.push(paymentMethod);
      paramCount++;
    }
    
    query += ' ORDER BY s.created_at DESC';
    
    const result = await db.query(query, params);
    const sales = result.rows;
    
    // Calcular estadísticas
    const totalSales = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0);
    const totalOrders = sales.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    // Ventas por fecha
    const salesByDate = {};
    sales.forEach(sale => {
      const date = sale.created_at.toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = { sales: 0, orders: 0 };
      }
      salesByDate[date].sales += parseFloat(sale.total_amount || 0);
      salesByDate[date].orders += 1;
    });
    
    // Ventas por evento
    const salesByEvent = {};
    sales.forEach(sale => {
      if (sale.event_name) {
        if (!salesByEvent[sale.event_name]) {
          salesByEvent[sale.event_name] = { sales: 0, orders: 0 };
        }
        salesByEvent[sale.event_name].sales += parseFloat(sale.total_amount || 0);
        salesByEvent[sale.event_name].orders += 1;
      }
    });
    
    // Ventas por método de pago
    const salesByPaymentMethod = {};
    sales.forEach(sale => {
      const method = sale.payment_method || 'unknown';
      if (!salesByPaymentMethod[method]) {
        salesByPaymentMethod[method] = { sales: 0, orders: 0 };
      }
      salesByPaymentMethod[method].sales += parseFloat(sale.total_amount || 0);
      salesByPaymentMethod[method].orders += 1;
    });
    
    // Top clientes
    const topCustomers = {};
    sales.forEach(sale => {
      if (sale.first_name && sale.last_name) {
        const customerName = `${sale.first_name} ${sale.last_name}`;
        if (!topCustomers[customerName]) {
          topCustomers[customerName] = { totalSpent: 0, orders: 0 };
        }
        topCustomers[customerName].totalSpent += parseFloat(sale.total_amount || 0);
        topCustomers[customerName].orders += 1;
      }
    });
    
    // Calcular reembolsos
    const refundedSales = sales.filter(sale => sale.status === 'refunded');
    const totalRefunds = refundedSales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0);
    const refundRate = totalOrders > 0 ? (refundedSales.length / totalOrders) * 100 : 0;
    
    const report = {
      totalSales,
      totalOrders,
      averageOrderValue,
      salesByDate: Object.entries(salesByDate).map(([date, data]) => ({
        date,
        sales: data.sales,
        orders: data.orders
      })),
      salesByEvent: Object.entries(salesByEvent).map(([eventName, data]) => ({
        eventId: 0, // Se puede mejorar
        eventName,
        sales: data.sales,
        orders: data.orders,
        percentage: totalSales > 0 ? (data.sales / totalSales) * 100 : 0
      })),
      salesByPaymentMethod: Object.entries(salesByPaymentMethod).map(([method, data]) => ({
        method,
        sales: data.sales,
        orders: data.orders,
        percentage: totalSales > 0 ? (data.sales / totalSales) * 100 : 0
      })),
      topCustomers: Object.entries(topCustomers)
        .map(([customerName, data]) => ({
          userId: 0, // Se puede mejorar
          customerName,
          totalSpent: data.totalSpent,
          orders: data.orders
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10),
      refunds: {
        totalRefunds,
        refundedOrders: refundedSales.length,
        refundRate
      }
    };
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generando reporte de ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Generar reporte de eventos
router.get('/events/:eventId', auth, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Obtener información del evento
    const eventQuery = 'SELECT * FROM events WHERE id = $1';
    const eventResult = await db.query(eventQuery, [eventId]);
    
    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }
    
    const event = eventResult.rows[0];
    
    // Obtener ventas del evento
    const salesQuery = `
      SELECT 
        s.*,
        u.first_name,
        u.last_name,
        u.email
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.event_id = $1
      AND s.created_at BETWEEN $2 AND $3
    `;
    
    const salesResult = await db.query(salesQuery, [eventId, startDate, endDate]);
    const sales = salesResult.rows;
    
    // Calcular estadísticas del evento
    const totalTickets = parseInt(event.capacity || 0);
    const soldTickets = sales.reduce((sum, sale) => sum + parseInt(sale.quantity || 0), 0);
    const availableTickets = totalTickets - soldTickets;
    const occupancyRate = totalTickets > 0 ? (soldTickets / totalTickets) * 100 : 0;
    const revenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0);
    const averageTicketPrice = soldTickets > 0 ? revenue / soldTickets : 0;
    
    // Ventas por tipo de ticket (simulado)
    const salesByTicketType = [
      {
        ticketType: 'General',
        sold: Math.floor(soldTickets * 0.6),
        revenue: revenue * 0.6,
        percentage: 60
      },
      {
        ticketType: 'VIP',
        sold: Math.floor(soldTickets * 0.3),
        revenue: revenue * 0.3,
        percentage: 30
      },
      {
        ticketType: 'Premium',
        sold: Math.floor(soldTickets * 0.1),
        revenue: revenue * 0.1,
        percentage: 10
      }
    ];
    
    // Check-ins (simulado)
    const checkIns = {
      total: Math.floor(soldTickets * 0.85), // 85% de asistencia
      percentage: 85
    };
    
    const report = {
      eventId: parseInt(eventId),
      eventName: event.title,
      eventDate: event.date,
      totalTickets,
      soldTickets,
      availableTickets,
      occupancyRate,
      revenue,
      averageTicketPrice,
      salesByTicketType,
      salesByDate: [], // Se puede implementar
      checkIns
    };
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generando reporte de evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Generar reporte de clientes
router.get('/customers', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Obtener estadísticas de clientes
    const customersQuery = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.created_at,
        COUNT(s.id) as total_orders,
        SUM(s.total_amount) as total_spent,
        MAX(s.created_at) as last_purchase
      FROM users u
      LEFT JOIN sales s ON u.id = s.user_id
      WHERE s.created_at BETWEEN $1 AND $2 OR s.created_at IS NULL
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.created_at
    `;
    
    const result = await db.query(customersQuery, [startDate, endDate]);
    const customers = result.rows;
    
    const totalCustomers = customers.length;
    const newCustomers = customers.filter(c => new Date(c.created_at) >= new Date(startDate)).length;
    const returningCustomers = totalCustomers - newCustomers;
    const customerRetentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;
    const averageCustomerValue = customers.reduce((sum, c) => sum + parseFloat(c.total_spent || 0), 0) / totalCustomers;
    
    // Top clientes
    const topCustomers = customers
      .sort((a, b) => parseFloat(b.total_spent || 0) - parseFloat(a.total_spent || 0))
      .slice(0, 10)
      .map(customer => ({
        customerId: customer.id,
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
        totalSpent: parseFloat(customer.total_spent || 0),
        orders: parseInt(customer.total_orders || 0),
        lastPurchase: customer.last_purchase
      }));
    
    const report = {
      totalCustomers,
      newCustomers,
      returningCustomers,
      customerRetentionRate,
      averageCustomerValue,
      customersByLocation: [], // Se puede implementar
      customerSegments: [], // Se puede implementar
      topCustomers
    };
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generando reporte de clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Generar reporte financiero
router.get('/financial', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Obtener datos financieros
    const financialQuery = `
      SELECT 
        SUM(total_amount) as total_revenue,
        COUNT(*) as total_orders,
        AVG(total_amount) as average_order_value
      FROM sales
      WHERE created_at BETWEEN $1 AND $2
      AND status != 'refunded'
    `;
    
    const result = await db.query(financialQuery, [startDate, endDate]);
    const financial = result.rows[0];
    
    const totalRevenue = parseFloat(financial.total_revenue || 0);
    const totalCosts = totalRevenue * 0.3; // 30% de costos (simulado)
    const grossProfit = totalRevenue - totalCosts;
    const netProfit = grossProfit * 0.8; // 20% de impuestos (simulado)
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    const report = {
      totalRevenue,
      totalCosts,
      grossProfit,
      netProfit,
      profitMargin,
      revenueByMonth: [], // Se puede implementar
      revenueByEvent: [], // Se puede implementar
      paymentMethods: [], // Se puede implementar
      refunds: {
        totalRefunds: 0,
        refundedRevenue: 0,
        refundRate: 0
      }
    };
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generando reporte financiero:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Generar reporte de inventario
router.get('/inventory', auth, async (req, res) => {
  try {
    // Simular datos de inventario
    const report = {
      totalProducts: 50,
      totalTickets: 1000,
      soldTickets: 750,
      availableTickets: 250,
      lowStockItems: [
        {
          productId: 1,
          productName: 'Ticket VIP',
          currentStock: 5,
          minStock: 10
        }
      ],
      bestSellingProducts: [
        {
          productId: 1,
          productName: 'Ticket General',
          sold: 500,
          revenue: 2500000
        }
      ],
      slowMovingProducts: []
    };
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generando reporte de inventario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Generar reporte de rendimiento
router.get('/performance', auth, async (req, res) => {
  try {
    // Simular datos de rendimiento
    const report = {
      totalSessions: 1500,
      activeUsers: 120,
      averageSessionDuration: 8.5,
      bounceRate: 25.5,
      conversionRate: 3.2,
      topPages: [
        {
          page: '/eventos',
          views: 500,
          uniqueViews: 400,
          conversionRate: 4.5
        }
      ],
      trafficSources: [
        {
          source: 'Google',
          visits: 800,
          conversions: 25,
          conversionRate: 3.1
        }
      ],
      deviceBreakdown: [
        {
          device: 'Mobile',
          visits: 900,
          percentage: 60
        }
      ]
    };
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generando reporte de rendimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener estadísticas en tiempo real
router.get('/realtime', auth, async (req, res) => {
  try {
    // Obtener estadísticas en tiempo real
    const today = new Date().toISOString().split('T')[0];
    
    const todaySalesQuery = `
      SELECT SUM(total_amount) as today_sales
      FROM sales
      WHERE DATE(created_at) = $1
    `;
    
    const totalSalesQuery = `
      SELECT SUM(total_amount) as total_sales
      FROM sales
    `;
    
    const pendingOrdersQuery = `
      SELECT COUNT(*) as pending_orders
      FROM sales
      WHERE status = 'pending'
    `;
    
    const [todayResult, totalResult, pendingResult] = await Promise.all([
      db.query(todaySalesQuery, [today]),
      db.query(totalSalesQuery),
      db.query(pendingOrdersQuery)
    ]);
    
    const stats = {
      totalSales: parseFloat(totalResult.rows[0].total_sales || 0),
      todaySales: parseFloat(todayResult.rows[0].today_sales || 0),
      activeUsers: Math.floor(Math.random() * 50) + 20, // Simulado
      pendingOrders: parseInt(pendingResult.rows[0].pending_orders || 0),
      lowStockItems: Math.floor(Math.random() * 5) // Simulado
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas en tiempo real:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Exportar reporte a PDF
router.post('/export/pdf', auth, async (req, res) => {
  try {
    const { reportType, data, filename } = req.body;
    
    // Simular generación de PDF
    const pdfContent = `Reporte ${reportType}\n\n${JSON.stringify(data, null, 2)}`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    res.send(pdfContent);
  } catch (error) {
    console.error('Error exportando reporte a PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Exportar reporte a Excel
router.post('/export/excel', auth, async (req, res) => {
  try {
    const { reportType, data, filename } = req.body;
    
    // Simular generación de Excel
    const excelContent = `Reporte ${reportType}\n\n${JSON.stringify(data, null, 2)}`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    res.send(excelContent);
  } catch (error) {
    console.error('Error exportando reporte a Excel:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Exportar reporte a CSV
router.post('/export/csv', auth, async (req, res) => {
  try {
    const { reportType, data, filename } = req.body;
    
    // Simular generación de CSV
    const csvContent = `Reporte ${reportType}\n\n${JSON.stringify(data, null, 2)}`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exportando reporte a CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;