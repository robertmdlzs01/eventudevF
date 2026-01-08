-- Migration: Create roles and permissions tables
-- Description: Sistema completo de roles y permisos
-- Date: 2025-01

-- Crear tabla de roles
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 999,
    color VARCHAR(50) DEFAULT 'gray',
    icon VARCHAR(100),
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de permisos
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla intermedia: roles_permissions (muchos a muchos)
CREATE TABLE IF NOT EXISTS roles_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id)
);

-- Tabla para permisos personalizados de usuarios (permite override de permisos por usuario)
CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    granted BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_permission UNIQUE (user_id, permission_id)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_active ON roles(is_active);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_roles_permissions_role ON roles_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_roles_permissions_permission ON roles_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);

-- Insertar roles del sistema
INSERT INTO roles (name, display_name, description, level, color, icon, is_system, is_active) VALUES
    ('administrator', 'Administrador', 'Acceso completo al sistema', 1, 'red', 'Shield', true, true),
    ('pos_manager', 'Gerente POS', 'Gestión de ventas y operaciones', 2, 'blue', 'UserCheck', true, true),
    ('cashier', 'Cajero', 'Operaciones de venta básicas', 3, 'green', 'CreditCard', true, true),
    ('organizer', 'Organizador', 'Gestionar eventos propios', 4, 'purple', 'Calendar', true, true),
    ('customer', 'Cliente', 'Usuario final', 5, 'gray', 'User', true, true)
ON CONFLICT (name) DO NOTHING;

-- Insertar permisos del sistema
INSERT INTO permissions (name, display_name, description, category, is_required) VALUES
    -- Sistema
    ('manage_all', 'Gestionar Todo', 'Acceso completo al sistema', 'system', true),
    ('system_settings', 'Configuración del Sistema', 'Configurar sistema', 'system', false),
    
    -- Usuarios
    ('manage_users', 'Gestionar Usuarios', 'Crear, editar y eliminar usuarios', 'users', false),
    ('view_users', 'Ver Usuarios', 'Ver lista de usuarios', 'users', false),
    ('assign_roles', 'Asignar Roles', 'Asignar roles a usuarios', 'users', false),
    
    -- Eventos
    ('manage_events', 'Gestionar Eventos', 'Crear, editar y eliminar eventos', 'events', false),
    ('view_events', 'Ver Eventos', 'Ver lista de eventos', 'events', false),
    ('manage_own_events', 'Gestionar Eventos Propios', 'Gestionar solo eventos propios', 'events', false),
    
    -- Tickets
    ('manage_tickets', 'Gestionar Tickets', 'Gestionar tipos de tickets', 'tickets', false),
    ('view_tickets', 'Ver Tickets', 'Ver lista de tickets', 'tickets', false),
    ('check_in_tickets', 'Check-in Tickets', 'Validar tickets en eventos', 'tickets', false),
    
    -- POS
    ('manage_sales_points', 'Gestionar Puntos de Venta', 'Gestionar cajas registradoras', 'pos', false),
    ('open_register', 'Abrir Caja', 'Abrir sesiones de caja', 'pos', false),
    ('close_register', 'Cerrar Caja', 'Cerrar sesiones de caja', 'pos', false),
    ('sell_tickets', 'Vender Tickets', 'Procesar ventas', 'pos', false),
    ('view_orders', 'Ver Órdenes', 'Ver órdenes de venta', 'pos', false),
    
    -- Pagos
    ('manage_payments', 'Gestionar Pagos', 'Gestionar pagos y transacciones', 'payments', false),
    ('process_refunds', 'Procesar Reembolsos', 'Procesar reembolsos', 'payments', false),
    ('view_payments', 'Ver Pagos', 'Ver lista de pagos', 'payments', false),
    
    -- Reportes
    ('view_reports', 'Ver Reportes', 'Acceso a reportes', 'reports', false),
    ('export_reports', 'Exportar Reportes', 'Exportar reportes', 'reports', false),
    
    -- Roles y Permisos
    ('manage_roles', 'Gestionar Roles', 'Gestionar roles y permisos', 'roles', false),
    ('view_roles', 'Ver Roles', 'Ver lista de roles', 'roles', false)
ON CONFLICT (name) DO NOTHING;

-- Asignar permisos a roles del sistema
-- Administrator: todos los permisos
INSERT INTO roles_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'administrator'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- POS Manager
INSERT INTO roles_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'pos_manager'
AND p.name IN (
    'manage_sales_points', 'open_register', 'close_register', 'sell_tickets',
    'process_refunds', 'view_reports', 'manage_events', 'manage_tickets',
    'view_payments', 'view_orders'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Cashier
INSERT INTO roles_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'cashier'
AND p.name IN (
    'open_register', 'close_register', 'sell_tickets', 'view_orders', 'check_in_tickets'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Organizer
INSERT INTO roles_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'organizer'
AND p.name IN (
    'manage_own_events', 'view_tickets', 'view_reports', 'check_in_tickets'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Comentarios
COMMENT ON TABLE roles IS 'Roles del sistema con diferentes niveles de acceso';
COMMENT ON TABLE permissions IS 'Permisos individuales que pueden ser asignados a roles';
COMMENT ON TABLE roles_permissions IS 'Relación muchos a muchos entre roles y permisos';
COMMENT ON TABLE user_permissions IS 'Permisos personalizados por usuario (override de permisos del rol)';
