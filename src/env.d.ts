declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DISCORD_TOKEN: string;
      DISCORD_CLIENT_ID: string;
      OPENAI_API_KEY: string;
      NODE_ENV: "development" | "production";
    }
  }
}

export {};
