# Deployment Instructions

## Option 1: Vercel CLI (Recommended)

1. **Install Vercel CLI globally:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy to production:**
   ```bash
   vercel --prod
   ```

## Option 2: Vercel Dashboard

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect the configuration

## Option 3: Manual Upload

1. **Prepare for upload:**
   ```bash
   # Remove development files
   rm -rf node_modules/
   rm database.sqlite
   rm script-backup.js
   rm script-localstorage.js
   ```

2. **Upload to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in
   - Click "New Project"
   - Choose "Upload" option
   - Drag and drop your project folder

## Configuration

The project is already configured for Vercel with:
- `vercel.json` - Deployment configuration
- `package.json` - Dependencies and scripts
- SQLite database will be created automatically on first run

## Environment Variables

No environment variables are required for basic functionality.

## Database

- SQLite database is created automatically
- Data is ephemeral (resets on each deployment)
- For persistent data, consider upgrading to a paid Vercel plan with external database

## Post-Deployment

After deployment, your app will be available at:
- `https://your-project-name.vercel.app`

The API endpoints will be available at:
- `https://your-project-name.vercel.app/api/health`
- `https://your-project-name.vercel.app/api/sources`
- etc.
