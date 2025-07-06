
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { PieceSet, BoardTheme, CustomColors } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserCircle, Palette, Eye, Gamepad2, ChevronsRight, LayoutGrid, Square, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChessPieceDisplay } from '@/components/chess-piece';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
};

// Helper for plain string settings
const getSetting = (key: string, defaultValue: string): string => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  return localStorage.getItem(key) || defaultValue;
};

const setSetting = (key: string, value: string) => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(key, value);
  window.dispatchEvent(new StorageEvent('storage', { key, newValue: value }));
};


function ProfileSettings() {
  const { toast } = useToast();
  const [username, setUsername] = useState(() => getSetting('username', 'Player'));
  const [avatar, setAvatar] = useState(() => getSetting('chess:avatar', ''));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSetting('username', username);
    setSetting('chess:avatar', avatar);
    // Dispatch a custom event to notify components in the same tab
    window.dispatchEvent(new CustomEvent('profileChanged'));
    toast({
      title: 'Profile Saved',
      description: 'Your profile has been updated.',
    });
  };
  
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatar(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSave}>
        <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your public profile information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>Profile Picture</Label>
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={avatar || `https://placehold.co/80x80.png`} data-ai-hint="avatar abstract" />
                    <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    Upload Image
                </Button>
                <Input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/png, image/jpeg, image/webp" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/50 px-6 py-3">
            <Button type="submit">Save Changes</Button>
        </CardFooter>
      </form>
    </Card>
  );
}

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
    { name: 'Custom', value: 'custom' },
] as const;

const pieceSets = ['classic', 'alpha', 'merida', 'neo'] as const;

function BoardAndPiecesSettings() {
    const { toast } = useToast();
    const getInitialState = () => ({
        boardTheme: getJsonSetting<BoardTheme>('chess:boardTheme', 'cyan'),
        pieceSet: getJsonSetting<PieceSet>('chess:pieceSet', 'classic'),
        showCoordinates: getJsonSetting<boolean>('chess:showCoordinates', true),
        showPossibleMoves: getJsonSetting<boolean>('chess:showPossibleMoves', true),
        showLastMoveHighlight: getJsonSetting<boolean>('chess:showLastMoveHighlight', true),
        customColors: getJsonSetting<CustomColors>('chess:customColors', defaultCustomColors),
    });

    const [settings, setSettings] = useState(getInitialState);
    const [initialState, setInitialState] = useState(getInitialState);

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
            <CardTitle>Board & Pieces</CardTitle>
            <CardDescription>Customize the look and feel of your chessboard and pieces.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="boards" className="w-full">
                <TabsList>
                    <TabsTrigger value="boards">Boards</TabsTrigger>
                    <TabsTrigger value="pieces">Pieces</TabsTrigger>
                </TabsList>
                <TabsContent value="boards" className="pt-4">
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
                                    <div className={cn("rounded-md border-2 aspect-square flex items-center justify-center", settings.boardTheme === theme.value ? 'border-primary' : 'border-transparent')}>
                                    {theme.value !== 'custom' ? (
                                        <div className="w-12 h-12 rounded-sm overflow-hidden grid grid-cols-2 grid-rows-2">
                                            <div style={{ backgroundColor: theme.colors.light }}></div>
                                            <div style={{ backgroundColor: theme.colors.dark }}></div>
                                            <div style={{ backgroundColor: theme.colors.dark }}></div>
                                            <div style={{ backgroundColor: theme.colors.light }}></div>
                                        </div>
                                    ) : (
                                         <div className="w-12 h-12 rounded-sm bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                                            <Palette className="w-6 h-6 text-white"/>
                                         </div>
                                    )}
                                    </div>
                                    <p className="text-center text-sm mt-1">{theme.name}</p>
                                </Label>
                            ))}
                        </RadioGroup>
                    </div>

                    {settings.boardTheme === 'custom' && (
                        <div className="mt-6 space-y-4 rounded-md border border-border p-4">
                            <Label className="text-base font-medium">Custom Colors</Label>
                            <Separator />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                <div className="space-y-3">
                                    <Label className="text-sm font-medium">Board</Label>
                                    <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-2">
                                        <Label htmlFor="board-light" className="text-xs">Light</Label>
                                        <Input id="board-light" type="color" value={settings.customColors.boardLight} onChange={e => handleColorChange('boardLight', e.target.value)} />
                                        <Label htmlFor="board-dark" className="text-xs">Dark</Label>
                                        <Input id="board-dark" type="color" value={settings.customColors.boardDark} onChange={e => handleColorChange('boardDark', e.target.value)} />
                                    </div>
                                </div>
                                 <div className="space-y-3">
                                    <Label className="text-sm font-medium">Highlights</Label>
                                    <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-2">
                                        <Label htmlFor="selected-1" className="text-xs">Selected (L)</Label>
                                        <Input id="selected-1" type="color" value={settings.customColors.selected1} onChange={e => handleColorChange('selected1', e.target.value)} />
                                        <Label htmlFor="selected-2" className="text-xs">Selected (D)</Label>
                                        <Input id="selected-2" type="color" value={settings.customColors.selected2} onChange={e => handleColorChange('selected2', e.target.value)} />
                                        <Label htmlFor="previous-1" className="text-xs">Previous (L)</Label>
                                        <Input id="previous-1" type="color" value={settings.customColors.previous1} onChange={e => handleColorChange('previous1', e.target.value)} />
                                        <Label htmlFor="previous-2" className="text-xs">Previous (D)</Label>
                                        <Input id="previous-2" type="color" value={settings.customColors.previous2} onChange={e => handleColorChange('previous2', e.target.value)} />
                                        <Label htmlFor="check-1" className="text-xs">Check (Inner)</Label>
                                        <Input id="check-1" type="color" value={settings.customColors.check1} onChange={e => handleColorChange('check1', e.target.value)} />
                                        <Label htmlFor="check-2" className="text-xs">Check (Outer)</Label>
                                        <Input id="check-2" type="color" value={settings.customColors.check2} onChange={e => handleColorChange('check2', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="pieces" className="pt-4">
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
                                            <ChessPieceDisplay piece={{ type: 'n', color: 'w' }} pieceSet={set} boardTheme='classic' customColors={defaultCustomColors} />
                                        </div>
                                    </div>
                                    <p className="text-center text-sm mt-1 capitalize">{set}</p>
                                </Label>
                            ))}
                        </RadioGroup>
                    </div>

                     {settings.boardTheme === 'custom' && (
                        <div className="mt-6 space-y-4 rounded-md border border-border p-4">
                            <Label className="text-base font-medium">Custom Piece Colors</Label>
                            <Separator />
                            <div className="space-y-3">
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
                        </div>
                    )}
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

function GameplaySettings() {
  const { toast } = useToast();
  
  const getInitialState = () => ({
    autoPromoteTo: getJsonSetting<'q' | 'r' | 'b' | 'n'>('chess:autoPromoteTo', 'q'),
    enablePremove: getJsonSetting<boolean>('chess:enablePremove', true),
    showPossibleMoves: getJsonSetting<boolean>('chess:showPossibleMoves', true),
    showLastMoveHighlight: getJsonSetting<boolean>('chess:showLastMoveHighlight', true),
  });

  const [settings, setSettings] = useState(getInitialState);
  const [initialState, setInitialState] = useState(getInitialState);

  const handleSave = () => {
    Object.entries(settings).forEach(([key, value]) => {
      setJsonSetting(`chess:${key}`, value);
    });
    setInitialState(settings);
    toast({
      title: 'Gameplay Settings Saved',
      description: 'Your preferences have been updated.',
    });
  };

  const handleCancel = () => {
    setSettings(initialState);
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialState);

  return (
    <Card>
        <CardHeader>
            <CardTitle>Gameplay</CardTitle>
            <CardDescription>Customize your game playing experience and move indicators.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-4 rounded-md border p-4 max-w-sm">
                 <div className="flex items-center justify-between">
                    <Label htmlFor="enable-premove" className="flex items-center gap-2">
                        <ChevronsRight className="h-4 w-4" />
                        Enable Premoves
                    </Label>
                    <Switch id="enable-premove" checked={settings.enablePremove} onCheckedChange={(c) => setSettings(s => ({...s, enablePremove: c}))} />
                </div>
                <Separator />
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

            <div className="space-y-2 max-w-sm">
                <Label htmlFor="auto-promote-to">Automatic Pawn Promotion</Label>
                <Select onValueChange={(value) => setSettings(s => ({...s, autoPromoteTo: value as 'q'}))} value={settings.autoPromoteTo}>
                    <SelectTrigger id="auto-promote-to">
                        <SelectValue placeholder="Select piece to promote to" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="q">Queen</SelectItem>
                        <SelectItem value="r">Rook</SelectItem>
                        <SelectItem value="b">Bishop</SelectItem>
                        <SelectItem value="n">Knight</SelectItem>
                    </SelectContent>
                </Select>
                 <p className="text-xs text-muted-foreground">
                    Pawns will automatically be promoted to this piece.
                </p>
            </div>
        </CardContent>
        <CardFooter className="border-t bg-muted/50 px-6 py-3 justify-end gap-2">
            <Button onClick={handleCancel} variant="ghost" disabled={!hasChanges}>Cancel</Button>
            <Button onClick={handleSave} disabled={!hasChanges}>Save</Button>
        </CardFooter>
    </Card>
  );
}


export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  const navItems = [
    { id: 'profile', label: 'Profile', icon: UserCircle },
    { id: 'board', label: 'Board & Pieces', icon: LayoutGrid },
    { id: 'gameplay', label: 'Gameplay', icon: Gamepad2 },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <aside className="w-full md:w-1/4 lg:w-1/5">
        <h2 className="text-2xl font-bold tracking-tight mb-4">Settings</h2>
        <nav className="flex flex-row md:flex-col gap-1">
          {navItems.map(item => (
            <Button 
                key={item.id}
                variant={activeTab === item.id ? 'secondary' : 'ghost'}
                className="justify-start"
                onClick={() => setActiveTab(item.id)}
            >
                <item.icon className="mr-2 h-5 w-5" />
                {item.label}
            </Button>
          ))}
        </nav>
      </aside>
      <main className="flex-1">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'board' && <BoardAndPiecesSettings />}
          {activeTab === 'gameplay' && <GameplaySettings />}
      </main>
    </div>
  );
}

    