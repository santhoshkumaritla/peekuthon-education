import express from 'express';
import Chat from '../models/Chat.js';

const router = express.Router();

// Create or update chat
router.post('/', async (req, res) => {
  try {
    const { userId, messages } = req.body;
    let chat = await Chat.findOne({ userId });
    
    if (chat) {
      chat.messages.push(...messages);
      await chat.save();
    } else {
      chat = new Chat({ userId, messages });
      await chat.save();
    }
    
    res.status(201).json({ success: true, data: chat });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get chat history for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: chats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
