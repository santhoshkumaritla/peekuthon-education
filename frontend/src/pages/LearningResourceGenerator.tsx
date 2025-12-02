import { useState } from "react";
import {
  BookOpen,
  MonitorPlay,
  Globe,
  Youtube,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { sendParentSms } from "@/lib/sms";
import { learningResourceAPI, getCurrentUserId } from "@/lib/api";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_LEARNING_API_KEY || "";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

interface Book {
  title: string;
  author: string;
  description: string;
}

interface OnlineCourse {
  platform: string;
  course_name: string;
  url: string;
  description: string;
}

interface Website {
  name: string;
  url: string;
  description: string;
}

interface YoutubeChannel {
  channel_name: string;
  url: string;
  description: string;
}

interface ApiResponse {
  books: Book[];
  online_courses: OnlineCourse[];
  websites: Website[];
  youtube_channels: YoutubeChannel[];
}

interface CategoryItem {
  title: string;
  description: string;
  link: string;
}

interface DisplayCategory {
  title: string;
  icon: JSX.Element;
  items: CategoryItem[];
}

const LearningResourceGenerator = () => {
  const [topic, setTopic] = useState("");
  const [resources, setResources] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const handleGenerate = async () => {
    const trimmed = topic.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    setResources(null);

    const prompt = `You are a learning path recommender.
Generate high quality resources to learn the topic: "${trimmed}".
Return ONLY valid JSON in this exact shape:
{
  "books": [
    { "title": string, "author": string, "description": string }
  ],
  "online_courses": [
    { "platform": string, "course_name": string, "url": string, "description": string }
  ],
  "websites": [
    { "name": string, "url": string, "description": string }
  ],
  "youtube_channels": [
    { "channel_name": string, "url": string, "description": string }
  ]
}
Rules:
- Prefer beginner-friendly, reputable resources.
- Mix foundational and intermediate materials.
- Use real platforms and URLs where possible.
- Do not include any explanation outside the JSON.`;

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to generate resources");
      }

      const data = await response.json();
      const textResponse =
        data.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text || "")
          .join("\n")
          .trim() ?? "";

      if (!textResponse) {
        throw new Error("Model returned an empty response");
      }

      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not parse resources from model response");
      }

      const parsed: ApiResponse = JSON.parse(jsonMatch[0]);
      const parsedResources = {
        books: parsed.books ?? [],
        online_courses: parsed.online_courses ?? [],
        websites: parsed.websites ?? [],
        youtube_channels: parsed.youtube_channels ?? [],
      };

      setResources(parsedResources);

      // Save to MongoDB
      try {
        const userId = getCurrentUserId();
        if (userId) {
          await learningResourceAPI.create({
            userId,
            topic: trimmed,
            resources: parsedResources
          });
          console.log('Learning resources saved to database');
        }
      } catch (dbError) {
        console.error('Failed to save resources to database:', dbError);
      }

      await sendParentSms(
        `Your child was searched for ${trimmed} resources from books,courses,youtube,websites`
      );
    } catch (err: any) {
      console.error("Failed to generate resources:", err);
      setError(err.message || "Failed to generate resources. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getResourcesByCategory = (): DisplayCategory[] => {
    if (!resources) return [];

    switch (activeCategory) {
      case "Books":
        return [
          {
            title: "Books",
            icon: <BookOpen className="w-5 h-5 text-blue-600" />,
            items: resources.books.map((book) => ({
              title: book.title,
              description: `By ${book.author} - ${book.description}`,
              link: "#",
            })),
          },
        ];
      case "Courses":
        return [
          {
            title: "Courses",
            icon: <MonitorPlay className="w-5 h-5 text-green-600" />,
            items: resources.online_courses.map((course) => ({
              title: course.course_name,
              description: `${course.platform} - ${course.description}`,
              link: course.url,
            })),
          },
        ];
      case "Websites":
        return [
          {
            title: "Websites",
            icon: <Globe className="w-5 h-5 text-purple-600" />,
            items: resources.websites.map((website) => ({
              title: website.name,
              description: website.description,
              link: website.url,
            })),
          },
        ];
      case "YouTube":
        return [
          {
            title: "YouTube",
            icon: <Youtube className="w-5 h-5 text-red-600" />,
            items: resources.youtube_channels.map((channel) => ({
              title: channel.channel_name,
              description: channel.description,
              link: channel.url,
            })),
          },
        ];
      default:
        return [
          {
            title: "Books",
            icon: <BookOpen className="w-5 h-5 text-blue-600" />,
            items: resources.books.map((book) => ({
              title: book.title,
              description: `By ${book.author} - ${book.description}`,
              link: "#",
            })),
          },
          {
            title: "Courses",
            icon: <MonitorPlay className="w-5 h-5 text-green-600" />,
            items: resources.online_courses.map((course) => ({
              title: course.course_name,
              description: `${course.platform} - ${course.description}`,
              link: course.url,
            })),
          },
          {
            title: "Websites",
            icon: <Globe className="w-5 h-5 text-purple-600" />,
            items: resources.websites.map((website) => ({
              title: website.name,
              description: website.description,
              link: website.url,
            })),
          },
          {
            title: "YouTube",
            icon: <Youtube className="w-5 h-5 text-red-600" />,
            items: resources.youtube_channels.map((channel) => ({
              title: channel.channel_name,
              description: channel.description,
              link: channel.url,
            })),
          },
        ];
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <CardTitle>Learning Resource Generator</CardTitle>
            <CardDescription>
              Discover curated books, courses, websites, and YouTube channels for any topic.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-[1fr,2fr]">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Enter your learning topic</CardTitle>
            <CardDescription>
              Tell the assistant what you want to learn and it will gather high‑quality resources.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Machine Learning, Web Development, Photosynthesis..."
                disabled={loading}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={!topic.trim() || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating resources...
                </>
              ) : (
                "Generate resources"
              )}
            </Button>
            {error && (
              <p className="text-sm text-destructive border border-destructive/40 bg-destructive/10 rounded-md px-3 py-2">
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Recommended resources</CardTitle>
              <CardDescription>
                Filter by category or browse everything at once.
              </CardDescription>
            </div>
            {resources && (
              <Badge variant="outline" className="whitespace-nowrap">
                {topic.trim() || "Topic"}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {/* Navigation Bar */}
            <div className="flex flex-wrap gap-2 mb-4">
              {["All", "Books", "Courses", "Websites", "YouTube"].map((category) => (
                <Button
                  key={category}
                  type="button"
                  size="sm"
                  variant={activeCategory === category ? "default" : "outline"}
                  onClick={() => setActiveCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-56 space-y-3 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <p>Finding the best resources for you...</p>
                </div>
              ) : !resources ? (
                <div className="flex flex-col items-center justify-center h-56 text-muted-foreground">
                  <BookOpen className="w-10 h-10 mb-2" />
                  <p>Enter a topic to get learning recommendations.</p>
                </div>
              ) : (
                getResourcesByCategory().map((category) => (
                  <div
                    key={category.title}
                    className="rounded-xl border bg-muted/40 p-4"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      {category.icon}
                      <h3 className="font-semibold">{category.title}</h3>
                    </div>
                    <div className="space-y-2">
                      {category.items.map((item, index) => (
                        <a
                          key={index}
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-lg border bg-background px-3 py-2 text-sm hover:border-primary/40 hover:bg-primary/5 transition-colors"
                        >
                          <div className="font-medium">{item.title}</div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        </a>
                      ))}
                      {category.items.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          No {category.title.toLowerCase()} found for this topic.
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LearningResourceGenerator;


