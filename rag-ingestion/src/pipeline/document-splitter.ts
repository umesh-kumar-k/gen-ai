import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { logger } from '../util/logger';


/**
 * Check the code snippet for langchain splitters here https://docs.langchain.com/oss/javascript/langchain/rag#split-documents
 * @param documents 
 */
export async function splitDocuments(documents: Document[]): Promise<Document[]> {
    logger.info('Chunking documents into segments...');
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    const allSplits = await splitter.splitDocuments(documents);
    return allSplits;
}