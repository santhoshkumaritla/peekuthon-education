import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket, useSocketEvents } from '@/contexts/SocketContext';
import { Room, Message, Note, Participant } from '@/types/study-room';
import { getRoomData, sendMessage, addNote, updateNote, deleteNote, leaveRoom } from '@/lib/study-room-api';
import { getCurrentUserId } from '@/lib/api';
import RoomHeader from '@/components/study-room/RoomHeader';
import ChatBox from '@/components/study-room/ChatBox';
import NoteBoard from '@/components/study-room/NoteBoard';
import Participants from '@/components/study-room/Participants';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

const StudyRoom: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();

  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studyStartTime, setStudyStartTime] = useState<number>(Date.now());
  const hasJoinedRoom = useRef(false);

  const userId = getCurrentUserId();
  const getUserName = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.studentName || 'Anonymous';
      } catch (e) {
        return 'Anonymous';
      }
    }
    return 'Anonymous';
  };
  const username = getUserName();

  useEffect(() => {
    if (!roomId || !userId) {
      navigate('/study-rooms');
      return;
    }

    fetchRoomData();
  }, [roomId, userId]);

  // Reset hasJoinedRoom when connection status changes
  useEffect(() => {
    if (!isConnected) {
      hasJoinedRoom.current = false;
    }
  }, [isConnected]);

  useEffect(() => {
    if (!socket || !roomId || !userId || !isConnected) return;

    // Prevent multiple joins for the same connection
    if (hasJoinedRoom.current) return;

    // Get the current username at the time of joining
    const currentUsername = getUserName();
    
    console.log('🔌 Joining room:', { roomId, userId, username: currentUsername });
    
    // Join room on socket connection
    socket.emit('joinRoom', { roomId, userId, username: currentUsername });
    hasJoinedRoom.current = true;

    return () => {
      // Leave room on unmount only
      console.log('🚪 Leaving room on unmount:', { roomId, userId });
      socket.emit('leaveRoom', { roomId, userId });
      hasJoinedRoom.current = false;
    };
  }, [socket, roomId, userId, isConnected]); // Added isConnected to ensure socket is ready

  // Track study time every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (socket && roomId && userId) {
        const studyTime = Math.floor((Date.now() - studyStartTime) / 60000);
        socket.emit('updateStudyTime', { roomId, userId, studyTime });
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [socket, roomId, userId, studyStartTime]);

  // Socket event listeners
  useSocketEvents({
    newMessage: (message: Message) => {
      console.log('📨 New message received:', message);
      setMessages((prev) => {
        const updated = [...prev, message];
        console.log('💬 Total messages now:', updated.length);
        return updated;
      });
    },
    userJoined: (data: { participant: Participant; systemMessage: Message }) => {
      console.log('👤 User joined:', data.participant);
      setParticipants((prev) => {
        const filtered = prev.filter((p) => p.userId !== data.participant.userId);
        const updated = [...filtered, data.participant];
        console.log('👥 Total participants now:', updated.length);
        return updated;
      });
      setMessages((prev) => [...prev, data.systemMessage]);
    },
    userLeft: (data: { userId: string; systemMessage: Message }) => {
      setParticipants((prev) => prev.filter((p) => p.userId !== data.userId));
      setMessages((prev) => [...prev, data.systemMessage]);
    },
    noteAdded: (note: Note) => {
      console.log('📝 Note added event:', note);
      setNotes((prev) => {
        const updated = [...prev, note];
        console.log('📋 Total notes now:', updated.length);
        return updated;
      });
    },
    noteUpdated: (updatedNote: Note) => {
      console.log('📝 Note updated event:', updatedNote);
      setNotes((prev) => prev.map((note) => (note._id === updatedNote._id ? updatedNote : note)));
    },
    noteDeleted: (noteId: string) => {
      console.log('🗑️ Note deleted event:', noteId);
      setNotes((prev) => prev.filter((note) => note._id !== noteId));
    },
    studyTimeUpdated: (data: { userId: string; studyTime: number }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.userId === data.userId ? { ...p, studyTime: data.studyTime } : p))
      );
    }
  });

  const fetchRoomData = async () => {
    try {
      setLoading(true);
      const response = await getRoomData(roomId!);
      
      console.log('📦 Room data response:', response);

      if (response.success && response.data) {
        console.log('🏠 Room:', response.data.room);
        console.log('💬 Messages:', response.data.messages);
        console.log('📝 Notes:', response.data.notes);
        console.log('👥 Participants from API:', response.data.participants);
        
        setRoom(response.data.room);
        setMessages(response.data.messages || []);
        setNotes(response.data.notes || []);
        setParticipants(response.data.participants || []);
        setStudyStartTime(Date.now());
      } else {
        setError(response.message || response.error || 'Failed to load room data');
      }
    } catch (err) {
      setError('An error occurred while loading the room');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!roomId || !userId) return;

    try {
      await leaveRoom(roomId);
      navigate('/study-rooms');
    } catch (error) {
      console.error('Failed to leave room:', error);
      navigate('/study-rooms');
    }
  };

  const handleNoteAdded = async (content: string) => {
    if (!roomId || !userId || !socket) {
      console.error('❌ Cannot add note - missing roomId, userId, or socket');
      return;
    }

    try {
      console.log('📝 Adding note:', content);
      const response = await addNote(roomId, content);
      if (response.success && response.data) {
        console.log('✅ Note added to DB, broadcasting:', response.data);
        socket.emit('addNote', { roomId, note: response.data });
      } else {
        console.error('❌ Failed to add note:', response);
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const handleNoteUpdated = async (noteId: string, content: string) => {
    if (!roomId || !socket) {
      console.error('❌ Cannot update note - missing roomId or socket');
      return;
    }

    try {
      console.log('📝 Updating note:', noteId, content);
      const response = await updateNote(roomId, noteId, content);
      if (response.success && response.data) {
        console.log('✅ Note updated in DB, broadcasting:', response.data);
        socket.emit('updateNote', { roomId, note: response.data });
      } else {
        console.error('❌ Failed to update note:', response);
      }
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleNoteDeleted = async (noteId: string) => {
    if (!roomId || !socket) {
      console.error('❌ Cannot delete note - missing roomId or socket');
      return;
    }

    try {
      console.log('🗑️ Deleting note:', noteId);
      await deleteNote(roomId, noteId);
      console.log('✅ Note deleted from DB, broadcasting');
      socket.emit('deleteNote', { roomId, noteId });
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{error || 'Room not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <RoomHeader
        roomName={room.name}
        roomCode={room.code}
        isConnected={isConnected}
        onLeaveRoom={handleLeaveRoom}
      />

      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden min-h-0">
        <div className="col-span-9 flex flex-col min-h-0">
          <Tabs defaultValue="chat" className="h-full flex flex-col min-h-0">
            <TabsList className="mb-2 flex-shrink-0">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="flex-1 mt-0 min-h-0">
              <ChatBox messages={messages} roomId={roomId!} userId={userId} username={username} />
            </TabsContent>
            <TabsContent value="notes" className="flex-1 mt-0 min-h-0">
              <NoteBoard
                notes={notes}
                roomId={roomId!}
                userId={userId}
                username={username}
                onNoteAdded={handleNoteAdded}
                onNoteUpdated={handleNoteUpdated}
                onNoteDeleted={handleNoteDeleted}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="col-span-3 min-h-0">
          <Participants participants={participants} currentUserId={userId} />
        </div>
      </div>
    </div>
  );
};

export default StudyRoom;
