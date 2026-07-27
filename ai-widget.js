// AI Widget - Lightweight & Clean
(function(){
'use strict'
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',boot)}else{boot()}

function boot(){
  css()
  searchBar()
  barcode()
  chat()
  insights()
  dateInterceptor()
  suggestWatch()
  setInterval(suggestWatch,1500)
  setTimeout(suggestWatch,2000)
  setTimeout(suggestWatch,4000)
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

function ago(d){
  if(!d)return''
  var n=Date.now(),t=new Date(d).getTime(),s=Math.floor((n-t)/1000)
  if(s<0)return'just now'
  if(s<60)return'just now'
  if(s<3600)return Math.floor(s/60)+'m ago'
  if(s<86400)return Math.floor(s/3600)+'h ago'
  return Math.floor(s/86400)+'d ago'
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
#_inb.bd::after{content:'';position:absolute;top:-2px;right:-2px;width:12px;height:12px;background:#ff4444;border-radius:50%;border:2px solid #fff}
#_sbar{position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#1a1a2e;border-top:3px solid #4caf50;padding:8px 14px;display:flex;align-items:center;gap:8px;transform:translateY(100%)}
#_sbar.on{transform:translateY(0)}
#_sbar input{flex:1;padding:10px 14px;border:2px solid #4caf50;border-radius:10px;font-size:18px;font-family:monospace;outline:none;background:#16213e;color:#fff}
#_sbar .st{font-size:12px;color:#888;padding:4px 10px;background:#0d1b2a;border-radius:6px;display:flex;align-items:center;gap:6px}
#_sbar .st .d{width:8px;height:8px;border-radius:50%;background:#4caf50}
#_sbar button{background:#4caf50;color:#fff;border:none;border-radius:10px;padding:10px 14px;font-size:13px;font-weight:600;cursor:pointer}
#_sbar button.cm{background:#7c4dff}#_sbar button.x{background:transparent;color:#999;font-size:20px}
#_sr{position:relative;z-index:999;display:none;width:100%;padding:12px 16px;background:linear-gradient(135deg,#667eea,#764ba2)}
#_sr.v{display:block}
#_sr input{width:100%;padding:12px 16px 12px 44px;border:2px solid #fff;border-radius:12px;font-size:16px;outline:none;box-sizing:border-box;background:#fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23667eea' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'/%3E%3C/svg%3E") 14px center no-repeat;background-size:20px}
#_sr .ct{font-size:12px;color:rgba(255,255,255,0.8);margin-top:6px;text-align:right}
.sh{display:none!important}.shi{background:#fffde7!important;outline:2px solid #ffd700!important}
._db{font-size:11px!important;color:#667eea!important;display:block!important;font-weight:600!important;padding:3px 8px!important;background:#f0f2ff!important;border-radius:4px!important;text-align:center!important;margin:2px 0!important}
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
._ic{padding:12px 16px;font-size:13px;color:#555;overflow-y:auto;flex:1}._ie{text-align:center;color:#999;padding:30px 20px;font-size:14px}
.ai_dd{position:absolute;background:#fff;border:1px solid #ddd;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.15);z-index:999999;max-height:200px;overflow-y:auto;min-width:200px}
.ai_dd-item{padding:8px 14px;font-size:13px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f0f0f0}
.ai_dd-item:hover{background:#f0f2ff}
#_cam{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:999999;display:none;flex-direction:column;align-items:center;justify-content:center}
#_cam.on{display:flex}#_cam video{max-width:100%;max-height:80vh;border-radius:12px}
#_cam .cx{position:absolute;top:20px;right:20px;background:rgba(255,255,255,0.2);border:none;color:#fff;width:44px;height:44px;border-radius:50%;font-size:22px;cursor:pointer}`
  document.head.appendChild(s)
}

// ==================== SEARCH BAR ====================

function searchBar(){
  var w=document.createElement('div');w.id='_sr'
  w.innerHTML='<input type="text" id="_si" placeholder="🔍 Search products..." autocomplete="off"><div class="ct" id="_sc"></div>'
  document.body.insertBefore(w,document.body.firstChild)
  document.getElementById('_si').addEventListener('input',function(){
    clearTimeout(window._s)
    window._s=setTimeout(doSearch,200)
  })
  setTimeout(function(){document.getElementById('_sr')?.classList.add('v')},500)
  setInterval(function(){
    var w=document.getElementById('_sr');if(!w)return
    var modals=document.querySelectorAll('[aria-modal="true"],.MuiDialog-root')
    var has=false
    for(var i=0;i<modals.length;i++){if(modals[i].offsetWidth>0){has=true;break}}
    w.classList.toggle('v',!has)
  },500)
}

function doSearch(){
  var inp=document.getElementById('_si'),ct=document.getElementById('_sc')
  if(!inp||!ct)return
  var q=inp.value.trim().toLowerCase()
  var all=document.querySelectorAll('tr'),vis=0,tot=0
  for(var i=0;i<all.length;i++){
    var el=all[i]
    if(el.querySelector('th'))continue
    var txt=(el.textContent||'').toLowerCase().trim()
    if(txt.length<2)continue
    tot++
    if(!q){el.classList.remove('sh','shi');vis++}
    else if(txt.indexOf(q)>-1){el.classList.remove('sh');el.classList.add('shi');vis++}
    else{el.classList.add('sh');el.classList.remove('shi')}
  }
  ct.innerHTML=q?'<b>'+vis+'</b> of <b>'+tot+'</b> match':'<b>'+tot+'</b> products'
  clearTimeout(window._h)
  window._h=setTimeout(function(){document.querySelectorAll('.shi').forEach(function(e){e.classList.remove('shi')})},2000)
}

// ==================== DATES ====================
// Only runs once: intercepts the React app's own API call to /api/products
// and adds date badges right after the React renders the table.

var _lastProds=null

function dateInterceptor(){
  var orig=window.fetch
  window.fetch=function(){
    var args=arguments
    var url=typeof args[0]==='string'?args[0]:(args[0]&&args[0].url?args[0].url:'')
    return orig.apply(this,args).then(function(resp){
      if(url.indexOf('/api/products')>-1&&(!args[1]||args[1].method==='GET'||!args[1].method)){
        resp.clone().json().then(function(prods){
          if(Array.isArray(prods)&&prods.length){
            _lastProds=prods
            setTimeout(function(){renderDates(prods)},1500)
          }
        }).catch(function(){})
      }
      // When user saves a product edit (PUT), refetch products to get updated date
      if(url.indexOf('/api/products/')>-1&&args[1]&&args[1].method==='PUT'){
        resp.clone().json().then(function(){
          setTimeout(function(){
            var t=token()
            if(t){
              orig('/api/products',{headers:{'Authorization':'Bearer '+t}}).then(function(r){return r.json()}).then(function(prods){
                if(Array.isArray(prods)&&prods.length){
                  _lastProds=prods
                  setTimeout(function(){renderDates(prods)},2000)
                }
              }).catch(function(){})
            }
          },500)
        }).catch(function(){})
      }
      return resp
    })
  }
}

function renderDates(prods){
  var rows=document.querySelectorAll('tr')
  for(var i=0;i<rows.length&&i<100;i++){ // Only check first 100 rows (visible products)
    var row=rows[i]
    if(row.querySelector('th'))continue
    var txt=row.textContent.toLowerCase().trim()
    if(txt.length<3)continue
    var best=null,bestScore=0
    // Only check first 50 products for performance
    for(var p=0;p<prods.length&&p<50;p++){
      var prod=prods[p]
      if(!prod||!prod.name)continue
      var pn=prod.name.toLowerCase().trim()
      if(pn.length<3)continue
      if(txt.indexOf(pn)>-1&&pn.length>bestScore){bestScore=pn.length;best=prod}
    }
    if(!best)continue
    var cells=row.querySelectorAll('td')
    if(cells.length<2)continue
    var lastCell=cells[cells.length-1]
    var span=document.createElement('span')
    span.className='_db'
    if(best.updatedAt)span.textContent='✏️ Edited '+ago(best.updatedAt)
    else if(best.addedAt)span.textContent='➕ Added '+ago(best.addedAt)
    if(span.textContent){
      lastCell.appendChild(document.createElement('br'))
      lastCell.appendChild(span)
    }
  }
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
              if(!document.getElementById('_cam')?.classList.contains('on'))return
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
  p.innerHTML='<div class="hd"><h3>🤖 AI Assistant</h3><div><button onclick="document.getElementById(\'_cp\').querySelector(\'.ms\').innerHTML=\'\';bm(\'Cleared!\')">🗑️</button><button onclick="this.closest(\'.ap\').classList.remove(\'on\');cht=false">✕</button></div></div><div class="ms"></div><div class="sg"></div><div class="ip"><input id="_ci" placeholder="Ask..."><button>➤</button></div>'
  document.body.appendChild(p);bm('👋 Ask about inventory!')
  var s=p.querySelector('.sg');s.innerHTML=''
  var qs=['What\'s expiring?','Show Lowthers Lane','How many items?','What categories?']
  for(var i=0;i<qs.length;i++){(function(q){var b=document.createElement('button');b.textContent=q;b.onclick=function(){var inp=document.getElementById('_ci'),btn=document.querySelector('#_cp .ip button');if(inp&&btn){inp.value=q;btn.click()}};s.appendChild(b)})(qs[i])}
  var bb=document.createElement('button');bb.className='bu';bb.textContent='📧 Backup';bb.onclick=bk;s.appendChild(bb)
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
  if(!r.ok){var ed=await r.json().catch(function(){});bm('⚠️ '+(ed?.error||'Failed'));return}var d=await r.json();bm('✅ '+(d.message||'Sent!'));toast('✅ Backed up!')}catch(e){ntp();bm('⚠️ Network error.')}}

function mi(){ins=true;var p=document.createElement('div');p.className='ap on';p.id='_inp';p.innerHTML='<div class="hd"><h3>📊 Insights</h3><button onclick="this.closest(\'.ap\').classList.remove(\'on\');ins=false">✕</button></div><div class="_ic"><div class="_ie">Loading...</div></div>';document.body.appendChild(p);li(p)}
function li(p){var t=token();if(!t){p.querySelector('._ic').innerHTML='<div class="_ie">⚠️ Log in.</div>';return}
  fetch('/api/ai/insights',{headers:{'Authorization':'Bearer '+t}}).then(function(r){return r.json()}).then(function(d){var c=p.querySelector('._ic');if(!d.insights||!d.insights.length){c.innerHTML='<div class="_ie">📝 Add products first!</div>';return}c.innerHTML=d.insights.map(function(i){return '<div class="_ii"><span>'+(i.icon||'📌')+'</span><div><b>'+i.message+'</b>'+(i.items?'<br><sm>'+i.items.join(', ')+'</sm>':'')+(i.count!==undefined?'<br><sm>Count: '+i.count+'</sm>':'')+'</div></div>'}).join('')}).catch(function(){p.querySelector('._ic').innerHTML='<div class="_ie">⚠️ Error.</div>'})}

// ==================== SUGGESTIONS ====================

var ddi=0

function suggestWatch(){
  var dls=document.querySelectorAll('[role="dialog"],[class*="modal"],[class*="dialog"]')
  for(var i=0;i<dls.length;i++){var d=dls[i];if(d.offsetWidth>0&&!d.dataset.aiM){d.dataset.aiM='1';setTimeout(function(dlg){return function(){eh(dlg)}}(d),400)}}
  var inputs=document.querySelectorAll('input')
  for(var i=0;i<inputs.length;i++){var inp=inputs[i]
    if(inp.dataset.aiE||inp.type==='hidden'||inp.type==='password'||inp.type==='email'||inp.type==='number')continue
    if(inp.id==='_si'||inp.id==='_sbi'||inp.id==='_ci')continue;inp.dataset.aiE='1';se(inp)}}
function eh(c){var inputs=c.querySelectorAll('input');for(var i=0;i<inputs.length;i++){var inp=inputs[i];if(inp.dataset.aiE||inp.type==='hidden'||inp.type==='password'||inp.type==='email'||inp.type==='number')continue;inp.dataset.aiE='1';se(inp)}}
function se(inp){var timer
  inp.addEventListener('input',function(){clearTimeout(timer);rmdd(this);var v=this.value.trim();if(v.length<2)return;var self=this;timer=setTimeout(function(){ge(v,self)},400)})
  inp.addEventListener('blur',function(){var self=this;setTimeout(function(){rmdd(self)},300)})}
function rmdd(inp){var e=document.getElementById('_dd'+(inp.dataset.aiI||''));if(e)e.remove()}
function ge(name,inp){var t=token();if(!t)return;var cf=cf2(inp)
  fetch('/api/ai/categorize',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:JSON.stringify({name:name})}).then(function(r){return r.json()}).then(function(d){if(d.category&&d.category!=='Other'&&d.confidence>0.5&&cf){if(cf.tagName==='SELECT'){for(var i=0;i<cf.options.length;i++){if(cf.options[i].text.toLowerCase()===d.category.toLowerCase()){cf.selectedIndex=i;cf.dispatchEvent(new Event('change',{bubbles:true}));break}}}else{cf.value=d.category;cf.dispatchEvent(new Event('input',{bubbles:true}))}}}).catch(function(){})
  fetch('/api/ai/suggest?q='+encodeURIComponent(name),{headers:{'Authorization':'Bearer '+t}}).then(function(r){return r.json()}).then(function(data){if(!data||!data.length)return;rmdd(inp);ddi++;inp.dataset.aiI=ddi
    var rect=inp.getBoundingClientRect();var dd=document.createElement('div');dd.id='_dd'+ddi;dd.className='ai_dd';dd.style.top=(rect.bottom+4)+'px';dd.style.left=rect.left+'px';dd.style.width=Math.max(rect.width,250)+'px'
    var h='';for(var i=0;i<data.length;i++){var s=data[i];h+='<div class="ai_dd-item" data-n="'+s.name.replace(/"/g,'&quot;')+'" data-c="'+(s.category||'Other').replace(/"/g,'&quot;')+'"><span>'+s.name+'</span><span style="font-size:11px;color:#667eea;background:#f0f2ff;padding:2px 8px;border-radius:10px;margin-left:8px">'+(s.category||'Other')+'</span></div>'}
    dd.innerHTML=h;dd.addEventListener('click',function(e){var item=e.target.closest('.ai_dd-item');if(item){inp.value=item.dataset.n;inp.dispatchEvent(new Event('input',{bubbles:true}));dd.remove()
      if(cf&&item.dataset.c&&item.dataset.c!=='Other'){setTimeout(function(){if(cf.tagName==='SELECT'){for(var i=0;i<cf.options.length;i++){if(cf.options[i].text.toLowerCase()===item.dataset.c.toLowerCase()){cf.selectedIndex=i;cf.dispatchEvent(new Event('change',{bubbles:true}));break}}}else{cf.value=item.dataset.c;cf.dispatchEvent(new Event('input',{bubbles:true}))}},100)}}})
    document.body.appendChild(dd)}).catch(function(){})}
function cf2(inp){var c=inp.closest('form')||inp.closest('[role="dialog"]')||inp.closest('.modal')||inp.closest('div[class*="form"]');if(!c)return null;var sels=c.querySelectorAll('select');for(var i=0;i<sels.length;i++){if(sels[i].options.length>2){var opts=Array.from(sels[i].options).map(function(o){return o.text.toLowerCase()});if(opts.some(function(o){return o==='other'||o.indexOf('category')>-1||o.indexOf('dairy')>-1||o.indexOf('meat')>-1||o.indexOf('beverage')>-1})) return sels[i]}}return null}

})();