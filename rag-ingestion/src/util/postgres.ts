import { DocumentMetadata } from "../types/document-metadata";
import { logger } from "../util/logger";
import { createClient } from "@supabase/supabase-js";
import { Document } from "@langchain/core/documents";
import { getTokenCount, generateTextFingerprint } from "../util/ingestion";


const supabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function storeVectorEmbeddings(metadata: DocumentMetadata,textChunks: string[], chunkEmbeddings: number[][], documents: Document[] ): Promise<void> {

  const documentId = await storeDocumentMetadata(metadata);
  if(documentId) {
    // Batch insert the embeddings into the document_chunks table
    const { data: embeddingRows, error: embeddingError } = await supabaseClient.from("document_chunks").insert(
      textChunks.map((chunk, index) => ({
        document_id: documentId,
        content: chunk,
        embedding: chunkEmbeddings[index],
        page_number: index + 1,
        section_title: null,
        heading_path: null,
        chunk_type: "text",
        chunk_index: index,
        metadata: null,
        token_count: getTokenCount(chunk),
        hash: generateTextFingerprint(chunk),
        required_role: null,
      }))
    );

    if (embeddingError) {
      logger.error("Failed to insert embeddings", embeddingError);
      throw embeddingError;
    }

    logger.info(`Vector embeddings stored in PostgreSQL successfully for file: ${metadata.fileName}`);
  }

}

async function storeDocumentMetadata(
  metadata: DocumentMetadata
): Promise<string> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    logger.error("Supabase env vars are not configured");
    throw new Error("Supabase env vars are not configured");
  }

  const { data: documentRow, error: documentError } = await supabaseClient
    .from("documents")
    .insert({
      tenant_id: metadata.tenant,
      brand: metadata.brand,
      model_name: metadata.model_name,
      manual_title: metadata.fileName,
      version: metadata.version,
      language: "en",
      source_url: metadata.filePath,
      file_hash: metadata.file_hash,
      embedding_model: process.env.EMBEDDING_MODEL || "gemini-embedding-2",
      embedding_dimension: process.env.EMBEDDING_DIMENSIONS || 1024,
      processing_status: "stored",
    })
    .select()
    .single();

  if (documentError || !documentRow) {
    if (documentError) {
      logger.error("Failed to insert document", documentError);
    }
    throw documentError || new Error("Failed to insert document");
  }

  logger.info(`Document metadata stored in PostgreSQL successfully for file: ${metadata.fileName} with the value ${JSON.stringify(documentRow)}` );
  return documentRow.id;
}
