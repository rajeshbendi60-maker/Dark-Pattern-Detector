const SIDER_WIDTH = '380px';
let iframe = null;
let isSiderOpen = false;

// 1. Lazy-Load Logic: Only inject the iframe when the user requests it!
function injectSidebar() {
  iframe = document.createElement('iframe');
  iframe.id = 'dp-sider-iframe';
  
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    top: '0',
    width: SIDER_WIDTH,
    height: '100vh',
    border: 'none',
    borderLeft: '1px solid rgba(0,0,0,0.1)',
    boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
    zIndex: '2147483647',
    transform: 'translateX(100%)', // Hides it off-screen WITHOUT causing a scrollbar
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    background: '#f4f7f6',
    colorScheme: 'light' // Prevents forced dark mode inversion
  });
  
  document.body.appendChild(iframe);

  // Securely fetch our exact Tab ID and set the URL
  chrome.runtime.sendMessage({ action: 'GET_MY_TAB_ID' }, (response) => {
    if (chrome.runtime.lastError) { /* ignore */ }
    
    if (response && response.tabId) {
      iframe.src = chrome.runtime.getURL('popup/popup.html') + `?tabId=${response.tabId}&hostname=${response.hostname}`;
    } else {
      iframe.src = chrome.runtime.getURL('popup/popup.html');
    }
    
    // Slight delay to allow the CSS to register before sliding it in
    setTimeout(() => {
      iframe.style.transform = 'translateX(0)';
    }, 50);
  });
}

// 2. Toggle Logic
function toggleSidebar() {
  if (!iframe) {
    isSiderOpen = true;
    injectSidebar();
  } else {
    isSiderOpen = !isSiderOpen;
    if (isSiderOpen) {
      iframe.style.transform = 'translateX(0)';
    } else {
      iframe.style.transform = 'translateX(100%)';
    }
  }
}

// 3. Listen for clicks from the Chrome Toolbar Icon!
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleSider') {
    toggleSidebar();
    sendResponse({ success: true });
  }
});

// 4. Bulletproof Keyboard Shortcut (Capture Phase)
// The 'true' at the end forces this to run BEFORE YouTube or other sites can block it!
window.addEventListener('keydown', (e) => {
  const isCtrlShiftX = (e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyX';
  const isAltX = e.altKey && !e.ctrlKey && !e.shiftKey && e.code === 'KeyX';

  if (isCtrlShiftX || isAltX) {
    e.preventDefault();
    e.stopPropagation(); // Stops the website from stealing the keypress
    toggleSidebar();
  }
}, true);

// 5. Light Dismiss: Close sidebar if user clicks anywhere on the main webpage
function handleOutsideClick(e) {
  if (isSiderOpen) {
    toggleSidebar();
  }
}

// We use 'true' (Capture Phase) so YouTube can't block the click!
// 'pointerdown' is added because it reacts instantly on touchscreens and trackpads.
window.addEventListener('click', handleOutsideClick, true);
window.addEventListener('pointerdown', handleOutsideClick, true);
