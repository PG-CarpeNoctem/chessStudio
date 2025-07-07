
'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Chess } from 'chess.js';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { analyzeGame, AnalyzeGameOutput } from '@/ai/flows/analyze-game';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BrainCircuit, Gem, ThumbsUp, Check, BookOpen, AlertCircle, AlertTriangle, HelpCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Star, Info, MessageSquareQuote, Target, Zap, RotateCw, Settings, Share2, ArrowLeft, Bot, Users } from 'lucide-react';
import { ChessBoard } from '@/components/chess-board';
import type { ChessSquare, ChessMove } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ReferenceLine, Tooltip } from 'recharts';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const classificationStyles: Record<string, { icon: React.ElementType, className: string, label: string }> = {
  Brilliant: { icon: Gem, className: 'text-cyan-400', label: 'Brilliant' },
  Critical: { icon: Zap, className: 'text-blue-500', label: 'Critical' },
  Best: { icon: Star, className: 'text-green-500', label: 'Best' },
  Excellent: { icon: ThumbsUp, className: 'text-teal-400', label: 'Excellent' },
  Okay: { icon: Check, className: 'text-lime-400', label: 'Okay' },
  Theory: { icon: BookOpen, className: 'text-gray-400', label: 'Theory' },
  Inaccuracy: { icon: HelpCircle, className: 'text-yellow-500', label: 'Inaccuracy' },
  Mistake: { icon: AlertCircle, className: 'text-orange-500', label: 'Mistake' },
  Blunder: { icon: AlertTriangle, className: 'text-red-600', label: 'Blunder' },
  Forced: { icon: Target, className: 'text-indigo-400', label: 'Forced' },
  // Map old values to new ones if they appear
  Great: { icon: Zap, className: 'text-blue-500', label: 'Critical' },
  Good: { icon: Check, className: 'text-lime-400', label: 'Okay' },
  Book: { icon: BookOpen, className: 'text-gray-400', label: 'Theory' },
};
const classificationOrder: (keyof typeof classificationStyles)[] = ['Brilliant', 'Critical', 'Best', 'Excellent', 'Okay', 'Theory', 'Inaccuracy', 'Mistake', 'Blunder'];


const chartConfig = {
  evaluation: {
    label: "Evaluation",
    color: "hsl(var(--foreground))",
  },
} satisfies ChartConfig;

const renderEvalBar = (evaluation: number | undefined) => {
    if (evaluation === undefined) {
        return <div className="bg-white/50" style={{ height: '50%' }} />;
    }
    const cappedEval = Math.max(-1000, Math.min(1000, evaluation));
    const normalizedEval = (cappedEval + 1000) / 2000;
    const heightPercentage = normalizedEval * 100;

    return <div className="bg-white transition-all duration-300 rounded-full" style={{ height: `${heightPercentage}%` }} />;
};

function AnalysisLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center h-screen bg-stone-900 text-white">
      <h2 className="text-2xl font-semibold">Evaluating your game...</h2>
      <p className="text-muted-foreground">Our AI is charting the peaks and valleys of every move.</p>
      <div className="w-full max-w-md mt-4">
          <Progress value={50} className="h-2" />
      </div>
    </div>
  );
}

function AnalysisFormComponent({ onAnalyze }: { onAnalyze: (pgn: string) => void }) {
    const [pgn, setPgn] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const handleAnalyzeClick = () => {
        setIsLoading(true);
        onAnalyze(pgn);
    }

    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 md:p-6">
            <Card className="w-full max-w-2xl">
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
                    <Button onClick={handleAnalyzeClick} disabled={isLoading || !pgn} className="w-full">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                        Analyze
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}


function AnalysisReportComponent({ analysis }: { analysis: AnalyzeGameOutput }) {
  const router = useRouter();
  const [game, setGame] = useState(new Chess());
  const [board, setBoard] = useState<any[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [pgnHeaders, setPgnHeaders] = useState<{[key: string]: string}>({});

  useEffect(() => {
     const gameForHeaders = new Chess();
     gameForHeaders.loadPgn(analysis.pgn);
     setPgnHeaders(gameForHeaders.header());
     updateBoardAtMove(analysis.analysis.length - 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis]);
  
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

  const highlightedMove = useMemo(() => {
      if (!analysis || !analysis.pgn || currentMoveIndex < 0 || !analysis.analysis[currentMoveIndex]) return null;
      const gameForMove = new Chess();
      gameForMove.loadPgn(analysis.pgn);
      const history = gameForMove.history({ verbose: true });
      return history[currentMoveIndex] || null;
  }, [analysis, currentMoveIndex]);

  const currentMoveData = analysis?.analysis[currentMoveIndex];
  const totalMoves = analysis.analysis.length;

  return (
    <div className="flex h-screen w-full bg-stone-900 text-white font-sans">
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
        <div className="w-full max-w-2xl flex items-center justify-between absolute top-4 text-sm px-2">
            <div className="flex items-center gap-2">
                {pgnHeaders.Black?.includes('AI') ? <Bot/> : <Users/>}
                <span>{pgnHeaders.Black || 'Black'}</span>
            </div>
            <span>{pgnHeaders.Result}</span>
        </div>
        <div className="w-full max-w-[80vh] flex items-center gap-2">
          <div className="h-[80vh] w-3 bg-black/20 rounded-full flex flex-col-reverse relative">
             {renderEvalBar(currentMoveData?.evaluation)}
          </div>
          <div className="w-full aspect-square">
            <ChessBoard
                board={board}
                onSquareClick={() => {}}
                onSquareRightClick={() => {}}
                selectedSquare={null}
                possibleMoves={[]}
                lastMove={highlightedMove ? { from: highlightedMove.from, to: highlightedMove.to, san: highlightedMove.san } : null}
                boardTheme="classic"
                showPossibleMoves={false}
                showLastMoveHighlight={true}
                boardOrientation="w"
                pieceSet="cburnett"
                handlePieceDrop={() => {}}
                showCoordinates='outside'
            />
          </div>
        </div>
         <div className="w-full max-w-2xl flex items-center justify-between absolute bottom-4 text-sm px-2">
            <div className="flex items-center gap-2">
                {pgnHeaders.White?.includes('AI') ? <Bot/> : <Users/>}
                <span>{pgnHeaders.White || 'White'}</span>
            </div>
        </div>
      </div>

      <div className="w-[380px] bg-[#262522] h-full flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Game Report</h1>
          <div className="flex items-center gap-1">
            <Button onClick={() => router.push('/')} variant="ghost" size="icon"><ArrowLeft className="h-5 w-5"/></Button>
            <Button variant="ghost" size="icon"><RotateCw className="h-5 w-5"/></Button>
            <Button variant="ghost" size="icon"><Settings className="h-5 w-5"/></Button>
            <Button variant="ghost" size="icon"><Share2 className="h-5 w-5"/></Button>
          </div>
        </div>
        
        <Tabs defaultValue="report" className="flex flex-col flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 bg-stone-800">
            <TabsTrigger value="report">Report</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="report" className="space-y-4 pr-2">
                {currentMoveData && (
                     <Card className="bg-stone-800 border-stone-700">
                        <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                                {React.createElement(classificationStyles[currentMoveData.classification].icon, { className: cn("h-6 w-6", classificationStyles[currentMoveData.classification].className)})}
                                <p className="font-semibold">{currentMoveData.san} is {classificationStyles[currentMoveData.classification].label}</p>
                            </div>
                            <p className="text-sm text-stone-400 mt-1">{currentMoveData.explanation}</p>
                        </CardContent>
                    </Card>
                )}
                <Card className="bg-stone-800 border-stone-700">
                    <CardHeader className="p-3">
                         <CardTitle className="text-base font-semibold">Opening: {analysis.opening}</CardTitle>
                    </CardHeader>
                </Card>

                <Card className="bg-stone-800 border-stone-700">
                    <CardHeader className="p-3">
                        <CardTitle className="text-base font-semibold">Accuracies</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 grid grid-cols-2 gap-4 items-center">
                        <div className="text-center">
                            <p className="font-bold text-2xl">{analysis.accuracies.white.toFixed(1)}%</p>
                            <p className="text-sm text-stone-400">White</p>
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-2xl">{analysis.accuracies.black.toFixed(1)}%</p>
                            <p className="text-sm text-stone-400">Black</p>
                        </div>
                         <div className="col-span-2 flex gap-1">
                            <Progress value={analysis.accuracies.white} className="h-2 rounded-r-none bg-stone-700" indicatorClassName="bg-white" />
                            <Progress value={analysis.accuracies.black} className="h-2 rounded-l-none bg-stone-700" indicatorClassName="bg-black border border-stone-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-stone-800 border-stone-700">
                    <CardHeader className="p-3">
                        <CardTitle className="text-base font-semibold">Move Classifications</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                       <Table>
                            <TableBody>
                                {classificationOrder.map(key => {
                                    const style = classificationStyles[key];
                                    if(!style) return null;
                                    const whiteCount = analysis.moveCounts.white[key.toLowerCase() as keyof typeof analysis.moveCounts.white] || 0;
                                    const blackCount = analysis.moveCounts.black[key.toLowerCase() as keyof typeof analysis.moveCounts.black] || 0;
                                    if(whiteCount === 0 && blackCount === 0) return null;
                                    return (
                                        <TableRow key={key} className="border-b-stone-700 hover:bg-stone-700/50">
                                            <TableCell className="font-medium p-1.5 w-1/3">{whiteCount}</TableCell>
                                            <TableCell className="text-center p-1.5">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className={cn("font-semibold", style.className)}>{style.label}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium p-1.5 text-right w-1/3">{blackCount}</TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="analysis" className="pr-2">
                <div className="grid grid-cols-[auto_1fr_1fr] text-sm">
                  {analysis.analysis.reduce((acc, move, index) => {
                      if (move.player === 'White') {
                          acc.push([move]);
                      } else if (acc.length > 0) {
                          acc[acc.length - 1].push(move);
                      }
                      return acc;
                  }, [] as [any, any][]).map((movePair, pairIndex) => {
                      const [whiteMove, blackMove] = movePair;
                      return (
                          <div key={pairIndex} className="grid grid-cols-subgrid col-span-3 items-center border-b border-stone-700 last:border-b-0">
                              <div className="text-right text-stone-400 font-mono pr-2">{pairIndex + 1}.</div>
                              {whiteMove ? (
                                  <div onClick={() => updateBoardAtMove(whiteMove.moveNumber - 1)} className={cn("flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-stone-700/50", currentMoveIndex === whiteMove.moveNumber -1 && "bg-blue-600/30")}>
                                      {React.createElement(classificationStyles[whiteMove.classification].icon, { className: cn("h-4 w-4", classificationStyles[whiteMove.classification].className)})}
                                      <span className="font-semibold">{whiteMove.san}</span>
                                  </div>
                              ) : <div />}
                              {blackMove ? (
                                  <div onClick={() => updateBoardAtMove(blackMove.moveNumber - 1)} className={cn("flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-stone-700/50", currentMoveIndex === blackMove.moveNumber -1 && "bg-blue-600/30")}>
                                      {React.createElement(classificationStyles[blackMove.classification].icon, { className: cn("h-4 w-4", classificationStyles[blackMove.classification].className)})}
                                      <span className="font-semibold">{blackMove.san}</span>
                                  </div>
                              ) : <div />}
                          </div>
                      )
                  })}
                </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="mt-auto flex items-center justify-center gap-2 pt-4">
            <Button onClick={() => updateBoardAtMove(-1)} size="icon" variant="ghost" disabled={currentMoveIndex < 0}><ChevronsLeft /></Button>
            <Button onClick={() => updateBoardAtMove(currentMoveIndex - 1)} size="icon" variant="ghost" disabled={currentMoveIndex < 0}><ChevronLeft /></Button>
            <Button onClick={() => updateBoardAtMove(currentMoveIndex + 1)} size="icon" variant="ghost" disabled={currentMoveIndex >= totalMoves - 1}><ChevronRight /></Button>
            <Button onClick={() => updateBoardAtMove(totalMoves - 1)} size="icon" variant="ghost" disabled={currentMoveIndex >= totalMoves - 1}><ChevronsRight /></Button>
        </div>
      </div>
    </div>
  );
}


function AnalysisPageComponent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [pgn, setPgn] = useState<string | null>(searchParams.get('pgn'));
  const [analysis, setAnalysis] = useState<AnalyzeGameOutput | null>(null);
  const [isLoading, setIsLoading] = useState(!!pgn);

  const handleAnalyze = useCallback(async (pgnToAnalyze: string) => {
    setIsLoading(true);
    const cleanedPgn = pgnToAnalyze.trim();
    if (!cleanedPgn) {
      toast({ variant: 'destructive', title: 'Error', description: 'PGN input cannot be empty.' });
      setIsLoading(false);
      return;
    }

    try {
      const chess = new Chess();
      chess.loadPgn(cleanedPgn, { sloppy: true });

      if (chess.history().length === 0) {
        throw new Error("Invalid or incomplete PGN.");
      }
      
      const result = await analyzeGame({ pgn: chess.pgn(), skillLevel: 'intermediate' });
      setAnalysis(result);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Analysis Failed', description: e.message || 'An unknown error occurred.' });
      setPgn(null); // Reset to show form again
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    if (pgn) {
      handleAnalyze(pgn);
    }
  }, [pgn, handleAnalyze]);

  if (!pgn) {
    return <AnalysisFormComponent onAnalyze={setPgn} />;
  }

  if (isLoading) {
    return <AnalysisLoadingState />;
  }

  if (analysis) {
    return <AnalysisReportComponent analysis={analysis} />;
  }

  return <AnalysisFormComponent onAnalyze={setPgn} />; // Fallback to form on error
}


export default function AnalysisPageSuspenseWrapper() {
  return (
    <Suspense fallback={<AnalysisLoadingState />}>
      <AnalysisPageComponent />
    </Suspense>
  );
}
