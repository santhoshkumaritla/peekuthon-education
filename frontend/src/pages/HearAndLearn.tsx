import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2, Mic, MicOff, Send } from "lucide-react";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_HEAR_API_KEY || "";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
const MIC_IMAGE_URL =
  "https://icons.veryicon.com/png/o/hardware/common-desktop-mobile-icon-morandi/voice-assistant-2.png";

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

const HearAndLearn = () => {
  const [sessionActive, setSessionActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState<"idle" | "listening" | "responding" | "greeting">("idle");
  const [supportsSpeech, setSupportsSpeech] = useState(true);
  const [assistantReply, setAssistantReply] = useState("");
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [manualQuestion, setManualQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);

  const conversationRef = useRef<ConversationMessage[]>([]);
  const recognitionRef = useRef<any>(null);

  const updateConversation = useCallback((next: ConversationMessage[]) => {
    conversationRef.current = next;
    setConversation(next);
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1.05;
      setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const stopSession = useCallback(() => {
    setSessionActive(false);
    setStatus("idle");
    setListening(false);
    setIsRecording(false);
    setCurrentTranscript("");
    recognitionRef.current?.stop?.();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const deliverAssistantReply = useCallback(
    async (reply: string) => {
      setAssistantReply(reply);
      await speak(reply);
    },
    [speak]
  );

  const handleUserQuery = useCallback(
    async (rawText: string) => {
      const trimmed = rawText.trim();
      if (!trimmed) return;

      const updatedConversation: ConversationMessage[] = [
        ...conversationRef.current,
        { role: "user" as const, content: trimmed },
      ];
      updateConversation(updatedConversation);
      setStatus("responding");
      setError(null);
      setCurrentTranscript(""); // Clear transcript after sending

      try {
        const payload = {
          systemInstruction: {
            role: "system",
            parts: [
              {
                text: `You are "Hear & Learn", an intelligent educational voice assistant designed to help students with all their learning needs.

Your role:
- Answer questions across all subjects: math, science, history, literature, programming, languages, and more
- Explain concepts clearly and concisely in 2-3 sentences, unless more detail is requested
- Help with homework, assignments, and exam preparation
- Provide step-by-step solutions for problems when needed
- Offer study tips, learning strategies, and educational guidance
- Be encouraging, patient, and supportive in all interactions
- Adapt explanations to the student's level of understanding

Keep responses brief and voice-friendly. Use simple language. If a topic requires more explanation, break it into digestible parts.`,
              },
            ],
          },
          contents: updatedConversation.map((message) => ({
            role: message.role === "user" ? "user" : "model",
            parts: [{ text: message.content }],
          })),
          generationConfig: {
            temperature: 0.4,
            topP: 0.9,
            maxOutputTokens: 256,
          },
        };

        const response = await fetch(GEMINI_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error?.message || "Assistant failed to respond.");
        }

        const parts = data?.candidates?.[0]?.content?.parts;
        const replyText =
          Array.isArray(parts) && parts.length > 0
            ? parts.map((part: any) => part.text ?? "").join("\n").trim()
            : "";

        if (!replyText) {
          throw new Error("Assistant returned an empty response.");
        }

        const finalConversation: ConversationMessage[] = [
          ...updatedConversation,
          { role: "assistant" as const, content: replyText },
        ];
        updateConversation(finalConversation);
        await deliverAssistantReply(replyText);
      } catch (err: any) {
        console.error("Hear & Learn error:", err);
        setError(err.message ?? "Something went wrong. Please try again.");
      } finally {
        setStatus("idle");
      }
    },
    [deliverAssistantReply, updateConversation]
  );

  const toggleRecording = useCallback(() => {
    if (!supportsSpeech) return;
    
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isRecording) {
      // Stop recording and send transcript
      const transcriptToSend = currentTranscript.trim();
      setIsRecording(false);
      setListening(false);
      recognition.stop();
      
      // Send the transcript immediately
      if (transcriptToSend) {
        handleUserQuery(transcriptToSend);
      }
    } else {
      // Start recording
      setCurrentTranscript("");
      setIsRecording(true);
      try {
        recognition.start();
      } catch (err) {
        console.error("Failed to start recording:", err);
        setIsRecording(false);
      }
    }
  }, [isRecording, supportsSpeech, currentTranscript, handleUserQuery]);

  const startSession = useCallback(async () => {
    setSessionActive(true);
    setError(null);
    setAssistantReply("");
    setCurrentTranscript("");
    updateConversation([]);
    setStatus("greeting");

    const greeting = "Hi, I am your voice assistant. Click the microphone button below to start talking!";
    await speak(greeting);
    setStatus("idle");
  }, [speak, updateConversation]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupportsSpeech(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true; // Changed to true for continuous recording
    recognition.interimResults = true; // Changed to true to show interim results

    recognition.onstart = () => {
      setListening(true);
      setStatus("listening");
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let fullTranscript = "";
      
      // Build the complete transcript from all results
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;
      }
      
      // Set the complete transcript (don't accumulate)
      setCurrentTranscript(fullTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event);
      setListening(false);
      setIsRecording(false);
      if (sessionActive) {
        setStatus("idle");
      }
      setError("Microphone error. Please try again.");
    };

    recognition.onend = () => {
      setListening(false);
      
      if (sessionActive && status === "listening") {
        setStatus("idle");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [handleUserQuery, sessionActive]);

  useEffect(() => {
    startSession();

    return () => {
      recognitionRef.current?.stop?.();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [startSession]);

  // Remove auto-listening effect - manual control only
  // useEffect(() => {
  //   if (sessionActive && !listening && !isSpeaking && supportsSpeech) {
  //     const timeout = setTimeout(() => {
  //       tryStartListening(true);
  //     }, 300);
  //     return () => clearTimeout(timeout);
  //   }
  // }, [sessionActive, listening, isSpeaking, supportsSpeech, tryStartListening]);

  const statusMessage = useMemo(() => {
    if (!sessionActive) return "Session paused. Tap the mic to resume.";
    if (status === "greeting") return "Greeting you...";
    if (status === "responding") return "Explaining...";
    if (status === "listening") return "Listening to you...";
    return isSpeaking ? "Sharing response..." : "Ready to listen. Click mic below to speak.";
  }, [sessionActive, status, isSpeaking]);

  const handleMicPress = () => {
    if (!sessionActive) {
      startSession();
      return;
    }
    stopSession();
  };

  const handleManualSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (manualQuestion.trim()) {
      handleUserQuery(manualQuestion);
      setManualQuestion("");
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-4 py-10 text-center">
      <div className="absolute top-6 right-6 flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium">
        <span>{sessionActive ? "Session On" : "Session Off"}</span>
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            sessionActive ? "bg-green-500 animate-pulse" : "bg-muted-foreground"
          )}
        />
      </div>

      {supportsSpeech ? (
        <p className="absolute top-6 left-6 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Voice Mode
        </p>
      ) : (
        <Badge className="absolute top-6 left-6" variant="secondary">
          Voice unavailable · type below
        </Badge>
      )}

      {listening && sessionActive && (
        <div className="absolute bottom-6 left-6 flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary shadow-lg">
          <span className="text-lg">👂</span>
          <span>Listening...</span>
        </div>
      )}

      <div className="flex flex-col items-center gap-8">
        <div className="relative">
          {isSpeaking && (
            <>
              {[1, 2, 3].map((ring) => (
                <span
                  key={ring}
                  className="pointer-events-none absolute inset-0 rounded-full border-2 border-primary/40"
                  style={{
                    animation: "ping 1.6s linear infinite",
                    animationDelay: `${ring * 0.2}s`,
                  }}
                />
              ))}
            </>
          )}
          <button
            onClick={handleMicPress}
            className={cn(
              "relative flex h-48 w-48 items-center justify-center rounded-full border-4 border-primary/60 bg-background shadow-[0_0_60px_rgba(59,130,246,0.35)] transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary/40 active:scale-95",
              sessionActive ? "cursor-pointer" : "cursor-pointer opacity-90"
            )}
            aria-label={sessionActive ? "Stop session" : "Start session"}
          >
            <div className="absolute inset-4 rounded-full bg-muted/40 blur-2xl" />
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-white">
              <img
                src={MIC_IMAGE_URL}
                alt="Voice assistant microphone"
                className="h-28 w-28 object-contain"
              />
            </div>
            <div
              className={cn(
                "absolute bottom-4 right-4 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                sessionActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              <Mic className="h-3.5 w-3.5" />
              {sessionActive ? "On" : "Off"}
            </div>
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{statusMessage}</p>
          {error && (
            <p className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        {/* Display live transcript when recording */}
        {currentTranscript && isRecording && (
          <Card className="max-w-lg border-primary/20 bg-primary/5 p-4 text-left shadow-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">You're saying...</p>
            <p className="text-sm leading-relaxed text-foreground">{currentTranscript}</p>
          </Card>
        )}

        {/* Manual recording control button */}
        {sessionActive && supportsSpeech && (
          <Button
            onClick={toggleRecording}
            size="lg"
            variant={isRecording ? "destructive" : "default"}
            className="flex items-center gap-2 rounded-full shadow-lg"
            disabled={status === "responding" || isSpeaking}
          >
            {isRecording ? (
              <>
                <Send className="h-5 w-5" />
                Send & Stop
              </>
            ) : (
              <>
                <Mic className="h-5 w-5" />
                Click to Speak
              </>
            )}
          </Button>
        )}
      </div>

      {assistantReply && (
        <Card className="mt-10 max-w-lg border-primary/20 bg-primary/5 p-6 text-left shadow-xl">
          <p className="text-sm text-muted-foreground uppercase tracking-wide">Assistant</p>
          <p className="mt-2 text-lg leading-relaxed text-foreground">{assistantReply}</p>
        </Card>
      )}

      {!supportsSpeech && (
        <form
          onSubmit={handleManualSubmit}
          className="mt-10 flex w-full max-w-md flex-col gap-3 rounded-xl border border-dashed border-muted-foreground/30 p-4 text-left"
        >
          <label htmlFor="manual-question" className="text-sm font-medium text-muted-foreground">
            Type your question
          </label>
          <Input
            id="manual-question"
            value={manualQuestion}
            onChange={(event) => setManualQuestion(event.target.value)}
            placeholder="Ask me anything..."
          />
          <Button type="submit" className="w-full">
            {status === "responding" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Thinking...
              </>
            ) : (
              "Ask"
            )}
          </Button>
        </form>
      )}
    </div>
  );
};

export default HearAndLearn;

