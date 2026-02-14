#!/bin/bash
set -e

# Create additional databases on first start.
# The default database ($POSTGRES_DB) is created automatically by the
# official postgres entrypoint; this script adds any extras.

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    SELECT 'CREATE DATABASE lai'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'lai')\gexec

    -- Enable pgvector extension in the lai database
    \c lai
    CREATE EXTENSION IF NOT EXISTS vector;
EOSQL
