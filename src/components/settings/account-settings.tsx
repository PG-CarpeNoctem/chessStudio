'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const getSetting = (key: string, defaultValue: string): string => {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  return localStorage.getItem(key) || defaultValue;
};

const getStoredUsers = () => {
  try {
    const storedUsers = localStorage.getItem('pgchess_users');
    if (!storedUsers) return [];
    const parsedUsers = JSON.parse(storedUsers);
    return Array.isArray(parsedUsers) ? parsedUsers : [];
  } catch (e) {
    console.error('Failed to parse users from localStorage', e);
    return [];
  }
};

export function AccountSettings() {
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setUserEmail(getSetting('email', ''));
    setIsClient(true);
  }, []);

  const handleChangePassword = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
        toast({ variant: 'destructive', title: 'Password Change Failed', description: 'Please fill in all password fields.' });
        return;
    }
    if (newPassword !== confirmPassword) {
        toast({ variant: 'destructive', title: 'Password Change Failed', description: 'New passwords do not match.' });
        return;
    }

    try {
        const loggedInEmail = localStorage.getItem('email');
        if (!loggedInEmail) {
            toast({ variant: 'destructive', title: 'Authentication Error', description: 'Could not find your user details. Please log in again.' });
            return;
        }
        
        const users = getStoredUsers();
        const userIndex = users.findIndex((u: any) => u.email === loggedInEmail);

        if (userIndex === -1) {
            toast({ variant: 'destructive', title: 'Password Change Failed', description: 'User account not found.' });
            return;
        }

        const user = users[userIndex];
        if (user.password !== currentPassword) {
            toast({ variant: 'destructive', title: 'Password Change Failed', description: 'Incorrect current password.' });
            return;
        }

        users[userIndex].password = newPassword;
        localStorage.setItem('pgchess_users', JSON.stringify(users));

        toast({ title: 'Password Changed', description: 'Your password has been successfully updated.' });
        
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    } catch (error) {
        console.error('Password change error:', error);
        toast({ variant: 'destructive', title: 'An error occurred', description: 'Could not change your password.' });
    }
  };

  const handleCloseAccount = () => {
    // This would typically involve a server-side call.
    // For now, we'll just log out and clear data.
    localStorage.clear();
    toast({ title: "Account Closed", description: "Your account and all associated data have been removed."});
    // Redirect to login page after a short delay
    setTimeout(() => window.location.href = '/login', 1500);
  }

  if (!isClient) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>Manage your account settings, password, and connected services.</CardDescription>
            </CardHeader>
            <CardContent><Skeleton className="h-48 w-full" /></CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Manage your account settings, password, and connected services.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Email</h3>
            <div className="flex items-center justify-between rounded-md border p-4">
                <p className="text-sm text-muted-foreground">{userEmail}</p>
                <Button variant="secondary" onClick={() => toast({ title: "Feature coming soon!"})}>Change Email</Button>
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
                <div></div>
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
                    Save Password
                </Button>
            </div>
        </div>
        
        <Separator />

        <div className="space-y-4">
             <h3 className="text-lg font-medium">Connected Accounts</h3>
             <Card>
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <span>Google</span>
                        <Button variant="outline" onClick={() => toast({ title: "Feature coming soon!"})}>Connect</Button>
                    </div>
                     <Separator />
                     <div className="flex items-center justify-between">
                        <span>Apple</span>
                        <Button variant="outline" onClick={() => toast({ title: "Feature coming soon!"})}>Connect</Button>
                    </div>
                </CardContent>
             </Card>
        </div>

        <Separator />
        
         <div className="space-y-4">
            <h3 className="text-lg font-medium text-destructive">Close Account</h3>
            <div className="flex items-start justify-between rounded-md border border-destructive/50 p-4">
                <div className="space-y-1">
                    <p className="font-semibold">Permanently close your account.</p>
                    <p className="text-sm text-muted-foreground">This action cannot be undone. All your data will be erased.</p>
                </div>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">Close Account</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleCloseAccount}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>

      </CardContent>
    </Card>
  );
}
