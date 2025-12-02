import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { getCurrentUserId } from "@/lib/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_CONCEPT_API_KEY || "";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

interface GeneratedResult {
  summary: string | null;
  steps: string[];
}

interface TailwindDropdownProps {
  onActionSelect: (action: string) => void;
}

const ColorSwatch = ({ color, onClick }: { color: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-8 h-8 rounded-full border border-gray-300 cursor-pointer transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
    style={{ backgroundColor: color }}
  />
);

const CustomButton = ({
  onClick,
  children,
  className = "",
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

const TailwindDropdown = ({ onActionSelect }: TailwindDropdownProps) => {
  const [selectedOption, setSelectedOption] = useState("Mathematics");
  const [isOpen, setIsOpen] = useState(false);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    onActionSelect(option);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors duration-200 text-left"
      >
        {selectedOption}
      </button>

      {isOpen && (
        <div className="absolute mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 w-40">
          <div className="py-1">
            {["Mathematics", "Aptitude"].map((option) => (
              <button
                key={option}
                onClick={() => handleOptionSelect(option)}
                className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const parseBoldSegments = (text: string) => {
  const boldRegex = /\*\*(.*?)\*\*/g;
  const segments: (string | JSX.Element)[] = [];
  let match: RegExpExecArray | null;
  let lastIndex = 0;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push(text.substring(lastIndex, match.index));
    }
    segments.push(
      <strong key={`${match.index}-${match[1]}`} className="font-semibold">
        {match[1]}
      </strong>
    );
    lastIndex = boldRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push(text.substring(lastIndex));
  }

  return segments;
};

const ConceptAnimator = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [isEraser, setIsEraser] = useState(false);
  const [selectedAction, setSelectedAction] = useState("Mathematics");
  const [result, setResult] = useState<GeneratedResult>({
    summary: null,
    steps: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const SWATCHES = ["#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00"];

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;

      if (canvas && container) {
        const ctx = canvas.getContext("2d");
        const width = container.clientWidth;
        const height = container.clientHeight;

        canvas.width = width;
        canvas.height = height;
        canvas.style.background = "#000";

        if (ctx) {
          ctx.lineCap = "round";
          ctx.lineWidth = 3;
        }
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setResult({ summary: null, steps: [] });
    setError(null);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = isEraser ? "#000" : color;
    ctx.lineWidth = isEraser ? 20 : 3;
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = isEraser ? "#000" : color;
    ctx.lineWidth = isEraser ? 20 : 3;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const formatResponse = (text: string): GeneratedResult => {
    const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
    const steps = lines.filter((line) => line.startsWith("- ")).map((line) => line.substring(2));
    const summaryLines = lines.filter((line) => !line.startsWith("- "));

    return {
      summary: summaryLines.length ? summaryLines.join("\n") : null,
      steps,
    };
  };

  const runAnalysis = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setError("Canvas is not ready yet.");
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Could not access drawing context.");
      return;
    }

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const hasInk = pixels.some((value, index) => {
      if ((index + 1) % 4 === 0) return false;
      return value !== 0;
    });

    if (!hasInk) {
      setError("Please sketch or write something before analyzing.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult({ summary: null, steps: [] });

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const base64Data = dataUrl.split(",")[1];

      const prompt = `You are a STEM tutor. The learner selected "${selectedAction}" and provided a chalkboard snapshot.
Carefully read the board and give a clear, step-by-step solution only.
Explain each step in order and fix any mistakes you notice, but do not add extra suggestions or homework.
Use bold headings with **double asterisks** and format the steps as a neat list with each step on its own line, starting with "- ".`;

      const body = {
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: base64Data,
                },
              },
            ],
          },
        ],
      };

      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = await response.json();
      const responseText =
        data.candidates?.[0]?.content?.parts
          ?.map((part: any) => part.text || "")
          .join("\n")
          .trim() ?? "";

      if (!responseText) {
        throw new Error("Gemini could not interpret the board. Try writing clearer lines.");
      }

      const formattedResult = formatResponse(responseText);
      setResult(formattedResult);
      
      // Save to MongoDB
      try {
        const userId = getCurrentUserId();
        if (userId) {
          await fetch(`${API_BASE_URL}/concepts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              category: selectedAction,
              drawing: canvasRef.current?.toDataURL() || '',
              explanation: responseText
            })
          });
          console.log('Concept saved to database');
        }
      } catch (dbError) {
        console.error('Failed to save concept to database:', dbError);
      }
    } catch (err: any) {
      console.error("Gemini analysis failed:", err);
      setError(err.message || "Something went wrong during analysis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <header className="bg-black py-4 px-6 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div className="text-3xl font-bold">
            <span className="text-cyan-400">Concept</span>
            <span className="text-white pl-3">Chalkboard</span>
          </div>

          <div className="flex items-center gap-4">
            <TailwindDropdown onActionSelect={setSelectedAction} />

            <div className="flex items-center gap-2 bg-gray-800 p-2 rounded-md">
              {SWATCHES.map((swatch) => (
                <ColorSwatch
                  key={swatch}
                  color={swatch}
                  onClick={() => {
                    setColor(swatch);
                    setIsEraser(false);
                  }}
                />
              ))}
            </div>

            <CustomButton onClick={resetCanvas}>Clear Screen</CustomButton>

            <CustomButton
              onClick={() => setIsEraser((prev) => !prev)}
              className={isEraser ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {isEraser ? "Disable Eraser" : "Enable Eraser"}
            </CustomButton>

            <CustomButton
              onClick={runAnalysis}
              className="bg-cyan-600 hover:bg-cyan-700 flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                "Analyze"
              )}
            </CustomButton>
          </div>
        </div>
      </header>

      <div className="flex-1 relative" ref={containerRef}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          className="absolute inset-0 cursor-crosshair w-full h-full"
        />
      </div>

      <aside className="bg-gray-900 p-5 border-t border-gray-800 overflow-y-auto max-h-64">
        <h2 className="text-xl font-semibold mb-4 text-cyan-400">Analysis Results</h2>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-300 mb-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing the chalkboard...
          </div>
        )}

        {result.summary && (
          <div className="mb-6 space-y-2 text-sm text-gray-100">
            {result.summary.split("\n").map((line, idx) => (
              <p key={`summary-${idx}`} className="leading-relaxed">
                {parseBoldSegments(line)}
              </p>
            ))}
          </div>
        )}

        {result.steps.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2 text-cyan-300">Suggested Steps</h3>
            <ol className="list-disc list-inside space-y-2 text-sm text-gray-200">
              {result.steps.map((step, idx) => (
                <li key={`step-${idx}`}>{parseBoldSegments(step)}</li>
              ))}
            </ol>
          </div>
        )}

        {!result.summary && !result.steps.length && !loading && !error }
      </aside>
    </div>
  );
};

export default ConceptAnimator;