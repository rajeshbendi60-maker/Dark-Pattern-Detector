document.addEventListener('DOMContentLoaded', () => {
  const inputs = document.querySelectorAll('input[type="checkbox"]');
  const textInputs = document.querySelectorAll('input[type="text"]');
  
  chrome.storage.sync.get({
    checkPreChecked: true,
    checkConfirmshaming: true,
    checkScarcity: true,
    checkHidden: true,
    autoFix: false,
    aiKey: '',
    firebaseId: ''
  }, (items) => {
    document.getElementById('checkPreChecked').checked = items.checkPreChecked;
    document.getElementById('checkConfirmshaming').checked = items.checkConfirmshaming;
    document.getElementById('checkScarcity').checked = items.checkScarcity;
    document.getElementById('checkHidden').checked = items.checkHidden;
    document.getElementById('autoFix').checked = items.autoFix;
    document.getElementById('aiKey').value = items.aiKey;
    document.getElementById('firebaseId').value = items.firebaseId;
  });

  const saveSettings = () => {
    const settings = {
      checkPreChecked: document.getElementById('checkPreChecked').checked,
      checkConfirmshaming: document.getElementById('checkConfirmshaming').checked,
      checkScarcity: document.getElementById('checkScarcity').checked,
      checkHidden: document.getElementById('checkHidden').checked,
      autoFix: document.getElementById('autoFix').checked,
      aiKey: document.getElementById('aiKey').value.trim(),
      firebaseId: document.getElementById('firebaseId').value.trim()
    };
    
    chrome.storage.sync.set(settings, () => {
      const status = document.getElementById('status');
      status.textContent = 'Settings successfully saved!';
      setTimeout(() => status.textContent = '', 2000);
    });
  };

  inputs.forEach(input => input.addEventListener('change', saveSettings));
  textInputs.forEach(input => input.addEventListener('blur', saveSettings));
});
