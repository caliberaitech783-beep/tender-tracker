# Tender Tracker

Caliber Pulse Tender workspace, built with React/Vite, Express/Node.js and PostgreSQL. Production: https://tender.cmll.in.

## Open the app

**http://localhost:4310**

Double-click **Start Tender Tracker.cmd** to start it after a restart. It starts the server in the background without a terminal window. The startup script installs locked dependencies and builds the frontend if they are missing.

**BDMS-managed deployment:** sign in with the BDMS user name and password. Accounts, password changes and per-user Tender permissions are managed through the BDMS user master. Select Tender User and customise its desktop/mobile menus and submenus. The header provides Logout, Go to BDMS login, and Logout and go to BDMS login.

Tender sessions appear in BDMS User sessions as Tender User, including device/IP details, online status and login history. Administrators can send session messages or force-close access. Sessions have the same 30-day absolute lifetime as BDMS; inactivity does not sign users out. Existing Tender sessions created before central session tracking require one fresh sign-in. Logout closes the current Tender session while keeping separately signed-in BDMS sessions available.

**Standalone configuration:** the generated initial administrator login is saved in `.local/initial-login.txt`. This account and local password changes are disabled when `IDENTITY_PROVIDER=bdms`.

## Development

New tender offers **New form** and **Upload Excel**. Users with tender creation access can download the Excel template, validate up to 1,000 rows, and import valid rows as drafts. Imported drafts appear in Tender pipeline immediately for the uploader. Complete the required details and documents before registration. The template's Master values sheet contains the codes accepted by the importer. Blank owner and business-unit values inherit the uploading user's profile.

Status views are available as tabs above the tender list. Administration requires an administrator role on both the client and server. The companion BDMS integration in `../bdms-tender-integration/tender-identity.mjs` grants BDMS/Pulse Admin and Super Admin accounts Tender administration through the existing credentials, while regular Tender Users retain their individual permissions. Deploy both applications together to apply this identity change in production.

On **Register a new tender**, select **Import Excel / CSV** and upload a completed `tender-import-template.xlsx` or CSV with the same headers. One tender row fills the form directly; multiple rows open a chooser. Non-empty imported values replace current fields, while blank cells keep current values. Dates should use Excel dates or `YYYY-MM-DD`, and times should use Excel times or `HH:MM`. Invalid options are skipped with warnings. Review the form, then save a draft or register normally. Importing does not save a tender, upload documents, or approve a Go / No-Go decision.

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
