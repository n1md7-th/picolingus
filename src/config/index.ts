import { config } from "dotenv";
import { env } from "node:process";

config({ path: ".env.local" });

export const token = env.DISCORD_TOKEN;
export const clientId = env.DISCORD_CLIENT_ID;
export const openAiApiKey = env.OPENAI_API_KEY;
