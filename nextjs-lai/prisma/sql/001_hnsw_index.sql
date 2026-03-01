-- HNSW index for fast approximate nearest neighbor search on document embeddings
-- Run after initial schema setup: psql $DATABASE_URL -f prisma/sql/001_hnsw_index.sql
-- Requires pgvector extension (already enabled via Prisma schema)
-- Vector dimension: 1024 (text-embedding-multilingual-e5-large)

DROP INDEX IF EXISTS "DocumentChunk_embedding_hnsw_idx";

CREATE INDEX "DocumentChunk_embedding_hnsw_idx"
  ON "DocumentChunk"
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
