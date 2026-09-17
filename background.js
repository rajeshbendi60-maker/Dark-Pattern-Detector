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
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'scan_dark_pattern') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'context_menu_scan',
      text: info.selectionText
    });
  } else if (info.menuItemId === 'scan_fake_review') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'fake_review_scan',
      text: info.selectionText
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'hotkey_triggered') {
    if (sender.tab) {
      chrome.tabs.sendMessage(sender.tab.id, { action: 'toggleSider' });
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
