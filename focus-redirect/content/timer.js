/* content/timer.js - Injected into every page */
(function () {
    let timerElement = null;
    let intervalId = null;

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
            if (changes.focusSession) {
                handleSessionUpdate(changes.focusSession.newValue);
            }
        }
    });

    // Check initial state
    chrome.storage.local.get('focusSession', (result) => {
        if (result.focusSession) {
            handleSessionUpdate(result.focusSession);
        }
    });

    function handleSessionUpdate(session) {
        if (!session || !session.isActive) {
            removeTimer();
            return;
        }

        if (!timerElement) {
            createTimer(session);
        }

        updateTimerDisplay(session);
    }

    function createTimer(session) {
        const timerHtml = `
            <div id="antigravity-focus-timer">
                <div class="ag-timer-row">
                    <div class="ag-timer-info">
                        <div id="ag-timer-task" class="ag-task-text">Focusing...</div>
                        <div id="ag-timer-countdown" class="ag-time-text">25:00</div>
                    </div>
                    <div class="ag-timer-actions">
                        <button id="ag-music-btn" class="ag-btn ag-btn-music" title="Music">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                        </button>
                        <button id="ag-timer-done" class="ag-btn ag-btn-done" title="Complete Type">
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </button>
                        <button id="ag-timer-stop" class="ag-btn ag-btn-stop" title="Stop">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
                        </button>
                    </div>
                </div>
                
                <div id="ag-music-dropdown" class="ag-music-dropdown">
                    <div class="ag-track-item" data-index="0">🎵 LoFi 1.mp3</div>
                    <div class="ag-track-item" data-index="1">🎵 LoFi 2.mp3</div>
                    <div class="ag-track-item" data-index="2">🎵 Zikr.mp3</div>
                    <div class="ag-track-item" data-index="3">🎵 LoFi Quran.mp3</div>
                </div>
            </div>
            
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700&display=swap');

                #antigravity-focus-timer {
                    position: fixed;
                    bottom: 24px;
                    right: 24px;
                    width: 320px;
                    background: rgba(15, 23, 42, 0.95);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 20px;
                    padding: 16px;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    z-index: 2147483647;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
                    color: white;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    transition: all 0.3s ease;
                    animation: agSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes agSlideIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .ag-timer-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .ag-timer-info {
                    flex: 1;
                    min-width: 0; /* Text truncation */
                }

                .ag-task-text {
                    font-size: 0.85rem;
                    color: #94a3b8;
                    margin-bottom: 2px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .ag-time-text {
                    font-size: 1.75rem;
                    font-weight: 700;
                    letter-spacing: -0.02em;
                    line-height: 1;
                    font-variant-numeric: tabular-nums;
                }

                .ag-timer-actions {
                    display: flex;
                    gap: 8px;
                    margin-left: 12px;
                }

                .ag-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .ag-btn-music {
                    background: rgba(255, 255, 255, 0.05);
                    color: #cbd5e1;
                }
                .ag-btn-music:hover, .ag-btn-music.active {
                    background: rgba(59, 130, 246, 0.2);
                    color: #60a5fa;
                }

                .ag-btn-done {
                    background: rgba(16, 185, 129, 0.15);
                    color: #10b981;
                }
                .ag-btn-done:hover {
                    background: rgba(16, 185, 129, 0.25);
                    transform: scale(1.05);
                }

                .ag-btn-stop {
                    background: rgba(239, 68, 68, 0.15);
                    color: #ef4444;
                }
                .ag-btn-stop:hover {
                    background: rgba(239, 68, 68, 0.25);
                    transform: scale(1.05);
                }

                .ag-music-dropdown {
                    display: none;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 12px;
                    overflow: hidden;
                    margin-top: 4px;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                
                .ag-music-dropdown.visible {
                    display: block;
                    animation: agFadeIn 0.2s ease;
                }

                @keyframes agFadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .ag-track-item {
                    padding: 10px 14px;
                    font-size: 0.85rem;
                    color: #cbd5e1;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                
                .ag-track-item:hover {
                    background: rgba(255, 255, 255, 0.08);
                    color: white;
                }
            </style>
        `;

        if (!document.getElementById('antigravity-focus-timer')) {
            document.body.insertAdjacentHTML('beforeend', timerHtml);
        }

        timerElement = document.getElementById('antigravity-focus-timer');

        // Buttons
        const stopBtn = document.getElementById('ag-timer-stop');
        const doneBtn = document.getElementById('ag-timer-done');
        const musicBtn = document.getElementById('ag-music-btn');
        const musicDropdown = document.getElementById('ag-music-dropdown');

        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                chrome.runtime.sendMessage({ type: 'STOP_FOCUS' });
            });
        }

        if (doneBtn) {
            doneBtn.addEventListener('click', () => {
                chrome.runtime.sendMessage({ type: 'COMPLETE_TASK' });
            });
        }

        if (musicBtn && musicDropdown) {
            musicBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                musicDropdown.classList.toggle('visible');
                musicBtn.classList.toggle('active');
            });
        }

        // Track items
        const tracks = timerElement.querySelectorAll('.ag-track-item');
        tracks.forEach(t => {
            t.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                chrome.runtime.sendMessage({ type: 'SET_TRACK', trackIndex: idx });

                // Visual feedback
                tracks.forEach(tr => tr.style.color = '#cbd5e1');
                e.target.style.color = '#60a5fa'; // Blue active
            });
        });

        // Close dropdown if clicking elsewhere
        document.addEventListener('click', (e) => {
            if (timerElement && !timerElement.contains(e.target)) {
                if (musicDropdown) musicDropdown.classList.remove('visible');
                if (musicBtn) musicBtn.classList.remove('active');
            }
        });

        startLocalTick(session);
    }

    function updateTimerDisplay(session) {
        if (!timerElement) return;

        const taskEl = document.getElementById('ag-timer-task');
        if (taskEl) taskEl.textContent = session.task || 'Focus';

        if (intervalId) clearInterval(intervalId);
        startLocalTick(session);
    }

    function startLocalTick(session) {
        const timeEl = document.getElementById('ag-timer-countdown');

        function tick() {
            const now = Date.now();
            const elapsed = now - session.startTime;
            const remaining = Math.max(0, session.duration - elapsed);

            if (remaining <= 0) {
                if (timeEl) timeEl.textContent = "00:00";
                clearInterval(intervalId);
                return;
            }

            const mins = Math.floor(remaining / 60000);
            const secs = Math.floor((remaining % 60000) / 1000);
            if (timeEl) timeEl.textContent = `${pad(mins)}:${pad(secs)}`;
        }

        tick();
        intervalId = setInterval(tick, 1000);
    }

    function removeTimer() {
        if (timerElement) {
            timerElement.remove();
            timerElement = null;
        }
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    function pad(n) {
        return n < 10 ? '0' + n : n;
    }

})();
