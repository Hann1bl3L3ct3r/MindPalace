// Sliver-only Web Terminal with Persistent Session, Resize Sync, Multi-User Routing, Line-Buffered Audit Logging, HTTPS Encryption, and File Upload Support

const express = require('express');
const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');
const pty = require('node-pty');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
require('dotenv').config();

const app = express();
const server = https.createServer({
  key: fs.readFileSync(path.join(__dirname, 'cert/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert/cert.pem'))
}, app);

const wss = new WebSocket.Server({ noServer: true });

const AUTH_USERS = (process.env.AUTH_USERS || 'admin:hunter2')
  .split(',')
  .map(pair => {
    const [user, pass] = pair.split(':');
    return { user, pass };
  });

const sessionMiddleware = session({
  secret: 'supersecretkey123',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: false,
    maxAge: 15 * 60 * 1000
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'files'));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

if (!fs.existsSync(path.join(__dirname, 'files'))) {
  fs.mkdirSync(path.join(__dirname, 'files'));
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(sessionMiddleware);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/files', express.static(path.join(__dirname, 'files')));

app.get('/', (req, res) => {
  if (req.session.authenticated) {
    return res.redirect('/terminal.html');
  }
  return res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const valid = AUTH_USERS.find(u => u.user === username && u.pass === password);
  if (valid) {
    req.session.authenticated = true;
    req.session.username = username;
    return res.redirect('/terminal.html');
  }
  return res.status(401).send('Invalid credentials');
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).send('Logout failed');
    res.redirect('/');
  });
});

app.get('/whoami', (req, res) => {
  if (req.session.authenticated) {
    res.json({ username: req.session.username });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.session?.authenticated) {
    return res.status(401).send('Unauthorized');
  }
  res.redirect('/terminal.html');
});

app.get('/filelist', (req, res) => {
  if (!req.session?.authenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  fs.readdir(path.join(__dirname, 'files'), (err, files) => {
    if (err) return res.status(500).json({ error: 'Could not list files' });
    res.json(files);
  });
});

server.on('upgrade', (req, socket, head) => {
  sessionMiddleware(req, {}, () => {
    if (!req.session?.authenticated) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });
});

const operatorPTYs = new Map();
const sliverClients = new Set();

// Start sliver-server at launch
if (!operatorPTYs.has('admin')) {
  const adminPTY = pty.spawn('sliver-server', [], {
    name: 'xterm-color',
    cols: 100,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env
  });

  adminPTY.onExit(() => {
    console.log('[!] sliver-server exited. Respawning...');
    operatorPTYs.delete('admin');
  });

  adminPTY.onData(data => {
    for (const client of sliverClients) {
      if (client.username === 'admin' && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
      }
    }
  });

  operatorPTYs.set('admin', adminPTY);
}

wss.on('connection', (ws, req) => {
  const username = req.session.username;
  let ptyProcess;
  let inputBuffer = '';

  if (username === 'admin') {
    ptyProcess = operatorPTYs.get('admin');
  } else {
    if (!operatorPTYs.has(username)) {
      const userPTY = pty.spawn('sliver-client', [], {
        name: 'xterm-color',
        cols: 100,
        rows: 30,
        cwd: process.env.HOME,
        env: process.env
      });

      let selectionSent = false;
      let serverPromptBuffer = '';

      userPTY.onData(data => {
        if (!selectionSent) {
          serverPromptBuffer += data;

          if (data.includes('? Select a server:')) {
            return;
          }

          if (serverPromptBuffer.includes('Use arrows to move') && serverPromptBuffer.includes('@127.0.0.1')) {
            const lines = serverPromptBuffer.split('\n').map(line => line.trim());
            const serverList = lines
              .filter(line => line.includes('@127.0.0.1'))
              .map(line => line.replace(/^>?\s*/, ''));

            const targetIndex = serverList.findIndex(line =>
              line.includes(`${username}@127.0.0.1`)
            );

            if (targetIndex >= 0) {
              const arrows = '\x1B[B'.repeat(targetIndex);
              userPTY.write(arrows + '\r');
              selectionSent = true;
            }

            serverPromptBuffer = '';
            return;
          }
        }

        for (const client of sliverClients) {
          if (client.username === username && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(data);
          }
        }
      });

      userPTY.onExit(() => {
        console.log(`[!] sliver-client for ${username} exited.`);
        operatorPTYs.delete(username);
      });

      operatorPTYs.set(username, userPTY);
    }

    ptyProcess = operatorPTYs.get(username);
  }

  const client = { username, ws };
  sliverClients.add(client);

  ws.on('message', (msg) => {
    try {
      const parsed = JSON.parse(msg);
      if (parsed && parsed.resize && ptyProcess) {
        ptyProcess.resize(parsed.resize.cols, parsed.resize.rows);
        return;
      }
    } catch (e) {
      const input = msg.toString();

      if (input === '\r' || input === '\n') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${username}: ${inputBuffer.trim()}\n`;
        fs.appendFile('audit.log', logEntry, err => {
          if (err) console.error('[!] Failed to write to audit.log:', err);
        });
        inputBuffer = '';
      } else {
        inputBuffer += input;
      }

      if (ptyProcess) ptyProcess.write(msg);
    }
  });

  ws.on('close', () => {
    sliverClients.delete(client);
  });
});

server.listen(3443, () => {
  console.log('[*] Secure multi-user Sliver terminal running at https://localhost:3443');
});
