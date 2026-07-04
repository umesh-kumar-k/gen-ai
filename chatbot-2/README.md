# RAG Chatbot

- Refer to the template here https://vercel.com/templates/next.js/chatbot-by-aceternity

## Pre Requisite

1. Create a neon DB user account 
2. Create a `.env.local` file in the root directory with the following variables:
```bash
DATABASE_URL="your-neon-database-url"
```

# Flow

Get user's prompt
   ↓
Generate Embeddings
   ↓
Search in PostgreSQL + pgVector DB
   ↓
Retrieve the response(s)
   ↓
Augment response to the User's prompt 
   ↓
Send the prompt with the context to LLM
   ↓
Generate Answer 
   ↓
Display in the UI

## Key Technologies

- [Next.js](https://nextjs.org/) - React framework
- [Neon](https://neon.tech/) - Serverless Postgres database
- [OpenAI](https://openai.com/) - GPT-4 language model
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Aceternity UI](https://ui.aceternity.com/) - UI components


## Steps

1. Migrate vercel ai sdk's from verion 3 to 6 or 7 
2. Set up winston logger
3. We can use vercel AI SDK or langchain javascript sdk 
   - this vercel ai template uses vercal AI SDK by default
4. 

## npm packages
  - winston (logger for server components)
  - langchain @langchain/core (AI SKD instead of vercel AI SDK)
  - dotenv (environment file reader)
  - @langchain/google-genai,@langchain/google (for invoking Google LLMs + Embedding Models)
  - @google/genai (for invoking Embedding Model)
  - @supabase/supabase-js (PostgreSQL pgVector)
  - js-tiktoken (for counting tokens)
  - @ai-sdk/google" (vercel AI SDK )
  - @ai-sdk/react (for vercel ai sdk v5+)
  - @ai-sdk/google
  - langsmith (for observability)



## Notes 

1. The vector embeddings are stored in the postregsql + pgvector on supabase. This chatbot template from vercel uses the postgresql on neon to save the chat history. You can either modify the tempalte code to use postgres for storing the chat history or continue to maintain 2 separate databases

2. If we are using the vercel AI SDK we need to set up the AI_GATEWAY_API_KEY or use the provider module
   
   Error [GatewayAuthenticationError]: Unauthenticated request to AI Gateway
   Alternatively, you can use a provider module instead of the AI Gateway.

3. Vector Search (Semantic)

   - Do vector similarity search in SQL (server-side) using pgvector
   - Join with documents for metadata filtering (tenant_id)
   - Call it from the Supabase JavaScript Client via an RPC function
   - HNSW index is used only when the similarity operator (<=>, <#>, <->) is directly in SQL. HNSW created on the embedding field
   
   ```sql
      CREATE INDEX idx_chunks_embedding_hnsw ON document_chunks USING hnsw (embedding vector_cosine_ops);
   ```
   - SQL-side filtering + ANN search is much faster

   ```sql

      CREATE OR REPLACE FUNCTION match_document_chunks (
      query_embedding vector(1024),
      match_count int,
      tenant_filter text
      )
      RETURNS TABLE (
         chunk_id bigint,
         document_id uuid,
         content text,
         similarity float
      )
      LANGUAGE sql
      AS $$
         SELECT
            dc.id AS chunk_id,
            dc.document_id,
            dc.content,
            1 - (dc.embedding <=> query_embedding) AS similarity
         FROM document_chunks dc
         INNER JOIN documents d
            ON dc.document_id = d.id
         WHERE d.tenant_id = tenant_filter
            AND d.deleted_at IS NULL
         ORDER BY dc.embedding <=> query_embedding
         LIMIT match_count;
      $$;

   ```

   - Sample response returned from the RPC call

   ```json
   [
      {
         "chunk_id": 23,
         "document_id": "2ffd1a5f-9017-4aff-ae29-d4132f06c74d",
         "content": "1.8.1.1 Watch\nLong press the face to go to the watch face editing interface. You can slide left or right to\npreview the face in your watch. Some watch faces have icons below. You can tap an icon\nto set different controls or change faces of different styles. Tap any face to set it as the main\nface.",
         "similarity": 0.785963544259578
      }
   ]
   ```

4. Observability

   - Check the docs at https://docs.langchain.com/langsmith/observability-llm-tutorial for more detailed steps
   - Create a service Key
   
   - Note that the default example uses the OPENAI to demonstrate observability . For others eg gemini check the itegration docs at  https://docs.langchain.com/langsmith/integrations
   
   - If we are using langchain, langsmith will automatically trace the application. No need to invoke any langsmith function
   - In this app  we are using langchain + vercel ai sdk.

   You need the following env variables
   LANGSMITH_API_KEY=<API Key>
   LANGSMITH_TRACING=true
   LANGSMITH_ENDPOINT=https://apac.api.smith.langchain.com
   LANGSMITH_WORKSPACE_ID=<Workspace Id>
   LANGSMITH_PROJECT="<Project Name>"

5. Hybrid Search (Semantic Search + FTS )

   - Check the docs at https://supabase.com/docs/guides/ai/hybrid-search , https://supabase.com/docs/guides/database/full-text-search

   ``` sql

      CREATE OR REPLACE FUNCTION match_document_chunks_hybrid(
         query_text TEXT,
         query_embedding vector(1024),  -- Adjust dimensions if not using OpenAI 1536
         tenant_filter text,                           -- Adjusted type to UUID. Change to INT/TEXT if needed
         match_count INT DEFAULT 4,
         rrf_k INT DEFAULT 60,                     -- Constants like 60 are industry standard for stable RRF ranking
         full_text_weight FLOAT DEFAULT 1.0,
         semantic_weight FLOAT DEFAULT 1.0
      )
      RETURNS TABLE (
         chunk_id BIGINT,                            -- Match the data types of your document_chunks table
         document_id UUID,
         content TEXT,
         fts_rank INT,
         semantic_rank INT,
         combined_score FLOAT
      ) 
      LANGUAGE plpgsql
      AS $$
      BEGIN
         RETURN QUERY
         -- Step 1: Isolate keyword search matches using Postgres Full-Text Search (FTS).
         -- We filter by tenant and soft-deletion here early to avoid cross-tenant leaks or ranking dead rows.
         WITH full_text AS (
            SELECT
                  dc.id,
                  ROW_NUMBER() OVER (
                     ORDER BY ts_rank_cd(dc.fts_tokens, websearch_to_tsquery('english', query_text)) DESC
                  )::INT AS rank_ix
            FROM document_chunks dc
            INNER JOIN documents d ON dc.document_id = d.id
            WHERE d.tenant_id = tenant_filter
               AND d.deleted_at IS NULL
               AND dc.fts_tokens @@ websearch_to_tsquery('english', query_text)
            ORDER BY rank_ix ASC
            LIMIT LEAST(match_count * 3, 100) -- Fetch a larger pool to allow meaningful rank merging
         ),

         -- Step 2: Isolate semantic search matches using Cosine Similarity (<=> operator).
         -- Using the exact syntax from your existing match_document_chunks query.
         semantic AS (
            SELECT
                  dc.id,
                  ROW_NUMBER() OVER (
                     ORDER BY dc.embedding <=> query_embedding ASC
                  )::INT AS rank_ix
            FROM document_chunks dc
            INNER JOIN documents d ON dc.document_id = d.id
            WHERE d.tenant_id = tenant_filter
               AND d.deleted_at IS NULL
            ORDER BY rank_ix ASC
            LIMIT LEAST(match_count * 3, 100)
         )

         -- Step 3: Combine both sets via a FULL OUTER JOIN so chunks that hit on either 
         -- keyword, semantic, or both are preserved for RRF scoring.
         SELECT
            dc.id AS chunk_id,
            dc.document_id,
            dc.content,
            ft.rank_ix AS fts_rank,
            sm.rank_ix AS semantic_rank,
            -- The Reciprocal Rank Fusion (RRF) Formula:
            -- Score = (1 / (k + keyword_rank)) * weight + (1 / (k + semantic_rank)) * weight
            (COALESCE(1.0 / (rrf_k + ft.rank_ix), 0.0) * full_text_weight) +
            (COALESCE(1.0 / (rrf_k + sm.rank_ix), 0.0) * semantic_weight) AS combined_score
         FROM full_text ft
         FULL OUTER JOIN semantic sm ON ft.id = sm.id
         INNER JOIN document_chunks dc ON COALESCE(ft.id, sm.id) = dc.id
         ORDER BY combined_score DESC
         LIMIT match_count;
      END;
      $$;

   ```

   Example Response 

   ``` json

   [
      {
         "chunk_id": 34,
         "document_id": "2ffd1a5f-9017-4aff-ae29-d4132f06c74d",
         "content": "2.2 Answering and Making Calls by Using the Watch\nSetting Frequent Contacts\n1. Go to the management page of the OnePlus Health App and select More > Frequent\ncontacts.\n2. On the Frequent contacts page, you can perform the following operations:\nTap Add. The system will automatically open your mobile phone contact list. Select contacts\nto complete the addition.\nTap Edit and long press Slide Sort to sort the existing contacts.\nTap Edit and select the Delete box to delete the added contacts.\n3. Tap the Up key to go to the app list, and select Phone > Frequent contacts to call the\ncontacts through the watch.\nNotes\n A maximum of 30 frequent contacts can be set.\n The watch should be paired with the mobile phone properly so that you can make a call\nby using Frequent contacts on the watch.\n Up to 30 call records can be saved.\nDial Pad\nTap the Up key to go to the app list. Select Phone > Dial pad, enter the phone number to be\ndialed, and tap the phone icon to make a phone call.",
         "fts_rank": 3,
         "semantic_rank": 1,
         "combined_score": 0.0290418054014058
      },
      {
         "chunk_id": 7,
         "document_id": "2ffd1a5f-9017-4aff-ae29-d4132f06c74d",
         "content": "1.13 Upgrading the Watch Version and App Version .................................................................. 11\n1.14 Resetting to Default .................................................................................................................... 11\n2. App Management ................................................................................................................................. 11\n2.1 Message Alert and Deletion ........................................................................................................ 11\n2.2 Answering and Making Calls by Using the Watch ................................................................ 12\n2.3 Answering and Rejecting Calls .................................................................................................. 12\n2.4 Viewing Call Records ................................................................................................................... 13",
         "fts_rank": 1,
         "semantic_rank": 2,
         "combined_score": 0.0290346907993967
      },
      {
         "chunk_id": 33,
         "document_id": "2ffd1a5f-9017-4aff-ae29-d4132f06c74d",
         "content": "up automatically to overwrite the current message.\n When the mobile phone and the watch are connected by Bluetooth, calls and messages\nreceived by the mobile phone will be transmitted to the watch through Bluetooth. There\nis a certain delay in the message transmission via Bluetooth and simultaneous alert cannot\nbe achieved.\n When the mobile phone is connected with the watch and other Bluetooth devices at the\nsame time, the message alert and call push functions of the watch will not be affected.\n WhatsApp voice messages, picture messages can be received on the watch, but it cannot\nplay voice messages or display pictures.\nMessage Deletion\nAfter viewing a message, you can tap Close to delete the message. You can also tap Clear all\nat the bottom of the message list interface to clear all unread messages.\n2.2 Answering and Making Calls by Using the Watch\nSetting Frequent Contacts\n1. Go to the management page of the OnePlus Health App and select More > Frequent\ncontacts.",
         "fts_rank": 2,
         "semantic_rank": 6,
         "combined_score": 0.0274725274725275
      },
      {
         "chunk_id": 35,
         "document_id": "2ffd1a5f-9017-4aff-ae29-d4132f06c74d",
         "content": " Up to 30 call records can be saved.\nDial Pad\nTap the Up key to go to the app list. Select Phone > Dial pad, enter the phone number to be\ndialed, and tap the phone icon to make a phone call.\n2.3 Answering and Rejecting Calls\nWhen the connection between the watch and the mobile phone is normal and there is a call\nreceived by the mobile phone, the watch will ring and vibrate to remind you and display the\ncaller's number or name. You can choose to answer or reject the call.\nNotes\n The displayed name of the caller ID is the same as that on the mobile phone. The phone",
         "fts_rank": null,
         "semantic_rank": 3,
         "combined_score": 0.0188679245283019
      },
      {
         "chunk_id": 4,
         "document_id": "2ffd1a5f-9017-4aff-ae29-d4132f06c74d",
         "content": "Contents\n1. How to Use............................................................................................................................................... 4\n1.1 Wearing the Watch .......................................................................................................................... 4\n1.2 Replacing the Watch Strap ............................................................................................................ 4\n1.3 Connecting the Watch to a Mobile Phone .................................................................................. 5\n1.4 Boot/Shutdown/Reboot .................................................................................................................. 5\n1.5 Charging the Watch......................................................................................................................... 6\n1.6 Watch Keys and Screen Control Function ................................................................................. 7",
         "fts_rank": null,
         "semantic_rank": 4,
         "combined_score": 0.0185185185185185
      }
   ]

   ```

   
## System Prompt 

You are a precise smartwatch technical support assistant. Answer queries using ONLY the provided context. 

Strict Rules:
1. Grounding: Rely solely on the context. Do not extrapolate or use external knowledge.
2. If unknown: If the context lacks the answer, reply exactly: "I'm sorry, but I couldn't find information regarding that in the provided user manual."
3. Citations: Append the source name to your answers (e.g., [Section 3.2]).
4. Formatting: Be concise. Use short bullet points for steps.


## User Prompt with Context 

const systemPrompt = `... (Insert the prompt above here) ...`;
const userPromptWithContext = `
   Context Information from the Smartwatch Manuals:
   ```javascript
   ${retrievedContextChunks.map(chunk => `[Source: ${chunk.metadata.source}] \n ${chunk.text}`).join('\n\n')}
   ```

   Given the context information above, please answer the following user query:
   User Query: ${userQuery}

`;