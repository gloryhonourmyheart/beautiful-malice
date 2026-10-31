import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 5173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.glb': 'model/gltf-binary'
};

const server = http.createServer(async (req, res) => {
  try {
    const url = decodeURIComponent(req.url.split('?')[0]);
    let filePath = path.join(root, url === '/' ? 'index.html' : url);

    if (!filePath.startsWith(root)) {
      res.writeHead(403).end('forbidden');
      return;
    }

    let info = await stat(filePath).catch(() => null);
    if (info && info.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      info = await stat(filePath).catch(() => null);
    }
    if (!info) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('404 ' + url);
      return;
    }

    const buf = await readFile(filePath);
    res.writeHead(200, {
      'content-type': MIME[path.extname(filePath)] || 'application/octet-stream',
      'cache-control': 'no-cache'
    }).end(buf);
  } catch (e) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' }).end('500 ' + e.message);
  }
});

server.listen(port, () => {
  console.log(`\n  漂亮的恶意：入学日\n  http://localhost:${port}\n`);
  console.log('  调试：http://localhost:' + port + '/?skipIntro');
  console.log('  Ctrl+C 停止\n');
});
