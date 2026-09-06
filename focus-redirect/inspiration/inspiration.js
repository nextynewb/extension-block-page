document.addEventListener('DOMContentLoaded', () => {
  if (!window.chrome?.storage?.local) {
    const previewStorageKey = 'focusRedirectPreviewStorage';
    const readPreviewStorage = () => JSON.parse(localStorage.getItem(previewStorageKey) || '{}');
    const writePreviewStorage = (data) => localStorage.setItem(previewStorageKey, JSON.stringify(data));

    window.chrome = {
      ...(window.chrome || {}),
      storage: {
        local: {
          get(keys, callback) {
            const store = readPreviewStorage();
            if (typeof keys === 'string') {
              callback({ [keys]: store[keys] });
              return;
            }
            if (Array.isArray(keys)) {
              callback(Object.fromEntries(keys.map((key) => [key, store[key]])));
              return;
            }
            callback({ ...keys, ...store });
          },
          set(items) {
            writePreviewStorage({ ...readPreviewStorage(), ...items });
          }
        },
        onChanged: {
          addListener() {}
        }
      },
      runtime: {
        sendMessage() {},
        onMessage: {
          addListener() {}
        }
      }
    };
  }

  const pad = (value) => String(value).padStart(2, '0');
  const escapeHtml = (value) => String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
  const formatMinutes = (minutes) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  const formatClockDuration = (seconds) => `${pad(Math.floor(seconds / 60))}:${pad(Math.floor(seconds % 60))}`;
  const formatShortTime = (date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const getDateKey = (offset = 0) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    return date.toLocaleDateString('en-CA');
  };
  const getDateLabel = (mode) => mode === 'tomorrow' ? 'Tomorrow' : 'Today';
  const getModeDateKey = (mode) => getDateKey(mode === 'tomorrow' ? 1 : 0);
  const timeToMinutes = (time) => {
    if (!time || !time.includes(':')) return Number.MAX_SAFE_INTEGER;
    const [hours, minutes] = time.split(':').map(Number);
    return (hours * 60) + minutes;
  };
  const convertTime = (time24) => {
    if (!time24 || !time24.includes(':')) return 'No time';
    const [hours, minutes] = time24.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const normalizedHours = hours % 12 || 12;
    return `${normalizedHours}:${pad(minutes)} ${ampm}`;
  };
  const toTimeValue = (hours, minutes, meridiem) => {
    let normalizedHours = Number(hours);
    const normalizedMinutes = Number(minutes || 0);
    if (meridiem) {
      const lower = meridiem.toLowerCase();
      if (lower === 'pm' && normalizedHours < 12) normalizedHours += 12;
      if (lower === 'am' && normalizedHours === 12) normalizedHours = 0;
    }
    return `${pad(normalizedHours)}:${pad(normalizedMinutes)}`;
  };

  const elements = {
    dateDisplay: document.getElementById('date-display'),
    liveClock: document.getElementById('live-clock'),
    liveDate: document.getElementById('live-date'),
    focusMinutes: document.getElementById('focus-minutes'),
    focusGoalPercent: document.getElementById('focus-goal-percent'),
    focusGoalInline: document.getElementById('focus-goal-inline'),
    focusProgressBar: document.getElementById('focus-progress-bar'),
    weeklyProgressFill: document.getElementById('weekly-progress-fill'),
    weeklyWeekHours: document.getElementById('weekly-week-hours'),
    habitGrid: document.getElementById('habit-grid'),
    habitStreak: document.getElementById('habit-streak'),
    habitInput: document.getElementById('habit-input'),
    addHabitBtn: document.getElementById('add-habit-btn'),
    habitContextLabel: document.getElementById('habit-context-label'),
    weeklyChart: document.getElementById('weekly-chart'),
    timelineList: document.getElementById('today-rhythm-list'),
    timelineLabel: document.getElementById('timeline-day-label'),
    timelineSubtitle: document.getElementById('timeline-subtitle'),
    daySwitch: document.getElementById('timeline-day-switch'),
    todoInput: document.getElementById('todo-input'),
    todoTime: document.getElementById('todo-time'),
    todoNote: document.getElementById('todo-note'),
    addTodoBtn: document.getElementById('add-todo-btn'),
    todoListInput: document.getElementById('todo-list-input'),
    addTodoListBtn: document.getElementById('add-todo-list-btn'),
    todoQuadrantBoard: document.getElementById('todo-quadrant-board'),
    todoListCount: document.getElementById('todo-list-count'),
    plannerTimePresets: document.getElementById('planner-time-presets'),
    durationPicker: document.getElementById('duration-picker-wrap'),
    currentDuration: document.getElementById('current-duration'),
    durationOptions: document.querySelector('.duration-options'),
    durationButtons: document.querySelectorAll('.duration-options button'),
    nextPrayerName: document.getElementById('next-prayer-name'),
    prayerCountdown: document.getElementById('prayer-countdown'),
    prayerProgressBar: document.getElementById('prayer-progress-bar'),
    journalInput: document.getElementById('journal-input'),
    journalSave: document.getElementById('journal-save'),
    journalStatus: document.getElementById('journal-status'),
    openJournalHistory: document.getElementById('open-journal-history'),
    journalHistoryModal: document.getElementById('journal-history-modal'),
    closeJournalHistory: document.getElementById('close-journal-history'),
    journalPrompts: document.querySelectorAll('.journal-prompt'),
    journalHistoryDate: document.getElementById('journal-history-date'),
    journalHistoryPreview: document.getElementById('journal-history-preview'),
    snippetLabelInput: document.getElementById('snippet-label-input'),
    snippetValueInput: document.getElementById('snippet-value-input'),
    addSnippetBtn: document.getElementById('add-snippet-btn'),
    snippetList: document.getElementById('snippet-list'),
    quickLinkLabel: document.getElementById('quick-link-label'),
    quickLinkUrl: document.getElementById('quick-link-url'),
    addQuickLinkBtn: document.getElementById('add-quick-link'),
    quickLinksList: document.getElementById('quick-links-list'),
    openQuickLinks: document.getElementById('open-quick-links'),
    quickLinksModal: document.getElementById('quick-links-modal'),
    closeQuickLinks: document.getElementById('close-quick-links'),
    stickyInputs: {
      'note-2': document.getElementById('sticky-note-2'),
      'note-3': document.getElementById('sticky-note-3'),
      'note-4': document.getElementById('sticky-note-4'),
      'note-5': document.getElementById('sticky-note-5')
    },
    hiddenTodoList: document.getElementById('todo-list'),
    hiddenNotes: ['note-1', 'note-2', 'note-3', 'note-4', 'note-5'].map((id) => document.getElementById(id)),
    musicPill: document.getElementById('music-pill'),
    trackName: document.getElementById('track-name'),
    musicDropdown: document.getElementById('header-music-dropdown'),
    actionToast: document.getElementById('action-toast'),
    actionToastText: document.getElementById('action-toast-text'),
    actionToastUndo: document.getElementById('action-toast-undo'),
    sideNav: document.querySelector('.side-nav'),
    sideNavButtons: document.querySelectorAll('.side-nav-item')
  };

  const state = {
    todos: [],
    habits: [],
    habitLogs: {},
    snippets: [],
    quickLinks: [],
    journalEntries: {},
    focusSession: null,
    prayerData: null,
    activeJournalDateKey: getDateKey(),
    selectedDay: 'today',
    selectedDuration: 25,
    currentTodayMinutes: 0,
    undoAction: null,
    toastTimer: null
  };

  function showToast(message, undoAction = null) {
    if (!elements.actionToast || !elements.actionToastText) return;
    window.clearTimeout(state.toastTimer);
    state.undoAction = undoAction;
    elements.actionToastText.textContent = message;
    if (elements.actionToastUndo) elements.actionToastUndo.hidden = !undoAction;
    elements.actionToast.classList.add('visible');
    state.toastTimer = window.setTimeout(() => {
      elements.actionToast.classList.remove('visible');
      state.undoAction = null;
    }, undoAction ? 6000 : 2600);
  }

  function nextQuarterHour() {
    const now = new Date();
    let minutes = (now.getHours() * 60) + now.getMinutes();
    minutes = Math.ceil(minutes / 15) * 15;
    minutes = Math.min(minutes, (23 * 60) + 45);
    return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
  }

  function advancePlannerTime(fromTime, durationMinutes) {
    if (!elements.todoTime || !fromTime) return;
    const nextMinutes = Math.min(timeToMinutes(fromTime) + durationMinutes, (23 * 60) + 45);
    elements.todoTime.value = `${pad(Math.floor(nextMinutes / 60))}:${pad(nextMinutes % 60)}`;
  }

  function updateClock() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });

    if (elements.dateDisplay) elements.dateDisplay.textContent = `${dateStr} | ${timeStr}`;
    if (elements.liveClock) elements.liveClock.textContent = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (elements.liveDate) elements.liveDate.textContent = dateStr;
  }

  function setJournalStatus(text) {
    if (elements.journalStatus) elements.journalStatus.textContent = text;
  }

  function saveNotes() {
    const stickyNotes = {};
    elements.hiddenNotes.forEach((note, index) => {
      if (!note) return;
      const key = `note-${index + 1}`;
      if (index === 0) {
        stickyNotes[key] = elements.journalInput?.value || '';
      } else if (elements.stickyInputs[key]) {
        stickyNotes[key] = elements.stickyInputs[key].value;
      } else {
        stickyNotes[key] = note.innerText;
      }
      note.innerText = stickyNotes[key];
    });
    chrome.storage.local.set({ stickyNotes });
    setJournalStatus('Saved');
  }

  function saveDailyJournal() {
    if (!elements.journalInput) return;
    const journalDateKey = state.activeJournalDateKey || getDateKey();
    state.journalEntries[journalDateKey] = elements.journalInput.value;
    chrome.storage.local.set({ journalEntries: state.journalEntries });
    const note1 = document.getElementById('note-1');
    if (note1) note1.innerText = elements.journalInput.value;
    setJournalStatus('Saved');
  }

  function loadJournalForDate(dateKey) {
    state.activeJournalDateKey = dateKey;
    if (elements.journalInput) {
      elements.journalInput.value = state.journalEntries[dateKey] || '';
    }
    const note1 = document.getElementById('note-1');
    if (note1) note1.innerText = state.journalEntries[dateKey] || '';
    if (elements.journalHistoryDate) {
      elements.journalHistoryDate.value = dateKey;
    }
    renderJournalHistory(dateKey);
    setJournalStatus('Autosaved');
  }

  function checkJournalDateRollover() {
    const todayKey = getDateKey();
    if (state.activeJournalDateKey === todayKey) return;

    saveDailyJournal();
    loadJournalForDate(todayKey);
  }

  function renderJournalHistory(dateKey) {
    if (!elements.journalHistoryPreview) return;
    const entry = state.journalEntries[dateKey] || '';
    elements.journalHistoryPreview.textContent = entry || 'No saved entry for selected date.';
  }

  function openJournalHistoryModal() {
    const todayKey = getDateKey();
    if (elements.journalHistoryDate && !elements.journalHistoryDate.value) {
      elements.journalHistoryDate.value = todayKey;
    }
    renderJournalHistory(elements.journalHistoryDate?.value || todayKey);
    elements.journalHistoryModal?.classList.add('visible');
  }

  function closeJournalHistoryModal() {
    elements.journalHistoryModal?.classList.remove('visible');
  }

  function openQuickLinksModal() {
    elements.quickLinksModal?.classList.add('visible');
  }

  function closeQuickLinksModal() {
    elements.quickLinksModal?.classList.remove('visible');
  }

  function setActiveNavItem(targetId) {
    elements.sideNavButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.target === targetId);
    });
    document.body.dataset.activeView = targetId;
  }

  function initSideNavigation() {
    if (!elements.sideNav || !elements.sideNavButtons.length) return;

    elements.sideNav.addEventListener('click', (event) => {
      const button = event.target.closest('.side-nav-item');
      if (!button) return;

      const target = document.getElementById(button.dataset.target || '');
      if (!target) return;

      setActiveNavItem(button.dataset.target);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (button.dataset.target === 'sticky-section') {
        window.setTimeout(() => {
          document.querySelector('.sticky-input')?.focus({ preventScroll: true });
        }, 160);
      }
    });

    setActiveNavItem('overview-section');
  }

  function initJournal() {
    chrome.storage.local.get(['stickyNotes', 'journalEntries'], (result) => {
      const stickyNotes = result.stickyNotes || {};
      state.journalEntries = result.journalEntries || {};
      const todayKey = getDateKey();
      elements.hiddenNotes.forEach((note, index) => {
        if (!note) return;
        const key = `note-${index + 1}`;
        note.innerText = stickyNotes[key] || '';
      });
      loadJournalForDate(todayKey);
      Object.entries(elements.stickyInputs).forEach(([key, input]) => {
        if (input) input.value = stickyNotes[key] || '';
      });
    });

    if (elements.journalInput) {
      elements.journalInput.addEventListener('input', () => {
        setJournalStatus('Saving...');
        saveDailyJournal();
      });
    }

    if (elements.journalSave) {
      elements.journalSave.addEventListener('click', () => saveDailyJournal());
    }

    Object.values(elements.stickyInputs).forEach((input) => {
      if (!input) return;
      input.addEventListener('input', () => {
        setJournalStatus('Saving...');
        saveNotes();
      });
    });

    elements.journalPrompts.forEach((button) => {
      button.addEventListener('click', () => {
        if (!elements.journalInput) return;
        const prompt = button.dataset.prompt || '';
        elements.journalInput.value = elements.journalInput.value.trim()
          ? `${elements.journalInput.value.trim()}\n\n${prompt}\n`
          : `${prompt}\n`;
        elements.journalInput.focus();
        setJournalStatus('Saving...');
        saveDailyJournal();
      });
    });

    if (elements.journalHistoryDate) {
      elements.journalHistoryDate.addEventListener('change', () => {
        renderJournalHistory(elements.journalHistoryDate.value);
      });
    }

    if (elements.openJournalHistory) {
      elements.openJournalHistory.addEventListener('click', () => openJournalHistoryModal());
    }

    if (elements.closeJournalHistory) {
      elements.closeJournalHistory.addEventListener('click', () => closeJournalHistoryModal());
    }

    if (elements.journalHistoryModal) {
      elements.journalHistoryModal.addEventListener('click', (event) => {
        if (event.target === elements.journalHistoryModal) {
          closeJournalHistoryModal();
        }
      });
    }
  }

  function normalizeTodo(todo) {
    return {
      id: todo.id || Date.now(),
      text: todo.text || '',
      target: typeof todo.target === 'number' ? todo.target : state.selectedDuration * 60,
      elapsed: typeof todo.elapsed === 'number' ? todo.elapsed : 0,
      completed: Boolean(todo.completed),
      scheduledTime: todo.scheduledTime || '',
      note: todo.note || '',
      scheduledDate: todo.scheduledDate || getDateKey(),
      quadrant: todo.quadrant || 'do-first',
      createdAt: todo.createdAt || todo.id || Date.now()
    };
  }

  function normalizeHabit(habit) {
    return {
      id: habit.id || `habit-${Date.now()}`,
      name: (habit.name || '').trim()
    };
  }

  function normalizeSnippet(snippet) {
    return {
      id: snippet.id || `snippet-${Date.now()}`,
      label: (snippet.label || '').trim(),
      value: snippet.value || ''
    };
  }

  function normalizeQuickLink(link) {
    return {
      id: link.id || `link-${Date.now()}`,
      label: (link.label || '').trim(),
      url: (link.url || '').trim()
    };
  }

  function syncTodos(nextTodos) {
    state.todos = nextTodos.map(normalizeTodo);
    chrome.storage.local.set({ todos: state.todos });
    renderCompatTodos();
    renderTimeline();
    renderTodoList();
  }

  function renderCompatTodos() {
    if (!elements.hiddenTodoList) return;
    elements.hiddenTodoList.innerHTML = state.todos.map((todo) => `<li>${escapeHtml(todo.text)}</li>`).join('');
  }

  function setSelectedDay(day) {
    state.selectedDay = day === 'tomorrow' ? 'tomorrow' : 'today';
    const label = getDateLabel(state.selectedDay);
    const descriptor = state.selectedDay === 'tomorrow'
      ? 'Everything important for tomorrow should appear in order here.'
      : 'Everything important for today should appear in order here.';

    if (elements.timelineLabel) elements.timelineLabel.textContent = label;
    if (elements.timelineSubtitle) elements.timelineSubtitle.textContent = descriptor;
    if (elements.habitContextLabel) elements.habitContextLabel.textContent = `Logging for ${label}`;

    document.querySelectorAll('.timeline-day-btn').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.day === state.selectedDay);
    });

    renderTimeline();
    renderHabits();
  }

  function syncHabits(nextHabits) {
    state.habits = nextHabits.map(normalizeHabit).filter((habit) => habit.name);
    chrome.storage.local.set({ habitsConfig: state.habits });
    renderHabits();
  }

  function syncHabitLogs(nextLogs) {
    state.habitLogs = nextLogs;
    chrome.storage.local.set({ habitLogs: state.habitLogs });
    renderHabits();
  }

  function syncSnippets(nextSnippets) {
    state.snippets = nextSnippets.map(normalizeSnippet).filter((snippet) => snippet.label && snippet.value);
    chrome.storage.local.set({ snippetVault: state.snippets });
    renderSnippets();
  }

  function syncQuickLinks(nextLinks) {
    state.quickLinks = nextLinks.map(normalizeQuickLink).filter((link) => link.label && link.url).slice(0, 5);
    chrome.storage.local.set({ quickLinks: state.quickLinks });
    renderQuickLinks();
  }

  function addHabit() {
    const name = elements.habitInput?.value.trim() || '';
    if (!name) return;

    const nextHabit = normalizeHabit({
      id: `habit-${Date.now()}`,
      name
    });

    syncHabits([...state.habits, nextHabit]);
    if (elements.habitInput) elements.habitInput.value = '';
  }

  function addSnippet() {
    const label = elements.snippetLabelInput?.value.trim() || '';
    const value = elements.snippetValueInput?.value || '';
    if (!label || !value.trim()) return;

    syncSnippets([
      ...state.snippets,
      normalizeSnippet({
        id: `snippet-${Date.now()}`,
        label,
        value
      })
    ]);

    if (elements.snippetLabelInput) elements.snippetLabelInput.value = '';
    if (elements.snippetValueInput) elements.snippetValueInput.value = '';
  }

  function deleteSnippet(snippetId) {
    syncSnippets(state.snippets.filter((snippet) => snippet.id !== snippetId));
  }

  async function copySnippet(snippetId) {
    const snippet = state.snippets.find((item) => item.id === snippetId);
    if (!snippet) return;

    try {
      await navigator.clipboard.writeText(snippet.value);
    } catch {
      const fallback = document.createElement('textarea');
      fallback.value = snippet.value;
      fallback.setAttribute('readonly', '');
      fallback.style.position = 'absolute';
      fallback.style.left = '-9999px';
      document.body.appendChild(fallback);
      fallback.select();
      document.execCommand('copy');
      document.body.removeChild(fallback);
    }
  }

  function normalizeUrl(url) {
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  function addQuickLink() {
    const label = elements.quickLinkLabel?.value.trim() || '';
    const url = normalizeUrl(elements.quickLinkUrl?.value || '');
    if (!label || !url || state.quickLinks.length >= 5) return;

    syncQuickLinks([
      ...state.quickLinks,
      normalizeQuickLink({ id: `link-${Date.now()}`, label, url })
    ]);

    if (elements.quickLinkLabel) elements.quickLinkLabel.value = '';
    if (elements.quickLinkUrl) elements.quickLinkUrl.value = '';
  }

  function deleteQuickLink(linkId) {
    syncQuickLinks(state.quickLinks.filter((link) => link.id !== linkId));
  }

  function openQuickLink(linkId) {
    const link = state.quickLinks.find((item) => item.id === linkId);
    if (!link) return;
    window.open(link.url, '_blank', 'noopener,noreferrer');
  }

  function toggleHabitLog(habitId, dateKey) {
    const nextLogs = { ...state.habitLogs };
    const dayLogs = { ...(nextLogs[dateKey] || {}) };
    dayLogs[habitId] = !dayLogs[habitId];
    if (!dayLogs[habitId]) delete dayLogs[habitId];

    if (Object.keys(dayLogs).length) nextLogs[dateKey] = dayLogs;
    else delete nextLogs[dateKey];

    syncHabitLogs(nextLogs);
  }

  function deleteHabit(habitId) {
    const nextHabits = state.habits.filter((habit) => habit.id !== habitId);
    const nextLogs = Object.fromEntries(
      Object.entries(state.habitLogs).map(([dateKey, logs]) => {
        const filtered = { ...logs };
        delete filtered[habitId];
        return [dateKey, filtered];
      }).filter(([, logs]) => Object.keys(logs).length)
    );

    state.habitLogs = nextLogs;
    chrome.storage.local.set({ habitLogs: nextLogs });
    syncHabits(nextHabits);
  }

  function parsePlannerInput(rawText) {
    const source = rawText.trim();
    let title = source;
    let scheduledTime = elements.todoTime?.value || '';
    let durationMinutes = state.selectedDuration;

    const timeMatch = source.match(/^\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s+(.+)$/i);
    if (timeMatch) {
      const [, hours, minutes, meridiem, remainder] = timeMatch;
      scheduledTime = toTimeValue(hours, minutes || 0, meridiem);
      title = remainder.trim();
    }

    const durationMatch = title.match(/\b(\d{1,3})\s*(m|min|mins|minutes|h|hr|hrs|hour|hours)\b/i);
    if (durationMatch) {
      const value = Number(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();
      durationMinutes = unit.startsWith('h') ? value * 60 : value;
      title = title.replace(durationMatch[0], '').trim();
    }

    return {
      title,
      scheduledTime,
      durationMinutes
    };
  }

  function addTodo() {
    const rawText = elements.todoInput?.value.trim() || '';
    if (!rawText) return;

    const parsed = parsePlannerInput(rawText);
    if (!parsed.title) return;

    const newTodo = normalizeTodo({
      id: Date.now(),
      text: parsed.title,
      target: parsed.durationMinutes * 60,
      elapsed: 0,
      completed: false,
      scheduledTime: parsed.scheduledTime,
      note: elements.todoNote?.value.trim() || '',
      scheduledDate: getModeDateKey(state.selectedDay),
      createdAt: Date.now()
    });

    syncTodos([...state.todos, newTodo]);

    if (elements.todoInput) elements.todoInput.value = '';
    advancePlannerTime(parsed.scheduledTime, parsed.durationMinutes);
    if (elements.todoNote) elements.todoNote.value = '';
    showToast(`${parsed.title} added to ${getDateLabel(state.selectedDay).toLowerCase()}`);
  }

  function addListTodo() {
    const text = elements.todoListInput?.value.trim() || '';
    if (!text) return;

    const newTodo = normalizeTodo({
      id: Date.now(),
      text,
      target: state.selectedDuration * 60,
      elapsed: 0,
      completed: false,
      scheduledTime: '',
      note: '',
      scheduledDate: getDateKey(),
      quadrant: 'do-first',
      createdAt: Date.now()
    });

    syncTodos([...state.todos, newTodo]);
    if (elements.todoListInput) elements.todoListInput.value = '';
    showToast('Task captured');
  }

  function toggleTodoComplete(id) {
    const nextTodos = state.todos.map((todo) => todo.id === id ? { ...todo, completed: !todo.completed } : todo);
    syncTodos(nextTodos);
  }

  function deleteTodo(id) {
    const deletedIndex = state.todos.findIndex((todo) => todo.id === id);
    if (deletedIndex < 0) return;
    const deletedTodo = state.todos[deletedIndex];
    syncTodos(state.todos.filter((todo) => todo.id !== id));
    showToast(`Deleted “${deletedTodo.text}”`, () => {
      const restored = [...state.todos];
      restored.splice(Math.min(deletedIndex, restored.length), 0, deletedTodo);
      syncTodos(restored);
      showToast('Task restored');
    });
  }

  function updateTodoQuadrant(id, quadrant) {
    const nextTodos = state.todos.map((todo) => todo.id === id ? { ...todo, quadrant } : todo);
    syncTodos(nextTodos);
  }

  function startTodo(todoId) {
    const todo = state.todos.find((item) => item.id === todoId);
    if (!todo) return;

    const remainingSeconds = Math.max(0, (todo.target || 0) - (todo.elapsed || 0));
    const durationMinutes = remainingSeconds > 0 ? remainingSeconds / 60 : (todo.target || 1500) / 60;

    chrome.runtime.sendMessage({
      type: 'START_FOCUS',
      task: todo.text,
      taskId: todo.id,
      duration: durationMinutes
    });
  }

  function stopFocus() {
    chrome.runtime.sendMessage({ type: 'STOP_FOCUS' });
  }

  function buildPrayerItemsForDate(dateKey) {
    const schedule = state.prayerData?.[dateKey];
    if (!schedule) return [];

    return Object.entries(schedule).map(([name, time]) => ({
      id: `prayer-${dateKey}-${name}`,
      type: 'prayer',
      title: `${name} prayer`,
      badge: 'Prayer',
      time,
      minutes: timeToMinutes(time),
      meta: 'A built-in reset point in the day.'
    }));
  }

  function getSessionTodo() {
    if (!state.focusSession?.isActive) return null;
    return state.todos.find((todo) => todo.id === state.focusSession.taskId) || null;
  }

  function renderTimeline() {
    if (!elements.timelineList) return;

    const selectedDate = getModeDateKey(state.selectedDay);
    const sessionTodo = getSessionTodo();
    const sessionRemainingSeconds = state.focusSession?.isActive
      ? Math.max(0, Math.floor((state.focusSession.duration - (Date.now() - state.focusSession.startTime)) / 1000))
      : 0;

    const todoItems = state.todos
      .filter((todo) => todo.scheduledDate === selectedDate)
      .sort((a, b) => {
        const timeDiff = timeToMinutes(a.scheduledTime) - timeToMinutes(b.scheduledTime);
        if (timeDiff !== 0) return timeDiff;
        return (a.createdAt || 0) - (b.createdAt || 0);
      })
      .map((todo) => {
        const isActive = state.focusSession?.isActive && state.focusSession.taskId === todo.id;
        const durationMinutes = Math.round((todo.target || 1500) / 60);
        const elapsed = Math.max(todo.elapsed || 0, 0);
        const meta = todo.completed
          ? `Completed · ${durationMinutes} minute block`
          : isActive
            ? `${formatClockDuration(sessionRemainingSeconds)} remaining in this focus block`
            : `${durationMinutes} minute block`;

        return {
          id: todo.id,
          type: 'todo',
          className: `${isActive ? ' is-focus' : ''}${todo.completed ? ' is-done' : ''}`,
          time: todo.scheduledTime ? convertTime(todo.scheduledTime) : 'No time',
          minutes: timeToMinutes(todo.scheduledTime),
          title: todo.text,
          detail: todo.note || '',
          badge: todo.completed ? 'Done' : isActive ? 'In focus' : 'Planned',
          meta,
          actions: todo.completed
            ? [
                { type: 'toggle', label: '↺', title: 'Mark incomplete' },
                { type: 'delete', label: '×', title: 'Delete task' }
              ]
            : [
                { type: isActive ? 'stop' : 'start', label: isActive ? '■' : '▶', title: isActive ? 'Stop focus' : 'Start focus', className: 'play' },
                { type: 'toggle', label: '✓', title: 'Mark complete', className: 'complete' },
                { type: 'delete', label: '×', title: 'Delete task', className: 'delete' }
              ]
        };
      });

    const prayerItems = buildPrayerItemsForDate(selectedDate).map((item) => ({
      ...item,
      className: ' is-prayer'
    }));

    const items = [...todoItems, ...prayerItems].sort((a, b) => {
      const timeDiff = a.minutes - b.minutes;
      if (timeDiff !== 0) return timeDiff;
      if (a.type === b.type) return 0;
      return a.type === 'prayer' ? -1 : 1;
    });

    if (!items.length) {
      elements.timelineList.innerHTML = `
        <div class="timeline-empty">
          <strong>No timeline yet.</strong>
          <p>Pick a time, name the next activity, and start building a day you can trust.</p>
        </div>
      `;
      return;
    }

    elements.timelineList.innerHTML = items.map((item) => `
      <article class="timeline-item${item.className || ''}" data-type="${item.type}" data-id="${escapeHtml(item.id)}">
        <div class="timeline-time mono">${escapeHtml(item.time)}</div>
        <span class="timeline-dot" aria-hidden="true"></span>
        <div class="timeline-main">
          <div class="timeline-title-row">
            <span class="timeline-title">${escapeHtml(item.title)}</span>
            <span class="timeline-badge">${escapeHtml(item.badge)}</span>
          </div>
          <span class="timeline-meta">${escapeHtml(item.meta)}</span>
          ${item.detail ? `<span class="timeline-note">${escapeHtml(item.detail)}</span>` : ''}
        </div>
        <div class="timeline-actions">
          ${(item.actions || []).map((action) => `
            <button
              type="button"
              class="timeline-action ${escapeHtml(action.className || '')}"
              data-action="${escapeHtml(action.type)}"
              data-id="${escapeHtml(item.id)}"
              title="${escapeHtml(action.title)}"
            >${escapeHtml(action.label)}</button>
          `).join('')}
        </div>
      </article>
    `).join('');
  }

  function updateTimelineFocusCountdown() {
    if (!elements.timelineList || !state.focusSession?.isActive) return;

    const sessionTodo = getSessionTodo();
    if (!sessionTodo) return;

    const activeItem = [...elements.timelineList.querySelectorAll('.timeline-item[data-type="todo"]')]
      .find((item) => item.dataset.id === String(sessionTodo.id));
    const meta = activeItem?.querySelector('.timeline-meta');
    if (!meta) return;

    const remainingSeconds = Math.max(
      0,
      Math.floor((state.focusSession.duration - (Date.now() - state.focusSession.startTime)) / 1000)
    );
    meta.textContent = `${formatClockDuration(remainingSeconds)} remaining in this focus block`;
  }

  function renderTodoList() {
    if (!elements.todoQuadrantBoard) return;

    const quadrants = [
      {
        id: 'do-first',
        title: 'Do first',
        meta: 'Important and urgent'
      },
      {
        id: 'schedule',
        title: 'Schedule',
        meta: 'Important, not urgent'
      },
      {
        id: 'quick-wins',
        title: 'Quick wins',
        meta: 'Urgent, lighter impact'
      },
      {
        id: 'later',
        title: 'Later',
        meta: 'Low urgency'
      }
    ];

    const sortedTodos = [...state.todos].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    const openCount = sortedTodos.filter((todo) => !todo.completed).length;
    if (elements.todoListCount) {
      elements.todoListCount.textContent = `${openCount} open`;
    }

    if (!sortedTodos.length) {
      elements.todoQuadrantBoard.innerHTML = `
        <div class="todo-list-empty">
          No tasks yet. Add one small next action to get moving.
        </div>
      `;
      return;
    }

    const renderTodoCard = (todo) => {
      return `
        <article class="todo-list-card${todo.completed ? ' is-done' : ''}" data-todo-id="${escapeHtml(todo.id)}">
          <button type="button" class="todo-list-check" data-action="toggle" data-id="${escapeHtml(todo.id)}" title="${todo.completed ? 'Mark incomplete' : 'Mark complete'}">${todo.completed ? '✓' : ''}</button>
          <div class="todo-list-main">
            <span class="todo-list-title">${escapeHtml(todo.text)}</span>
            <span class="todo-list-meta">${todo.scheduledTime ? escapeHtml(convertTime(todo.scheduledTime)) : 'Unscheduled'}</span>
            <div class="todo-quadrant-actions" aria-label="Move task between quadrants">
              ${quadrants.map((quadrant) => `
                <button
                  type="button"
                  class="todo-quadrant-chip${todo.quadrant === quadrant.id ? ' is-active' : ''}"
                  data-action="quadrant"
                  data-id="${escapeHtml(todo.id)}"
                  data-quadrant="${escapeHtml(quadrant.id)}"
                  title="Move to ${escapeHtml(quadrant.title)}"
                >${escapeHtml(quadrant.title)}</button>
              `).join('')}
            </div>
          </div>
          <div class="todo-list-actions">
            ${todo.completed ? '' : `<button type="button" class="todo-list-action start" data-action="start" data-id="${escapeHtml(todo.id)}">Start</button>`}
            <button type="button" class="todo-list-action delete" data-action="delete" data-id="${escapeHtml(todo.id)}">Delete</button>
          </div>
        </article>
      `;
    };

    elements.todoQuadrantBoard.innerHTML = quadrants.map((quadrant) => {
      const quadrantTodos = sortedTodos.filter((todo) => todo.quadrant === quadrant.id);
      return `
        <section class="todo-quadrant todo-quadrant-${escapeHtml(quadrant.id)}">
          <div class="todo-quadrant-head">
            <div>
              <h3>${escapeHtml(quadrant.title)}</h3>
              <span>${escapeHtml(quadrant.meta)}</span>
            </div>
            <strong>${quadrantTodos.length}</strong>
          </div>
          <div class="todo-quadrant-list">
            ${quadrantTodos.length ? quadrantTodos.map(renderTodoCard).join('') : '<div class="todo-quadrant-empty">No tasks here.</div>'}
          </div>
        </section>
      `;
    }).join('');
  }

  function initTimelineInteractions() {
    if (elements.daySwitch) {
      elements.daySwitch.addEventListener('click', (event) => {
        const button = event.target.closest('.timeline-day-btn');
        if (!button) return;
        setSelectedDay(button.dataset.day || 'today');
      });
    }

    if (elements.addTodoBtn) {
      elements.addTodoBtn.addEventListener('click', addTodo);
    }

    if (elements.addTodoListBtn) {
      elements.addTodoListBtn.addEventListener('click', addListTodo);
    }

    if (elements.todoListInput) {
      elements.todoListInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          addListTodo();
        }
      });
    }

    if (elements.todoInput) {
      elements.todoInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          addTodo();
        }
      });
    }

    if (elements.todoTime) {
      elements.todoTime.value = nextQuarterHour();
    }

    if (elements.plannerTimePresets) {
      elements.plannerTimePresets.addEventListener('click', (event) => {
        const button = event.target.closest('.planner-chip');
        if (!button || !elements.todoTime) return;
        elements.todoTime.value = button.dataset.time || '';
        elements.plannerTimePresets.querySelectorAll('.planner-chip').forEach((chip) => {
          chip.classList.toggle('is-active', chip === button);
        });
      });
    }

    if (elements.durationPicker && elements.durationOptions) {
      elements.durationPicker.addEventListener('click', (event) => {
        event.stopPropagation();
        elements.durationPicker.classList.toggle('active');
        elements.durationOptions.classList.toggle('visible');
      });

      elements.durationPicker.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        event.stopPropagation();
        elements.durationPicker.classList.toggle('active');
        elements.durationOptions.classList.toggle('visible');
      });
    }

    elements.durationButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        state.selectedDuration = Number(button.dataset.min || 25);
        elements.durationButtons.forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        if (elements.currentDuration) elements.currentDuration.textContent = `${state.selectedDuration}m`;
        elements.durationPicker?.classList.remove('active');
        elements.durationOptions?.classList.remove('visible');
      });
    });

    document.addEventListener('click', (event) => {
      if (elements.durationPicker && elements.durationOptions && !elements.durationPicker.contains(event.target)) {
        elements.durationPicker.classList.remove('active');
        elements.durationOptions.classList.remove('visible');
      }
    });

    if (elements.timelineList) {
      elements.timelineList.addEventListener('click', (event) => {
        const button = event.target.closest('.timeline-action');
        if (!button) return;

        const todoId = Number(button.dataset.id);
        const action = button.dataset.action;

        if (action === 'start') startTodo(todoId);
        if (action === 'stop') stopFocus();
        if (action === 'toggle') toggleTodoComplete(todoId);
        if (action === 'delete') deleteTodo(todoId);
      });
    }

    if (elements.todoQuadrantBoard) {
      elements.todoQuadrantBoard.addEventListener('click', (event) => {
        const button = event.target.closest('[data-action][data-id]');
        if (!button) return;

        const todoId = Number(button.dataset.id);
        const action = button.dataset.action;

        if (action === 'start') startTodo(todoId);
        if (action === 'toggle') toggleTodoComplete(todoId);
        if (action === 'delete') deleteTodo(todoId);
        if (action === 'quadrant') updateTodoQuadrant(todoId, button.dataset.quadrant || 'do-first');
      });
    }

    if (elements.addHabitBtn) {
      elements.addHabitBtn.addEventListener('click', addHabit);
    }

    if (elements.habitInput) {
      elements.habitInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          addHabit();
        }
      });
    }

    if (elements.habitGrid) {
      elements.habitGrid.addEventListener('click', (event) => {
        const cell = event.target.closest('[data-habit-id][data-date-key]');
        if (cell) {
          toggleHabitLog(cell.dataset.habitId, cell.dataset.dateKey);
          return;
        }

        const removeButton = event.target.closest('[data-delete-habit]');
        if (removeButton) {
          deleteHabit(removeButton.dataset.deleteHabit);
        }
      });
    }

    if (elements.addSnippetBtn) {
      elements.addSnippetBtn.addEventListener('click', addSnippet);
    }

    if (elements.snippetLabelInput) {
      elements.snippetLabelInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          elements.snippetValueInput?.focus();
        }
      });
    }

    if (elements.snippetValueInput) {
      elements.snippetValueInput.addEventListener('keydown', (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
          event.preventDefault();
          addSnippet();
        }
      });
    }

    if (elements.snippetList) {
      elements.snippetList.addEventListener('click', (event) => {
        const copyButton = event.target.closest('[data-snippet-copy]');
        if (copyButton) {
          copySnippet(copyButton.dataset.snippetCopy);
          return;
        }

        const deleteButton = event.target.closest('[data-snippet-delete]');
        if (deleteButton) {
          deleteSnippet(deleteButton.dataset.snippetDelete);
        }
      });
    }

    if (elements.addQuickLinkBtn) {
      elements.addQuickLinkBtn.addEventListener('click', addQuickLink);
    }

    if (elements.quickLinkLabel) {
      elements.quickLinkLabel.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          elements.quickLinkUrl?.focus();
        }
      });
    }

    if (elements.quickLinkUrl) {
      elements.quickLinkUrl.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          addQuickLink();
        }
      });
    }

    if (elements.quickLinksList) {
      elements.quickLinksList.addEventListener('click', (event) => {
        const openBtn = event.target.closest('[data-link-open]');
        if (openBtn) {
          openQuickLink(openBtn.dataset.linkOpen);
          return;
        }

        const deleteBtn = event.target.closest('[data-link-delete]');
        if (deleteBtn) {
          deleteQuickLink(deleteBtn.dataset.linkDelete);
        }
      });
    }

    if (elements.openQuickLinks) {
      elements.openQuickLinks.addEventListener('click', () => openQuickLinksModal());
    }

    if (elements.closeQuickLinks) {
      elements.closeQuickLinks.addEventListener('click', () => closeQuickLinksModal());
    }

    if (elements.quickLinksModal) {
      elements.quickLinksModal.addEventListener('click', (event) => {
        if (event.target === elements.quickLinksModal) {
          closeQuickLinksModal();
        }
      });
    }

    if (elements.actionToastUndo) {
      elements.actionToastUndo.addEventListener('click', () => {
        const undoAction = state.undoAction;
        state.undoAction = null;
        if (undoAction) undoAction();
      });
    }

    document.addEventListener('keydown', (event) => {
      const target = event.target;
      const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;

      if (event.key === '/' && !isTyping) {
        event.preventDefault();
        setActiveNavItem('overview-section');
        elements.todoInput?.focus();
      }

      if (event.key === 'Escape') {
        closeJournalHistoryModal();
        closeQuickLinksModal();
        elements.musicDropdown?.classList.remove('visible');
        elements.durationOptions?.classList.remove('visible');
      }
    });
  }

  function getWeeklyData(dailyStats) {
    const today = new Date();
    const todayKey = today.toLocaleDateString('en-CA');
    const dayIndex = today.getDay();
    const diff = today.getDate() - dayIndex + (dayIndex === 0 ? -6 : 1);
    const monday = new Date(today);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return labels.map((label, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const key = date.toLocaleDateString('en-CA');
      return {
        day: label,
        key,
        minutes: dailyStats[key] || 0,
        isToday: key === todayKey
      };
    });
  }

  function renderHabits() {
    if (!elements.habitGrid) return;

    if (!state.habits.length) {
      elements.habitGrid.innerHTML = `
        <div class="habit-empty">
          Add your first habit, then click the day cells to log it.
        </div>
      `;
      if (elements.habitStreak) elements.habitStreak.textContent = '0 day streak';
      return;
    }

    const weeklyData = getWeeklyData({});

    const cells = [
      '<div class="habit-name">Habit</div>',
      ...weeklyData.map((day) => `<div class="habit-head">${day.day.charAt(0)}</div>`)
    ];

    state.habits.forEach((habit) => {
      const selectedDateKey = getModeDateKey(state.selectedDay);
      const selectedDone = Boolean(state.habitLogs[selectedDateKey]?.[habit.id]);
      const selectedLabel = getDateLabel(state.selectedDay);
      cells.push(`
        <div class="habit-name">
          <span class="habit-name-text">${escapeHtml(habit.name)}</span>
          <div class="habit-name-actions">
            <button
              type="button"
              class="habit-quick-toggle${selectedDone ? ' is-active' : ''}"
              data-habit-id="${escapeHtml(habit.id)}"
              data-date-key="${escapeHtml(selectedDateKey)}"
              title="Toggle for ${escapeHtml(selectedLabel.toLowerCase())}"
            >${escapeHtml(selectedLabel)}</button>
            <button
              type="button"
              class="habit-remove-btn"
              data-delete-habit="${escapeHtml(habit.id)}"
              title="Delete habit"
            >×</button>
          </div>
        </div>
      `);

      weeklyData.forEach((day) => {
        const done = Boolean(state.habitLogs[day.key]?.[habit.id]);
        const isSelected = day.key === selectedDateKey;
        cells.push(`
          <button
            type="button"
            class="habit-cell${done ? ' done' : ''}${isSelected ? ' selected-day' : ''}"
            data-habit-id="${escapeHtml(habit.id)}"
            data-date-key="${escapeHtml(day.key)}"
            title="Toggle ${escapeHtml(habit.name)} for ${escapeHtml(day.day)}"
          >${done ? '✓' : ''}</button>
        `);
      });
    });

    const streakKeys = Object.keys(state.habitLogs).sort().reverse();
    let streak = 0;
    for (const key of streakKeys) {
      if (Object.keys(state.habitLogs[key] || {}).length > 0) streak += 1;
      else break;
    }

    elements.habitGrid.innerHTML = cells.join('');
    if (elements.habitStreak) elements.habitStreak.textContent = `${streak} day streak`;
  }

  function maskSnippetValue(value) {
    if (value.length <= 8) return '•'.repeat(Math.max(4, value.length));
    return `${value.slice(0, 4)}${'•'.repeat(Math.min(18, Math.max(6, value.length - 8)))}${value.slice(-4)}`;
  }

  function renderSnippets() {
    if (!elements.snippetList) return;

    if (!state.snippets.length) {
      elements.snippetList.innerHTML = `
        <div class="snippet-empty">
          Save a snippet here for one-click copy later.
        </div>
      `;
      return;
    }

    elements.snippetList.innerHTML = state.snippets.map((snippet) => `
      <article class="snippet-card" data-snippet-id="${escapeHtml(snippet.id)}">
        <div class="snippet-card-main">
          <span class="snippet-card-label">${escapeHtml(snippet.label)}</span>
          <code class="snippet-card-value">${escapeHtml(maskSnippetValue(snippet.value))}</code>
        </div>
        <div class="snippet-card-actions">
          <button type="button" class="snippet-action copy" data-snippet-copy="${escapeHtml(snippet.id)}">Copy</button>
          <button type="button" class="snippet-action delete" data-snippet-delete="${escapeHtml(snippet.id)}">Delete</button>
        </div>
      </article>
    `).join('');
  }

  function renderQuickLinks() {
    if (!elements.quickLinksList) return;

    if (!state.quickLinks.length) {
      elements.quickLinksList.innerHTML = `<div class="snippet-empty">No links yet. Add up to 5 shortcuts.</div>`;
    } else {
      elements.quickLinksList.innerHTML = state.quickLinks.map((link) => `
        <article class="snippet-card">
          <div class="snippet-card-main">
            <span class="snippet-card-label">${escapeHtml(link.label)}</span>
            <code class="snippet-card-value">${escapeHtml(link.url)}</code>
          </div>
          <div class="snippet-card-actions">
            <button type="button" class="snippet-action copy" data-link-open="${escapeHtml(link.id)}">Open</button>
            <button type="button" class="snippet-action delete" data-link-delete="${escapeHtml(link.id)}">Delete</button>
          </div>
        </article>
      `).join('');
    }

    if (elements.addQuickLinkBtn) {
      const isFull = state.quickLinks.length >= 5;
      elements.addQuickLinkBtn.disabled = isFull;
      elements.addQuickLinkBtn.textContent = isFull ? 'Limit reached' : 'Save link';
    }
  }

  function renderWeeklyChart(dailyStats) {
    if (!elements.weeklyChart) return;

    const weeklyData = getWeeklyData(dailyStats);
    const maxMinutes = Math.max(...weeklyData.map((day) => day.minutes), 60);
    const totalMinutes = weeklyData.reduce((sum, day) => sum + day.minutes, 0);

    if (elements.weeklyWeekHours) {
      elements.weeklyWeekHours.textContent = `${(totalMinutes / 60).toFixed(1)}h`;
    }

    elements.weeklyChart.innerHTML = weeklyData.map((day) => {
      const height = Math.max(10, (day.minutes / maxMinutes) * 100);
      return `
        <div class="bar-wrapper">
          <div class="bar-track">
            <div class="bar${day.isToday ? ' today' : ''}" style="height:${height}%">
              <div class="bar-tooltip">${day.minutes}m</div>
            </div>
          </div>
          <div class="bar-label${day.isToday ? ' bar-label-today' : ''}">${day.day}</div>
        </div>
      `;
    }).join('');
  }

  function updateStats() {
    chrome.storage.local.get(['focusStats'], (result) => {
      const focusStats = result.focusStats || { daily: {}, totalMinutes: 0 };
      const todayMinutes = focusStats.daily[getDateKey()] || 0;
      state.currentTodayMinutes = todayMinutes;

      const dailyGoal = 240;
      const dailyPercent = Math.min((todayMinutes / dailyGoal) * 100, 100);
      const weeklyMinutes = getWeeklyData(focusStats.daily).reduce((sum, day) => sum + day.minutes, 0);
      const weeklyPercent = Math.min((weeklyMinutes / 900) * 100, 100);

      if (elements.focusMinutes) elements.focusMinutes.textContent = String(todayMinutes);
      if (elements.focusGoalPercent) elements.focusGoalPercent.textContent = String(Math.round(dailyPercent));
      if (elements.focusGoalInline) elements.focusGoalInline.textContent = `${Math.round(dailyPercent)}% of goal`;
      if (elements.focusProgressBar) elements.focusProgressBar.style.width = `${dailyPercent}%`;
      if (elements.weeklyProgressFill) elements.weeklyProgressFill.style.width = `${weeklyPercent}%`;

      renderHabits();
      renderWeeklyChart(focusStats.daily);
    });
  }

  function updatePrayerStatus() {
    if (!state.prayerData) return;

    const now = new Date();
    const todayKey = getDateKey();
    const todaySchedule = state.prayerData[todayKey];
    if (!todaySchedule) {
      if (elements.prayerCountdown) elements.prayerCountdown.textContent = '--';
      return;
    }

    const prayers = Object.entries(todaySchedule).map(([name, time]) => {
      const [hours, minutes] = time.split(':').map(Number);
      const date = new Date(now);
      date.setHours(hours, minutes, 0, 0);
      return { name, time, date };
    }).sort((a, b) => a.date - b.date);

    let nextPrayer = prayers.find((prayer) => prayer.date > now);
    if (!nextPrayer) {
      const tomorrowKey = getDateKey(1);
      const tomorrowSchedule = state.prayerData[tomorrowKey];
      if (tomorrowSchedule?.Fajr) {
        const [hours, minutes] = tomorrowSchedule.Fajr.split(':').map(Number);
        const date = new Date(now);
        date.setDate(date.getDate() + 1);
        date.setHours(hours, minutes, 0, 0);
        nextPrayer = { name: 'Fajr', time: tomorrowSchedule.Fajr, date };
      }
    }

    let previousPrayerTime = new Date(now);
    previousPrayerTime.setHours(0, 0, 0, 0);

    prayers.forEach((prayer) => {
      if (prayer.date <= now) previousPrayerTime = prayer.date;
    });

    if (!nextPrayer) {
      if (elements.nextPrayerName) elements.nextPrayerName.textContent = 'Prayer cycle complete';
      if (elements.prayerCountdown) elements.prayerCountdown.textContent = '--';
      if (elements.prayerProgressBar) elements.prayerProgressBar.style.width = '100%';
      return;
    }

    if (elements.nextPrayerName) elements.nextPrayerName.textContent = nextPrayer.name;

    const remainingSeconds = Math.max(0, Math.floor((nextPrayer.date - now) / 1000));
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;
    if (elements.prayerCountdown) {
      elements.prayerCountdown.textContent = `${hours}h ${minutes}m ${seconds}s`;
    }

    const intervalMs = nextPrayer.date.getTime() - previousPrayerTime.getTime();
    const elapsedMs = now.getTime() - previousPrayerTime.getTime();
    const percent = intervalMs > 0 ? Math.min((elapsedMs / intervalMs) * 100, 100) : 0;
    if (elements.prayerProgressBar) elements.prayerProgressBar.style.width = `${percent}%`;
  }

  function initPrayerSchedule() {
    fetch('prayers.json')
      .then((response) => response.json())
      .then((data) => {
        state.prayerData = data;
        updatePrayerStatus();
        renderTimeline();
      })
      .catch((error) => {
        console.warn('Prayer data unavailable', error);
      });
  }

  function loadTodos() {
    chrome.storage.local.get(['todos', 'focusSession'], (result) => {
      state.todos = (result.todos || []).map(normalizeTodo);
      state.focusSession = result.focusSession || null;
      renderCompatTodos();
      renderTimeline();
      renderTodoList();
    });
  }

  function loadHabits() {
    chrome.storage.local.get(['habitsConfig', 'habitLogs'], (result) => {
      state.habits = (result.habitsConfig || []).map(normalizeHabit).filter((habit) => habit.name);
      state.habitLogs = result.habitLogs || {};
      renderHabits();
    });
  }

  function loadSnippets() {
    chrome.storage.local.get(['snippetVault'], (result) => {
      state.snippets = (result.snippetVault || []).map(normalizeSnippet).filter((snippet) => snippet.label && snippet.value);
      renderSnippets();
    });
  }

  function loadQuickLinks() {
    chrome.storage.local.get(['quickLinks'], (result) => {
      state.quickLinks = (result.quickLinks || []).map(normalizeQuickLink).filter((link) => link.label && link.url).slice(0, 5);
      renderQuickLinks();
    });
  }

  function initMusic() {
    if (elements.musicPill && elements.musicDropdown) {
      elements.musicPill.addEventListener('click', (event) => {
        event.stopPropagation();
        elements.musicDropdown.classList.toggle('visible');
      });
    }

    document.querySelectorAll('.header-track-item').forEach((item) => {
      item.addEventListener('click', (event) => {
        event.stopPropagation();
        const index = Number(item.dataset.index || 0);
        chrome.runtime.sendMessage({ type: 'SET_TRACK', trackIndex: index });
        if (elements.trackName) elements.trackName.textContent = item.textContent || 'Soundtrack';
        elements.musicDropdown?.classList.remove('visible');
      });
    });

    document.addEventListener('click', () => {
      elements.musicDropdown?.classList.remove('visible');
    });
  }

  function initBlockedOverlay() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') !== 'blocked') return;

    const overlay = document.getElementById('blocked-overlay');
    const countdownEl = document.getElementById('countdown');
    const continueBtn = document.getElementById('continueAnyway');
    const backBtn = document.getElementById('goBack');
    const closeBtn = document.getElementById('close-overlay-btn');
    const reasonWrap = document.getElementById('reason-container');
    let countdown = 30;

    overlay?.classList.add('visible');

    const countdownTimer = setInterval(() => {
      countdown -= 1;
      if (countdownEl) countdownEl.textContent = String(countdown);
      if (countdown <= 0) {
        clearInterval(countdownTimer);
        if (continueBtn) continueBtn.disabled = false;
      }
    }, 1000);

    window.setTimeout(() => {
      if (reasonWrap) reasonWrap.style.display = 'block';
    }, 10000);

    backBtn?.addEventListener('click', () => window.history.back());
    continueBtn?.addEventListener('click', () => window.history.back());
    closeBtn?.addEventListener('click', () => {
      overlay?.classList.remove('visible');
      const url = new URL(window.location.href);
      url.searchParams.delete('mode');
      window.history.replaceState({}, '', url);
    });
  }

  function injectFloatingTimer() {
    if (document.getElementById('antigravity-focus-timer')) return;

    document.body.insertAdjacentHTML('beforeend', `
      <div id="antigravity-focus-timer">
        <div class="ag-timer-row">
          <div class="ag-timer-info">
            <div id="ag-timer-task" class="ag-task-text">Focusing...</div>
            <div id="ag-timer-countdown" class="ag-time-text">--:--</div>
            <div class="ag-progress-track">
              <div id="ag-timer-progress" class="ag-progress-fill"></div>
            </div>
          </div>
          <div class="ag-timer-actions">
            <button id="ag-music-btn" class="ag-btn" title="Playlist">🎵</button>
            <button id="ag-toggle-btn" class="ag-btn" title="Pause focus">⏸</button>
            <button id="ag-stop-btn" class="ag-btn ag-btn-stop" title="Stop focus">■</button>
            <button id="ag-timer-done" class="ag-btn ag-btn-done" title="Complete task">✓</button>
          </div>
        </div>
        <div id="ag-music-dropdown" class="ag-music-dropdown">
          <div class="ag-track-item" data-index="0">LoFi 1</div>
          <div class="ag-track-item" data-index="1">LoFi 2</div>
          <div class="ag-track-item" data-index="2">Zikr</div>
          <div class="ag-track-item" data-index="3">LoFi Quran</div>
        </div>
      </div>
      <style>
        #antigravity-focus-timer {
          position: fixed;
          right: 18px;
          bottom: 18px;
          z-index: 2500;
          display: none;
          width: 320px;
          padding: 16px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 22px;
          background: rgba(8, 8, 8, 0.96);
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          backdrop-filter: blur(12px);
          color: #f8fafc;
          font-family: 'Atkinson Hyperlegible', system-ui, sans-serif;
        }
        .ag-timer-row { display: flex; gap: 14px; align-items: center; justify-content: space-between; }
        .ag-timer-info { flex: 1; min-width: 0; }
        .ag-task-text { color: #94a3b8; font-size: 0.84rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ag-time-text { margin-top: 4px; font-size: 1.6rem; font-weight: 700; letter-spacing: -0.04em; }
        .ag-progress-track { width: 100%; height: 4px; margin-top: 8px; border-radius: 999px; overflow: hidden; background: rgba(255,255,255,0.08); }
        .ag-progress-fill { width: 0; height: 100%; background: linear-gradient(90deg, #10b981, #22d3ee); }
        .ag-timer-actions { display: flex; gap: 8px; }
        .ag-btn { width: 36px; height: 36px; border-radius: 12px; border: 0; background: rgba(255,255,255,0.05); color: #cbd5e1; cursor: pointer; }
        .ag-btn-stop { color: #fb7185; }
        .ag-btn-done { color: #34d399; }
        .ag-music-dropdown { display: none; margin-top: 12px; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; }
        .ag-music-dropdown.visible { display: block; }
        .ag-track-item { padding: 10px 12px; color: #cbd5e1; cursor: pointer; }
        .ag-track-item:hover { background: rgba(255,255,255,0.06); color: white; }
      </style>
    `);

    const timerWidget = document.getElementById('antigravity-focus-timer');
    const timerTask = document.getElementById('ag-timer-task');
    const timerCountdown = document.getElementById('ag-timer-countdown');
    const timerProgress = document.getElementById('ag-timer-progress');
    const musicBtn = document.getElementById('ag-music-btn');
    const musicDropdown = document.getElementById('ag-music-dropdown');

    document.getElementById('ag-toggle-btn')?.addEventListener('click', stopFocus);
    document.getElementById('ag-stop-btn')?.addEventListener('click', stopFocus);
    document.getElementById('ag-timer-done')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'COMPLETE_TASK' });
    });

    musicBtn?.addEventListener('click', (event) => {
      event.stopPropagation();
      musicDropdown?.classList.toggle('visible');
    });

    document.querySelectorAll('.ag-track-item').forEach((item) => {
      item.addEventListener('click', (event) => {
        event.stopPropagation();
        chrome.runtime.sendMessage({ type: 'SET_TRACK', trackIndex: Number(item.dataset.index || 0) });
        musicDropdown?.classList.remove('visible');
      });
    });

    document.addEventListener('click', (event) => {
      if (timerWidget && !timerWidget.contains(event.target)) {
        musicDropdown?.classList.remove('visible');
      }
    });

    function updateFloatingTimer() {
      const session = state.focusSession;
      if (!session?.isActive) {
        timerWidget.style.display = 'none';
        return;
      }

      const remainingMs = session.duration - (Date.now() - session.startTime);
      if (remainingMs <= 0) {
        timerWidget.style.display = 'none';
        return;
      }

      const totalSeconds = Math.floor(remainingMs / 1000);
      timerWidget.style.display = 'block';
      timerTask.textContent = session.task || 'Focus';
      timerCountdown.textContent = formatClockDuration(totalSeconds);

      const elapsedMs = Date.now() - session.startTime;
      const percent = session.duration > 0 ? Math.min((elapsedMs / session.duration) * 100, 100) : 0;
      timerProgress.style.width = `${percent}%`;
    }

    updateFloatingTimer();
    setInterval(updateFloatingTimer, 1000);
  }

  function initStorageListeners() {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.todos || changes.focusSession) {
        loadTodos();
      }
      if (changes.habitsConfig || changes.habitLogs) {
        loadHabits();
      }
      if (changes.snippetVault) {
        loadSnippets();
      }
      if (changes.quickLinks) {
        loadQuickLinks();
      }
      if (changes.focusStats) {
        updateStats();
      }
      if (changes.journalEntries) {
        state.journalEntries = changes.journalEntries.newValue || {};
        const journalDateKey = state.activeJournalDateKey || getDateKey();
        if (elements.journalInput) {
          elements.journalInput.value = state.journalEntries[journalDateKey] || '';
        }
        const selectedDate = elements.journalHistoryDate?.value || journalDateKey;
        renderJournalHistory(selectedDate);
      }
      if (changes.stickyNotes && elements.journalInput) {
        const updated = changes.stickyNotes.newValue || {};
        Object.entries(elements.stickyInputs).forEach(([key, input]) => {
          if (input) input.value = updated[key] || '';
        });
      }
    });
  }

  initJournal();
  initTimelineInteractions();
  initSideNavigation();
  initMusic();
  initPrayerSchedule();
  initBlockedOverlay();
  injectFloatingTimer();
  initStorageListeners();
  loadTodos();
  loadHabits();
  loadSnippets();
  loadQuickLinks();
  updateStats();
  setSelectedDay('today');
  updateClock();
  updatePrayerStatus();

  setInterval(updateClock, 1000);
  setInterval(checkJournalDateRollover, 60 * 1000);
  setInterval(updatePrayerStatus, 1000);
  setInterval(updateTimelineFocusCountdown, 1000);
});
