# Google Sheets Integration Setup Guide

## Overview

Citadel CRM can use Google Sheets as its database backend in two ways:

1. **Current Approach (Recommended)**: Google Apps Script as the server-side backend
2. **Future Approach**: Direct Google Sheets API integration

This guide covers both approaches.

---

## Option 1: Google Apps Script Backend (Current & Recommended)

### Why Use Google Apps Script?

- ✅ Simpler setup - no authentication needed in frontend
- ✅ Better security - credentials stored only on Google servers
- ✅ Easier to maintain - all logic in one place
- ✅ Works with Google Sheets as database
- ✅ Already implemented in `Code.gs`

### Prerequisites

1. A Google Account
2. Access to Google Sheets and Google Apps Script
3. A Google Sheet with database tables (or create a new one)

### Step 1: Create/Prepare Your Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new sheet named `CitadelCRM_DB` (or use an existing one)
3. Create the following sheets (tabs) with headers:
   - **Users**: UserID, FullName, Email, Phone, Role, IsActive, CreatedAt, LastLogin
   - **Customers**: CustomerID, CustomerName, Phone, Email, CompanyName, City, GSTNumber, AssignedUserID, CreatedAt
   - **Leads**: LeadID, CustomerID, LeadStatus, ProductRequired, LeadSource, AssignedUserID, CreatedAt, UpdatedAt
   - **Quotations**: QuotationID, LeadID, CustomerID, TotalValue, QuotationDate, Status, NeedApproval
   - **Orders**: OrderID, LeadID, CustomerID, ProductOrdered, OrderQuantity, OrderDate, Status, PaymentStatus, AssignedUserID
   - **Payments**: PaymentID, OrderID, CustomerID, InvoiceNumber, TotalAmount, PaidAmount, OutstandingAmount, Status, CreditApprovalRequired, AssignedUserID, DueDate
   - **Settings**: SettingKey, SettingValue, Description, LastUpdated
   - **Reminders**: ReminderID, Type, LeadID, CustomerID, AssignedUserID, ReminderDate, ReminderMessage, Status

**Example Sheet Structure:**
```
Users (Headers in Row 1)
UserID | FullName | Email | Phone | Role | IsActive | ...
USR-001 | Admin User | admin@citadel.com | ... | Admin | TRUE | ...

Customers (Headers in Row 1)
CustomerID | CustomerName | Phone | Email | ...
CUS-001 | Company A | 9876543210 | ... | ...
```

### Step 2: Create Google Apps Script Project

1. Open your Google Sheet
2. Go to **Extensions** → **Apps Script**
3. This opens the Apps Script editor
4. Delete the default code and copy your `Code.gs`, `Triggers.gs`, and `CrossSell.gs` files
5. Click **Deploy** → **New Deployment** → **Type: Web app**
6. Set:
   - **Execute as**: Your Google account
   - **Who has access**: Anyone
7. Copy the **Deployment ID** (you'll need this for the URL)
8. The deployment produces a URL like: `https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercache`

### Step 3: Configure Frontend Environment

1. In your frontend directory, create or edit `.env.local`:
   ```bash
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/d/YOUR_DEPLOYMENT_ID_HERE/usercache
   ```

2. Replace `YOUR_DEPLOYMENT_ID_HERE` with the actual Deployment ID from step 2

3. Save and restart the dev server:
   ```bash
   npm run dev
   ```

### Step 4: Test the Connection

1. Open the application in your browser
2. Try to log in with test credentials
3. Check the browser Console (F12) for any API errors
4. Verify that data is being saved to your Google Sheet

### Troubleshooting G Apps Script Integration

**Problem**: "Invalid token" or 401 error
- **Solution**: Re-deploy the Apps Script and get a new Deployment URL

**Problem**: CORS errors in console
- **Solution**: Ensure the Apps Script deployment is set to "Anyone" access

**Problem**: Data not saving to Sheet
- **Solution**: Check Apps Script logs (Executions tab) for errors

**Problem**: Function not found error
- **Solution**: Ensure all functions in Code.gs, Triggers.gs, and CrossSell.gs are present

---

## Option 2: Direct Google Sheets API (Future Enhancement)

### When to Use Direct Sheets API

- When you don't want Google Apps Script overhead
- For simpler projects without complex backend logic
- When you want client-side control over Sheets access

### Prerequisites

1. A Google Cloud Project
2. Google Sheets API enabled
3. OAuth 2.0 credentials (Service Account or OAuth Client)

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: **New Project** → Name it "CitadelCRM"
3. Enable the Google Sheets API:
   - Go to **APIs & Services** → **Library**
   - Search for "Google Sheets API"
   - Click **Enable**

### Step 2: Create Service Account (Recommended for Backend)

**For server-side use (Node.js/Apps Script backend):**

1. Go to **APIs & Services** → **Credentials**
2. **Create Credentials** → **Service Account**
3. Fill in details:
   - **Service account name**: CitadelCRM-Backend
   - **Grant roles**: Editor (for testing), or specific roles for production
4. Click **Create and Continue**
5. In the Keys section, create a JSON key
6. Download the JSON file and store securely

### Step 3: Create OAuth 2.0 Credentials (For Frontend)

**For browser-based apps:**

1. Go to **APIs & Services** → **Credentials**
2. **Create Credentials** → **OAuth 2.0 Client ID**
3. Choose **Web application**
4. Add authorized JavaScript origins:
   - `http://localhost:5174` (dev)
   - `https://your-domain.com` (production)
5. Add authorized redirect URIs:
   - `http://localhost:5174/auth/callback` (dev)
   - `https://your-domain.com/auth/callback` (production)
6. Copy the **Client ID**

### Step 4: Configure Frontend Environment

```bash
# .env.local
VITE_GOOGLE_SHEET_ID=YOUR_SHEET_ID_HERE
VITE_GOOGLE_SHEETS_API_KEY=YOUR_API_KEY_HERE
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
```

### Step 5: Implement Sheets API Integration

The frontend has a placeholder module at `src/utils/googleSheetsConfig.js` with helper functions. To implement:

1. Install Google Sheets API client:
   ```bash
   npm install @google-cloud/sheets
   ```

2. Implement the `googleSheetsHelpers` functions in `googleSheetsConfig.js`

3. Update `src/api/apiService.js` to use the new helper functions

### Example: Reading from Sheets API

```javascript
import { google } from 'googleapis';

const sheets = google.sheets('v4');
const result = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Users!A:H'
});
```

---

## Environment Variables Reference

| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| `VITE_APPS_SCRIPT_URL` | Google Apps Script deployment URL | `https://script.google.com/macros/d/...` | Yes (for Apps Script) |
| `VITE_GOOGLE_SHEET_ID` | Google Sheet ID for direct API access | `1a2b3c4d5e6f...` | Yes (for direct API) |
| `VITE_GOOGLE_SHEETS_API_KEY` | API key for Sheets access | `AIzaSyAbCD...` | Yes (for direct API) |
| `VITE_GOOGLE_CLIENT_ID` | OAuth Client ID | `...googleusercontent.com` | Yes (for OAuth) |
| `VITE_GOOGLE_CLIENT_SECRET` | OAuth Client Secret | `...` | Yes (for OAuth) |
| `VITE_AUTO_SYNC_INTERVAL` | Auto-sync interval in milliseconds | `300000` (5 mins) | No (default: off) |

---

## Security Best Practices

### For Google Apps Script Backend

✅ **Do:**
- Keep your Deployment ID private
- Use "Anyone" access for public sheets, restrict if sensitive
- Add CORS checks in the backend code
- Validate all inputs in Code.gs

❌ **Don't:**
- Expose your Apps Script code in the frontend
- Allow direct Sheet access from untrusted sources
- Store sensitive data in plaintext in Sheets

### For Direct Sheets API

✅ **Do:**
- Use OAuth 2.0 for user authentication
- Use Service Accounts for backend-to-backend communication
- Store API keys in environment variables (never in code)
- Use Sheet's built-in permission system

❌ **Don't:**
- Expose API keys in frontend code
- Use your personal Google account for backend services
- Grant excessive permissions to OAuth tokens

---

## Testing Your Setup

### Test Checklist

- [ ] Environment variable is correctly set to `.env.local`
- [ ] Front end starts without errors: `npm run dev`
- [ ] Mock database fallback works (if no Apps Script configured)
- [ ] Can log in with test credentials
- [ ] New leads/customers can be created
- [ ] Data persists after page refresh
- [ ] Sync button works and refreshes data
- [ ] Import from Excel file works

### Manual Testing

```javascript
// In browser console (F12)
// Test if backend is configured:
console.log(import.meta.env.VITE_APPS_SCRIPT_URL);

// Test API call:
fetch('YOUR_APPS_SCRIPT_URL', {
    method: 'POST',
    body: JSON.stringify({ action: 'login', email: 'admin@citadel.com', password: 'Admin@1234' })
}).then(r => r.json()).then(console.log);
```

---

## Migration Path: Mock DB → Apps Script → Direct API

### Phase 1 (Current)
- Mock database in memory
- No external dependencies
- Good for development and testing

### Phase 2 (Recommended)
- Google Apps Script backend
- Persistent data in Google Sheets
- Single environment variable configuration

### Phase 3 (Future)
- Direct Sheets API integration
- More control over data
- Reduced backend complexity

---

## Troubleshooting

### "Backend not configured, using mock database"
- **Cause**: `VITE_APPS_SCRIPT_URL` is not set or contains "YOUR_"
- **Solution**: Set the environment variable correctly in `.env.local`

### CORS errors
- **Cause**: Apps Script deployment not accessible from frontend
- **Solution**: Re-deploy Apps Script with"Anyone" access

### Sheet data not updating
- **Cause**: Backend logic not persisting data correctly
- **Solution**: Check Apps Script logs in Google Apps Script editor

### "Sheet not found" errors
- **Cause**: Missing sheet tabs in your Google Sheet
- **Solution**: Create all required sheets with correct names

---

## Resources

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google Apps Script Guide](https://developers.google.com/apps-script)
- [OAuth 2.0 for Mobile & Desktop Apps](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Apps Script logs (Executions tab)
3. Check browser console for detailed error messages
4. Review the Code.gs file for backend logic
