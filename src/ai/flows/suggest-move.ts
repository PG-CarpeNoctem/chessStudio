
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

You will be given the current state of the board in Forsyth–Edwards Notation (FEN). You will also be given the skill level of the AI opponent.

Based on the board state, suggest the best move for the AI opponent. Prioritize moves that lead to checkmate or a significant material advantage. Your primary goal is to win the game. You must respond very quickly, ideally in under 3 seconds.

Skill level: {{{skillLevel}}}

Board state (FEN): {{{boardStateFen}}}

Provide the move in UCI format (e.g., e2e4, g1f3) and a brief explanation of why this move is good.
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
