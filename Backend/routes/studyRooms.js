import express from 'express';
import mongoose from 'mongoose';
import StudyRoom from '../models/StudyRoom.js';
import Message from '../models/Message.js';

const router = express.Router();

// Get all active study rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await StudyRoom.find({ isActive: true })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: rooms
    });
  } catch (error) {
    console.error('Error fetching study rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch study rooms'
    });
  }
});

// Get room data with messages
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const room = await StudyRoom.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    if (!room.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Room is no longer active'
      });
    }

    // Get messages for this room
    const messages = await Message.find({ roomId: id })
      .sort({ timestamp: 1 })
      .limit(200); // Last 200 messages

    res.json({
      success: true,
      data: {
        room,
        messages,
        notes: room.notes,
        participants: room.participants.filter(p => p.isActive)
      }
    });
  } catch (error) {
    console.error('Error fetching room data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room data'
    });
  }
});

// Create new study room
router.post('/', async (req, res) => {
  try {
    const { name, createdBy, maxParticipants = 10 } = req.body;

    if (!name || !createdBy) {
      return res.status(400).json({
        success: false,
        message: 'Name and createdBy are required'
      });
    }

    // Generate unique room code
    const code = await StudyRoom.generateRoomCode();

    const room = new StudyRoom({
      name: name.trim(),
      code,
      createdBy,
      maxParticipants,
      participants: [],
      notes: []
    });

    await room.save();

    res.status(201).json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Error creating study room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create study room'
    });
  }
});

// Join study room
router.post('/join', async (req, res) => {
  try {
    const { code, roomId, userId, username } = req.body;

    if (!userId || !username) {
      return res.status(400).json({
        success: false,
        message: 'User ID and username are required'
      });
    }

    let room;

    if (code) {
      room = await StudyRoom.findOne({ code: code.toUpperCase(), isActive: true });
    } else if (roomId) {
      room = await StudyRoom.findOne({ _id: roomId, isActive: true });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Room code or room ID is required'
      });
    }

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found or is not active'
      });
    }

    // Check if already a participant
    const existingParticipant = room.participants.find(p => p.userId === userId);
    
    if (existingParticipant) {
      // Reactivate if inactive
      if (!existingParticipant.isActive) {
        existingParticipant.isActive = true;
        existingParticipant.joinedAt = new Date();
        await room.save();
      }

      return res.json({
        success: true,
        data: room,
        message: 'Already in the room'
      });
    }

    // Check max participants
    const activeParticipants = room.participants.filter(p => p.isActive).length;
    if (activeParticipants >= room.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Room is full'
      });
    }

    // Add new participant
    room.participants.push({
      userId,
      username,
      joinedAt: new Date(),
      studyTime: 0,
      isActive: true
    });

    await room.save();

    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Error joining study room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join study room'
    });
  }
});

// Leave study room
router.post('/:id/leave', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const room = await StudyRoom.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const participant = room.participants.find(p => p.userId === userId);

    if (participant) {
      participant.isActive = false;
    }

    await room.save();

    res.json({
      success: true,
      message: 'Left room successfully'
    });
  } catch (error) {
    console.error('Error leaving study room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave study room'
    });
  }
});

// Send message
router.post('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, username, content, type = 'user' } = req.body;

    if (!userId || !username || !content) {
      return res.status(400).json({
        success: false,
        message: 'User ID, username, and content are required'
      });
    }

    const message = new Message({
      roomId: id,
      userId,
      username,
      content: content.trim(),
      type
    });

    await message.save();

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// Add note
router.post('/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, username, content } = req.body;

    if (!userId || !username || !content) {
      return res.status(400).json({
        success: false,
        message: 'User ID, username, and content are required'
      });
    }

    const room = await StudyRoom.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const note = {
      _id: new mongoose.Types.ObjectId(),
      content: content.trim(),
      createdBy: userId,
      username,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    room.notes.push(note);
    await room.save();

    res.status(201).json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add note'
    });
  }
});

// Update note
router.patch('/:id/notes/:noteId', async (req, res) => {
  try {
    const { id, noteId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    const room = await StudyRoom.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const note = room.notes.id(noteId);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    note.content = content.trim();
    note.updatedAt = new Date();

    await room.save();

    res.json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update note'
    });
  }
});

// Delete note
router.delete('/:id/notes/:noteId', async (req, res) => {
  try {
    const { id, noteId } = req.params;

    const room = await StudyRoom.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    room.notes = room.notes.filter(note => note._id.toString() !== noteId);
    await room.save();

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete note'
    });
  }
});

// Delete study room (only creator can delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const room = await StudyRoom.findById(id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if the user is the creator
    if (room.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the room creator can delete this room'
      });
    }

    // Delete all messages associated with the room
    await Message.deleteMany({ roomId: id });

    // Delete the room
    await StudyRoom.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete room'
    });
  }
});

export default router;
