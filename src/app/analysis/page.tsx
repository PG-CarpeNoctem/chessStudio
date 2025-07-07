
'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Chess } from 'chess.js';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { analyzeGame, AnalyzeGameOutput } from '@/ai/flows/analyze-game';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BrainCircuit, Gem, ThumbsUp, Check, BookOpen, AlertCircle, AlertTriangle, HelpCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Star, Info, MessageSquareQuote, Target, Zap, RotateCw, Settings, Share2, ArrowLeft, Bot, Users, XCircle, Trophy } from 'lucide-react';
import { ChessBoard } from '@/components/chess-board';
import type { ChessSquare, BoardTheme, PieceSet } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Dot as RechartsDot } from 'recharts';


const classificationStyles: Record<string, { icon: React.ElementType, className: string, label: string }> = {
  Brilliant: { icon: Gem, className: 'text-cyan-400', label: 'Brilliant' },
  Great: { icon: Zap, className: 'text-blue-500', label: 'Great' },
  Best: { icon: Star, className: 'text-green-500', label: 'Best' },
  Excellent: { icon: ThumbsUp, className: 'text-teal-400', label: 'Excellent' },
  Good: { icon: Check, className: 'text-lime-500', label: 'Good' },
  Okay: { icon: Check, className: 'text-lime-400', label: 'Okay' },
  Book: { icon: BookOpen, className: 'text-gray-400', label: 'Book' },
  Theory: { icon: BookOpen, className: 'text-gray-400', label: 'Theory' },
  Inaccuracy: { icon: HelpCircle, className: 'text-yellow-500', label: 'Inaccuracy' },
  Mistake: { icon: AlertCircle, className: 'text-orange-500', label: 'Mistake' },
  Blunder: { icon: AlertTriangle, className: 'text-red-600', label: 'Blunder' },
  Forced: { icon: Target, className: 'text-indigo-400', label: 'Forced' },
  'Missed Win': { icon: XCircle, className: 'text-red-700', label: 'Missed Win' },
};
const classificationOrder = ['Brilliant', 'Great', 'Best', 'Excellent', 'Good', 'Okay', 'Book', 'Inaccuracy', 'Mistake', 'Blunder', 'Missed Win', 'Forced'];

const renderEvalBar = (evaluation: number | undefined) => {
    if (evaluation === undefined) {
        return <div className="bg-white/50" style={{ height: '50%' }} />;
    }
    // Cap evaluation at +/- 400 centipawns for visualization
    const cappedEval = Math.max(-400, Math.min(400, evaluation));
    // Normalize to a 0-1 range
    const normalizedEval = (cappedEval + 400) / 800;
    const heightPercentage = normalizedEval * 100;

    return <div className="bg-white transition-all duration-300 rounded-full" style={{ height: `${heightPercentage}%` }} />;
};

const EvaluationChart = ({ analysis, currentMoveIndex, onMoveSelect }: { analysis: AnalyzeGameOutput, currentMoveIndex: number, onMoveSelect: (index: number) => void }) => {
    const chartData = analysis.analysis.map((move, index) => ({
      name: `${Math.ceil((index + 1) / 2)}${index % 2 === 0 ? '.' : '...'} ${move.san}`,
      moveNumber: index + 1,
      evaluation: Math.max(-10, Math.min(10, move.evaluation / 100)), // Cap at +/- 10 pawns
      classification: move.classification,
    }));
    
    const currentMoveData = chartData[currentMoveIndex];
    
    const CustomDot = (props: any) => {
        const { cx, cy, payload } = props;
        const { classification, moveNumber } = payload;
        const style = classificationStyles[classification];

        if (!style || !['Brilliant', 'Great', 'Mistake', 'Blunder', 'Missed Win'].includes(classification)) {
            return null;
        }

        const colorMap: Record<string, string> = {
            'text-cyan-400': 'hsl(var(--primary))',
            'text-blue-500': '#3b82f6',
            'text-red-600': 'hsl(var(--destructive))',
            'text-orange-500': '#f97316',
            'text-red-700': 'hsl(var(--destructive))',
        };

        return (
            <RechartsDot
                cx={cx}
                cy={cy}
                r={4}
                fill={colorMap[style.className] || 'grey'}
                stroke={'hsl(var(--card))'}
                strokeWidth={1}
                className="cursor-pointer"
                onClick={() => onMoveSelect(moveNumber - 1)}
            />
        );
    };
    
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background/90 p-2 border border-border rounded-md text-xs shadow-lg">
                    <p className="font-semibold">{payload[0].payload.name}</p>
                    <p className="text-foreground">{`Eval: ${payload[0].value.toFixed(2)}`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="bg-stone-800 border-stone-700">
            <CardHeader className="p-3 flex flex-row items-center justify-between">
                 <CardTitle className="text-base font-semibold">Opening: {analysis.opening}</CardTitle>
            </CardHeader>
            <CardContent className="h-28 pr-4 pb-4 pl-2">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} onClick={(e) => e && e.activeTooltipIndex !== undefined && onMoveSelect(e.activeTooltipIndex)}>
                        <defs>
                            <linearGradient id="evalGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="50%" stopColor="rgba(255, 255, 255, 0.3)" stopOpacity={0.8}/>
                                <stop offset="50%" stopColor="rgba(255, 255, 255, 0.3)" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="evalGradientNegative" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="50%" stopColor="rgba(0, 0, 0, 0.3)" stopOpacity={0}/>
                                <stop offset="50%" stopColor="rgba(0, 0, 0, 0.3)" stopOpacity={0.8}/>
                            </linearGradient>
                        </defs>
                        <YAxis domain={[-10, 10]} hide />
                        <XAxis dataKey="moveNumber" hide />
                        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1 }}/>
                        <Area type="monotone" dataKey="evaluation" stroke="hsl(var(--foreground))" strokeWidth={1.5} fillOpacity={1} fill="url(#evalGradient)" />
                        <Area type="monotone" dataKey="evaluation" stroke="hsl(var(--foreground))" strokeWidth={1.5} fillOpacity={1} fill="url(#evalGradientNegative)" />
                        <RechartsDot r={0}
                           // @ts-ignore
                           content={<CustomDot />} 
                        />
                        {currentMoveData && (
                            <ReferenceLine x={currentMoveData.moveNumber} stroke="hsl(var(--primary))" strokeWidth={1.5} ifOverflow="extendDomain">
                               <RechartsDot r={5} fill="hsl(var(--primary))" stroke="white" strokeWidth={2} />
                            </ReferenceLine>
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};


// The new animated chart component for the loading screen
const LoadingChart = () => {
    return (
        <div className="w-full max-w-lg mx-auto bg-stone-800/50 rounded-lg shadow-lg border border-stone-700/50 overflow-hidden">
            <svg viewBox="0 0 400 100" className="w-full h-auto block">
                <defs>
                    <clipPath id="chart-clip">
                        <rect x="0" y="0" width="0" height="100">
                             <animate attributeName="width" from="0" to="400" dur="8s" fill="freeze" />
                        </rect>
                    </clipPath>
                </defs>
                <g clipPath="url(#chart-clip)">
                    <path d="M0 50 C 40 60, 80 40, 120 50 S 160 70, 200 65 S 240 55, 280 45 S 320 30, 360 40 S 380 50, 400 50" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" fill="none" />
                    <line x1="0" y1="50" x2="400" y2="50" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" strokeDasharray="2 2" />
                </g>
            </svg>
        </div>
    );
};


function AnalysisLoadingState() {
  return (
    <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold">Evaluating your game...</CardTitle>
            <CardDescription>Our AI is charting the peaks and valleys of every move.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 pb-8">
            <LoadingChart />
        </CardContent>
    </Card>
  );
}

function AnalysisFormComponent({ onAnalyze }: { onAnalyze: (pgn: string) => void }) {
    const [pgn, setPgn] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleAnalyzeClick = () => {
        setIsSubmitting(true);
        onAnalyze(pgn);
    }

    return (
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
                <Button onClick={handleAnalyzeClick} disabled={isSubmitting || !pgn} className="w-full">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                    Analyze
                </Button>
            </CardFooter>
        </Card>
    );
}


function AnalysisReportComponent({ analysis }: { analysis: AnalyzeGameOutput }) {
  const router = useRouter();
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [pgnHeaders, setPgnHeaders] = useState<{[key: string]: string}>({});
  const [showEstimatedElo, setShowEstimatedElo] = useState(true);
  const [boardTheme, setBoardTheme] = useState<BoardTheme>('classic');
  const [pieceSet, setPieceSet] = useState<PieceSet>('cburnett');

  useEffect(() => {
    const getSetting = <T,>(key: string, defaultValue: T): T => {
        const saved = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
        try {
            return saved ? JSON.parse(saved) : defaultValue;
        } catch {
            return defaultValue;
        }
    };

    setBoardTheme(getSetting<BoardTheme>('chess:boardTheme', 'classic'));
    setPieceSet(getSetting<PieceSet>('chess:pieceSet', 'classic'));

    const showElo = localStorage.getItem('chess:showEstimatedElo');
    setShowEstimatedElo(showElo ? JSON.parse(showElo) : true);
  }, []);

  const gameAtMove = useMemo(() => {
    if (!analysis || !analysis.pgn) return new Chess();
    
    const gameForReplay = new Chess();
    gameForReplay.loadPgn(analysis.pgn);
    const history = gameForReplay.history({ verbose: true });
    
    const boardAtMove = new Chess();
    for (let i = 0; i <= currentMoveIndex; i++) {
      if (history[i]) {
        boardAtMove.move(history[i].san);
      }
    }
    return boardAtMove;
  }, [analysis, currentMoveIndex]);

  const boardState = useMemo(() => {
    return gameAtMove.board().flat().filter((p): p is NonNullable<typeof p> => p !== null).map(p => ({ square: p.square, piece: { type: p.type, color: p.color } }));
  }, [gameAtMove]);

  useEffect(() => {
     const gameForHeaders = new Chess();
     gameForHeaders.loadPgn(analysis.pgn);
     setPgnHeaders(gameForHeaders.header());
     setCurrentMoveIndex(analysis.analysis.length - 1);
  }, [analysis]);
  
  const updateBoardAtMove = useCallback((index: number) => {
    setCurrentMoveIndex(index);
  }, []);

  const lastMove = useMemo(() => {
      if (!analysis || !analysis.pgn || currentMoveIndex < 0) return null;
      const gameForMove = new Chess();
      gameForMove.loadPgn(analysis.pgn);
      const history = gameForMove.history({ verbose: true });
      return history[currentMoveIndex] || null;
  }, [analysis, currentMoveIndex]);
  
  const movePairs = useMemo(() => {
    const pairs: any[][] = [];
    if (!analysis?.analysis) return [];

    let i = 0;
    while (i < analysis.analysis.length) {
        const move = analysis.analysis[i];
        if (move.player === 'White') {
            const nextMove = analysis.analysis[i + 1];
            if (nextMove && nextMove.player === 'Black') {
                pairs.push([move, nextMove]);
                i += 2;
            } else {
                pairs.push([move]);
                i += 1;
            }
        } else { // Black move starts the game
            pairs.push([null, move]);
            i += 1;
        }
    }
    return pairs;
  }, [analysis]);

  const currentMoveData = analysis?.analysis[currentMoveIndex];
  const totalMoves = analysis.analysis.length;

  return (
    <div className="flex h-screen w-full bg-stone-900 text-white font-sans">
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
        <div className="w-full max-w-2xl flex items-center justify-between absolute top-4 text-sm px-2">
            <div className="flex items-center gap-2">
                {pgnHeaders.Black?.includes('AI') ? <Bot/> : <Users/>}
                <span>{pgnHeaders.Black || 'Black'}</span>
                {showEstimatedElo && <span className="text-muted-foreground">({analysis.estimatedElos.black})</span>}
            </div>
            <span>{pgnHeaders.Result}</span>
        </div>
        <div className="w-full max-w-[80vh] flex items-stretch justify-center gap-6">
            <div className="flex-shrink-0 flex items-center gap-4 py-10">
                <div className="h-full w-3 bg-black/20 rounded-full flex flex-col-reverse relative overflow-hidden">
                    {renderEvalBar(currentMoveData?.evaluation)}
                </div>
                <div className="h-full relative flex flex-col justify-between text-xs text-stone-400 font-mono">
                    <span>+4</span>
                    <span className="absolute top-1/2 left-0 -translate-y-1/2">0</span>
                    <span>-4</span>
                </div>
            </div>
            <div className="w-full aspect-square">
                <ChessBoard
                    board={boardState}
                    onSquareClick={() => {}}
                    onSquareRightClick={() => {}}
                    selectedSquare={null}
                    possibleMoves={[]}
                    lastMove={lastMove ? { from: lastMove.from, to: lastMove.to, san: lastMove.san } : null}
                    boardTheme={boardTheme}
                    showPossibleMoves={false}
                    showLastMoveHighlight={true}
                    boardOrientation="w"
                    pieceSet={pieceSet}
                    handlePieceDrop={() => {}}
                    showCoordinates='outside'
                />
            </div>
        </div>
         <div className="w-full max-w-2xl flex items-center justify-between absolute bottom-4 text-sm px-2">
            <div className="flex items-center gap-2">
                {pgnHeaders.White?.includes('AI') ? <Bot/> : <Users/>}
                <span>{pgnHeaders.White || 'White'}</span>
                {showEstimatedElo && <span className="text-muted-foreground">({analysis.estimatedElos.white})</span>}
            </div>
        </div>
      </div>

      <div className="w-[380px] bg-[#262522] h-full flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Game Report</h1>
          <div className="flex items-center gap-1">
            <Button onClick={() => router.push('/')} variant="ghost" size="icon"><ArrowLeft className="h-5 w-5"/></Button>
            <Button variant="ghost" size="icon"><RotateCw className="h-5 w-5"/></Button>
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
                <EvaluationChart analysis={analysis} currentMoveIndex={currentMoveIndex} onMoveSelect={updateBoardAtMove} />
                
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
                                {classificationOrder.map((key, i) => {
                                    const style = classificationStyles[key];
                                    if(!style) return null;
                                    const whiteCount = analysis.moveCounts.white[key.toLowerCase().replace(' ', '') as keyof typeof analysis.moveCounts.white] || 0;
                                    const blackCount = analysis.moveCounts.black[key.toLowerCase().replace(' ', '') as keyof typeof analysis.moveCounts.black] || 0;
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
                 <Card className="bg-stone-800 border-stone-700">
                    <CardHeader className="p-3">
                        <CardTitle className="text-base font-semibold">Key Moments</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2">
                        {analysis.keyMoments.map((moment, index) => (
                           <div key={index} onClick={() => updateBoardAtMove(moment.moveNumber - 1)} className="text-sm p-2 rounded-md cursor-pointer hover:bg-stone-700/50">
                               <p className="font-semibold">{moment.moveNumber}. {moment.san} ({moment.player})</p>
                               <p className="text-stone-400">{moment.description}</p>
                           </div>
                        ))}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="analysis" className="space-y-4 pr-2">
                {currentMoveData && (
                     <Card className="bg-stone-800 border-stone-700">
                        <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                                {React.createElement(classificationStyles[currentMoveData.classification].icon, { className: cn("h-6 w-6", classificationStyles[currentMoveData.classification].className)})}
                                <p className="font-semibold">{currentMoveData.san} is a {classificationStyles[currentMoveData.classification].label} move</p>
                            </div>
                            <p className="text-sm text-stone-400 mt-1">{currentMoveData.explanation}</p>
                            {currentMoveData.bestAlternative && (
                                <p className="text-sm text-green-400 mt-2">The best move was {currentMoveData.bestAlternative}</p>
                            )}
                        </CardContent>
                    </Card>
                )}
                <div className="grid grid-cols-[auto_1fr_1fr] text-sm bg-stone-800/50 rounded-md p-1">
                  {movePairs.map((movePair, pairIndex) => {
                      const [whiteMove, blackMove] = movePair;
                      return (
                          <div key={pairIndex} className="grid grid-cols-subgrid col-span-3 items-center border-b border-stone-700 last:border-b-0">
                              <div className="text-right text-stone-400 font-mono pr-2">{pairIndex + 1}.</div>
                              {whiteMove ? (
                                  <div onClick={() => updateBoardAtMove(whiteMove.moveNumber - 1)} className={cn("flex items-center gap-2 p-1.5 rounded-md cursor-pointer hover:bg-stone-700/50", currentMoveIndex === whiteMove.moveNumber -1 && "bg-blue-600/30")}>
                                      {React.createElement(classificationStyles[whiteMove.classification].icon, { className: cn("h-4 w-4", classificationStyles[whiteMove.classification].className)})}
                                      <span className="font-semibold">{whiteMove.san}</span>
                                  </div>
                              ) : <div />}
                              {blackMove ? (
                                  <div onClick={() => updateBoardAtMove(blackMove.moveNumber - 1)} className={cn("flex items-center gap-2 p-1.5 rounded-md cursor-pointer hover:bg-stone-700/50", currentMoveIndex === blackMove.moveNumber -1 && "bg-blue-600/30")}>
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
      // Allow for sloppy PGNs
      const headers = chess.header();
      chess.loadPgn(cleanedPgn, { sloppy: true });
      chess.header(...Object.entries(headers)); // Restore headers after load

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
    if (pgn && !analysis) {
      handleAnalyze(pgn);
    }
  }, [pgn, handleAnalyze, analysis]);

  if (analysis) {
    return <AnalysisReportComponent analysis={analysis} />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 md:p-6">
      {isLoading ? (
        <AnalysisLoadingState />
      ) : (
        <AnalysisFormComponent
          onAnalyze={(newPgn) => {
            setPgn(newPgn);
            setIsLoading(true);
          }}
        />
      )}
    </div>
  );
}


export default function AnalysisPageSuspenseWrapper() {
  return (
    <Suspense>
      <AnalysisPageComponent />
    </Suspense>
  );
}
