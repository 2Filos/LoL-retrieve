// ==UserScript==
// @name         Local HTML to GitHub CORS Bridge
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Bypasses Firefox CORS blocks for local matchup editor files
// @author       You
// @match        file:///*matchup*.html
// @grant        GM_xmlhttpRequest
// @connect      api.github.com
// ==/UserScript==

(function() {
    'use strict';

    // Listen for custom requests coming from your local HTML page
    window.addEventListener("ToTampermonkeyBridge", function(event) {
        const { detail } = event;
        const { requestId, url, method, headers, body } = detail;

        // Use Tampermonkey's privileged network request tool
        GM_xmlhttpRequest({
            method: method,
            url: url,
            headers: headers,
            data: body,
            onload: function(response) {
                // Send the successful data back down to the HTML page
                window.dispatchEvent(new CustomEvent(`FromTampermonkeyBridge_${requestId}`, {
                    detail: { status: response.status, responseText: response.responseText, ok: (response.status >= 200 && response.status < 300) }
                }));
            },
            onerror: function(error) {
                window.dispatchEvent(new CustomEvent(`FromTampermonkeyBridge_${requestId}`, {
                    detail: { status: 0, error: error }
                }));
            }
        });
    });
})();