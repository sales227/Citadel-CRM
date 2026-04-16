# Citadel CRM Deployment Guide

This guide provides step-by-step instructions for deploying the Citadel CRM, connecting the React frontend to the Google Apps Script backend, and configuring Google Sheets as the database.

## Prerequisites
- Node.js 18+, npm 9+
- Google Account (with Sheets, Drive, Gmail access)
- Vercel account (free tier)

## Step 1 — Google Sheets Setup
1. Go to sheets.google.com → Create new spreadsheet.
2. Name it: `CitadelCRM_DB`
3. **No need to manually create tabs or headers** — the automated setup handles everything (see Step 5).

## Step 2 — Apps Script Backend
1. Open your Google Sheet from Step 1 → **Extensions** → **Apps Script**.
2. Create 3 files: `Code.gs`, `Triggers.gs`, `CrossSell.gs` — paste the respective code.
3. Save all files.
4. Deploy → **New Deployment** → Type: **Web App** → Execute as: **Me** → Who has access: **Anyone** → Deploy.
5. Copy the **Web App URL** — this is your `VITE_APPS_SCRIPT_URL`.
6. *(Optional)* Run `setupTriggers()` once to install daily automation triggers.
7. Grant permissions when prompted (Gmail, Sheets, Drive access).

## Step 3 — React Frontend
1. Clone or create the React project with the defined structure.
2. Run: `npm install`
3. Install dependencies:
   ```bash
   npm install react-router-dom react-hot-toast recharts lucide-react
   npm install -D tailwindcss postcss autoprefixer vite-plugin-pwa
   npx tailwindcss init -p
   ```
4. Create `.env.local` file:
   ```env
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   VITE_LOGO_URL=https://your-google-drive-logo-public-url
   ```
5. Run: `npm run dev` → test at `http://localhost:5173`

## Step 4 — Vercel Deployment
1. Push code to a GitHub repository.
2. Go to vercel.com → New Project → Import your GitHub repo.
3. Framework preset: **Vite**
4. Add Environment Variables:
   - `VITE_APPS_SCRIPT_URL` = [your Apps Script Web App URL]
   - `VITE_LOGO_URL` = [your logo URL]
5. Build command: `npm run build` | Output directory: `dist`
6. Click **Deploy** → get your production URL (e.g., `citadel-crm.vercel.app`).

## Step 5 — First Login & Configuration
1. Navigate to your production URL.
2. Go to **Settings** → Click **Setup Google Sheet** — this automatically creates all 10 sheet tabs with bold headers, borders, 11 default settings rows, and the initial admin account.
3. Check the **Apps Script Execution Log** (in the Apps Script editor → Executions) for the randomly generated temporary admin password.
4. Login with: `admin@citadel.com` and the temporary password from the log.
5. **IMMEDIATELY** change the admin password via Users → Reset Password.
6. Go to **Settings** → Configure Approval Thresholds, Email Automation, and Automation Timing.
7. Go to **Users** → Create staff accounts.

## Maintenance Notes
- **Google Sheets limit:** 5 million cells — sufficient for 10,000+ leads.
- **Apps Script free tier:** 6 min/execution, 100 emails/day. Upgrade to Google Workspace for higher limits.
- **To backup:** File → Download → CSV for each sheet, or use Google Takeout.
- **Monitor triggers:** Extensions → Apps Script → Triggers (in the spreadsheet).
- **If API stops working:** re-deploy Apps Script (Deploy → Manage Deployments → New Version).
- **CORS issues:** ensure Apps Script is deployed with "Anyone" access and `ContentService` returns proper headers.
