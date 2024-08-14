import { Client, Events, GatewayIntentBits } from "discord.js";
import { env } from "node:process";
import { config } from "dotenv";

config({ path: ".env.local" });

const token = env.DISCORD_TOKEN;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Log in to Discord with your client's token
client
  .login(token)
  .then(() => {
    console.log("Logged in!");
  })
  .catch((error) => {
    console.error("Error logging in:", error);
  });
