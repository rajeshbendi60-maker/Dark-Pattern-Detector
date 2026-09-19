// Advanced Scanner with Auto-Fix Defense, Firebase, and AI Engine

const DARK_PATTERNS = {
  PRE_CHECKED: 'Sneaky Pre-checked Box',
  CONFIRMSHAMING: 'Manipulative Text',
  HIDDEN_BUTTON: 'Hidden/Obscured Button',
  FAKE_SCARCITY: 'Fake Urgency/Scarcity',
  AI_DETECTED: 'AI Intelligence Warning',
  COOKIE_BANNER: 'Cookie Banner',
  HIDDEN_FEE: 'Hidden Fee Detected',
  SUBSCRIPTION_TRAP: 'Subscription Trap',
  COMMUNITY_WARNING: 'Community Threat Warning',
  FAKE_REVIEW: 'Fake Review Detected',
  POPUP_BLOCKER: 'Deceptive Pop-up Blocked',
  PRIVACY_SUMMARY: 'Privacy Policy Analysis',
  REVIEW_SUMMARY: 'Honest Review Summary',
  FAKE_TIMER: 'Fake Countdown Loop',
  ROACH_MOTEL: 'Roach Motel Escaped',
  TRICK_CHECKBOX: 'Trick Question Translated',
  BAIT_SWITCH: 'Bait & Switch Discount'
};

const confirmshamingRegex = /(No thanks.*pay full price|I hate saving money|I prefer to lose|I don\'t want free)/i;
const scarcityRegex = /(only \d+ left|almost gone|high demand|selling fast|Ends in \d+)/i;
const subTrapRegex = /(auto-renew|free trial.*then)/i;

let detectedIssues = new Map();
let userSettings = {
  checkPreChecked: true, checkConfirmshaming: true, checkScarcity: true, checkHidden: true,
  autoFix: false, whitelist: [], aiKey: '', firebaseId: '',
  autoRejectCookies: true, trackHiddenFees: true, highlightSubTraps: true, communityWarnings: true,
  blockPopups: true, cloudSync: false,
  detectFakeTimers: true, autoScrollTnC: true, autoClickShaming: true, voiceAssistant: true
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

async function runFakeReviewScan(customText) {
  if (!userSettings.aiKey || !customText) return;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${userSettings.aiKey}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        contents: [{ parts: [{ text: `You are an expert at detecting fake, bot-generated, or incentivized e-commerce reviews. Analyze this review and state if it seems fake or genuine, and briefly explain why. Review: ${customText}` }] }]
      })
    });
    const data = await response.json();
    if (data.error) return;
    
    const reply = data.candidates[0].content.parts[0].text.trim();
    
    const searchSnippet = customText.substring(0, 30).trim();
    const target = Array.from(document.querySelectorAll('*')).find(el => 
      el.children.length === 0 && el.textContent.includes(searchSnippet)
    ) || document.body;
    
    addIssue(target, DARK_PATTERNS.FAKE_REVIEW, reply);
  } catch (e) {
    console.warn("Fake Review Scan Network Error:", e.message);
  }
}

async function runPrivacyPolicyScan(policyText) {
  if (!userSettings.aiKey || !policyText) return;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${userSettings.aiKey}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Summarize this Privacy Policy in 3 bullet points focusing on: what data they sell, how they track you, and anonymity. Keep it very short. Policy: ${policyText}` }] }]
      })
    });
    const data = await response.json();
    if (data.error) return;
    const reply = data.candidates[0].content.parts[0].text.trim();
    addIssue(document.body, DARK_PATTERNS.PRIVACY_SUMMARY, reply);
  } catch (e) {
    console.warn("Privacy Scan Error:", e.message);
  }
}

async function runReviewSummaryScan() {
  if (!userSettings.aiKey) return;
  const reviewNodes = Array.from(document.querySelectorAll('[class*="review"], [id*="review"]'));
  const allText = reviewNodes.map(el => el.textContent).join(' ').replace(/\s+/g, ' ').substring(0, 15000);
  if (allText.length < 50) return;
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${userSettings.aiKey}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Summarize the pros and cons of this product based on these reviews. Also mention if they seem artificially generated. Keep it concise. Reviews: ${allText}` }] }]
      })
    });
    const data = await response.json();
    if (data.error) return;
    const reply = data.candidates[0].content.parts[0].text.trim();
    addIssue(document.body, DARK_PATTERNS.REVIEW_SUMMARY, reply);
  } catch (e) {
    console.warn("Review Summary Error:", e.message);
  }
}

async function runRoachMotelEscape() {
  if (!userSettings.aiKey) return;
  const links = Array.from(document.querySelectorAll('a, button')).map((el, i) => `[${i}] ${el.textContent.trim().substring(0, 50)}`);
  const allText = links.join(' | ').replace(/\s+/g, ' ').substring(0, 15000);
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${userSettings.aiKey}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        contents: [{ parts: [{ text: `I am trying to cancel my subscription or delete my account. Based on these link and button texts, reply ONLY with the exact integer index in the brackets (e.g. 14) of the most likely button to cancel/delete. If none, reply 'none'. Texts: ${allText}` }] }]
      })
    });
    const data = await response.json();
    if (data.error) return;
    const reply = data.candidates[0].content.parts[0].text.trim();
    if (reply !== 'none' && !isNaN(parseInt(reply))) {
      const target = document.querySelectorAll('a, button')[parseInt(reply)];
      if (target) {
        addIssue(target, DARK_PATTERNS.ROACH_MOTEL, 'AI found the hidden cancellation/delete link for you!');
        target.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
      }
    } else {
      addIssue(document.body, DARK_PATTERNS.ROACH_MOTEL, 'AI could not find any obvious cancellation links on this page.');
    }
  } catch (e) {
    console.warn("Roach Motel Error:", e.message);
  }
}

async function runTrickCheckboxScan(text) {
  if (!userSettings.aiKey || !text) return;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${userSettings.aiKey}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Translate this confusing double-negative checkbox label into plain English. Start your response with "Wait! Checking this means...". Text: ${text}` }] }]
      })
    });
    const data = await response.json();
    if (data.error) return;
    const reply = data.candidates[0].content.parts[0].text.trim();
    addIssue(document.body, DARK_PATTERNS.TRICK_CHECKBOX, reply);
  } catch (e) {
    console.warn("Trick Checkbox Error:", e.message);
  }
}

async function runBaitSwitchScan(text) {
  if (!userSettings.aiKey || !text) return;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${userSettings.aiKey}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        contents: [{ parts: [{ text: `I am looking at this product price/text. Is this a realistic discount or a fake 'Bait & Switch' price anchor? Keep it concise. Text: ${text}` }] }]
      })
    });
    const data = await response.json();
    if (data.error) return;
    const reply = data.candidates[0].content.parts[0].text.trim();
    addIssue(document.body, DARK_PATTERNS.BAIT_SWITCH, reply);
  } catch (e) {
    console.warn("Bait Switch Error:", e.message);
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
        if (!hasBadChild) {
          if (userSettings.autoClickShaming && (el.tagName === 'A' || el.tagName === 'BUTTON' || el.getAttribute('role') === 'button')) {
            if (!el.hasAttribute('data-dp-shame-clicked')) {
              el.setAttribute('data-dp-shame-clicked', 'true');
              el.click();
              el.style.display = 'none';
              addIssue(document.body, DARK_PATTERNS.CONFIRMSHAMING, `Auto-clicked and hid guilt-trip button: "${text.trim().substring(0,30)}..."`);
            }
          } else {
            addIssue(el, DARK_PATTERNS.CONFIRMSHAMING, `Manipulative wording found: "${text.trim().substring(0,30)}..."`);
          }
        }
      } else if (userSettings.checkScarcity && scarcityRegex.test(text)) {
        const hasBadChild = Array.from(el.querySelectorAll('*')).some(desc => scarcityRegex.test(desc.textContent || ''));
        if (!hasBadChild) addIssue(el, DARK_PATTERNS.FAKE_SCARCITY, `High-pressure sales tactic detected: "${text.trim().substring(0,30)}..."`);
      } else if (userSettings.highlightSubTraps && subTrapRegex.test(text)) {
        const hasBadChild = Array.from(el.querySelectorAll('*')).some(desc => subTrapRegex.test(desc.textContent || ''));
        if (!hasBadChild) {
          const style = window.getComputedStyle(el);
          if (parseInt(style.fontSize) < 14 || style.color === '#777' || parseFloat(style.opacity) < 0.7) {
            el.style.fontSize = '18px'; el.style.color = '#e74c3c'; el.style.fontWeight = 'bold';
            addIssue(el, DARK_PATTERNS.SUBSCRIPTION_TRAP, `Hidden subscription terms enlarged for visibility.`);
          }
        }
      }
    }
  }

  // Cookie Rejecter
  if (userSettings.autoRejectCookies && (el.tagName === 'BUTTON' || el.tagName === 'A')) {
    const text = (el.textContent || '').toLowerCase();
    if (text === 'reject all' || text === 'decline' || text === 'only essential cookies' || text === 'manage preferences') {
      if (!el.hasAttribute('data-dp-cookie-clicked')) {
        el.setAttribute('data-dp-cookie-clicked', 'true');
        el.click();
        addIssue(el, DARK_PATTERNS.COOKIE_BANNER, 'Auto-Reject Cookies triggered!');
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

  // T&C Auto-Scroller
  if (userSettings.autoScrollTnC && (el.tagName === 'DIV' || el.tagName === 'TEXTAREA' || el.tagName === 'IFRAME')) {
    const style = window.getComputedStyle(el);
    if ((style.overflowY === 'scroll' || style.overflowY === 'auto' || el.tagName === 'TEXTAREA') && el.scrollHeight > el.clientHeight + 20) {
      const text = (el.textContent || '').toLowerCase();
      if (text.includes('terms') || text.includes('conditions') || text.includes('agreement') || text.includes('policy')) {
        if (!el.hasAttribute('data-dp-scrolled')) {
          el.setAttribute('data-dp-scrolled', 'true');
          el.scrollTop = el.scrollHeight;
        }
      }
    }
  }

  // Deceptive Pop-up Blocker
  if (userSettings.blockPopups && (el.tagName === 'DIV' || el.tagName === 'ASIDE' || el.tagName === 'SECTION')) {
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed' && parseInt(style.zIndex) > 50) {
      const rect = el.getBoundingClientRect();
      const isLarge = rect.width > window.innerWidth * 0.4 && rect.height > window.innerHeight * 0.4;
      if (isLarge) {
        const text = (el.textContent || '').toLowerCase();
        if (text.includes('sign up') || text.includes('newsletter') || text.includes('10% off') || text.includes('don\'t leave')) {
          if (!el.hasAttribute('data-dp-popup-blocked')) {
            el.setAttribute('data-dp-popup-blocked', 'true');
            el.style.display = 'none';
            addIssue(document.body, DARK_PATTERNS.POPUP_BLOCKER, 'Aggressive pop-up overlay detected and automatically hidden.');
          }
        }
      }
    }
  }

  // Fake Countdown Detector
  if (userSettings.detectFakeTimers && (el.tagName === 'SPAN' || el.tagName === 'DIV' || el.tagName === 'P')) {
    const text = el.textContent.trim();
    if (/^(\d{1,2}:){1,2}\d{2}$/.test(text) && text !== '00:00' && text !== '0:00' && text !== '00:00:00') {
      const timerKey = 'dp_timer_' + location.pathname;
      const stored = sessionStorage.getItem(timerKey);
      if (stored) {
        if (text === stored && !el.hasAttribute('data-dp-timer-flagged')) {
          el.setAttribute('data-dp-timer-flagged', 'true');
          addIssue(el, DARK_PATTERNS.FAKE_TIMER, `This countdown reset to ${text} on page load. It is artificially creating urgency.`);
        }
      } else {
        sessionStorage.setItem(timerKey, text);
      }
    }
  }
}

function addIssue(element, type, description) {
  if (element.hasAttribute('data-dp-scanned')) return;
  element.setAttribute('data-dp-scanned', 'true');
  detectedIssues.set(element, { type, description });
  
  chrome.storage.local.get(['lifetimeBlocked', 'lifetimeHistory', 'userId'], (result) => {
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

    if (userSettings.cloudSync && userSettings.firebaseId && result.userId) {
      const configToSync = { ...userSettings, lifetimeBlocked: newTotal };
      fetch(`https://firestore.googleapis.com/v1/projects/${userSettings.firebaseId}/databases/(default)/documents/user_settings/${result.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { config: { stringValue: JSON.stringify(configToSync) } } })
      }).catch(e => console.warn('Leaderboard sync error:', e));
    }
  });
  
  element.style.boxShadow = '0 0 0 4px rgba(231, 76, 60, 0.6)';
  element.style.borderRadius = '4px';
  element.style.transition = 'box-shadow 0.3s ease-in-out';
  injectAnimation();
  element.style.animation = 'dpPulse 2s infinite';
  element.title = `Detected Dark Pattern: ${type}`;
  notifyBackground();

  if (userSettings.voiceAssistant && 'speechSynthesis' in window) {
    // Debounce speech slightly so it doesn't overlap crazy fast
    const msg = new SpeechSynthesisUtterance(`Warning: ${type}`);
    window.speechSynthesis.speak(msg);
  }
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
  try {
    chrome.runtime.sendMessage({ type: 'DARK_PATTERNS_DETECTED', count: issuesArray.length, issues: issuesArray }).catch(() => {});
  } catch(e) {}
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

let maxPriceSeen = 0;
function initCheckoutTracker() {
  if (!userSettings.trackHiddenFees) return;
  setInterval(() => {
    if (isWhitelisted || !userSettings.trackHiddenFees) return;
    const priceElements = Array.from(document.querySelectorAll('*')).filter(el => 
      el.children.length === 0 && /\$[\d,]+\.\d{2}/.test(el.textContent)
    );
    let currentMax = maxPriceSeen;
    let maxElement = null;
    priceElements.forEach(el => {
      const match = el.textContent.match(/\$([\d,]+\.\d{2})/);
      if (match) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (val > currentMax) {
          currentMax = val;
          maxElement = el;
        }
      }
    });
    
    if (maxPriceSeen > 0 && currentMax > maxPriceSeen && currentMax < maxPriceSeen * 1.5) {
      const pageText = document.body.innerText.toLowerCase();
      if (pageText.includes('fee') || pageText.includes('processing') || pageText.includes('service charge')) {
        if (maxElement && !maxElement.hasAttribute('data-dp-fee-flagged')) {
          maxElement.setAttribute('data-dp-fee-flagged', 'true');
          addIssue(maxElement, DARK_PATTERNS.HIDDEN_FEE, 'Unexpected price spike detected (Hidden Fee/Sneak into basket)!');
        }
      }
    }
    if (currentMax > maxPriceSeen) maxPriceSeen = currentMax;
  }, 2000);
}

function checkCommunityWarnings() {
  if (!userSettings.communityWarnings || !userSettings.firebaseId) return;
  const currentHostname = window.location.hostname;
  fetch(`https://firestore.googleapis.com/v1/projects/${userSettings.firebaseId}/databases/(default)/documents:runQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'reported_sites' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'url' },
            op: 'EQUAL',
            value: { stringValue: currentHostname }
          }
        }
      }
    })
  })
  .then(res => res.json())
  .then(data => {
    if (Array.isArray(data) && data.length > 0 && data[0].document) {
      addIssue(document.body, DARK_PATTERNS.COMMUNITY_WARNING, `This site has been reported ${data.length} times by the community for manipulative design!`);
    }
  })
  .catch(err => console.warn("Community Warning Fetch Error:", err));
}

function initScanner() {
  scanWholePage();
  if (!isWhitelisted) {
    observer.observe(document.body, { childList: true, subtree: true });
    initCheckoutTracker();
    checkCommunityWarnings();
  }
}

chrome.storage.sync.get({
  checkPreChecked: true, checkConfirmshaming: true, checkScarcity: true, checkHidden: true,
  autoFix: false, whitelist: [], aiKey: '', firebaseId: '',
  autoRejectCookies: true, trackHiddenFees: true, highlightSubTraps: true, communityWarnings: true
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
      autoFix: false, whitelist: [], aiKey: '', firebaseId: '',
      autoRejectCookies: true, trackHiddenFees: true, highlightSubTraps: true, communityWarnings: true,
      blockPopups: true, cloudSync: false,
      detectFakeTimers: true, autoScrollTnC: true, autoClickShaming: true, voiceAssistant: true
    }, (items) => {
      const oldKey = userSettings.aiKey;
      userSettings = items;
      isWhitelisted = items.whitelist.includes(window.location.hostname);
      scanWholePage();
      sendResponse({ issues: Array.from(detectedIssues.values()), whitelisted: isWhitelisted });

      if (userSettings.aiKey && userSettings.aiKey !== oldKey) {
        aiScanned = false;
        runAIScan();
      }
    });
  } else if (request.action === 'context_menu_scan') {
    try { chrome.runtime.sendMessage({ type: 'DARK_PATTERNS_DETECTED', count: detectedIssues.size + 1 }).catch(()=>{}); } catch(e){}
    try { chrome.runtime.sendMessage({ action: 'hotkey_triggered' }).catch(()=>{}); } catch(e){}
    runAIScan(request.text);
  } else if (request.action === 'fake_review_scan') {
    try { chrome.runtime.sendMessage({ type: 'DARK_PATTERNS_DETECTED', count: detectedIssues.size + 1 }).catch(()=>{}); } catch(e){}
    try { chrome.runtime.sendMessage({ action: 'hotkey_triggered' }).catch(()=>{}); } catch(e){}
    runFakeReviewScan(request.text);
  } else if (request.action === 'review_summary_scan') {
    try { chrome.runtime.sendMessage({ type: 'DARK_PATTERNS_DETECTED', count: detectedIssues.size + 1 }).catch(()=>{}); } catch(e){}
    try { chrome.runtime.sendMessage({ action: 'hotkey_triggered' }).catch(()=>{}); } catch(e){}
    runReviewSummaryScan();
  } else if (request.action === 'privacy_policy_scan') {
    try { chrome.runtime.sendMessage({ type: 'DARK_PATTERNS_DETECTED', count: detectedIssues.size + 1 }).catch(()=>{}); } catch(e){}
    try { chrome.runtime.sendMessage({ action: 'hotkey_triggered' }).catch(()=>{}); } catch(e){}
    if (request.isFinal && !request.error) {
      runPrivacyPolicyScan(request.text);
    } else if (request.error) {
      addIssue(document.body, DARK_PATTERNS.PRIVACY_SUMMARY, 'Failed to fetch the privacy policy. Make sure it is a valid link.');
    }
  } else if (request.action === 'escape_roach_motel') {
    try { chrome.runtime.sendMessage({ type: 'DARK_PATTERNS_DETECTED', count: detectedIssues.size + 1 }).catch(()=>{}); } catch(e){}
    try { chrome.runtime.sendMessage({ action: 'hotkey_triggered' }).catch(()=>{}); } catch(e){}
    runRoachMotelEscape();
  } else if (request.action === 'translate_trick_checkbox') {
    try { chrome.runtime.sendMessage({ type: 'DARK_PATTERNS_DETECTED', count: detectedIssues.size + 1 }).catch(()=>{}); } catch(e){}
    try { chrome.runtime.sendMessage({ action: 'hotkey_triggered' }).catch(()=>{}); } catch(e){}
    runTrickCheckboxScan(request.text);
  } else if (request.action === 'bait_switch_detector') {
    try { chrome.runtime.sendMessage({ type: 'DARK_PATTERNS_DETECTED', count: detectedIssues.size + 1 }).catch(()=>{}); } catch(e){}
    try { chrome.runtime.sendMessage({ action: 'hotkey_triggered' }).catch(()=>{}); } catch(e){}
    runBaitSwitchScan(request.text);
  } else if (request.action === 'toggleSider') {
    if (!isWhitelisted) runAIScan();
  }
});
