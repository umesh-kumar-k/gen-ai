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
import { getLastMessageContent } from "@/utils/ui-messages";
import { getGeminiTextResponse,getGeminiStreamTextResultWithVercel } from "@/ai/llm/gemini-gen-ai";
import { generateEmbeddings } from "@/ai/embedding/vector-embeddings";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  logger.info(`User Message: ${JSON.stringify(messages)}`);


  /**
   * Generate the embeddings from the user's query
   * https://docs.langchain.com/oss/javascript/integrations/embeddings
   * 
   */
  const lastMessageContent = getLastMessageContent(messages);
  const embeddings = await generateEmbeddings(lastMessageContent);

  /**
   * Retrieve the stored vector embeddings based on the users query
   * https://docs.langchain.com/oss/javascript/langchain/retrieval
   * 
   */

  /**
   * Use langchain AI SDK instead of vercel AI SDK 
   */

  if(process.env.AI_RESPONSE_TYPE && process.env.AI_RESPONSE_TYPE == 'text') {
    logger.info('Invoking the gemini AI SDK through langchain');
    const lastMessageContent = getLastMessageContent(messages);
    const stream = await getGeminiTextResponse(lastMessageContent);
    return createUIMessageStreamResponse({ stream });
  }

  /**
   * Get a mock response before invoking the actual API
   */

  if (process.env.AI_RESPONSE_TYPE && process.env.AI_RESPONSE_TYPE == 'mock') {
    logger.info('Getting the mock response');
    const mockResponse = getMockResponse(messages[messages.length - 1]);
    const stream = getResponseStream(mockResponse);
    return createUIMessageStreamResponse({ stream });
  }

  

  /**
   * Use Vercel AI SDK for streaming response 
   * Check https://ai-sdk.dev/v6/docs/reference/ai-sdk-core/stream-text#streamtext
   */

  if (process.env.AI_RESPONSE_TYPE && process.env.AI_RESPONSE_TYPE == 'stream') {
    logger.info('Invoking the streaming vercel AI SDK');
    const result = await getGeminiStreamTextResultWithVercel(messages);
    return result.toUIMessageStreamResponse();
  }



  // vercel AI SDK code for openai

  // const result = await streamText({
  //   model: openai("gpt-4-turbo"),
  //   system:
  //     "You are a helpful assistant created by Neon.tech and Aceternity. Your job is to answer questions asked by the user in a polite and respectful manner. Always answer in markdown.",
  //   messages: await convertToModelMessages(messages),
  //   onFinish: async (completion) => {
  //     try {
  //       const lastMessage = messages[messages.length - 1] as any;
  //       const lastMessageContent = getLastMessageContent(messages);
  //       await addToChatHistroy(lastMessageContent,completion);

  //     } catch (error) {
  //       console.error('Error saving to database:', error);
  //       logger.error(`Error saving to database: ${error}`);
  //     }
  //   }
  // });

  // logger.info(`AI Message: ${JSON.stringify(result.text)}`);
  // return result.toUIMessageStreamResponse();

}

