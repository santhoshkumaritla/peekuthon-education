# Study Room Feature Setup Instructions

## Overview

The Study Room feature enables real-time collaborative studying with chat, shared notes, and participant tracking using Socket.IO.

## Installation Steps

### Backend Setup

1. **Install socket.io dependency**:

   ```powershell
   cd Backend
   npm install socket.io
   ```

2. **Environment Variables** (Backend):
   No additional environment variables needed. The server runs on port 5000 by default.

### Frontend Setup

1. **Install socket.io-client dependency**:

   ```powershell
   cd frontend
   npm install socket.io-client
   ```

2. **Environment Variables** (Frontend):
   Copy `.env.example` to `.env.local` and add:
   ```
   VITE_SOCKET_URL=http://localhost:5000
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

## Running the Application

### Start Backend Server:

```powershell
cd Backend
npm run dev
```

You should see:

- 🚀 Server is running on port 5000
- 🔌 Socket.IO is ready for connections
- ✅ MongoDB Connected: ...

### Start Frontend:

```powershell
cd frontend
npm run dev
```

Access at: http://localhost:5173

## Study Room Features

### 1. **Create Study Room**

- Navigate to "Study Rooms" in sidebar
- Click "Create Room" tab
- Enter room name and max participants (2-50)
- Click "Create Room"
- You'll be redirected to the room automatically

### 2. **Join Study Room**

- **Browse Rooms**: View all active rooms and click "Join Room"
- **Join by Code**: Enter a 6-character room code (e.g., ABC123)

### 3. **Real-time Chat**

- Send messages that appear instantly for all participants
- System messages notify when users join/leave
- Messages auto-scroll to latest
- Press Enter to send, Shift+Enter for new line

### 4. **Collaborative Notes**

- Click "Add Note" to create shared notes
- Edit your own notes with the edit button
- Delete your own notes
- All participants see notes in real-time
- Notes persist in the database

### 5. **Participant Tracking**

- See all active participants
- View when each participant joined
- Track study time (updates every minute)
- Active indicator (green dot)

### 6. **Room Management**

- Copy room code to invite others
- Leave room button (top right)
- Connection status indicator
- Room capacity displayed

## Socket.IO Events

### Client → Server:

- `joinRoom`: Join a study room
- `leaveRoom`: Leave a study room
- `sendMessage`: Send a chat message
- `addNote`: Add a new note
- `updateNote`: Update existing note
- `deleteNote`: Delete a note
- `updateStudyTime`: Update user's study time

### Server → Client:

- `newMessage`: New chat message received
- `userJoined`: User joined the room
- `userLeft`: User left the room
- `noteAdded`: New note added
- `noteUpdated`: Note was updated
- `noteDeleted`: Note was deleted
- `studyTimeUpdated`: Study time updated

## Database Schema

### StudyRoom Model:

```javascript
{
  name: String,
  code: String (6 chars, unique),
  createdBy: String (userId),
  participants: [{
    userId: String,
    username: String,
    joinedAt: Date,
    studyTime: Number (minutes),
    isActive: Boolean
  }],
  notes: [{
    content: String,
    createdBy: String,
    username: String,
    createdAt: Date,
    updatedAt: Date
  }],
  maxParticipants: Number (2-50),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Message Model:

```javascript
{
  roomId: ObjectId,
  userId: String,
  username: String,
  content: String,
  type: 'user' | 'system',
  timestamp: Date
}
```

## API Endpoints

### Study Rooms:

- `GET /api/study-rooms` - Get all active rooms
- `GET /api/study-rooms/:id` - Get room data with messages
- `POST /api/study-rooms` - Create new room
- `POST /api/study-rooms/join` - Join room by code or ID
- `POST /api/study-rooms/:id/leave` - Leave room
- `POST /api/study-rooms/:id/messages` - Send message
- `POST /api/study-rooms/:id/notes` - Add note
- `PATCH /api/study-rooms/:id/notes/:noteId` - Update note
- `DELETE /api/study-rooms/:id/notes/:noteId` - Delete note

## Troubleshooting

### Socket.IO connection fails:

1. Verify backend is running on port 5000
2. Check `VITE_SOCKET_URL` in frontend `.env.local`
3. Ensure CORS is properly configured in backend
4. Check browser console for connection errors

### Messages not appearing:

1. Check Socket.IO connection status (indicator in room header)
2. Verify backend Socket.IO event handlers are working
3. Check browser console and backend logs

### Room code not working:

1. Ensure room is active
2. Check room hasn't reached max participants
3. Code is case-insensitive but stored uppercase

### Study time not updating:

1. Study time updates every 60 seconds
2. Check socket connection is active
3. Verify user is still marked as active participant

## Architecture

### Frontend:

- **SocketContext**: Manages Socket.IO connection and reconnection
- **useSocket**: Hook to access socket instance
- **useSocketEvents**: Hook to register event listeners with cleanup
- **Components**: ChatBox, NoteBoard, Participants, RoomHeader
- **Pages**: StudyRoomsList (browse/create/join), StudyRoom (main room page)

### Backend:

- **Socket.IO Server**: Handles real-time events
- **Models**: StudyRoom (with embedded participants/notes), Message
- **Routes**: REST API for room management
- **Event Handlers**: Broadcasting to rooms, database operations

## Key Features Implemented

✅ Real-time bidirectional communication (Socket.IO)
✅ Room-based messaging (only participants see messages)
✅ Collaborative note-taking with CRUD operations
✅ Live participant list with status
✅ Study time tracking (auto-increments)
✅ Room codes for easy joining
✅ Max participant limits
✅ System messages (join/leave notifications)
✅ Auto-reconnection handling
✅ Connection status indicator
✅ MongoDB persistence for rooms, messages, notes
✅ User authentication required
✅ Clean UI with tabs (Chat/Notes)

## Next Steps (Optional Enhancements)

- Add typing indicators
- File sharing in chat
- Note categories/tags
- Room analytics (total study hours, message counts)
- Private messages between participants
- Screen sharing
- Voice chat integration
- Study session scheduling
- Pomodoro timer integration
- Room themes/customization
