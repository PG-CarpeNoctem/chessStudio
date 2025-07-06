'use client';

import React, { useState, useEffect } from 'react';
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
import { UserCircle, Palette, Show, Eye } from 'lucide-react';
import { Switch } from '@/components/ui/switch';


// Helper to safely get and parse a JSON item from localStorage
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

// Helper to safely set an item in localStorage, notifying other tabs
const setJsonSetting = (key: string, value: any) => {
  if (typeof window === 'undefined') {
    return;
  }
  const stringifiedValue = JSON.stringify(value);
  localStorage.setItem(key, stringifiedValue);
  window.dispatchEvent(new StorageEvent('storage', { key, newValue: stringifiedValue }));
};


function ProfileSettings() {
  const [username, setUsername] = useState(() => {
    if (typeof window === 'undefined') return 'Player';
    return localStorage.getItem('username') || 'Player';
  });
  const { toast } = useToast();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
        localStorage.setItem('username', username);
        // Dispatch a custom event to notify components in the same tab, like the AuthButton
        window.dispatchEvent(new CustomEvent('usernameChanged'));
    }
    toast({
      title: 'Profile Saved',
      description: 'Your username has been updated.',
    });
  };

  return (
    <Card>
      <form onSubmit={handleSave}>
        <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your public profile information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="max-w-sm"
            />
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

function AppearanceSettings() {
    const [boardTheme, setBoardTheme] = useState<BoardTheme>(() => getJsonSetting('chess:boardTheme', 'cyan'));
    const [pieceSet, setPieceSet] = useState<PieceSet>(() => getJsonSetting('chess:pieceSet', 'classic'));
    const [showCoordinates, setShowCoordinates] = useState<boolean>(() => getJsonSetting('chess:showCoordinates', true));
    const [customColors, setCustomColors] = useState<CustomColors>(() => getJsonSetting('chess:customColors', defaultCustomColors));
    
    useEffect(() => { setJsonSetting('chess:boardTheme', boardTheme); }, [boardTheme]);
    useEffect(() => { setJsonSetting('chess:pieceSet', pieceSet); }, [pieceSet]);
    useEffect(() => { setJsonSetting('chess:customColors', customColors); }, [customColors]);
    useEffect(() => { setJsonSetting('chess:showCoordinates', showCoordinates); }, [showCoordinates]);

    const handleColorChange = (key: keyof CustomColors, value: string) => {
        setCustomColors(c => ({...c, [key]: value}));
    }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize the look and feel of your chessboard and pieces.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="piece-set">Piece Set</Label>
                <Select onValueChange={(value) => setPieceSet(value as PieceSet)} value={pieceSet}>
                    <SelectTrigger id="piece-set" className="max-w-sm">
                        <SelectValue placeholder="Select piece set" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="classic">Classic</SelectItem>
                        <SelectItem value="alpha">Alpha</SelectItem>
                        <SelectItem value="merida">Merida</SelectItem>
                        <SelectItem value="neo">Neo</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="theme">Board Theme</Label>
                <Select onValueChange={(value) => setBoardTheme(value as BoardTheme)} value={boardTheme}>
                    <SelectTrigger id="theme" className="max-w-sm">
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
            
            <div className="flex items-center justify-between max-w-sm">
                <Label htmlFor="show-coordinates" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Show Coordinates
                </Label>
                <Switch id="show-coordinates" checked={showCoordinates} onCheckedChange={setShowCoordinates} />
            </div>

            {boardTheme === 'custom' && (
                <div className="space-y-4 rounded-md border border-border p-4">
                    <Label className="text-base font-medium">Custom Colors</Label>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {/* Board Colors */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Board Colors</Label>
                            <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-2">
                                <Label htmlFor="board-light" className="text-xs">Light</Label>
                                <Input id="board-light" type="color" value={customColors.boardLight} onChange={e => handleColorChange('boardLight', e.target.value)} />
                                <Label htmlFor="board-dark" className="text-xs">Dark</Label>
                                <Input id="board-dark" type="color" value={customColors.boardDark} onChange={e => handleColorChange('boardDark', e.target.value)} />
                            </div>
                        </div>

                        {/* Piece Colors */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Piece Colors</Label>
                            <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-2">
                                <Label htmlFor="white-fill" className="text-xs">White Fill</Label>
                                <Input id="white-fill" type="color" value={customColors.pieceWhiteFill} onChange={e => handleColorChange('pieceWhiteFill', e.target.value)} />
                                
                                <Label htmlFor="white-stroke" className="text-xs">White Stroke</Label>
                                <Input id="white-stroke" type="color" value={customColors.pieceWhiteStroke} onChange={e => handleColorChange('pieceWhiteStroke', e.target.value)} />

                                <Label htmlFor="black-fill" className="text-xs">Black Fill</Label>
                                <Input id="black-fill" type="color" value={customColors.pieceBlackFill} onChange={e => handleColorChange('pieceBlackFill', e.target.value)} />

                                <Label htmlFor="black-stroke" className="text-xs">Black Stroke</Label>
                                <Input id="black-stroke" type="color" value={customColors.pieceBlackStroke} onChange={e => handleColorChange('pieceBlackStroke', e.target.value)} />
                            </div>
                        </div>

                        {/* Highlight Colors */}
                         <div className="space-y-3">
                            <Label className="text-sm font-medium">Highlight Colors</Label>
                            <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-2">
                                <Label htmlFor="selected-1" className="text-xs">Selected Light</Label>
                                <Input id="selected-1" type="color" value={customColors.selected1} onChange={e => handleColorChange('selected1', e.target.value)} />
                                
                                <Label htmlFor="selected-2" className="text-xs">Selected Dark</Label>
                                <Input id="selected-2" type="color" value={customColors.selected2} onChange={e => handleColorChange('selected2', e.target.value)} />

                                <Label htmlFor="previous-1" className="text-xs">Previous Light</Label>
                                <Input id="previous-1" type="color" value={customColors.previous1} onChange={e => handleColorChange('previous1', e.target.value)} />

                                <Label htmlFor="previous-2" className="text-xs">Previous Dark</Label>
                                <Input id="previous-2" type="color" value={customColors.previous2} onChange={e => handleColorChange('previous2', e.target.value)} />
                            </div>
                        </div>

                        {/* Check Colors */}
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Check Colors</Label>
                            <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-2">
                                <Label htmlFor="check-1" className="text-xs">Check Inner</Label>
                                <Input id="check-1" type="color" value={customColors.check1} onChange={e => handleColorChange('check1', e.target.value)} />
                                <Label htmlFor="check-2" className="text-xs">Check Outer</Label>
                                <Input id="check-2" type="color" value={customColors.check2} onChange={e => handleColorChange('check2', e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="profile">
                <UserCircle className="h-5 w-5 mr-2" />
                Profile
            </TabsTrigger>
            <TabsTrigger value="appearance">
                <Palette className="h-5 w-5 mr-2" />
                Appearance
            </TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6">
            <ProfileSettings />
        </TabsContent>
        <TabsContent value="appearance" className="mt-6">
            <AppearanceSettings />
        </TabsContent>
    </Tabs>
  );
}
