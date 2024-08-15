import {
  ActivityType,
  Client,
  Events,
  GatewayIntentBits,
  ThreadAutoArchiveDuration,
} from "discord.js";
import { addByThreadId, getByThreadId } from "./ai/openai";
import { token } from "./config";
import { Logger } from "./utils/logger";
import { Counter, Randomizer } from "./utils/rand";

const counter = Counter(0);
const logger = Logger();
const openBookEmoji = "📖";
const emoji = Randomizer(["👍", "🤔", "🧐", "🙃", "🫡", "🫶", "🙂"]);

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

client.once("ready", async (client) => {
  logger.info("Discord bot is ready! 🤖");
  client.user.setStatus("online");
  client.user.setActivity("grammar & your GF", {
    type: ActivityType.Watching,
  });
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.content.startsWith("!skip")) return;

  const isPicoConversationFirstTime =
    message.content.startsWith("!Pico") || message.content.startsWith("!pico");
  let conversation = getByThreadId(message.channel.id);
  if (!conversation) {
    // Create a new conversation for the channel
    const strategy = isPicoConversationFirstTime ? "conversation" : "grammarly";

    const thread = await message.startThread({
      name: "Correction " + counter.inc().toString().padStart(3, "0"),
      autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
      reason: "User requested a interaction",
    });
    logger.info(`Thread created: ${thread.id}`);
    conversation = addByThreadId(strategy, thread.id);
    if (message.channel.isThread()) return;

    try {
      await Promise.all([
        message.channel.sendTyping(),
        message.react(emoji.getRandom()),
      ]);

      conversation.addUserMessage(message.content);
      const response = await conversation.sendRequest();
      await thread.send(response);
    } catch (error) {
      logger.error("Error sending message:", error);
    }
    return;
  }

  if (!conversation) return;

  logger.info(
    `[${conversation.strategy()}] ${message.author.username}: ${message.content}`,
  );

  if (message.content.startsWith("!disable")) {
    conversation.disable();
    logger.info("AI is disabled");
  }

  if (message.content.startsWith("!enable")) {
    conversation.enable();
    logger.info("AI is enabled");
  }

  if (message.content.startsWith("!extend")) {
    conversation.extendQuota(); // 5 more messages
    logger.info("Quota extended");
  }

  if (conversation.isDisabled()) return;
  if (conversation.hasReachedLimit()) return;

  logger.info(`[${message.author.username}]: ${message.content}`);

  try {
    await Promise.all([
      message.channel.sendTyping(),
      message.react(emoji.getRandom()),
      message.react(emoji.getRandom()),
      message.react(emoji.getRandom()),
    ]);

    conversation.addUserMessage(message.content);
    const response = await conversation.sendRequest();
    await message.channel.send(response);
  } catch (error) {
    logger.error("Error sending message:", error);
  }
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
    name: "Correction " + counter.inc().toString().padStart(3, "0"),
    autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
    reason: "User requested a correction",
  });
  logger.info(`Thread created: ${thread.id}`);
  const conversation = addByThreadId("grammarly", thread.id);
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
