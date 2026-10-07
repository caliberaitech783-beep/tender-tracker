# Tender Tracker implementation

The application uses the BDMS core stack: React, Vite, Node.js, Express and PostgreSQL. It is a separate local application with a separate database. It does not reuse BDMS credentials, tables or external service accounts.

## Workbook coverage

The supplied `tendor format.xlsx` has 16 sheets. The application implements its 15 modules and all E01–E11 entry functions, 4 summary views, 37 master lists and 76 mapped pipeline fields (60 fields and 16 document links). The nine required document types drive completeness. Submission checklist is a separate tender tab.

The Excel refers to `Tender_Details Tracking Roadmap.xlsx`, including its scorecard, roles matrix, complete later-stage columns and import dictionary. That file was not supplied. The criteria, weights, roles, approvers and later-stage form fields implemented here are documented defaults based on the supplied descriptions. Score weights, bands, role assignments, registration requirements and reminder recipients can be edited in Administration. The roadmap can refine these definitions without changing the core architecture.

Quick Entry's manual Tender ID instruction takes precedence over the conflicting auto-numbering note. Use `TND-YYYY-NNNN`. All money totals are separated by currency. Company SSO and external transports are optional configured integrations; local accounts keep the local application usable. No original DUMMY rows or example tenders were migrated.

## Connected workflow

1. Save a private draft, fill required registration fields, and upload mandatory documents.
2. Register the tender. It joins the shared pipeline as Pending.
3. Prepare the weighted scorecard and request a Director / Bid Committee Go decision.
4. Log queries and official changes. Corrigenda update the deadline and timer while recording previous values.
5. Arrange financial instruments and complete/approve mandatory checklist records.
6. Prepare the technical/commercial offer and request BU Head pricing/submission approval.
7. Record actual submission and acknowledgement. The tender becomes Applied; submitted values lock.
8. Track evaluation and competitors. Propose an outcome, then obtain BU Head approval.
9. Approved outcomes classify Applied bids as Allotted or Not Allotted. Undecided outcomes remain Awaiting Result.

Withdrawals after submission remain Applied and count as Not Allotted. No-Go, cancellation, withdrawal before submission and missed deadlines become Not Applied. Re-tenders are new records. A BU Head-approved unlock opens submitted corrections for one hour. Changed pricing needs new approval.

## Data and access

PostgreSQL tables: users, sessions, masters, settings, tenders, records, documents, approvals, audit, notifications, deliveries and portal_feed. Foreign keys link records to tenders and users. Indexes cover identifiers, reference duplicates, deadline searches, JSON data, child modules and audit history. Singleton records have unique constraints. Changes and approvals run in transactions with row locks; tender revisions reject stale writes.

Master labels have immutable codes. Renaming a display label cannot break a workflow or orphan its historical records. Deactivation preserves previously used values. Drafts are private; user business-unit scopes apply at the API. Prices are removed from unauthorized API responses and mobile requests. Server-side status calculations are shared by summary views and reminders.

Sessions use random tokens, hashed database storage and HTTP-only SameSite cookies. Passwords use per-user salts and scrypt. Initial administrator credentials are generated once and saved to `.local/initial-login.txt`.

## Integrations

Copy `.env.example` to `.env` only when configuring external services. No external credentials were taken from BDMS.

- Company SSO: OpenID Connect with discovery, PKCE, state, nonce, JWT signature/issuer/audience verification, and existing-user assignment. The identity provider must supply the issuer, client ID/secret and registered callback. Sign-in does not auto-provision privileged users.
- Email: SMTP transport for approval and instrument expiry events.
- WhatsApp: Meta Cloud API with an approved template containing two body parameters (title and message), configured sender/token and user phone numbers.
- DMS: local document storage with authenticated downloads and retained versions. An external DMS/network share is not configured.
- Portals: manual discovery capture and reconciliation. No portal/API or scraping permission was specified, so automatic discovery is not enabled.

In-app reminders work without external providers. Logs distinguish Queued, Sent, Failed and Not configured. External delivery cannot be verified until real provider configuration is supplied.

## Verification

`npm test` runs status, time-zone, document and permission tests. With the local server running, `node test/workflow.integration.mjs` exercises the full lifecycle, locks, approvals, uploads, permissions, import/export and backup against PostgreSQL. `node test/edge.integration.mjs` covers missing documents, reference duplicates, stable master codes, business-unit access and portal matching. These scripts create only their own verification fixtures and remove them in cleanup.

`npm run build` produces the production frontend. `npm audit` checks dependency advisories. Desktop and phone layouts are visually reviewed in the local browser. The app remains local; cloud hosting is not configured.
