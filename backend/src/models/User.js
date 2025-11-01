const { pool } = require('../database/connection');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { email, password, firstName, lastName, phone, address, dateOfBirth, role = 'member' } = userData;
    const passwordHash = await bcrypt.hash(password, 12);

    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, phone, address, date_of_birth, role)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, first_name, last_name, phone, role, status, created_at
    `;

    const result = await pool.query(query, [
      email, passwordHash, firstName, lastName, phone, address, dateOfBirth, role
    ]);

    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = `
      SELECT id, email, password_hash, first_name, last_name, phone, address,
             date_of_birth, role, status, email_verified, phone_verified, created_at, last_login
      FROM users
      WHERE email = $1
    `;

    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT id, email, first_name, last_name, phone, address,
             date_of_birth, role, status, email_verified, phone_verified, created_at, last_login
      FROM users
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async updateProfile(id, updateData) {
    const allowedFields = ['first_name', 'last_name', 'phone', 'address', 'date_of_birth'];
    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) return null;

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, first_name, last_name, phone, address, date_of_birth, role, status, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updatePassword(id, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 12);

    const query = `
      UPDATE users
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id
    `;

    const result = await pool.query(query, [passwordHash, id]);
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const query = `
      UPDATE users
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, status
    `;

    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  static async updateLastLogin(id) {
    const query = `
      UPDATE users
      SET last_login = NOW()
      WHERE id = $1
    `;

    await pool.query(query, [id]);
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async getAll(filters = {}) {
    let query = `
      SELECT id, email, first_name, last_name, phone, role, status,
             email_verified, phone_verified, created_at, last_login
      FROM users
      WHERE 1=1
    `;

    const values = [];
    let paramIndex = 1;

    if (filters.role) {
      query += ` AND role = $${paramIndex}`;
      values.push(filters.role);
      paramIndex++;
    }

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      values.push(filters.status);
      paramIndex++;
    }

    if (filters.search) {
      query += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC`;

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

  static async updateStatus(id, status) {
    const query = `
      UPDATE users
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, status, updated_at
    `;

    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = User;