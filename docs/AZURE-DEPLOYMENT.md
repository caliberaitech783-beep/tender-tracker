# Tender Tracker on Azure

Target public address: `https://tender.cmll.in`.

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

## Routing and verification

Add a separate Front Door origin group and route for Tender Tracker, with HTTPS forwarding to its App Service origin, an HTTPS health probe at `/api/health`, and caching disabled. Restrict the App Service origin to the existing Front Door instance. Add `tender.cmll.in` as a Front Door custom domain with a managed certificate, then add Hostinger's verification TXT record and the `tender` CNAME to the Front Door endpoint.

Run `scripts/package-azure.ps1` to test, build, and package the app. Verify valid public HTTPS, database health, sign-in, authenticated reads, origin validation, document upload/download, persistence across a restart, and continued BDMS/Pulse health before declaring the domain live.

Email, WhatsApp, and company SSO require their actual service credentials; blank settings keep these integrations disabled.
