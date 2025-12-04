// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Export API_BASE_URL for use in components
export { API_BASE_URL };

// Helper function to get current user ID
export const getCurrentUserId = (): string => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user._id;
    }
  } catch (error) {
    console.error('Error getting user ID:', error);
  }
  return '';
};

// Helper function for API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Book API
export const bookAPI = {
  create: (bookData: any) => 
    apiCall('/books', { method: 'POST', body: JSON.stringify(bookData) }),
  
  getUserBooks: (userId: string) => 
    apiCall(`/books/user/${userId}`),
  
  getById: (id: string) => 
    apiCall(`/books/${id}`),
  
  delete: (id: string) => 
    apiCall(`/books/${id}`, { method: 'DELETE' }),
};

// Quiz API
export const quizAPI = {
  create: (quizData: any) => 
    apiCall('/quizzes', { method: 'POST', body: JSON.stringify(quizData) }),
  
  getUserQuizzes: (userId: string) => 
    apiCall(`/quizzes/user/${userId}`),
  
  updateScore: (id: string, score: number) => 
    apiCall(`/quizzes/${id}/score`, { 
      method: 'PATCH', 
      body: JSON.stringify({ score }) 
    }),
};

// Flashcard API
export const flashcardAPI = {
  create: (flashcardData: any) => 
    apiCall('/flashcards', { method: 'POST', body: JSON.stringify(flashcardData) }),
  
  getUserFlashcards: (userId: string) => 
    apiCall(`/flashcards/user/${userId}`),
};

// Chat API
export const chatAPI = {
  saveMessages: (userId: string, messages: any[]) => 
    apiCall('/chats', { 
      method: 'POST', 
      body: JSON.stringify({ userId, messages }) 
    }),
  
  getChatHistory: (userId: string) => 
    apiCall(`/chats/user/${userId}`),
};

// Learning Resource API
export const learningResourceAPI = {
  create: (resourceData: any) => 
    apiCall('/learning-resources', { 
      method: 'POST', 
      body: JSON.stringify(resourceData) 
    }),
  
  getUserResources: (userId: string) => 
    apiCall(`/learning-resources/user/${userId}`),
};

// Game Score API
export const gameScoreAPI = {
  saveScore: (scoreData: any) => 
    apiCall('/game-scores', { method: 'POST', body: JSON.stringify(scoreData) }),
  
  getUserScores: (userId: string) => 
    apiCall(`/game-scores/user/${userId}`),
  
  getLeaderboard: (gameType: string) => 
    apiCall(`/game-scores/leaderboard/${gameType}`),
};

// Concept Animation API
export const conceptAPI = {
  create: (conceptData: any) => 
    apiCall('/concepts', { method: 'POST', body: JSON.stringify(conceptData) }),
  
  getUserConcepts: (userId: string) => 
    apiCall(`/concepts/user/${userId}`),
};

// Course API
export const courseAPI = {
  create: (courseData: any) => 
    apiCall('/courses', { method: 'POST', body: JSON.stringify(courseData) }),
  
  getUserCourses: (userId: string) => 
    apiCall(`/courses?userId=${userId}`),
  
  getById: (id: string) => 
    apiCall(`/courses/${id}`),
  
  markComplete: (id: string) => 
    apiCall(`/courses/${id}/complete`, { method: 'PATCH' }),
  
  getStats: (userId: string) => 
    apiCall(`/courses/stats/${userId}`),
  
  delete: (id: string) => 
    apiCall(`/courses/${id}`, { method: 'DELETE' }),
};

// Health check
export const healthCheck = () => apiCall('/health');
