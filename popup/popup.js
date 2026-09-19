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

  const leaderboardBtn = document.getElementById('leaderboard-btn');
  const leaderboardView = document.getElementById('leaderboard-view');
  const leaderboardBackBtn = document.getElementById('leaderboard-back-btn');
  const leaderboardList = document.getElementById('leaderboard-list');

  leaderboardBackBtn.addEventListener('click', () => { leaderboardView.style.display = 'none'; mainView.style.display = 'flex'; });
  
  leaderboardBtn.addEventListener('click', () => {
    mainView.style.display = 'none';
    leaderboardView.style.display = 'flex';
    
    // Fetch top users from Firebase
    chrome.storage.sync.get(['firebaseId'], (res) => {
      if (!res.firebaseId) {
        leaderboardList.innerHTML = `<li style="text-align: center; color: #7f8c8d; padding: 20px;">Please enter your Firebase Project ID in Settings to view the Leaderboard.</li>`;
        return;
      }
      
      fetch(`https://firestore.googleapis.com/v1/projects/${res.firebaseId}/databases/(default)/documents/user_settings`)
        .then(response => response.json())
        .then(data => {
          if (!data.documents) {
            leaderboardList.innerHTML = `<li style="text-align: center; color: #7f8c8d; padding: 20px;">No global rankings found.</li>`;
            return;
          }
          
          let users = [];
          data.documents.forEach(doc => {
            const configStr = doc.fields && doc.fields.config ? doc.fields.config.stringValue : "{}";
            try {
              const config = JSON.parse(configStr);
              if (config.lifetimeBlocked > 0) {
                users.push({
                  id: doc.name.split('/').pop().substring(0, 8),
                  score: config.lifetimeBlocked
                });
              }
            } catch(e) {}
          });
          
          users.sort((a, b) => b.score - a.score);
          
          if (users.length === 0) {
            leaderboardList.innerHTML = `<li style="text-align: center; color: #7f8c8d; padding: 20px;">No users have scored yet! Be the first!</li>`;
          } else {
            leaderboardList.innerHTML = users.slice(0, 50).map((u, i) => `
              <li class="issue-item" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <span style="font-weight: bold; font-size: 14px; margin-right: 10px; color: ${i===0?'#f1c40f':i===1?'#bdc3c7':i===2?'#cd7f32':'#7f8c8d'}">#${i+1}</span>
                  <span style="font-size: 12px; color: #34495e;">User ${u.id}...</span>
                </div>
                <div style="font-size: 14px; font-weight: bold; color: #27ae60;">${u.score} 🛡️</div>
              </li>
            `).join('');
          }
        })
        .catch(err => {
          leaderboardList.innerHTML = `<li style="text-align: center; color: #e74c3c; padding: 20px;">Failed to fetch leaderboard. Make sure Firebase is configured.</li>`;
        });
    });
  });

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
        li.appendChild(title); li.appendChild(desc); 
        
        if (issue.type === 'Privacy Policy Analysis') {
          const btn = document.createElement('a');
          btn.textContent = '📧 Send CCPA/GDPR Opt-Out Email';
          btn.style.cssText = 'display: block; margin-top: 10px; padding: 8px; background: #e74c3c; color: white; text-align: center; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 11px;';
          const domain = currentHostname.replace('www.', '');
          const subject = encodeURIComponent('CCPA / GDPR Data Deletion Request');
          const body = encodeURIComponent(`To the Privacy Officer at ${domain},\n\nI am writing to formally request that you delete any personal data you hold about me and opt me out of any future sale or sharing of my personal information, in accordance with applicable privacy laws (e.g. GDPR, CCPA).\n\nPlease confirm when this has been processed.\n\nThank you.`);
          btn.href = `mailto:privacy@${domain}?subject=${subject}&body=${body}`;
          btn.target = '_blank';
          li.appendChild(btn);
        }
        
        issueList.appendChild(li);
      });
    }
  }

  // 3. SETTINGS LOGIC
  const inputs = document.querySelectorAll('input[type="checkbox"]');
  const textInputs = document.querySelectorAll('input[type="text"], input[type="password"]');
  
  chrome.storage.local.get(['userId'], (res) => {
    let userId = res.userId;
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      chrome.storage.local.set({userId});
    }

    chrome.storage.sync.get({
      checkPreChecked: true, checkConfirmshaming: true, checkScarcity: true, checkHidden: true,
      autoFix: false, aiKey: '', firebaseId: '',
      autoRejectCookies: true, trackHiddenFees: true, highlightSubTraps: true, communityWarnings: true,
      blockPopups: true, cloudSync: false,
      detectFakeTimers: true, autoScrollTnC: true, autoClickShaming: true, voiceAssistant: true
    }, (items) => {
      
      const loadUI = (config) => {
        const setChecked = (id, val) => { const el = document.getElementById(id); if(el) el.checked = val; };
        setChecked('hidden-btn-toggle', config.checkHidden);
        setChecked('checkPreChecked', config.checkPreChecked);
        setChecked('checkConfirmshaming', config.checkConfirmshaming);
        setChecked('checkScarcity', config.checkScarcity);
        setChecked('auto-fix-toggle', config.autoFix);
        setChecked('autoRejectCookies', config.autoRejectCookies);
        setChecked('trackHiddenFees', config.trackHiddenFees);
        setChecked('highlightSubTraps', config.highlightSubTraps);
        setChecked('communityWarnings', config.communityWarnings);
        setChecked('blockPopups', config.blockPopups);
        setChecked('detectFakeTimers', config.detectFakeTimers);
        setChecked('autoScrollTnC', config.autoScrollTnC);
        setChecked('autoClickShaming', config.autoClickShaming);
        setChecked('voiceAssistant', config.voiceAssistant);
        setChecked('cloudSync', config.cloudSync);
        
        const apiKeyInput = document.getElementById('api-key');
        if (apiKeyInput) apiKeyInput.value = config.aiKey;
        const firebaseIdInput = document.getElementById('firebase-id');
        if (firebaseIdInput) firebaseIdInput.value = config.firebaseId;
      };

      if (items.cloudSync && items.firebaseId) {
        fetch(`https://firestore.googleapis.com/v1/projects/${items.firebaseId}/databases/(default)/documents/user_settings/${userId}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.fields && data.fields.config) {
              const remoteItems = JSON.parse(data.fields.config.stringValue);
              chrome.storage.sync.set(remoteItems, () => loadUI(remoteItems));
            } else {
              loadUI(items);
            }
          }).catch(() => loadUI(items));
      } else {
        loadUI(items);
      }
    });

    const saveSettings = () => {
      const getChecked = (id, def) => { const el = document.getElementById(id); return el ? el.checked : def; };
      const config = {
        checkPreChecked: getChecked('checkPreChecked', true),
        checkConfirmshaming: getChecked('checkConfirmshaming', true),
        checkScarcity: getChecked('checkScarcity', true),
        checkHidden: getChecked('hidden-btn-toggle', true),
        autoFix: getChecked('auto-fix-toggle', false),
        autoRejectCookies: getChecked('autoRejectCookies', true),
        trackHiddenFees: getChecked('trackHiddenFees', true),
        highlightSubTraps: getChecked('highlightSubTraps', true),
        communityWarnings: getChecked('communityWarnings', true),
        blockPopups: getChecked('blockPopups', true),
        detectFakeTimers: getChecked('detectFakeTimers', true),
        autoScrollTnC: getChecked('autoScrollTnC', true),
        autoClickShaming: getChecked('autoClickShaming', true),
        voiceAssistant: getChecked('voiceAssistant', true),
        cloudSync: getChecked('cloudSync', false),
        aiKey: document.getElementById('api-key') ? document.getElementById('api-key').value.trim() : '',
        firebaseId: document.getElementById('firebase-id') ? document.getElementById('firebase-id').value.trim() : ''
      };

      chrome.storage.sync.set(config, () => {
        if (config.cloudSync && config.firebaseId) {
          chrome.storage.local.get(['lifetimeBlocked'], (localRes) => {
            config.lifetimeBlocked = localRes.lifetimeBlocked || 0;
            fetch(`https://firestore.googleapis.com/v1/projects/${config.firebaseId}/databases/(default)/documents/user_settings/${userId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fields: { config: { stringValue: JSON.stringify(config) } } })
            });
          });
        }
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

  const loadRulesBtn = document.getElementById('load-rules-btn');
  const friendIdInput = document.getElementById('friend-id');
  const ruleStatus = document.getElementById('rule-load-status');

  if (loadRulesBtn && friendIdInput && ruleStatus) {
    loadRulesBtn.addEventListener('click', () => {
      const friendId = friendIdInput.value.trim();
      if (!friendId) return;
      
      chrome.storage.sync.get(['firebaseId', 'whitelist'], (res) => {
        if (!res.firebaseId) {
          ruleStatus.style.display = 'block'; ruleStatus.style.color = '#e74c3c';
          ruleStatus.textContent = 'Setup Cloud Sync first to load rules!';
          return;
        }
        
        loadRulesBtn.textContent = '...';
        fetch(`https://firestore.googleapis.com/v1/projects/${res.firebaseId}/databases/(default)/documents/user_settings/${friendId}`)
          .then(r => r.json())
          .then(data => {
            if (data && data.fields && data.fields.config) {
              const remoteItems = JSON.parse(data.fields.config.stringValue);
              if (remoteItems.whitelist && Array.isArray(remoteItems.whitelist)) {
                const combined = [...new Set([...(res.whitelist || []), ...remoteItems.whitelist])];
                chrome.storage.sync.set({ whitelist: combined }, () => {
                  ruleStatus.style.display = 'block'; ruleStatus.style.color = '#2ecc71';
                  ruleStatus.textContent = `Successfully merged ${remoteItems.whitelist.length} trusted sites!`;
                  loadRulesBtn.textContent = 'Load';
                  saveSettings(); // triggers reload
                });
              } else {
                ruleStatus.style.display = 'block'; ruleStatus.style.color = '#e74c3c';
                ruleStatus.textContent = 'Friend has no whitelist rules.';
                loadRulesBtn.textContent = 'Load';
              }
            } else {
              throw new Error('Not found');
            }
          })
          .catch(() => {
            ruleStatus.style.display = 'block'; ruleStatus.style.color = '#e74c3c';
            ruleStatus.textContent = 'Failed to find that User ID.';
            loadRulesBtn.textContent = 'Load';
          });
      });
    });
  }
  }); // End of chrome.storage.local.get

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
