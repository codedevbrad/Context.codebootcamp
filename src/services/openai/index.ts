"use server";

import OpenAI from "openai";

type ChatCompletionMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function askOpenAI(messages: ChatCompletionMessage[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages,
  });

  return completion.choices[0]?.message?.content?.trim() || "";
}
