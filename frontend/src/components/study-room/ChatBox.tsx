import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Paperclip, X, FileText, Image as ImageIcon, Download, Sparkles } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { Message } from '@/types/study-room';
import { API_BASE_URL } from '@/lib/api';

interface ChatBoxProps {
  messages: Message[];
  roomId: string;
  userId: string;
  username: string;
}

const ChatBox: React.FC<ChatBoxProps> = ({ messages, roomId, userId, username }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showAiHint, setShowAiHint] = useState(false);
  const { socket, isConnected } = useSocket();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Check if message contains @ai to show hint
  useEffect(() => {
    setShowAiHint(newMessage.includes('@ai'));
  }, [newMessage]);

  // Format message content with markdown-style bold
  const formatMessage = (content: string) => {
    const parts: (string | JSX.Element)[] = [];
    const boldRegex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    while ((match = boldRegex.exec(content)) !== null) {
      // Add text before the bold part
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      // Add bold text
      parts.push(<strong key={`bold-${keyIndex++}`}>{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [content];
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    // Construct upload URL correctly
    const baseUrl = API_BASE_URL.endsWith('/api') 
      ? API_BASE_URL.slice(0, -4) 
      : API_BASE_URL.replace(/\/api$/, '');
    
    const response = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'File upload failed');
    }

    const data = await response.json();
    return data.file;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) {
      console.warn('⚠️ Cannot send empty message');
      return;
    }
    
    if (!socket) {
      console.error('❌ Socket not connected');
      return;
    }
    
    if (!socket.connected) {
      console.error('❌ Socket is disconnected');
      return;
    }

    setIsSending(true);
    setUploading(true);

    try {
      let fileData = null;
      
      if (selectedFile) {
        fileData = await uploadFile(selectedFile);
        console.log('📎 File uploaded:', fileData);
      }

      const messageContent = newMessage.trim() || (selectedFile ? selectedFile.name : '');

      console.log('📤 Sending message:', { roomId, userId, username, content: messageContent, fileData });
      
      socket.emit('sendMessage', {
        roomId,
        userId,
        username,
        content: messageContent,
        fileData
      });

      setNewMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
      setUploading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderFilePreview = (msg: Message) => {
    if (msg.type !== 'file' || !msg.fileUrl) return null;

    const isImage = msg.fileType?.startsWith('image/');
    const baseUrl = API_BASE_URL.endsWith('/api') 
      ? API_BASE_URL.slice(0, -4) 
      : API_BASE_URL.replace(/\/api$/, '');
    const fileUrl = `${baseUrl}${msg.fileUrl}`;

    return (
      <div className="mt-2">
        {isImage ? (
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            <img 
              src={fileUrl} 
              alt={msg.fileName || 'Attachment'} 
              className="max-w-full h-auto rounded max-h-48 object-cover cursor-pointer hover:opacity-90"
            />
          </a>
        ) : (
          <a 
            href={fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2 bg-white/10 rounded hover:bg-white/20 transition"
          >
            <FileText className="w-4 h-4" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{msg.fileName}</p>
              <p className="text-xs opacity-70">{(msg.fileSize! / 1024).toFixed(1)} KB</p>
            </div>
            <Download className="w-4 h-4" />
          </a>
        )}
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-lg">Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea className="flex-1 px-4 min-h-0" style={{ height: 'calc(100vh - 300px)' }}>
          <div className="space-y-3 py-4">
            {messages.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}
            {messages.map((msg, index) => (
              <div
                key={msg._id || `msg-${index}`}
                className={`flex ${msg.userId === userId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 ${
                    msg.type === 'system'
                      ? 'bg-gray-100 text-gray-600 text-sm italic'
                      : msg.userId === userId
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {msg.type !== 'system' && msg.userId !== userId && (
                    <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                      {msg.username}
                      {msg.userId === 'ai-bot' && (
                        <Sparkles className="w-3 h-3 text-yellow-500" />
                      )}
                    </p>
                  )}
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {formatMessage(msg.content)}
                  </div>
                  {renderFilePreview(msg)}
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="p-4 border-t flex-shrink-0">
          {!isConnected && (
            <div className="mb-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded">
              ⚠️ Disconnected - Reconnecting...
            </div>
          )}
          {showAiHint && (
            <div className="mb-2 text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>AI Assistant will respond to your message with @ai</span>
            </div>
          )}
          {selectedFile && (
            <div className="mb-2 flex items-center gap-2 text-sm bg-blue-50 px-3 py-2 rounded">
              <Paperclip className="w-4 h-4" />
              <span className="flex-1 truncate">{selectedFile.name}</span>
              <button onClick={handleRemoveFile} className="text-gray-500 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={!isConnected || isSending || uploading}
              title="Attach file"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "Type a message... (use @ai to ask AI)" : "Connecting..."}
              className="flex-1"
              disabled={!isConnected || isSending || uploading}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={(!newMessage.trim() && !selectedFile) || !isConnected || isSending || uploading}
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatBox;
