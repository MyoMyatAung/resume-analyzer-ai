import { getAgent } from './agent';
import { JOB_MATCH_PROMPT, RESUME_ANALYSIS_PROMPT } from './utils/prompts';
import { ResumeAnalysisResult } from './utils/response.schema';

export async function analyzeResume(resumeText: string, jobDescription?: string | undefined, nowIso = new Date().toISOString()) {
  const agent = getAgent();

  const result = await agent.invoke({
    messages: [
      {
        role: "system",
        content: !!jobDescription
          ? JOB_MATCH_PROMPT.replace('{jobDescription}', jobDescription)
          : RESUME_ANALYSIS_PROMPT
      },
      { role: "user", content: `Today is ${nowIso}` },
      { role: "user", content: `Analyze the following resume: ${resumeText}` },
    ]
  });

  return result.structuredResponse as ResumeAnalysisResult
}
