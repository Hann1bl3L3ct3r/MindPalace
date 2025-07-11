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

Post install, enable multiplayer with persistence: 

```bash
sliver-server
multiplayer -p
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
AUTH_USERS=admin:hunter2
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

##  Adding Users 

To add a new user, follow the process below: 

1. Post install, add a user to the .env file for access in the format user:password
2. Change directory into ./operators 
3. Launch sliver-server manually
4. Generate a new operator with: new-operator --name NAME --lhost 127.0.0.1
5. Exit sliver-server 
6. Modify the file name to NAME.cfg matching the name of the user added to the .env file
7. Import the configuration with: sliver-client import NAME.cfg

On login, the username for MindPalace and the sliver-client operator account are automatically associated and a user is assigned their appropriate configuration. 

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
