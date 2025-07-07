
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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ChevronsRight, Check, Volume2, Eye, Trophy } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { AutoPromote } from '@/lib/types';

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

export function GameplaySettings() {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    autoPromoteTo: 'q' as AutoPromote,
    enablePremove: true,
    confirmMove: false,
    enableSounds: true,
    showCapturedPieces: true,
    showEstimatedElo: true,
  });
  const [initialState, setInitialState] = useState(settings);

  useEffect(() => {
      const loadedSettings = {
        autoPromoteTo: getJsonSetting<AutoPromote>('chess:autoPromoteTo', 'q'),
        enablePremove: getJsonSetting<boolean>('chess:enablePremove', true),
        confirmMove: getJsonSetting<boolean>('chess:confirmMove', false),
        enableSounds: getJsonSetting<boolean>('chess:enableSounds', true),
        showCapturedPieces: getJsonSetting<boolean>('chess:showCapturedPieces', true),
        showEstimatedElo: getJsonSetting<boolean>('chess:showEstimatedElo', true),
      };
      setSettings(loadedSettings);
      setInitialState(loadedSettings);
  }, []);

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
            <CardDescription>Customize your game playing experience and move behaviors.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-4 rounded-md border p-4 max-w-sm">
                 <div className="flex items-center justify-between">
                    <Label htmlFor="enable-premove" className="flex flex-col items-start gap-1">
                        <span className="flex items-center gap-2"><ChevronsRight className="h-4 w-4" /> Enable Premoves</span>
                        <span className="text-xs text-muted-foreground font-normal">Make a move during your opponent's turn.</span>
                    </Label>
                    <Switch id="enable-premove" checked={settings.enablePremove} onCheckedChange={(c) => setSettings(s => ({...s, enablePremove: c}))} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                    <Label htmlFor="confirm-move" className="flex flex-col items-start gap-1">
                        <span className="flex items-center gap-2"><Check className="h-4 w-4" /> Confirm each move</span>
                         <span className="text-xs text-muted-foreground font-normal">Show a confirmation dialog for every move.</span>
                    </Label>
                    <Switch id="confirm-move" checked={settings.confirmMove} onCheckedChange={(c) => setSettings(s => ({...s, confirmMove: c}))} />
                </div>
                 <Separator />
                <div className="flex items-center justify-between">
                    <Label htmlFor="enable-sounds" className="flex flex-col items-start gap-1">
                        <span className="flex items-center gap-2"><Volume2 className="h-4 w-4" /> Play sound for moves</span>
                    </Label>
                    <Switch id="enable-sounds" checked={settings.enableSounds} onCheckedChange={(c) => setSettings(s => ({...s, enableSounds: c}))} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                    <Label htmlFor="show-captured-pieces" className="flex flex-col items-start gap-1">
                        <span className="flex items-center gap-2"><Eye className="h-4 w-4" /> Show Captured Pieces</span>
                    </Label>
                    <Switch id="show-captured-pieces" checked={settings.showCapturedPieces} onCheckedChange={(c) => setSettings(s => ({...s, showCapturedPieces: c}))} />
                </div>
            </div>

            <div className="space-y-2 max-w-sm">
                <Label>Automatic Pawn Promotion</Label>
                <RadioGroup 
                    value={settings.autoPromoteTo} 
                    onValueChange={(value) => setSettings(s => ({ ...s, autoPromoteTo: value as AutoPromote }))}
                    className="flex flex-col gap-2"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="q" id="promo-q" />
                        <Label htmlFor="promo-q">Queen</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="r" id="promo-r" />
                        <Label htmlFor="promo-r">Rook</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="b" id="promo-b" />
                        <Label htmlFor="promo-b">Bishop</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="n" id="promo-n" />
                        <Label htmlFor="promo-n">Knight</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ask" id="promo-ask" />
                        <Label htmlFor="promo-ask">Always Ask</Label>
                    </div>
                </RadioGroup>
                 <p className="text-xs text-muted-foreground pt-2">
                    Pawns will automatically be promoted to this piece.
                </p>
            </div>
            
            <Separator />

             <div className="space-y-4 rounded-md border p-4 max-w-sm">
                 <h3 className="text-lg font-medium">Analysis</h3>
                 <div className="flex items-center justify-between">
                    <Label htmlFor="show-estimated-elo" className="flex flex-col items-start gap-1">
                        <span className="flex items-center gap-2"><Trophy className="h-4 w-4" /> Show Estimated ELO</span>
                        <span className="text-xs text-muted-foreground font-normal">Display estimated ELO in Game Report.</span>
                    </Label>
                    <Switch id="show-estimated-elo" checked={settings.showEstimatedElo} onCheckedChange={(c) => setSettings(s => ({...s, showEstimatedElo: c}))} />
                </div>
            </div>


        </CardContent>
        <CardFooter className="border-t bg-muted/50 px-6 py-3 justify-end gap-2">
            <Button onClick={handleCancel} variant="ghost" disabled={!hasChanges}>Cancel</Button>
            <Button onClick={handleSave} disabled={!hasChanges}>Save</Button>
        </CardFooter>
    </Card>
  );
}
