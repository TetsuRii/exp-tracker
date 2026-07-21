import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
  // Serve index.html for EVERY request - the app is self-contained
  const filePath = path.join(__dirname, 'index.html');
  
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(fs.readFileSync(filePath));
});

server.listen(PORT, '0.0.0.0', () => console.log(`✓ Server running on http://localhost:${PORT}`));
