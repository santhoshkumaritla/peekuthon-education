import { getCurrentUserId } from './api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Create a new study room
export const createRoom = async (data: { name: string; description?: string; maxParticipants?: number }): Promise<ApiResponse> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const response = await fetch(`${API_BASE_URL}/study-rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, createdBy: userId })
    });

    return await response.json();
  } catch (error) {
    console.error('Create room error:', error);
    return { success: false, error: 'Failed to create room' };
  }
};

// Get all active study rooms
export const getRooms = async (): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/study-rooms`);
    return await response.json();
  } catch (error) {
    console.error('Get rooms error:', error);
    return { success: false, error: 'Failed to fetch rooms' };
  }
};

// Get a specific room's data
export const getRoomData = async (roomId: string): Promise<ApiResponse> => {
  try {
    const userId = getCurrentUserId();
    const response = await fetch(`${API_BASE_URL}/study-rooms/${roomId}?userId=${userId}`);
    return await response.json();
  } catch (error) {
    console.error('Get room data error:', error);
    return { success: false, error: 'Failed to fetch room data' };
  }
};

// Join a study room by code
export const joinRoom = async (data: { username: string; code?: string; roomId?: string }): Promise<ApiResponse> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const response = await fetch(`${API_BASE_URL}/study-rooms/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, userId })
    });

    return await response.json();
  } catch (error) {
    console.error('Join room error:', error);
    return { success: false, error: 'Failed to join room' };
  }
};

// Leave a study room
export const leaveRoom = async (roomId: string): Promise<ApiResponse> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const response = await fetch(`${API_BASE_URL}/study-rooms/${roomId}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    return await response.json();
  } catch (error) {
    console.error('Leave room error:', error);
    return { success: false, error: 'Failed to leave room' };
  }
};

// Send a message
export const sendMessage = async (roomId: string, content: string): Promise<ApiResponse> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const response = await fetch(`${API_BASE_URL}/study-rooms/${roomId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, content })
    });

    return await response.json();
  } catch (error) {
    console.error('Send message error:', error);
    return { success: false, error: 'Failed to send message' };
  }
};

// Add a note
export const addNote = async (roomId: string, content: string): Promise<ApiResponse> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
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

    const response = await fetch(`${API_BASE_URL}/study-rooms/${roomId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, username, content })
    });

    return await response.json();
  } catch (error) {
    console.error('Add note error:', error);
    return { success: false, error: 'Failed to add note' };
  }
};

// Update a note
export const updateNote = async (roomId: string, noteId: string, content: string): Promise<ApiResponse> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const response = await fetch(`${API_BASE_URL}/study-rooms/${roomId}/notes/${noteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, content })
    });

    return await response.json();
  } catch (error) {
    console.error('Update note error:', error);
    return { success: false, error: 'Failed to update note' };
  }
};

// Delete a note
export const deleteNote = async (roomId: string, noteId: string): Promise<ApiResponse> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const response = await fetch(`${API_BASE_URL}/study-rooms/${roomId}/notes/${noteId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    return await response.json();
  } catch (error) {
    console.error('Delete note error:', error);
    return { success: false, error: 'Failed to delete note' };
  }
};

// Delete a room (only creator can delete)
export const deleteRoom = async (roomId: string): Promise<ApiResponse> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const response = await fetch(`${API_BASE_URL}/study-rooms/${roomId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    return await response.json();
  } catch (error) {
    console.error('Delete room error:', error);
    return { success: false, error: 'Failed to delete room' };
  }
};
