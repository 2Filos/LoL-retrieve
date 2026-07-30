# Project 22 — Matchup Page Data Display & Bi-Directional Relink Protocol

> [!CAUTION]
> **MANDATORY AGENT DIRECTIVE — VERIFY EVERYTHING**: Be doubtful of the code blueprints, schemas, and instructions in this project file. Do NOT blindly copy or assume code. You MUST empirically verify all HTML structures, DOM nodes, CSS classes, and variables against live codebase files (`vsm-assets/vs-multi-render.js`, `vsm-assets/vs-multi.css`, `vsm-assets/vsm-history.js`, `src/userscript/orchestrator.js`) and runtime execution before writing code!

## Project Goal
**Phase 1 (Completed)**: Render transmitted matchup data at the bottom of `matchups.html` using the exact high-fidelity visual layout as the `VS-MULTI` dashboard row, and establish the bi-directional Relink protocol.
**Phase 2 (Current Focus)**: Transition the data display to a **vertical layout** positioned to the right of the note area on `matchups.html`, stripping out redundant elements (like champion avatars) and organizing the data into stacked rows (Winrate Bars, Deltas, Runes, Starters, Summoners, Build, History).

---

## Raw User Direct Instructions (Prompts)
> 1. "ok. prepare project 22. to start, I'd like, in matchup page, at the bottom, the SAME exact display (row with all data organized EXACTLY in the same way). later we'll change it, but first I want to verify everything is in order and a straight copy seems straightforward. am i wrong? furthermore, i'd like to add to the matchup page, besides linked:xxx a yellow/green button "relink". basically it should check if a tab with that same number exists, if it doesn't it should find any tab it can linkto and by clicking relink... well relink. this is actually needed on both sides."
> 2. "relink looks good. update project. relink button doesn't work from matchup page side. as for displaying of stats in matchup page... i see nothing at all"
> 3. "they look nothing alike. update project. we'll move to new chat to work on this issue. make sure ALL the relevant information (all relevant files and parts of code) are outlined in project file."
> 4. "evaluate if you can add more information. add a 'be doubtful of information in this project file, verify everything'. also in planning folder i added two png for how ti should be vs how it is. note that, once we have fixed it (in the sense that the information is correctly displayed like in version A or very very similarly) i'll want to transition to a vertical display that we'll place to the right of the note area, but that's for later"
> 5. "looks good. next step is transition to verticality. update project file. @[Planning/P22-C.png] we'll work on that in a new chat. generally speaking, no need for the icons for yorick vs sett. what we need is. row one win rate color bars, row two win rates and deltas + LKR. row 3, runes. row 4, starting items. row 5, summoners. row 6, build, row 7, history. update/expand project file with this idea"

---

## Current Status & Next Chat Handoff Summary

### ✅ Phase 1: Completed & Verified
1. **Bi-Directional Relink Handshake Protocol (`v2.5.5`)**:
   - `RELINK` button works across both `VS-MULTI.html` and `matchups.html`.
2. **Horizontal 1:1 Dashboard Parity (`v2.5.6`)**:
   - The fallback text box in `matchups.html` was successfully rewritten to use the exact `vs-multi-render.js` CSS grid and HTML structure.
   - User confirmed visual parity.

---

### 🚨 Phase 2: Next Chat Handoff (Transition to Verticality)

We are now moving to Phase 2: transforming the horizontal row into a stacked vertical panel positioned to the **right of the note area** in `matchups.html`. The user provided [`Planning/P22-C.png`](file:///c:/Users/User/Documents/App%20Browser/Planning/P22-C.png) as a reference layout concept.

#### Vertical Layout Requirements:
The vertical panel should be stripped of redundant champion avatars (since `matchups.html` already implies the matchup). It will be structured into the following stacked rows:
- **Row 1**: Win rate color bars
- **Row 2**: Win rates (%) and Deltas (Δ1, Δ2) + LKR
- **Row 3**: Runes
- **Row 4**: Starting Items
- **Row 5**: Summoner Spells
- **Row 6**: Core Build
- **Row 7**: Personal History Card

*Note: The next chat must adapt the CSS injected into `matchups.html` by `orchestrator.js` to enforce a vertical flex/grid layout and precisely position this new container to the right of the note area.*

---

## Technical Specifications & Relevant Files / Code Outline

To render an **exact copy** of the `VS-MULTI` row at the bottom of `matchups.html`, the next agent must copy the CSS and HTML generation logic directly from the following codebase files:

### 1. Style Source of Truth (`vsm-assets/vs-multi.css`)
Must inject these core CSS classes into `matchups.html` via `<style id="vsmInjectedRowStyles">`:
```css
/* Container & Main Row */
.vsm-transmitted-container { margin: 24px 0 12px 0; padding: 16px; background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
.row { display: flex; flex-direction: column; background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; margin-bottom: 8px; padding: 6px 10px; }
.main-row { display: flex; align-items: center; gap: 12px; height: 100%; width: 100%; min-width: max-content; }

/* Champion Icons Cell */
.res-champs { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.res-champ { display: flex; flex-direction: column; align-items: center; font-size: 10px; font-weight: 700; color: #cbd5e1; }
.res-champ img { width: 36px; height: 36px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.15); }
.res-vs { font-size: 11px; font-weight: 800; color: #64748b; margin: 0 2px; }

/* Winrate Section & Bars */
.wr-section { display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }
.wr-bar-row { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; }
.wr-icon { width: 14px; height: 14px; border-radius: 2px; }
.wr-bar { width: 60px; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
.wr-fill { height: 100%; transition: width 0.3s ease; }
.games-box { font-size: 9px; padding: 1px 4px; background: rgba(255,255,255,0.06); border-radius: 3px; color: #94a3b8; font-weight: 600; }

/* LKR & Deltas */
.lkr-col { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2px 6px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; font-size: 10px; }
.delta-row { display: flex; gap: 4px; align-items: center; }
.delta-box { display: inline-flex; align-items: center; gap: 2px; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; border: 1px solid rgba(255,255,255,0.1); }
.delta-pos { color: #10b981; border-color: rgba(16,185,129,0.3); background: rgba(16,185,129,0.1); }
.delta-neg { color: #ef4444; border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.1); }

/* Runes, Starters, Summoners Containers */
.rs-col-c { display: flex; align-items: center; gap: 6px; padding: 4px 8px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; flex-shrink: 0; }
.entry-icons-c { display: flex; flex-direction: column; gap: 2px; align-items: center; }
.entry-icons-c img { width: 22px; height: 22px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); }
.entry-icons-c img.sub-c { width: 16px; height: 16px; border-radius: 50%; }
.entry-stats-c { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; }

/* Core Build Path Container */
.bd-core-col { display: flex; align-items: center; padding: 4px 8px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; flex-shrink: 0; }
.core-row { display: flex; align-items: center; gap: 6px; }
.core-group { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.core-icons { display: flex; align-items: center; gap: 2px; }
.core-icons img { width: 24px; height: 24px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); }
.core-group-arrow { color: #64748b; font-size: 10px; font-weight: 800; }

/* Personal History Column */
.history-col-container { display: flex; flex-direction: column; justify-content: center; width: 118px; padding: 6px 8px; gap: 5px; background: rgba(255, 255, 255, 0.015); border: 1px solid rgba(255, 255, 255, 0.07); border-radius: 8px; flex-shrink: 0; }
.hist-wl-row { display: flex; align-items: center; gap: 4px; height: 16px; }
.hist-bar { display: flex; flex: 1; height: 14px; border-radius: 8px; overflow: hidden; font-size: 9px; font-weight: 800; line-height: 14px; color: #fff; background: rgba(255,255,255,0.06); }
.hist-w { background: #3b82f6; display: flex; align-items: center; justify-content: center; }
.hist-l { background: #ef4444; display: flex; align-items: center; justify-content: center; }
.hist-grid-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
.stat-pill { display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 8px; text-transform: uppercase; font-weight: 700; color: #64748b; }
```

### 2. Main Row Skeleton & HTML Generation (`vsm-assets/vs-multi-render.js`)
- `renderResults(matchups)` HTML Skeleton:
```html
<div class="row">
  <div class="main-row">
    <div class="res-champs">...</div>
    <div class="wr-section">...</div>
    <div class="rs-col-c rune-container">...</div>
    <div class="rs-col-c starter-container">...</div>
    <div class="rs-col-c summ-container">...</div>
    <div class="bd-core-col core-container">...</div>
    <div class="actions">
      <button class="act-btn btn-lola">L</button>
      <button class="act-btn btn-opgg">O</button>
      <a class="act-btn btn-matchups">M</a>
    </div>
    <div class="history-col-container">...</div>
  </div>
</div>
```

### 3. `renderRS` Icon & Stat Generator Helper
```javascript
function renderRS(container, hwrImg1, hwrImg2, hwrWr, hwrGames, mcImg1, mcImg2, mcWr, mcGames, isSame) {
  let html = '';
  const hwrGamesStr = formatGames(hwrGames);
  html += `
    <div class="entry-icons-c">
      <img src="${hwrImg1}">
      ${hwrImg2 ? `<img src="${hwrImg2}" ${hwrImg2.includes('perk-images') ? 'class="sub-c"' : ''}>` : ''}
    </div>
    <div class="entry-stats-c">
      <span class="wr" style="color: ${wrToBar(hwrWr).color};">${Number(hwrWr).toFixed(1)}%</span>
      <span class="games-box">${hwrGamesStr || '/'}</span>
    </div>
  `;
  if (!isSame && mcImg1) {
    const mcGamesStr = formatGames(mcGames);
    html += `
      <div class="entry-icons-c">
        <img src="${mcImg1}">
        ${mcImg2 ? `<img src="${mcImg2}" ${mcImg2.includes('perk-images') ? 'class="sub-c"' : ''}>` : ''}
      </div>
      <div class="entry-stats-c">
        <span class="wr" style="color: ${wrToBar(mcWr).color};">${Number(mcWr).toFixed(1)}%</span>
        <span class="games-box">${mcGamesStr || '/'}</span>
      </div>
    `;
  }
  container.innerHTML = html;
}
```

### 4. Personal History Card Structure (`vsm-assets/vsm-history.js`)
```html
<div class="history-col-container">
  <div class="hist-wl-row">
    <div class="hist-bar">
      <div class="hist-w" style="width: ${winsPct}%;">${wins}W</div>
      <div class="hist-l" style="width: ${lossesPct}%;">${losses}L</div>
    </div>
    <div class="hist-wr">${winratePct}%</div>
  </div>
  <div class="hist-grid-stats">
    <div class="stat-pill"><span class="stat-pill-label">LANE</span><span style="color: #ef4444;">${laneRatio}</span></div>
    <div class="stat-pill"><span class="stat-pill-label">OP SCR</span><span style="color: #ef4444;">${opScore}</span></div>
    <div class="stat-pill"><span class="stat-pill-label">KDA</span><span style="color: #10b981;">${kda}</span></div>
    <div class="stat-pill"><span class="stat-pill-label">CS/M</span><span style="color: #cbd5e1;">${csm}</span></div>
  </div>
</div>
```

---

## 5. Data Payload Schema & Complete JavaScript Implementation Blueprint

### Transmission Envelope Schema (`env` object passed to `renderMatchupPageDataRow`):
```javascript
{
  pairId: 781,                // Pair ID integer
  champ1: "garen",           // Primary champion slug
  champ2: "sett",            // Enemy champion slug
  timestamp: 1785152672189,   // Unix timestamp
  cachedEntries: [            // Array of stat payloads collected by VS-MULTI
    {
      platform: "lolalytics",
      winrate: 50.63,
      games: 33000,
      rawDiff: 2.97,          // Δ1
      normalizedDiff: -0.14,  // Δ2
      primaryRune: "Conqueror",
      primaryRuneImg: "https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/Precision/Conqueror/Conqueror.png",
      subRune: "Resolve",
      subRuneImg: "https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/7204_Resolve.png",
      runeWinrate: 53.1,
      runeGames: 7600,
      mcPrimaryRune: "Lethal Tempo",
      mcPrimaryRuneImg: "...",
      mcSubRune: "Sorcery",
      mcSubRuneImg: "...",
      mcRuneWinrate: 49.9,
      mcRuneGames: 24600,
      primaryItem: "Doran's Shield",
      primaryItemImg: "https://ddragon.leagueoflegends.com/cdn/14.1.1/img/item/1054.png",
      primaryItem2: "Health Potion",
      primaryItem2Img: "https://ddragon.leagueoflegends.com/cdn/14.1.1/img/item/2003.png",
      itemWinrate: 50.8,
      itemGames: 18900,
      summoner1: "Flash",
      summoner1Img: "https://ddragon.leagueoflegends.com/cdn/14.1.1/img/spell/SummonerFlash.png",
      summoner2: "Ghost",
      summoner2Img: "https://ddragon.leagueoflegends.com/cdn/14.1.1/img/spell/SummonerHaste.png",
      summonerWinrate: 52.1,
      summonerGames: 700,
      mcSummoner1: "Flash",
      mcSummoner1Img: "...",
      mcSummoner2: "Ignite",
      mcSummoner2Img: "...",
      mcSummonerWinrate: 50.8,
      mcSummonerGames: 29800,
      coreItems: [
        { name: "Trinity Force", img: "https://ddragon.leagueoflegends.com/cdn/14.1.1/img/item/3078.png", winrate: 54.1, games: 900 },
        { name: "Boots of Swiftness", img: "https://ddragon.leagueoflegends.com/cdn/14.1.1/img/item/3009.png", winrate: 53.7, games: 4800 },
        { name: "Youmuu's Ghostblade", img: "https://ddragon.leagueoflegends.com/cdn/14.1.1/img/item/3142.png", winrate: 54.4, games: 2900 }
      ],
      mcCoreItems: [
        { name: "Stridebreaker", img: "...", winrate: 51.1, games: 30400 },
        { name: "Berserker's Greaves", img: "...", winrate: 50.3, games: 19900 },
        { name: "Phantom Dancer", img: "...", winrate: 52.5, games: 16700 }
      ]
    },
    {
      platform: "opgg",
      winrate: 49.5,
      games: 15200,
      laneKillRate: 48.2
    },
    {
      platform: "opgg_personal", // or combined / history
      wins: 4,
      losses: 12,
      winrate: 25,
      kda: 25.25,
      csm: 8.1,
      laning: "40:60",
      opScore: 3.8
    }
  ]
}
```

### Complete Drop-In JavaScript Code for Next Chat:
```javascript
function renderMatchupPageDataRow(env) {
  if (!env || !env.champ1 || !env.champ2) return;
  
  let container = document.getElementById('vsmTransmittedRowContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'vsmTransmittedRowContainer';
    container.className = 'vsm-transmitted-container';
    
    if (!document.getElementById('vsmInjectedRowStyles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'vsmInjectedRowStyles';
      styleEl.textContent = `/* Full CSS injected from section 1 above */`;
      document.head.appendChild(styleEl);
    }

    const parent = document.querySelector('.app-container') || document.body || document.documentElement;
    parent.appendChild(container);
  }

  const entries = env.cachedEntries || [];
  const latest = env.latestPayload;
  const c1 = env.champ1.toLowerCase();
  const c2 = env.champ2.toLowerCase();
  const c1Caps = c1.charAt(0).toUpperCase() + c1.slice(1);
  const c2Caps = c2.charAt(0).toUpperCase() + c2.slice(1);

  const lola = entries.find(e => !e.platform || e.platform === 'lolalytics') || (latest && (!latest.platform || latest.platform === 'lolalytics') ? latest : null);
  const opgg = entries.find(e => e.platform === 'opgg') || (latest && latest.platform === 'opgg' ? latest : null);
  const hist = entries.find(e => e.platform === 'combined' || e.platform === 'opgg_personal' || e.platform === 'history');

  // Format Helper
  function formatGames(g) {
    if (!g) return '';
    const k = g / 1000;
    return k >= 1 ? k.toFixed(1).replace(/\.0$/, '') + 'K' : String(g);
  }

  function wrToBar(winrate) {
    if (winrate == null || isNaN(winrate)) return { fillPct: 0, color: 'var(--muted, #64748b)' };
    const lo = 45, hi = 55;
    const clamped = Math.max(lo, Math.min(hi, winrate));
    const pct = ((clamped - lo) / (hi - lo)) * 100;
    const color = winrate >= 50 ? '#10b981' : '#ef4444';
    return { fillPct: pct, color };
  }

  function buildRSHTML(hwrImg1, hwrImg2, hwrWr, hwrGames, mcImg1, mcImg2, mcWr, mcGames) {
    if (!hwrImg1) return '<span style="color: #64748b; font-size: 10px;">/</span>';
    let html = `
      <div class="entry-icons-c">
        <img src="${hwrImg1}">
        ${hwrImg2 ? `<img src="${hwrImg2}" class="${hwrImg2.includes('perk-images') ? 'sub-c' : ''}">` : ''}
      </div>
      <div class="entry-stats-c">
        <span class="wr" style="color: ${wrToBar(hwrWr).color}; font-weight: 800; font-size: 11px;">${hwrWr ? Number(hwrWr).toFixed(1) + '%' : '--'}</span>
        <span class="games-box">${formatGames(hwrGames) || '/'}</span>
      </div>
    `;
    if (mcImg1) {
      html += `
        <div class="entry-icons-c" style="margin-left: 6px;">
          <img src="${mcImg1}">
          ${mcImg2 ? `<img src="${mcImg2}" class="${mcImg2.includes('perk-images') ? 'sub-c' : ''}">` : ''}
        </div>
        <div class="entry-stats-c">
          <span class="wr" style="color: ${wrToBar(mcWr).color}; font-weight: 800; font-size: 11px;">${mcWr ? Number(mcWr).toFixed(1) + '%' : '--'}</span>
          <span class="games-box">${formatGames(mcGames) || '/'}</span>
        </div>
      `;
    }
    return html;
  }

  const lolaWr = lola && lola.winrate != null ? Number(lola.winrate).toFixed(1) + '%' : '--';
  const lolaGames = lola && lola.games ? formatGames(lola.games) : '--';
  const opggWr = opgg && opgg.winrate != null ? Number(opgg.winrate).toFixed(1) + '%' : '--';
  const opggGames = opgg && opgg.games ? formatGames(opgg.games) : '--';

  const wins = hist ? (hist.wins || 0) : 0;
  const losses = hist ? (hist.losses || 0) : 0;
  const total = wins + losses;
  const histWrPct = hist && hist.winrate != null ? Math.round(hist.winrate) : (total > 0 ? Math.round((wins / total) * 100) : 0);
  const winsWidth = total > 0 ? (wins / total) * 100 : 50;
  const lossesWidth = total > 0 ? (losses / total) * 100 : 50;

  container.innerHTML = `
    <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: #94a3b8; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
      <span>⚔️ Live Transmitted Matchup Data (${c1Caps} vs ${c2Caps})</span>
      <span style="font-size: 10px; color: #10b981; background: rgba(16,185,129,0.15); padding: 2px 6px; border-radius: 4px;">Pair ${env.pairId || '--'}</span>
    </div>
    <div class="row">
      <div class="main-row">
        <!-- Champ Avatars -->
        <div class="res-champs">
          <div class="res-champ"><img src="https://cdn5.lolalytics.com/champx46/${c1}.webp" alt="${c1Caps}"><span>${c1Caps}</span></div>
          <div class="res-vs">VS</div>
          <div class="res-champ"><img src="https://cdn5.lolalytics.com/champx46/${c2}.webp" alt="${c2Caps}"><span>${c2Caps}</span></div>
        </div>

        <!-- Winrate Section -->
        <div class="wr-section">
          <div class="wr-bar-row">
            <img src="https://lolalytics.com/favicon.ico" class="wr-icon">
            <div class="wr-bar"><div class="wr-fill" style="width: ${wrToBar(lola?.winrate).fillPct}%; background: ${wrToBar(lola?.winrate).color};"></div></div>
            <span style="color: ${wrToBar(lola?.winrate).color}; font-weight: 800;">${lolaWr}</span>
            <span class="games-box">${lolaGames}</span>
          </div>
          <div class="wr-bar-row">
            <img src="https://op.gg/favicon.ico" class="wr-icon">
            <div class="wr-bar"><div class="wr-fill" style="width: ${wrToBar(opgg?.winrate).fillPct}%; background: ${wrToBar(opgg?.winrate).color};"></div></div>
            <span style="color: ${wrToBar(opgg?.winrate).color}; font-weight: 800;">${opggWr}</span>
            <span class="games-box">${opggGames}</span>
          </div>
        </div>

        <!-- LKR & Deltas -->
        <div class="lkr-col">
          <span style="font-size: 8px; color: #64748b; font-weight: 700;">LKR</span>
          <span style="color: #f59e0b; font-weight: 800;">${lola?.lkr ? lola.lkr + '%' : (opgg?.laneKillRate ? opgg.laneKillRate + '%' : '--')}</span>
        </div>

        <div class="delta-row">
          <span class="delta-box ${lola?.rawDiff > 0 ? 'delta-pos' : 'delta-neg'}"><span style="color:#64748b;">Δ1</span> ${lola?.rawDiff ? (lola.rawDiff > 0 ? '+' : '') + lola.rawDiff + '%' : '--'}</span>
          <span class="delta-box ${lola?.normalizedDiff > 0 ? 'delta-pos' : 'delta-neg'}"><span style="color:#64748b;">Δ2</span> ${lola?.normalizedDiff ? (lola.normalizedDiff > 0 ? '+' : '') + lola.normalizedDiff + '%' : '--'}</span>
        </div>

        <!-- Runes Column -->
        <div class="rs-col-c">
          ${buildRSHTML(lola?.primaryRuneImg, lola?.subRuneImg, lola?.runeWinrate, lola?.runeGames, lola?.mcPrimaryRuneImg, lola?.mcSubRuneImg, lola?.mcRuneWinrate, lola?.mcRuneGames)}
        </div>

        <!-- Starters Column -->
        <div class="rs-col-c">
          ${buildRSHTML(lola?.primaryItemImg, lola?.primaryItem2Img, lola?.itemWinrate, lola?.itemGames, lola?.mcPrimaryItemImg, lola?.mcPrimaryItem2Img, lola?.mcItemWinrate, lola?.mcItemGames)}
        </div>

        <!-- Summoners Column -->
        <div class="rs-col-c">
          ${buildRSHTML(lola?.summoner1Img, lola?.summoner2Img, lola?.summonerWinrate, lola?.summonerGames, lola?.mcSummoner1Img, lola?.mcSummoner2Img, lola?.mcSummonerWinrate, lola?.mcSummonerGames)}
        </div>

        <!-- Core Build Column -->
        <div class="bd-core-col">
          <div class="core-row">
            ${lola && lola.coreItems && lola.coreItems.length ? lola.coreItems.map((ci, idx) => `
              <div class="core-group">
                <div class="core-icons"><img src="${ci.img}" title="${ci.name}"></div>
                <span style="font-size: 10px; font-weight: 800; color: ${wrToBar(ci.winrate).color};">${ci.winrate}%</span>
                <span class="games-box">${formatGames(ci.games)}</span>
              </div>
              ${idx < lola.coreItems.length - 1 ? '<span class="core-group-arrow">❯</span>' : ''}
            `).join('') : '<span style="color: #64748b; font-size: 10px;">No build data</span>'}
          </div>
        </div>

        <!-- Personal History Card -->
        <div class="history-col-container">
          <div class="hist-wl-row">
            <div class="hist-bar">
              <div class="hist-w" style="width: ${winsWidth}%;">${wins > 0 ? wins + 'W' : ''}</div>
              <div class="hist-l" style="width: ${lossesWidth}%;">${losses > 0 ? losses + 'L' : ''}</div>
            </div>
            <span style="font-size: 10px; font-weight: 800; color: #a855f7;">${histWrPct}%</span>
          </div>
          <div class="hist-grid-stats">
            <div class="stat-pill"><span>LANE</span><span style="color: #ef4444; font-weight: 800;">${hist?.laning || '--'}</span></div>
            <div class="stat-pill"><span>OP SCR</span><span style="color: #ef4444; font-weight: 800;">${hist?.opScore || '--'}</span></div>
            <div class="stat-pill"><span>KDA</span><span style="color: #10b981; font-weight: 800;">${hist?.kda ? Number(hist.kda).toFixed(2) : '--'}</span></div>
            <div class="stat-pill"><span>CS/M</span><span style="color: #cbd5e1; font-weight: 800;">${hist?.csm ? Number(hist.csm).toFixed(1) : '--'}</span></div>
          </div>
        </div>
      </div>
    </div>
  `;
}
```

---

## Step-by-Step Execution Plan for Next Chat

1. **DOM Injection Repositioning**:
   - In `src/userscript/orchestrator.js`, modify where `vsmTransmittedRowContainer` is injected. Instead of appending to the bottom of the body/app-container, locate the note area container in `matchups.html` and place the panel to its right (possibly using a wrapper flex container).
2. **Refactor `renderMatchupPageDataRow(env)` Vertical HTML/CSS**:
   - Strip out the champion avatars (`.res-champs`).
   - Re-organize the `.main-row` elements into a vertical stack (`flex-direction: column`).
   - Map the rows exactly as the user specified: Row 1 (Color bars), Row 2 (WR% + Deltas + LKR), Row 3 (Runes), Row 4 (Starters), Row 5 (Summoners), Row 6 (Core Build), Row 7 (History Card).
   - Ensure the styling remains high-fidelity but optimized for a narrower vertical space.
3. **Build & Tampermonkey Handshake Update**:
   - You MUST bump the version in `vsm-assets/vs-multi-config.js` and `src/userscript/header.js` to trigger the Tampermonkey update handshake!
   - Compile via `py Scripting/build_userscript.py` and instruct user to update Tampermonkey.
4. **Verification**:
   - Review `matchups.html` to confirm the panel correctly anchors to the right side of the notes area.

