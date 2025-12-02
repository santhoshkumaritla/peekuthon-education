import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true
  },
  studentMobile: {
    type: String,
    required: true,
    unique: true
  },
  parentMobile: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'parent', 'teacher'],
    default: 'student'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('User', userSchema);
