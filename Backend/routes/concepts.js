import express from 'express';
import ConceptAnimation from '../models/ConceptAnimation.js';

const router = express.Router();

// Save concept animation
router.post('/', async (req, res) => {
  try {
    const concept = new ConceptAnimation(req.body);
    await concept.save();
    res.status(201).json({ success: true, data: concept });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get all concepts for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const concepts = await ConceptAnimation.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: concepts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
