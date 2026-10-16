# Render Production Deployment Guide — MediCore HMS

This guide provides step-by-step instructions for deploying **MediCore Hospital Management System (HMS)** to [Render](https://render.com) using the unified full-stack architecture.

---

## 1. Architecture Overview

MediCore HMS uses a **Single Unified Web Service** architecture on Render:
- **Express Backend**: Serves the REST API (`/api/*`), handles Google OAuth callbacks, executes RBAC authorization, and connects to MongoDB Atlas.
- **Production React SPA**: Express serves the compiled React 19 production bundle from `client/dist`, including SPA routing fallback.
- **Cookie Security**: Because both frontend and backend share the exact same domain on Render (`https://<service>.onrender.com`), authentication cookies (`token`, `oauth_state`) are first-party (`SameSite: 'Lax'`), completely eliminating cross-site cookie blocking on Safari, Chrome, and Firefox.
- **Cost Efficiency**: Runs on a single Free Tier Web Service instance on Render.

---

## 2. Prerequisites

1. **GitHub Repository**:
   - Push your MediCore HMS repository to GitHub on branch `feature/ui-redesign` (or `main`).
2. **Render Account**:
   - Create a free account at [render.com](https://render.com).
3. **MongoDB Atlas Database**:
   - A running MongoDB Atlas cluster.
   - **Crucial**: Network Access must permit traffic from Render (see Section 3).
4. **Google Cloud OAuth Credentials**:
   - Client ID and Client Secret configured according to [GOOGLE_AUTH_SETUP.md](./GOOGLE_AUTH_SETUP.md).

---

## 3. Configure MongoDB Atlas Network Access

Render web services use dynamic IP addresses. MongoDB Atlas must be configured to accept connections from Render:

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. In the left sidebar under **Security**, click **Network Access**.
3. Click **+ Add IP Address**.
4. Click **Allow Access from Anywhere** (`0.0.0.0/0`).
5. Set Comment to: `Render Cloud Web Service`.
6. Click **Confirm**.

> [!TIP]
> Ensure your database user has `readWrite` permissions on the `medicore_db` database.

---

## 4. Deploying on Render (Two Methods)

### Method A: Manual Web Service Setup (Recommended)

1. Log into your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** at the top right and select **Web Service**.
3. Choose **Build and deploy from a Git repository** and connect your GitHub repo `MEDICORE-Hospital-Management-System-`.
4. Configure service settings:
   - **Name**: `medicore-hms` (or your chosen name)
   - **Region**: Choose the region closest to your MongoDB Atlas cluster (e.g. `Oregon (US West)` or `Frankfurt (EU)`)
   - **Branch**: `feature/ui-redesign` (or `main`)
   - **Root Directory**: Leave blank (monorepo root)
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm run render-build
     ```
     *(This command installs dependencies in both `server/` and `client/` and builds both production bundles).*
   - **Start Command**:
     ```bash
     node server/dist/index.js
     ```
   - **Instance Type**: `Free`
5. Click **Advanced** and configure:
   - **Health Check Path**: `/api/health`
   - **Auto-Deploy**: `Yes`
6. Under **Environment Variables**, click **Add Environment Variable** for each of the following:

| Variable Key | Example Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enables production optimizations & secure cookies |
| `PORT` | `10000` | Port provided by Render |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/medicore_db?retryWrites=true&w=majority` | MongoDB Atlas cluster connection string |
| `JWT_SECRET` | *(64-character random string)* | Cryptographic secret for signing session JWTs |
| `JWT_EXPIRES_IN` | `15m` | Token expiration duration |
| `SERVER_PUBLIC_URL` | `https://medicore-hms.onrender.com` | Your public Render service URL *(update after creation)* |
| `CLIENT_ORIGIN` | `https://medicore-hms.onrender.com` | Matches public URL in unified deployment |
| `GOOGLE_CLIENT_ID` | `123456...apps.googleusercontent.com` | Google Cloud Web Client ID |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | Google Cloud Web Client Secret |
| `GOOGLE_CALLBACK_URL` | `https://medicore-hms.onrender.com/api/auth/google/callback` | Callback URI matching Google Cloud Console |

7. Click **Create Web Service**.

---

### Method B: Render Blueprint (`render.yaml`)

If you prefer Infrastructure-as-Code:
1. The repository includes a pre-configured [render.yaml](../render.yaml).
2. On Render Dashboard, click **New +** > **Blueprint**.
3. Connect the repository. Render will automatically detect `render.yaml`.
4. Enter the required secrets (`MONGODB_URI`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) in the prompt.
5. Click **Apply**.

---

## 5. Post-Deployment Configuration

### A. Obtain Your Public URL
Once Render completes building, your service will have a public URL in the top left:
```
https://medicore-hms.onrender.com
```

### B. Update Google Cloud Console
Open your [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials):
1. Click to edit your **OAuth 2.0 Client ID**.
2. Under **Authorized JavaScript origins**, add:
   ```
   https://medicore-hms.onrender.com
   ```
3. Under **Authorized redirect URIs**, add:
   ```
   https://medicore-hms.onrender.com/api/auth/google/callback
   ```
4. Click **Save**.

### C. Update Render Environment Variables
In Render Dashboard > **Environment**:
1. Update `SERVER_PUBLIC_URL` to: `https://medicore-hms.onrender.com`
2. Update `CLIENT_ORIGIN` to: `https://medicore-hms.onrender.com`
3. Update `GOOGLE_CALLBACK_URL` to: `https://medicore-hms.onrender.com/api/auth/google/callback`
4. Click **Save Changes** (Render will automatically redeploy with the updated URLs).

---

## 6. Verifying the Deployment

1. **Health Check**:
   Open:
   ```
   https://medicore-hms.onrender.com/api/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "system": "MediCore Hospital Management System",
     "database": {
       "status": "Connected",
       "provider": "MongoDB Atlas Cloud Cluster"
     }
   }
   ```

2. **Frontend UI**:
   Open `https://medicore-hms.onrender.com/login`:
   - Verify the modern clinical command center design loads.
   - Verify the **"Continue with Google"** button appears.
   - Verify the 4 interactive 1-click Viva Demo roles auto-fill correctly.

3. **Google Sign-In**:
   - Click **"Continue with Google"**.
   - Authenticate with your Google account.
   - Verify that staff accounts link securely or prompt for password verification.

---

## 7. Troubleshooting Guide

### 1. `redirect_uri_mismatch` from Google
- **Cause**: The redirect URI in Google Cloud Console does not match `GOOGLE_CALLBACK_URL`.
- **Fix**: Check for trailing slashes or `http` vs `https`. Ensure Google Cloud Console has:
  `https://<your-service>.onrender.com/api/auth/google/callback`

### 2. Google Error 403: `access_denied` / App not verified
- **Cause**: Google Cloud OAuth is in "Testing" mode and your account is not in Test Users.
- **Fix**: Go to Google Cloud Console > **OAuth consent screen** > **Test users** > Add your email.

### 3. MongoDB Connection Timeout
- **Cause**: Atlas IP access list does not allow Render's dynamic IP.
- **Fix**: In MongoDB Atlas > **Network Access** > Add IP: `0.0.0.0/0` (Allow from anywhere).

### 4. Build Failure on Render
- **Cause**: In a monorepo, dependencies for `client` and `server` must both be installed.
- **Fix**: Verify Build Command is set to: `npm run render-build`.

### 5. Render Free Tier Sleep & Wake Up Delay
- On Render's Free tier, services spin down after 15 minutes of inactivity. The first request after sleep may take ~30-50 seconds to boot the container. Subsequent requests are instant.
