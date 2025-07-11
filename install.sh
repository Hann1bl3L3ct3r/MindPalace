#!/bin/bash

set -e

echo "=================================="
echo " Web Terminal Sliver Setup Script"
echo "=================================="

# === Step 1: Install Node.js (LTS)
if ! command -v node >/dev/null 2>&1; then
  echo "[*] Installing Node.js LTS..."
  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "[*] Node.js is already installed: $(node -v)"
fi

# === Step 2: Install PM2 (optional)
if ! command -v pm2 >/dev/null 2>&1; then
  echo "[*] Installing pm2 process manager globally..."
  sudo npm install -g pm2
else
  echo "[*] pm2 is already installed: $(pm2 -v)"
fi

# === Step 3: Install project dependencies
echo "[*] Installing project dependencies..."
npm install express ws node-pty express-session body-parser dotenv multer

# === Step 4: Generate self-signed cert (if missing)
if [ ! -f cert/key.pem ] || [ ! -f cert/cert.pem ]; then
  echo "[*] Generating self-signed TLS certificate..."
  mkdir -p cert
  openssl req -x509 -newkey rsa:4096 -keyout cert/key.pem -out cert/cert.pem \
    -days 365 -nodes -subj "/CN=localhost"
else
  echo "[*] TLS certificate already exists. Skipping..."
fi

# === Step 5: Create .env if missing
if [ ! -f .env ]; then
  echo "[*] Creating .env file with default credentials..."
  cat <<EOF > .env
AUTH_USERS=admin:hunter2
EOF
else
  echo "[*] .env file already exists. Skipping..."
fi

# === Step 6: Verify public files
if [ ! -f public/index.html ] || [ ! -f public/terminal.html ]; then
  echo "[!] Warning: Missing public/index.html or terminal.html"
  echo "    Be sure to copy the HTML files into ./public/"
else
  echo "[*] HTML files detected in ./public/"
fi

# === Step 7: Start server (dev mode)
echo "[*] Starting secure server on https://localhost:3443"
node server.js

# === Tip: Use pm2 to daemonize
# pm2 start server.js --name sliver-console
# pm2 save && pm2 startup

echo "=================================="
echo " Web terminal is now live at:"
echo " → https://localhost:3443"
echo "=================================="
