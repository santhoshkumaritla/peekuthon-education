import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import FeatureDetail from "./pages/FeatureDetail";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";
import ReadBook from "./pages/ReadBook";
import QuestionBot from "./pages/QuestionBot";
import ConceptAnimator from "./pages/ConceptAnimator";
import QuizGenerator from "./pages/QuizGenerator";
import LearningResourceGenerator from "./pages/LearningResourceGenerator";
import FlashCardGenerator from "./pages/FlashCardGenerator";
import GameZone from "./pages/GameZone";
import News from "./pages/News";
import HearAndLearn from "./pages/HearAndLearn";
import LiveDoubtSession from "./pages/LiveDoubtSession";
import Profile from "./pages/Profile";
import StudyRoomsList from "./pages/StudyRoomsList";
import StudyRoom from "./pages/StudyRoom";
import FlowchartGenerator from "./pages/FlowchartGenerator";
import CourseGenerator from "./pages/CourseGenerator";
import { Menu } from "lucide-react";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
};

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route
          path="/auth"
          element={!isAuthenticated ? <Auth /> : <Navigate to="/" replace />}
        />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <SidebarProvider>
                <div className="flex min-h-screen w-full">
                  {/* Global hamburger trigger - always visible */}
                  <div className="fixed top-4 left-4 z-50 md:hidden">
                    <SidebarTrigger className="p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform">
                      <Menu className="w-5 h-5" />
                    </SidebarTrigger>
                  </div>

                  <AppSidebar />

                  <main className="flex-1 overflow-auto">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/feature/:featureId" element={<FeatureDetail />} />
                      <Route path="/read-book" element={<ReadBook />} />
                      <Route path="/question-bot" element={<QuestionBot />} />
                      <Route path="/concept-animator" element={<ConceptAnimator />} />
                      <Route path="/quiz-generator" element={<QuizGenerator />} />
                      <Route path="/recommendations" element={<LearningResourceGenerator />} />
                      <Route path="/flashcards" element={<FlashCardGenerator />} />
                      <Route path="/course-generator" element={<CourseGenerator />} />
                      <Route path="/game-zone" element={<GameZone />} />
                      <Route path="/news" element={<News />} />
                      <Route path="/hear-and-learn" element={<HearAndLearn />} />
                      <Route path="/live-doubt" element={<LiveDoubtSession />} />
                      <Route path="/study-rooms" element={<StudyRoomsList />} />
                      <Route path="/study-room/:roomId" element={<StudyRoom />} />
                      <Route path="/flowchart-generator" element={<FlowchartGenerator />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                </div>
              </SidebarProvider>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SocketProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </SocketProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
