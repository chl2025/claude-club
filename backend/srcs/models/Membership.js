const { pool } = require('../database/connection');

class Membership {
  static async getTypes() {
    const query = 'SELECT * FROM membership_types';
    const result = await pool.query(query);
    return result.rows;
  }

  static async create(membershipData) {
    const { userId, membershipTypeId, startDate, endDate, paymentDetails } = membershipData;
    const insertQuery = `
      INSERT INTO memberships (user_id, membership_type_id, start_date, end_date, payment_details, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [
      userId,
      membershipTypeId,
      startDate,
      endDate,
      paymentDetails
    ]);
    return result.rows[0];
  }

    static async getActiveMembership(userId) {
        const query = `
            SELECT * FROM memberships
            WHERE user_id = $1 AND status = 'active' AND end_date >= CURRENT_DATE
            ORDER BY created_at DESC
            LIMIT 1
        `;
        const result = await pool.query(query, [userId]);
        return result.rows[0];
    }
}

module.exports = Membership;
