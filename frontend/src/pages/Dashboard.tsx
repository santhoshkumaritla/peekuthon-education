import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  MessageSquare, 
  Activity,
  Target,
  BookMarked,
  Gamepad2,
  Loader2,
  RefreshCw,
  Layers,
  ListChecks,
  TrendingUp,
  BarChart3,
  GraduationCap
} from 'lucide-react';

interface DashboardStats {
  totalBooks: number;
  totalQuizzes: number;
  totalFlashcards: number;
  totalChats: number;
  totalConcepts: number;
  totalGameScores: number;
  totalResources: number;
  totalCourses: number;
  completedCourses: number;
  averageQuizScore: number;
  recentBooks: any[];
  recentQuizzes: any[];
  recentChats: any[];
  recentGames: any[];
  activityByDate: { [key: string]: number };
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      
      // Set up auto-refresh every 1 minute (60 seconds)
      const interval = setInterval(() => {
        fetchDashboardData();
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [user]);
  
  // Refresh when window regains focus (user comes back to dashboard)
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        fetchDashboardData();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch data from all endpoints
      const [booksRes, quizzesRes, flashcardsRes, chatsRes, conceptsRes, gamesRes, resourcesRes, coursesRes, coursesListRes] = await Promise.all([
        fetch(`${API_URL}/books/user/${user._id}`),
        fetch(`${API_URL}/quizzes/user/${user._id}`),
        fetch(`${API_URL}/flashcards/user/${user._id}`),
        fetch(`${API_URL}/chats/user/${user._id}`),
        fetch(`${API_URL}/concepts/user/${user._id}`),
        fetch(`${API_URL}/game-scores/user/${user._id}`),
        fetch(`${API_URL}/learning-resources/user/${user._id}`),
        fetch(`${API_URL}/courses/stats/${user._id}`),
        fetch(`${API_URL}/courses?userId=${user._id}`)
      ]);

      const books = await booksRes.json();
      const quizzes = await quizzesRes.json();
      const flashcards = await flashcardsRes.json();
      const chats = await chatsRes.json();
      const concepts = await conceptsRes.json();
      const games = await gamesRes.json();
      const resources = await resourcesRes.json();
      const courseStats = await coursesRes.json();
      const coursesList = await coursesListRes.json();

      // Calculate statistics
      const quizData = quizzes.success ? quizzes.data : [];
      const avgScore = quizData.length > 0
        ? quizData.reduce((sum: number, q: any) => sum + (q.score || 0), 0) / quizData.length
        : 0;

      // Create activity heatmap for last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const activityByDate: { [key: string]: number } = {};
      last7Days.forEach(date => {
        activityByDate[date] = 0;
      });

      // Count activities by date - include all activity types
      [
        ...(books.data || []), 
        ...(quizzes.data || []), 
        ...(flashcards.data || []),
        ...(chats.data || []),
        ...(concepts.data || []),
        ...(games.data || []),
        ...(resources.data || []),
        ...(coursesList || [])
      ].forEach((item: any) => {
        const itemDate = new Date(item.createdAt).toISOString().split('T')[0];
        if (activityByDate[itemDate] !== undefined) {
          activityByDate[itemDate]++;
        }
      });

      setStats({
        totalBooks: books.success ? books.data.length : 0,
        totalQuizzes: quizzes.success ? quizzes.data.length : 0,
        totalFlashcards: flashcards.success ? flashcards.data.length : 0,
        totalChats: chats.success ? chats.data.length : 0,
        totalConcepts: concepts.success ? concepts.data.length : 0,
        totalGameScores: games.success ? games.data.length : 0,
        totalResources: resources.success ? resources.data.length : 0,
        totalCourses: courseStats.totalCourses || 0,
        completedCourses: courseStats.completedCourses || 0,
        averageQuizScore: Math.round(avgScore),
        recentBooks: books.success ? books.data.slice(0, 5) : [],
        recentQuizzes: quizzes.success ? quizzes.data.slice(0, 5) : [],
        recentChats: chats.success ? chats.data.slice(0, 5) : [],
        recentGames: games.success ? games.data.slice(0, 5) : [],
        activityByDate
      });

    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getGameTypeIcon = (gameType: string) => {
    const icons: { [key: string]: any } = {
      'iq-test': Target,
      'aptitude-test': Target,
      'gk-test': BookMarked,
      '2048': Gamepad2
    };
    const Icon = icons[gameType] || Gamepad2;
    return <Icon className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchDashboardData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const totalActivities = stats.totalBooks + stats.totalQuizzes + stats.totalChats + stats.totalGameScores;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.studentName}!</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your learning journey
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchDashboardData}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Books Generated</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBooks}</div>
            <p className="text-xs text-muted-foreground">
              Reading materials created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quizzes Taken</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
            <p className="text-xs text-muted-foreground">
              Average score: {stats.averageQuizScore}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedCourses} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChats}</div>
            <p className="text-xs text-muted-foreground">
              Questions answered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Total Activity
              </CardTitle>
              <CardDescription>
                Your learning activities summary
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalBooks}</div>
                  <p className="text-xs text-muted-foreground">Books</p>
                </div>
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.totalQuizzes}</div>
                  <p className="text-xs text-muted-foreground">Quizzes</p>
                </div>
                <div className="text-center p-3 bg-pink-50 dark:bg-pink-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-pink-600">{stats.totalFlashcards}</div>
                  <p className="text-xs text-muted-foreground">Flashcards</p>
                </div>
                <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{stats.totalConcepts}</div>
                  <p className="text-xs text-muted-foreground">Concepts</p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.totalCourses}</div>
                  <p className="text-xs text-muted-foreground">Courses</p>
                </div>
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{stats.totalGameScores}</div>
                  <p className="text-xs text-muted-foreground">Games</p>
                </div>
                <div className="text-center p-3 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-cyan-600">{stats.totalResources}</div>
                  <p className="text-xs text-muted-foreground">Resources</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Books */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Recent Books
              </CardTitle>
              <CardDescription>
                Your latest generated reading materials
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentBooks.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentBooks.map((book) => (
                    <div key={book._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{book.topic}</p>
                        <p className="text-sm text-muted-foreground">
                          {book.pages?.length || 0} pages • {formatDate(book.createdAt)}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        <BookOpen className="h-3 w-3 mr-1" />
                        Book
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No books yet. Start by generating a book in "Read a book"!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Quizzes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Recent Quiz Results
              </CardTitle>
              <CardDescription>
                Your latest quiz performances
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentQuizzes.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentQuizzes.map((quiz) => (
                    <div key={quiz._id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{quiz.topic || 'Quiz'}</h4>
                        <Badge className="bg-blue-100 text-blue-800">
                          {quiz.score}/{quiz.totalQuestions}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Progress 
                          value={(quiz.score / quiz.totalQuestions) * 100} 
                          className="flex-1" 
                        />
                        <span className="text-sm font-medium">
                          {Math.round((quiz.score / quiz.totalQuestions) * 100)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(quiz.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No quizzes yet. Generate a quiz to test your knowledge!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          {/* Recent AI Chats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent AI Conversations
              </CardTitle>
              <CardDescription>
                Your latest interactions with Question Bot
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentChats.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentChats.map((chat) => (
                    <div key={chat._id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {chat.messages?.length || 0} messages
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(chat.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Conversation with AI assistant
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No conversations yet. Try Question Bot to get AI assistance!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Games */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5" />
                Recent Game Scores
              </CardTitle>
              <CardDescription>
                Your latest game performances
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentGames.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentGames.map((game) => (
                    <div key={game._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getGameTypeIcon(game.gameType)}
                        <div>
                          <p className="font-medium capitalize">
                            {game.gameType.replace(/-/g, ' ')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(game.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-primary">
                          {game.score}
                        </div>
                        {game.level && (
                          <Badge variant="secondary" className="text-xs">
                            {game.level}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No game scores yet. Visit Game Zone to start playing!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Activity Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Activity Over Last 7 Days
              </CardTitle>
              <CardDescription>
                Your daily learning activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {Object.entries(stats.activityByDate).map(([date, count]) => {
                  const activityLevel = count as number;
                  const getColorClass = (level: number) => {
                    if (level === 0) return 'bg-gray-100 dark:bg-gray-800';
                    if (level <= 2) return 'bg-green-200 dark:bg-green-800';
                    if (level <= 5) return 'bg-green-400 dark:bg-green-600';
                    if (level <= 8) return 'bg-green-600 dark:bg-green-400';
                    return 'bg-green-800 dark:bg-green-200';
                  };
                  
                  return (
                    <div key={date} className="text-center">
                      <div 
                        className={`h-12 rounded-lg ${getColorClass(activityLevel)} flex items-center justify-center text-sm font-medium transition-colors`}
                        title={`${date}: ${activityLevel} activities`}
                      >
                        {activityLevel > 0 ? activityLevel : '-'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-4 pt-4 border-t">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
                  <span>No activity</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-400 dark:bg-green-600 rounded-sm"></div>
                  <span>Active</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-800 dark:bg-green-200 rounded-sm"></div>
                  <span>Very Active</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learning Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Learning Summary
              </CardTitle>
              <CardDescription>
                Overview of your progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Total Activities</span>
                    <span className="text-2xl font-bold">{totalActivities}</span>
                  </div>
                  <Progress value={(totalActivities / 100) * 100} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Quiz Average</p>
                    <p className="text-2xl font-bold">{stats.averageQuizScore}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Resources</p>
                    <p className="text-2xl font-bold">{stats.totalResources}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
