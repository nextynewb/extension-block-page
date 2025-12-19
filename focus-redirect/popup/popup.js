document.addEventListener('DOMContentLoaded', () => {
  const enableToggle = document.getElementById('enableToggle');
  const statusText = document.getElementById('statusText');
  const sitesList = document.getElementById('sitesList');
  const newSiteInput = document.getElementById('newSite');
  const addSiteButton = document.getElementById('addSite');
  const redirectCount = document.getElementById('redirectCount');

  // Load current settings
  chrome.storage.local.get(['isEnabled', 'bannedSites', 'redirectStats'], (result) => {
    enableToggle.checked = result.isEnabled !== undefined ? result.isEnabled : true;
    updateStatusText(enableToggle.checked);

    const sites = result.bannedSites || [];
    renderSitesList(sites);

    const stats = result.redirectStats || {};
    redirectCount.textContent = stats.total || 0;
  });

  // Toggle extension on/off
  enableToggle.addEventListener('change', () => {
    const isEnabled = enableToggle.checked;
    updateStatusText(isEnabled);
    chrome.storage.local.set({ isEnabled });
  });

  function updateStatusText(isEnabled) {
    statusText.textContent = isEnabled ? 'Focus Mode Active' : 'Focus Mode Paused';
    statusText.style.color = isEnabled ? 'var(--color-text)' : 'var(--color-text-muted)';
  }

  // Add new site to banned list
  addSiteButton.addEventListener('click', addNewSite);
  newSiteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addNewSite();
    }
  });

  function addNewSite() {
    let site = newSiteInput.value.trim().toLowerCase();
    if (!site) return;

    // Remove http/https and www if present to store cleaner domain
    site = site.replace(/^(https?:\/\/)?(www\.)?/, '');
    // Remove path if present
    site = site.split('/')[0];

    chrome.storage.local.get('bannedSites', (result) => {
      const sites = result.bannedSites || [];
      if (!sites.includes(site)) {
        sites.push(site);
        chrome.storage.local.set({ bannedSites: sites });
        renderSitesList(sites);
        newSiteInput.value = '';
      }
    });
  }

  // Render the list of banned sites
  function renderSitesList(sites) {
    sitesList.innerHTML = '';

    if (sites.length === 0) {
      sitesList.innerHTML = '<p class="empty-list">No distractions blocked yet.<br>Add a site to start focusing.</p>';
      return;
    }

    sites.forEach(site => {
      const siteElement = document.createElement('div');
      siteElement.className = 'site-item';

      const siteText = document.createElement('span');
      siteText.textContent = site;

      const removeButton = document.createElement('button');
      removeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      removeButton.className = 'remove-site';
      removeButton.title = "Remove " + site;
      removeButton.addEventListener('click', () => {
        chrome.storage.local.get('bannedSites', (result) => {
          const updatedSites = result.bannedSites.filter(s => s !== site);
          chrome.storage.local.set({ bannedSites: updatedSites });
          renderSitesList(updatedSites);
        });
      });

      siteElement.appendChild(siteText);
      siteElement.appendChild(removeButton);
      sitesList.appendChild(siteElement);
    });
  }
  // --- MUSIC PLAYER LOGIC ---
  const toggleMusicBtn = document.getElementById('toggleMusic');
  const prevTrackBtn = document.getElementById('prevTrack');
  const nextTrackBtn = document.getElementById('nextTrack');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  const currentTrackEl = document.getElementById('currentTrack');

  let isPlaying = false;
  // TODO: Fetch tracks list from background or audio.js to stay in sync
  const tracks = ['LoFi 1', 'LoFi 2', 'Zikr', 'LoFi Quran'];
  let currentTrackIndex = 0;

  // Initialize music state
  chrome.storage.local.get(['currentTrackIndex'], (result) => {
    if (result.currentTrackIndex !== undefined) {
      currentTrackIndex = result.currentTrackIndex;
      updateTrackName();
    }
  });

  // Check actual playback state from background
  // Ideally, we ask background, but for now we settle for optimistic UI or a message ping
  // Let's optimistic UI for now, or just default to paused until user interacts
  // The audio.js sends PLAYBACK_STATE, let's listen for it
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'PLAYBACK_STATE') {
      isPlaying = msg.isPlaying;
      updatePlayIcon();
    } else if (msg.type === 'TRACK_CHANGED') {
      // Update track name if it comes from auto-next
      const name = msg.trackName;
      // Simple mapping or just display raw
      currentTrackEl.textContent = name;
    }
  });

  toggleMusicBtn.addEventListener('click', () => {
    if (isPlaying) {
      chrome.runtime.sendMessage({ type: 'STOP_MUSIC' });
      isPlaying = false;
    } else {
      chrome.runtime.sendMessage({ type: 'MANUAL_PLAY_MUSIC' });
      // We will receive PLAYBACK_STATE=true shortly if successful
      // But let's optimistic update to feel responsive
      isPlaying = true;
    }
    updatePlayIcon();
  });

  nextTrackBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'NEXT_TRACK' });
    // We rely on TRACK_CHANGED message or storage update
    currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
    updateTrackName();
  });

  prevTrackBtn.addEventListener('click', () => {
    // Logic for prev track isn't in audio.js yet (only next), 
    // so let's just do next for now or implement setTrack
    // Let's implement pseudo-prev locally
    currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    chrome.runtime.sendMessage({ type: 'SET_TRACK', trackIndex: currentTrackIndex });
    updateTrackName();
  });

  function updatePlayIcon() {
    if (isPlaying) {
      playIcon.classList.add('hidden');
      pauseIcon.classList.remove('hidden');
    } else {
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
    }
  }

  function updateTrackName() {
    // Just a placeholder until we get real data
    currentTrackEl.textContent = tracks[currentTrackIndex];
  }
});
