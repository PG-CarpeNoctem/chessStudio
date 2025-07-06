// use server'
'use server';
/**
 * @fileOverview A chess game analysis AI agent.
 *
 * - analyzeGame - A function that handles the game analysis process.
 * - AnalyzeGameInput - The input type for the analyzeGame function.
 * - AnalyzeGameOutput - The return type for the analyzeGame function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeGameInputSchema = z.object({
  pgn: z.string().describe('The PGN (Portable Game Notation) of the chess game to analyze.'),
  skillLevel: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .describe('The skill level of the player to tailor the analysis.'),
});
export type AnalyzeGameInput = z.infer<typeof AnalyzeGameInputSchema>;

const AnalyzeGameOutputSchema = z.object({
  summary: z.string().describe('A summary of the game, highlighting key moments and mistakes.'),
  alternativeMoves: z
    .array(z.string())
    .describe('Potential alternative moves that could have improved the player performance.'),
});
export type AnalyzeGameOutput = z.infer<typeof AnalyzeGameOutputSchema>;

export async function analyzeGame(input: AnalyzeGameInput): Promise<AnalyzeGameOutput> {
  return analyzeGameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeGamePrompt',
  input: {schema: AnalyzeGameInputSchema},
  output: {schema: AnalyzeGameOutputSchema},
  prompt: `You are an expert chess coach. You will analyze a chess game provided in PGN format and provide insights to help the player improve. Tailor the analysis to the player's skill level.

PGN: {{{pgn}}}
Skill Level: {{{skillLevel}}}

Provide a summary of the game, highlighting key moments and mistakes. Also, suggest potential alternative moves that could have improved the player performance.
`,
});

const analyzeGameFlow = ai.defineFlow(
  {
    name: 'analyzeGameFlow',
    inputSchema: AnalyzeGameInputSchema,
    outputSchema: AnalyzeGameOutputSchema,
  }, async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
