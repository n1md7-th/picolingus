import {
  ActivityType,
  Client,
  Events,
  GatewayIntentBits,
  ThreadAutoArchiveDuration,
} from "discord.js";
import { addByThreadId, getOrCreateByThreadId } from "./ai/openai";
import { token } from "./config";
import { Logger } from "./utils/logger";
import { Counter } from "./utils/rand";

const counter = Counter();
const logger = Logger();
const openBookEmoji = "📖";

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

client.once("ready", (client) => {
  logger.info("Discord bot is ready! 🤖");
  client.user.setStatus("online");
  client.user.setActivity("grammar & your GF", {
    type: ActivityType.Watching,
  });
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.channel.isThread()) return;

  // Channel.id is a thread id when it is a thread
  const conversation = getOrCreateByThreadId(message.channel.id);

  logger.info(`[${message.author.username}]: ${message.content}`);

  await message.channel.sendTyping();
  await message.react("👍");

  conversation.addUserMessage(message.content);
  const response = await conversation.sendRequest();
  await message.channel.send(response);
});

client.on("messageReactionAdd", async (reaction, user) => {
  logger.info(
    `The user [${user.username}] added reaction ${reaction.emoji.name}`,
  );

  if (user.bot) return;
  if (reaction.emoji.name !== openBookEmoji) return;
  if (!reaction.message.content) return;

  await reaction.message.channel.sendTyping();
  const thread = await reaction.message.startThread({
    name: "Correction " + counter.val().toString().padStart(3, "0"),
    autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
    reason: "User requested a correction",
  });
  logger.info(`Thread created: ${thread.id}`);
  const conversation = addByThreadId(thread.id);
  conversation.addUserMessage(reaction.message.content);
  try {
    const response = await conversation.sendRequest();
    await thread.send(response);
  } catch (error) {
    logger.error("Error sending message:", error);
    await thread.send("I'm sorry, something went wrong.");
  }
});

client.once(Events.ClientReady, (readyClient) => {
  logger.info(`Ready! Logged in as ${readyClient.user.tag}`);
});

client
  .login(token)
  .then(() => {
    logger.info("Logged in!");
  })
  .catch((error) => {
    logger.error("Error logging in:", error);
  });
