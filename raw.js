import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import initSqlJs from 'sql.js';
import { guessCategory, suggestProducts, answerQuestion, generateInsights } from './ai-categorizer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const DB_PATH = path.join(__dirname, 'data.db');

const SQL = await initSqlJs();
const db = fs.existsSync(DB_PATH) ? new SQL.Database(fs.readFileSync(DB_PATH)) : new SQL.Database();

db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL)");
db.run("CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, name TEXT NOT NULL, category TEXT DEFAULT 'Other', barcode TEXT DEFAULT '', quantity INTEGER DEFAULT 1, unit TEXT DEFAULT 'pcs', date_recorded TEXT DEFAULT '', expiry_date TEXT DEFAULT '', notes TEXT DEFAULT '', added_at TEXT, updated_at TEXT, store_lowthers INTEGER DEFAULT 0, store_valley INTEGER DEFAULT 0, store_la_tante INTEGER DEFAULT 0)");
db.run("CREATE TABLE IF NOT EXISTS history (id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, product_id TEXT NOT NULL, product_name TEXT NOT NULL, category TEXT DEFAULT '', date TEXT NOT NULL, date_recorded TEXT DEFAULT '', expiry_date TEXT DEFAULT '', quantity INTEGER DEFAULT 1, unit TEXT DEFAULT 'pcs', price REAL DEFAULT 0, notes TEXT DEFAULT '', skip INTEGER DEFAULT 0, created_at TEXT, store_lowthers INTEGER DEFAULT 0, store_valley INTEGER DEFAULT 0, store_la_tante INTEGER DEFAULT 0)");
db.run("CREATE TABLE IF NOT EXISTS reference_products (id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, name TEXT NOT NULL, category TEXT DEFAULT 'Other', barcode TEXT DEFAULT '')");
db.run("CREATE TABLE IF NOT EXISTS barcode_cache (barcode TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT DEFAULT 'Other', image_url TEXT DEFAULT '', looked_up_at TEXT)");
saveDb(); console.log('Server ready on port ' + PORT);

function saveDb() { try { fs.writeFileSync(DB_PATH, Buffer.from(db.export())); } catch(e) {} }
function sj(r, c, d) { try { r.writeHead(c, { 'Content-Type': 'application/json' }); r.end(JSON.stringify(d)); } catch(e) {} }
function sf(r, f, m) { try { if (fs.existsSync(f)) { r.writeHead(200, { 'Content-Type': m }); r.end(fs.readFileSync(f)); return true; } } catch(e) {} return false; }
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    let p = {};
    try { if (body) p = JSON.parse(body); } catch {}
    try {
      const url = new URL(req.url, 'http://localhost');
      const pathname = url.pathname;

      if (pathname === '/api/register' && req.method === 'POST') {
        const { username, password } = p;
        if (!username || !password) { sj(res, 400, { error: 'Missing fields' }); return; }
        const s = db.prepare("SELECT id FROM users WHERE username = ?");
        s.bind([username]); if (s.step()) { s.free(); sj(res, 400, { error: 'Username taken' }); return; } s.free();
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, bcrypt.hashSync(password, 10)]); saveDb();
        const s2 = db.prepare("SELECT id FROM users WHERE username = ?");
        s2.bind([username]); s2.step(); const uid = s2.getAsObject().id; s2.free();
        sj(res, 200, { token: jwt.sign({ userId: uid, username }, JWT_SECRET, { expiresIn: '30d' }), user: { id: uid, username } }); return;
      }
      if (pathname === '/api/login' && req.method === 'POST') {
        const { username, password } = p;
        const s = db.prepare("SELECT id, username, password FROM users WHERE username = ?");
        s.bind([username]); if (!s.step()) { s.free(); sj(res, 401, { error: 'Invalid credentials' }); return; }
        const u = s.getAsObject(); s.free();
        if (!bcrypt.compareSync(password, u.password)) { sj(res, 401, { error: 'Invalid credentials' }); return; }
        sj(res, 200, { token: jwt.sign({ userId: u.id, username: u.username }, JWT_SECRET, { expiresIn: '30d' }), user: { id: u.id, username: u.username } }); return;
      }
      let userId = null;
      if (req.headers.authorization) { try { userId = jwt.verify(req.headers.authorization.replace('Bearer ', ''), JWT_SECRET).userId; } catch {} }
      const a = () => { if (!userId) { sj(res, 401, { error: 'No token' }); return false; } return true; };

      if (pathname === '/api/products' && req.method === 'GET') { if (!a()) return;
        const s = db.prepare('SELECT * FROM products WHERE user_id=? ORDER BY expiry_date ASC');
        s.bind([userId]); const rows = []; while (s.step()) rows.push(s.getAsObject()); s.free();
        sj(res, 200, rows.map(r => ({ id: r.id, name: r.name, category: r.category, barcode: r.barcode||'', quantity: r.quantity, unit: r.unit, dateRecorded: r.date_recorded||'', expiryDate: r.expiry_date||'', notes: r.notes||'', addedAt: r.added_at, updatedAt: r.updated_at||undefined, stores: { lowthers: r.store_lowthers||0, valley: r.store_valley||0, laTante: r.store_la_tante||0 } }))); return;
      }
      if (pathname === '/api/products' && req.method === 'POST') { if (!a()) return;
        const d = p; const st = d.stores||{};
        db.run("INSERT INTO products (id, user_id, name, category, barcode, quantity, unit, date_recorded, expiry_date, notes, added_at, store_lowthers, store_valley, store_la_tante) VALUES (?,?,?,?,?,?,?,?,?,?,datetime('now'),?,?,?)", [d.id, userId, d.name, d.category||'Other', d.barcode||'', d.quantity||1, d.unit||'pcs', d.dateRecorded||'', d.expiryDate||'', d.notes||'', st.lowthers||0, st.valley||0, st.laTante||0]); saveDb();
        sj(res, 200, { success: true, id: d.id }); return;
      }
      if (pathname.startsWith('/api/products/') && req.method === 'PUT') { if (!a()) return;
        const id = pathname.split('/')[3]; const d = p; const st = d.stores||{};
        db.run("UPDATE products SET name=?, category=?, barcode=?, quantity=?, unit=?, date_recorded=?, expiry_date=?, notes=?, updated_at=datetime('now'), store_lowthers=?, store_valley=?, store_la_tante=? WHERE id=? AND user_id=?", [d.name, d.category, d.barcode||'', d.quantity, d.unit, d.dateRecorded, d.expiryDate, d.notes, st.lowthers||0, st.valley||0, st.laTante||0, id, userId]); saveDb();
        sj(res, 200, { success: true }); return;
      }
      if (pathname.startsWith('/api/products/') && req.method === 'DELETE') { if (!a()) return;
        db.run('DELETE FROM products WHERE id=? AND user_id=?', [pathname.split('/')[3], userId]); saveDb(); sj(res, 200, { success: true }); return;
      }
      if (pathname === '/api/history' && req.method === 'GET') { if (!a()) return;
        const s = db.prepare('SELECT * FROM history WHERE user_id=? ORDER BY date DESC, created_at DESC');
        s.bind([userId]); const rows = []; while (s.step()) rows.push(s.getAsObject()); s.free();
        sj(res, 200, rows.map(r => ({ id: r.id, productId: r.product_id, productName: r.product_name, category: r.category||'', date: r.date, dateRecorded: r.date_recorded||'', expiryDate: r.expiry_date||'', quantity: r.quantity, unit: r.unit, price: r.price||0, notes: r.notes||'', skip: !!r.skip, createdAt: r.created_at, stores: { lowthers: r.store_lowthers||0, valley: r.store_valley||0, laTante: r.store_la_tante||0 } }))); return;
      }
      if (pathname === '/api/history' && req.method === 'POST') { if (!a()) return;
        const d = p; const st = d.stores||{};
        db.run("INSERT INTO history (id, user_id, product_id, product_name, category, date, date_recorded, expiry_date, quantity, unit, price, notes, skip, created_at, store_lowthers, store_valley, store_la_tante) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),?,?,?)", [d.id, userId, d.productId, d.productName, d.category||'', d.date, d.dateRecorded||'', d.expiryDate||'', d.quantity||1, d.unit||'pcs', d.price||0, d.notes||'', d.skip?1:0, st.lowthers||0, st.valley||0, st.laTante||0]); saveDb();
        sj(res, 200, { success: true, id: d.id }); return;
      }
      if (pathname.startsWith('/api/history/') && req.method === 'PUT') { if (!a()) return;
        const id = pathname.split('/')[3]; const { notes, skip } = p;
        if (notes !== undefined) db.run('UPDATE history SET notes=? WHERE id=? AND user_id=?', [notes, id, userId]);
        if (skip !== undefined) db.run('UPDATE history SET skip=? WHERE id=? AND user_id=?', [skip?1:0, id, userId]);
        saveDb(); sj(res, 200, { success: true }); return;
      }
      if (pathname === '/api/reference' && req.method === 'GET') { if (!a()) return;
        const s = db.prepare('SELECT id, name, category, barcode FROM reference_products WHERE user_id=? ORDER BY name');
        s.bind([userId]); const rows = []; while (s.step()) rows.push(s.getAsObject()); s.free();
        sj(res, 200, rows.map(r => ({ id: r.id, name: r.name, category: r.category||'Other', barcode: r.barcode||'' }))); return;
      }
      if (pathname === '/api/reference' && req.method === 'POST') { if (!a()) return;
        const { products } = p; if (!Array.isArray(products)) { sj(res, 400, { error: 'Products array required' }); return; }
        db.run('DELETE FROM reference_products WHERE user_id=?', [userId]);
        const s = db.prepare('INSERT INTO reference_products (id, user_id, name, category, barcode) VALUES (?,?,?,?,?)');
        for (const x of products) s.run([x.id||Date.now().toString()+Math.random(), userId, x.name, x.category||'Other', x.barcode||'']);
        s.free(); saveDb(); sj(res, 200, { success: true, count: products.length }); return;
      }
      
      // ==================== BARCODE LOOKUP ====================
      
      // Look up a barcode via Open Food Facts (free, no key needed)
      if (pathname === '/api/lookup-barcode' && req.method === 'GET') { if (!a()) return;
        const barcode = url.searchParams.get('barcode') || '';
        if (!barcode || barcode.length < 5) { sj(res, 400, { error: 'Valid barcode required' }); return; }
        
        // Check local cache first
        const cs = db.prepare("SELECT * FROM barcode_cache WHERE barcode=?");
        cs.bind([barcode]);
        if (cs.step()) {
          const cached = cs.getAsObject();
          cs.free();
          sj(res, 200, { found: true, cached: true, name: cached.name, category: cached.category, imageUrl: cached.image_url || '' });
          return;
        }
        cs.free();
        
        // Fetch from Open Food Facts
        const fetchUrl = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
        fetch(fetchUrl, { headers: { 'User-Agent': 'ExpirationTracker/1.0' } })
          .then(async (apiRes) => {
            if (!apiRes.ok) { sj(res, 200, { found: false, source: 'openfoodfacts', error: 'API returned ' + apiRes.status }); return; }
            const data = await apiRes.json();
            if (!data || data.status !== 1 || !data.product) {
              sj(res, 200, { found: false, source: 'openfoodfacts', barcode: barcode });
              return;
            }
            const product = data.product;
            const name = product.product_name || product.generic_name || product.brands || 'Unknown Product';
            let category = 'Other';
            // Map Open Food Facts categories to our system
            const offCat = (product.categories || '').toLowerCase();
            const offLabels = (product.labels || '').toLowerCase();
            const ingr = (product.ingredients_text || '').toLowerCase();
            if (offCat.includes('beverage') || offCat.includes('drink') || offCat.includes('soda') || offCat.includes('juice') || offCat.includes('coffee') || offCat.includes('tea')) category = 'Beverages';
            else if (offCat.includes('dairy') || offCat.includes('milk') || offCat.includes('cheese') || offCat.includes('yogurt') || offCat.includes('egg')) category = 'Dairy & Eggs';
            else if (offCat.includes('meat') || offCat.includes('poultry') || offCat.includes('beef') || offCat.includes('pork') || offCat.includes('chicken') || offCat.includes('sausage') || offCat.includes('ham')) category = 'Meat & Poultry';
            else if (offCat.includes('seafood') || offCat.includes('fish') || offCat.includes('shrimp') || offCat.includes('tuna') || offCat.includes('salmon')) category = 'Seafood';
            else if (offCat.includes('fruit') || offCat.includes('apple') || offCat.includes('banana') || offCat.includes('berry')) category = 'Fruits';
            else if (offCat.includes('vegetable') || offCat.includes('salad') || offCat.includes('tomato') || offCat.includes('onion') || offCat.includes('potato')) category = 'Vegetables';
            else if (offCat.includes('snack') || offCat.includes('chip') || offCat.includes('cracker') || offCat.includes('cookie') || offCat.includes('candy') || offCat.includes('chocolate')) category = 'Snacks';
            else if (offCat.includes('bread') || offCat.includes('bakery') || offCat.includes('bun') || offCat.includes('pastry') || offCat.includes('cake') || offCat.includes('biscuit')) category = 'Bread & Bakery';
            else if (offCat.includes('frozen') || offCat.includes('ice cream') || offCat.includes('gelato')) category = 'Frozen Foods';
            else if (offCat.includes('condiment') || offCat.includes('sauce') || offCat.includes('dressing') || offCat.includes('ketchup') || offCat.includes('mustard') || offCat.includes('oil') || offCat.includes('vinegar')) category = 'Condiments & Sauces';
            else if (offCat.includes('canned') || offCat.includes('jarred') || offCat.includes('preserve') || offCat.includes('pickle')) category = 'Canned & Jarred';
            else if (offCat.includes('pasta') || offCat.includes('rice') || offCat.includes('grain') || offCat.includes('cereal') || offCat.includes('noodle')) category = 'Grains, Pasta & Rice';
            else if (offCat.includes('spice') || offCat.includes('seasoning') || offCat.includes('herb') || offCat.includes('salt') || offCat.includes('pepper')) category = 'Spices & Seasonings';
            else if (offCat.includes('alcohol') || offCat.includes('beer') || offCat.includes('wine') || offCat.includes('vodka') || offCat.includes('whiskey')) category = 'Alcohol';
            else if (offCat.includes('baby') || offCat.includes('infant')) category = 'Baby & Infant';
            else if (offCat.includes('pet') || offCat.includes('dog') || offCat.includes('cat food')) category = 'Pet Food';
            else if (offCat.includes('cleaning') || offCat.includes('detergent') || offCat.includes('soap')) category = 'Cleaning & Household';
            else if (offCat.includes('personal care') || offCat.includes('cosmetic') || offCat.includes('shampoo')) category = 'Personal Care';
            else {
              // Try our own categorizer as fallback
              const guessed = guessCategory(name);
              if (guessed.confidence > 0.3) category = guessed.category;
            }
            
            const imageUrl = product.image_url || product.image_front_url || '';
            
            // Cache in local DB
            try {
              db.run("INSERT OR REPLACE INTO barcode_cache (barcode, name, category, image_url, looked_up_at) VALUES (?,?,?,?,datetime('now'))", [barcode, name, category, imageUrl]);
              saveDb();
            } catch(e) {}
            
            sj(res, 200, { found: true, cached: false, source: 'openfoodfacts', name, category, imageUrl });
          })
          .catch((e) => {
            console.error('Barcode lookup error:', e.message);
            sj(res, 200, { found: false, source: 'openfoodfacts', error: e.message });
          });
        return;
      }
      
      // ==================== AI ENDPOINTS ====================
      
      // AI: Categorize a product name
      if (pathname === '/api/ai/categorize' && req.method === 'POST') { if (!a()) return;
        const { name } = p;
        if (!name) { sj(res, 400, { error: 'Product name required' }); return; }
        const result = guessCategory(name);
        sj(res, 200, result); return;
      }
      
      // AI: Suggest products based on partial input
      if (pathname === '/api/ai/suggest' && req.method === 'GET') { if (!a()) return;
        const q = url.searchParams.get('q') || '';
        const suggestions = suggestProducts(db, userId, q, 10);
        sj(res, 200, suggestions); return;
      }
      
      // AI: Chat - answer questions about inventory
      if (pathname === '/api/ai/chat' && req.method === 'POST') { if (!a()) return;
        const { question } = p;
        if (!question) { sj(res, 400, { error: 'Question required' }); return; }
        let username = 'User';
        try { username = jwt.verify(req.headers.authorization.replace('Bearer ', ''), JWT_SECRET).username || 'User'; } catch {}
        const result = answerQuestion(db, userId, question, username);
        sj(res, 200, result); return;
      }
      
      // AI: Get insights
      if (pathname === '/api/ai/insights' && req.method === 'GET') { if (!a()) return;
        const result = generateInsights(db, userId);
        sj(res, 200, result); return;
      }
      
      // Serve static files
      const fp = pathname === '/' ? '/index.html' : pathname;
      if (sf(res, path.join(__dirname, fp), MIME[path.extname(fp)] || 'application/octet-stream')) return;
      sf(res, path.join(__dirname, 'index.html'), 'text/html');
    } catch (e) { console.error('Error:', e.message); sj(res, 500, { error: e.message }); }
  });
}).listen(PORT, '0.0.0.0', () => console.log('✓ Server on http://localhost:' + PORT));
