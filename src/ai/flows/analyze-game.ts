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
  evaluation: z.number().describe("The centipawn evaluation of the position after the move. Positive is good for White, negative for Black."),
});

const MoveCountsSchema = z.object({
  brilliant: z.number().default(0),
  great: z.number().default(0),
  excellent: z.number().default(0),
  good: z.number().default(0),
  book: z.number().default(0),
  inaccuracy: z.number().default(0),
  mistake: z.number().default(0),
  blunder: z.number().default(0),
});

const AnalyzeGameOutputSchema = z.object({
  pgn: z.string().describe("The PGN that was analyzed, returned for consistency."),
  summary: z.string().describe("A brief, high-level summary of the game's outcome and key turning points."),
  analysis: z.array(AnalyzedMoveSchema).describe("A detailed, move-by-move analysis of the game."),
  accuracies: z.object({
      white: z.number().describe("The accuracy percentage for White, from 0 to 100."),
      black: z.number().describe("The accuracy percentage for Black, from 0 to 100."),
  }),
  moveCounts: z.object({
      white: MoveCountsSchema,
      black: MoveCountsSchema,
  }).describe("A count of each move classification for both White and Black."),
  opening: z.string().describe("The name of the opening played, e.g., 'Sicilian Defense' or 'Queen's Gambit Declined'.")
});
export type AnalyzeGameOutput = z.infer<typeof AnalyzeGameOutputSchema>;

export async function analyzeGame(input: AnalyzeGameInput): Promise<AnalyzeGameOutput> {
  return analyzeGameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeGamePrompt',
  input: {schema: AnalyzeGameInputSchema},
  output: {schema: AnalyzeGameOutputSchema},
  prompt: `You are a world-class chess grandmaster and coach, providing a comprehensive game report similar to a top-tier engine like Stockfish. You will be given a chess game in PGN format. Your task is to analyze it deeply.

PGN: {{{pgn}}}
Skill Level: {{{skillLevel}}} (Tailor the depth of your explanations to this level).

Your output must be a JSON object that includes:
0.  **pgn**: The exact PGN string you analyzed.
1.  **summary**: A brief, high-level summary of the game's outcome and key turning points.
2.  **analysis**: A detailed, move-by-move analysis. For each move in the PGN, provide its number, the player, the move in SAN, your classification, a concise explanation (1-2 sentences), and the centipawn evaluation of the position *after* the move. The evaluation should be from White's perspective (positive values favor White, negative values favor Black).
    Classify each move according to these categories with the following strict definitions:
    - **Book**: A standard, theoretical opening move.
    - **Brilliant (!!)**: A very rare, difficult-to-find move that is not only the best but also involves a significant sacrifice or a deep, non-obvious strategic plan that secures a winning advantage. The evaluation must show that the position improves despite the material loss.
    - **Great (!)**: A difficult-to-find move that creates a significant advantage. This might not involve a sacrifice but is a key move that other strong moves do not match.
    - **Excellent**: A strong move that maintains a significant advantage or is the best move in a complex position, but not particularly hard to find.
    - **Good**: A solid, developing move that is decent but not the best.
    - **Inaccuracy (?)**: A move that is not the best and leads to a slight but noticeable worsening of the position (e.g., a 50-90 centipawn loss from a better alternative).
    - **Mistake (??)**: A bad move that significantly worsens the position, such as losing material or a major positional advantage (e.g., a 90-200 centipawn loss).
    - **Blunder (???)**: A very bad move that throws away a winning position or leads to a losing one, such as losing a major piece or getting checkmated (e.g., a >200 centipawn loss).
3.  **accuracies**: An object with 'white' and 'black' keys, containing accuracy percentages (0-100) for each player. Base this on how often they played the best or a very good move.
4.  **moveCounts**: An object with 'white' and 'black' keys. For each player, provide a count of how many moves fell into each classification (brilliant, great, excellent, good, book, inaccuracy, mistake, blunder).
5.  **opening**: A string with the name of the opening played.
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
