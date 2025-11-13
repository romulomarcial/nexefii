-- Migração Sprint 10: Housekeeping + Alertas

CREATE TABLE hk_rooms_status (
    room_id SERIAL PRIMARY KEY,
    room_number VARCHAR(16) NOT NULL,
    status VARCHAR(16) NOT NULL,
    dnd BOOLEAN DEFAULT FALSE,
    floor INT,
    wing VARCHAR(16),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hk_tasks (
    id SERIAL PRIMARY KEY,
    room_id INT REFERENCES hk_rooms_status(room_id),
    task_type VARCHAR(32) NOT NULL,
    status VARCHAR(16) NOT NULL,
    assigned_to VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alert_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(64) NOT NULL,
    severity VARCHAR(8) NOT NULL,
    conditions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alert_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(32) NOT NULL,
    payload JSONB,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
