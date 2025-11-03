const express = require('express');
const router = express.Router();

router.get('/types', (req, res) => {
  res.json({ message: 'This is a test' });
});

module.exports = router;
