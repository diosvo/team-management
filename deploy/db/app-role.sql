-- Least-privilege app login: read/write data only.
-- Idempotent: safe to run multiple times.
-- Safe to run multiple times without causing errors.
--
-- POSTGRES_USER owns migrations and admin tasks.
-- • Runs after every migration to grant new tables/sequences.
-- • psql variables: app_user, app_password

SELECT format('CREATE ROLE %I LOGIN', :'app_user')
WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = :'app_user') \gexec

SELECT format(
  'ALTER ROLE %I WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD %L',
  :'app_user', :'app_password'
) \gexec

SELECT format('GRANT CONNECT ON DATABASE %I TO %I', current_database(), :'app_user') \gexec
SELECT format('GRANT USAGE ON SCHEMA public TO %I', :'app_user') \gexec
SELECT format(
  'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO %I',
  :'app_user'
) \gexec
SELECT format(
  'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO %I',
  :'app_user'
) \gexec
