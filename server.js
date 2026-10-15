const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

// Read API keys from Render Environment Variables
function getEnvKeys() {
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

    if (process.env.GEMINI_API_KEY && !keys.includes(process.env.GEMINI_API_KEY.trim())) {
        keys.unshift(process.env.GEMINI_API_KEY.trim());
    }

    return keys;
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8'
};

async function callGemini(payload, key) {
    return new Promise((resolve, reject) => {
        const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${encodeURIComponent(key)}`;
        const bodyStr = JSON.stringify(payload);
        const parsed = url.parse(targetUrl);

        const req = https.request({
            hostname: parsed.hostname,
            path: parsed.path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(bodyStr)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsedData);
                    } else {
                        reject(new Error(parsedData?.error?.message || `HTTP ${res.statusCode}`));
                    }
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${e.message}`));
                }
            });
        });

        req.on('error', reject);
        req.write(bodyStr);
        req.end();
    });
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    // API: Status
    if (pathname === '/api/status' && req.method === 'GET') {
        const keys = getEnvKeys();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
            status: 'ok',
            keyCount: keys.length,
            hasKeys: keys.length > 0,
            mode: 'render-backend'
        }));
    }

    // API: Config (expose keys securely to frontend if desired)
    if (pathname === '/api/config' && req.method === 'GET') {
        const keys = getEnvKeys();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
            keys: keys,
            count: keys.length,
            source: 'render-env'
        }));
    }

    // API: Translate Proxy (Server-side translation with key hiding & failover)
    if (pathname === '/api/translate' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { textsArray, tone, sessionNumber } = JSON.parse(body || '{}');
                const keys = getEnvKeys();

                if (keys.length === 0) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({
                        error: 'No Gemini API keys configured in Render Environment Variables (GEMINI_API_KEY_1..4)'
                    }));
                }

                const toneGuides = {
                    conversational: "Use simple, casual conversational Hinglish (daily talking style, clear and easy).",
                    natural: "Use natural balanced Hinglish that blends Hindi and English smoothly.",
                    formal: "Keep formal technical terms in English and formal Hindi sentence connectors.",
                    youth: "Use casual youth/social-media Hinglish."
                };
                const toneInstruction = toneGuides[tone] || toneGuides.natural;
                const systemPrompt = `Translate each item in the JSON array into natural Hinglish (Hindi in Roman/Latin script mixed with English). ${toneInstruction} Keep original abbreviations, numbers, dates, tags, and formatting intact. Return exact 1-to-1 array in JSON property "translations".`;

                const payload = {
                    contents: [{ role: "user", parts: [{ text: JSON.stringify(textsArray) }] }],
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: "OBJECT",
                            properties: { translations: { type: "ARRAY", items: { type: "STRING" } } },
                            required: ["translations"]
                        }
                    }
                };

                // Round-robin selection based on chat sessionNumber
                const num = Number(sessionNumber) || 1;
                const primaryIndex = (num - 1) % keys.length;
                const primaryKey = keys[primaryIndex];
                const candidateKeys = [primaryKey, ...keys.filter(k => k !== primaryKey)];

                let lastError = null;
                for (let i = 0; i < candidateKeys.length; i++) {
                    const key = candidateKeys[i];
                    const slot = keys.indexOf(key) + 1;
                    try {
                        const result = await callGemini(payload, key);
                        const jsonText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (!jsonText) throw new Error(`Empty response from Gemini Key #${slot}`);
                        const parsed = JSON.parse(jsonText);
                        if (Array.isArray(parsed?.translations)) {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            return res.end(JSON.stringify({
                                translations: parsed.translations,
                                keySlot: slot,
                                totalKeys: keys.length
                            }));
                        }
                        throw new Error("Invalid translation response structure");
                    } catch (err) {
                        console.warn(`Key #${slot} failed on server (${err.message}). Trying fallback...`);
                        lastError = err;
                    }
                }

                res.writeHead(502, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                    error: lastError ? lastError.message : 'All Gemini API keys failed'
                }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }

    // Serve Static Files
    let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // SPA fallback to index.html
            filePath = path.join(__dirname, 'index.html');
        }
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(500);
                return res.end('Server Error');
            }
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        });
    });
});

server.listen(PORT, () => {
    const keys = getEnvKeys();
    console.log(`HinglishDoc Studio server running on port ${PORT}`);
    console.log(`Loaded ${keys.length} Gemini API Key(s) from Environment Variables.`);
});
