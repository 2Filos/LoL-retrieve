// ==UserScript==
// @name         Local HTML to GitHub CORS Bridge
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Bypasses Firefox CORS blocks, handles token checks, and supports ping diagnostics
// @author       You
// @match        file:///*matchup*.html*
// @match        file:///*/matchups.html
// @match        file:///*
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @connect      api.github.com
// @connect      ddragon.leagueoflegends.com
// ==/UserScript==

(function() {
    'use strict';

    // Ping diagnostic listener
    window.addEventListener("PingTampermonkeyBridge", function() {
        window.dispatchEvent(new CustomEvent("PongTampermonkeyBridge"));
    });

    // Background tab opening listener
    window.addEventListener("OpenBackgroundTab", function(event) {
        const { url } = event.detail;
        if (typeof GM_openInTab !== 'undefined') {
            GM_openInTab(url, { active: false, insert: true });
        } else {
            window.open(url, '_blank');
        }
    });

    window.addEventListener("ToTampermonkeyBridge", function(event) {
        const { detail } = event;
        const { requestId, url, method, headers, body } = detail;

        GM_xmlhttpRequest({
            method: method,
            url: url,
            headers: headers,
            data: body,
            onload: function(response) {
                // Read GitHub's special authentication failure header if present
                const authHeader = response.responseHeaders.toLowerCase();
                const isExpired = authHeader.includes("bad credentials") || response.status === 401;

                window.dispatchEvent(new CustomEvent(`FromTampermonkeyBridge_${requestId}`, {
                    detail: { 
                        status: response.status, 
                        responseText: response.responseText, 
                        ok: (response.status >= 200 && response.status < 300),
                        isExpired: isExpired
                    }
                }));
            },
            onerror: function(error) {
                window.dispatchEvent(new CustomEvent(`FromTampermonkeyBridge_${requestId}`, {
                    detail: { status: 0, error: error, isExpired: false }
                }));
            }
        });
    });
})();