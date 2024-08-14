import OpenAI from "openai";
import { Counter } from "../utils/rand";

const openai = new OpenAI();

type Message = OpenAI.Chat.Completions.ChatCompletionMessageParam;
export const createConversation = () => {
  const counter = Counter(2);
  const messages: Message[] = [
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
  ];

  return {
    addUserMessage(content: string) {
      counter.inc();
      messages.push({
        role: "user",
        content,
      } as Message);
    },
    async sendRequest(): Promise<string> {
      if (counter.val() >= 10) {
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

const ai = new Map<string, ReturnType<typeof createConversation>>();
export const addByThreadId = (threadId: string) => {
  const conversation = createConversation();

  ai.set(threadId, conversation);

  return conversation;
};

const getByThreadId = (threadId: string) => {
  return ai.get(threadId);
};

export const getOrCreateByThreadId = (threadId: string) => {
  const conversation = getByThreadId(threadId);
  if (conversation) return conversation;

  return addByThreadId(threadId);
};
