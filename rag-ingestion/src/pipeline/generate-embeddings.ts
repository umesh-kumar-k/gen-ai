import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { GoogleGenAI } from "@google/genai";
import { logger } from "../util/logger";
import { Document } from "@langchain/core/documents";

/**
 * Check the code snippet for langchain vector store here https://docs.langchain.com/oss/javascript/langchain/rag#select-an-embeddings-model
 * For the Google Gemini AI Embedding model check here https://docs.langchain.com/oss/javascript/integrations/embeddings#google-gemini
 *
 *
 * We can also use GoogleGenAI client to generate embeddings https://ai.google.dev/gemini-api/docs/embeddings#javascript
 *
 * @param documents
 */
export async function addToVectorStore(documents: Document[]): Promise<void> {
  /**
   * Ideally I should have used the GoogleGenerativeAIEmbeddings from langchain, but while setting up the PostgreSQL
   * i set the no of dimensions to 1024. The GoogleGenerativeAIEmbeddings from langchain uses 768 dimensions by default.
   * We will be abel to override dimensions when using the GoogleGenAI client.
   * **/

  /*
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "text-embedding-004",
      apiKey: "GOOGLE_API_KEY",
    });
  */

  const ai = new GoogleGenAI({});
  const response = await ai.models.embedContent({
    model: "gemini-embedding-2",
    contents: "What is the meaning of life?",
    config: {
      outputDimensionality: 1024,
    },
  });
  logger.info(response);
}
