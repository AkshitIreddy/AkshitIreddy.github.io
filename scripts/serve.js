const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 49173);
const host = process.env.HOST || '127.0.0.1';
const types = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', ...headers });
  res.end(body);
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host || host}`).pathname);
  } catch {
    send(res, 400, 'Bad request');
    return;
  }

  const requested = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
  const filename = path.resolve(root, `.${requested}`);
  if (filename !== root && !filename.startsWith(`${root}${path.sep}`)) {
    send(res, 403, 'Forbidden');
    return;
  }

  fs.stat(filename, (error, stats) => {
    if (error || !stats.isFile()) {
      send(res, 404, 'Not found');
      return;
    }

    res.writeHead(200, {
      'Content-Type': types[path.extname(filename).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    fs.createReadStream(filename).on('error', () => send(res, 500, 'Read error')).pipe(res);
  });
});

server.listen(port, host, () => {
  console.log(`Museum of Behaviors: http://${host}:${port}`);
});
