import OpenAI from "openai";
import { openAiApiKey } from "../config";
import { Counter } from "../utils/rand";
type Message = OpenAI.Chat.Completions.ChatCompletionMessageParam;

const openai = new OpenAI({
  apiKey: openAiApiKey,
});

const strategies = {
  grammarly: [
    {
      role: "system",
      content:
        "You are a helpful assistant. Your task is to fix typos and correct grammar. Add proper punctuation and capitalization.",
    },
    {
      role: "system",
      content:
        "Try to make the text sound more natural and explain if the user needs follow up.",
    },
    {
      role: "system",
      content:
        "Do not over-explain or provide unnecessary information. Be concise.",
    },
    {
      role: "system",
      content:
        "Text output is meant for Discord. So you can use markdown if needed.",
    },
  ] as Message[],
  conversation: [
    {
      role: "system",
      content:
        "You are a helpful assistant. Your task is to engage in a conversation with the user.",
    },
    {
      role: "system",
      content:
        "Your name is Pico. You are 31 years old male. You are a professional JS/TS full-stack developer, anime and music lover.",
    },
    {
      role: "system",
      content: "Try to make the conversation engaging and interesting.",
    },
    {
      role: "system",
      content: "Do not over-explain or provide unnecessary information.",
    },
    {
      role: "system",
      content:
        "Text output is meant for Discord. So you can use markdown if needed.",
    },
  ] as Message[],
};

type Strategies = keyof typeof strategies;

export const createConversation = (strategy: Strategies, enabled = true) => {
  const counter = Counter(2);
  const maxQuota = Counter(10);
  const messages: Message[] = strategies[strategy];

  const hasReachedLimit = () => {
    return counter.val() >= maxQuota.val();
  };

  return {
    strategy() {
      return strategy;
    },
    isDisabled() {
      return !enabled;
    },
    enable() {
      enabled = true;
    },
    disable() {
      enabled = false;
    },
    extendQuota() {
      maxQuota.add(5);
    },
    hasReachedLimit() {
      return hasReachedLimit();
    },
    addUserMessage(content: string) {
      counter.inc();
      messages.push({
        role: "user",
        content,
      } as Message);
    },
    async sendRequest(): Promise<string> {
      if (hasReachedLimit()) {
        return "I'm sorry, that is too many messages for this conversation.";
      }

      const conversation = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
      });

      const message = conversation.choices[0].message;

      messages.push(message);

      return message.content || "I'm sorry, I don't understand.";
    },
  };
};

export type Conversation = ReturnType<typeof createConversation>;
export const ai = new Map<string, Conversation>();
export const addByThreadId = (strategy: Strategies, threadId: string) => {
  const conversation = createConversation(strategy);

  ai.set(threadId, conversation);

  return conversation;
};

export const getByThreadId = (threadId: string) => {
  return ai.get(threadId);
};

export const hasThreadId = (threadId: string) => {
  return ai.has(threadId);
};

export const getOrCreateByThreadId = (
  strategy: Strategies,
  threadId: string,
) => {
  const conversation = getByThreadId(threadId);
  if (conversation) return conversation;

  return addByThreadId(strategy, threadId);
};
