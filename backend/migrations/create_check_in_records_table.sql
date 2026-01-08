-- Migration: Create check_in_records table
-- Description: Tabla para registrar todos los check-ins realizados en eventos
-- Date: 2025-01

-- Crear tabla check_in_records
CREATE TABLE IF NOT EXISTS check_in_records (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL,
    sale_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    gate VARCHAR(50) DEFAULT 'Principal',
    operator_id INTEGER,
    operator_name VARCHAR(255),
    check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_checkin_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_checkin_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    CONSTRAINT fk_checkin_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_checkin_operator FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_checkin_ticket_id ON check_in_records(ticket_id);
CREATE INDEX IF NOT EXISTS idx_checkin_sale_id ON check_in_records(sale_id);
CREATE INDEX IF NOT EXISTS idx_checkin_event_id ON check_in_records(event_id);
CREATE INDEX IF NOT EXISTS idx_checkin_time ON check_in_records(check_in_time);
CREATE INDEX IF NOT EXISTS idx_checkin_gate ON check_in_records(gate);
CREATE INDEX IF NOT EXISTS idx_checkin_operator ON check_in_records(operator_id);

-- Comentarios en la tabla
COMMENT ON TABLE check_in_records IS 'Registro histórico de todos los check-ins realizados en eventos';
COMMENT ON COLUMN check_in_records.ticket_id IS 'ID del ticket que fue validado';
COMMENT ON COLUMN check_in_records.sale_id IS 'ID de la venta asociada';
COMMENT ON COLUMN check_in_records.event_id IS 'ID del evento';
COMMENT ON COLUMN check_in_records.gate IS 'Puerta o entrada donde se realizó el check-in';
COMMENT ON COLUMN check_in_records.operator_id IS 'ID del usuario que realizó el check-in';
COMMENT ON COLUMN check_in_records.operator_name IS 'Nombre del operador que realizó el check-in';
COMMENT ON COLUMN check_in_records.check_in_time IS 'Fecha y hora exacta del check-in';
