import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { sendParentSms } from "@/lib/sms";
import { getCurrentUserId } from "@/lib/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

type Direction = "up" | "down" | "left" | "right";

const GRID_SIZE = 4;
const WIN_VALUE = 2048;

const getTileColor = (value: number): string => {
  const colors: Record<number, string> = {
    2: "bg-gray-100 text-gray-800",
    4: "bg-gray-200 text-gray-800",
    8: "bg-yellow-200 text-yellow-900",
    16: "bg-yellow-300 text-yellow-900",
    32: "bg-orange-200 text-orange-900",
    64: "bg-orange-300 text-orange-900",
    128: "bg-red-200 text-red-900",
    256: "bg-red-300 text-red-900",
    512: "bg-pink-200 text-pink-900",
    1024: "bg-pink-300 text-pink-900",
    2048: "bg-purple-400 text-white font-bold",
  };
  return colors[value] || "bg-gray-400 text-white";
};

const createEmptyGrid = (): number[][] => {
  return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
};

const addRandomTile = (grid: number[][]): number[][] => {
  const emptyCells: [number, number][] = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (grid[i][j] === 0) {
        emptyCells.push([i, j]);
      }
    }
  }
  if (emptyCells.length > 0) {
    const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    grid[row][col] = Math.random() < 0.9 ? 2 : 4;
  }
  return grid;
};

const moveLeft = (grid: number[][]): { grid: number[][]; moved: boolean } => {
  const newGrid = grid.map((row) => [...row]);
  let moved = false;
  for (let i = 0; i < GRID_SIZE; i++) {
    const filtered = newGrid[i].filter((val) => val !== 0);
    const merged: number[] = [];
    for (let j = 0; j < filtered.length; j++) {
      if (j < filtered.length - 1 && filtered[j] === filtered[j + 1]) {
        merged.push(filtered[j] * 2);
        j++;
        moved = true;
      } else {
        merged.push(filtered[j]);
      }
    }
    while (merged.length < GRID_SIZE) {
      merged.push(0);
    }
    if (JSON.stringify(newGrid[i]) !== JSON.stringify(merged)) {
      moved = true;
    }
    newGrid[i] = merged;
  }
  return { grid: newGrid, moved };
};

const rotateGrid = (grid: number[][], times: number): number[][] => {
  let rotated = grid.map((row) => [...row]);
  for (let t = 0; t < times; t++) {
    rotated = rotated[0].map((_, i) => rotated.map((row) => row[i]).reverse());
  }
  return rotated;
};

const move = (grid: number[][], direction: Direction): { grid: number[][]; moved: boolean } => {
  let rotated = grid;
  let rotations = 0;
  if (direction === "right") {
    rotated = rotateGrid(grid, 2);
    rotations = 2;
  } else if (direction === "up") {
    rotated = rotateGrid(grid, 3);
    rotations = 3;
  } else if (direction === "down") {
    rotated = rotateGrid(grid, 1);
    rotations = 1;
  }
  const { grid: movedGrid, moved } = moveLeft(rotated);
  let result = movedGrid;
  for (let i = 0; i < (4 - rotations) % 4; i++) {
    result = rotateGrid(result, 1);
  }
  return { grid: result, moved };
};

const Game2048 = () => {
  const [grid, setGrid] = useState<number[][]>(createEmptyGrid());
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(() => {
    return parseInt(localStorage.getItem("2048_max_score") || "0", 10);
  });
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [reportedResult, setReportedResult] = useState(false);

  useEffect(() => {
    const newGrid = addRandomTile(addRandomTile(createEmptyGrid()));
    setGrid(newGrid);
  }, []);

  const calculateScore = (grid: number[][]) => {
    return grid.reduce((sum, row) => sum + row.reduce((rowSum, val) => rowSum + val, 0), 0);
  };

  const checkGameOver = (grid: number[][]): boolean => {
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (grid[i][j] === 0) return false;
        if (j < GRID_SIZE - 1 && grid[i][j] === grid[i][j + 1]) return false;
        if (i < GRID_SIZE - 1 && grid[i][j] === grid[i + 1][j]) return false;
      }
    }
    return true;
  };

  const checkWin = (grid: number[][]): boolean => {
    return grid.some((row) => row.some((val) => val === WIN_VALUE));
  };

  const handleMove = useCallback(
    (direction: Direction) => {
      if (gameOver) return;
      const { grid: newGrid, moved } = move(grid, direction);
      if (moved) {
        const withNewTile = addRandomTile(newGrid);
        setGrid(withNewTile);
        const newScore = calculateScore(withNewTile);
        setScore(newScore);
        if (newScore > maxScore) {
          setMaxScore(newScore);
          localStorage.setItem("2048_max_score", newScore.toString());
        }
        if (checkWin(withNewTile) && !won) {
          setWon(true);
        }
        if (checkGameOver(withNewTile)) {
          setGameOver(true);
        }
      }
    },
    [grid, gameOver, maxScore, won]
  );

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const directionMap: Record<string, Direction> = {
          ArrowUp: "up",
          ArrowDown: "down",
          ArrowLeft: "left",
          ArrowRight: "right",
        };
        handleMove(directionMap[e.key]);
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleMove]);

  const handleRestart = () => {
    const newGrid = addRandomTile(addRandomTile(createEmptyGrid()));
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
    setWon(false);
    setReportedResult(false);
  };

  useEffect(() => {
    if ((gameOver || won) && !reportedResult) {
      (async () => {
        await sendParentSms(`Your child played 2048 game the score is ${score}`);
        
        // Save to MongoDB
        try {
          const userId = getCurrentUserId();
          if (userId) {
            await fetch(`${API_BASE_URL}/game-scores`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId,
                gameType: '2048',
                score,
                level: won ? 'Won' : 'Game Over'
              })
            });
            console.log('2048 game score saved to database');
          }
        } catch (dbError) {
          console.error('Failed to save 2048 score to database:', dbError);
        }
      })();
      setReportedResult(true);
    } else if (!gameOver && !won && reportedResult) {
      setReportedResult(false);
    }
  }, [gameOver, won, score, reportedResult]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>2048</CardTitle>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Score</div>
              <div className="text-lg font-bold">{score}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Best</div>
              <div className="text-lg font-bold">{maxScore}</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {(gameOver || won) && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <p className="text-sm font-semibold">
              {won ? "🎉 You reached 2048!" : "Game Over!"}
            </p>
            <Button onClick={handleRestart} className="mt-2" size="sm">
              <RotateCcw className="w-3 h-3 mr-1" />
              Play Again
            </Button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-center">
          {/* Game Board - Left Side */}
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-2 rounded-xl shadow-lg">
            <div className="grid grid-cols-4 gap-2">
              {grid.map((row, i) =>
                row.map((value, j) => (
                  <div
                    key={`${i}-${j}`}
                    className={cn(
                      "w-[100px] h-[100px] rounded-lg flex items-center justify-center text-lg font-bold transition-all duration-200 shadow-md",
                      value === 0 
                        ? "bg-gray-300/50" 
                        : cn(getTileColor(value), "transform hover:scale-105")
                    )}
                  >
                    {value !== 0 && value}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Control Panel - Right Side */}
          <div className="flex flex-col items-center gap-4">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 rounded-xl shadow-lg border border-primary/20">
              <div className="grid grid-cols-3 gap-3">
                <div></div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleMove("up")}
                  className="h-14 w-14 rounded-full border-2 border-primary/30 bg-white hover:bg-primary hover:text-white hover:border-primary hover:scale-110 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <ArrowUp className="w-6 h-6" />
                </Button>
                <div></div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleMove("left")}
                  className="h-14 w-14 rounded-full border-2 border-primary/30 bg-white hover:bg-primary hover:text-white hover:border-primary hover:scale-110 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <ArrowLeft className="w-6 h-6" />
                </Button>
                <div className="flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">2048</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleMove("right")}
                  className="h-14 w-14 rounded-full border-2 border-primary/30 bg-white hover:bg-primary hover:text-white hover:border-primary hover:scale-110 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <ArrowRight className="w-6 h-6" />
                </Button>
                <div></div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleMove("down")}
                  className="h-14 w-14 rounded-full border-2 border-primary/30 bg-white hover:bg-primary hover:text-white hover:border-primary hover:scale-110 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <ArrowDown className="w-6 h-6" />
                </Button>
                <div></div>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground max-w-[200px]">
              Use arrow keys or click buttons to move tiles
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Game2048;

