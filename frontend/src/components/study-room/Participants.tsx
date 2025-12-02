import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Clock } from 'lucide-react';
import { Participant } from '@/types/study-room';

interface ParticipantsProps {
  participants: Participant[];
  currentUserId: string;
}

const Participants: React.FC<ParticipantsProps> = ({ participants, currentUserId }) => {
  const activeParticipants = participants.filter((p) => p.isActive);
  
  console.log('👥 Participants:', participants);
  console.log('👥 Active Participants:', activeParticipants);
  console.log('👤 Current User ID:', currentUserId);

  const formatStudyTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5" />
          Participants ({activeParticipants.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="space-y-2">
            {activeParticipants.map((participant) => (
              <div
                key={participant.userId}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm font-medium">
                      {participant.username}
                      {participant.userId === currentUserId && (
                        <span className="text-xs text-gray-500 ml-1">(You)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      Joined {new Date(participant.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatStudyTime(participant.studyTime)}
                </Badge>
              </div>
            ))}

            {activeParticipants.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No participants yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default Participants;
