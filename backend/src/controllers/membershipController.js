const Membership = require('../models/Membership');

const getMembershipTypes = async (req, res) => {
  try {
    const types = await Membership.getTypes();
    res.json(types);
  } catch (error) {
    console.error('Get membership types error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createMembership = async (req, res) => {
  try {
    const membership = await Membership.create(req.body);
    res.status(201).json({
      message: 'Membership created successfully',
      membership
    });
  } catch (error) {
    console.error('Create membership error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getMembershipTypes,
  createMembership,
};
