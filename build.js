const fs = require('fs');
const path = require('path');

// Extract keys from individual env vars or comma/newline-separated list
const keys = [];
if (process.env.GEMINI_API_KEY_1) keys.push(process.env.GEMINI_API_KEY_1.trim());
if (process.env.GEMINI_API_KEY_2) keys.push(process.env.GEMINI_API_KEY_2.trim());
if (process.env.GEMINI_API_KEY_3) keys.push(process.env.GEMINI_API_KEY_3.trim());
if (process.env.GEMINI_API_KEY_4) keys.push(process.env.GEMINI_API_KEY_4.trim());

if (process.env.GEMINI_API_KEYS) {
    const list = process.env.GEMINI_API_KEYS.split(/[,\n]+/).map(k => k.trim()).filter(Boolean);
    list.forEach(k => {
        if (!keys.includes(k)) keys.push(k);
    });
}

// Fallback for single key variable
if (process.env.GEMINI_API_KEY && !keys.includes(process.env.GEMINI_API_KEY.trim())) {
    keys.unshift(process.env.GEMINI_API_KEY.trim());
}

const configPath = path.join(__dirname, 'config.js');

if (keys.length > 0) {
    const content = `// Auto-generated at build time from Render Environment Variables\nwindow.CONFIG = {\n    GEMINI_API_KEYS: ${JSON.stringify(keys, null, 4)},\n    SOURCE: 'render-env'\n};\n`;
    fs.writeFileSync(configPath, content, 'utf8');
    console.log(`[Build] Successfully injected ${keys.length} Gemini API Key(s) from environment into config.js!`);
} else {
    console.log('[Build] No Gemini API keys found in process.env. Keeping existing local configuration if present.');
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, 'window.CONFIG = { GEMINI_API_KEYS: [], SOURCE: "none" };\n', 'utf8');
    }
}
