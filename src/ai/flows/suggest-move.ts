
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting chess moves.
 *
 * - suggestMove - A function that suggests a move for the AI opponent.
 * - SuggestMoveInput - The input type for the suggestMove function.
 * - SuggestMoveOutput - The return type for the suggestMove function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMoveInputSchema = z.object({
  boardStateFen: z
    .string()
    .describe('The current state of the chessboard in Forsyth–Edwards Notation (FEN).'),
  legalMoves: z.array(z.string()).describe('A list of all legal moves in UCI format for the current player.'),
  skillLevel: z
    .number()
    .describe('The skill level of the AI opponent (1-20, 1 being easiest).')
    .optional(),
});
export type SuggestMoveInput = z.infer<typeof SuggestMoveInputSchema>;

const SuggestMoveOutputSchema = z.object({
  suggestedMove: z.string().describe('The suggested move for the AI opponent in UCI format.'),
  explanation: z.string().describe('The explanation of the suggested move.'),
});
export type SuggestMoveOutput = z.infer<typeof SuggestMoveOutputSchema>;

export async function suggestMove(input: SuggestMoveInput): Promise<SuggestMoveOutput> {
  return suggestMoveFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMovePrompt',
  input: {schema: SuggestMoveInputSchema},
  output: {schema: SuggestMoveOutputSchema},
  prompt: `You are a professional chess player acting as a chess engine. You will be given the current state of the board in Forsyth–Edwards Notation (FEN), a list of all legal moves, and the desired skill level for the AI opponent (from 1 to 20).

Your task is to choose the best move from the provided list of legal moves. Your choice must be based on the board state and the AI's skill level. You must respond very quickly, ideally in under 3 seconds.

**Skill Level Interpretation:**

*   **Skill 1-4 (Beginner):** Play like a beginner. You should not look ahead more than 1-2 moves. You are likely to make frequent mistakes and blunders. You might occasionally choose a random legal move that is not obviously bad.
*   **Skill 5-9 (Novice):** Play like a novice or casual player. You can avoid immediate one-move blunders but may miss two or three-move tactical sequences. Your strategic understanding is limited. Look ahead about 3-5 moves.
*   **Skill 10-14 (Intermediate):** Play like a solid club player. You should have good tactical awareness and a basic understanding of positional concepts. You will try to find the best move but may settle for a "good enough" one. Look ahead 5-10 moves. You might make occasional inaccuracies.
*   **Skill 15-18 (Advanced):** Play like an expert. You have a deep strategic and tactical understanding. You should aim for the optimal move in most positions, calculating several lines deeply. Look ahead 10-15 moves.
*   **Skill 19-20 (Master):** Play as close to perfectly as possible. Your move choice should be equivalent to a top-tier chess engine. Find the absolute best move, considering deep tactical and strategic nuances.

**Your Goal:** Your primary goal is to win the game, playing according to the specified skill level.

Skill level: {{{skillLevel}}}
Board state (FEN): {{{boardStateFen}}}

List of legal moves:
{{#each legalMoves}}
- {{{this}}}
{{/each}}

From the list above, you MUST select ONE move.
Provide the chosen move in UCI format (e.g., e2e4, g1f3) in the 'suggestedMove' field and a brief explanation of why this move is good in the 'explanation' field.
`,
});

const suggestMoveFlow = ai.defineFlow(
  {
    name: 'suggestMoveFlow',
    inputSchema: SuggestMoveInputSchema,
    outputSchema: SuggestMoveOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
