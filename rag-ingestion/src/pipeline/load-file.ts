import { logger } from '../util/logger';
import { PDFParse } from 'pdf-parse';
import { Document } from '@langchain/core/documents';
import { readFileSync } from "node:fs";
import path from 'node:path';

export async function loadFile(fileName: string, filePath: string): Promise<Document[]>  {

    try{
        logger.info(`Trying to load file: ${fileName} at path: ${filePath}`);
        if(path.extname(fileName).toLowerCase() === '.pdf') {
            return await loadPDF(filePath);
        }
        else {
            logger.warn(`Unsupported file type for file: ${fileName}. Only PDF files are supported.`);
            return [];
        }
    }
    catch (error) {
        logger.error('An error occurred during the ingestion process', error);
        return [];
    }

}


/**
 * Check the code snippet for PDFParse here https://docs.langchain.com/oss/javascript/langchain/knowledge-base#seeding-the-vector-store
 * @param filePath 
 * @returns 
 */
async function loadPDF(filePath: string): Promise<Document[] > {
    // PDFParse - node module to parse PDF files
    const parser = new PDFParse({
        data: new Uint8Array(readFileSync(filePath)),
    });
    try {
        const { pages } = await parser.getText();
        return pages.map(
        (page) =>
            new Document({
            pageContent: page.text,
            metadata: { source: filePath, page: page.num - 1 },
            })
        );
    }
    finally {
        await parser.destroy();
    }
}