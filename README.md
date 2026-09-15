Dark Pattern Detector

Overview
A highly optimized, GPU-accelerated Chrome Extension that acts as an intelligent overlay to detect and block manipulative web design (Dark Patterns) in real-time.

Features
* Gemini AI Engine: Uses Gemini 3.6 Flash to read page context and catch guilt-tripping and fake urgency that bypass standard rules.
* Zero-DOM Footprint: The Sidebar UI is fully lazy-loaded inside an isolated iframe. It consumes zero memory until the exact moment you trigger it.
* Native Key Interception: Uses a document_start capture-phase key listener (Ctrl+Shift+X or Alt+X) to outsmart aggressive websites that try to steal keyboard shortcuts.
* Right-Click AI Scanner: Highlight any suspicious text on the internet, right-click, and send it directly to the AI for instant analysis.
* Crowdsourced Database: Connects to Firebase Firestore so users can report malicious websites to a global database.

Installation Instructions (Developer Mode)
1. Clone this repository to your local machine.
2. Open Chrome and navigate to chrome://extensions.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the cloned folder.
5. Open the Extension Settings and paste your Gemini API Key.

Requirements
* A valid Gemini API Key (for context scanning).
* A Firebase Project ID (optional, for crowdsourced reporting).

Architecture Notes
The extension relies on Manifest V3. Content scripts manage the DOM scanning and UI injection, while a background service worker orchestrates API calls, context menus, and badge notifications. All animations are hardware-accelerated using CSS transforms.
