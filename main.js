const { app, BrowserWindow, session } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

let server;

function startStaticServer() {
  const root = __dirname;
  return new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      const urlPath = (req.url || '/').split('?')[0];
      const rel = urlPath === '/' ? 'index.html' : decodeURIComponent(urlPath.replace(/^\/+/, ''));
      const filePath = path.resolve(root, rel);
      if (!filePath.startsWith(root)) {
        res.writeHead(403); res.end('Forbidden'); return;
      }
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not Found'); return; }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.on('error', () => {
      server.listen(0, '127.0.0.1', () => resolve(server.address().port));
    });
    server.listen(45771, '127.0.0.1', () => resolve(server.address().port));
  });
}

async function createWindow() {
  const port = await startStaticServer();
  // Ensure YouTube embeds receive a valid http Referer header
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['*://*.youtube.com/*', '*://*.youtube-nocookie.com/*', '*://*.googlevideo.com/*'] },
    (details, callback) => {
      details.requestHeaders['Referer'] = `http://127.0.0.1:${port}/`;
      callback({ requestHeaders: details.requestHeaders });
    }
  );
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    autoHideMenuBar: true
  });
  win.loadURL(`http://127.0.0.1:${port}/index.html`);
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (server) try { server.close(); } catch (_) {}
  app.quit();
});
