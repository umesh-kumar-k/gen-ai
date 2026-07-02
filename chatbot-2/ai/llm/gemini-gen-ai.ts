import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

import { logger } from "@/utils/logger";
import { getResponseStream } from "@/utils/ui-messages";

import { systemPrompt,getLastMessageContent } from "@/utils/ui-messages";


import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  UIDataTypes,
  UIMessage,
  UIMessageChunk,
} from "ai";

import { google } from "@ai-sdk/google";


import { addToChatHistroy } from "@/utils/neon-db";


const model = new ChatGoogleGenerativeAI({
    apiKey:process.env.GOOGLE_API_KEY,
    model:process.env.CHAT_MODEL || ''
});


/**
 * function to test the connectivity to the Google Gemini AI apis
 * @param userMsg 
 */
export async function getGeminiTextResponse(userMsg: string, context: string): Promise<ReadableStream<UIMessageChunk<unknown, UIDataTypes>>> {

    const promptToLLM = `

        Instruction to the System: ${systemPrompt}

        Context Information from the Smartwatch Manuals:
        ---------------------
        ${context}
        ---------------------

        Given the context information above, please answer the following user query:
        User Query: ${userMsg}
    `;

    const response = await model.invoke(promptToLLM);
    const responseAny = response as any;
    const text =
    typeof response?.content === "string"
      ? response.content
      : responseAny?.kwargs?.content ?? "";

    logger.info(` Response text: ${text}`);
    logger.info(` Response Metadata : ${JSON.stringify(response.response_metadata)}`);
    logger.info(` Response : ${JSON.stringify(response)}`);
    const stream = getResponseStream(text);
    return stream;
    
}


export async function getGeminiStreamTextResultWithLangchain(messages: UIMessage[]) {
    
}

/**
 * This function is not working 
 * Type 'LanguageModelV4' is not assignable to type 'LanguageModel'.
 * Type 'LanguageModelV4' is not assignable to type '(string & {}) | LanguageModelV3 | LanguageModelV2'.
 * Type 'LanguageModelV4' is not assignable to type 'LanguageModelV2'.
 * Types of property 'specificationVersion' are incompatible.
 * Unsupported model version v4 for provider "google.generative-ai" and model "gemini-2.5-flash". AI SDK 5 only  supports models that implement specification version "v2".
 */
export async function getGeminiStreamTextResultWithVercel(messages: UIMessage[]) {
    const lastMessageContent = getLastMessageContent(messages);
    const promptToLLM = `

        Context Information from the Smartwatch Manuals:
        ---------------------
        Not Available
        ---------------------

        Given the context information above, please answer the following user query:
    `;
    const googleModel = google(process.env.CHAT_MODEL || "gemini-2.5-flash") as unknown as any;

    const result = await streamText({
        model: googleModel,
        system: promptToLLM,
        messages: await convertToModelMessages(messages),
        onFinish: async (completion) => {
          try {
            const lastMessage = messages[messages.length - 1] as any;
            const lastMessageContent = getLastMessageContent(messages);
            await addToChatHistroy(lastMessageContent,completion);
    
          } catch (error) {
            console.error('Error saving to database:', error);
            logger.error(`Error saving to database: ${error}`);
          }
        }
      });

      return result;
}