document.addEventListener('DOMContentLoaded', () => {
  // SPA ROUTING
  const mainView = document.getElementById('main-view');
  const settingsView = document.getElementById('settings-view');
  const analyticsView = document.getElementById('analytics-view');
  
  const settingsBtn = document.getElementById('settings-btn');
  const backBtn = document.getElementById('back-btn');
  const analyticsFooter = document.querySelector('.analytics-footer');
  const analyticsBackBtn = document.getElementById('analytics-back-btn');
  const historyList = document.getElementById('history-list');
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  
  // UI ELEMENTS
  const statusCard = document.getElementById('status-card');
  const statusTitle = document.getElementById('status-title');
  const statusSubtitle = document.getElementById('status-subtitle');
  const issueList = document.getElementById('issue-list');
  const showOverlayBtn = document.getElementById('show-overlay-btn');
  const gradeBadge = document.getElementById('trust-grade');
  const lifetimeStats = document.getElementById('lifetime-stats');
  
  const reportBtn = document.getElementById('report-btn');
  const whitelistBtn = document.getElementById('whitelist-btn');
  const twitterBtn = document.getElementById('twitter-btn');

  // STATE
  let currentTabId = null;
  let currentHostname = '';

  // 1. SPA ROUTING
  settingsBtn.addEventListener('click', () => { mainView.style.display = 'none'; settingsView.style.display = 'flex'; });
  backBtn.addEventListener('click', () => { settingsView.style.display = 'none'; mainView.style.display = 'flex'; });
  
  analyticsBackBtn.addEventListener('click', () => { analyticsView.style.display = 'none'; mainView.style.display = 'flex'; });
  
  const emptyHistoryUI = `
    <div style="text-align: center; padding: 40px 10px; color: #7f8c8d; background: white; border-radius: 8px; border: 1px dashed #bdc3c7; margin-top: 10px;">
      <div style="font-size: 50px; margin-bottom: 15px; opacity: 0.7;">📭</div>
      <h3 style="margin: 0 0 8px 0; color: #2c3e50; font-size: 15px;">No History Found</h3>
      <p style="margin: 0; font-size: 12px; line-height: 1.5;">When the scanner catches manipulative tricks, they will be permanently logged here for your review.</p>
    </div>
  `;

  analyticsFooter.addEventListener('click', () => {
    mainView.style.display = 'none';
    analyticsView.style.display = 'flex';
    
    chrome.storage.local.get(['lifetimeHistory'], (result) => {
      const history = result.lifetimeHistory || [];
      historyList.innerHTML = history.length === 0 ? emptyHistoryUI : '';
      
      history.forEach(item => {
        const li = document.createElement('li'); li.className = 'issue-item';
        const titleHtml = item.title ? `<div style="font-size: 11px; color: #34495e; font-weight: 600; margin-top: 4px; margin-bottom: 2px;">📄 ${item.title}</div>` : '';
        li.innerHTML = `
          <div class="issue-type">🛑 ${item.type}</div>
          ${titleHtml}
          <div style="font-size: 10px; color: #95a5a6; margin-bottom: 4px;">🌍 ${item.url} • 📅 ${item.date}</div>
          <p class="issue-desc">${item.description}</p>
        `;
        historyList.appendChild(li);
      });
    });
  });

  clearHistoryBtn.addEventListener('click', () => {
    chrome.storage.local.set({ lifetimeBlocked: 0, lifetimeHistory: [] }, () => {
      lifetimeStats.textContent = '0';
      historyList.innerHTML = emptyHistoryUI;
    });
  });

  // 2. LIVE UI RENDERER (Instantly updates Trust Score and Issue List)
  function renderUI(response) {
    if (!response) return;
    const issues = response.issues || [];
    const whitelisted = response.whitelisted;

    issueList.innerHTML = '';
    twitterBtn.style.display = 'none';
    
    if (whitelisted) {
      statusTitle.textContent = 'Domain Trusted';
      statusSubtitle.textContent = 'Scanner is sleeping.';
      statusCard.className = 'status-card clean';
      gradeBadge.textContent = '✅'; gradeBadge.className = 'grade-badge grade-a';
      showOverlayBtn.disabled = true;
      
      issueList.innerHTML = `
        <div style="text-align: center; padding: 30px 10px; color: #7f8c8d; background: white; border-radius: 8px; border: 1px dashed #bdc3c7;">
          <div style="font-size: 40px; margin-bottom: 10px;">🛡️</div>
          <h3 style="margin: 0 0 5px 0; color: #2c3e50; font-size: 14px;">Site Whitelisted</h3>
          <p style="margin: 0; font-size: 12px; line-height: 1.5;">You marked this domain as safe. The scanner is disabled here.</p>
        </div>
      `;
      return;
    }

    if (issues.length === 0) {
      statusTitle.textContent = 'System Secure';
      statusSubtitle.textContent = 'Highly Transparent Design';
      statusCard.className = 'status-card clean';
      gradeBadge.textContent = 'A+'; gradeBadge.className = 'grade-badge grade-a';
      showOverlayBtn.disabled = true;
      
      issueList.innerHTML = `
        <div style="text-align: center; padding: 30px 10px; color: #7f8c8d; background: white; border-radius: 8px; border: 1px dashed #2ecc71;">
          <div style="font-size: 40px; margin-bottom: 10px;">🎉</div>
          <h3 style="margin: 0 0 5px 0; color: #27ae60; font-size: 14px;">No Dark Patterns Found!</h3>
          <p style="margin: 0; font-size: 12px; line-height: 1.5;">This webpage appears to use ethical, user-friendly design. You are safe to browse!</p>
        </div>
      `;
    } else {
      statusTitle.textContent = 'Warning!';
      statusSubtitle.textContent = 'Manipulative UX Detected';
      statusCard.className = 'status-card warning';
      showOverlayBtn.disabled = false;
      
      if (issues.length === 1) { gradeBadge.textContent = 'B'; gradeBadge.className = 'grade-badge grade-b'; } 
      else if (issues.length === 2) { gradeBadge.textContent = 'C'; gradeBadge.className = 'grade-badge grade-c'; } 
      else {
        gradeBadge.textContent = 'F'; gradeBadge.className = 'grade-badge grade-f';
        twitterBtn.style.display = 'flex';
        twitterBtn.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just caught ${currentHostname} using ${issues.length} deceptive dark patterns! Caught by Dark Pattern Detector. 🛡️`)}`;
      }
      
      issues.forEach(issue => {
        const li = document.createElement('li'); li.className = 'issue-item';
        const title = document.createElement('div'); title.className = 'issue-type'; title.textContent = `🛑 ${issue.type}`;
        const desc = document.createElement('p'); desc.className = 'issue-desc'; desc.textContent = issue.description;
        li.appendChild(title); li.appendChild(desc); issueList.appendChild(li);
      });
    }
  }

  // 3. SETTINGS LOGIC
  const inputs = document.querySelectorAll('input[type="checkbox"]');
  const textInputs = document.querySelectorAll('input[type="text"], input[type="password"]');
  
  chrome.storage.sync.get({
    checkPreChecked: true, checkConfirmshaming: true, checkScarcity: true, checkHidden: true,
    autoFix: false, aiKey: '', firebaseId: ''
  }, (items) => {
    const hiddenToggle = document.getElementById('hidden-btn-toggle');
    if (hiddenToggle) hiddenToggle.checked = items.checkHidden;
    
    const preCheckToggle = document.getElementById('checkPreChecked');
    if (preCheckToggle) preCheckToggle.checked = items.checkPreChecked;
    
    const confirmshamingToggle = document.getElementById('checkConfirmshaming');
    if (confirmshamingToggle) confirmshamingToggle.checked = items.checkConfirmshaming;
    
    const scarcityToggle = document.getElementById('checkScarcity');
    if (scarcityToggle) scarcityToggle.checked = items.checkScarcity;

    const autoFixToggle = document.getElementById('auto-fix-toggle');
    if (autoFixToggle) autoFixToggle.checked = items.autoFix;
    
    const apiKeyInput = document.getElementById('api-key');
    if (apiKeyInput) apiKeyInput.value = items.aiKey;
    
    const firebaseIdInput = document.getElementById('firebase-id');
    if (firebaseIdInput) firebaseIdInput.value = items.firebaseId;
  });

  const saveSettings = () => {
    const hiddenToggle = document.getElementById('hidden-btn-toggle');
    const autoFixToggle = document.getElementById('auto-fix-toggle');
    const preCheckToggle = document.getElementById('checkPreChecked');
    const confirmshamingToggle = document.getElementById('checkConfirmshaming');
    const scarcityToggle = document.getElementById('checkScarcity');
    const apiKeyInput = document.getElementById('api-key');
    const firebaseIdInput = document.getElementById('firebase-id');

    chrome.storage.sync.set({
      checkPreChecked: preCheckToggle ? preCheckToggle.checked : true,
      checkConfirmshaming: confirmshamingToggle ? confirmshamingToggle.checked : true,
      checkScarcity: scarcityToggle ? scarcityToggle.checked : true,
      checkHidden: hiddenToggle ? hiddenToggle.checked : true,
      autoFix: autoFixToggle ? autoFixToggle.checked : false,
      aiKey: apiKeyInput ? apiKeyInput.value.trim() : '',
      firebaseId: firebaseIdInput ? firebaseIdInput.value.trim() : ''
    }, () => {
      // INSTANT LIVE RELOAD: Immediately trigger a rescan and redraw the UI
      if (currentTabId) {
        chrome.tabs.sendMessage(currentTabId, { action: 'forceRescan' }, (response) => {
          if (!chrome.runtime.lastError && response) renderUI(response);
        });
      }
    });
  };

  inputs.forEach(input => input.addEventListener('change', saveSettings));
  textInputs.forEach(input => input.addEventListener('input', saveSettings)); // Instantly save on paste!

  // Listen for delayed AI scan completions to live-update the Sidebar
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'DARK_PATTERNS_DETECTED' && currentTabId) {
      chrome.tabs.sendMessage(currentTabId, { action: 'getIssues' }, (response) => {
        if (!chrome.runtime.lastError) renderUI(response);
      });
    }
  });

  // 4. INITIALIZE EXTENSION
  chrome.storage.local.get(['lifetimeBlocked'], (result) => {
    lifetimeStats.textContent = result.lifetimeBlocked || 0;
  });

  // Watch for live gamification updates!
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.lifetimeBlocked) {
      lifetimeStats.textContent = changes.lifetimeBlocked.newValue;
    }
  });

  const urlParams = new URLSearchParams(window.location.search);
  const passedTabId = urlParams.get('tabId');
  const passedHostname = urlParams.get('hostname');

  function initUI() {
    // Attach button listeners
    reportBtn.onclick = () => {
      chrome.storage.sync.get({ firebaseId: '' }, (data) => {
        if (data.firebaseId) {
          fetch(`https://firestore.googleapis.com/v1/projects/${data.firebaseId}/databases/(default)/documents/reported_sites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields: { url: { stringValue: currentHostname }, timestamp: { stringValue: new Date().toISOString() } } })
          }).then(() => { 
            reportBtn.innerHTML = "<span>✅</span> Done"; reportBtn.style.color = "#2ecc71"; reportBtn.style.borderColor = "#2ecc71"; 
          });
        } else alert("☁️ Please enter your Firebase Project ID in Settings!");
      });
    };

    whitelistBtn.onclick = () => {
      chrome.storage.sync.get({ whitelist: [] }, (data) => {
        if (!data.whitelist.includes(currentHostname)) {
          data.whitelist.push(currentHostname);
          chrome.storage.sync.set({ whitelist: data.whitelist }, () => {
            whitelistBtn.innerHTML = "<span>✅</span> Trusted"; whitelistBtn.style.color = "#2ecc71"; whitelistBtn.style.borderColor = "#2ecc71";
            saveSettings(); // Force instant UI refresh
          });
        }
      });
    };
    
    showOverlayBtn.onclick = () => {
      chrome.tabs.sendMessage(currentTabId, { action: 'showOverlay' }, () => {
        showOverlayBtn.innerHTML = "✨ Overlay Launched!"; showOverlayBtn.style.background = "#2ecc71"; showOverlayBtn.style.borderColor = "#27ae60";
      });
    };

    twitterBtn.onclick = (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: twitterBtn.href, active: false });
      twitterBtn.innerHTML = "<span>✅</span> Opened"; twitterBtn.style.color = "#2ecc71"; twitterBtn.style.borderColor = "#2ecc71";
    };

    // Grab the initial issues
    chrome.tabs.sendMessage(currentTabId, { action: 'getIssues' }, (response) => {
      if (chrome.runtime.lastError) {
        issueList.innerHTML = `
          <div style="text-align: center; padding: 30px 10px; color: #7f8c8d; background: white; border-radius: 8px; border: 1px dashed #e74c3c;">
            <div style="font-size: 40px; margin-bottom: 10px;">⚠️</div>
            <h3 style="margin: 0 0 5px 0; color: #c0392b; font-size: 14px;">Scanner Unavailable</h3>
            <p style="margin: 0; font-size: 12px; line-height: 1.5;">Please refresh this tab to connect the Dark Pattern Detector.</p>
          </div>
        `;
      } else {
        renderUI(response);
      }
    });
  }

  if (passedTabId) {
    currentTabId = parseInt(passedTabId, 10);
    currentHostname = passedHostname;
    initUI();
  } else {
    // Ultimate Fallback just in case
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length) {
        currentTabId = tabs[0].id;
        const url = tabs[0].url || '';
        currentHostname = url.startsWith('http') ? new URL(url).hostname : 'local-file';
        initUI();
      } else {
        issueList.innerHTML = `<div style="text-align: center; padding: 20px; color: #e74c3c;">Critical Error: Cannot identify host tab.</div>`;
      }
    });
  }

  // Allow closing the sidebar via shortcut even if the iframe has focus!
  window.addEventListener('keydown', (e) => {
    const isCtrlShiftX = (e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyX';
    const isAltX = e.altKey && !e.ctrlKey && !e.shiftKey && e.code === 'KeyX';
    if ((isCtrlShiftX || isAltX) && currentTabId) {
      e.preventDefault();
      chrome.tabs.sendMessage(currentTabId, { action: 'toggleSider' });
    }
  });
});
