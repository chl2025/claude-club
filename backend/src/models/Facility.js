const { pool } = require('../database/connection');

class Facility {
  static async create(facilityData) {
    const {
      name, type, description, capacity, location,
      operatingHoursStart, operatingHoursEnd,
      bookingDurationMinutes, bookingBufferMinutes,
      requiresSupervision = false
    } = facilityData;

    const query = `
      INSERT INTO facilities (
        name, type, description, capacity, location,
        operating_hours_start, operating_hours_end,
        booking_duration_minutes, booking_buffer_minutes,
        requires_supervision
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const result = await pool.query(query, [
      name, type, description, capacity, location,
      operatingHoursStart, operatingHoursEnd,
      bookingDurationMinutes, bookingBufferMinutes,
      requiresSupervision
    ]);

    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT *
      FROM facilities
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getAll(filters = {}) {
    let query = `
      SELECT *
      FROM facilities
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (filters.type) {
      query += ` AND type = $${paramIndex}`;
      params.push(filters.type);
      paramIndex++;
    }

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.availableOnly) {
      query += ` AND status = 'available'`;
    }

    query += ` ORDER BY name ASC`;

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

  static async getTypes() {
    const query = `
      SELECT DISTINCT type, COUNT(*) as count
      FROM facilities
      GROUP BY type
      ORDER BY type
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  static async update(id, updateData) {
    const allowedFields = [
      'name', 'type', 'description', 'capacity', 'location',
      'operating_hours_start', 'operating_hours_end',
      'booking_duration_minutes', 'booking_buffer_minutes',
      'requires_supervision', 'status'
    ];

    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateData)) {
      const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(dbField)) {
        updates.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) return null;

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE facilities
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM facilities WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const query = `
      UPDATE facilities
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  static async getUtilization(startDate, endDate) {
    const query = `
      SELECT
        f.id,
        f.name,
        f.type,
        f.capacity,
        COUNT(b.id) as total_bookings,
        COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings,
        EXTRACT(EPOCH FROM (MAX(b.end_time) - MIN(b.start_time))) / 3600 as total_hours_booked
      FROM facilities f
      LEFT JOIN bookings b ON f.id = b.facility_id
        AND b.start_time >= $1 AND b.start_time <= $2
      GROUP BY f.id, f.name, f.type, f.capacity
      ORDER BY total_bookings DESC
    `;

    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  }

  static async getAvailableSlots(facilityId, date) {
    const query = `
      SELECT
        f.booking_duration_minutes,
        f.operating_hours_start,
        f.operating_hours_end,
        f.booking_buffer_minutes,
        b.start_time,
        b.end_time
      FROM facilities f
      LEFT JOIN bookings b ON f.id = b.facility_id
        AND DATE(b.start_time) = $2
        AND b.status IN ('confirmed', 'pending')
      WHERE f.id = $1
    `;

    const result = await pool.query(query, [facilityId, date]);

    if (result.rows.length === 0) {
      return null;
    }

    const facility = result.rows[0];
    const bookings = result.rows
      .filter(row => row.start_time)
      .map(row => ({
        startTime: new Date(row.start_time),
        endTime: new Date(row.end_time)
      }));

    // Generate available time slots
    const availableSlots = [];
    const [startHour, startMinute] = facility.operating_hours_start.split(':').map(Number);
    const [endHour, endMinute] = facility.operating_hours_end.split(':').map(Number);

    const dayStart = new Date(date);
    dayStart.setHours(startHour, startMinute, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(endHour, endMinute, 0, 0);

    let currentTime = new Date(dayStart);
    const slotDuration = facility.booking_duration_minutes;
    const bufferTime = facility.booking_buffer_minutes;

    while (currentTime.getTime() + slotDuration * 60 * 1000 <= dayEnd.getTime()) {
      const slotStart = new Date(currentTime);
      const slotEnd = new Date(currentTime.getTime() + slotDuration * 60 * 1000);

      // Check if slot conflicts with existing bookings
      const isConflicting = bookings.some(booking => {
        return (slotStart < booking.end_time && slotEnd > booking.start_time);
      });

      if (!isConflicting) {
        availableSlots.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          available: true
        });
      } else {
        availableSlots.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          available: false
        });
      }

      // Move to next slot including buffer time
      currentTime = new Date(slotEnd.getTime() + bufferTime * 60 * 1000);
    }

    return {
      facility: {
        bookingDurationMinutes: facility.booking_duration_minutes,
        operatingHoursStart: facility.operating_hours_start,
        operatingHoursEnd: facility.operating_hours_end
      },
      availableSlots
    };
  }
}

module.exports = Facility;