import express from 'express';
import Course from '../models/Course.js';

const router = express.Router();

// Get all courses for a user
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const courses = await Course.find({ userId }).sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get a specific course
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Create a new course
router.post('/', async (req, res) => {
  try {
    const { userId, topic, difficulty, modules } = req.body;

    if (!userId || !topic || !difficulty || !modules) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const course = new Course({
      userId,
      topic,
      difficulty,
      modules,
      completed: false
    });

    await course.save();
    res.status(201).json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// Mark course as completed
router.patch('/:id/complete', async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      {
        completed: true,
        completedAt: new Date()
      },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    console.error('Error completing course:', error);
    res.status(500).json({ error: 'Failed to complete course' });
  }
});

// Get course statistics
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const totalCourses = await Course.countDocuments({ userId });
    const completedCourses = await Course.countDocuments({ userId, completed: true });

    res.json({
      totalCourses,
      completedCourses,
      inProgressCourses: totalCourses - completedCourses
    });
  } catch (error) {
    console.error('Error fetching course stats:', error);
    res.status(500).json({ error: 'Failed to fetch course stats' });
  }
});

// Delete a course
router.delete('/:id', async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

export default router;
