
'use client';

import React, { useState, useRef, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '../ui/skeleton';

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
  // Dispatch a single event for all profile changes.
  window.dispatchEvent(new CustomEvent('profileChanged'));
};

const countries = ["United States", "Canada", "United Kingdom", "Australia", "Germany", "France", "Japan", "Brazil", "India", "Other"]; // Sample list
const pronouns = ["He/Him", "She/Her", "They/Them", "Prefer not to say"];

// --- Profile Settings Component ---
export function ProfileSettings() {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    username: '',
    firstName: '',
    lastName: '',
    bio: '',
    avatar: '',
    country: '',
    pronouns: '',
    url: '',
    twitterUrl: '',
    twitchUrl: '',
  });
  const [initialState, setInitialState] = useState(settings);
  const [userEmail, setUserEmail] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      const loadedState = {
          username: getSetting('username', 'Player'),
          firstName: getSetting('chess:firstName', ''),
          lastName: getSetting('chess:lastName', ''),
          bio: getSetting('chess:bio', ''),
          avatar: getSetting('chess:avatar', ''),
          country: getSetting('chess:country', ''),
          pronouns: getSetting('chess:pronouns', ''),
          url: getSetting('chess:url', ''),
          twitterUrl: getSetting('chess:twitterUrl', ''),
          twitchUrl: getSetting('chess:twitchUrl', ''),
      };
      setSettings(loadedState);
      setInitialState(loadedState);
      setUserEmail(getSetting('email', 'No email associated'));
    }
  }, [isClient]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSetting('username', settings.username);
    setSetting('chess:firstName', settings.firstName);
    setSetting('chess:lastName', settings.lastName);
    setSetting('chess:avatar', settings.avatar);
    setSetting('chess:bio', settings.bio);
    setSetting('chess:country', settings.country);
    setSetting('chess:pronouns', settings.pronouns);
    setSetting('chess:url', settings.url);
    setSetting('chess:twitterUrl', settings.twitterUrl);
    setSetting('chess:twitchUrl', settings.twitchUrl);
    
    setInitialState(settings); // Update the initial state to the new saved state
    
    toast({
      title: 'Profile Saved',
      description: 'Your profile has been updated.',
    });
  };
  
  const handleCancel = () => {
    setSettings(initialState);
  };
  
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setSettings(s => ({ ...s, avatar: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  }

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialState);

  if (!isClient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>This is how others will see you on the site.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card>
      <form onSubmit={handleSave}>
        <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>This is how others will see you on the site.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex items-start gap-6">
            <div className="space-y-2">
                <Label>Profile Picture</Label>
                <Avatar className="h-24 w-24">
                    <AvatarImage src={settings.avatar} alt={settings.username} />
                    <AvatarFallback>{settings.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    Upload
                </Button>
                <Input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/png, image/jpeg, image/webp" />
            </div>
            <div className="space-y-4 flex-1">
                 <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={settings.username}
                      onChange={(e) => setSettings(s => ({ ...s, username: e.target.value }))}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={settings.firstName} onChange={(e) => setSettings(s => ({ ...s, firstName: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={settings.lastName} onChange={(e) => setSettings(s => ({ ...s, lastName: e.target.value }))} />
                  </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={userEmail} readOnly className="cursor-not-allowed bg-muted/50" />
                </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">About Me</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                  id="bio"
                  value={settings.bio}
                  onChange={(e) => setSettings(s => ({ ...s, bio: e.target.value }))}
                  placeholder="Tell us a little about yourself..."
                  rows={4}
                  />
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="pronouns">Pronouns</Label>
                    <Select value={settings.pronouns} onValueChange={(value) => setSettings(s => ({...s, pronouns: value}))}>
                      <SelectTrigger id="pronouns">
                          <SelectValue placeholder="Select your pronouns" />
                      </SelectTrigger>
                      <SelectContent>
                          {pronouns.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select value={settings.country} onValueChange={(value) => setSettings(s => ({...s, country: value}))}>
                      <SelectTrigger id="country">
                          <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent>
                          {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="url">Personal URL</Label>
                  <Input id="url" placeholder="https://example.com" value={settings.url} onChange={(e) => setSettings(s => ({ ...s, url: e.target.value }))} />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Social</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                  <Label htmlFor="twitterUrl">Twitter URL</Label>
                  <Input id="twitterUrl" placeholder="https://twitter.com/username" value={settings.twitterUrl} onChange={(e) => setSettings(s => ({ ...s, twitterUrl: e.target.value }))} />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="twitchUrl">Twitch URL</Label>
                  <Input id="twitchUrl" placeholder="https://twitch.tv/username" value={settings.twitchUrl} onChange={(e) => setSettings(s => ({ ...s, twitchUrl: e.target.value }))} />
              </div>
            </div>
          </div>

        </CardContent>
        <CardFooter className="border-t bg-muted/50 px-6 py-3 justify-end gap-2">
            <Button onClick={handleCancel} variant="ghost" type="button" disabled={!hasChanges}>Cancel</Button>
            <Button type="submit" disabled={!hasChanges}>Save Changes</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
