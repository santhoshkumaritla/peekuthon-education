# 🎓Study Genie - Education Platform

A comprehensive educational platform with AI-powered learning tools, interactive games, study rooms, and collaborative features.

## 🌐 Live Demo

- **Frontend**: [https://peekuthon-eduplatform.netlify.app](https://peekuthon-eduplatform.netlify.app)
- **Backend API**: [https://peekuthon-education.onrender.com](https://peekuthon-education.onrender.com)

## ✨ Features

### 📚Learning Tools

- **Quiz Generator** - AI-powered quiz generation
- **Flashcard Generator** - Create interactive flashcards
- **Question Bot** - AI assistant for learning queries
- **Concept Animator** - Visualize complex concepts
- **Learning Resource Generator** - Curated educational resources
- **Read Book** - Digital book reading experience
- **Hear and Learn** - Audio-based learning

### 🎮Game Zone

- **IQ Test** - Test your intelligence quotient
- **Aptitude Test** - Assess problem-solving skills
- **GK Test** - General knowledge challenges
- **2048 Game** - Classic puzzle game

### 👥Collaboration Features

- **Study Rooms** - Virtual collaborative study spaces
- **Real-time Chat** - Live messaging with participants
- **Note Board** - Shared note-taking
- **Media Sharing** - Share images and files

### 📰Additional Features

- **News Feed** - Latest educational news
- **User Profiles** - Personalized dashboards
- **Authentication** - Secure login/signup

## 🛠️Tech Stack

### Frontend

- **React 18** with TypeScript
- **Vite** - Fast build tool
- **TailwindCSS** - Utility-first CSS
- **shadcn/ui** - UI component library
- **React Router** - Client-side routing
- **Socket.io Client** - Real-time communication
- **Google Gemini AI** - AI-powered features

### Backend

- **Node.js** with Express
- **MongoDB** with Mongoose
- **Socket.io** - WebSocket server
- **JWT** - Authentication
- **Multer** - File uploads
- **GNews API** - News integration

## 📦Project Structure

```
learnnest-dashboard-main/
├── Backend/
│   ├── config/          # Database configuration
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── uploads/         # File upload directory
│   ├── server.js        # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── contexts/    # Context providers
│   │   ├── hooks/       # Custom hooks
│   │   ├── lib/         # Utilities and API
│   │   ├── pages/       # Page components
│   │   └── types/       # TypeScript types
│   ├── public/
│   └── package.json
└── README.md
```

## 🚀Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account
- Google Gemini API key
- GNews API key (optional)

### Local Development

#### 1. Clone the Repository

```bash
git clone https://github.com/santhoshkumaritla/peekuthon-education.git
cd peekuthon-education
```

#### 2. Backend Setup

```bash
cd Backend
npm install

# Create .env file
echo "PORT=5000
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=development
GNEWS_API_KEY=your_gnews_api_key
FRONTEND_URL=http://localhost:5173" > .env

# Start backend server
npm run dev
```

Backend will run on: http://localhost:5000

#### 3. Frontend Setup

```bash
cd frontend
npm install

# Create .env file with your API keys
cp .env.example .env

# Add your Gemini API keys to .env
# VITE_GEMINI_API_KEY=your_key_here
# ... (add all required keys)

# Start frontend dev server
npm run dev
```

Frontend will run on: http://localhost:5173

## 🌍 Deployment

### Backend (Render)

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `Backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add environment variables:
   - `NODE_ENV=production`
   - `MONGODB_URI=your_mongodb_uri`
   - `PORT=5000`
   - `GNEWS_API_KEY=your_key`
   - `FRONTEND_URL=your_netlify_url`

### Frontend (Netlify)

1. Create a new site on [Netlify](https://netlify.com)
2. Connect your GitHub repository
3. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
4. Add environment variables:
   - `VITE_API_BASE_URL=https://your-backend.onrender.com/api`
   - `VITE_SOCKET_URL=https://your-backend.onrender.com`
   - All Gemini API keys (8 keys)
   - Twilio credentials (optional)

## 📡 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Resources

- `GET/POST /api/books` - Books management
- `GET/POST /api/quizzes` - Quizzes management
- `GET/POST /api/flashcards` - Flashcards management
- `GET/POST /api/chats` - Chat history
- `GET/POST /api/learning-resources` - Learning resources
- `GET/POST /api/game-scores` - Game scores
- `GET/POST /api/concepts` - Concept animations

### Study Rooms

- `GET /api/study-rooms` - List all study rooms
- `POST /api/study-rooms` - Create study room
- `GET /api/study-rooms/:id` - Get room details
- `POST /api/study-rooms/:id/join` - Join room
- `POST /api/study-rooms/:id/leave` - Leave room

### News

- `GET /api/news` - Fetch latest news

## 🔐 Environment Variables

### Backend (.env)

```env
PORT=5000
MONGODB_URI=mongodb+srv://...
NODE_ENV=development
GNEWS_API_KEY=your_key
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GEMINI_API_KEY=your_key
VITE_GEMINI_QUESTIONBOT_API_KEY=your_key
VITE_GEMINI_QUIZ_API_KEY=your_key
VITE_GEMINI_LEARNING_API_KEY=your_key
VITE_GEMINI_HEAR_API_KEY=your_key
VITE_GEMINI_FLASHCARD_API_KEY=your_key
VITE_GEMINI_CONCEPT_API_KEY=your_key
VITE_GEMINI_GAMES_API_KEY=your_key
```

## 🗄️Database Models

- **User** - User accounts and profiles
- **Book** - Digital books and content
- **Quiz** - Quizzes and questions
- **Flashcard** - Flashcard decks
- **Chat** - Conversation history
- **LearningResource** - Educational resources
- **GameScore** - Game achievements
- **ConceptAnimation** - Animated concepts
- **StudyRoom** - Virtual study rooms
- **Message** - Room messages

## 🤝Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## 🙏Acknowledgments

- Google Gemini AI for AI capabilities
- shadcn/ui for beautiful components
- MongoDB Atlas for database hosting
- Render & Netlify for deployment


