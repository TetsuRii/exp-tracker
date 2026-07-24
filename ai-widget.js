// AI Widget for Expiration Tracker
// Adds AI assistant, smart categorization, insights, barcode scanner & camera scan

(function() {
  'use strict';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    injectStyles();
    addBarcodeScannerBar();     // ✅ Physical scanner & camera scanner
    addChatBubble();            // 🤖 AI chat
    addInsightsButton();        // 📊 Insights
    watchForProductForms();     // 🧠 Auto-categorize
    watchForNameInputs();
    console.log('🤖 AI Assistant + Barcode Scanner loaded');
  }

  // ==================== AUTH HELPERS ====================

  function getToken() {
    try {
      const token = localStorage.getItem('token');
      if (token) return token;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const val = localStorage.getItem(key);
        if (val && (val.startsWith('eyJ') || (typeof val === 'string' && val.length > 100 && val.includes('.')))) {
          try { const parts = val.split('.'); if (parts.length === 3) return val; } catch(e) {}
        }
      }
    } catch(e) {}
    return null;
  }

  function getUsername() {
    try {
      const token = getToken();
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.username || 'User';
      }
    } catch(e) {}
    return 'User';
  }

  // ==================== STYLES ====================

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* ===== BARCODE SCANNER BAR ===== */
      #ai-barcode-bar {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 9999;
        background: #1a1a2e;
        border-top: 3px solid #4caf50;
        padding: 8px 16px;
        display: flex;
        align-items: center;
        gap: 10px;
        transform: translateY(100%);
        transition: transform 0.3s ease;
        box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
      }
      #ai-barcode-bar.open { transform: translateY(0); }

      #ai-barcode-bar .barcode-label {
        color: #4caf50;
        font-size: 13px;
        font-weight: 700;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      #ai-barcode-bar .barcode-label span { font-size: 18px; }

      #ai-barcode-bar .barcode-input-wrap {
        flex: 1;
        position: relative;
        display: flex;
        align-items: center;
      }
      #ai-barcode-bar .barcode-input-wrap input {
        width: 100%;
        padding: 10px 14px;
        padding-right: 40px;
        border: 2px solid #4caf50;
        border-radius: 10px;
        font-size: 18px;
        font-family: 'Courier New', monospace;
        letter-spacing: 2px;
        outline: none;
        background: #16213e;
        color: #fff;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      #ai-barcode-bar .barcode-input-wrap input:focus {
        border-color: #66bb6a;
        box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.3);
      }
      #ai-barcode-bar .barcode-input-wrap input::placeholder {
        color: #666;
        letter-spacing: 0;
        font-family: sans-serif;
        font-size: 14px;
      }
      /* Scanner detected flash */
      #ai-barcode-bar .barcode-input-wrap input.scan-success {
        border-color: #66bb6a;
        background: #1b5e20;
        box-shadow: 0 0 15px rgba(76, 175, 80, 0.5);
        transition: all 0.1s;
      }
      #ai-barcode-bar .barcode-input-wrap input.scan-error {
        border-color: #ff5252;
        background: #4a1a1a;
        box-shadow: 0 0 15px rgba(255, 82, 82, 0.5);
      }

      #ai-barcode-bar .barcode-btn {
        background: #4caf50;
        color: white;
        border: none;
        border-radius: 10px;
        padding: 10px 16px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: background 0.2s;
      }
      #ai-barcode-bar .barcode-btn:hover { background: #43a047; }
      #ai-barcode-bar .barcode-btn.camera-btn {
        background: #7c4dff;
      }
      #ai-barcode-bar .barcode-btn.camera-btn:hover { background: #651fff; }
      #ai-barcode-bar .barcode-btn.close-btn {
        background: transparent;
        color: #999;
        padding: 8px;
        font-size: 20px;
        min-width: unset;
      }
      #ai-barcode-bar .barcode-btn.close-btn:hover { color: #fff; background: rgba(255,255,255,0.1); }

      /* Toggle button */
      #ai-barcode-toggle {
        position: fixed;
        bottom: 160px;
        right: 20px;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, #4caf50, #2e7d32);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(76, 175, 80, 0.5);
        border: none;
        z-index: 9998;
        font-size: 20px;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      #ai-barcode-toggle:hover { transform: scale(1.1); box-shadow: 0 6px 25px rgba(76, 175, 80, 0.7); }
      #ai-barcode-toggle.active { background: linear-gradient(135deg, #ff5252, #d32f2f); }

      /* Scanner status indicator */
      #ai-barcode-bar .scanner-status {
        font-size: 12px;
        color: #888;
        white-space: nowrap;
        padding: 4px 10px;
        background: #0d1b2a;
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      #ai-barcode-bar .scanner-status .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #4caf50;
        animation: pulse-dot 1.5s infinite;
      }
      @keyframes pulse-dot {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.3); }
      }

      /* Scan result toast */
      .ai-barcode-toast {
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: #1a1a2e;
        border: 1px solid #4caf50;
        border-radius: 12px;
        padding: 14px 24px;
        z-index: 10000;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 8px 40px rgba(0,0,0,0.4);
        animation: aiSlideUp 0.3s ease;
      }
      .ai-barcode-toast.error { border-color: #ff5252; }
      .ai-barcode-toast .toast-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }
      .ai-barcode-toast .toast-header .icon { font-size: 24px; }
      .ai-barcode-toast .toast-header .title {
        font-size: 16px;
        font-weight: 700;
        color: #4caf50;
      }
      .ai-barcode-toast.error .toast-header .title { color: #ff5252; }
      .ai-barcode-toast .toast-body {
        color: #ccc;
        font-size: 14px;
        line-height: 1.5;
      }
      .ai-barcode-toast .toast-body strong { color: #fff; }
      .ai-barcode-toast .toast-actions {
        display: flex;
        gap: 8px;
        margin-top: 10px;
        flex-wrap: wrap;
      }
      .ai-barcode-toast .toast-actions button {
        padding: 6px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
      }
      .ai-barcode-toast .toast-actions .btn-primary {
        background: #4caf50;
        color: white;
      }
      .ai-barcode-toast .toast-actions .btn-primary:hover { background: #43a047; }
      .ai-barcode-toast .toast-actions .btn-secondary {
        background: rgba(255,255,255,0.1);
        color: #ccc;
      }
      .ai-barcode-toast .toast-actions .btn-secondary:hover { background: rgba(255,255,255,0.2); }
      .ai-barcode-toast .toast-close {
        position: absolute;
        top: 8px;
        right: 10px;
        background: none;
        border: none;
        color: #666;
        font-size: 18px;
        cursor: pointer;
      }

      /* Camera scanner overlay */
      #ai-camera-scanner {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.9);
        z-index: 10001;
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      #ai-camera-scanner.open { display: flex; }
      #ai-camera-scanner video {
        max-width: 100%;
        max-height: 80vh;
        border-radius: 12px;
        box-shadow: 0 0 40px rgba(76, 175, 80, 0.3);
      }
      #ai-camera-scanner .cam-header {
        position: absolute;
        top: 20px;
        left: 0;
        right: 0;
        text-align: center;
        color: white;
        font-size: 18px;
        font-weight: 600;
      }
      #ai-camera-scanner .cam-header small {
        display: block;
        font-size: 13px;
        color: #888;
        font-weight: 400;
        margin-top: 4px;
      }
      #ai-camera-scanner .cam-close {
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        font-size: 22px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }
      #ai-camera-scanner .cam-close:hover { background: rgba(255,255,255,0.35); }
      #ai-camera-scanner .scan-region {
        position: absolute;
        border: 2px dashed rgba(76, 175, 80, 0.6);
        border-radius: 12px;
        width: 250px;
        height: 120px;
        pointer-events: none;
        animation: pulse-border 2s infinite;
      }
      @keyframes pulse-border {
        0%, 100% { border-color: rgba(76, 175, 80, 0.6); }
        50% { border-color: rgba(76, 175, 80, 0.2); }
      }

      /* ===== ALL EXISTING STYLES (chat, insights, etc) ===== */
      .ai-widget-bubble {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.5);
        border: none;
        z-index: 9998;
        font-size: 24px;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .ai-widget-bubble:hover { transform: scale(1.1); box-shadow: 0 6px 25px rgba(102, 126, 234, 0.7); }
      .ai-widget-bubble.insights-bubble {
        bottom: 90px;
        width: 48px;
        height: 48px;
        font-size: 20px;
        background: linear-gradient(135deg, #f093fb, #f5576c);
        box-shadow: 0 4px 20px rgba(245, 87, 108, 0.4);
      }
      .ai-widget-bubble.insights-bubble:hover { box-shadow: 0 6px 25px rgba(245, 87, 108, 0.6); }
      .ai-widget-bubble.has-insights::after {
        content: '';
        position: absolute;
        top: -2px;
        right: -2px;
        width: 14px;
        height: 14px;
        background: #ff4444;
        border-radius: 50%;
        border: 2px solid white;
      }

      .ai-chat-panel {
        position: fixed;
        bottom: 90px;
        right: 20px;
        width: 380px;
        height: 520px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 60px rgba(0,0,0,0.2);
        z-index: 9997;
        display: none;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid #e0e0e0;
        animation: aiSlideUp 0.3s ease;
      }
      .ai-chat-panel.open { display: flex; }
      @keyframes aiSlideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .ai-chat-header {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 14px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .ai-chat-header h3 { margin: 0; font-size: 16px; font-weight: 600; }
      .ai-chat-header-actions { display: flex; gap: 8px; }
      .ai-chat-header button {
        background: rgba(255,255,255,0.2);
        border: none; color: white;
        width: 28px; height: 28px;
        border-radius: 50%; cursor: pointer;
        font-size: 14px; display: flex;
        align-items: center; justify-content: center;
        transition: background 0.2s;
      }
      .ai-chat-header button:hover { background: rgba(255,255,255,0.35); }

      .ai-chat-messages {
        flex: 1; overflow-y: auto;
        padding: 12px 16px; background: #f8f9fa;
        scroll-behavior: smooth;
      }
      .ai-chat-messages::-webkit-scrollbar { width: 5px; }
      .ai-chat-messages::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }

      .ai-msg {
        margin-bottom: 12px; max-width: 85%;
        padding: 10px 14px; border-radius: 14px;
        font-size: 14px; line-height: 1.5;
        white-space: pre-wrap; animation: aiMsgIn 0.3s ease;
      }
      @keyframes aiMsgIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .ai-msg.bot {
        background: white; color: #333;
        align-self: flex-start; border-bottom-left-radius: 4px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        margin-right: auto;
      }
      .ai-msg.user {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white; align-self: flex-end;
        border-bottom-right-radius: 4px; margin-left: auto;
      }
      .ai-msg .typing { display: inline-block; animation: blink 1.4s infinite; }
      @keyframes blink { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
      .ai-msg small { display: block; font-size: 11px; opacity: 0.7; margin-top: 4px; }

      .ai-chat-input-area {
        padding: 10px 12px; border-top: 1px solid #e8e8e8;
        display: flex; gap: 8px; background: white;
      }
      .ai-chat-input-area input {
        flex: 1; border: 1px solid #ddd; border-radius: 20px;
        padding: 10px 16px; font-size: 14px; outline: none;
        transition: border-color 0.2s;
      }
      .ai-chat-input-area input:focus { border-color: #667eea; }
      .ai-chat-input-area button {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white; border: none; border-radius: 50%;
        width: 40px; height: 40px; cursor: pointer; font-size: 16px;
        display: flex; align-items: center; justify-content: center;
        transition: transform 0.2s;
      }
      .ai-chat-input-area button:hover { transform: scale(1.05); }
      .ai-chat-input-area button:disabled { opacity: 0.5; cursor: default; }

      .ai-quick-suggestions {
        display: flex; flex-wrap: wrap; gap: 6px;
        padding: 8px 12px; background: #f0f2ff;
        border-top: 1px solid #e8e8e8;
      }
      .ai-quick-suggestions button {
        background: white; border: 1px solid #667eea;
        color: #667eea; padding: 5px 12px;
        border-radius: 14px; font-size: 12px; cursor: pointer;
        transition: all 0.2s; white-space: nowrap;
      }
      .ai-quick-suggestions button:hover { background: #667eea; color: white; }

      .ai-insights-panel {
        position: fixed; bottom: 150px; right: 20px;
        width: 380px; max-height: 400px;
        background: white; border-radius: 16px;
        box-shadow: 0 10px 60px rgba(0,0,0,0.2);
        z-index: 9996; display: none; flex-direction: column;
        overflow: hidden; border: 1px solid #e0e0e0;
        animation: aiSlideUp 0.3s ease;
      }
      .ai-insights-panel.open { display: flex; }
      .ai-insights-header {
        background: linear-gradient(135deg, #f093fb, #f5576c);
        color: white; padding: 12px 16px;
        display: flex; justify-content: space-between; align-items: center;
      }
      .ai-insights-header h3 { margin: 0; font-size: 15px; font-weight: 600; }
      .ai-insights-header button {
        background: rgba(255,255,255,0.2); border: none;
        color: white; width: 26px; height: 26px;
        border-radius: 50%; cursor: pointer; font-size: 14px;
      }
      .ai-insights-content { flex: 1; overflow-y: auto; padding: 12px 16px; background: #f8f9fa; }
      .ai-insight-item {
        background: white; border-radius: 10px; padding: 10px 14px;
        margin-bottom: 8px; display: flex; align-items: flex-start; gap: 10px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.06); border-left: 3px solid #667eea;
      }
      .ai-insight-item.danger { border-left-color: #ff4444; }
      .ai-insight-item.warning { border-left-color: #ffa726; }
      .ai-insight-item.info { border-left-color: #42a5f5; }
      .ai-insight-item.stats { border-left-color: #66bb6a; }
      .ai-insight-icon { font-size: 20px; flex-shrink: 0; }
      .ai-insight-text { font-size: 13px; line-height: 1.4; color: #555; }
      .ai-insight-text strong { color: #333; }
      .ai-insight-empty { text-align: center; color: #999; padding: 30px 20px; font-size: 14px; }

      .ai-cat-suggestion {
        position: absolute; background: white;
        border: 1px solid #ddd; border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 10000; max-height: 200px; overflow-y: auto; min-width: 200px;
      }
      .ai-cat-suggestion-item {
        padding: 8px 14px; font-size: 13px; cursor: pointer;
        display: flex; justify-content: space-between; align-items: center;
        border-bottom: 1px solid #f0f0f0; transition: background 0.15s;
      }
      .ai-cat-suggestion-item:hover { background: #f0f2ff; }
      .ai-cat-suggestion-item .cat-name { color: #333; }
      .ai-cat-suggestion-item .cat-label {
        font-size: 11px; color: #667eea;
        background: #f0f2ff; padding: 2px 8px; border-radius: 10px;
      }
      .ai-cat-suggestion-item:last-child { border-bottom: none; }
    `;
    document.head.appendChild(style);
  }

  // ==================== BARCODE SCANNER BAR (PHYSICAL SCANNER + INPUT) ====================

  let barcodeBarOpen = false;
  let scannerTimeout = null;
  let scanBuffer = '';

  function addBarcodeScannerBar() {
    // Toggle button (green circle at bottom)
    const toggle = document.createElement('button');
    toggle.id = 'ai-barcode-toggle';
    toggle.innerHTML = '📷';
    toggle.title = 'Toggle Barcode Scanner';
    toggle.addEventListener('click', toggleBarcodeBar);
    document.body.appendChild(toggle);

    // The bar itself
    const bar = document.createElement('div');
    bar.id = 'ai-barcode-bar';
    bar.innerHTML = `
      <div class="barcode-label"><span>📷</span> Scanner</div>
      <div class="barcode-input-wrap">
        <input type="text" id="ai-scanner-input" 
          placeholder="Scan a barcode or type it here..." 
          autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
      </div>
      <div class="scanner-status">
        <span class="dot"></span>
        <span>Ready</span>
      </div>
      <button class="barcode-btn camera-btn" id="ai-camera-scan-btn">📸 Camera</button>
      <button class="barcode-btn" id="ai-barcode-lookup-btn">🔍 Look Up</button>
      <button class="barcode-btn close-btn" id="ai-barcode-close-btn">✕</button>
    `;
    document.body.appendChild(bar);

    // Elements
    const input = bar.querySelector('#ai-scanner-input');
    const lookupBtn = bar.querySelector('#ai-barcode-lookup-btn');
    const closeBtn = bar.querySelector('#ai-barcode-close-btn');
    const cameraBtn = bar.querySelector('#ai-camera-scan-btn');
    const statusDot = bar.querySelector('.dot');
    const statusText = bar.querySelector('.scanner-status span:last-child');

    // When user presses Enter in the barcode input (physical scanner sends Enter!)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const barcode = input.value.trim();
        if (barcode) {
          doBarcodeLookup(barcode, input);
        }
      }
    });

    // Also auto-detect fast scanner input (some scanners don't send Enter)
    let lastInputTime = 0;
    input.addEventListener('input', () => {
      const now = Date.now();
      // If characters are coming in fast (< 50ms apart), it's a scanner
      if (now - lastInputTime < 80 && input.value.length > 5) {
        // Scanner detected! Wait for it to finish
        clearTimeout(scannerTimeout);
        scannerTimeout = setTimeout(() => {
          const barcode = input.value.trim();
          if (barcode.length > 5) {
            doBarcodeLookup(barcode, input);
          }
        }, 100);
      }
      lastInputTime = now;
    });

    // Lookup button
    lookupBtn.addEventListener('click', () => {
      const barcode = input.value.trim();
      if (barcode) doBarcodeLookup(barcode, input);
    });

    // Close button
    closeBtn.addEventListener('click', () => toggleBarcodeBar());

    // Camera button
    cameraBtn.addEventListener('click', openCameraScanner);

    // Auto-focus when bar opens
    const observer = new MutationObserver(() => {
      if (bar.classList.contains('open')) {
        setTimeout(() => input.focus(), 200);
      }
    });
    observer.observe(bar, { attributes: true, attributeFilter: ['class'] });

    // Global keyboard shortcut: Ctrl+Shift+B to open scanner
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        toggleBarcodeBar();
      }
    });
  }

  function toggleBarcodeBar() {
    const bar = document.getElementById('ai-barcode-bar');
    const toggle = document.getElementById('ai-barcode-toggle');
    if (!bar) return;
    barcodeBarOpen = !barcodeBarOpen;
    bar.classList.toggle('open', barcodeBarOpen);
    toggle.classList.toggle('active', barcodeBarOpen);
    toggle.innerHTML = barcodeBarOpen ? '✕' : '📷';
  }

  // ==================== BARCODE LOOKUP ====================

  async function doBarcodeLookup(barcode, input) {
    const token = getToken();
    if (!token) {
      showToast('⚠️ Please log in first', 'error');
      return;
    }

    // Clean barcode
    const cleaned = barcode.replace(/\D/g, '');
    if (cleaned.length < 5) {
      flashInput(input, false);
      showToast('❌ Invalid barcode. Please scan again.', 'error');
      return;
    }

    // Show scanning state
    input.value = cleaned;
    flashInput(input, true);
    setScannerStatus('🔍 Looking up...', '#ffa726');

    try {
      const res = await fetch(`/api/lookup-barcode?barcode=${encodeURIComponent(cleaned)}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });

      if (!res.ok) {
        setScannerStatus('❌ Server error', '#ff5252');
        flashInput(input, false);
        return;
      }

      const data = await res.json();

      if (data.found) {
        setScannerStatus(`✅ Found: ${data.name.substring(0, 30)}`, '#4caf50');
        showProductFoundToast(data, cleaned);
        input.value = '';
        setTimeout(() => setScannerStatus('Ready', '#4caf50'), 3000);
      } else {
        setScannerStatus('❌ Not found', '#ff5252');
        flashInput(input, false);
        showToast(`❌ Product not found for barcode ${cleaned}. Add it manually.`, 'error');
        // Keep the barcode in the input so user can retry
        setTimeout(() => setScannerStatus('Ready', '#4caf50'), 3000);
      }
    } catch (e) {
      setScannerStatus('❌ Network error', '#ff5252');
      flashInput(input, false);
      showToast('⚠️ Network error. Check your connection.', 'error');
      console.error('Barcode lookup error:', e);
      setTimeout(() => setScannerStatus('Ready', '#4caf50'), 3000);
    }
  }

  function flashInput(input, success) {
    input.classList.remove('scan-success', 'scan-error');
    void input.offsetWidth; // force reflow
    input.classList.add(success ? 'scan-success' : 'scan-error');
    setTimeout(() => input.classList.remove('scan-success', 'scan-error'), 500);
  }

  function setScannerStatus(text, color) {
    const bar = document.getElementById('ai-barcode-bar');
    if (!bar) return;
    const statusText = bar.querySelector('.scanner-status span:last-child');
    const dot = bar.querySelector('.dot');
    if (statusText) statusText.textContent = text;
    if (dot) dot.style.background = color || '#4caf50';
  }

  // ==================== TOAST NOTIFICATIONS ====================

  function showToast(message, type) {
    const existing = document.querySelector('.ai-barcode-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'ai-barcode-toast' + (type === 'error' ? ' error' : '');
    toast.innerHTML = `
      <button class="toast-close">✕</button>
      <div class="toast-header">
        <span class="icon">${type === 'error' ? '❌' : '📋'}</span>
        <span class="title">${type === 'error' ? 'Oops!' : 'Info'}</span>
      </div>
      <div class="toast-body">${message}</div>
    `;
    toast.querySelector('.toast-close').onclick = () => toast.remove();
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 5000);
  }

  function showProductFoundToast(data, barcode) {
    const existing = document.querySelector('.ai-barcode-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'ai-barcode-toast';
    toast.style.bottom = '220px';
    toast.innerHTML = `
      <button class="toast-close">✕</button>
      <div class="toast-header">
        <span class="icon">✅</span>
        <span class="title">Product Found!</span>
      </div>
      <div class="toast-body">
        <strong>${data.name}</strong><br>
        Category: ${data.category}<br>
        Barcode: ${barcode}
        ${data.imageUrl ? '<br><small>📸 Image available</small>' : ''}
      </div>
      <div class="toast-actions">
        <button class="btn-primary" id="toast-add-product">➕ Add to Inventory</button>
        <button class="btn-secondary" id="toast-dismiss">OK</button>
      </div>
    `;

    toast.querySelector('#toast-dismiss').onclick = () => toast.remove();
    toast.querySelector('#toast-close')?.addEventListener('click', () => toast.remove());

    // Add to Inventory button — tries to fill the product form
    toast.querySelector('#toast-add-product').onclick = () => {
      toast.remove();
      attemptFillProductForm(data, barcode);
    };

    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 15000);
  }

  // ==================== AUTO-FILL PRODUCT FORM ====================

  function attemptFillProductForm(data, barcode) {
    // Try to find the Add Product button and click it
    const addButtons = findAddProductButtons();
    if (addButtons.length > 0) {
      addButtons[0].click();
      // Wait for form to appear, then fill it
      setTimeout(() => fillFormFields(data, barcode), 800);
    } else {
      showToast('📝 Click "Add Product" first, then scan again!', 'error');
    }
  }

  function findAddProductButtons() {
    const all = [];
    // Look for buttons/links that say "Add" or "New Product"
    const btns = document.querySelectorAll('button, a, [role="button"], span, div');
    for (const btn of btns) {
      const text = (btn.textContent || '').toLowerCase().trim();
      if (text === 'add' || text === 'add product' || text === 'new product' || text === '+ add' || text === '➕') {
        all.push(btn);
      }
    }
    return all;
  }

  function fillFormFields(data, barcode) {
    const nameInput = findNameInput();
    if (!nameInput) {
      showToast(`Could not find name field. Add manually: ${data.name}`, 'error');
      return;
    }

    // Set name
    nameInput.value = data.name;
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));

    // Try to find barcode field
    setTimeout(() => {
      const allInputs = document.querySelectorAll('input');
      for (const inp of allInputs) {
        const ph = (inp.placeholder || '').toLowerCase();
        const ariaLabel = (inp.getAttribute('aria-label') || '').toLowerCase();
        if (ph.includes('barcode') || ariaLabel.includes('barcode') || ph.includes('upc') || ph.includes('ean')) {
          inp.value = barcode;
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          break;
        }
      }
    }, 200);

    // Try to set category
    setTimeout(() => {
      const catInput = findCategoryInput(nameInput);
      if (catInput) {
        if (catInput.tagName === 'SELECT') {
          for (let i = 0; i < catInput.options.length; i++) {
            if (catInput.options[i].text.toLowerCase() === data.category.toLowerCase() ||
                catInput.options[i].value.toLowerCase() === data.category.toLowerCase()) {
              catInput.selectedIndex = i;
              catInput.dispatchEvent(new Event('change', { bubbles: true }));
              break;
            }
          }
        } else if (catInput.tagName === 'INPUT') {
          catInput.value = data.category;
          catInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    }, 400);

    showToast(`✅ Filled: ${data.name} (${data.category})`, null);
  }

  // ==================== CAMERA SCANNER (Phone Camera) ====================

  let cameraStream = null;
  let cameraScanTimer = null;

  function openCameraScanner() {
    // Close the barcode bar
    if (barcodeBarOpen) toggleBarcodeBar();

    // Create overlay
    let overlay = document.getElementById('ai-camera-scanner');
    if (overlay) { overlay.classList.add('open'); return; }

    overlay = document.createElement('div');
    overlay.id = 'ai-camera-scanner';
    overlay.className = 'open';
    overlay.innerHTML = `
      <div class="cam-header">
        📸 Point camera at barcode
        <small>The scanner will auto-detect and look up the product</small>
      </div>
      <div class="scan-region"></div>
      <video id="ai-cam-video" autoplay playsinline></video>
      <button class="cam-close" id="ai-cam-close">✕</button>
    `;
    document.body.appendChild(overlay);

    const video = overlay.querySelector('#ai-cam-video');
    const closeBtn = overlay.querySelector('#ai-cam-close');

    closeBtn.onclick = closeCameraScanner;

    // Start camera
    startCamera(video);
  }

  async function startCamera(video) {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      video.srcObject = cameraStream;
      await video.play();

      // Try using the built-in BarcodeDetector API (Chrome on Android, Edge, etc.)
      startBarcodeDetection(video);
    } catch (e) {
      console.error('Camera error:', e);
      showToast('❌ Could not access camera. ' + e.message, 'error');
      closeCameraScanner();
    }
  }

  async function startBarcodeDetection(video) {
    // Check for BarcodeDetector API support
    if ('BarcodeDetector' in window) {
      try {
        const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code', 'data_matrix', 'itf', 'codabar'] });
        scanWithDetector(video, detector);
        return;
      } catch (e) {
        console.log('BarcodeDetector init failed, trying fallback:', e.message);
      }
    }
    // Fallback: tell user to type the barcode manually
    showToast('📱 Your browser doesn\'t support camera barcode scanning. Type the barcode number in the scanner bar instead.', 'error');
    setTimeout(closeCameraScanner, 3000);
  }

  async function scanWithDetector(video, detector) {
    let attempts = 0;
    const maxAttempts = 60; // Try for ~30 seconds

    async function scan() {
      if (!document.getElementById('ai-camera-scanner')?.classList.contains('open')) return;
      if (attempts >= maxAttempts) {
        showToast('⏱️ Scan timed out. Type the barcode manually.', 'error');
        closeCameraScanner();
        return;
      }
      attempts++;

      try {
        const barcodes = await detector.detect(video);
        if (barcodes.length > 0) {
          const barcode = barcodes[0].rawValue;
          closeCameraScanner();
          // Open scanner bar and lookup
          if (!barcodeBarOpen) toggleBarcodeBar();
          const input = document.getElementById('ai-scanner-input');
          if (input) {
            input.value = barcode;
            doBarcodeLookup(barcode, input);
          }
          return;
        }
      } catch (e) {
        // Detection error, keep trying
      }

      // Scan again every 500ms
      setTimeout(scan, 500);
    }

    scan();
  }

  function closeCameraScanner() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      cameraStream = null;
    }
    clearTimeout(cameraScanTimer);
    const overlay = document.getElementById('ai-camera-scanner');
    if (overlay) {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 500);
    }
  }

  // ==================== AI CHAT ====================

  let chatOpen = false;
  let insightsOpen = false;

  function addChatBubble() {
    const bubble = document.createElement('button');
    bubble.className = 'ai-widget-bubble';
    bubble.id = 'ai-chat-bubble';
    bubble.innerHTML = '🤖';
    bubble.title = 'Ask AI Assistant';
    bubble.addEventListener('click', toggleChat);
    document.body.appendChild(bubble);
  }

  function addInsightsButton() {
    const btn = document.createElement('button');
    btn.className = 'ai-widget-bubble insights-bubble';
    btn.id = 'ai-insights-btn';
    btn.innerHTML = '📊';
    btn.title = 'AI Insights';
    btn.addEventListener('click', toggleInsights);
    document.body.appendChild(btn);
    setTimeout(loadInsightsBadge, 2000);
  }

  function toggleChat() {
    const panel = document.getElementById('ai-chat-panel');
    const insightsPanel = document.getElementById('ai-insights-panel');
    if (insightsOpen && insightsPanel) { insightsPanel.classList.remove('open'); insightsOpen = false; }
    if (!panel) { createChatPanel(); return; }
    chatOpen = !chatOpen;
    panel.classList.toggle('open', chatOpen);
    if (chatOpen) {
      const msgs = panel.querySelector('.ai-chat-messages');
      if (msgs.children.length === 0) {
        addBotMessage("👋 Hi! I'm your AI inventory assistant. Ask me anything about your products!\n\nTry: \"What's expiring this week?\"\n\"Show Lowthers Lane\"\n\"How many items total?\"");
        addQuickSuggestions(panel);
      }
      setTimeout(() => { msgs.scrollTop = msgs.scrollHeight; }, 100);
    }
  }

  function toggleInsights() {
    const panel = document.getElementById('ai-insights-panel');
    const chatPanel = document.getElementById('ai-chat-panel');
    if (chatOpen && chatPanel) { chatPanel.classList.remove('open'); chatOpen = false; }
    if (!panel) { createInsightsPanel(); return; }
    insightsOpen = !insightsOpen;
    panel.classList.toggle('open', insightsOpen);
    if (insightsOpen && panel.querySelector('.ai-insights-content').children.length <= 1) {
      loadInsights(panel);
    }
  }

  function createChatPanel() {
    const panel = document.createElement('div');
    panel.className = 'ai-chat-panel open';
    panel.id = 'ai-chat-panel';
    chatOpen = true;
    panel.innerHTML = `
      <div class="ai-chat-header">
        <h3>🤖 AI Assistant</h3>
        <div class="ai-chat-header-actions">
          <button onclick="document.getElementById('ai-chat-panel').querySelector('.ai-chat-messages').innerHTML = ''; addBotMessage('👋 Chat cleared! Ask me anything.');" title="Clear chat">🗑️</button>
          <button onclick="document.getElementById('ai-chat-panel').classList.remove('open'); chatOpen = false;" title="Close">✕</button>
        </div>
      </div>
      <div class="ai-chat-messages"></div>
      <div class="ai-quick-suggestions" id="ai-quick-sugs"></div>
      <div class="ai-chat-input-area">
        <input type="text" id="ai-chat-input" placeholder="Ask about your inventory..." />
        <button id="ai-chat-send">➤</button>
      </div>
    `;
    document.body.appendChild(panel);
    addBotMessage("👋 Hi! I'm your AI inventory assistant. Ask me anything about your products!\n\nTry: \"What's expiring this week?\"\n\"Show Lowthers Lane\"\n\"How many items total?\"");
    addQuickSuggestions(panel);
    const input = panel.querySelector('#ai-chat-input');
    const sendBtn = panel.querySelector('#ai-chat-send');
    function sendMessage() {
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      addUserMessage(text);
      sendToAI(text);
    }
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });
    setTimeout(() => input.focus(), 300);
  }


  function addBotMessage(text) {
    const panel = document.getElementById('ai-chat-panel');
    if (!panel) return;
    const msgs = panel.querySelector('.ai-chat-messages');
    const div = document.createElement('div');
    div.className = 'ai-msg bot';
    div.innerHTML = text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    div.innerHTML += '<small>AI Assistant</small>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addUserMessage(text) {
    const panel = document.getElementById('ai-chat-panel');
    if (!panel) return;
    const msgs = panel.querySelector('.ai-chat-messages');
    const div = document.createElement('div');
    div.className = 'ai-msg user';
    div.textContent = text;
    div.innerHTML += '<small>You</small>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function addTypingIndicator() {
    const panel = document.getElementById('ai-chat-panel');
    if (!panel) return;
    const msgs = panel.querySelector('.ai-chat-messages');
    const div = document.createElement('div');
    div.className = 'ai-msg bot';
    div.id = 'ai-typing';
    div.innerHTML = '<span class="typing">Thinking</span><span class="typing">.</span><span class="typing">.</span><span class="typing">.</span>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  function removeTypingIndicator() {
    const el = document.getElementById('ai-typing');
    if (el) el.remove();
  }

  async function sendToAI(question) {
    const token = getToken();
    if (!token) { addBotMessage("⚠️ You need to log in first."); return; }
    addTypingIndicator();
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ question })
      });
      removeTypingIndicator();
      if (!res.ok) { addBotMessage("⚠️ Server error: " + res.status); return; }
      const data = await res.json();
      addBotMessage(data.answer || "I don't have an answer for that.");
    } catch (e) {
      removeTypingIndicator();
      addBotMessage("⚠️ Network error.");
      console.error('AI Chat error:', e);
    }
  }

  // === INSIGHTS ===

  function createInsightsPanel() {
    const panel = document.createElement('div');
    panel.className = 'ai-insights-panel open';
    panel.id = 'ai-insights-panel';
    insightsOpen = true;
    panel.innerHTML = `
      <div class="ai-insights-header">
        <h3>📊 AI Insights</h3>
        <button onclick="document.getElementById('ai-insights-panel').classList.remove('open'); insightsOpen = false;">✕</button>
      </div>
      <div class="ai-insights-content"><div class="ai-insight-empty">Loading insights...</div></div>
    `;
    document.body.appendChild(panel);
    loadInsights(panel);
  }

  function loadInsightsBadge() {
    const token = getToken();
    if (!token) return;
    fetch('/api/ai/insights', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(r => r.json())
      .then(data => {
        const btn = document.getElementById('ai-insights-btn');
        if (btn && data.insights && data.insights.filter(i => i.type === 'danger' || i.type === 'warning').length > 0) {
          btn.classList.add('has-insights');
        }
      })
      .catch(() => {});
  }

  function loadInsights(panel) {
    const token = getToken();
    if (!token) { panel.querySelector('.ai-insights-content').innerHTML = '<div class="ai-insight-empty">⚠️ Please log in.</div>'; return; }
    fetch('/api/ai/insights', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(r => r.json())
      .then(data => {
        const content = panel.querySelector('.ai-insights-content');
        if (!data.insights || data.insights.length === 0) {
          content.innerHTML = '<div class="ai-insight-empty">📝 Add some products first!</div>'; return;
        }
        content.innerHTML = data.insights.map(i => `
          <div class="ai-insight-item ${i.type}">
            <span class="ai-insight-icon">${i.icon || '📌'}</span>
            <div class="ai-insight-text">
              <strong>${i.message}</strong>
              ${i.items ? '<br><small>' + i.items.join(', ') + '</small>' : ''}
              ${i.count !== undefined ? '<br><small>Count: ' + i.count + '</small>' : ''}
            </div>
          </div>
        `).join('');
      })
      .catch(() => {
        panel.querySelector('.ai-insights-content').innerHTML = '<div class="ai-insight-empty">⚠️ Could not load insights.</div>';
      });
  }

  // === PRODUCT FORM ENHANCEMENTS (AI categorize + suggest) ===

  function watchForProductForms() {
    const observer = new MutationObserver(() => {
      const nameInput = findNameInput();
      if (nameInput && !nameInput.dataset.aiWatched) {
        nameInput.dataset.aiWatched = 'true';
        setupAutoCategorize(nameInput);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setInterval(() => {
      const nameInput = findNameInput();
      if (nameInput && !nameInput.dataset.aiWatched) {
        nameInput.dataset.aiWatched = 'true';
        setupAutoCategorize(nameInput);
      }
    }, 1000);
  }

  function findNameInput() {
    const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
    for (const input of inputs) {
      if (input.id === 'ai-scanner-input') continue; // skip our own
      const parentText = (input.parentElement?.textContent || '').toLowerCase();
      const placeholder = (input.placeholder || '').toLowerCase();
      const label = input.previousElementSibling?.textContent?.toLowerCase() || '';
      const ariaLabel = (input.getAttribute('aria-label') || '').toLowerCase();
      if (placeholder.includes('product') || placeholder.includes('name') || 
          label.includes('name') || label.includes('product') ||
          ariaLabel.includes('name') || ariaLabel.includes('product') ||
          parentText.includes('name') || parentText.includes('product')) {
        return input;
      }
    }
    return null;
  }

  function setupAutoCategorize(nameInput) {
    let debounceTimer;
    nameInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const existing = document.getElementById('ai-cat-suggestion');
      if (existing) existing.remove();
      const val = nameInput.value.trim();
      if (val.length < 2) return;
      debounceTimer = setTimeout(() => autoCategorize(val, nameInput), 400);
    });
    setTimeout(() => { if (findCategoryInput(nameInput)) nameInput.dataset.categoryInput = 'true'; }, 500);
  }

  function findCategoryInput(nameInput) {
    const form = nameInput.closest('form') || nameInput.closest('[role="dialog"]') || nameInput.closest('.modal') || nameInput.closest('div[class*="form"]');
    if (form) {
      for (const sel of form.querySelectorAll('select')) {
        if (sel.options && sel.options.length > 2) {
          const opts = Array.from(sel.options).map(o => o.text.toLowerCase());
          if (opts.some(o => o === 'other' || o.includes('category') || o.includes('dairy') || o.includes('meat') || o.includes('beverage'))) return sel;
        }
      }
      for (const inp of form.querySelectorAll('input')) {
        if (inp !== nameInput) {
          const ph = (inp.placeholder || '').toLowerCase();
          if (ph.includes('category') || ph.includes('type')) return inp;
        }
      }
    }
    return null;
  }

  function autoCategorize(name, nameInput) {
    const token = getToken();
    if (!token) return;
    fetch('/api/ai/categorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ name })
    })
    .then(r => r.json())
    .then(data => {
      if (data.category && data.category !== 'Other' && data.confidence > 0.5) {
        showCategorySuggestion(nameInput, data.category, data.confidence);
      }
    })
    .catch(() => {});
    if (name.length >= 2) {
      fetch('/api/ai/suggest?q=' + encodeURIComponent(name), { headers: { 'Authorization': 'Bearer ' + token } })
        .then(r => r.json())
        .then(data => { if (data && data.length > 0) showNameSuggestions(nameInput, data); })
        .catch(() => {});
    }
  }

  function showCategorySuggestion(nameInput, category, confidence) {
    setTimeout(() => {
      const categoryInput = findCategoryInput(nameInput);
      if (categoryInput) {
        categoryInput.style.transition = 'background 0.3s';
        categoryInput.style.background = '#e8f5e9';
        categoryInput.title = `AI suggested: ${category} (${Math.round(confidence * 100)}%)`;
        if (categoryInput.tagName === 'SELECT') {
          for (let i = 0; i < categoryInput.options.length; i++) {
            if (categoryInput.options[i].text.toLowerCase() === category.toLowerCase() ||
                categoryInput.options[i].value.toLowerCase() === category.toLowerCase()) {
              categoryInput.selectedIndex = i;
              categoryInput.dispatchEvent(new Event('change', { bubbles: true }));
              break;
            }
          }
        } else if (categoryInput.tagName === 'INPUT') {
          categoryInput.value = category;
          categoryInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        setTimeout(() => { categoryInput.style.background = ''; }, 2000);
      }
    }, 200);
  }

  function showNameSuggestions(nameInput, suggestions) {
    const existing = document.getElementById('ai-name-suggestions');
    if (existing) existing.remove();
    const rect = nameInput.getBoundingClientRect();
    const dropdown = document.createElement('div');
    dropdown.id = 'ai-name-suggestions';
    dropdown.className = 'ai-cat-suggestion';
    dropdown.style.top = (rect.bottom + 4) + 'px';
    dropdown.style.left = rect.left + 'px';
    dropdown.style.width = rect.width + 'px';
    dropdown.innerHTML = suggestions.map(s => `
      <div class="ai-cat-suggestion-item" data-name="${s.name.replace(/"/g, '&quot;')}" data-category="${(s.category || 'Other').replace(/"/g, '&quot;')}">
        <span class="cat-name">${s.name}</span>
        <span class="cat-label">${s.category || 'Other'}</span>
      </div>
    `).join('');
    dropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.ai-cat-suggestion-item');
      if (item) {
        nameInput.value = item.dataset.name;
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
        dropdown.remove();
        setTimeout(() => {
          const catInput = findCategoryInput(nameInput);
          if (catInput && item.dataset.category) {
            if (catInput.tagName === 'SELECT') {
              for (let i = 0; i < catInput.options.length; i++) {
                if (catInput.options[i].text.toLowerCase() === item.dataset.category.toLowerCase()) {
                  catInput.selectedIndex = i;
                  catInput.dispatchEvent(new Event('change', { bubbles: true }));
                  break;
                }
              }
            } else if (catInput.tagName === 'INPUT') {
              catInput.value = item.dataset.category;
              catInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }
        }, 100);
      }
    });
    document.body.appendChild(dropdown);
    setTimeout(() => {
      document.addEventListener('click', function closeHandler(ev) {
        if (!dropdown.contains(ev.target) && ev.target !== nameInput) {
          dropdown.remove();
          document.removeEventListener('click', closeHandler);
        }
      });
    }, 100);
  }

  function watchForNameInputs() {
    const observer = new MutationObserver(() => {
      const modals = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"], [class*="dialog"]');
      for (const modal of modals) {
        if (!modal.dataset.aiModalWatched) {
          modal.dataset.aiModalWatched = 'true';
          setTimeout(() => {
            for (const input of modal.querySelectorAll('input')) {
              const ph = (input.placeholder || '').toLowerCase();
              const ariaLabel = (input.getAttribute('aria-label') || '').toLowerCase();
              if ((ph.includes('name') || ph.includes('product') || ariaLabel.includes('name') || ariaLabel.includes('product')) && !input.dataset.aiWatched) {
                input.dataset.aiWatched = 'true';
                setupAutoCategorize(input);
              }
            }
          }, 200);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  setTimeout(() => {
    const nameInput = findNameInput();
    if (nameInput && !nameInput.dataset.aiWatched) {
      nameInput.dataset.aiWatched = 'true';
      setupAutoCategorize(nameInput);
    }
  }, 2000);

})();

  function addQuickSuggestions(panel) {
    const sugs = panel.querySelector('#ai-quick-sugs');
    if (!sugs) return;
    sugs.innerHTML = [
      'What\'s expiring this week?',
      'Show Lowthers Lane',
      'How many items total?',
      'What categories do I have?',
      'What\'s expired?'
    ].map(s => '<button onclick="var i=document.getElementById(\'ai-chat-input\');var b=document.getElementById(\'ai-chat-send\');if(i){i.value=\'' + s.replace(/'/g, "\\'") + '\';if(b)b.click()}">' + s + '</button>').join('');
    
    // Add backup button
    var backupBtn = document.createElement('button');
    backupBtn.innerHTML = '📧 Email Backup';
    backupBtn.title = 'Send a full backup of your inventory to your email';
    backupBtn.style.background = '#ff7043';
    backupBtn.style.borderColor = '#ff7043';
    backupBtn.style.color = 'white';
    backupBtn.onclick = triggerEmailBackup;
    sugs.appendChild(backupBtn);
  }

  async function triggerEmailBackup() {
    var token = getToken();
    if (!token) {
      showToast('⚠️ Please log in first', 'error');
      return;
    }
    
    addBotMessage('📧 Sending email backup...');
    addTypingIndicator();
    
    try {
      var res = await fetch('/api/backup/email', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token }
      });
      
      removeTypingIndicator();
      
      if (!res.ok) {
        var errData = await res.json().catch(function() { return {}; });
        addBotMessage('⚠️ ' + (errData.error || 'Backup failed. Make sure email is configured.'));
        return;
      }
      
      var data = await res.json();
      addBotMessage('✅ ' + (data.message || 'Backup sent successfully!'));
      showToast('✅ Backup emailed!', null);
    } catch (e) {
      removeTypingIndicator();
      addBotMessage('⚠️ Network error sending backup.');
      console.error('Backup error:', e);
    }
  }
