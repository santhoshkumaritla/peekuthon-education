import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  modules: [{
    moduleNumber: Number,
    title: String,
    sections: [{
      sectionNumber: Number,
      title: String,
      content: String
    }]
  }],
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

export default mongoose.model('Course', courseSchema);
