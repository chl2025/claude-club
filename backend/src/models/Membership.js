const { pool } = require('../database/connection');

class Membership {
  static async create(membershipData) {
    const { userId, membershipTypeId, startDate, endDate, paymentMethod, notes } = membershipData;

    const query = `
      INSERT INTO memberships (user_id, membership_type_id, start_date, end_date, payment_method, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      userId, membershipTypeId, startDate, endDate, paymentMethod, notes
    ]);

    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT m.*, u.first_name, u.last_name, u.email,
             mt.name as membership_type_name, mt.description as membership_description,
             mt.price, mt.facilities_access, mt.max_bookings_per_day, mt.max_booking_days_ahead
      FROM memberships m
      JOIN users u ON m.user_id = u.id
      JOIN membership_types mt ON m.membership_type_id = mt.id
      WHERE m.id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByUserId(userId, includeExpired = false) {
    let query = `
      SELECT m.*, mt.name as membership_type_name, mt.description,
             mt.price, mt.facilities_access, mt.max_bookings_per_day, mt.max_booking_days_ahead
      FROM memberships m
      JOIN membership_types mt ON m.membership_type_id = mt.id
      WHERE m.user_id = $1
    `;

    const params = [userId];

    if (!includeExpired) {
      query += ` AND (m.status = 'active' OR (m.status != 'cancelled' AND m.end_date >= CURRENT_DATE))`;
    }

    query += ` ORDER BY m.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getActiveMembership(userId) {
    const query = `
      SELECT m.*, mt.name as membership_type_name, mt.facilities_access,
             mt.max_bookings_per_day, mt.max_booking_days_ahead
      FROM memberships m
      JOIN membership_types mt ON m.membership_type_id = mt.id
      WHERE m.user_id = $1 AND m.status = 'active' AND m.end_date >= CURRENT_DATE
      ORDER BY m.created_at DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const query = `
      UPDATE memberships
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  static async renew(id, newEndDate, paymentMethod = null) {
    const query = `
      UPDATE memberships
      SET end_date = $1, payment_method = COALESCE($2, payment_method), status = 'active', updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;

    const result = await pool.query(query, [newEndDate, paymentMethod, id]);
    return result.rows[0];
  }

  static async getAll(filters = {}) {
    let query = `
      SELECT m.*, u.first_name, u.last_name, u.email, u.phone,
             mt.name as membership_type_name, mt.price
      FROM memberships m
      JOIN users u ON m.user_id = u.id
      JOIN membership_types mt ON m.membership_type_id = mt.id
      WHERE 1=1
    `;

    const values = [];
    let paramIndex = 1;

    if (filters.status) {
      query += ` AND m.status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }

    if (filters.membershipTypeId) {
      query += ` AND m.membership_type_id = $${paramIndex}`;
      values.push(filters.membershipTypeId);
      paramIndex++;
    }

    if (filters.expiringSoon) {
      query += ` AND m.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'`;
    }

    query += ` ORDER BY m.created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      values.push(filters.limit);
      paramIndex++;

      if (filters.offset) {
        query += ` OFFSET $${paramIndex}`;
        values.push(filters.offset);
      }
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async getExpiringMemberships(days = 30) {
    const query = `
      SELECT m.*, u.first_name, u.last_name, u.email,
             mt.name as membership_type_name, mt.price
      FROM memberships m
      JOIN users u ON m.user_id = u.id
      JOIN membership_types mt ON m.membership_type_id = mt.id
      WHERE m.status = 'active'
        AND m.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${days} days'
      ORDER BY m.end_date ASC
    `;

    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = Membership;