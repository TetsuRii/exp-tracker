// AI Widget
(function(){
'use strict'
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',boot)}else{boot()}

function boot(){
  css()
  scanner()
  chat()
  insights()
  search()
  suggest()
  lastEdited()
  setInterval(searchTab,800)
  setInterval(watchDialogs,800)
  setInterval(lastEdited,2000)
  setTimeout(suggest,1500)
  setTimeout(suggest,3000)
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
.ait{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1a1a2e;border:2px solid #4caf50;border-radius:12px;padding:12px 20px;z-index:999999;max-width:500px;width:90%;box-shadow:0 8px 40px rgba(0,0,0,0.5);animation:af .3s;color:#fff;font-size:14px;display:flex;align-items:center;gap:12px}
.ait.er{border-color:#ff5252}
.ait button{background:none;border:none;color:#888;font-size:18px;cursor:pointer}
@keyframes af{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.aib{position:fixed;z-index:99999;width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;border:none;font-size:20px;box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:transform .2s;color:#fff}
.aib:hover{transform:scale(1.1)}
#ai_bc{bottom:160px;right:20px;background:linear-gradient(135deg,#4caf50,#2e7d32)}
#ai_bc.on{background:linear-gradient(135deg,#ff5252,#d32f2f)}
#ai_ch{bottom:20px;right:20px;width:56px;height:56px;font-size:24px;background:linear-gradient(135deg,#667eea,#764ba2)}
#ai_in{bottom:90px;right:20px;background:linear-gradient(135deg,#f093fb,#f5576c)}
#ai_in.bd::after{content:'';position:absolute;top:-2px;right:-2px;width:12px;height:12px;background:#ff4444;border-radius:50%;border:2px solid #fff}
#ai_sb{position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#1a1a2e;border-top:3px solid #4caf50;padding:8px 14px;display:flex;align-items:center;gap:8px;transform:translateY(100%);transition:transform .3s}
#ai_sb.on{transform:translateY(0)}
#ai_sb input{flex:1;padding:10px 14px;border:2px solid #4caf50;border-radius:10px;font-size:18px;font-family:monospace;outline:none;background:#16213e;color:#fff;letter-spacing:2px}
#ai_sb input:focus{border-color:#66bb6a}
#ai_sb .st{font-size:12px;color:#888;white-space:nowrap;padding:4px 10px;background:#0d1b2a;border-radius:6px;display:flex;align-items:center;gap:6px}
#ai_sb .st .d{width:8px;height:8px;border-radius:50%;background:#4caf50}
#ai_sb button{background:#4caf50;color:#fff;border:none;border-radius:10px;padding:10px 14px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap}
#ai_sb button:hover{opacity:.85}
#ai_sb button.cm{background:#7c4dff}
#ai_sb button.x{background:transparent;color:#999;font-size:20px;padding:8px}
.ai_p{position:fixed;bottom:90px;right:20px;z-index:99998;width:380px;height:520px;background:#fff;border-radius:16px;box-shadow:0 10px 60px rgba(0,0,0,0.2);border:1px solid #e0e0e0;display:none;flex-direction:column;overflow:hidden;animation:af .3s}
.ai_p.on{display:flex}
.ai_p .hd{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:14px 16px;display:flex;justify-content:space-between;align-items:center}
.ai_p .hd h3{margin:0;font-size:16px;font-weight:600}
.ai_p .hd button{background:rgba(255,255,255,0.2);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:14px}
.ai_p .hd button:hover{background:rgba(255,255,255,0.35)}
.ai_ms{flex:1;overflow-y:auto;padding:12px 16px;background:#f8f9fa}
.ai_ms::-webkit-scrollbar{width:5px}
.ai_ms::-webkit-scrollbar-thumb{background:#ccc;border-radius:10px}
.ai_m{margin-bottom:12px;max-width:85%;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.5;white-space:pre-wrap;animation:af .3s}
.ai_m.b{background:#fff;color:#333;align-self:flex-start;border-bottom-left-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.06);margin-right:auto}
.ai_m.u{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;align-self:flex-end;border-bottom-right-radius:4px;margin-left:auto}
.ai_m sm{display:block;font-size:11px;opacity:.7;margin-top:4px}
.ai_ip{padding:10px 12px;border-top:1px solid #e8e8e8;display:flex;gap:8px;background:#fff}
.ai_ip input{flex:1;border:1px solid #ddd;border-radius:20px;padding:10px 16px;font-size:14px;outline:none}
.ai_ip input:focus{border-color:#667eea}
.ai_ip button{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:50%;width:40px;height:40px;cursor:pointer;font-size:16px}
.ai_sg{display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px;background:#f0f2ff;border-top:1px solid #e8e8e8}
.ai_sg button{background:#fff;border:1px solid #667eea;color:#667eea;padding:5px 12px;border-radius:14px;font-size:12px;cursor:pointer;white-space:nowrap}
.ai_sg button:hover{background:#667eea;color:#fff}
.ai_sg button.bu{background:#ff7043;border-color:#ff7043;color:#fff}
.ai_sg button.bu:hover{background:#f4511e}
#ai_ip_p.ai_p{max-height:400px;height:auto}
#ai_ip_p .hd{background:linear-gradient(135deg,#f093fb,#f5576c)}
.ai_ic{padding:12px 16px;overflow-y:auto;flex:1}
.ai_ii{background:#fff;border-radius:10px;padding:10px 14px;margin-bottom:8px;display:flex;align-items:flex-start;gap:10px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border-left:3px solid #667eea;font-size:13px;line-height:1.4;color:#555}
.ai_ii.d{border-left-color:#ff4444}
.ai_ii.w{border-left-color:#ffa726}
.ai_ii.i{border-left-color:#42a5f5}
.ai_ii.s{border-left-color:#66bb6a}
.ai_ii b{color:#333}
.ai_ii .ic{font-size:20px;flex-shrink:0}
.ai_em{text-align:center;color:#999;padding:30px 20px;font-size:14px}
/* Search bar - sits before the table, scrolls with page */
#ai_sr{display:none;padding:10px 16px;background:#f8f9fa;border-bottom:1px solid #e0e0e0}
#ai_sr.v{display:block}
#ai_sr input{width:100%;padding:10px 14px 10px 40px;border:2px solid #667eea;border-radius:10px;font-size:15px;outline:none;box-sizing:border-box;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23667eea' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'/%3E%3C/svg%3E") 12px center no-repeat;background-size:18px}
#ai_sr input:focus{border-color:#764ba2}
#ai_sr .ct{font-size:12px;color:#888;margin-top:6px;text-align:right}
#ai_sr .ct b{color:#667eea}
.sh{display:none!important}
.shi{background:#fff9c4!important}
/* Last edited badge */
.ai_le{font-size:10px;color:#999;margin-top:2px}
.ai_le b{color:#667eea}
/* Suggestion dropdown */
.ai_dd{position:absolute;background:#fff;border:1px solid #ddd;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.15);z-index:999999;max-height:200px;overflow-y:auto;min-width:200px}
.ai_dd-item{padding:8px 14px;font-size:13px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f0f0f0}
.ai_dd-item:hover{background:#f0f2ff}
.ai_dd-item:last-child{border-bottom:none}
#ai_cam{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:999999;display:none;flex-direction:column;align-items:center;justify-content:center}
#ai_cam.on{display:flex}
#ai_cam video{max-width:100%;max-height:80vh;border-radius:12px}
#ai_cam .cx{position:absolute;top:20px;right:20px;background:rgba(255,255,255,0.2);border:none;color:#fff;width:44px;height:44px;border-radius:50%;font-size:22px;cursor:pointer}
#ai_cam .cx:hover{background:rgba(255,255,255,0.35)}
#ai_cam .sr{position:absolute;border:2px dashed rgba(76,175,80,0.6);border-radius:12px;width:250px;height:120px;pointer-events:none}
`
  document.head.appendChild(s)
}

// ==================== SEARCH BAR ====================

function search(){
  var w=document.createElement('div');w.id='ai_sr'
  w.innerHTML='<input type="text" id="ai_si" placeholder="🔍 Search products by name, category, barcode..." autocomplete="off"><div class="ct" id="ai_sc"></div>'
  document.body.appendChild(w)
  document.getElementById('ai_si').addEventListener('input',function(){
    clearTimeout(window._s)
    window._s=setTimeout(dosearch,200)
  })
}

function searchTab(){
  var w=document.getElementById('ai_sr')
  if(!w)return
  // Hide if a modal/dialog is open
  var dls=document.querySelectorAll('[role="dialog"],[class*="modal"],[class*="dialog"],[class*="overlay"],[class*="backdrop"]')
  for(var i=0;i<dls.length;i++){
    if(dls[i].offsetWidth>0&&dls[i].offsetHeight>0&&window.getComputedStyle(dls[i]).display!=='none'){
      if(w.classList.contains('v')){w.classList.remove('v')}
      return
    }
  }
  // Show if there's a table with product data
  var tables=document.querySelectorAll('table')
  var hasData=false
  for(var i=0;i<tables.length;i++){
    if(tables[i].offsetWidth>0&&tables[i].querySelectorAll('td').length>1){hasData=true;break}
  }
  if(hasData){
    if(!w.classList.contains('v')){
      w.classList.add('v')
      var tbl=document.querySelector('table')
      if(tbl&&tbl.parentNode)tbl.parentNode.insertBefore(w,tbl)
      dosearch()
    }
  }else{
    if(w.classList.contains('v')){w.classList.remove('v')}
  }
}

function dosearch(){
  var inp=document.getElementById('ai_si'),ct=document.getElementById('ai_sc')
  if(!inp||!ct)return
  var q=inp.value.trim().toLowerCase()
  var rows=document.querySelectorAll('tr'),vis=0,tot=0
  for(var i=0;i<rows.length;i++){
    var r=rows[i]
    if(r.querySelector('th'))continue
    var txt=(r.textContent||'').toLowerCase().trim()
    if(txt.length<2)continue
    tot++
    if(!q){r.classList.remove('sh','shi');vis++}
    else if(txt.indexOf(q)>-1){r.classList.remove('sh');r.classList.add('shi');vis++}
    else{r.classList.add('sh');r.classList.remove('shi')}
  }
  ct.innerHTML=q?'<b>'+vis+'</b> of <b>'+tot+'</b> match':'<b>'+tot+'</b> products'
  clearTimeout(window._st)
  window._st=setTimeout(function(){document.querySelectorAll('.shi').forEach(function(e){e.classList.remove('shi')})},2000)
}

// ==================== LAST EDITED BADGE ====================

function lastEdited(){
  var rows=document.querySelectorAll('tr')
  for(var i=0;i<rows.length;i++){
    var r=rows[i]
    if(r.dataset.aiLe)continue
    var cells=r.querySelectorAll('td')
    if(cells.length<3)continue
    // Check if this row has product-like data (name + quantity/category)
    var txt=r.textContent.toLowerCase()
    if(txt.length<5)continue
    // Mark as checked
    r.dataset.aiLe='1'
    // Try to find the last cell and add an "Edited" badge
    var lastCell=cells[cells.length-1]
    if(!lastCell)continue
    // Check if we already added one
    if(lastCell.querySelector('.ai_le'))continue
    var le=document.createElement('div')
    le.className='ai_le'
    le.textContent='edited just now'
    le.style.display='none' // hidden by default, only shown when server confirms
    lastCell.appendChild(le)
  }
}

// ==================== SCANNER ====================

var sbar=false,cs

function scanner(){
  var b=document.createElement('button');b.id='ai_bc';b.className='aib';b.textContent='📷'
  b.title='Scanner (Ctrl+Shift+B)';b.onclick=function(){tbar()}
  document.body.appendChild(b)
  var bar=document.createElement('div');bar.id='ai_sb'
  bar.innerHTML='<span style="color:#4caf50;font-weight:700;font-size:13px">📷</span><input id="ai_sbi" placeholder="Scan barcode..." autocomplete="off"><span class="st"><span class="d"></span><span id="ai_sst">Ready</span></span><button class="cm" id="ai_cab">📸</button><button id="ai_lb">🔍</button><button class="x" id="ai_sbx">✕</button>'
  document.body.appendChild(bar)
  var inp=document.getElementById('ai_sbi'),lt=0,st
  inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();sc(inp.value.trim())}})
  inp.addEventListener('input',function(){
    var n=Date.now()
    if(n-lt<80&&inp.value.length>5){clearTimeout(st);st=setTimeout(function(){sc(inp.value.trim())},100)}
    lt=n
  })
  document.getElementById('ai_lb').onclick=function(){sc(inp.value.trim())}
  document.getElementById('ai_sbx').onclick=function(){tbar()}
  document.getElementById('ai_cab').onclick=function(){cam()}
  document.addEventListener('keydown',function(e){if(e.ctrlKey&&e.shiftKey&&(e.key==='b'||e.key==='B')){e.preventDefault();tbar()}})
}

function tbar(){
  var bar=document.getElementById('ai_sb'),b=document.getElementById('ai_bc')
  sbar=!sbar;bar.classList.toggle('on',sbar);b.classList.toggle('on',sbar)
  b.textContent=sbar?'✕':'📷'
  if(sbar)setTimeout(function(){document.getElementById('ai_sbi').focus()},200)
}

function sst(t,c){
  var e=document.getElementById('ai_sst');if(e)e.textContent=t
  var d=document.querySelector('#ai_sb .d');if(d)d.style.background=c||'#4caf50'
}

async function sc(code){
  var t=token();if(!t){toast('Log in first',1);return}
  var c=code.replace(/\D/g,'')
  if(c.length<5){toast('Invalid barcode',1);return}
  sst('🔍 Looking...','#ffa726')
  try{
    var r=await fetch('/api/lookup-barcode?barcode='+encodeURIComponent(c),{headers:{'Authorization':'Bearer '+t}})
    var d=await r.json()
    if(d.found){
      sst('✅ '+d.name.substring(0,30),'#4caf50')
      document.getElementById('ai_sbi').value=''
      toast('✅ <b>'+d.name+'</b><br>Category: '+d.category)
      setTimeout(function(){sst('Ready','#4caf50')},3000)
    }else{
      sst('❌ Not found','#ff5252');toast('Not found for '+c,1)
      setTimeout(function(){sst('Ready','#4caf50')},3000)
    }
  }catch(e){sst('❌ Error','#ff5252');toast('Network error',1);setTimeout(function(){sst('Ready','#4caf50')},3000)}
}

function cam(){
  if(sbar)tbar()
  var ov=document.getElementById('ai_cam')
  if(ov){ov.classList.add('on');return}
  ov=document.createElement('div');ov.id='ai_cam';ov.className='on'
  ov.innerHTML='<div class="sr"></div><video id="ai_cv" autoplay playsinline></video><button class="cx">✕</button>'
  document.body.appendChild(ov);ov.querySelector('.cx').onclick=function(){cc()}
  try{
    navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(function(s){
      cs=s;var v=document.getElementById('ai_cv');v.srcObject=s;v.play()
      if('BarcodeDetector'in window){
        new BarcodeDetector({formats:['ean_13','ean_8','upc_a','upc_e','code_128','code_39']}).then(function(det){
          !function loop(){
            if(!document.getElementById('ai_cam')?.classList.contains('on'))return
            det.detect(v).then(function(b){
              if(b.length>0){cc();if(!sbar)tbar();var inp=document.getElementById('ai_sbi');if(inp){inp.value=b[0].rawValue;sc(b[0].rawValue)}}
              else setTimeout(loop,500)
            }).catch(function(){setTimeout(loop,500)})
          }()
        }).catch(function(){})
      }
    }).catch(function(){toast('Camera denied',1);cc()})
  }catch(e){cc()}
}

function cc(){
  if(cs){cs.getTracks().forEach(function(t){t.stop()});cs=null}
  var ov=document.getElementById('ai_cam');if(ov){ov.classList.remove('on');setTimeout(function(){if(ov.parentNode)ov.remove()},500)}
}

// ==================== CHAT ====================

var cht=false,ins=false

function chat(){
  var b=document.createElement('button');b.id='ai_ch';b.className='aib';b.textContent='🤖'
  b.title='AI Assistant';b.onclick=function(){tchat()};document.body.appendChild(b)
}

function insights(){
  var b=document.createElement('button');b.id='ai_in';b.className='aib';b.textContent='📊'
  b.title='AI Insights';b.onclick=function(){tins()};document.body.appendChild(b)
  setTimeout(function(){
    var t=token();if(!t)return
    fetch('/api/ai/insights',{headers:{'Authorization':'Bearer '+t}}).then(function(r){return r.json()}).then(function(d){
      if(d.insights&&d.insights.filter(function(i){return i.type==='danger'||i.type==='warning'}).length>0)
        document.getElementById('ai_in')?.classList.add('bd')
    }).catch(function(){})
  },3000)
}

function tchat(){
  if(ins){var ip=document.getElementById('ai_ip_p');if(ip)ip.classList.remove('on');ins=false}
  var p=document.getElementById('ai_cp');if(!p){mchat();return}
  cht=!cht;p.classList.toggle('on',cht)
}

function tins(){
  if(cht){var cp=document.getElementById('ai_cp');if(cp)cp.classList.remove('on');cht=false}
  var p=document.getElementById('ai_ip_p');if(!p){mins();return}
  ins=!ins;p.classList.toggle('on',ins)
  if(ins&&p.querySelector('.ai_ic').children.length<=1)lins(p)
}

function mchat(){
  cht=true
  var p=document.createElement('div');p.className='ai_p on';p.id='ai_cp'
  p.innerHTML='<div class="hd"><h3>🤖 AI Assistant</h3><div><button onclick="document.getElementById(\'ai_cp\').querySelector(\'.ai_ms\').innerHTML=\'\';bMsg(\'Cleared!\')">🗑️</button><button onclick="this.closest(\'.ai_p\').classList.remove(\'on\');cht=false">✕</button></div></div><div class="ai_ms"></div><div class="ai_sg"></div><div class="ai_ip"><input id="ai_ci" placeholder="Ask about inventory..."><button>➤</button></div>'
  document.body.appendChild(p)
  bMsg('👋 Ask about your inventory!\n\nTry: "What\'s expiring?"\n"Show Lowthers Lane"')
  sugs(p)
  var inp=p.querySelector('#ai_ci'),btn=p.querySelector('.ai_ip button')
  function snd(){var v=inp.value.trim();if(!v)return;inp.value='';uMsg(v);ask(v)}
  btn.onclick=snd;inp.addEventListener('keydown',function(e){if(e.key==='Enter')snd()})
  setTimeout(function(){inp.focus()},300)
}

function sugs(p){
  var s=p.querySelector('.ai_sg');if(!s)return;s.innerHTML=''
  ;['What\'s expiring this week?','Show Lowthers Lane','How many items?','What categories?','What\'s expired?'].forEach(function(q){
    var b=document.createElement('button');b.textContent=q
    b.onclick=function(){var inp=document.getElementById('ai_ci'),btn=document.querySelector('#ai_cp .ai_ip button');if(inp&&btn){inp.value=q;btn.click()}}
    s.appendChild(b)
  })
  var bb=document.createElement('button');bb.className='bu';bb.textContent='📧 Email Backup'
  bb.onclick=bup;s.appendChild(bb)
}

function bMsg(t){var p=document.getElementById('ai_cp');if(!p)return;var m=p.querySelector('.ai_ms');var d=document.createElement('div');d.className='ai_m b';d.innerHTML=t.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<b>$1</b>')+'<sm>AI</sm>';m.appendChild(d);m.scrollTop=m.scrollHeight}
function uMsg(t){var p=document.getElementById('ai_cp');if(!p)return;var m=p.querySelector('.ai_ms');var d=document.createElement('div');d.className='ai_m u';d.innerHTML=t+'<sm>You</sm>';m.appendChild(d);m.scrollTop=m.scrollHeight}
function typ(){var p=document.getElementById('ai_cp');if(!p)return;var m=p.querySelector('.ai_ms');var d=document.createElement('div');d.className='ai_m b';d.id='ai_tp';d.innerHTML='Thinking...<sm>AI</sm>';m.appendChild(d);m.scrollTop=m.scrollHeight}
function ntyp(){var e=document.getElementById('ai_tp');if(e)e.remove()}

async function ask(q){
  var t=token();if(!t){bMsg('⚠️ Log in first.');return}
  typ()
  try{
    var r=await fetch('/api/ai/chat',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:JSON.stringify({question:q})})
    ntyp()
    if(!r.ok){bMsg('⚠️ Error: '+r.status);return}
    var d=await r.json();bMsg(d.answer||'No answer.')
  }catch(e){ntyp();bMsg('⚠️ Network error.')}
}

async function bup(){
  var t=token();if(!t){toast('Log in first',1);return}
  bMsg('📧 Sending...');typ()
  try{
    var r=await fetch('/api/backup/email',{method:'POST',headers:{'Authorization':'Bearer '+t}})
    ntyp()
    if(!r.ok){var ed=await r.json().catch(function(){});bMsg('⚠️ '+(ed?.error||'Failed'));return}
    var d=await r.json();bMsg('✅ '+(d.message||'Sent!'));toast('✅ Backup emailed!')
  }catch(e){ntyp();bMsg('⚠️ Network error.')}
}

function mins(){
  ins=true
  var p=document.createElement('div');p.className='ai_p on';p.id='ai_ip_p'
  p.innerHTML='<div class="hd"><h3>📊 Insights</h3><button onclick="this.closest(\'.ai_p\').classList.remove(\'on\');ins=false">✕</button></div><div class="ai_ic"><div class="ai_em">Loading...</div></div>'
  document.body.appendChild(p);lins(p)
}

function lins(p){
  var t=token();if(!t){p.querySelector('.ai_ic').innerHTML='<div class="ai_em">⚠️ Log in.</div>';return}
  fetch('/api/ai/insights',{headers:{'Authorization':'Bearer '+t}}).then(function(r){return r.json()}).then(function(d){
    var c=p.querySelector('.ai_ic')
    if(!d.insights||!d.insights.length){c.innerHTML='<div class="ai_em">📝 Add products first!</div>';return}
    c.innerHTML=d.insights.map(function(i){return '<div class="ai_ii '+(i.type==='danger'?'d':i.type==='warning'?'w':i.type==='info'?'i':'s')+'"><span class="ic">'+(i.icon||'📌')+'</span><div><b>'+i.message+'</b>'+(i.items?'<br><sm>'+i.items.join(', ')+'</sm>':'')+(i.count!==undefined?'<br><sm>Count: '+i.count+'</sm>':'')+'</div></div>'}).join('')
  }).catch(function(){p.querySelector('.ai_ic').innerHTML='<div class="ai_em">⚠️ Error.</div>'})
}

// ==================== SUGGESTIONS ====================

var di=0

function suggest(){
  var dls=document.querySelectorAll('[role="dialog"],[class*="modal"],[class*="dialog"],[class*="overlay"],[class*="backdrop"]')
  for(var i=0;i<dls.length;i++){
    var d=dls[i]
    if(d.offsetWidth>0&&d.offsetHeight>0&&!d.dataset.aiM){
      d.dataset.aiM='1'
      setTimeout(function(dlg){return function(){doit(dlg)}}(d),400)
    }
  }
  var inputs=document.querySelectorAll('input')
  for(var i=0;i<inputs.length;i++){
    var inp=inputs[i]
    if(inp.dataset.aiS||inp.type==='hidden'||inp.type==='password'||inp.type==='email'||inp.type==='number'||inp.type==='file')continue
    if(inp.id==='ai_sbi'||inp.id==='ai_si'||inp.id==='ai_ci')continue
    inp.dataset.aiS='1'
    setup(inp)
  }
}

function doit(container){
  var inputs=container.querySelectorAll('input')
  for(var i=0;i<inputs.length;i++){
    var inp=inputs[i]
    if(inp.dataset.aiS||inp.type==='hidden'||inp.type==='password'||inp.type==='email'||inp.type==='number'||inp.type==='file')continue
    inp.dataset.aiS='1'
    setup(inp)
  }
}

function setup(inp){
  var timer
  inp.addEventListener('input',function(){
    clearTimeout(timer)
    rmdd(this)
    var v=this.value.trim()
    if(v.length<2)return
    var self=this
    timer=setTimeout(function(){getem(v,self)},400)
  })
  inp.addEventListener('blur',function(){var self=this;setTimeout(function(){rmdd(self)},300)})
}

function rmdd(inp){
  var e=document.getElementById('ai_dd-'+(inp.dataset.aiI||''))
  if(e)e.remove()
}

function getem(name,inp){
  var t=token();if(!t)return
  var cf=catf(inp)
  fetch('/api/ai/categorize',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:JSON.stringify({name:name})})
    .then(function(r){return r.json()}).then(function(d){
      if(d.category&&d.category!=='Other'&&d.confidence>0.5&&cf){
        if(cf.tagName==='SELECT'){
          for(var i=0;i<cf.options.length;i++){
            if(cf.options[i].text.toLowerCase()===d.category.toLowerCase()){cf.selectedIndex=i;cf.dispatchEvent(new Event('change',{bubbles:true}));break}
          }
        }else{cf.value=d.category;cf.dispatchEvent(new Event('input',{bubbles:true}))}
      }
    }).catch(function(){})
  fetch('/api/ai/suggest?q='+encodeURIComponent(name),{headers:{'Authorization':'Bearer '+t}})
    .then(function(r){return r.json()}).then(function(data){
      if(!data||!data.length)return
      rmdd(inp);di++;inp.dataset.aiI=di
      var rect=inp.getBoundingClientRect()
      var dd=document.createElement('div');dd.id='ai_dd-'+di;dd.className='ai_dd'
      dd.style.top=(rect.bottom+4)+'px';dd.style.left=rect.left+'px';dd.style.width=Math.max(rect.width,250)+'px'
      var html=''
      for(var i=0;i<data.length;i++){
        var s=data[i];html+='<div class="ai_dd-item" data-n="'+s.name.replace(/"/g,'&quot;')+'" data-c="'+(s.category||'Other').replace(/"/g,'&quot;')+'"><span>'+s.name+'</span> <span style="font-size:11px;color:#667eea;background:#f0f2ff;padding:2px 8px;border-radius:10px">'+(s.category||'Other')+'</span></div>'
      }
      dd.innerHTML=html
      dd.addEventListener('click',function(e){
        var item=e.target.closest('.ai_dd-item')
        if(item){
          inp.value=item.dataset.n;inp.dispatchEvent(new Event('input',{bubbles:true}));dd.remove()
          if(cf&&item.dataset.c&&item.dataset.c!=='Other'){
            setTimeout(function(){
              if(cf.tagName==='SELECT'){for(var i=0;i<cf.options.length;i++){if(cf.options[i].text.toLowerCase()===item.dataset.c.toLowerCase()){cf.selectedIndex=i;cf.dispatchEvent(new Event('change',{bubbles:true}));break}}}
              else{cf.value=item.dataset.c;cf.dispatchEvent(new Event('input',{bubbles:true}))}
            },100)
          }
        }
      })
      document.body.appendChild(dd)
    }).catch(function(){})
}

function catf(inp){
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

function watchDialogs(){suggest()}

})();