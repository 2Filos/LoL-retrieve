/**
 * ui_core.js
 * General DOM manipulation and UI feedback states.
 * Handles champion portrait icon rendering, discard button confirmation flow,
 * quick search auto-fill input, and textarea height persistence.
 */

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

// --- Links Panel Toggle ---
function toggleLinksPanel() {
    const container = document.getElementById('detectedLinksContainer');
    if (container) {
        container.classList.toggle('collapsed');
    }
}

// --- Textarea Height Persistence ---
(function () {
    // Wait for DOM to load if included in head, but usually runs at end of body.
    window.addEventListener('DOMContentLoaded', () => {
        const editor = document.getElementById('editor');
        if (!editor) return;

        // Observe resize via ResizeObserver
        let resizeTimeout;
        const observer = new ResizeObserver(() => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                localStorage.setItem('matchup_editor_height', editor.style.height);
            }, 200);
        });
        observer.observe(editor);
    });
})();

// --- Champion Portrait Icons UI Update ---
function updateChampionPortraits() {
    const portraits = document.getElementById('matchupPortraits');
    const fileLabel = document.getElementById('currentFileLabel');
    const myIcon = document.getElementById('myChampIcon');
    const enemyIcon = document.getElementById('enemyChampIcon');
    const myName = document.getElementById('myChampName');
    const enemyName = document.getElementById('enemyChampName');

    if (!portraits || !fileLabel) return;

    // Check if we have a real matchup loaded (not General Notes)
    if (typeof activeMatchup !== 'undefined' && activeMatchup && activeMatchup.myKey && activeMatchup.enemyKey) {
        // Show portrait block, hide text label
        portraits.style.display = 'flex';
        fileLabel.style.display = 'none';

        // Use DDragon for champion icons (latest patch)
        const version = typeof ddragonVersion !== 'undefined' && ddragonVersion ? ddragonVersion : '14.13.1';
        myIcon.src = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${activeMatchup.myKey}.png`;
        myIcon.alt = activeMatchup.myKey;
        enemyIcon.src = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${activeMatchup.enemyKey}.png`;
        enemyIcon.alt = activeMatchup.enemyKey;

        // Set names below icons
        const myDisplayName = typeof getChampionNameByKey === 'function' ? getChampionNameByKey(activeMatchup.myKey) : activeMatchup.myKey;
        const enemyDisplayName = typeof getChampionNameByKey === 'function' ? getChampionNameByKey(activeMatchup.enemyKey) : activeMatchup.enemyKey;
        myName.textContent = myDisplayName;
        enemyName.textContent = enemyDisplayName;
    } else {
        // No matchup — show text label, hide portraits
        portraits.style.display = 'none';
        fileLabel.style.display = 'inline';
    }
}

// Observe DOM changes on the fileLabel to trigger portrait updates automatically
window.addEventListener('DOMContentLoaded', () => {
    const _fileLabelEl = document.getElementById('currentFileLabel');
    if (_fileLabelEl) {
        const _labelObserver = new MutationObserver(() => {
            updateChampionPortraits();
        });
        _labelObserver.observe(_fileLabelEl, { childList: true, characterData: true, subtree: true });
    }
});

// --- Auto-fill Matchup Input ---
window.addEventListener('DOMContentLoaded', () => {
    const quickInput = document.getElementById('quickMatchup');
    if (quickInput) {
        quickInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            const match = val.match(/^(.+?)\s+vs\s+(.+?)(?:\s+(top|jungle|jng|mid|adc|support|sup))?$/i);
            
            if (match) {
                const champA_raw = match[1].trim();
                const champB_raw = match[2].trim();
                const roleInput = match[3] ? match[3].toLowerCase() : null;

                // Validate if both inputs are fully typed known champions
                const isChampA = typeof getChampionKeyByName === 'function' ? getChampionKeyByName(champA_raw) : CHAMPIONS.find(c => c.name.toLowerCase() === champA_raw.toLowerCase());
                const isChampB = typeof getChampionKeyByName === 'function' ? getChampionKeyByName(champB_raw) : CHAMPIONS.find(c => c.name.toLowerCase() === champB_raw.toLowerCase());

                if (isChampA && isChampB) {
                    const myChampEl = document.getElementById('myChamp');
                    const enemyChampEl = document.getElementById('enemyChamp');
                    
                    if (myChampEl && enemyChampEl) {
                        const capitalize = (s) => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                        myChampEl.value = (typeof getChampionNameByKey === 'function') ? (getChampionNameByKey(isChampA) || capitalize(champA_raw)) : capitalize(champA_raw);
                        enemyChampEl.value = (typeof getChampionNameByKey === 'function') ? (getChampionNameByKey(isChampB) || capitalize(champB_raw)) : capitalize(champB_raw);
                    }

                    if (roleInput) {
                        const roleSelect = document.getElementById('roleSelect');
                        if (roleSelect) {
                            let roleVal = roleInput;
                            if (roleInput === 'jng') roleVal = 'jungle';
                            if (roleInput === 'sup') roleVal = 'support';
                            
                            Array.from(roleSelect.options).forEach(opt => {
                                if (opt.value === roleVal) {
                                    roleSelect.value = roleVal;
                                }
                            });
                        }
                    }
                }
            }
        });

        quickInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const loadBtn = document.getElementById('loadBtn');
                if (loadBtn && !loadBtn.disabled) {
                    loadBtn.click();
                }
            }
        });
    }
});
