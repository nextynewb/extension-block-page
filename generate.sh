#!/bin/bash

# focus-redirect-generator.sh
# Script to generate a complete browser extension for redirecting distracting websites

# Create project directory
echo "Creating project structure..."
mkdir -p focus-redirect/popup
mkdir -p focus-redirect/inspiration
mkdir -p focus-redirect/icons

# Navigate to project directory
cd focus-redirect

# Create manifest.json
echo "Creating manifest.json..."
cat > manifest.json << 'EOF'
{
  "manifest_version": 3,
  "name": "Focus Redirect",
  "version": "1.0",
  "description": "Redirects distracting websites to an inspirational page",
  "permissions": ["storage", "webRequest", "webNavigation", "tabs"],
  "host_permissions": ["<all_urls>"],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "background": {
    "service_worker": "background.js"
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
EOF

# Create background.js
echo "Creating background.js..."
cat > background.js << 'EOF'
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
EOF

# Create popup.html
echo "Creating popup.html..."
cat > popup/popup.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="container">
    <h1>Focus Redirect</h1>
    
    <div class="toggle-container">
      <label class="switch">
        <input type="checkbox" id="enableToggle">
        <span class="slider round"></span>
      </label>
      <span id="statusText">Enabled</span>
    </div>
    
    <div class="site-list">
      <h2>Banned Websites</h2>
      <div id="sitesList"></div>
      
      <div class="add-site">
        <input type="text" id="newSite" placeholder="e.g., facebook.com">
        <button id="addSite">Add</button>
      </div>
    </div>
    
    <div class="stats">
      <h2>Statistics</h2>
      <p>Redirects today: <span id="redirectCount">0</span></p>
    </div>
  </div>
  
  <script src="popup.js"></script>
</body>
</html>
EOF

# Create popup.css
echo "Creating popup.css..."
cat > popup/popup.css << 'EOF'
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  width: 300px;
  margin: 0;
  padding: 15px;
}

.container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

h1 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

h2 {
  margin: 0;
  font-size: 16px;
  color: #555;
}

.toggle-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Toggle switch styling */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

/* Site list styling */
.site-list {
  margin-top: 10px;
}

.site-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.remove-site {
  background: none;
  border: none;
  color: #f44336;
  font-size: 18px;
  cursor: pointer;
}

.add-site {
  display: flex;
  margin-top: 10px;
  gap: 5px;
}

.add-site input {
  flex-grow: 1;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.add-site button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.empty-list {
  color: #999;
  font-style: italic;
}

.stats {
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}
EOF

# Create popup.js
echo "Creating popup.js..."
cat > popup/popup.js << 'EOF'
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
EOF

# Create inspiration.html
echo "Creating inspiration.html..."
cat > inspiration/inspiration.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>Take a Moment</title>
  <link rel="stylesheet" href="inspiration.css">
</head>
<body>
  <div class="container">
    <h1>Pause and Reflect</h1>
    
    <div class="quote-container">
      <blockquote id="quote">
        "The key is not to prioritize what's on your schedule, but to schedule your priorities."
      </blockquote>
      <cite id="author">Stephen Covey</cite>
    </div>
    
    <div class="message">
      <p>You were about to visit a site you're trying to avoid.</p>
      <p>Take a deep breath and consider what you really want to accomplish right now.</p>
    </div>
    
    <div class="alternatives">
      <h2>Instead, why not:</h2>
      <ul id="alternatives">
        <li>Work on your current priority task</li>
        <li>Take a 5-minute walk</li>
        <li>Drink some water</li>
        <li>Write down what you're feeling right now</li>
      </ul>
    </div>
    
    <div class="actions">
      <button id="goBack" class="primary-btn">Go Back</button>
      <div class="continue-container">
        <button id="continueAnyway" class="secondary-btn" disabled>
          Continue anyway (<span id="countdown">10</span>)
        </button>
      </div>
    </div>
  </div>
  
  <script src="inspiration.js"></script>
</body>
</html>
EOF

# Create inspiration.css
echo "Creating inspiration.css..."
cat > inspiration/inspiration.css << 'EOF'
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #f5f7fa;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  color: #333;
}

.container {
  max-width: 600px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  padding: 30px;
  text-align: center;
}

h1 {
  color: #2c3e50;
  margin-bottom: 20px;
}

.quote-container {
  margin: 30px 0;
  font-style: italic;
}

blockquote {
  font-size: 24px;
  line-height: 1.4;
  margin-bottom: 10px;
  color: #3498db;
}

cite {
  display: block;
  font-size: 16px;
  color: #7f8c8d;
}

.message {
  margin: 25px 0;
  line-height: 1.6;
}

.alternatives {
  margin: 25px 0;
  text-align: left;
}

.alternatives h2 {
  text-align: center;
  margin-bottom: 15px;
  color: #2c3e50;
}

.alternatives ul {
  padding-left: 20px;
}

.alternatives li {
  margin-bottom: 10px;
  line-height: 1.4;
}

.actions {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.primary-btn {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.primary-btn:hover {
  background-color: #2980b9;
}

.secondary-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.secondary-btn:hover:not([disabled]) {
  background-color: #c0392b;
}

.secondary-btn[disabled] {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.continue-container {
  margin-top: 10px;
}
EOF

# Create inspiration.js
echo "Creating inspiration.js..."
cat > inspiration/inspiration.js << 'EOF'
document.addEventListener('DOMContentLoaded', () => {
  const quoteElement = document.getElementById('quote');
  const authorElement = document.getElementById('author');
  const goBackButton = document.getElementById('goBack');
  const continueButton = document.getElementById('continueAnyway');
  const countdownElement = document.getElementById('countdown');
  const alternativesList = document.getElementById('alternatives');
  
  // Quotes database
  const quotes = [
    { text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.", author: "Stephen Covey" },
    { text: "You will never find time for anything. If you want time, you must make it.", author: "Charles Buxton" },
    { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
    { text: "It's not always that we need to do more but rather that we need to focus on less.", author: "Nathan W. Morris" },
    { text: "The difference between successful people and very successful people is that very successful people say 'no' to almost everything.", author: "Warren Buffett" },
    { text: "Time is what we want most, but what we use worst.", author: "William Penn" },
    { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
    { text: "The bad news is time flies. The good news is you're the pilot.", author: "Michael Altshuler" },
    { text: "Don't be fooled by the calendar. There are only as many days in the year as you make use of.", author: "Charles Richards" },
    { text: "Either you run the day or the day runs you.", author: "Jim Rohn" }
  ];
  
  // Alternative activities
  const alternatives = [
    "Work on your current priority task",
    "Take a 5-minute walk",
    "Drink some water",
    "Write down what you're feeling right now",
    "Do a quick stretching exercise",
    "Meditate for 2 minutes",
    "Read one page of a book",
    "Clean your desk",
    "Message someone you care about",
    "Review your goals for the day",
    "Practice deep breathing for 1 minute",
    "Write down three things you're grateful for",
    "Do 10 jumping jacks to get your blood flowing",
    "Listen to one inspiring song",
    "Look out the window and focus on nature"
  ];
  
  // Display random quote
  function showRandomQuote() {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];
    quoteElement.textContent = `"${quote.text}"`;
    authorElement.textContent = quote.author;
  }
  
  // Display random alternatives
  function showRandomAlternatives() {
    // Shuffle and take 4 random alternatives
    const shuffled = [...alternatives].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 4);
    
    alternativesList.innerHTML = '';
    selected.forEach(alt => {
      const li = document.createElement('li');
      li.textContent = alt;
      alternativesList.appendChild(li);
    });
  }
  
  // Start countdown for "Continue anyway" button
  let countdown = 10;
  function startCountdown() {
    countdownElement.textContent = countdown;
    
    const timer = setInterval(() => {
      countdown--;
      countdownElement.textContent = countdown;
      
      if (countdown <= 0) {
        clearInterval(timer);
        continueButton.disabled = false;
        continueButton.textContent = 'Continue anyway';
      }
    }, 1000);
  }
  
  // Go back to previous page
  goBackButton.addEventListener('click', () => {
    window.history.back();
  });
  
  // Continue to the blocked site
  continueButton.addEventListener('click', () => {
    if (!continueButton.disabled) {
      // Get the URL from storage
      chrome.storage.local.get('lastBlockedUrl', (result) => {
        if (result.lastBlockedUrl) {
          window.location.href = result.lastBlockedUrl;
        } else {
          window.history.back();
        }
      });
    }
  });
  
  // Initialize page
  showRandomQuote();
  showRandomAlternatives();
  startCountdown();
});
EOF

# Create placeholder icons
echo "Creating placeholder icons..."
# This is a simple way to create placeholder icons - in a real scenario you'd want actual icon files
echo "Please replace these with real icons" > icons/icon16.png
echo "Please replace these with real icons" > icons/icon48.png
echo "Please replace these with real icons" > icons/icon128.png

echo "Extension files generated successfully in the 'focus-redirect' directory!"
echo "To use this extension:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode'"
echo "3. Click 'Load unpacked' and select the 'focus-redirect' folder"
echo ""
echo "Note: You'll need to replace the placeholder icon files with real PNG images."
