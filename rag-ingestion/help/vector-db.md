**Recommended PostgreSQL + pgvector Schema for Smartwatch RAG Application**


### 1. Main Table: `documents` (Core Vector Store)
    - Stores the high-level metadata for each uploaded user manual.

`documents`

| Column Name | Data Type |  Description |
| ----------- | --------- | ------------ |
| `id` | `uuid` (PK) | Unique chunk identifier |
| `brand` | `varchar` | Device manufacturer name |
| `model_name` | `varchar` | Smartwatch model name |
| `version` | `varchar` | Manual edition/version |
| `file_url` | `text` | Source file location |
| `created_at` | `timestamptz` | Document upload timestamp |


### 2. Main Table: `document_chunks` (Core Vector Store)
    - This is the primary table for storing chunked content from Samsung, Apple, and Garmin user manuals.

`document_chunks`

| Column            | Description                  | Purpose |
|-------------------|---------------------------------------|--------|
| `id`              | Unique chunk ID                       | Primary key |
| `content`         | Chunk text content                    | Raw text for LLM context |
| `embedding`       | Vector embedding                      | Semantic search (pgvector) |
| `document_id`     | Source document UUID                  | Group chunks by PDF |
| `document_title`  | Document full title                   | Citation display |
| `brand`           | Brand name (Samsung/Apple/Garmin)     | Metadata filtering |
| `source_type`     | Source file type                      | Future-proofing |
| `page_number`     | Original page number                  | Accurate citations |
| `section_title`   | Section heading                       | Better context & citations |
| `chunk_index`     | Position in document                  | Sequential ordering |
| `metadata`        | JSON metadata store                   | Flexible filtering (model, features, etc.) |
| `token_count`     | Token count                           | Cost tracking & limits |
| `hash`            | Content hash                          | Deduplication & caching |


```sql

CREATE TABLE document_chunks (
    
    id BIGSERIAL PRIMARY KEY,                 -- Unique chunk ID
    document_id BIGSERIAL NOT NULL,           -- Link to document
    
    -- Core Content
    content TEXT NOT NULL,                    -- Chunk text (500-1000 tokens typical)
    embedding VECTOR(1024) NOT NULL,          -- jina-embeddings-v3 (1024 dim)
    fts_tokens  tsvector,                      -- tsvector Full-text search tokens
    page_number INTEGER,                       -- Source page number

    chunk_index INTEGER NOT NULL,             -- Order within document
    
    -- Rich Metadata (for filtering)
    metadata JSONB NOT NULL DEFAULT '{}',     -- Flexible: model, language, version, tags, etc.
    
    -- Timestamps & Versioning
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Observability & Tracking
    token_count INTEGER,                      -- Approx tokens in chunk
    hash TEXT UNIQUE                          -- Content hash for deduplication

    -- Role
    required_role TEXT                        -- Access control tier

);

```


**Recommended Indexes:**
```sql
CREATE INDEX idx_document_chunks_brand ON document_chunks(brand);
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_metadata_gin ON document_chunks USING GIN (metadata);
CREATE INDEX idx_embedding_hnsw ON document_chunks USING hnsw (embedding vector_cosine_ops);
```

---

### 2. Supporting Tables for Advanced Features

#### `conversations` (Conversation Memory)
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,                    -- For RBAC
    title TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `messages` (Conversation History + Streaming Support)
```sql
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id),
    role TEXT NOT NULL,                       -- "user", "assistant", "system"
    content TEXT NOT NULL,
    token_usage JSONB,                        -- {"input": 450, "output": 320, "total": 770}
    sources JSONB,                            -- Array of citation objects
    metadata JSONB DEFAULT '{}',              -- hallucination_score, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `prompt_versions` (Prompt Versioning)
```sql
CREATE TABLE prompt_versions (
    id SERIAL PRIMARY KEY,
    version_name TEXT UNIQUE NOT NULL,        -- "v1_base", "v2_citations"
    prompt_template TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `usage_logs` (Token Tracking + Observability)
```sql
CREATE TABLE usage_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT,
    conversation_id UUID,
    operation TEXT,                           -- "query", "embed", "generate"
    tokens_input INTEGER,
    tokens_output INTEGER,
    model TEXT,
    latency_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `cache_entries` (Caching)
```sql
CREATE TABLE cache_entries (
    id TEXT PRIMARY KEY,                      -- hash of query + context
    response TEXT NOT NULL,
    sources JSONB,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Recommended Metadata JSONB Structure (examples)

```json
{
  "model": "Galaxy Watch 7",
  "feature_category": "health",
  "language": "en",
  "pdf_version": "2025",
  "tags": ["heart_rate", "sleep"],
  "access_role": "public"          // for RBAC
}
```

---

### Summary 

- **Basic RAG**: `content` + `embedding` + HNSW index.
- **Citations**: `document_title`, `page_number`, `section_title`.
- **Metadata Filtering**: `brand`, `metadata` JSONB.
- **Hybrid Search**: Combine vector search with `WHERE brand = 'Samsung'` or metadata filters.
- **Conversation Memory**: `conversations` + `messages`.
- **RBAC**: Filter by `user_id` and `metadata->>'access_role'`.
- **Observability**: `usage_logs` + `token_count`.
- **Prompt Versioning**: Easy A/B testing.
- **Scalable**: Works great with Supabase pgvector.

