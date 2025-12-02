// API Configuration and Validation

export const API_CONFIG = {
  gemini: {
    main: import.meta.env.VITE_GEMINI_API_KEY || "",
    questionBot: import.meta.env.VITE_GEMINI_QUESTIONBOT_API_KEY || "",
    quiz: import.meta.env.VITE_GEMINI_QUIZ_API_KEY || "",
    learning: import.meta.env.VITE_GEMINI_LEARNING_API_KEY || "",
    hear: import.meta.env.VITE_GEMINI_HEAR_API_KEY || "",
    flashcard: import.meta.env.VITE_GEMINI_FLASHCARD_API_KEY || "",
    concept: import.meta.env.VITE_GEMINI_CONCEPT_API_KEY || "",
    games: import.meta.env.VITE_GEMINI_GAMES_API_KEY || "",
  },
  twilio: {
    accountSid: import.meta.env.VITE_TWILIO_ACCOUNT_SID || "",
    authToken: import.meta.env.VITE_TWILIO_AUTH_TOKEN || "",
    fromNumber: import.meta.env.VITE_TWILIO_FROM_NUMBER || "",
  },
};

export const validateApiKey = (key: string, featureName: string): boolean => {
  if (!key) {
    console.error(
      `❌ Missing API key for ${featureName}. Please configure it in .env.local file.\n` +
      `See API_SETUP.md for instructions.`
    );
    return false;
  }
  return true;
};

export const isTwilioConfigured = (): boolean => {
  return !!(
    API_CONFIG.twilio.accountSid &&
    API_CONFIG.twilio.authToken &&
    API_CONFIG.twilio.fromNumber
  );
};
