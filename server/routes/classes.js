const express = require('express');
const Class = require('../models/Class');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all classes for a university
router.get('/university/:universityId', auth, async (req, res) => {
  try {
    const classes = await Class.find({ university: req.params.universityId })
      .populate('createdBy', 'name email')
      .populate('studyGroups')
      .sort({ createdAt: -1 });

    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single class
router.get('/:id', auth, async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id)
      .populate('university')
      .populate('createdBy', 'name email')
      .populate({
        path: 'studyGroups',
        populate: {
          path: 'createdBy members',
          select: 'name email'
        }
      });

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json(classData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new class
router.post('/', auth, async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const universityId = req.user.university._id || req.user.university;

    // Check if class already exists for this university
    const existingClass = await Class.findOne({
      code: code.toUpperCase(),
      university: universityId
    });

    if (existingClass) {
      return res.status(400).json({ message: 'Class already exists for this university' });
    }

    const newClass = new Class({
      name,
      code: code.toUpperCase(),
      description,
      university: universityId,
      createdBy: req.user._id
    });

    await newClass.save();
    await newClass.populate('createdBy', 'name email');
    await newClass.populate('university');

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`university-${universityId}`).emit('new-class', newClass);

    res.status(201).json(newClass);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Class code already exists for this university' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a class (only by creator)
router.delete('/:id', auth, async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Only allow creator to delete
    if (classData.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete classes you created' });
    }

    await Class.findByIdAndDelete(req.params.id);

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`university-${classData.university}`).emit('class-deleted', req.params.id);

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

