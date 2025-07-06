'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';
import { AuthButton } from './auth-button';
import { adjustDifficulty } from '@/ai/flows/adjust-difficulty';
import type { useChessGame } from '@/hooks/use-chess-game';
import { Play, RefreshCw, Settings, Undo2, Redo2, Bot, Users, Puzzle, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Switch } from './ui/switch';
import type { PieceSet, TimeControl, BoardTheme } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Separator } from './ui/separator';

type GameSidebarProps = ReturnType<typeof useChessGame> & {
    className?: string;
};

export function GameSidebar({
  resetGame,
  skillLevel,
  setSkillLevel,
  boardTheme,
  setBoardTheme,
  showPossibleMoves,
  setShowPossibleMoves,
  showLastMoveHighlight,
  setShowLastMoveHighlight,
  flipBoard,
  pieceSet,
  setPieceSet,
  undoMove,
  redoMove,
  canUndo,
  canRedo,
  gameMode,
  setGameMode,
  timeControl,
  setTimeControl,
  className,
  customBoardColors,
  setCustomBoardColors,
  customPieceColors,
  setCustomPieceColors,
}: GameSidebarProps) {
  const { toast } = useToast();
  const [isCustomTimeDialogOpen, setIsCustomTimeDialogOpen] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('10');
  const [customIncrement, setCustomIncrement] = useState('0');

  const handleSetCustomTime = () => {
      const mins = parseInt(customMinutes, 10) || 10;
      const incs = parseInt(customIncrement, 10) || 0;
      setTimeControl(`${mins}+${incs}`);
      setIsCustomTimeDialogOpen(false);
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
    <aside className={cn("w-64 flex-shrink-0 flex h-full flex-col gap-4 p-4 bg-sidebar text-sidebar-foreground border-r border-sidebar-border", className)}>
        {/* Header */}
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Puzzle className="h-8 w-8 text-primary" />
                    <h1 className="font-headline text-3xl text-primary">PGChess</h1>
                </div>
            </div>
            <AuthButton />
        </div>

        <hr className="border-sidebar-border -mx-4" />

        {/* Scrollable content area */}
        <ScrollArea className="flex-1 -mx-4">
            <div className="px-4 flex flex-col gap-4 py-4">
                <Card className="bg-sidebar-accent border-sidebar-border">
                    <CardHeader className='pb-3 pt-4'>
                        <CardTitle className='text-base'>Game Controls</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 p-3 pt-0">
                        <Button onClick={resetGame} size="sm">
                            <Play className="mr-2" />
                            New Game
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                            <Button onClick={undoMove} disabled={!canUndo} variant="outline" size="sm">
                            <Undo2 className="mr-2" />
                            Undo
                            </Button>
                            <Button onClick={redoMove} disabled={!canRedo} variant="outline" size="sm">
                            <Redo2 className="mr-2" />
                            Redo
                            </Button>
                        </div>
                        <Button onClick={flipBoard} variant="outline" size="sm">
                            <RefreshCw className="mr-2" />
                            Flip Board
                        </Button>
                    </CardContent>
                </Card>
            
                <Card className="bg-sidebar-accent border-sidebar-border">
                    <CardHeader className='pb-3 pt-4'>
                        <CardTitle className="flex items-center gap-2 text-base"><Settings /> Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 p-3 pt-0">
                        <div className="space-y-1">
                            <Label htmlFor="time-control" className='text-xs'>Time Control</Label>
                             <div className="flex gap-2">
                                <Select onValueChange={(value) => setTimeControl(value as TimeControl)} value={timeControl}>
                                    <SelectTrigger id="time-control" className="h-9">
                                        <SelectValue placeholder="Select time" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1+0">1+0 • Bullet</SelectItem>
                                        <SelectItem value="3+0">3+0 • Blitz</SelectItem>
                                        <SelectItem value="5+3">5+3 • Blitz</SelectItem>
                                        <SelectItem value="10+0">10+0 • Rapid</SelectItem>
                                        <SelectItem value="15+10">15+10 • Rapid</SelectItem>
                                        <SelectItem value="unlimited">Unlimited</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Dialog open={isCustomTimeDialogOpen} onOpenChange={setIsCustomTimeDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0">
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Custom Time Control</DialogTitle>
                                            <DialogDescription>
                                                Set the initial time and increment for each player.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid grid-cols-2 gap-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="minutes">Initial (minutes)</Label>
                                                <Input id="minutes" type="number" value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="increment">Increment (seconds)</Label>
                                                <Input id="increment" type="number" value={customIncrement} onChange={(e) => setCustomIncrement(e.target.value)} />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={handleSetCustomTime}>Set Time</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                            <Label htmlFor="game-mode" className="text-sm flex items-center gap-2">
                            {gameMode === 'ai' ? <Bot /> : <Users />}
                            Play vs AI
                            </Label>
                            <Switch
                            id="game-mode"
                            checked={gameMode === 'ai'}
                            onCheckedChange={(checked) => {
                                setGameMode(checked ? 'ai' : 'two-player');
                                resetGame();
                            }}
                            />
                        </div>
                        {gameMode === 'ai' && (
                            <div className="space-y-1">
                            <Label htmlFor="difficulty" className="text-xs">AI Difficulty</Label>
                            <Select onValueChange={(value: 'Beginner' | 'Intermediate' | 'Advanced') => handleAdjustDifficulty(value)} defaultValue="Beginner">
                                <SelectTrigger id="difficulty" className="h-9">
                                <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                                <SelectContent>
                                <SelectItem value="Beginner">Beginner</SelectItem>
                                <SelectItem value="Intermediate">Intermediate</SelectItem>
                                <SelectItem value="Advanced">Advanced</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground pt-1">Current AI Skill: {skillLevel}</p>
                            </div>
                        )}
                        <Separator />
                         <div className="space-y-1">
                            <Label htmlFor="piece-set" className="text-xs">Piece Set</Label>
                            <Select onValueChange={(value) => setPieceSet(value as PieceSet)} defaultValue={pieceSet}>
                            <SelectTrigger id="piece-set" className="h-9">
                                <SelectValue placeholder="Select piece set" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="classic">Classic</SelectItem>
                                <SelectItem value="alpha">Alpha</SelectItem>
                                <SelectItem value="merida">Merida</SelectItem>
                            </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="theme" className="text-xs">Board Theme</Label>
                            <Select onValueChange={(value) => setBoardTheme(value as BoardTheme)} defaultValue={boardTheme}>
                                <SelectTrigger id="theme" className="h-9">
                                    <SelectValue placeholder="Select theme" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="classic">Classic</SelectItem>
                                    <SelectItem value="cyan">Cyan</SelectItem>
                                    <SelectItem value="ocean">Ocean</SelectItem>
                                    <SelectItem value="forest">Forest</SelectItem>
                                    <SelectItem value="charcoal">Charcoal</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {boardTheme === 'custom' && (
                            <div className="space-y-3 rounded-md border border-sidebar-border p-3">
                                <Label className="text-sm font-medium">Board Colors</Label>
                                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                    <Label htmlFor="light-squares" className="text-xs">Light Squares</Label>
                                    <Label htmlFor="dark-squares" className="text-xs">Dark Squares</Label>
                                    <Input id="light-squares" type="color" value={customBoardColors.light} onChange={e => setCustomBoardColors(c => ({...c, light: e.target.value}))} />
                                    <Input id="dark-squares" type="color" value={customBoardColors.dark} onChange={e => setCustomBoardColors(c => ({...c, dark: e.target.value}))} />
                                </div>
                                 <Separator />
                                <Label className="text-sm font-medium">Piece Colors</Label>
                                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                    <Label htmlFor="white-fill" className="text-xs">White Fill</Label>
                                    <Label htmlFor="black-fill" className="text-xs">Black Fill</Label>
                                    <Input id="white-fill" type="color" value={customPieceColors.whiteFill} onChange={e => setCustomPieceColors(c => ({...c, whiteFill: e.target.value}))} />
                                    <Input id="black-fill" type="color" value={customPieceColors.blackFill} onChange={e => setCustomPieceColors(c => ({...c, blackFill: e.target.value}))} />

                                    <Label htmlFor="white-stroke" className="text-xs">White Stroke</Label>
                                    <Label htmlFor="black-stroke" className="text-xs">Black Stroke</Label>
                                    <Input id="white-stroke" type="color" value={customPieceColors.whiteStroke} onChange={e => setCustomPieceColors(c => ({...c, whiteStroke: e.target.value}))} />
                                    <Input id="black-stroke" type="color" value={customPieceColors.blackStroke} onChange={e => setCustomPieceColors(c => ({...c, blackStroke: e.target.value}))} />
                                </div>
                            </div>
                        )}

                        <Separator />

                        <div className="flex items-center justify-between pt-1">
                            <Label htmlFor="possible-moves" className="text-sm">Show Possible Moves</Label>
                            <Switch id="possible-moves" checked={showPossibleMoves} onCheckedChange={setShowPossibleMoves} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="last-move" className="text-sm">Highlight Last Move</Label>
                            <Switch id="last-move" checked={showLastMoveHighlight} onCheckedChange={setShowLastMoveHighlight} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ScrollArea>
    </aside>
  );
}
