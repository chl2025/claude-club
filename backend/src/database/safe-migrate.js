const fs = require('fs').promises;
const path = require('path');
const { pool } = require('./connection');

async function runSafeMigrations() {
  try {
    console.log('Starting safe database migration...');

    // Check database connection
    const connectionTest = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully at:', connectionTest.rows[0].now);

    // Check existing tables
    const existingTables = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('📋 Existing tables:', existingTables.rows.map(row => row.table_name));

    if (existingTables.rows.length === 0) {
      console.log('🆕 No tables found. Creating full schema...');
      await createFullSchema();
    } else {
      console.log('🔄 Tables already exist. Running incremental updates...');
      await runIncrementalUpdates(existingTables.rows);
    }

    // Seed initial data (always runs, but uses ON CONFLICT DO NOTHING)
    console.log('🌱 Seeding initial data...');
    await seedInitialData();
    console.log('✅ Initial data seeded successfully!');

    // Verify database setup
    await verifyDatabaseSetup();

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function createFullSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSQL = await fs.readFile(schemaPath, 'utf8');

  await pool.query(schemaSQL);
  console.log('✅ Full database schema created successfully!');
}

async function runIncrementalUpdates(existingTables) {
  // Handle both array and object with rows property
  const tableNames = Array.isArray(existingTables)
    ? existingTables.map(row => row.table_name)
    : existingTables.map(row => row.table_name);

  console.log('🔍 Checking for required updates...');

  // Check if critical tables exist
  const requiredTables = ['users', 'facilities', 'bookings', 'memberships', 'transactions'];
  const missingTables = requiredTables.filter(table => !tableNames.includes(table));

  if (missingTables.length > 0) {
    console.log('⚠️  Missing critical tables:', missingTables);
    console.log('🛠️  Creating missing tables...');

    // Create individual missing tables
    for (const tableName of missingTables) {
      try {
        await createMissingTable(tableName);
        console.log(`✅ Created table: ${tableName}`);
      } catch (error) {
        console.error(`❌ Failed to create table ${tableName}:`, error.message);
      }
    }
  }

  // Check for overlapping bookings trigger
  const triggerExists = await pool.query(`
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'check_overlapping_bookings'
  `);

  if (triggerExists.rows.length === 0) {
    console.log('🔧 Creating overlapping bookings prevention trigger...');
    await createOverlappingBookingsTrigger();
    console.log('✅ Overlapping bookings trigger created');
  }

  // Check for views
  const existingViews = await pool.query(`
    SELECT table_name FROM information_schema.views
    WHERE table_schema = 'public'
  `);
  const viewNames = existingViews.rows?.map(row => row.table_name) || [];

  const requiredViews = ['active_memberships', 'upcoming_bookings', 'facility_utilization'];
  const missingViews = requiredViews.filter(view => !viewNames.includes(view));

  if (missingViews.length > 0) {
    console.log('📊 Creating missing views:', missingViews);
    await createMissingViews(missingViews);
    console.log('✅ Missing views created');
  }
}

async function createMissingTable(tableName) {
  const createTableSQLs = {
    users: `
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'staff', 'admin')),
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'cancelled')),
        email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `,
    facilities: `
      CREATE TABLE facilities (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT,
        capacity INTEGER NOT NULL DEFAULT 1,
        location VARCHAR(255),
        operating_hours_start TIME,
        operating_hours_end TIME,
        booking_duration_minutes INTEGER DEFAULT 60,
        requires_supervision BOOLEAN DEFAULT FALSE,
        status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'maintenance', 'closed')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `,
    bookings: `
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
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `,
    memberships: `
      CREATE TABLE memberships (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id),
        membership_type_id UUID REFERENCES membership_types(id),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'suspended')),
        auto_renew BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `,
    transactions: `
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
        payment_reference VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
  };

  const sql = createTableSQLs[tableName];
  if (!sql) {
    throw new Error(`No create table definition found for ${tableName}`);
  }

  await pool.query(sql);
}

async function createOverlappingBookingsTrigger() {
  const triggerFunctionSQL = `
    CREATE OR REPLACE FUNCTION prevent_overlapping_bookings()
    RETURNS TRIGGER AS $$
    BEGIN
        IF EXISTS (
            SELECT 1 FROM bookings
            WHERE facility_id = NEW.facility_id
            AND id != COALESCE(NEW.id, 0)
            AND status IN ('confirmed', 'completed')
            AND (
                (start_time <= NEW.start_time AND end_time > NEW.start_time) OR
                (start_time < NEW.end_time AND end_time >= NEW.end_time) OR
                (start_time >= NEW.start_time AND end_time <= NEW.end_time)
            )
        ) THEN
            RAISE EXCEPTION 'Booking conflicts with existing booking for this facility';
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER check_overlapping_bookings
        BEFORE INSERT OR UPDATE ON bookings
        FOR EACH ROW EXECUTE FUNCTION prevent_overlapping_bookings();
  `;

  await pool.query(triggerFunctionSQL);
}

async function createMissingViews(missingViews) {
  const viewSQLs = {
    active_memberships: `
      CREATE VIEW active_memberships AS
      SELECT
          u.id as user_id,
          u.first_name,
          u.last_name,
          u.email,
          mt.name as membership_type,
          mt.price,
          m.start_date,
          m.end_date,
          m.status
      FROM users u
      JOIN memberships m ON u.id = m.user_id
      JOIN membership_types mt ON m.membership_type_id = mt.id
      WHERE m.status = 'active' AND m.end_date >= CURRENT_DATE
    `,
    upcoming_bookings: `
      CREATE VIEW upcoming_bookings AS
      SELECT
          b.id,
          b.user_id,
          u.first_name || ' ' || u.last_name as member_name,
          b.facility_id,
          f.name as facility_name,
          b.start_time,
          b.end_time,
          b.status
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN facilities f ON b.facility_id = f.id
      WHERE b.status = 'confirmed' AND b.start_time >= NOW()
      ORDER BY b.start_time ASC
    `,
    facility_utilization: `
      CREATE VIEW facility_utilization AS
      SELECT
          f.id,
          f.name,
          f.type,
          COUNT(b.id) as total_bookings,
          COUNT(CASE WHEN b.start_time >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as bookings_last_30_days,
          COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
          COALESCE(AVG(fb.rating), 0) as average_rating
      FROM facilities f
      LEFT JOIN bookings b ON f.id = b.facility_id
      LEFT JOIN feedback fb ON f.id = fb.target_id AND fb.target_type = 'facility' AND fb.status = 'reviewed'
      GROUP BY f.id, f.name, f.type
    `
  };

  for (const viewName of missingViews) {
    const sql = viewSQLs[viewName];
    if (sql) {
      await pool.query(sql);
    }
  }
}

async function seedInitialData() {
  const bcrypt = require('bcryptjs');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  await pool.query(`
    INSERT INTO users (email, password_hash, first_name, last_name, role, status, email_verified)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (email) DO NOTHING
  `, [
    'admin@leisureclub.com',
    adminPassword,
    'System',
    'Administrator',
    'admin',
    'active',
    true
  ]);

  // Create membership types (if table exists)
  const membershipTypesExists = await pool.query(`
    SELECT 1 FROM information_schema.tables WHERE table_name = 'membership_types'
  `);

  if (membershipTypesExists.rows.length > 0) {
    await pool.query(`
      INSERT INTO membership_types (name, description, duration_months, price, facilities_access, max_bookings_per_day, max_booking_days_ahead)
      VALUES
        ('Basic', 'Access to basic facilities', 1, 29.99, ARRAY['gym', 'swimming_pool'], 3, 7),
        ('Premium', 'Access to all facilities including courts', 1, 59.99, ARRAY['gym', 'swimming_pool', 'tennis_court', 'squash_court', 'meeting_room'], 5, 30),
        ('Corporate', 'Full access with priority booking', 12, 599.99, ARRAY['gym', 'swimming_pool', 'tennis_court', 'squash_court', 'meeting_room', 'spa'], 10, 60)
      ON CONFLICT DO NOTHING
    `);
  }

  // Create sample facilities
  await pool.query(`
    INSERT INTO facilities (name, type, description, capacity, location, operating_hours_start, operating_hours_end, booking_duration_minutes)
    VALUES
      ('Tennis Court 1', 'tennis_court', 'Outdoor tennis court with professional surface', 4, 'Court Area A', '06:00:00', '22:00:00', 60),
      ('Tennis Court 2', 'tennis_court', 'Outdoor tennis court with professional surface', 4, 'Court Area B', '06:00:00', '22:00:00', 60),
      ('Swimming Pool', 'swimming_pool', 'Olympic size swimming pool', 50, 'Main Building', '05:30:00', '21:00:00', 60),
      ('Gym', 'gym', 'Fully equipped fitness center', 30, 'Main Building', '05:00:00', '23:00:00', 60),
      ('Meeting Room A', 'meeting_room', 'Conference room with AV equipment', 12, 'Admin Building', '08:00:00', '20:00:00', 120),
      ('Squash Court 1', 'squash_court', 'Professional squash court', 2, 'Indoor Courts', '06:00:00', '22:00:00', 45)
    ON CONFLICT DO NOTHING
  `);
}

async function verifyDatabaseSetup() {
  console.log('🔍 Verifying database setup...');

  // Check critical tables
  const criticalTables = ['users', 'facilities', 'bookings'];
  for (const table of criticalTables) {
    const result = await pool.query(`
      SELECT COUNT(*) as count FROM information_schema.tables
      WHERE table_name = $1
    `, [table]);

    if (parseInt(result.rows[0].count) === 0) {
      throw new Error(`Critical table ${table} is missing!`);
    }
    console.log(`✅ Table ${table} exists`);
  }

  // Check row counts
  const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
  const facilityCount = await pool.query('SELECT COUNT(*) as count FROM facilities');

  console.log(`👥 Users: ${userCount.rows[0].count}`);
  console.log(`🏢 Facilities: ${facilityCount.rows[0].count}`);

  if (userCount.rows[0].count === 0) {
    console.log('⚠️  No users found - admin user should be created during seeding');
  }

  if (facilityCount.rows[0].count === 0) {
    console.log('⚠️  No facilities found - sample facilities should be created during seeding');
  }

  console.log('✅ Database verification completed');
}

if (require.main === module) {
  runSafeMigrations();
}

module.exports = { runSafeMigrations, seedInitialData };