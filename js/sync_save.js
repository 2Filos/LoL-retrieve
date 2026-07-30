/**
 * sync_save.js
 * Core logic for pushing local drafts to GitHub.
 * Handles Base64 encoding, SHA revision tracking, dual-tab syncing,
 * and global YouTube links index updates.
 */

/**
 * Encodes local changes in Base64 and pushes them to GitHub.
 * Resets local cache and SHA tags upon success.
 */
async function saveToGitHub() {
    if (!activeMatchup.path) {
        alert("Please load a matchup first.");
        return;
    }
    if (typeof DEBUG_CONFIG !== 'undefined' && DEBUG_CONFIG.logEditorFlow) {
        console.log(`[DEBUG EditorFlow] Triggered saveToGitHub for ${activeMatchup.path} (Active Tab: ${activePageSide})`);
    }

    if (!bridgeActive || typeof CONFIG === 'undefined' || !isConfigValid) {
        document.getElementById('status').innerText = "Saved draft locally. (Cannot sync: Bridge or Config offline).";
        return;
    }

    const config = getAPIConfig();
    const path = activeMatchup.path;
    const textContent = document.getElementById('editor').value;
    const statusEl = document.getElementById('status');

    statusEl.innerText = "Syncing changes to GitHub...";
    console.log("[DEBUG] saveToGitHub triggered.");

    // Only append metadata to the primary file (Notes for matchups, Notes for General)
    const isMatchup = activeMatchup.enemyKey && activeMatchup.myKey;
    const isPrimaryFile = (isMatchup && activePageSide === 'right') ||
                          (!isMatchup && activePageSide === 'left');
    const fullText = isPrimaryFile ? appendMetadata(textContent) : textContent;

    // Encode text to Base64 safely resolving UTF-8 multibyte characters
    const encodedContent = btoa(unescape(encodeURIComponent(fullText)));
    const bodyData = {
        message: `Sync: updated ${activeMatchup.label}`,
        content: encodedContent
    };

    // Provide SHA checksum if updating an existing file, else GitHub throws 409 conflict
    if (currentSha) {
        bodyData.sha = currentSha;
        console.log(`[DEBUG] Included SHA in PUT request: ${currentSha}`);
    } else {
        console.log(`[DEBUG] No currentSha available. Creating new file.`);
    }

    try {
        const response = await bridgeFetch(config.url + path, {
            method: 'PUT',
            headers: config.headers,
            body: JSON.stringify(bodyData)
        });

        console.log(`[DEBUG] GitHub PUT response status: ${response.status}`);

        if (response.ok) {
            const result = response.json();
            currentSha = result.content.sha; // Update currentSha with GitHub's new version reference
            console.log(`[DEBUG] Sync successful! Updated currentSha to: ${currentSha}`);

            // === YOUTUBE LINK GLOBAL INDEX SYNC ===
            let ytLink = null;
            if (typeof activeMetadata !== 'undefined' && activeMetadata) {
                if (activeMetadata.linkOrder && Array.isArray(activeMetadata.linkOrder)) {
                    ytLink = activeMetadata.linkOrder.find(url => typeof url === 'string' && (url.includes('youtube.com') || url.includes('youtu.be')));
                }
                if (!ytLink && activeMetadata.customLinks && Array.isArray(activeMetadata.customLinks)) {
                    const yt = activeMetadata.customLinks.find(l => l.url && (l.url.includes('youtube.com') || l.url.includes('youtu.be')));
                    if (yt) ytLink = yt.url;
                }
            }
            if (!ytLink) {
                const ytRegex = /https?:\/\/(www\.)?(youtube\.com|youtu\.be)[^\s\)]+/;
                const match = fullText.match(ytRegex);
                if (match) ytLink = match[0];
            }

            const matchupKey = `${activeMatchup.enemyKey}_${activeMatchup.myKey}`;
            let globalLinks = {};
            try {
                globalLinks = JSON.parse(localStorage.getItem('youtube_links_index') || '{}');
            } catch (e) { }

            const existingYtLink = globalLinks[matchupKey] || null;

            // If saving a sub-page (Plan/VOD) and no youtube link was found in it,
            // do not delete the global link as it's likely maintained in the main notes page.
            const isSubPage = activeMatchup.path.endsWith('-plan.md') || activeMatchup.path.endsWith('-vod.md');
            if (isSubPage && !ytLink && existingYtLink) {
                ytLink = existingYtLink; // Prevent deletion
            }

            if (ytLink !== existingYtLink) {
                console.log(`[DEBUG] YouTube link changed from ${existingYtLink} to ${ytLink}. Syncing index...`);
                statusEl.innerText = "Changes safely synced! Updating YouTube Links Index...";

                if (ytLink) {
                    globalLinks[matchupKey] = ytLink;
                } else {
                    delete globalLinks[matchupKey];
                }
                const newIndexContent = JSON.stringify(globalLinks, null, 2);
                localStorage.setItem('youtube_links_index', newIndexContent);

                const ytBodyData = {
                    message: `Sync: updated youtube links index for ${matchupKey}`,
                    content: btoa(unescape(encodeURIComponent(newIndexContent)))
                };
                if (typeof youtubeLinksSha !== 'undefined' && youtubeLinksSha) {
                    ytBodyData.sha = youtubeLinksSha;
                }

                try {
                    let ytResponse = await bridgeFetch(config.url + 'youtube_links.json', {
                        method: 'PUT',
                        headers: config.headers,
                        body: JSON.stringify(ytBodyData)
                    });

                    if (ytResponse.status === 409 || ytResponse.status === 422) {
                        if (typeof DEBUG_CONFIG !== 'undefined' && DEBUG_CONFIG.logYouTube) {
                            console.log("[DEBUG] YouTube index SHA mismatch, fetching latest and retrying...");
                        }
                        const getRes = await bridgeFetch(config.url + 'youtube_links.json', { method: 'GET', headers: config.headers });
                        if (getRes.ok) {
                            const getData = getRes.json();
                            const latestSha = getData.sha;
                            const latestLinks = JSON.parse(decodeURIComponent(escape(atob(getData.content))));
                            
                            if (ytLink) {
                                latestLinks[matchupKey] = ytLink;
                            } else {
                                delete latestLinks[matchupKey];
                            }
                            
                            const retryContent = JSON.stringify(latestLinks, null, 2);
                            localStorage.setItem('youtube_links_index', retryContent);
                            ytBodyData.content = btoa(unescape(encodeURIComponent(retryContent)));
                            ytBodyData.sha = latestSha;
                            
                            ytResponse = await bridgeFetch(config.url + 'youtube_links.json', {
                                method: 'PUT',
                                headers: config.headers,
                                body: JSON.stringify(ytBodyData)
                            });
                        }
                    }

                    if (ytResponse.ok) {
                        const ytResult = ytResponse.json();
                        youtubeLinksSha = ytResult.content.sha;
                        if (typeof DEBUG_CONFIG !== 'undefined' && DEBUG_CONFIG.logYouTube) {
                            console.log(`[DEBUG] YouTube index synced. New SHA: ${youtubeLinksSha}`);
                        }
                        renderSavedMatchups();
                    } else {
                        console.warn(`[WARN] YouTube index sync failed: ${ytResponse.status}`);
                    }
                } catch (e) {
                    console.error("[ERROR] Error syncing youtube_links.json", e);
                }
            }
            // === END YOUTUBE LINK GLOBAL INDEX SYNC ===

            // Delete local draft cache for the current tab
            localStorage.removeItem(activeMatchup.draftKey);

            /**
             * === SYNC THE OTHER TAB'S DRAFT ===
             * Rule Validation: Dual-Tab Sync.
             * After syncing the actively visible tab, the editor automatically looks for
             * a draft of the opposite tab (e.g. Plan if Notes is active) and pushes it
             * to GitHub in the background. It safely strips metadata from the non-primary
             * file before pushing.
             */
            const otherSide = (activePageSide === 'left') ? 'right' : 'left';
            const otherPathInfo = resolvePagePath(
                { enemyKey: activeMatchup.enemyKey, myKey: activeMatchup.myKey },
                otherSide
            );
            const otherDraftRaw = localStorage.getItem(otherPathInfo.draftKey);
            if (otherDraftRaw !== null) {
                try {
                    // Determine if the other tab is the primary file
                    const otherIsPrimary = (isMatchup && otherSide === 'right') ||
                                           (!isMatchup && otherSide === 'left');
                    let otherText = otherDraftRaw;
                    // Strip metadata from non-primary files to prevent pollution
                    if (!otherIsPrimary) {
                        const metaMatch = otherText.match(/\n?\n?<!-- METADATA: .*? -->/);
                        if (metaMatch) otherText = otherText.replace(metaMatch[0], '').trimEnd();
                    }

                    // Fetch current SHA for the other file
                    let otherSha = null;
                    const cacheBusterUrl = `${config.url}${otherPathInfo.path}?t=${Date.now()}`;
                    const fetchHeaders = Object.assign({}, config.headers, {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    });
                    const otherGetRes = await bridgeFetch(cacheBusterUrl, { headers: fetchHeaders });
                    let skipOtherSync = false;
                    if (otherGetRes.ok) {
                        const otherData = otherGetRes.json();
                        otherSha = otherData.sha;
                        const decodedOther = decodeURIComponent(escape(atob(otherData.content)));
                        // If local draft perfectly matches remote, no need to push
                        if (decodedOther === otherText) {
                            skipOtherSync = true;
                        }
                    } else if (otherGetRes.status === 404 && otherText.length === 0) {
                        // If file doesn't exist remotely and local draft is empty, no need to push
                        skipOtherSync = true;
                    }

                    if (skipOtherSync) {
                        localStorage.removeItem(otherPathInfo.draftKey);
                        if (typeof DEBUG_CONFIG !== 'undefined' && DEBUG_CONFIG.logSync) {
                            console.log(`[DEBUG] Other tab (${otherSide}) is identical to remote or empty. Draft cleared.`);
                        }
                    } else {
                        const otherEncoded = btoa(unescape(encodeURIComponent(otherText)));
                        const otherBody = {
                            message: `Sync: updated ${activeMatchup.label} (${otherSide === 'left' ? (isMatchup ? 'Plan' : 'Notes') : (isMatchup ? 'Notes' : 'VODs')})`,
                            content: otherEncoded
                        };
                        if (otherSha) otherBody.sha = otherSha;

                        const otherRes = await bridgeFetch(config.url + otherPathInfo.path, {
                            method: 'PUT',
                            headers: config.headers,
                            body: JSON.stringify(otherBody)
                        });

                        if (otherRes.ok) {
                            localStorage.removeItem(otherPathInfo.draftKey);
                            if (typeof DEBUG_CONFIG !== 'undefined' && DEBUG_CONFIG.logSync) {
                                console.log(`[DEBUG] Other tab (${otherSide}) synced successfully.`);
                            }
                        } else {
                            console.warn(`[WARN] Other tab sync failed: ${otherRes.status}`);
                        }
                    }
                } catch (otherErr) {
                    console.warn(`[WARN] Other tab sync error: ${otherErr.message}`);
                }
            }
            // === END OTHER TAB SYNC ===

            renderLocalDrafts();
            updateDiscardButtonState(false);
            const conflictBanner = document.getElementById('conflictBanner');
            if (conflictBanner) conflictBanner.style.display = 'none';

            statusEl.innerText = "Changes safely synced to GitHub!";
        } else {
            statusEl.innerText = `Sync failed (Status ${response.status}). Kept local draft.`;
        }
    } catch (err) {
        statusEl.innerText = "Sync error: " + err.message + ". Draft saved locally.";
    }
}
