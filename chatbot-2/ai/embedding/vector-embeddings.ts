import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Gemini1024Embeddings } from "./custom-gemini-embedding-model";
import { logger } from "@/utils/logger";


/**
 * Check this https://docs.langchain.com/oss/javascript/integrations/embeddings
 * @param userPrompt 
 */
export async function generateEmbeddings(userPrompt: string): Promise<number[]> {
    logger.info(`Generating the embeddings for the users prompt ${userPrompt}`);
    const embeddingModel = getEmbeddingModel();
    const embeddings = await embeddingModel.embedQuery(userPrompt);
    logger.debug(`Embeddings : ${embeddings}`);
    return embeddings;
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