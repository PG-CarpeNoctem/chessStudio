// This is an auto-generated file from Firebase Studio.

'use server';

/**
 * @fileOverview Flow to adjust the difficulty of the AI opponent in a chess game.
 *
 * - adjustDifficulty - A function that adjusts the AI difficulty.
 * - AdjustDifficultyInput - The input type for the adjustDifficulty function.
 * - AdjustDifficultyOutput - The return type for the adjustDifficulty function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdjustDifficultyInputSchema = z.object({
  difficultyLevel: z
    .enum(['Beginner', 'Intermediate', 'Advanced'])
    .describe('The desired difficulty level for the AI opponent.'),
});

export type AdjustDifficultyInput = z.infer<typeof AdjustDifficultyInputSchema>;

const AdjustDifficultyOutputSchema = z.object({
  stockfishLevel: z
    .number()
    .describe('The Stockfish level corresponding to the chosen difficulty.'),
  description: z
    .string()
    .describe('A description of the AI opponent at this difficulty level.'),
});

export type AdjustDifficultyOutput = z.infer<typeof AdjustDifficultyOutputSchema>;

export async function adjustDifficulty(input: AdjustDifficultyInput): Promise<AdjustDifficultyOutput> {
  return adjustDifficultyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adjustDifficultyPrompt',
  input: {schema: AdjustDifficultyInputSchema},
  output: {schema: AdjustDifficultyOutputSchema},
  prompt: `You are an expert chess coach helping players improve their skills.

You will adjust the difficulty of the AI opponent based on the player's chosen difficulty level.

Difficulty Level: {{{difficultyLevel}}}

Based on the difficulty level, determine the appropriate Stockfish level (a number between 0 and 20, where 0 is the easiest and 20 is the hardest).
Also, provide a short description of the AI opponent at this difficulty level.

Output should be a JSON object with 'stockfishLevel' and 'description' fields.  The description should not be longer than 50 words.
`, config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const adjustDifficultyFlow = ai.defineFlow(
  {
    name: 'adjustDifficultyFlow',
    inputSchema: AdjustDifficultyInputSchema,
    outputSchema: AdjustDifficultyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
