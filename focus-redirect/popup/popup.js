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
});
