
'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Chess, type PGN } from 'chess.js';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { analyzeGame, AnalyzeGameOutput } from '@/ai/flows/analyze-game';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BrainCircuit, Gem, ThumbsUp, Check, BookOpen, AlertCircle, AlertTriangle, HelpCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Star } from 'lucide-react';
import { ChessBoard } from '@/components/chess-board';
import type { ChessSquare, ChessPiece, ChessMove } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from 'recharts';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const classificationStyles: Record<string, { icon: React.ElementType, className: string, label: string }> = {
  Brilliant: { icon: Gem, className: 'text-cyan-400', label: 'Brilliant' },
  Great: { icon: Star, className: 'text-sky-500', label: 'Great' },
  Excellent: { icon: ThumbsUp, className: 'text-green-500', label: 'Excellent' },
  Good: { icon: Check, className: 'text-lime-400', label: 'Good' },
  Book: { icon: BookOpen, className: 'text-gray-400', label: 'Book' },
  Inaccuracy: { icon: HelpCircle, className: 'text-yellow-500', label: 'Inaccuracy' },
  Mistake: { icon: AlertCircle, className: 'text-orange-500', label: 'Mistake' },
  Blunder: { icon: AlertTriangle, className: 'text-red-600', label: 'Blunder' },
};
const classificationOrder: (keyof typeof classificationStyles)[] = ['Brilliant', 'Great', 'Excellent', 'Good', 'Book', 'Inaccuracy', 'Mistake', 'Blunder'];


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
  
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState<any[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [pgnHeaders, setPgnHeaders] = useState<PGN['headers'] | null>(null);


  const updateBoardAtMove = useCallback((index: number) => {
    if (!analysis || !analysis.pgn) return;
    
    const gameForReplay = new Chess();
    gameForReplay.loadPgn(analysis.pgn);
    const history = gameForReplay.history({ verbose: true });
    
    const boardAtMove = new Chess();
    for (let i = 0; i <= index; i++) {
      if (history[i]) {
        boardAtMove.move(history[i].san);
      }
    }
    
    setGame(boardAtMove);
    const boardData = boardAtMove.board().flat().filter((p): p is NonNullable<typeof p> => p !== null).map(p => ({ square: p.square, piece: { type: p.type, color: p.color } }));
    setBoard(boardData);
    setCurrentMoveIndex(index);
  }, [analysis]);

  const handleAnalyze = async (pgnToAnalyze: string) => {
    const cleanedPgn = pgnToAnalyze.trim();
    if (!cleanedPgn) {
      toast({ variant: 'destructive', title: 'Error', description: 'PGN input cannot be empty.' });
      return;
    }
    
    setIsLoading(true);
    setAnalysis(null);

    try {
      const chess = new Chess();
      const pgnLoaded = chess.loadPgn(cleanedPgn, { sloppy: true });

      if (!pgnLoaded || chess.history().length === 0) {
        const isFen = /^\s*([rnbqkp1-8]+\/){7}([rnbqkp1-8]+)\s[bw]\s(-|K?Q?k?q?)\s(-|[a-h][36])\s\d+\s\d+\s*$/.test(cleanedPgn);
        if (isFen) {
            throw new Error("A FEN position was provided. Full game analysis requires a PGN with moves.");
        }
        throw new Error("Invalid or incomplete PGN provided. Please check the game data and try again.");
      }
      
      setPgnHeaders(chess.header());
      const result = await analyzeGame({ pgn: chess.pgn(), skillLevel: 'intermediate' });
      setAnalysis(result);

      const finalGame = new Chess();
      finalGame.loadPgn(result.pgn);
      updateBoardAtMove(finalGame.history().length - 1);

    } catch (e: any) {
      const errorMessage = e.message || 'An unknown error occurred.';
      toast({ variant: 'destructive', title: 'Analysis Failed', description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const pgnFromUrl = searchParams.get('pgn');
    if (pgnFromUrl) {
      const decodedPgn = decodeURIComponent(pgnFromUrl);
      setPgn(decodedPgn);
      handleAnalyze(decodedPgn);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const currentMoveData = analysis?.analysis[currentMoveIndex];
  
  const lastMoveForBoard = useMemo(() => {
      if (!analysis || !analysis.pgn || currentMoveIndex < 0 || !analysis.analysis[currentMoveIndex]) return null;
      
      const gameForMove = new Chess();
      gameForMove.loadPgn(analysis.pgn);
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

  if (analysis && pgnHeaders) {
    const totalMoves = analysis.analysis.length;
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
            <div className="lg:col-span-2 flex flex-col gap-4 items-center">
                <Card className="w-full">
                    <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <Avatar>
                                <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="avatar abstract" />
                                <AvatarFallback>{pgnHeaders.get('White')?.charAt(0) || 'W'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{pgnHeaders.get('White') || 'White'}</p>
                                <p className="text-sm text-muted-foreground">ELO: {pgnHeaders.get('WhiteElo') || 'N/A'}</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-lg">{pgnHeaders.get('Result')}</h3>
                            <p className="text-sm text-muted-foreground">{pgnHeaders.get('Site') || 'Online'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="text-right">
                                <p className="font-semibold">{pgnHeaders.get('Black') || 'Black'}</p>
                                <p className="text-sm text-muted-foreground">ELO: {pgnHeaders.get('BlackElo') || 'N/A'}</p>
                            </div>
                            <Avatar>
                                <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="avatar robot" />
                                <AvatarFallback>{pgnHeaders.get('Black')?.charAt(0) || 'B'}</AvatarFallback>
                            </Avatar>
                        </div>
                    </CardContent>
                </Card>
                <div className="w-full max-w-2xl aspect-square">
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
                        handlePieceDrop={() => {}}
                        showCoordinates='inside'
                    />
                </div>
                <Card className="w-full max-w-2xl">
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

            <div className="flex flex-col gap-4">
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
                        <CardTitle className="text-lg">Move Classifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableBody>
                                {classificationOrder.map(key => {
                                    const style = classificationStyles[key];
                                    const whiteCount = analysis.moveCounts.white[key.toLowerCase() as keyof typeof analysis.moveCounts.white] || 0;
                                    const blackCount = analysis.moveCounts.black[key.toLowerCase() as keyof typeof analysis.moveCounts.black] || 0;
                                    const Icon = style.icon;
                                    if(whiteCount === 0 && blackCount === 0) return null;
                                    return (
                                        <TableRow key={key}>
                                            <TableCell className="font-medium p-2 text-center w-1/3">{whiteCount}</TableCell>
                                            <TableCell className="text-center p-2">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Icon className={cn("h-5 w-5", style.className)} />
                                                    <span className={cn("font-semibold", style.className)}>{style.label}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium p-2 text-center w-1/3">{blackCount}</TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="flex-1 flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-lg">Move Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-1">
                        <ScrollArea className="h-[250px]">
                            <div className="grid grid-cols-[auto_1fr_1fr] px-4">
                                {analysis.analysis.reduce((acc, move, index) => {
                                    if (move.player === 'White') {
                                        acc.push([move]);
                                    } else if (acc.length > 0) {
                                        acc[acc.length - 1].push(move);
                                    } else {
                                        acc.push([undefined, move]);
                                    }
                                    return acc;
                                }, [] as [any, any][]).map((movePair, pairIndex) => {
                                    const [whiteMove, blackMove] = movePair;
                                    return (
                                        <div key={pairIndex} className="grid grid-cols-subgrid col-span-3 items-center border-b last:border-b-0">
                                            <div className="text-right text-muted-foreground font-mono pr-2">{pairIndex + 1}.</div>
                                            {whiteMove ? (
                                                <div className={cn("flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted", currentMoveIndex === whiteMove.moveNumber -1 && "bg-muted")}>
                                                    <span className="font-semibold text-base w-16">{whiteMove.san}</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className={cn("font-semibold text-xs", classificationStyles[whiteMove.classification]?.className)}>{classificationStyles[whiteMove.classification]?.label}</span>
                                                    </div>
                                                </div>
                                            ) : <div />}
                                            {blackMove ? (
                                                <div className={cn("flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted", currentMoveIndex === blackMove.moveNumber -1 && "bg-muted")}>
                                                    <span className="font-semibold text-base w-16">{blackMove.san}</span>
                                                    <div className="flex items-center gap-1">
                                                         <span className={cn("font-semibold text-xs", classificationStyles[blackMove.classification]?.className)}>{classificationStyles[blackMove.classification]?.label}</span>
                                                    </div>
                                                </div>
                                            ) : <div />}
                                        </div>
                                    )
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
                <CardDescription>Paste the PGN of a game to get a detailed report.</CardDescription>
            </CardHeader>
            <CardContent>
                <Textarea
                    placeholder="1. e4 e5 2. Nf3 ..."
                    value={pgn}
                    onChange={(e) => setPgn(e.target.value)}
                    rows={10}
                    className="font-mono"
                />
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
    <Suspense fallback={<div className="flex flex-col items-center justify-center gap-4 text-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h2 className="text-xl font-semibold">Loading Analysis...</h2>
      </div>}>
      <AnalysisPageComponent />
    </Suspense>
  );
}
