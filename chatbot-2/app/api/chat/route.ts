import { openai } from "@ai-sdk/openai";

import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  UIMessage,
} from "ai";


import { neon } from '@neondatabase/serverless';
import { logger } from "@/utils/logger";
import { getMockResponse } from "@/utils/mock-response";
import { getResponseStream } from "@/utils/ui-messages";
import { addToChatHistroy } from "@/utils/neon-db";
import { getLastMessageContent,getDocumentContentFromChunks } from "@/utils/ui-messages";
import { getGeminiTextResponse,getGeminiStreamTextResultWithVercel } from "@/ai/llm/gemini-gen-ai";
import { generateEmbeddings } from "@/ai/embedding/vector-embeddings";

import { getDocumentChunks,getDocumentChunksHybrid } from "@/utils/supabase";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  logger.info(`User Message: ${JSON.stringify(messages)}`);


  /**
   * STEP #1
   * Generate the embeddings from the user's query
   * https://docs.langchain.com/oss/javascript/integrations/embeddings
   * 
   */
  const userPrompt = getLastMessageContent(messages);
  const embeddings = await generateEmbeddings(userPrompt);

  /**
   * STEP #2
   * Retrieve the stored vector embeddings based on the users query
   * https://docs.langchain.com/oss/javascript/langchain/retrieval
   *
   * hard coded the tenant id ('BBK_Electronics') to demostrate multi tenancy
   */
  const tenantId = 'BBK_Electronics';
  const vectorSearchResults = await getSerchResults(userPrompt,embeddings,tenantId);
  logger.info(`Results from the vector store ${JSON.stringify(vectorSearchResults)}`);

  /**
   * STEP #3
   * Augment the Search Results as the context to the LLM & Generate the reponse for the user
   */
  const documentContents  = getDocumentContentFromChunks(vectorSearchResults);
  if(documentContents && documentContents.length > 0) {
    logger.info(`Extracted document contents from chunks: ${JSON.stringify(documentContents, null, 2)}`);
    const stream = await getGeminiTextResponse(userPrompt, documentContents[0]);
    return createUIMessageStreamResponse({ stream });
  }

  /**
   * STEP # 3.a 
   * (use this for testing of the LLM with dummy context)
   * Use langchain AI SDK instead of vercel AI SDK 
   */
  if(process.env.AI_RESPONSE_TYPE && process.env.AI_RESPONSE_TYPE == 'text') {
    logger.info('Invoking the gemini AI SDK through langchain');
    const lastMessageContent = getLastMessageContent(messages);
    const stream = await getGeminiTextResponse(userPrompt,lastMessageContent);
    return createUIMessageStreamResponse({ stream });
  }

  /**
   * STEP # 3,b 
   * (use this for testing of the UI with mock response)
   * Get a mock response before invoking the actual API 
   */
  if (process.env.AI_RESPONSE_TYPE && process.env.AI_RESPONSE_TYPE == 'mock') {
    logger.info('Getting the mock response');
    const mockResponse = getMockResponse(messages[messages.length - 1]);
    const stream = getResponseStream(mockResponse);
    return createUIMessageStreamResponse({ stream });
  }

  

  /**
   * TODO - need to implement the streaming response 
   * Use Vercel AI SDK for streaming response 
   * Check https://ai-sdk.dev/v6/docs/reference/ai-sdk-core/stream-text#streamtext
   */
  if (process.env.AI_RESPONSE_TYPE && process.env.AI_RESPONSE_TYPE == 'stream') {
    logger.info('Invoking the streaming vercel AI SDK');
    const result = await getGeminiStreamTextResultWithVercel(messages);
    return result.toUIMessageStreamResponse();
  }

}


async function getSerchResults(userPrompt:string, embeddings: number[], tenantId:string) {

  let vectorSearchResults = [];

  if(process.env.RAG_HYBRID_SEARCH && process.env.RAG_HYBRID_SEARCH == 'true') {
    logger.info('Invoking the hybrid search');
    vectorSearchResults = await getDocumentChunksHybrid(userPrompt,embeddings,tenantId); 
  } else {
    logger.info('Invoking the vector search');
     vectorSearchResults = await getDocumentChunks(embeddings,tenantId); 
  }
  

  return vectorSearchResults;

}

