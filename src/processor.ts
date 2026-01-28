import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { config } from './config';

export interface ResumeAnalysisInput {
  resumeText: string;
  jobDescription?: string;
}

export interface ResumeAnalysisResult {
  // Common Fields
  summary: string;
  quality: {
    overallScore: number;
    atsCompatibilityScore: number;
    clarityStructureScore: number;
    keywordOptimizationScore: number;
    skillCoverageScore: number;
  };
  suggestions: {
    strengths: string[];
    improvements: string[];
    quickTips: string[];
  };

  // Match Specific Fields (optional, only filled if job description provided)
  match?: {
    overallMatchScore: number;
    keywordGapScore: number;
    atsCompatibilityScore: number;
    skillCoverageScore: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    strengths: string[];
    improvements: string[];
    quickTips: string[];
    summary: string;
  };
}

const SYSTEM_PROMPT = `You are an expert resume analyst. Analyze the provided resume and optional job description.
Return your analysis as a JSON object with the following structure:

{
  "summary": "General summary of the candidate's profile",
  "quality": {
    "overallScore": <0-100>,
    "atsCompatibilityScore": <0-100>,
    "clarityStructureScore": <0-100>,
    "keywordOptimizationScore": <0-100>,
    "skillCoverageScore": <0-100>
  },
  "suggestions": {
    "strengths": ["Strength 1", "Strength 2", ...],
    "improvements": ["Improvement 1", "Improvement 2", ...],
    "quickTips": ["Tip 1", "Tip 2", ...]
  },
  "match": { // ONLY include this if a job description is provided
    "overallMatchScore": <0-100>,
    "keywordGapScore": <0-100>,
    "atsCompatibilityScore": <0-100>,
    "skillCoverageScore": <0-100>,
    "matchedKeywords": ["Key1", "Key2", ...],
    "missingKeywords": ["Key3", "Key4", ...],
    "strengths": ["Match Strength 1", ...],
    "improvements": ["Match Improvement 1", ...],
    "quickTips": ["Match Tip 1", ...],
    "summary": "Summary of how the resume fits this specific job"
  }
}

Only respond with valid JSON. Ensure all bullet lists are arrays of strings. 
If no job description is provided, omit the "match" field entirely.`;

/**
 * Processes a resume using LangChain and Google Generative AI
 */
export async function analyzeResume(input: ResumeAnalysisInput): Promise<ResumeAnalysisResult> {
  const model = new ChatGoogleGenerativeAI({
    apiKey: config.google.apiKey,
    model: 'gemini-2.5-flash',
    temperature: 0.1,
  });

  let userPrompt = `Please analyze the following resume:\n\n${input.resumeText}`;

  if (input.jobDescription) {
    userPrompt += `\n\nJob Description to match against:\n${input.jobDescription}`;
  }

  const messages = [
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(userPrompt),
  ];

  const response = await model.invoke(messages);
  const content = response.content as string;

  // Parse JSON response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse LLM response as JSON');
  }

  return JSON.parse(jsonMatch[0]) as ResumeAnalysisResult;
}
