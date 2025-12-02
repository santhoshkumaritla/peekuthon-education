# LearnNest Deployment Guide

This guide will help you deploy the LearnNest application with **Backend on Render** and **Frontend on Netlify**.

---

## 📋 Prerequisites

Before deploying, ensure you have:

- GitHub account (to connect your repository)
- MongoDB Atlas account with connection string
- Render account (free tier available)
- Netlify account (free tier available)
- All API keys (Gemini, Twilio - optional)

---

## 🚀 Part 1: Deploy Backend to Render

### Step 1: Prepare Your Repository

1. **Push your code to GitHub** (if not already done):
   ```bash
   cd c:\Users\itlas\Desktop\learnnest-dashboard-main
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/learnnest-dashboard.git
   git push -u origin main
   ```

### Step 2: Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `learnnest-backend`
   - **Root Directory**: `Backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free` (or your preferred plan)

### Step 3: Configure Environment Variables

In Render dashboard, add these environment variables:

| Key            | Value                                                    |
| -------------- | -------------------------------------------------------- |
| `NODE_ENV`     | `production`                                             |
| `MONGODB_URI`  | Your MongoDB Atlas connection string                     |
| `PORT`         | `5000`                                                   |
| `FRONTEND_URL` | (Leave empty for now, will add after deploying frontend) |

**Example MongoDB URI:**

```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/learnnest?retryWrites=true&w=majority
```

### Step 4: Deploy Backend

1. Click **"Create Web Service"**
2. Wait for deployment to complete (5-10 minutes)
3. Copy your backend URL (e.g., `https://learnnest-backend.onrender.com`)
4. Test the health endpoint: `https://learnnest-backend.onrender.com/api/health`

> ⚠️ **Note**: Free tier Render services spin down after 15 minutes of inactivity. First request may take 30-60 seconds.

---

## 🌐 Part 2: Deploy Frontend to Netlify

### Step 1: Configure Environment Variables for Production

You'll need to add environment variables in Netlify dashboard after connecting your site.

### Step 2: Deploy to Netlify

#### Option A: Using Netlify Dashboard (Recommended)

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub repository
4. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
5. Click **"Deploy site"**

#### Option B: Using Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy from frontend directory
cd frontend
netlify deploy --prod
```

### Step 3: Configure Frontend Environment Variables

In Netlify dashboard:

1. Go to **Site settings** → **Environment variables**
2. Add all variables from `.env.production`:

**Backend Configuration:**

```
VITE_API_BASE_URL=https://learnnest-backend.onrender.com/api
VITE_SOCKET_URL=https://learnnest-backend.onrender.com
```

**Gemini API Keys** (use your actual keys from .env.local):

```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_GEMINI_QUESTIONBOT_API_KEY=your_gemini_api_key_here
VITE_GEMINI_QUIZ_API_KEY=your_gemini_api_key_here
VITE_GEMINI_LEARNING_API_KEY=your_gemini_api_key_here
VITE_GEMINI_HEAR_API_KEY=your_gemini_api_key_here
VITE_GEMINI_FLASHCARD_API_KEY=your_gemini_api_key_here
VITE_GEMINI_CONCEPT_API_KEY=your_gemini_api_key_here
VITE_GEMINI_GAMES_API_KEY=your_gemini_api_key_here
```

**Twilio SMS** (optional - use your actual credentials):

```
VITE_TWILIO_ACCOUNT_SID=your_twilio_account_sid
VITE_TWILIO_AUTH_TOKEN=your_twilio_auth_token
VITE_TWILIO_FROM_NUMBER=your_twilio_phone_number
```

3. Click **"Save"**
4. Trigger a new deploy: **Deploys** → **Trigger deploy** → **Deploy site**

### Step 4: Update Backend CORS Settings

1. Go back to **Render Dashboard**
2. Select your backend service
3. Add environment variable:
   - **Key**: `FRONTEND_URL`
   - **Value**: Your Netlify URL (e.g., `https://learnnest.netlify.app`)
4. Click **"Save Changes"** (this will redeploy your backend)

---

## ✅ Verification & Testing

### Test Backend

Visit: `https://your-backend.onrender.com/api/health`

Expected response:

```json
{
  "success": true,
  "message": "LearnNest API is running",
  "timestamp": "2025-12-01T..."
}
```

### Test Frontend

1. Visit your Netlify URL
2. Try to register/login
3. Test features like Quiz Generator, Flashcards, etc.
4. Check browser console for any errors

### Common Issues

**Issue: CORS errors**

- Solution: Ensure `FRONTEND_URL` is set correctly in Render backend

**Issue: API requests failing**

- Solution: Check `VITE_API_BASE_URL` in Netlify environment variables
- Ensure backend is awake (first request may be slow on free tier)

**Issue: Features not working**

- Solution: Verify all Gemini API keys are added in Netlify

**Issue: Backend sleeps (Render free tier)**

- Solution: Use a service like [UptimeRobot](https://uptimerobot.com/) to ping your backend every 5 minutes

---

## 🔄 Continuous Deployment

Both Render and Netlify support auto-deployment:

- **Push to GitHub** → Automatic deployment triggers
- **Monitor deployments** in respective dashboards
- **Check logs** if deployment fails

---

## 📊 Post-Deployment

### Update Local Environment

For local development, keep using `.env.local` with `localhost` URLs.

### Monitor Your Services

**Render:**

- View logs: Dashboard → Your service → Logs
- Monitor metrics: Dashboard → Your service → Metrics

**Netlify:**

- View logs: Dashboard → Your site → Deploys → (Click deploy) → Deploy log
- Check analytics: Dashboard → Your site → Analytics

---

## 🔒 Security Recommendations

1. **Never commit API keys** to GitHub

   - Keys in this guide are already exposed - consider rotating them
   - Use `.env.local` and `.env.production` (both in .gitignore)

2. **Rotate Twilio credentials** if exposed publicly

3. **Set up MongoDB IP whitelist** to allow Render IPs

4. **Enable Netlify password protection** for staging deployments

---

## 💰 Cost Breakdown

**Free Tier Limits:**

- **Render**: 750 hours/month, sleeps after 15 min inactivity
- **Netlify**: 100 GB bandwidth, 300 build minutes/month
- **MongoDB Atlas**: 512 MB storage, free forever

**Upgrade Recommendations:**

- Render: $7/month for always-on backend
- Netlify: $19/month for better performance
- MongoDB Atlas: $9/month for 2 GB storage

---

## 📞 Support

If you encounter issues:

1. Check deployment logs in Render/Netlify dashboard
2. Verify all environment variables are set correctly
3. Test backend health endpoint
4. Check browser console for frontend errors

---

## 🎉 Deployment Complete!

Your LearnNest application is now live:

- **Backend**: `https://your-backend.onrender.com`
- **Frontend**: `https://your-site.netlify.app`

Share your deployed app and start learning! 🚀
