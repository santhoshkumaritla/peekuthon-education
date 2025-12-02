import { useParams, Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NotebookIcon, StarIcon, CalendarIcon } from "@/components/icons/StationeryIcons";
import { Badge } from "@/components/ui/badge";

const features = {
  notebooks: {
    title: "Interactive Notebooks",
    status: "Planned",
    eta: "Q1 2026",
    description: "Create, share, and collaborate on interactive learning notebooks with rich media support, code execution, and real-time collaboration features.",
    why: "Interactive notebooks help students organize their thoughts, combine code with documentation, and create a personalized learning experience. This feature will transform how you take notes and practice coding.",
    highlights: [
      "Real-time collaborative editing",
      "Support for code execution in multiple languages",
      "Rich media embedding (images, videos, diagrams)",
      "Export to PDF and share publicly",
      "Template library for common subjects",
    ],
    icon: NotebookIcon,
  },
  whiteboard: {
    title: "Live Whiteboard",
    status: "In Progress",
    eta: "December 2025",
    description: "A collaborative digital whiteboard for brainstorming, problem-solving, and visual learning. Perfect for study groups and interactive lessons.",
    why: "Visual learning is powerful. Our live whiteboard brings the classroom experience online with real-time drawing, shapes, sticky notes, and collaboration tools that make complex concepts easier to understand.",
    highlights: [
      "Unlimited canvas space",
      "Drawing tools and shapes library",
      "Sticky notes and text annotations",
      "Real-time multi-user collaboration",
      "Save and share board sessions",
    ],
    icon: CalendarIcon,
  },
  quiz: {
    title: "Smart Quiz Generator",
    status: "Live",
    eta: "Available Now",
    description: "AI-powered quiz generation from your course materials. Create custom assessments, practice tests, and flashcards automatically from any content.",
    why: "Testing reinforces learning. Our smart quiz generator analyzes your study materials and creates targeted questions that help you master the content efficiently.",
    highlights: [
      "AI-powered question generation",
      "Multiple question types (MCQ, true/false, short answer)",
      "Adaptive difficulty based on performance",
      "Instant feedback and explanations",
      "Track progress over time",
    ],
    icon: StarIcon,
  },
};

const FeatureDetail = () => {
  const { featureId } = useParams<{ featureId: string }>();
  const feature = featureId ? features[featureId as keyof typeof features] : null;

  if (!feature) {
    return <Navigate to="/" replace />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Live":
        return "bg-accent text-accent-foreground";
      case "In Progress":
        return "bg-secondary text-secondary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const Icon = feature.icon;

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-slide max-w-4xl">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl lg:text-4xl font-bold">{feature.title}</h1>
              <Badge className={getStatusColor(feature.status)}>
                {feature.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarIcon className="w-4 h-4" />
              <span>ETA: {feature.eta}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl">Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {feature.description}
          </p>
        </CardContent>
      </Card>

      {/* Why It's Coming */}
      <Card className="border-2 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <StarIcon className="w-6 h-6 text-secondary" filled />
            Why We're Building This
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg leading-relaxed">
            {feature.why}
          </p>
        </CardContent>
      </Card>

      {/* Key Features */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-2xl">Key Features</CardTitle>
          <CardDescription>
            What you can expect from this feature
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {feature.highlights.map((highlight, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <span className="text-lg">{highlight}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="border-2 bg-gradient-to-br from-accent/10 to-secondary/10">
        <CardContent className="p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold mb-2">Stay Updated</h3>
              <p className="text-muted-foreground">
                Get notified when this feature launches
              </p>
            </div>
            <Button size="lg" className="whitespace-nowrap">
              Notify Me
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeatureDetail;
