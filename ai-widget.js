// AI Widget - Final Version
(function(){
'use strict';
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',boot)}else{boot()}

function boot(){
  css()
  barcodeScanner()
  chatBtn()
  insightsBtn()
  productSearch()
  suggestionWatcher()
  setInterval(checkSearchVisibility,500)
  setInterval(suggestionWatcher,800)
  setInterval(showLastEdited,2000)
  setTimeout(suggestionWatcher,1500)
  setTimeout(suggestionWatcher,3000)
}

function token(){
  try{
    var t=localStorage.getItem('token')
    if(t&&t.indexOf('.')>-1)return t
    for(var i=0;i<localStorage.length;i++){
      var v=localStorage.getItem(localStorage.key(i))
      if(v&&v.length>100&&v.split('.').length===3)return v
    }
  }catch(e){}
  return null
}

function toast(m,err){
  var x=document.querySelector('.aitoast')
  if(x)x.remove()
  var d=document.createElement('div')
  d.className='aitoast'+(err?' er':'')
  d.innerHTML='<span>'+m+'</span><button onclick="this.parentElement.remove()">✕</button>'
  document.body.appendChild(d)
  setTimeout(function(){if(d.parentNode)d.remove()},5000)
}

function css(){
  var s=document.createElement('style')
  s.textContent=`
.aitoast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1a1a2e;border:2px solid #4caf50;border-radius:12px;padding:12px 20px;z-index:999999;max-width:500px;width:90%;box-shadow:0 8px 40px rgba(0,0,0,0.5);animation:af .3s;color:#fff;font-size:14px;display:flex;align-items:center;gap:12px}
.aitoast.er{border-color:#ff5252}
.aitoast button{background:none;border:none;color:#888;font-size:18px;cursor:pointer}
@keyframes af{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.aibtn{position:fixed;z-index:99999;width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;border:none;font-size:20px;box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:transform .2s;color:#fff}
.aibtn:hover{transform:scale(1.1)}
#ai_scan_btn{bottom:160px;right:20px;background:linear-gradient(135deg,#4caf50,#2e7d32)}
#ai_scan_btn.on{background:linear-gradient(135deg,#ff5252,#d32f2f)}
#ai_chat_btn{bottom:20px;right:20px;width:56px;height:56px;font-size:24px;background:linear-gradient(135deg,#667eea,#764ba2)}
#ai_ins_btn{bottom:90px;right:20px;background:linear-gradient(135deg,#f093fb,#f5576c)}
#ai_ins_btn.badge::after{content:'';position:absolute;top:-2px;right:-2px;width:12px;height:12px;background:#ff4444;border-radius:50%;border:2px solid #fff}
#ai_scan_bar{position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#1a1a2e;border-top:3px solid #4caf50;padding:8px 14px;display:flex;align-items:center;gap:8px;transform:translateY(100%);transition:transform .3s}
#ai_scan_bar.on{transform:translateY(0)}
#ai_scan_bar input{flex:1;padding:10px 14px;border:2px solid #4caf50;border-radius:10px;font-size:18px;font-family:monospace;outline:none;background:#16213e;color:#fff;letter-spacing:2px}
#ai_scan_bar .st{font-size:12px;color:#888;white-space:nowrap;padding:4px 10px;background:#0d1b2a;border-radius:6px;display:flex;align-items:center;gap:6px}
#ai_scan_bar .st .dot{width:8px;height:8px;border-radius:50%;background:#4caf50}
#ai_scan_bar button{background:#4caf50;color:#fff;border:none;border-radius:10px;padding:10px 14px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap}
#ai_scan_bar button.cam{background:#7c4dff}
#ai_scan_bar button.x{background:transparent;color:#999;font-size:20px;padding:8px}
.aipanel{position:fixed;bottom:90px;right:20px;z-index:99998;width:380px;height:520px;background:#fff;border-radius:16px;box-shadow:0 10px 60px rgba(0,0,0,0.2);border:1px solid #e0e0e0;display:none;flex-direction:column;overflow:hidden;animation:af .3s}
.aipanel.on{display:flex}
.aipanel .hd{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:center}
.aipanel .hd h3{margin:0;font-size:16px;font-weight:600}
.aipanel .hd button{background:rgba(255,255,255,0.2);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:14px}
.aipanel .hd button:hover{background:rgba(255,255,255,0.35)}
.aipanel .msgs{flex:1;overflow-y:auto;padding:12px 16px;background:#f8f9fa}
.aipanel .msgs::-webkit-scrollbar{width:5px}
.aipanel .msgs::-webkit-scrollbar-thumb{background:#ccc;border-radius:10px}
.aipanel .msg{margin-bottom:12px;max-width:85%;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.5;white-space:pre-wrap;animation:af .3s}
.aipanel .msg.bot{background:#fff;color:#333;align-self:flex-start;border-bottom-left-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.06);margin-right:auto}
.aipanel .msg.usr{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;align-self:flex-end;border-bottom-right-radius:4px;margin-left:auto}
.aipanel .msg sm{display:block;font-size:11px;opacity:.7;margin-top:4px}
.aipanel .inp{padding:10px 12px;border-top:1px solid #e8e8e8;display:flex;gap:8px;background:#fff}
.aipanel .inp input{flex:1;border:1px solid #ddd;border-radius:20px;padding:10px 16px;font-size:14px;outline:none}
.aipanel .inp input:focus{border-color:#667eea}
.aipanel .inp button{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:50%;width:40px;height:40px;cursor:pointer;font-size:16px}
.aipanel .sugs{display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px;background:#f0f2ff;border-top:1px solid #e8e8e8}
.aipanel .sugs button{background:#fff;border:1px solid #667eea;color:#667eea;padding:5px 12px;border-radius:14px;font-size:12px;cursor:pointer;white-space:nowrap}
.aipanel .sugs button:hover{background:#667eea;color:#fff}
.aipanel .sugs button.bu{background:#ff7043;border-color:#ff7043;color:#fff}
.aipanel .sugs button.bu:hover{background:#f4511e}
#ai_ins_panel.aipanel{max-height:400px;height:auto}
#ai_ins_panel .hd{background:linear-gradient(135deg,#f093fb,#f5576c)}
.ai_ins_c{padding:12px 16px;overflow-y:auto;flex:1}
.ai_ins_i{background:#fff;border-radius:10px;padding:10px 14px;margin-bottom:8px;display:flex;align-items:flex-start;gap:10px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border-left:3px solid #667eea;font-size:13px;line-height:1.4;color:#555}
.ai_ins_i.dng{border-left-color:#ff4444}
.ai_ins_i.warn{border-left-color:#ffa726}
.ai_ins_i.info{border-left-color:#42a5f5}
.ai_ins_i.stat{border-left-color:#66bb6a}
.ai_ins_i b{color:#333}
.ai_ins_i .ic{font-size:20px;flex-shrink:0}
.ai_ins_e{text-align:center;color:#999;padding:30px 20px;font-size:14px}

/* Search bar - sticky at top of page */
#ai_search_bar{display:none;position:sticky;top:0;z-index:999;padding:10px 16px;background:#f8f9fa;border-bottom:1px solid #e0e0e0}
#ai_search_bar.v{display:block}
#ai_search_bar input{width:100%;padding:10px 14px 10px 40px;border:2px solid #667eea;border-radius:10px;font-size:15px;outline:none;box-sizing:border-box;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23667eea' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'/%3E%3C/svg%3E") 12px center no-repeat;background-size:18px}
#ai_search_bar input:focus{border-color:#764ba2}
#ai_search_bar .ct{font-size:12px;color:#888;margin-top:6px;text-align:right}
#ai_search_bar .ct b{color:#667eea}
.shide{display:none!important}
.shigh{background:#fff9c4!important}

/* Last edited badge */
.ai_edited{font-size:10px;color:#999;display:block;margin-top:2px}
.ai_edited b{color:#667eea}
.ai_edited .ago{color:#4caf50;font-weight:600}

/* Suggestion dropdown */
.ai_drop{position:absolute;background:#fff;border:1px solid #ddd;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.15);z-index:999999;max-height:200px;overflow-y:auto;min-width:200px}
.ai_drop-item{padding:8px 14px;font-size:13px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f0f0f0}
.ai_drop-item:hover{background:#f0f2ff}
.ai_drop-item:last-child{border-bottom:none}

/* Camera */
#ai_cam_overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:999999;display:none;flex-direction:column;align-items:center;justify-content:center}
#ai_cam_overlay.on{display:flex}
#ai_cam_overlay video{max-width:100%;max-height:80vh;border-radius:12px}
#ai_cam_overlay .cx{position:absolute;top:20px;right:20px;background:rgba(255,255,255,0.2);border:none;color:#fff;width:44px;height:44px;border-radius:50%;font-size:22px;cursor:pointer}
#ai_cam_overlay .sr{position:absolute;border:2px dashed rgba(76,175,80,0.6);border-radius:12px;width:250px;height:120px;pointer-events:none}
`
  document.head.appendChild(s)
}

// ==================== SEARCH BAR ====================

function productSearch(){
  var w=document.createElement('div');w.id='ai_search_bar'
  w.innerHTML='<input type="text" id="ai_srch_inp" placeholder="🔍 Search products by name, category, barcode..." autocomplete="off"><div class="ct" id="ai_srch_ct"></div>'
  document.body.appendChild(w)
  document.getElementById('ai_srch_inp').addEventListener('input',function(){
    clearTimeout(window._sd)
    window._sd=setTimeout(runSearch,200)
  })
}

function checkSearchVisibility(){
  var w=document.getElementById('ai_search_bar')
  if(!w)return

  // Check if any modal/dialog is open - hide search if so
  var dialogs=document.querySelectorAll('[role="dialog"],[class*="modal"],[class*="dialog"],[class*="overlay"],[class*="backdrop"]')
  for(var i=0;i<dialogs.length;i++){
    if(dialogs[i].offsetWidth>0&&dialogs[i].offsetHeight>0&&window.getComputedStyle(dialogs[i]).display!=='none'){
      if(w.classList.contains('v')){w.classList.remove('v')}
      return
    }
  }

  // Check if the tracker tab is active or if there's product data visible
  var activeEls=document.querySelectorAll('[class*="tab"].active,[aria-selected="true"],button.active,a.active')
  var isTracker=false
  for(var i=0;i<activeEls.length;i++){
    var txt=activeEls[i].textContent.toLowerCase()
    if(txt.indexOf('track')>-1||txt.indexOf('product')>-1||txt.indexOf('inventory')>-1||txt.indexOf('all')>-1){isTracker=true;break}
  }

  // Also check if there are visible data rows
  var hasData=document.querySelectorAll('td').length>2||document.querySelectorAll('[class*="row"],[class*="card"]').length>3

  if(isTracker||hasData){
    if(!w.classList.contains('v')){
      w.classList.add('v')
      runSearch()
    }
  }else{
    if(w.classList.contains('v')){w.classList.remove('v')}
  }
}

function runSearch(){
  var inp=document.getElementById('ai_srch_inp'),ct=document.getElementById('ai_srch_ct')
  if(!inp||!ct)return
  var q=inp.value.trim().toLowerCase()

  // Find all rows, cards, or product elements
  var items=document.querySelectorAll('tr,[class*="row"],[class*="card"]')
  var vis=0,tot=0

  for(var i=0;i<items.length;i++){
    var el=items[i]
    // Skip headers
    if(el.tagName==='TR'&&el.querySelector('th'))continue
    var txt=(el.textContent||'').toLowerCase().trim()
    if(txt.length<2)continue
    tot++
    if(!q){el.classList.remove('shide','shigh');vis++}
    else if(txt.indexOf(q)>-1){el.classList.remove('shide');el.classList.add('shigh');vis++}
    else{el.classList.add('shide');el.classList.remove('shigh')}
  }

  ct.innerHTML=q?'<b>'+vis+'</b> of <b>'+tot+'</b> match':'<b>'+tot+'</b> products'
  clearTimeout(window._stm)
  window._stm=setTimeout(function(){document.querySelectorAll('.shigh').forEach(function(e){e.classList.remove('shigh')})},2000)
}

// ==================== LAST EDITED DISPLAY ====================

function showLastEdited(){
  // This adds "Last edited: X minutes ago" text to each product row
  // It reads the data from the API response stored in the DOM

  // First, try to fetch products with their updatedAt dates
  var rows=document.querySelectorAll('tr')
  for(var i=0;i<rows.length;i++){
    var r=rows[i]
    if(r.dataset.aiEdited)continue
    var cells=r.querySelectorAll('td')
    if(cells.length<3)continue

    // Check if this looks like a product row (has enough text)
    var txt=r.textContent.trim()
    if(txt.length<5)continue

    r.dataset.aiEdited='1'

    // Add a hidden "edited" indicator to the last cell
    var lastCell=cells[cells.length-1]
    if(!lastCell||lastCell.querySelector('.ai_edited'))continue

    // Try to extract the actual updatedAt from the page data
    // The React app stores product data somewhere in the DOM
    // For now, we'll check if any nearby element has date info
    var timeEl=lastCell.querySelector('time,span[class*="date"],span[class*="time"]')
    if(timeEl){
      var dateText=timeEl.textContent.trim()
      if(dateText){
        var le=document.createElement('span')
        le.className='ai_edited'
        le.innerHTML='Last edited: <b>'+dateText+'</b>'
        if(lastCell.children.length>0){
          lastCell.appendChild(document.createElement('br'))
        }
        lastCell.appendChild(le)
      }
    }
  }
}

// ==================== BARCODE SCANNER ====================

var scanBarOpen=false,camStream=null

function barcodeScanner(){
  var btn=document.createElement('button');btn.id='ai_scan_btn';btn.className='aibtn';btn.textContent='📷'
  btn.title='Scanner (Ctrl+Shift+B)';btn.onclick=toggleScanBar
  document.body.appendChild(btn)

  var bar=document.createElement('div');bar.id='ai_scan_bar'
  bar.innerHTML='<span style="color:#4caf50;font-weight:700;font-size:13px">📷</span><input id="ai_scan_inp" placeholder="Scan barcode..." autocomplete="off"><span class="st"><span class="dot"></span><span id="ai_scan_st">Ready</span></span><button class="cam" id="ai_cam_btn">📸</button><button id="ai_lookup_btn">🔍</button><button class="x" id="ai_close_btn">✕</button>'
  document.body.appendChild(bar)

  var inp=document.getElementById('ai_scan_inp'),lastTime=0,st
  inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();doScan(inp.value.trim())}})
  inp.addEventListener('input',function(){
    var n=Date.now()
    if(n-lastTime<80&&inp.value.length>5){clearTimeout(st);st=setTimeout(function(){doScan(inp.value.trim())},100)}
    lastTime=n
  })
  document.getElementById('ai_lookup_btn').onclick=function(){doScan(inp.value.trim())}
  document.getElementById('ai_close_btn').onclick=toggleScanBar
  document.getElementById('ai_cam_btn').onclick=openCamera
  document.addEventListener('keydown',function(e){if(e.ctrlKey&&e.shiftKey&&(e.key==='b'||e.key==='B')){e.preventDefault();toggleScanBar()}})
}

function toggleScanBar(){
  var bar=document.getElementById('ai_scan_bar'),btn=document.getElementById('ai_scan_btn')
  scanBarOpen=!scanBarOpen;bar.classList.toggle('on',scanBarOpen);btn.classList.toggle('on',scanBarOpen)
  btn.textContent=scanBarOpen?'✕':'📷'
  if(scanBarOpen)setTimeout(function(){document.getElementById('ai_scan_inp').focus()},200)
}

function scanStatus(t,c){
  var e=document.getElementById('ai_scan_st');if(e)e.textContent=t
  var d=document.querySelector('#ai_scan_bar .dot');if(d)d.style.background=c||'#4caf50'
}

async function doScan(code){
  var t=token();if(!t){toast('Log in first',1);return}
  var c=code.replace(/\D/g,'')
  if(c.length<5){toast('Invalid barcode',1);return}
  scanStatus('🔍 Looking...','#ffa726')
  try{
    var r=await fetch('/api/lookup-barcode?barcode='+encodeURIComponent(c),{headers:{'Authorization':'Bearer '+t}})
    var d=await r.json()
    if(d.found){
      scanStatus('✅ '+d.name.substring(0,30),'#4caf50')
      document.getElementById('ai_scan_inp').value=''
      toast('✅ <b>'+d.name+'</b><br>Category: '+d.category+'<br>Barcode: '+c)
      setTimeout(function(){scanStatus('Ready','#4caf50')},3000)
    }else{
      scanStatus('❌ Not found','#ff5252');toast('Not found for '+c,1)
      setTimeout(function(){scanStatus('Ready','#4caf50')},3000)
    }
  }catch(e){scanStatus('❌ Error','#ff5252');toast('Network error',1);setTimeout(function(){scanStatus('Ready','#4caf50')},3000)}
}

function openCamera(){
  if(scanBarOpen)toggleScanBar()
  var ov=document.getElementById('ai_cam_overlay')
  if(ov){ov.classList.add('on');return}
  ov=document.createElement('div');ov.id='ai_cam_overlay';ov.className='on'
  ov.innerHTML='<div class="sr"></div><video id="ai_cam_vid" autoplay playsinline></video><button class="cx">✕</button>'
  document.body.appendChild(ov);ov.querySelector('.cx').onclick=closeCamera
  try{
    navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(function(s){
      camStream=s;var v=document.getElementById('ai_cam_vid');v.srcObject=s;v.play()
      if('BarcodeDetector'in window){
        new BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e','code_128','code_39']}).then(function(det){
          !function loop(){
            if(!document.getElementById('ai_cam_overlay')?.classList.contains('on'))return
            det.detect(v).then(function(b){
              if(b.length>0){closeCamera();if(!scanBarOpen)toggleScanBar();var inp=document.getElementById('ai_scan_inp');if(inp){inp.value=b[0].rawValue;doScan(b[0].rawValue)}}
              else setTimeout(loop,500)
            }).catch(function(){setTimeout(loop,500)})
          }()
        }).catch(function(){})
      }
    }).catch(function(){toast('Camera denied',1);closeCamera()})
  }catch(e){closeCamera()}
}

function closeCamera(){
  if(camStream){camStream.getTracks().forEach(function(t){t.stop()});camStream=null}
  var ov=document.getElementById('ai_cam_overlay');if(ov){ov.classList.remove('on');setTimeout(function(){if(ov.parentNode)ov.remove()},500)}
}

// ==================== AI CHAT ====================

var chatOpen=false,insOpen=false

function chatBtn(){
  var b=document.createElement('button');b.id='ai_chat_btn';b.className='aibtn';b.textContent='🤖'
  b.title='AI Assistant';b.onclick=toggleChat;document.body.appendChild(b)
}

function insightsBtn(){
  var b=document.createElement('button');b.id='ai_ins_btn';b.className='aibtn';b.textContent='📊'
  b.title='AI Insights';b.onclick=toggleInsights;document.body.appendChild(b)
  setTimeout(function(){
    var t=token();if(!t)return
    fetch('/api/ai/insights',{headers:{'Authorization':'Bearer '+t}}).then(function(r){return r.json()}).then(function(d){
      if(d.insights&&d.insights.filter(function(i){return i.type==='danger'||i.type==='warning'}).length>0)
        document.getElementById('ai_ins_btn')?.classList.add('badge')
    }).catch(function(){})
  },3000)
}

function toggleChat(){
  if(insOpen){var ip=document.getElementById('ai_ins_panel');if(ip)ip.classList.remove('on');insOpen=false}
  var p=document.getElementById('ai_chat_panel');if(!p){createChat();return}
  chatOpen=!chatOpen;p.classList.toggle('on',chatOpen)
}

function toggleInsights(){
  if(chatOpen){var cp=document.getElementById('ai_chat_panel');if(cp)cp.classList.remove('on');chatOpen=false}
  var p=document.getElementById('ai_ins_panel');if(!p){createInsights();return}
  insOpen=!insOpen;p.classList.toggle('on',insOpen)
  if(insOpen&&p.querySelector('.ai_ins_c').children.length<=1)loadInsights(p)
}

function createChat(){
  chatOpen=true
  var p=document.createElement('div');p.className='aipanel on';p.id='ai_chat_panel'
  p.innerHTML='<div class="hd"><h3>🤖 AI Assistant</h3><div><button onclick="document.getElementById(\'ai_chat_panel\').querySelector(\'.msgs\').innerHTML=\'\';botMsg(\'Cleared!\')">🗑️</button><button onclick="this.closest(\'.aipanel\').classList.remove(\'on\');chatOpen=false">✕</button></div></div><div class="msgs"></div><div class="sugs"></div><div class="inp"><input id="ai_chat_inp" placeholder="Ask about inventory..."><button>➤</button></div>'
  document.body.appendChild(p)
  botMsg('👋 Ask me about your inventory!\n\nTry: "What\'s expiring this week?"\n"Show Lowthers Lane"\n"How many items?"')
  chatSugs(p)
  var inp=p.querySelector('#ai_chat_inp'),btn=p.querySelector('.inp button')
  function send(){var v=inp.value.trim();if(!v)return;inp.value='';usrMsg(v);askAI(v)}
  btn.onclick=send;inp.addEventListener('keydown',function(e){if(e.key==='Enter')send()})
  setTimeout(function(){inp.focus()},300)
}

function chatSugs(p){
  var s=p.querySelector('.sugs');if(!s)return;s.innerHTML=''
  ;['What\'s expiring this week?','Show Lowthers Lane','How many items?','What categories?','What\'s expired?'].forEach(function(q){
    var b=document.createElement('button');b.textContent=q
    b.onclick=function(){var inp=document.getElementById('ai_chat_inp'),btn=document.querySelector('#ai_chat_panel .inp button');if(inp&&btn){inp.value=q;btn.click()}}
    s.appendChild(b)
  })
  var bb=document.createElement('button');bb.className='bu';bb.textContent='📧 Email Backup'
  bb.onclick=emailBackup;s.appendChild(bb)
}

function botMsg(t){var p=document.getElementById('ai_chat_panel');if(!p)return;var m=p.querySelector('.msgs');var d=document.createElement('div');d.className='msg bot';d.innerHTML=t.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<b>$1</b>')+'<sm>AI</sm>';m.appendChild(d);m.scrollTop=m.scrollHeight}
function usrMsg(t){var p=document.getElementById('ai_chat_panel');if(!p)return;var m=p.querySelector('.msgs');var d=document.createElement('div');d.className='msg usr';d.innerHTML=t+'<sm>You</sm>';m.appendChild(d);m.scrollTop=m.scrollHeight}
function typing(){var p=document.getElementById('ai_chat_panel');if(!p)return;var m=p.querySelector('.msgs');var d=document.createElement('div');d.className='msg bot';d.id='ai_typing';d.innerHTML='Thinking...<sm>AI</sm>';m.appendChild(d);m.scrollTop=m.scrollHeight}
function untyping(){var e=document.getElementById('ai_typing');if(e)e.remove()}

async function askAI(q){
  var t=token();if(!t){botMsg('⚠️ Log in first.');return}
  typing()
  try{
    var r=await fetch('/api/ai/chat',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:JSON.stringify({question:q})})
    untyping()
    if(!r.ok){botMsg('⚠️ Error: '+r.status);return}
    var d=await r.json();botMsg(d.answer||'No answer.')
  }catch(e){untyping();botMsg('⚠️ Network error.')}
}

async function emailBackup(){
  var t=token();if(!t){toast('Log in first',1);return}
  botMsg('📧 Sending...');typing()
  try{
    var r=await fetch('/api/backup/email',{method:'POST',headers:{'Authorization':'Bearer '+t}})
    untyping()
    if(!r.ok){var ed=await r.json().catch(function(){});botMsg('⚠️ '+(ed?.error||'Failed'));return}
    var d=await r.json();botMsg('✅ '+(d.message||'Sent!'));toast('✅ Backup emailed!')
  }catch(e){untyping();botMsg('⚠️ Network error.')}
}

function createInsights(){
  insOpen=true
  var p=document.createElement('div');p.className='aipanel on';p.id='ai_ins_panel'
  p.innerHTML='<div class="hd"><h3>📊 Insights</h3><button onclick="this.closest(\'.aipanel\').classList.remove(\'on\');insOpen=false">✕</button></div><div class="ai_ins_c"><div class="ai_ins_e">Loading...</div></div>'
  document.body.appendChild(p);loadInsights(p)
}

function loadInsights(p){
  var t=token();if(!t){p.querySelector('.ai_ins_c').innerHTML='<div class="ai_ins_e">⚠️ Log in.</div>';return}
  fetch('/api/ai/insights',{headers:{'Authorization':'Bearer '+t}}).then(function(r){return r.json()}).then(function(d){
    var c=p.querySelector('.ai_ins_c')
    if(!d.insights||!d.insights.length){c.innerHTML='<div class="ai_ins_e">📝 Add products first!</div>';return}
    c.innerHTML=d.insights.map(function(i){return '<div class="ai_ins_i '+(i.type==='danger'?'dng':i.type==='warning'?'warn':i.type==='info'?'info':'stat')+'"><span class="ic">'+(i.icon||'📌')+'</span><div><b>'+i.message+'</b>'+(i.items?'<br><sm>'+i.items.join(', ')+'</sm>':'')+(i.count!==undefined?'<br><sm>Count: '+i.count+'</sm>':'')+'</div></div>'}).join('')
  }).catch(function(){p.querySelector('.ai_ins_c').innerHTML='<div class="ai_ins_e">⚠️ Error.</div>'})
}

// ==================== SUGGESTIONS ====================

var ddIdx=0

function suggestionWatcher(){
  // Find dialogs that are open and not yet processed
  var dls=document.querySelectorAll('[role="dialog"],[class*="modal"],[class*="dialog"],[class*="overlay"],[class*="backdrop"]')
  for(var i=0;i<dls.length;i++){
    var d=dls[i]
    if(d.offsetWidth>0&&d.offsetHeight>0&&!d.dataset.aiM){
      d.dataset.aiM='1'
      setTimeout(function(dlg){return function(){enhanceDialog(dlg)}}(d),400)
    }
  }
  // Also enhance any un-enhanced inputs on the page
  var inputs=document.querySelectorAll('input')
  for(var i=0;i<inputs.length;i++){
    var inp=inputs[i]
    if(inp.dataset.aiS||inp.type==='hidden'||inp.type==='password'||inp.type==='email'||inp.type==='number'||inp.type==='file')continue
    if(inp.id==='ai_scan_inp'||inp.id==='ai_srch_inp'||inp.id==='ai_chat_inp')continue
    inp.dataset.aiS='1'
    enhanceInput(inp)
  }
}

function enhanceDialog(container){
  var inputs=container.querySelectorAll('input')
  for(var i=0;i<inputs.length;i++){
    var inp=inputs[i]
    if(inp.dataset.aiS||inp.type==='hidden'||inp.type==='password'||inp.type==='email'||inp.type==='number'||inp.type==='file')continue
    inp.dataset.aiS='1'
    enhanceInput(inp)
  }
}

function enhanceInput(inp){
  var timer
  inp.addEventListener('input',function(){
    clearTimeout(timer)
    removeDropdown(this)
    var v=this.value.trim()
    if(v.length<2)return
    var self=this
    timer=setTimeout(function(){fetchSuggestions(v,self)},400)
  })
  inp.addEventListener('blur',function(){var self=this;setTimeout(function(){removeDropdown(self)},300)})
}

function removeDropdown(inp){
  var e=document.getElementById('ai_dd_'+(inp.dataset.aiI||''))
  if(e)e.remove()
}

function fetchSuggestions(name,inp){
  var t=token();if(!t)return
  var catField=findCategoryField(inp)

  // Auto-categorize
  fetch('/api/ai/categorize',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:JSON.stringify({name:name})})
    .then(function(r){return r.json()}).then(function(d){
      if(d.category&&d.category!=='Other'&&d.confidence>0.5&&catField){
        if(catField.tagName==='SELECT'){
          for(var i=0;i<catField.options.length;i++){
            if(catField.options[i].text.toLowerCase()===d.category.toLowerCase()){catField.selectedIndex=i;catField.dispatchEvent(new Event('change',{bubbles:true}));break}
          }
        }else{catField.value=d.category;catField.dispatchEvent(new Event('input',{bubbles:true}))}
      }
    }).catch(function(){})

  // Suggest product names
  fetch('/api/ai/suggest?q='+encodeURIComponent(name),{headers:{'Authorization':'Bearer '+t}})
    .then(function(r){return r.json()}).then(function(data){
      if(!data||!data.length)return
      removeDropdown(inp);ddIdx++;inp.dataset.aiI=ddIdx
      var rect=inp.getBoundingClientRect()
      var dd=document.createElement('div');dd.id='ai_dd_'+ddIdx;dd.className='ai_drop'
      dd.style.top=(rect.bottom+4)+'px';dd.style.left=rect.left+'px';dd.style.width=Math.max(rect.width,250)+'px'
      var html=''
      for(var i=0;i<data.length;i++){
        var s=data[i];html+='<div class="ai_drop-item" data-n="'+s.name.replace(/"/g,'&quot;')+'" data-c="'+(s.category||'Other').replace(/"/g,'&quot;')+'"><span>'+s.name+'</span> <span style="font-size:11px;color:#667eea;background:#f0f2ff;padding:2px 8px;border-radius:10px">'+(s.category||'Other')+'</span></div>'
      }
      dd.innerHTML=html
      dd.addEventListener('click',function(e){
        var item=e.target.closest('.ai_drop-item')
        if(item){
          inp.value=item.dataset.n;inp.dispatchEvent(new Event('input',{bubbles:true}));dd.remove()
          if(catField&&item.dataset.c&&item.dataset.c!=='Other'){
            setTimeout(function(){
              if(catField.tagName==='SELECT'){for(var i=0;i<catField.options.length;i++){if(catField.options[i].text.toLowerCase()===item.dataset.c.toLowerCase()){catField.selectedIndex=i;catField.dispatchEvent(new Event('change',{bubbles:true}));break}}}
              else{catField.value=item.dataset.c;catField.dispatchEvent(new Event('input',{bubbles:true}))}
            },100)
          }
        }
      })
      document.body.appendChild(dd)
    }).catch(function(){})
}

function findCategoryField(inp){
  var c=inp.closest('form')||inp.closest('[role="dialog"]')||inp.closest('.modal')||inp.closest('div[class*="form"]')
  if(!c)return null
  var sels=c.querySelectorAll('select')
  for(var i=0;i<sels.length;i++){
    if(sels[i].options.length>2){
      var opts=Array.from(sels[i].options).map(function(o){return o.text.toLowerCase()})
      if(opts.some(function(o){return o==='other'||o.indexOf('category')>-1||o.indexOf('dairy')>-1||o.indexOf('meat')>-1||o.indexOf('beverage')>-1})) return sels[i]
    }
  }
  return null
}

})();