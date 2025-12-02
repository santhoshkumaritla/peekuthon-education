import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Room, CreateRoomData, JoinRoomData } from '@/types/study-room';
import { getRooms, createRoom, joinRoom, deleteRoom } from '@/lib/study-room-api';
import { getCurrentUserId } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus, LogIn, Loader2, Clock, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const StudyRoomsList: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomMax, setNewRoomMax] = useState('10');
  const [joinCode, setJoinCode] = useState('');

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
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await getRooms();
      if (response.success && response.data) {
        setRooms(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      toast({
        title: 'Error',
        description: 'Failed to load study rooms',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || !userId) return;

    const maxParticipants = parseInt(newRoomMax) || 10;
    if (maxParticipants < 2 || maxParticipants > 50) {
      toast({
        title: 'Invalid Max Participants',
        description: 'Max participants must be between 2 and 50',
        variant: 'destructive'
      });
      return;
    }

    try {
      setCreating(true);
      const roomData: CreateRoomData = {
        name: newRoomName.trim(),
        createdBy: userId,
        maxParticipants
      };

      const response = await createRoom(roomData);
      if (response.success && response.data) {
        toast({
          title: 'Room Created',
          description: `Room "${response.data.name}" created successfully!`
        });
        navigate(`/study-room/${response.data._id}`);
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to create room',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to create room:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while creating the room',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    try {
      const response = await deleteRoom(roomId);
      if (response.success) {
        toast({
          title: 'Room Deleted',
          description: `"${roomName}" has been deleted successfully`
        });
        fetchRooms(); // Refresh the list
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to delete room',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to delete room:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while deleting the room',
        variant: 'destructive'
      });
    }
  };

  const handleJoinRoom = async (roomId?: string, code?: string) => {
    if (!userId) return;

    const roomCode = code || joinCode.trim();
    if (!roomCode && !roomId) {
      toast({
        title: 'Room Code Required',
        description: 'Please enter a room code',
        variant: 'destructive'
      });
      return;
    }

    try {
      setJoining(true);
      const joinData: JoinRoomData = {
        userId,
        username
      };

      if (roomCode) {
        joinData.code = roomCode;
      } else if (roomId) {
        joinData.roomId = roomId;
      }

      const response = await joinRoom(joinData);
      if (response.success && response.data) {
        toast({
          title: 'Joined Room',
          description: `You joined "${response.data.name}"`
        });
        navigate(`/study-room/${response.data._id}`);
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to join room',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to join room:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while joining the room',
        variant: 'destructive'
      });
    } finally {
      setJoining(false);
      setJoinCode('');
    }
  };

  const activeRooms = rooms.filter((r) => r.isActive);

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Study Rooms</h1>
        <p className="text-gray-600">
          Join or create a study room to collaborate with others in real-time
        </p>
      </div>

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse">Browse Rooms</TabsTrigger>
          <TabsTrigger value="create">Create Room</TabsTrigger>
          <TabsTrigger value="join">Join by Code</TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : activeRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeRooms.map((room) => (
                <Card key={room._id} className="hover:shadow-lg transition">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {room.name}
                      <Badge variant={room.participants.length >= room.maxParticipants ? 'destructive' : 'default'}>
                        {room.participants.length}/{room.maxParticipants}
                      </Badge>
                    </CardTitle>
                    <CardDescription>Code: {room.code}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        {room.participants.length} participants
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        Created {new Date(room.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleJoinRoom(room._id)}
                          disabled={room.participants.length >= room.maxParticipants || joining}
                          className="flex-1"
                        >
                          {joining ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <LogIn className="w-4 h-4 mr-2" />
                          )}
                          Join Room
                        </Button>
                        {room.createdBy === userId && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Room?</AlertDialogTitle>
                                <AlertDialogDescription asChild>
                                  <div>
                                    Are you sure you want to delete &quot;{room.name}&quot;? This action cannot be undone and all messages and notes will be permanently deleted.
                                  </div>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteRoom(room._id, room.name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">No active rooms available. Create one to get started!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Study Room</CardTitle>
              <CardDescription>Set up a new room for collaborative studying</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomName">Room Name</Label>
                <Input
                  id="roomName"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g., Math Study Group"
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxParticipants">Max Participants</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={newRoomMax}
                  onChange={(e) => setNewRoomMax(e.target.value)}
                  min="2"
                  max="50"
                />
              </div>
              <Button
                onClick={handleCreateRoom}
                disabled={!newRoomName.trim() || creating}
                className="w-full"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Room
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="join">
          <Card>
            <CardHeader>
              <CardTitle>Join Room by Code</CardTitle>
              <CardDescription>Enter a room code to join an existing study room</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomCode">Room Code</Label>
                <Input
                  id="roomCode"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g., ABC123"
                  maxLength={6}
                />
              </div>
              <Button
                onClick={() => handleJoinRoom()}
                disabled={!joinCode.trim() || joining}
                className="w-full"
              >
                {joining ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4 mr-2" />
                )}
                Join Room
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudyRoomsList;
