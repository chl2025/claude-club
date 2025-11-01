const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  phone: Joi.string().allow('').optional(),
  address: Joi.string().allow('').optional(),
  dateOfBirth: Joi.date().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

class AuthController {
  static async register(req, res) {
    try {
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { email, password, firstName, lastName, phone, address, dateOfBirth } = value;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists.' });
      }

      // Create new user
      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        phone,
        address,
        dateOfBirth
      });

      // Auto-activate user for testing purposes
      if (user.status === 'pending') {
        await User.updateStatus(user.id, 'active');
        user.status = 'active';
      }

      const token = generateToken(user.id);

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          role: user.role,
          status: user.status
        },
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async login(req, res) {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { email, password } = value;

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      // Verify password
      const isPasswordValid = await User.verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      // Check if user is active
      if (user.status !== 'active') {
        return res.status(401).json({
          error: 'Account is not active. Please contact support.',
          status: user.status
        });
      }

      // Update last login
      await User.updateLastLogin(user.id);

      const token = generateToken(user.id);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          role: user.role,
          status: user.status,
          emailVerified: user.email_verified,
          lastLogin: user.last_login
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          address: user.address,
          dateOfBirth: user.date_of_birth,
          role: user.role,
          status: user.status,
          emailVerified: user.email_verified,
          phoneVerified: user.phone_verified,
          createdAt: user.created_at,
          lastLogin: user.last_login
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateProfile(req, res) {
    try {
      const allowedFields = ['firstName', 'lastName', 'phone', 'address', 'dateOfBirth'];
      const updates = {};

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update.' });
      }

      const updatedUser = await User.updateProfile(req.user.id, updates);
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found.' });
      }

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          phone: updatedUser.phone,
          address: updatedUser.address,
          dateOfBirth: updatedUser.date_of_birth,
          role: updatedUser.role,
          status: updatedUser.status,
          updatedAt: updatedUser.updated_at
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required.' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
      }

      const user = await User.findByEmail(req.user.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const isCurrentPasswordValid = await User.verifyPassword(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ error: 'Current password is incorrect.' });
      }

      await User.updatePassword(req.user.id, newPassword);

      res.json({ message: 'Password changed successfully.' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async logout(req, res) {
    // In a stateless JWT implementation, logout is typically handled client-side
    // by removing the token. However, we can provide a response to confirm logout.
    res.json({ message: 'Logout successful.' });
  }
}

module.exports = AuthController;