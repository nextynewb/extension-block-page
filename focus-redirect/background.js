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

// --- DEBUG & STATE HANDLING ---
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'START_FOCUS') {
    startFocusSession(msg.task, msg.taskId, msg.duration);
  } else if (msg.type === 'STOP_FOCUS') {
    stopFocusSession();
  } else if (msg.type === 'COMPLETE_TASK') {
    completeActiveTask();
  } else if (msg.type === 'PLAYBACK_STATE') {
    // Visual Debugging
    if (msg.isPlaying) {
      chrome.action.setBadgeText({ text: 'ON' });
      chrome.action.setBadgeBackgroundColor({ color: '#22c55e' }); // Green
    } else {
      chrome.action.setBadgeText({ text: '' }); // Clear when paused
    }
  } else if (msg.type === 'AUDIO_ERROR') {
    chrome.action.setBadgeText({ text: 'ERR' });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' }); // Red
    console.error("Audio Error reported:", msg.error);
  } else if (msg.type === 'MANUAL_PLAY_MUSIC') {
    // Ensure offscreen document exists before trying to play
    setupOffscreenDocument('offscreen/audio.html').then(() => {
      safeSendMessage({ type: 'PLAY_MUSIC' });
    }).catch(err => {
      console.warn("Failed to setup during manual play:", err);
      // Try playing anyway if it failed due to existing context
      safeSendMessage({ type: 'PLAY_MUSIC' });
    });
  } else if (msg.type === 'REQUEST_INIT_STATE') {
    chrome.storage.local.get('currentTrackIndex', (result) => {
      safeSendMessage({
        type: 'INIT_STATE',
        trackIndex: result.currentTrackIndex || 0
      });
    });
  } else if (msg.type === 'UPDATE_TRACK_INDEX') {
    chrome.storage.local.set({ currentTrackIndex: msg.index });
  }
});

// Alarm for checking timer expiry
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'focusTimer') {
    checkTimerExpiry();
  } else if (alarm.name === 'fridayCheck') {
    checkFridayPrayer();
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

  // Create alarm to check every minute
  const expiryTime = Date.now() + (durationMinutes * 60 * 1000);
  chrome.alarms.create('focusTimer', { when: expiryTime });

  try {
    await setupOffscreenDocument('offscreen/audio.html');
  } catch (err) {
    console.warn("Failed to setup offscreen document:", err);
  }
  // Audio is now decoupled from timer. User plays it manually.
  // safeSendMessage({ type: 'PLAY_MUSIC' });
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
    // safeSendMessage({ type: 'STOP_MUSIC' });
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
    // safeSendMessage({ type: 'STOP_MUSIC' });
  });
}

function updateStatsAndTodo(session, focusStats, todos, isComplete) {
  const elapsedMs = Date.now() - session.startTime;
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
          completed: isComplete ? true : t.completed
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

// Helper functions (kept if needed by other logic, but not used by echoes anymore)
function handleNextTrack() {
  safeSendMessage({ type: 'NEXT_TRACK' });
}

function handleSetTrack(trackIndex) {
  safeSendMessage({ type: 'SET_TRACK', trackIndex });
}

function safeSendMessage(message) {
  chrome.runtime.sendMessage(message).catch(err => {
    // Suppress "Receiving end does not exist" error
  });
}

async function setupOffscreenDocument(path) {
  // Robust check for existing offscreen document
  if (chrome.runtime.getContexts) {
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [chrome.runtime.getURL(path)]
    });
    if (existingContexts.length > 0) return;
  } else {
    // Fallback: check via checking clients or just proceed to create (it will reject if exists)
    // Note: older chrome versions might throw if we try to create duplicate.
    // We'll let it proceed to creation and catch the error if it says "only one allowed".
  }

  // Create it
  if (creatingOffscreenParams) {
    await creatingOffscreenParams;
  } else {
    creatingOffscreenParams = chrome.offscreen.createDocument({
      url: path,
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Playing focus music in the background',
    });

    try {
      await creatingOffscreenParams;
    } catch (error) {
      if (!error.message.startsWith('Only a single offscreen')) {
        throw error;
      }
    }
    creatingOffscreenParams = null;
  }
}

// --- FRIDAY PRAYER NOTIFICATION ---
let prayerData = null;
let lastFridayNotificationDate = null;

function loadPrayerData() {
  fetch('inspiration/prayers.json')
    .then(res => res.json())
    .then(data => { prayerData = data; })
    .catch(err => console.error("Failed to load prayers", err));
}
loadPrayerData();

// Check every minute
chrome.alarms.create('fridayCheck', { periodInMinutes: 1 });

function checkFridayPrayer() {
  if (!prayerData) return;
  const now = new Date();

  // 5 = Friday
  if (now.getDay() !== 5) return;

  const todayKey = now.toLocaleDateString('en-CA');
  const schedule = prayerData[todayKey];

  // Use Dhuhr time for Friday checks
  if (!schedule || !schedule.Dhuhr) return;

  const [h, m] = schedule.Dhuhr.split(':').map(Number);
  const dhuhrTime = new Date(now);
  dhuhrTime.setHours(h, m, 0, 0);

  const diff = dhuhrTime.getTime() - now.getTime();
  const fiveMinutes = 5 * 60 * 1000;

  // Notify if within 5 minutes (and haven't notified today)
  if (diff > 0 && diff <= fiveMinutes) {
    if (lastFridayNotificationDate !== todayKey) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Friday Prayer',
        message: 'Friday Prayers are in 5 minutes. Please pray for me.',
        priority: 2
      });
      lastFridayNotificationDate = todayKey;
    }
  }
}
