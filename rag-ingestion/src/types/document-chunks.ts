import { Document } from "@langchain/core/documents";
import { DocumentMetadata } from "./document-metadata";

export type DocumentChunks = {
    documentMetadata: DocumentMetadata;
    chunks: Document[]
}