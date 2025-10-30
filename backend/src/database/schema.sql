-- Leisure Club Management System Database Schema
-- PostgreSQL Schema with audit trail support

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (
            table_name,
            operation,
            user_id,
            record_id,
            old_data,
            new_data,
            timestamp
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            COALESCE(current_setting('app.current_user_id', true)::uuid, NULL),
            OLD.id,
            row_to_json(OLD),
            NULL,
            NOW()
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (
            table_name,
            operation,
            user_id,
            record_id,
            old_data,
            new_data,
            timestamp
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            COALESCE(current_setting('app.current_user_id', true)::uuid, NULL),
            NEW.id,
            row_to_json(OLD),
            row_to_json(NEW),
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (
            table_name,
            operation,
            user_id,
            record_id,
            old_data,
            new_data,
            timestamp
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            COALESCE(current_setting('app.current_user_id', true)::uuid, NULL),
            NEW.id,
            NULL,
            row_to_json(NEW),
            NOW()
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Main tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'staff', 'member', 'guest')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE TABLE membership_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    duration_months INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    facilities_access TEXT[], -- Array of facility types this membership provides access to
    max_bookings_per_day INTEGER DEFAULT 5,
    max_booking_days_ahead INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    membership_type_id UUID NOT NULL REFERENCES membership_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
    auto_renew BOOLEAN DEFAULT FALSE,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- e.g., 'tennis_court', 'swimming_pool', 'meeting_room'
    description TEXT,
    capacity INTEGER,
    location VARCHAR(100),
    operating_hours_start TIME,
    operating_hours_end TIME,
    booking_duration_minutes INTEGER DEFAULT 60,
    booking_buffer_minutes INTEGER DEFAULT 15,
    requires_supervision BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'maintenance', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    facility_id UUID NOT NULL REFERENCES facilities(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
    total_cost DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Prevent overlapping bookings for the same facility
    CONSTRAINT no_overlapping_bookings EXCLUDE USING GIST (
        facility_id WITH =,
        daterange(start_time, end_time) WITH &&
    )
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    booking_id UUID REFERENCES bookings(id),
    membership_id UUID REFERENCES memberships(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('payment', 'refund', 'booking_fee', 'membership_fee')),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR(50),
    payment_gateway_id VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(50) NOT NULL,
    operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    user_id UUID REFERENCES users(id),
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    target_type VARCHAR(20) CHECK (target_type IN ('facility', 'booking', 'general')),
    target_id UUID,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'sms', 'push')),
    subject VARCHAR(200),
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create triggers for audit logging
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_memberships_trigger
    AFTER INSERT OR UPDATE OR DELETE ON memberships
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_bookings_trigger
    AFTER INSERT OR UPDATE OR DELETE ON bookings
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_transactions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_facilities_trigger
    AFTER INSERT OR UPDATE OR DELETE ON facilities
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_facility_id ON bookings(facility_id);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_status ON memberships(status);

-- Views for common queries
CREATE VIEW active_memberships AS
SELECT m.*, u.first_name, u.last_name, u.email, mt.name as membership_type_name
FROM memberships m
JOIN users u ON m.user_id = u.id
JOIN membership_types mt ON m.membership_type_id = mt.id
WHERE m.status = 'active' AND m.end_date >= CURRENT_DATE;

CREATE VIEW upcoming_bookings AS
SELECT b.*, u.first_name, u.last_name, f.name as facility_name
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN facilities f ON b.facility_id = f.id
WHERE b.status = 'confirmed' AND b.start_time >= NOW()
ORDER BY b.start_time ASC;

CREATE VIEW facility_utilization AS
SELECT
    f.id,
    f.name,
    f.type,
    COUNT(b.id) as total_bookings,
    COUNT(CASE WHEN b.start_time >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as bookings_last_30_days,
    AVG(CASE WHEN b.rating IS NOT NULL THEN b.rating END) as average_rating
FROM facilities f
LEFT JOIN bookings b ON f.id = b.facility_id
GROUP BY f.id, f.name, f.type;