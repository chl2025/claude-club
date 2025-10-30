const Joi = require('joi');
const Booking = require('../models/Booking');
const moment = require('moment');

const bookingSchema = Joi.object({
  facilityId: Joi.string().uuid().required(),
  startTime: Joi.date().iso().min('now').required(),
  endTime: Joi.date().iso().min(Joi.ref('startTime')).required(),
  notes: Joi.string().max(500).optional()
});

const updateBookingSchema = Joi.object({
  status: Joi.string().valid('confirmed', 'cancelled', 'completed', 'no_show').optional(),
  notes: Joi.string().max(500).optional()
});

class BookingController {
  static async createBooking(req, res) {
    try {
      const { error, value } = bookingSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { facilityId, startTime, endTime, notes } = value;
      const userId = req.user.id;

      const booking = await Booking.create({
        userId,
        facilityId,
        startTime: moment(startTime).toISOString(),
        endTime: moment(endTime).toISOString(),
        notes
      });

      res.status(201).json({
        message: 'Booking created successfully',
        booking
      });
    } catch (error) {
      console.error('Create booking error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getBookings(req, res) {
    try {
      const userId = req.user.id;
      const {
        status,
        startDate,
        endDate,
        page = 1,
        limit = 20
      } = req.query;

      const filters = {
        status,
        startDate: startDate ? moment(startDate).startOf('day').toISOString() : undefined,
        endDate: endDate ? moment(endDate).endOf('day').toISOString() : undefined,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      };

      const bookings = await Booking.findByUserId(userId, filters);

      res.json({
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: bookings.length
        }
      });
    } catch (error) {
      console.error('Get bookings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getBooking(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      let booking;
      if (req.user.role === 'admin' || req.user.role === 'staff') {
        booking = await Booking.findById(id);
      } else {
        // Regular users can only view their own bookings
        booking = await Booking.findById(id);
        if (booking && booking.user_id !== userId) {
          return res.status(403).json({ error: 'Access denied.' });
        }
      }

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found.' });
      }

      res.json({ booking });
    } catch (error) {
      console.error('Get booking error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async cancelBooking(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const booking = await Booking.cancel(id, userId);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found or cannot be cancelled.' });
      }

      res.json({
        message: 'Booking cancelled successfully',
        booking
      });
    } catch (error) {
      console.error('Cancel booking error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getFacilityAvailability(req, res) {
    try {
      const { facilityId } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({ error: 'Date parameter is required.' });
      }

      const availability = await Booking.getAvailability(facilityId, date);

      if (availability.length === 0) {
        return res.status(404).json({ error: 'Facility not found.' });
      }

      const facility = availability[0];
      const bookedSlots = availability.filter(row => row.start_time).map(row => ({
        startTime: row.start_time,
        endTime: row.end_time,
        status: row.status
      }));

      res.json({
        facility: {
          bookingDurationMinutes: facility.booking_duration_minutes,
          operatingHoursStart: facility.operating_hours_start,
          operatingHoursEnd: facility.operating_hours_end
        },
        bookedSlots,
        date
      });
    } catch (error) {
      console.error('Get availability error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getAllBookings(req, res) {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'staff') {
        return res.status(403).json({ error: 'Access denied.' });
      }

      const {
        status,
        facilityId,
        userId,
        startDate,
        endDate,
        page = 1,
        limit = 50
      } = req.query;

      const filters = {
        status,
        facilityId,
        userId,
        startDate: startDate ? moment(startDate).startOf('day').toISOString() : undefined,
        endDate: endDate ? moment(endDate).endOf('day').toISOString() : undefined,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      };

      const bookings = await Booking.getAll(filters);

      res.json({
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: bookings.length
        }
      });
    } catch (error) {
      console.error('Get all bookings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateBookingStatus(req, res) {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'staff') {
        return res.status(403).json({ error: 'Access denied.' });
      }

      const { error, value } = updateBookingSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { id } = req.params;
      const { status, notes } = value;

      const booking = await Booking.findById(id);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found.' });
      }

      const updatedBooking = await Booking.updateStatus(id, status);
      if (notes) {
        // Update notes if provided
        await Booking.updateNotes(id, notes);
      }

      res.json({
        message: 'Booking updated successfully',
        booking: updatedBooking
      });
    } catch (error) {
      console.error('Update booking error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getBookingStats(req, res) {
    try {
      if (req.user.role !== 'admin' && req.user.role !== 'staff') {
        return res.status(403).json({ error: 'Access denied.' });
      }

      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required.' });
      }

      const stats = await Booking.getBookingStats(
        moment(startDate).toISOString(),
        moment(endDate).toISOString()
      );

      res.json({ stats });
    } catch (error) {
      console.error('Get booking stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = BookingController;