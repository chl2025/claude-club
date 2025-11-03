const express = require('express');
const router = express.Router();
const { getMembershipTypes, createMembership } = require('../controllers/membershipController');
const { protect } = require('../middleware/auth');

router.get('/types', protect, getMembershipTypes);
router.post('/', protect, createMembership);

module.exports = router;
