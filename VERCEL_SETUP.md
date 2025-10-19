# 🚀 Vercel Deployment Setup for Multi-User Fleet Tracker

## Environment Variables Setup

To enable Firestore for multiple users, you need to configure these environment variables in Vercel:

### 1. Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Select your `browns-fleet-tracker` project
3. Go to **Settings** → **Environment Variables**

### 2. Add These Environment Variables

#### Required Variables:
```
DB_TYPE=firestore
GOOGLE_CLOUD_PROJECT_ID=fleet-tracker-475514
GOOGLE_APPLICATION_CREDENTIALS=[JSON content from your service-account-key.json file]
```

**⚠️ IMPORTANT:** For `GOOGLE_APPLICATION_CREDENTIALS`, copy the entire contents of your `service-account-key.json` file as a single-line JSON string.

### 3. Set Environment for All Environments
Make sure to set these variables for:
- **Production** ✅
- **Preview** ✅  
- **Development** ✅

### 4. Redeploy Your App
After adding the environment variables:
```bash
vercel --prod
```

## 🎉 That's It!

Once deployed, your fleet tracker will:
- ✅ Store all data in Firestore (shared across all users)
- ✅ Persist data across browser refreshes
- ✅ Work for multiple users simultaneously
- ✅ Scale automatically with Google Cloud

## Testing
After deployment, test by:
1. Adding a vehicle
2. Refreshing the page
3. Checking that the vehicle is still there
4. Having another user access the app and see the same data

## Troubleshooting
If you see "Database initialization failed":
- Check that all environment variables are set correctly
- Make sure the service account has proper permissions
- Verify the Firestore database is created and active
