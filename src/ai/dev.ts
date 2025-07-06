import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-move.ts';
import '@/ai/flows/analyze-game.ts';
import '@/ai/flows/adjust-difficulty.ts';
