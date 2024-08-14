import {
  Client,
  Events,
  GatewayIntentBits,
  ThreadAutoArchiveDuration,
} from "discord.js";
import { addByThreadId, getOrCreateByThreadId } from "./ai/openai";
import { token } from "./config";
import { Counter } from "./utils/rand";

const counter = Counter();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.GuildEmojisAndStickers,
  ],
});

client.once("ready", () => {
  console.log("Discord bot is ready! 🤖");
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.channel.isThread()) return;

  // Channel is a thread id when it is a thread
  const conversation = getOrCreateByThreadId(message.channel.id);

  console.info(`[${message.author.username}]: ${message.content}`);

  await message.channel.sendTyping();
  await message.react("👍");

  conversation.addUserMessage(message.content);
  const response = await conversation.sendRequest();
  await message.channel.send(response);
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;

  console.info(
    `The user [${user.username}] added reaction ${reaction.emoji.name}`,
  );
  if (reaction.emoji.name === "📖") {
    await reaction.message.channel.sendTyping();
    const thread = await reaction.message.startThread({
      name: "Correction " + counter.val().toString().padStart(3, "0"),
      autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
      reason: "User requested a correction",
    });
    console.info(`Thread created: ${thread.id}`);
    const conversation = addByThreadId(thread.id);
    conversation.addUserMessage(reaction.message.content || "");
    try {
      const response = await conversation.sendRequest();
      await thread.send(response);
    } catch (error) {
      console.error("Error sending message:", error);
      await thread.send("I'm sorry, something went wrong.");
    }
  }
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client
  .login(token)
  .then(() => {
    console.log("Logged in!");
  })
  .catch((error) => {
    console.error("Error logging in:", error);
  });
