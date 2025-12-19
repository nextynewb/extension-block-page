document.addEventListener('DOMContentLoaded', () => {
  // --- UTILS ---
  const pad = (n) => n < 10 ? '0' + n : n;

  // --- 1. HERO IMAGE ROTATION ---
  const images = ['idris.gif', '1.png', '2.png'];
  const heroCard = document.getElementById('hero-bg');
  let currentBgIndex = 0;

  function rotateHero() {
    if (!heroCard) return;
    const nextIndex = (currentBgIndex + 1) % images.length;
    heroCard.style.backgroundImage = `url('${images[currentBgIndex]}')`;
    currentBgIndex = nextIndex;
  }

  rotateHero();
  setInterval(rotateHero, 8000);

  // --- 1.5. RANDOM QUOTES ---
  const quotes = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
    { text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
    { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
    { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
    { text: "Productivity is being able to do things that you were never able to do before.", author: "Franz Kafka" },
    { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" },
    { text: "If you spend too much time thinking about a thing, you'll never get it done.", author: "Bruce Lee" },
    { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
    { text: "Lost time is never found again.", author: "Benjamin Franklin" },
    { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
    { text: "What we fear of doing most is usually what we most need to do.", author: "Ralph Waldo Emerson" },
    { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
    { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
    { text: "Until we can manage time, we can manage nothing else.", author: "Peter Drucker" }
  ];

  function setRandomQuote() {
    const qEl = document.getElementById('main-quote');
    const aEl = document.getElementById('main-author');
    if (qEl && aEl) {
      const random = quotes[Math.floor(Math.random() * quotes.length)];
      qEl.innerText = `"${random.text}"`;
      aEl.innerText = `— ${random.author.toUpperCase()}`;
    }
  }
  setRandomQuote();


  // --- 2. STATS SYSTEM ---
  function updateStats() {
    // Distractions
    // Focus Minutes
    chrome.storage.local.get(['redirectStats', 'focusStats'], (result) => {
      const stats = result.redirectStats || {};
      const count = stats.total || 0;
      const countEl = document.getElementById('distraction-count');
      if (countEl) countEl.innerText = count;

      const focusStats = result.focusStats || { daily: {}, totalMinutes: 0 };
      const today = new Date().toLocaleDateString('en-CA');
      const todayMinutes = focusStats.daily[today] || 0;

      const minEl = document.getElementById('focus-minutes');
      if (minEl) minEl.innerText = todayMinutes;

      // Update Progress Bar (Goal: 240m)
      const goal = 240;
      const pct = Math.min((todayMinutes / goal) * 100, 100);
      const barEl = document.getElementById('focus-progress-bar');
      const pctTextEl = document.getElementById('focus-goal-percent');

      if (barEl) barEl.style.width = `${pct}%`;
      if (pctTextEl) pctTextEl.innerText = Math.round(pct);

      renderWeeklyChart(focusStats.daily);
    });
  }
  updateStats();

  function renderWeeklyChart(dailyStats) {
    const chartContainer = document.getElementById('weekly-chart');
    if (!chartContainer) return;

    const data = getWeeklyData(dailyStats);
    const maxVal = Math.max(...data.map(d => d.minutes), 60); // Min scale 60m

    chartContainer.innerHTML = data.map(d => {
      const heightPct = Math.min((d.minutes / maxVal) * 100, 100);
      return `
            <div class="bar-wrapper">
                <div class="bar-track">
                    <div class="bar" style="height: ${heightPct}%">
                        <div class="bar-tooltip">${d.minutes}m</div>
                    </div>
                </div>
                <div class="bar-label">${d.day}</div>
            </div>
          `;
    }).join('');
  }

  function getWeeklyData(dailyStats) {
    const current = new Date();
    const day = current.getDay(); // 0-6 (Sun-Sat)
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    // Adjusted so Mon is start. If Sun(0), -6 go back to Mon. If Mon(1), +0.

    const monday = new Date(current);
    monday.setDate(diff);

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const result = [];

    for (let i = 0; i < 7; i++) {
      const loopDate = new Date(monday);
      loopDate.setDate(monday.getDate() + i);
      const dateKey = loopDate.toLocaleDateString('en-CA');

      result.push({
        day: days[i],
        minutes: dailyStats[dateKey] || 0
      });
    }
    return result;
  }

  // --- 3. STICKY NOTES LOGIC (Replaces Matrix) ---
  const notes = ['note-1', 'note-2', 'note-3', 'note-4'];

  // Load saved notes
  chrome.storage.local.get(['stickyNotes'], (res) => {
    const saved = res.stickyNotes || {};
    notes.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.innerText = saved[id] || ''; // Use innerText for contenteditable

        // Add listener
        el.addEventListener('input', () => {
          saveNotes();
        });
      }
    });
  });

  function saveNotes() {
    const data = {};
    notes.forEach(id => {
      const el = document.getElementById(id);
      if (el) data[id] = el.innerText;
    });
    chrome.storage.local.set({ stickyNotes: data });
  }

  // (Removed Matrix Code)
  // --- 4. TO-DO & MUSIC (Existing Logic Adapted) ---
  const todoList = document.getElementById('todo-list');
  const todoInput = document.getElementById('todo-input');
  const addBtn = document.getElementById('add-todo-btn');

  function loadTodos() {
    chrome.storage.local.get('todos', (result) => {
      renderTodos(result.todos || []);
    });
  }

  function saveTodos(todos) {
    chrome.storage.local.set({ todos });
    // When saving, we need to re-render with the current session info
    chrome.storage.local.get('focusSession', (result) => {
      const session = result.focusSession;
      renderTodos(todos, session);
      renderKanban(todos, session);
    });
  }

  // --- NEW TODO UI LOGIC ---
  let selectedDuration = 25;
  const durationPicker = document.querySelector('.duration-picker');
  const durationLabel = document.getElementById('current-duration');
  const durationDropdown = document.querySelector('.duration-options');
  const durationOptions = document.querySelectorAll('.duration-options button');

  // Toggle Dropdown
  if (durationPicker && durationDropdown) {
    durationPicker.addEventListener('click', (e) => {
      e.stopPropagation();
      durationDropdown.classList.toggle('visible');
      durationPicker.classList.toggle('active');
    });
  }

  // Close Dropdown on outside click
  document.addEventListener('click', (e) => {
    if (durationDropdown && durationDropdown.classList.contains('visible')) {
      if (!durationPicker.contains(e.target)) {
        durationDropdown.classList.remove('visible');
        durationPicker.classList.remove('active');
      }
    }
  });

  if (durationOptions) {
    durationOptions.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedDuration = parseInt(e.target.dataset.min);
        // Update active state
        durationOptions.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        if (durationLabel) durationLabel.innerText = selectedDuration + 'm';

        // Close
        if (durationDropdown) {
          durationDropdown.classList.remove('visible');
          durationPicker.classList.remove('active');
        }
      });
    });
  }

  function addTodo() {
    if (!todoInput) return;
    const text = todoInput.value.trim();

    if (!text) return;

    chrome.storage.local.get('todos', (result) => {
      const todos = result.todos || [];
      todos.push({
        id: Date.now(),
        text,
        target: selectedDuration * 60, // Store in seconds
        elapsed: 0,
        completed: false
      });
      saveTodos(todos);
      todoInput.value = '';
      // Reset or keep duration? Keep for rapid entry.
    });
  }

  // Re-bind with explicit check
  // Document-level delegation to ensure click is caught
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#add-todo-btn');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      addTodo();
    }
  });

  if (todoInput) {
    todoInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addTodo();
    });
  }

  // Legacy support removal (todoDuration element is gone)

  // Check for schema migration (simple check: does first todo have 'target'?)
  chrome.storage.local.get('todos', (res) => {
    const t = res.todos || [];
    if (t.length > 0 && typeof t[0].target === 'undefined') {
      console.log("Migrating/Clearing old todos...");
      chrome.storage.local.set({ todos: [] });
      renderTodos([], null);
    } else {
      loadTodos();
    }
  });

  function renderTodos(todos, session) {
    if (!todoList) return;
    todoList.innerHTML = '';

    todos.forEach(todo => {
      // Active if session matches this task ID (safest) or text
      const isActive = session && session.isActive && session.taskId === todo.id;

      // Calculate display progress
      // If active, elapsed = stored_elapsed + session_elapsed
      let currentElapsed = todo.elapsed || 0;
      if (isActive) {
        const sessionElapsed = Math.floor((Date.now() - session.startTime) / 1000);
        currentElapsed += sessionElapsed;
      }

      // Helper to format time
      const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const pad = (num) => num < 10 ? '0' + num : num;
        return `${pad(m)}:${pad(s)}`;
      };

      const targetSec = todo.target || (25 * 60);
      const progressPct = Math.min((currentElapsed / targetSec) * 100, 100);

      const li = document.createElement('li');
      // Add specific class for new styling structure
      li.className = `todo-item ${todo.completed ? 'completed' : ''} ${isActive ? 'active-focus-task' : ''}`;

      // Dynamic Button
      const actionBtnHtml = isActive
        ? `<button class="play-btn-small active-btn" title="Stop">■</button>`
        : `<button class="play-btn-small" title="Start">▶</button>`;

      li.innerHTML = `
          <!-- Background Progress -->
          <div class="todo-progress-bg" style="width: ${progressPct}%"></div>
          
          <div style="display:flex; align-items:center;">
             <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
             <div class="todo-text-group" style="margin-left: 10px;">
                <span class="todo-text">${todo.text}</span>
                <span class="todo-meta">${formatTime(currentElapsed)} / ${formatTime(targetSec)}</span>
             </div>
          </div>
          
          <div style="display:flex; gap: 5px; align-items:center; z-index: 2;">
              ${actionBtnHtml}
              <button class="delete-btn" title="Delete">×</button>
          </div>
        `;

      const checkbox = li.querySelector('.todo-checkbox');
      checkbox.addEventListener('change', () => {
        todo.completed = checkbox.checked;
        saveTodos(todos);
      });

      const playBtn = li.querySelector('.play-btn-small');
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isActive) {
          // STOP/PAUSE
          chrome.runtime.sendMessage({ type: 'STOP_FOCUS' });
        } else {
          // START / RESUME
          // Calculate remaining time in MINUTES for the timer logic
          // (Target Seconds - Elapsed Seconds) / 60
          const remainingSec = Math.max(0, (todo.target || 0) - (todo.elapsed || 0));
          // Just ensure at least something if it's done? 
          // If done, maybe restart? Or show done? 
          // Let's assume if remaining <= 0 we restart or give 1 min bonus. 
          // Better: just allow overage but logic uses duration.
          const durationMins = remainingSec > 0 ? remainingSec / 60 : (todo.target / 60);

          chrome.runtime.sendMessage({
            type: 'START_FOCUS',
            task: todo.text,
            taskId: todo.id,
            duration: durationMins // Send remaining minutes!
          });
        }
      });

      const delBtn = li.querySelector('.delete-btn');
      delBtn.addEventListener('click', () => {
        const newTodos = todos.filter(t => t.id !== todo.id);
        saveTodos(newTodos);
      });

      todoList.appendChild(li);
    });
  }

  loadTodos();

  // --- 6. DATE DISPLAY ---
  // (Date logic is handled by updateClock now, but keeping static init if needed, or we can rely on updateClock)
  const dateEl = document.getElementById('date-display');
  // updateClock handles this, but let's ensure no syntax error remains.

  // --- 5. MUSIC CONTROLS (Updated previously) ---
  // ... (Already corrected in previous steps, but need to make sure we don't break flow)


  // --- 7. BLOCKED LOGIC ---
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('mode') === 'blocked') {
    const overlay = document.getElementById('blocked-overlay');
    if (overlay) overlay.classList.add('visible');

    // Blocked Logic
    let countdown = 30;
    const cdEl = document.getElementById('countdown');
    const cBtn = document.getElementById('continueAnyway');
    const reasonBox = document.getElementById('reason-container');

    setInterval(() => {
      countdown--;
      if (cdEl) cdEl.innerText = countdown;
      if (countdown <= 0 && cBtn) {
        cBtn.disabled = false;
      }
    }, 1000);

    setTimeout(() => {
      if (reasonBox) reasonBox.style.display = 'block';
    }, 10000);

    const backBtn = document.getElementById('goBack');
    if (backBtn) backBtn.addEventListener('click', () => window.history.back());

    if (cBtn) cBtn.addEventListener('click', () => window.history.back());

    const closeBtn = document.getElementById('close-overlay-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        overlay.classList.remove('visible');
        // Remove 'mode=blocked' from URL without refreshing
        const url = new URL(window.location);
        url.searchParams.delete('mode');
        window.history.replaceState({}, '', url);
      });
    }
  }

  // --- 8. FLOATING TIMER (Dashboard Integration) ---
  const timerHtml = `
    <div id="antigravity-focus-timer">
        <div class="ag-timer-row">
            <div class="ag-timer-info">
                <div id="ag-timer-task" class="ag-task-text">Focusing...</div>
                <div id="ag-timer-countdown" class="ag-time-text">--:--</div>
                <!-- Mini Progress Bar -->
                <div style="width:100%; height:3px; background:rgba(255,255,255,0.1); margin-top:4px; border-radius:2px; overflow:hidden;">
                    <div id="ag-timer-progress" style="width:0%; height:100%; background:#10b981; transition:width 1s linear;"></div>
                </div>
            </div>
            <div class="ag-timer-actions">
                <!-- Music Toggle -->
                <button id="ag-music-btn" class="ag-btn ag-btn-music" title="Playlist">
                    <span id="ag-music-icon">🎵</span>
                </button>
                
                <!-- Play/Pause Toggle -->
                <button id="ag-toggle-btn" class="ag-btn" title="Pause/Resume">
                    <span id="ag-toggle-icon">⏸</span>
                </button>
                
                <!-- Stop/Complete -->
                <button id="ag-stop-btn" class="ag-btn" title="Stop Session" style="color: #ef4444;">
                    ■
                </button>
                
                 <button id="ag-timer-done" class="ag-btn ag-btn-done" title="Complete Type">
                    ✓
                </button>
            </div>
        </div>
        
        <!-- Music Dropdown -->
        <div id="ag-music-dropdown" class="ag-music-dropdown">
            <div class="ag-track-item" data-index="0">🎵 LoFi 1.mp3</div>
            <div class="ag-track-item" data-index="1">🎵 LoFi 2.mp3</div>
            <div class="ag-track-item" data-index="2">🎵 Zikr.mp3</div>
            <div class="ag-track-item" data-index="3">🎵 LoFi Quran.mp3</div>
        </div>
    </div>
    <style>
      #antigravity-focus-timer {
        display: none; position: fixed; bottom: 20px; right: 20px; width: 320px; 
        background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); 
        border-radius: 20px; padding: 16px; color: white; font-family: 'Plus Jakarta Sans', sans-serif; 
        z-index: 2000; box-shadow: 0 10px 40px rgba(0,0,0,0.4); 
        align-items: center; gap: 12px; animation: slideIn 0.3s ease;
        flex-direction: column;
      }
      .ag-timer-row { display: flex; width: 100%; justify-content: space-between; align-items: center; }
      .ag-timer-info { flex: 1; min-width: 0; }
      .ag-task-text { font-size: 0.85rem; color: #94a3b8; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ag-time-text { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; line-height: 1; font-variant-numeric: tabular-nums; }
      
      .ag-timer-actions { display: flex; gap: 8px; margin-left: 12px; }
      .ag-btn { width: 36px; height: 36px; border-radius: 10px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
      
      .ag-btn-music { background: rgba(255, 255, 255, 0.05); color: #cbd5e1; }
      .ag-btn-music:hover, .ag-btn-music.active { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
      
      .ag-btn-done { background: rgba(16, 185, 129, 0.15); color: #10b981; }
      .ag-btn-done:hover { background: rgba(16, 185, 129, 0.25); transform: scale(1.05); }
      
      #antigravity-focus-timer.visible {
        display: flex; /* Show it! */
      }
      .ag-btn-stop { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
      .ag-btn-stop:hover { background: rgba(239, 68, 68, 0.25); transform: scale(1.05); }
      
      .ag-music-dropdown { display: none; width: 100%; background: rgba(0, 0, 0, 0.2); border-radius: 12px; overflow: hidden; margin-top: 4px; border: 1px solid rgba(255,255,255,0.05); }
      .ag-music-dropdown.visible { display: block; animation: fadeIn 0.2s ease; }
      .ag-track-item { padding: 10px 14px; font-size: 0.85rem; color: #cbd5e1; cursor: pointer; transition: background 0.2s; text-align: left; }
      .ag-track-item:hover { background: rgba(255, 255, 255, 0.08); color: white; }
    </style>
  `;

  // Inject if not exists
  if (!document.getElementById('antigravity-focus-timer')) {
    document.body.insertAdjacentHTML('beforeend', timerHtml);
  }

  // Re-select elements (ensure we get them whether just injected or existing)
  const timerWidget = document.getElementById('antigravity-focus-timer');
  const timerTimeEl = document.getElementById('ag-timer-countdown');
  const timerTaskEl = document.getElementById('ag-timer-task');

  const musicBtn = document.getElementById('ag-music-btn');
  const musicDropdown = document.getElementById('ag-music-dropdown');
  const toggleBtn = document.getElementById('ag-toggle-btn');
  const stopBtn = document.getElementById('ag-stop-btn');
  const doneBtn = document.getElementById('ag-timer-done');

  // Remove old listeners? No easy way, but we can just use new ones if we assume fresh page load.
  // To be safe against re-runs in some environments, we can check a flag or just clone node (heavy).
  // Standard extension page = reload = fresh JS. So just attachment is fine.

  if (musicBtn && musicDropdown) {
    // Remove old listener to be safe if this runs multiple times? 
    // Better to separate "Init" from "Update". 
    // This block is "Init".

    musicBtn.onclick = (e) => {
      e.stopPropagation();
      musicDropdown.classList.toggle('visible');
    };
  }

  // Music Selection Logic
  document.querySelectorAll('.ag-track-item').forEach(item => {
    item.onclick = (e) => {
      e.stopPropagation();
      const idx = parseInt(e.target.dataset.index);
      chrome.runtime.sendMessage({ type: 'SET_TRACK', trackIndex: idx });
      musicDropdown.classList.remove('visible');
      // Optimistic icon update?
    };
  });

  // Toggle Play/Pause
  if (toggleBtn) {
    toggleBtn.onclick = (e) => {
      e.stopPropagation();
      // Since this button is only visible when ACTIVE, clicking it means PAUSE/STOP.
      // We use STOP_FOCUS for now to save state.
      chrome.runtime.sendMessage({ type: 'STOP_FOCUS' });
    };
  }

  if (stopBtn) {
    stopBtn.onclick = (e) => {
      e.stopPropagation();
      chrome.runtime.sendMessage({ type: 'STOP_FOCUS' });
    };
  }

  if (doneBtn) {
    doneBtn.onclick = (e) => {
      e.stopPropagation();
      chrome.runtime.sendMessage({ type: 'COMPLETE_TASK' });
    };
  }

  // Close dropdown logic
  document.addEventListener('click', (e) => {
    if (timerWidget && !timerWidget.contains(e.target)) {
      if (musicDropdown) musicDropdown.classList.remove('visible');
      if (musicBtn) musicBtn.classList.remove('active');
    }
  });

  function updateDashboardTimer() {
    chrome.storage.local.get(['focusSession', 'todos'], (result) => {
      const session = result.focusSession;

      if (session && session.isActive) {
        const elapsed = Date.now() - session.startTime;
        const remaining = session.duration - elapsed;

        if (remaining > 0) {
          const m = Math.floor(remaining / 60000);
          const s = Math.floor((remaining % 60000) / 1000);
          if (timerTimeEl) timerTimeEl.textContent = `${pad(m)}:${pad(s)}`;
          if (timerTaskEl) timerTaskEl.textContent = session.task || 'Focus';
          if (timerWidget) timerWidget.style.display = 'flex';
        } else {
          if (timerWidget) timerWidget.style.display = 'none';
        }
      } else {
        if (timerWidget) timerWidget.style.display = 'none';
      }
    });
  }

  // Storage listener for state sync
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.focusSession || changes.todos) {
      loadTodosInternal();
    }
    if (changes.focusSession) { // Added for instant feedback on timer
      updateDashboardTimer();
    }
    if (changes.focusStats || changes.redirectStats) {
      updateStats(); // Refresh stats dynamically
    }
  });

  function loadTodosInternal() {
    chrome.storage.local.get(['todos', 'focusSession'], (result) => {
      const todos = result.todos || [];
      const session = result.focusSession;
      renderTodos(todos, session);
      renderKanban(todos, session);
    });
  }

  setInterval(updateDashboardTimer, 1000);
  updateDashboardTimer();
  loadTodosInternal();

  // --- 9. PRAYER SCHEDULE LOGIC ---
  const prayerCard = document.querySelector('.prayer-card');
  if (prayerCard) {
    fetch('prayers.json')
      .then(res => res.json())
      .then(data => { initPrayerSchedule(data); })
      .catch(err => { console.warn('Prayer data missing', err); });

    function initPrayerSchedule(prayerData) {
      const prayerListEl = document.getElementById('prayer-list');
      const countdownEl = document.getElementById('prayer-countdown');
      const nextNameEl = document.getElementById('next-prayer-name');

      if (!prayerListEl) return;

      function update() {
        const now = new Date();
        const todayKey = now.toLocaleDateString('en-CA');
        const schedule = prayerData[todayKey];

        if (!schedule) {
          if (countdownEl) countdownEl.innerText = "--";
          return;
        }

        let nextPrayer = null;
        let minDiff = Infinity;

        const prayers = Object.entries(schedule).map(([name, time]) => {
          const [h, m] = time.split(':').map(Number);
          const pDate = new Date(now);
          pDate.setHours(h, m, 0, 0);
          return { name, time, pDate };
        });

        for (const p of prayers) {
          const diff = p.pDate - now;
          if (diff > 0 && diff < minDiff) {
            minDiff = diff;
            nextPrayer = p;
          }
        }

        if (!nextPrayer) {
          const tomorrow = new Date(now);
          tomorrow.setDate(now.getDate() + 1);
          const tomKey = tomorrow.toLocaleDateString('en-CA');
          const tomSchedule = prayerData[tomKey];
          if (tomSchedule && tomSchedule['Fajr']) {
            const [h, m] = tomSchedule['Fajr'].split(':').map(Number);
            const pDate = new Date(tomorrow);
            pDate.setHours(h, m, 0, 0);
            nextPrayer = { name: 'Fajr', time: tomSchedule['Fajr'], pDate };
          }
        }

        prayerListEl.innerHTML = prayers.map(p => {
          const isPast = p.pDate < now;
          const isNext = nextPrayer && p.name === nextPrayer.name && p.pDate.getTime() === nextPrayer.pDate.getTime();
          return `
                    <div class="prayer-item ${isNext ? 'active' : ''} ${isPast && !isNext ? 'passed' : ''}">
                        <span>${p.name}</span>
                        <span>${convertTime(p.time)}</span>
                    </div>
                  `;
        }).join('');

        // Determine "Previous" Prayer for Progress Calculation
        let prevPrayerTime = new Date(now).setHours(0, 0, 0, 0); // Default to start of day

        // Find the prayer that just passed
        // We can sort prayers by time
        const sortedPrayers = prayers.sort((a, b) => a.pDate - b.pDate);
        for (let i = 0; i < sortedPrayers.length; i++) {
          if (sortedPrayers[i].pDate < now) {
            prevPrayerTime = sortedPrayers[i].pDate.getTime();
          } else {
            break; // Since sorted, once we hit future, we stop
          }
        }

        // Render Countdown
        if (nextPrayer) {
          if (nextNameEl) nextNameEl.innerText = nextPrayer.name;
          const diff = nextPrayer.pDate - now;

          // Ensure we don't show negative if just passed (handled by nextPrayer finding, but safe guard)
          const totalSeconds = Math.max(0, Math.floor(diff / 1000));
          const h = Math.floor(totalSeconds / 3600);
          const m = Math.floor((totalSeconds % 3600) / 60);
          const s = totalSeconds % 60;

          if (countdownEl) countdownEl.innerText = `${h}h ${m}m ${s}s`;

          // Progress Bar update
          const totalInterval = nextPrayer.pDate.getTime() - prevPrayerTime;
          const elapsed = now.getTime() - prevPrayerTime;
          let progressPct = 0;
          if (totalInterval > 0) {
            progressPct = Math.min((elapsed / totalInterval) * 100, 100);
          }
          const pBar = document.getElementById('prayer-progress-bar');
          if (pBar) pBar.style.width = `${progressPct}%`;

        } else {
          if (nextNameEl) nextNameEl.innerText = "Done";
          if (countdownEl) countdownEl.innerText = "--";
          const pBar = document.getElementById('prayer-progress-bar');
          if (pBar) pBar.style.width = `100%`;
        }
      }

      update();
      setInterval(update, 1000); // Process every second
    }

    function convertTime(time24) {
      const [h, m] = time24.split(':');
      let hour = parseInt(h);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12;
      hour = hour ? hour : 12;
      return `${hour}:${m} ${ampm}`;
    }
  }

  // --- 10. REAL-TIME CLOCK ---
  function updateClock() {
    const dateEl = document.querySelector('.date-badge');
    if (dateEl) {
      const now = new Date();
      // "Monday, December 15 | 11:30:45 PM"
      const options = { weekday: 'long', month: 'long', day: 'numeric' };
      const dateStr = now.toLocaleDateString('en-US', options);
      const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
      dateEl.innerText = `${dateStr} | ${timeStr}`;
    }
  }
  setInterval(updateClock, 1000);
  updateClock();


  // --- 11. KANBAN & VIEW LOGIC ---
  // (View switching removed)

  // Render Kanban
  const colTodo = document.getElementById('list-todo');
  const colDoing = document.getElementById('list-doing');
  const colDone = document.getElementById('list-done');

  function renderKanban(todos, session) {
    if (!colTodo || !colDoing || !colDone) return;

    // Clear lists
    colTodo.innerHTML = '';
    colDoing.innerHTML = '';
    colDone.innerHTML = '';

    // Counters
    let cTodo = 0, cDoing = 0, cDone = 0;

    todos.forEach(todo => {
      // Determine status safely
      let status = todo.status;
      const isActive = session && session.isActive && session.taskId === todo.id;

      if (!status) {
        // Fallback logic
        if (todo.completed) status = 'done';
        else if (isActive) status = 'doing';
        else status = 'todo';
      }

      const card = createKanbanCard(todo, isActive, session);

      if (status === 'done') {
        colDone.appendChild(card);
        cDone++;
      } else if (status === 'doing') {
        colDoing.appendChild(card);
        cDoing++;
      } else {
        colTodo.appendChild(card);
        cTodo++;
      }
    });

    // Update Counts
    const cTodoEl = document.getElementById('count-todo');
    const cDoingEl = document.getElementById('count-doing');
    const cDoneEl = document.getElementById('count-done');

    if (cTodoEl) cTodoEl.innerText = cTodo;
    if (cDoingEl) cDoingEl.innerText = cDoing;
    if (cDoneEl) cDoneEl.innerText = cDone;
  }

  function createKanbanCard(todo, isActive, session) {
    const el = document.createElement('div');
    el.className = `kanban-card ${todo.completed ? 'completed' : ''} ${isActive ? 'active-focus-task' : ''}`;
    el.draggable = true;
    el.dataset.id = todo.id;

    // Calculate time
    let currentElapsed = todo.elapsed || 0;
    if (isActive && session) {
      const sessionElapsed = Math.floor((Date.now() - session.startTime) / 1000);
      currentElapsed += sessionElapsed;
    }
    const targetSec = todo.target || (25 * 60);
    const timeStr = `${Math.floor(currentElapsed / 60)}m / ${Math.floor(targetSec / 60)}m`;

    const playBtnHtml = isActive
      ? `<button class="kanban-play-btn pause" title="Pause Focus"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg></button>`
      : `<button class="kanban-play-btn play" title="Start Focus"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></button>`;

    el.innerHTML = `
      <div class="kanban-card-main">
          <div class="kanban-card-title">${todo.text}</div>
          <div class="card-delete-wrapper">
             <button class="card-delete-btn" title="Delete">×</button>
          </div>
      </div>
      <div class="kanban-card-footer">
        <div class="kanban-card-duration">⏱ ${timeStr}</div>
        ${!todo.completed ? playBtnHtml : ''}
      </div>
    `;

    // Drag Events
    el.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', todo.id);
      e.dataTransfer.effectAllowed = 'move';
      el.classList.add('dragging');
    });

    el.addEventListener('dragend', () => {
      el.classList.remove('dragging');
      document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('drag-over'));
    });

    // Delete
    const delBtn = el.querySelector('.card-delete-btn');
    if (delBtn) {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Delete task?')) {
          deleteTodo(todo.id);
        }
      });
    }

    // Play/Pause Action
    const playBtn = el.querySelector('.kanban-play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isActive) {
          // Stop
          chrome.runtime.sendMessage({ type: 'STOP_FOCUS' });
        } else {
          // Start
          chrome.runtime.sendMessage({
            type: 'START_FOCUS',
            task: todo.text,
            taskId: todo.id,
            duration: todo.target ? (todo.target - (todo.elapsed || 0)) / 60 : 25
          });
        }
      });
    }

    // Double click shortcut
    el.addEventListener('dblclick', () => {
      if (!todo.completed && !isActive) {
        chrome.runtime.sendMessage({
          type: 'START_FOCUS',
          task: todo.text,
          taskId: todo.id,
          duration: todo.target ? (todo.target - (todo.elapsed || 0)) / 60 : 25
        });
      }
    });

    return el;
  }

  // Add Task Button in Kanban
  const kanbanAddBtn = document.getElementById('kanban-add-todo');
  if (kanbanAddBtn) {
    // Avoid multiple listeners if possible, but this runs once on load
    kanbanAddBtn.onclick = () => {
      const text = prompt("Enter task name:");
      if (text && text.trim()) {
        addTodoFromText(text.trim());
      }
    };
  }

  function addTodoFromText(text) {
    chrome.storage.local.get('todos', (result) => {
      const todos = result.todos || [];
      todos.push({
        id: Date.now(),
        text,
        target: 25 * 60,
        elapsed: 0,
        completed: false,
        status: 'todo'
      });
      saveTodos(todos);
    });
  }

  function deleteTodo(id) {
    chrome.storage.local.get('todos', (result) => {
      const todos = result.todos || [];
      const newTodos = todos.filter(t => t.id != id); // loose comparison for string/int safety
      saveTodos(newTodos);
    });
  }


  // Drag & Drop Columns
  const columns = document.querySelectorAll('.kanban-column');
  columns.forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.classList.add('drag-over');
    });

    col.addEventListener('dragleave', () => {
      col.classList.remove('drag-over');
    });

    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const id = e.dataTransfer.getData('text/plain');
      const newStatus = col.dataset.status;

      if (id && newStatus) {
        updateTodoStatus(parseInt(id), newStatus);
      }
    });
  });

  function updateTodoStatus(id, newStatus) {
    chrome.storage.local.get('todos', (result) => {
      const todos = result.todos || [];
      const updated = todos.map(t => {
        if (t.id == id) { // loose match
          t.status = newStatus;
          // Sync completion state
          if (newStatus === 'done') t.completed = true;
          else t.completed = false;
        }
        return t;
      });
      saveTodos(updated);
    });
  }

});