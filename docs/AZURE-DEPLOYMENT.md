# Tender Tracker on Azure

Target public address: `https://tender.cmll.in`.

## Deployed resources

| Resource | Name |
| --- | --- |
| Subscription | 58ca09cf-ab5d-47a8-a438-e1fb2a40d030 |
| Resource group | coalmine-fleet-maintenance-rg |
| App Service | tender-tracker-783 |
| App Service plan | ASP-coalminefleetmaintenancerg-b234 (existing P2v3 Linux plan) |
| PostgreSQL server | coalmine-fleet-pg-783 (existing private server) |
| Database / login | tender_tracker / tender_app |
| Front Door profile | coalmine-afd-783 |
| Front Door endpoint | tender-edge-783 |
| Origin group / origin | tender-origin-group / tender-app |
| Route / custom domain | tender-route / tender-cmll-in |
| GitHub deployment identity | tender-github-783 |

The private source repository is https://github.com/caliberaitech783-beep/tender-tracker. `.github/workflows/deploy.yml` tests and builds pushes to `main`, then deploys through Microsoft Entra federation. Its Website Contributor permission is scoped to this App Service. GitHub repository variables contain the public identity, tenant, and subscription IDs; no database credentials or Azure publishing passwords are stored in GitHub. SCM and FTP basic authentication are disabled.

Hostinger DNS records:

| Type | Name | Target |
| --- | --- | --- |
| CNAME | tender | tender-edge-783-a0ckduf4f0a4hdg0.z03.azurefd.net |
| TXT | _dnsauth.tender | Azure domain validation token; retain for validation/renewal |

Front Door manages the TLS certificate, redirects HTTP to HTTPS, forwards to the origin over HTTPS, and has caching disabled. The existing WAF policy also protects Tender Tracker. The origin accepts only the configured Front Door instance. PostgreSQL public networking remains disabled; the app uses the existing VNet integration to reach the private server.

Tender uses a separate App Service, PostgreSQL database and database login. Identity is delegated to the BDMS/Pulse user master through its scoped Tender integration API; Tender never receives BDMS database credentials or password hashes.

## Application configuration

Use Node.js 22 LTS, startup command `node server.mjs`, HTTPS only, Always On, and `/api/health` as the health-check path. Enable remote build for ZIP deployment with `SCM_DO_BUILD_DURING_DEPLOYMENT=true`. Keep `/home` persistent with `WEBSITES_ENABLE_APP_SERVICE_STORAGE=true`.

Set the following App Service environment variables:

| Setting | Value |
| --- | --- |
| NODE_ENV | production |
| HOST | 0.0.0.0 |
| PUBLIC_APP_URL | https://tender.cmll.in |
| TENDER_STATE_DIR | /home/tender/state |
| TENDER_DOCUMENTS_DIR | /home/tender/documents |
| DATABASE_URL | Secret connection URL for the separate `tender_tracker` database, using TLS certificate verification |
| IDENTITY_PROVIDER | bdms |
| BDMS_IDENTITY_URL | https://pulse.cmll.in |
| BDMS_IDENTITY_KEY | Random service secret, matching BDMS `TENDER_IDENTITY_KEY`; configure in App Service only |

App Service supplies `PORT`. Keep credentials in App Service settings. `.local`, local backup files, documents, and environment files are excluded from the deployment package.

## Database and files

The application applies `schema.sql` at startup. Preserve existing user password hashes during migration and exclude local login sessions. A fresh database generates an initial administrator password in the configured persistent state directory. `INITIAL_ADMIN_PASSWORD` can bootstrap an explicitly supplied initial password; it does not update existing accounts.

Documents must remain under the persistent directory outside the deployed source tree. Azure PostgreSQL automatic backups cover the database; retain application backup exports containing documents as well. Use a separate database role with access only to Tender Tracker's database.

The existing PostgreSQL server retains its automatic backups for 35 days. The P2v3 App Service tier supports automatic hourly content snapshots with 30-day retention, including `/home` document storage; a newly created application may have no snapshot until the first scheduled backup. Check the app's Backups blade before relying on a specific restore point. Database recovery uses PostgreSQL's own backup service separately from App Service content snapshots. The application's administrator backup export is an additional portable copy of its database records and documents.

## BDMS users and privileges

In BDMS/Pulse, open Masters → Users & employees → Add/Edit → Tender application. Enable **Allow Tender login**, select one or more Tender roles, and optionally enter a Tender business unit code. A blank scope allows all business units; System Administrator has workspace-wide access. Existing users receive no Tender access automatically, including BDMS administrators. Complete any required initial password change in BDMS first.

Sign in separately at `https://tender.cmll.in` using the existing BDMS user name and password. BDMS remains the only account, password and Tender role administration interface. Each account links through its immutable BDMS master record ID, with a local UUID projection retaining Tender document, ownership and audit foreign keys. Email never links existing accounts.

Each authenticated Tender request validates the account's current access and password version against BDMS. Revocation, deletion, deactivation and password changes invalidate existing sessions; role and business-unit changes apply immediately on the next request. BDMS outages fail closed. The authenticated directory refreshes on bootstrap so newly entitled users can be selected as owners before their first Tender login. No BDMS password hash is copied to Tender. Local accounts, OIDC callbacks, password changes and user administration cannot bypass BDMS mode. In-app backup restore is blocked in this mode to preserve identity mappings; an administrator must perform a controlled database/file restore.

BDMS exposes service-authenticated POST endpoints under `/api/integrations/tender/` for `authenticate`, `validate` and `directory`. Configure the same random service key in BDMS production and staging App Service settings so slot swaps retain the bridge. Do not publish the key or expose it to browser code.

## Routing and verification

Add a separate Front Door origin group and route for Tender Tracker, with HTTPS forwarding to its App Service origin, an HTTPS health probe at `/api/health`, and caching disabled. Restrict the App Service origin to the existing Front Door instance. Add `tender.cmll.in` as a Front Door custom domain with a managed certificate, then add Hostinger's verification TXT record and the `tender` CNAME to the Front Door endpoint.

Run `scripts/package-azure.ps1` to test, build, and package the app. Verify valid public HTTPS, database health, sign-in, authenticated reads, origin validation, document upload/download, persistence across a restart, and continued BDMS/Pulse health before declaring the domain live.

Email, WhatsApp, and company SSO require their actual service credentials; blank settings keep these integrations disabled.
