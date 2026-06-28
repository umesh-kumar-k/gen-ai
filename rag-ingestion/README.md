# RAG features 
    - Basic RAG (Chunking , Embeddings , Vector Search , PG Vector Store)
    - Citations
    - Conversation Memory
    - Streaming Answers
    - Semantic Search
    - Follow Up Questions
    - Hybrid Search
    - Metadata Filtering
    - Role Based Access
    - Hallucination Detection
    - Token Usage Tracking
    - Caching
    - Observability
    - Evaluation Metrics
    - Prompt Versioning


# Architectural Flow

Upload PDF
   ↓
Extract Metadata
   ↓
Chunk Content
   ↓
Generate Embeddings
   ↓
Store in document_chunks
   ↓
Create FTS Tokens
   ↓
Index with HNSW + GIN
   ↓
Retrieve + Rerank
   ↓
Generate Answer + Citations
   ↓
Store Conversation + Logs



# Embedding Model
## Managed Embedding Models
### Google Gemini ( gemini-embedding-001 )
    - Go to Google AI Studio
    - Generate your Free API Key
    - Copy & Save Your Key into .env file

    - https://docs.langchain.com/oss/javascript/langchain/knowledge-base#2-embeddings
    - https://docs.langchain.com/oss/javascript/langchain/rag#select-an-embeddings-model
    - https://docs.langchain.com/oss/javascript/integrations/embeddings#google-gemini

# Set up Vector DB (PostGreSQL + pgVector)
## Create an account in Free Tier
## Run the SQLs to create the tables



# Use the Smart Watch User Guides (PDFs) for this application 
##  Download Smart Watch documentation from their respective websites
    - Samsung
    - Apple
    - Garmin   

# Set up logger 

## Get the Document[] from the directory path
    - Multiple pdfs | Parse PDF & convert into langchain Document[]
    - https://docs.langchain.com/oss/javascript/langchain/knowledge-base#1-documents
    - https://docs.langchain.com/oss/javascript/langchain/knowledge-base#seeding-the-vector-store

## Split Document[] into chunks
    - https://docs.langchain.com/oss/javascript/langchain/rag#split-documents

# npm packages

    - langchain @langchain/core
    - pdf-parse [Node package to read PDFs]
    - @langchain/textsplitters (RecursiveCharacterTextSplitter)
    - winston (logger)
    - dotenv (environment file reader)
    - @langchain/google-genai (for invoking Embedding Model)
    - @google/genai (for invoking Embedding Model)

# Run the Document ingestor program

    ```
        npm start -- run --source

    ```
