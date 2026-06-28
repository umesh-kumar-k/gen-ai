# Enterprise RAG Database Schema (Smartwatch Manuals)

## 1. `documents` Table (Master Document Registry)

Stores one record per uploaded smartwatch manual.

| Field                 | Type        | Description            | Generate Value                        |
| --------------------- | ----------- | ---------------------- | ------------------------------------- |
| `id`                  | UUID PK     | Document identifier    | Generate UUID at upload               |
| `tenant_id`           | TEXT        | Tenant ownership       | From authenticated tenant context     |
| `brand`               | VARCHAR     | Manufacturer name      | Extract from filename/manual metadata |
| `model_name`          | VARCHAR     | Device model           | Parse title or metadata               |
| `manual_title`        | TEXT        | Full manual title      | Extract first title page              |
| `version`             | VARCHAR     | Manual version         | Extract version string manually       |
| `language`            | VARCHAR     | Document language      | Detect via NLP library                |
| `source_url`          | TEXT        | Original file source   | Store upload location URL             |
| `file_hash`           | TEXT UNIQUE | File fingerprint       | SHA256 of uploaded file               |
| `embedding_model`     | TEXT        | Embedding provider     | Store active embedding model          |
| `embedding_dimension` | INTEGER     | Vector dimensions      | Read from embedding model             |
| `processing_status`   | TEXT        | Pipeline stage         | Update during ingestion pipeline      |
| `created_at`          | TIMESTAMPTZ | Upload timestamp       | Auto set current timestamp            |
| `updated_at`          | TIMESTAMPTZ | Modification timestamp | Auto update on changes                |
| `deleted_at`          | TIMESTAMPTZ | Soft delete time       | Set when archived/deleted             |

---

## SQL

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    brand VARCHAR NOT NULL,
    model_name VARCHAR NOT NULL,
    manual_title TEXT NOT NULL,
    version VARCHAR,
    language VARCHAR DEFAULT 'en',

    source_url TEXT,
    file_hash TEXT UNIQUE NOT NULL,

    embedding_model TEXT NOT NULL,
    embedding_dimension INTEGER NOT NULL,

    processing_status TEXT DEFAULT 'uploaded',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
```
---

# Enable PGVector 

-- Enable the pgvector extension
create extension if not exists vector;

---

# 2. `document_chunks` Table (Vector Store)

Stores chunked manual content for semantic retrieval.

| Field           | Type         | Description        | Generate Value                    |
| --------------- | ------------ | ------------------ | --------------------------------- |
| `id`            | BIGSERIAL PK | Chunk identifier   | Auto increment on insert          |
| `document_id`   | UUID FK      | Parent document    | Reference documents table ID      |
| `content`       | TEXT         | Chunk text         | Split manual into chunks          |
| `embedding`     | VECTOR(1024) | Semantic vector    | Generate using embedding model    |
| `fts_tokens`    | TSVECTOR     | Search tokens      | Generate from chunk content       |
| `page_number`   | INTEGER      | Source page        | Extract PDF parser metadata       |
| `section_title` | TEXT         | Section heading    | Detect nearest heading text       |
| `heading_path`  | TEXT[]       | Hierarchy path     | Build nested section structure    |
| `chunk_type`    | TEXT         | Content category   | Classify using LLM/rules          |
| `chunk_index`   | INTEGER      | Sequential order   | Increment during chunking process |
| `metadata`      | JSONB        | Flexible metadata  | Add dynamic structured attributes |
| `token_count`   | INTEGER      | Token size         | Count using tokenizer library     |
| `hash`          | TEXT UNIQUE  | Chunk fingerprint  | SHA256 of chunk text              |
| `required_role` | TEXT         | Access control     | Assign from content policy        |
| `created_at`    | TIMESTAMPTZ  | Creation timestamp | Auto set current timestamp        |
| `updated_at`    | TIMESTAMPTZ  | Update timestamp   | Auto update on changes            |

---

## SQL

```sql
CREATE TABLE document_chunks (
    id BIGSERIAL PRIMARY KEY,

    document_id UUID NOT NULL REFERENCES documents(id),

    content TEXT NOT NULL,
    embedding VECTOR(3072) NOT NULL, -- should match the exact dimensions of the embedding model that is being used
    fts_tokens TSVECTOR,

    page_number INTEGER,
    section_title TEXT,
    heading_path TEXT[],

    chunk_type TEXT,
    chunk_index INTEGER NOT NULL,

    metadata JSONB DEFAULT '{}',

    token_count INTEGER,
    hash TEXT UNIQUE NOT NULL,

    required_role TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

# 3. `conversations` Table (Chat Sessions)

Stores user conversation sessions.

| Field        | Type        | Description             | Generate Value                    |
| ------------ | ----------- | ----------------------- | --------------------------------- |
| `id`         | UUID PK     | Conversation identifier | Generate UUID on start            |
| `user_id`    | TEXT        | User identity           | Read from auth provider           |
| `title`      | TEXT        | Conversation title      | Generate from first query         |
| `metadata`   | JSONB       | Session metadata        | Store preferences/session details |
| `created_at` | TIMESTAMPTZ | Start timestamp         | Auto current timestamp            |
| `updated_at` | TIMESTAMPTZ | Last activity           | Update after each message         |

---

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

# 4. `messages` Table (Conversation History)

Stores user + assistant messages.

| Field             | Type         | Description         | Generate Value                   |
| ----------------- | ------------ | ------------------- | -------------------------------- |
| `id`              | BIGSERIAL PK | Message identifier  | Auto increment on insert         |
| `conversation_id` | UUID FK      | Parent conversation | Reference conversation record    |
| `role`            | TEXT         | Message role        | User/assistant/system assignment |
| `content`         | TEXT         | Message content     | Store raw message text           |
| `token_usage`     | JSONB        | Token metrics       | Capture model token stats        |
| `sources`         | JSONB        | Citation references | Save retrieved chunk sources     |
| `metadata`        | JSONB        | Message analytics   | Store scores/feedback metadata   |
| `created_at`      | TIMESTAMPTZ  | Message time        | Auto current timestamp           |

---

```sql
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    token_usage JSONB,
    sources JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

# 5. `retrieval_logs` Table (RAG Debugging)

Tracks retrieval pipeline behavior.

| Field              | Type         | Description       | Generate Value                   |
| ------------------ | ------------ | ----------------- | -------------------------------- |
| `id`               | BIGSERIAL PK | Log identifier    | Auto increment on insert         |
| `query`            | TEXT         | User question     | Store incoming user query        |
| `retrieved_chunks` | JSONB        | Initial retrieval | Save vector search results       |
| `reranked_chunks`  | JSONB        | Ranked results    | Store reranker output            |
| `final_chunks`     | JSONB        | Final context     | Save selected prompt chunks      |
| `latency_ms`       | INTEGER      | Retrieval time    | Measure total retrieval duration |
| `created_at`       | TIMESTAMPTZ  | Log timestamp     | Auto current timestamp           |

---

```sql
CREATE TABLE retrieval_logs (
    id BIGSERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    retrieved_chunks JSONB,
    reranked_chunks JSONB,
    final_chunks JSONB,
    latency_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

# 6. `usage_logs` Table (Observability)

Tracks token usage and costs.

| Field             | Type         | Description       | Generate Value                      |
| ----------------- | ------------ | ----------------- | ----------------------------------- |
| `id`              | BIGSERIAL PK | Usage identifier  | Auto increment on insert            |
| `user_id`         | TEXT         | User identity     | Read authenticated user ID          |
| `conversation_id` | UUID         | Session reference | Link current conversation           |
| `operation`       | TEXT         | Operation type    | Query/embed/generate classification |
| `tokens_input`    | INTEGER      | Input tokens      | Capture model input tokens          |
| `tokens_output`   | INTEGER      | Output tokens     | Capture model output tokens         |
| `model`           | TEXT         | LLM model         | Store active model name             |
| `latency_ms`      | INTEGER      | Execution time    | Measure request completion time     |
| `created_at`      | TIMESTAMPTZ  | Log timestamp     | Auto current timestamp              |

---

```sql
CREATE TABLE usage_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT,
    conversation_id UUID,
    operation TEXT,
    tokens_input INTEGER,
    tokens_output INTEGER,
    model TEXT,
    latency_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

# Recommended Indexes

```sql
CREATE INDEX idx_documents_tenant ON documents(tenant_id);

CREATE INDEX idx_chunks_document_id 
ON document_chunks(document_id);

CREATE INDEX idx_chunks_chunk_index 
ON document_chunks(document_id, chunk_index);

CREATE INDEX idx_chunks_page_number 
ON document_chunks(page_number);

CREATE INDEX idx_chunks_metadata_gin 
ON document_chunks USING GIN(metadata);

CREATE INDEX idx_chunks_fts 
ON document_chunks USING GIN(fts_tokens);

CREATE INDEX idx_chunks_embedding_hnsw 
ON document_chunks USING hnsw (embedding vector_cosine_ops);

CREATE INDEX idx_messages_conversation 
ON messages(conversation_id);

CREATE INDEX idx_usage_logs_user 
ON usage_logs(user_id);
```

---

# Recommended Metadata JSON Structure

```json
{
  "model": "Galaxy Watch 7",
  "feature_category": "health",
  "language": "en",
  "battery": "18h",
  "sensor": "ECG",
  "tags": ["sleep", "heart_rate"],
  "firmware_version": "2.1.0"
}
```
