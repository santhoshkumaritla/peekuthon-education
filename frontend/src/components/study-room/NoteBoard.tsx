import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { Note } from '@/types/study-room';

interface NoteBoardProps {
  notes: Note[];
  roomId: string;
  userId: string;
  username: string;
  onNoteAdded: (content: string) => Promise<void>;
  onNoteUpdated: (noteId: string, content: string) => Promise<void>;
  onNoteDeleted: (noteId: string) => Promise<void>;
}

const NoteBoard: React.FC<NoteBoardProps> = ({
  notes,
  userId,
  username,
  onNoteAdded,
  onNoteUpdated,
  onNoteDeleted
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;

    try {
      await onNoteAdded(newNoteContent.trim());
      setNewNoteContent('');
      setIsAdding(false);
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim()) return;

    try {
      await onNoteUpdated(noteId, editContent.trim());
      setEditingNoteId(null);
      setEditContent('');
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await onNoteDeleted(noteId);
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const startEditing = (note: Note) => {
    setEditingNoteId(note._id);
    setEditContent(note.content);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditContent('');
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Shared Notes</CardTitle>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Note
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-4">
        <ScrollArea className="h-full">
          <div className="space-y-3">
            {isAdding && (
              <Card className="border-2 border-primary">
                <CardContent className="p-3 space-y-2">
                  <Textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Write your note..."
                    className="min-h-[100px]"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleAddNote} size="sm" disabled={!newNoteContent.trim()}>
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      onClick={() => {
                        setIsAdding(false);
                        setNewNoteContent('');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {notes.map((note) => (
              <Card key={note._id}>
                <CardContent className="p-3">
                  {editingNoteId === note._id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[100px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleUpdateNote(note._id)}
                          size="sm"
                          disabled={!editContent.trim()}
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button onClick={cancelEditing} variant="outline" size="sm">
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold">{note.username}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(note.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {note.createdBy === userId && (
                          <div className="flex gap-1">
                            <Button
                              onClick={() => startEditing(note)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleDeleteNote(note._id)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}

            {notes.length === 0 && !isAdding && (
              <div className="text-center py-8 text-gray-500">
                <p>No notes yet. Be the first to add one!</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NoteBoard;
