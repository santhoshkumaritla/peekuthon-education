import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Grid3x3, BookOpen, Award, ArrowLeft } from "lucide-react";
import IQTest from "@/components/games/IQTest";
import Game2048 from "@/components/games/Game2048";
import AptitudeTest from "@/components/games/AptitudeTest";
import GKTest from "@/components/games/GKTest";

type GameType = "menu" | "iq" | "2048" | "aptitude" | "gk";

const GameZone = () => {
  const [currentGame, setCurrentGame] = useState<GameType>("menu");

  const games = [
    {
      id: "iq" as GameType,
      title: "IQ Test",
      description: "Test your memory and pattern recognition skills",
      icon: Brain,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      id: "2048" as GameType,
      title: "2048",
      description: "Combine tiles to reach 2048",
      icon: Grid3x3,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      id: "aptitude" as GameType,
      title: "Aptitude Test",
      description: "10 questions to test your aptitude",
      icon: BookOpen,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      id: "gk" as GameType,
      title: "GK Test",
      description: "10 general knowledge questions",
      icon: Award,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  if (currentGame !== "menu") {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => setCurrentGame("menu")}
          className="w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>
        {currentGame === "iq" && <IQTest />}
        {currentGame === "2048" && <Game2048 />}
        {currentGame === "aptitude" && <AptitudeTest />}
        {currentGame === "gk" && <GKTest />}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-full bg-primary/10 text-primary">
          <Grid3x3 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Game Zone</h1>
          <p className="text-sm text-muted-foreground">
            Challenge yourself with interactive games and tests.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {games.map((game) => {
          const Icon = game.icon;
          return (
            <Card
              key={game.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setCurrentGame(game.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${game.bgColor}`}>
                    <Icon className={`w-6 h-6 ${game.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1">{game.title}</h3>
                    <p className="text-sm text-muted-foreground">{game.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default GameZone;

