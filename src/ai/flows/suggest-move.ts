
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
    .describe('The skill level of the AI opponent (1-10, 1 being easiest).')
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
  prompt: `You are a professional chess player acting as a chess engine.

You will be given the current state of the board in Forsyth–Edwards Notation (FEN), a list of all legal moves, and the desired skill level for the AI opponent.

Your task is to choose the best move from the provided list of legal moves. Your choice should be based on the board state and the AI's skill level. A higher skill level means you should play more optimally. Prioritize moves that lead to checkmate or a significant material advantage. Your primary goal is to win the game. You must respond very quickly, ideally in under 3 seconds.

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
