// This script is injected at "document_start", BEFORE YouTube loads its own scripts.
// This guarantees our extension gets the very first opportunity to intercept the keypress
// before aggressive websites can use stopImmediatePropagation() to steal it!

window.addEventListener('keydown', (e) => {
  const isCtrlShiftX = (e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyX';
  const isAltX = e.altKey && !e.ctrlKey && !e.shiftKey && e.code === 'KeyX';

  if (isCtrlShiftX || isAltX) {
    e.preventDefault();
    e.stopImmediatePropagation(); // We block YouTube from even seeing the keypress!
    
    // Bounce the command through the background script to trigger the sidebar safely
    chrome.runtime.sendMessage({ action: 'hotkey_triggered' });
  }
}, true);
