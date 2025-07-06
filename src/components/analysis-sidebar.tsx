
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { analyzeGame } from '@/ai/flows/analyze-game';
import type { useChessGame } from '@/hooks/use-chess-game';
import { BrainCircuit, Loader2, Users } from 'lucide-react';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';

type AnalysisSidebarProps = Pick<ReturnType<typeof useChessGame>, 'pgn' | 'skillLevel' | 'history' | 'isAITurn'> & {
  className?: string;
};

const PlayerCard = ({ name, avatarSrc, isOpponent = false }: { name: string, avatarSrc: string, isOpponent?: boolean }) => (
  <Card className="bg-sidebar-accent border-sidebar-border">
    <CardContent className="p-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarSrc} data-ai-hint={isOpponent ? "avatar robot" : "avatar abstract"} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-semibold">{name}</span>
        </div>
        <div className="bg-background/20 text-foreground font-mono text-lg rounded-md px-4 py-1">
          10:00
        </div>
      </div>
    </CardContent>
  </Card>
);

export function AnalysisSidebar({ pgn, skillLevel, history, isAITurn, className }: AnalysisSidebarProps) {
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyzeGame = async () => {
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const result = await analyzeGame({ pgn, skillLevel: 'intermediate' });
      setAnalysis(
        `${result.summary}\n\n**Alternative Moves:**\n${result.alternativeMoves.join('\n')}`
      );
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Could not analyze the game at this time.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const movePairs: [any, any | undefined][] = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push([history[i], history[i + 1]]);
  }
  
  return (
    <aside className={cn("w-72 flex-shrink-0 flex flex-col gap-4 p-4 bg-sidebar text-sidebar-foreground border-l border-sidebar-border", className)}>
      <PlayerCard name="AI Opponent" avatarSrc="https://placehold.co/40x40.png" isOpponent={true} />
      
      <Card className="flex-1 flex flex-col bg-sidebar-accent border-sidebar-border overflow-hidden">
        <CardHeader className='pb-2'>
          <CardTitle className="flex items-center justify-between text-base">
            Move History
            {isAITurn && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full">
            <table className="move-history-table">
              <tbody>
                {movePairs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-muted-foreground p-4">No moves yet.</td>
                  </tr>
                ) : (
                  movePairs.map((pair, index) => (
                    <tr key={index}>
                      <td className="move-number">{index + 1}.</td>
                      <td className="move-san">{pair[0]?.san}</td>
                      <td className="move-san">{pair[1]?.san}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
      
      <PlayerCard name="PlayerOne" avatarSrc="https://placehold.co/40x40.png" />

      <Card className="bg-sidebar-accent border-sidebar-border">
        <CardContent className='p-3'>
          <Button onClick={handleAnalyzeGame} disabled={isAnalyzing || !pgn} className="w-full">
            {isAnalyzing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BrainCircuit className="mr-2 h-4 w-4" />
            )}
            Analyze Game
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={!!analysis} onOpenChange={(open) => !open && setAnalysis(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Game Analysis</AlertDialogTitle>
            <AlertDialogDescription>
              <ScrollArea className="max-h-[60vh] pr-4">
                 <pre className="whitespace-pre-wrap font-sans text-sm">{analysis}</pre>
              </ScrollArea>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAnalysis(null)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  )
}
