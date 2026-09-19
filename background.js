// Listen for clicks on the extension icon in the Chrome toolbar
chrome.action.onClicked.addListener((tab) => {
  // Ultra-safe MV3 messaging pattern
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'toggleSider' }, (response) => {
      // Ignore errors for pages like chrome:// where scripts can't run
      if (chrome.runtime.lastError) {
        console.log("Cannot open sidebar here: " + chrome.runtime.lastError.message);
      }
    });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'scan_dark_pattern',
    title: 'Scan for Manipulation (AI)',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: 'scan_fake_review',
    title: 'Analyze for Fake Review (AI)',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: 'summarize_privacy',
    title: 'Summarize Privacy Policy (AI)',
    contexts: ['link']
  });
  chrome.contextMenus.create({
    id: 'summarize_reviews',
    title: 'Summarize All Reviews (AI)',
    contexts: ['page']
  });
  chrome.contextMenus.create({
    id: 'roach_motel_escape',
    title: 'Roach Motel Escape Route (AI)',
    contexts: ['page']
  });
  chrome.contextMenus.create({
    id: 'translate_trick_checkbox',
    title: 'Translate Confusing Checkbox (AI)',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: 'bait_switch_detector',
    title: 'Analyze Discount Bait & Switch (AI)',
    contexts: ['selection']
  });
});

const safeSend = (tabId, msg) => {
  try { chrome.tabs.sendMessage(tabId, msg).catch(()=>{}); } catch(e){}
};

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'scan_dark_pattern') {
    safeSend(tab.id, { action: 'context_menu_scan', text: info.selectionText });
  } else if (info.menuItemId === 'scan_fake_review') {
    safeSend(tab.id, { action: 'fake_review_scan', text: info.selectionText });
  } else if (info.menuItemId === 'summarize_reviews') {
    safeSend(tab.id, { action: 'review_summary_scan' });
  } else if (info.menuItemId === 'roach_motel_escape') {
    safeSend(tab.id, { action: 'escape_roach_motel' });
  } else if (info.menuItemId === 'translate_trick_checkbox') {
    safeSend(tab.id, { action: 'translate_trick_checkbox', text: info.selectionText });
  } else if (info.menuItemId === 'bait_switch_detector') {
    safeSend(tab.id, { action: 'bait_switch_detector', text: info.selectionText });
  } else if (info.menuItemId === 'summarize_privacy') {
    safeSend(tab.id, { action: 'privacy_policy_scan', text: 'Fetching policy...' });
    
    fetch(info.linkUrl)
      .then(res => res.text())
      .then(html => {
        const text = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                         .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                         .replace(/<[^>]+>/g, ' ')
                         .replace(/\s+/g, ' ')
                         .substring(0, 10000);
        safeSend(tab.id, { action: 'privacy_policy_scan', text: text, isFinal: true });
      })
      .catch(err => {
        safeSend(tab.id, { action: 'privacy_policy_scan', text: 'Error fetching policy', isFinal: true, error: true });
      });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'hotkey_triggered') {
    if (sender.tab) {
      safeSend(sender.tab.id, { action: 'toggleSider' });
    }
    return true;
  }

  if (message.action === 'GET_MY_TAB_ID') {
    if (sender.tab) {
      const url = sender.tab.url || '';
      const hostname = url.startsWith('http') ? new URL(url).hostname : 'local-file';
      sendResponse({ tabId: sender.tab.id, hostname: hostname });
    } else {
      sendResponse({ tabId: null });
    }
    return true;
  }

  if (message.type === 'DARK_PATTERNS_DETECTED') {
    // Update icon badge when patterns are detected
    chrome.action.setBadgeText({
      text: message.count.toString(),
      tabId: sender.tab.id
    });
    chrome.action.setBadgeBackgroundColor({
      color: '#FF0000',
      tabId: sender.tab.id
    });
  }
});
