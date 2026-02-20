import { z } from 'zod';

export const ResumeAnalysisResultSchema = z.object({
  // Common Fields
  summary: z.string(),
  quality: z.object({
    overallScore: z.number().min(0).max(100),
    atsCompatibilityScore: z.number().min(0).max(100),
    clarityStructureScore: z.number().min(0).max(100),
    keywordOptimizationScore: z.number().min(0).max(100),
    skillCoverageScore: z.number().min(0).max(100),
  }),
  suggestions: z.object({
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
    quickTips: z.array(z.string()),
  }),

  // Match Specific Fields (optional, only filled if job description provided)
  match: z.object({
    overallMatchScore: z.number().min(0).max(100),
    keywordGapScore: z.number().min(0).max(100),
    atsCompatibilityScore: z.number().min(0).max(100),
    skillCoverageScore: z.number().min(0).max(100),
    matchedKeywords: z.array(z.string()),
    missingKeywords: z.array(z.string()),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
    quickTips: z.array(z.string()),
    summary: z.string(),
  }).optional(),
});

export type ResumeAnalysisResult = z.infer<typeof ResumeAnalysisResultSchema>;
