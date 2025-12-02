import mongoose from 'mongoose';

const gameScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameType: {
    type: String,
    enum: ['iq-test', 'aptitude-test', 'gk-test', '2048'],
    required: true
  },
  score: Number,
  level: String,
  details: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('GameScore', gameScoreSchema);
