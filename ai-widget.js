// AI Widget for Expiration Tracker
// Adds AI assistant, smart categorization, and insights to the app

(function() {
  'use strict';

  // Wait for page to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    // Check if user is logged in by looking for auth token
    const token = getToken();
    
    // Inject styles
    injectStyles();
    
    // Add AI bot bubble button
    addChatBubble();
    
    // Add insights button
    addInsightsButton();
    
    // Watch for product add/edit forms to add AI suggestions
    watchForProductForms();
    
    // Watch for product name inputs and add auto-categorize
    watchForNameInputs();
    
    console.log('🤖 AI Assistant loaded');
  }

  function getToken() {
    // Try to get token from localStorage (used by the React app)
    try {
      const token = localStorage.getItem('token');
      if (token) return token;
      
      // Check all localStorage keys for a token
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const val = localStorage.getItem(key);
        if (val && (val.startsWith('eyJ') || (typeof val === 'string' && val.length > 100 && val.includes('.')))) {
          try {
            const parts = val.split('.');
            if (parts.length === 3) return val;
          } catch(e) {}
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

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* AI Widget Styles */
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
      .ai-widget-bubble:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 25px rgba(102, 126, 234, 0.7);
      }
      .ai-widget-bubble.insights-bubble {
        bottom: 90px;
        width: 48px;
        height: 48px;
        font-size: 20px;
        background: linear-gradient(135deg, #f093fb, #f5576c);
        box-shadow: 0 4px 20px rgba(245, 87, 108, 0.4);
      }
      .ai-widget-bubble.insights-bubble:hover {
        box-shadow: 0 6px 25px rgba(245, 87, 108, 0.6);
      }
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
      .ai-chat-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
      .ai-chat-header-actions {
        display: flex;
        gap: 8px;
      }
      .ai-chat-header button {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }
      .ai-chat-header button:hover { background: rgba(255,255,255,0.35); }

      .ai-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 12px 16px;
        background: #f8f9fa;
        scroll-behavior: smooth;
      }
      .ai-chat-messages::-webkit-scrollbar { width: 5px; }
      .ai-chat-messages::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }

      .ai-msg {
        margin-bottom: 12px;
        max-width: 85%;
        padding: 10px 14px;
        border-radius: 14px;
        font-size: 14px;
        line-height: 1.5;
        white-space: pre-wrap;
        animation: aiMsgIn 0.3s ease;
      }
      @keyframes aiMsgIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .ai-msg.bot {
        background: white;
        color: #333;
        align-self: flex-start;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        margin-right: auto;
      }
      .ai-msg.user {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        align-self: flex-end;
        border-bottom-right-radius: 4px;
        margin-left: auto;
      }
      .ai-msg .typing {
        display: inline-block;
        animation: blink 1.4s infinite;
      }
      @keyframes blink {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
      .ai-msg small {
        display: block;
        font-size: 11px;
        opacity: 0.7;
        margin-top: 4px;
      }

      .ai-chat-input-area {
        padding: 10px 12px;
        border-top: 1px solid #e8e8e8;
        display: flex;
        gap: 8px;
        background: white;
      }
      .ai-chat-input-area input {
        flex: 1;
        border: 1px solid #ddd;
        border-radius: 20px;
        padding: 10px 16px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }
      .ai-chat-input-area input:focus {
        border-color: #667eea;
      }
      .ai-chat-input-area button {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
      }
      .ai-chat-input-area button:hover { transform: scale(1.05); }
      .ai-chat-input-area button:disabled { opacity: 0.5; cursor: default; }

      /* Quick suggestions */
      .ai-quick-suggestions {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 8px 12px;
        background: #f0f2ff;
        border-top: 1px solid #e8e8e8;
      }
      .ai-quick-suggestions button {
        background: white;
        border: 1px solid #667eea;
        color: #667eea;
        padding: 5px 12px;
        border-radius: 14px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
      }
      .ai-quick-suggestions button:hover {
        background: #667eea;
        color: white;
      }

      /* Insights panel */
      .ai-insights-panel {
        position: fixed;
        bottom: 150px;
        right: 20px;
        width: 380px;
        max-height: 400px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 60px rgba(0,0,0,0.2);
        z-index: 9996;
        display: none;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid #e0e0e0;
        animation: aiSlideUp 0.3s ease;
      }
      .ai-insights-panel.open { display: flex; }
      .ai-insights-header {
        background: linear-gradient(135deg, #f093fb, #f5576c);
        color: white;
        padding: 12px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .ai-insights-header h3 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
      }
      .ai-insights-header button {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 14px;
      }
      .ai-insights-content {
        flex: 1;
        overflow-y: auto;
        padding: 12px 16px;
        background: #f8f9fa;
      }
      .ai-insight-item {
        background: white;
        border-radius: 10px;
        padding: 10px 14px;
        margin-bottom: 8px;
        display: flex;
        align-items: flex-start;
        gap: 10px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        border-left: 3px solid #667eea;
      }
      .ai-insight-item.danger { border-left-color: #ff4444; }
      .ai-insight-item.warning { border-left-color: #ffa726; }
      .ai-insight-item.info { border-left-color: #42a5f5; }
      .ai-insight-item.stats { border-left-color: #66bb6a; }
      .ai-insight-icon { font-size: 20px; flex-shrink: 0; }
      .ai-insight-text { font-size: 13px; line-height: 1.4; color: #555; }
      .ai-insight-text strong { color: #333; }
      .ai-insight-empty {
        text-align: center;
        color: #999;
        padding: 30px 20px;
        font-size: 14px;
      }

      /* Category suggestion dropdown */
      .ai-cat-suggestion {
        position: absolute;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 10000;
        max-height: 200px;
        overflow-y: auto;
        min-width: 200px;
      }
      .ai-cat-suggestion-item {
        padding: 8px 14px;
        font-size: 13px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #f0f0f0;
        transition: background 0.15s;
      }
      .ai-cat-suggestion-item:hover { background: #f0f2ff; }
      .ai-cat-suggestion-item .cat-name { color: #333; }
      .ai-cat-suggestion-item .cat-label {
        font-size: 11px;
        color: #667eea;
        background: #f0f2ff;
        padding: 2px 8px;
        border-radius: 10px;
      }
      .ai-cat-suggestion-item:last-child { border-bottom: none; }
    `;
    document.head.appendChild(style);
  }

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
    
    // Auto-load insights count
    setTimeout(loadInsightsBadge, 2000);
  }

  let chatOpen = false;
  let insightsOpen = false;

  function toggleChat() {
    const panel = document.getElementById('ai-chat-panel');
    const insightsPanel = document.getElementById('ai-insights-panel');
    
    if (insightsOpen && panel) { insightsPanel.classList.remove('open'); insightsOpen = false; }
    
    if (!panel) {
      createChatPanel();
      return;
    }
    
    chatOpen = !chatOpen;
    panel.classList.toggle('open', chatOpen);
    
    if (chatOpen) {
      // Add welcome message if first open
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
    
    if (!panel) {
      createInsightsPanel();
      return;
    }
    
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
    
    const msgs = panel.querySelector('.ai-chat-messages');
    addBotMessage("👋 Hi! I'm your AI inventory assistant. Ask me anything about your products!\n\nTry: \"What's expiring this week?\"\n\"Show Lowthers Lane\"\n\"How many items total?\"");
    addQuickSuggestions(panel);
    
    // Input handler
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

  function addQuickSuggestions(panel) {
    const sugs = panel.querySelector('#ai-quick-sugs');
    if (!sugs) return;
    const suggestions = [
      'What\'s expiring this week?',
      'Show Lowthers Lane',
      'How many items total?',
      'What categories do I have?',
      'What\'s expired?'
    ];
    sugs.innerHTML = suggestions.map(s => `<button onclick="document.getElementById('ai-chat-input') ? (document.getElementById('ai-chat-input').value = '${s.replace(/'/g, "\\'")}', document.getElementById('ai-chat-send').click()) : null">${s}</button>`).join('');
    
    // Add barcode button
    const barcodeBtn = document.createElement('button');
    barcodeBtn.innerHTML = '📷 Scan Barcode';
    barcodeBtn.title = 'Look up a product by barcode';
    barcodeBtn.style.background = '#4caf50';
    barcodeBtn.style.borderColor = '#4caf50';
    barcodeBtn.style.color = 'white';
    barcodeBtn.onclick = showBarcodeInput;
    sugs.appendChild(barcodeBtn);
  }

  function showBarcodeInput() {
    const panel = document.getElementById('ai-chat-panel');
    if (!panel) return;
    
    // Check if barcode input already showing
    const existing = document.getElementById('ai-barcode-area');
    if (existing) { existing.remove(); return; }
    
    const area = document.createElement('div');
    area.id = 'ai-barcode-area';
    area.style.cssText = 'padding:10px 12px;background:#f0fff0;border-top:1px solid #c8e6c9;display:flex;gap:8px;align-items:center;animation:aiSlideUp 0.3s ease;';
    area.innerHTML = `
      <span style="font-size:20px;">📷</span>
      <input type="text" id="ai-barcode-input" placeholder="Enter or scan barcode number..." 
        style="flex:1;border:2px solid #4caf50;border-radius:20px;padding:8px 14px;font-size:14px;outline:none;" />
      <button id="ai-barcode-lookup-btn" style="background:#4caf50;color:white;border:none;border-radius:20px;padding:8px 16px;cursor:pointer;font-size:13px;font-weight:600;">Look Up</button>
      <button id="ai-barcode-close" style="background:transparent;border:none;font-size:18px;cursor:pointer;color:#999;">✕</button>
    `;
    
    // Insert before the chat input area
    const inputArea = panel.querySelector('.ai-chat-input-area');
    panel.insertBefore(area, inputArea);
    
    const input = area.querySelector('#ai-barcode-input');
    const lookupBtn = area.querySelector('#ai-barcode-lookup-btn');
    const closeBtn = area.querySelector('#ai-barcode-close');
    
    lookupBtn.onclick = () => lookupBarcode(input.value.trim());
    closeBtn.onclick = () => area.remove();
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') lookupBarcode(input.value.trim());
    });
    
    setTimeout(() => input.focus(), 200);
  }

  async function lookupBarcode(barcode) {
    if (!barcode || barcode.length < 5) {
      addBotMessage("⚠️ Please enter a valid barcode number (at least 5 digits).");
      return;
    }
    
    const token = getToken();
    if (!token) {
      addBotMessage("⚠️ Please log in to use barcode lookup.");
      return;
    }
    
    // Clean barcode
    barcode = barcode.replace(/\D/g, '');
    if (barcode.length < 5) {
      addBotMessage("⚠️ Invalid barcode. Numbers only, please.");
      return;
    }
    
    addBotMessage(`🔍 Looking up barcode **${barcode}**...`);
    addTypingIndicator();
    
    try {
      const res = await fetch(`/api/lookup-barcode?barcode=${encodeURIComponent(barcode)}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      
      removeTypingIndicator();
      
      if (!res.ok) {
        addBotMessage("⚠️ Server error looking up barcode.");
        return;
      }
      
      const data = await res.json();
      
      if (data.found) {
        const sourceLabel = data.cached ? '📦 (from local cache)' : '🌐 (from Open Food Facts)';
        let msg = `✅ **Product Found!** ${sourceLabel}\n\n`;
        msg += `**Name:** ${data.name}\n`;
        msg += `**Category:** ${data.category}\n`;
        msg += `**Barcode:** ${barcode}\n\n`;
        msg += `💡 **Next steps:**\n`;
        msg += `1. Copy the **name** and **category** above\n`;
        msg += `2. Add this product to your inventory\n`;
        msg += `3. Set the expiry date and store quantities`;
        
        if (data.imageUrl) {
          msg += `\n\n📸 Product image available!`;
        }
        
        addBotMessage(msg);
        
        // Show quick actions
        setTimeout(() => {
          const sugs = document.querySelector('#ai-quick-sugs');
          if (sugs) {
            const old = sugs.querySelectorAll('.barcode-action');
            old.forEach(el => el.remove());
            
            const addBtn = document.createElement('button');
            addBtn.className = 'barcode-action';
            addBtn.style.background = '#667eea';
            addBtn.style.color = 'white';
            addBtn.style.borderColor = '#667eea';
            addBtn.textContent = `➕ Add "${data.name.substring(0, 20)}..."`;
            addBtn.onclick = () => {
              addBotMessage(`To add **${data.name}** (${data.category}) to your inventory, use the **Add Product** button in the main app. Enter:\n\n📛 Name: ${data.name}\n🏷️ Category: ${data.category}\n🔢 Barcode: ${barcode}\n📅 Expiry: (set a date)\n🏪 Store quantities: (enter per store)`);
            };
            sugs.appendChild(addBtn);
          }
        }, 500);
      } else {
        addBotMessage(`❌ **Product not found** for barcode **${barcode}**.\n\nThis product isn't in the Open Food Facts database. You can still add it manually:\n1. Enter the product name yourself\n2. The AI will suggest a category\n3. Set expiry date and store quantities`);
      }
    } catch (e) {
      removeTypingIndicator();
      addBotMessage("⚠️ Network error looking up barcode. Check your connection.");
      console.error('Barcode lookup error:', e);
    }
    
    // Close barcode input
    const area = document.getElementById('ai-barcode-area');
    if (area) area.remove();
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
    if (!token) {
      addBotMessage("⚠️ You need to log in first to use the AI assistant.");
      return;
    }
    
    addTypingIndicator();
    
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ question })
      });
      
      removeTypingIndicator();
      
      if (!res.ok) {
        addBotMessage("⚠️ Sorry, I couldn't get an answer. Server error: " + res.status);
        return;
      }
      
      const data = await res.json();
      addBotMessage(data.answer || "I don't have an answer for that yet.");
    } catch (e) {
      removeTypingIndicator();
      addBotMessage("⚠️ Network error. Make sure you're connected to the server.");
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
        <button onclick="document.getElementById('ai-insights-panel').classList.remove('open'); insightsOpen = false;" title="Close">✕</button>
      </div>
      <div class="ai-insights-content">
        <div class="ai-insight-empty">Loading insights...</div>
      </div>
    `;
    
    document.body.appendChild(panel);
    loadInsights(panel);
  }

  function loadInsightsBadge() {
    const token = getToken();
    if (!token) return;
    
    fetch('/api/ai/insights', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(r => r.json())
    .then(data => {
      const btn = document.getElementById('ai-insights-btn');
      if (btn && data.insights) {
        const warnings = data.insights.filter(i => i.type === 'danger' || i.type === 'warning');
        if (warnings.length > 0) {
          btn.classList.add('has-insights');
        }
      }
    })
    .catch(() => {});
  }

  function loadInsights(panel) {
    const token = getToken();
    if (!token) {
      panel.querySelector('.ai-insights-content').innerHTML = '<div class="ai-insight-empty">⚠️ Please log in to view insights.</div>';
      return;
    }
    
    fetch('/api/ai/insights', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(r => r.json())
    .then(data => {
      const content = panel.querySelector('.ai-insights-content');
      
      if (!data.insights || data.insights.length === 0) {
        content.innerHTML = '<div class="ai-insight-empty">📝 No insights available. Add some products first!</div>';
        return;
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
    .catch(e => {
      panel.querySelector('.ai-insights-content').innerHTML = '<div class="ai-insight-empty">⚠️ Could not load insights. Check your connection.</div>';
      console.error('Insights error:', e);
    });
  }

  // === PRODUCT FORM ENHANCEMENTS ===

  function watchForProductForms() {
    // Watch for any form or modal that has product name input
    const observer = new MutationObserver(() => {
      // Check if a product add/edit modal is showing
      const nameInput = findNameInput();
      if (nameInput && !nameInput.dataset.aiWatched) {
        nameInput.dataset.aiWatched = 'true';
        setupAutoCategorize(nameInput);
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Also check periodically for name inputs
    setInterval(() => {
      const nameInput = findNameInput();
      if (nameInput && !nameInput.dataset.aiWatched) {
        nameInput.dataset.aiWatched = 'true';
        setupAutoCategorize(nameInput);
      }
    }, 1000);
  }

  function findNameInput() {
    // Try to find the product name input field in the React app
    // Look for common patterns
    const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
    for (const input of inputs) {
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
      const val = nameInput.value.trim();
      
      // Remove existing suggestion dropdown
      const existing = document.getElementById('ai-cat-suggestion');
      if (existing) existing.remove();
      
      if (val.length < 2) return;
      
      debounceTimer = setTimeout(() => {
        autoCategorize(val, nameInput);
      }, 400);
    });
    
    // Also look for category select/input and mark it
    setTimeout(() => {
      const categoryInput = findCategoryInput(nameInput);
      if (categoryInput) {
        nameInput.dataset.categoryInput = 'true';
      }
    }, 500);
  }

  function findCategoryInput(nameInput) {
    // Look for a category select or input near the name input
    const form = nameInput.closest('form') || nameInput.closest('[role="dialog"]') || nameInput.closest('.modal') || nameInput.closest('div[class*="form"]');
    if (form) {
      const selects = form.querySelectorAll('select');
      for (const sel of selects) {
        if (sel.options && sel.options.length > 2) {
          const opts = Array.from(sel.options).map(o => o.text.toLowerCase());
          if (opts.some(o => o === 'other' || o.includes('category') || o.includes('dairy') || o.includes('meat') || o.includes('beverage'))) {
            return sel;
          }
        }
      }
      const inputs = form.querySelectorAll('input');
      for (const inp of inputs) {
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
    
    // Also get suggestions for product name autocomplete
    if (name.length >= 2) {
      fetch('/api/ai/suggest?q=' + encodeURIComponent(name), {
        headers: { 'Authorization': 'Bearer ' + token }
      })
      .then(r => r.json())
      .then(data => {
        if (data && data.length > 0) {
          showNameSuggestions(nameInput, data);
        }
      })
      .catch(() => {});
    }
  }

  function showCategorySuggestion(nameInput, category, confidence) {
    // Try to find the category dropdown
    setTimeout(() => {
      const categoryInput = findCategoryInput(nameInput);
      if (categoryInput) {
        // Flash the category to show it was suggested
        categoryInput.style.transition = 'background 0.3s';
        categoryInput.style.background = '#e8f5e9';
        categoryInput.title = `AI suggested: ${category} (${Math.round(confidence * 100)}% confidence)`;
        
        // If it's a select, try to select the right option
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
        
        setTimeout(() => {
          categoryInput.style.background = '';
        }, 2000);
        
        // Show a small badge near the name input
        const badge = document.createElement('span');
        badge.className = 'ai-cat-badge';
        badge.style.cssText = 'position:absolute;right:-8px;top:-8px;background:#4caf50;color:white;font-size:10px;padding:2px 6px;border-radius:8px;z-index:1000';
        badge.textContent = 'AI';
        
        const existingBadge = nameInput.parentElement?.querySelector('.ai-cat-badge');
        if (existingBadge) existingBadge.remove();
        
        if (nameInput.parentElement && nameInput.parentElement.style.position !== 'relative') {
          nameInput.parentElement.style.position = 'relative';
        }
        nameInput.parentElement?.appendChild(badge);
        setTimeout(() => badge.remove(), 3000);
      }
    }, 200);
  }

  function showNameSuggestions(nameInput, suggestions) {
    // Remove existing dropdown
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
        
        // Also set category if we can
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
    
    // Close on click outside
    setTimeout(() => {
      document.addEventListener('click', function closeHandler(ev) {
        if (!dropdown.contains(ev.target) && ev.target !== nameInput) {
          dropdown.remove();
          document.removeEventListener('click', closeHandler);
        }
      });
    }, 100);
  }

  // Watch for product name inputs even before forms are shown
  function watchForNameInputs() {
    // Also monitor for modals/dialogs appearing
    const observer = new MutationObserver(() => {
      // Check if any modal/dialog appeared
      const modals = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"], [class*="dialog"]');
      for (const modal of modals) {
        if (!modal.dataset.aiModalWatched) {
          modal.dataset.aiModalWatched = 'true';
          // Look for name inputs inside
          setTimeout(() => {
            const inputs = modal.querySelectorAll('input');
            for (const input of inputs) {
              const ph = (input.placeholder || '').toLowerCase();
              const ariaLabel = (input.getAttribute('aria-label') || '').toLowerCase();
              if (ph.includes('name') || ph.includes('product') || ariaLabel.includes('name') || ariaLabel.includes('product')) {
                if (!input.dataset.aiWatched) {
                  input.dataset.aiWatched = 'true';
                  setupAutoCategorize(input);
                }
              }
            }
          }, 200);
        }
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Call initial check after the React app has loaded
  setTimeout(() => {
    const nameInput = findNameInput();
    if (nameInput && !nameInput.dataset.aiWatched) {
      nameInput.dataset.aiWatched = 'true';
      setupAutoCategorize(nameInput);
    }
  }, 2000);

})();
