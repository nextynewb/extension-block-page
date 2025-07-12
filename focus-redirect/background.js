let isEnabled = true;
let bannedSites = [];

// Load settings from storage
chrome.storage.local.get(['isEnabled', 'bannedSites'], (result) => {
  isEnabled = result.isEnabled !== undefined ? result.isEnabled : true;
  bannedSites = result.bannedSites || [];
});

// Listen for changes to settings
chrome.storage.onChanged.addListener((changes) => {
  if (changes.isEnabled) {
    isEnabled = changes.isEnabled.newValue;
  }
  if (changes.bannedSites) {
    bannedSites = changes.bannedSites.newValue;
  }
});

// Listen for web navigation events
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  // Only process main frame navigation (not iframes, etc)
  if (details.frameId !== 0) return;
  
  if (!isEnabled) return;
  
  const url = new URL(details.url);
  const domain = url.hostname.replace('www.', '');
  
  if (bannedSites.some(site => domain.includes(site))) {
    // Store the URL that was blocked
    chrome.storage.local.set({ lastBlockedUrl: details.url });
    
    // Track redirect for statistics
    incrementRedirectCount(domain);
    
    // Redirect to inspiration page
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL('inspiration/inspiration.html')
    });
  }
});

// Function to track redirect statistics
function incrementRedirectCount(domain) {
  chrome.storage.local.get('redirectStats', (result) => {
    const stats = result.redirectStats || {};
    stats[domain] = (stats[domain] || 0) + 1;
    stats.total = (stats.total || 0) + 1;
    
    chrome.storage.local.set({ redirectStats: stats });
  });
}
