import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { config } from './config';

// Input types for content generation
export type ContentGenerationType =
  | 'generate-summary'
  | 'enhance-experience'
  | 'suggest-skills'
  | 'improve-achievements';

export interface GenerateSummaryInput {
  type: 'generate-summary';
  experiences: any[];
  education?: any[];
  context?: any;
}

export interface EnhanceExperienceInput {
  type: 'enhance-experience';
  experience: any;
  context?: any;
}

export interface SuggestSkillsInput {
  type: 'suggest-skills';
  experiences: any[];
  existingSkills?: string[];
  context?: any;
}

export interface ImproveAchievementsInput {
  type: 'improve-achievements';
  achievements: string[];
  jobContext?: string;
  context?: any;
}

export type ContentGenerationInput =
  | GenerateSummaryInput
  | EnhanceExperienceInput
  | SuggestSkillsInput
  | ImproveAchievementsInput;

// Output types
export interface GenerateSummaryResult {
  summary: string;
  alternativeSummaries: string[];
}

export interface EnhanceExperienceResult {
  enhancedResponsibilities: string[];
  suggestedAchievements: string[];
  impactMetricsSuggestions: string[];
}

export interface SuggestSkillsResult {
  technicalSkills: string[];
  softSkills: string[];
  emergingSkills: string[];
  certificationSuggestions: string[];
}

export interface ImproveAchievementsResult {
  improvedAchievement: string;
  alternatives: string[];
  tips: string[];
}

export type ContentGenerationResult =
  | GenerateSummaryResult
  | EnhanceExperienceResult
  | SuggestSkillsResult
  | ImproveAchievementsResult;

// Prompts
const SUMMARY_SYSTEM_PROMPT = `You are an expert resume writer specializing in professional summaries. 
Create compelling, ATS-friendly professional summaries that highlight the candidate's value proposition.

Return your response as JSON:
{
  "summary": "The main professional summary (3-4 sentences)",
  "alternativeSummaries": ["Alternative 1", "Alternative 2"] // 2 more options with different tones/focuses
}

Guidelines:
- Start with the candidate's role/title and years of experience
- Highlight key skills and expertise areas
- Include quantifiable achievements if possible
- Keep each summary between 50-100 words
- Use strong action words
- Make it ATS-friendly by including relevant keywords
- Tailor to the target role if provided`;

const ENHANCE_EXPERIENCE_SYSTEM_PROMPT = `You are an expert resume writer specializing in work experience sections.
Enhance the provided job responsibilities and achievements to be more impactful and ATS-friendly.

Return your response as JSON:
{
  "enhancedResponsibilities": ["Enhanced responsibility 1", "Enhanced responsibility 2", ...],
  "suggestedAchievements": ["Achievement 1", "Achievement 2", ...],
  "impactMetricsSuggestions": ["Metric suggestion 1", "Metric suggestion 2", ...]
}

Guidelines:
- Use action verbs at the start of each bullet point (Led, Developed, Implemented, Optimized, etc.)
- Quantify achievements with numbers, percentages, or dollar amounts where possible
- Focus on results and impact rather than just duties
- Keep bullets concise (1-2 lines each)
- Include industry-relevant keywords
- Suggest achievements that demonstrate leadership, problem-solving, and initiative`;

const SUGGEST_SKILLS_SYSTEM_PROMPT = `You are an expert career advisor with deep knowledge of job market trends and in-demand skills.
Suggest relevant skills based on the candidate's current skills and target role.

Return your response as JSON:
{
  "technicalSkills": ["Skill 1", "Skill 2", ...],
  "softSkills": ["Skill 1", "Skill 2", ...],
  "emergingSkills": ["Skill 1", "Skill 2", ...],
  "certificationSuggestions": ["Certification 1", "Certification 2", ...]
}

Guidelines:
- Suggest skills that complement the existing skill set
- Include both hard/technical skills and soft skills
- Consider current market demand and trends
- Suggest certifications that would add value
- Keep suggestions realistic and relevant to the target role/industry
- Include emerging technologies or methodologies where appropriate`;

const IMPROVE_ACHIEVEMENTS_SYSTEM_PROMPT = `You are an expert resume writer specializing in quantifying achievements.
Transform the provided achievement into a more impactful, results-oriented statement.

Return your response as JSON:
{
  "improvedAchievement": "The improved achievement statement",
  "alternatives": ["Alternative version 1", "Alternative version 2"],
  "tips": ["Tip for improvement 1", "Tip for improvement 2"]
}

Guidelines:
- Use the XYZ formula: Accomplished [X] as measured by [Y], by doing [Z]
- Quantify with specific numbers, percentages, or dollar amounts
- Focus on business impact (revenue, cost savings, efficiency, customer satisfaction)
- Use strong action verbs
- Keep it concise but impactful (1-2 lines)
- Suggest what additional context or metrics would strengthen the statement`;

/**
 * Generate content for resume building
 */
export async function generateContent(
  input: ContentGenerationInput
): Promise<ContentGenerationResult> {
  const model = new ChatGoogleGenerativeAI({
    apiKey: config.google.apiKey,
    model: 'gemini-2.5-flash',
    temperature: 0.7, // Slightly higher for creative content
  });

  let systemPrompt: string;
  let userPrompt: string;

  switch (input.type) {
    case 'generate-summary':
      systemPrompt = SUMMARY_SYSTEM_PROMPT;
      userPrompt = buildSummaryPrompt(input);
      break;
    case 'enhance-experience':
      systemPrompt = ENHANCE_EXPERIENCE_SYSTEM_PROMPT;
      userPrompt = buildExperiencePrompt(input);
      break;
    case 'suggest-skills':
      systemPrompt = SUGGEST_SKILLS_SYSTEM_PROMPT;
      userPrompt = buildSkillsPrompt(input);
      break;
    case 'improve-achievements':
      systemPrompt = IMPROVE_ACHIEVEMENTS_SYSTEM_PROMPT;
      userPrompt = buildAchievementsPrompt(input);
      break;
    default:
      throw new Error(`Unknown content generation type: ${(input as any).type}`);
  }

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(userPrompt),
  ];

  const response = await model.invoke(messages);
  const content = response.content as string;

  // Parse JSON response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse LLM response as JSON');
  }

  return JSON.parse(jsonMatch[0]) as ContentGenerationResult;
}

function buildSummaryPrompt(input: GenerateSummaryInput): string {
  let prompt = `Generate a professional summary based on the following experiences and education:

Experiences:
${JSON.stringify(input.experiences, null, 2)}

Education:
${JSON.stringify(input.education || [], null, 2)}`;

  if (input.context?.targetRole) {
    prompt += `\nTarget Role: ${input.context.targetRole}`;
  }

  return prompt;
}

function buildExperiencePrompt(input: EnhanceExperienceInput): string {
  const { experience, context } = input;
  let prompt = `Enhance the following work experience:

Experience:
${JSON.stringify(experience, null, 2)}`;

  if (context?.industry) {
    prompt += `\n\nIndustry: ${context.industry}`;
  }

  return prompt;
}

function buildSkillsPrompt(input: SuggestSkillsInput): string {
  let prompt = `Suggest relevant skills based on the following work experiences:

Experiences:
${JSON.stringify(input.experiences, null, 2)}`;

  if (input.existingSkills && input.existingSkills.length > 0) {
    prompt += `\n\nCurrent Skills: ${input.existingSkills.join(', ')}`;
  }

  if (input.context?.targetRole) {
    prompt += `\nTarget Role: ${input.context.targetRole}`;
  }

  return prompt;
}

function buildAchievementsPrompt(input: ImproveAchievementsInput): string {
  let prompt = `Improve the following achievements:

Achievements:
${input.achievements.map((a, i) => `${i + 1}. ${a}`).join('\n')}`;

  if (input.jobContext) {
    prompt += `\n\nJob Context: ${input.jobContext}`;
  }

  if (input.context?.targetRole) {
    prompt += `\n\nTarget Role: ${input.context.targetRole}`;
  }

  return prompt;
}
