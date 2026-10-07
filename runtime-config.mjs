import path from 'node:path';

export function runtimeConfig(env=process.env){
 const production=env.NODE_ENV==='production';
 const publicUrl=env.PUBLIC_APP_URL?new URL(env.PUBLIC_APP_URL):null;
 if(production&&!env.DATABASE_URL)throw new Error('Production requires DATABASE_URL.');
 if(production&&(!publicUrl||publicUrl.protocol!=='https:'))throw new Error('Production requires an HTTPS PUBLIC_APP_URL.');
 return {
  production,
  host:env.HOST||(production?'0.0.0.0':'127.0.0.1'),
  stateDir:path.resolve(env.TENDER_STATE_DIR||'.local'),
  documentsDir:path.resolve(env.TENDER_DOCUMENTS_DIR||'data/documents'),
  publicOrigin:publicUrl?.origin,
 };
}
