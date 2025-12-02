export interface Room {
  _id: string;
  name: string;
  code: string;
  description?: string;
  createdBy: string;
  participants: Participant[];
  maxParticipants: number;
  isActive: boolean;
  notes: Note[];
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  userId: string;
  username: string;
  joinedAt: string;
  studyTime: number; // in minutes
  isActive: boolean;
}

export interface Message {
  _id: string;
  roomId: string;
  userId: string;
  username: string;
  content: string;
  timestamp: string;
  type?: 'text' | 'system' | 'file';
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

export interface Note {
  _id: string;
  content: string;
  createdBy: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomData {
  name: string;
  createdBy: string;
  description?: string;
  maxParticipants?: number;
}

export interface JoinRoomData {
  userId: string;
  username: string;
  code?: string;
  roomId?: string;
}
