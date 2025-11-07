# How to Create GitHub Repository and Push Code

## Step 1: Create the Repository on GitHub

1. **Go to GitHub:**
   - Open your browser and go to [github.com](https://github.com)
   - Sign in (or create an account if you don't have one)

2. **Create New Repository:**
   - Click the **"+"** icon in the top right corner
   - Click **"New repository"**

3. **Fill in the details:**
   - **Repository name:** `study-group-platform` (or any name you like)
   - **Description:** (optional) "Study group platform for university students"
   - **Visibility:** Choose **Public** (free) or **Private** (if you have GitHub Pro)
   - **IMPORTANT:** Do NOT check:
     - ❌ "Add a README file"
     - ❌ "Add .gitignore"
     - ❌ "Choose a license"
   - Leave all of these unchecked!

4. **Click "Create repository"**

5. **Copy the Repository URL:**
   - After creating, GitHub will show you a page with setup instructions
   - You'll see a URL that looks like one of these:
     - `https://github.com/YOUR_USERNAME/study-group-platform.git`
     - `git@github.com:YOUR_USERNAME/study-group-platform.git`
   - **Copy the HTTPS URL** (the one starting with `https://`)
   - Example: `https://github.com/liamrainesh/study-group-platform.git`

## Step 2: Connect Your Local Code to GitHub

Once you have the URL, run these commands in your terminal:

```bash
cd /Users/liamrainesh/Documents/Curser.demo
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**Replace:**
- `YOUR_USERNAME` = Your GitHub username (e.g., `liamrainesh`)
- `YOUR_REPO_NAME` = The repository name you created (e.g., `study-group-platform`)

**Example:**
If your username is `liamrainesh` and your repo is `study-group-platform`, the command would be:
```bash
git remote add origin https://github.com/liamrainesh/study-group-platform.git
git branch -M main
git push -u origin main
```

## What Each Command Does:

- `git remote add origin ...` = Connects your local code to the GitHub repository
- `git branch -M main` = Renames your branch to "main" (GitHub's default)
- `git push -u origin main` = Uploads your code to GitHub

## After Pushing:

- Your code will be on GitHub!
- You can see it at: `https://github.com/YOUR_USERNAME/study-group-platform`
- Now you can deploy it to Render and Vercel!

