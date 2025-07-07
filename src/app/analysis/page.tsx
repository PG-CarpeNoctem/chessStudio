'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Chess } from 'chess.js';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { analyzeGame, AnalyzeGameOutput } from '@/ai/flows/analyze-game';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BrainCircuit, Gem, ThumbsUp, Check, BookOpen, AlertCircle, AlertTriangle, HelpCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Star, Info, MessageSquareQuote, Target } from 'lucide-react';
import { ChessBoard } from '@/components/chess-board';
import type { ChessSquare, ChessMove } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from 'recharts';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const classificationStyles: Record<string, { icon: React.ElementType, className: string, label: string }> = {
  Brilliant: { icon: Gem, className: 'text-cyan-400', label: 'Brilliant' },
  Great: { icon: Star, className: 'text-sky-500', label: 'Great' },
  Best: { icon: Star, className: 'text-green-500', label: 'Best Move' },
  Excellent: { icon: ThumbsUp, className: 'text-green-500', label: 'Excellent' },
  Good: { icon: Check, className: 'text-lime-400', label: 'Good' },
  Book: { icon: BookOpen, className: 'text-gray-400', label: 'Book' },
  Forced: { icon: Target, className: 'text-indigo-400', label: 'Forced' },
  Inaccuracy: { icon: HelpCircle, className: 'text-yellow-500', label: 'Inaccuracy' },
  Mistake: { icon: AlertCircle, className: 'text-orange-500', label: 'Mistake' },
  Blunder: { icon: AlertTriangle, className: 'text-red-600', label: 'Blunder' },
};
const classificationOrder: (keyof typeof classificationStyles)[] = ['Brilliant', 'Great', 'Best', 'Excellent', 'Good', 'Book', 'Forced', 'Inaccuracy', 'Mistake', 'Blunder'];


const chartConfig = {
  evaluation: {
    label: "Evaluation",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

function AnalysisLoadingState({ progress }: { progress: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center h-96">
      <h2 className="text-2xl font-semibold">Evaluating your game...</h2>
      <p className="text-muted-foreground">Our AI is charting the peaks and valleys of every move.</p>
      <div className="w-full max-w-md mt-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Parsing PGN</span>
              <span>Identifying Opening</span>
              <span>Evaluating Moves</span>
              <span>Compiling Report</span>
          </div>
      </div>
    </div>
  );
}

function AnalysisPageComponent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [pgn, setPgn] = useState('');
  const [analysis, setAnalysis] = useState<AnalyzeGameOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState<any[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [pgnHeaders, setPgnHeaders] = useState<{[key: string]: string} | null>(null);

  const pgnFromUrl = searchParams.get('pgn');

  const updateBoardAtMove = useCallback((index: number) => {
    if (!analysis || !analysis.pgn) return;
    
    const gameForReplay = new Chess();
    try {
        gameForReplay.loadPgn(analysis.pgn);
    } catch {
        // PGN already validated, should not fail
        return;
    }
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

  const handleAnalyze = useCallback(async (pgnToAnalyze: string) => {
    const cleanedPgn = pgnToAnalyze.trim();
    if (!cleanedPgn) {
      toast({ variant: 'destructive', title: 'Error', description: 'PGN input cannot be empty.' });
      return;
    }

    setIsLoading(true);
    setAnalysis(null);

    const progressInterval = setInterval(() => {
        setProgress(prev => (prev >= 95 ? prev : prev + 5));
    }, 200);

    try {
      const chess = new Chess();
      // chess.js throws an error on invalid PGN, which we catch.
      chess.loadPgn(cleanedPgn);

      if (chess.history().length === 0) {
        throw new Error("Invalid or incomplete PGN. Please provide a PGN with at least one move.");
      }
      
      const headers = chess.header();
      setPgnHeaders(headers);
      
      const result = await analyzeGame({ pgn: chess.pgn(), skillLevel: 'intermediate' });
      setAnalysis(result);

      const finalGame = new Chess();
      finalGame.loadPgn(result.pgn);
      updateBoardAtMove(finalGame.history().length - 1);

    } catch (e: any) {
      const errorMessage = e.message?.includes('Invalid PGN') 
          ? 'Invalid PGN provided. Please check the game data and try again.'
          : e.message || 'An unknown error occurred during analysis.';
      toast({ variant: 'destructive', title: 'Analysis Failed', description: errorMessage });
    } finally {
      clearInterval(progressInterval);
      setProgress(100);
      setIsLoading(false);
    }
  }, [toast, updateBoardAtMove]);

  useEffect(() => {
    if (pgnFromUrl) {
      const decodedPgn = decodeURIComponent(pgnFromUrl);
      setPgn(decodedPgn);
      handleAnalyze(decodedPgn);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pgnFromUrl]);

  const highlightedMove = useMemo(() => {
      if (!analysis || !analysis.pgn || currentMoveIndex < 0 || !analysis.analysis[currentMoveIndex]) return null;
      
      const gameForMove = new Chess();
      try {
        gameForMove.loadPgn(analysis.pgn);
      } catch { return null; }

      const history = gameForMove.history({ verbose: true });
      
      return history[currentMoveIndex] || null;

  }, [analysis, currentMoveIndex]);

  const currentMoveData = analysis?.analysis[currentMoveIndex];

  if (!pgnFromUrl) {
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
            <CardFooter>
                 <Button onClick={() => handleAnalyze(pgn)} disabled={isLoading || !pgn} className="w-full">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                    Analyze
                </Button>
            </CardFooter>
        </Card>
    </div>
    );
  }

  if (isLoading || !analysis || !pgnHeaders) {
    return <AnalysisLoadingState progress={progress} />;
  }
  
  const totalMoves = analysis.analysis.length;
  return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="flex flex-col gap-4 items-center">
              <Card className="w-full">
                  <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <Avatar>
                              <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="avatar abstract" />
                              <AvatarFallback>{pgnHeaders['White']?.charAt(0) || 'W'}</AvatarFallback>
                          </Avatar>
                          <div>
                              <p className="font-semibold">{pgnHeaders['White'] || 'White'}</p>
                              <p className="text-sm text-muted-foreground">ELO: {pgnHeaders['WhiteElo'] || 'N/A'}</p>
                          </div>
                      </div>
                      <div className="text-center">
                          <h3 className="font-bold text-lg">{pgnHeaders['Result']}</h3>
                          <p className="text-sm text-muted-foreground">{pgnHeaders['Site'] || 'Online'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                          <div className="text-right">
                              <p className="font-semibold">{pgnHeaders['Black'] || 'Black'}</p>
                              <p className="text-sm text-muted-foreground">ELO: {pgnHeaders['BlackElo'] || 'N/A'}</p>
                          </div>
                          <Avatar>
                              <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="avatar robot" />
                              <AvatarFallback>{pgnHeaders['Black']?.charAt(0) || 'B'}</AvatarFallback>
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
                      lastMove={highlightedMove ? { from: highlightedMove.from, to: highlightedMove.to, san: highlightedMove.san } : null}
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
              <Tabs defaultValue="report" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="report">Report</TabsTrigger>
                      <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  </TabsList>
                  <TabsContent value="report" className="space-y-4 pt-4">
                      <Card>
                          <CardHeader>
                              <CardTitle className="text-lg">Game Summary</CardTitle>
                              <CardDescription>{analysis.opening}</CardDescription>
                          </CardHeader>
                          <CardContent>
                              <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                          </CardContent>
                      </Card>
                      <Card>
                          <CardHeader>
                              <CardTitle className="text-lg">Accuracies</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="text-center">
                                      <p className="font-bold text-2xl">{analysis.accuracies.white.toFixed(1)}%</p>
                                      <p className="text-sm text-muted-foreground">White</p>
                                  </div>
                                  <div className="text-center">
                                      <p className="font-bold text-2xl">{analysis.accuracies.black.toFixed(1)}%</p>
                                      <p className="text-sm text-muted-foreground">Black</p>
                                  </div>
                              </div>
                              <div className="flex gap-1">
                                  <Progress value={analysis.accuracies.white} className="rounded-r-none h-2" />
                                  <Progress value={analysis.accuracies.black} className="rounded-l-none h-2" />
                              </div>
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

                      <Card>
                          <CardHeader>
                              <CardTitle className="text-lg">Evaluation</CardTitle>
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

                  </TabsContent>
                  <TabsContent value="analysis" className="space-y-4 pt-4">
                        {currentMoveData && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Info className="h-5 w-5" />
                                        Move {currentMoveData.moveNumber}: {currentMoveData.san}
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2 pt-1">
                                        <div className={cn("flex items-center gap-1.5", classificationStyles[currentMoveData.classification]?.className)}>
                                            {React.createElement(classificationStyles[currentMoveData.classification]?.icon, { className: "h-5 w-5" })}
                                            <span className="font-semibold">{classificationStyles[currentMoveData.classification]?.label}</span>
                                        </div>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground flex items-start gap-2">
                                        <MessageSquareQuote className="h-4 w-4 mt-1 shrink-0" />
                                        <span>{currentMoveData.explanation}</span>
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                      <Card className="flex-1 flex flex-col">
                          <CardHeader>
                              <CardTitle className="text-lg">Game History</CardTitle>
                          </CardHeader>
                          <CardContent className="p-0 flex-1">
                              <ScrollArea className="h-[400px]">
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
                                                      <div onClick={() => updateBoardAtMove(whiteMove.moveNumber - 1)} className={cn("flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted", currentMoveIndex === whiteMove.moveNumber -1 && "bg-primary/10")}>
                                                          {React.createElement(classificationStyles[whiteMove.classification].icon, { className: cn("h-4 w-4", classificationStyles[whiteMove.classification].className)})}
                                                          <span className="font-semibold text-base">{whiteMove.san}</span>
                                                      </div>
                                                  ) : <div />}
                                                  {blackMove ? (
                                                      <div onClick={() => updateBoardAtMove(blackMove.moveNumber - 1)} className={cn("flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted", currentMoveIndex === blackMove.moveNumber -1 && "bg-primary/10")}>
                                                         {React.createElement(classificationStyles[blackMove.classification].icon, { className: cn("h-4 w-4", classificationStyles[blackMove.classification].className)})}
                                                          <span className="font-semibold text-base">{blackMove.san}</span>
                                                      </div>
                                                  ) : <div />}
                                              </div>
                                          )
                                      })}
                                  </div>
                              </ScrollArea>
                          </CardContent>
                      </Card>
                  </TabsContent>
              </Tabs>
          </div>
      </div>
  );
}


export default function AnalysisPageSuspenseWrapper() {
  return (
    <Suspense fallback={<AnalysisLoadingState progress={10} />}>
      <AnalysisPageComponent />
    </Suspense>
  );
}

    