import { Document } from "@langchain/core/documents";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
import "dotenv/config"; // Automatically loads the .env file

import { logger } from "./util/logger";
import { loadFile } from "./pipeline/file-loader";
import { splitDocuments } from "./pipeline/document-splitter";
import { generateFileFingerprint } from "./util/ingestion";


// Load metadata from the JSON file - in prod it will come from REST api call 
import metadata  from "../data/metadata.json";

import {
  storeVectorEmbeddingsInPinecone,
  storeVectorEmbeddingsInPgVector,
} from "./pipeline/vector-embeddings";
import { DocumentMetadata } from "./types/document-metadata";
import { DocumentChunks } from "./types/document-chunks";

/** Handles the document ingestion process */

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOC_DIR = join(__dirname, "..", "docs", "smart-watches");

export async function handleIngestion(): Promise<void> {
  logger.info("Starting ingestion process");
  const documents: DocumentChunks[] = [];

  try {

    logger.info("Reading source documents from directory: " + DOC_DIR);

    // Read / Load Documents
    // List the files in the DOC_DIR
    const files = await fs.promises.readdir(DOC_DIR);

    for (const file of files) {

      /**
       * For every file, load the document and get its metadata, then create a DocumentChunks object
       */
      const docs = await loadDocument(file);
      const fileMetadata: DocumentMetadata = getMetadata(file);
      const documentChunks: DocumentChunks = {
        documentMetadata: fileMetadata,
        chunks: docs,
      };
      logger.info(`Loaded ${docs.length} documents from file: ${file}`);

      // Log the total number of document chunks loaded so far
      logger.info(`Total documents loaded: ${documents.length + 1}`);

      /**
       * Split the documents into chunks and store them in the documents array
       */
      const chunkedDocuments = await splitDocuments(docs);
      if (!chunkedDocuments || chunkedDocuments.length === 0) {
        logger.error(
          "No documents were chunked. Please check the source documents.",
        );
        process.exit(1);
      }
      logger.info(
        `Successfully split documents into ${chunkedDocuments.length} chunks.`,
      );

      /**
       * Generate Embeddings & Upsert to Vector DB
       */
      logger.info("Generating embeddings and upserting to vector database...");

      documents.push(documentChunks);

      // Generate the file hash for the document and store the metadata in PostgreSQL + pgVector
      const hash = await generateFileFingerprint(fileMetadata.filePath)
      fileMetadata.file_hash = hash;

      // Store Vector Embeddings in Vector DB
      // Generate embeddings & store in PostgreSQL + pgVector 
      await storeVectorEmbeddingsInPgVector(chunkedDocuments, fileMetadata);
      
      // Store in Pinecone if ADD_TO_PINECONE is set - just to demonstrate pure vector store vs PostgreSQL + pgVector
      if (process.env.ADD_TO_PINECONE && process.env.ADD_TO_PINECONE == "true") {

      }

    }

    logger.info("Ingestion completed successfully!");

  } catch (error) {
    logger.error("An error occurred during the ingestion process", error);
    process.exit(1);
  }
}

/**
 * iterate over each file and convert to langchain Document[]
 * @param files
 * @returns
 */
async function loadDocumentsFromDirectory(
  files: string[],
): Promise<Document[]> {
  const loadedFileResults = await Promise.all(
    files.map(async (file) => {
      const filePath = join(DOC_DIR, file);
      const stats = await fs.promises.stat(filePath);

      if (!stats.isFile()) {
        return [] as Document[];
      }
      const docs = await loadFile(file, filePath);
      logger.info(`Loaded ${docs.length} documents from file: ${file}`);
      return docs;
    }),
  );
  return loadedFileResults.flat();
}

async function loadDocument(file: string): Promise<Document[]> {
  const filePath = join(DOC_DIR, file);
  const stats = await fs.promises.stat(filePath);

  if (!stats.isFile()) {
    return [] as Document[];
  }
  const docs = await loadFile(file, filePath);
  logger.info(`Loaded ${docs.length} documents from file: ${file}`);
  return docs;
}

function getMetadata(file: string): DocumentMetadata {
  const metadataKey = file as keyof typeof metadata;
  const filePath = join(DOC_DIR, file);
  const baseMetadata = metadata[metadataKey];

  if (!baseMetadata) {
    throw new Error(`Metadata not found for file: ${file}`);
  }

  const fileMetadata: DocumentMetadata = {
    ...baseMetadata,
    fileName: file,
    filePath,
  };

  return fileMetadata;
}
