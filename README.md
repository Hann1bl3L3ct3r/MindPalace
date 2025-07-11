# MindPalace

**A persistent Sliver operations console served cold over HTTPS — with logs, uploads, and a taste for control.**

---

## Overview

**MindPalace** is a secure, multi-user web-based terminal for interacting with Sliver C2. It includes real-time session routing, persistent Sliver-client/server processes, dynamic resize handling, session timeouts, audit logging, and shared file upload/download capabilities. Wrapped in HTTPS with optional stealth theming — it’s red team infrastructure built for quiet power.

---

##  Features

*  **Multi-user login** with role-based shell access (admin vs operator)
*  **Persistent Sliver sessions** (sliver-server and sliver-client)
*  **Web-based terminal UI** (xterm.js)
*  **Terminal resize sync**
*  **Session timeouts** for inactivity
*  **Audit logging** of all command input (line-buffered)
*  **File upload/download** via shared `files/` repo
*  **HTTPS (self-signed)** encryption enabled by default

---

##  Installation

###  Prerequisites

* Ubuntu/Debian-based system
* Node.js (LTS)
* `sliver-server` and `sliver-client` binaries available in PATH

###  Auto-Setup

Run the install script:

```bash
./install.sh
```

This will:

* Install Node.js and PM2
* Install all Node dependencies
* Create `.env` file with default users
* Generate self-signed SSL certificates
* Launch the server on `https://localhost:3443`

---

##  Configuration

### `.env`

```env
AUTH_USERS=admin:hunter2,anthony:clarice,hannibal:chianti
```

Define multiple users as `username:password` comma-separated pairs.

###  SSL

Self-signed certs are generated at `cert/cert.pem` and `cert/key.pem`.

---

##  Usage

1. Access via browser: `https://your-host:3443`
2. Login with defined credentials

   * **admin** → launches `sliver-server`
   * **non-admins** → launch `sliver-client`
3. Operate in real-time terminal with audit logging
4. Upload/download files via the bottom pane

---

##  File Sharing

* Upload via form in terminal interface
* Files appear in `files/` directory and are listed dynamically
* Download from browser with one click

---

##  Audit Logs

All user inputs (line-by-line) are written to `audit.log` with timestamps and usernames for traceability.

---

##  Session Persistence

* `sliver-server` starts on boot if not already running
* `sliver-client` persists per user until disconnected or terminated

---

##  Roadmap

*  Per-user file separation (optional toggle)
*  Admin-only file deletion controls
*  Real-time broadcast operator chat
*  Inline command macros / payload quick drops
*  Forensic cleanup options

---

##  Credits

Created by [Hann1bl3L3ct3r](https://github.com/Hann1bl3L3ct3r)

---

## License

This project is intended for **authorized red team and educational use only**. Use responsibly.
