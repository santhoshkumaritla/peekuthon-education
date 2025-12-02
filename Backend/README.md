# LearnNest Backend API

MongoDB + Mongoose backend for LearnNest Dashboard

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd Backend
npm install
```

### 2. Environment Setup
The `.env` file is already configured with your MongoDB connection string.

### 3. Start the Server
```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

Server will run on: http://localhost:5000

## 📊 Database Models

### User
- Name, email, role (student/parent/teacher)

### Book (ReadBook page)
- Topic, pages with content
- Stores generated books

### Quiz (QuizGenerator page)
- Questions, answers, scores
- Tracks quiz attempts

### Flashcard (FlashCardGenerator page)
- Front/back card content
- Organized by topic

### Chat (QuestionBot page)
- Conversation history
- User and assistant messages

### LearningResource (LearningResourceGenerator page)
- Books, videos, websites, courses
- Curated resources by topic

### GameScore (GameZone)
- IQ Test, Aptitude Test, GK Test, 2048 scores
- Leaderboards

### ConceptAnimation (ConceptAnimator page)
- Topic summaries and steps
- Animation content

## 🔌 API Endpoints

### Books
- `POST /api/books` - Create book
- `GET /api/books/user/:userId` - Get user's books
- `GET /api/books/:id` - Get specific book
- `DELETE /api/books/:id` - Delete book

### Quizzes
- `POST /api/quizzes` - Create quiz
- `GET /api/quizzes/user/:userId` - Get user's quizzes
- `PATCH /api/quizzes/:id/score` - Update score

### Flashcards
- `POST /api/flashcards` - Create flashcards
- `GET /api/flashcards/user/:userId` - Get user's flashcards

### Chats
- `POST /api/chats` - Save chat messages
- `GET /api/chats/user/:userId` - Get chat history

### Learning Resources
- `POST /api/learning-resources` - Save resources
- `GET /api/learning-resources/user/:userId` - Get resources

### Game Scores
- `POST /api/game-scores` - Save score
- `GET /api/game-scores/user/:userId` - Get user scores
- `GET /api/game-scores/leaderboard/:gameType` - Get leaderboard

### Concepts
- `POST /api/concepts` - Save concept
- `GET /api/concepts/user/:userId` - Get user concepts

### Health Check
- `GET /api/health` - Check if API is running

## 📝 Example Usage

### Save a Book
```javascript
fetch('http://localhost:5000/api/books', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: '507f1f77bcf86cd799439011',
    topic: 'Mathematics',
    pages: [
      { pageNumber: 1, leftContent: 'Intro...', rightContent: 'Chapter 1...' }
    ]
  })
});
```

### Save a Quiz Score
```javascript
fetch('http://localhost:5000/api/quizzes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: '507f1f77bcf86cd799439011',
    topic: 'Science',
    questions: [...],
    score: 8,
    totalQuestions: 10
  })
});
```

## 🛠️ Technologies
- **Express.js** - Web framework
- **Mongoose** - MongoDB ODM
- **MongoDB Atlas** - Cloud database
- **CORS** - Cross-origin support
- **dotenv** - Environment variables

## 📦 Project Structure
```
Backend/
├── config/
│   └── db.js              # MongoDB connection
├── models/
│   ├── User.js
│   ├── Book.js
│   ├── Quiz.js
│   ├── Flashcard.js
│   ├── Chat.js
│   ├── LearningResource.js
│   ├── GameScore.js
│   └── ConceptAnimation.js
├── routes/
│   ├── books.js
│   ├── quizzes.js
│   ├── flashcards.js
│   ├── chats.js
│   ├── learningResources.js
│   ├── gameScores.js
│   └── concepts.js
├── .env                   # Environment variables
├── .gitignore
├── package.json
└── server.js              # Main entry point
```
