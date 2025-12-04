import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import connectDB from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRoutes from './routes/auth.js';
import bookRoutes from './routes/books.js';
import quizRoutes from './routes/quizzes.js';
import flashcardRoutes from './routes/flashcards.js';
import chatRoutes from './routes/chats.js';
import learningResourceRoutes from './routes/learningResources.js';
import gameScoreRoutes from './routes/gameScores.js';
import conceptRoutes from './routes/concepts.js';
import studyRoomRoutes from './routes/studyRooms.js';
import newsRoutes from './routes/news.js';
import courseRoutes from './routes/courses.js';

// Import models
import StudyRoom from './models/StudyRoom.js';
import Message from './models/Message.js';

// Load environment variables
dotenv.config();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Connect to MongoDB
connectDB();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, documents, and common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/learning-resources', learningResourceRoutes);
app.use('/api/game-scores', gameScoreRoutes);
app.use('/api/concepts', conceptRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/study-rooms', studyRoomRoutes);
app.use('/api/news', newsRoutes);

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      console.error('❌ No file in request');
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    console.log('✅ File uploaded successfully:', {
      name: req.file.originalname,
      size: req.file.size,
      path: fileUrl
    });
    
    res.json({
      success: true,
      file: {
        url: fileUrl,
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('❌ File upload error:', error);
    res.status(500).json({ success: false, error: 'File upload failed' });
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'LearnNest API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Something went wrong!' 
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // Join room
  socket.on('joinRoom', async ({ roomId, userId, username }) => {
    try {
      socket.join(roomId);
      console.log(`User ${username} (${userId}) joining room ${roomId}`);

      // Get room and check if participant already exists
      const room = await StudyRoom.findById(roomId);
      if (room) {
        const existingParticipant = room.participants.find(p => p.userId === userId);
        
        if (existingParticipant) {
          // Update with current username, active status and join time
          existingParticipant.username = username; // ALWAYS use the current logged-in user's name
          existingParticipant.isActive = true;
          existingParticipant.joinedAt = new Date();
          await room.save();
          console.log(`✅ Participant ${username} reactivated in room ${roomId}`);
        } else {
          // Add new participant with the provided username
          room.participants.push({
            userId,
            username,
            joinedAt: new Date(),
            studyTime: 0,
            isActive: true
          });
          await room.save();
          console.log(`✅ Participant ${username} added to room ${roomId}`);
        }

        // Broadcast using the current username
        const participant = { 
          userId, 
          username, // Use the current logged-in user's username
          joinedAt: new Date(), 
          studyTime: existingParticipant?.studyTime || 0, 
          isActive: true 
        };
        
        // Create system message with current username
        const systemMessage = new Message({
          roomId,
          userId: 'system',
          username: 'System',
          content: `${username} joined the room`,
          type: 'system'
        });
        await systemMessage.save();

        // Broadcast to ALL in the room including sender
        io.to(roomId).emit('userJoined', { participant, systemMessage });
      }
    } catch (error) {
      console.error('Error joining room:', error);
    }
  });

  // Leave room
  socket.on('leaveRoom', async ({ roomId, userId }) => {
    try {
      socket.leave(roomId);

      // Get room and mark participant as inactive
      const room = await StudyRoom.findById(roomId);
      if (room) {
        const participant = room.participants.find(p => p.userId === userId);
        const username = participant?.username || 'User';

        // Mark participant as inactive
        if (participant) {
          participant.isActive = false;
          await room.save();
          console.log(`✅ User ${username} marked as inactive in room ${roomId}`);
        }

        console.log(`User ${username} left room ${roomId}`);

        // Create system message
        const systemMessage = new Message({
          roomId,
          userId: 'system',
          username: 'System',
          content: `${username} left the room`,
          type: 'system'
        });
        await systemMessage.save();

        io.to(roomId).emit('userLeft', { userId, systemMessage });
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  // Send message
  socket.on('sendMessage', async ({ roomId, userId, username, content, fileData }) => {
    try {
      const messageData = {
        roomId,
        userId,
        username,
        content,
        type: fileData ? 'file' : 'user'
      };

      // Add file data if present
      if (fileData) {
        messageData.fileUrl = fileData.url;
        messageData.fileName = fileData.name;
        messageData.fileType = fileData.type;
        messageData.fileSize = fileData.size;
      }

      const message = new Message(messageData);
      await message.save();
      
      console.log(`📨 Message from ${username} in room ${roomId}${fileData ? ' (with file)' : ''}: ${content}`);
      console.log(`📤 Broadcasting message to room ${roomId}`);

      // Broadcast to all in room including sender
      const messageObj = message.toObject();
      io.to(roomId).emit('newMessage', messageObj);
      console.log(`✅ Message broadcasted successfully`);
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  });

  // Add note
  socket.on('addNote', async ({ roomId, note }) => {
    try {
      console.log(`📝 Adding note to room ${roomId}:`, note);
      io.to(roomId).emit('noteAdded', note);
      console.log(`✅ Note broadcasted successfully`);
    } catch (error) {
      console.error('❌ Error adding note:', error);
    }
  });

  // Update note
  socket.on('updateNote', async ({ roomId, note }) => {
    try {
      console.log(`📝 Updating note in room ${roomId}:`, note);
      io.to(roomId).emit('noteUpdated', note);
      console.log(`✅ Note update broadcasted successfully`);
    } catch (error) {
      console.error('❌ Error updating note:', error);
    }
  });

  // Delete note
  socket.on('deleteNote', async ({ roomId, noteId }) => {
    try {
      console.log(`🗑️ Deleting note ${noteId} from room ${roomId}`);
      io.to(roomId).emit('noteDeleted', noteId);
      console.log(`✅ Note deletion broadcasted successfully`);
    } catch (error) {
      console.error('❌ Error deleting note:', error);
    }
  });

  // Update study time
  socket.on('updateStudyTime', async ({ roomId, userId, studyTime }) => {
    try {
      const room = await StudyRoom.findById(roomId);
      if (room) {
        const participant = room.participants.find(p => p.userId === userId);
        if (participant) {
          participant.studyTime = studyTime;
          await room.save();

          io.to(roomId).emit('studyTimeUpdated', { userId, studyTime });
        }
      }
    } catch (error) {
      console.error('Error updating study time:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Socket.IO is ready for connections`);
});
