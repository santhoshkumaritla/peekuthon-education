import express from 'express';
import Flashcard from '../models/Flashcard.js';

const router = express.Router();

// Create flashcards
router.post('/', async (req, res) => {
  try {
    const flashcard = new Flashcard(req.body);
    await flashcard.save();
    res.status(201).json({ success: true, data: flashcard });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get all flashcards for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: flashcards });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
