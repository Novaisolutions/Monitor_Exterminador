const path = require('path');
const { createServer } = require('http');
const { readFileSync } = require('fs');
const { createReadStream } = require('fs');
const { stat } = require('fs').promises;

const port = process.env.PORT || 4173;
const distPath = path.join(__dirname, 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf'
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

const server = createServer(async (req, res) => {
  let filePath = path.join(distPath, req.url === '/' ? 'index.html' : req.url);
  
  try {
    const stats = await stat(filePath);
    
    if (!stats.isFile()) {
      // Si no es un archivo, servir index.html (SPA routing)
      filePath = path.join(distPath, 'index.html');
    }
  } catch (error) {
    // Si el archivo no existe, servir index.html (SPA routing)
    filePath = path.join(distPath, 'index.html');
  }
  
  try {
    const mimeType = getMimeType(filePath);
    
    res.writeHead(200, {
      'Content-Type': mimeType,
      'Cache-Control': filePath.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    
    createReadStream(filePath).pipe(res);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Error interno del servidor');
  }
});

server.listen(port, () => {
  console.log(`\n🚀 Servidor ejecutándose en http://localhost:${port}`);
  console.log(`📂 Sirviendo archivos desde: ${distPath}`);
  console.log(`⏰ ${new Date().toLocaleString()}\n`);
});
