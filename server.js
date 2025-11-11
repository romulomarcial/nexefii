/**
 * Minimal static dev server for NEXEFII
 * - Serves files from current directory
 * - Listens on PORT env or 8004
 * - Sets Cache-Control: no-store for easier SW testing
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || '8004', 10);
const ROOT = __dirname; // r:\Development\Projects\nexefii

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  if (body && res.req.method !== 'HEAD') res.end(body); else res.end();
}

function safeJoin(base, target) {
  const resolved = path.resolve(base, target);
  if (!resolved.startsWith(base)) return null; // directory traversal guard
  return resolved;
}

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';
    // Normalize and resolve
    const filePath = safeJoin(ROOT, '.' + urlPath);
    if (!filePath) {
      return send(res, 400, { 'Content-Type': 'text/plain' }, 'Bad Request');
    }

    // If path resolves to a directory, try index.html inside
    let finalPath = filePath;
    if (fs.existsSync(finalPath) && fs.statSync(finalPath).isDirectory()) {
      finalPath = path.join(finalPath, 'index.html');
    }

    fs.readFile(finalPath, (err, data) => {
      if (err) {
        // Not found
        if (err.code === 'ENOENT') {
          return send(res, 404, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store'
          }, '404 Not Found');
        }
        // Other error
        return send(res, 500, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store'
        }, '500 Internal Server Error');
      }

      const ext = path.extname(finalPath).toLowerCase();
      const type = MIME[ext] || 'application/octet-stream';

      // Disable aggressive caching during dev; SW will manage caching
      const headers = {
        'Content-Type': type,
        'Cache-Control': 'no-store'
      };

      send(res, 200, headers, data);
    });
  } catch (e) {
    return send(res, 500, { 'Content-Type': 'text/plain; charset=utf-8' }, '500 Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`NEXEFII dev server running at http://localhost:${PORT}/`);
  console.log(`Serving from ${ROOT}`);
});

