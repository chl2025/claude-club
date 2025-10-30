const Joi = require('joi');
const Facility = require('../models/Facility');
const moment = require('moment');

const facilitySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  type: Joi.string().min(2).max(50).required(),
  description: Joi.string().max(500).optional(),
  capacity: Joi.number().integer().min(1).optional(),
  location: Joi.string().max(100).optional(),
  operatingHoursStart: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  operatingHoursEnd: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  bookingDurationMinutes: Joi.number().integer().min(15).max(480).default(60),
  bookingBufferMinutes: Joi.number().integer().min(0).max(60).default(15),
  requiresSupervision: Joi.boolean().default(false)
});

class FacilityController {
  static async createFacility(req, res) {
    try {
      const { error, value } = facilitySchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const facility = await Facility.create(value);

      res.status(201).json({
        message: 'Facility created successfully',
        facility
      });
    } catch (error) {
      console.error('Create facility error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getFacilities(req, res) {
    try {
      const { type, status, availableOnly, page = 1, limit = 50 } = req.query;

      const filters = {
        type,
        status,
        availableOnly: availableOnly === 'true',
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      };

      const facilities = await Facility.getAll(filters);

      res.json({
        facilities,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: facilities.length
        }
      });
    } catch (error) {
      console.error('Get facilities error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getFacilityTypes(req, res) {
    try {
      const types = await Facility.getTypes();
      res.json({ types });
    } catch (error) {
      console.error('Get facility types error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getFacility(req, res) {
    try {
      const { id } = req.params;
      const facility = await Facility.findById(id);

      if (!facility) {
        return res.status(404).json({ error: 'Facility not found.' });
      }

      res.json({ facility });
    } catch (error) {
      console.error('Get facility error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateFacility(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = facilitySchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const facility = await Facility.update(id, value);
      if (!facility) {
        return res.status(404).json({ error: 'Facility not found.' });
      }

      res.json({
        message: 'Facility updated successfully',
        facility
      });
    } catch (error) {
      console.error('Update facility error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deleteFacility(req, res) {
    try {
      const { id } = req.params;
      const result = await Facility.delete(id);

      if (!result) {
        return res.status(404).json({ error: 'Facility not found.' });
      }

      res.json({ message: 'Facility deleted successfully' });
    } catch (error) {
      console.error('Delete facility error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateFacilityStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['available', 'maintenance', 'closed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status value.' });
      }

      const facility = await Facility.updateStatus(id, status);
      if (!facility) {
        return res.status(404).json({ error: 'Facility not found.' });
      }

      res.json({
        message: 'Facility status updated successfully',
        facility
      });
    } catch (error) {
      console.error('Update facility status error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getFacilityAvailability(req, res) {
    try {
      const { id } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({ error: 'Date parameter is required.' });
      }

      const availability = await Facility.getAvailableSlots(id, date);
      if (!availability) {
        return res.status(404).json({ error: 'Facility not found.' });
      }

      res.json(availability);
    } catch (error) {
      console.error('Get facility availability error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getAvailableSlots(req, res) {
    try {
      const { id } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({ error: 'Date parameter is required.' });
      }

      const slots = await Facility.getAvailableSlots(id, date);
      if (!slots) {
        return res.status(404).json({ error: 'Facility not found.' });
      }

      res.json(slots);
    } catch (error) {
      console.error('Get available slots error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getFacilityUtilization(req, res) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date are required.' });
      }

      const utilization = await Facility.getUtilization(
        moment(startDate).toISOString(),
        moment(endDate).toISOString()
      );

      res.json({ utilization });
    } catch (error) {
      console.error('Get facility utilization error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = FacilityController;