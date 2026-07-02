import { DocumentChunk } from "@/types/document-chunk";
import { logger } from "./logger";
import { createClient } from "@supabase/supabase-js";

const supabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Semantic Search . Check the following link for more details 
 * 
 * https://supabase.com/docs/guides/ai/semantic-search
 * 
 * @param userQueryEmbedding 
 * @param tenantId 
 * @returns 
 */
export async function getDocumentChunks(userQueryEmbedding: number[], tenantId: string): Promise<DocumentChunk[]> {
    logger.info(`Calling the getDocumentChunks for the tenant ${tenantId}`);
    const { data, error } = await supabaseClient.rpc("match_document_chunks", {
        query_embedding: userQueryEmbedding,
        match_count: 1,
        tenant_filter: tenantId,
    });

    if (error) {
        console.error(`Error while trying to fetch the document chunks ${error}`);
        throw error;
    }

    logger.info(`Successfully fetched the data: ${JSON.stringify(data, null, 2)}`);
    return data;
}


/**
 * Semantic Search + Full Text Search . Check the following link for more details 
 * 
 * https://supabase.com/docs/guides/ai/hybrid-search
 * https://supabase.com/docs/guides/database/full-text-search
 * 
 * @param userQueryText 
 * @param userQueryEmbedding 
 * @param tenantId 
 * @returns 
 */
export async function getDocumentChunksHybrid(userQueryText: string,userQueryEmbedding: number[], tenantId: string): Promise<DocumentChunk[]> {

    logger.info(`Calling the getDocumentChunksHybrid for the tenant ${tenantId}`);

    const { data, error } = await supabaseClient.rpc("match_document_chunks_hybrid", {
        query_text: userQueryText,
        query_embedding: userQueryEmbedding,
        tenant_filter: tenantId,
        match_count: 5,
        rrf_k: 50,                   
        full_text_weight:0.5,
        semantic_weight:1.0
    });

    if (error) {
        console.error(`Error while trying to fetch the document chunks with hybrid search ${error}`);
        throw error;
    }

    logger.info(`Successfully fetched the data: ${JSON.stringify(data, null, 2)}`);
    return data;
}