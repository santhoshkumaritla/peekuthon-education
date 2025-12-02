import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface RoomHeaderProps {
  roomName: string;
  roomCode: string;
  isConnected: boolean;
  onLeaveRoom: () => void;
}

const RoomHeader: React.FC<RoomHeaderProps> = ({ roomName, roomCode, isConnected, onLeaveRoom }) => {
  const [copied, setCopied] = useState(false);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center justify-between p-4 border-b bg-white">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{roomName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500">Room Code:</span>
            <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">{roomCode}</code>
            <Button
              onClick={copyRoomCode}
              variant="ghost"
              size="sm"
              className="h-7 px-2"
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant={isConnected ? "default" : "destructive"} className="animate-pulse">
          <div className="w-2 h-2 rounded-full bg-white mr-2" />
          {isConnected ? 'Connected' : 'Disconnected'}
        </Badge>
        <Button onClick={onLeaveRoom} variant="destructive" size="sm">
          <LogOut className="w-4 h-4 mr-2" />
          Leave Room
        </Button>
      </div>
    </div>
  );
};

export default RoomHeader;
