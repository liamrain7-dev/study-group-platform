const express = require('express');
const StudyGroup = require('../models/StudyGroup');
const Class = require('../models/Class');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all study groups for a class
router.get('/class/:classId', auth, async (req, res) => {
  try {
    const studyGroups = await StudyGroup.find({ class: req.params.classId })
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });

    res.json(studyGroups);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new study group
router.post('/', auth, async (req, res) => {
  try {
    const { name, classId, description, maxMembers } = req.body;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const newStudyGroup = new StudyGroup({
      name,
      class: classId,
      description,
      maxMembers: maxMembers || 10,
      createdBy: req.user._id,
      members: [req.user._id]
    });

    await newStudyGroup.save();
    await newStudyGroup.populate('createdBy', 'name email');
    await newStudyGroup.populate('members', 'name email');

    // Add study group to class
    classData.studyGroups.push(newStudyGroup._id);
    await classData.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`class-${classId}`).emit('new-study-group', newStudyGroup);

    res.status(201).json(newStudyGroup);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Join a study group
router.post('/:id/join', auth, async (req, res) => {
  try {
    const studyGroup = await StudyGroup.findById(req.params.id);
    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    if (studyGroup.members.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already a member of this study group' });
    }

    if (studyGroup.members.length >= studyGroup.maxMembers) {
      return res.status(400).json({ message: 'Study group is full' });
    }

    studyGroup.members.push(req.user._id);
    await studyGroup.save();
    await studyGroup.populate('members', 'name email');

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`class-${studyGroup.class}`).emit('study-group-updated', studyGroup);

    res.json(studyGroup);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

