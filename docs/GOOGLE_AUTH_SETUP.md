# Google Cloud OAuth 2.0 / OpenID Connect Setup Guide

This guide walks you through creating and configuring Google OAuth 2.0 credentials for **MediCore HMS (Hospital Management System)**.

---

## 1. Access Google Cloud Console

1. Open your browser and navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Sign in with the Google Account you wish to use as the project administrator.

---

## 2. Create or Select a Cloud Project

1. At the top left of the console, click the **Project Selector** dropdown.
2. Click **New Project**.
3. Set **Project Name** to: `MediCore-HMS` (or your preferred name).
4. Leave Organization as *No organization* (or select your institution/university).
5. Click **Create** and wait a few seconds until the project is initialized.
6. Ensure the newly created project is selected in the top bar.

---

## 3. Configure the OAuth Consent Screen

Before creating OAuth credentials, Google requires configuring the consent screen presented to users:

1. In the left navigation menu, go to **APIs & Services** > **OAuth consent screen** (or search "OAuth consent screen" in the top search bar).
2. Choose User Type:
   - **External**: Recommended for university projects and testing with any Google account.
   - Click **Create**.
3. **App Information**:
   - **App name**: `MediCore HMS`
   - **User support email**: Select your email address.
   - **App logo** *(optional)*: You may upload the MediCore heart icon if desired.
4. **App Domain**:
   - **Application home page**:
     - *Local development*: `http://localhost:5173`
     - *Render production*: `https://<your-service-name>.onrender.com`
   - **Application privacy policy link**: Leave blank for testing, or enter your homepage URL.
   - **Authorized domains**:
     - For production on Render, add: `onrender.com`
5. **Developer Contact Information**:
   - Enter your email address.
6. Click **Save and Continue**.

---

## 4. Configure Minimal OAuth Scopes

MediCore HMS strictly adheres to least-privilege security. We only request identity information:

1. On the **Scopes** step, click **Add or Remove Scopes**.
2. Under "Manually add scopes" or the top table, select the three standard OpenID Connect scopes:
   - `.../auth/userinfo.email` (`email`) — View your email address
   - `.../auth/userinfo.profile` (`profile`) — See personal info (name & profile photo)
   - `openid` — Authenticate using OpenID Connect
3. Click **Update** and then **Save and Continue**.

---

## 5. Add Authorized Test Users (Crucial for Testing Mode)

While your Google Cloud app is in "Testing" publishing status, Google only allows sign-ins from emails explicitly listed as test users:

1. On the **Test users** step, click **+ Add Users**.
2. Enter the Google email addresses of yourself, project evaluators, and any team members who will sign in via Google.
3. Click **Add** and then **Save and Continue**.

> [!IMPORTANT]
> If a user tries to sign in with a Google account that is NOT in the Test Users list while your app is in "Testing" mode, Google will block them with an `Access blocked: App has not completed the Google verification process (403)` error.

---

## 6. Create OAuth 2.0 Web Application Credentials

1. In the left navigation menu, go to **APIs & Services** > **Credentials**.
2. Click **+ Create Credentials** at the top and select **OAuth client ID**.
3. Set **Application type** to: **Web application**.
4. Set **Name** to: `MediCore HMS Web Client`.
5. **Authorized JavaScript origins**:
   - For Local Development:
     - `http://localhost:5173`
     - `http://localhost:5000`
   - For Production (Render):
     - `https://<your-service-name>.onrender.com`
6. **Authorized redirect URIs** (The exact callback endpoint where Google sends the authorization code):
   - For Local Development:
     - `http://localhost:5000/api/auth/google/callback`
   - For Production (Render):
     - `https://<your-service-name>.onrender.com/api/auth/google/callback`

> [!WARNING]
> The redirect URI must match your backend callback route **character-for-character**. A single trailing slash difference will result in Google's `redirect_uri_mismatch` error.

7. Click **Create**.
8. A modal will appear displaying:
   - **Your Client ID** (e.g. `1234567890-abcdef.apps.googleusercontent.com`)
   - **Your Client Secret** (e.g. `GOCSPX-abc123xyz...`)
9. Copy both values safely.

---

## 7. Configure Environment Variables

### In Local Development (`server/.env`):
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
SERVER_PUBLIC_URL=http://localhost:5000
CLIENT_ORIGIN=http://localhost:5173
```

### In Production (Render Dashboard > Environment):
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
GOOGLE_CALLBACK_URL=https://<your-service-name>.onrender.com/api/auth/google/callback
SERVER_PUBLIC_URL=https://<your-service-name>.onrender.com
CLIENT_ORIGIN=https://<your-service-name>.onrender.com
```

---

## 8. Hospital Staff Security & First-Time Sign-In Flow

In MediCore HMS, staff security is strictly enforced:

1. **Existing Staff First Sign-In**:
   - When a hospital staff member (e.g. `dr.sharma@medicore.dev`) signs in with their matching Google account for the first time, MediCore detects an existing staff record.
   - To prevent unauthorized account takeover, MediCore requests their hospital security password once.
   - Upon successful verification, the Google subject identifier (`sub`) is linked permanently to their profile.
   - Subsequent logins take 1 click.
2. **Unlisted / Unknown Google Accounts**:
   - If an unauthorized person signs in with an unlisted Google account, MediCore rejects the request with an **Access Denied: Unlisted Account** notice. Privileged roles (`DOCTOR`, `RECEPTIONIST`, `BILLING_STAFF`, `ADMIN`) can never be created automatically.
   - Staff must be provisioned by a Hospital Administrator first.
