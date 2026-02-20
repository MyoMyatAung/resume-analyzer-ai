import { ChatGroq } from "@langchain/groq";
import { createAgent } from "langchain";
import { config } from './config';
import { ResumeAnalysisResultSchema } from "./utils/response.schema";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

let cachedAgent: ReturnType<typeof createAgent> | null = null;

export function getAgent(): ReturnType<typeof createAgent> {
  if (cachedAgent) return cachedAgent;

  // const model = new ChatGroq({
  //   apiKey: config.groq.apiKey,
  //   model: "llama-3.3-70b-versatile",
  //   temperature: 0,
  // })

  const model = new ChatGoogleGenerativeAI({
    apiKey: config.google.apiKey,
    model: "gemini-2.5-flash",
    temperature: 0,
  })

  cachedAgent = createAgent({
    model,
    tools: [],
    responseFormat: ResumeAnalysisResultSchema
  })

  return cachedAgent;
}
