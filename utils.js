/**
 * utils.js
 * Utility helper functions for League of Legends Matchup Portal
 * 
 * CORE RESPONSIBILITY:
 * 1. Champion name key conversion: Translates typing-friendly display names 
 *    (e.g., "K'Sante" or "Xin Zhao") to internal Riot Game Data Dragon IDs (e.g., "Ksante" or "XinZhao").
 * 2. Slug mapping for third-party platforms: Resolves Mobalytics URL slugs
 *    to make sure clicking the counter button loads the exact page correctly.
 */

/**
 * Converts a Riot Games Data Dragon champion key into a Mobalytics URL slug.
 * 
 * Why this is necessary:
 * - Riot Games' API identifiers use PascalCase (e.g. 'AurelionSol', 'MonkeyKing', 'DrMundo').
 * - Mobalytics counter slugs are lowercase and hyphenated (e.g. 'aurelion-sol', 'dr-mundo', or a completely different name like 'wukong' for 'MonkeyKing').
 * 
 * Custom mappings resolve these naming discrepancies to prevent dead links.
 * 
 * @param {string} key - The champion key ID (e.g. 'AurelionSol', 'Ahri').
 * @returns {string} The URL slug used by Mobalytics.
 */
function getMobalyticsSlug(key) {
    if (!key) return '';
    let slug = key.toLowerCase();
    
    // Custom mappings for special cases where lowercase isn't enough
    const customMappings = {
        'monkeyking': 'wukong',          // Wukong's internal Riot API name is MonkeyKing
        'aurelionsol': 'aurelion-sol',
        'drmundo': 'dr-mundo',
        'jarvaniv': 'jarvan-iv',
        'leesin': 'lee-sin',
        'masteryi': 'master-yi',
        'missfortune': 'miss-fortune',
        'tahmkench': 'tahm-kench',
        'twistedfate': 'twisted-fate',
        'xinzhao': 'xin-zhao',
        'nunu': 'nunu',
        'ksante': 'ksante',
        'belveth': 'belveth',
        'renata': 'renata'
    };
    return customMappings[slug] || slug;
}

/**
 * Finds the unique champion key ID by matching display names or search queries.
 * Safe against uppercase/lowercase differences and trailing spaces.
 * 
 * Example:
 * Input: "wukong" or "MonkeyKing" -> returns "MonkeyKing"
 * Input: "k'sante" -> returns "Ksante"
 * 
 * @param {string} name - The search name entered by the user.
 * @returns {string|null} The canonical champion key or null if not found.
 */
function getChampionKeyByName(name) {
    if (!name || typeof CHAMPIONS === 'undefined') return null;
    const clean = name.trim().toLowerCase();
    
    // Scan array looking for a match on name or key identifier
    const found = CHAMPIONS.find(c => c.name.toLowerCase() === clean || c.key.toLowerCase() === clean);
    return found ? found.key : null;
}

/**
 * Gets the display name of a champion using its canonical key.
 * Used to format titles and list drafts nicely.
 * 
 * Example:
 * Input: "Ksante" -> returns "K'Sante"
 * Input: "MonkeyKing" -> returns "Wukong" (or "Wukong" if fetched from Riot DDragon)
 * 
 * @param {string} key - The canonical champion key (e.g. "Ksante", "MonkeyKing").
 * @returns {string} The display name of the champion.
 */
function getChampionNameByKey(key) {
    if (!key || typeof CHAMPIONS === 'undefined') return key;
    const found = CHAMPIONS.find(c => c.key === key);
    return found ? found.name : key;
}

/**
 * Extracts the hidden JSON metadata block from the raw text.
 */
function extractMetadata(rawText) {
    if (!rawText) {
        activeMetadata = { customLinks: [], linkOrder: [] };
        return "";
    }
    const match = rawText.match(/<!-- METADATA: (.*?) -->/);
    if (match) {
        try {
            activeMetadata = JSON.parse(match[1]);
            console.log("[DEBUG] Extracted metadata successfully:", activeMetadata);
            if (!activeMetadata.customLinks) activeMetadata.customLinks = [];
            if (!activeMetadata.linkOrder) activeMetadata.linkOrder = [];
        } catch(e) {
            console.error("[DEBUG] Failed to parse metadata JSON:", e);
            activeMetadata = { customLinks: [], linkOrder: [] };
        }
        return rawText.replace(match[0], '').trimEnd();
    }
    activeMetadata = { customLinks: [], linkOrder: [] };
    console.log("[DEBUG] No metadata found in rawText");
    return rawText;
}

/**
 * Appends the hidden JSON metadata block to the clean text.
 */
function appendMetadata(cleanText) {
    if (!activeMetadata || (activeMetadata.customLinks.length === 0 && activeMetadata.linkOrder.length === 0)) {
        return cleanText;
    }
    const safeText = cleanText.trimEnd();
    const metaStr = JSON.stringify(activeMetadata);
    console.log("[DEBUG] Appending metadata to text:", metaStr);
    return safeText + `\n\n<!-- METADATA: ${metaStr} -->`;
}
