import express from 'express';
import GameScore from '../models/GameScore.js';

const router = express.Router();

// Save game score
router.post('/', async (req, res) => {
  try {
    const gameScore = new GameScore(req.body);
    await gameScore.save();
    res.status(201).json({ success: true, data: gameScore });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get all scores for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const scores = await GameScore.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: scores });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get leaderboard for a game type
router.get('/leaderboard/:gameType', async (req, res) => {
  try {
    const scores = await GameScore.find({ gameType: req.params.gameType })
      .populate('userId', 'name')
      .sort({ score: -1 })
      .limit(10);
    res.json({ success: true, data: scores });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
