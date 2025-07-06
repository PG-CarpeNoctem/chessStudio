'use client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogIn, User } from 'lucide-react';
import { useState } from 'react';
import { Skeleton } from './ui/skeleton';

export function AuthButton() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (isLoggedIn) {
    return (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src="https://placehold.co/40x40.png" alt="@playerone" data-ai-hint="avatar abstract" />
          <AvatarFallback>
            <Skeleton className="h-8 w-8 rounded-full" />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">PlayerOne</span>
          <button
            className="text-xs text-muted-foreground hover:text-primary transition-colors text-left"
            onClick={() => setIsLoggedIn(false)}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <Button onClick={() => setIsLoggedIn(true)} size="sm">
      <LogIn className="mr-2 h-4 w-4" />
      Login to Save Games
    </Button>
  );
}
