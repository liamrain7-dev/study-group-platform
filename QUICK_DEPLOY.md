# Quick Deployment Guide

## Fastest Way to Deploy (5 Steps)

### 1. Push Code to GitHub

```bash
git init
git add .
git commit -m "Ready for deployment"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 2. Deploy Backend to Render

1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Settings:
   - **Name:** study-group-server
   - **Root Directory:** (leave empty)
   - **Environment:** Node
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `cd server && npm start`
5. Add Environment Variables:
   - `PORT` = `10000`
   - `MONGODB_URI` = (your MongoDB connection string)
   - `JWT_SECRET` = (your secret key)
   - `FRONTEND_URL` = (you'll add this after deploying frontend)
   - `NODE_ENV` = `production`
6. Click "Create Web Service"
7. **Copy your backend URL** (e.g., `https://study-group-server.onrender.com`)

### 3. Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click "Add New Project"
3. Import your GitHub repo
4. Settings:
   - **Framework Preset:** Create React App
   - **Root Directory:** `client`
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `build` (auto-detected)
5. Add Environment Variable:
   - `REACT_APP_API_URL` = `https://your-backend-url.onrender.com/api`
6. Click "Deploy"
7. **Copy your frontend URL** (e.g., `https://your-app.vercel.app`)

### 4. Update Backend CORS

1. Go back to Render dashboard
2. Edit your backend service
3. Update Environment Variable:
   - `FRONTEND_URL` = `https://your-app.vercel.app`
4. Save and redeploy

### 5. Update MongoDB Atlas

1. Go to MongoDB Atlas → Network Access
2. Add IP Address: `0.0.0.0/0` (allow from anywhere)
3. Save

## Done! 🎉

Share your Vercel URL with others: `https://your-app.vercel.app`

---

## Troubleshooting

- **CORS errors?** Make sure `FRONTEND_URL` in backend matches your Vercel URL
- **API not working?** Check `REACT_APP_API_URL` in Vercel matches your Render URL
- **Database errors?** Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`

