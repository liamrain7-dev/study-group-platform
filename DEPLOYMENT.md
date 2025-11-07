# Deployment Guide

This guide will help you deploy your Study Group Platform so others can use it online.

## Recommended Deployment Strategy

**Frontend (React):** Vercel or Netlify (free, easy)
**Backend (Node.js):** Render or Railway (free tier available)
**Database:** MongoDB Atlas (already set up ✅)

---

## Option 1: Deploy to Vercel (Frontend) + Render (Backend) - RECOMMENDED

### Step 1: Prepare for Deployment

1. **Update API URL for production:**
   - The frontend needs to know where the backend is hosted
   - We'll set this as an environment variable

2. **Create environment variables file:**
   - Create `.env.production` in the client folder (we'll use this later)

### Step 2: Deploy Backend to Render

1. **Create a Render account:**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub (recommended)

2. **Prepare your backend:**
   - Make sure your code is pushed to GitHub
   - Your `server/.env` file should NOT be committed (it's already in .gitignore)

3. **Deploy on Render:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repository
   - Configure:
     - **Name:** study-group-server (or any name)
     - **Environment:** Node
     - **Build Command:** `cd server && npm install`
     - **Start Command:** `cd server && npm start`
     - **Root Directory:** (leave empty)
   
4. **Add Environment Variables in Render:**
   - Click "Environment" tab
   - Add these variables:
     ```
     PORT=10000
     MONGODB_URI=your-mongodb-connection-string
     JWT_SECRET=your-jwt-secret-key
     NODE_ENV=production
     ```
   - Use the same values from your `server/.env` file

5. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Copy your service URL (e.g., `https://study-group-server.onrender.com`)

### Step 3: Deploy Frontend to Vercel

1. **Create a Vercel account:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Update client API configuration:**
   - We need to make the API URL configurable

3. **Deploy on Vercel:**
   - Click "Add New Project"
   - Import your GitHub repository
   - Configure:
     - **Framework Preset:** Create React App
     - **Root Directory:** `client`
     - **Build Command:** `npm run build`
     - **Output Directory:** `build`
   
4. **Add Environment Variables in Vercel:**
   - Go to Project Settings → Environment Variables
   - Add:
     ```
     REACT_APP_API_URL=https://your-render-backend-url.onrender.com/api
     ```
   - Replace with your actual Render backend URL

5. **Deploy:**
   - Click "Deploy"
   - Wait for deployment (2-5 minutes)
   - Your app will be live at a URL like `https://your-app.vercel.app`

### Step 4: Update CORS in Backend

Update `server/index.js` to allow your Vercel domain:

```javascript
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "https://your-app.vercel.app"],
    methods: ["GET", "POST"]
  }
});
```

Also update CORS middleware:
```javascript
app.use(cors({
  origin: ["http://localhost:3000", "https://your-app.vercel.app"],
  credentials: true
}));
```

---

## Option 2: Deploy Everything to Render (Simpler)

### Deploy Backend (same as Option 1, Step 2)

### Deploy Frontend on Render

1. **Create a new Static Site on Render:**
   - Click "New +" → "Static Site"
   - Connect GitHub repository
   - Configure:
     - **Name:** study-group-app
     - **Build Command:** `cd client && npm install && npm run build`
     - **Publish Directory:** `client/build`
   
2. **Add Environment Variables:**
   - `REACT_APP_API_URL=https://your-backend-url.onrender.com/api`

3. **Deploy**

---

## Option 3: Deploy to Railway (All-in-One)

1. **Create Railway account:** [railway.app](https://railway.app)

2. **Deploy Backend:**
   - New Project → Deploy from GitHub
   - Select repository
   - Set root directory to `server`
   - Add environment variables (same as Render)
   - Deploy

3. **Deploy Frontend:**
   - Add another service
   - Root directory: `client`
   - Build command: `npm install && npm run build`
   - Start command: `npx serve -s build`
   - Add environment variable: `REACT_APP_API_URL`

---

## Important Notes

### Before Deploying:

1. **Update MongoDB Atlas IP Whitelist:**
   - Go to MongoDB Atlas → Network Access
   - Add `0.0.0.0/0` to allow connections from anywhere (or add Render/Vercel IPs)

2. **Update server code for production:**
   - Make sure CORS allows your frontend domain
   - Update Socket.io CORS settings

3. **Test locally first:**
   - Make sure everything works on your machine

### After Deploying:

1. **Test the deployed app:**
   - Try registering a new user
   - Test all features

2. **Share your URL:**
   - Share the frontend URL (Vercel/Render) with others
   - They can access it from anywhere!

---

## Quick Deploy Commands

If you want to deploy right now, here's the fastest path:

1. **Push code to GitHub** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy backend to Render** (follow Step 2 above)

3. **Deploy frontend to Vercel** (follow Step 3 above)

4. **Update CORS** in your backend code

5. **Redeploy** both services

---

## Troubleshooting

- **CORS errors:** Make sure backend CORS includes your frontend URL
- **API not connecting:** Check environment variables are set correctly
- **Database connection:** Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- **Build fails:** Check build logs for missing dependencies

---

## Free Tier Limits

- **Vercel:** Unlimited for personal projects
- **Render:** Free tier has limitations (spins down after inactivity)
- **Railway:** $5/month free credit
- **MongoDB Atlas:** Free tier (512MB storage)

For production use, consider upgrading to paid tiers for better performance.

