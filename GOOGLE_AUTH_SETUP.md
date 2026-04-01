# Google OAuth 2.0 Sign-In Setup Guide

## Prerequisites
- Google Cloud Project with OAuth 2.0 credentials

## Step-by-Step Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (if not already enabled)

### 2. Create OAuth 2.0 Credentials
1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Choose **Web application**
4. Add authorized redirect URIs:
   - `http://localhost:5173` (local development)
   - `http://localhost:5174` (if using different port)
   - `https://yourdomain.com` (production)
   - `https://www.yourdomain.com` (production with www)
5. Copy the **Client ID**

### 3. Configure Environment Variables

Create or update `.env.local` in the `frontend/` directory:

```bash
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
```

Replace `YOUR_GOOGLE_CLIENT_ID_HERE` with the Client ID from Step 2.

### 4. Verify Installation

The following dependencies should already be installed (check `frontend/package.json`):
- `@react-oauth/google` - ^0.12.2 or higher
- `react-hot-toast` - for notifications
- `framer-motion` - for animations

### 5. Test Google Sign-In

1. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Open the application and click on:
   - **"Continue with Google"** on the login form
   - **"Sign up with Google"** on the signup form

3. Follow the Google sign-in flow

### 6. Troubleshooting

#### Issue: "popup_blocked_by_browser" or button does nothing
- Check if `VITE_GOOGLE_CLIENT_ID` is properly set
- Verify the Client ID in `.env.local`
- Restart the dev server after changing environment variables

#### Issue: "invalid_client" error
- Verify the Client ID matches your Google Cloud Console settings
- Ensure the redirect URI (localhost:5173) is added to authorized origins

#### Issue: CORS errors
- Add your application's origin to Google Cloud Console's authorized JavaScript origins
- Go to **APIs & Services > Credentials > OAuth 2.0 Client IDs**
- Edit the web client and add your domain under "Authorized JavaScript origins"

### 7. Production Deployment

For production:
1. Add your production domain to Google Cloud Console:
   - Authorized JavaScript origins: `https://yourdomain.com`
   - Authorized redirect URIs: `https://yourdomain.com/callback`

2. Set the `VITE_GOOGLE_CLIENT_ID` environment variable in your production deployment

## Features Implemented

✅ Google login on login page
✅ Google sign-up on signup page  
✅ Auto-fill user name from Google profile
✅ Auto-redirect to home after successful login
✅ Error handling with user-friendly messages

## User Experience Flow

**Login with Google:**
1. User clicks "Continue with Google" button
2. Google OAuth consent screen appears
3. User grants permission
4. User is automatically logged in and redirected to home page

**Sign-up with Google:**
1. User clicks "Sign up with Google" button
2. Google OAuth consent screen appears  
3. User grants permission
4. User creates account with email/name from Google
5. User is logged in and redirected to home page
