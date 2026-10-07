CREATE TABLE IF NOT EXISTS schema_migrations(version integer PRIMARY KEY, applied_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS users(id uuid PRIMARY KEY, name text NOT NULL, email text UNIQUE NOT NULL, password_hash text NOT NULL, roles jsonb NOT NULL, business_unit text, active boolean DEFAULT true, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS sessions(token_hash text PRIMARY KEY,user_id uuid REFERENCES users(id),expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS settings(id integer PRIMARY KEY DEFAULT 1, data jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS masters(id uuid PRIMARY KEY,list text NOT NULL,value text NOT NULL,active boolean DEFAULT true,UNIQUE(list,value));
CREATE TABLE IF NOT EXISTS tenders(id uuid PRIMARY KEY,tender_id text UNIQUE NOT NULL,data jsonb NOT NULL,draft boolean DEFAULT true,creator uuid REFERENCES users(id),revision integer DEFAULT 1,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
CREATE UNIQUE INDEX IF NOT EXISTS tender_client_reference ON tenders(lower(data->>'client'),lower(data->>'clientRef')) WHERE data->>'clientRef' <> '';
CREATE INDEX IF NOT EXISTS tender_deadline_idx ON tenders((data->>'deadline'));
CREATE INDEX IF NOT EXISTS tender_data_idx ON tenders USING gin(data);
CREATE TABLE IF NOT EXISTS records(id uuid PRIMARY KEY,tender_id uuid NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,module text NOT NULL,data jsonb NOT NULL,created_by uuid REFERENCES users(id),created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
CREATE INDEX IF NOT EXISTS records_tender_module ON records(tender_id,module);
CREATE UNIQUE INDEX IF NOT EXISTS single_records ON records(tender_id,module) WHERE module IN ('scorecard','submission','evaluation','award');
CREATE TABLE IF NOT EXISTS documents(id uuid PRIMARY KEY,tender_id uuid REFERENCES tenders(id),type text NOT NULL,version integer NOT NULL,filename text NOT NULL,stored_path text NOT NULL,mime text,size bigint,uploaded_by uuid REFERENCES users(id),created_at timestamptz DEFAULT now(),UNIQUE(tender_id,type,version));
CREATE TABLE IF NOT EXISTS approvals(id uuid PRIMARY KEY,tender_id uuid REFERENCES tenders(id),module text NOT NULL,record_id uuid REFERENCES records(id),requested_by uuid REFERENCES users(id),status text DEFAULT 'Pending',comment text,requested_revision integer,payload jsonb,decided_by uuid REFERENCES users(id),created_at timestamptz DEFAULT now(),decided_at timestamptz);
CREATE UNIQUE INDEX IF NOT EXISTS one_pending_approval ON approvals(tender_id,module) WHERE status='Pending';
CREATE TABLE IF NOT EXISTS audit(id bigserial PRIMARY KEY,tender_id uuid REFERENCES tenders(id),actor uuid REFERENCES users(id),action text NOT NULL,entity text NOT NULL,changes jsonb,created_at timestamptz DEFAULT now());
CREATE INDEX IF NOT EXISTS audit_tender_time ON audit(tender_id,created_at DESC);
CREATE TABLE IF NOT EXISTS notifications(id uuid PRIMARY KEY,tender_id uuid REFERENCES tenders(id),user_id uuid REFERENCES users(id),event_key text UNIQUE NOT NULL,title text NOT NULL,message text NOT NULL,read_at timestamptz,created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS deliveries(id uuid PRIMARY KEY,notification_id uuid REFERENCES notifications(id),channel text NOT NULL,status text NOT NULL,error text,attempts integer DEFAULT 0,next_attempt timestamptz DEFAULT now(),created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS portal_feed(id uuid PRIMARY KEY,data jsonb NOT NULL,created_by uuid REFERENCES users(id),created_at timestamptz DEFAULT now());
INSERT INTO schema_migrations(version) VALUES(1) ON CONFLICT DO NOTHING;

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE masters ADD COLUMN IF NOT EXISTS code text;
UPDATE masters SET code=value WHERE code IS NULL;
ALTER TABLE masters ALTER COLUMN code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS master_codes ON masters(list,code);

ALTER TABLE users ADD COLUMN IF NOT EXISTS bdms_id text UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bdms_login text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS credential_version text;

ALTER TABLE users ADD COLUMN IF NOT EXISTS tender_permissions jsonb;
