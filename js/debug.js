/**
 * debug.js
 * Global configuration flags for enabling or disabling console logging
 * across different subsystems in the editor.
 */

const DEBUG_CONFIG = {
    // Enable to see detailed logs for the local drafts sync process (e.g. pending drafts in sidebar)
    logSync: false,
    
    // Enable to see detailed logs for YouTube index parsing and updating
    logYouTube: false,

    // Enable to see logs about the background bridge event passing
    logBridge: false,

    // Enable to see logs about metadata extraction and injection
    logMetadata: false,

    // ═══════════════════════════════════════════════════════════
    // PERFORMANCE PROFILER — Toggle to diagnose slow page loads
    // ═══════════════════════════════════════════════════════════
    logPerformance: true
};

// ══════════════════════════════════════════════════════════════════════
// PERFORMANCE PROFILING SYSTEM
// Instruments all GitHub/bridge network calls with high-resolution
// timing. Collects every request into a waterfall table so you can
// paste the Firefox console output and we can diagnose bottlenecks.
// ══════════════════════════════════════════════════════════════════════

const PerfProfiler = (() => {
    const _bootStart = performance.now();
    const _entries = [];    // { label, phase, startMs, endMs, durationMs, status, extra }
    let _phaseStack = [];   // Tracks nested phase names
    let _bootMarkers = {};  // Named timestamps relative to boot

    /**
     * Mark a named instant in the boot timeline.
     * @param {string} name - e.g. "bridge_resolved", "champions_loaded"
     */
    function mark(name) {
        if (!DEBUG_CONFIG.logPerformance) return;
        const ts = performance.now() - _bootStart;
        _bootMarkers[name] = ts;
        console.log(
            `%c⏱ PERF MARK%c ${name} %c@ ${ts.toFixed(1)}ms`,
            'background:#1a1a2e;color:#e94560;font-weight:bold;padding:2px 6px;border-radius:3px',
            'color:#eee;font-weight:bold',
            'color:#888'
        );
    }

    /**
     * Begin a named phase (e.g. "boot", "loadMatchup").
     * @param {string} name
     */
    function phaseStart(name) {
        if (!DEBUG_CONFIG.logPerformance) return;
        const ts = performance.now() - _bootStart;
        _phaseStack.push({ name, start: ts });
        console.groupCollapsed(
            `%c▶ PHASE START%c ${name} %c@ ${ts.toFixed(1)}ms`,
            'background:#0f3460;color:#e94560;font-weight:bold;padding:2px 6px;border-radius:3px',
            'color:#16c79a;font-weight:bold',
            'color:#888'
        );
    }

    /**
     * End the current phase.
     */
    function phaseEnd() {
        if (!DEBUG_CONFIG.logPerformance) return;
        const phase = _phaseStack.pop();
        if (!phase) return;
        const ts = performance.now() - _bootStart;
        const dur = ts - phase.start;
        console.groupEnd();
        console.log(
            `%c◼ PHASE END%c ${phase.name} %c${dur.toFixed(1)}ms`,
            'background:#0f3460;color:#e94560;font-weight:bold;padding:2px 6px;border-radius:3px',
            'color:#16c79a;font-weight:bold',
            dur > 2000
                ? 'color:#e94560;font-weight:bold'
                : dur > 500
                    ? 'color:#f5a623;font-weight:bold'
                    : 'color:#7ec8e3'
        );
    }

    /**
     * Record a completed network request.
     */
    function recordRequest(entry) {
        if (!DEBUG_CONFIG.logPerformance) return;
        entry.startMs = +(entry.startMs || 0).toFixed(1);
        entry.endMs = +(entry.endMs || 0).toFixed(1);
        entry.durationMs = +(entry.durationMs || 0).toFixed(1);
        _entries.push(entry);

        const durColor = entry.durationMs > 3000
            ? '#e94560'
            : entry.durationMs > 1000
                ? '#f5a623'
                : '#16c79a';

        console.log(
            `%c📡 NET%c ${entry.label} %c${entry.durationMs}ms %c[${entry.status}]`,
            'background:#1a1a2e;color:#4ecdc4;font-weight:bold;padding:2px 6px;border-radius:3px',
            'color:#ddd',
            `color:${durColor};font-weight:bold`,
            entry.status >= 200 && entry.status < 300 ? 'color:#16c79a' : 'color:#e94560'
        );
    }

    /**
     * Print the full waterfall summary table.
     * Call this after boot completes or whenever you want to inspect results.
     */
    function printSummary() {
        if (!DEBUG_CONFIG.logPerformance) return;
        const totalMs = (performance.now() - _bootStart).toFixed(1);

        console.log(
            `\n%c════════════════════════════════════════════════════════════%c\n` +
            `%c  📊 PERFORMANCE WATERFALL SUMMARY  %c\n` +
            `%c════════════════════════════════════════════════════════════%c\n` +
            `  Total page-ready time: ${totalMs}ms\n`,
            'color:#4ecdc4', '',
            'background:#16c79a;color:#000;font-weight:bold;font-size:13px;padding:4px 12px;border-radius:4px', '',
            'color:#4ecdc4', ''
        );

        // Boot markers timeline
        if (Object.keys(_bootMarkers).length > 0) {
            console.log('%c  Boot Markers:', 'color:#f5a623;font-weight:bold');
            const sorted = Object.entries(_bootMarkers).sort((a, b) => a[1] - b[1]);
            sorted.forEach(([name, ts]) => {
                const bar = '█'.repeat(Math.max(1, Math.round(ts / 100)));
                console.log(`    ${bar} ${name}: ${ts.toFixed(1)}ms`);
            });
            console.log('');
        }

        // Network requests waterfall table
        if (_entries.length > 0) {
            console.log('%c  Network Requests:', 'color:#f5a623;font-weight:bold');
            console.table(_entries.map(e => ({
                Label: e.label,
                'Start (ms)': e.startMs,
                'End (ms)': e.endMs,
                'Duration (ms)': e.durationMs,
                Status: e.status,
                Phase: e.phase || '-',
                Extra: e.extra || ''
            })));
        } else {
            console.log('  (No network requests recorded)');
        }

        console.log(
            `%c════════════════════════════════════════════════════════════%c`,
            'color:#4ecdc4', ''
        );
    }

    /**
     * Get the elapsed ms since boot.
     */
    function elapsed() {
        return performance.now() - _bootStart;
    }

    return { mark, phaseStart, phaseEnd, recordRequest, printSummary, elapsed };
})();
