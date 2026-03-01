/**
 * Central RAG configuration — single source of truth for all chunking,
 * embedding, and retrieval parameters.
 */

// ── Chunking strategies ──

export type ChunkingStrategy = 'knowledgebase' | 'exam' | 'sentence'

export interface ChunkingParams {
    targetChunkSizeTokens: number
    minChunkSizeTokens: number
    maxChunkSizeTokens: number
    overlapTokens: number
}

/** Per-strategy chunking parameters */
export const CHUNKING_PARAMS: Record<ChunkingStrategy, ChunkingParams> = {
    knowledgebase: {
        targetChunkSizeTokens: 380,
        minChunkSizeTokens: 50,   // Short Q&A blocks are valid standalone chunks
        maxChunkSizeTokens: 480,  // Must stay within embedding model context (512)
        overlapTokens: 40,
    },
    exam: {
        targetChunkSizeTokens: 450,
        minChunkSizeTokens: 100,
        maxChunkSizeTokens: 480,
        overlapTokens: 40,
    },
    sentence: {
        targetChunkSizeTokens: 380,
        minChunkSizeTokens: 100,
        maxChunkSizeTokens: 480,
        overlapTokens: 50,
    },
}

// ── Detection patterns ──

/** Knowledgebase: numbered questions like "01. Was sind Informationen?" */
export const KB_QUESTION_PATTERN = /^\d{2,3}\.\s+\S/m
/** Knowledgebase: section headings like "1.1.2 Art und Güte..." */
export const KB_SECTION_PATTERN = /^\d+\.\d+(?:\.\d+)*\s+\S/m

/** Exam: "Lösung zu Aufgabe N:" */
export const EXAM_SOLUTION_PATTERN = /^Lösung zu Aufgabe\s+\d+:/m
/** Exam: "Aufgabe N:" (standalone, not "Lösung zu Aufgabe") */
export const EXAM_TASK_PATTERN = /^Aufgabe\s+\d+:/m
/** Exam: sub-task labels a) through e) */
export const EXAM_SUBTASK_PATTERN = /^[a-e]\)\s/m

/** Minimum matches required for auto-detection */
export const KB_MIN_QUESTION_MATCHES = 5
export const EXAM_MIN_SOLUTION_MATCHES = 2

// ── Embedding parameters ──

export const EMBEDDING_CONFIG = {
    /** L2-normalize embedding vectors before storage */
    normalize: true,
    /** Similarity metric used in DB queries */
    similarityMetric: 'cosine' as const,
    /** Batch size for embedding API calls */
    batchSize: 32,
    /** Max tokens the embedding model supports */
    maxModelTokens: 512,
}

// ── E5 instruction prefixes ──
// multilingual-e5-large requires "query: " / "passage: " prefixes
// for correct similarity scoring.

export const E5_PREFIX = {
    /** Prefix for search queries (retrieval time) */
    query: 'query: ',
    /** Prefix for document passages (indexing time) */
    passage: 'passage: ',
} as const

// ── Retrieval parameters ──

export const RETRIEVAL_CONFIG = {
    /** Number of chunks to retrieve */
    topK: 5,
    /** Minimum cosine similarity (0–1) — chunks below are filtered out */
    minScoreThreshold: 0.75,
    /** Whether to apply cross-encoder reranking (future) */
    rerank: false,
    /** K-values used for evaluation metrics */
    topKForEvaluation: [1, 3, 5] as const,
}

// ── Token estimation ──

/**
 * Approximate chars per token for German text with multilingual tokenizers.
 * Multilingual models tokenize German compound words less efficiently
 * than English.  Conservative value (3.0) ensures estimated token counts
 * stay safely within the embedding model's 512-token context window.
 */
export const CHARS_PER_TOKEN = 3.0
