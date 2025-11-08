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

// Get groups user has joined (but not created)
router.get('/my-joined', auth, async (req, res) => {
  try {
    const studyGroups = await StudyGroup.find({
      members: req.user._id,
      createdBy: { $ne: req.user._id }
    })
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .populate({
        path: 'class',
        populate: {
          path: 'university',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });

    res.json(studyGroups);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get groups user has created
router.get('/my-created', auth, async (req, res) => {
  try {
    const studyGroups = await StudyGroup.find({ createdBy: req.user._id })
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .populate({
        path: 'class',
        populate: {
          path: 'university',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });

    res.json(studyGroups);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a study group (only by creator)
router.put('/:id', auth, async (req, res) => {
  try {
    const studyGroup = await StudyGroup.findById(req.params.id);
    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    if (studyGroup.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can edit this study group' });
    }

    const { name, description, maxMembers } = req.body;
    
    if (name) studyGroup.name = name;
    if (description !== undefined) studyGroup.description = description;
    if (maxMembers) {
      if (maxMembers < studyGroup.members.length) {
        return res.status(400).json({ message: 'Max members cannot be less than current members' });
      }
      studyGroup.maxMembers = maxMembers;
    }

    await studyGroup.save();
    await studyGroup.populate('createdBy', 'name email');
    await studyGroup.populate('members', 'name email');
    await studyGroup.populate({
      path: 'class',
      populate: {
        path: 'university',
        select: 'name'
      }
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`class-${studyGroup.class._id || studyGroup.class}`).emit('study-group-updated', studyGroup);

    res.json(studyGroup);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Leave a study group
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const studyGroup = await StudyGroup.findById(req.params.id);
    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    if (studyGroup.createdBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Creator cannot leave the group. Delete it instead.' });
    }

    if (!studyGroup.members.includes(req.user._id)) {
      return res.status(400).json({ message: 'You are not a member of this study group' });
    }

    studyGroup.members = studyGroup.members.filter(
      memberId => memberId.toString() !== req.user._id.toString()
    );
    await studyGroup.save();
    await studyGroup.populate('members', 'name email');

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`class-${studyGroup.class._id || studyGroup.class}`).emit('study-group-updated', studyGroup);

    res.json({ message: 'Left study group successfully', studyGroup });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a study group (only by creator)
router.delete('/:id', auth, async (req, res) => {
  try {
    const studyGroup = await StudyGroup.findById(req.params.id);
    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    if (studyGroup.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the creator can delete this study group' });
    }

    const classId = studyGroup.class._id || studyGroup.class;
    
    // Remove from class
    const classData = await Class.findById(classId);
    if (classData) {
      classData.studyGroups = classData.studyGroups.filter(
        sgId => sgId.toString() !== studyGroup._id.toString()
      );
      await classData.save();
    }

    await StudyGroup.findByIdAndDelete(req.params.id);

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`class-${classId}`).emit('study-group-deleted', req.params.id);

    res.json({ message: 'Study group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

