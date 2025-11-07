const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const universityRoutes = require('./routes/universities');
const classRoutes = require('./routes/classes');
const studyGroupRoutes = require('./routes/studyGroups');

const app = express();
const server = http.createServer(app);

// CORS configuration - allow frontend URL from environment or default to localhost
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
const allowedOrigins = [frontendUrl, "http://localhost:3000"];

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/study-groups';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/study-groups', studyGroupRoutes);

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-university', (universityId) => {
    socket.join(`university-${universityId}`);
    console.log(`User ${socket.id} joined university ${universityId}`);
  });

  socket.on('join-class', (classId) => {
    socket.join(`class-${classId}`);
    console.log(`User ${socket.id} joined class ${classId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

