// ==UserScript==
// @name         Local HTML to GitHub CORS Bridge
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Bypasses Firefox & Chrome CORS blocks, handles token checks, and supports ping diagnostics
// @author       You
// @match        file:///*matchup*.html*
// @match        file:///*/matchups.html
// @match        file:///*
// @include      file://*
// @include      file:///*
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @connect      api.github.com
// @connect      ddragon.leagueoflegends.com
// ==/UserScript==

/**
 * bridge.js
 * Tampermonkey CORS Proxy Userscript for LoL Matchup Portal
 * 
 * --- HOW IT WORKS & WHY WE NEED IT ---
 * 1. THE PROBLEM: Same-Origin Policy & CORS
 *    Browsers enforce security policies to prevent malicious scripts on one origin (e.g. evil-site.com)
 *    from reading data from another origin (e.g. github.com). Since our portal is loaded from a local 
 *    hard drive path (using file:/// protocol), the browser treats it as having a unique, locked-down 
 *    origin. The browser will block any standard fetch() or XMLHttpRequest calls to api.github.com 
 *    with a CORS (Cross-Origin Resource Sharing) block.
 * 
 * 2. THE WORKAROUND: Browser Extension Sandbox
 *    Browser extensions (like Tampermonkey) execute in a privileged context. Userscripts running under 
 *    Tampermonkey can make requests that bypass CORS constraints entirely by using the GM_xmlhttpRequest API, 
 *    provided the domain is whitelisted in the userscript's metadata headers.
 * 
 * 3. THE EVENT BRIDGE: Page Scope to Extension Scope
 *    Because the userscript's context and the web page's context are isolated from each other, 
 *    we cannot call GM_xmlhttpRequest directly from editor.js. Instead, we use CustomEvents on the global 
 *    window object to pass data back and forth:
 * 
 *    [Page Scope: app.js/api.js] --(Dispatch Event 'ToTampermonkeyBridge')--> [Userscript Scope: bridge.js]
 *                                                                                    |
 *                                                                           (GM_xmlhttpRequest)
 *                                                                                    |
 *                                                                                    v
 *    [Page Scope: app.js/api.js] <--(Dispatch Event 'FromTampermonkeyBridge')-- [Userscript Scope: bridge.js]
 * 
 * LEARNING REFERENCE:
 * For a detailed breakdown of CORS and event bridge design, see: learning/cors_bypassing_userscripts.md
 */

(function() {
    'use strict';

    // ==========================================
    // 1. PING-PONG DIAGNOSTIC LISTENER
    // ==========================================
    // This event checks if the Tampermonkey script is installed and running.
    // When api.js fires "PingTampermonkeyBridge", we reply instantly with "PongTampermonkeyBridge".
    window.addEventListener("PingTampermonkeyBridge", function() {
        window.dispatchEvent(new CustomEvent("PongTampermonkeyBridge"));
    });

    // ==========================================
    // 2. BACKGROUND TAB OPENING LISTENER
    // ==========================================
    // Local file:/// context is restricted from opening background tabs easily.
    // Tampermonkey exposes `GM_openInTab` which bypasses popup blockers and allows us to load
    // counter sites (like Mobalytics or OP.GG) in background tabs seamlessly when clicking badges.
    window.addEventListener("OpenBackgroundTab", function(event) {
        const { url } = event.detail;
        if (typeof GM_openInTab !== 'undefined') {
            // Opens a new tab without focusing it, keeping the user in the portal notes view
            GM_openInTab(url, { active: false, insert: true });
        } else {
            // Fallback to standard popup window if extension lacks permissions
            window.open(url, '_blank');
        }
    });

    // ==========================================
    // 3. CORS BYPASS HTTP REQUEST PROXY LISTENER
    // ==========================================
    // Listens for outgoing requests dispatched from api.js.
    window.addEventListener("ToTampermonkeyBridge", function(event) {
        const { detail } = event;
        const { requestId, url, method, headers, body } = detail;

        // Performance timing for bridge-side diagnostics
        const _bridgeStart = performance.now();
        const _shortUrl = (method || 'GET') + ' ' + url.replace(/https:\/\/api\.github\.com\/repos\/[^/]+\/[^/]+\/contents\//, '').replace(/\?.*$/, '').replace(/https:\/\/ddragon\.leagueoflegends\.com\//, '');

        // GM_xmlhttpRequest is a privileged API provided by Tampermonkey that bypasses CORS.
        GM_xmlhttpRequest({
            method: method,
            url: url,
            headers: headers,
            data: body,
            
            // Triggered when the request completes successfully
            onload: function(response) {
                const _dur = (performance.now() - _bridgeStart).toFixed(1);
                console.log(`%c[BRIDGE PERF]%c ${_shortUrl} %c${_dur}ms %c[${response.status}]`,
                    'background:#2d1b69;color:#bb86fc;font-weight:bold;padding:1px 4px;border-radius:2px',
                    'color:#ccc',
                    parseFloat(_dur) > 3000 ? 'color:#e94560;font-weight:bold' : parseFloat(_dur) > 1000 ? 'color:#f5a623;font-weight:bold' : 'color:#03dac6',
                    response.status >= 200 && response.status < 300 ? 'color:#03dac6' : 'color:#cf6679'
                );

                // Read response headers to check if GitHub rejected our credentials
                const authHeader = response.responseHeaders ? response.responseHeaders.toLowerCase() : "";
                const isExpired = authHeader.includes("bad credentials") || response.status === 401;

                // Dispatch the response payload back to the page's unique request channel
                window.dispatchEvent(new CustomEvent(`FromTampermonkeyBridge_${requestId}`, {
                    detail: { 
                        status: response.status, 
                        responseText: response.responseText, 
                        ok: (response.status >= 200 && response.status < 300),
                        isExpired: isExpired
                    }
                }));
            },
            
            // Triggered if the remote server is down, DNS fails, or network is disconnected
            onerror: function(error) {
                const _dur = (performance.now() - _bridgeStart).toFixed(1);
                console.error(`%c[BRIDGE PERF]%c ${_shortUrl} %cERROR after ${_dur}ms`,
                    'background:#2d1b69;color:#cf6679;font-weight:bold;padding:1px 4px;border-radius:2px',
                    'color:#ccc',
                    'color:#cf6679;font-weight:bold'
                );

                window.dispatchEvent(new CustomEvent(`FromTampermonkeyBridge_${requestId}`, {
                    detail: { 
                        status: 0, 
                        error: error, 
                        isExpired: false 
                    }
                }));
            }
        });
    });
})();