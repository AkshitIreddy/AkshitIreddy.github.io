const http = require('http');
const fs = require('fs');
const path = require('path');

const repositoryRoot = path.resolve(__dirname, '..');
// The authored horizontal site remains the default experience. The component
// build is kept as an opt-in preview instead of silently replacing production.
const siteMode = process.env.SITE_MODE === 'dist' ? 'dist' : 'legacy';
const siteRoot = siteMode === 'dist' ? path.join(repositoryRoot, 'dist') : repositoryRoot;
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
  '.mjs': 'text/javascript; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webm': 'video/webm',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', ...headers });
  res.end(body);
}

function streamFile(res, filename, options) {
  const source = fs.createReadStream(filename, options);
  const abort = () => source.destroy();
  res.once('close', abort);
  source.once('close', () => res.off('close', abort));
  source.once('error', () => {
    if (!res.destroyed) res.destroy();
  });
  source.pipe(res);
}

function handleRequest(req, res) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host || host}`).pathname);
  } catch {
    send(res, 400, 'Bad request');
    return;
  }

  const requested = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
  const filename = path.resolve(siteRoot, `.${requested}`);
  if (filename !== siteRoot && !filename.startsWith(`${siteRoot}${path.sep}`)) {
    send(res, 403, 'Forbidden');
    return;
  }

  fs.stat(filename, (error, stats) => {
    if (error || !stats.isFile()) {
      send(res, 404, 'Not found');
      return;
    }

    const contentType = types[path.extname(filename).toLowerCase()] || 'application/octet-stream';
    const baseHeaders = {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Accept-Ranges': 'bytes',
    };
    const range = req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
    if (req.headers.range && !range) {
      res.writeHead(416, { ...baseHeaders, 'Content-Range': `bytes */${stats.size}` });
      res.end();
      return;
    }

    if (range) {
      const requestedStart = range[1] === '' ? null : Number(range[1]);
      const requestedEnd = range[2] === '' ? null : Number(range[2]);
      const suffixLength = requestedStart === null ? requestedEnd : null;
      const start = suffixLength !== null
        ? Math.max(0, stats.size - suffixLength)
        : requestedStart;
      const end = suffixLength !== null
        ? stats.size - 1
        : Math.min(requestedEnd ?? stats.size - 1, stats.size - 1);
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start > end || start >= stats.size) {
        res.writeHead(416, { ...baseHeaders, 'Content-Range': `bytes */${stats.size}` });
        res.end();
        return;
      }
      res.writeHead(206, {
        ...baseHeaders,
        'Content-Length': end - start + 1,
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
      });
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      streamFile(res, filename, { start, end });
      return;
    }

    res.writeHead(200, {
      ...baseHeaders,
      'Content-Length': stats.size,
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    streamFile(res, filename);
  });
}

function createServer() {
  return http.createServer(handleRequest);
}

if (require.main === module) {
  const entry = path.join(siteRoot, 'index.html');
  if (!fs.existsSync(entry)) {
    throw new Error(`Built site is missing ${entry}. Run the production build before starting the server.`);
  }
  const server = createServer();
  server.listen(port, host, () => {
    console.log(`Software in Motion (${siteMode}): http://${host}:${port}`);
  });
}

module.exports = { createServer, host, port, repositoryRoot, siteMode, siteRoot, types };
