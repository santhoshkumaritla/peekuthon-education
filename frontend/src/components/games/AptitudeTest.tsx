import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Loader2, BookOpen } from "lucide-react";
import { sendParentSms } from "@/lib/sms";
import { getCurrentUserId } from "@/lib/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_GAMES_API_KEY || "";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const AptitudeTest = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [submitted, setSubmitted] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [confirmingSubmit, setConfirmingSubmit] = useState(false);

  useEffect(() => {
    generateQuestions();
  }, []);

  const generateQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const prompt = `You are an aptitude test generator. Create exactly 10 multiple-choice aptitude questions covering topics like:
- Logical reasoning
- Numerical ability
- Pattern recognition
- Problem solving
- Data interpretation

Return ONLY valid JSON with this shape:
{
  "questions": [
    {
      "id": "q1",
      "question": "string",
      "options": ["option1", "option2", "option3", "option4"],
      "correctIndex": 0,
      "explanation": "string"
    }
  ]
}
Rules:
- Each question must have exactly 4 options.
- correctIndex is 0-3.
- Include clear explanations.
- Do not include any text outside the JSON.`;

      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate questions");
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("\n").trim() ?? "";

      if (!text) throw new Error("Empty response");

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not parse JSON");

      const parsed = JSON.parse(jsonMatch[0]);
      const qs = (parsed.questions || []).slice(0, 10).map((q: any, idx: number) => ({
        id: q.id || `q${idx + 1}`,
        question: q.question || "",
        options: Array.isArray(q.options) ? q.options : [],
        correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
        explanation: q.explanation || "",
      }));

      if (qs.length === 0) throw new Error("No questions generated");

      setQuestions(qs);
      const initialAnswers: Record<string, number | null> = {};
      qs.forEach((q: Question) => {
        initialAnswers[q.id] = null;
      });
      setAnswers(initialAnswers);
    } catch (err: any) {
      setError(err.message || "Failed to generate questions");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, optionIndex: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const attemptedCount = questions.filter((q) => answers[q.id] !== null).length;
  const totalQuestions = questions.length;
  const notAttemptedCount = totalQuestions - attemptedCount;
  const correctCount = submitted
    ? questions.filter((q) => answers[q.id] === q.correctIndex).length
    : 0;

  const currentQuestion = questions[currentIndex];

  const handleOpenSubmit = () => {
    setSummaryOpen(true);
  };

  const handleConfirmSubmit = async () => {
    const total = questions.length;
    const score = questions.filter((q) => answers[q.id] === q.correctIndex).length;

    await sendParentSms(`Your child taken a aptitude test the score is ${score}/${total}`);

    // Save to MongoDB
    try {
      const userId = getCurrentUserId();
      if (userId) {
        await fetch(`${API_BASE_URL}/game-scores`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            gameType: 'aptitude-test',
            score,
            level: `${score}/${total}`
          })
        });
        console.log('Aptitude test score saved to database');
      }
    } catch (dbError) {
      console.error('Failed to save Aptitude score to database:', dbError);
    }

    setSubmitted(true);
    setSummaryOpen(false);
    setConfirmingSubmit(true);
    setTimeout(() => setConfirmingSubmit(false), 300);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Generating aptitude questions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={generateQuestions}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Aptitude Test
          </CardTitle>
        </CardHeader>
      </Card>

      {questions.length > 0 && (
        <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
          <Card className={cn(submitted && "border-primary/60")}>
            <CardHeader className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Aptitude Test</CardTitle>
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
                    <p className="font-medium text-base md:text-lg">{currentQuestion.question}</p>
                    <div className="space-y-2">
                      {currentQuestion.options.map((opt, idx) => {
                        const selected = answers[currentQuestion.id] === idx;
                        const isCorrect = currentQuestion.correctIndex === idx;
                        const isUserChoice = selected;

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleAnswerSelect(currentQuestion.id, idx)}
                            className={cn(
                              "w-full text-left rounded-md border-2 px-3 py-2 text-sm transition-colors",
                              !submitted &&
                                (selected ? "border-primary bg-primary/10" : "hover:bg-muted"),
                              submitted &&
                                (isCorrect
                                  ? "border-emerald-500 bg-emerald-500/10"
                                  : isUserChoice
                                    ? "border-destructive bg-destructive/10"
                                    : "border-muted bg-background")
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
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                        disabled={currentIndex === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1))}
                        disabled={currentIndex === totalQuestions - 1}
                      >
                        Next
                      </Button>
                    </div>
                    <Button size="sm" onClick={handleOpenSubmit} disabled={submitted}>
                      Submit Test
                    </Button>
                  </div>

                  {submitted && (
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
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const answered = answers[q.id] !== null;
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
                    Score: <span className="font-semibold">{correctCount}/{totalQuestions}</span>
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
            <AlertDialogTitle>Submit test?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-1">
              <p>You have attempted {attemptedCount} out of {totalQuestions} questions.</p>
              <p>{notAttemptedCount} question(s) are not attempted.</p>
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

export default AptitudeTest;

