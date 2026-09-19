# Dark Pattern Detector

## Overview
A highly optimized, GPU-accelerated Chrome Extension that acts as an intelligent overlay to detect and block manipulative web design (Dark Patterns) in real-time.

## Features

### AI Intelligence (Gemini)
* Context Engine: Uses Gemini 3.6 Flash to read page context and catch guilt-tripping and fake urgency.
* Fake Review Analyzer: Scans selected reviews to determine if they are artificially generated.
* Honest Review Summarizer: Aggregates all reviews on a page and summarizes the actual pros and cons.
* Privacy Policy Summarizer: Scans long legal pages and translates privacy risks into plain English.
* Roach Motel Escape: Scrapes the page and uses AI to identify obscured cancellation or account deletion links.
* Trick Checkbox Translator: Highlights confusing double-negative checkboxes and translates them to plain English.
* Bait & Switch Detector: Analyzes product pricing context to determine if a discount is an illusion.

### Automated Defenses
* Cookie Banner Rejecter: Automatically clicks "Decline All" on intrusive cookie consent forms.
* Pop-up Blocker: Auto-closes deceptive, high z-index overlay ads.
* T&C Auto-Scroller: Automatically scrolls to the bottom of Terms & Conditions boxes to unlock "Accept" buttons.
* Confirmshame Auto-Clicker: Automatically clicks and hides manipulative guilt-trip buttons (e.g., "No thanks, I hate saving money").
* Fake Countdown Detector: Tracks session storage to expose timers that reset upon page refresh.
* Subscription Trap Highlighter: Tracks sneaky recurring fees buried in fine print.
* Hidden Fee Tracker: Monitors the cart total and alerts you if unexpected fees are quietly added during checkout.

### Cloud & Gamification
* Global Leaderboard: Tracks how many dark patterns each user has blocked and ranks them globally via Firebase.
* Cloud Sync: Syncs your scanner settings and whitelist rules across all your devices.
* Family Rule Sharing: Load and merge trusted whitelist rules directly from a friend or family member's Firebase User ID.
* Community Warning System: Flags websites that have been reported by other users in the global database.

### System Architecture
* Voice Assistant TTS: Uses the Web Speech API to physically announce detected threats out loud.
* GDPR Email Generator: Dynamically generates a CCPA/GDPR data deletion request and opens your email client if privacy threats are detected.
* Zero-DOM Footprint: The Sidebar UI is fully lazy-loaded inside an isolated iframe. It consumes zero memory until triggered.
* Native Key Interception: Uses a document_start capture-phase key listener (Ctrl+Shift+X) to outsmart aggressive websites.

## Installation Instructions
1. Clone this repository to your local machine.
2. Open Chrome and navigate to chrome://extensions.
3. Enable Developer mode in the top right corner.
4. Click Load unpacked and select the cloned folder.
5. Open the Extension Settings and paste your Gemini API Key and Firebase Project ID.

## Architecture Notes
The extension relies on Manifest V3. Content scripts manage the DOM scanning and UI injection, while a background service worker orchestrates API calls, context menus, and messaging. It uses raw REST requests to Firebase Firestore to maintain a lightweight footprint without heavy SDKs. All AI features use the Gemini Interactions API.
