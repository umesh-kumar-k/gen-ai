export type DocumentChunk = {
    chunk_id: number;
    document_id: string;
    content: string;
    similarity: number;
}