import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MongoClient } from 'mongodb';
import nodemailer from 'nodemailer';
import { guessCategory, suggestProducts, answerQuestion, generateInsights } from './ai-categorizer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const MONGODB_URI = process.env.MONGODB_URI || '';

// Email backup settings
const BACKUP_EMAIL = process.env.BACKUP_EMAIL || '';
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';

let db = null;
let usersCol, productsCol, historyCol, refProductsCol, barcodeCacheCol;

// ==================== DATABASE CONNECTION ====================

async function connectDB() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable not set!');
    console.error('   Go to mongodb.com -> Create free cluster -> Get connection string');
    console.error('   Then set it in Render Dashboard -> Environment Variables');
    process.exit(1);
  }
  
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const database = client.db('exp_tracker');
    
    usersCol = database.collection('users');
    productsCol = database.collection('products');
    historyCol = database.collection('history');
    refProductsCol = database.collection('reference_products');
    barcodeCacheCol = database.collection('barcode_cache');
    
    // Create indexes
    await usersCol.createIndex({ username: 1 }, { unique: true });
    await productsCol.createIndex({ userId: 1 });
    await productsCol.createIndex({ expiryDate: 1 });
    await historyCol.createIndex({ userId: 1 });
    await historyCol.createIndex({ date: -1 });
    await refProductsCol.createIndex({ userId: 1 });
    await barcodeCacheCol.createIndex({ barcode: 1 }, { unique: true });
    
    db = database;
    console.log('✅ Connected to MongoDB Atlas');
    return true;
  } catch (e) {
    console.error('❌ MongoDB connection failed:', e.message);
    process.exit(1);
  }
}

// ==================== EMAIL BACKUP SYSTEM ====================

let emailTransporter = null;

function initEmail() {
  if (!EMAIL_USER || !EMAIL_PASS || !BACKUP_EMAIL) {
    console.log('📧 Email backup: Not configured (set BACKUP_EMAIL, EMAIL_USER, EMAIL_PASS)');
    return false;
  }
  
  try {
    emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: EMAIL_USER, pass: EMAIL_PASS }
    });
    console.log('📧 Email backup: Ready (will send to ' + BACKUP_EMAIL + ')');
    
    // Schedule daily backup at 12:00 PM (noon)
    scheduleDailyBackup();
    return true;
  } catch (e) {
    console.error('📧 Email setup error:', e.message);
    return false;
  }
}

function scheduleDailyBackup() {
  const now = new Date();
  const target = new Date(now);
  target.setHours(12, 0, 0, 0); // 12:00 PM (noon)
  if (target <= now) target.setDate(target.getDate() + 1);
  
  const msUntilTarget = target - now;
  console.log(`📧 First backup scheduled for ${target.toLocaleString()}`);
  
  setTimeout(() => {
    console.log('📧 Running scheduled daily backup...');
    emailBackupToAllUsers();
    // Then run every 24 hours
    setInterval(() => {
      console.log('📧 Running scheduled daily backup...');
      emailBackupToAllUsers();
    }, 24 * 60 * 60 * 1000);
  }, msUntilTarget);
}

async function emailBackupToAllUsers() {
  if (!emailTransporter || !BACKUP_EMAIL) return;
  try {
    const users = await usersCol.find({}).toArray();
    for (const user of users) {
      await sendBackupEmail(user._id.toString(), user.username);
    }
    console.log(`📧 Backup sent for ${users.length} user(s)`);
  } catch (e) {
    console.error('📧 Backup error:', e.message);
  }
}

async function sendBackupEmail(userId, username) {
  if (!emailTransporter || !BACKUP_EMAIL) return;
  
  try {
    const products = await productsCol.find({ userId: userId }).toArray();
    const history = await historyCol.find({ userId: userId }).toArray();
    
    const backup = {
      exportedAt: new Date().toISOString(),
      username: username,
      productCount: products.length,
      historyCount: history.length,
      products: products.map(p => ({
        name: p.name, category: p.category, barcode: p.barcode || '',
        quantity: p.quantity, unit: p.unit, expiryDate: p.expiryDate || '',
        dateRecorded: p.dateRecorded || '', notes: p.notes || '',
        storeLowthers: p.storeLowthers || 0, storeValley: p.storeValley || 0,
        storeLaTante: p.storeLaTante || 0
      })),
      history: history.map(h => ({
        productName: h.productName, category: h.category,
        date: h.date, quantity: h.quantity, unit: h.unit,
        price: h.price || 0, notes: h.notes || '',
        storeLowthers: h.storeLowthers || 0, storeValley: h.storeValley || 0,
        storeLaTante: h.storeLaTante || 0
      }))
    };
    
    const info = await emailTransporter.sendMail({
      from: `"Expiration Tracker" <${EMAIL_USER}>`,
      to: BACKUP_EMAIL,
      subject: `📦 Inventory Backup - ${username} - ${new Date().toLocaleDateString()}`,
      html: `
        <h2>📦 Inventory Backup</h2>
        <p><strong>User:</strong> ${username}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Products:</strong> ${backup.productCount}</p>
        <p><strong>History Entries:</strong> ${backup.historyCount}</p>
        <hr>
        <h3>📋 Products Overview</h3>
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:13px;">
          <tr style="background:#667eea;color:white;">
            <th>Name</th><th>Category</th><th>Qty</th><th>Expiry</th>
            <th>Lowthers</th><th>Valley</th><th>La Tante</th>
          </tr>
          ${backup.products.slice(0, 50).map(p => `
            <tr>
              <td>${p.name}</td>
              <td>${p.category}</td>
              <td>${p.quantity}</td>
              <td>${p.expiryDate || '—'}</td>
              <td>${p.storeLowthers}</td>
              <td>${p.storeValley}</td>
              <td>${p.storeLaTante}</td>
            </tr>
          `).join('')}
          ${backup.products.length > 50 ? `<tr><td colspan="7">... and ${backup.products.length - 50} more products</td></tr>` : ''}
        </table>
        <hr>
        <p style="color:#888;font-size:12px;">Auto-generated by Expiration Tracker | MongoDB Atlas</p>
      `,
      attachments: [{
        filename: `backup-${username}-${new Date().toISOString().split('T')[0]}.json`,
        content: JSON.stringify(backup, null, 2)
      }]
    });
    
    console.log(`📧 Backup emailed for ${username}: ${info.messageId}`);
    return true;
  } catch (e) {
    console.error(`📧 Failed to email backup for ${username}:`, e.message);
    return false;
  }
}

// ==================== SERVER SETUP ====================

function sj(r, c, d) { try { r.writeHead(c, { 'Content-Type': 'application/json' }); r.end(JSON.stringify(d)); } catch(e) {} }
function sf(r, f, m) { try { if (fs.existsSync(f)) { r.writeHead(200, { 'Content-Type': m }); r.end(fs.readFileSync(f)); return true; } } catch(e) {} return false; }
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };

// ==================== START SERVER ====================

async function start() {
  await connectDB();
  initEmail();
  
  console.log('✓ Server ready on port ' + PORT);
}

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  
  let body = '';
  req.on('data', c => body += c);
  req.on('end', async () => {
    let p = {};
    try { if (body) p = JSON.parse(body); } catch {}
    try {
      const url = new URL(req.url, 'http://localhost');
      const pathname = url.pathname;

      // ==================== AUTH ENDPOINTS ====================
      
      if (pathname === '/api/register' && req.method === 'POST') {
        const { username, password } = p;
        if (!username || !password) { sj(res, 400, { error: 'Missing fields' }); return; }
        const existing = await usersCol.findOne({ username });
        if (existing) { sj(res, 400, { error: 'Username taken' }); return; }
        const result = await usersCol.insertOne({
          username, password: bcrypt.hashSync(password, 10),
          createdAt: new Date().toISOString()
        });
        const token = jwt.sign({ userId: result.insertedId.toString(), username }, JWT_SECRET, { expiresIn: '30d' });
        sj(res, 200, { token, user: { id: result.insertedId.toString(), username } }); return;
      }
      
      if (pathname === '/api/login' && req.method === 'POST') {
        const { username, password } = p;
        const user = await usersCol.findOne({ username });
        if (!user || !bcrypt.compareSync(password, user.password)) { sj(res, 401, { error: 'Invalid credentials' }); return; }
        const token = jwt.sign({ userId: user._id.toString(), username: user.username }, JWT_SECRET, { expiresIn: '30d' });
        sj(res, 200, { token, user: { id: user._id.toString(), username: user.username } }); return;
      }
      
      // ==================== AUTH MIDDLEWARE ====================
      
      let userId = null;
      let username = 'User';
      if (req.headers.authorization) {
        try {
          const decoded = jwt.verify(req.headers.authorization.replace('Bearer ', ''), JWT_SECRET);
          userId = decoded.userId;
          username = decoded.username || 'User';
        } catch {}
      }
      const a = () => { if (!userId) { sj(res, 401, { error: 'No token' }); return false; } return true; };

      // ==================== PRODUCTS API ====================
      
      if (pathname === '/api/products' && req.method === 'GET') { if (!a()) return;
        const products = await productsCol.find({ userId }).sort({ expiryDate: 1 }).toArray();
        sj(res, 200, products.map(r => ({
          id: r.id, name: r.name, category: r.category, barcode: r.barcode||'',
          quantity: r.quantity, unit: r.unit, dateRecorded: r.dateRecorded||'',
          expiryDate: r.expiryDate||'', notes: r.notes||'',
          addedAt: r.addedAt, updatedAt: r.updatedAt||undefined,
          stores: { lowthers: r.storeLowthers||0, valley: r.storeValley||0, laTante: r.storeLaTante||0 }
        }))); return;
      }
      
      if (pathname === '/api/products' && req.method === 'POST') { if (!a()) return;
        const d = p; const st = d.stores||{};
        await productsCol.insertOne({
          id: d.id, userId, name: d.name, category: d.category||'Other',
          barcode: d.barcode||'', quantity: d.quantity||1, unit: d.unit||'pcs',
          dateRecorded: d.dateRecorded||'', expiryDate: d.expiryDate||'',
          notes: d.notes||'', addedAt: new Date().toISOString(), updatedAt: null,
          storeLowthers: st.lowthers||0, storeValley: st.valley||0, storeLaTante: st.laTante||0
        });
        sj(res, 200, { success: true, id: d.id }); return;
      }
      
      if (pathname.startsWith('/api/products/') && req.method === 'PUT') { if (!a()) return;
        const id = pathname.split('/')[3]; const d = p; const st = d.stores||{};
        await productsCol.updateOne(
          { id, userId },
          { $set: {
            name: d.name, category: d.category, barcode: d.barcode||'',
            quantity: d.quantity, unit: d.unit, dateRecorded: d.dateRecorded,
            expiryDate: d.expiryDate, notes: d.notes,
            updatedAt: new Date().toISOString(),
            storeLowthers: st.lowthers||0, storeValley: st.valley||0, storeLaTante: st.laTante||0
          }}
        );
        sj(res, 200, { success: true }); return;
      }
      
      if (pathname.startsWith('/api/products/') && req.method === 'DELETE') { if (!a()) return;
        await productsCol.deleteOne({ id: pathname.split('/')[3], userId });
        sj(res, 200, { success: true }); return;
      }
      
      // ==================== HISTORY API ====================
      
      if (pathname === '/api/history' && req.method === 'GET') { if (!a()) return;
        const history = await historyCol.find({ userId }).sort({ date: -1, createdAt: -1 }).toArray();
        sj(res, 200, history.map(r => ({
          id: r.id, productId: r.productId, productName: r.productName,
          category: r.category||'', date: r.date, dateRecorded: r.dateRecorded||'',
          expiryDate: r.expiryDate||'', quantity: r.quantity, unit: r.unit,
          price: r.price||0, notes: r.notes||'', skip: !!r.skip, createdAt: r.createdAt,
          stores: { lowthers: r.storeLowthers||0, valley: r.storeValley||0, laTante: r.storeLaTante||0 }
        }))); return;
      }
      
      if (pathname === '/api/history' && req.method === 'POST') { if (!a()) return;
        const d = p; const st = d.stores||{};
        await historyCol.insertOne({
          id: d.id, userId, productId: d.productId, productName: d.productName,
          category: d.category||'', date: d.date, dateRecorded: d.dateRecorded||'',
          expiryDate: d.expiryDate||'', quantity: d.quantity||1, unit: d.unit||'pcs',
          price: d.price||0, notes: d.notes||'', skip: d.skip?1:0,
          createdAt: new Date().toISOString(),
          storeLowthers: st.lowthers||0, storeValley: st.valley||0, storeLaTante: st.laTante||0
        });
        sj(res, 200, { success: true, id: d.id }); return;
      }
      
      if (pathname.startsWith('/api/history/') && req.method === 'PUT') { if (!a()) return;
        const id = pathname.split('/')[3]; const { notes, skip } = p;
        const update = {};
        if (notes !== undefined) update.notes = notes;
        if (skip !== undefined) update.skip = skip ? 1 : 0;
        await historyCol.updateOne({ id, userId }, { $set: update });
        sj(res, 200, { success: true }); return;
      }
      
      // ==================== REFERENCE PRODUCTS API ====================
      
      if (pathname === '/api/reference' && req.method === 'GET') { if (!a()) return;
        const refs = await refProductsCol.find({ userId }).sort({ name: 1 }).toArray();
        sj(res, 200, refs.map(r => ({ id: r.id, name: r.name, category: r.category||'Other', barcode: r.barcode||'' }))); return;
      }
      
      if (pathname === '/api/reference' && req.method === 'POST') { if (!a()) return;
        const { products } = p;
        if (!Array.isArray(products)) { sj(res, 400, { error: 'Products array required' }); return; }
        await refProductsCol.deleteMany({ userId });
        if (products.length > 0) {
          const docs = products.map(x => ({
            id: x.id || Date.now().toString() + Math.random(),
            userId, name: x.name, category: x.category||'Other', barcode: x.barcode||''
          }));
          await refProductsCol.insertMany(docs);
        }
        sj(res, 200, { success: true, count: products.length }); return;
      }
      
      // ==================== BARCODE LOOKUP ====================
      
      if (pathname === '/api/lookup-barcode' && req.method === 'GET') { if (!a()) return;
        const barcode = url.searchParams.get('barcode') || '';
        if (!barcode || barcode.length < 5) { sj(res, 400, { error: 'Valid barcode required' }); return; }
        
        // Check local cache
        const cached = await barcodeCacheCol.findOne({ barcode });
        if (cached) {
          sj(res, 200, { found: true, cached: true, name: cached.name, category: cached.category, imageUrl: cached.imageUrl || '' });
          return;
        }
        
        // Fetch from Open Food Facts
        try {
          const apiRes = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
            headers: { 'User-Agent': 'ExpirationTracker/1.0' }
          });
          
          if (!apiRes.ok) {
            sj(res, 200, { found: false, source: 'openfoodfacts', error: 'API returned ' + apiRes.status });
            return;
          }
          
          const data = await apiRes.json();
          if (!data || data.status !== 1 || !data.product) {
            sj(res, 200, { found: false, source: 'openfoodfacts', barcode });
            return;
          }
          
          const product = data.product;
          const name = product.product_name || product.generic_name || product.brands || 'Unknown Product';
          let category = 'Other';
          const offCat = (product.categories || '').toLowerCase();
          
          if (offCat.includes('beverage') || offCat.includes('drink') || offCat.includes('soda') || offCat.includes('juice') || offCat.includes('coffee') || offCat.includes('tea')) category = 'Beverages';
          else if (offCat.includes('dairy') || offCat.includes('milk') || offCat.includes('cheese') || offCat.includes('yogurt') || offCat.includes('egg')) category = 'Dairy & Eggs';
          else if (offCat.includes('meat') || offCat.includes('poultry') || offCat.includes('beef') || offCat.includes('pork') || offCat.includes('chicken') || offCat.includes('sausage') || offCat.includes('ham')) category = 'Meat & Poultry';
          else if (offCat.includes('seafood') || offCat.includes('fish') || offCat.includes('shrimp') || offCat.includes('tuna') || offCat.includes('salmon')) category = 'Seafood';
          else if (offCat.includes('fruit')) category = 'Fruits';
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
            const guessed = guessCategory(name);
            if (guessed.confidence > 0.3) category = guessed.category;
          }
          
          const imageUrl = product.image_url || product.image_front_url || '';
          
          // Cache in MongoDB
          await barcodeCacheCol.updateOne(
            { barcode },
            { $set: { barcode, name, category, imageUrl, lookedUpAt: new Date().toISOString() } },
            { upsert: true }
          );
          
          sj(res, 200, { found: true, cached: false, source: 'openfoodfacts', name, category, imageUrl });
        } catch (e) {
          console.error('Barcode lookup error:', e.message);
          sj(res, 200, { found: false, source: 'openfoodfacts', error: e.message });
        }
        return;
      }
      
      // ==================== EMAIL BACKUP ====================
      
      if (pathname === '/api/backup/email' && req.method === 'POST') { if (!a()) return;
        if (!emailTransporter || !BACKUP_EMAIL) {
          sj(res, 400, { error: 'Email backup not configured. Set BACKUP_EMAIL, EMAIL_USER, and EMAIL_PASS in environment variables.' });
          return;
        }
        const sent = await sendBackupEmail(userId, username);
        if (sent) {
          sj(res, 200, { success: true, message: 'Backup emailed to ' + BACKUP_EMAIL });
        } else {
          sj(res, 500, { error: 'Failed to send backup email' });
        }
        return;
      }
      
      // ==================== AI ENDPOINTS ====================
      
      if (pathname === '/api/ai/categorize' && req.method === 'POST') { if (!a()) return;
        const { name } = p;
        if (!name) { sj(res, 400, { error: 'Product name required' }); return; }
        sj(res, 200, guessCategory(name)); return;
      }
      
      if (pathname === '/api/ai/suggest' && req.method === 'GET') { if (!a()) return;
        const q = url.searchParams.get('q') || '';
        const suggestions = await suggestProductsMongo(userId, q, 10);
        sj(res, 200, suggestions); return;
      }
      
      if (pathname === '/api/ai/chat' && req.method === 'POST') { if (!a()) return;
        const { question } = p;
        if (!question) { sj(res, 400, { error: 'Question required' }); return; }
        const result = await answerQuestionMongo(db, userId, question, username);
        sj(res, 200, result); return;
      }
      
      if (pathname === '/api/ai/insights' && req.method === 'GET') { if (!a()) return;
        const result = await generateInsightsMongo(db, userId);
        sj(res, 200, result); return;
      }
      
      // ==================== STATIC FILES ====================
      
      const fp = pathname === '/' ? '/index.html' : pathname;
      if (sf(res, path.join(__dirname, fp), MIME[path.extname(fp)] || 'application/octet-stream')) return;
      sf(res, path.join(__dirname, 'index.html'), 'text/html');
      
    } catch (e) { console.error('Error:', e.message); sj(res, 500, { error: e.message }); }
  });
}).listen(PORT, '0.0.0.0', () => console.log('✓ Server on http://localhost:' + PORT));

start();

// ==================== AI HELPERS (MongoDB version) ====================

async function suggestProductsMongo(userId, partial, limit = 10) {
  if (!partial || partial.length < 2) return [];
  const lower = partial.toLowerCase();
  try {
    const regex = new RegExp(lower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const refs = await refProductsCol.find({ userId, name: regex }).limit(limit).toArray();
    const results = refs.map(r => ({ name: r.name, category: r.category || 'Other' }));
    
    if (results.length < limit) {
      const products = await productsCol.find({ userId, name: regex }).limit(limit - results.length).toArray();
      for (const p of products) {
        if (!results.find(r => r.name === p.name)) {
          results.push({ name: p.name, category: p.category || 'Other' });
        }
      }
    }
    return results;
  } catch (e) {
    console.error('Suggest error:', e.message);
    return [];
  }
}

async function answerQuestionMongo(db, userId, question, username) {
  const lower = question.toLowerCase();
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const products = await productsCol.find({ userId }).sort({ expiryDate: 1 }).toArray();
  
  if (products.length === 0) {
    return { answer: "You don't have any products in your inventory yet. Add some products to get started!", data: null };
  }
  
  const expiringSoon = products.filter(p => p.expiryDate && p.expiryDate >= today && p.expiryDate <= nextWeek);
  const expiringMonth = products.filter(p => p.expiryDate && p.expiryDate >= today && p.expiryDate <= nextMonth);
  const expired = products.filter(p => p.expiryDate && p.expiryDate < today);
  
  let intent = 'general';
  if (lower.includes('expir') && (lower.includes('week') || lower.includes('7 day') || lower.includes('soon'))) intent = 'expiring_week';
  else if (lower.includes('expir') && (lower.includes('month') || lower.includes('30 day'))) intent = 'expiring_month';
  else if (lower.includes('expir') || lower.includes('expired') || lower.includes('past due')) intent = 'expired';
  else if (lower.includes('lowthers')) intent = 'store_lowthers';
  else if (lower.includes('valley')) intent = 'store_valley';
  else if (lower.includes('la tante') || lower.includes('latante')) intent = 'store_laTante';
  else if (lower.includes('store') || lower.includes('all store') || lower.includes('each store')) intent = 'all_stores';
  else if (lower.includes('how many') || lower.includes('count') || lower.includes('total') || lower.includes('how much')) intent = 'total_count';
  else if (lower.includes('category') || lower.includes('type') || lower.includes('kind')) intent = 'categories';
  else if (lower.includes('oldest') || lower.includes('longest')) intent = 'oldest';
  else if (lower.includes('recent') || lower.includes('newest') || lower.includes('latest') || lower.includes('just added')) intent = 'newest';
  else if (lower.includes('most') && lower.includes('store')) intent = 'most_stocked';
  
  let answer = '';
  
  switch (intent) {
    case 'expiring_week':
      if (expiringSoon.length === 0) answer = `✅ Great news! Nothing is expiring in the next 7 days. You have ${products.length} products total.`;
      else answer = `⚠️ You have **${expiringSoon.length} product${expiringSoon.length > 1 ? 's' : ''}** expiring within 7 days:\n\n` +
        expiringSoon.slice(0, 10).map(p => `• ${p.name} — expires ${p.expiryDate}`).join('\n') +
        (expiringSoon.length > 10 ? `\n\n... and ${expiringSoon.length - 10} more` : '');
      break;
    case 'expiring_month':
      if (expiringMonth.length === 0) answer = `✅ Nothing expiring in the next 30 days. All ${products.length} products are good!`;
      else answer = `📅 **${expiringMonth.length} product${expiringMonth.length > 1 ? 's' : ''}** expiring within 30 days:\n\n` +
        expiringMonth.slice(0, 15).map(p => `• ${p.name} — expires ${p.expiryDate} (Qty: ${p.quantity})`).join('\n') +
        (expiringMonth.length > 15 ? `\n\n... and ${expiringMonth.length - 15} more` : '');
      break;
    case 'expired':
      if (expired.length === 0) answer = `✅ No expired products found. All ${products.length} items are within date!`;
      else answer = `❌ **${expired.length} product${expired.length > 1 ? 's' : ''}** are expired:\n\n` +
        expired.slice(0, 10).map(p => `• ${p.name} — expired ${p.expiryDate}`).join('\n') +
        (expired.length > 10 ? `\n\n... and ${expired.length - 10} more` : '');
      break;
    case 'store_lowthers': case 'store_valley': case 'store_laTante': {
      const field = intent === 'store_lowthers' ? 'storeLowthers' : intent === 'store_valley' ? 'storeValley' : 'storeLaTante';
      const storeName = intent === 'store_lowthers' ? 'Lowthers Lane' : intent === 'store_valley' ? 'Valley' : 'La Tante';
      const items = products.filter(p => (p[field] || 0) > 0);
      if (items.length === 0) answer = `📭 No products currently stocked at **${storeName}**.`;
      else {
        const total = items.reduce((sum, p) => sum + (p[field] || 0), 0);
        answer = `🏪 **${storeName}** — ${items.length} product types, ${total} total items:\n\n` +
          items.slice(0, 10).map(p => `• ${p.name} — ${p[field]} pcs`).join('\n') +
          (items.length > 10 ? `\n\n... and ${items.length - 10} more products` : '');
      }
      break;
    }
    case 'all_stores':
      answer = `🏪 **Products by Store:**\n\n` +
        `• **Lowthers Lane**: ${products.filter(p => p.storeLowthers > 0).length} product types, ${products.reduce((s,p) => s + (p.storeLowthers||0), 0)} total\n` +
        `• **Valley**: ${products.filter(p => p.storeValley > 0).length} product types, ${products.reduce((s,p) => s + (p.storeValley||0), 0)} total\n` +
        `• **La Tante**: ${products.filter(p => p.storeLaTante > 0).length} product types, ${products.reduce((s,p) => s + (p.storeLaTante||0), 0)} total\n` +
        `\n📊 **Total**: ${products.length} product types across all stores`;
      break;
    case 'total_count': {
      const totalQty = products.reduce((sum, p) => sum + (p.quantity || 1), 0);
      answer = `📊 You have **${products.length} product types** with a total of **${totalQty} units** across all stores.`;
      break;
    }
    case 'categories': {
      const catCounts = {};
      for (const p of products) { const c = p.category || 'Other'; catCounts[c] = (catCounts[c] || 0) + (p.quantity || 1); }
      const sorted = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
      answer = `📁 **Categories breakdown:**\n\n` + sorted.slice(0, 15).map(([c, n]) => `• **${c}**: ${n} items`).join('\n') +
        (sorted.length > 15 ? `\n\n... and ${sorted.length - 15} more categories` : '');
      break;
    }
    case 'oldest': {
      const oldest = [...products].sort((a, b) => (a.expiryDate || '9999') > (b.expiryDate || '9999') ? 1 : -1).slice(0, 5);
      answer = `⏰ **Items expiring soonest:**\n\n` + oldest.map(p => `• ${p.name} — ${p.expiryDate || 'No expiry date'}`).join('\n');
      break;
    }
    case 'newest': {
      const newest = [...products].sort((a, b) => (b.addedAt || '') > (a.addedAt || '') ? 1 : -1).slice(0, 5);
      answer = `🆕 **Most recently added:**\n\n` + newest.map(p => `• ${p.name} — added ${p.addedAt ? p.addedAt.split('T')[0] : 'unknown'}`).join('\n');
      break;
    }
    case 'most_stocked': {
      const items = products.filter(p => (p.quantity || 1) > 5).sort((a, b) => (b.quantity || 1) - (a.quantity || 1)).slice(0, 10);
      answer = items.length === 0 ? `No products with more than 5 units in stock.` :
        `📦 **Most stocked items:**\n\n` + items.map(p => `• ${p.name} — ${p.quantity} units`).join('\n');
      break;
    }
    default: {
      const catCounts = {};
      for (const p of products) { const c = p.category || 'Other'; catCounts[c] = (catCounts[c] || 0) + (p.quantity || 1); }
      const topCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
      answer = `👋 Hi ${username}! Here's your inventory overview:\n\n` +
        `📊 **${products.length} product types** total\n` +
        `⚠️ **${expiringSoon.length} expiring** within 7 days\n` +
        `❌ **${expired.length} expired** items\n` +
        `🏪 **3 stores** tracked: Lowthers Lane, Valley, La Tante\n\n` +
        `**Top categories:**\n` + topCats.map(([c, n]) => `• ${c}: ${n}`).join('\n') +
        `\n\n💡 Try asking: "What's expiring this week?", "Show Lowthers Lane store", "How many items total?"`;
    }
  }
  
  return { answer, data: null };
}

async function generateInsightsMongo(db, userId) {
  const products = await productsCol.find({ userId }).sort({ expiryDate: 1 }).toArray();
  
  if (products.length === 0) {
    return { insights: [{ type: 'info', icon: '📝', message: 'Your inventory is empty. Start adding products!', priority: 0 }] };
  }
  
  const insights = [];
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const expired = products.filter(p => p.expiryDate && p.expiryDate < today);
  if (expired.length > 0) insights.push({ type: 'danger', icon: '❌', message: `${expired.length} product${expired.length > 1 ? 's' : ''} expired. Consider removing or donating.`, priority: 10, count: expired.length, items: expired.slice(0, 5).map(p => p.name) });
  
  const expiringSoon = products.filter(p => p.expiryDate && p.expiryDate >= today && p.expiryDate <= nextWeek);
  if (expiringSoon.length > 0) insights.push({ type: 'warning', icon: '⚠️', message: `${expiringSoon.length} product${expiringSoon.length > 1 ? 's' : ''} expiring within 7 days. Use them soon!`, priority: 8, count: expiringSoon.length, items: expiringSoon.slice(0, 5).map(p => p.name + ' (' + p.expiryDate + ')') });
  
  const expiringMonth = products.filter(p => p.expiryDate && p.expiryDate > nextWeek && p.expiryDate <= nextMonth);
  if (expiringMonth.length > 0) insights.push({ type: 'info', icon: '📅', message: `${expiringMonth.length} product${expiringMonth.length > 1 ? 's' : ''} expiring within 30 days.`, priority: 5, count: expiringMonth.length, items: expiringMonth.slice(0, 5).map(p => p.name + ' (' + p.expiryDate + ')') });
  
  const noExpiry = products.filter(p => !p.expiryDate);
  if (noExpiry.length > 0) insights.push({ type: 'info', icon: '📋', message: `${noExpiry.length} product${noExpiry.length > 1 ? 's' : ''} missing expiry dates.`, priority: 3, count: noExpiry.length });
  
  const storeCounts = [
    { name: 'Lowthers Lane', count: products.reduce((s,p) => s + (p.storeLowthers||0), 0), products: products.filter(p => (p.storeLowthers||0) > 0).length },
    { name: 'Valley', count: products.reduce((s,p) => s + (p.storeValley||0), 0), products: products.filter(p => (p.storeValley||0) > 0).length },
    { name: 'La Tante', count: products.reduce((s,p) => s + (p.storeLaTante||0), 0), products: products.filter(p => (p.storeLaTante||0) > 0).length }
  ];
  const emptiest = [...storeCounts].sort((a, b) => a.count - b.count)[0];
  insights.push({ type: 'info', icon: '🏪', message: `${emptiest.name} has ${emptiest.count} items across ${emptiest.products} product types.`, priority: 2, store: emptiest });
  
  const catCounts = {};
  for (const p of products) { const c = p.category || 'Other'; catCounts[c] = (catCounts[c] || 0) + (p.quantity || 1); }
  const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (topCat.length > 0) insights.push({ type: 'stats', icon: '📊', message: `Top categories: ${topCat.map(([c, n]) => `${c} (${n})`).join(', ')}`, priority: 1 });
  
  const totalQty = products.reduce((sum, p) => sum + (p.quantity || 1), 0);
  insights.push({ type: 'stats', icon: '📦', message: `Total inventory: ${products.length} product types, ~${totalQty} units across 3 stores.`, priority: 0 });
  
  return {
    insights: insights.sort((a, b) => b.priority - a.priority),
    summary: { totalProducts: products.length, totalQuantity: totalQty, expired: expired.length, expiringSoon: expiringSoon.length, expiringMonth: expiringMonth.length, storeCounts }
  };
}
