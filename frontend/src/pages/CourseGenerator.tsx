import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, BookOpen, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { sendParentSms } from "@/lib/sms";
import { getCurrentUserId } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_COURSE_API_KEY || "";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

type Section = {
  sectionNumber: number;
  title: string;
  content: string;
};

type Module = {
  moduleNumber: number;
  title: string;
  sections: Section[];
};

type Course = {
  _id?: string;
  topic: string;
  difficulty: string;
  modules: Module[];
  completed: boolean;
};

export default function CourseGenerator() {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [generating, setGenerating] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [completing, setCompleting] = useState(false);
  const { toast } = useToast();

  const toggleModule = (moduleNumber: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleNumber)) {
      newExpanded.delete(moduleNumber);
    } else {
      newExpanded.add(moduleNumber);
    }
    setExpandedModules(newExpanded);
  };

  const formatContent = (text: string) => {
    // Convert **text** to bold
    return text.split(/(\*\*.*?\*\*)/).map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const generateCourse = async () => {
    if (!topic.trim() || !difficulty) {
      toast({
        title: "Missing Information",
        description: "Please enter a topic and select difficulty level.",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setCourse(null);

    try {
      const prompt = `Create a comprehensive course on "${topic}" at ${difficulty} difficulty level.

Generate exactly 5 modules. Each module should have 3-4 sections.

CRITICAL: Return ONLY valid JSON. No markdown, no explanations, no code blocks. Just pure JSON.

Format:
{
  "modules": [
    {
      "moduleNumber": 1,
      "title": "Module Title",
      "sections": [
        {
          "sectionNumber": 1,
          "title": "Section Title",
          "content": "Detailed content here. Use **text** for important terms."
        }
      ]
    }
  ]
}

Requirements:
- Return ONLY the JSON object, nothing else
- NO trailing commas in arrays or objects
- Each section: 3-5 paragraphs of educational content
- Use **text** to emphasize key concepts
- Include practical examples
- Match ${difficulty} difficulty level`;

      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate course: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error("No content generated");
      }

      // Clean and parse JSON - more aggressive cleaning
      let cleanedText = generatedText.trim();
      
      // Remove markdown code blocks
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Try to extract JSON if there's extra text
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }
      
      // Remove any trailing commas before closing braces/brackets
      cleanedText = cleanedText.replace(/,(\s*[}\]])/g, '$1');
      
      // Parse JSON with error handling
      let courseData;
      try {
        courseData = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.error("Cleaned Text:", cleanedText);
        throw new Error("Failed to parse generated content. Please try again.");
      }

      const newCourse: Course = {
        topic,
        difficulty,
        modules: courseData.modules,
        completed: false,
      };

      // Save to backend
      const userId = getCurrentUserId();
      const saveResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          ...newCourse,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error("Failed to save course");
      }

      const savedCourse = await saveResponse.json();
      setCourse({ ...newCourse, _id: savedCourse._id });

      toast({
        title: "Course Generated!",
        description: `Created a ${difficulty} level course on ${topic} with 5 modules.`,
      });

      // Expand first module by default
      setExpandedModules(new Set([1]));
    } catch (error) {
      console.error("Error generating course:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate course",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const markAsCompleted = async () => {
    if (!course || !course._id) return;

    setCompleting(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/courses/${course._id}/complete`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark course as completed");
      }

      setCourse({ ...course, completed: true });

      // Send SMS to parent
      try {
        await sendParentSms(
          `Great news! Your child has completed the course "${course.topic}" (${course.difficulty} level) on the LearnNest Dashboard. Keep up the excellent work! 🎓`
        );
      } catch (smsError) {
        console.error("Failed to send SMS:", smsError);
      }

      toast({
        title: "Course Completed! 🎉",
        description: `Congratulations! You've completed ${course.topic}. Parent notified via SMS.`,
      });
    } catch (error) {
      console.error("Error completing course:", error);
      toast({
        title: "Error",
        description: "Failed to mark course as completed",
        variant: "destructive",
      });
    } finally {
      setCompleting(false);
    }
  };

  const startNewCourse = () => {
    setCourse(null);
    setTopic("");
    setDifficulty("");
    setExpandedModules(new Set());
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          Course Generator
        </h1>
      </div>

      {!course ? (
        <Card>
          <CardHeader>
            <CardTitle>Create Your Course</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="topic">Course Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., Introduction to Machine Learning, Ancient Egyptian History"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={generating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={difficulty} onValueChange={setDifficulty} disabled={generating}>
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy - Beginner friendly</SelectItem>
                  <SelectItem value="medium">Medium - Intermediate level</SelectItem>
                  <SelectItem value="hard">Hard - Advanced concepts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={generateCourse}
              disabled={generating || !topic.trim() || !difficulty}
              className="w-full"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Course...
                </>
              ) : (
                <>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Generate Course
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{course.topic}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Difficulty: <span className="capitalize font-medium">{course.difficulty}</span>
                  </p>
                </div>
                {course.completed && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-6 w-6" />
                    <span className="font-semibold">Completed</span>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>

          <div className="space-y-4">
            {course.modules.map((module) => (
              <Card key={module.moduleNumber}>
                <CardHeader
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => toggleModule(module.moduleNumber)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {expandedModules.has(module.moduleNumber) ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                      Module {module.moduleNumber}: {module.title}
                    </CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {module.sections.length} sections
                    </span>
                  </div>
                </CardHeader>

                {expandedModules.has(module.moduleNumber) && (
                  <CardContent className="space-y-6 pt-6">
                    {module.sections.map((section) => (
                      <div key={section.sectionNumber} className="space-y-3">
                        <h4 className="font-semibold text-base flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">
                            {section.sectionNumber}
                          </span>
                          {section.title}
                        </h4>
                        <div className="prose prose-sm max-w-none text-muted-foreground pl-8">
                          {formatContent(section.content)}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          <div className="flex gap-4">
            {!course.completed && (
              <Button
                onClick={markAsCompleted}
                disabled={completing}
                size="lg"
                className="flex-1"
              >
                {completing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Marking Complete...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Completed
                  </>
                )}
              </Button>
            )}
            <Button onClick={startNewCourse} variant="outline" size="lg" className="flex-1">
              <BookOpen className="mr-2 h-4 w-4" />
              Create New Course
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
