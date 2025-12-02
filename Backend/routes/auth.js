import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { studentName, studentMobile, parentMobile, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ studentMobile });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'Student mobile number already registered' 
      });
    }

    // Create new user (Note: In production, hash the password!)
    const user = new User({
      studentName,
      studentMobile,
      parentMobile,
      password // TODO: Hash password before saving in production
    });

    await user.save();

    // Return user without password
    const userResponse = {
      _id: user._id,
      studentName: user.studentName,
      studentMobile: user.studentMobile,
      parentMobile: user.parentMobile,
      role: user.role,
      createdAt: user.createdAt
    };

    res.status(201).json({ 
      success: true, 
      message: 'Registration successful',
      data: userResponse 
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { studentMobile, password } = req.body;

    // Find user by mobile number
    const user = await User.findOne({ studentMobile });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid mobile number or password' 
      });
    }

    // Check password (Note: In production, compare hashed passwords!)
    if (user.password !== password) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid mobile number or password' 
      });
    }

    // Return user without password
    const userResponse = {
      _id: user._id,
      studentName: user.studentName,
      studentMobile: user.studentMobile,
      parentMobile: user.parentMobile,
      role: user.role,
      createdAt: user.createdAt
    };

    res.json({ 
      success: true, 
      message: 'Login successful',
      data: userResponse 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user profile
router.patch('/:id', async (req, res) => {
  try {
    const { studentName, parentMobile } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { studentName, parentMobile },
      { new: true }
    ).select('-password');

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
