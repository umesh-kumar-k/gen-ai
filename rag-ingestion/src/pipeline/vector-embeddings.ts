import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ContentEmbedding, GoogleGenAI } from "@google/genai";
import { logger } from "../util/logger";
import { Document } from "@langchain/core/documents";

import { PineconeStore } from "@langchain/pinecone";
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { DocumentMetadata } from "../types/document-metadata";

import { storeVectorEmbeddings } from "../util/postgres";
import { Gemini1024Embeddings } from "../util/custom-gemini-embedding-model";
/**
 * Check the code snippet for langchain vector store here
 * https://docs.langchain.com/oss/javascript/langchain/rag#select-an-embeddings-model
 *
 * @param documents
 */
export async function storeVectorEmbeddingsInPinecone(
  documents: Document[],
): Promise<void> {
  logger.info("Storing vector embeddings in pinecone...");

  logger.info(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY}`);
  /*

   * For the Google Gemini AI Embedding model + Langchain integration check here
   * https://docs.langchain.com/oss/javascript/integrations/embeddings#google-gemini
   * https://reference.langchain.com/javascript/langchain-google-genai/GoogleGenerativeAIEmbeddings
   *
   *
   * For Google AI JS client check here
   * https://ai.google.dev/gemini-api/docs/embeddings#javascript
   *
   */
  const embeddings = getEmbeddingModel();

  // For Pinecone, Lanchain integration docs refer to https://docs.langchain.com/oss/javascript/integrations/vectorstores#pinecone

  logger.info(`PINECONE_API_KEY: ${process.env.PINECONE_API_KEY}`);

  const pinecone = new PineconeClient({
    apiKey: process.env.PINECONE_API_KEY || "",
  });
  const pineconeIndex = pinecone.Index("smart-watch-user-manuals");

  const vectorStore = new PineconeStore(embeddings, {
    pineconeIndex,
    maxConcurrency: 5,
  });

  await vectorStore.addDocuments(documents);

  logger.info("Vector embeddings stored in Pinecone successfully!");
}


export async function storeVectorEmbeddingsInPgVector(
  documents: Document[],
  metadata: DocumentMetadata,
): Promise<void> {
  logger.info("Generating vector embeddings in PostgreSQL pgVector db...");

  const textChunks = documents.map((doc) => doc.pageContent);
  const chunkEmbeddings = await getEmbeddingModel().embedDocuments(textChunks);

  /**
   * For PostgreSQL pgVector integration check here
   * https://docs.langchain.com/oss/javascript/integrations/vectorstores/pgvector
   */

  logger.info("Storing vector embeddings in PostgreSQL pgVector db...");

  await storeVectorEmbeddings(metadata,textChunks, chunkEmbeddings, documents);
}


function getEmbeddingModel(): GoogleGenerativeAIEmbeddings {
  /*

   * For the Google Gemini AI Embedding model + Langchain integration check here
   * https://docs.langchain.com/oss/javascript/integrations/embeddings#google-gemini
   * https://reference.langchain.com/javascript/langchain-google-genai/GoogleGenerativeAIEmbeddings
   *
   *
   * For Google AI JS client check here
   * https://ai.google.dev/gemini-api/docs/embeddings#javascript
   *
   */


  /**
   * By default, the pgvector extension enforces a strict hardware and index constraint: HNSW indexes can only  
   * handle a maximum of 2,000 dimensions.
   * 
   * const embeddings = new GoogleGenerativeAIEmbeddings({
   *   apiKey: process.env.GEMINI_API_KEY,
   *   modelName: process.env.EMBEDDING_MODEL, 
   *  });
  */


  // 2. Instantiate your custom class
  const embeddings = new Gemini1024Embeddings ({
    model: "gemini-embedding-2", // Truncating this model down from 3072 to 1024
    apiKey: process.env.GEMINI_API_KEY,
  });
  
  return embeddings;
  
}