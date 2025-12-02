# 🗄️ MongoDB Backend Setup - Complete!

## ✅ What Was Created

### Backend Structure (in `/Backend` folder)

```
Backend/
├── config/
│   └── db.js                    # MongoDB connection
├── models/                      # 8 Mongoose models
│   ├── User.js
│   ├── Book.js                  # ReadBook page
│   ├── Quiz.js                  # QuizGenerator page
│   ├── Flashcard.js             # FlashCardGenerator page
│   ├── Chat.js                  # QuestionBot page
│   ├── LearningResource.js      # LearningResourceGenerator page
│   ├── GameScore.js             # All games (IQ, Aptitude, GK, 2048)
│   └── ConceptAnimation.js      # ConceptAnimator page
├── routes/                      # 7 API route handlers
│   ├── books.js
│   ├── quizzes.js
│   ├── flashcards.js
│   ├── chats.js
│   ├── learningResources.js
│   ├── gameScores.js
│   └── concepts.js
├── .env                         # MongoDB connection string (configured)
├── .gitignore
├── package.json
├── README.md
└── server.js                    # Express server
```

### Frontend Integration

- `src/lib/api.ts` - API helper functions for all features

## 🚀 How to Run

### 1. Start the Backend

```powershell
# Open a new terminal
cd Backend
npm install
npm run dev
```

Server will start on: http://localhost:5000

### 2. Start the Frontend (existing terminal)

```powershell
cd learnnest-dashboard-main
npm run dev
```

Frontend will run on: http://localhost:5173

## 📊 Database Features

### Each Page Can Now:

**ReadBook** → Save generated books to database

```javascript
import { bookAPI } from "@/lib/api";
await bookAPI.create({ userId, topic, pages });
```

**QuizGenerator** → Store quizzes and scores

```javascript
import { quizAPI } from "@/lib/api";
await quizAPI.create({ userId, topic, questions, score });
```

**FlashCardGenerator** → Save flashcard sets

```javascript
import { flashcardAPI } from "@/lib/api";
await flashcardAPI.create({ userId, topic, cards });
```

**QuestionBot** → Store chat history

```javascript
import { chatAPI } from "@/lib/api";
await chatAPI.saveMessages(userId, messages);
```

**LearningResourceGenerator** → Save curated resources

```javascript
import { learningResourceAPI } from "@/lib/api";
await learningResourceAPI.create({ userId, topic, resources });
```

**GameZone** → Track scores and leaderboards

```javascript
import { gameScoreAPI } from "@/lib/api";
await gameScoreAPI.saveScore({ userId, gameType, score });
```

**ConceptAnimator** → Store animations

```javascript
import { conceptAPI } from "@/lib/api";
await conceptAPI.create({ userId, topic, summary, steps });
```

## 🔌 API Endpoints Available

All endpoints start with: `http://localhost:5000/api`

- `/books` - CRUD operations for books
- `/quizzes` - CRUD operations for quizzes
- `/flashcards` - CRUD operations for flashcards
- `/chats` - Save and retrieve chat history
- `/learning-resources` - Manage learning resources
- `/game-scores` - Game scores and leaderboards
- `/concepts` - Concept animations
- `/health` - Check if API is running

## 💡 Example Usage in Frontend

### Save a Book After Generation

```typescript
import { bookAPI } from "@/lib/api";

// After generating book content
const saveBook = async () => {
  try {
    const result = await bookAPI.create({
      userId: "user123", // You'll need to implement user management
      topic: bookTopic,
      pages: generatedPages,
    });
    console.log("Book saved:", result);
  } catch (error) {
    console.error("Failed to save book:", error);
  }
};
```

### Save Quiz Score

```typescript
import { quizAPI } from "@/lib/api";

const saveQuizResults = async (quizId: string, score: number) => {
  await quizAPI.updateScore(quizId, score);
};
```

## 🔑 Configuration

### MongoDB Connection

Already configured in `Backend/.env`:

```
MONGODB_URI=mongodb+srv://root:root@cluster0.ovytasp.mongodb.net/learnnest?retryWrites=true&w=majority&appName=Cluster0
```

Database name: `learnnest`

### Frontend API URL

Added to `learnnest-dashboard-main/.env.local`:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

## 📝 Next Steps

1. **Install backend dependencies**

   ```powershell
   cd Backend
   npm install
   ```

2. **Start backend server**

   ```powershell
   npm run dev
   ```

3. **Test API**
   Visit: http://localhost:5000/api/health
   Should return: `{ "success": true, "message": "LearnNest API is running" }`

4. **Integrate in pages**
   Import API functions in your page components and call them after generating content

## 🎯 Benefits

✅ **Persistent Storage** - All generated content saved to MongoDB
✅ **User History** - Track what each user has created
✅ **Leaderboards** - Game scores ranked
✅ **Data Analytics** - Analyze user behavior
✅ **Resume Later** - Users can access their saved content
✅ **Backup** - Data safely stored in cloud database

## 🛠️ Tech Stack

- **Mongoose** - MongoDB ODM (schema validation, relationships)
- **Express.js** - REST API framework
- **MongoDB Atlas** - Cloud database
- **CORS** - Cross-origin requests enabled
- **dotenv** - Environment variable management

Read `Backend/README.md` for detailed API documentation!
