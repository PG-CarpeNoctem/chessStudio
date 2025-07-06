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
  
  const defaultState = {
    username: 'Player',
    firstName: '',
    lastName: '',
    bio: '',
    avatar: '',
    country: '',
    pronouns: '',
    url: '',
    twitterUrl: '',
    twitchUrl: '',
  };
  
  const [settings, setSettings] = useState(defaultState);
  const [initialState, setInitialState] = useState(defaultState);
  const [userEmail, setUserEmail] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    setUserEmail(localStorage.getItem('email') || 'No email associated');
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
  }, []);

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

  const handleChangePassword = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
        toast({
            variant: 'destructive',
            title: 'Password Change Failed',
            description: 'Please fill in all password fields.',
        });
        return;
    }
    if (newPassword !== confirmPassword) {
        toast({
            variant: 'destructive',
            title: 'Password Change Failed',
            description: 'New passwords do not match.',
        });
        return;
    }

    try {
        const loggedInEmail = localStorage.getItem('email');
        if (!loggedInEmail) {
            toast({
                variant: 'destructive',
                title: 'Authentication Error',
                description: 'Could not find your user details. Please log in again.',
            });
            return;
        }

        const users = JSON.parse(localStorage.getItem('pgchess_users') || '[]');
        const userIndex = users.findIndex((u: any) => u.email === loggedInEmail);

        if (userIndex === -1) {
            toast({
                variant: 'destructive',
                title: 'Password Change Failed',
                description: 'User account not found.',
            });
            return;
        }

        const user = users[userIndex];
        if (user.password !== currentPassword) {
            toast({
                variant: 'destructive',
                title: 'Password Change Failed',
                description: 'Incorrect current password.',
            });
            return;
        }

        users[userIndex].password = newPassword;
        localStorage.setItem('pgchess_users', JSON.stringify(users));

        toast({
            title: 'Password Changed',
            description: 'Your password has been successfully updated.',
        });
        
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    } catch (error) {
        console.error('Password change error:', error);
        toast({
            variant: 'destructive',
            title: 'An error occurred',
            description: 'Could not change your password.',
        });
    }
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
                    <AvatarImage src={settings.avatar || `https://placehold.co/96x96.png`} data-ai-hint="avatar abstract" />
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
                  <Input id="twitterUrl" placeholder="https://twitter.com/username" value={settings.twitterUrl} onChange={e => setSettings(s => ({ ...s, twitterUrl: e.target.value }))} />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="twitchUrl">Twitch URL</Label>
                  <Input id="twitchUrl" placeholder="https://twitch.tv/username" value={settings.twitchUrl} onChange={e => setSettings(s => ({ ...s, twitchUrl: e.target.value }))} />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
              <h3 className="text-lg font-medium">Change Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input id="currentPassword" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                  </div>
                  <div></div> {/* Spacer */}
                  <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </div>
              </div>
              <div className="flex justify-start">
                  <Button type="button" variant="secondary" onClick={handleChangePassword}>
                      Change Password
                  </Button>
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
