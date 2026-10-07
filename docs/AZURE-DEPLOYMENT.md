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

Use a separate App Service application and a separate PostgreSQL database and database login. Reuse the existing Linux App Service plan, PostgreSQL server, and Front Door profile where capacity permits. Do not change the BDMS/Pulse application, database, or routes.

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

App Service supplies `PORT`. Keep credentials in App Service settings. `.local`, local backup files, documents, and environment files are excluded from the deployment package.

## Database and files

The application applies `schema.sql` at startup. Preserve existing user password hashes during migration and exclude local login sessions. A fresh database generates an initial administrator password in the configured persistent state directory. `INITIAL_ADMIN_PASSWORD` can bootstrap an explicitly supplied initial password; it does not update existing accounts.

Documents must remain under the persistent directory outside the deployed source tree. Azure PostgreSQL automatic backups cover the database; retain application backup exports containing documents as well. Use a separate database role with access only to Tender Tracker's database.

The existing PostgreSQL server retains its automatic backups for 35 days. The P2v3 App Service tier supports automatic hourly content snapshots with 30-day retention, including `/home` document storage; a newly created application may have no snapshot until the first scheduled backup. Check the app's Backups blade before relying on a specific restore point. Database recovery uses PostgreSQL's own backup service separately from App Service content snapshots. The application's administrator backup export is an additional portable copy of its database records and documents.

The administrator's display name is `Admin`, and its existing local password hash was migrated without modification. Local sessions were excluded. Sign in with the same credentials used locally.

## Routing and verification

Add a separate Front Door origin group and route for Tender Tracker, with HTTPS forwarding to its App Service origin, an HTTPS health probe at `/api/health`, and caching disabled. Restrict the App Service origin to the existing Front Door instance. Add `tender.cmll.in` as a Front Door custom domain with a managed certificate, then add Hostinger's verification TXT record and the `tender` CNAME to the Front Door endpoint.

Run `scripts/package-azure.ps1` to test, build, and package the app. Verify valid public HTTPS, database health, sign-in, authenticated reads, origin validation, document upload/download, persistence across a restart, and continued BDMS/Pulse health before declaring the domain live.

Email, WhatsApp, and company SSO require their actual service credentials; blank settings keep these integrations disabled.
