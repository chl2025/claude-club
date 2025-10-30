const { pool, withTransaction } = require('../database/connection');
const moment = require('moment');

class Booking {
  static async create(bookingData) {
    const { userId, facilityId, startTime, endTime, notes } = bookingData;

    return await withTransaction(async (client) => {
      // Check facility availability and prevent double bookings
      const availabilityQuery = `
        SELECT id FROM bookings
        WHERE facility_id = $1
          AND status IN ('confirmed', 'pending')
          AND (
            (start_time <= $2 AND end_time > $2) OR
            (start_time < $3 AND end_time >= $3) OR
            (start_time >= $2 AND end_time <= $3)
          )
        FOR UPDATE
      `;

      const conflictingBookings = await client.query(availabilityQuery, [
        facilityId, startTime, endTime
      ]);

      if (conflictingBookings.rows.length > 0) {
        throw new Error('Facility is already booked for this time slot.');
      }

      // Check facility operating hours
      const facilityQuery = `
        SELECT name, booking_duration_minutes, operating_hours_start, operating_hours_end
        FROM facilities
        WHERE id = $1 AND status = 'available'
      `;

      const facilityResult = await client.query(facilityQuery, [facilityId]);
      if (facilityResult.rows.length === 0) {
        throw new Error('Facility not available or does not exist.');
      }

      const facility = facilityResult.rows[0];
      const bookingStart = moment(startTime);
      const bookingEnd = moment(endTime);
      const bookingDuration = bookingEnd.diff(bookingStart, 'minutes');

      if (bookingDuration !== facility.booking_duration_minutes) {
        throw new Error(`Booking duration must be exactly ${facility.booking_duration_minutes} minutes.`);
      }

      // Check if booking is within operating hours
      const bookingTime = moment(startTime).format('HH:mm:ss');
      if (bookingTime < facility.operating_hours_start || bookingTime > facility.operating_hours_end) {
        throw new Error('Booking time is outside facility operating hours.');
      }

      // Check user's active membership
      const membershipQuery = `
        SELECT m.*, mt.max_bookings_per_day, mt.max_booking_days_ahead, mt.facilities_access
        FROM memberships m
        JOIN membership_types mt ON m.membership_type_id = mt.id
        WHERE m.user_id = $1 AND m.status = 'active' AND m.end_date >= CURRENT_DATE
        ORDER BY m.created_at DESC
        LIMIT 1
      `;

      const membershipResult = await client.query(membershipQuery, [userId]);
      if (membershipResult.rows.length === 0) {
        throw new Error('Active membership required to make bookings.');
      }

      const membership = membershipResult.rows[0];

      // Check if membership allows access to this facility type
      const facilityTypeQuery = `
        SELECT type FROM facilities WHERE id = $1
      `;
      const facilityTypeResult = await client.query(facilityTypeQuery, [facilityId]);
      const facilityType = facilityTypeResult.rows[0].type;

      if (!membership.facilities_access.includes(facilityType)) {
        throw new Error('Your membership does not include access to this facility.');
      }

      // Check booking limits
      const bookingDate = moment(startTime).format('YYYY-MM-DD');
      const dailyBookingsQuery = `
        SELECT COUNT(*) as count
        FROM bookings
        WHERE user_id = $1
          AND DATE(start_time) = $2
          AND status IN ('confirmed', 'pending')
      `;

      const dailyBookingsResult = await client.query(dailyBookingsQuery, [userId, bookingDate]);
      const dailyBookingsCount = parseInt(dailyBookingsResult.rows[0].count);

      if (dailyBookingsCount >= membership.max_bookings_per_day) {
        throw new Error(`Daily booking limit of ${membership.max_bookings_per_day} exceeded.`);
      }

      // Check advance booking limit
      const daysAhead = moment(startTime).diff(moment().startOf('day'), 'days');
      if (daysAhead > membership.max_booking_days_ahead) {
        throw new Error(`Bookings can only be made ${membership.max_booking_days_ahead} days in advance.`);
      }

      // Create the booking
      const insertQuery = `
        INSERT INTO bookings (user_id, facility_id, start_time, end_time, notes, status)
        VALUES ($1, $2, $3, $4, $5, 'confirmed')
        RETURNING *
      `;

      const result = await client.query(insertQuery, [
        userId, facilityId, startTime, endTime, notes
      ]);

      return result.rows[0];
    });
  }

  static async findById(id) {
    const query = `
      SELECT b.*, u.first_name, u.last_name, u.email,
             f.name as facility_name, f.type as facility_type, f.location
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN facilities f ON b.facility_id = f.id
      WHERE b.id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByUserId(userId, filters = {}) {
    let query = `
      SELECT b.*, f.name as facility_name, f.type as facility_type, f.location
      FROM bookings b
      JOIN facilities f ON b.facility_id = f.id
      WHERE b.user_id = $1
    `;

    const params = [userId];
    let paramIndex = 2;

    if (filters.status) {
      query += ` AND b.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.startDate) {
      query += ` AND b.start_time >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      query += ` AND b.start_time <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    query += ` ORDER BY b.start_time DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;

      if (filters.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(filters.offset);
      }
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findByFacilityId(facilityId, date) {
    const query = `
      SELECT b.*, u.first_name, u.last_name, u.email
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.facility_id = $1
        AND DATE(b.start_time) = $2
        AND b.status IN ('confirmed', 'pending')
      ORDER BY b.start_time ASC
    `;

    const result = await pool.query(query, [facilityId, date]);
    return result.rows;
  }

  static async getAvailability(facilityId, date) {
    const query = `
      SELECT f.booking_duration_minutes, f.operating_hours_start, f.operating_hours_end,
             b.start_time, b.end_time, b.status
      FROM facilities f
      LEFT JOIN bookings b ON f.id = b.facility_id
        AND DATE(b.start_time) = $2
        AND b.status IN ('confirmed', 'pending')
      WHERE f.id = $1
      ORDER BY b.start_time ASC
    `;

    const result = await pool.query(query, [facilityId, date]);
    return result.rows;
  }

  static async cancel(id, userId) {
    const query = `
      UPDATE bookings
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = $1 AND user_id = $2 AND status IN ('confirmed', 'pending')
      RETURNING *
    `;

    const result = await pool.query(query, [id, userId]);
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const query = `
      UPDATE bookings
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  static async getAll(filters = {}) {
    let query = `
      SELECT b.*, u.first_name, u.last_name, u.email,
             f.name as facility_name, f.type as facility_type, f.location
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN facilities f ON b.facility_id = f.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (filters.status) {
      query += ` AND b.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.facilityId) {
      query += ` AND b.facility_id = $${paramIndex}`;
      params.push(filters.facilityId);
      paramIndex++;
    }

    if (filters.userId) {
      query += ` AND b.user_id = $${paramIndex}`;
      params.push(filters.userId);
      paramIndex++;
    }

    if (filters.startDate) {
      query += ` AND b.start_time >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      query += ` AND b.start_time <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    query += ` ORDER BY b.start_time DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;

      if (filters.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(filters.offset);
      }
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getBookingStats(startDate, endDate) {
    const query = `
      SELECT
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
        SUM(total_cost) as total_revenue,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT facility_id) as facilities_used
      FROM bookings
      WHERE start_time >= $1 AND start_time <= $2
    `;

    const result = await pool.query(query, [startDate, endDate]);
    return result.rows[0];
  }
}

module.exports = Booking;