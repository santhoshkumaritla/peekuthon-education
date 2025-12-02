import mongoose from 'mongoose';

const learningResourceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: String,
  resources: {
    books: [{
      title: String,
      author: String,
      description: String
    }],
    videos: [{
      title: String,
      channel: String,
      url: String
    }],
    websites: [{
      title: String,
      url: String,
      description: String
    }],
    courses: [{
      title: String,
      platform: String,
      instructor: String
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('LearningResource', learningResourceSchema);
