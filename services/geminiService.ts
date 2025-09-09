import { GoogleGenAI, Chat } from '@google/genai';
import { type Message } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error('API_KEY environment variable is not set.');
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const initializeChat = (language: string, history?: Message[]): Chat => {
  const model = 'gemini-2.5-flash';
  const chat = ai.chats.create({
    model: model,
    history: history,
    config: {
      systemInstruction: `You are a helpful and friendly AI assistant. You must respond in ${language}. Format your responses using Markdown when appropriate, such as for code blocks, lists, or emphasis.`,
    },
  });
  return chat;
};