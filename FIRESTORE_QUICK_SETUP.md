# 🔥 Firestore Quick Setup Guide

## Step-by-Step Setup for Browns Fleet Tracker

### 1. Create Google Cloud Project
1. Go to: https://console.cloud.google.com
2. Click "Select a project" → "New Project"
3. Name: `browns-fleet-tracker` (or your preferred name)
4. **Copy your Project ID** (you'll need this)

### 2. Enable Firestore
1. Go to: https://console.cloud.google.com/firestore
2. Select your project
3. Click "Create database"
4. Choose **Native mode**
5. Select location (choose closest to you)
6. Click "Create"

### 3. Set Up Authentication (Choose ONE option)

#### Option A: Service Account (Recommended)
1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Click "Create Service Account"
3. Name: `fleet-tracker-service`
4. Click "Create and Continue"
5. Grant role: `Cloud Datastore User`
6. Click "Continue" → "Done"
7. Click on your service account → "Keys" tab → "Add Key" → "Create new key" → "JSON"
8. **Download and save the JSON file securely**

#### Option B: Application Default Credentials (Easier)
1. Install Google Cloud CLI: https://cloud.google.com/sdk/docs/install
2. Run: `gcloud auth application-default login`
3. Follow the authentication flow

### 4. Configure Your App
1. Copy environment file:
   ```bash
   cp env.example .env.local
   ```

2. Edit `.env.local` with your details:
   ```bash
   # Database Configuration
   DB_TYPE=firestore
   
   # Replace with your actual project ID
   GOOGLE_CLOUD_PROJECT_ID=your-project-id-here
   
   # If using service account (Option A), uncomment and update path:
   # GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json
   ```

### 5. Install Dependencies and Test
1. Install dependencies:
   ```bash
   npm install
   ```

2. Test your Firestore connection:
   ```bash
   npm run setup-firestore
   ```

3. If successful, start your app:
   ```bash
   npm run dev
   ```

4. Visit: http://localhost:3000/api/init to verify everything works

## 🎉 You're Done!

Your fleet tracker is now using Firestore for unlimited, scalable data storage!

## Troubleshooting

### "Project not found" error:
- Double-check your Project ID in `.env.local`
- Make sure the project exists in Google Cloud Console

### "Permission denied" error:
- Ensure Firestore API is enabled in your project
- Check your service account has `Cloud Datastore User` role
- For Application Default Credentials, make sure you're logged in: `gcloud auth application-default login`

### "Credentials not found" error:
- Check the path to your service account key file
- Make sure the JSON file is valid and not corrupted

## Production Deployment (Vercel)

1. In Vercel dashboard, go to your project settings
2. Add environment variables:
   - `DB_TYPE=firestore`
   - `GOOGLE_CLOUD_PROJECT_ID=your-project-id`
3. Deploy: `vercel --prod`

That's it! Your fleet tracker will now use Firestore in production. 🚛📊
