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
import { ChevronsRight, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// --- Helper Functions ---
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

// --- Gameplay Settings Component ---
export function GameplaySettings() {
  const { toast } = useToast();
  
  const defaultState = {
    autoPromoteTo: 'q' as 'q' | 'r' | 'b' | 'n',
    enablePremove: true,
    confirmMove: false,
  };

  const [settings, setSettings] = useState(defaultState);
  const [initialState, setInitialState] = useState(defaultState);

  useEffect(() => {
      const loadedSettings = {
        autoPromoteTo: getJsonSetting<'q' | 'r' | 'b' | 'n'>('chess:autoPromoteTo', 'q'),
        enablePremove: getJsonSetting<boolean>('chess:enablePremove', true),
        confirmMove: getJsonSetting<boolean>('chess:confirmMove', false),
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
