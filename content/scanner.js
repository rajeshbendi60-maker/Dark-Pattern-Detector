// Advanced Scanner with Auto-Fix Defense, Firebase, and AI Engine

const DARK_PATTERNS = {
  PRE_CHECKED: 'Sneaky Pre-checked Box',
  CONFIRMSHAMING: 'Manipulative Text',
  HIDDEN_BUTTON: 'Hidden/Obscured Button',
  FAKE_SCARCITY: 'Fake Urgency/Scarcity',
  AI_DETECTED: 'AI Intelligence Warning'
};

const confirmshamingRegex = /(No thanks.*pay full price|I hate saving money|I prefer to lose|I don\'t want free)/i;
const scarcityRegex = /(only \d+ left in stock|hurry|almost gone|\d+ people are viewing|offer ends in \d+|limited time offer)/i;

let detectedIssues = new Map();
let userSettings = {
  checkPreChecked: true, checkConfirmshaming: true, checkScarcity: true, checkHidden: true,
  autoFix: false, whitelist: [], aiKey: ''
};
let isWhitelisted = false;
let aiScanned = false;

// Feature 8: AI-Powered Detection Engine
async function runAIScan(customText = null) {
  if (!userSettings.aiKey) return;
  if (!customText && aiScanned) return; // Only block duplicate full-page scans
  if (!customText) aiScanned = true;
  
  const pageText = customText || document.body.innerText.substring(0, 1500);
  if (pageText.length < 10) return;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${userSettings.aiKey}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        contents: [{ parts: [{ text: `You are an expert dark pattern detector. Analyze the following webpage text. Does it contain psychological manipulation, fake urgency, guilt-tripping, or confirmshaming? Reply strictly with the word "YES" or "NO" and nothing else. Text: ${pageText}` }] }]
      })
    });
    
    const data = await response.json();
    
    // If the API fails (e.g. Rate Limit / Quota Exceeded), fail gracefully without blocking the screen
    if (data.error) {
      console.warn("Dark Pattern AI Scanner paused:", data.error.message);
      return;
    }

    const reply = data.candidates[0].content.parts[0].text.trim().toUpperCase();
    
    if (reply.includes('YES')) {
       let target = document.body;
       
       // If triggered via Right-Click, try to highlight the exact element that contains the text
       if (customText) {
         const searchSnippet = customText.substring(0, 30).trim();
         target = Array.from(document.querySelectorAll('*')).find(el => 
           el.children.length === 0 && el.textContent.includes(searchSnippet)
         ) || document.body;
       }
       
       addIssue(target, DARK_PATTERNS.AI_DETECTED, 'Our Gemini AI model analyzed the context and found manipulative psychological tactics.');
    }
  } catch (e) {
    console.warn("Dark Pattern AI Scan Network Error:", e.message);
  }
}

function scanElement(el) {
  if (el.nodeType !== Node.ELEMENT_NODE) return;

  if (userSettings.checkPreChecked && el.tagName === 'INPUT' && el.type === 'checkbox' && el.checked) {
    const label = (el.parentElement ? el.parentElement.textContent.toLowerCase() : '');
    if (label.includes('subscribe') || label.includes('newsletter') || label.includes('agree')) {
      if (userSettings.autoFix) {
        el.checked = false; 
        el.style.outline = "2px solid #2ecc71";
        addIssue(el, DARK_PATTERNS.PRE_CHECKED, 'A checkbox was pre-selected, but Auto-Fix successfully unchecked it for you!');
      } else {
        addIssue(el, DARK_PATTERNS.PRE_CHECKED, 'A checkbox was pre-selected to opt you in by default.');
      }
    }
  }

  if (['A', 'BUTTON', 'SPAN', 'DIV', 'P', 'H1', 'H2', 'H3', 'H4'].includes(el.tagName)) {
    const text = el.textContent || ''; 
    if (text.length > 0 && text.length < 300) { 
      if (userSettings.checkConfirmshaming && confirmshamingRegex.test(text)) {
        const hasBadChild = Array.from(el.querySelectorAll('*')).some(desc => confirmshamingRegex.test(desc.textContent || ''));
        if (!hasBadChild) addIssue(el, DARK_PATTERNS.CONFIRMSHAMING, `Manipulative wording found: "${text.trim().substring(0,30)}..."`);
      } else if (userSettings.checkScarcity && scarcityRegex.test(text)) {
        const hasBadChild = Array.from(el.querySelectorAll('*')).some(desc => scarcityRegex.test(desc.textContent || ''));
        if (!hasBadChild) addIssue(el, DARK_PATTERNS.FAKE_SCARCITY, `High-pressure sales tactic detected: "${text.trim().substring(0,30)}..."`);
      }
    }
  }

  if (userSettings.checkHidden && (el.tagName === 'A' || el.tagName === 'BUTTON')) {
    const text = (el.textContent || '').toLowerCase();
    if (text.includes('cancel') || text.includes('unsubscribe')) {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const isTiny = (rect.width > 0 && rect.width < 20) || (rect.height > 0 && rect.height < 10) || parseInt(style.fontSize) < 10;
      const isTransparent = style.opacity !== '' && parseFloat(style.opacity) < 0.4 || style.color === style.backgroundColor;
      
      if (isTiny || isTransparent) {
        if (userSettings.autoFix) {
          el.style.opacity = '1'; el.style.color = '#fff'; el.style.backgroundColor = '#e74c3c';
          el.style.fontSize = '16px'; el.style.padding = '10px'; el.style.display = 'inline-block';
          el.style.border = '2px solid #c0392b';
          addIssue(el, DARK_PATTERNS.HIDDEN_BUTTON, 'A cancel button was hidden, but Auto-Fix forced it to become visible!');
        } else {
          if (style.display === 'none') el.style.display = 'block';
          addIssue(el, DARK_PATTERNS.HIDDEN_BUTTON, 'A cancellation option is being intentionally obscured or made tiny.');
        }
      }
    }
  }
}

function addIssue(element, type, description) {
  if (element.hasAttribute('data-dp-scanned')) return;
  element.setAttribute('data-dp-scanned', 'true');
  detectedIssues.set(element, { type, description });
  
  chrome.storage.local.get(['lifetimeBlocked', 'lifetimeHistory'], (result) => {
    const newTotal = (result.lifetimeBlocked || 0) + 1;
    const history = result.lifetimeHistory || [];
    
    const currentDomain = window.location.hostname || 'Local HTML File';
    const pageTitle = document.title || currentDomain;
    
    // Add new log to the beginning (max 50 items to save memory)
    history.unshift({
      type: type,
      description: description,
      url: currentDomain,
      title: pageTitle,
      date: new Date().toLocaleDateString()
    });
    if (history.length > 50) history.pop();

    chrome.storage.local.set({ 
      lifetimeBlocked: newTotal,
      lifetimeHistory: history
    });
  });
  
  element.style.boxShadow = '0 0 0 4px rgba(231, 76, 60, 0.6)';
  element.style.borderRadius = '4px';
  element.style.transition = 'box-shadow 0.3s ease-in-out';
  injectAnimation();
  element.style.animation = 'dpPulse 2s infinite';
  element.title = `Detected Dark Pattern: ${type}`;
  notifyBackground();
}

let animationInjected = false;
function injectAnimation() {
  if (animationInjected) return;
  const style = document.createElement('style');
  style.innerHTML = `@keyframes dpPulse { 0% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(231, 76, 60, 0); } 100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0); } }`;
  document.head.appendChild(style);
  animationInjected = true;
}

function notifyBackground() {
  const issuesArray = Array.from(detectedIssues.values());
  chrome.runtime.sendMessage({ type: 'DARK_PATTERNS_DETECTED', count: issuesArray.length, issues: issuesArray });
}

function scanWholePage() {
  if (isWhitelisted) return;
  document.querySelectorAll('*').forEach(scanElement);
}

const observer = new MutationObserver((mutations) => {
  if (isWhitelisted) return;
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        scanElement(node);
        node.querySelectorAll('*').forEach(scanElement);
      }
    });
  });
});

function initScanner() {
  scanWholePage();
  if (!isWhitelisted) {
    observer.observe(document.body, { childList: true, subtree: true });
    // AI Scan is intentionally removed from here. 
    // It now only runs on-demand when the user opens the Sidebar to save API Quota!
  }
}

chrome.storage.sync.get({
  checkPreChecked: true, checkConfirmshaming: true, checkScarcity: true, checkHidden: true,
  autoFix: false, whitelist: [], aiKey: ''
}, (items) => {
  userSettings = items;
  isWhitelisted = items.whitelist.includes(window.location.hostname);
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScanner);
  } else {
    initScanner(); 
  }
});

function clearIssues() {
  detectedIssues.forEach((value, element) => {
    element.removeAttribute('data-dp-scanned');
    element.style.boxShadow = '';
    element.style.animation = '';
    element.title = '';
  });
  detectedIssues.clear();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getIssues') {
    sendResponse({ issues: Array.from(detectedIssues.values()), whitelisted: isWhitelisted });
  } else if (request.action === 'forceRescan') {
    clearIssues();
    chrome.storage.sync.get({
      checkPreChecked: true, checkConfirmshaming: true, checkScarcity: true, checkHidden: true,
      autoFix: false, whitelist: [], aiKey: ''
    }, (items) => {
      const oldKey = userSettings.aiKey;
      userSettings = items;
      isWhitelisted = items.whitelist.includes(window.location.hostname);
      scanWholePage();
      sendResponse({ issues: Array.from(detectedIssues.values()), whitelisted: isWhitelisted });

      // If they just pasted a new AI key, instantly trigger the AI scan in the background!
      if (userSettings.aiKey && userSettings.aiKey !== oldKey) {
        aiScanned = false;
        runAIScan();
      }
    });
  } else if (request.action === 'context_menu_scan') {
    // 1. Tell background.js to light up the badge and open the sidebar!
    chrome.runtime.sendMessage({ type: 'DARK_PATTERNS_DETECTED', count: detectedIssues.size + 1 }); 
    chrome.runtime.sendMessage({ action: 'hotkey_triggered' }); // Re-use the hotkey relay to force open the sidebar!
    
    // 2. Scan the highlighted text!
    runAIScan(request.text);
  } else if (request.action === 'toggleSider') {
    // When the user opens the Sidebar (shortcut or icon), run the AI scan!
    if (!isWhitelisted) runAIScan();
  }
});
