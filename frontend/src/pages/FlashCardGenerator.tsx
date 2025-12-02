import { useState, useRef } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Upload,
  FileText,
  Image as ImageIcon,
  BookOpen,
  RotateCcw,
} from "lucide-react";
import { sendParentSms } from "@/lib/sms";
import { flashcardAPI, getCurrentUserId } from "@/lib/api";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_FLASHCARD_API_KEY || "";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

type Mode = "prompt" | "media";

interface FlashCard {
  id: string;
  front: string;
  back: string;
}

interface FlashCardData {
  topic: string;
  flashcards: FlashCard[];
  importantPoints: string[];
}

const FlashCardGenerator = () => {
  const [mode, setMode] = useState<Mode>("prompt");
  const [topic, setTopic] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FlashCardData | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleGenerate = async () => {
    if (mode === "prompt" && !topic.trim()) {
      setError("Please enter a topic.");
      return;
    }
    if (mode === "media" && !file) {
      setError("Please upload a PDF or image file.");
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);
    setOpenCardId(null);

    try {
      let prompt = "";
      let parts: any[] = [{ text: "" }];

      if (mode === "prompt") {
        prompt = `You are a flashcard generator. Create learning materials for the topic: "${topic.trim()}".

Return ONLY valid JSON in this exact structure:
{
  "topic": "string",
  "flashcards": [
    {
      "id": "fc1",
      "front": "Question or term (1-2 lines max)",
      "back": "Answer or definition (1-2 lines max)"
    }
  ],
  "importantPoints": [
    "Point 1 (formula or key concept)",
    "Point 2",
    ...
  ]
}

Rules:
- Generate exactly 10 flashcards covering the most important aspects of the topic.
- Each flashcard front should be a concise question or term (1-2 lines).
- Each flashcard back should be a clear, concise answer or definition (1-2 lines).
- Generate exactly 10 important points (formulas, key concepts, or critical information).
- Do not include any explanation outside the JSON.`;
        parts = [{ text: prompt }];
      } else {
        const base64 = await fileToBase64(file!);
        const base64Data = base64.split(",")[1];
        let mimeType = file!.type;
        if (!mimeType || mimeType === "application/octet-stream") {
          if (file!.name.toLowerCase().endsWith(".pdf")) {
            mimeType = "application/pdf";
          } else if (file!.name.match(/\.(jpg|jpeg)$/i)) {
            mimeType = "image/jpeg";
          } else if (file!.name.match(/\.png$/i)) {
            mimeType = "image/png";
          }
        }

        prompt = `You are a flashcard generator. Analyze the provided ${file!.type.includes("pdf") ? "PDF document" : "image"} and create learning materials based on its content.

Return ONLY valid JSON in this exact structure:
{
  "topic": "string (extracted from the content)",
  "flashcards": [
    {
      "id": "fc1",
      "front": "Question or term (1-2 lines max)",
      "back": "Answer or definition (1-2 lines max)"
    }
  ],
  "importantPoints": [
    "Point 1 (formula or key concept)",
    "Point 2",
    ...
  ]
}

Rules:
- Generate exactly 10 flashcards covering the most important aspects from the content.
- Each flashcard front should be a concise question or term (1-2 lines).
- Each flashcard back should be a clear, concise answer or definition (1-2 lines).
- Generate exactly 10 important points (formulas, key concepts, or critical information from the content).
- Do not include any explanation outside the JSON.`;

        parts = [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
        ];
      }

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
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to generate flashcards");
      }

      const responseData = await response.json();
      const textResponse =
        responseData.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text || "")
          .join("\n")
          .trim() ?? "";

      if (!textResponse) {
        throw new Error("Model returned an empty response");
      }

      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not parse flashcards from model response");
      }

      const parsed: FlashCardData = JSON.parse(jsonMatch[0]);
      if (!parsed.flashcards || parsed.flashcards.length === 0) {
        throw new Error("No flashcards were generated");
      }
      if (!parsed.importantPoints || parsed.importantPoints.length === 0) {
        throw new Error("No important points were generated");
      }

      const resultData = {
        topic: parsed.topic || (mode === "prompt" ? topic.trim() : "Content-based"),
        flashcards: parsed.flashcards.slice(0, 10),
        importantPoints: parsed.importantPoints.slice(0, 10),
      };

      setData(resultData);
      
      // Save flashcards to MongoDB
      try {
        const userId = getCurrentUserId();
        if (userId) {
          await flashcardAPI.create({
            userId,
            topic: resultData.topic,
            flashcards: resultData.flashcards,
            importantPoints: resultData.importantPoints
          });
          console.log('Flashcards saved to database');
        }
      } catch (dbError) {
        console.error('Failed to save flashcards to database:', dbError);
      }
      
      await sendParentSms(`Your child generated a flash cards on ${resultData.topic} topic`);
    } catch (err: any) {
      console.error("Failed to generate flashcards:", err);
      setError(err.message || "Failed to generate flashcards. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (cardId: string) => {
    if (openCardId === cardId) {
      setOpenCardId(null);
    } else {
      setOpenCardId(cardId);
    }
  };

  const handleReset = () => {
    setData(null);
    setOpenCardId(null);
    setTopic("");
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-full bg-primary/10 text-primary">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Flash Card Generator</h1>
          <p className="text-sm text-muted-foreground">
            Create interactive flashcards from a topic or uploaded content.
          </p>
        </div>
      </div>

      {!data ? (
        <Card>
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>
              Choose how you want to create flashcards, then click Generate.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant={mode === "prompt" ? "default" : "outline"}
                onClick={() => setMode("prompt")}
              >
                Prompt mode
              </Button>
              <Button
                type="button"
                variant={mode === "media" ? "default" : "outline"}
                onClick={() => setMode("media")}
              >
                Media mode
              </Button>
              <Badge variant="outline" className="ml-auto">
                Mode: {mode === "prompt" ? "Prompt" : "Media"}
              </Badge>
            </div>

            {mode === "prompt" ? (
              <div className="space-y-2">
                <Label htmlFor="topic">Topic or concept</Label>
                <Input
                  id="topic"
                  placeholder='e.g. "Photosynthesis" or "Quadratic Equations"'
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loading) {
                      handleGenerate();
                    }
                  }}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <Label>Upload PDF or image</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFile(f);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {file ? "Change file" : "Choose file"}
                </Button>
                {file && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {file.type.includes("pdf") ? (
                      <FileText className="w-4 h-4" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                    <span className="truncate max-w-xs">{file.name}</span>
                    <span className="text-xs opacity-70">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive border border-destructive/40 bg-destructive/10 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex justify-end">
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating flashcards…
                  </>
                ) : (
                  "Generate flashcards"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{data.topic}</CardTitle>
                <CardDescription>
                  {data.flashcards.length} flashcards ready to study
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                New set
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {data.flashcards.map((card, idx) => {
                  const isOpen = openCardId === card.id;
                  return (
                    <div
                      key={card.id}
                      className="relative h-48 cursor-pointer"
                      style={{ perspective: "1000px" }}
                      onClick={() => handleCardClick(card.id)}
                    >
                      <div
                        className="absolute inset-0 transition-transform duration-500"
                        style={{
                          transformStyle: "preserve-3d",
                          transform: isOpen ? "rotateY(180deg)" : "rotateY(0deg)",
                        }}
                      >
                        <div
                          className="absolute inset-0 rounded-lg border-2 border-border bg-card shadow-md flex items-center justify-center p-4 text-center"
                          style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                          }}
                        >
                          <div className="w-full">
                            <Badge variant="outline" className="mb-2">
                              Card {idx + 1}
                            </Badge>
                            <p className="text-sm font-medium">{card.front}</p>
                          </div>
                        </div>
                        <div
                          className="absolute inset-0 rounded-lg border-2 border-primary bg-primary/5 shadow-md flex items-center justify-center p-4 text-center"
                          style={{
                            backfaceVisibility: "hidden",
                            WebkitBackfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                          }}
                        >
                          <div className="w-full">
                            <Badge variant="default" className="mb-2">
                              Answer
                            </Badge>
                            <p className="text-sm">{card.back}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Important Points</CardTitle>
              <CardDescription>
                Key formulas, concepts, and critical information to remember.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.importantPoints.map((point, idx) => (
                  <div
                    key={idx}
                    className="flex gap-3 p-3 rounded-lg border bg-muted/50"
                  >
                    <Badge variant="secondary" className="shrink-0 h-fit">
                      {idx + 1}
                    </Badge>
                    <p className="text-sm flex-1">{point}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default FlashCardGenerator;

