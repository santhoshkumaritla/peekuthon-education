import mongoose from 'mongoose';

const conceptAnimationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: String,
  summary: String,
  steps: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('ConceptAnimation', conceptAnimationSchema);
