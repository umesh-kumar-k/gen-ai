import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";


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
    const embeddings = new GoogleGenerativeAIEmbeddings({
        model: "text-embedding-004",
        apiKey: 'GOOGLE_API_KEY' 
    });
}