import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { sendParentSms } from "@/lib/sms";
import { getCurrentUserId } from "@/lib/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface Mapping {
  key: string;
  value: string;
}

const IQ_RANGES = [
  { min: 130, label: "Very Superior / Genius", color: "text-purple-600" },
  { min: 120, label: "Superior", color: "text-blue-600" },
  { min: 110, label: "High Average", color: "text-green-600" },
  { min: 90, label: "Average", color: "text-yellow-600" },
  { min: 80, label: "Low Average", color: "text-orange-600" },
  { min: 70, label: "Borderline", color: "text-red-600" },
  { min: 0, label: "Extremely Low", color: "text-red-800" },
];

const generateMapping = (): Mapping[] => {
  const keys = Array.from({ length: 9 }, (_, i) => String.fromCharCode(65 + i));
  const values = Array.from({ length: 9 }, () => Math.floor(Math.random() * 100).toString());
  return keys.map((key, idx) => ({ key, value: values[idx] }));
};

const IQTest = () => {
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<"memorize" | "question">("memorize");
  const [mapping, setMapping] = useState<Mapping[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Mapping | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [showResult, setShowResult] = useState(false);
  const [iqScore, setIqScore] = useState(0);

  const handleAnswerSubmit = useCallback(() => {
    setScore((prevScore) => {
      const isCorrect = currentQuestion && userAnswer === currentQuestion.value;
      const newScore = isCorrect ? prevScore + 1 : prevScore;
      
      if (round < 2) {
        setRound((prevRound) => prevRound + 1);
        setPhase("memorize");
        setMapping([]);
        setUserAnswer("");
        setCurrentQuestion(null);
      } else {
        const percentage = (newScore / 3) * 100;
        let calculatedIQ = 70 + (percentage / 100) * 60;
        calculatedIQ = Math.min(160, Math.max(70, calculatedIQ));
        setIqScore(Math.round(calculatedIQ));
        setShowResult(true);
      }
      return newScore;
    });
  }, [currentQuestion, userAnswer, round]);

  useEffect(() => {
    if (round < 3 && phase === "memorize" && mapping.length === 0) {
      const newMapping = generateMapping();
      setMapping(newMapping);
      setTimeLeft(10);
    }
  }, [round, phase, mapping.length]);

  useEffect(() => {
    if (phase === "memorize" && timeLeft > 0 && mapping.length > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === "memorize" && timeLeft === 0 && mapping.length > 0) {
      setPhase("question");
      setTimeLeft(5);
      const randomMapping = mapping[Math.floor(Math.random() * mapping.length)];
      setCurrentQuestion(randomMapping);
      setUserAnswer("");
    } else if (phase === "question" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === "question" && timeLeft === 0) {
      handleAnswerSubmit();
    }
  }, [timeLeft, phase, mapping, handleAnswerSubmit]);

useEffect(() => {
  if (showResult && iqScore > 0) {
    (async () => {
      await sendParentSms(`Your child taken a iq test the iq is ${iqScore}`);
      
      // Save to MongoDB
      try {
        const userId = getCurrentUserId();
        if (userId) {
          await fetch(`${API_BASE_URL}/game-scores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              gameType: 'iq-test',
              score: iqScore,
              level: getIQRange(iqScore).label
            })
          });
          console.log('IQ test score saved to database');
        }
      } catch (dbError) {
        console.error('Failed to save IQ score to database:', dbError);
      }
    })();
  }
}, [showResult, iqScore]);

  const getIQRange = (iq: number) => {
    return IQ_RANGES.find((range) => iq >= range.min) || IQ_RANGES[IQ_RANGES.length - 1];
  };

  const handleRestart = () => {
    setRound(0);
    setPhase("memorize");
    setScore(0);
    setUserAnswer("");
    setShowResult(false);
    setIqScore(0);
  };

  if (showResult) {
    const range = getIQRange(iqScore);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            IQ Test Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{iqScore}</div>
            <Badge className={cn("text-lg px-4 py-2", range.color)}>
              {range.label}
            </Badge>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              You answered {score} out of 3 questions correctly.
            </p>
            <div className="space-y-1">
              <p className="text-xs font-semibold">IQ Range Reference:</p>
              {IQ_RANGES.map((r, idx) => (
                <div key={idx} className="text-xs flex justify-between">
                  <span className={r.color}>{r.label}</span>
                  <span>{r.min === 0 ? "<70" : r.min === 130 ? "130+" : `${r.min}-${IQ_RANGES[idx - 1]?.min - 1 || 129}`}</span>
                </div>
              ))}
            </div>
          </div>
          <Button onClick={handleRestart} className="w-full">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          IQ Test - Round {round + 1} of 3
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {phase === "memorize" ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4" />
                <span className="text-sm">Memorize the mapping</span>
              </div>
              <Badge variant="outline">{timeLeft}s</Badge>
            </div>
            <Progress value={(10 - timeLeft) / 10 * 100} />
            <div className="grid grid-cols-3 gap-2">
              {mapping.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border-2 border-primary bg-primary/5 text-center"
                >
                  <div className="text-xl font-bold">{item.key}</div>
                  <div className="text-base text-muted-foreground mt-1">{item.value}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4" />
                <span className="text-sm">Answer quickly</span>
              </div>
              <Badge variant="outline">{timeLeft}s</Badge>
            </div>
            <Progress value={(5 - timeLeft) / 5 * 100} />
            <div className="text-center space-y-4">
              <div className="text-2xl font-bold">
                What number corresponds to "{currentQuestion?.key}"?
              </div>
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="w-full max-w-xs mx-auto px-4 py-2 border rounded-md text-center text-xl"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAnswerSubmit();
                  }
                }}
              />
              <Button onClick={handleAnswerSubmit} className="w-full max-w-xs">
                Submit Answer
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default IQTest;

