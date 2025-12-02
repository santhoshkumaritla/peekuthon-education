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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { Loader2, Upload, FileText, Image as ImageIcon, ListChecks } from "lucide-react";
import { sendParentSms } from "@/lib/sms";
import { quizAPI, getCurrentUserId } from "@/lib/api";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_QUIZ_API_KEY || "";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

type Mode = "prompt" | "media";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface ParsedQuiz {
  topic: string;
  questions: QuizQuestion[];
}

const parseQuizJson = (text: string): ParsedQuiz => {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not find quiz JSON in model response.");
  }
  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    throw new Error("Quiz JSON did not contain any questions.");
  }
  const questions: QuizQuestion[] = parsed.questions.slice(0, 10).map((q: any, idx: number) => ({
    id: q.id?.toString() ?? `q-${idx + 1}`,
    question: q.question ?? "",
    options: Array.isArray(q.options) ? q.options : [],
    correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
    explanation: q.explanation ?? "",
  }));
  return {
    topic: parsed.topic ?? "Quiz",
    questions,
  };
};

const QuizGenerator = () => {
  const [mode, setMode] = useState<Mode>("prompt");
  const [topic, setTopic] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [topicTitle, setTopicTitle] = useState<string>("Quiz");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [submitted, setSubmitted] = useState(false);
  const [quizId, setQuizId] = useState<string | null>(null);

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [confirmingSubmit, setConfirmingSubmit] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentQuestion = quiz ? quiz[currentIndex] : null;

  const fileToBase64 = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(f);
    });

  const buildPrompt = async (): Promise<any> => {
    if (mode === "prompt") {
      const trimmed = topic.trim();
      if (!trimmed) {
        throw new Error("Please enter a concept or topic first.");
      }
      return {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are a quiz generator for the concept "${trimmed}".
Create exactly 10 multiple-choice questions (MCQs) that progressively move from basic to advanced.
Return ONLY valid JSON with this shape:
{
  "topic": string,
  "questions": [
    {
      "id": string,
      "question": string,
      "options": string[4],
      "correctIndex": number,
      "explanation": string
    }
  ]
}
Rules:
- "options" must always have exactly 4 distinct choices.
- "correctIndex" is the index (0-3) of the correct option.
- "explanation" clearly explains WHY the correct option is right and others are not.
- Do not include any text before or after the JSON block.`,
              },
            ],
          },
        ],
      };
    }

    if (!file) {
      throw new Error("Please attach a PDF or image before generating the quiz.");
    }

    const base64 = await fileToBase64(file);
    const base64Data = base64.split(",")[1];
    const lower = file.name.toLowerCase();
    let mimeType = file.type || "application/octet-stream";
    if (mimeType === "application/octet-stream") {
      if (lower.endsWith(".pdf")) mimeType = "application/pdf";
      else if (lower.match(/\.(jpg|jpeg)$/)) mimeType = "image/jpeg";
      else if (lower.endsWith(".png")) mimeType = "image/png";
    }

    return {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a quiz generator. Analyze the attached material and infer the main concept(s).
Create exactly 10 multiple-choice questions (MCQs) that test understanding of those concepts.
Return ONLY valid JSON with this shape:
{
  "topic": string,
  "questions": [
    {
      "id": string,
      "question": string,
      "options": string[4],
      "correctIndex": number,
      "explanation": string
    }
  ]
}
Rules:
- "options" must always have exactly 4 distinct choices.
- "correctIndex" is the index (0-3) of the correct option.
- "explanation" clearly explains WHY the correct option is right and others are not.
- Do not include any text before or after the JSON block.`,
            },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
    };
  };

  const handleGenerate = async () => {
    setError(null);
    setQuiz(null);
    setAnswers({});
    setCurrentIndex(0);
    setSubmitted(false);
    setQuizId(null);
    setTopicTitle("Quiz");
    setSummaryOpen(false);
    setConfirmingSubmit(false);

    try {
      const body = await buildPrompt();
      setLoading(true);

      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data = await response.json();
      const text =
        data.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text || "")
          .join("\n")
          .trim() ?? "";

      if (!text) {
        throw new Error("Model returned an empty response.");
      }

      const parsed = parseQuizJson(text);
      if (!parsed.questions.length) {
        throw new Error("No questions were generated.");
      }

      const initialAnswers: Record<string, number | null> = {};
      parsed.questions.forEach((q) => {
        initialAnswers[q.id] = null;
      });

      setQuiz(parsed.questions);
      setTopicTitle(parsed.topic || "Quiz");
      setAnswers(initialAnswers);
      setCurrentIndex(0);
      
      // Save quiz to MongoDB
      try {
        const userId = getCurrentUserId();
        if (userId) {
          const response = await quizAPI.create({
            userId,
            topic: parsed.topic || "Quiz",
            questions: parsed.questions,
            totalQuestions: parsed.questions.length,
            score: 0
          });
          if (response.data?._id) {
            setQuizId(response.data._id);
          }
          console.log('Quiz saved to database');
        }
      } catch (dbError) {
        console.error('Failed to save quiz to database:', dbError);
      }
    } catch (err: any) {
      console.error("Quiz generation failed:", err);
      setError(err.message || "Failed to generate quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const gotoNext = () => {
    if (!quiz) return;
    setCurrentIndex((idx) => Math.min(idx + 1, quiz.length - 1));
  };

  const gotoPrevious = () => {
    if (!quiz) return;
    setCurrentIndex((idx) => Math.max(idx - 1, 0));
  };

  const handleSkip = () => {
    gotoNext();
  };

  const attemptedCount = quiz
    ? quiz.filter((q) => answers[q.id] !== null && answers[q.id] !== undefined).length
    : 0;
  const totalQuestions = quiz?.length ?? 0;
  const notAttemptedCount = totalQuestions - attemptedCount;
  const correctCount =
    submitted && quiz
      ? quiz.filter((q) => answers[q.id] === q.correctIndex).length
      : 0;

  const handleOpenSubmit = () => {
    if (!quiz) return;
    setSummaryOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!quiz) return;
    const total = quiz.length;
    const score = quiz.filter((q) => answers[q.id] === q.correctIndex).length;
    const quizTopic = topicTitle || topic.trim() || "a topic";

    // Update quiz score in database
    if (quizId) {
      try {
        await quizAPI.updateScore(quizId, score);
        console.log('Quiz score updated in database');
      } catch (dbError) {
        console.error('Failed to update quiz score:', dbError);
      }
    }

    await sendParentSms(
      `Your child taken a quiz on ${quizTopic} topic and this is the score ${score}/${total}`
    );

    setSubmitted(true);
    setSummaryOpen(false);
    setConfirmingSubmit(true);
    setTimeout(() => setConfirmingSubmit(false), 300);
  };

  const modeLabel = mode === "prompt" ? "Prompt" : "Media";

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-full bg-primary/10 text-primary">
          <ListChecks className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Quiz Generator</h1>
          <p className="text-sm text-muted-foreground">
            Generate a 10-question quiz from a concept or directly from PDF/image content.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Input</CardTitle>
          <CardDescription>
            Choose how you want to create the quiz, then click Generate quiz.
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
              Mode: {modeLabel}
            </Badge>
          </div>

          {mode === "prompt" ? (
            <div className="space-y-2">
              <Label htmlFor="topic">Concept or topic</Label>
              <Input
                id="topic"
                placeholder='e.g. "Introduction to circles" or "Photosynthesis"'
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={loading}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <Label>Attach PDF or image</Label>
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
                  Generating quiz…
                </>
              ) : (
                "Generate quiz"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {quiz && (
        <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
          <Card className={cn(submitted && "border-primary/60")}>
            <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>{topicTitle || "Quiz"}</CardTitle>
                <CardDescription>
                  Question {currentIndex + 1} of {totalQuestions}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{attemptedCount} attempted</Badge>
                <Badge variant="outline">{notAttemptedCount} not attempted</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentQuestion && (
                <>
                  <div className="space-y-2">
                    <p className="font-medium text-base md:text-lg">
                      {currentQuestion.question}
                    </p>
                    <div className="space-y-2">
                      {currentQuestion.options.map((opt, idx) => {
                        const selected = answers[currentQuestion.id] === idx;
                        const isCorrect = currentQuestion.correctIndex === idx;
                        const isUserChoice = selected;

                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={submitted}
                            onClick={() => handleAnswerSelect(currentQuestion.id, idx)}
                            className={cn(
                              "w-full text-left rounded-md border-2 px-3 py-2 text-sm transition-colors",
                              !submitted &&
                                (selected
                                  ? "border-primary bg-primary/10"
                                  : "hover:bg-muted"),
                              submitted &&
                                (isCorrect
                                  ? "border-emerald-500 bg-emerald-500/10"
                                  : isUserChoice
                                    ? "border-destructive bg-destructive/10"
                                    : "border-muted bg-background"),
                              submitted && "cursor-not-allowed opacity-60"
                            )}
                          >
                            <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-between items-center pt-2 border-t">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={gotoPrevious}
                        disabled={currentIndex === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={gotoNext}
                        disabled={currentIndex === totalQuestions - 1}
                      >
                        Next
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleSkip}
                        disabled={currentIndex === totalQuestions - 1}
                      >
                        Skip
                      </Button>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleOpenSubmit}
                      disabled={submitted}
                    >
                      Submit quiz
                    </Button>
                  </div>

                  {submitted && currentQuestion && (
                    <div className="mt-4 rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-sm">
                      <p className="font-medium mb-1">Explanation</p>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
              <CardDescription>Quick view of your answers so far.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-5 gap-2">
                {quiz.map((q, idx) => {
                  const answered = answers[q.id] !== null && answers[q.id] !== undefined;
                  const correct = submitted && answers[q.id] === q.correctIndex;
                  const wrong = submitted && answered && answers[q.id] !== q.correctIndex;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={cn(
                        "h-9 rounded-md text-xs flex items-center justify-center border-2",
                        idx === currentIndex
                          ? "border-primary bg-primary/10"
                          : "border-muted bg-background",
                        answered && !submitted && "border-blue-400 bg-blue-500/10",
                        correct && "border-emerald-500 bg-emerald-500/10",
                        wrong && "border-destructive bg-destructive/10"
                      )}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div className="space-y-1 text-sm">
                  <p>
                    Score:{" "}
                    <span className="font-semibold">
                      {correctCount}/{totalQuestions}
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    Attempted: {attemptedCount}, Not attempted: {notAttemptedCount}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit quiz?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1">
                <p>You have attempted {attemptedCount} out of {totalQuestions} questions.</p>
                <p>{notAttemptedCount} question(s) are not attempted.</p>
                <p className="mt-2">
                  After submitting, you&apos;ll see your score and explanations for each question.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review again</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit}>Confirm submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {confirmingSubmit && (
        <div className="fixed inset-x-0 bottom-4 flex justify-center pointer-events-none">
          <div className="pointer-events-auto rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs shadow-md flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Calculating your score…
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizGenerator;


