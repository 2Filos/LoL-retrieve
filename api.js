/**
 * api.js
 * Networking & GitHub API Bridge client layer for LoL Matchup Portal
 * 
 * CORE RESPONSIBILITY:
 * Handles all outgoing HTTP traffic. Because this page is run from a local file 
 * (using the file:/// protocol), standard browsers block direct requests to external APIs 
 * like GitHub due to Cross-Origin Resource Sharing (CORS) rules.
 * 
 * To bypass CORS, this file communicates with a browser extension Userscript (bridge.js)
 * using custom browser events (CustomEvent).
 * 
 * LEARNING REFERENCE:
 * For a deep-dive explanation on CORS, security restrictions, and event-driven extensions,
 * read the guide: learning/cors_bypassing_userscripts.md
 */

// --- Global API State variables ---
// These are declared in the global scope so they are shared with editor.js
let isConfigValid = true;   // Will be set to false if config.js is missing or fails to load
let bridgeActive = false;    // Will be set to true if the Tampermonkey bridge script responds to ping

/**
 * Fallback error handler triggered if config.js fails to load.
 * Configures the UI into an offline-only mode.
 * 
 * Note: Linked directly in matchups.html via <script onerror="...">.
 */
function handleConfigMissing() {
    isConfigValid = false;
    
    // Update the DOM to reflect configuration status
    const configErrorEl = document.getElementById('configError');
    const connStatusEl = document.getElementById('connectionStatus');
    
    if (configErrorEl) configErrorEl.style.display = 'block';
    if (connStatusEl) {
        connStatusEl.className = 'status-badge offline';
        connStatusEl.innerText = 'Config Error';
    }
    console.error("Configuration Error: config.js not loaded. Check that config.js exists and is correctly structured.");
}

/**
 * Pings the Tampermonkey userscript to see if it is installed and running.
 * Uses a promise-wrapped event handshake.
 * 
 * Handshake flow:
 * 1. Listen for "PongTampermonkeyBridge" event once.
 * 2. Repeatedly dispatch "PingTampermonkeyBridge" event every 200ms.
 * 3. If "PongTampermonkeyBridge" is heard, resolve true (bridge is online).
 * 4. If no answer after 15 attempts (~3 seconds), resolve false (bridge offline).
 * 
 * @returns {Promise<boolean>} Resolves to true if bridge is active, false otherwise.
 */
async function checkBridgeStatus() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 15;
        let interval;
        
        // Listener for the extension response
        function onPong() {
            clearInterval(interval);
            resolve(true);
        }
        
        // Register single-use listener
        window.addEventListener("PongTampermonkeyBridge", onPong, { once: true });
        
        // Start ping loop
        interval = setInterval(() => {
            attempts++;
            window.dispatchEvent(new CustomEvent("PingTampermonkeyBridge"));
            if (attempts >= maxAttempts) {
                clearInterval(interval);
                window.removeEventListener("PongTampermonkeyBridge", onPong);
                resolve(false);
            }
        }, 200);
        
        // Dispatch initial ping immediately
        window.dispatchEvent(new CustomEvent("PingTampermonkeyBridge"));
    });
}

/**
 * Routes external fetches through the Tampermonkey CORS bridge using CustomEvents.
 * 
 * Why this is necessary:
 * The Tampermonkey userscript runs in a privileged context with access to GM_xmlhttpRequest,
 * which can ignore CORS boundaries. We pass request options from the page scope to the 
 * userscript scope, wait for the network request to finish, and receive the response.
 * 
 * Message Passing Steps:
 * 1. Generate a unique `requestId` to match requests with responses.
 * 2. Create an event listener for `FromTampermonkeyBridge_{requestId}`.
 * 3. Dispatch `ToTampermonkeyBridge` containing request parameters.
 * 4. Once response is received, cleanup listeners and resolve response details.
 * 
 * @param {string} url - Target URL to fetch.
 * @param {object} options - Fetch options (method, headers, body, etc.).
 * @returns {Promise<object>} Custom response object.
 */
function bridgeFetch(url, options = {}) {
    return new Promise((resolve) => {
        // Create a unique identifier for this request (avoids mixing up concurrent calls)
        const requestId = Math.random().toString(36).substr(2, 9);
        
        const responseHandler = (e) => {
            // Clean up the event listener immediately after receiving response
            window.removeEventListener(`FromTampermonkeyBridge_${requestId}`, responseHandler);
            
            let parsedJson = null;
            try { 
                parsedJson = JSON.parse(e.detail.responseText); 
            } catch(err) {
                // Not JSON or empty body - ignore parsing error
            }

            // Return a standardized fetch-like response interface
            resolve({
                ok: e.detail.ok,
                status: e.detail.status,
                isExpired: e.detail.isExpired, // Custom flag indicating token validation failures
                json: () => parsedJson,
                text: () => e.detail.responseText
            });
        };
        
        // Register listener for this request's specific response channel
        window.addEventListener(`FromTampermonkeyBridge_${requestId}`, responseHandler);

        // Send request payload to Tampermonkey userscript
        window.dispatchEvent(new CustomEvent("ToTampermonkeyBridge", {
            detail: {
                requestId: requestId,
                url: url,
                method: options.method || "GET",
                headers: options.headers || {},
                body: options.body || null
            }
        }));
    });
}

/**
 * Gets API configuration parameters (base URL and authorization headers)
 * using the credentials imported from config.js.
 * 
 * @throws {Error} If config.js is invalid or not loaded.
 * @returns {object} API configuration object containing url and headers.
 */
function getAPIConfig() {
    if (!isConfigValid || typeof CONFIG === 'undefined') {
        throw new Error("Missing local configuration mapping. Please define config.js.");
    }
    return {
        url: `https://api.github.com/repos/${CONFIG.GITHUB_REPO}/contents/`,
        headers: {
            "Authorization": `token ${CONFIG.GITHUB_TOKEN}`,
            "Accept": "application/vnd.github.v3+json"
        }
    };
}

/**
 * Attempts a standard browser fetch. If blocked by CORS or network error,
 * falls back to routing through the Tampermonkey bridge.
 * 
 * Used for DDragon endpoints, which usually allow direct requests,
 * but may fail under strict sandboxes or local loading contexts.
 * 
 * @param {string} url - Target URL to fetch.
 * @returns {Promise<object>} Parsed JSON response.
 */
async function fetchDirectOrBridge(url) {
    try {
        // Try direct fetch first
        const res = await fetch(url);
        if (res.ok) return await res.json();
    } catch(e) {
        console.warn("Direct fetch failed or blocked by CORS, trying bridge fallback...", e);
    }
    
    // If bridge is available, try bridge fetch
    if (bridgeActive) {
        const response = await bridgeFetch(url);
        if (response.ok) return response.json();
    }
    throw new Error(`Failed to reach API endpoint: ${url}`);
}

/**
 * Validates the GitHub Personal Access Token (PAT) configured in config.js.
 * Requests user profile info; updates connection badges and status text accordingly.
 * 
 * LEARNING REFERENCE:
 * To learn more about standard GitHub authorization headers and APIs,
 * see the guide: learning/github_contents_api.md
 */
async function checkTokenValidity() {
    try {
        document.getElementById('status').innerText = "Status: Authorizing with GitHub...";
        
        // Query the GitHub profile endpoint
        const response = await bridgeFetch("https://api.github.com/user", {
            headers: { "Authorization": `token ${CONFIG.GITHUB_TOKEN}` }
        });

        const statusEl = document.getElementById('status');
        const connStatusEl = document.getElementById('connectionStatus');
        const tokenExpiredEl = document.getElementById('tokenExpiredError');
        const syncBtnEl = document.getElementById('syncBtn');

        if (response.isExpired || response.status === 401) {
            // Token was rejected by GitHub
            if (tokenExpiredEl) tokenExpiredEl.style.display = 'block';
            if (connStatusEl) {
                connStatusEl.className = 'status-badge offline';
                connStatusEl.innerText = "Bad Credentials";
            }
            if (statusEl) statusEl.innerText = "Status: Stopped. Token Rejected.";
        } else if (response.ok) {
            // Token is active and valid
            if (connStatusEl) {
                connStatusEl.className = 'status-badge online';
                connStatusEl.innerText = 'Connected';
            }
            if (statusEl) statusEl.innerText = "Status: Authenticated & Ready.";
            if (syncBtnEl) syncBtnEl.style.display = 'inline-block'; // Reveal sync controls
        } else {
            // Server error or rate-limit issues
            if (connStatusEl) {
                connStatusEl.className = 'status-badge offline';
                connStatusEl.innerText = `Error ${response.status}`;
            }
            if (statusEl) statusEl.innerText = `Warning: GitHub status check returned ${response.status}`;
        }
    } catch (err) {
        const connStatusEl = document.getElementById('connectionStatus');
        const statusEl = document.getElementById('status');
        if (connStatusEl) {
            connStatusEl.className = 'status-badge offline';
            connStatusEl.innerText = 'Offline';
        }
        if (statusEl) statusEl.innerText = "Status Check Failed: " + err.message;
    }
}
