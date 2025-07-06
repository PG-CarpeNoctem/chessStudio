
'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Chess } from 'chess.js';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { analyzeGame, AnalyzeGameOutput } from '@/ai/flows/analyze-game';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BrainCircuit, Gem, ThumbsUp, CheckCircle2, Check, BookOpen, AlertCircle, AlertTriangle, HelpCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { ChessBoard } from '@/components/chess-board';
import type { ChessSquare, ChessPiece, ChessMove } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from 'recharts';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

const classificationStyles: Record<string, { icon: React.ElementType, className: string, label: string }> = {
  Brilliant: { icon: Gem, className: 'text-cyan-400', label: 'Brilliant' },
  Great: { icon: ThumbsUp, className: 'text-sky-500', label: 'Great' },
  Excellent: { icon: CheckCircle2, className: 'text-green-500', label: 'Excellent' },
  Good: { icon: Check, className: 'text-lime-400', label: 'Good' },
  Book: { icon: BookOpen, className: 'text-gray-400', label: 'Book' },
  Inaccuracy: { icon: HelpCircle, className: 'text-yellow-500', label: 'Inaccuracy' },
  Mistake: { icon: AlertCircle, className: 'text-orange-500', label: 'Mistake' },
  Blunder: { icon: AlertTriangle, className: 'text-red-600', label: 'Blunder' },
};

const chartConfig = {
  evaluation: {
    label: "Evaluation",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

function AnalysisPageComponent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [pgn, setPgn] = useState('');
  const [analysis, setAnalysis] = useState<AnalyzeGameOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState<any[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);

  const updateBoardAtMove = useCallback((index: number) => {
    const newGame = new Chess();
    if (analysis) {
        newGame.load(analysis.pgn);
        const history = newGame.history({ verbose: true });
        
        const gameAtMove = new Chess();
        for (let i = 0; i <= index; i++) {
          if (history[i]) {
            gameAtMove.move(history[i].san);
          }
        }
        
        setGame(gameAtMove);
        setBoard(gameAtMove.board().flat().filter(p => p !== null));
    }
    setCurrentMoveIndex(index);

  }, [analysis]);

  useEffect(() => {
    const pgnFromUrl = searchParams.get('pgn');
    if (pgnFromUrl) {
      const decodedPgn = decodeURIComponent(pgnFromUrl);
      setPgn(decodedPgn);
      handleAnalyze(decodedPgn);
    }
  }, [searchParams]);

  const handleAnalyze = async (pgnToAnalyze: string) => {
    if (!pgnToAnalyze.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'PGN input cannot be empty.' });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const chess = new Chess();
      // Use chess.load() which is more robust than loadPgn() and can handle PGNs with slight format variations.
      // It also attempts to load FENs, so we must check for a valid game history.
      chess.load(pgnToAnalyze, { sloppy: true });
      
      if (chess.history().length === 0) {
        // If no moves were loaded, the input was either an invalid PGN or just a FEN string.
        // The analysis flow requires a full game with moves to provide a meaningful report.
        throw new Error("Invalid PGN or a FEN string was provided. Full game analysis requires a PGN with moves.");
      }
      
      // Pass the standardized PGN from chess.js to the analysis flow
      const result = await analyzeGame({ pgn: chess.pgn(), skillLevel: 'intermediate' });
      setAnalysis(result);
      updateBoardAtMove(result.analysis.length - 1); // Go to last move
    } catch (e: any) {
      setError(e.message || 'Failed to analyze game.');
      toast({ variant: 'destructive', title: 'Analysis Failed', description: e.message || 'An unknown error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };

  const currentMoveData = analysis?.analysis[currentMoveIndex];
  
  const lastMoveForBoard = useMemo(() => {
      if (!analysis || currentMoveIndex < 0 || !analysis.analysis[currentMoveIndex]) return null;
      
      const gameForMove = new Chess();
      gameForMove.load(analysis.pgn);
      const history = gameForMove.history({ verbose: true });
      
      return history[currentMoveIndex] || null;

  }, [analysis, currentMoveIndex]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-xl font-semibold">Analyzing your game...</h2>
        <p className="text-muted-foreground">This may take a moment. The AI is reviewing every move.</p>
      </div>
    );
  }

  if (analysis) {
    const totalMoves = analysis.analysis.length;
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Left side: Board and controls */}
        <div className="flex flex-col gap-4 items-center">
            <div className="w-full max-w-lg aspect-square">
                <ChessBoard 
                    board={board}
                    onSquareClick={() => {}}
                    onSquareRightClick={() => {}}
                    selectedSquare={null}
                    possibleMoves={[]}
                    lastMove={lastMoveForBoard ? { from: lastMoveForBoard.from, to: lastMoveForBoard.to, san: lastMoveForBoard.san } : null}
                    boardTheme="cyan"
                    showPossibleMoves={false}
                    showLastMoveHighlight={true}
                    boardOrientation="w"
                    pieceSet="classic"
                    customBoardColors={{ light: '', dark: ''}}
                    customPieceColors={{ whiteFill: '', whiteStroke: '', blackFill: '', blackStroke: ''}}
                    handlePieceDrop={() => {}}
                />
            </div>
            <Card className="w-full max-w-lg">
                <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <Button onClick={() => updateBoardAtMove(-1)} size="icon" variant="ghost" disabled={currentMoveIndex < 0}><ChevronsLeft /></Button>
                        <Button onClick={() => updateBoardAtMove(currentMoveIndex - 1)} size="icon" variant="ghost" disabled={currentMoveIndex < 0}><ChevronLeft /></Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Move {currentMoveIndex + 1} / {totalMoves}
                    </div>
                    <div className="flex items-center gap-1">
                        <Button onClick={() => updateBoardAtMove(currentMoveIndex + 1)} size="icon" variant="ghost" disabled={currentMoveIndex >= totalMoves - 1}><ChevronRight /></Button>
                        <Button onClick={() => updateBoardAtMove(totalMoves - 1)} size="icon" variant="ghost" disabled={currentMoveIndex >= totalMoves - 1}><ChevronsRight /></Button>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Right side: Analysis Report */}
        <div className="flex flex-col gap-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Accuracies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                     <div className="flex justify-between items-center text-sm font-medium">
                        <span>White</span>
                        <span>{analysis.accuracies.white.toFixed(1)}%</span>
                     </div>
                     <Progress value={analysis.accuracies.white} />
                     <div className="flex justify-between items-center text-sm font-medium">
                        <span>Black</span>
                        <span>{analysis.accuracies.black.toFixed(1)}%</span>
                     </div>
                     <Progress value={analysis.accuracies.black} />
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle className="text-lg">Evaluation</CardTitle>
                    <p className="text-sm text-muted-foreground pt-1">{analysis.opening}</p>
                </CardHeader>
                <CardContent className="h-40 w-full pr-8 text-xs">
                     <ChartContainer config={chartConfig} className="h-full w-full">
                        <LineChart data={analysis.analysis.map((d, i) => ({ ...d, fullMoveNumber: Math.floor(i / 2) + 1 }))} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis dataKey="fullMoveNumber" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
                            <YAxis tickFormatter={(value) => `${(Number(value) / 100).toFixed(1)}`} domain={[-1000, 1000]} allowDataOverflow tickLine={false} axisLine={false} tickMargin={8} width={55} />
                            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                            <ChartTooltip cursor={true} content={<ChartTooltipContent formatter={(value) => `Eval: ${(Number(value) / 100).toFixed(2)}`} labelFormatter={(_, payload) => {
                                const move = payload?.[0]?.payload;
                                if (move) return `${move.moveNumber}${move.player === 'White' ? '.' : '...'} ${move.san}`;
                                return '';
                            }} indicator="line" />} />
                            <Line dataKey="evaluation" type="monotone" stroke="var(--color-evaluation)" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card className="flex-1 flex flex-col">
                <CardHeader>
                    <CardTitle className="text-lg">Move Analysis</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1">
                    <ScrollArea className="h-[400px]">
                        <div className="grid grid-cols-[auto_1fr] px-6">
                            {analysis.analysis.map((move, index) => {
                                const style = classificationStyles[move.classification] || { icon: HelpCircle, className: 'text-gray-400', label: 'Move' };
                                const Icon = style.icon;
                                return (
                                    <React.Fragment key={index}>
                                        <div className="flex items-center gap-4 col-span-2 py-2 pr-4 rounded-md cursor-pointer" onClick={() => updateBoardAtMove(index)}>
                                            <span className={cn("font-mono text-sm text-muted-foreground w-10 text-right", currentMoveIndex === index && "font-bold text-primary")}>
                                                {move.player === 'White' ? `${move.moveNumber}.` : ''}
                                            </span>
                                            <span className={cn("font-semibold text-base w-20",  currentMoveIndex === index && "text-primary")}>{move.san}</span>
                                            <div className="flex items-center gap-2">
                                                <Icon className={cn("h-5 w-5", style.className)} />
                                                <span className={cn("font-semibold", style.className)}>{style.label}</span>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
        <Card>
            <CardHeader>
                <CardTitle>Analyze a Game</CardTitle>
                <p className="text-muted-foreground">Paste the PGN of a game to get a detailed report.</p>
            </CardHeader>
            <CardContent>
                <Textarea
                    placeholder="1. e4 e5 2. Nf3 ..."
                    value={pgn}
                    onChange={(e) => setPgn(e.target.value)}
                    rows={10}
                    className="font-mono"
                />
                {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
            </CardContent>
            <CardContent>
                 <Button onClick={() => handleAnalyze(pgn)} disabled={isLoading} className="w-full">
                    <BrainCircuit className="mr-2 h-4 w-4" />
                    Analyze
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}


export default function AnalysisPageSuspenseWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AnalysisPageComponent />
    </Suspense>
  );
}
