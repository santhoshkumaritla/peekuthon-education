import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, Mic, MicOff, Loader2, Bot, User, Volume2 } from "lucide-react";
import { chatAPI, getCurrentUserId } from "@/lib/api";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_QUESTIONBOT_API_KEY || "";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  attachments?: File[];
}

const QuestionBot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm Question Bot. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) {
      console.log("No files selected");
      return;
    }
    
    console.log("Files selected:", files.map(f => ({ name: f.name, type: f.type, size: f.size })));
    
    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isPDF = file.type === "application/pdf" || 
                    file.name.toLowerCase().endsWith(".pdf") ||
                    file.type === "application/x-pdf" ||
                    (file.type === "application/octet-stream" && file.name.toLowerCase().endsWith(".pdf"));
      
      const isValid = isImage || isPDF;
      console.log(`File ${file.name}: type=${file.type}, isImage=${isImage}, isPDF=${isPDF}, isValid=${isValid}`);
      
      return isValid;
    });
    
    if (validFiles.length === 0) {
      alert("Please select a valid image or PDF file.");
      console.error("No valid files found");
      return;
    }
    
    if (validFiles.length < files.length) {
      alert(`Added ${validFiles.length} file(s). ${files.length - validFiles.length} file(s) were skipped.`);
    }
    
    console.log("Adding valid files:", validFiles.map(f => f.name));
    setAttachments((prev) => {
      const updated = [...prev, ...validFiles];
      console.log("Total attachments now:", updated.length);
      return updated;
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    const currentAttachments = [...attachments];
    setAttachments([]);
    setLoading(true);
    window.speechSynthesis.cancel();
    setSpeakingMessageId(null);

    try {
      const parts: any[] = [];

      if (userMessage.content.trim()) {
        parts.push({ text: userMessage.content });
      } else if (currentAttachments.length > 0) {
        const hasPDF = currentAttachments.some(f => 
          f.type === "application/pdf" || 
          f.type === "application/x-pdf" ||
          f.name.toLowerCase().endsWith(".pdf")
        );
        if (hasPDF) {
          parts.push({ text: "Please analyze this PDF document and provide a summary or answer any questions about it." });
        } else {
          parts.push({ text: "Please analyze this image and describe what you see." });
        }
      }

      for (const file of currentAttachments) {
        try {
          const base64 = await fileToBase64(file);
          const base64Data = base64.split(",")[1];
          
          let mimeType = file.type;
          if (!mimeType || mimeType === "application/octet-stream") {
            if (file.name.toLowerCase().endsWith(".pdf")) {
              mimeType = "application/pdf";
            } else if (file.name.match(/\.(jpg|jpeg)$/i)) {
              mimeType = "image/jpeg";
            } else if (file.name.match(/\.png$/i)) {
              mimeType = "image/png";
            } else if (file.name.match(/\.gif$/i)) {
              mimeType = "image/gif";
            } else if (file.name.match(/\.webp$/i)) {
              mimeType = "image/webp";
            }
          }

          console.log(`Processing file: ${file.name}, MIME type: ${mimeType}`);

          parts.push({
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          });
        } catch (fileError) {
          console.error("Error processing file:", fileError);
        }
      }

      console.log("Sending request with parts:", parts.length);

      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: parts,
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          systemInstruction: {
            parts: [
              {
                text: "You are Question Bot, a helpful and friendly assistant. You can analyze images and PDF documents. When a user sends an image, describe what you see in detail. When a user sends a PDF, read and analyze its content. Be conversational and helpful in your responses.",
              },
            ],
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("API Response:", data);

      const candidate = data.candidates?.[0];
      const candidateParts = candidate?.content?.parts || [];
      const responseText = candidateParts
        .map((part: any) => part.text || part.executableCode?.code)
        .filter(Boolean)
        .join("\n")
        .trim();
      
      if (!responseText) {
        const blockReason = data.promptFeedback?.blockReason;
        const safetyReasons = candidate?.safetyRatings;
        console.error("No response text in API response:", { data, blockReason, safetyReasons });
        throw new Error(
          blockReason
            ? `The model blocked the response: ${blockReason}`
            : "No response text received from API"
        );
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Save chat to MongoDB
      try {
        const userId = getCurrentUserId();
        if (userId) {
          await chatAPI.saveMessages(userId, [...messages, userMessage, assistantMessage]);
          console.log('Chat saved to database');
        }
      } catch (dbError) {
        console.error('Failed to save chat to database:', dbError);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please make sure you're sending a valid image or PDF file and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const startRecording = async () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in your browser. Please type your message.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev + (prev ? " " : "") + transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "no-speech") {
        alert("No speech detected. Please try again.");
      } else {
        alert("Speech recognition error. Please try typing your message.");
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    try {
      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      alert("Could not start speech recognition. Please try typing your message.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !loading) {
      e.preventDefault();
      handleSend();
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatMessageText = (text: string): (string | JSX.Element)[] => {
    if (!text) return [""];
    
    const parts: (string | JSX.Element)[] = [];
    const regex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;
    let keyCounter = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        if (beforeText) {
          parts.push(beforeText);
        }
      }
      parts.push(
        <strong key={`bold-${keyCounter++}`} className="font-bold">
          {match[1]}
        </strong>
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      if (remainingText) {
        parts.push(remainingText);
      }
    }

    return parts.length > 0 ? parts : [text];
  };

  const speakMessage = (messageId: string, content: string) => {
    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = content.replace(/\*\*/g, "").replace(/\n/g, " ");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    setSpeakingMessageId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="border-b border-border bg-card p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Question Bot</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
              )}
              <Card
                className={`max-w-[80%] relative ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border"
                }`}
              >
                <CardContent className="p-4 pr-10">
                  <div className="whitespace-pre-wrap break-words">
                    {formatMessageText(message.content).map((part, idx) => 
                      typeof part === 'string' ? <span key={idx}>{part}</span> : part
                    )}
                  </div>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.attachments.map((file, idx) => (
                        <div
                          key={idx}
                          className="text-xs bg-background/50 p-2 rounded"
                        >
                          {file.type.startsWith("image/") ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="max-w-full h-auto rounded"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <Paperclip className="w-4 h-4" />
                              <span>{file.name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-6 w-6 ${
                        message.role === "user" 
                          ? "text-primary-foreground hover:bg-primary-foreground/20" 
                          : ""
                      }`}
                      onClick={() => speakMessage(message.id, message.content)}
                      title="Read aloud"
                    >
                      <Volume2
                        className={`w-3 h-3 ${
                          speakingMessageId === message.id
                            ? "text-primary animate-pulse"
                            : ""
                        }`}
                      />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              {message.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-secondary" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <Card className="bg-card border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Question Bot is thinking...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="border-t border-border bg-card p-2">
          <div className="max-w-4xl mx-auto flex flex-wrap gap-2">
            {attachments.map((file, index) => {
              const isPDF = file.type === "application/pdf" || 
                           file.type === "application/x-pdf" ||
                           file.name.toLowerCase().endsWith(".pdf");
              const isImage = file.type.startsWith("image/");
              
              return (
                <div
                  key={index}
                  className="relative inline-block p-2 bg-muted rounded-lg"
                >
                  {isImage ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                  ) : isPDF ? (
                    <div className="w-20 h-20 flex flex-col items-center justify-center bg-red-100 dark:bg-red-900/20 rounded border-2 border-red-300 dark:border-red-700">
                      <Paperclip className="w-8 h-8 text-red-600 dark:text-red-400" />
                      <span className="text-[8px] text-red-600 dark:text-red-400 font-bold mt-1">PDF</span>
                    </div>
                  ) : (
                    <div className="w-20 h-20 flex items-center justify-center bg-primary/10 rounded">
                      <Paperclip className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/90 transition-colors"
                    title="Remove attachment"
                  >
                    ×
                  </button>
                  <div className="text-xs mt-1 truncate w-20 text-center" title={file.name}>
                    {file.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground text-center mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="border-t border-border bg-card p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={loading}
                className="pr-20"
              />
              <div className="absolute right-2 bottom-2 flex gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${isRecording ? "text-destructive" : ""}`}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={loading}
                >
                  {isRecording ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button
              onClick={handleSend}
              disabled={loading || (!input.trim() && attachments.length === 0)}
              size="icon"
              className="h-10 w-10"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionBot;