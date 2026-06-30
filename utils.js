// utils.js
// Utility functions for LoL Matchup Portal

/**
 * Converts a Riot Games Data Dragon champion key into a Mobalytics URL slug.
 * E.g., 'MonkeyKing' -> 'wukong', 'DrMundo' -> 'dr-mundo'.
 * 
 * @param {string} key - The champion key (e.g. 'AurelionSol', 'Ahri').
 * @returns {string} The slug used by Mobalytics.
 */
function getMobalyticsSlug(key) {
    if (!key) return '';
    let slug = key.toLowerCase();
    const customMappings = {
        'monkeyking': 'wukong',
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
 * Finds the champion key ID by checking against the display name or case-insensitive key.
 * 
 * @param {string} name - The typed name of the champion.
 * @returns {string|null} The canonical champion key or null if not found.
 */
function getChampionKeyByName(name) {
    if (!name || typeof CHAMPIONS === 'undefined') return null;
    const clean = name.trim().toLowerCase();
    const found = CHAMPIONS.find(c => c.name.toLowerCase() === clean || c.key.toLowerCase() === clean);
    return found ? found.key : null;
}

/**
 * Gets the display name of a champion using its canonical key.
 * 
 * @param {string} key - The champion key.
 * @returns {string} The display name of the champion (e.g. "K'Sante").
 */
function getChampionNameByKey(key) {
    if (!key || typeof CHAMPIONS === 'undefined') return key;
    const found = CHAMPIONS.find(c => c.key === key);
    return found ? found.name : key;
}
