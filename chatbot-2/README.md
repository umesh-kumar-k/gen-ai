# RAG Chatbot

- Refer to the template here https://vercel.com/templates/next.js/chatbot-by-aceternity

## Pre Requisite

1. Create a neon DB user account 
2. Create a `.env.local` file in the root directory with the following variables:
```bash
DATABASE_URL="your-neon-database-url"
```

# Flow

Get user's prompt
   ↓
Generate Embeddings
   ↓
Search in PostgreSQL + pgVector DB
   ↓
Retrieve the response(s)
   ↓
Augment response to the User's prompt 
   ↓
Send the prompt with the context to LLM
   ↓
Generate Answer 
   ↓
Display in the UI

## Key Technologies

- [Next.js](https://nextjs.org/) - React framework
- [Neon](https://neon.tech/) - Serverless Postgres database
- [OpenAI](https://openai.com/) - GPT-4 language model
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Aceternity UI](https://ui.aceternity.com/) - UI components


## Steps

1. Migrate vercel ai sdk's from verion 3 to 6 or 7 
2. Set up winston logger
3. We can use vercel AI SDK or langchain javascript sdk 
   - this vercel ai template uses vercal AI SDK by default
4. 

## npm packages
  - winston (logger for server components)
  - langchain @langchain/core (AI SKD instead of vercel AI SDK)
  - dotenv (environment file reader)
  - @langchain/google-genai,@langchain/google (for invoking Google LLMs + Embedding Models)
  - @google/genai (for invoking Embedding Model)
  - @supabase/supabase-js (PostgreSQL pgVector)
  - js-tiktoken (for counting tokens)
  - @ai-sdk/google" (vercel AI SDK )
  - @ai-sdk/react (for vercel ai sdk v5+)
  - @ai-sdk/google


## Notes 

1. The vector embeddings are stored in the postregsql + pgvector on supabase. This chatbot template from vercel uses the postgresql on neon to save the chat history. You can either modify the tempalte code to use postgres for storing the chat history or continue to maintain 2 separate databases

2. If we are using the vercel AI SDK we need to set up the AI_GATEWAY_API_KEY or use the provider module
   
   Error [GatewayAuthenticationError]: Unauthenticated request to AI Gateway
   Alternatively, you can use a provider module instead of the AI Gateway.




## System Prompt

You are a precise smartwatch technical support assistant. Answer queries using ONLY the provided context. 

Strict Rules:
1. Grounding: Rely solely on the context. Do not extrapolate or use external knowledge.
2. If unknown: If the context lacks the answer, reply exactly: "I'm sorry, but I couldn't find information regarding that in the provided user manual."
3. Citations: Append the source name to your answers (e.g., [Section 3.2]).
4. Formatting: Be concise. Use short bullet points for steps.


## User Prompt with Context 

const systemPrompt = `... (Insert the prompt above here) ...`;
const userPromptWithContext = `
   Context Information from the Smartwatch Manuals:
   ```javascript
   ${retrievedContextChunks.map(chunk => `[Source: ${chunk.metadata.source}] \n ${chunk.text}`).join('\n\n')}
   ```

   Given the context information above, please answer the following user query:
   User Query: ${userQuery}

`;