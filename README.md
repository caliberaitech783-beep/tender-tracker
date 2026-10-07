# Tender Tracker

Local tender management built with the same core stack as BDMS: React/Vite, Express/Node.js and PostgreSQL.

## Open the app

**http://localhost:4310**

Double-click **Start Tender Tracker.cmd** to start it after a restart. It starts the server in the background without a terminal window. The startup script installs locked dependencies and builds the frontend if they are missing.

The first administrator login is saved in **.local/initial-login.txt**. The email is `admin@tender.local`. The password is randomly generated once; startup never resets existing passwords. Use the profile avatar to change your password.

## Development

Requires Node.js 22+ on Windows x64. Installed on this machine during setup.

```powershell
npm ci
npm run build
npm start
```

`npm start` serves the compiled frontend when `dist` exists. To develop with Vite, use `npx vite --host 127.0.0.1`; its API proxy connects to the backend at port 4310.

## Local storage

- PostgreSQL: `%LOCALAPPDATA%\TenderTracker\postgres`, port **5448**. Data is kept outside OneDrive synchronization.
- Database: `tender_tracker`; database password is generated and stored in `.local/database.json`.
- Documents: `data/documents`; downloads go through authenticated application routes.
- Logs: `.local/server.log` and `.local/server-error.log`.
- Backup: Administration → Backup & restore. Backups include document contents and sensitive account data, so keep them private.

The local server binds to loopback only. The app and database do not start automatically at Windows login. Deadline reminder checks run while the application server is running.

Use `Stop-TenderTracker.ps1` to stop the instance started by the launcher. Back up through the app before moving data. Restore accepts an empty tender database and never replaces existing tender records.

## Scope and configuration

See [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md) for workbook mapping, workflow, security, assumptions and integrations.

The referenced `Tender_Details Tracking Roadmap.xlsx` was not supplied. The app provides editable defaults for missing scorecard and detailed RBAC definitions. Company SSO, external DMS, email, WhatsApp and automatic portal feeds need their service details before live verification. In-app reminders and the local document repository work now.

## Tests

```powershell
npm test
node test/workflow.integration.mjs
node test/edge.integration.mjs
npm audit
```

Integration tests require the server to be running and remove only their own verification data. The full workflow test includes restore verification and requires an empty tender workspace; use an isolated test database once real tenders have been entered.
