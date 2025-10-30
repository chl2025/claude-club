const express = require('express');
const { body, query } = require('express-validator');
const FacilityController = require('../controllers/facilityController');
const { authMiddleware, staffMiddleware } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateFacility = [
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('type').trim().isLength({ min: 2, max: 50 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('capacity').optional().isInt({ min: 1 }),
  body('location').optional().trim().isLength({ max: 100 }),
  body('operatingHoursStart').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('operatingHoursEnd').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('bookingDurationMinutes').optional().isInt({ min: 15, max: 480 }),
  body('bookingBufferMinutes').optional().isInt({ min: 0, max: 60 }),
  body('requiresSupervision').optional().isBoolean()
];

const validateAvailabilityQuery = [
  query('date').isISO8601().withMessage('Date is required and must be in ISO format')
];

// Public routes (available to all authenticated users)
router.get('/', authMiddleware, FacilityController.getFacilities);
router.get('/types', authMiddleware, FacilityController.getFacilityTypes);
router.get('/:id', authMiddleware, FacilityController.getFacility);
router.get('/:id/availability', authMiddleware, validateAvailabilityQuery, FacilityController.getFacilityAvailability);
router.get('/:id/available-slots', authMiddleware, validateAvailabilityQuery, FacilityController.getAvailableSlots);

// Admin/Staff routes
router.post('/', authMiddleware, staffMiddleware, validateFacility, FacilityController.createFacility);
router.put('/:id', authMiddleware, staffMiddleware, validateFacility, FacilityController.updateFacility);
router.delete('/:id', authMiddleware, staffMiddleware, FacilityController.deleteFacility);
router.put('/:id/status', authMiddleware, staffMiddleware, FacilityController.updateFacilityStatus);
router.get('/admin/utilization', authMiddleware, staffMiddleware, FacilityController.getFacilityUtilization);

module.exports = router;