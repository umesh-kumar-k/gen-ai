import * as fs from "fs";
import * as crypto from "crypto";
import { pipeline } from "stream/promises";
import { getEncoding } from "js-tiktoken";


/**
 * 
 * Generates a SHA256 hex string for a file
 * 
 * @param filePath 
 * @returns 
 */
export async function generateFileFingerprint(filePath: string):Promise<string>{
  const hash = crypto.createHash('sha256');
  const fileStream = fs.createReadStream(filePath);
  await pipeline(fileStream, hash);
  return hash.digest('hex'); 
}


/**
 * Generates a SHA256 hex string for each chunk of text from the documents[]
 */
export function generateTextFingerprint(textChunk: string):string{
  const hash = crypto.createHash('sha256');
  hash.update(textChunk);
  return hash.digest('hex'); 
}

/**
 * 
 * Option 1: Using the Official @google/genai SDK (Network Call)
 *  - if you need 100% precise token counting for billing, rate limits, or strict context window calculations for Gemini.
 * Option 2: Using tiktoken (Local & Offline)
 *  - if you are processing thousands of chunks in a loop and making a network call for each one would be too slow or inefficient.
 * 
 * Generated with the help of AI 
 */
export function getTokenCount(textChunk: string): number {
  // Use the standard cl100k_base or o200k_base encodings
  const enc = getEncoding("cl100k_base");

  // Encode the text into an array of token IDs
  const tokenIds = enc.encode(textChunk);
  const tokenCount = tokenIds.length;
  return tokenCount;
}

