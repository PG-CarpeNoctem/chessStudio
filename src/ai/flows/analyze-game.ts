
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
  classification: z.enum(['Brilliant', 'Great', 'Best', 'Excellent', 'Good', 'Book', 'Inaccuracy', 'Mistake', 'Blunder', 'Forced', 'Okay', 'Theory', 'Missed Win']).describe("The classification of the move."),
  explanation: z.string().describe("An explanation for why the move was classified this way."),
  evaluation: z.number().describe("The centipawn evaluation of the position after the move. Positive is good for White, negative for Black."),
  bestAlternative: z.string().optional().describe("The best alternative move in SAN if the played move was not the best, if one exists."),
});

const MoveCountsSchema = z.object({
  brilliant: z.number().default(0),
  great: z.number().default(0),
  best: z.number().default(0),
  excellent: z.number().default(0),
  good: z.number().default(0),
  book: z.number().default(0),
  inaccuracy: z.number().default(0),
  mistake: z.number().default(0),
  blunder: z.number().default(0),
  forced: z.number().default(0),
  okay: z.number().default(0),
  theory: z.number().default(0),
  missedWin: z.number().default(0),
});

const KeyMomentSchema = z.object({
    moveNumber: z.number().describe("The move number of this key moment."),
    san: z.string().describe("The move in Standard Algebraic Notation."),
    player: z.enum(['White', 'Black']).describe('The player who made the move.'),
    description: z.string().describe("A brief explanation of why this moment was critical or a turning point in the game."),
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
  opening: z.string().describe("The name of the opening played, e.g., 'Sicilian Defense' or 'Queen's Gambit Declined'."),
  keyMoments: z.array(KeyMomentSchema).describe("A list of 2-4 key turning points or critical moments in the game."),
  estimatedElos: z.object({
      white: z.number().describe("The estimated ELO rating for White based on their play in this game."),
      black: z.number().describe("The estimated ELO rating for Black based on their play in this game."),
  }).describe("An estimated ELO rating for each player based on their performance in this game."),
});
export type AnalyzeGameOutput = z.infer<typeof AnalyzeGameOutputSchema>;

export async function analyzeGame(input: AnalyzeGameInput): Promise<AnalyzeGameOutput> {
  return analyzeGameFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeGamePrompt',
  input: {schema: AnalyzeGameInputSchema},
  output: {schema: AnalyzeGameOutputSchema},
  prompt: `You are a world-class chess analysis engine, similar to Stockfish 16 combined with insightful coaching commentary. Your task is to provide a comprehensive, professional-grade analysis of a chess game provided in PGN format.

PGN: {{{pgn}}}
Player Skill Level: {{{skillLevel}}} (Tailor the depth and language of your explanations to this level).

Your output MUST be a JSON object conforming to the provided schema. Pay close attention to the following instructions for each field:

0.  **pgn**: Return the exact PGN string you analyzed.
1.  **summary**: A brief, high-level summary of the game's flow, key themes, and final outcome.
2.  **analysis**: A detailed, move-by-move analysis. For each move in the PGN, provide:
    - **classification**: Classify each move according to these strict, engine-based definitions:
      - **Brilliant (!!)**: A very rare, difficult-to-find move that is not only the best but also involves a significant sacrifice or a deep, non-obvious strategic idea that secures a winning advantage.
      - **Great (!)**: A difficult-to-find move that creates a significant advantage. It is the best move but not as sacrificial or surprising as a brilliant one. Often the start of a winning combination.
      - **Best (⭐)**: The top engine choice in the position. It is the optimal move but not exceptionally difficult to find.
      - **Excellent**: A strong move that maintains a significant advantage or is among the top engine choices, but not strictly the best.
      - **Good**: A solid, standard move that is decent but not the most precise.
      - **Okay**: A reasonable move that doesn't harm the position but is passive or suboptimal.
      - **Book / Theory**: A standard, well-known opening move.
      - **Inaccuracy (?)**: A move that leads to a slight but noticeable worsening of the position (e.g., a 50-90 centipawn loss from a better alternative).
      - **Mistake (??)**: A bad move that significantly worsens the position, like losing material or a major positional advantage (e.g., a 90-200 centipawn loss).
      - **Blunder (???)**: A very bad move that throws away a winning position or leads to a losing one (e.g., a >200 centipawn loss).
      - **Missed Win**: A type of blunder made in a clearly winning position that results in a drawn or losing position.
      - **Forced**: A move that is the only legal or reasonable option in the position (e.g., recapturing or moving out of check).
    - **explanation**: A concise (1-2 sentences) explanation for the classification. For non-optimal moves, explain *why* it's weak and what the better plan was.
    - **evaluation**: The centipawn evaluation of the position *after* the move, from White's perspective (positive for White, negative for Black).
    - **bestAlternative**: For any move that is NOT classified as Best, Great, or Brilliant, provide the SAN of the single best move in that position. For Best/Great/Brilliant moves, this field should be omitted.
3.  **accuracies**: An object with 'white' and 'black' keys, containing accuracy percentages (0-100) for each player. Base this on how often they played the best or a very good move, considering the complexity of the position. A player who consistently finds the top engine move will have a higher accuracy.
4.  **moveCounts**: An object with 'white' and 'black' keys. For each player, provide a count of how many moves fell into each classification.
5.  **opening**: A string with the specific name of the opening played (e.g., 'Sicilian Defense: Najdorf Variation').
6.  **keyMoments**: An array of 2-4 objects, each representing a critical turning point. Each object should include the move number, SAN, player, and a brief description of why it was a pivotal moment (e.g., "This is where Black missed a chance to win material").
7.  **estimatedElos**: Based on the accuracy of the moves, the complexity of the positions, and the types of mistakes made, provide an estimated ELO rating for both White and Black for this single game's performance.
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
