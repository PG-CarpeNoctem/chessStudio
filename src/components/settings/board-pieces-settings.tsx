
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { PieceSet, BoardTheme, CustomColors, CoordinatesDisplay } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { ChessPieceDisplay } from '@/components/chess-piece';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

// --- Helper functions ---
const getJsonSetting = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  const saved = localStorage.getItem(key);
  try {
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setJsonSetting = (key: string, value: any) => {
  if (typeof window === 'undefined') {
    return;
  }
  const stringifiedValue = JSON.stringify(value);
  localStorage.setItem(key, stringifiedValue);
  window.dispatchEvent(new StorageEvent('storage', { key, newValue: stringifiedValue }));
  window.dispatchEvent(new CustomEvent('settingsChanged', { detail: { key, value }}));
};

const defaultCustomColors: CustomColors = {
  boardLight: '#f0d9b5',
  boardDark: '#b58863',
  pieceWhiteFill: '#ffffff',
  pieceWhiteStroke: '#333333',
  pieceBlackFill: '#333333',
  pieceBlackStroke: '#ffffff',
  check1: '#ef7676',
  check2: '#d44949',
  previous1: '#fff078',
  previous2: '#d4c24a',
  selected1: '#91e086',
  selected2: '#75b56b',
};

const boardThemes = [
    { name: 'Classic', value: 'classic', colors: { light: '#f0d9b5', dark: '#b58863' }},
    { name: 'Cyan', value: 'cyan', colors: { light: '#e0f4ff', dark: '#80c8ee' }},
    { name: 'Ocean', value: 'ocean', colors: { light: '#cce7f5', dark: '#7aa1d2' }},
    { name: 'Forest', value: 'forest', colors: { light: '#ebebd0', dark: '#779556' }},
    { name: 'Charcoal', value: 'charcoal', colors: { light: '#9e9e9e', dark: '#616161' }},
    { name: 'Marble', value: 'marble', colors: { light: '#ffffff', dark: '#d1d1d1' }},
    { name: 'Walnut', value: 'walnut', colors: { light: '#f0e6d6', dark: '#8b4513' }},
    { name: 'Custom', value: 'custom' },
] as const;

const pieceSets = ['classic', 'alpha', 'merida', 'neo', 'cburnett', 'fantasy', 'staunty'] as const;


// --- Board & Pieces Settings Component ---
export function BoardPiecesSettings() {
    const { toast } = useToast();
    
    const [settings, setSettings] = useState({
        boardTheme: 'cyan' as BoardTheme,
        pieceSet: 'classic' as PieceSet,
        showCoordinates: 'outside' as CoordinatesDisplay,
        showPossibleMoves: true,
        showLastMoveHighlight: true,
        customColors: defaultCustomColors,
    });
    const [initialState, setInitialState] = useState(settings);

    useEffect(() => {
        const loadedSettings = {
            boardTheme: getJsonSetting<BoardTheme>('chess:boardTheme', 'cyan'),
            pieceSet: getJsonSetting<PieceSet>('chess:pieceSet', 'classic'),
            showCoordinates: getJsonSetting<CoordinatesDisplay>('chess:showCoordinates', 'outside'),
            showPossibleMoves: getJsonSetting<boolean>('chess:showPossibleMoves', true),
            showLastMoveHighlight: getJsonSetting<boolean>('chess:showLastMoveHighlight', true),
            customColors: getJsonSetting<CustomColors>('chess:customColors', defaultCustomColors),
        };
        setSettings(loadedSettings);
        setInitialState(loadedSettings);
    }, []);

    const handleSave = () => {
        Object.entries(settings).forEach(([key, value]) => {
            setJsonSetting(`chess:${key}`, value);
        });
        setInitialState(settings);
        toast({ title: "Settings Saved", description: "Your appearance settings have been updated." });
    };
    
    const handleCancel = () => {
        setSettings(initialState);
    };
    
    const handleColorChange = (key: keyof CustomColors, value: string) => {
        setSettings(s => ({ ...s, customColors: { ...s.customColors, [key]: value } }));
    };

    const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialState);

  return (
    <Card>
        <CardHeader>
            <CardTitle>Board &amp; Pieces</CardTitle>
            <CardDescription>Customize the look and feel of your chessboard and pieces.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="board" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="board">Board</TabsTrigger>
                    <TabsTrigger value="pieces">Pieces</TabsTrigger>
                    <TabsTrigger value="indicators">Indicators</TabsTrigger>
                </TabsList>
                <TabsContent value="board" className="pt-6 space-y-6">
                    <div className="space-y-4">
                        <Label>Board Theme</Label>
                        <RadioGroup 
                            value={settings.boardTheme} 
                            onValueChange={(value) => setSettings(s => ({ ...s, boardTheme: value as BoardTheme }))}
                            className="grid grid-cols-4 sm:grid-cols-6 gap-4"
                        >
                            {boardThemes.map(theme => (
                                <RadioGroupItem key={theme.value} value={theme.value} id={`theme-${theme.value}`} className="sr-only" />
                            ))}
                            {boardThemes.map(theme => (
                                <Label key={theme.value} htmlFor={`theme-${theme.value}`} className="cursor-pointer">
                                    <div className={cn("rounded-md border-2 p-1 aspect-square flex items-center justify-center", settings.boardTheme === theme.value ? 'border-primary' : 'border-transparent')}>
                                        <div className="w-full h-full rounded-sm overflow-hidden grid grid-cols-2 grid-rows-2">
                                            {theme.value !== 'custom' ? (
                                                <>
                                                    <div style={{ backgroundColor: theme.colors.light }}></div>
                                                    <div style={{ backgroundColor: theme.colors.dark }}></div>
                                                    <div style={{ backgroundColor: theme.colors.dark }}></div>
                                                    <div style={{ backgroundColor: theme.colors.light }}></div>
                                                </>
                                            ) : (
                                                <div className="col-span-2 row-span-2 rounded-sm bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-center text-sm mt-1">{theme.name}</p>
                                </Label>
                            ))}
                        </RadioGroup>
                    </div>

                    {settings.boardTheme === 'custom' && (
                        <div className="space-y-4 rounded-md border border-border p-4">
                            <Label className="text-base font-medium">Custom Board Colors</Label>
                             <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-2 max-w-sm">
                                <Label htmlFor="board-light" className="text-xs">Light Squares</Label>
                                <Input id="board-light" type="color" value={settings.customColors.boardLight} onChange={e => handleColorChange('boardLight', e.target.value)} />
                                <Label htmlFor="board-dark" className="text-xs">Dark Squares</Label>
                                <Input id="board-dark" type="color" value={settings.customColors.boardDark} onChange={e => handleColorChange('boardDark', e.target.value)} />
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="pieces" className="pt-6 space-y-6">
                    <div className="space-y-4">
                        <Label>Piece Set</Label>
                        <RadioGroup 
                            value={settings.pieceSet} 
                            onValueChange={(value) => setSettings(s => ({ ...s, pieceSet: value as PieceSet }))}
                            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                        >
                            {pieceSets.map(set => (
                                <RadioGroupItem key={set} value={set} id={`set-${set}`} className="sr-only" />
                            ))}
                            {pieceSets.map(set => (
                                <Label key={set} htmlFor={`set-${set}`} className="cursor-pointer">
                                    <div className={cn("rounded-md border-2 p-2 aspect-square flex items-center justify-center", settings.pieceSet === set ? 'border-primary' : 'border-muted')}>
                                        <div className="w-16 h-16">
                                            <ChessPieceDisplay piece={{ type: 'n', color: 'w' }} pieceSet={set} />
                                        </div>
                                    </div>
                                    <p className="text-center text-sm mt-1 capitalize">{set}</p>
                                </Label>
                            ))}
                        </RadioGroup>
                    </div>
                     <div className="space-y-4 rounded-md border border-border p-4">
                        <Label className="text-base font-medium">Custom Piece Colors</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">White Pieces</Label>
                            <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-2">
                                <Label htmlFor="white-fill" className="text-xs">Fill</Label>
                                <Input id="white-fill" type="color" value={settings.customColors.pieceWhiteFill} onChange={e => handleColorChange('pieceWhiteFill', e.target.value)} />
                                <Label htmlFor="white-stroke" className="text-xs">Stroke</Label>
                                <Input id="white-stroke" type="color" value={settings.customColors.pieceWhiteStroke} onChange={e => handleColorChange('pieceWhiteStroke', e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Black Pieces</Label>
                            <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-2">
                                <Label htmlFor="black-fill" className="text-xs">Fill</Label>
                                <Input id="black-fill" type="color" value={settings.customColors.pieceBlackFill} onChange={e => handleColorChange('pieceBlackFill', e.target.value)} />
                                <Label htmlFor="black-stroke" className="text-xs">Stroke</Label>
                                <Input id="black-stroke" type="color" value={settings.customColors.pieceBlackStroke} onChange={e => handleColorChange('pieceBlackStroke', e.target.value)} />
                            </div>
                        </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="indicators" className="pt-6 space-y-6">
                    <div className="space-y-4 rounded-md border p-4 max-w-sm">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="show-possible-moves" className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Show Possible Moves
                            </Label>
                            <Switch id="show-possible-moves" checked={settings.showPossibleMoves} onCheckedChange={(c) => setSettings(s => ({...s, showPossibleMoves: c}))} />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <Label htmlFor="highlight-last-move" className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Highlight Last Move
                            </Label>
                            <Switch id="highlight-last-move" checked={settings.showLastMoveHighlight} onCheckedChange={(c) => setSettings(s => ({...s, showLastMoveHighlight: c}))} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Coordinates</Label>
                        <RadioGroup 
                            value={settings.showCoordinates} 
                            onValueChange={(value) => setSettings(s => ({ ...s, showCoordinates: value as CoordinatesDisplay }))}
                            className="flex items-center gap-4"
                        >
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="outside" id="coord-outside" />
                                <Label htmlFor="coord-outside">Outside</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="inside" id="coord-inside" />
                                <Label htmlFor="coord-inside">Inside</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="none" id="coord-none" />
                                <Label htmlFor="coord-none">None</Label>
                            </div>
                        </RadioGroup>
                    </div>

                     <div className="space-y-4 rounded-md border border-border p-4">
                        <Label className="text-base font-medium">Custom Highlight Colors</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Selected Square</Label>
                                <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-2">
                                    <Label htmlFor="selected-1" className="text-xs">Light</Label>
                                    <Input id="selected-1" type="color" value={settings.customColors.selected1} onChange={e => handleColorChange('selected1', e.target.value)} />
                                    <Label htmlFor="selected-2" className="text-xs">Dark</Label>
                                    <Input id="selected-2" type="color" value={settings.customColors.selected2} onChange={e => handleColorChange('selected2', e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Previous Move</Label>
                                <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-2">
                                    <Label htmlFor="previous-1" className="text-xs">Light</Label>
                                    <Input id="previous-1" type="color" value={settings.customColors.previous1} onChange={e => handleColorChange('previous1', e.target.value)} />
                                    <Label htmlFor="previous-2" className="text-xs">Dark</Label>
                                    <Input id="previous-2" type="color" value={settings.customColors.previous2} onChange={e => handleColorChange('previous2', e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Check</Label>
                                <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-2">
                                    <Label htmlFor="check-1" className="text-xs">Inner</Label>
                                    <Input id="check-1" type="color" value={settings.customColors.check1} onChange={e => handleColorChange('check1', e.target.value)} />
                                    <Label htmlFor="check-2" className="text-xs">Outer</Label>
                                    <Input id="check-2" type="color" value={settings.customColors.check2} onChange={e => handleColorChange('check2', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </CardContent>
        <CardFooter className="border-t bg-muted/50 px-6 py-3 justify-end gap-2">
            <Button onClick={handleCancel} variant="ghost" disabled={!hasChanges}>Cancel</Button>
            <Button onClick={handleSave} disabled={!hasChanges}>Save</Button>
        </CardFooter>
    </Card>
  );
}
