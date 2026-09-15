// overlay.js - Injects the Ethical Overlay using Shadow DOM

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'showOverlay') {
    injectEthicalOverlay();
    sendResponse({ success: true });
  }
});

function injectEthicalOverlay() {
  if (document.getElementById('ethical-ux-overlay-container')) {
    return; // Already injected
  }

  // Create a container and attach Shadow DOM
  const container = document.createElement('div');
  container.id = 'ethical-ux-overlay-container';
  const shadowRoot = container.attachShadow({ mode: 'open' });

  // Injecting CSS directly inside the script
  shadowRoot.innerHTML = `
    <style>
      .overlay-backdrop {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background-color: rgba(0, 0, 0, 0.7); display: flex;
        justify-content: center; align-items: center; z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        backdrop-filter: blur(4px);
      }
      .overlay-modal {
        background: white; padding: 35px; border-radius: 16px; width: 90%; max-width: 500px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3); position: relative; color: #333;
        animation: slideUp 0.3s ease-out;
      }
      @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .overlay-modal h2 { margin-top: 0; color: #1e3c72; font-size: 24px; }
      .close-btn {
        position: absolute; top: 15px; right: 20px; background: none; border: none;
        font-size: 28px; cursor: pointer; color: #999; transition: color 0.2s;
      }
      .close-btn:hover { color: #333; }
      .pricing-breakdown { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e1e8ed;}
      .pricing-breakdown h3 { margin-top: 0; font-size: 16px; margin-bottom: 15px; color: #2c3e50; }
      .pricing-breakdown ul { list-style: none; padding: 0; margin: 0; }
      .pricing-breakdown li { padding: 8px 0; border-bottom: 1px dashed #ddd; display: flex; justify-content: space-between; }
      .pricing-breakdown li:last-child { border-bottom: none; font-size: 18px; font-weight: bold; margin-top: 5px; color: #27ae60;}
      .toggle-container { display: flex; align-items: center; margin: 25px 0; background: #f1f2f6; padding: 15px; border-radius: 8px;}
      .toggle-label { margin-left: 12px; font-size: 15px; font-weight: 500; color: #2f3640;}
      .switch { position: relative; display: inline-block; width: 50px; height: 28px; }
      .switch input { opacity: 0; width: 0; height: 0; }
      .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px;}
      .slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%;}
      input:checked + .slider { background-color: #27ae60; }
      input:checked + .slider:before { transform: translateX(22px); }
      .actions { display: flex; gap: 15px; margin-top: 25px; }
      .primary-btn { background: #27ae60; color: white; border: none; padding: 14px 24px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; flex: 1; transition: background 0.2s;}
      .primary-btn:hover { background: #219a52; }
      .cancel-btn { background: transparent; color: #e74c3c; border: 2px solid #e74c3c; padding: 14px 24px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; flex: 1; transition: all 0.2s;}
      .cancel-btn:hover { background: #fff0f0; }
    </style>
    <div class="overlay-backdrop" id="backdrop">
      <div class="overlay-modal">
        <button class="close-btn" id="close-btn">&times;</button>
        <h2>Ethical Subscription Flow</h2>
        <p>This is how a transparent, user-friendly checkout should look:</p>
        
        <div class="pricing-breakdown">
          <h3>Transparent Pricing</h3>
          <ul>
            <li>Monthly Plan: <span>$9.99/mo</span></li>
            <li>Taxes & Fees: <span>$1.20</span></li>
            <li><strong>Total Today:</strong> <strong>$11.19</strong></li>
          </ul>
        </div>

        <div class="toggle-container">
          <label class="switch">
            <input type="checkbox" id="auto-renew">
            <span class="slider"></span>
          </label>
          <span class="toggle-label">Enable Auto-Renew (Cancel anytime)</span>
        </div>

        <div class="actions">
          <button id="mock-subscribe" class="primary-btn">Subscribe Now</button>
          <button id="mock-cancel" class="cancel-btn">Cancel & Return</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  // Close when clicking X
  shadowRoot.getElementById('close-btn').addEventListener('click', () => {
    container.remove();
  });
  
  // Close when clicking outside the box
  shadowRoot.getElementById('backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'backdrop') {
      container.remove();
    }
  });

  // Make the red Cancel button work
  shadowRoot.getElementById('mock-cancel').addEventListener('click', () => {
    container.remove();
  });

  // Make the green Subscribe button work
  shadowRoot.getElementById('mock-subscribe').addEventListener('click', () => {
    alert("Success! This is just a demonstration, but in a real ethical flow, you would be safely subscribed now.");
    container.remove();
  });
}
