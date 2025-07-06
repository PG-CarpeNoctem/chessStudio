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

const AnalyzedMoveSchema = z.object({
  moveNumber: z.number().describe('The move number in the game.'),
  player: z.enum(['White', 'Black']).describe('The player who made the move.'),
  san: z.string().describe("The move in Standard Algebraic Notation (e.g., e4, Nf3)."),
  classification: z.enum(['Brilliant', 'Great', 'Excellent', 'Good', 'Book', 'Mistake', 'Blunder', 'Inaccuracy']).describe("The classification of the move."),
  explanation: z.string().describe("An explanation for why the move was classified this way."),
});

const AnalyzeGameOutputSchema = z.object({
  summary: z.string().describe("A brief, high-level summary of the game's outcome and key turning points."),
  analysis: z.array(AnalyzedMoveSchema).describe("A detailed, move-by-move analysis of the game.")
});
export type AnalyzeGameOutput = z.infer<typeof AnalyzeGameOutputSchema>;

export async function analyzeGame(input: AnalyzeGameInput): Promise<AnalyzeGameOutput> {
  return analyzeGameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeGamePrompt',
  input: {schema: AnalyzeGameInputSchema},
  output: {schema: AnalyzeGameOutputSchema},
  prompt: `You are a world-class chess grandmaster and coach, providing game analysis. You will be given a chess game in PGN format. Your task is to analyze it move by move and classify each move according to the following categories:

- **Book**: A standard opening move.
- **Brilliant (!!)**: A very rare, difficult-to-find move that is not only the best but also involves a sacrifice or a deep, non-obvious plan.
- **Great (!)**: A difficult-to-find move that significantly improves the position. Not as rare as a brilliant move.
- **Excellent**: A strong move that maintains an advantage or is the best move in the position, but not particularly hard to find.
- **Good**: A solid move that is decent but not the best.
- **Inaccuracy (?)**: A move that is not the best and leads to a slight worsening of the position.
- **Mistake (??)**: A bad move that significantly worsens the position, such as losing material or a major positional advantage.
- **Blunder (???)**: A very bad move that leads to a losing position, such as losing the queen or getting checkmated.

For each move in the PGN, provide its number, the player, the move in SAN, your classification, and a concise explanation (1-2 sentences).

PGN: {{{pgn}}}
Skill Level: {{{skillLevel}}} (Tailor the depth of your explanations to this level).

Your output must be a JSON object containing a 'summary' of the game and a detailed 'analysis' array.
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
