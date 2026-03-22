/**
 * AI Feature - API Exports
 * 
 * AI logic is served by backend endpoints; keep only prompt exports here.
 */

export { buildExplainPrompt, buildValidateQuestionPrompt, buildGenerateQuestionsPrompt, buildAnalyzePerformancePrompt, TUTOR_SYSTEM_PROMPT } from '../prompts/explain';
export type { ExplainPromptParams } from '../prompts/explain';
