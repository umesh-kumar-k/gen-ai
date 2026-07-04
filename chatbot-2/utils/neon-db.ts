import { neon } from '@neondatabase/serverless';
import { OnFinishEvent, ToolSet } from 'ai';

const sql = neon(process.env.DATABASE_URL!);

export async function addToChatHistroy(lastMessageContent: string,completion: OnFinishEvent<ToolSet> ){
    await sql`
          INSERT INTO chat_history (
            user_message,
            assistant_message,
            created_at
          ) VALUES (
            ${lastMessageContent},
            ${completion},
            NOW()
          `;
}