const express = require('express');
const Chat = require('../models/Chat');
const Class = require('../models/Class');
const StudyGroup = require('../models/StudyGroup');
const auth = require('../middleware/auth');
const router = express.Router();

// Generate a random invite code
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Get messages for a class chat
router.get('/class/:classId', auth, async (req, res) => {
  try {
    const classData = await Class.findById(req.params.classId);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if user has left the class chat
    const hasLeftChat = classData.usersLeftChat?.some(
      userId => userId.toString() === req.user._id.toString()
    );

    let chat = await Chat.findOne({ type: 'class', class: req.params.classId })
      .populate('messages.user', 'name email')
      .sort({ 'messages.createdAt': -1 });

    if (!chat) {
      // Create chat if it doesn't exist
      chat = new Chat({
        type: 'class',
        class: req.params.classId,
        messages: []
      });
      await chat.save();
    }

    res.json({
      chat: {
        _id: chat._id,
        messages: chat.messages.reverse(), // Reverse to show oldest first
        hasLeftChat
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get messages for a study group chat
router.get('/study-group/:groupId', auth, async (req, res) => {
  try {
    const studyGroup = await StudyGroup.findById(req.params.groupId);
    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    // Check if user is a member
    const isMember = studyGroup.members.some(
      memberId => memberId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'You must be a member to view this chat' });
    }

    let chat = await Chat.findOne({ type: 'studyGroup', studyGroup: req.params.groupId })
      .populate('messages.user', 'name email')
      .sort({ 'messages.createdAt': -1 });

    if (!chat) {
      // Create chat if it doesn't exist
      chat = new Chat({
        type: 'studyGroup',
        studyGroup: req.params.groupId,
        messages: []
      });
      await chat.save();
    }

    res.json({
      chat: {
        _id: chat._id,
        messages: chat.messages.reverse() // Reverse to show oldest first
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send a message to class chat
router.post('/class/:classId', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const classData = await Class.findById(req.params.classId);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check if user has left the class chat
    const hasLeftChat = classData.usersLeftChat?.some(
      userId => userId.toString() === req.user._id.toString()
    );

    if (hasLeftChat) {
      return res.status(403).json({ message: 'You have left this chat. Rejoin to send messages.' });
    }

    let chat = await Chat.findOne({ type: 'class', class: req.params.classId });
    if (!chat) {
      chat = new Chat({
        type: 'class',
        class: req.params.classId,
        messages: []
      });
    }

    chat.messages.push({
      user: req.user._id,
      message: message.trim()
    });

    await chat.save();
    await chat.populate('messages.user', 'name email');

    const newMessage = chat.messages[chat.messages.length - 1];

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`class-${req.params.classId}`).emit('new-class-message', {
      chatId: chat._id,
      message: newMessage
    });

    res.json({ message: newMessage });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send a message to study group chat
router.post('/study-group/:groupId', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const studyGroup = await StudyGroup.findById(req.params.groupId);
    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    // Check if user is a member
    const isMember = studyGroup.members.some(
      memberId => memberId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'You must be a member to send messages' });
    }

    let chat = await Chat.findOne({ type: 'studyGroup', studyGroup: req.params.groupId });
    if (!chat) {
      chat = new Chat({
        type: 'studyGroup',
        studyGroup: req.params.groupId,
        messages: []
      });
    }

    chat.messages.push({
      user: req.user._id,
      message: message.trim()
    });

    await chat.save();
    await chat.populate('messages.user', 'name email');

    const newMessage = chat.messages[chat.messages.length - 1];

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`study-group-${req.params.groupId}`).emit('new-study-group-message', {
      chatId: chat._id,
      message: newMessage
    });

    res.json({ message: newMessage });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Leave class chat
router.post('/class/:classId/leave', auth, async (req, res) => {
  try {
    const classData = await Class.findById(req.params.classId);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Add user to usersLeftChat if not already there
    if (!classData.usersLeftChat) {
      classData.usersLeftChat = [];
    }

    const alreadyLeft = classData.usersLeftChat.some(
      userId => userId.toString() === req.user._id.toString()
    );

    if (!alreadyLeft) {
      classData.usersLeftChat.push(req.user._id);
      await classData.save();
    }

    res.json({ message: 'Left class chat successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Rejoin class chat
router.post('/class/:classId/rejoin', auth, async (req, res) => {
  try {
    const classData = await Class.findById(req.params.classId);
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Remove user from usersLeftChat
    if (classData.usersLeftChat) {
      classData.usersLeftChat = classData.usersLeftChat.filter(
        userId => userId.toString() !== req.user._id.toString()
      );
      await classData.save();
    }

    res.json({ message: 'Rejoined class chat successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

