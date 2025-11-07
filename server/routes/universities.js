const express = require('express');
const University = require('../models/University');
const Class = require('../models/Class');
const auth = require('../middleware/auth');
const router = express.Router();

// Get university by ID with classes
router.get('/:id', auth, async (req, res) => {
  try {
    const university = await University.findById(req.params.id);
    if (!university) {
      return res.status(404).json({ message: 'University not found' });
    }

    const classes = await Class.find({ university: university._id })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      university,
      classes
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all universities
router.get('/', async (req, res) => {
  try {
    const universities = await University.find().sort({ name: 1 });
    res.json(universities);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

