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
    statusText.textContent = enableToggle.checked ? 'Enabled' : 'Disabled';
    
    const sites = result.bannedSites || [];
    renderSitesList(sites);
    
    const stats = result.redirectStats || {};
    redirectCount.textContent = stats.total || 0;
  });
  
  // Toggle extension on/off
  enableToggle.addEventListener('change', () => {
    const isEnabled = enableToggle.checked;
    statusText.textContent = isEnabled ? 'Enabled' : 'Disabled';
    chrome.storage.local.set({ isEnabled });
  });
  
  // Add new site to banned list
  addSiteButton.addEventListener('click', addNewSite);
  newSiteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addNewSite();
    }
  });
  
  function addNewSite() {
    const site = newSiteInput.value.trim().toLowerCase();
    if (!site) return;
    
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
      sitesList.innerHTML = '<p class="empty-list">No sites added yet</p>';
      return;
    }
    
    sites.forEach(site => {
      const siteElement = document.createElement('div');
      siteElement.className = 'site-item';
      
      const siteText = document.createElement('span');
      siteText.textContent = site;
      
      const removeButton = document.createElement('button');
      removeButton.textContent = '×';
      removeButton.className = 'remove-site';
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
