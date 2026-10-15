# HinglishDoc Studio 🇮🇳📄

> **Layout-Preserving DOCX & PDF Document Translator into Natural Hinglish** with multi-session chat history, real-time ETA tracking, and automatic multi-key round-robin rotation.

---

## ✨ Features

- **100% Layout-Preserving Translation**:
  - **DOCX**: Unzips OpenXML packages, extracts text nodes, translates them, and injects translations back into the original XML tree without losing margins, fonts, colors, or tables.
  - **PDF**: Renders pages via PDF.js, extracts bounding box coordinates, and creates perfectly aligned editable overlay blocks on top of the original document canvas.
- **Natural Hinglish AI Translation**: Powered by Google Gemini (`gemini-3-flash-preview` / `gemini-2.5-flash`), producing natural Hindi written in the Roman/Latin script blended with English terminology.
- **Multiple Gemini API Key Rotation & Failover**:
  - Configure 1 to 4 Gemini API keys.
  - Each new chat automatically uses the next key in round-robin fashion (Key 1 &rarr; 2 &rarr; 3 &rarr; 4 &rarr; 1...).
  - Automatic fallback protection if a key experiences temporary high demand (`HTTP 503`) or rate limits (`HTTP 429`).
- **ChatGPT-Style Multi-Chat Sessions**: Translate multiple files concurrently with independent progress rings, live ETA counters, and persistent session downloads.
- **Privacy & Security First**: Zero server-side data collection. All document parsing and API calls happen directly in your browser. API keys are saved only in your local browser storage.

---

## 🚀 Quick Start (Run Locally)

No installation or build steps required! Simply open `index.html` in any modern web browser:

```bash
# Option 1: Double click or open in browser directly
# On Windows:
start index.html

# On Mac:
open index.html

# Option 2: Run a lightweight local server (optional)
npx serve .
# or
python -m http.server 8000
```

---

## 🔑 Adding Your Gemini API Key

You can obtain a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Method 1: Via the Web UI (Recommended)
1. Open the app in your browser.
2. Click the **"API Keys"** button in the top navigation bar.
3. Paste up to 4 Gemini API keys and click **Save Keys**.
4. Keys are saved securely in your browser's `localStorage` and will persist across sessions.

### Method 2: Via Local `config.js` (Optional)
1. Copy `config.example.js` to `config.js`:
   ```bash
   cp config.example.js config.js
   ```
2. Open `config.js` and add your keys:
   ```javascript
   window.CONFIG = {
       GEMINI_API_KEYS: [
           "YOUR_GEMINI_API_KEY_1",
           "YOUR_GEMINI_API_KEY_2",
           "YOUR_GEMINI_API_KEY_3",
           "YOUR_GEMINI_API_KEY_4"
       ]
   };
   ```
*(Note: `config.js` is automatically ignored by `.gitignore` so your keys are never pushed to GitHub).*

---

## 🌐 Deploying to Render.com (Free Static Site)

This application is 100% static client-side HTML, CSS, and JavaScript. It deploys on Render in less than 60 seconds with zero server costs:

### Step 1: Sign In to Render
- Go to [render.com](https://render.com) and log in with your GitHub account.

### Step 2: Create a New Static Site
1. On the Render Dashboard, click the blue **"New +"** button at the top right.
2. Select **"Static Site"**.

### Step 3: Connect Your GitHub Repository
1. Choose **"Build and deploy from a Git repository"** and click **Next**.
2. Connect your GitHub account and select repository: `irfaaaaanpathan/HinglishDocTranslate`.

### Step 4: Configure Settings
Fill in the following simple details:
- **Name**: `hinglishdoc-translate` (or any custom name)
- **Branch**: `main`
- **Root Directory**: *(leave blank or enter `. `)*
- **Build Command**: *(leave blank / empty)*
- **Publish Directory**: `.` *(or enter `./`)*

### Step 5: Click "Create Static Site"
Render will instantly deploy your site and provide a free live HTTPS URL (e.g., `https://hinglishdoc-translate.onrender.com`).

---

## 🛠️ Tech Stack

- **Frontend Core**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Styling**: Tailwind CSS, Font Awesome 6 Icons
- **Document Processing Engines**:
  - [JSZip](https://stuk.github.io/jszip/) for DOCX XML tree extraction & reconstruction
  - [PDF.js](https://mozilla.github.io/pdf.js/) for PDF rendering & text coordinate mapping
  - [jsPDF](https://github.com/parallax/jsPDF) for client-side layout-preserved PDF compilation
- **AI Backend**: Google Gemini API (`models/gemini-3-flash-preview` / `gemini-2.5-flash`) via direct REST integration

---

## 🔒 Security & Privacy

- **No Hardcoded Keys**: The repository contains no sensitive secrets or API credentials.
- **Client-Side Execution**: Files never leave your device to any middleman server. Documents are translated by communicating directly from your browser to Google Gemini's official API endpoints.

---

## 📄 License

MIT License. Free for personal and commercial use.
