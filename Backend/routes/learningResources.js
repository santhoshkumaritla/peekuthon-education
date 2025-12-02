import express from 'express';
import LearningResource from '../models/LearningResource.js';

const router = express.Router();

// Create learning resources
router.post('/', async (req, res) => {
  try {
    const resource = new LearningResource(req.body);
    await resource.save();
    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get all resources for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const resources = await LearningResource.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: resources });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
