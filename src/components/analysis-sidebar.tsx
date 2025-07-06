
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import type { useChessGame } from '@/hooks/use-chess-game';
import { BrainCircuit, Loader2, Gem, ThumbsUp, CheckCircle2, Check, BookOpen, AlertCircle, AlertTriangle, HelpCircle, Lightbulb, ClipboardCopy } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { ChessPieceDisplay } from './chess-piece';
import type { ChessPiece } from '@/lib/types';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from 'recharts';


type AnalysisSidebarProps = Pick<ReturnType<typeof useChessGame>, 
    'pgn' | 'skillLevel' | 'history' | 'isAITurn' | 'getHint' | 'gameOver' | 
    'capturedPieces' | 'materialAdvantage' | 'time' | 'turn' | 'analysis' | 
    'isAnalyzing' | 'analyzeCurrentGame' | 'clearAnalysis'
> & {
  className?: string;
};

const formatTime = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const PlayerCard = ({ name, avatarSrc, isOpponent = false, capturedPieces = [], materialAdvantage = 0, time }: { name: string, avatarSrc: string, isOpponent?: boolean, capturedPieces?: ChessPiece[], materialAdvantage?: number, time: number }) => (
  <Card className="bg-sidebar-accent border-sidebar-border">
    <CardContent className="p-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarSrc} data-ai-hint={isOpponent ? "avatar robot" : "avatar abstract"} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold">{name}</span>
            {(capturedPieces.length > 0 || materialAdvantage > 0) &&
              <div className="flex items-center gap-0.5 h-5 mt-0.5">
                {capturedPieces.map((p, i) => (
                  <div key={i} className="w-4 h-4 text-white">
                    <ChessPieceDisplay piece={p} pieceSet="classic" />
                  </div>
                ))}
                {materialAdvantage > 0 &&
                  <span className="text-xs font-bold text-lime-400/90 ml-1">
                    +{materialAdvantage}
                  </span>
                }
              </div>
            }
          </div>
        </div>
        <div className="bg-background/20 text-foreground font-mono text-lg rounded-md px-4 py-1">
          {formatTime(time)}
        </div>
      </div>
    </CardContent>
  </Card>
);

const classificationStyles: Record<string, { icon: React.ElementType, className: string }> = {
  Brilliant: { icon: Gem, className: 'text-cyan-400' },
  Great: { icon: ThumbsUp, className: 'text-sky-500' },
  Excellent: { icon: CheckCircle2, className: 'text-green-500' },
  Good: { icon: Check, className: 'text-lime-400' },
  Book: { icon: BookOpen, className: 'text-gray-400' },
  Inaccuracy: { icon: HelpCircle, className: 'text-yellow-500' },
  Mistake: { icon: AlertCircle, className: 'text-orange-500' },
  Blunder: { icon: AlertTriangle, className: 'text-red-600' },
};

const chartConfig = {
  evaluation: {
    label: "Evaluation",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;


export function AnalysisSidebar({ 
    pgn, history, isAITurn, getHint, gameOver, capturedPieces, 
    materialAdvantage, time, turn, analysis, isAnalyzing, analyzeCurrentGame, 
    clearAnalysis, className 
}: AnalysisSidebarProps) {
  const [username, setUsername] = useState('Player');

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
    
    const handleUsernameChange = () => {
      const newUsername = localStorage.getItem('username');
      if (newUsername) {
        setUsername(newUsername);
      }
    };
    window.addEventListener('usernameChanged', handleUsernameChange);

    return () => {
      window.removeEventListener('usernameChanged', handleUsernameChange);
    };
  }, []);

  const handleCopyPgn = () => {
    if (pgn) {
        navigator.clipboard.writeText(pgn);
    }
  };

  const movePairs: [any, any | undefined][] = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push([history[i], history[i + 1]]);
  }

  // PlayerOne is white, AI Opponent is black.
  const playerCapturedPieces = capturedPieces.w; // White player captures black pieces.
  const opponentCapturedPieces = capturedPieces.b; // Black player captures white pieces.
  
  const playerAdvantage = materialAdvantage > 0 ? materialAdvantage : 0;
  const opponentAdvantage = materialAdvantage < 0 ? Math.abs(materialAdvantage) : 0;
  
  return (
    <aside className={cn("w-[260px] flex-shrink-0 flex flex-col gap-4 p-4 bg-sidebar text-sidebar-foreground border-l border-sidebar-border", className)}>
      <PlayerCard 
        name="AI Opponent" 
        avatarSrc="https://placehold.co/40x40.png" 
        isOpponent={true} 
        capturedPieces={opponentCapturedPieces}
        materialAdvantage={opponentAdvantage}
        time={time.b}
      />
      
      <Card className="flex-1 flex flex-col bg-sidebar-accent border-sidebar-border overflow-hidden">
        <CardHeader className='pb-2'>
            <CardTitle className="flex items-center justify-between text-base">
                Move History
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopyPgn} title="Copy PGN">
                        <ClipboardCopy className="h-4 w-4" />
                    </Button>
                    {isAITurn && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </div>
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
      
      <PlayerCard 
        name={username} 
        avatarSrc="https://placehold.co/40x40.png"
        capturedPieces={playerCapturedPieces}
        materialAdvantage={playerAdvantage}
        time={time.w}
      />
      
      <Card className="bg-sidebar-accent border-sidebar-border">
        <CardHeader className='pb-3 pt-4'>
            <CardTitle className="flex items-center gap-2 text-base"><Lightbulb /> Coaching</CardTitle>
        </CardHeader>
        <CardContent className='p-3 pt-0'>
            <Button 
            onClick={getHint} 
            disabled={isAITurn || !!gameOver} 
            className="w-full"
            variant="outline"
            >
            <Lightbulb className="mr-2 h-4 w-4" />
            Get a Hint
            </Button>
        </CardContent>
      </Card>


      <Card className="bg-sidebar-accent border-sidebar-border">
        <CardContent className='p-3'>
          <Button onClick={analyzeCurrentGame} disabled={isAnalyzing || !gameOver} className="w-full">
            {isAnalyzing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BrainCircuit className="mr-2 h-4 w-4" />
            )}
            Analyze Game
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={!!analysis} onOpenChange={(open) => !open && clearAnalysis()}>
        <AlertDialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><BrainCircuit /> Game Analysis</AlertDialogTitle>
            <AlertDialogDescription>
              {analysis?.summary}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {analysis && analysis.analysis.length > 0 && (
            <div className="h-48 w-full -mx-6 pr-8 text-xs">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <LineChart
                  accessibilityLayer
                  data={analysis.analysis.map((d, i) => ({ ...d, fullMoveNumber: Math.floor(i / 2) + 1 }))}
                  margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="fullMoveNumber"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                      tickFormatter={(value) => `${(Number(value) / 100).toFixed(1)}`}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      width={35}
                  />
                  <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <ChartTooltip
                      cursor={true}
                      content={<ChartTooltipContent
                          formatter={(value) => `Eval: ${(Number(value) / 100).toFixed(2)}`}
                          labelFormatter={(_, payload) => {
                              const move = payload?.[0]?.payload;
                              if (move) {
                                  return `${move.moveNumber}${move.player === 'White' ? '.' : '...'} ${move.san}`;
                              }
                              return '';
                          }}
                          indicator="line"
                      />}
                  />
                  <Line
                    dataKey="evaluation"
                    type="monotone"
                    stroke="var(--color-evaluation)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          )}

          <Separator />
          <ScrollArea className="flex-1 -mx-6">
             <div className="flex flex-col gap-1 px-6">
                {analysis?.analysis.map((move, index) => {
                  const style = classificationStyles[move.classification] || { icon: HelpCircle, className: 'text-gray-400' };
                  const Icon = style.icon;
                  return (
                    <div key={index} className="grid grid-cols-[auto_1fr] items-start gap-x-4 gap-y-1 p-2.5 rounded-md hover:bg-accent/50">
                      <div className="flex items-center gap-3 col-start-1 row-span-2 place-self-center">
                         <span className="font-mono text-sm text-muted-foreground w-8 text-right">{move.moveNumber}{move.player === 'White' ? '.' : '...'}</span>
                         <span className="font-bold text-lg text-foreground w-20">{move.san}</span>
                      </div>
                      <div className="flex items-center gap-2 col-start-2">
                        <Icon className={cn("h-5 w-5", style.className)} />
                        <span className={cn("font-semibold", style.className)}>{move.classification}</span>
                      </div>
                      <div className="col-start-2 text-sm text-muted-foreground pl-1">
                        {move.explanation}
                      </div>
                    </div>
                  );
                })}
             </div>
          </ScrollArea>
          <Separator />
          <AlertDialogFooter className='pt-4'>
            <AlertDialogAction onClick={clearAnalysis}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  )
}
