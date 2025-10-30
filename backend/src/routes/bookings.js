const express = require('express');
const { body, query } = require('express-validator');
const BookingController = require('../controllers/bookingController');
const { authMiddleware, staffMiddleware } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateBooking = [
  body('facilityId').isUUID(),
  body('startTime').isISO8601(),
  body('endTime').isISO8601(),
  body('notes').optional().isLength({ max: 500 })
];

const validateBookingUpdate = [
  body('status').optional().isIn(['confirmed', 'cancelled', 'completed', 'no_show']),
  body('notes').optional().isLength({ max: 500 })
];

const validateAvailabilityQuery = [
  query('date').isISO8601().withMessage('Date is required and must be in ISO format')
];

// Member routes
router.post('/', authMiddleware, validateBooking, BookingController.createBooking);
router.get('/', authMiddleware, BookingController.getBookings);
router.get('/:id', authMiddleware, BookingController.getBooking);
router.delete('/:id', authMiddleware, BookingController.cancelBooking);
router.get('/facilities/:facilityId/availability', authMiddleware, validateAvailabilityQuery, BookingController.getFacilityAvailability);

// Admin/Staff routes
router.get('/admin/all', authMiddleware, staffMiddleware, BookingController.getAllBookings);
router.put('/:id/status', authMiddleware, staffMiddleware, validateBookingUpdate, BookingController.updateBookingStatus);
router.get('/admin/stats', authMiddleware, staffMiddleware, BookingController.getBookingStats);

module.exports = router;