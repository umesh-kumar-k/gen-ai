import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

/**
 * Code Generated from AI to create a custom embedding model that truncates the Gemini Embedding model from 3072 dimensions to 1024 dimensions.
 * 
 * This is useful when you want to use the Gemini Embedding model but need to reduce the dimensionality of the embeddings for storage or performance reasons.
 */
export class Gemini1024Embeddings extends GoogleGenerativeAIEmbeddings {
  // GoogleGenerativeAIEmbeddings has private internals we can't override.
  // Instead, call the parent's embed methods and truncate the resulting vectors to 1024 dims.
  async embedQuery(text: string): Promise<number[]> {
    const vector = await super.embedQuery(text);
    return vector.slice(0, 1024);
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const vectors = await super.embedDocuments(texts);
    return vectors.map((v) => v.slice(0, 1024));
  }
}

