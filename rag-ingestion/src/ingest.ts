import { Document } from "@langchain/core/documents";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";

import { logger } from "./util/logger";
import { loadFile } from "./pipeline/load-file";
import { splitDocuments } from "./pipeline/split-documents";
import { addToVectorStore } from "./pipeline/generate-embeddings";

/** Handles the document ingestion process */

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOC_DIR = join(__dirname, "..", "docs", "smart-watches");

export async function handleIngestion(): Promise<void> {
  logger.info("Starting ingestion process");
  const documents: Document[] = [];

  try {
    // Step 1: Read / Load Documents
    logger.info("Reading source documents from directory: " + DOC_DIR);

    // List the files in the DOC_DIR
    const files = await fs.promises.readdir(DOC_DIR);

    const documentsFromDirectroy = await loadDocumentsFromDirectory(files);
    documents.push(...documentsFromDirectroy);

    // Log the total number of documents loaded
    logger.info(`Total documents loaded: ${documents.length}`);

    // TODO: Step 2: Chunk Documents
    const chunkedDocuments = await splitDocuments(documents);
    if (!chunkedDocuments || chunkedDocuments.length === 0) {
      logger.error(
        "No documents were chunked. Please check the source documents.",
      );
      process.exit(1);
    } else {
      logger.info(
        `Successfully split documents into ${chunkedDocuments.length} chunks.`,
      );
    }

    // TODO: Step 3: Generate Embeddings & Upsert to Vector DB
    logger.info("Generating embeddings and upserting to vector database...");
    await addToVectorStore(chunkedDocuments);

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
