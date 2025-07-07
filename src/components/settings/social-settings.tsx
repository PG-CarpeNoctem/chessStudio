
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import type { DirectMessagePrivacy, GameChatPrivacy } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

// Helper function
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

type ChallengePrivacy = 'everyone' | 'friends' | 'nobody';

export function SocialSettings() {
    const { toast } = useToast();
    
    const [settings, setSettings] = useState({
        directMessages: true,
        directMessagesPrivacy: 'everyone' as DirectMessagePrivacy,
        gameChat: true,
        gameChatPrivacy: 'everyone' as GameChatPrivacy,
        blogUrl: '',
        blogTitle: '',
        showOnlineStatus: true,
        allowChallenges: 'everyone' as ChallengePrivacy,
    });
    const [initialState, setInitialState] = useState(settings);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient) {
            const loadedSettings = {
                directMessages: getJsonSetting<boolean>('chess:social:directMessages', true),
                directMessagesPrivacy: getJsonSetting<DirectMessagePrivacy>('chess:social:directMessagesPrivacy', 'everyone'),
                gameChat: getJsonSetting<boolean>('chess:social:gameChat', true),
                gameChatPrivacy: getJsonSetting<GameChatPrivacy>('chess:social:gameChatPrivacy', 'everyone'),
                blogUrl: getJsonSetting<string>('chess:social:blogUrl', ''),
                blogTitle: getJsonSetting<string>('chess:social:blogTitle', ''),
                showOnlineStatus: getJsonSetting<boolean>('chess:social:showOnlineStatus', true),
                allowChallenges: getJsonSetting<ChallengePrivacy>('chess:social:allowChallenges', 'everyone'),
            };
            setSettings(loadedSettings);
            setInitialState(loadedSettings);
        }
    }, [isClient]);

    const handleSave = () => {
        Object.entries(settings).forEach(([key, value]) => {
            setJsonSetting(`chess:social:${key}`, value);
        });
        setInitialState(settings);
        toast({ title: "Social Settings Saved", description: "Your social preferences have been updated." });
    };
    
    const handleCancel = () => {
        setSettings(initialState);
    };

    const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialState);
    
    if (!isClient) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Social</CardTitle>
                    <CardDescription>Manage your social, privacy, chat, and blog settings.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        );
    }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Social</CardTitle>
            <CardDescription>Manage your social, privacy, chat, and blog settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <div className="space-y-6">
                 <h3 className="text-lg font-medium">Privacy</h3>
                 <div className="space-y-4 rounded-md border p-4">
                     <div className="flex items-start justify-between">
                        <Label htmlFor="online-status" className="font-semibold">
                           Let others see your online status
                        </Label>
                        <Switch id="online-status" checked={settings.showOnlineStatus} onCheckedChange={(c) => setSettings(s => ({...s, showOnlineStatus: c}))} />
                    </div>
                    <Separator />
                    <div>
                        <Label className="font-semibold">Allow challenges from</Label>
                        <p className="text-sm text-muted-foreground pb-2">Friends and challenges are coming soon!</p>
                        <RadioGroup 
                            value={settings.allowChallenges} 
                            onValueChange={(value) => setSettings(s => ({ ...s, allowChallenges: value as ChallengePrivacy }))}
                            className="pl-2 space-y-2"
                            disabled // Disabled until feature is implemented
                        >
                             <div className="flex items-center space-x-2">
                                <RadioGroupItem value="everyone" id="chal-everyone" />
                                <Label htmlFor="chal-everyone">Everyone</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="friends" id="chal-friends" />
                                <Label htmlFor="chal-friends">Only friends</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="nobody" id="chal-nobody" />
                                <Label htmlFor="chal-nobody">Nobody</Label>
                            </div>
                        </RadioGroup>
                    </div>
                 </div>
            </div>

            <Separator />
            
            {/* Chat & Messaging */}
            <div className="space-y-6">
                <h3 className="text-lg font-medium">Chat & Messaging</h3>
                <div className="space-y-4 rounded-md border p-4">
                    <div className="flex items-start justify-between">
                        <Label htmlFor="direct-messages" className="font-semibold">
                            Send and receive direct messages
                        </Label>
                        <Switch id="direct-messages" checked={settings.directMessages} onCheckedChange={(c) => setSettings(s => ({...s, directMessages: c}))} />
                    </div>
                    <RadioGroup 
                        value={settings.directMessagesPrivacy} 
                        onValueChange={(value) => setSettings(s => ({ ...s, directMessagesPrivacy: value as DirectMessagePrivacy }))}
                        className="pl-2 space-y-2"
                        disabled={!settings.directMessages}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="everyone" id="dm-everyone" />
                            <Label htmlFor="dm-everyone">Everyone</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="friends" id="dm-friends" />
                            <Label htmlFor="dm-friends">Only friends</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="nobody" id="dm-nobody" />
                            <Label htmlFor="dm-nobody">Nobody</Label>
                        </div>
                    </RadioGroup>
                </div>

                <div className="space-y-4 rounded-md border p-4">
                    <div className="flex items-start justify-between">
                        <Label htmlFor="game-chat" className="font-semibold">
                           Game Chat
                        </Label>
                        <Switch id="game-chat" checked={settings.gameChat} onCheckedChange={(c) => setSettings(s => ({...s, gameChat: c}))} />
                    </div>
                    <RadioGroup 
                        value={settings.gameChatPrivacy} 
                        onValueChange={(value) => setSettings(s => ({ ...s, gameChatPrivacy: value as GameChatPrivacy }))}
                        className="pl-2 space-y-2"
                        disabled={!settings.gameChat}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="everyone" id="gc-everyone" />
                            <Label htmlFor="gc-everyone">Everyone</Label>
                        </div>
                         <div className="flex items-center space-x-2">
                            <RadioGroupItem value="request" id="gc-request" />
                            <Label htmlFor="gc-request">Request Only</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="friends" id="gc-friends" />
                            <Label htmlFor="gc-friends">Friends Only</Label>
                        </div>
                    </RadioGroup>
                </div>
            </div>

            <Separator />

            {/* Blog */}
            <div className="space-y-6">
                <h3 className="text-lg font-medium">Blog</h3>
                <div className="space-y-2">
                    <Label htmlFor="blog-url">Blog URL</Label>
                    <div className="flex items-center">
                        <span className="text-sm text-muted-foreground bg-muted border border-r-0 border-input rounded-l-md px-3 py-2 h-10 flex items-center">
                           pgchess.com/blog/
                        </span>
                        <Input
                            id="blog-url"
                            className="rounded-l-none"
                            value={settings.blogUrl}
                            onChange={(e) => setSettings(s => ({...s, blogUrl: e.target.value}))}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">The URL of your PGChess blog.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="blog-title">Blog Title</Label>
                    <Input 
                        id="blog-title"
                        value={settings.blogTitle}
                        onChange={(e) => setSettings(s => ({...s, blogTitle: e.target.value}))}
                    />
                </div>
            </div>
            
        </CardContent>
        <CardFooter className="border-t bg-muted/50 px-6 py-3 justify-end gap-2">
            <Button onClick={handleCancel} variant="ghost" disabled={!hasChanges}>Cancel</Button>
            <Button onClick={handleSave} disabled={!hasChanges}>Save Changes</Button>
        </CardFooter>
    </Card>
  );
}
