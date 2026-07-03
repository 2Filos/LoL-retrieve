/**
 * editor.js
 * Editor interface operations & Local Caching controller for LoL Matchup Portal
 * 
 * CORE RESPONSIBILITIES:
 * 1. DOM Element Operations: Coordinates input fields, textareas, and status labels.
 * 2. Autocomplete: Loads the champion list from Riot DDragon API and hooks the autocomplete datalist.
 * 3. Local Caching: Auto-saves draft changes to browser `localStorage` on every keystroke.
 * 4. Conflict Resolution: Intercepts loading if local edits differ from GitHub's copy, offering choice pathways.
 * 5. Link Detection: Scrapes URLs from matchup notes dynamically and updates click badges.
 * 
 * LEARNING REFERENCES:
 * - For Local Storage drafts caching, see: learning/local_drafts_persistence.md
 * - For GitHub Contents APIs, Base64 translations, and SHAs, see: learning/github_contents_api.md
 */

// --- Global Editor State variables ---
let currentSha = null;        // Cryptographic revision tracker returned from GitHub to prevent edit collisions
let CHAMPIONS = [];           // Array of objects { key, name } loaded from Riot Games' champion catalog
let githubTextCache = null;   // Cached text of the last loaded document straight from GitHub (used to resolve conflicts)
let ddragonVersion = null;    // Latest DDragon patch version string (e.g. "14.13.1") for champion icon URLs
let activeMatchup = {         // Active loaded matchup metadata
    path: null,
    label: null,
    draftKey: null,
    enemyKey: null,
    myKey: null
};

/**
 * Parses and extracts all valid URLs (HTTP/HTTPS/www) from raw text.
 * Filters out trailing punctuation (commas, periods, parentheses).
 * 
 * @param {string} text - Matchup markdown content.
 * @returns {Array<string>} Unique list of matching URLs.
 */
function extractUrls(text) {
    if (!text) return [];
    
    // Regular expression matching http://, https://, and www. links
    const regex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
    const matches = text.match(regex) || [];
    
    // Clean trailing punctuation that regex accidentally catches (e.g. at the end of sentences)
    return matches.map(url => {
        let cleaned = url;
        while (/[.,;:!?)]$/.test(cleaned)) {
            cleaned = cleaned.slice(0, -1);
        }
        return cleaned;
    }).filter((url, index, self) => self.indexOf(url) === index); // deduplicate entries
}

/**
 * Returns matching domain icons or initials to overlay on links.
 * 
 * @param {string} url - Target URL.
 * @returns {string} String containing SVG HTML or badge HTML.
 */
function getLinkIcon(url) {
    let domain = "";
    try {
        const parsed = new URL(url.startsWith('http') ? url : 'https://' + url);
        domain = parsed.hostname.toLowerCase();
    } catch(e) {
        // Fallback default link icon if URL parsing fails
        return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
    }

    if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
        return `<svg width="12" height="12" viewBox="0 0 24 24" fill="#ef4444"><path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`;
    }
    if (domain.includes('op.gg')) {
        return `<span style="font-size: 8px; font-weight: bold; background: #5383e8; color: white; padding: 1px 3px; border-radius: 2px; line-height: 1.2; font-family: sans-serif; display: inline-block;">OP</span>`;
    }
    if (domain.includes('mobalytics.gg')) {
        return `<svg width="12" height="12" viewBox="0 0 24 24" fill="#5f3bf4"><polygon points="12 2 22 7 22 17 12 22 2 17 2 7"/></svg>`;
    }
    if (domain.includes('lolalytics.com')) {
        return `<span style="font-size: 8px; font-weight: bold; background: #c8102e; color: white; padding: 1px 3px; border-radius: 2px; line-height: 1.2; font-family: sans-serif; display: inline-block;">LA</span>`;
    }
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
}

/**
 * Scans the current editor text area, extracts URLs, and populates the 
 * detected link badge list underneath the editor.
 */
function updateDetectedLinks() {
    const editorEl = document.getElementById('editor');
    const container = document.getElementById('detectedLinksContainer');
    const listEl = document.getElementById('detectedLinksList');
    
    if (!editorEl || !container || !listEl) return;
    
    const urls = extractUrls(editorEl.value);
    
    listEl.innerHTML = '';
    if (urls.length === 0) {
        return; // Keep list area empty if no URLs found
    }
    
    urls.forEach(url => {
        const cleanHref = url.startsWith('http') ? url : 'https://' + url;
        let displayUrl = url.replace(/https?:\/\/(www\.)?/, '');
        if (displayUrl.length > 30) {
            displayUrl = displayUrl.substring(0, 27) + '...'; // Truncate long URLs for display
        }
        
        // Assemble link badge card
        const badge = document.createElement('div');
        badge.className = 'link-badge';
        
        const iconSpan = document.createElement('span');
        iconSpan.className = 'link-icon';
        iconSpan.innerHTML = getLinkIcon(url);
        
        const link = document.createElement('a');
        link.href = cleanHref;
        link.target = '_blank';
        link.textContent = displayUrl;
        link.title = url;
        
        // Special "..." button allowing browser background tab opening (via bridge.js)
        const bgBtn = document.createElement('button');
        bgBtn.className = 'bg-tab-btn';
        bgBtn.textContent = '...';
        bgBtn.title = 'Open in background tab';
        bgBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (bridgeActive) {
                // Route background tab opening request to bridge context
                window.dispatchEvent(new CustomEvent("OpenBackgroundTab", {
                    detail: { url: cleanHref }
                }));
            } else {
                window.open(cleanHref, '_blank');
            }
        };
        
        badge.appendChild(iconSpan);
        badge.appendChild(link);
        badge.appendChild(bgBtn);
        listEl.appendChild(badge);
    });
}

// --- Discard Draft UI Confirmation Helpers ---

/** Shows the discard button when a matchup is active and disables it if there is no draft.
 *  The button is rendered in the sync control row, but only enabled when a draft exists.
 */
function updateDiscardButtonState(hasDraft) {
    const discardBtn = document.getElementById('discardBtn');
    const discardConfirmGroup = document.getElementById('discardConfirmGroup');
    if (!discardBtn || !discardConfirmGroup) return;

    discardBtn.style.display = 'inline-block';
    discardBtn.disabled = !hasDraft;
    discardConfirmGroup.style.display = 'none';
}

/** Hides the confirmation controls and shows the main discard button.
 *  The discard button stays visible at all times after editor load.
 */
function hideDiscardConfirm() {
    const discardBtn = document.getElementById('discardBtn');
    const discardConfirmGroup = document.getElementById('discardConfirmGroup');
    if (!discardBtn || !discardConfirmGroup) return;

    discardConfirmGroup.style.display = 'none';
}

/** Shows the confirmation row for the discard action if the button is enabled. */
function showDiscardConfirm() {
    const discardBtn = document.getElementById('discardBtn');
    const discardConfirmGroup = document.getElementById('discardConfirmGroup');
    if (!discardBtn || !discardConfirmGroup || discardBtn.disabled) return;

    discardConfirmGroup.style.display = 'inline-flex';
}

// --- Application Boot Loop ---
window.onload = async () => {
    const editorEl = document.getElementById('editor');
    const fileLabel = document.getElementById('currentFileLabel');
    const statusEl = document.getElementById('status');
    if (editorEl && fileLabel && statusEl) {
        const notesDraft = localStorage.getItem('draft_matchup:Notes');
        fileLabel.innerText = 'Notes';
        if (notesDraft !== null) {
            editorEl.value = notesDraft;
            editorEl.disabled = false;
            statusEl.innerText = 'Status: Loading default notes...';
            updateDiscardButtonState(true);
        } else {
            editorEl.value = 'Loading default notes...';
            editorEl.disabled = true;
            statusEl.innerText = 'Status: Loading default notes...';
            updateDiscardButtonState(false);
        }
        updateDetectedLinks();
    }

    // 1. Establish bridge connectivity status
    const bridgeOk = await checkBridgeStatus();
    
    // 2. Add listener to the Mobalytics link to support background tab opening via the bridge
    const mobaLink = document.getElementById('mobalyticsLink');
    if (mobaLink) {
        mobaLink.addEventListener('click', (e) => {
            e.preventDefault();
            const url = e.currentTarget.href;
            if (url && url !== '#' && !url.endsWith('#')) {
                if (bridgeActive) {
                    window.dispatchEvent(new CustomEvent("OpenBackgroundTab", {
                        detail: { url: url }
                    }));
                } else {
                    window.open(url, '_blank');
                }
            }
        });
    }

    if (bridgeOk) {
        bridgeActive = true;
        // Hide bridge warnings if connected
        const bridgeErrEl = document.getElementById('bridgeError');
        if (bridgeErrEl) bridgeErrEl.style.display = 'none';
        
        // Load Riot DDragon lists
        await loadChampionsList();
        
        // Authorize with GitHub credentials
        if (typeof CONFIG !== 'undefined' && isConfigValid) {
            await checkTokenValidity();
        } else {
            const connStatusEl = document.getElementById('connectionStatus');
            if (connStatusEl) {
                connStatusEl.className = 'status-badge offline';
                connStatusEl.innerText = 'Offline Mode';
            }
        }
    } else {
        // Fallback settings if bridge is offline
        bridgeActive = false;
        const bridgeErrEl = document.getElementById('bridgeError');
        const connStatusEl = document.getElementById('connectionStatus');
        const statusEl = document.getElementById('status');
        
        if (bridgeErrEl) bridgeErrEl.style.display = 'block';
        if (connStatusEl) {
            connStatusEl.className = 'status-badge offline';
            connStatusEl.innerText = 'Bridge Offline';
        }
        if (statusEl) statusEl.innerText = 'Status: Bridge unavailable. Operating in local-only mode.';
        
        // Populates UI using offline static backup catalogs
        await loadChampionsList();
        
        // Enable select elements so they work in local-only storage cache mode
        document.getElementById('enemyChamp').disabled = false;
        document.getElementById('myChamp').disabled = false;
        document.getElementById('loadBtn').disabled = false;
    }
    
    // 3. Render any draft objects stored in localStorage
    renderLocalDrafts();
    
    // Render saved matchups
    renderSavedMatchups();

    // 4. Auto-restore search inputs, check URL parameters, or default to General Notes
    let urlEnemy = null;
    let urlMy = null;
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('enemy') && urlParams.has('my')) {
        urlEnemy = urlParams.get('enemy');
        urlMy = urlParams.get('my');
    } else {
        // Parse from hash or raw search string (e.g. #GarenvsDarius, ?GarenvsDarius)
        let rawParams = window.location.hash.substring(1) || window.location.search.substring(1);
        if (rawParams) {
            // Try to match variations of "vs" like "GarenvsDarius" or "Garen-vs-Darius"
            const vsRegex = /^(.*?)(?:-vs-|vs)(.*)$/i;
            const match = rawParams.match(vsRegex);
            if (match) {
                urlMy = decodeURIComponent(match[1]).trim();
                urlEnemy = decodeURIComponent(match[2]).trim();
            } else if (rawParams.includes('-')) {
                const parts = rawParams.split('-');
                if (parts.length === 2) {
                    urlMy = decodeURIComponent(parts[0]).trim();
                    urlEnemy = decodeURIComponent(parts[1]).trim();
                }
            }
        }
    }

    if (urlEnemy && urlMy) {
        // Update input fields using utils.js helpers to ensure proper formatting
        const enemyKey = getChampionKeyByName(urlEnemy) || urlEnemy;
        const myKey = getChampionKeyByName(urlMy) || urlMy;
        document.getElementById('enemyChamp').value = getChampionNameByKey(enemyKey);
        document.getElementById('myChamp').value = getChampionNameByKey(myKey);
    }

    const enemyVal = document.getElementById('enemyChamp').value;
    const myVal = document.getElementById('myChamp').value;
    if (enemyVal && myVal) {
        loadMatchup();
    } else {
        loadGeneralNotes();
    }
};

/**
 * Fetches Lol version metadata and champion lists from Riot Games' Data Dragon API.
 * Uses localStorage cache to prevent redundant fetches on refresh.
 */
async function loadChampionsList() {
    const cachedData = localStorage.getItem('lol_champions_cache');
    let cache = null;
    if (cachedData) {
        try { cache = JSON.parse(cachedData); } catch(e) {}
    }

    try {
        // Fetch latest patch list from Riot DDragon
        const versions = await fetchDirectOrBridge('https://ddragon.leagueoflegends.com/api/versions.json');
        const latestVersion = versions[0];
        ddragonVersion = latestVersion; // Expose globally for champion portrait icons
        
        // Check if cache patch is current
        if (cache && cache.version === latestVersion && cache.champions && cache.champions.length > 0) {
            CHAMPIONS = cache.champions;
            console.log(`Loaded champions from cache: Patch ${latestVersion}`);
        } else {
            // Cache is missing or out-of-date: Fetch champion descriptions
            const data = await fetchDirectOrBridge(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`);
            
            // Map object keys to sorted lookup arrays
            CHAMPIONS = Object.values(data.data).map(c => ({
                key: c.id,
                name: c.name
            })).sort((a, b) => a.name.localeCompare(b.name));
            
            // Write cache back to local storage
            localStorage.setItem('lol_champions_cache', JSON.stringify({
                version: latestVersion,
                champions: CHAMPIONS
            }));
            console.log(`Cached champions: Patch ${latestVersion}`);
        }
    } catch (err) {
        console.warn("Could not fetch fresh champion list. Using cache or defaults.", err);
        if (cache && cache.champions) {
            CHAMPIONS = cache.champions;
        } else {
            // Offline fail-safe static champion list
            CHAMPIONS = [
                { key: "Aatrox", name: "Aatrox" }, { key: "Ahri", name: "Ahri" }, { key: "Akali", name: "Akali" },
                { key: "Akshan", name: "Akshan" }, { key: "Alistar", name: "Alistar" }, { key: "Amumu", name: "Amumu" },
                { key: "Anivia", name: "Anivia" }, { key: "Annie", name: "Annie" }, { key: "Aphelios", name: "Aphelios" },
                { key: "Ashe", name: "Ashe" }, { key: "AurelionSol", name: "Aurelion Sol" }, { key: "Azir", name: "Azir" },
                { key: "Bard", name: "Bard" }, { key: "Belveth", name: "Bel'Veth" }, { key: "Blitzcrank", name: "Blitzcrank" },
                { key: "Brand", name: "Brand" }, { key: "Braum", name: "Braum" }, { key: "Briar", name: "Briar" },
                { key: "Caitlyn", name: "Caitlyn" }, { key: "Camille", name: "Camille" }, { key: "Cassiopeia", name: "Cassiopeia" },
                { key: "Chogath", name: "Cho'Gath" }, { key: "Corki", name: "Corki" }, { key: "Darius", name: "Darius" },
                { key: "Diana", name: "Diana" }, { key: "DrMundo", name: "Dr. Mundo" }, { key: "Draven", name: "Draven" },
                { key: "Ekko", name: "Ekko" }, { key: "Elise", name: "Elise" }, { key: "Evelynn", name: "Evelynn" },
                { key: "Ezreal", name: "Ezreal" }, { key: "Fiddlesticks", name: "Fiddlesticks" }, { key: "Fiora", name: "Fiora" },
                { key: "Fizz", name: "Fizz" }, { key: "Galio", name: "Galio" }, { key: "Gangplank", name: "Gangplank" },
                { key: "Garen", name: "Garen" }, { key: "Gnar", name: "Gnar" }, { key: "Gragas", name: "Gragas" },
                { key: "Graves", name: "Graves" }, { key: "Gwen", name: "Gwen" }, { key: "Hecarim", name: "Hecarim" },
                { key: "Heimerdinger", name: "Heimerdinger" }, { key: "Hwei", name: "Hwei" }, { key: "Illaoi", name: "Illaoi" },
                { key: "Irelia", name: "Irelia" }, { key: "Ivern", name: "Ivern" }, { key: "Janna", name: "Janna" },
                { key: "JarvanIV", name: "Jarvan IV" }, { key: "Jax", name: "Jax" }, { key: "Jayce", name: "Jayce" },
                { key: "Jhin", name: "Jhin" }, { key: "Jinx", name: "Jinx" }, { key: "Ksante", name: "K'Sante" },
                { key: "Kaisa", name: "Kai'Sa" }, { key: "Kalista", name: "Kalista" }, { key: "Karma", name: "Karma" },
                { key: "Karthus", name: "Karthus" }, { key: "Kassadin", name: "Kassadin" }, { key: "Katarina", name: "Katarina" },
                { key: "Kayle", name: "Kayle" }, { key: "Kayn", name: "Kayn" }, { key: "Kennen", name: "Kennen" },
                { key: "Khazix", name: "Kha'Zix" }, { key: "Kindred", name: "Kindred" }, { key: "Kled", name: "Kled" },
                { key: "KogMaw", name: "Kog'Maw" }, { key: "Leblanc", name: "LeBlanc" }, { key: "LeeSin", name: "Lee Sin" },
                { key: "Leona", name: "Leona" }, { key: "Lillia", name: "Lillia" }, { key: "Lissandra", name: "Lissandra" },
                { key: "Lucian", name: "Lucian" }, { key: "Lulu", name: "Lulu" }, { key: "Lux", name: "Lux" },
                { key: "Malphite", name: "Malphite" }, { key: "Malzahar", name: "Malzahar" }, { key: "Maokai", name: "Maokai" },
                { key: "MasterYi", name: "Master Yi" }, { key: "Milio", name: "Milio" }, { key: "MissFortune", name: "Miss Fortune" },
                { key: "Mordekaiser", name: "Mordekaiser" }, { key: "Morgana", name: "Morgana" }, { key: "Naafiri", name: "Naafiri" },
                { key: "Nami", name: "Nami" }, { key: "Nasus", name: "Nasus" }, { key: "Nautilus", name: "Nautilus" },
                { key: "Neeko", name: "Neeko" }, { key: "Nidalee", name: "Nidalee" }, { key: "Nilah", name: "Nilah" },
                { key: "Nocturne", name: "Nocturne" }, { key: "Nunu", name: "Nunu & Willump" }, { key: "Olaf", name: "Olaf" },
                { key: "Orianna", name: "Orianna" }, { key: "Ornn", name: "Ornn" }, { key: "Pantheon", name: "Pantheon" },
                { key: "Poppy", name: "Poppy" }, { key: "Pyke", name: "Pyke" }, { key: "Qiyana", name: "Qiyana" },
                { key: "Quinn", name: "Quinn" }, { key: "Rakan", name: "Rakan" }, { key: "Rammus", name: "Rammus" },
                { key: "RekSai", name: "Rek'Sai" }, { key: "Rell", name: "Rell" }, { key: "Renata", name: "Renata Glasc" },
                { key: "Renekton", name: "Renekton" }, { key: "Rengar", name: "Rengar" }, { key: "Riven", name: "Riven" },
                { key: "Rumble", name: "Rumble" }, { key: "Ryze", name: "Ryze" }, { key: "Samira", name: "Samira" },
                { key: "Sejuani", name: "Sejuani" }, { key: "Senna", name: "Senna" }, { key: "Seraphine", name: "Seraphine" },
                { key: "Sett", name: "Sett" }, { key: "Shaco", name: "Shaco" }, { key: "Shen", name: "Shen" },
                { key: "Shyvana", name: "Shyvana" }, { key: "Singed", name: "Singed" }, { key: "Sion", name: "Sion" },
                { key: "Sivir", name: "Sivir" }, { key: "Skarner", name: "Skarner" }, { key: "Sona", name: "Sona" },
                { key: "Soraka", name: "Soraka" }, { key: "Swain", name: "Swain" }, { key: "Sylas", name: "Sylas" },
                { key: "Syndra", name: "Syndra" }, { key: "TahmKench", name: "Tahm Kench" }, { key: "Taliyah", name: "Taliyah" },
                { key: "Talon", name: "Talon" }, { key: "Taric", name: "Taric" }, { key: "Teemo", name: "Teemo" },
                { key: "Thresh", name: "Thresh" }, { key: "Tristana", name: "Tristana" }, { key: "Trundle", name: "Trundle" },
                { key: "Tryndamere", name: "Tryndamere" }, { key: "TwistedFate", name: "Twisted Fate" }, { key: "Twitch", name: "Twitch" },
                { key: "Udyr", name: "Udyr" }, { key: "Urgot", name: "Urgot" }, { key: "Varus", name: "Varus" },
                { key: "Vayne", name: "Vayne" }, { key: "Veigar", name: "Veigar" }, { key: "Velkoz", name: "Vel'Koz" },
                { key: "Vex", name: "Vex" }, { key: "Vi", name: "Vi" }, { key: "Viego", name: "Viego" },
                { key: "Viktor", name: "Viktor" }, { key: "Vladimir", name: "Vladimir" }, { key: "Volibear", name: "Volibear" },
                { key: "Warwick", name: "Warwick" }, { key: "Wukong", name: "Wukong" }, { key: "Xayah", name: "Xayah" },
                { key: "Xerath", name: "Xerath" }, { key: "XinZhao", name: "Xin Zhao" }, { key: "Yasuo", name: "Yasuo" },
                { key: "Yone", name: "Yone" }, { key: "Yorick", name: "Yorick" }, { key: "Yuumi", name: "Yuumi" },
                { key: "Zac", name: "Zac" }, { key: "Zed", name: "Zed" }, { key: "Zeri", name: "Zeri" },
                { key: "Ziggs", name: "Ziggs" }, { key: "Zilean", name: "Zilean" }, { key: "Zoe", name: "Zoe" },
                { key: "Zyra", name: "Zyra" }
            ];
        }
    }
    
    // Bind catalog results to search dropdowns
    const dl = document.getElementById('championList');
    if (dl) {
        dl.innerHTML = '';
        CHAMPIONS.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.name;
            dl.appendChild(opt);
        });
    }

    // Enable interaction elements
    document.getElementById('enemyChamp').disabled = false;
    document.getElementById('myChamp').disabled = false;
    document.getElementById('loadBtn').disabled = false;
}

/**
 * Resolves search terms, builds target path rules, fetches notes from GitHub
 * or retrieves active local storage drafts, and populates the text editor.
 */
async function loadMatchup() {
    const enemyName = document.getElementById('enemyChamp').value;
    const myName = document.getElementById('myChamp').value;
    
    // Resolve display names to keys using helpers in utils.js
    const enemyKey = getChampionKeyByName(enemyName);
    const myKey = getChampionKeyByName(myName);
    
    if (!enemyKey || !myKey) {
        alert("Please select or enter valid champions from the list.");
        return;
    }

    // Formulate Mobalytics counters URL and display button (opens to the latter champion: enemyKey)
    const mobaLink = document.getElementById('mobalyticsLink');
    const slug = getMobalyticsSlug(enemyKey);
    if (mobaLink) {
        mobaLink.href = `https://mobalytics.gg/lol/champions/${slug}/counters`;
        mobaLink.style.display = 'inline-flex';
    }

    const path = `matchups/${enemyKey}/${myKey}.md`;
    const label = `${getChampionNameByKey(myKey)} vs ${getChampionNameByKey(enemyKey)}`;
    const draftKey = `draft_matchup:${enemyKey}/${myKey}`;

    await loadMatchupByPath(path, label, draftKey, enemyKey, myKey);
}

/**
 * Loads the General Notes matchup from GitHub or local drafts.
 */
async function loadGeneralNotes() {
    // Clear inputs so user can easily search for matchups
    document.getElementById('enemyChamp').value = '';
    document.getElementById('myChamp').value = '';
    
    // Hide Mobalytics counters link
    const mobaLink = document.getElementById('mobalyticsLink');
    if (mobaLink) {
        mobaLink.style.display = 'none';
    }
    
    const path = 'Notes.md';
    const label = 'Notes';
    const draftKey = 'draft_matchup:Notes';
    
    await loadMatchupByPath(path, label, draftKey, null, null);
}

/**
 * Helper function to fetch notes from GitHub or load local drafts
 * for a specific path, setting the activeMatchup state.
 */
async function loadMatchupByPath(path, label, draftKey, enemyKey = null, myKey = null) {
    const statusEl = document.getElementById('status');
    const editorEl = document.getElementById('editor');
    const fileLabel = document.getElementById('currentFileLabel');
    const conflictBanner = document.getElementById('conflictBanner');
    
    // Set global active matchup configuration
    activeMatchup = {
        path: path,
        label: label,
        draftKey: draftKey,
        enemyKey: enemyKey,
        myKey: myKey
    };
    
    statusEl.innerText = `Searching for ${label}...`;
    if (conflictBanner) conflictBanner.style.display = 'none';
    updateDiscardButtonState(false);
    currentSha = null; 
    githubTextCache = null;

    // Check for local draft cache
    const localDraft = localStorage.getItem(draftKey);

    // Fallback load in offline-only mode
    if (!bridgeActive || typeof CONFIG === 'undefined' || !isConfigValid) {
        fileLabel.innerText = `${label} (Local Draft)`;
        editorEl.value = localDraft || "";
        editorEl.disabled = false;
        statusEl.innerText = "Offline Mode: Draft active.";
        updateDiscardButtonState(localDraft !== null);
        updateDetectedLinks();
        updateStarButtonUI();
        return;
    }

    const config = getAPIConfig();
    try {
        // Fetch files metadata from repository contents endpoint
        const response = await bridgeFetch(config.url + path, { headers: config.headers });
        
        if (response.isExpired) {
            const tokenErrEl = document.getElementById('tokenExpiredError');
            if (tokenErrEl) tokenErrEl.style.display = 'block';
            return;
        }

        if (response.status === 404) {
            // File does not exist on GitHub yet
            statusEl.innerText = `${label} not found on GitHub.\n Ready to create new file.`;
            fileLabel.innerText = `New File: ${label}`;
            editorEl.value = localDraft || "";
            editorEl.disabled = false;
            updateDiscardButtonState(true);
            updateDetectedLinks();
        } else if (response.ok) {
            // File loaded successfully
            const data = response.json();
            currentSha = data.sha; // Save SHA to track current revision
            
            // Decodes Base64 to UTF-8 text safely
            const decodedText = decodeURIComponent(escape(atob(data.content)));
            githubTextCache = decodedText; // Cache remote contents
            
            // CONFLICT CHECK:
            // Compare local draft cache content with remote version loaded from GitHub.
            if (localDraft !== null && localDraft !== decodedText) {
                if (conflictBanner) conflictBanner.style.display = 'flex'; // reveal conflict warning banner
                editorEl.value = localDraft; // Default display local edits
                statusEl.innerText = "Conflict! Unsaved local edits differ from GitHub version.";
                updateDiscardButtonState(true);
                updateDetectedLinks();
            } else {
                // Synced state: No local variations
                if (localDraft !== null) {
                    localStorage.removeItem(draftKey); // Clear redundant draft
                    renderLocalDrafts();
                }
                editorEl.value = decodedText;
                statusEl.innerText = "Loaded successfully from GitHub!";
                updateDiscardButtonState(false);
                updateDetectedLinks();
            }
            fileLabel.innerText = label;
            editorEl.disabled = false;
        } else {
            statusEl.innerText = `Error code: ${response.status}`;
        }
    } catch (err) {
        statusEl.innerText = "Bridge fetch error: " + err.message;
        fileLabel.innerText = `${label} (Offline)`;
        editorEl.value = localDraft || "";
        editorEl.disabled = false;
        updateDiscardButtonState(localDraft !== null);
        updateDetectedLinks();
    }
    
    updateStarButtonUI();
}

/**
 * Dynamic event handler triggered on textarea inputs.
 * Auto-saves drafts locally immediately upon user typing.
 */
document.getElementById('editor').addEventListener('input', () => {
    if (!activeMatchup.draftKey) return;
    
    const textContent = document.getElementById('editor').value;
    
    // Save current content to localStorage
    localStorage.setItem(activeMatchup.draftKey, textContent);
    renderLocalDrafts(); // Refresh list display
    
    updateDiscardButtonState(true);
    document.getElementById('status').innerText = "Typing... saved draft locally.";
    updateDetectedLinks();
});

/**
 * Encodes local changes in Base64 and pushes them to GitHub.
 * Resets local cache and SHA tags upon success.
 */
async function saveToGitHub() {
    if (!activeMatchup.path) return;

    if (!bridgeActive || typeof CONFIG === 'undefined' || !isConfigValid) {
        document.getElementById('status').innerText = "Saved draft locally. (Cannot sync: Bridge or Config offline).";
        return;
    }

    const config = getAPIConfig();
    const path = activeMatchup.path;
    const textContent = document.getElementById('editor').value;
    const statusEl = document.getElementById('status');

    statusEl.innerText = "Syncing changes to GitHub...";

    // Encode text to Base64 safely resolving UTF-8 multibyte characters
    const encodedContent = btoa(unescape(encodeURIComponent(textContent)));
    const bodyData = {
        message: `Sync: updated ${activeMatchup.label}`,
        content: encodedContent
    };
    
    // Provide SHA checksum if updating an existing file, else GitHub throws 409 conflict
    if (currentSha) bodyData.sha = currentSha;

    try {
        const response = await bridgeFetch(config.url + path, {
            method: 'PUT',
            headers: config.headers,
            body: JSON.stringify(bodyData)
        });

        if (response.ok) {
            const result = response.json();
            currentSha = result.content.sha; // Update currentSha with GitHub's new version reference
            
            // Delete local draft cache
            localStorage.removeItem(activeMatchup.draftKey);
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

/**
 * Handles action branches from conflict banner.
 * 
 * @param {string} decision - 'local' to use draft edits, 'github' to overwrite with remote.
 */
function resolveConflict(decision) {
    if (!activeMatchup.draftKey) return;
    
    const conflictBanner = document.getElementById('conflictBanner');
    
    if (decision === 'local') {
        if (conflictBanner) conflictBanner.style.display = 'none';
        document.getElementById('status').innerText = "Using local draft. Save to push to GitHub.";
        updateDetectedLinks();
    } else if (decision === 'github') {
        if (githubTextCache !== null) {
            document.getElementById('editor').value = githubTextCache;
            localStorage.removeItem(activeMatchup.draftKey); // Delete local conflicting edits
            renderLocalDrafts();
            updateDiscardButtonState(false);
            if (conflictBanner) conflictBanner.style.display = 'none';
            document.getElementById('status').innerText = "Loaded GitHub version. Local draft deleted.";
            updateDetectedLinks();
        }
    }
}

/** Clears the current draft, loading the original file copy */
function discardCurrentDraft() {
    if (!activeMatchup.draftKey) return;

    localStorage.removeItem(activeMatchup.draftKey);
    renderLocalDrafts();
    
    // Reload original clean state
    loadMatchupByPath(activeMatchup.path, activeMatchup.label, activeMatchup.draftKey, activeMatchup.enemyKey, activeMatchup.myKey);
}

/**
 * Searches localStorage keys to find drafts matches.
 * 
 * @returns {Array<object>} List of matching draft definitions { enemy, mySide, isNotes, path }.
 */
function getLocalDrafts() {
    const drafts = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('draft_matchup:')) {
            const path = key.replace('draft_matchup:', '');
            if (path === 'Notes') {
                drafts.push({
                    enemy: null,
                    mySide: null,
                    isNotes: true,
                    path: path
                });
            } else {
                const parts = path.split('/');
                if (parts.length === 2) {
                    drafts.push({
                        enemy: parts[0],
                        mySide: parts[1],
                        isNotes: false,
                        path: path
                    });
                }
            }
        }
    }
    return drafts;
}

/** Builds and binds HTML template cards listing unsaved drafts inside the sidebar panel */
function renderLocalDrafts() {
    const container = document.getElementById('draftsList');
    if (!container) return;
    
    const drafts = getLocalDrafts();
    const activeDraftKey = activeMatchup?.draftKey || null;
    const visibleDrafts = drafts.filter(d => activeDraftKey !== `draft_matchup:${d.path}`);
    
    if (visibleDrafts.length === 0) {
        container.innerHTML = '<div class="no-drafts">No pending local drafts.</div>';
        return;
    }
    
    container.innerHTML = '';
    visibleDrafts.forEach(d => {
        const card = document.createElement('div');
        card.className = 'draft-card';
        if (d.isNotes) {
            card.innerHTML = `
                <div class="draft-info">
                    <span class="draft-champ">General Notes</span>
                    <span class="draft-tag">Local Draft</span>
                </div>
                <div class="draft-actions">
                    <button class="btn-sync-sm" onclick="syncDraftDirectly(null, null)">Sync</button>
                    <button class="btn-outline-sm" onclick="loadGeneralNotes()">Edit</button>
                </div>
            `;
        } else {
            card.innerHTML = `
                <div class="draft-info">
                    <span class="draft-champ">${getChampionNameByKey(d.mySide)} vs ${getChampionNameByKey(d.enemy)}</span>
                    <span class="draft-tag">Local Draft</span>
                </div>
                <div class="draft-actions">
                    <button class="btn-sync-sm" onclick="syncDraftDirectly('${d.enemy}', '${d.mySide}')">Sync</button>
                    <button class="btn-outline-sm" onclick="loadDraft('${d.enemy}', '${d.mySide}')">Edit</button>
                </div>
            `;
        }
        container.appendChild(card);
    });
}

/** Triggers loading procedures for a specific draft card item */
function loadDraft(enemyKey, myKey) {
    document.getElementById('enemyChamp').value = getChampionNameByKey(enemyKey);
    document.getElementById('myChamp').value = getChampionNameByKey(myKey);
    loadMatchup();
}

/** Syncs a specific local draft directly to GitHub in the background */
async function syncDraftDirectly(enemyKey, myKey) {
    let path, label, draftKey;
    if (enemyKey === null && myKey === null) {
        path = 'Notes.md';
        label = 'Notes';
        draftKey = 'draft_matchup:Notes';
    } else {
        path = `matchups/${enemyKey}/${myKey}.md`;
        label = `${getChampionNameByKey(myKey)} vs ${getChampionNameByKey(enemyKey)}`;
        draftKey = `draft_matchup:${enemyKey}/${myKey}`;
    }

    const textContent = localStorage.getItem(draftKey);
    if (!textContent) return;

    if (!bridgeActive || typeof CONFIG === 'undefined' || !isConfigValid) {
        alert("Cannot sync: Bridge or Config is offline.");
        return;
    }

    const statusEl = document.getElementById('status');
    statusEl.innerText = `Syncing ${label} directly to GitHub...`;

    const config = getAPIConfig();
    try {
        // Fetch current SHA checksum to prevent conflict collisions
        let sha = null;
        const response = await bridgeFetch(config.url + path, { headers: config.headers });
        if (response.ok) {
            const data = response.json();
            sha = data.sha;
        }

        // Encode string safely resolving multibyte characters
        const encodedContent = btoa(unescape(encodeURIComponent(textContent)));
        const bodyData = {
            message: `Sync: updated ${label}`,
            content: encodedContent
        };
        if (sha) bodyData.sha = sha;

        const syncResponse = await bridgeFetch(config.url + path, {
            method: 'PUT',
            headers: config.headers,
            body: JSON.stringify(bodyData)
        });

        if (syncResponse.ok) {
            // Delete local draft cache
            localStorage.removeItem(draftKey);
            renderLocalDrafts();
            
            // Sync status feedback logic for loaded matchup matching
            if (activeMatchup.draftKey === draftKey) {
                const putResult = syncResponse.json();
                currentSha = putResult.content.sha;
                githubTextCache = textContent;
                updateDiscardButtonState(false);
                const conflictBanner = document.getElementById('conflictBanner');
                if (conflictBanner) conflictBanner.style.display = 'none';
            }
            
            statusEl.innerText = `${label} successfully synced to GitHub!`;
        } else {
            statusEl.innerText = `Sync failed for ${label} (Status ${syncResponse.status}).`;
        }
    } catch (err) {
        statusEl.innerText = `Sync error for ${label}: ` + err.message;
    }
}

// --- Saved Matchups Logic & Rendering ---

/** Loads saved matchups from localStorage */
function getSavedMatchups() {
    const data = localStorage.getItem('saved_matchups');
    if (!data) return [];
    try {
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

/** Persists saved matchups list to localStorage */
function saveMatchupsList(list) {
    localStorage.setItem('saved_matchups', JSON.stringify(list));
}

/** Checks if a champion matchup is saved */
function isMatchupSaved(enemyKey, myKey) {
    if (!enemyKey || !myKey) return false;
    const saved = getSavedMatchups();
    return saved.some(m => m.enemyKey === enemyKey && m.myKey === myKey);
}

/** Toggles the saved status of the currently active matchup */
function toggleSaveMatchup() {
    if (!activeMatchup.enemyKey || !activeMatchup.myKey) return;
    
    let saved = getSavedMatchups();
    const index = saved.findIndex(m => m.enemyKey === activeMatchup.enemyKey && m.myKey === activeMatchup.myKey);
    
    if (index > -1) {
        saved.splice(index, 1);
    } else {
        saved.push({
            enemyKey: activeMatchup.enemyKey,
            myKey: activeMatchup.myKey
        });
    }
    
    saveMatchupsList(saved);
    updateStarButtonUI();
    renderSavedMatchups();
}

/** Synchronizes the star button's visibility and fill state with activeMatchup state */
function updateStarButtonUI() {
    const starBtn = document.getElementById('starBtn');
    if (!starBtn) return;
    
    // Star button is only available for actual champion matchups, not general notes
    if (!activeMatchup.enemyKey || !activeMatchup.myKey) {
        starBtn.style.display = 'none';
        return;
    }
    
    starBtn.style.display = 'inline-flex';
    const saved = isMatchupSaved(activeMatchup.enemyKey, activeMatchup.myKey);
    const svg = starBtn.querySelector('svg');
    if (svg) {
        if (saved) {
            svg.classList.add('filled');
            svg.setAttribute('fill', '#ffb100');
            svg.setAttribute('stroke', '#ffb100');
        } else {
            svg.classList.remove('filled');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
        }
    }
}

/** Renders the saved matchups list in the sidebar (with permanent General Notes at top) */
function renderSavedMatchups() {
    const container = document.getElementById('savedList');
    if (!container) return;
    
    const saved = getSavedMatchups();
    
    // General Notes is always at the top of the Saved Matchups panel
    let html = `
        <div class="draft-card permanent-card">
            <div class="draft-info">
                <span class="draft-champ">General Notes</span>
                <span class="draft-tag" style="color: var(--gold-accent);">Default</span>
            </div>
            <div class="draft-actions">
                <button class="btn-outline-sm" onclick="loadGeneralNotes()">Edit</button>
            </div>
        </div>
    `;
    
    saved.forEach(m => {
        const myName = getChampionNameByKey(m.myKey);
        const enemyName = getChampionNameByKey(m.enemyKey);
        html += `
            <div class="draft-card">
                <div class="draft-info">
                    <span class="draft-champ">${myName} vs ${enemyName}</span>
                    <span class="draft-tag" style="color: var(--text-secondary);">Saved Matchup</span>
                </div>
                <div class="draft-actions">
                    <button class="btn-outline-sm" onclick="loadDraft('${m.enemyKey}', '${m.myKey}')">Edit</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}
