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
import { BrainCircuit, Loader2 } from 'lucide-react';
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

type AnalysisSidebarProps = Pick<ReturnType<typeof useChessGame>, 'pgn' | 'skillLevel' | 'history' | 'isAITurn'>;

export function AnalysisSidebar({ pgn, skillLevel, history, isAITurn }: AnalysisSidebarProps) {
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
  
  return (
    <aside className="w-80 flex-shrink-0 flex flex-col gap-4 p-4 bg-sidebar text-sidebar-foreground border-l border-sidebar-border">
      <Card className="bg-sidebar-accent border-sidebar-border">
        <CardHeader>
          <CardTitle>Game Analysis</CardTitle>
        </CardHeader>
        <CardContent>
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
      
      <Card className="flex-1 flex flex-col bg-sidebar-accent border-sidebar-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Move History
            {isAITurn && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="grid grid-cols-[auto_1fr_1fr] gap-x-4 gap-y-1 text-sm pr-4">
              {history.length === 0 ? (
                <p className="col-span-3 text-muted-foreground">No moves yet.</p>
              ) : (
                history.map((move, index) =>
                  index % 2 === 0 ? (
                    <React.Fragment key={move.san}>
                      <div className="font-bold text-right">{index / 2 + 1}.</div>
                      <div>{move.san}</div>
                    </React.Fragment>
                  ) : (
                    <div key={move.san}>{move.san}</div>
                  )
                )
              )}
            </div>
          </ScrollArea>
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
