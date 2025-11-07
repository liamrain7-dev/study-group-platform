# Step-by-Step Deployment Instructions

Follow these steps to get your app online:

## Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the "+" icon → "New repository"
3. Name it: `study-group-platform` (or any name you like)
4. **Don't** initialize with README, .gitignore, or license
5. Click "Create repository"
6. **Copy the repository URL** (looks like: `https://github.com/yourusername/study-group-platform.git`)

## Step 2: Push Code to GitHub

Run these commands in your terminal (replace with your actual GitHub URL):

```bash
cd /Users/liamrainesh/Documents/Curser.demo
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy Backend to Render

1. **Sign up at Render:**
   - Go to [render.com](https://render.com)
   - Click "Get Started for Free"
   - Sign up with GitHub (recommended)

2. **Create Web Service:**
   - Click "New +" button → "Web Service"
   - Connect your GitHub account if not already connected
   - Find and select your repository: `study-group-platform`
   - Click "Connect"

3. **Configure the service:**
   - **Name:** `study-group-server` (or any name)
   - **Region:** Choose closest to you (e.g., Oregon)
   - **Branch:** `main`
   - **Root Directory:** (leave empty)
   - **Environment:** `Node`
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `cd server && npm start`

4. **Add Environment Variables:**
   Click "Advanced" → "Add Environment Variable" and add:
   
   ```
   PORT = 10000
   ```
   
   ```
   MONGODB_URI = mongodb+srv://liamrain7_db_user:PLTpWZzIh5lpl58y@project1.t8zqzsx.mongodb.net/study-groups?retryWrites=true&w=majority
   ```
   
   ```
   JWT_SECRET = mySecretKey123!@#studyGroups2024
   ```
   
   ```
   NODE_ENV = production
   ```
   
   ```
   FRONTEND_URL = https://your-app.vercel.app
   ```
   (You'll update this after deploying frontend - use a placeholder for now)

5. **Deploy:**
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - **Copy your service URL** (e.g., `https://study-group-server.onrender.com`)
   - Save this URL - you'll need it for the frontend!

## Step 4: Deploy Frontend to Vercel

1. **Sign up at Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Sign Up"
   - Sign up with GitHub

2. **Import Project:**
   - Click "Add New..." → "Project"
   - Find your repository: `study-group-platform`
   - Click "Import"

3. **Configure Project:**
   - **Framework Preset:** Create React App (should auto-detect)
   - **Root Directory:** `client` (IMPORTANT - change this!)
   - **Build Command:** `npm run build` (auto-filled)
   - **Output Directory:** `build` (auto-filled)

4. **Add Environment Variable:**
   - Click "Environment Variables"
   - Add new variable:
     - **Key:** `REACT_APP_API_URL`
     - **Value:** `https://YOUR-RENDER-URL.onrender.com/api`
     - Replace `YOUR-RENDER-URL` with your actual Render backend URL from Step 3
   - Click "Save"

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-5 minutes
   - **Copy your Vercel URL** (e.g., `https://study-group-platform.vercel.app`)
   - This is your live app URL! 🎉

## Step 5: Update Backend CORS

1. Go back to [render.com](https://render.com) dashboard
2. Click on your backend service
3. Go to "Environment" tab
4. Edit the `FRONTEND_URL` variable:
   - Change it to your actual Vercel URL (e.g., `https://study-group-platform.vercel.app`)
5. Click "Save Changes"
6. The service will automatically redeploy (wait 2-3 minutes)

## Step 6: Update MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click "Network Access" in the left sidebar
3. Click "Add IP Address"
4. Enter: `0.0.0.0/0`
5. Add comment: "Allow from anywhere for deployment"
6. Click "Confirm"

## Step 7: Test Your Live App!

1. Open your Vercel URL in a browser
2. Try registering a new account
3. Test all features
4. Share the URL with others! 🚀

---

## Your Live URLs:

- **Frontend (Vercel):** `https://your-app.vercel.app`
- **Backend (Render):** `https://your-backend.onrender.com`

Share the **Vercel URL** with others - that's your app!

---

## Troubleshooting

### If you see CORS errors:
- Make sure `FRONTEND_URL` in Render matches your exact Vercel URL (including https://)

### If API calls fail:
- Check `REACT_APP_API_URL` in Vercel matches your Render URL + `/api`
- Make sure backend is deployed and running (check Render dashboard)

### If database connection fails:
- Verify MongoDB Atlas IP whitelist has `0.0.0.0/0`
- Check MongoDB connection string is correct in Render environment variables

### If build fails:
- Check Render/Vercel logs for specific errors
- Make sure all dependencies are in package.json

---

## Need Help?

Check the logs in:
- **Render:** Dashboard → Your Service → "Logs" tab
- **Vercel:** Dashboard → Your Project → "Deployments" → Click deployment → "Build Logs"

