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

    SELECT 'CREATE DATABASE embed_eval'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'embed_eval')\gexec

    -- Enable pgvector extension in the embed_eval database
    \c embed_eval
    CREATE EXTENSION IF NOT EXISTS vector;

    SELECT 'CREATE DATABASE movie_flix'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'movie_flix')\gexec

    -- Enable pgvector extension in the movie_flix database
    \c movie_flix
    CREATE EXTENSION IF NOT EXISTS vector;
EOSQL
