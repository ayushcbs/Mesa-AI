# Deploying Mesa Workspace Intelligence to Netlify via GitHub

This project is fully configured and audited for seamless Continuous Deployment (CI/CD) on **Netlify** directly from a GitHub repository.

The frontend client (Vite + React 19 + Tailwind CSS) builds to static assets in `dist`, while all backend functionality (Gemini AI Vision proxy, Stripe checkout sessions, developer feedback dispatch) runs serverlessly via Netlify Functions in `netlify/functions/`.

---

## 1. Verified Netlify Build Settings

All build, function, and routing directives are defined in `netlify.toml` and mirrored in `public/_redirects`:

| Setting | Value | Description |
| :--- | :--- | :--- |
| **Build Command** | `npm run build` | Compiles Vite client assets and generates production distribution |
| **Publish Directory** | `dist` | Directory served statically across Netlify's global CDN |
| **Functions Directory** | `netlify/functions` | Zero-config TypeScript serverless function endpoints |
| **Node Version** | `20` | Runtime environment for build and serverless execution |

### Routing & Redirect Hierarchy
1. **API Endpoints**: Routed to dedicated Netlify serverless functions (`status = 200` rewrite):
   - `POST /api/create-checkout-session` -> `/.netlify/functions/create-checkout-session`
   - `POST /api/feedback` -> `/.netlify/functions/feedback`
   - `POST /api/gemini/generate` -> `/.netlify/functions/gemini-generate`
   - `ANY /api/*` -> `/.netlify/functions/api/:splat` (Catch-all Express serverless wrapper)
2. **Server Bundle Protection**:
   - `GET /server.cjs*` -> `404` (Enforces that Node container artifacts are never served over the public CDN)
3. **Single Page Application (SPA) Fallback**:
   - `GET /*` -> `/index.html` (`status = 200`) ensures client-side routing works on all deep URLs and page reloads.

---

## 2. Server Architecture: Netlify vs Local Node

- **On Netlify**:
  - The client is served statically from `dist`.
  - API endpoints are executed on-demand as AWS Lambda / Netlify Serverless Functions from `netlify/functions/`.
  - Secrets like `GEMINI_API_KEY` and `STRIPE_SECRET_KEY` are kept strictly in serverless runtime memory and are **never** exposed in the client bundle.
- **In Local Development / Docker Containers**:
  - `npm run dev` starts Express (`server.ts`) with Vite dev middleware on port 3000.
  - `npm start` runs the bundled Express server (`server.cjs`), which serves API routes and static client files.

---

## 3. Step-by-Step GitHub to Netlify Connection

### Step 1: Push Code to GitHub
1. Create a new repository on [GitHub](https://github.com/new) (e.g. `mesa-workspace-intelligence`).
2. Run in your terminal:
   ```bash
   git init
   git add .
   git commit -m "feat: complete Netlify deployment configuration"
   git branch -M main
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git
   git push -u origin main
   ```

### Step 2: Import into Netlify
1. Log in to [Netlify](https://app.netlify.com/).
2. Click **"Add new site"** > **"Import an existing project"**.
3. Select **GitHub** and grant access to your repository.
4. Select your repository.
5. Netlify will automatically detect settings from `netlify.toml`:
   - **Branch**: `main`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`

### Step 3: Configure Environment Variables
In Netlify, go to **Site configuration** > **Environment variables** > **Add a variable** (or **Import from .env**):

#### Required for AI Spatial Analysis
| Variable Name | Required | Description |
| :--- | :---: | :--- |
| `GEMINI_API_KEY` | **Yes** | Your Google Gemini API key. Used securely by serverless functions to perform workspace scans. |

#### Firebase Persistent Authentication & Database
*The codebase contains no hardcoded Firebase credentials. Safe fallbacks prevent CI/CD build failures if variables are temporarily omitted.* To enable live cloud data persistence across devices:
| Variable Name | Required | Description |
| :--- | :---: | :--- |
| `VITE_FIREBASE_API_KEY` | Recommended | Firebase Web API Key (from Firebase Console > Project Settings) |
| `VITE_FIREBASE_AUTH_DOMAIN` | Recommended | Firebase Auth Domain (e.g., `your-project.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Recommended | Firebase Project ID (e.g., `your-project`) |
| `VITE_FIREBASE_STORAGE_BUCKET`| Optional | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Optional | Firebase Cloud Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Recommended | Firebase Web App ID (e.g., `1:12345:web:abcdef`) |
| `VITE_FIREBASE_DATABASE_ID` | Optional | Custom Firestore Database ID (defaults to `(default)` if unset) |

#### Payments & Feedback (Optional)
| Variable Name | Required | Description |
| :--- | :---: | :--- |
| `STRIPE_SECRET_KEY` | Optional | Stripe Secret Key (`sk_live_...` or `sk_test_...`) for real checkout sessions |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Optional | Stripe Publishable Key (`pk_live_...` or `pk_test_...`) |
| `APP_URL` / `VITE_APP_URL` | Optional | Your Netlify site domain (e.g., `https://your-site.netlify.app`) |
| `FEEDBACK_RECIPIENT` | Optional | Email recipient for user feedback forms |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_PORT` | Optional | SMTP credentials for automated feedback email delivery |

### Step 4: Deploy & Verify
1. Click **"Deploy site"**.
2. Netlify builds the app, deploys static assets to CDN, and mounts serverless functions.
3. Test your live URL:
   - Navigate to `/` -> landing page loads cleanly.
   - Refresh on any sub-view or query -> SPA rewrites to `/index.html` without 404s.
   - Trigger spatial scan -> hits `POST /api/gemini/generate` via serverless function.
   - Test checkout -> hits `POST /api/create-checkout-session` via serverless function.

---

## 4. Pre-Deployment Audit Checklist Passed

- [x] `netlify.toml` configured with `npm run build`, `dist`, `netlify/functions`.
- [x] SPA catch-all rewrite rule `/* -> /index.html` (HTTP 200).
- [x] Public `_redirects` synchronized so API function routes are never shadowed.
- [x] Zero hard-coded Firebase credentials or API secrets in code.
- [x] `process.env.GEMINI_API_KEY` removed from client-side `vite.config.ts` define.
- [x] Unused `@google/genai` Node import removed from client `src/App.tsx`.
- [x] `npm run build` and `npm run lint` compile with 0 errors.
- [x] Netlify functions (`api.ts`, `create-checkout-session.ts`, `feedback.ts`, `gemini-generate.ts`) tested and bundle cleanly.
