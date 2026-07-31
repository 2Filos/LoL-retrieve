/**
 * ui_analysis.js
 * Controls the Analysis multi-page dropdown system.
 */

// Global state for Analysis pages in the current context
let currentAnalysisIndex = [];

let analysisModalResolve = null;

function openAnalysisModal(title, defaultName = "") {
    return new Promise((resolve) => {
        analysisModalResolve = resolve;
        const modal = document.getElementById('analysisEditModal');
        const titleEl = document.getElementById('analysisEditTitle');
        const inputEl = document.getElementById('analysisEditName');
        
        if (titleEl) titleEl.textContent = title;
        if (inputEl) {
            inputEl.value = defaultName;
            // Clear validation styles if any
            inputEl.style.borderColor = '';
        }
        
        if (modal) {
            modal.style.display = 'flex';
            if (inputEl) inputEl.focus();
        }
    });
}

function closeAnalysisEditModal() {
    const modal = document.getElementById('analysisEditModal');
    if (modal) modal.style.display = 'none';
    if (analysisModalResolve) {
        analysisModalResolve(null);
        analysisModalResolve = null;
    }
}

function saveAnalysisEditModal() {
    const inputEl = document.getElementById('analysisEditName');
    const name = inputEl ? inputEl.value.trim() : "";
    if (!name) {
        if (inputEl) inputEl.style.borderColor = 'var(--danger)';
        return;
    }
    
    const modal = document.getElementById('analysisEditModal');
    if (modal) modal.style.display = 'none';
    
    if (analysisModalResolve) {
        analysisModalResolve(name);
        analysisModalResolve = null;
    }
}

function initAnalysisUI() {
    const btnAnalysis = document.getElementById('btn-analysis');
    const btnAdd = document.getElementById('btn-analysis-add');
    const dropdown = document.getElementById('analysis-dropdown');
    const searchInput = document.getElementById('analysis-search');
    const editInput = document.getElementById('analysisEditName');

    if (editInput) {
        editInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                saveAnalysisEditModal();
            }
        });
    }

    if (!btnAnalysis || !btnAdd || !dropdown) return;

    // Toggle dropdown
    btnAnalysis.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
        if (!dropdown.classList.contains('hidden')) {
            searchInput.focus();
            renderAnalysisList(); // Re-render to ensure fresh state
        }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !btnAnalysis.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });

    // Stop propagation inside dropdown so clicking doesn't close it
    dropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Add new page
    btnAdd.addEventListener('click', async (e) => {
        e.stopPropagation();
        const pageName = await openAnalysisModal("New Analysis Page");
        if (!pageName || pageName.trim() === "") return;

        const id = `page_${Date.now()}`;
        const newPage = {
            id: id,
            name: pageName.trim(),
            filename: `${id}.html`,
            hasContent: false // Initially empty
        };
        
        currentAnalysisIndex.push(newPage);
        renderAnalysisList();
        
        // Save the updated index to GitHub
        if (typeof saveAnalysisIndexToGitHub === 'function') {
            await saveAnalysisIndexToGitHub();
        }
    });

    // Search filtering
    searchInput.addEventListener('input', () => {
        renderAnalysisList(searchInput.value.toLowerCase());
    });
}

// Drag and drop state
let draggedItemIndex = null;

function renderAnalysisList(filter = "") {
    const listEl = document.getElementById('analysis-list');
    if (!listEl) return;
    
    listEl.innerHTML = '';
    
    currentAnalysisIndex.forEach((page, index) => {
        if (filter && !page.name.toLowerCase().includes(filter)) {
            return;
        }

        const li = document.createElement('li');
        li.draggable = true;
        li.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 6px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05); user-select: none;";
        
        // Content/name side
        const leftDiv = document.createElement('div');
        leftDiv.style.display = "flex";
        leftDiv.style.alignItems = "center";
        leftDiv.style.gap = "8px";
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = page.name;
        nameSpan.style.fontSize = "13px";
        
        leftDiv.appendChild(nameSpan);
        
        // Controls side (Rename + Delete)
        const rightDiv = document.createElement('div');
        rightDiv.style.display = "flex";
        rightDiv.style.alignItems = "center";
        rightDiv.style.gap = "8px";
        
        const renameBtn = document.createElement('button');
        renameBtn.innerHTML = "✎"; // Simple pencil icon
        renameBtn.style.cssText = "background: none; border: none; color: var(--gold-accent); cursor: pointer; font-size: 12px; padding: 2px 4px;";
        renameBtn.title = "Rename page";
        
        renameBtn.onclick = async (e) => {
            e.stopPropagation();
            const newName = await openAnalysisModal("Rename Analysis Page", page.name);
            if (newName && newName.trim() !== "") {
                page.name = newName.trim();
                renderAnalysisList(document.getElementById('analysis-search').value.toLowerCase());
                if (typeof saveAnalysisIndexToGitHub === 'function') {
                    await saveAnalysisIndexToGitHub();
                }
            }
        };

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = "🗑"; // Trash icon
        deleteBtn.style.cssText = "background: none; border: none; color: var(--danger); cursor: pointer; font-size: 12px; padding: 2px 4px; opacity: 0.7;";
        deleteBtn.title = "Delete page";
        
        deleteBtn.onclick = async (e) => {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete the analysis page "${page.name}"? This action cannot be undone.`)) {
                // Remove from array
                currentAnalysisIndex.splice(index, 1);
                renderAnalysisList(document.getElementById('analysis-search').value.toLowerCase());
                if (typeof saveAnalysisIndexToGitHub === 'function') {
                    await saveAnalysisIndexToGitHub();
                }
            }
        };
        
        rightDiv.appendChild(renameBtn);
        rightDiv.appendChild(deleteBtn);
        
        li.appendChild(leftDiv);
        li.appendChild(rightDiv);
        
        // Hover effect
        li.addEventListener('mouseenter', () => li.style.background = "rgba(255,255,255,0.1)");
        li.addEventListener('mouseleave', () => li.style.background = "transparent");
        
        // Click to load page
        li.addEventListener('click', () => {
            document.getElementById('analysis-dropdown').classList.add('hidden');
            loadAnalysisPage(page);
        });
        
        // --- Drag and Drop Logic ---
        li.addEventListener('dragstart', (e) => {
            draggedItemIndex = index;
            e.dataTransfer.effectAllowed = 'move';
            li.style.opacity = '0.5';
        });
        
        li.addEventListener('dragend', () => {
            li.style.opacity = '1';
            draggedItemIndex = null;
            document.querySelectorAll('#analysis-list li').forEach(el => {
                el.style.borderTop = '';
                el.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            });
        });
        
        li.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            // Provide visual feedback
            const rect = li.getBoundingClientRect();
            const relY = e.clientY - rect.top;
            if (relY < rect.height / 2) {
                li.style.borderTop = '2px solid var(--gold-accent)';
                li.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            } else {
                li.style.borderTop = '';
                li.style.borderBottom = '2px solid var(--gold-accent)';
            }
        });
        
        li.addEventListener('dragleave', () => {
            li.style.borderTop = '';
            li.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
        });
        
        li.addEventListener('drop', async (e) => {
            e.preventDefault();
            li.style.borderTop = '';
            li.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            
            if (draggedItemIndex === null || draggedItemIndex === index) return;
            
            const rect = li.getBoundingClientRect();
            const relY = e.clientY - rect.top;
            let targetIndex = index;
            
            // Adjust insertion point based on whether dropped on top half or bottom half
            if (relY > rect.height / 2) {
                targetIndex++;
            }
            
            // Array mutation
            const item = currentAnalysisIndex.splice(draggedItemIndex, 1)[0];
            // If dragging down, adjusting targetIndex
            if (draggedItemIndex < targetIndex) {
                targetIndex--;
            }
            currentAnalysisIndex.splice(targetIndex, 0, item);
            
            renderAnalysisList(document.getElementById('analysis-search').value.toLowerCase());
            
            if (typeof saveAnalysisIndexToGitHub === 'function') {
                await saveAnalysisIndexToGitHub();
            }
        });
        
        listEl.appendChild(li);
    });
}

function loadAnalysisPage(page) {
    if (typeof DEBUG_CONFIG !== 'undefined' && DEBUG_CONFIG.logEditorFlow) {
        console.log(`[DEBUG EditorFlow] Loading Analysis Page: ${page.name} (${page.filename})`);
    }
    
    // Save draft before switching if any
    if (typeof saveDraftBeforeSwitch === 'function') {
        saveDraftBeforeSwitch();
    }
    
    // Switch UI into Analysis mode
    activePageSide = 'analysis';
    localStorage.setItem('editor_active_tab_side', 'analysis');
    localStorage.setItem('editor_active_analysis_filename', page.filename);
    
    // Deselect other tabs
    ['tabLeft', 'tabRight', 'tabRef'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });
    
    // Highlight Analysis button
    const btn = document.getElementById('btn-analysis');
    if (btn) btn.classList.add('active');
    
    // Build path
    const isMatchup = activeMatchup && activeMatchup.enemyKey && activeMatchup.myKey;
    const folderPath = isMatchup ? 
        `matchups/${activeMatchup.enemyKey}/${activeMatchup.myKey}/Analysis` : 
        `matchups/General/Analysis`;
        
    const fullPath = `${folderPath}/${page.filename}`;
    const draftKey = `draft_analysis:${fullPath}`;
    
    activeMatchup.path = fullPath;
    activeMatchup.draftKey = draftKey;
    activeMatchup.isAnalysisPage = true;
    
    // Reconstruct base label to prevent infinite appending when switching pages
    const baseLabel = isMatchup ? `${activeMatchup.myKey} vs ${activeMatchup.enemyKey}` : 'General';
    
    if (typeof loadMatchupByPath === 'function') {
        loadMatchupByPath(fullPath, `${baseLabel} - ${page.name}`, draftKey, activeMatchup.enemyKey, activeMatchup.myKey);
    }
}

async function loadAnalysisIndex() {
    currentAnalysisIndex = [];
    renderAnalysisList();
    
    if (!bridgeActive || typeof CONFIG === 'undefined' || !isConfigValid) {
        return;
    }
    
    const isMatchup = activeMatchup && activeMatchup.enemyKey && activeMatchup.myKey;
    const folderPath = isMatchup ? 
        `matchups/${activeMatchup.enemyKey}/${activeMatchup.myKey}/Analysis` : 
        `matchups/General/Analysis`;
    const indexPath = `${folderPath}/index.json`;
    
    const config = getAPIConfig();
    try {
        const url = `${config.url}${indexPath}?t=${Date.now()}`;
        const fetchHeaders = Object.assign({}, config.headers, {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        const response = await bridgeFetch(url, { headers: fetchHeaders });
        if (response.ok) {
            const data = await response.json();
            const decodedTextRaw = decodeURIComponent(escape(atob(data.content)));
            currentAnalysisIndex = JSON.parse(decodedTextRaw);
            renderAnalysisList();
        }
    } catch (e) {
        console.warn("[Analysis] Could not load index:", e.message);
    }
}

async function saveAnalysisIndexToGitHub() {
    if (!bridgeActive || typeof CONFIG === 'undefined' || !isConfigValid) {
        alert("Cannot save Analysis structure in offline mode.");
        return;
    }
    
    const isMatchup = activeMatchup && activeMatchup.enemyKey && activeMatchup.myKey;
    const folderPath = isMatchup ? 
        `matchups/${activeMatchup.enemyKey}/${activeMatchup.myKey}/Analysis` : 
        `matchups/General/Analysis`;
    const indexPath = `${folderPath}/index.json`;
    
    const config = getAPIConfig();
    const payloadContent = btoa(unescape(encodeURIComponent(JSON.stringify(currentAnalysisIndex, null, 2))));
    
    try {
        // First get the SHA of the existing index.json if it exists
        let currentSha = null;
        const getRes = await bridgeFetch(`${config.url}${indexPath}?t=${Date.now()}`, { headers: config.headers });
        if (getRes.ok) {
            const data = await getRes.json();
            currentSha = data.sha;
        }
        
        const payload = {
            message: `Update Analysis Index for ${isMatchup ? (activeMatchup.myKey + ' vs ' + activeMatchup.enemyKey) : 'General'}`,
            content: payloadContent
        };
        if (currentSha) payload.sha = currentSha;
        
        const putRes = await bridgeFetch(`${config.url}${indexPath}`, {
            method: 'PUT',
            headers: config.headers,
            body: JSON.stringify(payload)
        });
        
        if (putRes.ok) {
            console.log("[Analysis] Index saved successfully.");
        } else {
            console.error("[Analysis] Failed to save index.");
        }
    } catch (e) {
        console.error("[Analysis] Error saving index:", e);
    }
}

// Call init when DOM is ready
document.addEventListener('DOMContentLoaded', initAnalysisUI);
