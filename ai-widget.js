// AI Widget for Expiration Tracker
// Clean build - all features in one file

(function() {
'use strict';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

function boot() {
  addStyles();
  addScanner();        // 📷 Barcode scanner bar + camera
  addChat();            // 🤖 AI chat assistant
  addInsights();        // 📊 AI insights
  addSearchBar();       // 🔍 Product search
  addSuggester();       // 🧠 Auto-suggest product names

  // Re-check after React loads
  setTimeout(addSuggester, 2000);
  setTimeout(addSuggester, 4000);
  console.log('✅ AI Widget loaded');
}

// ==================== TOKEN HELPERS ====================

function token() {
  try {
    var t = localStorage.getItem('token');
    if (t) return t;
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i), v = localStorage.getItem(k);
      if (v && v.length > 100 && v.indexOf('.') > -1) {
        var p = v.split('.');
        if (p.length === 3) return v;
      }
    }
  } catch(e) {}
  return null;
}

function user() {
  try {
    var t = token();
    if (t) return JSON.parse(atob(t.split('.')[1])).username || 'User';
  } catch(e) {}
  return 'User';
}

// ==================== TOAST ====================

function toast(msg, type) {
  var e = document.querySelector('.ai-toast');
  if (e) e.remove();
  var d = document.createElement('div');
  d.className = 'ai-toast' + (type === 'error' ? ' err' : '');
  d.innerHTML = '<div class="ai-toast-inner">' + msg + '<button class="ai-toast-x">✕</button></div>';
  d.querySelector('.ai-toast-x').onclick = function() { d.remove(); };
  document.body.appendChild(d);
  setTimeout(function() { if (d.parentNode) d.remove(); }, type === 'error' ? 6000 : 4000);
}

// ==================== STYLES ====================

function addStyles() {
  var s = document.createElement('style');
  s.textContent = `

/* === TOAST === */
.ai-toast {
  position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
  background: #1a1a2e; border: 2px solid #4caf50; border-radius: 12px;
  padding: 12px 20px; z-index: 100000; max-width: 500px; width: 90%;
  box-shadow: 0 8px 40px rgba(0,0,0,0.5); animation: aifade .3s ease;
}
.ai-toast.err { border-color: #ff5252; }
.ai-toast-inner { color: #fff; font-size: 14px; line-height: 1.5; padding-right: 24px; }
.ai-toast-x { position: absolute; top: 8px; right: 10px; background: none; border: none; color: #888; font-size: 18px; cursor: pointer; }
@keyframes aifade { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

/* === SCANNER BAR === */
#ai-sbar {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 99999;
  background: #1a1a2e; border-top: 3px solid #4caf50;
  padding: 8px 14px; display: flex; align-items: center; gap: 8px;
  transform: translateY(100%); transition: transform .3s;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
}
#ai-sbar.open { transform: translateY(0); }
#ai-sbar .lbl { color: #4caf50; font-size: 13px; font-weight: 700; white-space: nowrap; display: flex; align-items: center; gap: 4px; }
#ai-sbar input {
  flex: 1; padding: 10px 14px; border: 2px solid #4caf50; border-radius: 10px;
  font-size: 18px; font-family: monospace; letter-spacing: 2px;
  outline: none; background: #16213e; color: #fff;
  transition: border-color .2s, box-shadow .2s;
}
#ai-sbar input:focus { border-color: #66bb6a; box-shadow: 0 0 0 3px rgba(76,175,80,0.3); }
#ai-sbar input.ok { border-color: #66bb6a; background: #1b5e20; box-shadow: 0 0 15px rgba(76,175,80,0.5); }
#ai-sbar input.er { border-color: #ff5252; background: #4a1a1a; box-shadow: 0 0 15px rgba(255,82,82,0.5); }
#ai-sbar .st { font-size: 12px; color: #888; white-space: nowrap; padding: 4px 10px; background: #0d1b2a; border-radius: 6px; display: flex; align-items: center; gap: 6px; }
#ai-sbar .st .d { width: 8px; height: 8px; border-radius: 50%; background: #4caf50; animation: aip 1.5s infinite; }
@keyframes aip { 0%,100% { opacity: 1; } 50% { opacity: .5; } }
#ai-sbar .btn {
  background: #4caf50; color: white; border: none; border-radius: 10px;
  padding: 10px 14px; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap;
}
#ai-sbar .btn:hover { background: #43a047; }
#ai-sbar .btn.cam { background: #7c4dff; }
#ai-sbar .btn.cam:hover { background: #651fff; }
#ai-sbar .btn.x { background: transparent; color: #999; padding: 8px; font-size: 20px; }
#ai-sbar .btn.x:hover { color: #fff; background: rgba(255,255,255,0.1); }

#ai-scan-toggle {
  position: fixed; bottom: 160px; right: 20px; z-index: 99998;
  width: 48px; height: 48px; border-radius: 50%;
  background: linear-gradient(135deg,#4caf50,#2e7d32); color: white;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; box-shadow: 0 4px 20px rgba(76,175,80,0.5);
  border: none; font-size: 20px; transition: transform .3s, box-shadow .3s;
}
#ai-scan-toggle:hover { transform: scale(1.1); box-shadow: 0 6px 25px rgba(76,175,80,0.7); }
#ai-scan-toggle.on { background: linear-gradient(135deg,#ff5252,#d32f2f); }

/* === CHAT === */
#ai-chat-btn {
  position: fixed; bottom: 20px; right: 20px; z-index: 99998;
  width: 56px; height: 56px; border-radius: 50%;
  background: linear-gradient(135deg,#667eea,#764ba2); color: white;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; box-shadow: 0 4px 20px rgba(102,126,234,0.5);
  border: none; font-size: 24px; transition: transform .3s, box-shadow .3s;
}
#ai-chat-btn:hover { transform: scale(1.1); box-shadow: 0 6px 25px rgba(102,126,234,0.7); }

#ai-ins-btn {
  position: fixed; bottom: 90px; right: 20px; z-index: 99998;
  width: 48px; height: 48px; border-radius: 50%;
  background: linear-gradient(135deg,#f093fb,#f5576c); color: white;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; box-shadow: 0 4px 20px rgba(245,87,108,0.4);
  border: none; font-size: 20px; transition: transform .3s, box-shadow .3s;
}
#ai-ins-btn:hover { transform: scale(1.1); box-shadow: 0 6px 25px rgba(245,87,108,0.6); }
#ai-ins-btn.has-dot::after {
  content: ''; position: absolute; top: -2px; right: -2px;
  width: 14px; height: 14px; background: #ff4444; border-radius: 50%; border: 2px solid white;
}

.ai-panel {
  position: fixed; bottom: 90px; right: 20px; z-index: 99997;
  width: 380px; height: 520px; background: white; border-radius: 16px;
  box-shadow: 0 10px 60px rgba(0,0,0,0.2); border: 1px solid #e0e0e0;
  display: none; flex-direction: column; overflow: hidden; animation: aisl .3s ease;
}
.ai-panel.open { display: flex; }
@keyframes aisl { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.ai-panel .hd {
  background: linear-gradient(135deg,#667eea,#764ba2); color: white;
  padding: 14px 16px; display: flex; justify-content: space-between; align-items: center;
}
.ai-panel .hd h3 { margin: 0; font-size: 16px; font-weight: 600; }
.ai-panel .hd .ha { display: flex; gap: 8px; }
.ai-panel .hd button {
  background: rgba(255,255,255,0.2); border: none; color: white;
  width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
}
.ai-panel .hd button:hover { background: rgba(255,255,255,0.35); }

.ai-msgs {
  flex: 1; overflow-y: auto; padding: 12px 16px; background: #f8f9fa;
}
.ai-msgs::-webkit-scrollbar { width: 5px; }
.ai-msgs::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }

.ai-msg {
  margin-bottom: 12px; max-width: 85%; padding: 10px 14px; border-radius: 14px;
  font-size: 14px; line-height: 1.5; white-space: pre-wrap; animation: aisl .3s ease;
}
.ai-msg.bot { background: white; color: #333; align-self: flex-start; border-bottom-left-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); margin-right: auto; }
.ai-msg.usr { background: linear-gradient(135deg,#667eea,#764ba2); color: white; align-self: flex-end; border-bottom-right-radius: 4px; margin-left: auto; }
.ai-msg .ty { display: inline-block; animation: aibl 1.4s infinite; }
@keyframes aibl { 0%,100% { opacity: .3; } 50% { opacity: 1; } }
.ai-msg sm { display: block; font-size: 11px; opacity: .7; margin-top: 4px; }

.ai-inp {
  padding: 10px 12px; border-top: 1px solid #e8e8e8; display: flex; gap: 8px; background: white;
}
.ai-inp input {
  flex: 1; border: 1px solid #ddd; border-radius: 20px; padding: 10px 16px; font-size: 14px; outline: none;
}
.ai-inp input:focus { border-color: #667eea; }
.ai-inp button {
  background: linear-gradient(135deg,#667eea,#764ba2); color: white; border: none; border-radius: 50%;
  width: 40px; height: 40px; cursor: pointer; font-size: 16px;
  display: flex; align-items: center; justify-content: center;
}
.ai-inp button:hover { transform: scale(1.05); }
.ai-inp button:disabled { opacity: .5; cursor: default; }

.ai-sugs {
  display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 12px;
  background: #f0f2ff; border-top: 1px solid #e8e8e8;
}
.ai-sugs button {
  background: white; border: 1px solid #667eea; color: #667eea; padding: 5px 12px;
  border-radius: 14px; font-size: 12px; cursor: pointer; white-space: nowrap;
}
.ai-sugs button:hover { background: #667eea; color: white; }
.ai-sugs button.bu { background: #ff7043; border-color: #ff7043; color: white; }
.ai-sugs button.bu:hover { background: #f4511e; }

/* === INSIGHTS === */
#ai-ins-panel.ai-panel { max-height: 400px; height: auto; }
#ai-ins-panel .hd { background: linear-gradient(135deg,#f093fb,#f5576c); }
.ai-ins-c { flex: 1; overflow-y: auto; padding: 12px 16px; background: #f8f9fa; }
.ai-ins-item {
  background: white; border-radius: 10px; padding: 10px 14px; margin-bottom: 8px;
  display: flex; align-items: flex-start; gap: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06); border-left: 3px solid #667eea;
}
.ai-ins-item.d { border-left-color: #ff4444; }
.ai-ins-item.w { border-left-color: #ffa726; }
.ai-ins-item.i { border-left-color: #42a5f5; }
.ai-ins-item.s { border-left-color: #66bb6a; }
.ai-ins-ic { font-size: 20px; flex-shrink: 0; }
.ai-ins-tx { font-size: 13px; line-height: 1.4; color: #555; }
.ai-ins-tx b { color: #333; }
.ai-ins-em { text-align: center; color: #999; padding: 30px 20px; font-size: 14px; }

/* === SEARCH BAR === */
#ai-srch {
  position: sticky; top: 0; z-index: 100; background: #f8f9fa;
  padding: 10px 16px; border-bottom: 1px solid #e0e0e0; display: none;
}
#ai-srch.vis { display: block; }
#ai-srch input {
  width: 100%; padding: 10px 14px 10px 40px; border: 2px solid #667eea;
  border-radius: 10px; font-size: 15px; outline: none;
  background: white url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23667eea' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'/%3E%3C/svg%3E") 12px center no-repeat;
  background-size: 18px; box-sizing: border-box;
}
#ai-srch input:focus { border-color: #764ba2; box-shadow: 0 0 0 3px rgba(102,126,234,0.2); }
#ai-srch .cnt { font-size: 12px; color: #888; margin-top: 6px; text-align: right; }
#ai-srch .cnt b { color: #667eea; }
.ai-srch-hi { background: #fff9c4 !important; }
.ai-srch-hid { display: none !important; }

/* === SUGGESTION DROPDOWN === */
.ai-sgst {
  position: absolute; background: white; border: 1px solid #ddd;
  border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  z-index: 100000; max-height: 200px; overflow-y: auto; min-width: 200px;
}
.ai-sgst-item {
  padding: 8px 14px; font-size: 13px; cursor: pointer;
  display: flex; justify-content: space-between; align-items: center;
  border-bottom: 1px solid #f0f0f0;
}
.ai-sgst-item:hover { background: #f0f2ff; }
.ai-sgst-item .nm { color: #333; }
.ai-sgst-item .cat {
  font-size: 11px; color: #667eea; background: #f0f2ff;
  padding: 2px 8px; border-radius: 10px;
}
.ai-sgst-item:last-child { border-bottom: none; }

/* === CAMERA OVERLAY === */
#ai-cam {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.9); z-index: 100001;
  display: none; flex-direction: column; align-items: center; justify-content: center;
}
#ai-cam.on { display: flex; }
#ai-cam video { max-width: 100%; max-height: 80vh; border-radius: 12px; box-shadow: 0 0 40px rgba(76,175,80,0.3); }
#ai-cam .ch {
  position: absolute; top: 20px; left: 0; right: 0; text-align: center;
  color: white; font-size: 18px; font-weight: 600;
}
#ai-cam .ch sm { display: block; font-size: 13px; color: #888; font-weight: 400; margin-top: 4px; }
#ai-cam .cx {
  position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.2);
  border: none; color: white; width: 44px; height: 44px; border-radius: 50%;
  font-size: 22px; cursor: pointer; display: flex; align-items: center; justify-content: center;
}
#ai-cam .cx:hover { background: rgba(255,255,255,0.35); }
#ai-cam .sr {
  position: absolute; border: 2px dashed rgba(76,175,80,0.6); border-radius: 12px;
  width: 250px; height: 120px; pointer-events: none;
  animation: aipb 2s infinite;
}
@keyframes aipb { 0%,100% { border-color: rgba(76,175,80,0.6); } 50% { border-color: rgba(76,175,80,0.2); } }

`;
  document.head.appendChild(s);
}

// ==================== SCANNER ====================

var sbarOpen = false;

function addScanner() {
  // Toggle button
  var tog = document.createElement('button');
  tog.id = 'ai-scan-toggle';
  tog.textContent = '📷';
  tog.title = 'Toggle Barcode Scanner (Ctrl+Shift+B)';
  tog.onclick = toggleSBar;
  document.body.appendChild(tog);

  // Bar
  var bar = document.createElement('div');
  bar.id = 'ai-sbar';
  bar.innerHTML = '<span class="lbl">📷 Scanner</span>' +
    '<input type="text" id="ai-si" placeholder="Scan or type barcode..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">' +
    '<span class="st"><span class="d"></span><span class="stx">Ready</span></span>' +
    '<button class="btn cam" id="ai-cam-btn">📸 Camera</button>' +
    '<button class="btn" id="ai-lu-btn">🔍 Look Up</button>' +
    '<button class="btn x" id="ai-sbx">✕</button>';
  document.body.appendChild(bar);

  var inp = document.getElementById('ai-si');
  var lookBtn = document.getElementById('ai-lu-btn');
  var camBtn = document.getElementById('ai-cam-btn');
  var closeBtn = document.getElementById('ai-sbx');

  // Enter key
  inp.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      var v = inp.value.trim();
      if (v) scan(v, inp);
    }
  });

  // Fast scanner detection
  var lastT = 0, st;
  inp.addEventListener('input', function() {
    var now = Date.now();
    if (now - lastT < 80 && inp.value.length > 5) {
      clearTimeout(st);
      st = setTimeout(function() {
        var v = inp.value.trim();
        if (v.length > 5) scan(v, inp);
      }, 100);
    }
    lastT = now;
  });

  lookBtn.onclick = function() { var v = inp.value.trim(); if (v) scan(v, inp); };
  camBtn.onclick = openCam;
  closeBtn.onclick = toggleSBar;

  // Focus when opens
  var mo = new MutationObserver(function() {
    if (bar.classList.contains('open')) setTimeout(function() { inp.focus(); }, 200);
  });
  mo.observe(bar, { attributes: true, attributeFilter: ['class'] });

  // Shortcut
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && (e.key === 'b' || e.key === 'B')) {
      e.preventDefault(); toggleSBar();
    }
  });
}

function toggleSBar() {
  var bar = document.getElementById('ai-sbar');
  var tog = document.getElementById('ai-scan-toggle');
  if (!bar) return;
  sbarOpen = !sbarOpen;
  bar.classList.toggle('open', sbarOpen);
  if (tog) { tog.classList.toggle('on', sbarOpen); tog.textContent = sbarOpen ? '✕' : '📷'; }
}

function sbarSt(text, color) {
  var bar = document.getElementById('ai-sbar');
  if (!bar) return;
  var stx = bar.querySelector('.stx');
  var d = bar.querySelector('.d');
  if (stx) stx.textContent = text;
  if (d) d.style.background = color || '#4caf50';
}

function flashInp(inp, ok) {
  inp.classList.remove('ok', 'er');
  void inp.offsetWidth;
  inp.classList.add(ok ? 'ok' : 'er');
  setTimeout(function() { inp.classList.remove('ok', 'er'); }, 500);
}

async function scan(barcode, inp) {
  var t = token();
  if (!t) { toast('⚠️ Please log in first', 'error'); return; }
  var c = barcode.replace(/\D/g, '');
  if (c.length < 5) { flashInp(inp, false); toast('❌ Invalid barcode', 'error'); return; }
  inp.value = c; flashInp(inp, true); sbarSt('🔍 Looking up...', '#ffa726');
  try {
    var r = await fetch('/api/lookup-barcode?barcode=' + encodeURIComponent(c), { headers: { 'Authorization': 'Bearer ' + t } });
    if (!r.ok) { sbarSt('❌ Server error', '#ff5252'); flashInp(inp, false); return; }
    var d = await r.json();
    if (d.found) {
      sbarSt('✅ ' + d.name.substring(0, 30), '#4caf50');
      inp.value = '';
      showBarcodeResult(d, c);
      setTimeout(function() { sbarSt('Ready', '#4caf50'); }, 3000);
    } else {
      sbarSt('❌ Not found', '#ff5252');
      flashInp(inp, false);
      toast('❌ Product not found for barcode ' + c, 'error');
      setTimeout(function() { sbarSt('Ready', '#4caf50'); }, 3000);
    }
  } catch(e) {
    sbarSt('❌ Network error', '#ff5252');
    flashInp(inp, false);
    toast('⚠️ Network error', 'error');
    setTimeout(function() { sbarSt('Ready', '#4caf50'); }, 3000);
  }
}

function showBarcodeResult(data, barcode) {
  var d = document.createElement('div');
  d.className = 'ai-toast';
  d.style.borderColor = '#4caf50';
  d.style.bottom = '200px';
  d.innerHTML = '<div class="ai-toast-inner">' +
    '<b>✅ ' + data.name + '</b><br>Category: ' + data.category + '<br>Barcode: ' + barcode +
    (data.imageUrl ? '<br><sm>📸 Image available</sm>' : '') +
    '</div>' +
    '<button class="ai-toast-x">✕</button>' +
    '<div style="margin-top:10px;display:flex;gap:8px">' +
    '<button onclick="this.closest(\'.ai-toast\').remove();(function(){var e=document.querySelector(\'button\');if(e&&e.textContent.toLowerCase().includes(\'add\'))e.click()})()" style="background:#4caf50;color:white;border:none;padding:6px 14px;border-radius:8px;cursor:pointer;font-weight:600">➕ Add to Inventory</button>' +
    '<button onclick="this.closest(\'.ai-toast\').remove()" style="background:rgba(255,255,255,0.1);color:#ccc;border:none;padding:6px 14px;border-radius:8px;cursor:pointer">OK</button>' +
    '</div>';
  d.querySelector('.ai-toast-x').onclick = function() { d.remove(); };
  document.body.appendChild(d);
  setTimeout(function() { if (d.parentNode) d.remove(); }, 15000);
}

// ==================== CAMERA ====================

var camStream = null;

function openCam() {
  if (sbarOpen) toggleSBar();
  var ov = document.getElementById('ai-cam');
  if (ov) { ov.classList.add('on'); return; }
  ov = document.createElement('div'); ov.id = 'ai-cam'; ov.className = 'on';
  ov.innerHTML = '<div class="ch">📸 Point camera at barcode<sm>Auto-detects and looks up the product</sm></div><div class="sr"></div><video id="ai-cam-v" autoplay playsinline></video><button class="cx">✕</button>';
  document.body.appendChild(ov);
  ov.querySelector('.cx').onclick = closeCam;
  startCam(ov.querySelector('#ai-cam-v'));
}

async function startCam(v) {
  try {
    camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } });
    v.srcObject = camStream;
    await v.play();
    if ('BarcodeDetector' in window) {
      try {
        var det = new BarcodeDetector({ formats: ['ean_13','ean_8','upc_a','upc_e','code_128','code_39','qr_code','data_matrix','itf','codabar'] });
        scanCam(v, det); return;
      } catch(e) {}
    }
    toast('📱 Browser doesn\'t support camera scanning. Type barcode in scanner bar.', 'error');
    setTimeout(closeCam, 3000);
  } catch(e) {
    toast('❌ Camera access denied: ' + e.message, 'error');
    closeCam();
  }
}

function scanCam(v, det) {
  var at = 0;
  function loop() {
    if (!document.getElementById('ai-cam')?.classList.contains('on')) return;
    if (at >= 60) { toast('⏱️ Scan timed out', 'error'); closeCam(); return; }
    at++;
    det.detect(v).then(function(b) {
      if (b.length > 0) {
        var code = b[0].rawValue;
        closeCam();
        if (!sbarOpen) toggleSBar();
        var inp = document.getElementById('ai-si');
        if (inp) { inp.value = code; scan(code, inp); }
      } else {
        setTimeout(loop, 500);
      }
    }).catch(function() { setTimeout(loop, 500); });
  }
  loop();
}

function closeCam() {
  if (camStream) { camStream.getTracks().forEach(function(t) { t.stop(); }); camStream = null; }
  var ov = document.getElementById('ai-cam');
  if (ov) { ov.classList.remove('on'); setTimeout(function() { if (ov.parentNode) ov.remove(); }, 500); }
}

// ==================== AI CHAT ====================

var chatOpen = false, insOpen = false;

function addChat() {
  var b = document.createElement('button'); b.id = 'ai-chat-btn'; b.textContent = '🤖';
  b.title = 'AI Assistant'; b.onclick = toggleChat;
  document.body.appendChild(b);
}

function addInsights() {
  var b = document.createElement('button'); b.id = 'ai-ins-btn'; b.textContent = '📊';
  b.title = 'AI Insights'; b.onclick = toggleIns;
  document.body.appendChild(b);
  setTimeout(function() {
    var t = token(); if (!t) return;
    fetch('/api/ai/insights', { headers: { 'Authorization': 'Bearer ' + t } }).then(function(r) { return r.json(); }).then(function(d) {
      if (d.insights && d.insights.filter(function(i) { return i.type === 'danger' || i.type === 'warning'; }).length > 0) {
        document.getElementById('ai-ins-btn')?.classList.add('has-dot');
      }
    }).catch(function() {});
  }, 3000);
}

function toggleChat() {
  if (insOpen) { var ip = document.getElementById('ai-ins-panel'); if (ip) { ip.classList.remove('open'); insOpen = false; } }
  var p = document.getElementById('ai-chat-panel');
  if (!p) { makeChat(); return; }
  chatOpen = !chatOpen; p.classList.toggle('open', chatOpen);
  if (chatOpen && p.querySelector('.ai-msgs').children.length === 0) { addBotMsg('👋 Hi! Ask about your inventory.\n\nTry: "What\'s expiring this week?"\n"Show Lowthers Lane"\n"How many items?"'); addSugButtons(p); }
}

function toggleIns() {
  if (chatOpen) { var cp = document.getElementById('ai-chat-panel'); if (cp) { cp.classList.remove('open'); chatOpen = false; } }
  var p = document.getElementById('ai-ins-panel');
  if (!p) { makeIns(); return; }
  insOpen = !insOpen; p.classList.toggle('open', insOpen);
  if (insOpen && p.querySelector('.ai-ins-c').children.length <= 1) loadIns(p);
}

function makeChat() {
  var p = document.createElement('div'); p.className = 'ai-panel open'; p.id = 'ai-chat-panel'; chatOpen = true;
  p.innerHTML = '<div class="hd"><h3>🤖 AI Assistant</h3><div class="ha"><button onclick="var m=document.getElementById(\'ai-chat-panel\').querySelector(\'.ai-msgs\');m.innerHTML=\'\';addBotMsg(\'Chat cleared!\')">🗑️</button><button onclick="this.closest(\'.ai-panel\').classList.remove(\'open\');chatOpen=false">✕</button></div></div>' +
    '<div class="ai-msgs"></div><div class="ai-sugs"></div><div class="ai-inp"><input type="text" placeholder="Ask about your inventory..."><button>➤</button></div>';
  document.body.appendChild(p);
  addBotMsg('👋 Hi! Ask about your inventory.\n\nTry: "What\'s expiring this week?"\n"Show Lowthers Lane"\n"How many items?"');
  addSugButtons(p);
  var inp = p.querySelector('input'), btn = p.querySelector('.ai-inp button');
  function send() { var v = inp.value.trim(); if (!v) return; inp.value = ''; addUsrMsg(v); chatAsk(v); }
  btn.onclick = send;
  inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') send(); });
  setTimeout(function() { inp.focus(); }, 300);
}

function addSugButtons(p) {
  var s = p.querySelector('.ai-sugs'); if (!s) return;
  s.innerHTML = '';
  var qs = ['What\'s expiring this week?', 'Show Lowthers Lane', 'How many items total?', 'What categories?', 'What\'s expired?'];
  for (var i = 0; i < qs.length; i++) {
    var b = document.createElement('button');
    b.textContent = qs[i];
    b.onclick = (function(q) { return function() {
      var inp = document.getElementById('ai-chat-panel')?.querySelector('.ai-inp input');
      var btn = document.getElementById('ai-chat-panel')?.querySelector('.ai-inp button');
      if (inp && btn) { inp.value = q; btn.click(); }
    }; })(qs[i]);
    s.appendChild(b);
  }
  // Backup button
  var bb = document.createElement('button'); bb.className = 'bu'; bb.textContent = '📧 Email Backup';
  bb.onclick = sendBackup; s.appendChild(bb);
}

function addBotMsg(t) {
  var p = document.getElementById('ai-chat-panel'); if (!p) return;
  var m = p.querySelector('.ai-msgs');
  var d = document.createElement('div'); d.className = 'ai-msg bot';
  d.innerHTML = t.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') + '<sm>AI</sm>';
  m.appendChild(d); m.scrollTop = m.scrollHeight;
}

function addUsrMsg(t) {
  var p = document.getElementById('ai-chat-panel'); if (!p) return;
  var m = p.querySelector('.ai-msgs');
  var d = document.createElement('div'); d.className = 'ai-msg usr';
  d.innerHTML = t + '<sm>You</sm>';
  m.appendChild(d); m.scrollTop = m.scrollHeight;
}

function addTyper() {
  var p = document.getElementById('ai-chat-panel'); if (!p) return;
  var m = p.querySelector('.ai-msgs');
  var d = document.createElement('div'); d.className = 'ai-msg bot'; d.id = 'ai-typ';
  d.innerHTML = '<span class="ty">Thinking</span><span class="ty">.</span><span class="ty">.</span><span class="ty">.</span>';
  m.appendChild(d); m.scrollTop = m.scrollHeight; return d;
}

function rmTyper() { var e = document.getElementById('ai-typ'); if (e) e.remove(); }

async function chatAsk(q) {
  var t = token(); if (!t) { addBotMsg('⚠️ Log in first.'); return; }
  addTyper();
  try {
    var r = await fetch('/api/ai/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t },
      body: JSON.stringify({ question: q })
    });
    rmTyper();
    if (!r.ok) { addBotMsg('⚠️ Server error: ' + r.status); return; }
    var d = await r.json();
    addBotMsg(d.answer || 'No answer.');
  } catch(e) { rmTyper(); addBotMsg('⚠️ Network error.'); }
}

async function sendBackup() {
  var t = token(); if (!t) { toast('⚠️ Log in first', 'error'); return; }
  addBotMsg('📧 Sending backup...');
  addTyper();
  try {
    var r = await fetch('/api/backup/email', { method: 'POST', headers: { 'Authorization': 'Bearer ' + t } });
    rmTyper();
    if (!r.ok) { var ed = await r.json().catch(function() { return {}; }); addBotMsg('⚠️ ' + (ed.error || 'Backup failed')); return; }
    var d = await r.json();
    addBotMsg('✅ ' + (d.message || 'Backup sent!'));
    toast('✅ Backup emailed!');
  } catch(e) { rmTyper(); addBotMsg('⚠️ Network error.'); }
}

// ==================== INSIGHTS ====================

function makeIns() {
  var p = document.createElement('div'); p.className = 'ai-panel open'; p.id = 'ai-ins-panel'; insOpen = true;
  p.innerHTML = '<div class="hd"><h3>📊 AI Insights</h3><button onclick="this.closest(\'.ai-panel\').classList.remove(\'open\');insOpen=false">✕</button></div><div class="ai-ins-c"><div class="ai-ins-em">Loading...</div></div>';
  document.body.appendChild(p);
  loadIns(p);
}

function loadIns(p) {
  var t = token(); if (!t) { p.querySelector('.ai-ins-c').innerHTML = '<div class="ai-ins-em">⚠️ Log in first.</div>'; return; }
  fetch('/api/ai/insights', { headers: { 'Authorization': 'Bearer ' + t } }).then(function(r) { return r.json(); }).then(function(d) {
    var c = p.querySelector('.ai-ins-c');
    if (!d.insights || d.insights.length === 0) { c.innerHTML = '<div class="ai-ins-em">📝 Add products first!</div>'; return; }
    c.innerHTML = d.insights.map(function(i) {
      return '<div class="ai-ins-item ' + (i.type === 'danger' ? 'd' : i.type === 'warning' ? 'w' : i.type === 'info' ? 'i' : 's') + '">' +
        '<span class="ai-ins-ic">' + (i.icon || '📌') + '</span>' +
        '<div class="ai-ins-tx"><b>' + i.message + '</b>' +
        (i.items ? '<br><sm>' + i.items.join(', ') + '</sm>' : '') +
        (i.count !== undefined ? '<br><sm>Count: ' + i.count + '</sm>' : '') + '</div></div>';
    }).join('');
  }).catch(function() { p.querySelector('.ai-ins-c').innerHTML = '<div class="ai-ins-em">⚠️ Could not load.</div>'; });
}

// ==================== SEARCH BAR ====================

var srchInt, srchDeb;

function addSearchBar() {
  var w = document.createElement('div'); w.id = 'ai-srch';
  w.innerHTML = '<input type="text" id="ai-srch-i" placeholder="🔍 Search products by name, category, barcode..." autocomplete="off"><div class="cnt" id="ai-srch-c"></div>';
  document.body.appendChild(w);
  document.getElementById('ai-srch-i').addEventListener('input', function() {
    clearTimeout(srchDeb);
    srchDeb = setTimeout(doSearch, 200);
  });
  setInterval(checkTab, 1000);
}

function checkTab() {
  var w = document.getElementById('ai-srch');
  if (!w) return;

  // 🛑 HIDE if a modal/dialog is open
  var modals = document.querySelectorAll('body > [role="dialog"], .modal, [class*="overlay"], [class*="backdrop"]');
  for (var i = 0; i < modals.length; i++) {
    var st = window.getComputedStyle(modals[i]);
    if (st.display !== 'none' && st.visibility !== 'hidden' && modals[i].offsetWidth > 0) {
      if (w.classList.contains('vis')) { w.classList.remove('vis'); clearSrch(); }
      return;
    }
  }

  // Check if we're on a products tab
  var hasTable = document.querySelectorAll('table').length > 0;
  var hasRows = document.querySelectorAll('td, tr[data-index]').length > 5;
  var active = document.querySelector('[class*="tab"].active, [aria-selected="true"], [class*="Tab"].active');
  var atxt = active ? (active.textContent || '').toLowerCase() : '';
  var onTracker = atxt.indexOf('track') > -1 || atxt.indexOf('product') > -1 || atxt.indexOf('inventory') > -1 || atxt.indexOf('all') > -1;

  if ((hasTable && hasRows) || onTracker) {
    if (!w.classList.contains('vis')) {
      w.classList.add('vis');
      var tbl = document.querySelector('table, [class*="grid"], [class*="list"], main > div');
      if (tbl && tbl.parentNode) tbl.parentNode.insertBefore(w, tbl);
      setTimeout(doSearch, 300);
    }
  } else {
    if (w.classList.contains('vis')) { w.classList.remove('vis'); clearSrch(); }
  }
}

function doSearch() {
  var inp = document.getElementById('ai-srch-i'), cnt = document.getElementById('ai-srch-c');
  if (!inp || !cnt) return;
  var q = inp.value.trim().toLowerCase();
  var rows = document.querySelectorAll('tr, [class*="row"], [class*="card"]');
  var vis = 0, tot = 0;
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    // Skip headers
    if (r.tagName === 'TR' && r.querySelector('th')) continue;
    var txt = (r.textContent || '').toLowerCase();
    if (!txt || txt.length < 5) continue;
    if (!r.querySelector('button, a, input') && r.children.length <= 1) continue;
    tot++;
    if (!q) { r.classList.remove('ai-srch-hid', 'ai-srch-hi'); vis++; }
    else if (txt.indexOf(q) > -1) { r.classList.remove('ai-srch-hid'); r.classList.add('ai-srch-hi'); vis++; }
    else { r.classList.add('ai-srch-hid'); r.classList.remove('ai-srch-hi'); }
  }
  cnt.innerHTML = q ? '<b>' + vis + '</b> of <b>' + tot + '</b> match "<b>' + q + '</b>"' : '<b>' + tot + '</b> products total';
  clearTimeout(window.aiSHt);
  window.aiSHt = setTimeout(function() {
    document.querySelectorAll('.ai-srch-hi').forEach(function(e) { e.classList.remove('ai-srch-hi'); });
  }, 2000);
}

function clearSrch() {
  document.querySelectorAll('.ai-srch-hid, .ai-srch-hi').forEach(function(e) { e.classList.remove('ai-srch-hid', 'ai-srch-hi'); });
  var c = document.getElementById('ai-srch-c'); if (c) c.innerHTML = '';
  var i = document.getElementById('ai-srch-i'); if (i) i.value = '';
}

// ==================== AUTO-SUGGEST PRODUCT NAMES ====================

function addSuggester() {
  // Watch for new inputs
  var mo = new MutationObserver(function() {
    findAndEnhance();
  });
  mo.observe(document.body, { childList: true, subtree: true });
  findAndEnhance();
}

function findAndEnhance() {
  var inputs = document.querySelectorAll('input[type="text"], input:not([type])');
  for (var i = 0; i < inputs.length; i++) {
    var inp = inputs[i];
    // Skip our own inputs
    if (inp.id === 'ai-si' || inp.id === 'ai-chat-input' || inp.id === 'ai-srch-i' || inp.id === 'ai-srch-i') continue;
    if (inp.dataset.aiEnh) continue;

    var ph = (inp.placeholder || '').toLowerCase();
    var aria = (inp.getAttribute('aria-label') || '').toLowerCase();

    // Is this a product name input?
    var isName = ph.indexOf('name') > -1 || ph.indexOf('product') > -1 || aria.indexOf('name') > -1 || aria.indexOf('product') > -1;

    // If it's inside a dialog and doesn't look like something else
    var inDlg = !!inp.closest('[role="dialog"], .modal, [class*="dialog"], [class*="overlay"]');
    var notPass = ph.indexOf('password') === -1 && ph.indexOf('email') === -1 && ph.indexOf('price') === -1 &&
                  ph.indexOf('cost') === -1 && ph.indexOf('barcode') === -1 && ph.indexOf('number') === -1 &&
                  ph.indexOf('quantity') === -1 && ph.indexOf('phone') === -1 && ph.indexOf('search') === -1;

    if (isName || (inDlg && notPass)) {
      inp.dataset.aiEnh = '1';
      setupSuggest(inp);
    }
  }
}

function setupSuggest(inp) {
  var timer;
  inp.addEventListener('input', function() {
    clearTimeout(timer);
    rmDropdown();
    var v = inp.value.trim();
    if (v.length < 2) return;
    timer = setTimeout(function() { fetchSuggestions(v, inp); }, 400);
  });

  // Close dropdown on blur
  inp.addEventListener('blur', function() {
    setTimeout(rmDropdown, 300);
  });
}

function rmDropdown() {
  var e = document.getElementById('ai-sgst-d');
  if (e) e.remove();
}

function fetchSuggestions(name, inp) {
  var t = token();
  if (!t) return;
  var catDiv = findCatField(inp);

  // Get category suggestion
  fetch('/api/ai/categorize', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t },
    body: JSON.stringify({ name: name })
  }).then(function(r) { return r.json(); }).then(function(d) {
    if (d.category && d.category !== 'Other' && d.confidence > 0.5 && catDiv) {
      highlightCat(catDiv, d.category, d.confidence);
    }
  }).catch(function() {});

  // Get name suggestions
  fetch('/api/ai/suggest?q=' + encodeURIComponent(name), { headers: { 'Authorization': 'Bearer ' + t } })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data && data.length > 0) showSuggestDropdown(inp, data, catDiv);
    })
    .catch(function() {});
}

function findCatField(nameInput) {
  var container = nameInput.closest('form') || nameInput.closest('[role="dialog"]') || nameInput.closest('.modal') || nameInput.closest('div[class*="form"]');
  if (!container) return null;
  var sel = container.querySelectorAll('select');
  for (var i = 0; i < sel.length; i++) {
    if (sel[i].options && sel[i].options.length > 2) {
      var opts = Array.from(sel[i].options).map(function(o) { return o.text.toLowerCase(); });
      if (opts.some(function(o) { return o === 'other' || o.indexOf('category') > -1 || o.indexOf('dairy') > -1 || o.indexOf('meat') > -1 || o.indexOf('beverage') > -1; }))
        return sel[i];
    }
  }
  var inputs = container.querySelectorAll('input');
  for (var i = 0; i < inputs.length; i++) {
    if (inputs[i] !== nameInput) {
      var ph = (inputs[i].placeholder || '').toLowerCase();
      if (ph.indexOf('category') > -1 || ph.indexOf('type') > -1) return inputs[i];
    }
  }
  return null;
}

function highlightCat(catField, category, confidence) {
  catField.style.transition = 'background 0.3s';
  catField.style.background = '#e8f5e9';
  catField.title = 'AI suggested: ' + category + ' (' + Math.round(confidence * 100) + '%)';
  if (catField.tagName === 'SELECT') {
    for (var i = 0; i < catField.options.length; i++) {
      if (catField.options[i].text.toLowerCase() === category.toLowerCase() ||
          catField.options[i].value.toLowerCase() === category.toLowerCase()) {
        catField.selectedIndex = i;
        catField.dispatchEvent(new Event('change', { bubbles: true }));
        break;
      }
    }
  } else {
    catField.value = category;
    catField.dispatchEvent(new Event('input', { bubbles: true }));
  }
  setTimeout(function() { catField.style.background = ''; }, 2000);
}

function showSuggestDropdown(inp, suggestions, catField) {
  rmDropdown();
  var rect = inp.getBoundingClientRect();
  var dd = document.createElement('div'); dd.id = 'ai-sgst-d'; dd.className = 'ai-sgst';
  dd.style.top = (rect.bottom + 4) + 'px';
  dd.style.left = rect.left + 'px';
  dd.style.width = Math.max(rect.width, 250) + 'px';

  var html = '';
  for (var i = 0; i < suggestions.length; i++) {
    var s = suggestions[i];
    html += '<div class="ai-sgst-item" data-name="' + s.name.replace(/"/g, '&quot;') + '" data-cat="' + (s.category || 'Other').replace(/"/g, '&quot;') + '">' +
      '<span class="nm">' + s.name + '</span><span class="cat">' + (s.category || 'Other') + '</span></div>';
  }
  dd.innerHTML = html;

  dd.addEventListener('click', function(e) {
    var item = e.target.closest('.ai-sgst-item');
    if (item) {
      inp.value = item.dataset.name;
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      dd.remove();
      // Try to fill category
      if (catField && item.dataset.cat && item.dataset.cat !== 'Other') {
        setTimeout(function() {
          if (catField.tagName === 'SELECT') {
            for (var i = 0; i < catField.options.length; i++) {
              if (catField.options[i].text.toLowerCase() === item.dataset.cat.toLowerCase()) {
                catField.selectedIndex = i;
                catField.dispatchEvent(new Event('change', { bubbles: true }));
                break;
              }
            }
          } else {
            catField.value = item.dataset.cat;
            catField.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }, 100);
      }
    }
  });

  document.body.appendChild(dd);
}

})();