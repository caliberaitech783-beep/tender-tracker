import {randomUUID} from 'node:crypto';
import {ROLES} from './src/domain.mjs';
export const bdmsEnabled=()=>process.env.IDENTITY_PROVIDER==='bdms';
export async function identityRequest(action,body){
 const base=String(process.env.BDMS_IDENTITY_URL||'').replace(/\/$/,'');
 if(!base||String(process.env.BDMS_IDENTITY_KEY||'').length<32)throw Object.assign(new Error('BDMS sign-in is not configured.'),{status:503});
 const url=new URL(base);
 if(url.protocol!=='https:'&&process.env.NODE_ENV==='production')throw new Error('BDMS requires HTTPS.');
 let response;
 try{response=await fetch(`${base}/api/integrations/tender/${action}`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.BDMS_IDENTITY_KEY}`},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});}catch{throw Object.assign(new Error('BDMS is temporarily unavailable. Please try again.'),{status:503});}
 const data=await response.json();
 if(!response.ok)throw Object.assign(new Error(data.error||'BDMS access verification failed.'),{status:[401,403].includes(response.status)?response.status:503});
 const valid=p=>/^\d+$/.test(p?.id)&&Array.isArray(p.roles)&&p.roles.length&&p.roles.every(r=>ROLES.includes(r));
 if(action==='directory'?(!Array.isArray(data)||!data.every(valid)):(!valid(data)||!data.credentialVersion))throw Object.assign(new Error('BDMS returned an invalid access profile.'),{status:503});
 return data;
}
export async function syncDirectory(pool){
 const profiles=await identityRequest('directory',{});
 for(const profile of profiles)await projectIdentity(pool,profile);
 await pool.query('UPDATE users SET active=false,roles=\'[]\'::jsonb WHERE bdms_id IS NOT NULL AND NOT(bdms_id=ANY($1::text[]))',[profiles.map(p=>p.id)]);
}
export async function projectIdentity(pool,profile){
 // The immutable BDMS master ID owns the projection; email never links accounts.
 return (await pool.query(`INSERT INTO users(id,name,email,password_hash,roles,business_unit,active,phone,bdms_id,bdms_login,contact_email)
 VALUES($1,$2,$3,'!bdms-managed!',$4,$5,true,$6,$7,$8,$9)
 ON CONFLICT(bdms_id) DO UPDATE SET name=EXCLUDED.name,roles=EXCLUDED.roles,business_unit=EXCLUDED.business_unit,active=true,phone=EXCLUDED.phone,bdms_login=EXCLUDED.bdms_login,contact_email=EXCLUDED.contact_email RETURNING *`,
 [randomUUID(),profile.name||profile.login,`bdms-${profile.id}@identity.internal`,JSON.stringify(profile.roles),profile.businessUnit||null,profile.phone||null,profile.id,profile.login,profile.email||null])).rows[0];
}
