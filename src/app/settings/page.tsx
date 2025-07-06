
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
import type { PieceSet, BoardTheme } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


// Helper to safely get item from localStorage
const getLocalStorageItem = (key: string, defaultValue: any) => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  const saved = localStorage.getItem(key);
  try {
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    localStorage.removeItem(key);
    return defaultValue;
  }
};

// Helper to safely set item in localStorage
const setLocalStorageItem = (key: string, value: any) => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(key, JSON.stringify(value));
};

function ProfileSettings() {
  const [username, setUsername] = useState(() => getLocalStorageItem('username', 'Player'));
  const { toast } = useToast();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalStorageItem('username', username);
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

function AppearanceSettings() {
    const [boardTheme, setBoardTheme] = useState<BoardTheme>(() => getLocalStorageItem('chess:boardTheme', 'cyan'));
    const [pieceSet, setPieceSet] = useState<PieceSet>(() => getLocalStorageItem('chess:pieceSet', 'classic'));
    const [customBoardColors, setCustomBoardColors] = useState(() => getLocalStorageItem('chess:customBoardColors', { light: '#ebebd0', dark: '#779556' }));
    const [customPieceColors, setCustomPieceColors] = useState(() => getLocalStorageItem('chess:customPieceColors', { whiteFill: '#FFFFFF', whiteStroke: '#333333', blackFill: '#333333', blackStroke: '#FFFFFF' }));
    
    useEffect(() => { setLocalStorageItem('chess:boardTheme', boardTheme); }, [boardTheme]);
    useEffect(() => { setLocalStorageItem('chess:pieceSet', pieceSet); }, [pieceSet]);
    useEffect(() => { setLocalStorageItem('chess:customBoardColors', customBoardColors); }, [customBoardColors]);
    useEffect(() => { setLocalStorageItem('chess:customPieceColors', customPieceColors); }, [customPieceColors]);

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

            {boardTheme === 'custom' && (
                <div className="space-y-4 rounded-md border border-border p-4">
                    <Label className="text-base font-medium">Custom Colors</Label>
                    <Separator />
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Board Colors</Label>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-w-sm">
                            <Label htmlFor="light-squares" className="text-xs">Light Squares</Label>
                            <Label htmlFor="dark-squares" className="text-xs">Dark Squares</Label>
                            <Input id="light-squares" type="color" value={customBoardColors.light} onChange={e => setCustomBoardColors(c => ({...c, light: e.target.value}))} />
                            <Input id="dark-squares" type="color" value={customBoardColors.dark} onChange={e => setCustomBoardColors(c => ({...c, dark: e.target.value}))} />
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Piece Colors</Label>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-w-sm">
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
