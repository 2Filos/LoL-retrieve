// ==UserScript==
// @name         Local HTML to GitHub CORS Bridge
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Bypasses Firefox CORS blocks and handles token expiration checks
// @author       You
// @match        file:///*matchup*.html
// @grant        GM_xmlhttpRequest
// @connect      api.github.com
// ==/UserScript==

(function() {
    'use strict';

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