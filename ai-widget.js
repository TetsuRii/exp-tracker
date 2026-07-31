// AI Widget - Clean & Stable
// Features: search bar (top of Tracker tab only), barcode scanner, AI chat, insights, product import (CSV/JSON)
// NOTE: No date-badge injection and no extra suggestion dropdowns here — the React app handles those.
(function(){
'use strict'
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',boot)}else{boot()}

function boot(){
  css()
  searchBar()
  barcode()
  chat()
  insights()
  dedupeBtn()
}

function token(){
  try{
    var t=localStorage.getItem('tk')||localStorage.getItem('token')
    if(t&&t.indexOf('.')>-1)return t
    for(var i=0;i<localStorage.length;i++){
      var v=localStorage.getItem(localStorage.key(i))
      if(v&&v.length>100&&v.split('.').length===3)return v
    }
  }catch(e){}
  return null
}

function toast(m,e){
  var x=document.querySelector('.ait')
  if(x)x.remove()
  var d=document.createElement('div')
  d.className='ait'+(e?' er':'')
  d.innerHTML='<span>'+m+'</span><button onclick="this.parentElement.remove()">✕</button>'
  document.body.appendChild(d)
  setTimeout(function(){if(d.parentNode)d.remove()},5000)
}

function css(){
  var s=document.createElement('style')
  s.textContent=`
.ait{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1a1a2e;border:2px solid #4caf50;padding:12px 20px;z-index:999999;max-width:500px;width:90%;animation:af .3s;color:#fff;font-size:14px;display:flex;align-items:center;gap:12px}
.ait.er{border-color:#ff5252}.ait button{background:none;border:none;color:#888;font-size:18px;cursor:pointer}
@keyframes af{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.afb{position:fixed;z-index:99999;width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;border:none;font-size:20px;box-shadow:0 4px 20px rgba(0,0,0,0.3);color:#fff}
.afb:hover{transform:scale(1.1)}
#_sbb{bottom:160px;right:20px;background:linear-gradient(135deg,#4caf50,#2e7d32)}
#_sbb.on{background:linear-gradient(135deg,#ff5252,#d32f2f)}
#_chb{bottom:20px;right:20px;width:56px;height:56px;font-size:24px;background:linear-gradient(135deg,#667eea,#764ba2)}
#_inb{bottom:90px;right:20px;background:linear-gradient(135deg,#f093fb,#f5576c)}
#_dpb{bottom:230px;right:20px;background:linear-gradient(135deg,#ef4444,#b91c1c)}
#_sbar{position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#1a1a2e;border-top:3px solid #4caf50;padding:8px 14px;display:flex;align-items:center;gap:8px;transform:translateY(100%)}
#_sbar.on{transform:translateY(0)}
#_sbar input{flex:1;padding:10px 14px;border:2px solid #4caf50;border-radius:10px;font-size:18px;font-family:monospace;outline:none;background:#16213e;color:#fff}
#_sbar .st{font-size:12px;color:#888;padding:4px 10px;background:#0d1b2a;border-radius:6px;display:flex;align-items:center;gap:6px}
#_sbar .st .d{width:8px;height:8px;border-radius:50%;background:#4caf50}
#_sbar button{background:#4caf50;color:#fff;border:none;border-radius:10px;padding:10px 14px;font-size:13px;font-weight:600;cursor:pointer}
#_sbar button.cm{background:#7c4dff}#_sbar button.x{background:transparent;color:#999;font-size:20px}
#_sr{position:relative;z-index:30;display:none;width:100%;padding:12px 16px;background:linear-gradient(135deg,#667eea,#764ba2)}
#_sr.v{display:block}
#_sr input{width:100%;padding:12px 16px 12px 44px;border:2px solid #fff;border-radius:12px;font-size:16px;outline:none;box-sizing:border-box;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23667eea' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'/%3E%3C/svg%3E") 14px center no-repeat;background-size:20px}
#_sr .ct{font-size:12px;color:rgba(255,255,255,0.8);margin-top:6px;text-align:right}
.sh{display:none!important}.shi{background:#fffde7!important;outline:2px solid #ffd700!important}
.ap{position:fixed;bottom:90px;right:20px;z-index:99998;width:380px;height:520px;background:#fff;border-radius:16px;box-shadow:0 10px 60px rgba(0,0,0,0.2);border:1px solid #e0e0e0;display:none;flex-direction:column;overflow:hidden;animation:af .3s}
.ap.on{display:flex}.ap .hd{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:center}
.ap .hd h3{margin:0;font-size:16px;font-weight:600}.ap .hd button{background:rgba(255,255,255,0.2);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:14px}
.ap .ms{flex:1;overflow-y:auto;padding:12px 16px;background:#f8f9fa}
.ap .ms::-webkit-scrollbar{width:5px}.ap .ms::-webkit-scrollbar-thumb{background:#ccc;border-radius:10px}
.ap .m{margin-bottom:12px;max-width:85%;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.5;white-space:pre-wrap;animation:af .3s}
.ap .m.b{background:#fff;color:#333;align-self:flex-start;border-bottom-left-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.06);margin-right:auto}
.ap .m.u{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;align-self:flex-end;border-bottom-right-radius:4px;margin-left:auto}
.ap .m sm{display:block;font-size:11px;opacity:.7;margin-top:4px}
.ap .ip{padding:10px 12px;border-top:1px solid #e8e8e8;display:flex;gap:8px;background:#fff}
.ap .ip input{flex:1;border:1px solid #ddd;border-radius:20px;padding:10px 16px;font-size:14px;outline:none}
.ap .ip button{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:50%;width:40px;height:40px;cursor:pointer;font-size:16px}
.ap .sg{display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px;background:#f0f2ff;border-top:1px solid #e8e8e8}
.ap .sg button{background:#fff;border:1px solid #667eea;color:#667eea;padding:5px 12px;border-radius:14px;font-size:12px;cursor:pointer}
.ap .sg button.bu{background:#ff7043;border-color:#ff7043;color:#fff}
#_inp.ap{max-height:400px;height:auto}#_inp .hd{background:linear-gradient(135deg,#f093fb,#f5576c)}
._ic{padding:12px 16px;font-size:13px;color:#555;overflow-y:auto;flex:1}
._ii{display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #f0f0f0}
._ii span{font-size:18px}
._ie{text-align:center;color:#999;padding:30px 20px;font-size:14px}
#_cam{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:999999;display:none;flex-direction:column;align-items:center;justify-content:center}
#_cam.on{display:flex}#_cam video{max-width:100%;max-height:80vh;border-radius:12px}
#_cam .cx{position:absolute;top:20px;right:20px;background:rgba(255,255,255,0.2);border:none;color:#fff;width:44px;height:44px;border-radius:50%;font-size:22px;cursor:pointer}
#_imp{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:16px;padding:20px;z-index:999999;box-shadow:0 10px 60px rgba(0,0,0,0.3);width:440px;max-width:92vw}
#_imp h3{margin:0 0 10px;font-size:16px;font-weight:600}
#_imp .sub{font-size:12px;color:#888;margin-bottom:8px;line-height:1.5}
#_imp textarea{width:100%;height:160px;border:2px solid #ddd;border-radius:8px;padding:8px;font-size:13px;resize:vertical;outline:none;box-sizing:border-box}
#_imp .row{display:flex;gap:8px;margin-top:10px;align-items:center}
#_imp .row button{flex:1;padding:10px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none}
#_imp .go{background:#00897b;color:#fff}
#_imp .cancel{background:#eee;color:#666}
#_imp .file{flex:2;font-size:12px;color:#555}`
  document.head.appendChild(s)
}

// ==================== SEARCH BAR ====================
// Sits at the top of the page in normal flow (scrolls away naturally),
// only visible on the Tracker tab when logged in, hidden while a modal is open.

function searchBar(){
  var w=document.createElement('div');w.id='_sr'
  w.innerHTML='<input type="text" id="_si" placeholder="🔍 Search products..." autocomplete="off"><div class="ct" id="_sc"></div>'
  document.body.insertBefore(w,document.body.firstChild)
  var inp=document.getElementById('_si')
  inp.addEventListener('input',function(){
    clearTimeout(window._s)
    window._s=setTimeout(doSearch,120)
  })
  inp.addEventListener('keydown',function(e){
    if(e.key==='Escape'){inp.value='';doSearch();inp.blur()}
  })
  // Watch visibility. While visible with a query, keep re-applying the filter,
  // because React re-renders the table during its 5s auto-sync and wipes classes.
  setInterval(function(){
    var w=document.getElementById('_sr');if(!w)return
    var show=!!token()&&!modalOpen()
    if(show){
      var tab=activeTab()
      if(tab==='timeline'||tab==='history')show=false
    }
    if(show){
      w.classList.add('v')
      if(inp.value.trim())doSearch()
    }else if(w.classList.contains('v')){
      w.classList.remove('v')
      clearSearch()
    }
  },400)
}

function activeTab(){
  try{
    var btns=document.querySelectorAll('button')
    for(var i=0;i<btns.length;i++){
      var b=btns[i]
      if(b.className&&b.className.indexOf&&b.className.indexOf('text-amber-600')>-1){
        return (b.textContent||'').trim().toLowerCase()
      }
    }
  }catch(e){}
  return ''
}

function modalOpen(){
  try{
    // Only match the REAL modal overlay (bg-black/50 + fixed inset-0).
    // Do NOT match "backdrop-blur" — the app's sticky header uses that class.
    var sels='[aria-modal="true"],.MuiDialog-root,[class*="bg-black/50"]'
    var m=document.querySelector(sels)
    return !!(m&&m.offsetWidth>0)
  }catch(e){return false}
}

function clearSearch(){
  var inp=document.getElementById('_si'),ct=document.getElementById('_sc')
  if(inp)inp.value=''
  if(ct)ct.textContent=''
  var all=document.querySelectorAll('tr')
  for(var i=0;i<all.length;i++){all[i].classList.remove('sh','shi')}
}

function doSearch(){
  var inp=document.getElementById('_si'),ct=document.getElementById('_sc')
  if(!inp||!ct)return
  var q=inp.value.trim().toLowerCase()
  var all=document.querySelectorAll('tr'),vis=0,tot=0
  for(var i=0;i<all.length;i++){
    var el=all[i]
    if(el.querySelector('th'))continue
    var txt=(el.textContent||'').toLowerCase().replace(/\s+/g,' ').trim()
    if(txt.length<2)continue
    tot++
    var m=!q||txt.indexOf(q)>-1
    el.classList.toggle('sh',!m)
    el.classList.toggle('shi',m&&!!q)
    if(m)vis++
  }
  var label=q?'<b>'+vis+'</b> of <b>'+tot+'</b> match'+(vis===1?'':'es'):'<b>'+tot+'</b> products'
  if(ct.innerHTML!==label)ct.innerHTML=label
  clearTimeout(window._h)
  if(q)window._h=setTimeout(function(){document.querySelectorAll('.shi').forEach(function(e){e.classList.remove('shi')})},2500)
}

// ==================== BARCODE ====================

var sbar=false,cs

function barcode(){
  var b=document.createElement('button');b.id='_sbb';b.className='afb';b.textContent='📷'
  b.onclick=tb;document.body.appendChild(b)
  var bar=document.createElement('div');bar.id='_sbar'
  bar.innerHTML='<span style="color:#4caf50;font-weight:700">📷</span><input id="_sbi" placeholder="Scan..." autocomplete="off"><span class="st"><span class="d"></span><span id="_sst">Ready</span></span><button class="cm">📸</button><button>🔍</button><button class="x">✕</button>'
  document.body.appendChild(bar)
  var inp=bar.querySelector('input')
  inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();scan(inp.value.trim())}})
  var lt=0
  inp.addEventListener('input',function(){var n=Date.now();if(n-lt<80&&inp.value.length>5){clearTimeout(window._st);window._st=setTimeout(function(){scan(inp.value.trim())},100)};lt=n})
  bar.querySelectorAll('button')[0].onclick=cam;bar.querySelectorAll('button')[1].onclick=function(){scan(inp.value.trim())};bar.querySelectorAll('button')[2].onclick=tb
  document.addEventListener('keydown',function(e){if(e.ctrlKey&&e.shiftKey&&(e.key==='b'||e.key==='B')){e.preventDefault();tb()}})
}

function tb(){
  var bar=document.getElementById('_sbar'),b=document.getElementById('_sbb')
  sbar=!sbar;bar.classList.toggle('on',sbar);b.classList.toggle('on',sbar)
  b.textContent=sbar?'✕':'📷'
  if(sbar)setTimeout(function(){document.getElementById('_sbi').focus()},200)
}

function sst(t,c){
  var e=document.getElementById('_sst');if(e)e.textContent=t
  var d=document.querySelector('#_sbar .d');if(d)d.style.background=c||'#4caf50'
}

async function scan(code){
  var t=token();if(!t){toast('Log in first',1);return}
  var c=code.replace(/\D/g,'')
  if(c.length<5){toast('Invalid barcode',1);return}
  sst('🔍...','#ffa726')
  try{
    var r=await fetch('/api/lookup-barcode?barcode='+encodeURIComponent(c),{headers:{'Authorization':'Bearer '+t}})
    var d=await r.json()
    if(d.found){
      sst('✅ '+d.name.substring(0,30),'#4caf50');document.getElementById('_sbi').value=''
      toast('✅ <b>'+d.name+'</b><br>Category: '+d.category)
      setTimeout(function(){sst('Ready','#4caf50')},3000)
    }else{sst('❌ Not found','#ff5252');toast('Not found',1);setTimeout(function(){sst('Ready','#4caf50')},3000)}
  }catch(e){sst('❌ Error','#ff5252');toast('Network error',1);setTimeout(function(){sst('Ready','#4caf50')},3000)}
}

function cam(){
  if(sbar)tb()
  var ov=document.getElementById('_cam')
  if(ov){ov.classList.add('on');return}
  ov=document.createElement('div');ov.id='_cam';ov.className='on'
  ov.innerHTML='<div style="position:absolute;border:2px dashed rgba(76,175,80,0.6);width:250px;height:120px;pointer-events:none"></div><video id="_cv" autoplay playsinline></video><button class="cx">✕</button>'
  document.body.appendChild(ov);ov.querySelector('.cx').onclick=cc
  try{
    navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(function(s){
      cs=s;var v=document.getElementById('_cv');v.srcObject=s;v.play()
      if('BarcodeDetector'in window){
        try{
          new BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e','code_128','code_39']}).then(function(det){
            !function lp(){
              if(!document.getElementById('_cam')||!document.getElementById('_cam').classList.contains('on'))return
              det.detect(v).then(function(b){if(b.length>0){cc();if(!sbar)tb();var inp=document.getElementById('_sbi');if(inp){inp.value=b[0].rawValue;scan(b[0].rawValue)}}else setTimeout(lp,500)}).catch(function(){setTimeout(lp,500)})
            }()
          }).catch(function(){})
        }catch(e){}
      }
    }).catch(function(){toast('Camera denied',1);cc()})
  }catch(e){cc()}
}

function cc(){
  if(cs){cs.getTracks().forEach(function(t){t.stop()});cs=null}
  var ov=document.getElementById('_cam');if(ov){ov.classList.remove('on');setTimeout(function(){if(ov.parentNode)ov.remove()},500)}
}

// ==================== CHAT ====================

var cht=false,ins=false

function chat(){var b=document.createElement('button');b.id='_chb';b.className='afb';b.textContent='🤖';b.onclick=function(){tc()};document.body.appendChild(b)}
function insights(){var b=document.createElement('button');b.id='_inb';b.className='afb';b.textContent='📊';b.onclick=function(){ti()};document.body.appendChild(b)}

function tc(){
  if(ins){var ip=document.getElementById('_inp');if(ip)ip.classList.remove('on');ins=false}
  var p=document.getElementById('_cp');if(!p){mc();return}
  cht=!cht;p.classList.toggle('on',cht)
}

function ti(){
  if(cht){var cp=document.getElementById('_cp');if(cp)cp.classList.remove('on');cht=false}
  var p=document.getElementById('_inp');if(!p){mi();return}
  ins=!ins;p.classList.toggle('on',ins);
  if(ins&&p.querySelector('._ic').children.length<=1)li(p)
}

function mc(){
  cht=true;var p=document.createElement('div');p.className='ap on';p.id='_cp'
  p.innerHTML='<div class="hd"><h3>🤖 AI Assistant</h3><div><button onclick="this.closest(\'.ap\').classList.remove(\'on\');cht=false">✕</button></div></div><div class="ms"></div><div class="sg"></div><div class="ip"><input id="_ci" placeholder="Ask..."><button>➤</button></div>'
  document.body.appendChild(p);bm('👋 Ask about inventory!')
  var s=p.querySelector('.sg');s.innerHTML=''
  var qs=['What\'s expiring?','Show Lowthers Lane','How many items?','What categories?']
  for(var i=0;i<qs.length;i++){(function(q){var b=document.createElement('button');b.textContent=q;b.onclick=function(){var inp=document.getElementById('_ci'),btn=document.querySelector('#_cp .ip button');if(inp&&btn){inp.value=q;btn.click()}};s.appendChild(b)})(qs[i])}
  var bb=document.createElement('button');bb.className='bu';bb.textContent='📧 Backup';bb.onclick=bk;s.appendChild(bb)
  var rb=document.createElement('button');rb.className='bu';rb.textContent='📋 Build Suggestions';rb.style.background='#7b1fa2';rb.style.borderColor='#7b1fa2';rb.onclick=buildRef;s.appendChild(rb)
  var ib=document.createElement('button');ib.className='bu';ib.textContent='📥 Import Products';ib.style.background='#00897b';ib.style.borderColor='#00897b';ib.onclick=importProds;s.appendChild(ib)
  var db=document.createElement('button');db.className='bu';db.textContent='🧹 Remove Duplicates';db.style.background='#e11d48';db.style.borderColor='#e11d48';db.onclick=dedupe;s.appendChild(db)
  var inp=p.querySelector('#_ci'),btn=p.querySelector('.ip button')
  function snd(){var v=inp.value.trim();if(!v)return;inp.value='';um(v);ak(v)}
  btn.onclick=snd;inp.addEventListener('keydown',function(e){if(e.key==='Enter')snd()})}

function bm(t){var p=document.getElementById('_cp');if(!p)return;var m=p.querySelector('.ms');var d=document.createElement('div');d.className='m b';d.innerHTML=t.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<b>$1</b>')+'<sm>AI</sm>';m.appendChild(d);m.scrollTop=m.scrollHeight}
function um(t){var p=document.getElementById('_cp');if(!p)return;var m=p.querySelector('.ms');var d=document.createElement('div');d.className='m u';d.innerHTML=t+'<sm>You</sm>';m.appendChild(d);m.scrollTop=m.scrollHeight}
function tp(){var p=document.getElementById('_cp');if(!p)return;var m=p.querySelector('.ms');var d=document.createElement('div');d.className='m b';d.id='_tp';d.innerHTML='Thinking...<sm>AI</sm>';m.appendChild(d)}
function ntp(){var e=document.getElementById('_tp');if(e)e.remove()}
async function ak(q){var t=token();if(!t){bm('⚠️ Log in.');return}tp()
  try{var r=await fetch('/api/ai/chat',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:JSON.stringify({question:q})});ntp()
  if(!r.ok){bm('⚠️ Error');return}var d=await r.json();bm(d.answer||'No answer.')}catch(e){ntp();bm('⚠️ Network error.')}}
async function bk(){var t=token();if(!t){toast('Log in',1);return}bm('📧 Sending...');tp()
  try{var r=await fetch('/api/backup/email',{method:'POST',headers:{'Authorization':'Bearer '+t}});ntp()
  if(!r.ok){var ed=await r.json().catch(function(){});bm('⚠️ '+(ed&&ed.error||'Failed'));return}var d=await r.json();bm('✅ '+(d.message||'Sent!'));toast('✅ Backed up!')}catch(e){ntp();bm('⚠️ Network error.')}}

async function buildRef(){var t=token();if(!t){toast('Log in',1);return}bm('📋 Building suggestion list...');tp()
  try{var r=await fetch('/api/ai/build-ref',{method:'POST',headers:{'Authorization':'Bearer '+t}});ntp()
  if(!r.ok){var ed=await r.json().catch(function(){});bm('⚠️ '+(ed&&ed.error||'Failed'));return}var d=await r.json();bm('✅ Done! '+d.globalPool+' products available for suggestions.')}catch(e){ntp();bm('⚠️ Network error.')}}

function mi(){ins=true;var p=document.createElement('div');p.className='ap on';p.id='_inp';p.innerHTML='<div class="hd"><h3>📊 Insights</h3><button onclick="this.closest(\'.ap\').classList.remove(\'on\');ins=false">✕</button></div><div class="_ic"><div class="_ie">Loading...</div></div>';document.body.appendChild(p);li(p)}
function li(p){var t=token();if(!t){p.querySelector('._ic').innerHTML='<div class="_ie">⚠️ Log in.</div>';return}
  fetch('/api/ai/insights',{headers:{'Authorization':'Bearer '+t}}).then(function(r){return r.json()}).then(function(d){var c=p.querySelector('._ic');if(!d.insights||!d.insights.length){c.innerHTML='<div class="_ie">📝 Add products first!</div>';return}c.innerHTML=d.insights.map(function(i){return '<div class="_ii"><span>'+(i.icon||'📌')+'</span><div><b>'+i.message+'</b>'+(i.items?'<br><small>'+i.items.join(', ')+'</small>':'')+(i.count!==undefined?'<br><small>Count: '+i.count+'</small>':'')+'</div></div>'}).join('')}).catch(function(){p.querySelector('._ic').innerHTML='<div class="_ie">⚠️ Error.</div>'})}

// ==================== REMOVE DUPLICATES ====================

function dedupeBtn(){
  var b=document.createElement('button');b.id='_dpb';b.className='afb';b.textContent='🧹'
  b.title='Remove duplicate products'
  b.onclick=dedupe
  document.body.appendChild(b)
}

function dedupe(){
  var t=token();if(!t){toast('Log in first',1);return}
  var existing=document.getElementById('_dp_cfm')
  if(existing){existing.remove();return}
  var p=document.createElement('div');p.id='_dp_cfm'
  p.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:16px;padding:20px;z-index:999999;box-shadow:0 10px 60px rgba(0,0,0,0.3);width:360px;max-width:90vw;text-align:center'
  p.innerHTML='<div style="font-size:34px">🧹</div>'+
    '<h3 style="margin:8px 0;font-size:16px;font-weight:600">Remove Duplicate Products</h3>'+
    '<p style="font-size:13px;color:#666;margin:0 0 14px;line-height:1.5">Finds products with the <b>same name and expiry date</b>, keeps the most complete one, and removes the rest. Store quantities are combined.</p>'+
    '<div style="display:flex;gap:8px">'+
    '<button id="_dp_go" style="flex:1;padding:10px;border-radius:8px;border:none;background:#e11d48;color:#fff;font-size:13px;font-weight:600;cursor:pointer">Remove Duplicates</button>'+
    '<button id="_dp_cx" style="flex:1;padding:10px;border-radius:8px;border:none;background:#eee;color:#666;font-size:13px;font-weight:600;cursor:pointer">Cancel</button>'+
    '</div>'
  document.body.appendChild(p)
  document.getElementById('_dp_cx').onclick=function(){p.remove()}
  document.getElementById('_dp_go').onclick=async function(){
    var btn=document.getElementById('_dp_go');btn.textContent='Working...';btn.disabled=true
    try{
      var r=await fetch('/api/products/dedupe',{method:'POST',headers:{'Authorization':'Bearer '+t}})
      var d=await r.json().catch(function(){return{}})
      p.remove()
      if(!r.ok){toast('⚠️ '+(d.error||'Failed'),1);return}
      if(d.duplicatesRemoved===0){toast('✅ No duplicates found — '+d.remainingProducts+' products')}
      else{toast('🧹 Merged '+d.groupsMerged+' group(s), removed '+d.duplicatesRemoved+' duplicate(s)')}
      // Reload so the app's local list matches the cleaned server list
      // (otherwise its 5-second auto-sync would re-add the removed duplicates).
      setTimeout(function(){location.reload()},1200)
    }catch(e){p.remove();toast('⚠️ Network error',1)}
  }
}

// ==================== IMPORT PRODUCTS (CSV / JSON / one-per-line) ====================

function importProds(){
  var t=token();if(!t){toast('Log in first',1);return}
  var existing=document.getElementById('_imp')
  if(existing){existing.remove();return}
  var popup=document.createElement('div');popup.id='_imp'
  popup.innerHTML='<h3>📥 Import Products</h3>'+
    '<div class="sub">Choose your Excel CSV/JSON file, or paste it below.<br>Accepted: <b>CSV</b> (like Excel exports), <b>JSON</b> array, or one product name per line.</div>'+
    '<input type="file" id="_imp_file" accept=".csv,.txt,.json" class="file">'+
    '<textarea id="_imp_text" placeholder="Product Name 1&#10;Product Name 2&#10;Product Name 3&#10;&#10;(or paste your CSV here)"></textarea>'+
    '<div class="row"><button class="go" id="_imp_go">Import</button><button class="cancel" id="_imp_cancel">Cancel</button></div>'
  document.body.appendChild(popup)
  document.getElementById('_imp_cancel').onclick=function(){popup.remove()}
  var file=document.getElementById('_imp_file')
  file.onchange=function(){
    var f=file.files&&file.files[0];if(!f)return
    var rd=new FileReader()
    rd.onload=function(){var ta=document.getElementById('_imp_text');if(ta)ta.value=rd.result||''}
    rd.readAsText(f)
  }
  document.getElementById('_imp_go').onclick=async function(){
    var text=(document.getElementById('_imp_text').value||'').trim()
    if(!text){toast('Choose a file or paste something first',1);return}
    var products=parseImportText(text)
    if(!products.length){toast('No valid products found. Check the file format.',1);return}
    popup.remove();bm('📥 Importing '+products.length+' products...');tp()
    try{
      var r=await fetch('/api/import/products',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:JSON.stringify(products)})
      ntp()
      if(!r.ok){var ed=await r.json().catch(function(){});bm('⚠️ '+(ed&&ed.error||'Import failed'));return}
      var d=await r.json();bm('✅ Imported '+d.added+' products! Suggestions will now include them.')
      toast('✅ Imported '+d.added+' products')
    }catch(e){ntp();bm('⚠️ Network error.')}
  }
}

function splitCsvLine(line,delim){
  var out=[],cur='',q=false
  for(var i=0;i<line.length;i++){
    var ch=line[i]
    if(q){
      if(ch==='"'){if(line[i+1]==='"'){cur+='"';i++}else q=false}
      else cur+=ch
    }else if(ch==='"'){q=true}
    else if(ch===delim){out.push(cur);cur=''}
    else cur+=ch
  }
  out.push(cur)
  return out.map(function(x){return x.trim()})
}

function parseImportText(text){
  text=text.replace(/\r\n?/g,'\n').trim()
  if(!text)return[]
  var t=text.trim()
  // JSON array or {products:[...]}
  if(t.charAt(0)==='['||t.charAt(0)==='{'){
    try{
      var j=JSON.parse(t)
      if(Array.isArray(j))return j.filter(function(x){return x&&x.name})
      if(j&&Array.isArray(j.products))return j.products.filter(function(x){return x&&x.name})
    }catch(e){}
  }
  var lines=text.split('\n').map(function(l){return l.trim()}).filter(function(l){return l.length>0})
  if(!lines.length)return[]
  var delim=lines[0].indexOf('\t')>-1?'\t':','
  var first=splitCsvLine(lines[0],delim)
  var lower=first.map(function(x){return x.toLowerCase()})
  var nameIdx=lower.indexOf('name');if(nameIdx<0)nameIdx=lower.indexOf('product name')
  var catIdx=lower.indexOf('category')
  var barIdx=lower.indexOf('barcode');if(barIdx<0)barIdx=lower.indexOf('upc');if(barIdx<0)barIdx=lower.indexOf('ean')
  var hasHeader=nameIdx>-1
  var out=[]
  for(var i=hasHeader?1:0;i<lines.length;i++){
    var cells=splitCsvLine(lines[i],delim)
    var nm=hasHeader?(cells[nameIdx]||''):(cells[0]||'')
    if(!nm)continue
    var rec={name:nm,category:'Other',barcode:''}
    if(hasHeader){
      if(catIdx>-1&&cells[catIdx])rec.category=cells[catIdx]||'Other'
      if(barIdx>-1&&cells[barIdx])rec.barcode=(cells[barIdx]||'').replace(/\D/g,'')
    }else if(cells.length>1&&cells[1]){rec.category=cells[1]}
    out.push(rec)
  }
  return out
}

})();
