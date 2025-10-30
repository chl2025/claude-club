const fs = require('fs').promises;
const path = require('path');
const { pool } = require('./connection');

async function runMigrations() {
  try {
    console.log('Starting database migration...');

    // Read and execute the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = await fs.readFile(schemaPath, 'utf8');

    await pool.query(schemaSQL);
    console.log('Database schema created successfully!');

    // Create initial admin user and membership types
    await seedInitialData();
    console.log('Initial data seeded successfully!');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
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

  // Create membership types
  await pool.query(`
    INSERT INTO membership_types (name, description, duration_months, price, facilities_access, max_bookings_per_day, max_booking_days_ahead)
    VALUES
      ('Basic', 'Access to basic facilities', 1, 29.99, ARRAY['gym', 'swimming_pool'], 3, 7),
      ('Premium', 'Access to all facilities including courts', 1, 59.99, ARRAY['gym', 'swimming_pool', 'tennis_court', 'squash_court', 'meeting_room'], 5, 30),
      ('Corporate', 'Full access with priority booking', 12, 599.99, ARRAY['gym', 'swimming_pool', 'tennis_court', 'squash_court', 'meeting_room', 'spa'], 10, 60)
    ON CONFLICT DO NOTHING
  `);

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

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations, seedInitialData };