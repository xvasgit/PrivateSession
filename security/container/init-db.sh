#!/bin/sh
# The official Postgres entrypoint runs this file on a fresh lab volume.
(
  set -eu
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<'SQL'
\getenv app_password KKS_DB_PASSWORD
CREATE ROLE privatesession_app LOGIN PASSWORD :'app_password';
CREATE DATABASE privatesession_dev OWNER privatesession_app;
CREATE DATABASE privatesession_shadow OWNER privatesession_app;
CREATE DATABASE privatesession_auth_rehearsal OWNER privatesession_app;
SQL
)
