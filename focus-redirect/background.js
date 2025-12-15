let isEnabled = true;
let bannedSites = [];
let creatingOffscreenParams = null; // Promise for offscreen creation

// Load settings
chrome.storage.local.get(['isEnabled', 'bannedSites'], (result) => {
  if (result) {
    isEnabled = result.isEnabled !== undefined ? result.isEnabled : true;
    bannedSites = result.bannedSites || [];
  }
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.isEnabled) isEnabled = changes.isEnabled.newValue;
  if (changes.bannedSites) bannedSites = changes.bannedSites.newValue;
});

// --- NAVIGATION BLOCKING ---
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return;
  if (!isEnabled) return;

  const url = new URL(details.url);
  const domain = url.hostname.replace('www.', '');

  if (bannedSites.some(site => domain.includes(site))) {
    chrome.storage.local.set({ lastBlockedUrl: details.url });
    incrementRedirectCount(domain);
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL('inspiration/inspiration.html?mode=blocked')
    });
  }
});

function incrementRedirectCount(domain) {
  chrome.storage.local.get('redirectStats', (result) => {
    const stats = result.redirectStats || {};
    stats[domain] = (stats[domain] || 0) + 1;
    stats.total = (stats.total || 0) + 1;
    chrome.storage.local.set({ redirectStats: stats });
  });
}

// --- FOCUS SESSION HANDLING ---
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'START_FOCUS') {
    startFocusSession(msg.task, msg.taskId, msg.duration);
  } else if (msg.type === 'STOP_FOCUS') {
    stopFocusSession(); // Manual stop (Pause)
  } else if (msg.type === 'NEXT_TRACK') {
    handleNextTrack();
  } else if (msg.type === 'SET_TRACK') {
    handleSetTrack(msg.trackIndex);
  } else if (msg.type === 'COMPLETE_TASK') {
    completeActiveTask(); // Manual complete button
  } else if (msg.type === 'TOGGLE_MUSIC') {
    safeSendMessage({ type: 'TOGGLE_MUSIC' });
  }
});

// Alarm for checking timer expiry
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'focusTimer') {
    checkTimerExpiry();
  }
});

function checkTimerExpiry() {
  chrome.storage.local.get(['focusSession'], (result) => {
    const session = result.focusSession;
    if (session && session.isActive) {
      const elapsed = Date.now() - session.startTime;
      if (elapsed >= session.duration) {
        // Time is up!
        completeActiveTask();
      }
    }
  });
}

async function startFocusSession(task, taskId, durationMinutes = 25) {
  const session = {
    isActive: true,
    task: task,
    taskId: taskId || null,
    startTime: Date.now(),
    duration: durationMinutes * 60 * 1000
  };
  chrome.storage.local.set({ focusSession: session });

  // Create alarm to check every minute (or shorter if possible, but 1m is standard min)
  // For higher precision, we rely on the alarm firing approximately when needed.
  // Chrome Alarms min is 1 min. For seconds precision, we might need a backup
  // logic or just accept 1m resolution for auto-stop in background.
  // Actually, we can set 'when' to exact time.
  const expiryTime = Date.now() + (durationMinutes * 60 * 1000);
  chrome.alarms.create('focusTimer', { when: expiryTime });

  await setupOffscreenDocument('offscreen/audio.html');
  safeSendMessage({ type: 'PLAY_MUSIC' });
}

function stopFocusSession() {
  // Clear alarm
  chrome.alarms.clear('focusTimer');

  chrome.storage.local.get(['focusSession', 'focusStats', 'todos'], (result) => {
    const session = result.focusSession;
    if (session && session.isActive && session.startTime) {
      updateStatsAndTodo(session, result.focusStats, result.todos, false);
    }
    // Reset session state
    chrome.storage.local.set({ focusSession: { isActive: false } });
    safeSendMessage({ type: 'STOP_MUSIC' });
  });
}

function completeActiveTask() {
  chrome.alarms.clear('focusTimer');

  chrome.storage.local.get(['focusSession', 'focusStats', 'todos'], (result) => {
    const session = result.focusSession;
    if (session && session.isActive && session.startTime) {
      updateStatsAndTodo(session, result.focusStats, result.todos, true);
    }
    // Reset session
    chrome.storage.local.set({ focusSession: { isActive: false } });
    safeSendMessage({ type: 'STOP_MUSIC' });
  });
}

function updateStatsAndTodo(session, focusStats, todos, isComplete) {
  const elapsedMs = Date.now() - session.startTime;
  // If completing, we might want to credit the FULL duration even if slightly off? 
  // User said: "just make it say that that is done... reflected to minute focus"
  // Let's credit actual elapsed time.
  const elapsedSecs = Math.floor(elapsedMs / 1000);
  const elapsedMins = Math.floor(elapsedMs / 60000);

  // 1. Update Specific Task
  if (session.taskId && todos) {
    const updatedTodos = todos.map(t => {
      if (t.id === session.taskId) {
        const newElapsed = (t.elapsed || 0) + elapsedSecs;
        return {
          ...t,
          elapsed: newElapsed,
          completed: isComplete ? true : t.completed // Mark done if complete
        };
      }
      return t;
    });
    chrome.storage.local.set({ todos: updatedTodos });
  }

  // 2. Update Global Stats
  if (elapsedMins > 0) {
    const stats = focusStats || { daily: {}, totalMinutes: 0 };
    const today = new Date().toLocaleDateString('en-CA');

    stats.daily = stats.daily || {};
    stats.daily[today] = (stats.daily[today] || 0) + elapsedMins;
    stats.totalMinutes = (stats.totalMinutes || 0) + elapsedMins;

    chrome.storage.local.set({ focusStats: stats });
  }
}

function safeSendMessage(message) {
  chrome.runtime.sendMessage(message).catch(err => {
    // Suppress "Receiving end does not exist" error
    // This happens if the offscreen document or popup isn't currently listening
    // which is expected behavior in many context switches.
  });
}


async function setupOffscreenDocument(path) {
  // Check if offscreen doc already exists
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL(path)]
  });

  if (existingContexts.length > 0) return;

  // Create it
  if (creatingOffscreenParams) {
    await creatingOffscreenParams;
  } else {
    creatingOffscreenParams = chrome.offscreen.createDocument({
      url: path,
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Playing focus music in the background',
    });
    await creatingOffscreenParams;
    creatingOffscreenParams = null;
  }
}
