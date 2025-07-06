'use client';

import React, { useState, useRef } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// --- Helper Functions ---
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
  window.dispatchEvent(new CustomEvent('profileChanged'));
};


// --- Profile Settings Component ---
export function ProfileSettings() {
  const { toast } = useToast();
  const [username, setUsername] = useState(() => getSetting('username', 'Player'));
  const [bio, setBio] = useState(() => getSetting('chess:bio', ''));
  const [avatar, setAvatar] = useState(() => getSetting('chess:avatar', ''));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSetting('username', username);
    setSetting('chess:avatar', avatar);
    setSetting('chess:bio', bio);
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
          <div className="flex items-center gap-6">
            <div className="space-y-2">
                <Label>Profile Picture</Label>
                <Avatar className="h-24 w-24">
                    <AvatarImage src={avatar || `https://placehold.co/96x96.png`} data-ai-hint="avatar abstract" />
                    <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    Upload Image
                </Button>
                <Input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/png, image/jpeg, image/webp" />
            </div>
            <div className="space-y-4 flex-1">
                 <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us a little about yourself..."
                    rows={3}
                    />
                </div>
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
