import { DocumentChunk } from "@/types/document-chunk";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  UIDataTypes,
  UIMessage,
  UIMessageChunk,
} from "ai";
import { logger } from "./logger";


export const systemPrompt = `You are a precise smartwatch technical support assistant. Answer queries using ONLY the provided context. 
Strict Rules:
1. Grounding: Rely solely on the context. Do not extrapolate or use external knowledge.
2. If unknown: If the context lacks the answer, reply exactly: "I'm sorry, but I couldn't find information regarding that in the user manual."
3. Citations: Append the source name to your answers (e.g., [Section 3.2]).
4. Formatting: Be concise. Use short bullet points for steps.`


export function getResponseStream(mockResponse:string):ReadableStream<UIMessageChunk<unknown, UIDataTypes>> {
    const stream = createUIMessageStream({
        execute: ({ writer }) => {
        const id = "mock-response";
        writer.write({ type: "text-start", id });
        writer.write({ type: "text-delta", id, delta: mockResponse });
        writer.write({ type: "text-end", id });
        },
    });

    return stream;
}


export function getLastMessageContent(messages: UIMessage[]): string{
  const lastMessage = messages[messages.length - 1] as any;
  const lastMessageContent = 
    typeof lastMessage.content === 'string'
      ? lastMessage.content
      : Array.isArray(lastMessage.parts)
      ? lastMessage.parts
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join('')
      : '';

  return lastMessageContent;
}

export function getDocumentContentFromChunks(chunks: DocumentChunk[]): string[] {
  const documentContents: string[] = [];
  documentContents.push(...chunks.map((chunk) => chunk.content));
  return documentContents;
} 
