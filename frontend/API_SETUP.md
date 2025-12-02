# API Configuration Guide

This guide will help you set up all the required API keys for the LearnNest Dashboard.

## 🔑 Required API Keys

### 1. Google Gemini API Keys

You can use the same API key for all features or create separate keys for better tracking.

**Get your API keys:**

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

**Features that need Gemini API:**

- Read Book (`VITE_GEMINI_API_KEY`)
- Question Bot (`VITE_GEMINI_QUESTIONBOT_API_KEY`)
- Quiz Generator (`VITE_GEMINI_QUIZ_API_KEY`)
- Learning Resource Generator (`VITE_GEMINI_LEARNING_API_KEY`)
- Hear and Learn (`VITE_GEMINI_HEAR_API_KEY`)
- Flash Card Generator (`VITE_GEMINI_FLASHCARD_API_KEY`)
- Concept Animator (`VITE_GEMINI_CONCEPT_API_KEY`)
- Games (Aptitude & GK Test) (`VITE_GEMINI_GAMES_API_KEY`)

### 2. Twilio SMS Configuration (Optional)

Used for sending SMS notifications to parents.

**Get your credentials:**

1. Visit [Twilio Console](https://www.twilio.com/console)
2. Sign up or log in
3. Get your:
   - Account SID (starts with "AC...")
   - Auth Token
   - Phone Number (from Twilio)

## 📝 Setup Instructions

### Step 1: Copy the environment file

```powershell
Copy-Item .env.example .env.local
```

### Step 2: Edit `.env.local`

Open `.env.local` and replace all `your_api_key_here` values with your actual API keys.

**Quick Setup (Same key for all features):**
If you want to use the same Gemini API key for all features:

```env
# Use the same key for all Gemini features
VITE_GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_GEMINI_QUESTIONBOT_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_GEMINI_QUIZ_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_GEMINI_LEARNING_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_GEMINI_HEAR_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_GEMINI_FLASHCARD_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_GEMINI_CONCEPT_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_GEMINI_GAMES_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Twilio (Optional - for SMS features)
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_FROM_NUMBER=+1234567890
```

### Step 3: Restart the development server

```powershell
npm run dev
```

## ⚠️ Important Notes

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **API Key Limits** - Gemini API has free tier limits. Monitor your usage at [Google AI Studio](https://makersuite.google.com/app/apikey)
3. **Twilio is Optional** - SMS features will fail silently if not configured
4. **Security** - Keep your API keys private and never share them publicly

## 🔧 Troubleshooting

### "403 Forbidden" Error

- Your API key is invalid, expired, or has been reported as leaked
- Create a new API key from Google AI Studio
- Make sure you copied the key correctly

### "401 Unauthorized" (Twilio)

- Check your Twilio credentials are correct
- Verify your Twilio account is active
- Make sure you have sufficient balance

### Features Not Working

1. Check if `.env.local` file exists
2. Verify all required keys are filled in
3. Restart the development server after editing `.env.local`
4. Check browser console for specific error messages

## 📚 Additional Resources

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Twilio API Documentation](https://www.twilio.com/docs)
