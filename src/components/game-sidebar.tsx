'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { AuthButton } from './auth-button';
import { analyzeGame } from '@/ai/flows/analyze-game';
import { adjustDifficulty } from '@/ai/flows/adjust-difficulty';
import type { useChessGame } from '@/hooks/use-chess-game';
import { BrainCircuit, Loader2, Play, Settings } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Switch } from './ui/switch';

type GameSidebarProps = ReturnType<typeof useChessGame>;

export function GameSidebar({
  history,
  resetGame,
  pgn,
  skillLevel,
  setSkillLevel,
  isAITurn,
  boardTheme,
  setBoardTheme,
  showPossibleMoves,
  setShowPossibleMoves,
  showLastMoveHighlight,
  setShowLastMoveHighlight,
}: GameSidebarProps) {
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

  const handleAdjustDifficulty = async (level: 'Beginner' | 'Intermediate' | 'Advanced') => {
    try {
        const result = await adjustDifficulty({ difficultyLevel: level });
        setSkillLevel(result.stockfishLevel);
        toast({
            title: `Difficulty set to ${level}`,
            description: `AI Skill Level: ${result.stockfishLevel}. ${result.description}`,
        })
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to adjust AI difficulty.',
        })
    }
  };


  return (
    <div className="flex h-full flex-col gap-4 p-4 text-sidebar-foreground bg-sidebar">
      <Card className="bg-sidebar-accent border-sidebar-border">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">
            PGChess
          </CardTitle>
          <CardDescription>
            The intelligent chess experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthButton />
        </CardContent>
      </Card>

      <Card className="bg-sidebar-accent border-sidebar-border">
        <CardHeader>
          <CardTitle>Game Controls</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button onClick={resetGame}>
            <Play className="mr-2 h-4 w-4" />
            New Game
          </Button>
          <Separator />
          <Button onClick={handleAnalyzeGame} disabled={isAnalyzing || !pgn}>
            {isAnalyzing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BrainCircuit className="mr-2 h-4 w-4" />
            )}
            Analyze Game
          </Button>
        </CardContent>
      </Card>
      
      <Card className="bg-sidebar-accent border-sidebar-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings /> Settings</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="difficulty">AI Difficulty</Label>
            <Select onValueChange={(value: 'Beginner' | 'Intermediate' | 'Advanced') => handleAdjustDifficulty(value)} defaultValue="Beginner">
              <SelectTrigger id="difficulty">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Current AI Skill: {skillLevel}</p>
          </div>
           <div className="space-y-2">
              <Label htmlFor="theme">Board Theme</Label>
              <Select onValueChange={(value) => setBoardTheme(value as any)} defaultValue={boardTheme}>
                  <SelectTrigger id="theme">
                      <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="classic">Classic</SelectItem>
                      <SelectItem value="cyan">Cyan</SelectItem>
                      <SelectItem value="ocean">Ocean</SelectItem>
                      <SelectItem value="forest">Forest</SelectItem>
                      <SelectItem value="charcoal">Charcoal</SelectItem>
                  </SelectContent>
              </Select>
          </div>
          <div className="flex items-center justify-between pt-2">
              <Label htmlFor="possible-moves" className="text-sm">Show Possible Moves</Label>
              <Switch id="possible-moves" checked={showPossibleMoves} onCheckedChange={setShowPossibleMoves} />
          </div>
          <div className="flex items-center justify-between">
              <Label htmlFor="last-move" className="text-sm">Highlight Last Move</Label>
              <Switch id="last-move" checked={showLastMoveHighlight} onCheckedChange={setShowLastMoveHighlight} />
          </div>
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
    </div>
  );
}

// Dummy React import to satisfy some tooling
import React from 'react';
