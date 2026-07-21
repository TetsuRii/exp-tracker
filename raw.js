import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import initSqlJs from 'sql.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'exp-tracker-secret';

const DATA_DIR = __dirname;
const DB_PATH = path.join(DATA_DIR, 'database.sqlite');

const SQL = await initSqlJs();
const db = fs.existsSync(DB_PATH) ? new SQL.Database(fs.readFileSync(DB_PATH)) : new SQL.Database();

db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL)");
db.run("CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, name TEXT NOT NULL, category TEXT DEFAULT 'Other', barcode TEXT DEFAULT '', quantity INTEGER DEFAULT 1, unit TEXT DEFAULT 'pcs', date_recorded TEXT DEFAULT '', expiry_date TEXT DEFAULT '', notes TEXT DEFAULT '', added_at TEXT DEFAULT (datetime('now')), updated_at TEXT)");
db.run("CREATE TABLE IF NOT EXISTS history (id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, product_id TEXT NOT NULL, product_name TEXT NOT NULL, category TEXT DEFAULT '', date TEXT NOT NULL, date_recorded TEXT DEFAULT '', expiry_date TEXT DEFAULT '', quantity INTEGER DEFAULT 1, unit TEXT DEFAULT 'pcs', price REAL DEFAULT 0, notes TEXT DEFAULT '', skip INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))");
db.run("CREATE TABLE IF NOT EXISTS reference_products (id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, name TEXT NOT NULL, category TEXT DEFAULT 'Other', barcode TEXT DEFAULT '', added_at TEXT DEFAULT (datetime('now')))");
saveDb();
console.log('Database ready');

function saveDb() {
  try { fs.writeFileSync(DB_PATH, Buffer.from(db.export())); } catch(e) { console.error('Save error:', e.message); }
}

function sendJSON(res, code, data) {
  try {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  } catch(e) { /* headers already sent */ }
}

function sendFile(res, filePath, mimeType) {
  try {
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(fs.readFileSync(filePath));
      return true;
    }
  } catch(e) { /* ignore */ }
  return false;
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    let parsed = {};
    try { if (body) parsed = JSON.parse(body); } catch {}
    
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const pathname = url.pathname;
      
      if (pathname === '/api/register' && req.method === 'POST') {
        const { username, password } = parsed;
        if (!username || !password) { sendJSON(res, 400, {error:'Missing fields'}); return; }
        const s = db.prepare("SELECT id FROM users WHERE username = ?");
        s.bind([username]);
        if (s.step()) { s.free(); sendJSON(res, 400, {error:'Username taken'}); return; }
        s.free();
        const hash = bcrypt.hashSync(password, 10);
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash]);
        saveDb();
        const s2 = db.prepare("SELECT id FROM users WHERE username = ?");
        s2.bind([username]); s2.step(); const uid = s2.getAsObject().id; s2.free();
        const token = jwt.sign({ userId: uid, username }, JWT_SECRET, { expiresIn: '30d' });
        sendJSON(res, 200, { token, user: { id: uid, username } });
        return;
      }
      
      if (pathname === '/api/login' && req.method === 'POST') {
        const { username, password } = parsed;
        const s = db.prepare("SELECT id, username, password FROM users WHERE username = ?");
        s.bind([username]);
        if (!s.step()) { s.free(); sendJSON(res, 401, {error:'Invalid credentials'}); return; }
        const u = s.getAsObject(); s.free();
        if (!bcrypt.compareSync(password, u.password)) { sendJSON(res, 401, {error:'Invalid credentials'}); return; }
        const token = jwt.sign({ userId: u.id, username: u.username }, JWT_SECRET, { expiresIn: '30d' });
        sendJSON(res, 200, { token, user: { id: u.id, username: u.username } });
        return;
      }
      
      const authHeader = req.headers.authorization;
      let userId = null;
      if (authHeader) {
        try { const d = jwt.verify(authHeader.replace('Bearer ', ''), JWT_SECRET); userId = d.userId; } catch {}
      }
      
      if (pathname === '/api/products' && req.method === 'GET') {
        if (!userId) { sendJSON(res, 401, {error:'No token'}); return; }
        const s = db.prepare('SELECT * FROM products WHERE user_id = ? ORDER BY expiry_date ASC');
        s.bind([userId]); const rows = [];
        while (s.step()) rows.push(s.getAsObject());
        s.free();
        sendJSON(res, 200, rows.map(r => ({ id: r.id, name: r.name, category: r.category, barcode: r.barcode||'', quantity: r.quantity, unit: r.unit, dateRecorded: r.date_recorded||'', expiryDate: r.expiry_date||'', notes: r.notes||'', addedAt: r.added_at, updatedAt: r.updated_at||undefined })));
        return;
      }
      
      if (pathname === '/api/products' && req.method === 'POST') {
        if (!userId) { sendJSON(res, 401, {error:'No token'}); return; }
        const p = parsed;
        db.run("INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), NULL)", [p.id, userId, p.name, p.category||'Other', p.barcode||'', p.quantity||1, p.unit||'pcs', p.dateRecorded||'', p.expiryDate||'', p.notes||'']);
        saveDb();
        sendJSON(res, 200, {success:true,id:p.id});
        return;
      }
      
      if (pathname.startsWith('/api/products/') && req.method === 'PUT') {
        if (!userId) { sendJSON(res, 401, {error:'No token'}); return; }
        const id = pathname.split('/')[3];
        const p = parsed;
        db.run("UPDATE products SET name=?, category=?, barcode=?, quantity=?, unit=?, date_recorded=?, expiry_date=?, notes=?, updated_at=datetime('now') WHERE id=? AND user_id=?", [p.name, p.category, p.barcode||'', p.quantity, p.unit, p.dateRecorded, p.expiryDate, p.notes, id, userId]);
        saveDb();
        sendJSON(res, 200, {success:true});
        return;
      }
      
      if (pathname.startsWith('/api/products/') && req.method === 'DELETE') {
        if (!userId) { sendJSON(res, 401, {error:'No token'}); return; }
        const id = pathname.split('/')[3];
        db.run('DELETE FROM products WHERE id=? AND user_id=?', [id, userId]);
        saveDb();
        sendJSON(res, 200, {success:true});
        return;
      }
      
      if (pathname === '/api/history' && req.method === 'GET') {
        if (!userId) { sendJSON(res, 401, {error:'No token'}); return; }
        const s = db.prepare('SELECT * FROM history WHERE user_id = ? ORDER BY date DESC, created_at DESC');
        s.bind([userId]); const rows = [];
        while (s.step()) rows.push(s.getAsObject());
        s.free();
        sendJSON(res, 200, rows.map(r => ({ id: r.id, productId: r.product_id, productName: r.product_name, category: r.category||'', date: r.date, dateRecorded: r.date_recorded||'', expiryDate: r.expiry_date||'', quantity: r.quantity, unit: r.unit, price: r.price||0, notes: r.notes||'', skip: !!r.skip, createdAt: r.created_at })));
        return;
      }
      
      if (pathname === '/api/reference' && req.method === 'GET') {
        if (!userId) { sendJSON(res, 401, {error:'No token'}); return; }
        const s = db.prepare('SELECT id, name, category, barcode FROM reference_products WHERE user_id = ? ORDER BY name');
        s.bind([userId]); const rows = [];
        while (s.step()) rows.push(s.getAsObject());
        s.free();
        sendJSON(res, 200, rows.map(r => ({ id: r.id, name: r.name, category: r.category||'Other', barcode: r.barcode||'' })));
        return;
      }
      
      if (pathname === '/api/reference' && req.method === 'POST') {
        if (!userId) { sendJSON(res, 401, {error:'No token'}); return; }
        const { products } = parsed;
        if (!Array.isArray(products)) { sendJSON(res, 400, {error:'Products array required'}); return; }
        db.run('DELETE FROM reference_products WHERE user_id = ?', [userId]);
        const s = db.prepare('INSERT INTO reference_products (id, user_id, name, category, barcode) VALUES (?, ?, ?, ?, ?)');
        for (const p of products) s.run([p.id||Date.now().toString()+Math.random(), userId, p.name, p.category||'Other', p.barcode||'']);
        s.free();
        saveDb();
        sendJSON(res, 200, {success:true,count:products.length});
        return;
      }
      
      // Static files
      let filePath = pathname === '/' ? '/index.html' : pathname;
      const fullPath = path.join(__dirname, filePath);
      const mimes = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
      const ext = path.extname(fullPath);
      
      if (sendFile(res, fullPath, mimes[ext] || 'application/octet-stream')) return;
      sendFile(res, path.join(__dirname, 'index.html'), 'text/html');
      
    } catch(err) {
      console.error('Server error:', err.message);
      sendJSON(res, 500, { error: err.message });
    }
  });
});

server.listen(PORT, '0.0.0.0', () => console.log(`✓ Server running on http://localhost:${PORT}`));
